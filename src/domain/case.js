export function normalizeStudent(studentLike) {
  if (!studentLike) return null;

  if (typeof studentLike === 'string') return { name: studentLike };

  if (typeof studentLike === 'object') {
    const name =
      studentLike.name ||
      studentLike.Nombre ||
      studentLike.nombre ||
      studentLike.fullName ||
      (studentLike.first_name &&
        `${studentLike.first_name} ${studentLike.last_name}`) ||
      null;

    return { ...studentLike, name };
  }

  return { name: String(studentLike) };
}

export function normalizeCase(raw) {
  const fields = raw?.fields ?? raw ?? {};
  const estudiante = normalizeStudent(fields.Estudiante_Responsable);

  return {
    id: raw?.id ?? fields.id ?? null,
    ...raw,
    fields: {
      ...fields,
      Estudiante_Responsable: estudiante,
    },
  };
}
