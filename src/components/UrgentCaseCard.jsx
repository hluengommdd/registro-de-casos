import { tipBadgeClasses } from '../utils/tipColors';

export default function UrgentCaseCard({ title, student, date, level }) {
  const levelClass = tipBadgeClasses(level);
  const displayStudent = (() => {
    if (!student) return '—';
    if (typeof student === 'string') return student;
    if (typeof student === 'object') return student.name || '—';
    return String(student);
  })();

  return (
    <div className="glass-card border rounded-lg p-4 mb-3 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h3 className="font-semibold text-slate-900 text-sm leading-tight">
            {title}
          </h3>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            {displayStudent}
          </p>
          <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
            📅 {date}
          </p>
        </div>
        <span
          className={`text-[10px] uppercase tracking-wide font-bold px-2 py-1 rounded-md border ${levelClass || 'bg-slate-100 text-slate-800 border-slate-200'}`}
        >
          {level}
        </span>
      </div>
    </div>
  );
}
