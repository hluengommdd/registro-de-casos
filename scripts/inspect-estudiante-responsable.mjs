import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './_supabaseEnv.mjs';

const { url: SUPABASE_URL, key: SUPABASE_KEY } = await getSupabaseConfig();
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function formatStudent(students) {
  const EMPTY = '';
  const DEFAULT_STUDENT = 'N/A';
  if (!students) return DEFAULT_STUDENT;
  const first = students.first_name || EMPTY;
  const last = students.last_name || EMPTY;
  const full = `${first} ${last}`.trim();
  return full || DEFAULT_STUDENT;
}

function normalizeStudent(studentLike) {
  if (!studentLike) return null;
  if (typeof studentLike === 'string') return { name: studentLike };
  if (typeof studentLike === 'object') {
    const name =
      studentLike.name ||
      studentLike.Nombre ||
      studentLike.nombre ||
      studentLike.fullName ||
      (studentLike.first_name &&
        `${studentLike.first_name} ${studentLike.last_name}`) ||
      null;
    return { ...studentLike, name };
  }
  return { name: String(studentLike) };
}

async function run() {
  const { data, error } = await supabase
    .from('cases')
    .select('id, students, incident_date, status')
    .limit(10);

  if (error) {
    console.error('Query error:', error);
    process.exit(1);
  }

  for (const row of data || []) {
    const formatted = formatStudent(row.students);
    const estudiante = normalizeStudent(formatted);
    console.log('case id:', row.id);
    console.log('  raw students:', row.students);
    console.log('  formatStudent ->', JSON.stringify(formatted));
    console.log('  normalizeStudent ->', JSON.stringify(estudiante));
    console.log('---');
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
