import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import ProcesoVisualizer from '../components/ProcesoVisualizer';
import DueProcessAccordion from '../components/DueProcessAccordion';
import CaseDetailsCard from '../components/CaseDetailsCard';
import InvolucradosList from '../components/InvolucradosList';
import SeguimientoForm from '../components/SeguimientoForm';

import { useSeguimientos } from '../hooks/useSeguimientos';
import { logger } from '../utils/logger';
import { useDueProcess } from '../hooks/useDueProcess';
import { usePlazosResumen } from '../hooks/usePlazosResumen';
import { getCase, updateCase, createFollowup } from '../api/db';
import { emitDataUpdated } from '../utils/refreshBus';
import { useToast } from '../hooks/useToast';

export default function Seguimientos() {
  const { caseId: urlCaseId } = useParams();
  const [searchParams] = useSearchParams();
  const queryCaseId = searchParams.get('caso');

  // Usar query param si existe, si no usar URL param
  const casoId = queryCaseId || urlCaseId || null;

  const { push } = useToast();

  const [refreshKey, setRefreshKey] = useState(0);
  const doRefresh = () => setRefreshKey((k) => k + 1);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [defaultStage, setDefaultStage] = useState(null);
  const [followupEnEdicion, setFollowupEnEdicion] = useState(null);

  const [caso, setCaso] = useState(null);
  const [loadingCaso, setLoadingCaso] = useState(false);

  const { data: seguimientos = [], loading: loadingSeg } = useSeguimientos(
    casoId,
    refreshKey,
  );
  const { stages, currentStageKey, completedStageKeys, stageSlaMap } =
    useDueProcess(casoId, refreshKey);
  const { row: plazoRow } = usePlazosResumen(casoId, refreshKey);

  // Construir flags para vencimiento SOLO si el proceso fue iniciado
  const dias = plazoRow?.dias_restantes ?? null;
  const procesoIniciado = Boolean(caso?._supabaseData?.seguimiento_started_at);

  let isOverdue = false;
  let overdueLabel = null;

  // Solo mostrar SLA si el proceso fue iniciado
  if (procesoIniciado && dias !== null && Number.isFinite(dias)) {
    if (dias < 0) {
      isOverdue = true;
      overdueLabel = `Vencido ${Math.abs(dias)} día${Math.abs(dias) === 1 ? '' : 's'}`;
    } else if (dias === 0) {
      isOverdue = true;
      overdueLabel = 'Vence hoy';
    } else {
      isOverdue = false;
      overdueLabel = `Vence en ${dias} día${dias === 1 ? '' : 's'}`;
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!casoId) {
        logger.debug('ℹ️ No hay casoId, limpiando caso');
        setCaso(null);
        return;
      }
      try {
        setLoadingCaso(true);
        logger.debug('🔄 Cargando caso desde Supabase:', casoId);
        const c = await getCase(casoId);
        if (!cancelled) {
          setCaso(c);
          logger.debug('✅ Caso cargado en Seguimientos:', {
            id: c?.id,
            estado: c?.fields?.Estado,
            estado_minusculas: (c?.fields?.Estado || '').toLowerCase(),
            status_bd: c?._supabaseData?.status,
            seguimiento_started_at: c?._supabaseData?.seguimiento_started_at,
          });
        }
      } catch (e) {
        logger.error('❌ Error cargando caso:', e);
        if (!cancelled) setCaso(null);
      } finally {
        if (!cancelled) setLoadingCaso(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [casoId, refreshKey]);

  if (!casoId) {
    return (
      <div className="p-6 text-gray-500">
        Selecciona un caso desde el sidebar.
      </div>
    );
  }

  // Botón Cerrar (componente pequeño local)
  function CerrarButton({ casoId, setRefreshKey }) {
    async function cerrarCaso() {
      if (!confirm('¿Confirmar cierre del caso?')) return;

      try {
        // 1) Registrar acción de cierre ANTES de cambiar estado, para no chocar con RLS de casos cerrados
        await createFollowup({
          Caso_ID: casoId,
          Fecha_Seguimiento: new Date().toISOString().slice(0, 10),
          Tipo_Accion: 'Seguimiento',
          Etapa_Debido_Proceso: '8. Seguimiento',
          Descripcion: 'Cierre formal del caso',
          Detalle: 'Caso cerrado - finalización del debido proceso',
          Responsable: 'Sistema',
        });

        // 2) Cambiar estado a Cerrado
        await updateCase(casoId, { Estado: 'Cerrado' });

        push({
          type: 'success',
          title: 'Caso cerrado',
          message: 'El caso se marcó como cerrado',
        });
        alert('Caso cerrado correctamente');
        emitDataUpdated();
        setRefreshKey?.((k) => k + 1);
        doRefresh();
      } catch (e) {
        logger.error(e);
        push({
          type: 'error',
          title: 'No se pudo cerrar',
          message: e?.message || 'Intenta de nuevo',
        });
        alert('Error al cerrar el caso');
      }
    }

    return (
      <button
        onClick={cerrarCaso}
        className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition"
      >
        Cierre de caso
      </button>
    );
  }

  return (
    <div className="h-full w-full p-4 sm:p-6 space-y-6">
      {/* ARRIBA: Fases del Debido Proceso */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div>
            <h2 className="text-lg sm:text-lg font-bold text-slate-900">
              Fases del Debido Proceso
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Avance del ciclo de vida del caso
            </p>
          </div>

          <button
            onClick={() => {
              setDefaultStage(currentStageKey || null);
              setFollowupEnEdicion(null);
              setMostrarForm(true);
            }}
            className="px-4 py-2 text-sm rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium shadow-sm transition-colors"
          >
            + Registrar acción
          </button>
        </div>

        <ProcesoVisualizer
          stages={stages}
          currentStageKey={currentStageKey}
          completedStageKeys={completedStageKeys}
          stageSlaMap={stageSlaMap}
        />
      </div>

      {/* ABAJO: 2 columnas - responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 auto-rows-max lg:auto-rows-auto">
        {/* IZQ: Acordeón por etapa (sin timeline) */}
        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 min-h-[420px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              Acciones del Debido Proceso
            </h3>
            <div className="text-sm text-gray-500">
              {loadingSeg ? 'Cargando…' : `${seguimientos.length} acciones`}
            </div>
          </div>

          <DueProcessAccordion
            stages={stages}
            followups={seguimientos}
            currentStageKey={currentStageKey}
            onAddActionForStage={(stageKey) => {
              setDefaultStage(stageKey);
              setFollowupEnEdicion(null);
              setMostrarForm(true);
            }}
            onEditAction={(followup) => {
              setFollowupEnEdicion(followup);
              setDefaultStage(followup?.fields?.Etapa_Debido_Proceso || null);
              setMostrarForm(true);
            }}
          />
        </div>

        {/* DER: Detalles del caso (mock style) */}
        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 min-h-[420px]">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              Detalles del Caso
            </h3>
            {/* Mostrar botón de cierre junto al título si corresponde */}
            {!loadingCaso &&
              caso?.fields &&
              (() => {
                const estado = (caso?.fields?.Estado ?? '').trim();
                const estadoNorm = estado.toLowerCase();
                const isClosed = estadoNorm === 'cerrado';
                const isEnSeguimiento = estadoNorm === 'en seguimiento';
                const showCerrar = !!casoId && isEnSeguimiento && !isClosed;
                return showCerrar ? (
                  <div className="flex items-center">
                    <CerrarButton
                      casoId={casoId}
                      setRefreshKey={setRefreshKey}
                    />
                  </div>
                ) : null;
              })()}
          </div>

          {loadingCaso && (
            <p className="text-sm text-gray-500">Cargando caso…</p>
          )}

          {!loadingCaso &&
            caso?.fields &&
            (() => {
              return (
                <CaseDetailsCard
                  caso={caso}
                  seguimientos={seguimientos}
                  isOverdue={isOverdue}
                  overdueLabel={overdueLabel || 'Vencido'}
                  isReincidente={false}
                  isPendingStart={false}
                  involucradosSlot={
                    <InvolucradosList casoId={casoId} readOnly />
                  }
                />
              );
            })()}

          {!loadingCaso && !caso && (
            <p className="text-sm text-red-600">No se pudo cargar el caso.</p>
          )}
        </div>
      </div>

      {/* MODAL: Registrar acción */}
      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative">
            <button
              onClick={() => {
                setMostrarForm(false);
                setDefaultStage(null);
                setFollowupEnEdicion(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>

            <h2 className="text-lg font-semibold mb-4">
              {followupEnEdicion ? 'Editar acción' : 'Registrar nueva acción'}
            </h2>

            <SeguimientoForm
              casoId={casoId}
              defaultProcessStage={defaultStage}
              followup={followupEnEdicion}
              onSaved={() => {
                setMostrarForm(false);
                setDefaultStage(null);
                setFollowupEnEdicion(null);
                doRefresh();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
