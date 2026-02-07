-- =====================================================
-- 01_tables.sql
-- Definición de todas las tablas del sistema
-- Ejecutar DESPUÉS de 00_extensions.sql
-- =====================================================

-- TABLA: students
-- Almacena información de estudiantes
-- =====================================================
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rut TEXT,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  level TEXT,          -- se mantiene el nombre actual (no 'grade') para compatibilidad frontend
  course TEXT,         -- se mantiene 'course'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE students IS 'Registro de estudiantes del establecimiento';
COMMENT ON COLUMN students.rut IS 'RUT del estudiante (formato: 12345678-9)';
COMMENT ON COLUMN students.level IS 'Nivel o curso en formato usado por el frontend';
COMMENT ON COLUMN students.course IS 'Nombre del curso (ej. 7°A)';

-- =====================================================
-- TABLA: cases
-- Almacena los casos de convivencia escolar
-- =====================================================
CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  
  -- Información del incidente
  incident_date DATE NOT NULL DEFAULT CURRENT_DATE,
  incident_time TEXT DEFAULT '',
  course_incident TEXT DEFAULT '',
  
  -- Estado y clasificación
  status TEXT NOT NULL DEFAULT 'Reportado',
  conduct_type TEXT DEFAULT '',
  conduct_category TEXT DEFAULT '',
  short_description TEXT DEFAULT '',
  actions_taken TEXT DEFAULT '',

  -- Responsable del registro (quién reporta el caso)
  responsible TEXT DEFAULT '',
  responsible_role TEXT DEFAULT '',
  
  -- Notificación
  guardian_notified BOOLEAN DEFAULT FALSE,
  
  -- Control de debido proceso
  indagacion_start_date DATE,
  indagacion_due_date DATE,
  seguimiento_started_at TIMESTAMPTZ,
  
  -- Legacy
  legacy_case_number TEXT,
  student_name TEXT,
  
  -- Auditoría
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

COMMENT ON TABLE cases IS 'Casos de convivencia escolar';
COMMENT ON COLUMN cases.status IS 'Estado del caso: Reportado, En Seguimiento, Cerrado';
COMMENT ON COLUMN cases.conduct_type IS 'Tipificación de la conducta según protocolo';
COMMENT ON COLUMN cases.conduct_category IS 'Categoría: Leve, Grave, Gravísima';
COMMENT ON COLUMN cases.responsible IS 'Responsable del registro del caso (quién reporta)';
COMMENT ON COLUMN cases.responsible_role IS 'Rol/cargo del responsable del registro';
COMMENT ON COLUMN cases.indagacion_start_date IS 'Fecha de inicio de indagación';
COMMENT ON COLUMN cases.indagacion_due_date IS 'Fecha límite para completar la indagación';
COMMENT ON COLUMN cases.seguimiento_started_at IS 'Fecha de inicio del debido proceso';

-- =====================================================
-- TABLA: process_stages
-- Catálogo de etapas del debido proceso
-- =====================================================
CREATE TABLE IF NOT EXISTS process_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stage_name TEXT NOT NULL UNIQUE,
  stage_order INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE process_stages IS 'Catálogo de etapas del debido proceso disciplinario';
COMMENT ON COLUMN process_stages.stage_order IS 'Orden secuencial de la etapa';

-- =====================================================
-- TABLA: case_followups
-- Seguimientos y acciones realizadas en cada caso
-- =====================================================
CREATE TABLE IF NOT EXISTS case_followups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  
  -- Tipo de acción/seguimiento
  action_type TEXT NOT NULL DEFAULT 'Seguimiento',
  action_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Etapa del debido proceso
  process_stage TEXT NOT NULL DEFAULT 'Seguimiento',
  stage_status TEXT NOT NULL DEFAULT 'Completada',
  due_date DATE,
  
  -- Detalles
  detail TEXT DEFAULT '',
  description TEXT DEFAULT '',
  observations TEXT DEFAULT '',
  responsible TEXT DEFAULT '',
  
  -- Auditoría
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE case_followups IS 'Registro de seguimientos y acciones del debido proceso';
COMMENT ON COLUMN case_followups.action_type IS 'Tipo de acción: Seguimiento, Entrevista, Citación, etc.';
COMMENT ON COLUMN case_followups.process_stage IS 'Etapa actual del debido proceso';
COMMENT ON COLUMN case_followups.stage_status IS 'Estado: Completada, Pendiente, En Proceso';
COMMENT ON COLUMN case_followups.due_date IS 'Fecha límite para completar esta acción';
COMMENT ON COLUMN case_followups.responsible IS 'Responsable de la acción';

-- =====================================================
-- TABLA: followup_evidence
-- Evidencias adjuntas a los seguimientos
-- =====================================================
CREATE TABLE IF NOT EXISTS followup_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  followup_id UUID NOT NULL REFERENCES case_followups(id) ON DELETE CASCADE,
  
  -- Storage
  storage_bucket TEXT NOT NULL DEFAULT 'evidencias',
  storage_path TEXT NOT NULL,
  
  -- Metadata del archivo
  file_name TEXT NOT NULL,
  content_type TEXT,
  file_size BIGINT,
  
  -- Auditoría
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE followup_evidence IS 'Evidencias documentales adjuntas a los seguimientos';
COMMENT ON COLUMN followup_evidence.storage_bucket IS 'Bucket de Supabase Storage';
COMMENT ON COLUMN followup_evidence.storage_path IS 'Ruta completa del archivo en Storage';
COMMENT ON COLUMN followup_evidence.file_size IS 'Tamaño en bytes';

-- =====================================================
-- TABLA: stage_sla
-- SLA (plazos) por etapa del debido proceso
-- =====================================================
CREATE TABLE IF NOT EXISTS stage_sla (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stage_key TEXT NOT NULL UNIQUE,
  days_to_due INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE stage_sla IS 'Plazos (SLA) definidos para cada etapa del debido proceso';
COMMENT ON COLUMN stage_sla.stage_key IS 'Clave única de la etapa';
COMMENT ON COLUMN stage_sla.days_to_due IS 'Días hábiles para cumplir la etapa';

-- =====================================================
-- TABLA: involucrados
-- Personas involucradas en un caso (víctimas, testigos, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS involucrados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL,
  curso TEXT,
  descripcion TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE involucrados IS 'Personas involucradas en un caso (víctimas, testigos, otros responsables)';
COMMENT ON COLUMN involucrados.rol IS 'Rol: Víctima, Testigo, Responsable, etc.';
COMMENT ON COLUMN involucrados.metadata IS 'Datos adicionales en formato JSON';

-- =====================================================
-- Fin de definición de tablas
-- =====================================================
