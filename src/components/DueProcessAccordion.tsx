import { useMemo, useState } from 'react';
import SeguimientoItem from './SeguimientoItem';
import StageMessages from './StageMessages';

function norm(s) {
  return (s || '').trim().replace(/\s+/g, ' ');
}

function groupByStage(followups = []) {
  const map = new Map();
  for (const f of followups) {
    const stage = norm(f?.process_stage) || 'Sin etapa';
    if (!map.has(stage)) map.set(stage, []);
    map.get(stage).push(f);
  }
  for (const [_k, arr] of map.entries()) {
    arr.sort((a, b) =>
      String(a?.action_date || '').localeCompare(String(b?.action_date || '')),
    );
  }
  return map;
}

export default function DueProcessAccordion({
  stages = [],
  followups = [],
  currentStageKey = null,
  caseId = null,
  onAddActionForStage,
  readOnly = false,
}) {
  const filteredFollowups = useMemo(() => {
    // evitar logs automáticos en UI
    return (followups || []).filter((f) => {
      const text =
        `${f?.detail || ''} ${f?.description || ''} ${f?.action_type || ''} ${
          f?.observations || ''
        }`.toLowerCase();
      return !text.includes('inicio automatico');
    });
  }, [followups]);

  const grouped = useMemo(
    () => groupByStage(filteredFollowups),
    [filteredFollowups],
  );
  const [openKey, setOpenKey] = useState(currentStageKey);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {stages.map((stageKey) => {
        const items = grouped.get(stageKey) || [];
        const count = items.length;
        const isOpen = openKey === stageKey;

        return (
          <div
            key={stageKey}
            className="border-b last:border-b-0 border-slate-100"
          >
            <button
              type="button"
              onClick={() => setOpenKey(isOpen ? null : stageKey)}
              className={`w-full px-5 py-4 flex items-center justify-between transition-colors ${
                isOpen ? 'bg-slate-50' : 'hover:bg-brand-50'
              }`}
            >
              <div className="min-w-0 text-left">
                <div className="flex items-center gap-2">
                  <div
                    className={`text-sm font-bold truncate ${isOpen ? 'text-brand-700' : 'text-slate-700'}`}
                  >
                    {stageKey}
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      count > 0
                        ? 'bg-white text-slate-600 border-slate-200 shadow-sm'
                        : 'bg-slate-100 text-slate-500 border-transparent'
                    }`}
                  >
                    {count}
                  </span>
                </div>
              </div>
              <span
                className={`text-slate-500 text-lg transition-transform duration-200 ${isOpen ? 'rotate-180 text-brand-500' : ''}`}
              >
                ▾
              </span>
            </button>

            {isOpen && (
              <div className="px-5 pb-5 bg-slate-50/30">
                {count === 0 ? (
                  <div className="flex flex-col items-center py-4 text-center">
                    <div className="text-sm text-slate-500 mb-2">
                      No hay acciones en esta etapa.
                    </div>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => onAddActionForStage?.(stageKey)}
                        className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                      >
                        + Registrar Acción en esta etapa
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 space-y-3">
                    {items.map((f) => (
                      <div
                        key={f.id}
                        className="bg-white rounded-lg border border-slate-200 shadow-sm"
                      >
                        <SeguimientoItem seg={f} readOnly={readOnly} />
                      </div>
                    ))}
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => onAddActionForStage?.(stageKey)}
                        className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                      >
                        + Registrar Acción en esta etapa
                      </button>
                    )}
                  </div>
                )}

                <StageMessages
                  caseId={caseId}
                  stageKey={stageKey}
                  readOnly={readOnly}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
