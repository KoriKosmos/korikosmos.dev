// The /about card's "this week": a seven-day sparkline for a few of the stats
// that already leave the server every day (see STAT_KEYS). Health Display only
// answers with the current snapshot, so the site keeps its own small log
// (src/lib/vitalsHistory.ts, data/vitals.json): one number per stat per day,
// the day's last reading. Pure and client-safe: types, parsing, and shaping.

import type { HeartStats, StatKey } from './heartRateTypes';

/** Stats worth a trend line, all already public under STAT_KEYS. */
export const TREND_STATS = [
  { key: 'rhr', group: 'heart', label: 'Resting HR', unit: 'bpm' },
  { key: 'hrv', group: 'heart', label: 'HRV', unit: 'ms' },
  { key: 'steps', group: 'day', label: 'Steps', unit: '' },
  { key: 'sleep_score', group: 'night', label: 'Sleep score', unit: '' },
  { key: 'readiness', group: 'night', label: 'Readiness', unit: '' },
] as const satisfies readonly { key: StatKey; group: keyof HeartStats; label: string; unit: string }[];

export type TrendKey = (typeof TREND_STATS)[number]['key'];
export const TREND_DAYS = 7;

/** `YYYY-MM-DD` → that day's numbers. */
export interface VitalsHistory { days: Record<string, Partial<Record<TrendKey, number>>> }

export interface TrendSeries {
  key: TrendKey;
  label: string;
  unit: string;
  /** Oldest first, one per day of `days`; null where nothing was logged. */
  values: (number | null)[];
  latest: number;
}

export interface VitalsTrend { days: string[]; series: TrendSeries[] }

/** "1,234" → 1234, "45 ms" → 45, "88" → 88; anything else (e.g. "7h 12m") → null. */
export function numericValue(text: string | undefined): number | null {
  const match = text?.trim().match(/^(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?(?:\s*[a-z%]*)?$/i);
  if (!match) return null;
  const value = Number(match[1].replace(/,/g, '') + (match[2] ?? ''));
  return Number.isFinite(value) ? value : null;
}

/** The trend numbers in one stats snapshot. */
export function trendValues(stats: HeartStats | undefined): Partial<Record<TrendKey, number>> {
  const out: Partial<Record<TrendKey, number>> = {};
  for (const { key, group } of TREND_STATS) {
    const value = numericValue((stats?.[group] as Record<string, string> | undefined)?.[key]);
    if (value !== null) out[key] = value;
  }
  return out;
}

/** The `TREND_DAYS` days ending with `today`, oldest first. */
export function trendDays(today: string, count = TREND_DAYS): string[] {
  const end = Date.parse(`${today}T00:00:00Z`);
  return Array.from({ length: count }, (_, i) => new Date(end - (count - 1 - i) * 86_400_000).toISOString().slice(0, 10));
}

/**
 * Fold today's numbers into the log, overwriting today's earlier ones (the
 * last reading of a day is the day's value), and drop days past the window.
 */
export function recordDay(history: VitalsHistory, today: string, values: Partial<Record<TrendKey, number>>): VitalsHistory {
  const keep = new Set(trendDays(today));
  const days: VitalsHistory['days'] = {};
  for (const [day, entry] of Object.entries(history.days ?? {})) if (keep.has(day)) days[day] = entry;
  if (Object.keys(values).length) days[today] = { ...days[today], ...values };
  return { days };
}

/** Coerce whatever is on disk into a log (a hand-edited file shouldn't 500). */
export function normaliseHistory(raw: unknown): VitalsHistory {
  const days = (raw as VitalsHistory | null)?.days;
  if (!days || typeof days !== 'object') return { days: {} };
  const clean: VitalsHistory['days'] = {};
  for (const [day, entry] of Object.entries(days)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !entry || typeof entry !== 'object') continue;
    const values: Partial<Record<TrendKey, number>> = {};
    for (const { key } of TREND_STATS) {
      const value = (entry as Record<string, unknown>)[key];
      if (typeof value === 'number' && Number.isFinite(value)) values[key] = value;
    }
    clean[day] = values;
  }
  return { days: clean };
}

/** The card's view: only stats with at least two days of data get a line. */
export function trendSeries(history: VitalsHistory, today: string): VitalsTrend {
  const days = trendDays(today);
  const series: TrendSeries[] = [];
  for (const { key, label, unit } of TREND_STATS) {
    const values = days.map(day => history.days[day]?.[key] ?? null);
    const present = values.filter((v): v is number => v !== null);
    if (present.length >= 2) series.push({ key, label, unit, values, latest: present[present.length - 1] });
  }
  return { days, series };
}

/** SVG polyline points for one series in a `width`×`height` box; gaps are skipped. */
export function sparklinePoints(values: (number | null)[], width: number, height: number, pad = 2): string {
  const present = values.filter((v): v is number => v !== null);
  if (!present.length) return '';
  const min = Math.min(...present), max = Math.max(...present);
  const span = max - min || 1;
  const step = values.length > 1 ? (width - pad * 2) / (values.length - 1) : 0;
  return values
    .map((v, i) => v === null ? null : `${(pad + i * step).toFixed(1)},${(height - pad - ((v - min) / span) * (height - pad * 2)).toFixed(1)}`)
    .filter(Boolean)
    .join(' ');
}
