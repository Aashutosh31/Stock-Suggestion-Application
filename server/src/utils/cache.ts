interface Entry<T> {
  value: T;
  expiresAt: number;
  storedAt: number;
}

/**
 * Small single-process TTL cache with a stale-on-error fallback.
 * `getOrSet` returns the fresh value when available; on a fetch error it returns
 * the last known value marked as stale via the `onStale` callback. This keeps
 * the API responsive during brief upstream outages without inventing data.
 */
export class TtlCache {
  private store = new Map<string, Entry<unknown>>();
  private metrics = { hits: 0, misses: 0, staleServed: 0, sets: 0 };

  constructor(private readonly maxEntries = 2000) {}

  get<T>(key: string): { value: T; stale: boolean } | null {
    const entry = this.store.get(key) as Entry<T> | undefined;
    if (!entry) {
      this.metrics.misses++;
      return null;
    }
    const fresh = entry.expiresAt > Date.now();
    if (fresh) this.metrics.hits++;
    else this.metrics.staleServed++;
    return { value: entry.value, stale: !fresh };
  }

  set<T>(key: string, value: T, ttlSeconds: number): void {
    if (this.store.size >= this.maxEntries) {
      // Evict the oldest insertion.
      const firstKey = this.store.keys().next().value;
      if (firstKey !== undefined) this.store.delete(firstKey);
    }
    this.store.set(key, {
      value,
      storedAt: Date.now(),
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    this.metrics.sets++;
  }

  async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    loader: () => Promise<T>,
  ): Promise<{ value: T; stale: boolean; storedAt: number }> {
    const cached = this.get<T>(key);
    if (cached && !cached.stale) {
      const entry = this.store.get(key) as Entry<T>;
      return { value: cached.value, stale: false, storedAt: entry.storedAt };
    }
    try {
      const value = await loader();
      this.set(key, value, ttlSeconds);
      return { value, stale: false, storedAt: Date.now() };
    } catch (err) {
      if (cached) {
        const entry = this.store.get(key) as Entry<T>;
        return { value: cached.value, stale: true, storedAt: entry.storedAt };
      }
      throw err;
    }
  }

  invalidate(prefix?: string): void {
    if (!prefix) {
      this.store.clear();
      return;
    }
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  stats() {
    return { ...this.metrics, size: this.store.size };
  }
}

export const appCache = new TtlCache();
