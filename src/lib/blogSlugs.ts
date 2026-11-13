// Blog slugs are checked against the content collection rather than a shape
// regex, so the per-post stores (reactions, comments) can only ever hold keys
// for posts that exist. Cached for the process lifetime: the collection is
// fixed at build time.
import { getCollection } from 'astro:content';

let slugCache: Set<string> | undefined;

/** The slug if it names a real post, else `null`. */
export async function knownSlug(slug: unknown): Promise<string | null> {
  if (typeof slug !== 'string') return null;
  if (!slugCache) {
    const posts = await getCollection('blog');
    slugCache = new Set(posts.map(post => post.slug));
  }
  return slugCache.has(slug) ? slug : null;
}
