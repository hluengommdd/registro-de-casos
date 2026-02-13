export default function ProcesoVisualizer({
  stages = [],
  currentStageKey = null,
  completedStageKeys = [],
  stageSlaMap = {},
}) {
  const completedSet = new Set(completedStageKeys);

  return (
    <div className="w-full">
      {/* Desktop: horizontal layout */}
      <div className="hidden md:flex flex-row items-start justify-between gap-4 py-2 border-t border-dashed border-slate-200 pt-6">
        {stages.map((stageKey, index) => {
          const isCompleted = completedSet.has(stageKey);
          const isCurrent = stageKey === currentStageKey;
          const sladays = stageSlaMap?.[stageKey] ?? null;

          const stageNum = index + 1;
          const stageName = stageKey.includes('.')
            ? stageKey.split('.')[1]?.trim() || stageKey
            : stageKey;

          const circleClass = isCompleted
            ? 'bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-100'
            : isCurrent
              ? 'bg-brand-600 text-white shadow-md ring-4 ring-brand-50 scale-110'
              : 'bg-slate-100 text-slate-500 border border-slate-200';

          return (
            <div
              key={stageKey}
              className={`flex-1 min-w-0 flex flex-col items-center text-center transition-all ${isCurrent ? '-mt-1' : ''}`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${circleClass}`}
              >
                {isCompleted ? '✓' : stageNum}
              </div>

              <div
                className={`mt-3 text-xs font-semibold leading-tight line-clamp-2 px-1 ${isCurrent ? 'text-brand-700' : 'text-slate-600'}`}
              >
                {stageName}
              </div>

              <div className="mt-1 text-[10px] text-slate-500 font-medium">
                {sladays !== null ? `${sladays}d` : ''}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: scrollable horizontal with better spacing */}
      <div className="md:hidden overflow-x-auto pt-6 pb-2 -mx-4 px-4 border-t border-dashed border-slate-200">
        <div className="flex flex-row gap-6 min-w-max">
          {stages.map((stageKey, index) => {
            const isCompleted = completedSet.has(stageKey);
            const isCurrent = stageKey === currentStageKey;
            const sladays = stageSlaMap?.[stageKey] ?? null;

            const stageNum = index + 1;
            const stageName = stageKey.includes('.')
              ? stageKey.split('.')[1]?.trim() || stageKey
              : stageKey;

            const circleClass = isCompleted
              ? 'bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-100'
              : isCurrent
                ? 'bg-brand-600 text-white shadow-md ring-4 ring-brand-50 scale-110'
                : 'bg-slate-100 text-slate-500 border border-slate-200';

            return (
              <div
                key={stageKey}
                className={`flex flex-col items-center text-center transition-all ${isCurrent ? '-mt-1' : ''} min-w-[80px]`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${circleClass}`}
                >
                  {isCompleted ? '✓' : stageNum}
                </div>

                <div
                  className={`mt-3 text-xs font-semibold leading-tight line-clamp-3 max-w-[80px] ${isCurrent ? 'text-brand-700' : 'text-slate-600'}`}
                >
                  {stageName}
                </div>

                <div className="mt-1 text-[10px] text-slate-500 font-medium">
                  {sladays !== null ? `${sladays}d` : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
