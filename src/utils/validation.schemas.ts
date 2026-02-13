import { z } from 'zod';

/**
 * Esquemas de validación para formularios usando Zod
 */

// Esquema para crear un nuevo caso
export const casoSchema = z.object({
  incident_date: z
    .string()
    .min(1, 'La fecha es requerida')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),

  incident_time: z
    .string()
    .min(1, 'La hora es requerida')
    .regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:MM)'),

  student_id: z.string().uuid('ID de estudiante inválido'),

  course_incident: z.string().min(1, 'El curso es requerido'),

  conduct_type: z.string().min(1, 'El tipo de falta es requerido'),

  conduct_category: z.string().optional().or(z.literal('')),

  short_description: z
    .string()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(1000, 'La descripción no puede exceder 1000 caracteres'),

  responsible: z.string().optional().or(z.literal('')),

  responsible_role: z.string().optional().or(z.literal('')),
});

// Esquema para actualizar un caso
export const casoUpdateSchema = casoSchema.partial().extend({
  status: z.enum(['Reportado', 'En Seguimiento', 'Cerrado']).optional(),
});

// Esquema para filtros de casos
export const casoFiltersSchema = z.object({
  status: z
    .enum(['Reportado', 'En Seguimiento', 'Cerrado', 'Todos'])
    .optional(),
  search: z.string().optional(),
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().positive().max(100).optional().default(10),
});

// Esquema para involucrados
export const involucradoSchema = z.object({
  case_id: z.string().uuid('ID de caso inválido'),
  nombre: z.string().min(1, 'El nombre es requerido'),
  rol: z.enum(['Afectado', 'Agresor', 'Testigo', 'Denunciante']),
  metadata: z.record(z.unknown()).optional(),
});

// Esquema para seguimientos
export const seguimientoSchema = z.object({
  case_id: z.string().uuid('ID de caso inválido'),
  action_type: z.string().min(1, 'El tipo de acción es requerido'),
  process_stage: z.string().optional(),
  detail: z.string().optional(),
  observations: z.string().optional(),
  responsible: z.string().optional(),
  due_date: z.string().optional(),
});

// Funciones helper de validación
export function validateCase(data) {
  return casoSchema.safeParse(data);
}

export function validateCaseUpdate(data) {
  return casoUpdateSchema.safeParse(data);
}

export function validateCaseFilters(data) {
  return casoFiltersSchema.safeParse(data);
}

export function validateInvolucrado(data) {
  return involucradoSchema.safeParse(data);
}

export function validateSeguimiento(data) {
  return seguimientoSchema.safeParse(data);
}

// Obtener errores de forma legible
export function getValidationErrors(zodResult) {
  if (zodResult.success) return null;

  const errors = {};
  for (const error of zodResult.error.errors) {
    const path = error.path.join('.');
    errors[path] = error.message;
  }
  return errors;
}
