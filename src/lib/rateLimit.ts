// Server-only, in-memory write throttling for the public POST endpoints
// (guestbook, reactions). Deliberately not persisted: a single Node container
// serves the site, and losing the buckets on restart is harmless.

/**
 * Best-effort client identity.
 *
 * `Astro.clientAddress` is the socket peer, which in production is the
 * reverse proxy in front of the container — so it collapses to the same
 * loopback address for *every* visitor. `x-forwarded-for`'s first entry is
 * the original client where the proxy sets it. Neither is spoof-proof, so
 * limits built on this are a speed bump against casual flooding, not a
 * security control; keep them lenient enough that the degenerate
 * everyone-shares-one-bucket case stays usable.
 */
export function getClientKey(request: Request, clientAddress?: string): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip')?.trim() || clientAddress || 'unknown';
}

const buckets = new Map<string, Map<string, number[]>>();

/**
 * Sliding window: returns `true` if the caller has made fewer than `limit`
 * writes in the last `windowMs`, recording the timestamp on success.
 *
 * `limit` exists because reactions are toggleable — someone tapping three
 * emoji, or undoing one straight away, is normal use and must not 429. A
 * burst allowance permits that while still capping sustained flooding.
 */
export function checkRateLimit(
  bucket: string,
  key: string,
  windowMs: number,
  limit = 1
): boolean {
  let hits = buckets.get(bucket);
  if (!hits) {
    hits = new Map();
    buckets.set(bucket, hits);
  }

  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter(ts => now - ts < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }

  recent.push(now);
  hits.set(key, recent);

  // Opportunistic sweep so a long-running process doesn't accumulate an entry
  // per unique client forever.
  if (hits.size > 5000) {
    for (const [k, timestamps] of hits) {
      if (timestamps.every(ts => now - ts >= windowMs)) hits.delete(k);
    }
  }

  return true;
}
