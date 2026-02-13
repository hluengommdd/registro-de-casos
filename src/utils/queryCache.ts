const cache = new Map();

export function getCache(key) {
  if (!key) return undefined;
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt && entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return entry.value;
}

export function setCache(key, value, ttlMs = 30000) {
  if (!key) return;
  const expiresAt = ttlMs ? Date.now() + ttlMs : null;
  cache.set(key, { value, expiresAt });
}

export function clearCache(key) {
  if (!key) return;
  cache.delete(key);
}

export function clearAllCache() {
  cache.clear();
}
