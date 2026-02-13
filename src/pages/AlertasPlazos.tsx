import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getAllControlAlertas } from '../api/db';
import { formatDate } from '../utils/formatDate';
import { getStudentName } from '../utils/studentName';
import { AlertTriangle, Clock, CheckCircle, FileText } from 'lucide-react';
import { onDataUpdated } from '../utils/refreshBus';
import { diffDays, haceXDiasLabel } from '../utils/dateUtils';
import useCachedAsync from '../hooks/useCachedAsync';
import { clearCache } from '../utils/queryCache';
import InlineError from '../components/InlineError';

/* =========================
   Helpers de temporalidad (robustos a timezone)
========================== */

// Etiqueta de fuente para auditoría rápida
function fuenteActividad({ lastAction, seguimiento }) {
  if (lastAction) return 'acción';
  if (seguimiento) return 'seguimiento';
  return null;
}

export default function AlertasPlazos() {
  const navigate = useNavigate();

  const [refreshKey, setRefreshKey] = useState(0);

  const {
    data: seguimientos,
    loading,
    error,
  } = useCachedAsync(
    'control_alertas',
    () => getAllControlAlertas(),
    [refreshKey],
    { ttlMs: 30000 },
  );

  useEffect(() => {
    const off = onDataUpdated(() => {
      clearCache('control_alertas');
      setRefreshKey((k) => k + 1);
    });
    return () => off();
  }, []);

  /* =========================
     CLASIFICACIÓN
  ========================== */

  const clasificados = useMemo(() => {
    const grupos = {
      rojos: [],
      naranjos: [],
      amarillos: [],
      verdes: [],
      sin: [],
    };

    (seguimientos || []).forEach((s) => {
      const alerta = s.alerta_urgencia || '⏳ SIN PLAZO';

      if (alerta.startsWith('🔴')) grupos.rojos.push(s);
      else if (alerta.startsWith('🟠')) grupos.naranjos.push(s);
      else if (alerta.startsWith('🟡')) grupos.amarillos.push(s);
      else if (alerta.startsWith('✅') || alerta.startsWith('🟢'))
        grupos.verdes.push(s);
      else grupos.sin.push(s);
    });

    const sortByDays = (a, b) => {
      const da = a.dias_restantes;
      const db = b.dias_restantes;
      return (da ?? Infinity) - (db ?? Infinity);
    };

    Object.values(grupos).forEach((arr) => arr.sort(sortByDays));
    return grupos;
  }, [seguimientos]);

  const resumen = useMemo(
    () => ({
      rojos: clasificados.rojos.length,
      naranjos: clasificados.naranjos.length,
      amarillos: clasificados.amarillos.length,
      verdes: clasificados.verdes.length,
      sin: clasificados.sin.length,
    }),
    [clasificados],
  );

  if (loading) return <p className="text-gray-500">Cargando alertas…</p>;
  if (error)
    return (
      <InlineError
        title="Error al cargar alertas"
        message={error?.message || String(error)}
        onRetry={() => {
          clearCache('control_alertas');
          setRefreshKey((k) => k + 1);
        }}
      />
    );

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 pb-8">
      {/* HEADER */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight flex items-center gap-3">
            <span className="bg-brand-900 p-1.5 sm:p-2 rounded-xl text-white shadow-sm">
              <Clock className="w-5 h-5 sm:w-7 sm:h-7" aria-hidden="true" />
            </span>
            Control de Alertas
          </h1>
          <p className="text-sm text-slate-600 font-medium mt-2 max-w-2xl ml-1">
            Monitoreo en tiempo real del debido proceso. Las alertas se generan
            automáticamente según los plazos definidos.
          </p>
        </div>
      </div>

      {/* RESUMEN CON CARDS MEJORADAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <CardResumen
          icon={<AlertTriangle size={24} aria-hidden="true" />}
          label="Vencidos"
          value={resumen.rojos}
          color="red"
        />
        <CardResumen
          icon={<AlertTriangle size={24} aria-hidden="true" />}
          label="Urgentes"
          value={resumen.naranjos}
          color="purple"
        />
        <CardResumen
          icon={<Clock size={24} aria-hidden="true" />}
          label="Próximos"
          value={resumen.amarillos}
          color="green"
        />
        <CardResumen
          icon={<CheckCircle size={24} aria-hidden="true" />}
          label="En plazo"
          value={resumen.verdes}
          color="green"
        />
        <CardResumen
          icon={<FileText size={24} aria-hidden="true" />}
          label="Sin plazo"
          value={resumen.sin}
          color="gray"
        />
      </div>

      {/* SECCIONES */}
      <div className="space-y-8">
        <Seccion
          titulo="🔴 Vencidos / Críticos"
          descripcion="Casos con plazos vencidos que requieren acción inmediata."
          items={clasificados.rojos}
          navigate={navigate}
          tone="red"
          large
        />

        <Seccion
          titulo="🟠 Urgentes"
          descripcion="Vencen hoy o en los próximos 3 días."
          items={clasificados.naranjos}
          navigate={navigate}
          tone="purple"
        />

        <Seccion
          titulo="🟢 Preventivos"
          descripcion="En seguimiento, con plazos vigentes."
          items={clasificados.amarillos}
          navigate={navigate}
          tone="green"
          compact
        />

        <Seccion
          titulo="✅ En Plazo"
          descripcion="Casos que están al día, cumpliendo con los plazos establecidos."
          items={clasificados.verdes}
          navigate={navigate}
          tone="green"
          compact
        />

        <Seccion
          titulo="⏳ Sin Plazo Definido"
          descripcion="Casos que no tienen un plazo específico asignado."
          items={clasificados.sin}
          navigate={navigate}
          tone="gray"
          compact
        />
      </div>

      {Object.values(resumen).every((v) => v === 0) && (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle
              className="text-slate-400"
              size={32}
              aria-hidden="true"
            />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Todo al día</h3>
          <p className="text-sm text-slate-600 mt-1">
            No hay alertas activas en este momento.
          </p>
        </div>
      )}
    </div>
  );
}

/* =========================
   COMPONENTES AUX
========================== */

function CardResumen({ icon, label, value, color }) {
  const colorStyles = {
    red: 'from-red-500 to-rose-600 shadow-red-500/20',
    purple: 'from-violet-500 to-purple-600 shadow-violet-500/20',
    orange: 'from-amber-500 to-orange-600 shadow-amber-500/20',
    yellow: 'from-yellow-400 to-amber-500 shadow-yellow-500/20',
    green: 'from-emerald-500 to-teal-600 shadow-emerald-500/20',
    gray: 'from-slate-400 to-slate-500 shadow-slate-500/20',
  };

  return (
    <div
      className={`
      relative overflow-hidden rounded-2xl p-5 text-white transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 shadow-lg
      bg-gradient-to-br ${colorStyles[color]}
    `}
    >
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
          {icon}
        </div>
        <span className="text-4xl font-semibold tracking-tight drop-shadow-sm">
          {value}
        </span>
      </div>
      <div className="relative z-10">
        <div className="text-xs font-bold uppercase tracking-wider opacity-90">
          {label}
        </div>
      </div>

      {/* Decorative background icon */}
      <div className="absolute -bottom-4 -right-4 opacity-10 rotate-12 scale-150">
        {icon}
      </div>
    </div>
  );
}

function Seccion({
  titulo,
  descripcion,
  items,
  navigate,
  tone,
  large = false,
  compact = false,
}) {
  if (!items || items.length === 0) return null;

  const toneMap = {
    red: {
      border: 'border-red-200',
      bg: 'bg-white', // Card bg
      wrapper_bg: 'bg-red-50/50', // Section background accent
      hover: 'hover:border-red-300 hover:shadow-md',
      text: 'text-slate-800',
      title: 'text-red-800',
      badge: 'bg-red-100 text-red-700 border border-red-200',
    },
    purple: {
      border: 'border-violet-200',
      bg: 'bg-white',
      wrapper_bg: 'bg-violet-50/50',
      hover: 'hover:border-violet-300 hover:shadow-md',
      text: 'text-slate-800',
      title: 'text-violet-800',
      badge: 'bg-violet-100 text-violet-700 border border-violet-200',
    },
    green: {
      border: 'border-emerald-200',
      bg: 'bg-white',
      wrapper_bg: 'bg-emerald-50/50',
      hover: 'hover:border-emerald-300 hover:shadow-md',
      text: 'text-slate-800',
      title: 'text-emerald-800',
      badge: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    },
    orange: {
      border: 'border-amber-200',
      bg: 'bg-white',
      wrapper_bg: 'bg-amber-50/50',
      hover: 'hover:border-amber-300 hover:shadow-md',
      text: 'text-slate-800',
      title: 'text-amber-800',
      badge: 'bg-amber-100 text-amber-700 border border-amber-200',
    },
    gray: {
      border: 'border-slate-200',
      bg: 'bg-white',
      wrapper_bg: 'bg-slate-50/50',
      hover: 'hover:border-slate-300 hover:shadow-md',
      text: 'text-slate-800',
      title: 'text-slate-700',
      badge: 'bg-slate-100 text-slate-700 border border-slate-200',
    },
  };

  const styles = toneMap[tone] || toneMap.green;

  return (
    <section
      className={`glass-panel p-6 ${styles.wrapper_bg} border border-slate-200 shadow-glass`}
    >
      <div className="flex items-center gap-3 mb-4">
        <h2 className={`text-lg font-bold ${styles.title}`}>{titulo}</h2>
        <span className="px-2.5 py-0.5 bg-white border border-slate-200 text-slate-700 rounded-full text-xs font-bold shadow-sm">
          {items.length}
        </span>
      </div>
      <p className="text-sm text-slate-600 mb-4 -mt-2">{descripcion}</p>

      <div
        className={`grid grid-cols-1 ${large ? '2xl:grid-cols-2' : 'xl:grid-cols-2'} gap-4`}
      >
        {items.map((s) => {
          const casoId = s.case_id;
          const dias = s.dias_restantes;
          const disabled = !casoId;

          // Preferir datos directos desde la vista unificada
          const estudiante = s.estudiante || null;
          const estudianteName = getStudentName(estudiante, 'Estudiante');
          const curso = s.course || s.curso_incidente || null;

          // Temporalidad: última actividad con fallbacks
          const lastAction = s.last_action_date;
          const seguimiento = s.fecha;
          const refActividad = lastAction || seguimiento;
          const diasActividad = diffDays(refActividad);
          const actividadLabel = haceXDiasLabel(diasActividad);
          const fuente = fuenteActividad({
            lastAction,
            seguimiento,
          });

          return (
            <div
              key={s.id}
              onClick={() =>
                !disabled && navigate(`/seguimientos?caso=${casoId}`)
              }
              className={`border rounded-xl p-5 transition-all bg-white relative overflow-hidden group
                ${styles.border} ${!disabled && styles.hover}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${compact ? 'text-sm' : ''}
              `}
            >
              {/* Decorative accent bar on left */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-1 ${tone === 'red' ? 'bg-red-600' : tone === 'purple' ? 'bg-violet-600' : 'bg-emerald-600'}`}
              />

              <div className="flex items-start justify-between mb-3 pl-2">
                <div className="flex-1 min-w-0 pr-3">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    {s.etapa_debido_proceso || 'Etapa sin dato'}
                  </p>
                  {estudianteName && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-700">
                        {estudianteName.charAt(0)}
                      </span>
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {estudianteName}{' '}
                        {curso && (
                          <span className="font-normal text-slate-600">
                            · {curso}
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-slate-600">
                    Estado:{' '}
                    <span className="font-medium text-slate-800">
                      {s.estado_caso || '—'}
                    </span>
                  </p>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${styles.badge} whitespace-nowrap shadow-sm`}
                  >
                    {typeof dias === 'number'
                      ? dias < 0
                        ? `Vencido ${Math.abs(dias)}d`
                        : dias === 0
                          ? 'Vence hoy'
                          : `${dias} días rest.`
                      : 'Sin plazo'}
                  </span>
                  {s.fecha_plazo && (
                    <span className="text-[10px] font-mono text-slate-600 mt-1">
                      {formatDate(s.fecha_plazo)}
                    </span>
                  )}
                </div>
              </div>

              {(s.detalle || s.descripcion) && (
                <p className="text-xs text-slate-700 mb-3 pl-2 line-clamp-2 leading-relaxed">
                  {s.detalle || s.descripcion}
                </p>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 pl-2">
                {/* Temporalidad */}
                <span className="text-[10px] text-slate-600 font-medium">
                  {actividadLabel ? (
                    <>
                      {lastAction
                        ? `Actividad ${actividadLabel}`
                        : `Registrado ${actividadLabel}`}{' '}
                      {fuente ? `· ${fuente}` : ''}
                    </>
                  ) : (
                    <span className="italic">Sin actividad reciente</span>
                  )}
                </span>

                {/* Última acción del debido proceso */}
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-[10px] font-bold text-slate-700 truncate max-w-[160px] sm:max-w-[220px]">
                    {s.etapa_debido_proceso || 'Sin etapa'}
                  </span>
                  {(lastAction || refActividad) && (
                    <span className="text-[9px] text-slate-600 font-medium">
                      {formatDate(lastAction || refActividad)}{' '}
                      {new Date(lastAction || refActividad).toLocaleTimeString(
                        'es-CL',
                        {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        },
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
