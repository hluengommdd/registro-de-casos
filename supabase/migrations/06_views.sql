-- =====================================================
-- 06_views.sql
-- Vistas para control de plazos y alertas
-- =====================================================

CREATE OR REPLACE VIEW v_control_plazos_plus AS
SELECT 
  cf.id AS followup_id,
  cf. case_id,
  cf. action_type AS tipo_accion,
  cf. action_date AS fecha,
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
  COALESCE(s.first_name || ' ' || s.last_name, 'N/A') AS estudiante,
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
  NULL:: INTEGER AS stage_num_from
FROM case_followups cf
INNER JOIN cases c ON c.id = cf.case_id
LEFT JOIN students s ON s. id = c.student_id
LEFT JOIN stage_sla ss ON ss.stage_key = cf.process_stage;

CREATE OR REPLACE VIEW v_control_alertas AS
SELECT 
  c.id AS case_id,
  c.created_at AS fecha,
  'Indagación' AS etapa_debido_proceso,
  c.due_process_deadline AS fecha_plazo,
  c.status AS estado_caso,
  c.conduct_type AS tipificacion_conducta,
  c.course_incident AS curso_incidente,
  c.incident_date AS fecha_incidente,
  c.legacy_case_number,
  COALESCE(s.first_name || ' ' || s.last_name, 'N/A') AS estudiante,
  CASE 
    WHEN c. seguimiento_started_at IS NULL THEN NULL
    WHEN c.due_process_deadline IS NULL THEN NULL
    ELSE (c.due_process_deadline:: DATE - CURRENT_DATE)
  END AS dias_restantes,
  CASE 
    WHEN c.seguimiento_started_at IS NULL THEN '⏳ NO INICIADO'
    WHEN c.due_process_deadline IS NULL THEN '⏳ SIN PLAZO'
    WHEN (c. due_process_deadline::DATE - CURRENT_DATE) < 0 THEN '🔴 VENCIDO (' || (c.due_process_deadline:: DATE - CURRENT_DATE) || ' días)'
    WHEN (c.due_process_deadline:: DATE - CURRENT_DATE) = 0 THEN '🟠 VENCE HOY'
    WHEN (c.due_process_deadline::DATE - CURRENT_DATE) <= 3 THEN '🟡 PRÓXIMO (' || (c. due_process_deadline::DATE - CURRENT_DATE) || ' días)'
    ELSE '✅ EN PLAZO (' || (c.due_process_deadline::DATE - CURRENT_DATE) || ' días)'
  END AS alerta_urgencia
FROM cases c
LEFT JOIN students s ON s.id = c.student_id
WHERE c.seguimiento_started_at IS NOT NULL
  AND c.status != 'Cerrado';

CREATE OR REPLACE VIEW v_control_plazos_case_resumen AS
SELECT DISTINCT ON (case_id)
  case_id,
  fecha_plazo,
  dias_restantes,
  alerta_urgencia
FROM v_control_plazos_plus
WHERE fecha_plazo IS NOT NULL
ORDER BY case_id, dias_restantes ASC NULLS LAST;
