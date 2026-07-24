// Constants and types shared between server code and client bundles.
// Nothing here may import a server-only module (node:fs, env vars) — the
// guestbook/reactions islands import from this file, and pulling in
// src/lib/jsonStore.ts transitively would drag node:fs into the browser build.

/** Items to filter out from Last.fm results */
export const BLOCKED_ITEMS = ['The Magnus Archives'];

/* ── Guestbook ───────────────────────────────────────────────────────────── */

export const MAX_NAME_LENGTH = 40;
export const MAX_MESSAGE_LENGTH = 280;
export const MAX_URL_LENGTH = 200;

export interface GuestbookEntry {
  id: string;
  name: string;
  message: string;
  /** Optional homepage — the classic guestbook "URL" field. */
  url?: string;
  /** ISO-8601 timestamp. */
  date: string;
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
