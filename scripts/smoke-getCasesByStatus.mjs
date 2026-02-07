import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './_supabaseEnv.mjs';

const { url: SUPABASE_URL, key: SUPABASE_KEY } = await getSupabaseConfig();

let host = SUPABASE_URL;
try {
  host = new URL(SUPABASE_URL).hostname;
} catch {
  // leave as-is if parsing fails
}

console.log('Supabase host:', host);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  // Initial head/count check to surface visible rows (respects RLS)
  const { count: totalCount, error: countError } = await supabase
    .from('cases')
    .select('id', { count: 'exact', head: true });

  if (countError) {
    throw countError;
  }

  console.log(`Total filas visibles en cases (count): ${totalCount}`);
  if (totalCount === 0 || totalCount === null) {
    console.warn(
      'ADVERTENCIA: no hay filas visibles. Puede ser tabla vacía o RLS filtrando resultados.',
    );
  }

  const { data, error } = await supabase
    .from('cases')
    .select(
      'id, incident_date, status, course_incident, students(first_name,last_name)',
    )
    .eq('status', 'En seguimiento')
    .order('incident_date', { ascending: false })
    .limit(100);

  if (error) {
    // Surface the Supabase error to the caller
    throw error;
  }

  console.log(
    `Filas devueltas por la consulta (status = "En seguimiento"): ${(data || []).length}`,
  );

  if (data && data.length > 0) {
    console.log('Sample row:', JSON.stringify(data[0]));
  }

  // --- Diagnostic: fetch recent statuses and show counts ---
  const { data: statusesData, error: statusesError } = await supabase
    .from('cases')
    .select('status')
    .limit(200);

  if (statusesError) {
    throw statusesError;
  }

  const counts = {};
  for (const row of statusesData || []) {
    let s =
      row && Object.prototype.hasOwnProperty.call(row, 'status')
        ? row.status
        : null;
    if (s === null || s === undefined) s = '<null/empty>';
    else if (typeof s === 'string' && s.trim() === '') s = '<null/empty>';
    counts[s] = (counts[s] || 0) + 1;
  }

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    console.log('Statuses encontrados: (sin datos)');
  } else {
    console.log('Statuses encontrados (conteo):');
    for (const [status, cnt] of entries) {
      console.log(`${status}: ${cnt}`);
    }
  }

  return data;
}

(async () => {
  try {
    await run();
  } catch (err) {
    // Print a concise error message and set non-zero exit code for CI,
    // but do not call process.exit() to avoid breaking libuv handles.
    console.error('Error:', err?.message || err);
    process.exitCode = 1;
  }
})();
