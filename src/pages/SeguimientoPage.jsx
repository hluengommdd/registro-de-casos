import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getCase, updateCase, createFollowup } from '../api/db'
import { emitDataUpdated } from '../utils/refreshBus'
import { useSeguimientos } from '../hooks/useSeguimientos'
import SeguimientoForm from '../components/SeguimientoForm'
import { FileText, Download } from 'lucide-react'
import SeguimientoItem from '../components/SeguimientoItem'
import ProcesoVisualizer from '../components/ProcesoVisualizer'
import InvolucradosList from '../components/InvolucradosList'
import { formatDate } from '../utils/formatDate'
import { useToast } from '../hooks/useToast'

export default function SeguimientoPage({
  casoId: casoIdProp,
  readOnly = false,
  showExport = false,
  onCaseClosed,
  onDataChange,
  // allow parent to hide the historial section when rendering layout blocks
  showHistorial = true,
  // when rendered inside the main grid, avoid `.container`
  embedded = false,
  // external control for the "nueva acción" modal
  externalMostrarForm, // boolean | undefined
  setExternalMostrarForm, // function | undefined
  // hide the in-component new-action button (we'll render it elsewhere)
  hideNewAction = false,
}) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // PRIORIDAD: URL ?caso= → luego prop
  const casoId = searchParams.get('caso') || casoIdProp

  const [caso, setCaso] = useState(null)
  const [loadingCaso, setLoadingCaso] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [mostrarForm, setMostrarForm] = useState(false)
  const { push } = useToast()

  const { data: seguimientos, loading: loadingSeg } = useSeguimientos(
    casoId,
    refreshKey
  )

  useEffect(() => {
    if (!casoId) return

    async function cargarCaso() {
      try {
        setLoadingCaso(true)
        const record = await getCase(casoId)
        setCaso(record)
      } catch (e) {
        console.error(e)
        push({ type: 'error', title: 'Error cargando caso', message: e?.message || 'Fallo de red' })
      } finally {
        setLoadingCaso(false)
      }
    }

    cargarCaso()
  }, [casoId, push])

  async function cerrarCaso() {
    if (!confirm('¿Confirmar cierre del caso?')) return

    try {
      await updateCase(casoId, {
        Estado: 'Cerrado',
      })

      await createFollowup({
        Caso_ID: casoId,
        Fecha_Seguimiento: new Date().toISOString().slice(0, 10),
        Descripcion: 'Cierre formal del caso',
        Acciones: 'Caso cerrado',
      })

      push({ type: 'success', title: 'Caso cerrado', message: 'El caso se marcó como cerrado' })
      alert('Caso cerrado correctamente')
      emitDataUpdated()
      onDataChange?.()
      onCaseClosed?.(casoId)
      navigate(`/casos-cerrados?caso=${casoId}`)
      setRefreshKey(k => k + 1)
      setMostrarForm(false)
    } catch (e) {
      console.error(e)
      push({ type: 'error', title: 'No se pudo cerrar', message: e?.message || 'Intenta de nuevo' })
      alert('Error al cerrar el caso')
    }
  }

  if (!casoId) {
    return (
      <div className="p-4 sm:p-6 text-gray-500">
        No se ha seleccionado un caso.
      </div>
    )
  }

  if (loadingCaso) {
    return (
      <div className="p-4 sm:p-6 text-gray-500">
        Cargando caso…
      </div>
    )
  }

  if (!caso) {
    return (
      <div className="p-4 sm:p-6 text-red-600">
        No se pudo cargar el caso.
      </div>
    )
  }

  if (!caso.fields) {
    return (
      <div className="p-4 sm:p-6 text-red-600">
        Error: El caso no tiene campos definidos.
      </div>
    )
  }

  const esCerrado = caso.fields.Estado === 'Cerrado'
  const soloLectura = readOnly || esCerrado

  return (
    <div className={`${embedded ? 'w-full' : 'max-w-5xl mx-auto'} p-4 sm:p-6 space-y-6`}>

      {/* HEADER */}
      <div className="flex justify-between items-center rounded-2xl glass-panel p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        <div className="relative z-10 flex-1 min-w-0 flex items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 sm:p-2.5 bg-gradient-to-br from-brand-500 to-violet-600 rounded-xl text-white shadow-lg shadow-brand-500/30 flex-shrink-0">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight truncate">
                Seguimiento del Caso
              </h1>
              <p className="text-sm font-medium text-slate-500 mt-1 hidden sm:flex items-center gap-3">
                <span className="bg-slate-100/50 px-2 py-0.5 rounded border border-slate-200/50">ID: <span className="font-mono text-slate-700">{caso.fields.ID_Caso}</span></span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide border ${esCerrado ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                  {caso.fields.Estado}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 z-20">
          {showExport && (
            <button
              onClick={async () => {
                try {
                  const { pdf } = await import('@react-pdf/renderer')
                  const { default: InformeCasoDocument } = await import('../components/InformeCasoDocument.jsx')
                  const { listEvidenceByFollowup } = await import('../api/evidence')

                  // Enriquecer seguimientos con evidencias
                  const seguimientosConEvidencias = await Promise.all(
                    (seguimientos || []).map(async (seg) => {
                      try {
                        const evidencias = await listEvidenceByFollowup(seg.id)
                        return { ...seg, _evidencias: evidencias || [] }
                      } catch (e) {
                        console.warn('No se pudieron cargar evidencias para seguimiento', seg.id, e)
                        return { ...seg, _evidencias: [] }
                      }
                    })
                  )

                  const doc = (
                    <InformeCasoDocument
                      caso={caso}
                      seguimientos={seguimientosConEvidencias}
                    />
                  )

                  const blob = await pdf(doc).toBlob()
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `Informe_Caso_${caso.fields?.ID_Caso || caso.id}.pdf`
                  document.body.appendChild(a)
                  a.click()
                  a.remove()
                  URL.revokeObjectURL(url)
                  push({ type: 'success', title: 'PDF listo', message: 'Informe generado' })
                } catch (e) {
                  console.error('Error generando PDF:', e)
                  push({ type: 'error', title: 'Error al generar PDF', message: e?.message || 'Intenta de nuevo' })
                }
              }}
                className="bg-green-600 text-white flex items-center gap-2 px-2.5 sm:px-3 py-1.5 text-sm shadow-sm whitespace-nowrap rounded-sm hover:bg-green-700"
            >
                  <Download size={14} />
              <span>Exportar Informe</span>
            </button>
          )}

          {/* + Nueva Acción ahora en el lugar del botón 'Volver' (puede estar controlado externamente) */}
          {!esCerrado && !soloLectura && !hideNewAction && (
            <button
              onClick={() => {
                if (typeof setExternalMostrarForm === 'function') setExternalMostrarForm(true)
                else setMostrarForm(true)
              }}
              className="bg-green-600 text-white px-3 py-2 text-sm rounded flex items-center whitespace-nowrap hover:bg-green-700"
            >
              <span className="text-green-600 mr-2">+</span>
              Nueva Acción
            </button>
          )}
          </div>
      </div>

      {!loadingCaso && caso?.fields && (
        <div className="space-y-4">

          <div className="rounded-2xl border border-white/60 bg-white/40 backdrop-blur-sm p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Estudiante Responsable</div>
                <div className="text-base font-black text-slate-800">
                  {caso.fields.Estudiante_Responsable || 'N/A'}
                </div>
                <div className="text-sm font-medium text-brand-600 mt-1">
                  Curso: <span className="text-slate-600">{caso.fields.Curso_Incidente || 'N/A'}</span>
                </div>
              </div>

              {caso.fields.Fecha_Cierre && (
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Cierre</div>
                  <div className="text-sm font-medium text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                    {formatDate(caso.fields.Fecha_Cierre)}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel p-6">
            <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">
              Descripción del Incidente
            </div>
            <div className="text-slate-600 leading-relaxed text-sm bg-white/50 p-4 rounded-xl border border-white/40">
              {caso.fields.Descripcion || 'Sin descripción registrada.'}
            </div>
          </div>

          <div className="glass-panel p-6">
            <div className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
              Involucrados
            </div>
            <InvolucradosList casoId={casoId} readOnly />
          </div>

        </div>
      )}

      {/* Originalmente aquí estaba +NuevaAcción; ahora colocamos el botón Cerrar Caso */}
      {!soloLectura && !mostrarForm && (
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border-dashed border-gray-300 flex justify-center">
          <button
            onClick={cerrarCaso}
            className="btn-primary bg-green-600 hover:bg-green-700 px-6 py-3 text-sm font-semibold"
          >
            Cerrar Caso
          </button>
        </div>
      )}

      {showHistorial && (
        <div className="glass-panel p-6 relative">
          <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
            <span className="bg-brand-100 text-brand-600 p-1.5 rounded-lg"><FileText size={18} /></span>
            Bitácora de Seguimiento
          </h2>

          {loadingSeg && (
            <div className="py-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
            </div>
          )}

          {!loadingSeg && (seguimientos || []).length === 0 && (
            <div className="py-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 text-slate-300 mb-3">
                <FileText size={32} />
              </div>
              <p className="text-slate-400 font-medium">No hay acciones registradas aún.</p>
            </div>
          )}

          <div className="space-y-6 relative ml-2 sm:ml-4">
            {/* Vertical Line */}
            <div className="absolute left-[-11px] top-2 bottom-2 w-0.5 bg-slate-200/60 rounded-full"></div>

            {(seguimientos || []).map(seg => (
              <div key={seg.id} className="relative pl-6">
                {/* Timeline Node */}
                <div className="absolute left-[-16px] top-1 w-3 h-3 rounded-full border-2 border-white bg-brand-400 shadow-sm z-10"></div>
                <SeguimientoItem key={seg.id} seg={seg} readOnly={soloLectura} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* El visualizador de proceso se muestra en la vista principal de `Seguimientos` (fila inferior). */}

      {/* MODAL */}
      {!soloLectura && ((typeof externalMostrarForm === 'boolean' ? externalMostrarForm : mostrarForm)) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="glass w-full max-w-md sm:max-w-lg md:max-w-2xl mx-auto p-0 sm:p-0 relative max-h-[90vh] flex flex-col h-full">
            <button
              onClick={() => {
                if (typeof setExternalMostrarForm === 'function') setExternalMostrarForm(false)
                else setMostrarForm(false)
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>

            <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
              <h2 className="text-lg font-semibold mb-4">Registrar nueva acción</h2>

              <SeguimientoForm
                casoId={casoId}
                onSaved={() => {
                  setRefreshKey(k => k + 1)
                  if (typeof setExternalMostrarForm === 'function') setExternalMostrarForm(false)
                  else setMostrarForm(false)
                  emitDataUpdated()
                  onDataChange?.()
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
