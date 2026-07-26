// Constants and types shared between server code and client bundles.
// Nothing here may import a server-only module (node:fs, env vars) — the
// guestbook/reactions islands import from this file, and pulling in
// src/lib/jsonStore.ts transitively would drag node:fs into the browser build.

/** Items to filter out from Last.fm results */
export const BLOCKED_ITEMS = ['The Magnus Archives'];

/* ── Guestbook ───────────────────────────────────────────────────────────── */

/**
 * The single source of truth for the field limits.
 *
 * `src/lib/guestbook.ts` truncates to these on the server and both guestbook
 * islands set `maxLength` from them, so the counter under the textarea and the
 * value that actually lands on disk can't disagree.
 */
export const NAME_MAX = 32;
export const MESSAGE_MAX = 500;
export const URL_MAX = 200;

export interface GuestbookEntry {
  id: string;
  /** ISO-8601 timestamp. */
  date: string;
  name: string;
  message: string;
  /**
   * Optional homepage — the classic guestbook "URL" field. Rendered as an
   * href, so `sanitizeUrl()` has already restricted it to http(s).
   */
  url?: string;
}

/* ── Post reactions ──────────────────────────────────────────────────────── */

export interface Reaction {
  emoji: string;
  label: string;
}

/**
 * Shared by the API allowlist and the client island, so the two can't drift.
 * Adding a reaction here is safe; removing one orphans its stored counts
 * (they stay on disk but stop being served).
 */
export const REACTIONS: Reaction[] = [
  { emoji: '❤️', label: 'Loved it' },
  { emoji: '🎉', label: 'Nice one' },
  { emoji: '🤯', label: 'Mind blown' },
  { emoji: '👀', label: 'Interesting' },
  { emoji: '🔥', label: 'Fire' },
];

export const REACTION_EMOJI = REACTIONS.map(r => r.emoji);

export type ReactionCounts = Record<string, number>;
