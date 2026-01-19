-- =====================================================
-- 00_extensions.sql
-- Extensiones PostgreSQL necesarias para el sistema
-- =====================================================

-- Extensión para generar UUIDs (requerido para PKs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Extensión para funciones de texto avanzadas (opcional pero útil)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Comentarios
COMMENT ON EXTENSION "uuid-ossp" IS 'Genera identificadores únicos universales (UUID) para las claves primarias';
COMMENT ON EXTENSION "pg_trgm" IS 'Proporciona funciones de similitud de texto (útil para búsquedas)';
