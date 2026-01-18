// Serverless health check for Vercel
// Calls an internal Supabase RPC (stats_kpis) using anon key from env

export default async function handler(req, res) {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL
  const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ ok: false, message: 'Missing SUPABASE env vars' })
  }

  const now = new Date()
  const hasta = now.toISOString().slice(0, 10)
  const desdeDate = new Date(now)
  desdeDate.setDate(desdeDate.getDate() - 30)
  const desde = desdeDate.toISOString().slice(0, 10)

  const rpcUrl = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/rpc/stats_kpis`

  try {
    const r = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ desde, hasta }),
    })

    if (!r.ok) {
      const text = await r.text().catch(() => '')
      return res.status(502).json({ ok: false, status: r.status, body: text })
    }

    const data = await r.json().catch(() => null)
    return res.status(200).json({ ok: true, data })
  } catch (error) {
    return res.status(500).json({ ok: false, error: error?.message || String(error) })
  }
}
