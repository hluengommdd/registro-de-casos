export default function StatCard({ title, value, subtitle, icon, color, onClick }) {
  const handleKey = (e) => {
    if (!onClick) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={handleKey}
      onClick={onClick}
      className={`relative overflow-hidden bg-white border border-slate-200 rounded-lg p-4 transition-all duration-200 ${onClick ? 'cursor-pointer hover:border-brand-300 hover:shadow-md group' : ''
        }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-medium text-slate-500">{title}</p>
          <p className="text-xl font-bold text-slate-900 mt-1.5 tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{subtitle}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg ${color} shadow-sm bg-opacity-90 group-hover:scale-105 transition-transform`}>
          {icon}
        </div>
      </div>
    </div>
  )
}
