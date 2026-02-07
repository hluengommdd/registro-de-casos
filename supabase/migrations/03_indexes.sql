-- =====================================================
-- 03_indexes.sql
-- Índices para optimizar consultas frecuentes
-- Ejecutar DESPUÉS de 02_foreign_keys.sql
-- =====================================================

-- =====================================================
-- ÍNDICES EN TABLA: students
-- =====================================================
-- Full-text sobre nombre completo (maneja NULLs)
CREATE INDEX IF NOT EXISTS idx_students_full_name
  ON students USING GIN (to_tsvector('spanish', coalesce(first_name,'') || ' ' || coalesce(last_name,'')));

-- Índice sobre RUT (si existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'rut'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_students_rut ON students(rut)';
  END IF;
END
$$;

-- Índices seguros para columnas de nivel/curso (varían por frontend: level/course o grade)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'level'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_students_level ON students(level)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'course'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_students_course ON students(course)';
  END IF;

  -- backward-compat: si existe 'grade' (posible nombre anterior)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'grade'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_students_grade ON students(grade)';
  END IF;
END
$$;

-- =====================================================
-- ÍNDICES EN TABLA: cases
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_cases_student_id ON cases(student_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_incident_date ON cases(incident_date DESC);
CREATE INDEX IF NOT EXISTS idx_cases_conduct_type ON cases(conduct_type);
CREATE INDEX IF NOT EXISTS idx_cases_conduct_category ON cases(conduct_category);
CREATE INDEX IF NOT EXISTS idx_cases_course_incident ON cases(course_incident);
CREATE INDEX IF NOT EXISTS idx_cases_seguimiento_started_at ON cases(seguimiento_started_at) WHERE seguimiento_started_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cases_indagacion_due_date ON cases(indagacion_due_date) WHERE indagacion_due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cases_closed_at ON cases(closed_at) WHERE closed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cases_legacy_number ON cases(legacy_case_number) WHERE legacy_case_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at DESC);

-- =====================================================
-- ÍNDICES EN TABLA: case_followups
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_followups_case_id ON case_followups(case_id);
CREATE INDEX IF NOT EXISTS idx_followups_action_date ON case_followups(action_date DESC);
CREATE INDEX IF NOT EXISTS idx_followups_process_stage ON case_followups(process_stage);
CREATE INDEX IF NOT EXISTS idx_followups_stage_status ON case_followups(stage_status);
CREATE INDEX IF NOT EXISTS idx_followups_action_type ON case_followups(action_type);
CREATE INDEX IF NOT EXISTS idx_followups_responsible ON case_followups(responsible);
CREATE INDEX IF NOT EXISTS idx_followups_due_date ON case_followups(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_followups_created_at ON case_followups(created_at DESC);

-- Índice compuesto para búsquedas por caso y fecha
CREATE INDEX IF NOT EXISTS idx_followups_case_date ON case_followups(case_id, action_date DESC);
-- Índice para búsquedas por caso y etapa
CREATE INDEX IF NOT EXISTS idx_followups_case_stage ON case_followups(case_id, process_stage);

-- =====================================================
-- ÍNDICES EN TABLA: followup_evidence
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_evidence_case_id ON followup_evidence(case_id);
CREATE INDEX IF NOT EXISTS idx_evidence_followup_id ON followup_evidence(followup_id);
CREATE INDEX IF NOT EXISTS idx_evidence_storage_path ON followup_evidence(storage_path);
CREATE INDEX IF NOT EXISTS idx_evidence_created_at ON followup_evidence(created_at DESC);

-- =====================================================
-- ÍNDICES EN TABLA: involucrados
-- =====================================================
-- Crear índice sobre case_id o caso_id según exista (no romper frontend)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'involucrados' AND column_name = 'case_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_involucrados_case_id ON involucrados(case_id)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'involucrados' AND column_name = 'caso_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_involucrados_caso_id ON involucrados(caso_id)';
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_involucrados_rol ON involucrados(rol);
CREATE INDEX IF NOT EXISTS idx_involucrados_nombre ON involucrados USING GIN (to_tsvector('spanish', coalesce(nombre,'')));
CREATE INDEX IF NOT EXISTS idx_involucrados_curso ON involucrados(curso);

-- =====================================================
-- ÍNDICES EN TABLA: process_stages
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_process_stages_order ON process_stages(stage_order);
CREATE INDEX IF NOT EXISTS idx_process_stages_name ON process_stages(stage_name);

-- =====================================================
-- ÍNDICES EN TABLA: stage_sla
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_stage_sla_stage_key ON stage_sla(stage_key);
CREATE INDEX IF NOT EXISTS idx_stage_sla_days ON stage_sla(days_to_due);

-- =====================================================
-- Fin de índices
-- =====================================================
