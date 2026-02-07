-- Agregar etapa del debido proceso a mensajes
ALTER TABLE case_messages
ADD COLUMN IF NOT EXISTS process_stage text;
