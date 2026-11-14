/**
 * The /api/heartrate contract, shared by the server (pulsoidClient,
 * healthDisplayClient) and the islands. Client-safe: no env, no fetch.
 *
 * Every field past `mode`/`bpm`/`measuredAt`/`src` is additive, so an island
 * that only knows the original Pulsoid shape keeps working.
 */

/** The only Health Display values that ever leave the server, by card group. */
export const STAT_KEYS = {
  heart: ['bpm', 'min', 'avg', 'max', 'rhr', 'hrv'],
  day: ['steps', 'active', 'calories', 'azm'],
  night: ['sleep', 'sleep_score', 'readiness', 'recovery', 'stress'],
} as const;

export type StatGroup = keyof typeof STAT_KEYS;
export type StatKey = (typeof STAT_KEYS)[StatGroup][number];

/** One group's display strings, plus `<key>_src` naming the device each came from. */
export type StatValues = Partial<Record<StatKey | `${StatKey}_src`, string>>;
export type HeartStats = Partial<Record<StatGroup, StatValues>>;

interface Extras {
  /** "72", or "~72" for a recent (not live) reading. */
  bpm_text?: string;
  /** How old a recent reading is, preformatted ("5 min ago"). */
  bpm_age?: string;
  /** Today's whitelisted stats; absent when there are none. */
  stats?: HeartStats;
}

export type HeartStatus =
  /** A live heart rate (chest strap via Pulsoid, or a phone push). */
  | ({ mode: 'live'; bpm: number; measuredAt: number } & Extras)
  /** The newest watch/ring reading, up to 15 minutes old: show it as not live. */
  | ({ mode: 'recent'; bpm: number; measuredAt: number } & Extras)
  /** No heart rate; today's stats may still be there. */
  | ({ mode: 'offline' } & Pick<Extras, 'stats'>)
  /** Pulsoid's free widget, framed when there's nothing better. */
  | { mode: 'widget'; src: string };

/** A reading with a number to show: live or recent. */
export type HeartReading = Extract<HeartStatus, { bpm: number }>;
