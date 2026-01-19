-- =====================================================
-- 04_functions.sql
-- Funciones RPC para estadísticas y procesos
-- =====================================================

-- IMPORTANTE: Estas funciones son STUBS (esqueletos) que retornan valores de ejemplo.
-- Deben ser implementadas según los requerimientos específicos del colegio.

-- =====================================================
-- Función: stats_kpis
-- Retorna KPIs generales del sistema
-- =====================================================
CREATE OR REPLACE FUNCTION stats_kpis(
  desde DATE,
  hasta DATE
)
RETURNS TABLE (
  casos_total BIGINT,
  abiertos BIGINT,
  cerrados BIGINT,
  promedio_cierre_dias NUMERIC
) AS $$
BEGIN
  -- TODO: Implementar lógica real según requirements del colegio
  -- Ejemplo de implementación:
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS casos_total,
    COUNT(*) FILTER (WHERE status IN ('Reportado', 'Activo', 'En Seguimiento'))::BIGINT AS abiertos,
    COUNT(*) FILTER (WHERE status = 'Cerrado')::BIGINT AS cerrados,
    AVG(EXTRACT(EPOCH FROM (closed_at - created_at)) / 86400.0)::NUMERIC AS promedio_cierre_dias
  FROM cases
  WHERE incident_date BETWEEN desde AND hasta;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION stats_kpis IS 'Retorna KPIs generales (total casos, abiertos, cerrados, promedio días cierre)';

-- =====================================================
-- Función: stats_cumplimiento_plazos
-- Retorna estadísticas de cumplimiento de plazos
-- =====================================================
CREATE OR REPLACE FUNCTION stats_cumplimiento_plazos(
  desde DATE,
  hasta DATE
)
RETURNS TABLE (
  total_plazos BIGINT,
  fuera_plazo BIGINT,
  dentro_plazo BIGINT,
  cumplimiento_pct NUMERIC
) AS $$
BEGIN
  -- TODO: Implementar lógica real según requirements del colegio
  -- Esta es una implementación placeholder
  RETURN QUERY
  SELECT
    0::BIGINT AS total_plazos,
    0::BIGINT AS fuera_plazo,
    0::BIGINT AS dentro_plazo,
    0::NUMERIC AS cumplimiento_pct;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION stats_cumplimiento_plazos IS 'Retorna estadísticas de cumplimiento de plazos SLA';

-- =====================================================
-- Función: stats_reincidencia
-- Retorna número de estudiantes con más de un caso
-- =====================================================
CREATE OR REPLACE FUNCTION stats_reincidencia(
  desde DATE,
  hasta DATE
)
RETURNS TABLE (
  estudiantes_reincidentes BIGINT
) AS $$
BEGIN
  -- TODO: Implementar lógica real según requirements del colegio
  RETURN QUERY
  SELECT COUNT(*)::BIGINT AS estudiantes_reincidentes
  FROM (
    SELECT student_id
    FROM cases
    WHERE incident_date BETWEEN desde AND hasta
    GROUP BY student_id
    HAVING COUNT(*) >= 2
  ) reincidentes;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION stats_reincidencia IS 'Retorna número de estudiantes con 2 o más casos en el período';

-- =====================================================
-- Función: stats_mayor_carga
-- Retorna el responsable con más seguimientos
-- =====================================================
CREATE OR REPLACE FUNCTION stats_mayor_carga(
  desde DATE,
  hasta DATE
)
RETURNS TABLE (
  responsable TEXT,
  total BIGINT
) AS $$
BEGIN
  -- TODO: Implementar lógica real según requirements del colegio
  RETURN QUERY
  SELECT
    COALESCE(cf.responsible, 'Sin responsable') AS responsable,
    COUNT(*)::BIGINT AS total
  FROM case_followups cf
  JOIN cases c ON cf.case_id = c.id
  WHERE c.incident_date BETWEEN desde AND hasta
  GROUP BY cf.responsible
  ORDER BY COUNT(*) DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION stats_mayor_carga IS 'Retorna el responsable con más seguimientos asignados';

-- =====================================================
-- Función: stats_mayor_nivel
-- Retorna el nivel de falta más frecuente
-- =====================================================
CREATE OR REPLACE FUNCTION stats_mayor_nivel(
  desde DATE,
  hasta DATE
)
RETURNS TABLE (
  level TEXT,
  total BIGINT
) AS $$
BEGIN
  -- TODO: Implementar lógica real según requirements del colegio
  RETURN QUERY
  SELECT
    COALESCE(conduct_type, 'Desconocido') AS level,
    COUNT(*)::BIGINT AS total
  FROM cases
  WHERE incident_date BETWEEN desde AND hasta
  GROUP BY conduct_type
  ORDER BY COUNT(*) DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION stats_mayor_nivel IS 'Retorna el tipo de falta más frecuente';

-- =====================================================
-- Función: stats_promedio_seguimientos_por_caso
-- Retorna promedio de seguimientos por caso
-- =====================================================
CREATE OR REPLACE FUNCTION stats_promedio_seguimientos_por_caso(
  desde DATE,
  hasta DATE
)
RETURNS TABLE (
  promedio NUMERIC
) AS $$
BEGIN
  -- TODO: Implementar lógica real según requirements del colegio
  RETURN QUERY
  SELECT
    COALESCE(AVG(seguimientos_count), 0)::NUMERIC AS promedio
  FROM (
    SELECT COUNT(*) AS seguimientos_count
    FROM case_followups cf
    JOIN cases c ON cf.case_id = c.id
    WHERE c.incident_date BETWEEN desde AND hasta
    GROUP BY cf.case_id
  ) sub;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION stats_promedio_seguimientos_por_caso IS 'Retorna promedio de seguimientos por caso';

-- =====================================================
-- Función: stats_tiempo_primer_seguimiento
-- Retorna promedio de días hasta el primer seguimiento
-- =====================================================
CREATE OR REPLACE FUNCTION stats_tiempo_primer_seguimiento(
  desde DATE,
  hasta DATE
)
RETURNS TABLE (
  promedio_dias NUMERIC
) AS $$
BEGIN
  -- TODO: Implementar lógica real según requirements del colegio
  RETURN QUERY
  SELECT
    COALESCE(AVG(dias_al_primer_seguimiento), 0)::NUMERIC AS promedio_dias
  FROM (
    SELECT
      EXTRACT(EPOCH FROM (MIN(cf.created_at) - c.created_at)) / 86400.0 AS dias_al_primer_seguimiento
    FROM cases c
    LEFT JOIN case_followups cf ON c.id = cf.case_id
    WHERE c.incident_date BETWEEN desde AND hasta
    GROUP BY c.id
    HAVING MIN(cf.created_at) IS NOT NULL
  ) sub;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION stats_tiempo_primer_seguimiento IS 'Retorna promedio de días desde creación del caso hasta el primer seguimiento';

-- =====================================================
-- Función: stats_casos_por_mes
-- Retorna distribución de casos por mes
-- =====================================================
CREATE OR REPLACE FUNCTION stats_casos_por_mes(
  desde DATE,
  hasta DATE
)
RETURNS TABLE (
  mes TEXT,
  total BIGINT
) AS $$
BEGIN
  -- TODO: Implementar lógica real según requirements del colegio
  RETURN QUERY
  SELECT
    TO_CHAR(incident_date, 'YYYY-MM') AS mes,
    COUNT(*)::BIGINT AS total
  FROM cases
  WHERE incident_date BETWEEN desde AND hasta
  GROUP BY TO_CHAR(incident_date, 'YYYY-MM')
  ORDER BY mes;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION stats_casos_por_mes IS 'Retorna distribución de casos por mes';

-- =====================================================
-- Función: stats_casos_por_tipificacion
-- Retorna distribución de casos por tipo de falta
-- =====================================================
CREATE OR REPLACE FUNCTION stats_casos_por_tipificacion(
  desde DATE,
  hasta DATE
)
RETURNS TABLE (
  tipificacion TEXT,
  total BIGINT
) AS $$
BEGIN
  -- TODO: Implementar lógica real según requirements del colegio
  RETURN QUERY
  SELECT
    COALESCE(conduct_type, 'Sin clasificar') AS tipificacion,
    COUNT(*)::BIGINT AS total
  FROM cases
  WHERE incident_date BETWEEN desde AND hasta
  GROUP BY conduct_type
  ORDER BY total DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION stats_casos_por_tipificacion IS 'Retorna distribución de casos por tipo de falta';

-- =====================================================
-- Función: stats_casos_por_curso
-- Retorna distribución de casos por curso
-- =====================================================
CREATE OR REPLACE FUNCTION stats_casos_por_curso(
  desde DATE,
  hasta DATE
)
RETURNS TABLE (
  curso TEXT,
  total BIGINT
) AS $$
BEGIN
  -- TODO: Implementar lógica real según requirements del colegio
  RETURN QUERY
  SELECT
    COALESCE(course_incident, 'Sin curso') AS curso,
    COUNT(*)::BIGINT AS total
  FROM cases
  WHERE incident_date BETWEEN desde AND hasta
  GROUP BY course_incident
  ORDER BY total DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION stats_casos_por_curso IS 'Retorna distribución de casos por curso';

-- =====================================================
-- Función: start_due_process
-- Inicia el debido proceso para un caso
-- =====================================================
CREATE OR REPLACE FUNCTION start_due_process(
  p_case_id UUID,
  p_sla_days INTEGER DEFAULT 10
)
RETURNS JSONB AS $$
DECLARE
  v_start_date DATE;
  v_due_date DATE;
BEGIN
  -- TODO: Implementar lógica real según requirements del colegio
  -- Esta implementación básica calcula días hábiles sumando solo días naturales
  -- Se debe ajustar para calcular días hábiles reales (excluyendo fines de semana y feriados)
  
  v_start_date := CURRENT_DATE;
  v_due_date := v_start_date + (p_sla_days || ' days')::INTERVAL;
  
  -- Actualizar el caso con las fechas de inicio y vencimiento
  UPDATE cases
  SET
    seguimiento_started_at = NOW(),
    indagacion_start_date = v_start_date,
    indagacion_due_date = v_due_date,
    status = 'En Seguimiento',
    updated_at = NOW()
  WHERE id = p_case_id;
  
  -- Retornar información del proceso iniciado
  RETURN jsonb_build_object(
    'case_id', p_case_id,
    'start_date', v_start_date,
    'due_date', v_due_date,
    'sla_days', p_sla_days,
    'status', 'En Seguimiento'
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION start_due_process IS 'Inicia el debido proceso para un caso, estableciendo fechas y cambiando el estado';
