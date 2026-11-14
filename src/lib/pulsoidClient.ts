import { createAsyncCache } from './asyncCache';
import type { HeartStatus } from './heartRateTypes';

/**
 * Live heart rate from Pulsoid (https://docs.pulsoid.net). Pure and env-free so
 * it can be tested; `pulsoid.ts` wires in the real config.
 *
 * Two sources, best first:
 *  1. The HTTP API with an access token (`data:heart_rate:read`). Manual tokens
 *     need Pulsoid's paid BRO plan. Gives a bare number each skin can theme.
 *  2. The free widget URL (https://pulsoid.net/widget/view/<id>), shown as an
 *     iframe. Used when there's no token, or Pulsoid starts rejecting it —
 *     i.e. the BRO plan ran out. The widget's own look is set on pulsoid.net.
 */
export const PULSOID_LATEST_URL = 'https://dev.pulsoid.net/api/v1/data/heart_rate/latest';

/** A switched-off monitor keeps returning its last reading; older than this is "offline". */
export const HEART_STALE_MS = 60_000;

/** How long one upstream answer is shared between every visitor. */
export const HEART_CACHE_MS = 3_000;

/** After Pulsoid rejects the token, how long to serve the fallback before asking again. */
export const HEART_REJECTED_RETRY_MS = 5 * 60_000;

export type { HeartStatus };

type Measured = { mode: 'live'; bpm: number; measuredAt: number } | { mode: 'offline' };
type Reading = Measured | { mode: 'rejected' };

const OFFLINE = { mode: 'offline' } as const;

export function parsePulsoidReading(body: unknown, now: number, staleMs = HEART_STALE_MS): Measured {
  if (!body || typeof body !== 'object') return OFFLINE;
  const { measured_at: measuredAt, data } = body as { measured_at?: unknown; data?: { heart_rate?: unknown } };
  const bpm = data?.heart_rate;
  if (typeof measuredAt !== 'number' || !Number.isFinite(measuredAt)) return OFFLINE;
  if (typeof bpm !== 'number' || !Number.isFinite(bpm) || bpm <= 0 || bpm > 300) return OFFLINE;
  if (now - measuredAt > staleMs) return OFFLINE;
  return { mode: 'live', bpm: Math.round(bpm), measuredAt };
}

/** Only a real Pulsoid widget page may be framed; anything else is ignored. */
export function parseWidgetUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw.trim());
    const match = url.pathname.match(/^\/widget\/view\/([0-9a-f-]{8,64})\/?$/i);
    if (url.protocol !== 'https:' || url.hostname !== 'pulsoid.net' || !match) return null;
    return `https://pulsoid.net/widget/view/${match[1]}`;
  } catch {
    return null;
  }
}

interface ClientOptions {
  token?: string;
  widgetUrl?: string;
  fetch?: typeof globalThis.fetch;
  now?: () => number;
}

export function createPulsoidClient({ token, widgetUrl, fetch = globalThis.fetch, now = Date.now }: ClientOptions) {
  const cache = createAsyncCache<Reading>({ maxEntries: 1, now });
  const widgetSrc = parseWidgetUrl(widgetUrl);
  let rejectedUntil = 0;

  const load = async (): Promise<Reading> => {
    try {
      const response = await fetch(PULSOID_LATEST_URL, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(4_000),
      });
      // 401/402/403: the token is no longer accepted (expired, revoked, or the
      // plan lapsed). Back off and serve the widget fallback meanwhile.
      if ([401, 402, 403].includes(response.status)) {
        rejectedUntil = now() + HEART_REJECTED_RETRY_MS;
        return { mode: 'rejected' };
      }
      // 412 is Pulsoid's "no heart rate data yet"; an outage reads the same.
      // The short cache TTL keeps either from fanning out to every visitor.
      if (!response.ok) return OFFLINE;
      return parsePulsoidReading(await response.json(), now());
    } catch {
      return OFFLINE;
    }
  };

  const fallback = (): HeartStatus => (widgetSrc ? { mode: 'widget', src: widgetSrc } : OFFLINE);

  return {
    /** Whether the shells should mount the heart-rate island at all. */
    enabled: Boolean(token || widgetSrc),
    /** Usable before any request: the widget when there's no token to try. */
    initial: (): HeartStatus => (token ? OFFLINE : fallback()),
    async getHeartRate(): Promise<HeartStatus> {
      if (!token || now() < rejectedUntil) return fallback();
      const reading = await cache.get('latest', load, HEART_CACHE_MS);
      return reading.mode === 'rejected' ? fallback() : reading;
    },
  };
}
