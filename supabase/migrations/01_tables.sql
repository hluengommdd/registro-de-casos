-- =====================================================
-- 01_tables.sql
-- Definición de todas las tablas del sistema
-- =====================================================

-- Tabla: students
-- Almacena información de los estudiantes del colegio
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rut TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  level TEXT,
  course TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE students IS 'Estudiantes del establecimiento';
COMMENT ON COLUMN students.id IS 'Identificador único del estudiante';
COMMENT ON COLUMN students.rut IS 'RUT del estudiante (opcional)';
COMMENT ON COLUMN students.first_name IS 'Nombre(s) del estudiante';
COMMENT ON COLUMN students.last_name IS 'Apellido(s) del estudiante';
COMMENT ON COLUMN students.level IS 'Nivel educativo (ej: Primaria, Secundaria)';
COMMENT ON COLUMN students.course IS 'Curso del estudiante (ej: 5A BASICO, 1A MEDIO)';

-- Tabla: cases
-- Almacena los casos de convivencia escolar
CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL,
  legacy_case_number TEXT,
  incident_date DATE NOT NULL,
  incident_time TEXT,
  course_incident TEXT,
  conduct_type TEXT,
  conduct_category TEXT,
  short_description TEXT,
  status TEXT DEFAULT 'Reportado',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  indagacion_start_date DATE,
  indagacion_due_date DATE,
  seguimiento_started_at TIMESTAMPTZ,
  due_process_closed_at TIMESTAMPTZ
);

COMMENT ON TABLE cases IS 'Casos de convivencia escolar';
COMMENT ON COLUMN cases.id IS 'Identificador único del caso';
COMMENT ON COLUMN cases.student_id IS 'ID del estudiante principal involucrado';
COMMENT ON COLUMN cases.legacy_case_number IS 'Número de caso heredado de sistema anterior (opcional)';
COMMENT ON COLUMN cases.incident_date IS 'Fecha del incidente';
COMMENT ON COLUMN cases.incident_time IS 'Hora del incidente';
COMMENT ON COLUMN cases.course_incident IS 'Curso donde ocurrió el incidente';
COMMENT ON COLUMN cases.conduct_type IS 'Tipo de conducta (Leve, Grave, Muy Grave, Gravísima)';
COMMENT ON COLUMN cases.conduct_category IS 'Categoría específica de la conducta';
COMMENT ON COLUMN cases.short_description IS 'Descripción breve del incidente';
COMMENT ON COLUMN cases.status IS 'Estado del caso (Reportado, Activo, En Seguimiento, Cerrado)';
COMMENT ON COLUMN cases.closed_at IS 'Fecha y hora de cierre del caso';
COMMENT ON COLUMN cases.indagacion_start_date IS 'Fecha de inicio de la indagación';
COMMENT ON COLUMN cases.indagacion_due_date IS 'Fecha límite para completar indagación';
COMMENT ON COLUMN cases.seguimiento_started_at IS 'Fecha y hora de inicio del debido proceso';
COMMENT ON COLUMN cases.due_process_closed_at IS 'Fecha y hora de cierre del debido proceso';

-- Tabla: case_followups
-- Almacena los seguimientos y acciones realizadas en cada caso
CREATE TABLE IF NOT EXISTS case_followups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL,
  action_date DATE NOT NULL,
  action_type TEXT NOT NULL,
  process_stage TEXT NOT NULL,
  detail TEXT,
  responsible TEXT,
  stage_status TEXT NOT NULL,
  observations TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date DATE,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  action_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ
);

COMMENT ON TABLE case_followups IS 'Seguimientos y acciones realizadas en los casos';
COMMENT ON COLUMN case_followups.id IS 'Identificador único del seguimiento';
COMMENT ON COLUMN case_followups.case_id IS 'ID del caso al que pertenece este seguimiento';
COMMENT ON COLUMN case_followups.action_date IS 'Fecha de la acción';
COMMENT ON COLUMN case_followups.action_type IS 'Tipo de acción (Seguimiento, Entrevista Estudiante, etc.)';
COMMENT ON COLUMN case_followups.process_stage IS 'Etapa del debido proceso (ej: 1. Comunicación/Denuncia)';
COMMENT ON COLUMN case_followups.detail IS 'Detalle de la acción realizada';
COMMENT ON COLUMN case_followups.responsible IS 'Responsable de la acción';
COMMENT ON COLUMN case_followups.stage_status IS 'Estado de la etapa (Completada, Pendiente, etc.)';
COMMENT ON COLUMN case_followups.observations IS 'Observaciones adicionales';
COMMENT ON COLUMN case_followups.due_date IS 'Fecha límite para completar esta etapa';
COMMENT ON COLUMN case_followups.description IS 'Descripción adicional';

-- Tabla: followup_evidence
-- Almacena metadatos de archivos de evidencia asociados a seguimientos
CREATE TABLE IF NOT EXISTS followup_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL,
  followup_id UUID NOT NULL,
  storage_bucket TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  content_type TEXT,
  file_size BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE followup_evidence IS 'Evidencias (archivos) asociadas a seguimientos';
COMMENT ON COLUMN followup_evidence.id IS 'Identificador único de la evidencia';
COMMENT ON COLUMN followup_evidence.case_id IS 'ID del caso al que pertenece la evidencia';
COMMENT ON COLUMN followup_evidence.followup_id IS 'ID del seguimiento al que pertenece la evidencia';
COMMENT ON COLUMN followup_evidence.storage_bucket IS 'Nombre del bucket de Supabase Storage';
COMMENT ON COLUMN followup_evidence.storage_path IS 'Ruta del archivo en el storage';
COMMENT ON COLUMN followup_evidence.file_name IS 'Nombre original del archivo';
COMMENT ON COLUMN followup_evidence.content_type IS 'Tipo MIME del archivo';
COMMENT ON COLUMN followup_evidence.file_size IS 'Tamaño del archivo en bytes';

-- Tabla: involucrados
-- Almacena información de personas involucradas en los casos
CREATE TABLE IF NOT EXISTS involucrados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  caso_id UUID NOT NULL,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL,
  contacto TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE involucrados IS 'Personas involucradas en los casos (además del estudiante principal)';
COMMENT ON COLUMN involucrados.id IS 'Identificador único del involucrado';
COMMENT ON COLUMN involucrados.caso_id IS 'ID del caso al que pertenece';
COMMENT ON COLUMN involucrados.nombre IS 'Nombre completo del involucrado';
COMMENT ON COLUMN involucrados.rol IS 'Rol en el caso (Afectado, Agresor, Testigo, Denunciante)';
COMMENT ON COLUMN involucrados.contacto IS 'Información de contacto (opcional)';
COMMENT ON COLUMN involucrados.metadata IS 'Datos adicionales en formato JSON (ej: curso)';

-- Tabla: stage_sla
-- Define los plazos (SLA) para cada etapa del debido proceso
CREATE TABLE IF NOT EXISTS stage_sla (
  stage_key TEXT PRIMARY KEY,
  days_to_due INTEGER NOT NULL
);

COMMENT ON TABLE stage_sla IS 'Plazos (SLA) para las etapas del debido proceso';
COMMENT ON COLUMN stage_sla.stage_key IS 'Identificador de la etapa (ej: 1. Comunicación/Denuncia)';
COMMENT ON COLUMN stage_sla.days_to_due IS 'Días hábiles para completar la etapa';

-- Insertar datos iniciales de SLA (valores de ejemplo)
INSERT INTO stage_sla (stage_key, days_to_due) VALUES
  ('1. Comunicación/Denuncia', 1),
  ('2. Notificación Apoderados', 1),
  ('3. Indagación', 5),
  ('4. Resolución', 2),
  ('5. Apelación', 5)
ON CONFLICT (stage_key) DO NOTHING;
