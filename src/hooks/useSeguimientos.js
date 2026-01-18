import { useEffect, useState } from 'react'
import { getCaseFollowups } from '../api/db'

export function useSeguimientos(casoId, refreshKey = 0) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargarSeguimientos() {
      if (!casoId) {
        setData([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // ✅ OBTENER SEGUIMIENTOS DEL CASO DESDE SUPABASE
        const followups = await getCaseFollowups(casoId)

        // 🔹 Orden cronológico
        followups.sort(
          (a, b) =>
            new Date(a.fields.Fecha_Seguimiento) -
            new Date(b.fields.Fecha_Seguimiento)
        )

        setData(followups)
      } catch (e) {
        console.error(e)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    cargarSeguimientos()
  }, [casoId, refreshKey])

  return { data, loading }
}
