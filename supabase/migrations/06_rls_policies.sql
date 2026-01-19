-- =====================================================
-- 06_rls_policies.sql
-- Políticas de Row Level Security (RLS)
-- =====================================================

-- IMPORTANTE: Este archivo contiene políticas RLS básicas y permisivas.
-- Cada colegio debe personalizar estas políticas según sus necesidades de seguridad.

-- =====================================================
-- Habilitar RLS en todas las tablas
-- =====================================================

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE followup_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE involucrados ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_sla ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Políticas permisivas iniciales (anon y authenticated)
-- =====================================================
-- NOTA: Estas políticas permiten acceso completo para facilitar
-- la configuración inicial. DEBEN ser ajustadas según el rol
-- y permisos específicos de cada colegio.

-- Políticas para students
CREATE POLICY "Permitir lectura pública de estudiantes"
  ON students FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserción de estudiantes"
  ON students FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir actualización de estudiantes"
  ON students FOR UPDATE
  USING (true);

-- Políticas para cases
CREATE POLICY "Permitir lectura pública de casos"
  ON cases FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserción de casos"
  ON cases FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir actualización de casos"
  ON cases FOR UPDATE
  USING (true);

-- Políticas para case_followups
CREATE POLICY "Permitir lectura pública de seguimientos"
  ON case_followups FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserción de seguimientos"
  ON case_followups FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir actualización de seguimientos"
  ON case_followups FOR UPDATE
  USING (true);

-- Políticas para followup_evidence
CREATE POLICY "Permitir lectura pública de evidencias"
  ON followup_evidence FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserción de evidencias"
  ON followup_evidence FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir eliminación de evidencias"
  ON followup_evidence FOR DELETE
  USING (true);

-- Políticas para involucrados
CREATE POLICY "Permitir lectura pública de involucrados"
  ON involucrados FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserción de involucrados"
  ON involucrados FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir actualización de involucrados"
  ON involucrados FOR UPDATE
  USING (true);

CREATE POLICY "Permitir eliminación de involucrados"
  ON involucrados FOR DELETE
  USING (true);

-- Políticas para stage_sla
CREATE POLICY "Permitir lectura pública de SLA"
  ON stage_sla FOR SELECT
  USING (true);

CREATE POLICY "Permitir actualización de SLA"
  ON stage_sla FOR UPDATE
  USING (true);

-- =====================================================
-- Ejemplos de políticas más restrictivas
-- =====================================================
-- Descomentar y adaptar según las necesidades del colegio

-- Ejemplo 1: Solo usuarios autenticados pueden insertar casos
-- DROP POLICY "Permitir inserción de casos" ON cases;
-- CREATE POLICY "Solo autenticados pueden insertar casos"
--   ON cases FOR INSERT
--   WITH CHECK (auth.role() = 'authenticated');

-- Ejemplo 2: Solo los responsables pueden actualizar sus seguimientos
-- DROP POLICY "Permitir actualización de seguimientos" ON case_followups;
-- CREATE POLICY "Solo responsable puede actualizar seguimiento"
--   ON case_followups FOR UPDATE
--   USING (responsible = auth.jwt() ->> 'email');

-- Ejemplo 3: Restricción por roles personalizados
-- CREATE POLICY "Solo inspectores pueden cerrar casos"
--   ON cases FOR UPDATE
--   USING (
--     (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('inspector', 'admin')
--     OR status != 'Cerrado'
--   );

-- =====================================================
-- Configuración de Storage Buckets
-- =====================================================
-- NOTA: Este script SQL no puede crear buckets de storage directamente.
-- Los buckets deben crearse desde el panel de Supabase o mediante la API.

-- Para el bucket 'evidencias', configurar las políticas de storage:
-- 1. Ir a Storage > Policies en el panel de Supabase
-- 2. Crear políticas para el bucket 'evidencias':
--    - SELECT: permitir lectura a usuarios autenticados
--    - INSERT: permitir carga a usuarios autenticados
--    - DELETE: permitir eliminación solo al propietario o admin

-- Ejemplo de política de storage (ejecutar desde el panel de Supabase):
-- CREATE POLICY "Usuarios autenticados pueden subir evidencias"
--   ON storage.objects FOR INSERT
--   TO authenticated
--   WITH CHECK (bucket_id = 'evidencias');

-- CREATE POLICY "Usuarios autenticados pueden ver evidencias"
--   ON storage.objects FOR SELECT
--   TO authenticated
--   USING (bucket_id = 'evidencias');

-- CREATE POLICY "Usuarios autenticados pueden eliminar sus evidencias"
--   ON storage.objects FOR DELETE
--   TO authenticated
--   USING (bucket_id = 'evidencias');
