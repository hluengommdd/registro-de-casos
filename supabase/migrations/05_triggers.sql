-- =====================================================
-- 05_triggers.sql
-- Triggers para automatización
-- Ejecutar DESPUÉS de 04_functions.sql
-- =====================================================

-- =====================================================
-- FUNCIÓN: update_updated_at_column
-- Actualiza automáticamente la columna updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column IS 'Trigger function para actualizar updated_at automáticamente';

-- =====================================================
-- TRIGGERS PARA updated_at EN TODAS LAS TABLAS
-- =====================================================

-- Trigger para students
DROP TRIGGER IF EXISTS trigger_students_updated_at ON students;
CREATE TRIGGER trigger_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para cases
DROP TRIGGER IF EXISTS trigger_cases_updated_at ON cases;
CREATE TRIGGER trigger_cases_updated_at
  BEFORE UPDATE ON cases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para case_followups
DROP TRIGGER IF EXISTS trigger_followups_updated_at ON case_followups;
CREATE TRIGGER trigger_followups_updated_at
  BEFORE UPDATE ON case_followups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para followup_evidence
DROP TRIGGER IF EXISTS trigger_evidence_updated_at ON followup_evidence;
CREATE TRIGGER trigger_evidence_updated_at
  BEFORE UPDATE ON followup_evidence
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para stage_sla
DROP TRIGGER IF EXISTS trigger_stage_sla_updated_at ON stage_sla;
CREATE TRIGGER trigger_stage_sla_updated_at
  BEFORE UPDATE ON stage_sla
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para involucrados
DROP TRIGGER IF EXISTS trigger_involucrados_updated_at ON involucrados;
CREATE TRIGGER trigger_involucrados_updated_at
  BEFORE UPDATE ON involucrados
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCIÓN: auto_close_case_on_status
-- Actualiza closed_at cuando el estado cambia a 'Cerrado'
-- =====================================================
CREATE OR REPLACE FUNCTION auto_close_case_on_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el estado cambia a 'Cerrado' y no tiene closed_at
  IF NEW.status = 'Cerrado' AND (OLD.status IS DISTINCT FROM 'Cerrado') AND NEW.closed_at IS NULL THEN
    NEW.closed_at = NOW();
  END IF;
  
  -- Si el estado deja de ser 'Cerrado', limpiar closed_at
  IF NEW.status != 'Cerrado' AND OLD.status = 'Cerrado' THEN
    NEW.closed_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_close_case_on_status IS 'Actualiza automáticamente closed_at cuando un caso se cierra';

-- Trigger para auto-cerrar casos
DROP TRIGGER IF EXISTS trigger_auto_close_case ON cases;
CREATE TRIGGER trigger_auto_close_case
  BEFORE UPDATE ON cases
  FOR EACH ROW
  EXECUTE FUNCTION auto_close_case_on_status();

-- =====================================================
-- Fin de triggers
-- =====================================================
