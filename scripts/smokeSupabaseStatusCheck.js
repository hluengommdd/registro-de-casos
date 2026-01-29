import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase env vars (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).');
  process.exitCode = 1;
  // allow node to exit naturally
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
    console.error('No rows returned for ilike("status", "En seguimiento"). Failing smoke.');
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
