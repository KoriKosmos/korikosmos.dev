// Server-only: the daily log behind the /about card's "this week" sparklines,
// in data/vitals.json. It only ever stores the numeric TREND_STATS (already
// public, one value per stat per day) for the last TREND_DAYS days.
import type { HeartStats } from './heartRateTypes';
import { readJson, updateJson } from './jsonStore';
import { normaliseHistory, recordDay, trendSeries, trendValues, type VitalsHistory, type VitalsTrend } from './vitalsTrend';

const FILE = 'vitals.json';
/** At most one write per this long, plus one whenever the numbers change. */
const WRITE_EVERY_MS = 15 * 60_000;

/** The server's own calendar day. Compose sets TZ=Europe/London, so it follows UK midnight. */
export function localDay(now: number = Date.now()): string {
  return new Date(now).toLocaleDateString('en-CA');
}

let lastWrite = 0;
let lastSignature = '';

/** Log today's numbers from a snapshot. Cheap to call on every heart-rate read. */
export async function noteStats(stats: HeartStats | undefined, now: number = Date.now()): Promise<void> {
  const values = trendValues(stats);
  if (!Object.keys(values).length) return;
  const day = localDay(now);
  const signature = `${day}|${JSON.stringify(values)}`;
  if (signature === lastSignature && now - lastWrite < WRITE_EVERY_MS) return;
  lastSignature = signature;
  lastWrite = now;
  try {
    await updateJson<VitalsHistory>(FILE, { days: {} }, current => recordDay(normaliseHistory(current), day, values));
  } catch (error) {
    // data/ may be read-only; the card just shows no trend.
    console.error('[vitals] failed to log stats', error);
  }
}

export async function getVitalsTrend(now: number = Date.now()): Promise<VitalsTrend> {
  return trendSeries(normaliseHistory(await readJson<unknown>(FILE, null)), localDay(now));
}
