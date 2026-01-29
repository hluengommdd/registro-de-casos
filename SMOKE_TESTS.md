Smoke checks and unit tests

- Run unit tests (vitest):

  npm test

- Run Supabase status smoke check (fails if zero rows returned):

  npm run smoke:status

This smoke script reads Supabase credentials from `.env.local` (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY or SUPABASE_URL/SUPABASE_KEY).
