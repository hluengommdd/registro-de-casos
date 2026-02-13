import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ProcesoVisualizer from '../components/ProcesoVisualizer';
import CaseDetailsCard from '../components/CaseDetailsCard';
import SeguimientoItem from '../components/SeguimientoItem';
import SeguimientoForm from '../components/SeguimientoForm';
import StageMessages from '../components/StageMessages';
import TeamComments from '../components/TeamComments';
import { DUE_PROCESS_STAGES } from '../constants/dueProcessStages';
import {
  getCaseDetails,
  getInvolucrados,
} from '../api/db';

import { useSeguimientos } from '../hooks/useSeguimientos';

import { useDueProcess } from '../hooks/useDueProcess';

import { emitDataUpdated as _emitDataUpdated } from '../utils/refreshBus';

import { useToast } from '../hooks/useToast';

export default function SeguimientoPage({
  casoId: casoIdProp = null,

  readOnly = false,
} = {}) {
  const { caseId: caseIdParam } = useParams();

  const caseId = casoIdProp || caseIdParam;

  const navigate = useNavigate();

  const [caso, setCaso] = useState(null);

  const [involucrados, setInvolucrados] = useState([]);

  const [openStage, setOpenStage] = useState(null);

  const [stageToAdd, setStageToAdd] = useState(null);

  const [refreshKey, setRefreshKey] = useState(0);

  const { push: _push } = useToast();

  const { followups: seguimientos, loading, refresh } = useSeguimientos(caseId);

  const { stages: dueStages, stageSlaMap } = useDueProcess(caseId, refreshKey);

  const effectiveStages = useMemo(
    () => (dueStages && dueStages.length ? dueStages : DUE_PROCESS_STAGES),

    [dueStages],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [c, inv] = await Promise.all([
          getCaseDetails(caseId),

          getInvolucrados(caseId),
        ]);

        if (!cancelled) {
          setCaso(c);

          setInvolucrados(inv || []);
        }
      } catch {
        if (!cancelled) {
          setCaso(null);

          setInvolucrados([]);
        }
      }
    }

    if (caseId) load();

    return () => {
      cancelled = true;
    };
  }, [caseId]);

  const grouped = useMemo(() => {
    const acc = {};

    for (const stage of effectiveStages) acc[stage] = [];

    for (const seg of seguimientos || []) {
      const key = seg.process_stage;

      if (!acc[key]) acc[key] = [];

      acc[key].push(seg);
    }

    // Orden cronológico dentro de etapa

    for (const stage of Object.keys(acc)) {
      acc[stage].sort((a, b) =>
        String(a.action_at || a.action_date || '').localeCompare(
          String(b.action_at || b.action_date || ''),
        ),
      );
    }

    return acc;
  }, [seguimientos, effectiveStages]);

  const completedStageKeys = useMemo(() => {
    const set = new Set();

    for (const s of seguimientos || []) {
      const stage = s.process_stage;

      // stage_status eliminado - cada followup representa una acción completada
      if (stage) set.add(stage);
    }

    return Array.from(set);
  }, [seguimientos]);

  const currentStageKey = useMemo(() => {
    for (const stage of effectiveStages) {
      if (!completedStageKeys.includes(stage)) return stage;
    }

    return effectiveStages[effectiveStages.length - 1] || null;
  }, [completedStageKeys, effectiveStages]);

  function irACierreCaso() {
    if (!caseId) return;

    navigate(`/cierre-caso/${caseId}`);
  }

  return (
    <div className="h-full w-full">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => setStageToAdd(currentStageKey || effectiveStages[0])}
            className="px-4 py-2 rounded-xl bg-brand-700 text-white text-sm font-semibold shadow-sm hover:bg-brand-800"
          >
            Registrar Acción
          </button>

          {!readOnly && (
            <button
              onClick={irACierreCaso}
              className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-sm font-semibold shadow-sm hover:bg-emerald-800"
            >
              Finalizar y Cerrar Caso
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <ProcesoVisualizer
            stages={effectiveStages}
            currentStageKey={currentStageKey}
            completedStageKeys={completedStageKeys}
            stageSlaMap={stageSlaMap}
          />
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Bitácora */}

          <section className="col-span-12 lg:col-span-8 space-y-4">
            {effectiveStages.map((stage) => {
              const isOpen = openStage === stage;

              const count = grouped?.[stage]?.length || 0;

              return (
                <div
                  key={stage}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenStage(isOpen ? null : stage)}
                    className="w-full flex justify-between items-center px-4 py-3 bg-gradient-to-r from-brand-50/70 to-transparent"
                  >
                    <div className="flex items-center gap-3">
                      <div className="font-semibold text-slate-900">
                        {stage}
                      </div>

                      <div className="text-xs text-slate-600">
                        {count} acción{count === 1 ? '' : 'es'}
                      </div>
                    </div>

                    <div className="text-slate-600 text-lg">
                      {isOpen ? '-' : '+'}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 space-y-3">
                      {loading && (
                        <div className="text-sm text-slate-600 py-2">
                          Cargando...
                        </div>
                      )}

                      {!loading && count === 0 && (
                        <div className="text-sm text-slate-600 py-2">
                          No hay acciones registradas en esta etapa.
                        </div>
                      )}

                      {!loading &&
                        grouped[stage].map((seg) => (
                          <SeguimientoItem
                            key={seg.id}
                            seg={seg}
                            readOnly={readOnly}
                          />
                        ))}

                      {!readOnly && (
                        <button
                          className="text-sm text-slate-700 hover:underline"
                          onClick={() => setStageToAdd(stage)}
                        >
                          + Registrar Acción en esta etapa
                        </button>
                      )}

                      <StageMessages
                        caseId={caseId}
                        stageKey={stage}
                        readOnly={readOnly}
                      />
                    </div>
                  )}
                </div>
              );
            })}

            <TeamComments caseId={caseId} readOnly={readOnly} />
          </section>

          {/* Panel derecho */}

          <aside className="col-span-12 lg:col-span-4 space-y-4 sticky top-6 self-start">
            <CaseDetailsCard
              caso={caso}
              seguimientos={seguimientos}
              involucradosSlot={
                <div className="space-y-2">
                  {(involucrados || []).map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
                    >
                      <div className="min-w-0">
                        <div className="font-medium truncate">{p.nombre}</div>

                        <div className="text-xs text-slate-600 truncate">
                          {p.rol}
                        </div>
                      </div>
                    </div>
                  ))}

                  {(!involucrados || involucrados.length === 0) && (
                    <div className="text-sm text-slate-600">
                      Sin involucrados registrados.
                    </div>
                  )}
                </div>
              }
            />
          </aside>
        </div>
      </div>

      {!readOnly && stageToAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Registrar acción"
        >
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 relative">
            <button
              onClick={() => setStageToAdd(null)}
              className="absolute top-4 right-4 h-9 w-9 rounded-full border border-slate-200 bg-white text-slate-600 hover:text-slate-800 hover:border-slate-300 hover:bg-brand-50 shadow-sm flex items-center justify-center tap-target"
              aria-label="Cerrar"
            >
              X
            </button>

            <div className="px-6 pt-6 pb-2">
              <h3 className="text-lg font-semibold text-slate-900">
                Registrar acción
              </h3>

              <p className="text-sm text-slate-600 mt-1">Etapa: {stageToAdd}</p>
            </div>

            <div className="px-6 pb-6">
              <SeguimientoForm
                caseId={caseId}
                defaultStage={stageToAdd}
                stages={effectiveStages}
                onSaved={() => {
                  setStageToAdd(null);

                  refresh();

                  setRefreshKey((k) => k + 1);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
