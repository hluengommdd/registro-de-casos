function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '🙂';
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : '';
  return (first + last).toUpperCase() || '🙂';
}

import { tipChipClasses } from '../utils/tipColors';

function tipColor(tipificacion) {
  return tipChipClasses(tipificacion);
}

export default function CaseStudentHeaderCard({
  label = 'Estudiante',
  studentName = '—',
  course = '—',
  tipificacion = '—',
  estado = '—',
  falta = '',
  overdueLabel = null,
  isOverdue = false,
  isPendingStart = false,
}) {
  return (
    <div className="rounded-xl overflow-hidden border shadow-sm">
      <div className="bg-slate-700 px-4 sm:px-5 py-3 sm:py-4 text-white">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Avatar */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/15 flex items-center justify-center font-bold text-sm sm:text-base flex-shrink-0">
            {getInitials(studentName)}
          </div>

          {/* Textos */}
          <div className="min-w-0 flex-1">
            <div className="text-xs opacity-80">{label}</div>
            <div className="text-sm sm:text-base font-bold leading-snug truncate">
              {studentName}
            </div>
            <div className="text-xs sm:text-sm opacity-90">
              Curso: <span className="font-semibold">{course}</span>
            </div>

            {/* Chips - responsive flex */}
            <div className="mt-2 sm:mt-3 flex flex-wrap gap-1 sm:gap-2">
              <span
                className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${tipColor(tipificacion)}`}
              >
                {tipificacion}
              </span>

              {isPendingStart ? (
                <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                  Pendiente
                </span>
              ) : (
                <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900">
                  {estado}
                </span>
              )}

              {isOverdue && overdueLabel ? (
                <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900">
                  {overdueLabel}
                </span>
              ) : null}
            </div>

            {/* Falta - responsive */}
            {falta ? (
              <div className="mt-2 sm:mt-3 text-xs text-white/80">
                Falta: <span className="text-white font-semibold">{falta}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
