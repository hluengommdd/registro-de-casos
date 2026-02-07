import { parseLocalDate } from './dateUtils';

export function formatDate(fecha, withTime = false) {
  if (!fecha) return '—';

  const d = parseLocalDate(fecha);
  if (!d) return String(fecha);

  const date = d.toLocaleDateString('es-CL');
  if (!withTime) return date;

  const time = d.toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${date} ${time}`;
}
