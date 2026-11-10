/**
 * Gamepad input for the game islands, read through the browser Gamepad API.
 *
 * The API has no button events, only a snapshot per pad that has to be polled
 * every frame, so this turns snapshots into a set of named buttons and the
 * edges between two polls (pressed / released). Buttons are named by the
 * W3C "standard" layout (Xbox naming: A bottom, B right, X left, Y top), which
 * Chrome, Firefox and Safari map Xbox, PlayStation and Switch pads onto. The
 * left stick doubles as the d-pad. Every connected pad feeds the same state,
 * so it doesn't matter which controller picks up.
 *
 * Pure apart from `watchGamepads`, which owns a rAF loop, and a press telling
 * haptics.ts that feedback should now go to the pad. The reader takes the pad
 * source as a parameter so tests can feed it fake snapshots.
 */
import { noteInput } from './haptics';

export type PadButton =
  | 'a' | 'b' | 'x' | 'y'
  | 'lb' | 'rb' | 'lt' | 'rt'
  | 'select' | 'start'
  | 'up' | 'down' | 'left' | 'right';

/** The parts of a `Gamepad` this module reads. */
export interface GamepadLike {
  connected: boolean;
  buttons: readonly { pressed: boolean; value: number }[];
  axes: readonly number[];
}

export type GamepadSource = () => readonly (GamepadLike | null)[];

/** Standard-mapping button indices. */
const BUTTON_INDEX: [PadButton, number][] = [
  ['a', 0], ['b', 1], ['x', 2], ['y', 3],
  ['lb', 4], ['rb', 5], ['lt', 6], ['rt', 7],
  ['select', 8], ['start', 9],
  ['up', 12], ['down', 13], ['left', 14], ['right', 15],
];

/** How far the stick must lean before it counts as a direction. */
export const STICK_DEADZONE = 0.5;
/** Analogue triggers count as pressed past half travel. */
const TRIGGER_THRESHOLD = 0.5;

/** The named buttons held on one pad, with the left stick folded into the d-pad. */
export function readPad(pad: GamepadLike): Set<PadButton> {
  const held = new Set<PadButton>();
  for (const [name, index] of BUTTON_INDEX) {
    const button = pad.buttons[index];
    if (button && (button.pressed || button.value > TRIGGER_THRESHOLD)) held.add(name);
  }
  const [x = 0, y = 0] = pad.axes;
  if (x <= -STICK_DEADZONE) held.add('left');
  if (x >= STICK_DEADZONE) held.add('right');
  if (y <= -STICK_DEADZONE) held.add('up');
  if (y >= STICK_DEADZONE) held.add('down');
  return held;
}

export interface PadFrame {
  /** Every button held right now, across all connected pads. */
  held: ReadonlySet<PadButton>;
  /** Buttons that went down since the last poll. */
  pressed: ReadonlySet<PadButton>;
  /** Buttons that came up since the last poll (including on disconnect). */
  released: ReadonlySet<PadButton>;
  /** Whether any pad is connected. */
  connected: boolean;
}

/** The browser's pads, or none where the API is missing or blocked. */
export const browserGamepads: GamepadSource = () => {
  try {
    return typeof navigator !== 'undefined' && typeof navigator.getGamepads === 'function'
      ? navigator.getGamepads()
      : [];
  } catch {
    // A permissions policy can forbid the API; that just means no pads.
    return [];
  }
};

/** Polls pads and reports what changed since the previous poll. */
export class GamepadReader {
  private held = new Set<PadButton>();

  constructor(private readonly source: GamepadSource = browserGamepads) {}

  poll(): PadFrame {
    const now = new Set<PadButton>();
    let connected = false;
    for (const pad of this.source()) {
      if (!pad || !pad.connected) continue;
      connected = true;
      for (const button of readPad(pad)) now.add(button);
    }
    const pressed = new Set<PadButton>();
    const released = new Set<PadButton>();
    for (const button of now) if (!this.held.has(button)) pressed.add(button);
    for (const button of this.held) if (!now.has(button)) released.add(button);
    this.held = now;
    // A press means the player is holding a pad, so feedback goes there.
    if (pressed.size) noteInput('pad');
    return { held: now, pressed, released, connected };
  }
}

/** Initial pause, then repeat rate, for a held direction in menus and grids. */
export const REPEAT_DELAY_MS = 320;
export const REPEAT_RATE_MS = 110;

const DIRECTIONS = ['up', 'down', 'left', 'right'] as const;
export type PadDirection = typeof DIRECTIONS[number];

/**
 * Turns a held direction into one step on press and then a steady repeat,
 * like a held arrow key. Only the most recently pressed direction repeats.
 */
export class DirectionRepeater {
  private dir: PadDirection | null = null;
  private timer = 0;

  /** The direction to step this frame, if any. */
  update(frame: PadFrame, dt: number): PadDirection | null {
    const fresh = DIRECTIONS.find(d => frame.pressed.has(d));
    if (fresh) {
      this.dir = fresh;
      this.timer = REPEAT_DELAY_MS;
      return fresh;
    }
    if (!this.dir || !frame.held.has(this.dir)) {
      this.dir = DIRECTIONS.find(d => frame.held.has(d)) ?? null;
      this.timer = REPEAT_DELAY_MS;
      return null;
    }
    this.timer -= dt;
    if (this.timer > 0) return null;
    this.timer += REPEAT_RATE_MS;
    if (this.timer <= 0) this.timer = REPEAT_RATE_MS;
    return this.dir;
  }
}

/**
 * Calls `onFrame` every animation frame while a pad is connected, and stops
 * polling when the last one goes. Browsers only expose a pad after a button is
 * pressed on the page, so the loop starts on `gamepadconnected` (or straight
 * away if a pad is already visible). Returns a cleanup function.
 */
export function watchGamepads(
  onFrame: (frame: PadFrame, dt: number) => void,
  onConnectionChange?: (connected: boolean) => void,
): () => void {
  if (typeof window === 'undefined' || typeof requestAnimationFrame !== 'function') return () => {};
  const reader = new GamepadReader();
  let raf = 0;
  let last: number | null = null;
  let connected = false;

  const setConnected = (value: boolean) => {
    if (connected === value) return;
    connected = value;
    onConnectionChange?.(value);
  };
  const tick = (time: number) => {
    const dt = last === null ? 0 : Math.min(time - last, 100);
    last = time;
    const frame = reader.poll();
    onFrame(frame, dt);
    if (frame.connected) {
      raf = requestAnimationFrame(tick);
    } else {
      raf = 0;
      last = null;
      setConnected(false);
    }
  };
  const start = () => {
    setConnected(true);
    if (!raf) raf = requestAnimationFrame(tick);
  };

  window.addEventListener('gamepadconnected', start);
  if (browserGamepads().some(pad => pad?.connected)) start();
  return () => {
    window.removeEventListener('gamepadconnected', start);
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };
}

/** True while a modal dialog other than `own` is open, so pads leave it alone. */
export function otherDialogOpen(own?: HTMLDialogElement | null): boolean {
  if (typeof document === 'undefined') return false;
  return [...document.querySelectorAll('dialog[open]')].some(dialog => dialog !== own);
}
