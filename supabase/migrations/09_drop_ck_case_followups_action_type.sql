-- Migration: drop check constraint that restricts action_type values
-- Reason: frontend now allows a richer, mapped set of action_type values; process_stage remains canonical in stage_sla
BEGIN;

ALTER TABLE case_followups
  DROP CONSTRAINT IF EXISTS ck_case_followups_action_type;

COMMIT;
