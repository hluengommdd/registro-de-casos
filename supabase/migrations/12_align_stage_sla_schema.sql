-- =====================================================
-- 12_align_stage_sla_schema.sql
-- Alinea stage_sla al esquema real de producción
-- =====================================================

-- 1) Limpiar trigger legacy que depende de updated_at
DROP TRIGGER IF EXISTS trigger_stage_sla_updated_at ON stage_sla;

-- 2) Validaciones previas: evitar dejar la tabla en estado intermedio
DO $$
DECLARE
  null_count bigint;
  empty_count bigint;
  dup_count bigint;
  dup_sample text;
BEGIN
  SELECT count(*) INTO null_count
  FROM public.stage_sla
  WHERE stage_key IS NULL;

  IF null_count > 0 THEN
    RAISE EXCEPTION
      'stage_sla contiene % fila(s) con stage_key NULL. Corrige esos datos antes de migrar.',
      null_count;
  END IF;

  SELECT count(*) INTO empty_count
  FROM public.stage_sla
  WHERE btrim(stage_key) = '';

  IF empty_count > 0 THEN
    RAISE EXCEPTION
      'stage_sla contiene % fila(s) con stage_key vacío. Corrige esos datos antes de migrar.',
      empty_count;
  END IF;

  WITH dups AS (
    SELECT stage_key
    FROM public.stage_sla
    GROUP BY stage_key
    HAVING count(*) > 1
  )
  SELECT count(*), coalesce(string_agg(stage_key, ', '), '')
    INTO dup_count, dup_sample
  FROM (
    SELECT stage_key
    FROM dups
    ORDER BY stage_key
    LIMIT 5
  ) s;

  IF dup_count > 0 THEN
    RAISE EXCEPTION
      'stage_sla contiene % stage_key duplicados. Ejemplos: %',
      dup_count,
      dup_sample;
  END IF;
END
$$;

-- 3) Eliminar PK actual (si existe) para poder fijar PK en stage_key
DO $$
DECLARE
  pk_name text;
BEGIN
  SELECT c.conname
    INTO pk_name
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'public'
    AND t.relname = 'stage_sla'
    AND c.contype = 'p'
  LIMIT 1;

  IF pk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.stage_sla DROP CONSTRAINT %I', pk_name);
  END IF;
END
$$;

-- 4) Limpiar constraints legacy y normalizar columnas
ALTER TABLE public.stage_sla DROP CONSTRAINT IF EXISTS check_days_positive;
ALTER TABLE public.stage_sla DROP CONSTRAINT IF EXISTS ck_stage_sla_days_to_due;
ALTER TABLE public.stage_sla DROP CONSTRAINT IF EXISTS uq_stage_sla_stage_key;

ALTER TABLE public.stage_sla
  ALTER COLUMN stage_key SET NOT NULL,
  ALTER COLUMN days_to_due DROP NOT NULL;

-- 5) Eliminar columnas legacy (si existen)
ALTER TABLE public.stage_sla DROP COLUMN IF EXISTS description;
ALTER TABLE public.stage_sla DROP COLUMN IF EXISTS created_at;
ALTER TABLE public.stage_sla DROP COLUMN IF EXISTS updated_at;
ALTER TABLE public.stage_sla DROP COLUMN IF EXISTS id;

-- 6) Re-crear constraints esperados por el esquema actual
ALTER TABLE public.stage_sla
  ADD CONSTRAINT stage_sla_pkey PRIMARY KEY (stage_key);

ALTER TABLE public.stage_sla
  ADD CONSTRAINT uq_stage_sla_stage_key UNIQUE (stage_key);

ALTER TABLE public.stage_sla
  ADD CONSTRAINT ck_stage_sla_days_to_due CHECK (days_to_due >= 0);

-- =====================================================
-- Fin
-- =====================================================
