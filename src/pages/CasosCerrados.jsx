import { useEffect, useState } from 'react'
import { getCases } from '../api/db'
import SeguimientoPage from './SeguimientoPage'
import { formatDate } from '../utils/formatDate'
import { tipBadgeClasses } from '../utils/tipColors'

export default function CasosCerrados() {
  const [casos, setCasos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCaso, setSelectedCaso] = useState(null)

  useEffect(() => {
    let mounted = true

    async function cargar() {
      try {
        setLoading(true)
        const data = await getCases('Cerrado')
        if (mounted) setCasos(data)
      } catch (e) {
        if (mounted) setError(e?.message || 'Error al cargar casos cerrados')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    cargar()

    return () => {
      mounted = false
    }
  }, [])

  if (loading) {
    return (
      <p className="text-gray-500">
        Cargando casos cerrados…
      </p>
    )
  }

  if (error) {
    return (
      <p className="text-red-500">
        Error: {error}
      </p>
    )
  }

  return (
    <div className="h-full">
      <div className="flex flex-col lg:flex-row gap-6 h-full p-2 overflow-hidden">
        {/* LISTA IZQUIERDA */}
        <div className={`w-full lg:w-2/5 flex flex-col gap-4 h-full ${selectedCaso ? 'hidden lg:flex' : 'flex'}`}>

          {/* Header List */}
          <div className="flex items-center justify-between px-2 shrink-0">
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Archivo Histórico</h2>
              <p className="text-xs text-slate-500 font-medium">Expedientes cerrados y finalizados</p>
            </div>
          </div>

          <div className="glass-panel flex-1 overflow-hidden flex flex-col border border-white/60 shadow-xl">
            {/* ENCABEZADO LISTA */}
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 backdrop-blur-sm flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Listado Cerrados</span>
              <span>Fecha Cierre</span>
            </div>

            {/* LISTA SCROLLABLE */}
            <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
              {loading && <p className="p-8 text-center text-slate-400 text-sm animate-pulse">Cargando archivo...</p>}

              {!loading && casos.length === 0 && (
                <div className="p-10 text-center text-slate-400 text-sm">
                  No hay casos cerrados.
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
                          ? 'bg-slate-50 border-slate-200 shadow-inner'
                          : 'bg-white border-transparent hover:border-slate-100 hover:bg-slate-50 hover:shadow-sm opacity-80 hover:opacity-100'
                        }
                      `}
                    >
                      <div className="flex justify-between items-start mb-2 pl-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tipBadgeClasses(caso.fields.Tipificacion_Conducta)}`}>
                          {caso.fields.Tipificacion_Conducta}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">
                          {formatDate(caso.fields.Fecha_Incidente)}
                        </span>
                      </div>

                      <div className="pl-2">
                        <h4 className="text-sm font-bold text-slate-700 mb-1 line-clamp-1 group-hover:text-slate-900 transition-colors">
                          {caso.fields.Estudiante_Responsable}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {caso.fields.Categoria}
                        </p>
                      </div>

                      <div className="mt-3 pl-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-400">
                            {caso.fields.Curso_Incidente?.substring(0, 2) || 'NA'}
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium grayscale">Cerrado</span>
                        </div>
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
          {!selectedCaso ? (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
              Selecciona un caso cerrado para ver el informe
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <SeguimientoPage casoId={selectedCaso.id} readOnly showExport onClose={() => setSelectedCaso(null)} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
