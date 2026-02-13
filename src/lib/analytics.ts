/**
 * Módulo de analytics para tracking de eventos
 *
 * Implementa un sistema de analytics liviano sin dependencias externas
 * Puede integrarse con Google Analytics, Plausible, PostHog, etc.
 */

const ANALYTICS_ID = import.meta.env.VITE_GA_ID || '';

declare global {
  interface Window {
    gtag?: (command: string, eventName: string, params?: unknown) => void;
  }
}

// Cola de eventos para modo offline
let eventQueue = [];
let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

/**
 * Inicializa el módulo de analytics
 */
export function initAnalytics() {
  if (typeof window === 'undefined') return;

  // Listener para cambios de conexión
  window.addEventListener('online', () => {
    isOnline = true;
    flushQueue();
  });

  window.addEventListener('offline', () => {
    isOnline = false;
  });
}

/**
 * Trackea un evento
 * @param {string} eventName - Nombre del evento
 * @param {Object} params - Parámetros del evento
 */
export function trackEvent(eventName, params = {}) {
  const event = {
    name: eventName,
    params: {
      ...params,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
    },
  };

  // Si no hay GA ID, solo loggear
  if (!ANALYTICS_ID) {
    console.log('[Analytics]', event);
    return;
  }

  // Modo offline: guardar en cola
  if (!isOnline) {
    eventQueue.push(event);
    return;
  }

  // Enviar a Google Analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, event.params);
  }
}

// Alias para trackPageView
export function trackPageView(pagePath, pageTitle) {
  trackEvent('page_view', {
    page_path: pagePath,
    page_title: pageTitle,
  });
}

// Track de excepciones
export function trackException(description, fatal = false) {
  trackEvent('exception', {
    description,
    fatal,
  });
}

// Flush de eventos offline
function flushQueue() {
  while (eventQueue.length > 0) {
    const event = eventQueue.shift();
    trackEvent(event.name, event.params);
  }
}

// Categorías de eventos predefinidas
export const EventCategories = {
  // Casos
  CASE_CREATED: 'case_created',
  CASE_UPDATED: 'case_updated',
  CASE_CLOSED: 'case_closed',

  // Navegación
  PAGE_VIEW: 'page_view',
  NAVIGATION: 'navigation',

  // Acciones de usuario
  BUTTON_CLICK: 'button_click',
  FORM_SUBMIT: 'form_submit',
  SEARCH: 'search',

  // Errores
  ERROR: 'error',
  EXCEPTION: 'exception',
};

// Hook para tracking de páginas
export function usePageTracking(currentPath, pageTitle) {
  if (typeof window !== 'undefined') {
    trackPageView(currentPath, pageTitle);
  }
}

export default {
  init: initAnalytics,
  track: trackEvent,
  trackPageView,
  trackException,
  categories: EventCategories,
};
