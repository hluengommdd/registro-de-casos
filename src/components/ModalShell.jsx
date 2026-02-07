import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Simple modal shell (no portal). Uses fixed overlay.
 * - ESC closes
 * - Click on backdrop closes
 */
export default function ModalShell({
  title,
  subtitle,
  children,
  onClose,
  footer,
  size = 'xl',
  ariaLabel,
  // Permite que algunos modales (p.ej. CaseDetailModal) dibujen su propio header.
  showHeader = true,
  // Si showHeader=false, este flag no se usa (no se renderiza nada arriba).
  showCloseButton = true,
}) {
  const panelRef = useRef(null);
  const lastActiveRef = useRef(null);

  useEffect(() => {
    lastActiveRef.current = document.activeElement;
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'Tab') {
        const root = panelRef.current;
        if (!root) return;
        const focusables = root.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    // Focus the panel for accessibility
    setTimeout(() => {
      panelRef.current?.focus();
    }, 0);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const maxW =
    size === 'lg'
      ? 'max-w-4xl'
      : size === 'md'
        ? 'max-w-2xl'
        : size === 'sm'
          ? 'max-w-xl'
          : 'max-w-6xl';

  useEffect(() => {
    return () => {
      lastActiveRef.current?.focus?.();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel || title || 'Modal'}
    >
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* panel */}
      <div className="relative h-full w-full flex items-start justify-center p-3 sm:p-6 overflow-auto">
        <div
          ref={panelRef}
          tabIndex={-1}
          className={`w-full ${maxW} bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden`}
          onClick={(e) => e.stopPropagation()}
        >
          {showHeader ? (
            <div className="flex items-start justify-between px-5 sm:px-6 py-4 border-b border-slate-100">
              <div className="min-w-0">
                {title && (
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight truncate">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5 line-clamp-2">
                    {subtitle}
                  </p>
                )}
              </div>

              {showCloseButton ? (
                <button
                  onClick={onClose}
                  className="ml-3 p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 tap-target"
                  aria-label="Cerrar"
                >
                  <X size={18} />
                </button>
              ) : null}
            </div>
          ) : null}

          <div className="max-h-[80vh] overflow-y-auto">{children}</div>

          {footer && (
            <div className="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/60">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
