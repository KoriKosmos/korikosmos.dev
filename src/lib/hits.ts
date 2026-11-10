/**
 * Hit counter for the retro skin — a real, persistent visitor count backed by
 * data/hits.json, in the spirit of the odometer GIFs every GeoCities page had.
 *
 * Persistence goes through lib/jsonStore.ts (per-file mutex +
 * write-temp-then-rename, so a crash mid-write can't truncate the file), like
 * the guestbook, reactions and leaderboards. Note the Dockerfile does not COPY
 * data/ — this relies on the same volume mount, and degrades to an in-memory
 * count if the directory isn't writable.
 */
import { readJson, updateJson } from './jsonStore';

const FILE = 'hits.json';

interface HitsFile {
  count: number;
}

/** Fallback when the data dir isn't writable, so the counter still renders. */
let memoryCount = 0;
let persistenceBroken = false;
/**
 * Last value we read or wrote, or null before the first read.
 *
 * This process is the only writer, so once the file has been read the number
 * in memory is authoritative — and it saves a disk read on every retro page
 * view by a visitor who is already inside their session window.
 */
let cachedCount: number | null = null;

function countOf(file: unknown): number {
  const count = (file as Partial<HitsFile> | null)?.count;
  return typeof count === 'number' && Number.isFinite(count) && count >= 0 ? count : 0;
}

/** Current count without incrementing. */
export async function getHits(): Promise<number> {
  if (persistenceBroken) return memoryCount;
  if (cachedCount === null) cachedCount = countOf(await readJson<unknown>(FILE, null));
  return cachedCount;
}

/** Increment and return the new count. */
export async function bumpHits(): Promise<number> {
  if (persistenceBroken) return ++memoryCount;

  try {
    // Count from the file read under the lock, not from cachedCount: two bumps
    // can both be queued before the first one's continuation updates the cache.
    const saved = await updateJson<unknown>(FILE, null, current => ({
      count: countOf(current) + 1,
    }) satisfies HitsFile);
    cachedCount = memoryCount = countOf(saved);
    return cachedCount;
  } catch (error) {
    console.error('[hits] persistence unavailable, falling back to memory', error);
    persistenceBroken = true;
    memoryCount = (cachedCount ?? memoryCount) + 1;
    return memoryCount;
  }
}
