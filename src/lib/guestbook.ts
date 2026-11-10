/**
 * Guestbook storage, shared by all three skins' guestbook pages.
 *
 * Uses the pre-existing data/guestbook.json shape
 * (`{ entries: [{ id, date, name, message, url }] }`) so any entries already on
 * disk survive. Persistence goes through lib/jsonStore.ts (per-file mutex +
 * atomic rename) and depends on the data/ volume mount like the rest of it.
 */
import { readJson, updateJson } from './jsonStore';
import { MESSAGE_MAX, NAME_MAX, URL_MAX, type GuestbookEntry } from './constants';

const FILE = 'guestbook.json';

interface GuestbookFile {
  entries: GuestbookEntry[];
}

// The entry shape and the field limits live in lib/constants.ts, which is
// safe to import from a client bundle; this module is server-only (node:fs).
// Re-exported so the existing `from '../lib/guestbook'` imports keep working.
export { NAME_MAX, MESSAGE_MAX, URL_MAX, type GuestbookEntry };

/**
 * Keep the file (and the page) bounded.
 *
 * This cap *rejects* rather than evicts. The obvious `entries.slice(-MAX)` is
 * a data-loss bug on an unauthenticated endpoint: 200 junk submissions would
 * silently and permanently push out every real signature. Refusing the write
 * instead means the worst a flood can do is fill the book, which I can undo by
 * pruning the file — nothing anyone wrote is destroyed.
 */
const MAX_ENTRIES = 200;

/**
 * The `url` field is rendered as an href, so anything that isn't a plain
 * http(s) URL is dropped rather than sanitised — that closes `javascript:`,
 * `data:`, and friends. React escapes name/message on render, so trimming and
 * length-capping is enough for those.
 */
export function sanitizeUrl(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > URL_MAX) return undefined;
  // Bare domains ("example.com") were the norm in guestbooks; assume https.
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return undefined;
    return parsed.toString();
  } catch {
    return undefined;
  }
}

function isEntry(value: unknown): value is GuestbookEntry {
  const e = value as GuestbookEntry;
  return Boolean(e && typeof e.id === 'string' && typeof e.name === 'string' && typeof e.message === 'string');
}

/** Valid entries from whatever is on disk; anything malformed reads as empty. */
function entriesOf(file: unknown): GuestbookEntry[] {
  const entries = (file as Partial<GuestbookFile> | null)?.entries;
  return Array.isArray(entries) ? entries.filter(isEntry) : [];
}

const newestFirst = (entries: GuestbookEntry[]) =>
  [...entries].sort((a, b) => (a.date < b.date ? 1 : -1));

/**
 * Thrown from inside the update to abandon it: `updateJson` only writes once
 * its mutate callback returns, so a full book is refused without rewriting
 * the file.
 */
class GuestbookFull extends Error {}

/** Newest first. */
export async function getGuestbook(): Promise<GuestbookEntry[]> {
  return newestFirst(entriesOf(await readJson<unknown>(FILE, null)));
}

export type SignResult =
  | { ok: true; entries: GuestbookEntry[] }
  | { ok: false; error: string };

export async function signGuestbook(input: {
  name?: unknown;
  message?: unknown;
  url?: unknown;
}): Promise<SignResult> {
  const name = typeof input.name === 'string' ? input.name.trim().slice(0, NAME_MAX) : '';
  const message = typeof input.message === 'string' ? input.message.trim().slice(0, MESSAGE_MAX) : '';

  if (!name) return { ok: false, error: 'Please enter a name.' };
  if (!message) return { ok: false, error: 'Please enter a message.' };

  const entry: GuestbookEntry = {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    name,
    message,
  };
  const url = sanitizeUrl(input.url);
  if (url) entry.url = url;

  try {
    const saved = await updateJson<unknown>(FILE, null, current => {
      const entries = entriesOf(current);
      if (entries.length >= MAX_ENTRIES) throw new GuestbookFull();
      return { entries: [...entries, entry] } satisfies GuestbookFile;
    });
    return { ok: true, entries: newestFirst(entriesOf(saved)) };
  } catch (error) {
    if (error instanceof GuestbookFull) {
      return { ok: false, error: 'The guestbook is full! Email me and I will make room.' };
    }
    console.error('[guestbook] write failed', error);
    return { ok: false, error: 'The guestbook is not accepting signatures right now.' };
  }
}
