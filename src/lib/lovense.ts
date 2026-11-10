/**
 * Optional Lovense output for the game haptics, over the Lovense Standard
 * API's "Game Mode": the Lovense Remote app on the player's own phone or PC
 * listens on the LAN, and the browser posts commands straight to it through a
 * `<ip-with-dashes>.lovense.club` hostname (which resolves to that LAN IP and
 * carries a valid certificate, so an https page can call it). Nothing goes
 * through this site's server.
 *
 * Off unless a device has been configured on this device's localStorage; the
 * setup form only appears on a game page opened with `?lovense`.
 */

import type { HapticEffect } from './haptics';

export const LOVENSE_KEY = 'kk-lovense';
export const DEFAULT_LOVENSE_PORT = 30010;
/** Lovense's Vibrate level runs 0–20. */
const MAX_LEVEL = 20;
const REQUEST_TIMEOUT_MS = 2000;
/** After a failed request, stay quiet this long instead of spamming the LAN. */
const BACKOFF_MS = 10_000;

export interface LovenseConfig {
  host: string;
  port: number;
}

const OCTET = '(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)';
const IPV4 = new RegExp(`^${OCTET}\\.${OCTET}\\.${OCTET}\\.${OCTET}$`);

/**
 * Only private-LAN IPv4 addresses: the app is on the player's own network, and
 * this keeps the form from being used to point requests anywhere else.
 */
export function isPrivateIPv4(host: string): boolean {
  if (!IPV4.test(host)) return false;
  const [a, b] = host.split('.').map(Number);
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

export function parseLovenseConfig(raw: unknown): LovenseConfig | null {
  if (!raw || typeof raw !== 'object') return null;
  const { host, port } = raw as Record<string, unknown>;
  if (typeof host !== 'string' || !isPrivateIPv4(host.trim())) return null;
  const portNumber = typeof port === 'string' ? Number(port) : port;
  if (typeof portNumber !== 'number' || !Number.isInteger(portNumber) || portNumber < 1 || portNumber > 65535) return null;
  return { host: host.trim(), port: portNumber };
}

export function lovenseUrl({ host, port }: LovenseConfig): string {
  return `https://${host.replace(/\./g, '-')}.lovense.club:${port}/command`;
}

export function loadLovenseConfig(): LovenseConfig | null {
  try {
    const raw = localStorage.getItem(LOVENSE_KEY);
    return raw ? parseLovenseConfig(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function saveLovenseConfig(config: LovenseConfig | null): void {
  try {
    if (config) localStorage.setItem(LOVENSE_KEY, JSON.stringify(config));
    else localStorage.removeItem(LOVENSE_KEY);
  } catch { /* Private mode: nothing persists, so nothing is configured. */ }
  failedUntil = 0;
}

/** A haptic effect as a Lovense Vibrate level: the stronger motor, scaled to 0–20. */
export function lovenseLevel(effect: Pick<HapticEffect, 'strong' | 'weak'>): number {
  const magnitude = Math.max(effect.strong, effect.weak);
  return magnitude > 0 ? Math.max(1, Math.round(magnitude * MAX_LEVEL)) : 0;
}

type Fetcher = (url: string, init: RequestInit) => Promise<Response>;

let failedUntil = 0;
let stopTimer: ReturnType<typeof setTimeout> | null = null;

function send(config: LovenseConfig, body: object, fetcher: Fetcher): Promise<boolean> {
  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timeout = controller ? setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS) : null;
  return fetcher(lovenseUrl(config), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-platform': 'korikosmos.dev' },
    body: JSON.stringify({ ...body, apiVer: 1 }),
    signal: controller?.signal,
  }).then(res => {
    if (!res.ok) throw new Error(String(res.status));
    return true;
  }).catch(() => {
    failedUntil = Date.now() + BACKOFF_MS;
    return false;
  }).finally(() => {
    if (timeout) clearTimeout(timeout);
  });
}

/**
 * Buzz the connected toy(s) for one effect. The Function command's timer runs
 * in whole seconds, so a short effect starts a one-second vibration and sends
 * Stop once the effect's own duration is up; a newer effect replaces both.
 * Returns whether a command was sent.
 */
export function lovensePulse(
  effect: Pick<HapticEffect, 'strong' | 'weak' | 'duration'>,
  config: LovenseConfig | null = loadLovenseConfig(),
  fetcher: Fetcher = (url, init) => fetch(url, init),
): boolean {
  if (!config || Date.now() < failedUntil) return false;
  const level = lovenseLevel(effect);
  if (!level) return false;
  if (stopTimer) clearTimeout(stopTimer);
  const seconds = Math.max(1, Math.ceil(effect.duration / 1000));
  send(config, { command: 'Function', action: `Vibrate:${level}`, timeSec: seconds }, fetcher);
  if (effect.duration < seconds * 1000) {
    stopTimer = setTimeout(() => {
      stopTimer = null;
      send(config, { command: 'Function', action: 'Stop', timeSec: 0 }, fetcher);
    }, effect.duration);
  }
  return true;
}

/** Send a short test buzz; resolves with whether the app answered. */
export function testLovense(config: LovenseConfig, fetcher: Fetcher = (url, init) => fetch(url, init)): Promise<boolean> {
  failedUntil = 0;
  return send(config, { command: 'Function', action: 'Vibrate:8', timeSec: 1 }, fetcher);
}

/** Test hook. */
export function resetLovense(): void {
  failedUntil = 0;
  if (stopTimer) clearTimeout(stopTimer);
  stopTimer = null;
}
