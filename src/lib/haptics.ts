/**
 * Haptic feedback for the games: controller rumble and phone vibration.
 *
 * Feedback goes to whatever the player is actually holding. The last input
 * decides: a gamepad press means rumble the pads, a touch means vibrate the
 * phone, and a keyboard or mouse means nothing (a laptop can't buzz, and a
 * pad lying idle on the desk shouldn't either). Players can switch it off;
 * that choice is stored per device.
 *
 * Every API here is optional and feature-detected: Chromium and Safari expose
 * `vibrationActuator.playEffect('dual-rumble')`, Firefox the older
 * `hapticActuators[].pulse()`, Android browsers `navigator.vibrate()`, and
 * iOS Safari none of them. A missing API is silently a no-op.
 */

import { lovensePulse } from './lovense';

export type HapticKind =
  | 'tap'    // a small confirmation: a card flips
  | 'drop'   // a piece slams down
  | 'clear'  // a line clear, a level up
  | 'big'    // a Tetris, T-spin, or perfect clear
  | 'match'  // a pair found, a round won
  | 'miss'   // a mismatch, a round lost
  | 'win'    // the game is won
  | 'over';  // the game is lost

export interface HapticEffect {
  /** Rumble length in ms. */
  duration: number;
  /** Low-frequency (heavy) motor, 0–1. */
  strong: number;
  /** High-frequency (light) motor, 0–1. */
  weak: number;
  /** Phone vibration pattern: on, off, on, … in ms. */
  pattern: number[];
}

export const HAPTIC_EFFECTS: Record<HapticKind, HapticEffect> = {
  tap:   { duration: 30,  strong: 0,    weak: 0.35, pattern: [10] },
  drop:  { duration: 60,  strong: 0.45, weak: 0.2,  pattern: [15] },
  clear: { duration: 140, strong: 0.35, weak: 0.6,  pattern: [30] },
  big:   { duration: 320, strong: 1,    weak: 0.8,  pattern: [60, 40, 90] },
  match: { duration: 120, strong: 0.2,  weak: 0.7,  pattern: [25, 40, 25] },
  miss:  { duration: 90,  strong: 0.5,  weak: 0,    pattern: [45] },
  win:   { duration: 450, strong: 0.6,  weak: 1,    pattern: [40, 50, 40, 50, 120] },
  over:  { duration: 600, strong: 0.9,  weak: 0.1,  pattern: [200, 80, 300] },
};

export type InputSource = 'pad' | 'touch' | 'pointer';

export const HAPTICS_KEY = 'kk-haptics';

let source: InputSource = 'pointer';

/** Record what the player last used; gamepad.ts calls this on every press. */
export function noteInput(next: InputSource): void {
  source = next;
}

export function lastInputSource(): InputSource {
  return source;
}

/** Test hook: forget the input source and any in-page toggle. */
export function resetHaptics(): void {
  source = 'pointer';
  override = null;
}

/** Set by the toggle, so a choice sticks for this page even when storage is blocked. */
let override: boolean | null = null;

export function hapticsEnabled(): boolean {
  if (override !== null) return override;
  try { return localStorage.getItem(HAPTICS_KEY) !== 'off'; } catch { return true; }
}

const listeners = new Set<(on: boolean) => void>();

export function setHapticsEnabled(on: boolean): void {
  try {
    if (on) localStorage.removeItem(HAPTICS_KEY);
    else localStorage.setItem(HAPTICS_KEY, 'off');
  } catch { /* Private mode: the choice lasts for this page only. */ }
  override = on;
  listeners.forEach(listener => listener(on));
}

export function subscribeHaptics(listener: (on: boolean) => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** The parts of a `Gamepad` that can rumble, across browser generations. */
interface RumblePad {
  connected?: boolean;
  vibrationActuator?: { playEffect?: (type: string, params: object) => Promise<unknown> } | null;
  hapticActuators?: readonly { pulse?: (value: number, duration: number) => Promise<unknown> }[];
}

function connectedPads(): RumblePad[] {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') return [];
    return [...navigator.getGamepads()].filter((pad): pad is Gamepad => !!pad?.connected) as RumblePad[];
  } catch {
    return [];
  }
}

function rumble(pad: RumblePad, effect: HapticEffect): boolean {
  const ignore = () => { /* A pad unplugged mid-effect rejects; nothing to do. */ };
  if (typeof pad.vibrationActuator?.playEffect === 'function') {
    pad.vibrationActuator.playEffect('dual-rumble', {
      startDelay: 0,
      duration: effect.duration,
      strongMagnitude: effect.strong,
      weakMagnitude: effect.weak,
    })?.catch?.(ignore);
    return true;
  }
  const actuator = pad.hapticActuators?.[0];
  if (typeof actuator?.pulse === 'function') {
    actuator.pulse(Math.max(effect.strong, effect.weak), effect.duration)?.catch?.(ignore);
    return true;
  }
  return false;
}

/**
 * Play one effect on whatever the player is holding. Returns where it went,
 * or null when it was skipped (switched off, keyboard/mouse, no API).
 */
export function haptic(kind: HapticKind): InputSource | null {
  if (!hapticsEnabled()) return null;
  const effect = HAPTIC_EFFECTS[kind];
  // A configured Lovense toy (see lovense.ts) follows every effect, whatever
  // the player is holding; it's opt-in per device and does nothing otherwise.
  lovensePulse(effect);
  if (source === 'pad') {
    let played = false;
    for (const pad of connectedPads()) played = rumble(pad, effect) || played;
    return played ? 'pad' : null;
  }
  if (source === 'touch' && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try { return navigator.vibrate(effect.pattern) ? 'touch' : null; } catch { return null; }
  }
  return null;
}

/**
 * Track touch vs. keyboard/mouse input on the page. Gamepad presses are
 * reported by gamepad.ts. Returns a cleanup function; safe to call from
 * several islands at once.
 */
let trackers = 0;
const onPointer = (e: PointerEvent) => noteInput(e.pointerType === 'touch' ? 'touch' : 'pointer');
const onKey = () => noteInput('pointer');

let tracked: Window | null = null;

export function trackInputSource(): () => void {
  if (typeof window === 'undefined') return () => {};
  if (trackers++ === 0) {
    tracked = window;
    tracked.addEventListener('pointerdown', onPointer, { capture: true, passive: true });
    tracked.addEventListener('keydown', onKey, { capture: true, passive: true });
  }
  let done = false;
  return () => {
    if (done) return;
    done = true;
    if (--trackers === 0 && tracked) {
      tracked.removeEventListener('pointerdown', onPointer, { capture: true });
      tracked.removeEventListener('keydown', onKey, { capture: true });
      tracked = null;
    }
  };
}
