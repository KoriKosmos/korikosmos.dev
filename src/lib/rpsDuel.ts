// Rock Paper Scissors daily duel: ten rounds against today's opponent, the
// same for everyone. Each day's opponent has a habit (a favourite throw it
// leans on about half the time), so reading it is the whole game. Pure and
// tested; RpsDailyDuel.tsx draws it and keeps the one attempt per day.

import { dailyKey, dailyRandom } from './daily';

export const THROWS = ['rock', 'paper', 'scissors'] as const;
export type Throw = (typeof THROWS)[number];
export type DuelOutcome = 'win' | 'lose' | 'tie';
export const DUEL_ROUNDS = 10;
export const DUEL_KEY = 'kk-rps-daily-v1';

const BEATS: Record<Throw, Throw> = { rock: 'scissors', paper: 'rock', scissors: 'paper' };

export function judge(player: Throw, cpu: Throw): DuelOutcome {
  if (player === cpu) return 'tie';
  return BEATS[player] === cpu ? 'win' : 'lose';
}

export function isThrow(value: unknown): value is Throw {
  return typeof value === 'string' && (THROWS as readonly string[]).includes(value);
}

/** Today's opponent: its ten throws, decided by the day alone. */
export function duelThrows(day: string = dailyKey()): Throw[] {
  const random = dailyRandom('rps', day);
  const favourite = THROWS[Math.floor(random() * THROWS.length)];
  return Array.from({ length: DUEL_ROUNDS }, () =>
    random() < 0.5 ? favourite : THROWS[Math.floor(random() * THROWS.length)]);
}

export interface DuelTally { win: number; lose: number; tie: number }

export function tally(player: Throw[], cpu: Throw[]): DuelTally {
  const result: DuelTally = { win: 0, lose: 0, tie: 0 };
  player.forEach((t, i) => { if (cpu[i]) result[judge(t, cpu[i])] += 1; });
  return result;
}

/** Stored progress is only trusted if it's a list of real throws, at most ten. */
export function parseDuel(value: unknown): Throw[] {
  const throws = (value as { throws?: unknown } | null)?.throws;
  return Array.isArray(throws) && throws.every(isThrow) ? throws.slice(0, DUEL_ROUNDS) : [];
}
