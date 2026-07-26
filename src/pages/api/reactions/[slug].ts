import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { adjustReaction, getCounts, isValidEmoji } from '../../../lib/reactions';
import { checkRateLimit, getClientKey } from '../../../lib/rateLimit';

export const prerender = false;

// Reactions toggle, so a burst is legitimate — tapping a few emoji, or undoing
// one straight away, must not trip the limiter. Cap sustained writes instead.
const WINDOW_MS = 10_000;
const MAX_WRITES_PER_WINDOW = 12;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/**
 * Slugs are validated against the blog collection rather than a shape regex,
 * so an attacker can't grow data/reactions.json with arbitrary keys.
 * Cached for the process lifetime — the collection is fixed at build time.
 */
let slugCache: Set<string> | undefined;

/** The slug if it names a real post, else `null`. */
async function knownSlug(slug: unknown): Promise<string | null> {
  if (typeof slug !== 'string') return null;
  if (!slugCache) {
    const posts = await getCollection('blog');
    slugCache = new Set(posts.map(post => post.slug));
  }
  return slugCache.has(slug) ? slug : null;
}

export const GET: APIRoute = async ({ params }) => {
  const slug = await knownSlug(params.slug);
  if (!slug) return json({ error: 'Unknown post.' }, 404);

  try {
    return json({ counts: await getCounts(slug) });
  } catch (error) {
    console.error('[reactions] read failed:', error);
    return json({ error: 'Could not load reactions.' }, 500);
  }
};

/** POST adds a reaction, DELETE takes it back; both share this path. */
const handleWrite = async (
  { params, request, clientAddress }: Parameters<APIRoute>[0],
  delta: 1 | -1
) => {
  const slug = await knownSlug(params.slug);
  if (!slug) return json({ error: 'Unknown post.' }, 404);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  if (!isValidEmoji(body?.emoji)) return json({ error: 'Unknown reaction.' }, 400);

  const key = getClientKey(request, clientAddress);
  if (!checkRateLimit('reactions', key, WINDOW_MS, MAX_WRITES_PER_WINDOW)) {
    return json({ error: 'Slow down a little.' }, 429);
  }

  try {
    return json({ ok: true, counts: await adjustReaction(slug, body.emoji, delta) });
  } catch (error) {
    console.error('[reactions] write failed:', error);
    return json({ error: 'Could not save your reaction.' }, 500);
  }
};

export const POST: APIRoute = context => handleWrite(context, 1);

export const DELETE: APIRoute = context => handleWrite(context, -1);
