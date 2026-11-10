import assert from 'node:assert/strict';
import test from 'node:test';
import {
  HAPTIC_EFFECTS, haptic, hapticsEnabled, noteInput, resetHaptics, setHapticsEnabled, trackInputSource,
} from '../src/lib/haptics';
import { GamepadReader, type GamepadLike } from '../src/lib/gamepad';
import { hapticFor } from '../src/page-components/Tetris';
import type { ClearResult, GameEvent } from '../src/lib/tetris';
import { setupDom } from './dom';

function fakePad() {
  const effects: { type: string; params: Record<string, number> }[] = [];
  return {
    effects,
    pad: {
      connected: true,
      buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })),
      axes: [0, 0],
      vibrationActuator: {
        playEffect: (type: string, params: Record<string, number>) => { effects.push({ type, params }); return Promise.resolve('complete'); },
      },
    },
  };
}

function withNavigator(t: import('node:test').TestContext, pads: unknown[]) {
  const env = setupDom();
  const vibrations: (number | number[])[] = [];
  Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => pads });
  Object.defineProperty(navigator, 'vibrate', { configurable: true, value: (p: number | number[]) => { vibrations.push(p); return true; } });
  resetHaptics();
  t.after(() => { resetHaptics(); env.cleanup(); });
  return { env, vibrations };
}

test('feedback goes to whatever the player last used, and nowhere for keyboard or mouse', t => {
  const { pad, effects } = fakePad();
  const { vibrations } = withNavigator(t, [null, pad]);

  assert.equal(haptic('drop'), null, 'keyboard/mouse by default: nothing buzzes');
  assert.equal(effects.length + vibrations.length, 0);

  noteInput('pad');
  assert.equal(haptic('big'), 'pad');
  assert.deepEqual(effects[0], {
    type: 'dual-rumble',
    params: { startDelay: 0, duration: HAPTIC_EFFECTS.big.duration, strongMagnitude: 1, weakMagnitude: 0.8 },
  });
  assert.equal(vibrations.length, 0, 'the phone stays still while a pad is in use');

  noteInput('touch');
  assert.equal(haptic('match'), 'touch');
  assert.deepEqual(vibrations, [HAPTIC_EFFECTS.match.pattern]);
  assert.equal(effects.length, 1, 'and the idle pad stays still while playing by touch');
});

test('switching vibration off silences every device and is remembered', t => {
  const { pad, effects } = fakePad();
  const { vibrations } = withNavigator(t, [pad]);
  noteInput('pad');
  setHapticsEnabled(false);
  assert.equal(hapticsEnabled(), false);
  assert.equal(localStorage.getItem('kk-haptics'), 'off');
  assert.equal(haptic('over'), null);
  noteInput('touch');
  assert.equal(haptic('over'), null);
  assert.equal(effects.length + vibrations.length, 0);
  setHapticsEnabled(true);
  assert.equal(localStorage.getItem('kk-haptics'), null);
  assert.equal(haptic('tap'), 'touch');
});

test('a gamepad press and a touch both switch where feedback goes; a key switches it off', t => {
  const { pad, effects } = fakePad();
  const { vibrations } = withNavigator(t, [pad]);
  const stop = trackInputSource();
  t.after(stop);

  const pressed = { ...pad, buttons: pad.buttons.map((b, i) => (i === 0 ? { pressed: true, value: 1 } : b)) };
  new GamepadReader(() => [pressed as GamepadLike]).poll();
  assert.equal(haptic('tap'), 'pad');

  const touch = new window.Event('pointerdown') as Event & { pointerType: string };
  Object.defineProperty(touch, 'pointerType', { value: 'touch' });
  window.dispatchEvent(touch);
  assert.equal(haptic('tap'), 'touch');

  window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'a' }));
  assert.equal(haptic('tap'), null);
  assert.equal(effects.length, 1);
  assert.equal(vibrations.length, 1);
});

test('missing APIs are a quiet no-op', t => {
  const env = setupDom();
  resetHaptics();
  t.after(() => { resetHaptics(); env.cleanup(); });
  Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [{ connected: true, buttons: [], axes: [] }] });
  Object.defineProperty(navigator, 'vibrate', { configurable: true, value: undefined });
  noteInput('pad');
  assert.equal(haptic('big'), null);
  noteInput('touch');
  assert.equal(haptic('big'), null);
});

test('Tetris buzzes once per frame for the biggest thing that happened', () => {
  const clear = (lines: number, extra: Partial<ClearResult> = {}): GameEvent => ({
    type: 'clear', rows: [], colors: [],
    result: { id: 1, lines, tSpin: 'none', backToBack: false, combo: 0, perfectClear: false, points: 100, ...extra },
  });
  const drop: GameEvent = { type: 'hardDrop', cells: [], distance: 5, color: 1 as never };
  assert.equal(hapticFor([]), null);
  assert.equal(hapticFor([{ type: 'lock', cells: [], color: 1 as never }]), null, 'a quiet lock stays quiet');
  assert.equal(hapticFor([drop]), 'drop');
  assert.equal(hapticFor([drop, clear(2)]), 'clear');
  assert.equal(hapticFor([drop, clear(4)]), 'big');
  assert.equal(hapticFor([clear(1, { tSpin: 'full' as never })]), 'big');
  assert.equal(hapticFor([clear(2, { perfectClear: true })]), 'big');
  assert.equal(hapticFor([drop, { type: 'gameOver' }]), 'over');
});
