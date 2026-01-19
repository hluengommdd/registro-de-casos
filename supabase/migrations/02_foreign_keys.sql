-- =====================================================
-- 02_foreign_keys.sql
-- Claves foráneas para mantener integridad referencial
-- =====================================================

-- Foreign key: cases -> students
ALTER TABLE cases
  DROP CONSTRAINT IF EXISTS fk_cases_student_id,
  ADD CONSTRAINT fk_cases_student_id
  FOREIGN KEY (student_id)
  REFERENCES students(id)
  ON DELETE CASCADE;

COMMENT ON CONSTRAINT fk_cases_student_id ON cases IS 'Relación con el estudiante principal del caso';

-- Foreign key: case_followups -> cases
ALTER TABLE case_followups
  DROP CONSTRAINT IF EXISTS fk_case_followups_case_id,
  ADD CONSTRAINT fk_case_followups_case_id
  FOREIGN KEY (case_id)
  REFERENCES cases(id)
  ON DELETE CASCADE;

COMMENT ON CONSTRAINT fk_case_followups_case_id ON case_followups IS 'Relación con el caso al que pertenece el seguimiento';

-- Foreign key: followup_evidence -> cases
ALTER TABLE followup_evidence
  DROP CONSTRAINT IF EXISTS fk_followup_evidence_case_id,
  ADD CONSTRAINT fk_followup_evidence_case_id
  FOREIGN KEY (case_id)
  REFERENCES cases(id)
  ON DELETE CASCADE;

COMMENT ON CONSTRAINT fk_followup_evidence_case_id ON followup_evidence IS 'Relación con el caso de la evidencia';

-- Foreign key: followup_evidence -> case_followups
ALTER TABLE followup_evidence
  DROP CONSTRAINT IF EXISTS fk_followup_evidence_followup_id,
  ADD CONSTRAINT fk_followup_evidence_followup_id
  FOREIGN KEY (followup_id)
  REFERENCES case_followups(id)
  ON DELETE CASCADE;

COMMENT ON CONSTRAINT fk_followup_evidence_followup_id ON followup_evidence IS 'Relación con el seguimiento de la evidencia';

-- Foreign key: involucrados -> cases
ALTER TABLE involucrados
  DROP CONSTRAINT IF EXISTS fk_involucrados_caso_id,
  ADD CONSTRAINT fk_involucrados_caso_id
  FOREIGN KEY (caso_id)
  REFERENCES cases(id)
  ON DELETE CASCADE;

COMMENT ON CONSTRAINT fk_involucrados_caso_id ON involucrados IS 'Relación con el caso del involucrado';
