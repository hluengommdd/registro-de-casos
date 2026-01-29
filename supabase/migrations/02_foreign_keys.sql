-- =====================================================
-- 02_foreign_keys.sql
-- Constraints y validaciones adicionales
-- =====================================================

-- Estado válido para la columna `cases.status`
ALTER TABLE cases DROP CONSTRAINT IF EXISTS check_case_status;
ALTER TABLE cases ADD CONSTRAINT check_case_status 
  CHECK (status IN ('Reportado', 'En Seguimiento', 'Cerrado', 'Activo'));

-- Categoría de conducta (permite cadena vacía o NULL)
ALTER TABLE cases DROP CONSTRAINT IF EXISTS check_conduct_category;
ALTER TABLE cases ADD CONSTRAINT check_conduct_category 
  CHECK (conduct_category IN ('', 'Leve', 'Grave', 'Gravísima'));

-- Estado de la etapa en los seguimientos
ALTER TABLE case_followups DROP CONSTRAINT IF EXISTS check_stage_status;
ALTER TABLE case_followups ADD CONSTRAINT check_stage_status 
  CHECK (stage_status IN ('Completada', 'Pendiente', 'En Proceso'));

-- Validación de días en SLA (positivo)
ALTER TABLE stage_sla DROP CONSTRAINT IF EXISTS check_days_positive;
ALTER TABLE stage_sla ADD CONSTRAINT check_days_positive 
  CHECK (days_to_due > 0);
