import {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
} from 'react';

/**
 * Hook para detectar preferencias de accesibilidad del sistema
 * Implementa soporte para:
 * - Reduced Motion (prefers-reduced-motion)
 * - High Contrast (prefers-contrast: more)
 * - Dark Mode (prefers-color-scheme)
 *
 * Usa estado inicial lazy para evitar setState en useEffect
 */
function getInitialPreferences() {
  if (typeof window === 'undefined') {
    return {
      reducedMotion: false,
      highContrast: false,
      darkMode: false,
    };
  }

  return {
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)')
      .matches,
    highContrast: window.matchMedia('(prefers-contrast: more)').matches,
    darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
  };
}

export function useAccessibilityPreferences() {
  const [preferences, setPreferences] = useState(getInitialPreferences);

  useEffect(() => {
    const updates = {
      reducedMotion: (v) => setPreferences((p) => ({ ...p, reducedMotion: v })),
      highContrast: (v) => setPreferences((p) => ({ ...p, highContrast: v })),
      darkMode: (v) => setPreferences((p) => ({ ...p, darkMode: v })),
    };

    // Detectar prefers-reduced-motion
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (e) => updates.reducedMotion(e.matches);
    motionQuery.addEventListener('change', handleMotionChange);

    // Detectar prefers-contrast
    const contrastQuery = window.matchMedia('(prefers-contrast: more)');
    const handleContrastChange = (e) => updates.highContrast(e.matches);
    contrastQuery.addEventListener('change', handleContrastChange);

    // Detectar prefers-color-scheme
    const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleColorSchemeChange = (e) => updates.darkMode(e.matches);
    colorSchemeQuery.addEventListener('change', handleColorSchemeChange);

    // Cleanup
    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
      contrastQuery.removeEventListener('change', handleContrastChange);
      colorSchemeQuery.removeEventListener('change', handleColorSchemeChange);
    };
  }, []);

  return preferences;
}

/**
 * Hook para gestionar el modo de alto contraste manual
 */
function getInitialHighContrast() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('highContrastMode') === 'true';
}

export function useHighContrast() {
  const [highContrastMode, setHighContrastMode] = useState(
    getInitialHighContrast,
  );

  const applyHighContrast = useCallback((enabled) => {
    if (enabled) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, []);

  useEffect(() => {
    if (highContrastMode) {
      applyHighContrast(true);
    }
  }, [highContrastMode, applyHighContrast]);

  const toggleHighContrast = useCallback(() => {
    setHighContrastMode((prev) => {
      const newValue = !prev;
      localStorage.setItem('highContrastMode', String(newValue));
      applyHighContrast(newValue);
      return newValue;
    });
  }, [applyHighContrast]);

  return { highContrastMode, toggleHighContrast };
}

// Contexto para compartir preferencias de accesibilidad
const AccessibilityContext = createContext(null);

export function AccessibilityProvider({ children }) {
  const systemPreferences = useAccessibilityPreferences();
  const { highContrastMode, toggleHighContrast } = useHighContrast();

  const value = {
    ...systemPreferences,
    highContrastMode,
    toggleHighContrast,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  // Siempre llamar useAccessibilityPreferences en el mismo orden
  const systemPrefs = useAccessibilityPreferences();

  if (context) {
    return context;
  }

  return systemPrefs;
}

/**
 * Componente para aplicar clases de reducción de movimiento condicionalmente
 */
export function MotionSafe({ children, className = '' }) {
  const { reducedMotion } = useAccessibilityPreferences();

  return (
    <div className={reducedMotion ? `reduce-motion ${className}` : className}>
      {children}
    </div>
  );
}

/**
 * Componente SkipLink para navegación por teclado
 */
export function SkipLink({ targetId, children }) {
  const handleClick = useCallback(
    (e) => {
      e.preventDefault();
      const target = document.getElementById(targetId);
      if (target) {
        target.focus();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    },
    [targetId],
  );

  return (
    <a href={`#${targetId}`} className="skip-link" onClick={handleClick}>
      {children || 'Saltar al contenido principal'}
    </a>
  );
}

/**
 * Componente LiveRegion para announce de cambios dinámicos a screen readers
 */
export function LiveRegion({
  announce,
  priority = 'polite',
}: {
  announce?: string;
  priority?: 'off' | 'polite' | 'assertive';
}) {
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (announce) {
      // Delay breve para asegurar que el anuncio se capture
      const timer = setTimeout(() => setMessage(announce), 100);
      return () => clearTimeout(timer);
    }
  }, [announce]);

  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}
