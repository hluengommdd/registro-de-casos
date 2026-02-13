import { describe, it, expect } from 'vitest';
import {
  validateCase,
  validateInvolucrado,
  validateSeguimiento,
  getValidationErrors,
} from './validation.schemas';

describe('validation.schemas', () => {
  describe('validateCase', () => {
    it('validates a valid case', () => {
      const validData = {
        incident_date: '2024-01-15',
        incident_time: '09:30',
        student_id: '123e4567-e89b-12d3-a456-426614174000',
        course_incident: '8vo Básico A',
        conduct_type: 'Grave',
        short_description: 'Descripción del incidente de más de 10 caracteres',
      };

      const result = validateCase(validData);
      expect(result.success).toBe(true);
    });

    it('rejects case without required fields', () => {
      const invalidData = {
        incident_date: '',
        incident_time: '',
        student_id: '',
        course_incident: '',
        conduct_type: '',
        short_description: 'corta',
      };

      const result = validateCase(invalidData);
      expect(result.success).toBe(false);
      expect(result.error.errors).toHaveLength(6);
    });

    it('validates date format', () => {
      const invalidDate = {
        incident_date: '15-01-2024',
        incident_time: '09:30',
        student_id: '123e4567-e89b-12d3-a456-426614174000',
        course_incident: '8vo Básico A',
        conduct_type: 'Grave',
        short_description: 'Descripción válida del incidente',
      };

      const result = validateCase(invalidDate);
      expect(result.success).toBe(false);
    });

    it('validates UUID format for student_id', () => {
      const invalidUUID = {
        incident_date: '2024-01-15',
        incident_time: '09:30',
        student_id: 'not-a-uuid',
        course_incident: '8vo Básico A',
        conduct_type: 'Grave',
        short_description: 'Descripción del incidente de más de 10 caracteres',
      };

      const result = validateCase(invalidUUID);
      expect(result.success).toBe(false);
    });
  });

  describe('validateInvolucrado', () => {
    it('validates a valid involucrado', () => {
      const validData = {
        case_id: '123e4567-e89b-12d3-a456-426614174000',
        nombre: 'Juan Pérez',
        rol: 'Afectado',
      };

      const result = validateInvolucrado(validData);
      expect(result.success).toBe(true);
    });

    it('validates rol enum', () => {
      const invalidRol = {
        case_id: '123e4567-e89b-12d3-a456-426614174000',
        nombre: 'Juan Pérez',
        rol: 'RolInválido',
      };

      const result = validateInvolucrado(invalidRol);
      expect(result.success).toBe(false);
    });
  });

  describe('validateSeguimiento', () => {
    it('validates required action_type', () => {
      const invalidData = {
        case_id: '123e4567-e89b-12d3-a456-426614174000',
        action_type: '',
      };

      const result = validateSeguimiento(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('getValidationErrors', () => {
    it('converts zod errors to readable format', () => {
      const invalidData = {
        incident_date: '',
        student_id: 'invalid',
      };

      const result = validateCase(invalidData);
      const errors = getValidationErrors(result);

      expect(errors).toHaveProperty('incident_date');
      expect(errors).toHaveProperty('student_id');
    });

    it('returns null for successful validation', () => {
      const validData = {
        incident_date: '2024-01-15',
        incident_time: '09:30',
        student_id: '123e4567-e89b-12d3-a456-426614174000',
        course_incident: '8vo Básico A',
        conduct_type: 'Grave',
        short_description: 'Descripción del incidente de más de 10 caracteres',
      };

      const result = validateCase(validData);
      const errors = getValidationErrors(result);

      expect(errors).toBeNull();
    });
  });
});
