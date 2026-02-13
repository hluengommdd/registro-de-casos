export function getCaseStatus(caso, fallback = '') {
  const raw = caso?.status ?? '';
  return String(raw || fallback)
    .trim()
    .toLowerCase();
}

const STATUS_LABELS = {
  reportado: 'Reportado',
  'en seguimiento': 'En seguimiento',
  cerrado: 'Cerrado',
  pendiente: 'Pendiente',
};

function toTitleCase(value) {
  return String(value)
    .split(' ')
    .map((part) =>
      part ? part[0].toUpperCase() + part.slice(1).toLowerCase() : part,
    )
    .join(' ');
}

export function getCaseStatusLabel(caso, fallback = 'Reportado') {
  const status = getCaseStatus(caso, '');
  if (!status) return fallback;
  return STATUS_LABELS[status] || toTitleCase(status);
}
