import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './_supabaseEnv.mjs';

let SUPABASE_URL;
let SUPABASE_KEY;
try {
  ({ url: SUPABASE_URL, key: SUPABASE_KEY } = await getSupabaseConfig());
} catch (error) {
  console.error(error?.message || String(error));
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const { data, error } = await supabase
    .from('cases')
    .select('id,status')
    .ilike('status', 'En seguimiento')
    .limit(5);

  if (error) {
    console.error('Supabase query error:', error);
    process.exitCode = 1;
    return;
  }

  const count = (data || []).length;
  console.log(`Rows returned: ${count}`);
  const statuses = [...new Set((data || []).map((r) => r.status))];
  console.log('Statuses returned:', statuses.length ? statuses : '(none)');

  if (count === 0) {
    console.error(
      'No rows returned for ilike("status", "En seguimiento"). Failing smoke.',
    );
    process.exitCode = 1;
    return;
  }

  // success: set exit code 0 and allow process to exit naturally
  process.exitCode = 0;
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
