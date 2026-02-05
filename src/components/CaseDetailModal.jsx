import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ModalShell from './ModalShell';
import { startSeguimiento } from '../api/db';
import { emitDataUpdated } from '../utils/refreshBus';
import { getStudentName } from '../utils/studentName';
import InvolucradosListPlaceholder from './InvolucradosListPlaceholder';
import { ArrowLeft, FileText, Calendar, Clock, Users, UserRound, GraduationCap } from 'lucide-react';

function Badge({ children, tone = 'slate' }) {
  const toneMap = {
    slate: 'bg-slate-100 text-slate-800 border-slate-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    amber: 'bg-amber-100 text-amber-800 border-amber-200',
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

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
        {Icon ? <Icon size={14} /> : null}
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-slate-900">{value || '—'}</div>
    </div>
  );
}

export default function CaseDetailModal({
  caso,
  onClose,
  mode = 'active', // 'active' | 'closed'
}) {
  const navigate = useNavigate();

  // Normalizamos estado (si no viene, asumimos Reportado)
  const estado = caso?.fields?.Estado || 'Reportado';
  const isClosed = mode === 'closed' || estado === 'Cerrado';
  const isReportado = estado === 'Reportado';

  const title = useMemo(
    () =>
      getStudentName(caso?.fields?.Estudiante_Responsable, 'Detalle del caso'),
    [caso],
  );

  const subtitle = useMemo(() => {
    if (!caso) return '';
    const curso = caso.fields?.Curso_Incidente || '';
    const tip = caso.fields?.Tipificacion_Conducta || '';
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
        className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
      >
        {isClosed ? 'Ver informe / Exportar' : isReportado ? 'Iniciar seguimiento' : 'Ver seguimiento'}
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
                  className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 hover:bg-slate-50 tap-target"
                  aria-label="Volver"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                      {title}
                    </h2>
                    <Badge tone="slate">ID {caso.fields?.ID_Caso || caso.id}</Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    {caso.fields?.Tipificacion_Conducta ? (
                      <Badge tone="amber">{caso.fields.Tipificacion_Conducta}</Badge>
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
                <h3 className="text-sm font-black text-slate-800 tracking-wider uppercase">
                  Descripción de los hechos
                </h3>
              </div>
              <div className="px-5 py-5">
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {caso.fields?.Descripcion || 'Sin descripción'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <InfoCard icon={Calendar} label="Fecha del hecho" value={caso.fields?.Fecha_Incidente} />
              <InfoCard icon={Clock} label="Hora registrada" value={caso.fields?.Hora_Incidente} />
              <InfoCard icon={GraduationCap} label="Curso" value={caso.fields?.Curso_Incidente} />
              <InfoCard
                icon={UserRound}
                label="Responsable"
                value={
                  caso.fields?.Responsable_Registro ||
                  caso.fields?.Responsable ||
                  '—'
                }
              />
            </div>
          </div>

          {/* Columna derecha */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <Users size={18} className="text-slate-700" />
                <h3 className="text-sm font-black text-slate-800 tracking-wider uppercase">
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
                    {caso.fields?.Curso_Incidente || '—'}
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
                Este caso está <span className="font-semibold">reportado</span> y aún no está en seguimiento. El
                seguimiento es quien genera los pasos del debido proceso.
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </ModalShell>
  );
}
