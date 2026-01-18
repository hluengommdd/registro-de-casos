import { useEffect, useMemo, useState } from 'react'
import { getCaseFollowups, getStageSlaRows } from '../api/db'

function norm(s) {
  return (s || '').trim().replace(/\s+/g, ' ')
}

export function useDueProcess(casoId, refreshKey = 0) {
  const [loading, setLoading] = useState(true)
  const [followups, setFollowups] = useState([])
  const [slaRows, setSlaRows] = useState([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!casoId) {
        setFollowups([])
        setSlaRows([])
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        const [fups, rows] = await Promise.all([
          getCaseFollowups(casoId),
          getStageSlaRows(),
        ])
        if (cancelled) return
        setFollowups(fups || [])
        setSlaRows(rows || [])
      } catch (e) {
        console.error(e)
        if (cancelled) return
        setFollowups([])
        setSlaRows([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [casoId, refreshKey])

  const computed = useMemo(() => {
    const stages = (slaRows || [])
      .map(r => norm(r.stage_key))
      .filter(Boolean)
      .sort((a, b) => {
        const na = parseInt(a.split('.')[0], 10)
        const nb = parseInt(b.split('.')[0], 10)
        if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb
        return a.localeCompare(b)
      })

    const stageSlaMap = {}
    for (const r of slaRows || []) {
      const k = norm(r.stage_key)
      if (!k) continue
      stageSlaMap[k] = r.days_to_due ?? null
    }

    const completedSet = new Set()
    ;(followups || []).forEach(f => {
      const k = norm(f?.fields?.Etapa_Debido_Proceso)
      const estado = (f?.fields?.Estado_Etapa || '').trim()
      if (k && estado === 'Completada') completedSet.add(k)
    })

    const completedStageKeys = stages.filter(k => completedSet.has(k))
    const currentStageKey = stages.find(k => !completedSet.has(k)) || null

    return { stages, stageSlaMap, completedStageKeys, currentStageKey }
  }, [slaRows, followups])

  return { ...computed, loading }
}
