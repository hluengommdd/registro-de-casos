import { describe, it, expect } from 'vitest';
import { buildCaseUpdate } from '../src/api/db.js';

describe('buildCaseUpdate', () => {
  it('extracts student_name string when Estudiante_Responsable is object', () => {
    const fields = { Estudiante_Responsable: { name: 'Juan' }, Descripcion: 'x' };
    const result = buildCaseUpdate(fields);
    expect(result.student_name).toBe('Juan');
  });

  it('uses string when Estudiante_Responsable is string', () => {
    const fields = { Estudiante_Responsable: 'Pedro' };
    const result = buildCaseUpdate(fields);
    expect(result.student_name).toBe('Pedro');
  });
});
