export default function UrgentCaseCard({ title, student, date, level }) {
  const levelStyles = {
    Leve: 'bg-green-100 text-green-800',
    Grave: 'bg-yellow-100 text-yellow-800',
    'Muy Grave': 'bg-purple-100 text-purple-800',
    Gravísima: 'bg-red-100 text-red-800',
  }

  return (
    <div className="bg-white border border-red-100 rounded-lg p-4 mb-3 hover:shadow-sm transition-shadow">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h3 className="font-semibold text-slate-900 text-sm leading-tight">{title}</h3>
          <p className="text-xs text-slate-600 mt-1 font-medium">{student}</p>
          <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
            📅 {date}
          </p>
        </div>
        <span className={`text-[10px] uppercase tracking-wide font-bold px-2 py-1 rounded-md border ${level === 'Gravísima'
            ? 'bg-red-50 text-red-700 border-red-200'
            : 'bg-purple-50 text-purple-700 border-purple-200'
          }`}>
          {level}
        </span>
      </div>
    </div>
  )
}
