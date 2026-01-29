-- =====================================================
-- 08_seed_data.sql
-- Datos semilla para configuración inicial
-- Ejecutar DESPUÉS de 07_rls_policies.sql (OPCIONAL)
-- =====================================================

-- =====================================================
-- DATOS:  stage_sla
-- SLA por etapa del debido proceso
-- =====================================================

INSERT INTO stage_sla (stage_key, days_to_due, description)
VALUES 
  ('Indagación', 5, 'Plazo para completar la indagación inicial'),
  ('Entrevista', 3, 'Plazo para realizar entrevista con involucrados'),
  ('Notificación Apoderado', 2, 'Plazo para notificar al apoderado'),
  ('Resolución', 10, 'Plazo para emitir resolución del caso'),
  ('Apelación', 5, 'Plazo para procesar apelación si existe'),
  ('Seguimiento', 7, 'Plazo general para seguimientos periódicos')
ON CONFLICT (stage_key) DO UPDATE
SET 
  days_to_due = EXCLUDED.days_to_due,
  description = EXCLUDED.description,
  updated_at = NOW();

-- =====================================================
-- DATOS: process_stages
-- Catálogo de etapas del debido proceso
-- =====================================================

INSERT INTO process_stages (stage_name, stage_order, description)
VALUES 
  ('Indagación', 1, 'Recopilación inicial de información sobre el incidente'),
  ('Entrevista', 2, 'Entrevistas con estudiantes involucrados y testigos'),
  ('Notificación Apoderado', 3, 'Notificación formal al apoderado del estudiante'),
  ('Análisis', 4, 'Análisis de antecedentes y evidencias'),
  ('Resolución', 5, 'Emisión de resolución y medidas formativas/disciplinarias'),
  ('Apelación', 6, 'Proceso de apelación si corresponde'),
  ('Seguimiento', 7, 'Seguimiento de medidas aplicadas'),
  ('Cierre', 8, 'Cierre del caso')
ON CONFLICT (stage_name) DO UPDATE
SET 
  stage_order = EXCLUDED.stage_order,
  description = EXCLUDED.description;

-- =====================================================
-- Fin de datos semilla
-- =====================================================
