-- =====================================================
-- 00_extensions.sql
-- Habilitar extensiones necesarias para el sistema
-- Ejecutar como superuser si es necesario
-- =====================================================

-- Extensión para generar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Extensión para búsquedas y comparación de texto (trigram)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Extensión para normalizar texto (útil en búsquedas full-text)
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- =====================================================
-- Fin de 00_extensions.sql
-- =====================================================
