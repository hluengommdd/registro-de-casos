import { Edit2, Save, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { updateCase, iniciarDebidoProceso, getCase } from '../api/db'
import { useState } from 'react'
import InvolucradosListPlaceholder from './InvolucradosListPlaceholder'
import CaseStudentHeaderCard from './CaseStudentHeaderCard'
import { emitDataUpdated } from '../utils/refreshBus'

export default function CaseDetailPanel({ caso, setRefreshKey, onDataChange }) {
  const navigate = useNavigate()
  const [editando, setEditando] = useState(false)
  const [descripcion, setDescripcion] = useState(caso.fields.Descripcion || '')
  const [guardando, setGuardando] = useState(false)

  // ✅ En Casos Activos NO mostramos SLA
  // La falta es el texto de la conducta
  const falta =
    caso.fields.Categoria ||
    caso.fields.Falta ||
    caso.fields.Tipificacion_Conducta ||
    ''

  // Calcular días desde creación para información contextual
  const diasDesdeCreacion = caso.fields.Fecha_Creacion
    ? Math.floor((new Date() - new Date(caso.fields.Fecha_Creacion)) / (1000 * 60 * 60 * 24))
    : null

  async function handleIniciarDebidoProceso(e) {
    e?.stopPropagation()
    try {
      console.log('🚀 Iniciando debido proceso para caso:', caso.id)
      console.log('Estado actual:', caso.fields?.Estado)

      // ✅ Ejecutar RPC
      await iniciarDebidoProceso(caso.id, 10)
      console.log('✅ RPC start_due_process ejecutado correctamente')

      // ✅ Emitir evento para refrescar listados GLOBALMENTE
      console.log('🔔 Emitiendo evento de actualización global')
      emitDataUpdated()

      // ✅ Forzar refresh reactivo
      setRefreshKey?.(k => k + 1)
      onDataChange?.()

      // ⏳ IMPORTANTE: Delay para que Supabase procese el cambio
      console.log('⏳ Esperando 3 segundos para que Supabase actualice...')
      await new Promise(resolve => setTimeout(resolve, 3000))

      // ✅ Refrescar el caso SIN caché
      console.log('🔄 Refrescando caso desde Supabase SIN caché...')
      try {
        const casoActualizado = await getCase(caso.id)
        if (casoActualizado) {
          console.log('✅ Caso refrescado:')
          console.log('   - Estado nuevo:', casoActualizado.fields?.Estado)
          console.log('   - ID:', casoActualizado.id)
        }
      } catch (refreshErr) {
        console.warn('⚠️ Warning al refrescar (pero continuamos):', refreshErr.message)
      }

      // ✅ Navegar a Seguimientos
      console.log('📍 Navegando a /seguimientos/' + caso.id)
      navigate(`/seguimientos/${caso.id}`)

    } catch (err) {
      console.error('❌ Error crítico en handleIniciarDebidoProceso:', err)
      const errorMsg = err?.message || 'Error iniciando debido proceso'
      alert(`Error: ${errorMsg}`)
    }
  }

  async function verSeguimiento() {
    // NO debe iniciar nada, solo navega
    navigate(`/seguimientos/${caso.id}`)
  }

  async function guardarDescripcion() {
    try {
      setGuardando(true)
      await updateCase(caso.id, { Descripcion: descripcion })
      caso.fields.Descripcion = descripcion
      setEditando(false)
      alert('Descripción actualizada correctamente')
    } catch (e) {
      console.error(e)
      alert('Error al guardar la descripción')
    } finally {
      setGuardando(false)
    }
  }

  function cancelarEdicion() {
    setDescripcion(caso.fields.Descripcion || '')
    setEditando(false)
  }

  return (
    <div className="h-full flex flex-col bg-white/30 backdrop-blur-sm">
      {/* HEADER: No se muestra en Casos Activos */}
      <div className="hidden"></div>

      {/* CONTENIDO */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Tarjeta estudiante (sin SLA en Casos Activos) */}
        <CaseStudentHeaderCard
          studentName={caso.fields.Estudiante_Responsable}
          course={caso.fields.Curso_Incidente || '—'}
          tipificacion={caso.fields.Tipificacion_Conducta || '—'}
          estado={caso.fields.Estado || '—'}
          falta={falta}
          // En Casos Activos no se muestra SLA
          isOverdue={false}
          overdueLabel={null}
          isPendingStart={!caso._supabaseData?.seguimiento_started_at}
        />

        {/* Descripción */}
        <div className="glass-card p-4 bg-white/60">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Descripción breve
            </h3>
            {!editando && (
              <button
                onClick={() => setEditando(true)}
                className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 px-2 py-1 rounded-md"
              >
                <Edit2 size={12} />
                Editar
              </button>
            )}
          </div>

          {editando ? (
            <div className="space-y-2">
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-lg min-h-[120px] focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm bg-white/80"
                placeholder="Escribe la descripción del caso..."
              />
              <div className="flex gap-2">
                <button
                  onClick={guardarDescripcion}
                  disabled={guardando}
                  className="flex items-center gap-1 px-3 py-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 text-xs font-bold"
                >
                  <Save size={12} />
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  onClick={cancelarEdicion}
                  disabled={guardando}
                  className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-xs font-medium"
                >
                  <X size={12} />
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <p className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">
              {caso.fields.Descripcion || 'Sin descripción'}
            </p>
          )}
        </div>

        {/* Fecha/Hora */}
        <div className="text-sm text-gray-600">
          <span>{caso.fields.Fecha_Incidente}</span>
          <span className="mx-2">·</span>
          <span>{caso.fields.Hora_Incidente}</span>
          {diasDesdeCreacion !== null && (
            <>
              <span className="mx-2">·</span>
              <span className="text-gray-500">
                Creado hace {diasDesdeCreacion} {diasDesdeCreacion === 1 ? 'día' : 'días'}
              </span>
            </>
          )}
        </div>

        {/* Involucrados */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-2">
            Involucrados
          </h3>
          <InvolucradosListPlaceholder casoId={caso.id} />
        </div>
      </div>

      {/* BOTÓN abajo */}
      <div className="p-4 sm:p-6 border-t bg-transparent">
        {caso._supabaseData?.seguimiento_started_at ? (
          <button onClick={verSeguimiento} className="px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold w-full hover:bg-green-700 transition">
            Iniciar debido proceso
          </button>
        ) : (
          <button
            onClick={handleIniciarDebidoProceso}
            className="px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold w-full hover:bg-green-700 transition"
          >
            Iniciar debido proceso
          </button>
        )}
      </div>
    </div>
  )
}
