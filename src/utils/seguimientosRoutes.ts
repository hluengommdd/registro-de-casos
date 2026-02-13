export function buildSeguimientoListPath() {
  return '/seguimientos';
}

export function buildSeguimientoDetailPath(caseId) {
  return `/seguimientos/${caseId}`;
}

export function buildSeguimientoListByStudentPath(studentName) {
  const q = encodeURIComponent(String(studentName || '').trim());
  return q ? `/seguimientos?estudiante=${q}` : '/seguimientos';
}
