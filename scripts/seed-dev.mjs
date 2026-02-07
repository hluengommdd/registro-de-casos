import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './_supabaseEnv.mjs';

const { url: SUPABASE_URL, key: SUPABASE_KEY } = await getSupabaseConfig();
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function isoDateDaysAgo(days = 0) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

async function ensureConductCatalog() {
  // Check if table exists and count rows
  try {
    const { count, error } = await supabase
      .from('conduct_catalog')
      .select('id', { count: 'exact', head: true });
    if (error) throw error;

    if (count === 0) {
      const seed = [
        { conduct_type: 'Tipo A', conduct_category: 'Leve' },
        { conduct_type: 'Tipo A', conduct_category: 'Grave' },
        { conduct_type: 'Tipo A', conduct_category: 'Gravísima' },
        { conduct_type: 'Tipo B', conduct_category: 'Leve' },
        { conduct_type: 'Tipo B', conduct_category: 'Grave' },
        { conduct_type: 'Tipo B', conduct_category: 'Gravísima' },
      ];

      const { error: insertError } = await supabase
        .from('conduct_catalog')
        .insert(seed);
      if (insertError) throw insertError;
    }

    return true;
  } catch (err) {
    // If table doesn't exist, warn and skip
    const msg = String(err?.message || err);
    if (
      /relation .* does not exist|table .* does not exist|"conduct_catalog"/.test(
        msg,
      )
    ) {
      console.warn(
        'Tabla `conduct_catalog` no encontrada; se omite seed para este catálogo.',
      );
      return false;
    }
    throw err;
  }
}

async function ensureCases() {
  // Check existing count
  const { count, error } = await supabase
    .from('cases')
    .select('id', { count: 'exact', head: true });
  if (error) throw error;

  if (count === 0) {
    const seedCases = [
      {
        incident_date: isoDateDaysAgo(0),
        course_incident: '7°A',
        status: 'En seguimiento',
        short_description: 'Incidente ejemplo 1',
      },
      {
        incident_date: isoDateDaysAgo(1),
        course_incident: '8°B',
        status: 'En seguimiento',
        short_description: 'Incidente ejemplo 2',
      },
      {
        incident_date: isoDateDaysAgo(2),
        course_incident: '9°C',
        status: 'Reportado',
        short_description: 'Incidente ejemplo 3',
      },
      {
        incident_date: isoDateDaysAgo(3),
        course_incident: '7°B',
        status: 'Cerrado',
        closed_at: new Date().toISOString(),
        short_description: 'Incidente ejemplo 4',
      },
      {
        incident_date: isoDateDaysAgo(4),
        course_incident: '8°A',
        status: 'Pendiente',
        short_description: 'Incidente ejemplo 5',
      },
    ];

    const { error: insertError } = await supabase
      .from('cases')
      .insert(seedCases);
    if (insertError) throw insertError;
  }

  return true;
}

async function reportCounts() {
  // conduct_catalog count (if table exists)
  let conductCount = null;
  try {
    const { count, error } = await supabase
      .from('conduct_catalog')
      .select('id', { count: 'exact', head: true });
    if (error) throw error;
    conductCount = count;
  } catch (err) {
    conductCount = null; // table missing
  }

  const { count: casesCount, error: casesError } = await supabase
    .from('cases')
    .select('id', { count: 'exact', head: true });
  if (casesError) throw casesError;

  const { count: seguimientoCount, error: seguimientoError } = await supabase
    .from('cases')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'En seguimiento');
  if (seguimientoError) throw seguimientoError;

  console.log(
    `Filas en conduct_catalog: ${conductCount === null ? '(tabla no encontrada)' : conductCount}`,
  );
  console.log(`Filas en cases: ${casesCount}`);
  console.log(`Filas con status = "En seguimiento": ${seguimientoCount}`);
}

(async () => {
  try {
    await ensureConductCatalog();
    await ensureCases();
    await reportCounts();
  } catch (err) {
    console.error('Seed error:', err?.message || err);
    process.exitCode = 1;
  }
})();
