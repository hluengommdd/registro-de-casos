import { useMemo, useState } from 'react'

function norm(s) {
  return (s || '').trim().replace(/\s+/g, ' ')
}

function groupByStage(followups = []) {
  const map = new Map()
  for (const f of followups) {
    const stage = norm(f?.fields?.Etapa_Debido_Proceso) || 'Sin etapa'
    if (!map.has(stage)) map.set(stage, [])
    map.get(stage).push(f)
  }
  for (const [_k, arr] of map.entries()) {
    arr.sort((a, b) => (a?.fields?.Fecha || '').localeCompare(b?.fields?.Fecha || ''))
  }
  return map
}

function titleFromFields(ff) {
  return ff?.Acciones || ff?.Descripcion || ff?.Tipo_Accion || 'Acción'
}

function fmtDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = String(iso).split('-')
  if (!y || !m || !d) return iso
  return `${d}-${m}-${y}`
}

export default function DueProcessAccordion({
  stages = [],
  followups = [],
  currentStageKey = null,
  onAddActionForStage,
  onEditAction = null,
}) {
  const filteredFollowups = useMemo(() => {
    return (followups || []).filter((f) => {
      const ff = f?.fields || {}
      const text = `${ff.Detalle || ''} ${ff.Descripcion || ''} ${ff.Acciones || ''} ${ff.Observaciones || ''}`
        .toLowerCase()
      return !text.includes('inicio automatico')
    })
  }, [followups])

  const grouped = useMemo(() => groupByStage(filteredFollowups), [filteredFollowups])
  const [openKey, setOpenKey] = useState(currentStageKey)

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {stages.map((stageKey) => {
        const items = grouped.get(stageKey) || []
        const count = items.length
        const isOpen = openKey === stageKey

        return (
          <div key={stageKey} className="border-b last:border-b-0 border-slate-100">
            <button
              type="button"
              onClick={() => setOpenKey(isOpen ? null : stageKey)}
              className={`w-full px-5 py-4 flex items-center justify-between transition-colors ${isOpen ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
            >
              <div className="min-w-0 text-left">
                <div className="flex items-center gap-2">
                  <div className={`text-sm font-bold truncate ${isOpen ? 'text-brand-700' : 'text-slate-700'}`}>
                    {stageKey}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${count > 0
                    ? 'bg-white text-slate-600 border-slate-200 shadow-sm'
                    : 'bg-slate-100 text-slate-400 border-transparent'
                    }`}>
                    {count}
                  </span>
                </div>
                {isOpen && (
                  <div className="text-xs text-brand-600/80 mt-1 font-medium">
                    {count > 0 ? 'Desplegando acciones...' : 'Sin acciones registradas'}
                  </div>
                )}
              </div>
              <span className={`text-slate-400 text-lg transition-transform duration-200 ${isOpen ? 'rotate-180 text-brand-500' : ''}`}>▾</span>
            </button>

            {isOpen && (
              <div className="px-5 pb-5 bg-slate-50/30">
                {count === 0 ? (
                  <div className="flex flex-col items-center py-4 text-center">
                    <div className="text-sm text-slate-500 mb-2">
                      No hay acciones en esta etapa.
                    </div>
                    <button
                      type="button"
                      onClick={() => onAddActionForStage?.(stageKey)}
                      className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                    >
                      + Registrar primera acción
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 space-y-3">
                    {items.map((f) => {
                      const ff = f?.fields || {}
                      return (
                        <div key={f.id} className="border border-slate-200 rounded-lg p-3 bg-white shadow-sm hover:border-brand-200 transition-colors">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-slate-800">
                                {titleFromFields(ff)}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                <span>{fmtDate(ff.Fecha)}</span>
                                {ff.Responsable && <span>· {ff.Responsable}</span>}
                              </div>
                              {ff.Detalle && (
                                <div className="text-xs text-slate-600 mt-2 whitespace-pre-wrap leading-relaxed">
                                  {ff.Detalle}
                                </div>
                              )}
                              {ff.Observaciones && (
                                <div className="text-xs text-slate-500 mt-2 border-l-2 border-brand-200 pl-2 whitespace-pre-wrap italic">
                                  {ff.Observaciones}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {ff.Estado_Etapa && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                                  {ff.Estado_Etapa}
                                </span>
                              )}
                              {onEditAction && (
                                <button
                                  type="button"
                                  onClick={() => onEditAction(f)}
                                  className="text-[10px] text-slate-400 hover:text-brand-600 font-semibold transition-colors"
                                >
                                  EDITAR
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    <button
                      type="button"
                      onClick={() => onAddActionForStage?.(stageKey)}
                      className="w-full py-2 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded border border-dashed border-brand-200 transition-colors"
                    >
                      + Agregar otra acción
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
