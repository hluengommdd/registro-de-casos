import { createClient } from '@supabase/supabase-js';

// Try to load .env.local via dotenv if available (optional helper for local scripts)
try {
  const dotenv = await import('dotenv');
  dotenv.config({ path: '.env.local' });
} catch {
  /* dotenv not installed or failed; continue using process.env */
}

// Resolve env vars (allow SUPABASE_* or VITE_*). Prefer explicit SUPABASE_* then VITE_*.
const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || null;

const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_KEY ||
  null;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  const missing = [];
  if (!SUPABASE_URL) missing.push('VITE_SUPABASE_URL (or SUPABASE_URL)');
  if (!SUPABASE_KEY)
    missing.push('VITE_SUPABASE_ANON_KEY (or SUPABASE_ANON_KEY / SUPABASE_KEY)');
  throw new Error(
    `Missing Supabase environment variables: ${missing.join(
      ', ',
    )}. Please add them to .env.local or your environment.`,
  );
}

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
    let s = row && Object.prototype.hasOwnProperty.call(row, 'status') ? row.status : null;
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
