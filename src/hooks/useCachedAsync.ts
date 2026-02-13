import { useEffect, useState } from 'react';
import { getCache, setCache } from '../utils/queryCache';

export function useCachedAsync(
  cacheKey,
  fn,
  deps = [],
  { ttlMs = 30000, revalidate = true } = {},
) {
  const cached = getCache(cacheKey);
  const [data, setData] = useState(cached);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const current = getCache(cacheKey);
    if (current !== undefined) {
      setData(current);
      setLoading(false);
      if (!revalidate) return () => {};
    } else {
      setLoading(true);
    }

    setError(null);

    Promise.resolve()
      .then(fn)
      .then((res) => {
        if (!active) return;
        setCache(cacheKey, res, ttlMs);
        setData(res);
      })
      .catch((err) => {
        if (!active) return;
        setError(err);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, ...deps]);

  return { data, loading, error };
}

export default useCachedAsync;
