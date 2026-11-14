// Daily challenges: one seed per game per UTC day, so everyone who plays today
// gets the same Tetris pieces, the same Star Pairs sky, and the same Rock Paper
// Scissors opponent. Pure and client-safe; the server uses dailyKey() too, so
// the daily leaderboard and the browser agree on what "today" is.

/** Today's challenge id, `YYYY-MM-DD` in UTC (midnight is the same moment everywhere). */
export function dailyKey(now: Date | number = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10);
}

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
export function isDailyKey(value: unknown): value is string {
  return typeof value === 'string' && DAY_RE.test(value) && dailyKey(Date.parse(`${value}T00:00:00Z`) || 0) === value;
}

/** Milliseconds until the next challenge starts (the next UTC midnight). */
export function msUntilNextDaily(now: number = Date.now()): number {
  const next = new Date(now);
  next.setUTCHours(24, 0, 0, 0);
  return next.getTime() - now;
}

/** FNV-1a: a small, stable string hash for seeding. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32: a fast seeded PRNG returning [0, 1), like Math.random. */
export function seededRandom(seed: string): () => number {
  let state = hash(seed);
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The random source for one game's challenge on one day. */
export function dailyRandom(game: string, day: string = dailyKey()): () => number {
  return seededRandom(`korikosmos:${game}:${day}`);
}

/**
 * Per-day results kept in localStorage, e.g. "already played today's duel".
 * Only today's entry is kept, so the key never grows.
 */
export function readDaily<T>(storageKey: string, day: string = dailyKey()): T | null {
  try {
    const data = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
    return data && data.day === day ? (data.result as T) : null;
  } catch {
    return null;
  }
}

export function writeDaily<T>(storageKey: string, result: T, day: string = dailyKey()): void {
  try { localStorage.setItem(storageKey, JSON.stringify({ day, result })); } catch { /* Storage is optional. */ }
}
