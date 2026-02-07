-- =====================================================
-- 06_views.sql
-- Vistas para control de plazos y alertas
-- =====================================================

CREATE OR REPLACE VIEW v_control_plazos_plus AS
SELECT 
  cf.id AS followup_id,
  cf.case_id,
  cf.action_type AS tipo_accion,
  cf.action_date AS fecha,
  cf.process_stage AS etapa_debido_proceso,
  cf.stage_status AS estado_etapa,
  cf.due_date AS fecha_plazo,
  cf.detail AS detalle,
  cf.description AS descripcion,
  cf.responsible AS responsable,
  c.status AS estado_caso,
  c.conduct_type AS tipificacion_conducta,
  c.course_incident AS curso_incidente,
  c.incident_date AS fecha_incidente,
  c.legacy_case_number,
  c.seguimiento_started_at,
  COALESCE(NULLIF(TRIM(s.first_name || ' ' || s.last_name), ''), 'N/A') AS estudiante,
  CASE 
    WHEN cf.due_date IS NULL THEN NULL
    ELSE (cf.due_date - CURRENT_DATE)
  END AS dias_restantes,
  CASE 
    WHEN cf.due_date IS NULL THEN '⏳ SIN PLAZO'
    WHEN (cf.due_date - CURRENT_DATE) < 0 THEN '🔴 VENCIDO (' || (cf.due_date - CURRENT_DATE) || ' días)'
    WHEN (cf.due_date - CURRENT_DATE) = 0 THEN '🟠 VENCE HOY'
    WHEN (cf.due_date - CURRENT_DATE) <= 3 THEN '🟡 PRÓXIMO (' || (cf.due_date - CURRENT_DATE) || ' días)'
    ELSE '✅ EN PLAZO (' || (cf.due_date - CURRENT_DATE) || ' días)'
  END AS alerta_urgencia,
  ss.days_to_due,
  NULL::INTEGER AS stage_num_from
FROM case_followups cf
INNER JOIN cases c ON c.id = cf.case_id
LEFT JOIN students s ON s.id = c.student_id
LEFT JOIN stage_sla ss ON ss.stage_key = cf.process_stage;

CREATE OR REPLACE VIEW v_control_alertas AS
WITH last_followup AS (
  SELECT DISTINCT ON (f.case_id)
    f.id AS followup_id,
    f.case_id,
    f.action_date,
    f.action_type,
    f.stage_status,
    f.responsible,
    f.process_stage,
    f.created_at
  FROM case_followups f
  ORDER BY
    f.case_id,
    f.action_date DESC NULLS LAST,
    f.created_at DESC
)
SELECT
  c.id::text AS id,
  c.id AS case_id,
  lf.followup_id,
  lf.process_stage AS etapa_debido_proceso,
  c.indagacion_start_date AS fecha,
  c.indagacion_due_date AS fecha_plazo,
  business_days_between(CURRENT_DATE, c.indagacion_due_date) AS dias_restantes,
  CASE
    WHEN c.indagacion_due_date IS NULL THEN '⚪ Sin plazo'::text
    WHEN business_days_between(CURRENT_DATE, c.indagacion_due_date) < 0 THEN '🔴 Vencido'::text
    WHEN business_days_between(CURRENT_DATE, c.indagacion_due_date) <= 1 THEN '🟠 Urgente'::text
    WHEN business_days_between(CURRENT_DATE, c.indagacion_due_date) <= 3 THEN '🟡 Próximo'::text
    ELSE '🟢 OK'::text
  END AS alerta_urgencia,
  lf.action_date AS last_action_date,
  c.status AS estado_caso,
  c.conduct_type AS tipificacion_conducta,
  c.incident_date AS fecha_incidente,
  c.course_incident AS curso_incidente,
  c.legacy_case_number
FROM cases c
LEFT JOIN last_followup lf ON lf.case_id = c.id
WHERE
  c.seguimiento_started_at IS NOT NULL
  AND c.indagacion_due_date IS NOT NULL
  AND COALESCE(c.status, ''::text) <> 'Cerrado'::text;

CREATE OR REPLACE VIEW v_control_plazos_case_resumen AS
WITH resumen AS (
  SELECT DISTINCT ON (case_id)
    case_id,
    fecha_plazo,
    dias_restantes,
    alerta_urgencia
  FROM v_control_plazos_plus
  WHERE fecha_plazo IS NOT NULL
  ORDER BY case_id, dias_restantes ASC NULLS LAST
),
sin_plazo AS (
  SELECT
    c.id AS case_id,
    NULL::DATE AS fecha_plazo,
    NULL::INTEGER AS dias_restantes,
    NULL::TEXT AS alerta_urgencia
  FROM cases c
  WHERE c.seguimiento_started_at IS NOT NULL
    AND c.status != 'Cerrado'
    AND NOT EXISTS (
      SELECT 1
      FROM v_control_plazos_plus v
      WHERE v.case_id = c.id
        AND v.fecha_plazo IS NOT NULL
    )
)
SELECT * FROM resumen
UNION ALL
SELECT * FROM sin_plazo;
