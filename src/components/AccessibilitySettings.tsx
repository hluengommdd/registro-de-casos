import { useAccessibility } from '../hooks/useAccessibility';

/**
 * Componente de configuración de accesibilidad
 * Permite al usuario ajustar preferencias de accesibilidad manualmente
 */
export function AccessibilitySettings() {
  const { reducedMotion, highContrastMode, toggleHighContrast } =
    useAccessibility();

  return (
    <div className="glass-panel p-4 space-y-4">
      <h3 className="section-title">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        Accesibilidad
      </h3>

      <div className="space-y-3">
        {/* Reduced Motion Toggle */}
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-slate-700">Reducir animaciones</span>
          <span className="relative inline-block w-11 h-6">
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={() => {
                document.body.classList.toggle('reduce-motion', !reducedMotion);
              }}
              className="sr-only peer"
            />
            <div
              className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-brand-300 rounded-full 
              peer peer-checked:after:translate-x-full peer-checked:after:border-white 
              after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white 
              after:rounded-full after:h-5 after:w-5 after:transition-all 
              peer-checked:bg-brand-600"
            ></div>
          </span>
        </label>

        {/* High Contrast Toggle */}
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-slate-700">Alto contraste</span>
          <span className="relative inline-block w-11 h-6">
            <input
              type="checkbox"
              checked={Boolean(highContrastMode)}
              onChange={toggleHighContrast}
              className="sr-only peer"
            />
            <div
              className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-brand-300 rounded-full 
              peer peer-checked:after:translate-x-full peer-checked:after:border-white 
              after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white 
              after:rounded-full after:h-5 after:w-5 after:transition-all 
              peer-checked:bg-brand-600"
            ></div>
          </span>
        </label>
      </div>

      <p className="text-xs text-slate-500">
        Estas configuraciones afectan cómo ves la aplicación. También puedes
        usar las preferencias de tu sistema operativo.
      </p>
    </div>
  );
}

export default AccessibilitySettings;
