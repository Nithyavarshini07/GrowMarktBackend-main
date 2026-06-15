type CacheValue<T> = {
  value: T;
  expiresAt: number;
};

const cacheStore = new Map<string, CacheValue<unknown>>();

export function cacheSet<T>(key: string, value: T, ttlMs = 60_000): void {
  cacheStore.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

export function cacheGet<T>(key: string): T | null {
  const hit = cacheStore.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    cacheStore.delete(key);
    return null;
  }
  return hit.value as T;
}

export function cacheDelete(key: string): void {
  cacheStore.delete(key);
}
