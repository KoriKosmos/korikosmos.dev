/**
 * Guestbook storage for the retro skin.
 *
 * Uses the pre-existing data/guestbook.json shape
 * (`{ entries: [{ id, date, name, message, url }] }`) so any entries already on
 * disk survive. Same mutex + atomic-rename persistence as lib/hits.ts, and the
 * same dependency on the data/ volume mount.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { Mutex } from 'async-mutex';

const DATA_DIR = path.resolve('./data');
const GUESTBOOK_PATH = path.join(DATA_DIR, 'guestbook.json');
const lock = new Mutex();

export interface GuestbookEntry {
  id: string;
  /** ISO 8601 timestamp. */
  date: string;
  name: string;
  message: string;
  /** Already validated to be http(s) — safe to use as an href. */
  url?: string;
}

export const NAME_MAX = 32;
export const MESSAGE_MAX = 500;
export const URL_MAX = 200;
/** Keep the file (and the page) bounded. */
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

async function readEntries(): Promise<GuestbookEntry[]> {
  try {
    const raw = await fs.readFile(GUESTBOOK_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.entries) ? parsed.entries.filter(isEntry) : [];
  } catch {
    return [];
  }
}

/** Newest first. */
export async function getGuestbook(): Promise<GuestbookEntry[]> {
  const entries = await lock.runExclusive(readEntries);
  return [...entries].sort((a, b) => (a.date < b.date ? 1 : -1));
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

  return lock.runExclusive(async () => {
    const entries = await readEntries();
    entries.push(entry);
    const trimmed = entries.slice(-MAX_ENTRIES);
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const temp = `${GUESTBOOK_PATH}.tmp`;
      await fs.writeFile(temp, JSON.stringify({ entries: trimmed }, null, 2));
      await fs.rename(temp, GUESTBOOK_PATH);
    } catch (error) {
      console.error('[guestbook] write failed', error);
      return { ok: false as const, error: 'The guestbook is not accepting signatures right now.' };
    }
    return {
      ok: true as const,
      entries: [...trimmed].sort((a, b) => (a.date < b.date ? 1 : -1)),
    };
  });
}
