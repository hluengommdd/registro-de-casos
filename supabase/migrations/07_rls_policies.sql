-- =====================================================
-- 07_rls_policies.sql
-- Políticas RLS (DESACTIVADAS)
-- No ejecutar hasta que todo el sistema esté probado.
-- =====================================================

/*
-- ======= Ejemplo de políticas (DESCOMENTAR cuando estés listo) =======

-- Habilitar RLS en las tablas (ejecutar solo después de probar las policies)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE followup_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_sla ENABLE ROW LEVEL SECURITY;
ALTER TABLE involucrados ENABLE ROW LEVEL SECURITY;

-- SELECT policy para usuarios autenticados
CREATE POLICY select_authenticated ON students FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY select_authenticated ON cases FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY select_authenticated ON case_followups FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY select_authenticated ON followup_evidence FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY select_authenticated ON process_stages FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY select_authenticated ON stage_sla FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY select_authenticated ON involucrados FOR SELECT USING (auth.uid() IS NOT NULL);

-- INSERT policy para usuarios autenticados
CREATE POLICY insert_authenticated ON students FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY insert_authenticated ON cases FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY insert_authenticated ON case_followups FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY insert_authenticated ON followup_evidence FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY insert_authenticated ON process_stages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY insert_authenticated ON stage_sla FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY insert_authenticated ON involucrados FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE policy para usuarios autenticados
CREATE POLICY update_authenticated ON students FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY update_authenticated ON cases FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY update_authenticated ON case_followups FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY update_authenticated ON followup_evidence FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY update_authenticated ON process_stages FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY update_authenticated ON stage_sla FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY update_authenticated ON involucrados FOR UPDATE USING (auth.uid() IS NOT NULL);

-- DELETE policy para usuarios autenticados
CREATE POLICY delete_authenticated ON students FOR DELETE USING (auth.uid() IS NOT NULL);
CREATE POLICY delete_authenticated ON cases FOR DELETE USING (auth.uid() IS NOT NULL);
CREATE POLICY delete_authenticated ON case_followups FOR DELETE USING (auth.uid() IS NOT NULL);
CREATE POLICY delete_authenticated ON followup_evidence FOR DELETE USING (auth.uid() IS NOT NULL);
CREATE POLICY delete_authenticated ON process_stages FOR DELETE USING (auth.uid() IS NOT NULL);
CREATE POLICY delete_authenticated ON stage_sla FOR DELETE USING (auth.uid() IS NOT NULL);
CREATE POLICY delete_authenticated ON involucrados FOR DELETE USING (auth.uid() IS NOT NULL);

-- Forzar RLS (solo cuando ya todo esté probado)
ALTER TABLE students FORCE ROW LEVEL SECURITY;
ALTER TABLE cases FORCE ROW LEVEL SECURITY;
ALTER TABLE case_followups FORCE ROW LEVEL SECURITY;
ALTER TABLE followup_evidence FORCE ROW LEVEL SECURITY;
ALTER TABLE process_stages FORCE ROW LEVEL SECURITY;
ALTER TABLE stage_sla FORCE ROW LEVEL SECURITY;
ALTER TABLE involucrados FORCE ROW LEVEL SECURITY;

*/
-- =====================================================
-- NOTAS:
-- - El contenido está comentado para evitar habilitar RLS por accidente.
-- - Workflow sugerido cuando quieras activar RLS:
--   1) Crear las CREATE POLICY (puedes ejecutarlas con RLS DESACTIVADA).
--   2) Probar consultas/operaciones (anon y supabase client) para verificar que las policies permiten lo necesario.
--   3) Habilitar RLS por tabla (ALTER TABLE ... ENABLE ROW LEVEL SECURITY).
--   4) Validar operaciones en frontend/staging.
--   5) Finalmente, si todo OK, usar FORCE ROW LEVEL SECURITY solo si quieres impedir bypass.
-- =====================================================