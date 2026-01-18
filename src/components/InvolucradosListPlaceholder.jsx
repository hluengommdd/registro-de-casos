import { useEffect, useState } from 'react'
import { getInvolucrados } from '../api/db'

export default function InvolucradosListPlaceholder({ casoId }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!casoId) return
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const data = await getInvolucrados(casoId)
        if (mounted) setItems(data || [])
      } catch (e) {
        console.error(e)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [casoId])

  if (loading) return <div className="text-sm text-gray-500">Cargando involucrados…</div>
  if (!items || items.length === 0) return <div className="text-sm text-gray-500">No hay involucrados registrados.</div>

  return (
    <div className="space-y-2">
      {items.map(it => (
        <div key={it.id} className="p-3 bg-gray-50 rounded">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="font-medium">{it.nombre}</div>
              <div className="text-xs text-gray-600">{it.rol} {it.metadata?.curso ? `· ${it.metadata.curso}` : ''}</div>
            </div>
            <div className="text-xs text-gray-500">{new Date(it.created_at).toLocaleString()}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
