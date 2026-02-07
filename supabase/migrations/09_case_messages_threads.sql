-- Campos para hilos y urgencias en comentarios internos
ALTER TABLE case_messages
ADD COLUMN IF NOT EXISTS parent_id uuid;

ALTER TABLE case_messages
ADD COLUMN IF NOT EXISTS is_urgent boolean NOT NULL DEFAULT false;

ALTER TABLE case_messages
ADD COLUMN IF NOT EXISTS user_id uuid;

CREATE INDEX IF NOT EXISTS idx_case_messages_parent
ON case_messages(case_id, parent_id);
