export function formatDate(fecha, withTime = false) {
  if (!fecha) return '—';

  // Manejar strings con formato YYYY-MM-DD como fechas locales
  let d;
  if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    const [y, m, day] = fecha.split('-').map(Number);
    d = new Date(y, m - 1, day);
  } else {
    d = new Date(fecha);
  }

  if (isNaN(d.getTime())) return fecha;

  const date = d.toLocaleDateString('es-CL');

  if (!withTime) return date;

  const time = d.toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${date} ${time}`;
}
