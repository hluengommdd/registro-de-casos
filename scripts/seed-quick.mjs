import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './_supabaseEnv.mjs';

const { url: SUPABASE_URL, key: SUPABASE_KEY } = await getSupabaseConfig();
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function isoDateDaysAgo(days = 0) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

async function run() {
  // Check existing count in cases (head count)
  const { count, error } = await supabase
    .from('cases')
    .select('id', { count: 'exact', head: true });
  if (error) throw error;

  if (count > 0) {
    console.log('Seed omitido: cases ya tiene datos');
    // Print totals for quick verification
    console.log(`Total cases: ${count}`);
    const { count: seguimientoCount, error: segErr } = await supabase
      .from('cases')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'En seguimiento');
    if (segErr) throw segErr;
    console.log(`Cases En seguimiento: ${seguimientoCount}`);
    return;
  }

  // Insert 5 minimal cases using only columns used by buildCaseInsert
  const seed = [
    {
      incident_date: isoDateDaysAgo(0),
      course_incident: '7°A',
      status: 'En seguimiento',
      short_description: 'Seed caso 1',
    },
    {
      incident_date: isoDateDaysAgo(1),
      course_incident: '8°B',
      status: 'En seguimiento',
      short_description: 'Seed caso 2',
    },
    {
      incident_date: isoDateDaysAgo(2),
      course_incident: '9°C',
      status: 'Reportado',
      short_description: 'Seed caso 3',
    },
    {
      incident_date: isoDateDaysAgo(3),
      course_incident: '7°B',
      status: 'Cerrado',
      short_description: 'Seed caso 4',
      closed_at: new Date().toISOString(),
    },
    {
      incident_date: isoDateDaysAgo(4),
      course_incident: '8°A',
      status: 'Pendiente',
      short_description: 'Seed caso 5',
    },
  ];

  // Perform insert
  const { error: insertError } = await supabase.from('cases').insert(seed);
  if (insertError) {
    // If check constraint prevents insert (closed_at required etc.), try inserting without closed_at
    if (
      /check constraint|violates check constraint/i.test(
        String(insertError.message || insertError),
      )
    ) {
      // retry without closed_at
      const seedRetry = seed.map((r) => {
        const copy = { ...r };
        delete copy.closed_at;
        return copy;
      });
      const { error: retryErr } = await supabase
        .from('cases')
        .insert(seedRetry);
      if (retryErr) throw retryErr;
    } else {
      throw insertError;
    }
  }

  // Report counts
  const { count: totalAfter, error: totalErr } = await supabase
    .from('cases')
    .select('id', { count: 'exact', head: true });
  if (totalErr) throw totalErr;
  const { count: seguimientoAfter, error: segErr2 } = await supabase
    .from('cases')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'En seguimiento');
  if (segErr2) throw segErr2;

  console.log(`Total cases: ${totalAfter}`);
  console.log(`Cases En seguimiento: ${seguimientoAfter}`);
}

(async () => {
  try {
    await run();
  } catch (err) {
    console.error('Seed quick error:', err?.message || err);
    process.exitCode = 1;
  }
})();
