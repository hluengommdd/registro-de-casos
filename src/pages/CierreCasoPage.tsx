import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, FileDown, X } from 'lucide-react';

import {
  createFollowup,
  getCaseDetails,
  getCaseFollowups,
  updateCase,
} from '../api/db';
import { CARGOS } from '../constants/cargos';
import { DUE_PROCESS_STAGES } from '../constants/dueProcessStages';
import { emitDataUpdated } from '../utils/refreshBus';
import { getStudentName } from '../utils/studentName';
import { getCaseStatus } from '../utils/caseStatus';
import { useToast } from '../hooks/useToast';
import { logger } from '../utils/logger';
import { useDueProcess } from '../hooks/useDueProcess';

const CIERRE_STEPS = [
  { key: 'validacion', label: 'Validación' },
  { key: 'resolucion', label: 'Resolución' },
  { key: 'documentacion', label: 'Documentación' },
];

const MEDIDAS = [
  'Amonestación Escrita',
  'Amonestación Verbal',
  'Condicionalidad',
  'Suspensión',
  'Cancelación de matrícula',
  'Otra',
];

function Stepper({ activeKey }) {
  return (
    <div className="flex items-center justify-center gap-6">
      {CIERRE_STEPS.map((s, idx) => {
        const active = s.key === activeKey;
        return (
          <div key={s.key} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${
                active
                  ? 'bg-brand-700 text-white border-brand-700'
                  : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              {idx + 1}
            </div>
            <div
              className={`text-sm font-semibold ${active ? 'text-brand-700' : 'text-slate-600'}`}
            >
              {s.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ValidItem({ label, ok }) {
  return (
    <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
      <div className="flex items-center gap-3">
        <CheckCircle2
          className={`w-5 h-5 ${ok ? 'text-emerald-600' : 'text-slate-400'}`}
        />
        <div className="text-sm font-medium text-slate-800">{label}</div>
      </div>
      <span
        className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
          ok
            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
            : 'bg-slate-100 text-slate-600 border-slate-200'
        }`}
      >
        {ok ? 'VALIDADO' : 'PENDIENTE'}
      </span>
    </div>
  );
}

export default function CierreCasoPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { push } = useToast();
  const { stages: dueStages } = useDueProcess(caseId);
  const effectiveStages = useMemo(
    () => (dueStages && dueStages.length ? dueStages : DUE_PROCESS_STAGES),
    [dueStages],
  );
  const closeStageKey = useMemo(
    () =>
      effectiveStages && effectiveStages.length
        ? effectiveStages[effectiveStages.length - 1]
        : '8. Monitoreo',
    [effectiveStages],
  );

  const [activeStep, setActiveStep] = useState('validacion');
  const [loading, setLoading] = useState(true);
  const [caso, setCaso] = useState(null);
  const [seguimientos, setSeguimientos] = useState([]);

  const [descripcionCierre, setDescripcionCierre] = useState('');
  const [medida, setMedida] = useState('Amonestación Escrita');
  const [responsableNombre, setResponsableNombre] = useState('');
  const [responsableRol, setResponsableRol] = useState('');

  const validacionRef = useRef(null);
  const resolucionRef = useRef(null);
  const documentacionRef = useRef(null);

  const isClosed = useMemo(() => {
    return getCaseStatus(caso) === 'cerrado';
  }, [caso]);

  const expedienteTitle = useMemo(() => {
    if (!caso) return 'Cierre de Caso';
    // Si no hay un correlativo formal, usar id corto
    const short = String(caso.id || '').slice(0, 8);
    return `Cierre de Caso: Expediente #${short}`;
  }, [caso]);

  const alumnoNombre = useMemo(() => {
    if (!caso) return '';
    return getStudentName(caso.students, 'Estudiante');
  }, [caso]);

  const completedStages = useMemo(() => {
    const set = new Set();
    for (const s of seguimientos || []) {
      const stage = s.process_stage;
      // stage_status eliminado - cada followup representa una acción completada
      if (stage) set.add(stage);
    }
    return set;
  }, [seguimientos]);

  const stepOrder = useMemo(() => CIERRE_STEPS.map((s) => s.key), []);
  const activeIndex = stepOrder.indexOf(activeStep);
  const prevStep = activeIndex > 0 ? stepOrder[activeIndex - 1] : null;
  const nextStep =
    activeIndex >= 0 && activeIndex < stepOrder.length - 1
      ? stepOrder[activeIndex + 1]
      : null;

  const validacionItems = useMemo(() => {
    // Mapeo simple: consideramos validado si la etapa tiene al menos 1 acción o está completada.
    return [
      { label: 'Denuncia Inicial', stage: effectiveStages[0] },
      { label: 'Notificación a las Partes', stage: effectiveStages[1] },
      {
        label: 'Entrevista con el Estudiante',
        stage: effectiveStages[3] || effectiveStages[2],
      },
      { label: 'Recepción de Pruebas', stage: effectiveStages[2] },
      { label: 'Reunión con Acudientes', stage: effectiveStages[1] },
      {
        label: 'Análisis de Evidencia',
        stage: effectiveStages[4] || effectiveStages[2],
      },
      { label: 'Descargos', stage: effectiveStages[3] || effectiveStages[2] },
      {
        label: 'Resolución de Instancia',
        stage: effectiveStages[5] || effectiveStages[4],
      },
    ].map((it) => {
      const hasAny = (seguimientos || []).some(
        (s) => s.process_stage === it.stage,
      );
      const ok = completedStages.has(it.stage) || hasAny;
      return { ...it, ok };
    });
  }, [completedStages, seguimientos, effectiveStages]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!caseId) return;
      try {
        setLoading(true);
        const [c, seg] = await Promise.all([
          getCaseDetails(caseId),
          getCaseFollowups(caseId),
        ]);
        if (cancelled) return;
        setCaso(c);
        setSeguimientos(seg || []);
      } catch (e) {
        logger.error('Error cargando cierre de caso:', e);
        push({
          type: 'error',
          title: 'Cierre de Caso',
          message: e?.message || 'No se pudo cargar el expediente',
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [caseId, push]);

  useEffect(() => {
    const target =
      activeStep === 'validacion'
        ? validacionRef.current
        : activeStep === 'resolucion'
          ? resolucionRef.current
          : documentacionRef.current;
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeStep]);

  // Prefill: si el caso ya tiene datos finales guardados, reflejarlos en el formulario
  useEffect(() => {
    if (!caso) return;
    setDescripcionCierre((prev) =>
      prev ? prev : caso.final_resolution_text || '',
    );
    setMedida((prev) =>
      prev && prev !== 'Amonestación Escrita'
        ? prev
        : caso.final_disciplinary_measure || 'Amonestación Escrita',
    );
    setResponsableNombre((prev) => (prev ? prev : caso.closed_by_name || ''));
    setResponsableRol((prev) => (prev ? prev : caso.closed_by_role || ''));
  }, [caso]);

  function goToStep(stepKey, scrollToTop = false) {
    setActiveStep(stepKey);
    if (scrollToTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  async function generarPDF() {
    try {
      const [{ pdf }, { default: InformeCasoDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('../components/InformeCasoDocument'),
      ]);

      const blob = await pdf(
        <InformeCasoDocument caso={caso} seguimientos={seguimientos} />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Informe_${caseId}_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      logger.error('Error al generar PDF:', e);
      push({
        type: 'error',
        title: 'PDF',
        message: e?.message || 'No se pudo generar el informe',
      });
    }
  }

  async function finalizarYCerrar() {
    if (!caseId) return;
    if (isClosed) {
      push({ type: 'info', title: 'Caso', message: 'El caso ya está cerrado' });
      return;
    }
    // Validación obligatoria (alineado al CHECK en BD)
    if (!descripcionCierre.trim() || !medida.trim()) {
      push({
        type: 'error',
        title: 'Faltan datos',
        message:
          'Completa la descripción de cierre y la medida disciplinaria antes de cerrar.',
      });
      goToStep('resolucion');
      return;
    }

    if (!confirm('¿Confirmar cierre del caso?')) return;

    try {
      const nowIso = new Date().toISOString();

      // Registrar acción de cierre ANTES de cambiar estado
      await createFollowup({
        case_id: caseId,
        action_date: new Date().toISOString().slice(0, 10),
        action_type: 'Monitoreo',
        process_stage: closeStageKey,
        // stage_status eliminado - cada followup representa una acción completada
        detail: 'Cierre formal del caso',
        observations: descripcionCierre || null,
        responsible: responsableNombre || 'Sistema',
      });

      // Persistir cierre en CASES (expediente final)
      await updateCase(caseId, {
        status: 'Cerrado',
        closed_at: nowIso,
        due_process_closed_at: nowIso,
        final_resolution_text: descripcionCierre.trim(),
        final_disciplinary_measure: medida.trim(),
        closed_by_name: responsableNombre.trim() || null,
        closed_by_role: responsableRol.trim() || null,
      });

      push({
        type: 'success',
        title: 'Caso cerrado',
        message: 'El caso se marcó como cerrado',
      });
      emitDataUpdated();
      navigate('/casos-cerrados');
    } catch (e) {
      logger.error('Error al cerrar caso:', e);
      push({
        type: 'error',
        title: 'No se pudo cerrar',
        message: e?.message || 'Intenta de nuevo',
      });
    }
  }

  if (loading) {
    return <div className="p-6 text-slate-600">Cargando cierre de caso…</div>;
  }

  return (
    <div className="h-full w-full">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-brand-50/70 to-transparent flex items-start justify-between">
            <div>
              <div className="text-[11px] text-slate-600 font-semibold">
                <span
                  className="hover:underline cursor-pointer"
                  onClick={() => navigate('/')}
                >
                  Inicio
                </span>
                <span className="mx-1">›</span>
                <span
                  className="hover:underline cursor-pointer"
                  onClick={() => navigate(-1)}
                >
                  Seguimiento
                </span>
                <span className="mx-1">›</span>
                <span className="text-slate-600">Cierre de Caso</span>
              </div>
              <h1 className="text-xl font-semibold text-slate-900">
                {expedienteTitle}
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Siga los pasos para formalizar la conclusión del proceso
                disciplinario.
              </p>
              {alumnoNombre && (
                <p className="text-xs text-slate-600 mt-1">{alumnoNombre}</p>
              )}
            </div>

            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 tap-target"
              aria-label="Cerrar"
              title="Volver"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-5">
            <Stepper activeKey={activeStep} />

            <div className="mt-4 flex items-center justify-end gap-3">
              {prevStep && (
                <button
                  onClick={() => goToStep(prevStep, true)}
                  className="text-xs font-semibold text-slate-600 hover:underline"
                >
                  Volver
                </button>
              )}
              {nextStep && (
                <button
                  onClick={() => goToStep(nextStep)}
                  className="text-xs font-semibold text-brand-700 hover:underline"
                >
                  Siguiente
                </button>
              )}
            </div>

            {/* Paso 1 */}
            <div ref={validacionRef} className="mt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">
                  Paso 1: Validación de Debido Proceso
                </h2>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                {validacionItems.map((it) => (
                  <ValidItem key={it.label} label={it.label} ok={it.ok} />
                ))}
              </div>
            </div>

            {/* Paso 2 */}
            <div ref={resolucionRef} className="mt-8">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">
                  Paso 2: Resolución Final
                </h2>
              </div>

              <div className="mt-3">
                <label className="text-xs font-bold text-slate-700">
                  Descripción de Cierre
                </label>
                <textarea
                  value={descripcionCierre}
                  onChange={(e) => setDescripcionCierre(e.target.value)}
                  placeholder="Redacte la conclusión formal y los acuerdos alcanzados…"
                  className="mt-2 w-full min-h-[110px] rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-200"
                  disabled={isClosed}
                />
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700">
                    Medida Disciplinaria Final
                  </label>
                  <select
                    value={medida}
                    onChange={(e) => setMedida(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
                    disabled={isClosed}
                  >
                    {MEDIDAS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">
                    Responsable del Cierre
                  </label>
                  <input
                    value={responsableNombre}
                    onChange={(e) => setResponsableNombre(e.target.value)}
                    placeholder="Nombre…"
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    disabled={isClosed}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">
                    Cargo del Responsable
                  </label>
                  <select
                    value={responsableRol}
                    onChange={(e) => setResponsableRol(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
                    disabled={isClosed}
                  >
                    <option value="">Selecciona un cargo…</option>
                    {CARGOS.map((cargo) => (
                      <option key={cargo} value={cargo}>
                        {cargo}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Paso 3 */}
            <div ref={documentacionRef} className="mt-8">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">
                  Paso 3: Documentación
                </h2>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-gradient-to-r from-brand-50/70 to-transparent p-5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-base font-semibold text-slate-900">
                    Generar Expediente Final (PDF)
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    El sistema consolidará el seguimiento y la resolución final
                    en un documento descargable.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-600">
                    <span>• PDF/A compatible</span>
                    <span>• Incluye evidencias</span>
                    <span>• Historial completo</span>
                  </div>
                </div>

                <button
                  onClick={generarPDF}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm font-semibold hover:bg-brand-50"
                >
                  <FileDown className="w-4 h-4" />
                  Generar y Descargar
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 flex items-center justify-end gap-3">
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-brand-50"
              >
                Cancelar
              </button>
              <button
                onClick={finalizarYCerrar}
                disabled={isClosed}
                className={`px-5 py-2 rounded-xl text-sm font-semibold text-white ${
                  isClosed
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-brand-600 hover:bg-brand-700'
                }`}
              >
                {isClosed ? 'Caso Cerrado' : 'Finalizar y Cerrar Caso'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
