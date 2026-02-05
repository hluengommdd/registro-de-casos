-- =====================================================
-- 11_drop_legacy_views.sql
-- Limpia vistas legacy si existen en otros entornos
-- =====================================================

DROP VIEW IF EXISTS v_control_plazos_case_resumen CASCADE;
DROP VIEW IF EXISTS v_control_plazos_plus CASCADE;
DROP VIEW IF EXISTS v_control_plazos CASCADE;
DROP VIEW IF EXISTS v_control_alertas CASCADE;
DROP VIEW IF EXISTS v_cases_listado CASCADE;
DROP VIEW IF EXISTS v_cases_activos CASCADE;
DROP VIEW IF EXISTS v_cases_estado_oficial CASCADE;
