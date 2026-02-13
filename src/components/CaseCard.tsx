import { memo, useCallback } from 'react';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getStudentName } from '../utils/studentName';
import { formatDate } from '../utils/formatDate';
import { tipBadgeClasses } from '../utils/tipColors';
import { getCaseStatus, getCaseStatusLabel } from '../utils/caseStatus';
import { startSeguimiento } from '../api/db';
import { emitDataUpdated } from '../utils/refreshBus';
import { logger } from '../utils/logger';

type CaseLike = {
  id: string;
  students?: unknown;
  incident_date?: string | null;
  indagacion_due_date?: string | null;
  course_incident?: string | null;
  short_description?: string | null;
  conduct_category?: string | null;
  conduct_type?: string | null;
};

type PlazoInfo = {
  alerta_urgencia?: string | null;
  dias_restantes?: number | null;
};

type CaseCardProps = {
  caso: CaseLike;
  plazoInfo?: Map<string, PlazoInfo>;
  onView?: (caso: CaseLike) => void;
};

/**
 * Componente de tarjeta de caso optimizado con React.memo
 * para evitar re-renders innecesarios en listas
 */
const CaseCard = memo(function CaseCard({
  caso,
  plazoInfo,
  onView,
}: CaseCardProps) {
  const navigate = useNavigate();

  // Obtener estado y badges
  const estadoRaw = getCaseStatus(caso, 'reportado');
  const estadoLabel = getCaseStatusLabel(caso, 'Reportado');

  // Generar iniciales del estudiante
  const initials = (getStudentName(caso.students, '') || 'NA')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  // Calcular clase de badge de estado
  const estadoTone =
    estadoRaw === 'cerrado'
      ? 'slate'
      : estadoRaw === 'en seguimiento'
        ? 'green'
        : 'amber';

  const estadoClasses = {
    green: 'bg-green-100 text-green-800 border-green-200',
    amber: 'bg-amber-100 text-amber-800 border-amber-200',
    slate: 'bg-slate-100 text-slate-800 border-slate-200',
  };

  // Calcular badge de plazo
  const renderPlazoBadge = useCallback(() => {
    const r = plazoInfo?.get(caso.id) || null;
    const txt = (r?.alerta_urgencia || '').toUpperCase();
    const dias = r?.dias_restantes ?? null;

    if (!r || dias === null || txt.includes('SIN PLAZO')) {
      const deadline = caso?.indagacion_due_date;
      return (
        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full border bg-slate-50 text-slate-700 border-slate-200">
          {deadline
            ? `${Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} DÍAS`
            : 'SIN PLAZO'}
        </span>
      );
    }

    let label = txt;
    if (txt.includes('VENCE HOY')) label = 'VENCE HOY';
    else if (txt.includes('VENCIDO')) label = 'VENCIDO';
    else if (txt.includes('PRÓXIMO') || txt.includes('PROXIMO'))
      label = typeof dias === 'number' ? `${dias} DÍAS` : 'PRÓXIMO';
    else if (
      txt.includes('EN PLAZO') ||
      txt.includes('AL DÍA') ||
      txt.includes('AL DIA')
    )
      label = 'AL DÍA';

    const cls =
      txt.includes('VENCIDO') || txt.includes('VENCE HOY')
        ? 'bg-red-100 text-red-800 border-red-200'
        : txt.includes('PRÓXIMO') || txt.includes('PROXIMO')
          ? 'bg-amber-100 text-amber-800 border-amber-200'
          : 'bg-emerald-100 text-emerald-800 border-emerald-200';

    return (
      <span
        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${cls}`}
      >
        {label}
      </span>
    );
  }, [plazoInfo, caso.id, caso.indagacion_due_date]);

  // Handler para iniciar seguimiento
  const handleStartFollowUp = useCallback(async () => {
    try {
      if (estadoRaw === 'reportado') {
        await startSeguimiento(caso.id);
        emitDataUpdated();
      }
      navigate(`/seguimientos/${caso.id}`);
    } catch (e) {
      logger.error('Error al iniciar seguimiento:', e);
      const message = e instanceof Error ? e.message : String(e);
      alert(`No se pudo iniciar seguimiento: ${message}`);
    }
  }, [caso.id, estadoRaw, navigate]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 hover:border-brand-200 transition-all shadow-sm hover:shadow-soft hover:-translate-y-[1px]">
      <div className="flex items-center gap-4 p-4">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-extrabold text-slate-700 shrink-0">
          {initials}
        </div>

        {/* Main Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <h4 className="text-sm font-extrabold text-slate-900 truncate">
                  {getStudentName(caso.students, 'Estudiante')}
                </h4>
                <span className="text-[10px] text-slate-600 font-semibold truncate">
                  {caso.course_incident || '—'}
                </span>
              </div>
              <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                {caso.short_description || caso.conduct_category || '—'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tipBadgeClasses(caso.conduct_type)}`}
              >
                {caso.conduct_type || '—'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-semibold text-slate-600">
                {formatDate(caso.incident_date)}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${estadoClasses[estadoTone]}`}
              >
                {estadoLabel}
              </span>
              {renderPlazoBadge()}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onView?.(caso)}
                className="p-2 rounded-lg border border-slate-200 hover:bg-brand-50 hover:border-brand-200 text-slate-700 tap-target transition-colors"
                title="Ver detalle"
                aria-label="Ver detalle del caso"
              >
                <Eye size={18} />
              </button>
              <button
                onClick={handleStartFollowUp}
                className={`px-3 py-2 rounded-lg text-xs font-semibold hover:opacity-90 ${
                  estadoRaw === 'reportado'
                    ? 'bg-amber-600 text-white'
                    : 'bg-brand-600 text-white hover:bg-brand-700'
                }`}
              >
                {estadoRaw === 'reportado'
                  ? 'Iniciar seguimiento'
                  : 'Seguimiento'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default CaseCard;
