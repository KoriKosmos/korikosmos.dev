// Server-only JSON persistence for small, low-write datasets (guestbook,
// post reactions). Generalises the read/lock/atomic-write pattern that
// src/pages/api/scores/[game].ts hand-rolls per game.
//
// Everything lives under ./data, which docker-compose mounts as a named
// volume, so files written here survive container rebuilds. The directory is
// created lazily on first write — a fresh deploy has no data files at all,
// so every reader must tolerate ENOENT and fall back to a default.
import fs from 'node:fs/promises';
import path from 'node:path';
import { Mutex } from 'async-mutex';

const DATA_DIR = path.resolve('./data');

// One mutex per file. Writes are read-modify-write, so two concurrent POSTs
// to the same file would otherwise lose an update.
const locks = new Map<string, Mutex>();

function getLock(file: string) {
  let lock = locks.get(file);
  if (!lock) {
    lock = new Mutex();
    locks.set(file, lock);
  }
  return lock;
}

function resolveDataFile(file: string) {
  return path.join(DATA_DIR, file);
}

async function readRaw<T>(file: string, fallback: T): Promise<T> {
  try {
    const contents = await fs.readFile(resolveDataFile(file), 'utf-8');
    return JSON.parse(contents) as T;
  } catch (error) {
    // Missing file (first run) and corrupt JSON both degrade to the default
    // rather than 500-ing a page that merely wants to render an empty list.
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return fallback;
    console.error(`[jsonStore] failed to read ${file}:`, error);
    return fallback;
  }
}

/** Read a data file, or `fallback` if it doesn't exist yet / can't be parsed. */
export async function readJson<T>(file: string, fallback: T): Promise<T> {
  return getLock(file).runExclusive(() => readRaw(file, fallback));
}

/**
 * Read-modify-write a data file under its lock. `mutate` receives the current
 * contents (or `fallback`) and returns the value to persist; the resolved
 * value is returned to the caller.
 */
export async function updateJson<T>(
  file: string,
  fallback: T,
  mutate: (current: T) => T
): Promise<T> {
  return getLock(file).runExclusive(async () => {
    const current = await readRaw(file, fallback);
    const next = mutate(current);

    const target = resolveDataFile(file);
    const temp = `${target}.tmp`;
    await fs.mkdir(DATA_DIR, { recursive: true });
    // Write-then-rename: a crash mid-write leaves the previous file intact
    // instead of a truncated one.
    await fs.writeFile(temp, JSON.stringify(next, null, 2));
    await fs.rename(temp, target);

    return next;
  });
}
