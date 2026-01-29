import { useEffect, useState } from 'react';
import { getCaseFollowups } from '../api/db';
import { logger } from '../utils/logger';

export function useSeguimientos(casoId, refreshKey = 0) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargarSeguimientos() {
      if (!casoId) {
        setData([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // ✅ OBTENER SEGUIMIENTOS DEL CASO DESDE SUPABASE
        const followups = (await getCaseFollowups(casoId)) || [];

        // 🔹 Orden cronológico (asegurar array antes de ordenar)
        followups.sort(
          (a, b) =>
            new Date(a?.fields?.Fecha_Seguimiento) -
            new Date(b?.fields?.Fecha_Seguimiento),
        );

        setData(followups);
      } catch (e) {
        logger.error(e);
        setData([]);
      } finally {
        setLoading(false);
      }
    }

    cargarSeguimientos();
  }, [casoId, refreshKey]);

  return { data, loading };
}
