import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase: faltan variables de entorno VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY')
  throw new Error(
    'Supabase config: define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in a .env.local file'
  )
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
