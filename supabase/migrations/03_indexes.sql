CREATE INDEX idx_students_name ON students(name);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_case_followups_case_id ON case_followups(case_id);
CREATE INDEX idx_followup_evidence_followup_id ON followup_evidence(followup_id);
CREATE INDEX idx_involucrados_case_id ON involucrados(case_id);
CREATE INDEX idx_stage_sla_stage_id ON stage_sla(stage_id);
