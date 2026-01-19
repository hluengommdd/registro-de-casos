-- =====================================================
-- 05_triggers.sql
-- Triggers para automatización de campos
-- =====================================================

-- Función trigger para actualizar automáticamente el campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column IS 'Función auxiliar para actualizar automáticamente el campo updated_at';

-- Trigger para tabla cases
DROP TRIGGER IF EXISTS trigger_cases_updated_at ON cases;
CREATE TRIGGER trigger_cases_updated_at
  BEFORE UPDATE ON cases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TRIGGER trigger_cases_updated_at ON cases IS 'Actualiza automáticamente updated_at al modificar un caso';

-- Trigger para tabla case_followups
DROP TRIGGER IF EXISTS trigger_case_followups_updated_at ON case_followups;
CREATE TRIGGER trigger_case_followups_updated_at
  BEFORE UPDATE ON case_followups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TRIGGER trigger_case_followups_updated_at ON case_followups IS 'Actualiza automáticamente updated_at al modificar un seguimiento';

-- Nota: La tabla students no tiene updated_at en el esquema actual,
-- pero si se agrega en el futuro, descomentar lo siguiente:
-- DROP TRIGGER IF EXISTS trigger_students_updated_at ON students;
-- CREATE TRIGGER trigger_students_updated_at
--   BEFORE UPDATE ON students
--   FOR EACH ROW
--   EXECUTE FUNCTION update_updated_at_column();
