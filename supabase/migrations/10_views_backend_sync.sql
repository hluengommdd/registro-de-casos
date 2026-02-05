-- =====================================================
-- 10_views_backend_sync.sql
-- Sincroniza vistas con el backend actual (solo v_control_unificado)
-- =====================================================

CREATE OR REPLACE VIEW v_control_unificado AS
WITH student_info AS (
  SELECT
    c.id AS case_id,
    c.student_id,
    TRIM(BOTH FROM (COALESCE(s.first_name, ''::text) || ' '::text || COALESCE(s.last_name, ''::text))) AS estudiante,
    s.rut AS estudiante_rut,
    s.course,
    s.level
  FROM cases c
  LEFT JOIN students s ON (s.id = c.student_id)
),
last_followup AS (
  SELECT DISTINCT ON (f.case_id)
    f.id AS followup_id,
    f.case_id,
    f.action_date,
    f.action_type,
    f.stage_status,
    f.responsible,
    f.detail,
    f.process_stage,
    f.description,
    f.due_date,
    f.created_at
  FROM case_followups f
  ORDER BY f.case_id, f.action_date DESC NULLS LAST, f.created_at DESC
),
control_plazos AS (
  SELECT
    lf.followup_id,
    c.id AS case_id,
    c.legacy_case_number,
    c.status AS estado_caso,
    c.conduct_type AS tipificacion_conducta,
    c.incident_date AS fecha_incidente,
    c.course_incident AS curso_incidente,
    COALESCE(lf.action_date, c.created_at::date) AS fecha,
    lf.action_type AS tipo_accion,
    lf.stage_status AS estado_etapa,
    lf.responsible AS responsable,
    lf.detail AS detalle,
    lf.process_stage AS etapa_debido_proceso,
    lf.description AS descripcion,
    lf.due_date AS fecha_plazo,
    CASE
      WHEN lf.due_date IS NULL THEN NULL::integer
      ELSE (lf.due_date - CURRENT_DATE)
    END AS dias_restantes,
    CASE
      WHEN lf.due_date IS NULL THEN '⚪ Sin plazo'::text
      WHEN (lf.due_date - CURRENT_DATE) < 0 THEN '🔴 Vencido'::text
      WHEN (lf.due_date - CURRENT_DATE) <= 1 THEN '🟠 Urgente'::text
      WHEN (lf.due_date - CURRENT_DATE) <= 3 THEN '🟡 Próximo'::text
      ELSE '🟢 OK'::text
    END AS alerta_urgencia
  FROM cases c
  LEFT JOIN last_followup lf ON (lf.case_id = c.id)
),
control_plazos_plus AS (
  SELECT
    v.followup_id,
    v.case_id,
    v.legacy_case_number,
    v.estado_caso,
    v.tipificacion_conducta,
    v.fecha_incidente,
    v.curso_incidente,
    v.fecha,
    v.tipo_accion,
    v.estado_etapa,
    v.responsable,
    v.detalle,
    v.etapa_debido_proceso,
    v.descripcion,
    v.fecha_plazo,
    v.dias_restantes,
    v.alerta_urgencia,
    (NULLIF((regexp_match(v.etapa_debido_proceso, '^([0-9]+)\.'::text))[1], ''::text))::integer AS stage_num_from,
    s.days_to_due
  FROM control_plazos v
  LEFT JOIN stage_sla s ON (s.stage_key = v.etapa_debido_proceso)
),
alertas_indagacion AS (
  SELECT
    c.id::text AS id,
    c.id AS case_id,
    lf.followup_id,
    lf.process_stage AS etapa_debido_proceso,
    c.indagacion_start_date AS fecha,
    c.indagacion_due_date AS fecha_plazo,
    business_days_between(CURRENT_DATE, c.indagacion_due_date) AS dias_restantes,
    CASE
      WHEN c.indagacion_due_date IS NULL THEN '⏳ SIN PLAZO'::text
      WHEN business_days_between(CURRENT_DATE, c.indagacion_due_date) < 0 THEN '🔴 VENCIDO'::text
      WHEN business_days_between(CURRENT_DATE, c.indagacion_due_date) = 0 THEN '🟠 VENCE HOY'::text
      WHEN business_days_between(CURRENT_DATE, c.indagacion_due_date) <= 3 THEN '🟡 PRÓXIMO'::text
      ELSE '✅ EN PLAZO'::text
    END AS alerta_urgencia,
    lf.action_date AS last_action_date,
    c.status AS estado_caso,
    c.conduct_type AS tipificacion_conducta,
    c.incident_date AS fecha_incidente,
    c.course_incident AS curso_incidente,
    c.legacy_case_number
  FROM cases c
  LEFT JOIN last_followup lf ON (lf.case_id = c.id)
  WHERE
    c.seguimiento_started_at IS NOT NULL
    AND c.indagacion_due_date IS NOT NULL
    AND COALESCE(c.status, ''::text) <> 'Cerrado'::text
),
resumen_plazos AS (
  SELECT
    c.id AS case_id,
    COALESCE(f.followup_id, NULL::uuid) AS followup_id,
    COALESCE(f.fecha_plazo, c.indagacion_due_date) AS fecha_plazo,
    CASE
      WHEN COALESCE(f.fecha_plazo, c.indagacion_due_date) IS NULL THEN NULL::integer
      ELSE business_days_between(CURRENT_DATE, COALESCE(f.fecha_plazo, c.indagacion_due_date))
    END AS dias_restantes,
    CASE
      WHEN COALESCE(f.fecha_plazo, c.indagacion_due_date) IS NULL THEN '⚪ Sin plazo'::text
      WHEN business_days_between(CURRENT_DATE, COALESCE(f.fecha_plazo, c.indagacion_due_date)) < 0 THEN '🔴 Vencido'::text
      WHEN business_days_between(CURRENT_DATE, COALESCE(f.fecha_plazo, c.indagacion_due_date)) <= 1 THEN '🟠 Urgente'::text
      WHEN business_days_between(CURRENT_DATE, COALESCE(f.fecha_plazo, c.indagacion_due_date)) <= 3 THEN '🟡 Próximo'::text
      ELSE '🟢 OK'::text
    END AS alerta_urgencia
  FROM cases c
  LEFT JOIN LATERAL (
    SELECT
      cf.id AS followup_id,
      COALESCE(cf.due_date, cf.due_at::date) AS fecha_plazo
    FROM case_followups cf
    WHERE
      cf.case_id = c.id
      AND COALESCE(cf.due_date::timestamptz, cf.due_at) IS NOT NULL
      AND COALESCE(cf.stage_status, ''::text) !~~* 'completad%'::text
    ORDER BY
      CASE
        WHEN business_days_between(CURRENT_DATE, COALESCE(cf.due_date, cf.due_at::date)) >= 0 THEN 0
        ELSE 1
      END,
      CASE
        WHEN business_days_between(CURRENT_DATE, COALESCE(cf.due_date, cf.due_at::date)) >= 0
          THEN business_days_between(CURRENT_DATE, COALESCE(cf.due_date, cf.due_at::date))
        ELSE NULL::integer
      END,
      CASE
        WHEN business_days_between(CURRENT_DATE, COALESCE(cf.due_date, cf.due_at::date)) < 0
          THEN business_days_between(CURRENT_DATE, COALESCE(cf.due_date, cf.due_at::date))
        ELSE NULL::integer
      END DESC NULLS LAST,
      cf.created_at
    LIMIT 1
  ) f ON (true)
  WHERE c.status <> 'Cerrado'::text
)
SELECT
  'seguimiento'::text AS tipo,
  v.followup_id,
  v.case_id,
  v.legacy_case_number,
  v.estado_caso,
  v.tipificacion_conducta,
  v.fecha_incidente,
  v.curso_incidente,
  v.fecha,
  v.tipo_accion,
  v.estado_etapa,
  v.responsable,
  v.detalle,
  v.etapa_debido_proceso,
  v.descripcion,
  v.fecha_plazo,
  v.dias_restantes,
  v.alerta_urgencia,
  v.stage_num_from,
  v.days_to_due,
  si.student_id,
  NULLIF(si.estudiante, ''::text) AS estudiante,
  si.estudiante_rut,
  si.course,
  si.level
FROM control_plazos_plus v
LEFT JOIN student_info si ON (si.case_id = v.case_id)
UNION ALL
SELECT
  'indagacion'::text AS tipo,
  a.followup_id,
  a.case_id,
  a.legacy_case_number,
  a.estado_caso,
  a.tipificacion_conducta,
  a.fecha_incidente,
  a.curso_incidente,
  a.fecha,
  NULL::text AS tipo_accion,
  NULL::text AS estado_etapa,
  NULL::text AS responsable,
  NULL::text AS detalle,
  a.etapa_debido_proceso,
  NULL::text AS descripcion,
  a.fecha_plazo,
  a.dias_restantes,
  a.alerta_urgencia,
  NULL::integer AS stage_num_from,
  NULL::integer AS days_to_due,
  si.student_id,
  NULLIF(si.estudiante, ''::text) AS estudiante,
  si.estudiante_rut,
  si.course,
  si.level
FROM alertas_indagacion a
LEFT JOIN student_info si ON (si.case_id = a.case_id)
UNION ALL
SELECT
  'resumen'::text AS tipo,
  r.followup_id,
  r.case_id,
  NULL::integer AS legacy_case_number,
  NULL::text AS estado_caso,
  NULL::text AS tipificacion_conducta,
  NULL::date AS fecha_incidente,
  NULL::text AS curso_incidente,
  NULL::date AS fecha,
  NULL::text AS tipo_accion,
  NULL::text AS estado_etapa,
  NULL::text AS responsable,
  NULL::text AS detalle,
  NULL::text AS etapa_debido_proceso,
  NULL::text AS descripcion,
  r.fecha_plazo,
  r.dias_restantes,
  r.alerta_urgencia,
  NULL::integer AS stage_num_from,
  NULL::integer AS days_to_due,
  si.student_id,
  NULLIF(si.estudiante, ''::text) AS estudiante,
  si.estudiante_rut,
  si.course,
  si.level
FROM resumen_plazos r
LEFT JOIN student_info si ON (si.case_id = r.case_id);
