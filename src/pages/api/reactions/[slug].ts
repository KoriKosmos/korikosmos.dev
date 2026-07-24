import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { addReaction, getCounts, isValidEmoji } from '../../../lib/reactions';
import { checkRateLimit, getClientKey } from '../../../lib/rateLimit';

export const prerender = false;

/** Reactions are one click, so the cooldown only needs to blunt hold-to-repeat. */
const COOLDOWN_MS = 1_000;

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

export const POST: APIRoute = async ({ params, request, clientAddress }) => {
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
  if (!checkRateLimit('reactions', key, COOLDOWN_MS)) {
    return json({ error: 'Slow down a little.' }, 429);
  }

  try {
    return json({ ok: true, counts: await addReaction(slug, body.emoji) });
  } catch (error) {
    console.error('[reactions] write failed:', error);
    return json({ error: 'Could not save your reaction.' }, 500);
  }
};
