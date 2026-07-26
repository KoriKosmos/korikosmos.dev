// Server-only guestbook store. Imported directly by src/pages/guestbook.astro
// for SSR (never self-fetched over HTTP — behind the container's proxy the
// server's own origin isn't the canonical one; see src/middleware.ts) and by
// src/pages/api/guestbook.ts for writes.
import { readJson, updateJson } from './jsonStore';
import {
  MAX_MESSAGE_LENGTH,
  MAX_NAME_LENGTH,
  MAX_URL_LENGTH,
  type GuestbookEntry,
} from './constants';

const FILE = 'guestbook.json';

/** Newest-first entries retained on disk; older signatures fall off the end. */
const MAX_ENTRIES = 500;

export type { GuestbookEntry };

interface GuestbookFile {
  entries: GuestbookEntry[];
}

const EMPTY: GuestbookFile = { entries: [] };

/** All entries, newest first. Returns `[]` before anyone has signed. */
export async function getEntries(): Promise<GuestbookEntry[]> {
  const data = await readJson<GuestbookFile>(FILE, EMPTY);
  if (!Array.isArray(data.entries)) return [];
  return [...data.entries].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}

export interface EntryInput {
  name: unknown;
  message: unknown;
  url?: unknown;
}

type ValidationResult =
  | { ok: true; value: Omit<GuestbookEntry, 'id' | 'date'> }
  | { ok: false; error: string };

/**
 * Only http(s) links are accepted — `javascript:` and friends would be inert
 * in React's rendered output anyway, but rejecting them keeps the stored data
 * clean for any future consumer (RSS, exports) that isn't as careful.
 */
function normaliseUrl(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return undefined;
    return parsed.toString().slice(0, MAX_URL_LENGTH);
  } catch {
    return undefined;
  }
}

export function validateEntry(input: EntryInput): ValidationResult {
  if (typeof input.name !== 'string' || typeof input.message !== 'string') {
    return { ok: false, error: 'Name and message are required.' };
  }

  // Collapse whitespace runs so a wall of newlines can't stretch the page.
  const name = input.name.replace(/\s+/g, ' ').trim();
  const message = input.message.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

  if (!name) return { ok: false, error: 'Please add a name.' };
  if (name.length > MAX_NAME_LENGTH) {
    return { ok: false, error: `Name must be ${MAX_NAME_LENGTH} characters or fewer.` };
  }
  if (!message) return { ok: false, error: 'Please write a message.' };
  if (message.length > MAX_MESSAGE_LENGTH) {
    return { ok: false, error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.` };
  }

  const url =
    typeof input.url === 'string' && input.url.trim() ? normaliseUrl(input.url) : undefined;
  if (typeof input.url === 'string' && input.url.trim() && !url) {
    return { ok: false, error: 'That website link doesn’t look like a valid URL.' };
  }

  return { ok: true, value: { name, message, ...(url ? { url } : {}) } };
}

/** Persist a validated entry and return it. */
export async function addEntry(value: Omit<GuestbookEntry, 'id' | 'date'>): Promise<GuestbookEntry> {
  const entry: GuestbookEntry = {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    ...value,
  };

  await updateJson<GuestbookFile>(FILE, EMPTY, current => {
    const entries = Array.isArray(current.entries) ? current.entries : [];
    return { entries: [entry, ...entries].slice(0, MAX_ENTRIES) };
  });

  return entry;
}
