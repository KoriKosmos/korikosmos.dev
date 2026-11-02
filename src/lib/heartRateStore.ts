import { useSyncExternalStore } from 'react';
import type { HeartStatus } from './pulsoidClient';

/**
 * Client-side state shared by every heart-rate island on a page (footer
 * readout, the /about box, the floating window). ES modules are singletons per
 * page, so they all read one poller instead of each hitting /api/heartrate.
 * Polling runs only while at least one island is mounted, and pauses while the
 * tab is hidden.
 *
 * Also holds the floating window's open state + position, persisted to
 * localStorage so it survives full-reload navigations (retro, Mandy) and page
 * refreshes. In the modern skin the window island is `transition:persist`ed,
 * so it is the same DOM across ClientRouter navigations as well.
 */

const POLL_MS = 5_000;
const OFFLINE: HeartStatus = { mode: 'offline' };

let status: HeartStatus | null = null;
let polls = false;
let timer: number | undefined;
let lastPoll = 0;
const statusListeners = new Set<() => void>();

async function poll() {
  if (document.hidden) return;
  lastPoll = Date.now();
  try {
    const response = await fetch('/api/heartrate', { cache: 'no-store' });
    status = response.ok ? await response.json() as HeartStatus : OFFLINE;
  } catch {
    status = OFFLINE;
  }
  statusListeners.forEach(listener => listener());
}

const onVisible = () => { if (!document.hidden) poll(); };

function subscribeStatus(listener: () => void) {
  statusListeners.add(listener);
  if (polls && timer === undefined) {
    // Hydration can briefly drop to zero subscribers and back; don't re-fetch.
    if (Date.now() - lastPoll > POLL_MS / 2) poll();
    timer = window.setInterval(poll, POLL_MS);
    document.addEventListener('visibilitychange', onVisible);
  }
  return () => {
    statusListeners.delete(listener);
    if (!statusListeners.size && timer !== undefined) {
      window.clearInterval(timer);
      timer = undefined;
      document.removeEventListener('visibilitychange', onVisible);
    }
  };
}

/**
 * The current heart-rate status. `initial` is the server-resolved starting
 * state; the first island to render seeds the store with it. A widget-only
 * setup (no token) never polls — there is nothing for the API to add.
 */
export function useHeartRate(initial: HeartStatus): HeartStatus {
  if (status === null && typeof window !== 'undefined') {
    status = initial;
    polls = initial.mode !== 'widget';
  }
  return useSyncExternalStore(subscribeStatus, () => status ?? initial, () => initial);
}

/* ------------------------------ floating window ------------------------------ */

export interface HeartFloatState {
  open: boolean;
  /** Top-left in CSS px, or null for the default corner. */
  x: number | null;
  y: number | null;
}

const FLOAT_KEY = 'kk-heart-float';
const CLOSED: HeartFloatState = { open: false, x: null, y: null };
let floatState: HeartFloatState | null = null;
const floatListeners = new Set<() => void>();

function readFloat(): HeartFloatState {
  if (floatState) return floatState;
  try {
    const saved = JSON.parse(localStorage.getItem(FLOAT_KEY) ?? 'null');
    const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
    floatState = saved && typeof saved === 'object'
      ? { open: saved.open === true, x: num(saved.x), y: num(saved.y) }
      : CLOSED;
  } catch {
    floatState = CLOSED;
  }
  return floatState;
}

export function setHeartFloat(patch: Partial<HeartFloatState>) {
  floatState = { ...readFloat(), ...patch };
  try { localStorage.setItem(FLOAT_KEY, JSON.stringify(floatState)); } catch { /* private mode */ }
  floatListeners.forEach(listener => listener());
}

function subscribeFloat(listener: () => void) {
  floatListeners.add(listener);
  return () => { floatListeners.delete(listener); };
}

/** Closed during SSR and hydration; the saved state applies right after. */
export function useHeartFloat(): HeartFloatState {
  return useSyncExternalStore(subscribeFloat, readFloat, () => CLOSED);
}
