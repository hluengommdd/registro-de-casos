import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { getCases } from '../api/db'
import CaseDetailPanel from '../components/CaseDetailPanel'
import NuevoCasoModal from '../components/NuevoCasoModal'
import { formatDate } from '../utils/formatDate'
import { onDataUpdated } from '../utils/refreshBus'

export default function CasosActivos() {
  const [casos, setCasos] = useState([])
  const [selectedCaso, setSelectedCaso] = useState(null)
  const [loading, setLoading] = useState(true)
  const [nuevo, setNuevo] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // ✅ LEER QUERY PARAM ?caso=recXXXX
  const [searchParams] = useSearchParams()
  const selectedId = searchParams.get('caso')

  useEffect(() => {
    async function cargar() {
      try {
        setLoading(true)
        const data = await getCases()

        // Solo casos no cerrados
        const activos = data.filter(c => c.fields?.Estado !== 'Cerrado')
        setCasos(activos)

        // Seleccionar caso automáticamente desde query param
        if (selectedId) {
          const encontrado = activos.find(c => c.id === selectedId)
          if (encontrado) setSelectedCaso(encontrado)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }

    cargar()

    // ✅ Escuchar cambios de datos
    const off = onDataUpdated(() => {
      console.log('🔄 Refrescando casos activos...')
      cargar()
    })

    return () => off()
  }, [selectedId, refreshKey])

  return (
    <div className="h-full">
      <div className="flex flex-col lg:flex-row gap-6 h-full p-2 overflow-hidden">
        {/* LISTA IZQUIERDA */}
        <div className={`w-full lg:w-2/5 flex flex-col gap-4 h-full ${selectedCaso ? 'hidden lg:flex' : 'flex'}`}>

          {/* Header List */}
          <div className="flex items-center justify-between px-2 shrink-0">
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Casos Activos</h2>
              <p className="text-xs text-slate-500 font-medium">{casos.length} expedientes en curso</p>
            </div>
            <button
              onClick={() => setNuevo(true)}
              className="btn-primary flex items-center gap-2 text-sm px-4 shadow-brand-500/25"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Nuevo</span>
            </button>
          </div>

          <div className="glass-panel flex-1 overflow-hidden flex flex-col border border-white/60 shadow-xl">
            {/* ENCABEZADO LISTA */}
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 backdrop-blur-sm flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">
              <span>Listado de Casos</span>
              <span>Ult. Actividad</span>
            </div>

            {/* LISTA SCROLLABLE */}
            <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
              {loading && (
                <div className="p-8 text-center text-slate-400 flex flex-col items-center animate-pulse">
                  <div className="w-10 h-10 bg-slate-200 rounded-full mb-2"></div>
                  <p className="text-sm">Cargando expedientes...</p>
                </div>
              )}

              {!loading && casos.length === 0 && (
                <div className="p-10 text-center text-slate-400">
                  <p>No hay casos activos.</p>
                </div>
              )}

              {!loading &&
                casos.map((caso) => {
                  const isSelected = selectedCaso?.id === caso.id
                  return (
                    <div
                      key={caso.id}
                      onClick={() => setSelectedCaso(caso)}
                      className={`
                        group relative p-4 rounded-xl cursor-pointer transition-all duration-300 border
                        ${isSelected
                          ? 'bg-gradient-to-r from-slate-50 to-white border-slate-200 shadow-md transform scale-[1.02] z-10'
                          : 'bg-white border-transparent hover:border-slate-100 hover:bg-slate-50 hover:shadow-sm'
                        }
                      `}
                    >
                      {/* Active Indicator Strip */}
                      {isSelected && (
                        <div className="absolute left-0 top-3 bottom-3 w-1 bg-slate-600 rounded-r-full"></div>
                      )}

                      <div className="flex justify-between items-start mb-2 pl-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${caso.fields.Tipificacion_Conducta === 'Muy Grave' ? 'bg-red-50 text-red-700 border-red-200' :
                          caso.fields.Tipificacion_Conducta === 'Grave' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-slate-50 text-slate-700 border-slate-200'
                          }`}>
                          {caso.fields.Tipificacion_Conducta}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400 group-hover:text-slate-600 transition-colors">
                          {formatDate(caso.fields.Fecha_Incidente)}
                        </span>
                      </div>

                      <div className="pl-2">
                        <h4 className={`text-xs font-bold mb-1 line-clamp-1 ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                          {caso.fields.Estudiante_Responsable || 'Estudiante sin nombre'}
                        </h4>
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {caso.fields.Categoria_Conducta || 'Sin categoría'}
                        </p>
                      </div>

                      <div className="mt-3 pl-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold ${isSelected ? 'bg-slate-100 text-slate-600' : 'bg-slate-100 text-slate-500'}`}>
                            {caso.fields.Curso_Incidente?.substring(0, 2) || 'NA'}
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">{caso.fields.Curso_Incidente}</span>
                        </div>
                        <span className={`text-[10px] font-semibold px-1.5 rounded ${isSelected ? 'text-slate-600 bg-slate-100/50' : 'text-slate-400'}`}>
                          {caso.fields.Estado}
                        </span>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>

        {/* PANEL DERECHO */}
        <div className={`
          w-full lg:w-3/5 glass-panel overflow-hidden flex flex-col relative shadow-2xl border-white/60
          ${!selectedCaso ? 'hidden lg:flex' : 'flex h-full'}
        `}>
          {selectedCaso ? (
            <div className="flex-1 overflow-y-auto">
              <CaseDetailPanel
                caso={selectedCaso}
                onClose={() => setSelectedCaso(null)}
                setRefreshKey={setRefreshKey}
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
              Selecciona un caso para ver el detalle
            </div>
          )}
        </div>
      </div>

      {nuevo && (
        <NuevoCasoModal
          onClose={() => setNuevo(false)}
          onSaved={() => {
            setNuevo(false)
            setRefreshKey(k => k + 1)
          }}
        />
      )}
    </div>
  )
}
