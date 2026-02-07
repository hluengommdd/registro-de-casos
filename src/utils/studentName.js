export function getStudentName(value, fallback = 'N/A') {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') {
    return value || fallback;
  }

  if (typeof value === 'object') {
    // Prefer explicit `name`
    if (value.name && typeof value.name === 'string') return value.name;

    // Try common name parts
    const first =
      value.first_name || value.firstName || value.Nombre || value.nombre || '';
    const last = value.last_name || value.lastName || value.Apellido || '';
    const full = `${first} ${last}`.trim();
    if (full) return full;

    // Other possible combined name sources
    if (value.fullName && typeof value.fullName === 'string')
      return value.fullName;
    if (value.full_name && typeof value.full_name === 'string')
      return value.full_name;
    if (value.displayName && typeof value.displayName === 'string')
      return value.displayName;
  }

  try {
    return String(value) || fallback;
  } catch {
    return fallback;
  }
}

export default getStudentName;
