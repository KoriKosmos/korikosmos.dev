/**
 * Hit counter for the retro skin — a real, persistent visitor count backed by
 * data/hits.json, in the spirit of the odometer GIFs every GeoCities page had.
 *
 * Same persistence shape as data/scores/*.json: a JSON file under data/,
 * guarded by a mutex, written via write-temp-then-rename so a crash mid-write
 * can't truncate the file. Note the Dockerfile does not COPY data/ — this
 * relies on the same volume mount the game leaderboards already use, and
 * degrades to an in-memory count if the directory isn't writable.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { Mutex } from 'async-mutex';

const DATA_DIR = path.resolve('./data');
const HITS_PATH = path.join(DATA_DIR, 'hits.json');
const lock = new Mutex();

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

async function readCount(): Promise<number> {
  if (cachedCount !== null) return cachedCount;
  try {
    const raw = await fs.readFile(HITS_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    cachedCount = typeof parsed?.count === 'number' && parsed.count >= 0 ? parsed.count : 0;
  } catch {
    cachedCount = 0;
  }
  return cachedCount;
}

/** Current count without incrementing. */
export async function getHits(): Promise<number> {
  if (persistenceBroken) return memoryCount;
  if (cachedCount !== null) return cachedCount;
  return lock.runExclusive(readCount);
}

/** Increment and return the new count. */
export async function bumpHits(): Promise<number> {
  if (persistenceBroken) return ++memoryCount;

  return lock.runExclusive(async () => {
    const next = (await readCount()) + 1;
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const temp = `${HITS_PATH}.tmp`;
      await fs.writeFile(temp, JSON.stringify({ count: next }, null, 2));
      await fs.rename(temp, HITS_PATH);
      memoryCount = next;
      cachedCount = next;
      return next;
    } catch (error) {
      console.error('[hits] persistence unavailable, falling back to memory', error);
      persistenceBroken = true;
      memoryCount = next;
      return next;
    }
  });
}
