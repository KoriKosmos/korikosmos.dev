/**
 * Opt-in stale fallback for `get()`.
 *
 * Once an entry expires it is kept for a further `staleMs`. A read inside that
 * window starts (or joins) the refresh and waits at most `waitMs` for it. A
 * fast upstream therefore still answers fresh, while a slow or failing one is
 * answered from the stale value instead of stalling the request on the full
 * upstream timeout. Reads after the stale window wait for the refresh as before.
 */
export interface StaleOptions {
  staleMs: number;
  waitMs: number;
}

/** Bounded success-only cache. Concurrent callers share one upstream request. */
export function createAsyncCache<T>({ maxEntries = 128, now = Date.now } = {}) {
  const entries = new Map<string, { value: T; expires: number }>();
  const pending = new Map<string, Promise<T>>();

  /** Start the load for `key`, or join the one already in flight. */
  function refresh(key: string, load: () => Promise<T>, ttl: number): Promise<T> {
    const inFlight = pending.get(key);
    if (inFlight) return inFlight;
    if (pending.size >= maxEntries) return Promise.reject(new Error('Too many pending requests'));
    const request = Promise.resolve().then(load).then(value => {
      entries.delete(key);
      entries.set(key, { value, expires: now() + ttl });
      while (entries.size > maxEntries) entries.delete(entries.keys().next().value!);
      return value;
    }).finally(() => pending.delete(key));
    pending.set(key, request);
    return request;
  }

  return {
    get(key: string, load: () => Promise<T>, ttl: number, stale?: StaleOptions): Promise<T> {
      const cached = entries.get(key);
      const time = now();
      if (cached && cached.expires > time) {
        entries.delete(key);
        entries.set(key, cached);
        return Promise.resolve(cached.value);
      }
      if (!cached || !stale || cached.expires + stale.staleMs <= time) {
        return refresh(key, load, ttl);
      }

      // Expired but still inside the stale window: race the refresh against
      // the deadline. A failed refresh also falls back, and the failure is
      // handled here so it never surfaces as an unhandled rejection.
      const fallback = cached.value;
      return new Promise<T>(resolve => {
        const timer = setTimeout(() => resolve(fallback), stale.waitMs);
        refresh(key, load, ttl).then(
          value => { clearTimeout(timer); resolve(value); },
          () => { clearTimeout(timer); resolve(fallback); },
        );
      });
    },
  };
}
