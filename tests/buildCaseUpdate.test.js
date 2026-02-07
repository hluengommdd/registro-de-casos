import { describe, it, expect } from 'vitest';
import { buildCaseUpdate } from '../src/api/db.js';

describe('buildCaseUpdate', () => {
  it('does not include student_name for payload student data', () => {
    const payload = { students: { name: 'Juan' } };
    const result = buildCaseUpdate(payload);
    expect(result).not.toHaveProperty('student_name');
  });
});
