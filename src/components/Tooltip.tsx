import { memo, useState, useRef, useEffect } from 'react';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

type TooltipProps = {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: TooltipPosition;
  className?: string;
};

/**
 * Tooltip component con soporte para accesibilidad
 * Posicionamiento automático y reducido motion
 */
export const Tooltip = memo(function Tooltip({
  content,
  children,
  position = 'top',
  className = '',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTooltip = () => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    setIsVisible(true);
  };

  const hideTooltip = () => {
    hideTimeout.current = setTimeout(() => {
      setIsVisible(false);
    }, 150);
  };

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const trigger = triggerRef.current.getBoundingClientRect();
      const tooltip = tooltipRef.current.getBoundingClientRect();

      let x = 0;
      let y = 0;

      switch (position) {
        case 'top':
          x = trigger.left + trigger.width / 2 - tooltip.width / 2;
          y = trigger.top - tooltip.height - 8;
          break;
        case 'bottom':
          x = trigger.left + trigger.width / 2 - tooltip.width / 2;
          y = trigger.bottom + 8;
          break;
        case 'left':
          x = trigger.left - tooltip.width - 8;
          y = trigger.top + trigger.height / 2 - tooltip.height / 2;
          break;
        case 'right':
          x = trigger.right + 8;
          y = trigger.top + trigger.height / 2 - tooltip.height / 2;
          break;
        default:
          x = trigger.left + trigger.width / 2 - tooltip.width / 2;
          y = trigger.top - tooltip.height - 8;
      }

      // Keep within viewport
      const padding = 8;
      x = Math.max(
        padding,
        Math.min(x, window.innerWidth - tooltip.width - padding),
      );
      y = Math.max(
        padding,
        Math.min(y, window.innerHeight - tooltip.height - padding),
      );

      setCoords({ x, y });
    }
  }, [isVisible, position]);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className={`relative inline-flex ${className}`}>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        {children}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          style={{
            position: 'fixed',
            left: coords.x,
            top: coords.y,
            zIndex: 50,
          }}
          className={`
            px-3 py-1.5 text-sm rounded-md bg-brand-800 text-white 
            shadow-lg whitespace-nowrap
            animate-fade-in
            ${positionClasses[position]}
          `}
          onMouseEnter={showTooltip}
          onMouseLeave={hideTooltip}
        >
          {content}
        </div>
      )}
    </div>
  );
});

/**
 * Tooltip con icono de ayuda
 */
export function HelpTooltip({
  content,
  className = '',
}: {
  content: React.ReactNode;
  className?: string;
}) {
  return (
    <Tooltip content={content} position="top" className={className}>
      <button
        type="button"
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 hover:text-slate-700 transition-colors"
        aria-label="Ayuda"
      >
        <svg
          className="w-3 h-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
    </Tooltip>
  );
}

/**
 * Badge de información contextual
 */
export function InfoBadge({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-full ${className}`}
    >
      <svg
        className="w-3 h-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      {children}
    </span>
  );
}

export default Tooltip;
