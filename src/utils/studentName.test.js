import { describe, it, expect } from 'vitest';
import { getStudentName } from './studentName';

describe('getStudentName', () => {
  it('returns string when input is string', () => {
    const v = getStudentName('Juan', 'N/A');
    expect(typeof v).toBe('string');
    expect(v).toBe('Juan');
  });

  it('returns name when input is object with name', () => {
    const v = getStudentName({ name: 'María' }, 'N/A');
    expect(typeof v).toBe('string');
    expect(v).toBe('María');
  });

  it('builds full name from first_name/last_name', () => {
    const v = getStudentName({ first_name: 'A', last_name: 'B' }, 'N/A');
    expect(typeof v).toBe('string');
    expect(v).toBe('A B');
  });

  it('returns fallback for null', () => {
    const v = getStudentName(null, 'N/A');
    expect(typeof v).toBe('string');
    expect(v).toBe('N/A');
  });
});
