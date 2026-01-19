-- =====================================================
-- 07_views.sql
-- Vistas para consultas complejas y reportes
-- =====================================================

-- IMPORTANTE: Estas vistas son PLACEHOLDERS básicos.
-- Deben ser implementadas según los requerimientos específicos del colegio
-- y la lógica de cálculo de plazos y alertas.

-- =====================================================
-- Vista: v_control_plazos_plus
-- Vista principal para control de plazos por seguimiento
-- =====================================================
-- Esta vista debe calcular los días restantes para cada seguimiento
-- considerando los SLA definidos en stage_sla y días hábiles.

CREATE OR REPLACE VIEW v_control_plazos_plus AS
SELECT
  cf.id AS followup_id,
  cf.case_id,
  cf.action_date AS fecha,
  cf.action_type AS tipo_accion,
  cf.process_stage AS etapa_debido_proceso,
  cf.detail AS detalle,
  cf.description AS descripcion,
  cf.responsible AS responsable,
  cf.stage_status AS estado_etapa,
  cf.due_date AS fecha_plazo,
  c.status AS estado_caso,
  c.conduct_type AS tipificacion_conducta,
  c.course_incident AS curso_incidente,
  c.incident_date AS fecha_incidente,
  c.legacy_case_number,
  s.first_name || ' ' || s.last_name AS estudiante,
  -- Cálculo básico de días restantes (TODO: Ajustar para días hábiles)
  CASE
    WHEN cf.due_date IS NOT NULL
    THEN (cf.due_date - CURRENT_DATE)
    ELSE NULL
  END AS dias_restantes,
  -- Cálculo de alerta de urgencia
  CASE
    WHEN cf.due_date IS NULL THEN '⏳ SIN PLAZO'
    WHEN (cf.due_date - CURRENT_DATE) < 0 THEN '🔴 VENCIDO'
    WHEN (cf.due_date - CURRENT_DATE) = 0 THEN '🟠 VENCE HOY'
    WHEN (cf.due_date - CURRENT_DATE) <= 3 THEN '🟡 PRÓXIMO'
    ELSE '✅ EN PLAZO'
  END AS alerta_urgencia,
  -- Campos adicionales del backend
  CASE
    WHEN cf.due_date IS NOT NULL
    THEN (cf.due_date - CURRENT_DATE)
    ELSE NULL
  END AS days_to_due,
  -- stage_num_from: número de orden de la etapa (requiere lógica adicional)
  -- TODO: Implementar mapeo de process_stage a número de orden
  CASE cf.process_stage
    WHEN '1. Comunicación/Denuncia' THEN 1
    WHEN '2. Notificación Apoderados' THEN 2
    WHEN '3. Indagación' THEN 3
    WHEN '4. Resolución' THEN 4
    WHEN '5. Apelación' THEN 5
    ELSE 0
  END AS stage_num_from
FROM case_followups cf
JOIN cases c ON cf.case_id = c.id
JOIN students s ON c.student_id = s.id
WHERE c.status != 'Cerrado';

COMMENT ON VIEW v_control_plazos_plus IS 'Vista de control de plazos por seguimiento con alertas de urgencia (casos abiertos)';

-- =====================================================
-- Vista: v_control_alertas
-- Vista para alertas de indagación (wrapper)
-- =====================================================
-- Esta vista muestra casos que requieren seguimiento urgente
-- Enfocada en la etapa de indagación

CREATE OR REPLACE VIEW v_control_alertas AS
SELECT
  c.id AS case_id,
  c.incident_date AS fecha,
  c.status AS estado_caso,
  c.conduct_type AS tipificacion_conducta,
  c.course_incident AS curso_incidente,
  c.incident_date AS fecha_incidente,
  c.legacy_case_number,
  c.indagacion_due_date AS fecha_plazo,
  '3. Indagación' AS etapa_debido_proceso,
  s.first_name || ' ' || s.last_name AS estudiante,
  -- Cálculo de días restantes para indagación
  CASE
    WHEN c.indagacion_due_date IS NOT NULL
    THEN (c.indagacion_due_date - CURRENT_DATE)
    ELSE NULL
  END AS dias_restantes,
  -- Alerta de urgencia para indagación
  CASE
    WHEN c.indagacion_due_date IS NULL THEN '⏳ SIN PLAZO'
    WHEN (c.indagacion_due_date - CURRENT_DATE) < 0 THEN '🔴 VENCIDO'
    WHEN (c.indagacion_due_date - CURRENT_DATE) = 0 THEN '🟠 VENCE HOY'
    WHEN (c.indagacion_due_date - CURRENT_DATE) <= 3 THEN '🟡 PRÓXIMO'
    ELSE '✅ EN PLAZO'
  END AS alerta_urgencia
FROM cases c
JOIN students s ON c.student_id = s.id
WHERE c.status IN ('Reportado', 'Activo', 'En Seguimiento')
  AND c.indagacion_due_date IS NOT NULL;

COMMENT ON VIEW v_control_alertas IS 'Vista de alertas para etapa de indagación (casos que requieren seguimiento urgente)';

-- =====================================================
-- Vista: v_control_plazos_case_resumen
-- Vista resumen de plazos por caso (la más urgente)
-- =====================================================
-- Esta vista muestra un solo registro por caso: el plazo más urgente

CREATE OR REPLACE VIEW v_control_plazos_case_resumen AS
SELECT DISTINCT ON (case_id)
  case_id,
  fecha_plazo,
  dias_restantes,
  alerta_urgencia
FROM v_control_plazos_plus
WHERE dias_restantes IS NOT NULL
ORDER BY case_id, dias_restantes ASC;

COMMENT ON VIEW v_control_plazos_case_resumen IS 'Resumen de plazos por caso mostrando solo la alerta más urgente';

-- =====================================================
-- Notas de Implementación
-- =====================================================
-- TODO: Las siguientes mejoras deben implementarse según requirements:
--
-- 1. Cálculo de días hábiles:
--    - Excluir sábados y domingos
--    - Excluir feriados (requiere tabla de feriados)
--    - Función auxiliar: calculate_business_days(start_date, sla_days)
--
-- 2. Lógica de SLA dinámica:
--    - JOIN con stage_sla para obtener days_to_due
--    - Calcular fecha_plazo = action_date + days_to_due (días hábiles)
--
-- 3. Estados de seguimiento:
--    - Filtrar por stage_status para mostrar solo pendientes
--    - Considerar seguimientos completados vs pendientes
--
-- 4. Escalamiento de alertas:
--    - Definir umbrales personalizados por tipo de falta
--    - Notificaciones automáticas para alertas rojas
--
-- 5. Permisos de visualización:
--    - Aplicar filtros RLS según rol del usuario
--    - Limitar visibilidad según responsable asignado

-- =====================================================
-- Ejemplo de Función Auxiliar para Días Hábiles
-- =====================================================
-- Esta función debe ser implementada según el calendario del colegio

CREATE OR REPLACE FUNCTION calculate_business_days(
  start_date DATE,
  num_days INTEGER
)
RETURNS DATE AS $$
DECLARE
  result_date DATE := start_date;
  days_added INTEGER := 0;
BEGIN
  -- TODO: Implementar lógica real con feriados
  -- Esta es una implementación simplificada que solo excluye fines de semana
  WHILE days_added < num_days LOOP
    result_date := result_date + 1;
    -- Si no es sábado (6) ni domingo (0)
    IF EXTRACT(DOW FROM result_date) NOT IN (0, 6) THEN
      days_added := days_added + 1;
    END IF;
  END LOOP;
  RETURN result_date;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_business_days IS 'Calcula fecha sumando días hábiles (excluye fines de semana, TODO: agregar feriados)';

-- =====================================================
-- Tabla Auxiliar: Feriados (Opcional)
-- =====================================================
-- Crear y mantener actualizada esta tabla para cálculo preciso de días hábiles

CREATE TABLE IF NOT EXISTS feriados (
  fecha DATE PRIMARY KEY,
  descripcion TEXT NOT NULL,
  tipo TEXT DEFAULT 'nacional'
);

COMMENT ON TABLE feriados IS 'Calendario de feriados para cálculo de días hábiles';

-- Insertar feriados de ejemplo (Chile 2026)
INSERT INTO feriados (fecha, descripcion, tipo) VALUES
  ('2026-01-01', 'Año Nuevo', 'nacional'),
  ('2026-04-03', 'Viernes Santo', 'nacional'),
  ('2026-04-04', 'Sábado Santo', 'nacional'),
  ('2026-05-01', 'Día del Trabajo', 'nacional'),
  ('2026-05-21', 'Día de las Glorias Navales', 'nacional'),
  ('2026-06-29', 'San Pedro y San Pablo', 'nacional'),
  ('2026-07-16', 'Día de la Virgen del Carmen', 'nacional'),
  ('2026-08-15', 'Asunción de la Virgen', 'nacional'),
  ('2026-09-18', 'Primera Junta Nacional de Gobierno', 'nacional'),
  ('2026-09-19', 'Día de las Glorias del Ejército', 'nacional'),
  ('2026-10-12', 'Encuentro de Dos Mundos', 'nacional'),
  ('2026-10-31', 'Día de las Iglesias Evangélicas y Protestantes', 'nacional'),
  ('2026-11-01', 'Día de Todos los Santos', 'nacional'),
  ('2026-12-08', 'Inmaculada Concepción', 'nacional'),
  ('2026-12-25', 'Navidad', 'nacional')
ON CONFLICT (fecha) DO NOTHING;

-- Mejorar calculate_business_days para considerar feriados
CREATE OR REPLACE FUNCTION calculate_business_days_with_holidays(
  start_date DATE,
  num_days INTEGER
)
RETURNS DATE AS $$
DECLARE
  result_date DATE := start_date;
  days_added INTEGER := 0;
BEGIN
  WHILE days_added < num_days LOOP
    result_date := result_date + 1;
    -- Si no es fin de semana y no es feriado
    IF EXTRACT(DOW FROM result_date) NOT IN (0, 6)
       AND NOT EXISTS (SELECT 1 FROM feriados WHERE fecha = result_date)
    THEN
      days_added := days_added + 1;
    END IF;
  END LOOP;
  RETURN result_date;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_business_days_with_holidays IS 'Calcula fecha sumando días hábiles (excluye fines de semana y feriados)';
