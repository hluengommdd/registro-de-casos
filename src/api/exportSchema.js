/* global process */
import fs from 'fs';
import path from 'path';
import pg from 'pg';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL; // postgres://user:password@host:port/database

const { Pool } = pg;

async function exportSchema() {
  const outputDir = './supabase/migrations';
  
  // Crear directorio si no existe
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('🔍 Extrayendo estructura de Supabase...');

  const pool = new Pool({
    connectionString: SUPABASE_DB_URL
  });

  try {
    const client = await pool.connect();

    // 00_extensions.sql
    const extensionsQuery = `
      SELECT 'CREATE EXTENSION IF NOT EXISTS "' || extname || '";'
      FROM pg_extension
      WHERE extname NOT IN ('plpgsql')
      ORDER BY extname;
    `;
    const extensionsResult = await client.query(extensionsQuery);
    saveFile('00_extensions', extensionsResult.rows.map(r => r['?column?']).join('\n'), outputDir);

    // 01_tables.sql
    const tablesQuery = `
      SELECT 
        'CREATE TABLE IF NOT EXISTS public.' || table_name || ' (' || E'\n' ||
        string_agg(
          '  ' || column_name || ' ' || 
          CASE 
            WHEN udt_name = 'uuid' THEN 'UUID'
            WHEN udt_name = 'text' THEN 'TEXT'
            WHEN udt_name = 'varchar' THEN 'VARCHAR(' || character_maximum_length || ')'
            WHEN udt_name = 'int4' THEN 'INTEGER'
            WHEN udt_name = 'int8' THEN 'BIGINT'
            WHEN udt_name = 'bool' THEN 'BOOLEAN'
            WHEN udt_name = 'timestamp' THEN 'TIMESTAMP'
            WHEN udt_name = 'timestamptz' THEN 'TIMESTAMPTZ'
            WHEN udt_name = 'date' THEN 'DATE'
            WHEN udt_name = 'jsonb' THEN 'JSONB'
            WHEN udt_name = 'numeric' THEN 'NUMERIC'
            ELSE UPPER(udt_name)
          END ||
          CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
          CASE 
            WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default 
            ELSE '' 
          END,
          ',' || E'\n'
        ) || E'\n);' || E'\n'
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN ('cases', 'students', 'case_followups', 'followup_evidence', 'control_alertas', 'process_stages')
      GROUP BY table_name
      ORDER BY 
        CASE table_name
          WHEN 'students' THEN 1
          WHEN 'cases' THEN 2
          WHEN 'case_followups' THEN 3
          WHEN 'followup_evidence' THEN 4
          ELSE 5
        END;
    `;
    const tablesResult = await client.query(tablesQuery);
    let tablesContent = tablesResult.rows.map(r => r['?column?']).join('\n');

    // Agregar primary keys a 01_tables.sql
    const primaryKeysQuery = `
      SELECT 
        'ALTER TABLE public.' || tc.table_name || 
        ' ADD CONSTRAINT ' || tc.constraint_name ||
        ' PRIMARY KEY (' || string_agg(kcu.column_name, ', ') || ');'
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'public'
      GROUP BY tc.table_name, tc.constraint_name
      ORDER BY tc.table_name;
    `;
    const primaryKeysResult = await client.query(primaryKeysQuery);
    tablesContent += '\n\n' + primaryKeysResult.rows.map(r => r['?column?']).join('\n');
    saveFile('01_tables', tablesContent, outputDir);

    // 02_foreign_keys.sql
    const foreignKeysQuery = `
      SELECT 
        'ALTER TABLE public.' || tc.table_name || 
        ' ADD CONSTRAINT ' || tc.constraint_name ||
        ' FOREIGN KEY (' || kcu.column_name || ')' ||
        ' REFERENCES public.' || ccu.table_name || '(' || ccu.column_name || ')' ||
        ' ON DELETE CASCADE;'
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name;
    `;
    const foreignKeysResult = await client.query(foreignKeysQuery);
    saveFile('02_foreign_keys', foreignKeysResult.rows.map(r => r['?column?']).join('\n'), outputDir);

    // 03_indexes.sql
    const indexesQuery = `
      SELECT 
        'CREATE INDEX IF NOT EXISTS ' || indexname || 
        ' ON public.' || tablename || 
        ' USING btree' ||
        ' (' || 
        (SELECT string_agg(attname, ', ' ORDER BY attnum)
         FROM pg_attribute
         WHERE attrelid = (schemaname || '.' || indexname)::regclass
           AND attnum > 0
           AND NOT attisdropped) ||
        ');'
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname NOT LIKE '%_pkey%'
        AND indexname NOT LIKE 'pg_%'
      ORDER BY tablename, indexname;
    `;
    const indexesResult = await client.query(indexesQuery);
    saveFile('03_indexes', indexesResult.rows.map(r => r['?column?']).join('\n'), outputDir);

    // 04_functions.sql
    const functionsQuery = `
      SELECT 
        'CREATE OR REPLACE FUNCTION public.' || routine_name || 
        '(' || COALESCE(
          (SELECT string_agg(
            parameter_name || ' ' || 
            CASE 
              WHEN udt_name = 'date' THEN 'DATE'
              WHEN udt_name = 'text' THEN 'TEXT'
              ELSE UPPER(udt_name)
            END,
            ', '
          )
          FROM information_schema.parameters
          WHERE specific_name = r.specific_name
            AND parameter_mode = 'IN'),
          ''
        ) || ')' || E'\n' ||
        'RETURNS ' || 
        CASE 
          WHEN data_type = 'USER-DEFINED' THEN 'TABLE'
          WHEN data_type = 'integer' THEN 'INTEGER'
          ELSE UPPER(data_type)
        END || E'\n' ||
        'LANGUAGE plpgsql' || E'\n' ||
        'AS $' || '$' || E'\n' ||
        routine_definition || E'\n' ||
        '$' || '$;' || E'\n'
      FROM information_schema.routines r
      WHERE routine_schema = 'public'
        AND routine_name LIKE 'stats_%'
      ORDER BY routine_name;
    `;
    const functionsResult = await client.query(functionsQuery);
    saveFile('04_functions', functionsResult.rows.map(r => r['?column?']).join('\n'), outputDir);

    // 05_triggers.sql
    const triggersQuery = `
      SELECT 
        'CREATE TRIGGER ' || trigger_name || E'\n' ||
        '  ' || action_timing || ' ' || event_manipulation || E'\n' ||
        '  ON public.' || event_object_table || E'\n' ||
        '  FOR EACH ' || action_orientation || E'\n' ||
        '  EXECUTE FUNCTION ' || action_statement || ';'
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
        AND trigger_name NOT LIKE 'pg_%'
      ORDER BY event_object_table, trigger_name;
    `;
    const triggersResult = await client.query(triggersQuery);
    saveFile('05_triggers', triggersResult.rows.map(r => r['?column?']).join('\n'), outputDir);

    // 06_rls_policies.sql
    const rlsQuery = `
      SELECT 
        'ALTER TABLE public.' || tablename || ' ENABLE ROW LEVEL SECURITY;'
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN ('cases', 'students', 'case_followups', 'followup_evidence', 'control_alertas')
      ORDER BY tablename;
    `;
    const rlsResult = await client.query(rlsQuery);
    let rlsContent = rlsResult.rows.map(r => r['?column?']).join('\n');

    const policiesQuery = `
      SELECT 
        E'\n-- Política: ' || policyname || ' en tabla ' || tablename || E'\n' ||
        'CREATE POLICY "' || policyname || '"' || E'\n' ||
        '  ON public.' || tablename || E'\n' ||
        '  FOR ' || cmd || E'\n' ||
        '  TO ' || array_to_string(roles, ', ') || E'\n' ||
        CASE 
          WHEN qual IS NOT NULL THEN '  USING (' || qual || ')' || E'\n'
          ELSE ''
        END ||
        CASE 
          WHEN with_check IS NOT NULL THEN '  WITH CHECK (' || with_check || ');'
          ELSE ';'
        END
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `;
    const policiesResult = await client.query(policiesQuery);
    rlsContent += '\n\n' + policiesResult.rows.map(r => r['?column?']).join('\n');
    saveFile('06_rls_policies', rlsContent, outputDir);

    client.release();
    console.log('✅ Todas las migraciones han sido exportadas correctamente');
  } catch (error) {
    console.error('❌ Error al exportar schema:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

function saveFile(filename, content, outputDir) {
  const filepath = path.join(outputDir, `${filename}.sql`);
  fs.writeFileSync(filepath, content);
  console.log(`✅ ${filename}.sql generado`);
}

exportSchema();