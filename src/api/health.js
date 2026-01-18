import { supabase } from './supabaseClient'
import { withRetry } from './withRetry'

export async function checkSupabaseHealth() {
  try {
    const { error } = await withRetry(() =>
      supabase.from('cases').select('id').limit(1)
    , { timeoutMs: 5000, retries: 1 })
    if (error) throw error
    return { ok: true }
  } catch (err) {
    return { ok: false, message: err?.message || 'Supabase no responde' }
  }
}
