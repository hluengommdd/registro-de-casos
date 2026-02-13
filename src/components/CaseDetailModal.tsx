import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ModalShell from './ModalShell';
import { startSeguimiento } from '../api/db';
import { emitDataUpdated } from '../utils/refreshBus';
import { getStudentName } from '../utils/studentName';
import InvolucradosListPlaceholder from './InvolucradosListPlaceholder';
import {
  ArrowLeft,
  FileText,
  Calendar,
  Clock,
  Users,
  UserRound,
  GraduationCap,
} from 'lucide-react';
import { getCaseStatus, getCaseStatusLabel } from '../utils/caseStatus';

type CaseLike = {
  id: string;
  students?: unknown;
  legacy_case_number?: string | null;
  course_incident?: string | null;
  conduct_type?: string | null;
  short_description?: string | null;
  incident_date?: string | null;
  incident_time?: string | null;
  responsible?: string | null;
};

function Badge({
  children,
  tone = 'slate',
}: {
  children: React.ReactNode;
  tone?: 'slate' | 'green' | 'amber' | 'red' | 'purple';
}) {
  const toneMap = {
    slate: 'bg-slate-100 text-slate-800 border-slate-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    // Grave = amber (usar amber-200 para mejor contraste)
    amber: 'bg-amber-200 text-amber-800 border-amber-300',
    red: 'bg-red-100 text-red-800 border-red-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
        toneMap[tone] || toneMap.slate
      }`}
    >
      {children}
    </span>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon?: React.ComponentType<{ size?: string | number; className?: string }>;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
        {Icon ? <Icon size={14} /> : null}
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-slate-900">
        {value || '—'}
      </div>
    </div>
  );
}

export default function CaseDetailModal({
  caso,
  onClose,
  mode = 'active', // 'active' | 'closed'
}: {
  caso: CaseLike | null;
  onClose: () => void;
  mode?: 'active' | 'closed';
}) {
  const navigate = useNavigate();

  // Normalizamos estado (si no viene, asumimos Reportado)
  const estado = getCaseStatusLabel(caso, 'Reportado');
  const estadoRaw = getCaseStatus(caso, 'reportado');
  const isClosed = mode === 'closed' || estadoRaw === 'cerrado';
  const isReportado = estadoRaw === 'reportado';

  const title = useMemo(
    () => getStudentName(caso?.students, 'Detalle del caso'),
    [caso],
  );

  const subtitle = useMemo(() => {
    if (!caso) return '';
    const curso = caso.course_incident || '';
    const tip = caso.conduct_type || '';
    return [tip, curso, estado].filter(Boolean).join(' • ');
  }, [caso, estado]);

  if (!caso) return null;

  const footer = (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={async () => {
          if (isReportado) {
            await startSeguimiento(caso.id);
            emitDataUpdated();
          }
          navigate(`/seguimientos/${caso.id}`);
        }}
        className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700"
      >
        {isClosed
          ? 'Ver informe / Exportar'
          : isReportado
            ? 'Iniciar seguimiento'
            : 'Ver seguimiento'}
      </button>
    </div>
  );

  return (
    <ModalShell
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      footer={footer}
      size="xl"
      // Este modal dibuja su propio header (con botón Volver),
      // para evitar múltiples "X" de cierre.
      showHeader={false}
      ariaLabel={title}
    >
      <div className="bg-slate-50">
        {/* Header estilo Stitch */}
        <div className="px-6 py-5 border-b border-slate-100 bg-white">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 hover:bg-brand-50 tap-target"
                  aria-label="Volver"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight truncate">
                      {title}
                    </h2>
                    <Badge tone="slate">
                      ID {caso.legacy_case_number || caso.id}
                    </Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    {caso.conduct_type ? (
                      <Badge tone="amber">{caso.conduct_type}</Badge>
                    ) : null}
                    <span className="truncate">{subtitle}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Body 2 columnas */}
        <div className="px-6 py-6 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          {/* Columna principal */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <FileText size={18} className="text-green-600" />
                <h3 className="text-sm font-semibold text-slate-800 tracking-wider uppercase">
                  Descripción de los hechos
                </h3>
              </div>
              <div className="px-5 py-5">
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {caso.short_description || 'Sin descripción'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <InfoCard
                icon={Calendar}
                label="Fecha del hecho"
                value={caso.incident_date}
              />
              <InfoCard
                icon={Clock}
                label="Hora registrada"
                value={caso.incident_time}
              />
              <InfoCard
                icon={GraduationCap}
                label="Curso"
                value={caso.course_incident}
              />
              <InfoCard
                icon={UserRound}
                label="Responsable"
                value={caso.responsible || '—'}
              />
            </div>
          </div>

          {/* Columna derecha */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <Users size={18} className="text-slate-700" />
                <h3 className="text-sm font-semibold text-slate-800 tracking-wider uppercase">
                  Involucrados en el hecho
                </h3>
              </div>
              <div className="px-5 py-5">
                {/* Sujeto principal */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Sujeto principal
                  </div>
                  <div className="mt-1 font-semibold text-slate-900">
                    {title}
                  </div>
                  <div className="text-sm text-slate-600">
                    {caso.course_incident || '—'}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge
                      tone={
                        estado === 'Cerrado'
                          ? 'slate'
                          : estado === 'En Seguimiento'
                            ? 'green'
                            : 'amber'
                      }
                    >
                      {estado}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Personas registradas
                  </div>
                  <InvolucradosListPlaceholder casoId={caso.id} />
                </div>
              </div>
            </div>

            {isReportado ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Este caso está <span className="font-semibold">reportado</span>{' '}
                y aún no está en seguimiento. El seguimiento es quien genera los
                pasos del debido proceso.
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </ModalShell>
  );
}
