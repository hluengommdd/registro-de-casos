-- =====================================================
-- 03_indexes.sql
-- Índices para optimizar consultas frecuentes
-- =====================================================

-- Índice para búsquedas de casos por estudiante
CREATE INDEX IF NOT EXISTS idx_cases_student_id
  ON cases(student_id);

COMMENT ON INDEX idx_cases_student_id IS 'Optimiza búsquedas de casos por estudiante';

-- Índice para búsquedas de seguimientos por caso
CREATE INDEX IF NOT EXISTS idx_case_followups_case_id
  ON case_followups(case_id);

COMMENT ON INDEX idx_case_followups_case_id IS 'Optimiza búsquedas de seguimientos por caso';

-- Índice para búsquedas de evidencias por seguimiento
CREATE INDEX IF NOT EXISTS idx_followup_evidence_followup_id
  ON followup_evidence(followup_id);

COMMENT ON INDEX idx_followup_evidence_followup_id IS 'Optimiza búsquedas de evidencias por seguimiento';

-- Índice para búsquedas de evidencias por caso
CREATE INDEX IF NOT EXISTS idx_followup_evidence_case_id
  ON followup_evidence(case_id);

COMMENT ON INDEX idx_followup_evidence_case_id IS 'Optimiza búsquedas de evidencias por caso';

-- Índice para filtros por estado de caso
CREATE INDEX IF NOT EXISTS idx_cases_status
  ON cases(status);

COMMENT ON INDEX idx_cases_status IS 'Optimiza filtros por estado de caso (Activo, Cerrado, etc.)';

-- Índice para ordenamiento y filtros por fecha de incidente
CREATE INDEX IF NOT EXISTS idx_cases_incident_date
  ON cases(incident_date DESC);

COMMENT ON INDEX idx_cases_incident_date IS 'Optimiza ordenamiento y filtros por fecha de incidente';

-- Índice para búsquedas de involucrados por caso
CREATE INDEX IF NOT EXISTS idx_involucrados_caso_id
  ON involucrados(caso_id);

COMMENT ON INDEX idx_involucrados_caso_id IS 'Optimiza búsquedas de involucrados por caso';

-- Índice para búsquedas de estudiantes por curso
CREATE INDEX IF NOT EXISTS idx_students_course
  ON students(course);

COMMENT ON INDEX idx_students_course IS 'Optimiza búsquedas de estudiantes por curso';

-- Índice para ordenamiento de seguimientos por fecha
CREATE INDEX IF NOT EXISTS idx_case_followups_action_date
  ON case_followups(action_date DESC);

COMMENT ON INDEX idx_case_followups_action_date IS 'Optimiza ordenamiento de seguimientos por fecha';

-- Índice compuesto para consultas de casos activos por fecha
CREATE INDEX IF NOT EXISTS idx_cases_status_incident_date
  ON cases(status, incident_date DESC);

COMMENT ON INDEX idx_cases_status_incident_date IS 'Optimiza consultas de casos por estado y fecha';
