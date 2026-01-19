-- =====================================================
-- SCHEMA COMPLETO - REGISTRO DE CASOS
-- Plataforma de Convivencia Escolar
-- =====================================================

-- TABLA: students
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rut VARCHAR(20) UNIQUE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    level VARCHAR(50),
    course VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: cases
CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    legacy_case_number INTEGER,
    incident_date DATE,
    incident_time TIME,
    course_incident VARCHAR(50),
    conduct_type VARCHAR(100),
    conduct_category VARCHAR(100),
    short_description TEXT,
    status VARCHAR(50) DEFAULT 'Activo',
    guardian_notified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    indagacion_start_date DATE,
    indagacion_due_date DATE,
    seguimiento_started_at TIMESTAMPTZ,
    due_process_closed_at TIMESTAMPTZ
);

-- TABLA: case_followups
CREATE TABLE IF NOT EXISTS case_followups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
    action_date DATE NOT NULL,
    action_type VARCHAR(100),
    process_stage VARCHAR(100) NOT NULL,
    stage_status VARCHAR(50) NOT NULL DEFAULT 'Completada',
    detail TEXT,
    responsible VARCHAR(255),
    observations TEXT,
    description TEXT,
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    action_at TIMESTAMPTZ,
    due_at TIMESTAMPTZ
);

-- TABLA: followup_evidence
CREATE TABLE IF NOT EXISTS followup_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
    followup_id UUID REFERENCES case_followups(id) ON DELETE CASCADE NOT NULL,
    storage_bucket VARCHAR(100) NOT NULL DEFAULT 'evidencias',
    storage_path TEXT NOT NULL,
    file_name VARCHAR(500) NOT NULL,
    content_type VARCHAR(200),
    file_size BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: involucrados
CREATE TABLE IF NOT EXISTS involucrados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caso_id UUID REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
    nombre VARCHAR(500) NOT NULL,
    rol VARCHAR(100),
    contacto VARCHAR(200),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: stage_sla (configuración de plazos)
CREATE TABLE IF NOT EXISTS stage_sla (
    stage_key VARCHAR(100) PRIMARY KEY,
    days_to_due INTEGER
);

-- ÍNDICES para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_cases_student_id ON cases(student_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_incident_date ON cases(incident_date);
CREATE INDEX IF NOT EXISTS idx_followups_case_id ON case_followups(case_id);
CREATE INDEX IF NOT EXISTS idx_followups_process_stage ON case_followups(process_stage);
CREATE INDEX IF NOT EXISTS idx_evidence_case_id ON followup_evidence(case_id);
CREATE INDEX IF NOT EXISTS idx_evidence_followup_id ON followup_evidence(followup_id);
CREATE INDEX IF NOT EXISTS idx_involucrados_caso_id ON involucrados(caso_id);

-- DATOS INICIALES: Configuración de plazos por etapa
INSERT INTO stage_sla (stage_key, days_to_due) VALUES
('1. Comunicación/Denuncia', 1),
('2. Notificación Apoderados', 1),
('3. Recopilación Antecedentes', NULL),
('4. Entrevistas', NULL),
('5. Investigación/Análisis', 10),
('6. Resolución y Sanciones', 1),
('7. Apelación/Recursos', 2),
('8. Seguimiento', 30)
ON CONFLICT (stage_key) DO NOTHING;

-- =====================================================
-- VISTAS
-- =====================================================

-- Vista: Control de plazos de debido proceso
CREATE OR REPLACE VIEW v_control_plazos_plus AS
SELECT 
    cf.id,
    cf.case_id,
    cf.process_stage AS etapa_debido_proceso,
    cf.action_date AS fecha_seguimiento,
    cf.due_date AS fecha_plazo,
    cf.stage_status AS estado_etapa,
    cf.responsible AS responsable,
    CASE
        WHEN cf.due_date IS NULL THEN NULL
        WHEN cf.due_date >= CURRENT_DATE THEN cf.due_date - CURRENT_DATE
        ELSE cf.due_date - CURRENT_DATE
    END AS dias_restantes,
    CASE
        WHEN cf.due_date IS NULL THEN 'Sin Plazo'
        WHEN cf.due_date < CURRENT_DATE THEN 'Vencido'
        WHEN cf.due_date - CURRENT_DATE <= 2 THEN 'Urgente'
        WHEN cf.due_date - CURRENT_DATE <= 5 THEN 'Próximo'
        ELSE 'Normal'
    END AS alerta_urgencia,
    c.legacy_case_number AS numero_caso,
    c.incident_date AS fecha_incidente,
    c.course_incident AS curso_incidente,
    c.conduct_type AS tipificacion_conducta,
    c.status AS estado_caso,
    COALESCE(s.first_name || ' ' || s.last_name, 'N/A') AS estudiante_responsable,
    cf.due_date - cf.action_date AS days_to_due,
    CAST(SUBSTRING(cf.process_stage FROM '^[0-9]+') AS INTEGER) AS stage_num_from
FROM case_followups cf
LEFT JOIN cases c ON cf.case_id = c.id
LEFT JOIN students s ON c.student_id = s.id
WHERE c.status = 'Activo' AND cf.stage_status != 'Cancelada';

-- Vista: Alertas de plazos de indagación
CREATE OR REPLACE VIEW v_control_alertas AS
SELECT 
    c.id AS case_id,
    c.legacy_case_number AS numero_caso,
    c.indagacion_start_date AS fecha_inicio_indagacion,
    c.indagacion_due_date AS fecha_plazo,
    CASE
        WHEN c.indagacion_due_date IS NULL THEN NULL
        ELSE c.indagacion_due_date - CURRENT_DATE
    END AS dias_restantes,
    CASE
        WHEN c.indagacion_due_date IS NULL THEN 'Sin Plazo'
        WHEN c.indagacion_due_date < CURRENT_DATE THEN 'Vencido'
        WHEN c.indagacion_due_date - CURRENT_DATE <= 2 THEN 'Urgente'
        WHEN c.indagacion_due_date - CURRENT_DATE <= 5 THEN 'Próximo'
        ELSE 'Normal'
    END AS alerta_urgencia,
    c.incident_date AS fecha_incidente,
    c.course_incident AS curso_incidente,
    c.conduct_type AS tipificacion_conducta,
    COALESCE(s.first_name || ' ' || s.last_name, 'N/A') AS estudiante_responsable
FROM cases c
LEFT JOIN students s ON c.student_id = s.id
WHERE c.status = 'Activo' AND c.indagacion_start_date IS NOT NULL;

-- Vista: Resumen de plazos por caso (muestra el plazo más urgente de cada caso)
CREATE OR REPLACE VIEW v_control_plazos_case_resumen AS
SELECT DISTINCT ON (case_id)
    case_id,
    fecha_plazo,
    dias_restantes,
    alerta_urgencia
FROM v_control_plazos_plus
WHERE fecha_plazo IS NOT NULL
ORDER BY case_id, dias_restantes ASC NULLS LAST;

-- =====================================================
-- FUNCIONES RPC
-- =====================================================

-- RPC: Iniciar debido proceso con cálculo de días hábiles
CREATE OR REPLACE FUNCTION start_due_process(p_case_id UUID, p_sla_days INTEGER DEFAULT 10)
RETURNS JSON AS $$
DECLARE
    v_start_date DATE := CURRENT_DATE;
    v_due_date DATE;
    v_days_added INTEGER := 0;
    v_current_date DATE := v_start_date;
BEGIN
    -- Calcular fecha de vencimiento sumando solo días hábiles (lunes a viernes)
    WHILE v_days_added < p_sla_days LOOP
        v_current_date := v_current_date + INTERVAL '1 day';
        -- Solo contar lunes a viernes (1=Monday, 5=Friday en ISODOW)
        IF EXTRACT(ISODOW FROM v_current_date) BETWEEN 1 AND 5 THEN
            v_days_added := v_days_added + 1;
        END IF;
    END LOOP;
    
    v_due_date := v_current_date;
    
    -- Actualizar caso
    UPDATE cases SET
        indagacion_start_date = v_start_date,
        indagacion_due_date = v_due_date,
        status = 'En Seguimiento',
        updated_at = NOW()
    WHERE id = p_case_id;
    
    RETURN json_build_object(
        'success', TRUE,
        'case_id', p_case_id,
        'start_date', v_start_date,
        'due_date', v_due_date,
        'business_days', p_sla_days
    );
END;
$$ LANGUAGE plpgsql;

-- RPC: Estadísticas y KPIs
CREATE OR REPLACE FUNCTION stats_kpis(desde DATE, hasta DATE)
RETURNS JSON AS $$
DECLARE
    v_total_casos INTEGER;
    v_casos_activos INTEGER;
    v_casos_cerrados INTEGER;
    v_avg_resolution_days NUMERIC;
BEGIN
    SELECT COUNT(*) INTO v_total_casos
    FROM cases
    WHERE incident_date BETWEEN desde AND hasta;
    
    SELECT COUNT(*) INTO v_casos_activos
    FROM cases
    WHERE status = 'Activo' AND incident_date BETWEEN desde AND hasta;
    
    SELECT COUNT(*) INTO v_casos_cerrados
    FROM cases
    WHERE status = 'Cerrado' AND incident_date BETWEEN desde AND hasta;
    
    SELECT AVG(EXTRACT(EPOCH FROM (closed_at - created_at))/86400)::NUMERIC(10,2)
    INTO v_avg_resolution_days
    FROM cases
    WHERE closed_at IS NOT NULL AND incident_date BETWEEN desde AND hasta;
    
    RETURN json_build_object(
        'total_casos', COALESCE(v_total_casos, 0),
        'casos_activos', COALESCE(v_casos_activos, 0),
        'casos_cerrados', COALESCE(v_casos_cerrados, 0),
        'avg_resolution_days', COALESCE(v_avg_resolution_days, 0)
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STORAGE BUCKET (ejecutar desde Supabase Dashboard)
-- =====================================================
-- NOTA: El bucket 'evidencias' debe crearse manualmente en Storage
-- con las siguientes configuraciones:
-- - Name: evidencias
-- - Public: false (privado)
-- - File size limit: 50MB
-- - Allowed MIME types: image/*, application/pdf, video/*

-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- =====================================================
-- IMPORTANTE: Por defecto, deshabilitar RLS para uso administrativo interno
-- Si necesitas autenticación de usuarios, configura las políticas según tu caso

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE followup_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE involucrados ENABLE ROW LEVEL SECURITY;

-- Política de acceso total para usuarios autenticados (ajustar según necesidad)
CREATE POLICY "Permitir todo a usuarios autenticados" ON students FOR ALL USING (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON cases FOR ALL USING (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON case_followups FOR ALL USING (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON followup_evidence FOR ALL USING (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON involucrados FOR ALL USING (true);

-- FIN DEL SCHEMA
