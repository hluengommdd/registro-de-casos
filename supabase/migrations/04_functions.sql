-- =====================================================
-- 04_functions.sql
-- Funciones RPC para estadísticas y reportes
-- Ejecutar DESPUÉS de 03_indexes.sql
-- =====================================================

-- =====================================================
-- FUNCIÓN: stats_kpis
-- KPIs generales del sistema
-- Parámetros: desde, hasta (ambos DATE)
-- Retorna: total de casos, abiertos, cerrados y promedio de días para cerrar
-- =====================================================
CREATE OR REPLACE FUNCTION stats_kpis(desde DATE, hasta DATE)
RETURNS TABLE (
  casos_total BIGINT,
  abiertos BIGINT,
  cerrados BIGINT,
  promedio_cierre_dias NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT AS casos_total,
    COUNT(*) FILTER (WHERE status != 'Cerrado')::BIGINT AS abiertos,
    COUNT(*) FILTER (WHERE status = 'Cerrado')::BIGINT AS cerrados,
    COALESCE(
      ROUND(AVG(EXTRACT(EPOCH FROM (closed_at - created_at)) / 86400)::NUMERIC, 1),
      0
    )::NUMERIC(10,1) AS promedio_cierre_dias
  FROM cases
  WHERE incident_date BETWEEN desde AND hasta;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION stats_kpis IS 'KPIs generales: total de casos, abiertos, cerrados y promedio de días para cerrar';

-- =====================================================
-- FUNCIÓN: stats_cumplimiento_plazos
-- Estadísticas de cumplimiento de plazos en case_followups
-- =====================================================
CREATE OR REPLACE FUNCTION stats_cumplimiento_plazos(desde DATE, hasta DATE)
RETURNS TABLE (
  total_plazos BIGINT,
  fuera_plazo BIGINT,
  dentro_plazo BIGINT,
  cumplimiento_pct NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH plazos AS (
    SELECT 
      cf.id,
      cf.due_date,
      cf.action_date,
      CASE 
        WHEN cf.due_date IS NOT NULL AND cf.action_date > cf.due_date THEN 1
        ELSE 0
      END AS fuera
    FROM case_followups cf
    INNER JOIN cases c ON c.id = cf.case_id
    WHERE c.incident_date BETWEEN desde AND hasta
      AND cf.due_date IS NOT NULL
  )
  SELECT 
    COUNT(*)::BIGINT AS total_plazos,
    COALESCE(SUM(fuera),0)::BIGINT AS fuera_plazo,
    (COUNT(*) - COALESCE(SUM(fuera),0))::BIGINT AS dentro_plazo,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND(((COUNT(*) - COALESCE(SUM(fuera),0))::NUMERIC / COUNT(*)) * 100, 1)
      ELSE 0
    END AS cumplimiento_pct
  FROM plazos;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION stats_cumplimiento_plazos IS 'Estadísticas de cumplimiento de plazos en seguimientos';

-- =====================================================
-- FUNCIÓN: stats_reincidencia
-- Cuenta estudiantes con más de un caso en el período
-- =====================================================
CREATE OR REPLACE FUNCTION stats_reincidencia(desde DATE, hasta DATE)
RETURNS TABLE (
  estudiantes_reincidentes BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT COUNT(*)::BIGINT
  FROM (
    SELECT student_id
    FROM cases
    WHERE incident_date BETWEEN desde AND hasta
      AND student_id IS NOT NULL
    GROUP BY student_id
    HAVING COUNT(*) >= 2
  ) sub;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION stats_reincidencia IS 'Cuenta estudiantes con 2 o más casos en el período';

-- =====================================================
-- FUNCIÓN: stats_mayor_carga
-- Responsable (campo `responsible`) con más seguimientos en el período
-- =====================================================
CREATE OR REPLACE FUNCTION stats_mayor_carga(desde DATE, hasta DATE)
RETURNS TABLE (
  responsable TEXT,
  total BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(cf.responsible, 'Sin responsable') AS responsable,
    COUNT(*)::BIGINT AS total
  FROM case_followups cf
  INNER JOIN cases c ON c.id = cf.case_id
  WHERE c.incident_date BETWEEN desde AND hasta
  GROUP BY cf.responsible
  ORDER BY COUNT(*) DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION stats_mayor_carga IS 'Responsable con más seguimientos registrados';

-- =====================================================
-- FUNCIÓN: stats_mayor_nivel
-- Categoría de conducta más frecuente (conduct_category)
-- =====================================================
CREATE OR REPLACE FUNCTION stats_mayor_nivel(desde DATE, hasta DATE)
RETURNS TABLE (
  level TEXT,
  total BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(NULLIF(conduct_category, ''), 'Desconocido') AS level,
    COUNT(*)::BIGINT AS total
  FROM cases
  WHERE incident_date BETWEEN desde AND hasta
  GROUP BY conduct_category
  ORDER BY COUNT(*) DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION stats_mayor_nivel IS 'Categoría de conducta con más casos';

-- =====================================================
-- FUNCIÓN: stats_promedio_seguimientos_por_caso
-- Promedio de seguimientos por caso en el período
-- =====================================================
CREATE OR REPLACE FUNCTION stats_promedio_seguimientos_por_caso(desde DATE, hasta DATE)
RETURNS TABLE (
  promedio NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT COALESCE(
    ROUND(AVG(cnt)::NUMERIC,1),
    0
  )::NUMERIC(10,1)
  FROM (
    SELECT COUNT(*) AS cnt
    FROM case_followups cf
    INNER JOIN cases c ON c.id = cf.case_id
    WHERE c.incident_date BETWEEN desde AND hasta
    GROUP BY c.id
  ) sub;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION stats_promedio_seguimientos_por_caso IS 'Promedio de seguimientos por caso';

-- =====================================================
-- FUNCIÓN: stats_tiempo_primer_seguimiento
-- Promedio de días hasta el primer seguimiento (desde created_at del caso)
-- =====================================================
CREATE OR REPLACE FUNCTION stats_tiempo_primer_seguimiento(desde DATE, hasta DATE)
RETURNS TABLE (
  promedio_dias NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT COALESCE(
    ROUND(AVG(EXTRACT(EPOCH FROM (primer.action_date::TIMESTAMPTZ - c.created_at)) / 86400)::NUMERIC,1),
    0
  )::NUMERIC(10,1)
  FROM cases c
  INNER JOIN LATERAL (
    SELECT action_date
    FROM case_followups
    WHERE case_id = c.id
    ORDER BY action_date ASC
    LIMIT 1
  ) primer ON TRUE
  WHERE c.incident_date BETWEEN desde AND hasta;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION stats_tiempo_primer_seguimiento IS 'Promedio de días entre creación del caso y primer seguimiento';

-- =====================================================
-- FUNCIÓN: stats_casos_por_mes
-- Casos agrupados por mes (YYYY-MM)
-- =====================================================
CREATE OR REPLACE FUNCTION stats_casos_por_mes(desde DATE, hasta DATE)
RETURNS TABLE (
  mes TEXT,
  total BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(incident_date, 'YYYY-MM') AS mes,
    COUNT(*)::BIGINT AS total
  FROM cases
  WHERE incident_date BETWEEN desde AND hasta
  GROUP BY TO_CHAR(incident_date, 'YYYY-MM')
  ORDER BY mes;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION stats_casos_por_mes IS 'Distribución de casos por mes';

-- =====================================================
-- FUNCIÓN: stats_casos_por_tipificacion
-- Top tipos de conducta por volumen
-- =====================================================
CREATE OR REPLACE FUNCTION stats_casos_por_tipificacion(desde DATE, hasta DATE)
RETURNS TABLE (
  tipo TEXT,
  total BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(NULLIF(conduct_type, ''), 'Sin tipificación') AS tipo,
    COUNT(*)::BIGINT AS total
  FROM cases
  WHERE incident_date BETWEEN desde AND hasta
  GROUP BY conduct_type
  ORDER BY COUNT(*) DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION stats_casos_por_tipificacion IS 'Top 10 tipos de conducta más frecuentes';

-- =====================================================
-- FUNCIÓN: stats_casos_por_curso
-- Casos agrupados por curso (course_incident)
-- =====================================================
CREATE OR REPLACE FUNCTION stats_casos_por_curso(desde DATE, hasta DATE)
RETURNS TABLE (
  curso TEXT,
  total BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(NULLIF(course_incident, ''), 'Sin curso') AS curso,
    COUNT(*)::BIGINT AS total
  FROM cases
  WHERE incident_date BETWEEN desde AND hasta
  GROUP BY course_incident
  ORDER BY COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION stats_casos_por_curso IS 'Distribución de casos por curso';

-- =====================================================
-- FUNCIÓN: start_due_process
-- Inicia el debido proceso para un caso: marca seguimiento_started_at, indagacion_start_date/indagacion_due_date y pone estado
-- Devuelve un JSON con los datos aplicados
-- =====================================================
CREATE OR REPLACE FUNCTION start_due_process(
  p_case_id UUID,
  p_sla_days INTEGER DEFAULT 10
)
RETURNS JSON AS $$
DECLARE
  v_deadline DATE;
  v_result JSON;
BEGIN
  -- Calcular fecha límite (p_sla_days días a partir de hoy)
  v_deadline := CURRENT_DATE + p_sla_days;
  
  -- Actualizar caso
  UPDATE cases
  SET 
    seguimiento_started_at = NOW(),
    indagacion_start_date = CURRENT_DATE,
    indagacion_due_date = v_deadline,
    status = 'En Seguimiento',
    updated_at = NOW()
  WHERE id = p_case_id;
  
  -- Retornar resultado
  SELECT json_build_object(
    'case_id', p_case_id,
    'seguimiento_started_at', NOW(),
    'indagacion_due_date', v_deadline,
    'sla_days', p_sla_days
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql VOLATILE;

COMMENT ON FUNCTION start_due_process IS 'Inicia el debido proceso estableciendo fechas de inicio y vencimiento';

-- =====================================================
-- Fin de funciones RPC
-- =====================================================
