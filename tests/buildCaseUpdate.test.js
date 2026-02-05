import { describe, it, expect } from 'vitest';
import { buildCaseUpdate } from '../src/api/db.js';

describe('buildCaseUpdate', () => {
  it('does not include student_name for Estudiante_Responsable', () => {
    const fields = { Estudiante_Responsable: { name: 'Juan' } };
    const result = buildCaseUpdate(fields);
    expect(result).not.toHaveProperty('student_name');
  });
});
