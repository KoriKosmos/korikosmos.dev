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

const buckets = new Map<string, Map<string, number>>();

/**
 * Returns `true` if the caller may write, `false` if they're inside the
 * cooldown window. Records the timestamp on success.
 */
export function checkRateLimit(bucket: string, key: string, windowMs: number): boolean {
  let hits = buckets.get(bucket);
  if (!hits) {
    hits = new Map();
    buckets.set(bucket, hits);
  }

  const now = Date.now();
  const last = hits.get(key);
  if (last !== undefined && now - last < windowMs) return false;

  // Opportunistic sweep so a long-running process doesn't accumulate an entry
  // per unique client forever.
  if (hits.size > 5000) {
    for (const [k, ts] of hits) {
      if (now - ts >= windowMs) hits.delete(k);
    }
  }

  hits.set(key, now);
  return true;
}
