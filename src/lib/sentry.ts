import * as Sentry from '@sentry/react';

/**
 * Configuración de Sentry para monitoreo de errores
 *
 * Para usar en producción:
 * 1. Crear cuenta en sentry.io
 * 2. Crear proyecto React
 * 3. Reemplazar DSN con el valor de Sentry
 */
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || '';

// Configuración del release (versión de la app)
const RELEASE = import.meta.env.VITE_APP_VERSION || '1.0.0';

export function initSentry() {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN no configurado. Monitoring deshabilitado.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    release: `convivencia-escolar@${RELEASE}`,
    environment: import.meta.env.MODE || 'development',

    // Configuración de integrations
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],

    // Configuración de采样aje
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,

    // Configuración de Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Filtrado de errores
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      /Network Error/i,
      /fetch failed/i,
    ],

    // Hooks beforeSend para sanitizar datos
    beforeSend(event, hint) {
      // No enviar errores en desarrollo
      if (import.meta.env.MODE === 'development') {
        return null;
      }

      // Loggear error localmente
      console.error('[Sentry]', event, hint);

      return event;
    },
  });
}

// Componente wrapper para capturar errores en componentes
export const SentryErrorBoundary = Sentry.ErrorBoundary;

// Función para capturar errores manualmente
export function captureException(error, context = {}) {
  if (SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  }
  console.error('[Error]', error, context);
}

// Función para capturar mensajes
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
) {
  if (SENTRY_DSN) {
    Sentry.captureMessage(message, level);
  }
  console.log(`[${level}]`, message);
}

// Track de пользователя (para analytics)
export function setUser(user) {
  if (SENTRY_DSN && user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.name,
    });
  }
}

export default Sentry;
