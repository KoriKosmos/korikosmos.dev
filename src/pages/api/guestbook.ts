import type { APIRoute } from 'astro';
import { getGuestbook, signGuestbook } from '../../lib/guestbook';
import { checkRateLimit, getClientKey } from '../../lib/rateLimit';
import { isSameOrigin } from '../../lib/sameOrigin';
import { readBodyCapped } from '../../lib/readBody';

/**
 * Signing is unauthenticated by design — that is the whole point of a
 * guestbook — so the write path carries its own controls: same-origin only
 * (see lib/sameOrigin.ts), a body cap so nobody streams a gigabyte into
 * `JSON.parse`, and throttling per best-effort client key.
 *
 * None of it is load-bearing against data loss, though. `signGuestbook()`
 * refuses to evict when the book is full, so the worst a flood can achieve is
 * filling it — which I can undo by pruning the file. That is the fix that
 * matters; these three just make flooding tedious.
 */

const MAX_BODY_BYTES = 4096;

/** One signature per 30s. Nobody writes a guestbook message faster than that. */
const WINDOW_MS = 30_000;

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });

export const GET: APIRoute = async () => {
  const entries = await getGuestbook();
  return json({ entries });
};

export const POST: APIRoute = async ({ request, site, url, clientAddress }) => {
  if (!isSameOrigin(request, site, url)) {
    return json({ error: 'Please sign the guestbook from the guestbook page.' }, 403);
  }

  // Capped while streaming, not after buffering — see lib/readBody.ts.
  const read = await readBodyCapped(request, MAX_BODY_BYTES);
  if (!read.ok) {
    return json({ error: 'That message is far too long.' }, 413);
  }

  let body: unknown;
  try {
    body = JSON.parse(read.text);
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const key = getClientKey(request, clientAddress);
  if (!checkRateLimit('guestbook', key, WINDOW_MS)) {
    return json({ error: 'Slow down! Try again in a moment.' }, 429, {
      'Retry-After': String(WINDOW_MS / 1000),
    });
  }

  const result = await signGuestbook((body ?? {}) as Record<string, unknown>);
  if (!result.ok) {
    return json({ error: result.error }, 400);
  }

  return json({ entries: result.entries });
};
