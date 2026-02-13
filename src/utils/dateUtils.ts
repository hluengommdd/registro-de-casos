// Trunca una fecha a medianoche local para evitar desfases por hora/zona
export function toStartOfDay(d) {
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return null;
  x.setHours(0, 0, 0, 0);
  return x;
}

// Parsea fechas YYYY-MM-DD como fecha local y otras fechas con Date()
export function parseLocalDate(value) {
  if (!value) return null;
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? null : value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    const [y, m, d] = String(value).split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Diferencia en días enteros, robusta a timezone (usa medianoche local)
export function diffDays(fromDate, toDate = new Date()) {
  if (!fromDate) return null;
  const a = toStartOfDay(fromDate);
  const b = toStartOfDay(toDate);
  if (!a || !b) return null;
  const ms = b.getTime() - a.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

// Texto "hace X días" simple y consistente
export function haceXDiasLabel(dias) {
  if (dias === null || dias === undefined) return null;
  if (dias <= 0) return 'hoy';
  if (dias === 1) return 'hace 1 día';
  return `hace ${dias} días`;
}
