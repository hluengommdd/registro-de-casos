import { useEffect, useState } from 'react'
import { getPlazosResumen } from '../api/db'

export function usePlazosResumen(casoId, refreshKey = 0) {
  const [loading, setLoading] = useState(true)
  const [row, setRow] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!casoId) {
        setRow(null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const r = await getPlazosResumen(casoId)
        if (!cancelled) setRow(r)
      } catch (e) {
        console.error(e)
        if (!cancelled) setRow(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [casoId, refreshKey])

  return { loading, row }
}
