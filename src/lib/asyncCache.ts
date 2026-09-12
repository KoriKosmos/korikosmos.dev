/** Bounded success-only cache. Concurrent callers share one upstream request. */
export function createAsyncCache<T>({ maxEntries = 128, now = Date.now } = {}) {
  const entries = new Map<string, { value: T; expires: number }>();
  const pending = new Map<string, Promise<T>>();
  return {
    get(key: string, load: () => Promise<T>, ttl: number): Promise<T> {
      const cached = entries.get(key);
      if (cached && cached.expires > now()) {
        entries.delete(key);
        entries.set(key, cached);
        return Promise.resolve(cached.value);
      }
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
    },
  };
}
