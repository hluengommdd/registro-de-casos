export async function getSupabaseConfig() {
  try {
    const dotenv = await import('dotenv');
    dotenv.config({ path: '.env.local' });
  } catch {
    // dotenv is optional for scripts
  }

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || null;
  const key =
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_KEY ||
    null;

  if (!url || !key) {
    const missing = [];
    if (!url) missing.push('SUPABASE_URL (or VITE_SUPABASE_URL)');
    if (!key)
      missing.push(
        'SUPABASE_ANON_KEY / SUPABASE_KEY (or VITE_SUPABASE_ANON_KEY)',
      );
    throw new Error(`Missing Supabase environment variables: ${missing.join(', ')}`);
  }

  return { url, key };
}
