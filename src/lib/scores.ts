// Leaderboard rules for /api/scores/[game], kept pure so they can be tested.
// Persistence (data/scores/<game>.json via jsonStore) lives in the route.

export const GAMES = ['tetris', 'rps', 'tetris-daily'] as const;
export type Game = (typeof GAMES)[number];

export const LEADERBOARD_SIZE = 10;
export const MAX_NAME_LENGTH = 20;
/**
 * Sanity ceiling, not anti-cheat: a marathon run at level 30+ scores in the
 * low millions. Anything this far past it is a hand-written POST.
 */
export const MAX_TETRIS_SCORE = 99_999_999;
export const MAX_RPS_COUNT = 1_000_000;

export interface TetrisEntry { name: string; score: number }
export interface RpsEntry { name: string; netScore: number; playerWins: number; cpuWins: number; ties: number }
export interface ScoreFile<T> { scores: T[] }

export function isGame(value: unknown): value is Game {
  return typeof value === 'string' && (GAMES as readonly string[]).includes(value);
}

function isCount(value: unknown, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= max;
}

/**
 * Names are trimmed, stripped of control characters and collapsed whitespace,
 * then cut to 20 characters. They are always rendered as text, never HTML.
 */
export function cleanName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  // eslint-disable-next-line no-control-regex
  const name = value.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LENGTH).trim();
  return name || null;
}

export type Parsed<T> = { ok: true; entry: T } | { ok: false; error: string };

export function parseTetris(body: Record<string, unknown>): Parsed<TetrisEntry> {
  const name = cleanName(body.name);
  if (!name) return { ok: false, error: 'Invalid name' };
  if (!isCount(body.score, MAX_TETRIS_SCORE)) return { ok: false, error: 'Invalid score' };
  return { ok: true, entry: { name, score: body.score } };
}

export function parseRps(body: Record<string, unknown>): Parsed<RpsEntry> {
  const name = cleanName(body.name);
  if (!name) return { ok: false, error: 'Invalid name' };
  const { playerWins, cpuWins, ties } = body;
  if (!isCount(playerWins, MAX_RPS_COUNT) || !isCount(cpuWins, MAX_RPS_COUNT) || !isCount(ties, MAX_RPS_COUNT)) {
    return { ok: false, error: 'Invalid RPS stats: must be non-negative integers' };
  }
  return { ok: true, entry: { name, netScore: playerWins - cpuWins, playerWins, cpuWins, ties } };
}

/** Coerce whatever is on disk into a well-formed list (a hand-edited file shouldn't 500). */
export function normaliseFile<T>(raw: unknown): ScoreFile<T> {
  const scores = (raw as ScoreFile<T> | null)?.scores;
  return { scores: Array.isArray(scores) ? scores : [] };
}

/** Keep each name's best, sort descending, cap the board. */
function merge<T extends { name: string }>(scores: T[], entry: T, value: (e: T) => number): T[] {
  const others = scores.filter(e => e.name !== entry.name);
  const existing = scores.find(e => e.name === entry.name);
  const best = existing && value(existing) >= value(entry) ? existing : entry;
  return [...others, best].sort((a, b) => value(b) - value(a)).slice(0, LEADERBOARD_SIZE);
}

export const mergeTetris = (scores: TetrisEntry[], entry: TetrisEntry) => merge(scores, entry, e => e.score);
export const mergeRps = (scores: RpsEntry[], entry: RpsEntry) => merge(scores, entry, e => e.netScore);

/**
 * The daily Tetris board holds only one day's scores. A post names the day it
 * was dealt; a score for any day but today is refused (that challenge is over),
 * and the first score of a new day starts a fresh board.
 */
export interface DailyFile { day: string; scores: TetrisEntry[] }

export function normaliseDaily(raw: unknown, today: string): DailyFile {
  const file = raw as Partial<DailyFile> | null;
  if (!file || file.day !== today || !Array.isArray(file.scores)) return { day: today, scores: [] };
  return { day: today, scores: file.scores };
}

export function parseTetrisDaily(body: Record<string, unknown>, today: string): Parsed<TetrisEntry> {
  if (body.day !== today) return { ok: false, error: "That daily challenge has ended. Today's is ready." };
  return parseTetris(body);
}
