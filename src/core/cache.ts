import NodeCache from 'node-cache';

interface CacheConfig {
  stdTTL?: number;
  checkperiod?: number;
}

// Always on, in every environment: correctness (e.g. auth's token/session lookups, see
// core/auth.ts) depends on this cache actually holding what was written to it, so it can't be
// short-circuited by a dev flag. The `Cache-Control` header some routes send (see
// travel/v2/routes.ts) is a separate, client/proxy-caching concern — unrelated to this store.
let cache: NodeCache | null = null;

export function initCache(config: CacheConfig = {}): NodeCache {
  cache = new NodeCache({
    stdTTL: config.stdTTL || 3600,
    checkperiod: config.checkperiod || 600,
  });
  return cache;
}

export function getCache(): NodeCache {
  if (!cache) {
    cache = initCache();
  }
  return cache;
}

export function cacheKey(namespace: string, ...parts: (string | number)[]): string {
  return [namespace, ...parts].join(':');
}

export function getCached<T>(key: string): T | undefined {
  return getCache().get<T>(key);
}

export function setCached<T>(key: string, value: T, ttl: number = 3600): void {
  getCache().set(key, value, ttl);
}

export function clearCache(): void {
  getCache().flushAll();
}
