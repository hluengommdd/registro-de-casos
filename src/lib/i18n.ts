import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Recursos de traducción
const resources = {
  es: {
    translation: {
      // Navigation
      'nav.dashboard': 'Panel Principal',
      'nav.activeCases': 'Casos Activos',
      'nav.closedCases': 'Casos Cerrados',
      'nav.followUps': 'Seguimientos',
      'nav.alerts': 'Alertas de Plazos',
      'nav.statistics': 'Estadísticas',

      // Common
      'common.loading': 'Cargando...',
      'common.save': 'Guardar',
      'common.cancel': 'Cancelar',
      'common.delete': 'Eliminar',
      'common.edit': 'Editar',
      'common.create': 'Crear',
      'common.search': 'Buscar',
      'common.filter': 'Filtrar',
      'common.clear': 'Limpiar',
      'common.close': 'Cerrar',
      'common.confirm': 'Confirmar',
      'common.back': 'Volver',
      'common.retry': 'Reintentar',

      // Cases
      'cases.title': 'Casos',
      'cases.new': 'Nuevo Caso',
      'cases.active': 'Casos Activos',
      'cases.closed': 'Casos Cerrados',
      'cases.empty': 'No hay casos registrados',
      'cases.emptyActive': 'No hay casos activos',
      'cases.emptySearch': 'No se encontraron resultados',
      'cases.student': 'Estudiante',
      'cases.type': 'Tipo de Caso',
      'cases.status': 'Estado',
      'cases.date': 'Fecha',
      'cases.description': 'Descripción',
      'cases.priority': 'Prioridad',
      'cases.assignee': 'Responsable',

      // Status
      'status.en_seguimiento': 'En Seguimiento',
      'status.derivado': 'Derivado',
      'status.cerrado': 'Cerrado',
      'status.en_evaluacion': 'En Evaluación',

      // Follow ups
      'followups.title': 'Seguimientos',
      'followups.new': 'Nuevo Seguimiento',
      'followups.empty': 'Sin seguimientos',
      'followups.add': 'Agregar Seguimiento',

      // Alerts
      'alerts.title': 'Alertas de Plazos',
      'alerts.due': 'Plazo próximo a vencer',
      'alerts.overdue': 'Plazo vencido',
      'alerts.empty': 'No hay alertas',

      // Statistics
      'stats.title': 'Estadísticas',
      'stats.total': 'Total de Casos',
      'stats.active': 'Casos Activos',
      'stats.closed': 'Casos Cerrados',
      'stats.byType': 'Por Tipo',
      'stats.byMonth': 'Por Mes',

      // Errors
      'error.generic': 'Ocurrió un error',
      'error.network': 'Error de conexión',
      'error.notFound': 'No encontrado',
      'error.unauthorized': 'No autorizado',

      // Accessibility
      'a11y.skipLink': 'Saltar al contenido principal',
      'a11y.close': 'Cerrar',
      'a11y.menu': 'Menú',
      'a11y.settings': 'Configuración',
    },
  },
  en: {
    translation: {
      // Navigation
      'nav.dashboard': 'Dashboard',
      'nav.activeCases': 'Active Cases',
      'nav.closedCases': 'Closed Cases',
      'nav.followUps': 'Follow-ups',
      'nav.alerts': 'Deadline Alerts',
      'nav.statistics': 'Statistics',

      // Common
      'common.loading': 'Loading...',
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.create': 'Create',
      'common.search': 'Search',
      'common.filter': 'Filter',
      'common.clear': 'Clear',
      'common.close': 'Close',
      'common.confirm': 'Confirm',
      'common.back': 'Back',
      'common.retry': 'Retry',

      // Cases
      'cases.title': 'Cases',
      'cases.new': 'New Case',
      'cases.active': 'Active Cases',
      'cases.closed': 'Closed Cases',
      'cases.empty': 'No cases registered',
      'cases.emptyActive': 'No active cases',
      'cases.emptySearch': 'No results found',
      'cases.student': 'Student',
      'cases.type': 'Case Type',
      'cases.status': 'Status',
      'cases.date': 'Date',
      'cases.description': 'Description',
      'cases.priority': 'Priority',
      'cases.assignee': 'Assignee',

      // Status
      'status.en_seguimiento': 'In Follow-up',
      'status.derivado': 'Referred',
      'status.cerrado': 'Closed',
      'status.en_evaluacion': 'Under Evaluation',

      // Follow ups
      'followups.title': 'Follow-ups',
      'followups.new': 'New Follow-up',
      'followups.empty': 'No follow-ups',
      'followups.add': 'Add Follow-up',

      // Alerts
      'alerts.title': 'Deadline Alerts',
      'alerts.due': 'Deadline approaching',
      'alerts.overdue': 'Deadline overdue',
      'alerts.empty': 'No alerts',

      // Statistics
      'stats.title': 'Statistics',
      'stats.total': 'Total Cases',
      'stats.active': 'Active Cases',
      'stats.closed': 'Closed Cases',
      'stats.byType': 'By Type',
      'stats.byMonth': 'By Month',

      // Errors
      'error.generic': 'An error occurred',
      'error.network': 'Connection error',
      'error.notFound': 'Not found',
      'error.unauthorized': 'Unauthorized',

      // Accessibility
      'a11y.skipLink': 'Skip to main content',
      'a11y.close': 'Close',
      'a11y.menu': 'Menu',
      'a11y.settings': 'Settings',
    },
  },
};

// Configuración de i18next
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    supportedLngs: ['es', 'en'],

    // Detección de idioma
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },

    // Interpolación
    interpolation: {
      escapeValue: false,
    },

    // React
    react: {
      useSuspense: false,
    },
  });

export default i18n;
