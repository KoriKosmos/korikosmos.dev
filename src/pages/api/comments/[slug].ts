import type { APIRoute } from 'astro';
import { addComment, getComments } from '../../../lib/comments';
import { checkRateLimit, getClientKey } from '../../../lib/rateLimit';
import { isSameOrigin } from '../../../lib/sameOrigin';
import { readBodyCapped } from '../../../lib/readBody';
import { knownSlug } from '../../../lib/blogSlugs';

export const prerender = false;

/**
 * Posting is unauthenticated by design (a display name, no account), so the
 * write path carries the guestbook's controls: same-origin only, a body cap,
 * and a per-client throttle. The store's per-post cap rejects rather than
 * evicts, so a flood can't destroy existing comments.
 */
const MAX_BODY_BYTES = 12 * 1024;
/** One comment per 20s per client. */
const WINDOW_MS = 20_000;

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });

export const GET: APIRoute = async ({ params }) => {
  const slug = await knownSlug(params.slug);
  if (!slug) return json({ error: 'Unknown post.' }, 404);
  try {
    return json({ comments: await getComments(slug) });
  } catch (error) {
    console.error('[comments] read failed:', error);
    return json({ error: 'Could not load comments.' }, 500);
  }
};

export const POST: APIRoute = async ({ params, request, site, url, clientAddress }) => {
  if (!isSameOrigin(request, site, url)) {
    return json({ error: 'Please comment from the post page.' }, 403);
  }

  const slug = await knownSlug(params.slug);
  if (!slug) return json({ error: 'Unknown post.' }, 404);

  // Capped while streaming, not after buffering — see lib/readBody.ts.
  const read = await readBodyCapped(request, MAX_BODY_BYTES);
  if (!read.ok) return json({ error: 'That comment is far too long.' }, 413);

  let body: unknown;
  try {
    body = JSON.parse(read.text);
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const key = getClientKey(request, clientAddress);
  if (!checkRateLimit('comments', key, WINDOW_MS)) {
    return json({ error: 'Slow down! Try again in a moment.' }, 429, {
      'Retry-After': String(WINDOW_MS / 1000),
    });
  }

  const result = await addComment(slug, (body ?? {}) as Record<string, unknown>);
  if (!result.ok) return json({ error: result.error }, 400);
  return json({ comments: result.comments });
};
