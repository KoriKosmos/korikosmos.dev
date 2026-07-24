// Per-post emoji reactions. The emoji set is a fixed allowlist and slugs are
// checked against the blog collection by the API route, so the stored object
// can only ever grow to (posts × REACTIONS) keys.
import { readJson, updateJson } from './jsonStore';
import { REACTION_EMOJI, type ReactionCounts } from './constants';

const FILE = 'reactions.json';

type ReactionFile = Record<string, ReactionCounts>;

const EMPTY: ReactionFile = {};

export function isValidEmoji(emoji: unknown): emoji is string {
  return typeof emoji === 'string' && REACTION_EMOJI.includes(emoji);
}

/** Zero-filled counts for every allowlisted emoji, so the UI never sees gaps. */
function withDefaults(counts: ReactionCounts | undefined): ReactionCounts {
  const result: ReactionCounts = {};
  for (const emoji of REACTION_EMOJI) {
    const value = counts?.[emoji];
    result[emoji] = typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
  }
  return result;
}

export async function getCounts(slug: string): Promise<ReactionCounts> {
  const data = await readJson<ReactionFile>(FILE, EMPTY);
  return withDefaults(data[slug]);
}

/** Increment one emoji for one post and return the post's updated counts. */
export async function addReaction(slug: string, emoji: string): Promise<ReactionCounts> {
  const next = await updateJson<ReactionFile>(FILE, EMPTY, current => {
    // Spread the stored counts first so an emoji dropped from REACTIONS keeps
    // its tally on disk (unserved, but recoverable if it's ever restored)
    // rather than being erased by the next reaction on that post.
    const counts = { ...current[slug], ...withDefaults(current[slug]) };
    counts[emoji] = (counts[emoji] ?? 0) + 1;
    return { ...current, [slug]: counts };
  });

  return withDefaults(next[slug]);
}
