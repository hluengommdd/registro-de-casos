export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
  onClick,
}) {
  const handleKey = (e) => {
    if (!onClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={handleKey}
      onClick={onClick}
      className={`relative overflow-hidden glass-card rounded-lg p-5 transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-md group' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-medium text-slate-600">{title}</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">
            {value}
          </p>
          {subtitle && (
            <p className="text-[12px] text-slate-500 mt-1 font-medium">
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={`p-3 rounded-lg ${color} shadow-sm bg-opacity-95 transform-gpu group-hover:scale-105 transition-transform`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
