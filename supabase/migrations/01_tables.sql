-- =====================================================
-- 01_tables.sql
-- Definición de todas las tablas del sistema
-- =====================================================

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  rut TEXT,
  grade TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  incident_date DATE NOT NULL DEFAULT CURRENT_DATE,
  incident_time TEXT DEFAULT '',
  course_incident TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Reportado',
  conduct_type TEXT DEFAULT '',
  conduct_category TEXT DEFAULT '',
  short_description TEXT DEFAULT '',
  actions_taken TEXT DEFAULT '',
  guardian_notified BOOLEAN DEFAULT FALSE,
  seguimiento_started_at TIMESTAMPTZ,
  due_process_deadline TIMESTAMPTZ,
  legacy_case_number TEXT,
  student_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS case_followups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL DEFAULT 'Seguimiento',
  action_date DATE NOT NULL DEFAULT CURRENT_DATE,
  process_stage TEXT NOT NULL DEFAULT 'Seguimiento',
  stage_status TEXT NOT NULL DEFAULT 'Completada',
  due_date DATE,
  detail TEXT DEFAULT '',
  description TEXT DEFAULT '',
  observations TEXT DEFAULT '',
  responsible TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS followup_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  followup_id UUID NOT NULL REFERENCES case_followups(id) ON DELETE CASCADE,
  storage_bucket TEXT NOT NULL DEFAULT 'evidencias',
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  content_type TEXT,
  file_size BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stage_sla (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stage_key TEXT NOT NULL UNIQUE,
  days_to_due INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS process_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stage_name TEXT NOT NULL UNIQUE,
  stage_order INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS involucrados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  caso_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL,
  curso TEXT,
  descripcion TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
