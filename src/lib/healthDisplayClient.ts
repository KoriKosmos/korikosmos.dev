import { createAsyncCache } from './asyncCache';
import { STAT_KEYS, type HeartStats, type HeartStatus, type StatValues } from './heartRateTypes';

/**
 * My Health Display server's status API (github.com/KoriKosmos/health-display,
 * README "Status API"). It merges Pulsoid, my Android app, the Pixel Watch and
 * my rings into one snapshot. Pure and env-free so it can be tested;
 * `heartRate.ts` wires in the real config.
 *
 * The snapshot also carries health data I don't publish (weight, glucose, ECG,
 * food). Nothing from `values` is passed on unless it is in STAT_KEYS.
 */

/** Health Display rewrites its snapshot every few seconds; older than this means it has stalled. */
export const HEALTH_STALE_MS = 60_000;

/** How long one upstream answer is shared between every visitor. */
export const HEALTH_CACHE_MS = 3_000;

/** It's on my LAN: anything slower than this is as good as down. */
export const HEALTH_TIMEOUT_MS = 2_500;

/** After a failed request, how long to use Pulsoid before asking Health Display again. */
export const HEALTH_RETRY_MS = 30_000;

/** Display strings are short ("7h 12m", "pixel-watch"); anything longer is junk. */
const MAX_VALUE_LENGTH = 32;

const OFFLINE = { mode: 'offline' } as const;

/** A display string safe to put in the page, or undefined. */
function cleanValue(raw: unknown): string | undefined {
  if (typeof raw !== 'string' && typeof raw !== 'number') return undefined;
  const value = String(raw).replace(/[\u0000-\u001f\u007f]/g, '').trim();
  return value && value.length <= MAX_VALUE_LENGTH ? value : undefined;
}

/** Copy only the whitelisted keys (and their `_src`) out of `values`, grouped for the card. */
export function pickStats(values: unknown): HeartStats | undefined {
  if (!values || typeof values !== 'object') return undefined;
  const source = values as Record<string, unknown>;
  const stats: HeartStats = {};
  for (const [group, keys] of Object.entries(STAT_KEYS) as [keyof typeof STAT_KEYS, readonly string[]][]) {
    const picked: Record<string, string> = {};
    for (const key of keys) {
      const value = cleanValue(source[key]);
      if (value === undefined) continue;
      picked[key] = value;
      const device = cleanValue(source[`${key}_src`]);
      if (device !== undefined) picked[`${key}_src`] = device;
    }
    if (Object.keys(picked).length) stats[group] = picked as StatValues;
  }
  return Object.keys(stats).length ? stats : undefined;
}

/**
 * One status snapshot → the /api/heartrate shape. `null` means the body isn't a
 * v1 snapshot at all, which the caller treats like an outage (Pulsoid fallback).
 * A stalled snapshot (`updated_at` older than `staleMs`) reads as offline.
 */
export function parseHealthStatus(body: unknown, now: number, staleMs = HEALTH_STALE_MS): HeartStatus | null {
  if (!body || typeof body !== 'object') return null;
  const snap = body as Record<string, unknown>;
  const updatedAt = snap.updated_at;
  if (snap.v !== 1 || typeof updatedAt !== 'number' || !Number.isFinite(updatedAt)) return null;
  if (now - updatedAt > staleMs) return OFFLINE;

  const stats = pickStats(snap.values);
  const offline: HeartStatus = stats ? { mode: 'offline', stats } : OFFLINE;

  const mode = snap.mode === 'phone' || snap.mode === 'live' ? 'live' : snap.mode === 'recent' ? 'recent' : null;
  const bpm = snap.bpm;
  if (!mode || typeof bpm !== 'number' || !Number.isFinite(bpm) || bpm <= 0 || bpm > 300) return offline;

  const rounded = Math.round(bpm);
  const age = snap.bpm_age_s;
  const ageMs = typeof age === 'number' && Number.isFinite(age) && age >= 0 ? age * 1000 : 0;
  const text = cleanValue(snap.bpm_text);
  const bpmText = text && /^~?\d{1,3}$/.test(text) ? text : `${mode === 'recent' ? '~' : ''}${rounded}`;
  const values = snap.values && typeof snap.values === 'object' ? snap.values as Record<string, unknown> : {};
  const bpmAge = mode === 'recent' ? cleanValue(values.bpm_age) : undefined;

  return {
    mode,
    bpm: rounded,
    measuredAt: updatedAt - ageMs,
    bpm_text: bpmText,
    ...(bpmAge ? { bpm_age: bpmAge } : {}),
    ...(stats ? { stats } : {}),
  };
}

/** Only plain http(s) URLs; anything else leaves Health Display switched off. */
export function parseStatusUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw.trim());
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

interface ClientOptions {
  url?: string;
  token?: string;
  fetch?: typeof globalThis.fetch;
  now?: () => number;
}

export function createHealthDisplayClient({ url, token, fetch = globalThis.fetch, now = Date.now }: ClientOptions) {
  const statusUrl = parseStatusUrl(url);
  const enabled = Boolean(statusUrl && token);
  const cache = createAsyncCache<HeartStatus | null>({ maxEntries: 1, now });
  let retryAt = 0;

  const load = async (): Promise<HeartStatus | null> => {
    try {
      const response = await fetch(statusUrl!, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
      });
      const status = response.ok ? parseHealthStatus(await response.json(), now()) : null;
      if (!status) retryAt = now() + HEALTH_RETRY_MS;
      return status;
    } catch {
      retryAt = now() + HEALTH_RETRY_MS;
      return null;
    }
  };

  return {
    enabled,
    /** The current status, or null when Health Display is off or unreachable. */
    async getStatus(): Promise<HeartStatus | null> {
      if (!enabled || now() < retryAt) return null;
      return cache.get('status', load, HEALTH_CACHE_MS);
    },
  };
}

interface HeartSource {
  enabled: boolean;
  initial: () => HeartStatus;
  getHeartRate: () => Promise<HeartStatus>;
}

/** Health Display first; the Pulsoid path when it's not configured or not answering. */
export function withHealthDisplay(
  health: ReturnType<typeof createHealthDisplayClient>,
  pulsoid: HeartSource,
): HeartSource {
  return {
    enabled: health.enabled || pulsoid.enabled,
    initial: () => (health.enabled ? OFFLINE : pulsoid.initial()),
    async getHeartRate() {
      return (await health.getStatus()) ?? pulsoid.getHeartRate();
    },
  };
}
