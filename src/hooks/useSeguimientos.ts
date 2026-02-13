import { useCallback, useEffect, useState } from 'react';
import { getCaseFollowups } from '../api/db';
import { logger } from '../utils/logger';

/**
 * Hook: historial de seguimientos (case_followups) para un caseId.
 * Devuelve followups normalizados (mapFollowupRow) en `followups`.
 */
export function useSeguimientos(caseId) {
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!caseId) {
        setFollowups([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const rows = (await getCaseFollowups(caseId)) || [];
        // Orden cronológico ascendente
        rows.sort((a, b) =>
          String(a.action_at || a.action_date || '').localeCompare(
            String(b.action_at || b.action_date || ''),
          ),
        );
        if (!cancelled) setFollowups(rows);
      } catch (e) {
        logger.error(e);
        if (!cancelled) setFollowups([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [caseId, refreshKey]);

  return { followups, loading, refresh };
}
