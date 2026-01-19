-- Índices optimizados basados en tu aplicación
CREATE INDEX IF NOT EXISTS idx_students_full_name ON students USING GIN (to_tsvector('spanish', first_name || ' ' || last_name));
CREATE INDEX IF NOT EXISTS idx_students_rut ON students(rut);

CREATE INDEX IF NOT EXISTS idx_cases_student_id ON cases(student_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_incident_date ON cases(incident_date DESC);
CREATE INDEX IF NOT EXISTS idx_cases_conduct_type ON cases(conduct_type);
CREATE INDEX IF NOT EXISTS idx_cases_seguimiento_started_at ON cases(seguimiento_started_at) WHERE seguimiento_started_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_followups_case_id ON case_followups(case_id);
CREATE INDEX IF NOT EXISTS idx_followups_action_date ON case_followups(action_date DESC);
CREATE INDEX IF NOT EXISTS idx_followups_process_stage ON case_followups(process_stage);
CREATE INDEX IF NOT EXISTS idx_followups_responsible ON case_followups(responsible);
CREATE INDEX IF NOT EXISTS idx_followups_due_date ON case_followups(due_date) WHERE due_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_evidence_case_id ON followup_evidence(case_id);
CREATE INDEX IF NOT EXISTS idx_evidence_followup_id ON followup_evidence(followup_id);

CREATE INDEX IF NOT EXISTS idx_involucrados_caso_id ON involucrados(caso_id);
CREATE INDEX IF NOT EXISTS idx_involucrados_rol ON involucrados(rol);
