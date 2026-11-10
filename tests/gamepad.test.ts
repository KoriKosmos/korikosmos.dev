import assert from 'node:assert/strict';
import test from 'node:test';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import {
  DirectionRepeater, GamepadReader, REPEAT_DELAY_MS, REPEAT_RATE_MS, readPad, type GamepadLike,
} from '../src/lib/gamepad';
import { StarPairs } from '../src/page-components/StarPairs';
import { createPairGame } from '../src/lib/starPairs';
import { setupDom } from './dom';

/** A standard-mapping pad with the given button indices held. */
function pad(held: number[] = [], axes: number[] = [0, 0, 0, 0]): GamepadLike {
  return {
    connected: true,
    buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: held.includes(i), value: held.includes(i) ? 1 : 0 })),
    axes,
  };
}

test('readPad names standard buttons and folds the left stick into the d-pad', () => {
  assert.deepEqual([...readPad(pad([0, 9, 14]))].sort(), ['a', 'left', 'start']);
  assert.deepEqual([...readPad(pad([], [0.9, -0.8]))].sort(), ['right', 'up']);
  assert.equal(readPad(pad([], [0.3, -0.3])).size, 0, 'small stick drift stays in the deadzone');
  const trigger = pad();
  (trigger.buttons as { pressed: boolean; value: number }[])[7] = { pressed: false, value: 0.8 };
  assert.ok(readPad(trigger).has('rt'), 'an analogue trigger past half travel counts');
});

test('the reader reports press and release edges across every pad, and releases on disconnect', () => {
  let pads: (GamepadLike | null)[] = [];
  const reader = new GamepadReader(() => pads);
  assert.equal(reader.poll().connected, false);

  pads = [null, pad([0])];
  let frame = reader.poll();
  assert.ok(frame.connected);
  assert.deepEqual([...frame.pressed], ['a']);

  frame = reader.poll();
  assert.equal(frame.pressed.size, 0, 'a held button is pressed only once');
  assert.ok(frame.held.has('a'));

  pads = [pad([0]), pad([15])];
  assert.deepEqual([...reader.poll().pressed], ['right'], 'a second pad adds to the same state');

  pads = [];
  frame = reader.poll();
  assert.equal(frame.connected, false);
  assert.deepEqual([...frame.released].sort(), ['a', 'right']);
});

test('a held direction steps once, waits, then repeats', () => {
  let pads = [pad([15])];
  const reader = new GamepadReader(() => pads);
  const repeater = new DirectionRepeater();
  assert.equal(repeater.update(reader.poll(), 16), 'right');
  assert.equal(repeater.update(reader.poll(), REPEAT_DELAY_MS - 20), null);
  assert.equal(repeater.update(reader.poll(), 20), 'right');
  assert.equal(repeater.update(reader.poll(), REPEAT_RATE_MS - 1), null);
  assert.equal(repeater.update(reader.poll(), 1), 'right');
  pads = [pad()];
  assert.equal(repeater.update(reader.poll(), 500), null, 'letting go stops the repeat');
  pads = [pad([12])];
  assert.equal(repeater.update(reader.poll(), 16), 'up');
});

test('Star Pairs plays with a controller: Start deals, the d-pad moves focus, A flips', async t => {
  const env = setupDom();
  Object.defineProperty(document, 'hidden', { configurable: true, writable: true, value: false });
  t.mock.method(Math, 'random', () => 0.4);
  let pads: (GamepadLike | null)[] = [];
  Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => pads });
  const expected = createPairGame('orbit');
  const root = createRoot(document.getElementById('root')!);
  const press = async (...held: number[]) => {
    pads = [pad(held)];
    await act(async () => { env.flushFrames(); });
    pads = [pad()];
    await act(async () => { env.flushFrames(); });
  };
  try {
    await act(async () => { root.render(createElement(StarPairs)); });
    pads = [pad()];
    await act(async () => { window.dispatchEvent(new window.Event('gamepadconnected')); });
    assert.match(document.querySelector('#star-pairs-controls')?.textContent ?? '', /controller/);

    await press(9);
    const cards = [...document.querySelectorAll<HTMLButtonElement>('.star-pairs-card')];
    assert.equal(cards.length, 12, 'Start deals a board');

    await press(15);
    assert.equal(document.activeElement, cards[0], 'the first press brings focus onto the board');
    await press(15);
    assert.equal(document.activeElement, cards[1]);
    await press(13);
    assert.equal(document.activeElement, cards[5], 'down moves a whole row');

    await press(0);
    assert.equal(cards[5].dataset.revealed, 'true', 'A flips the focused card');
    assert.equal(expected.cards.length, 12);

    await press(9);
    assert.match(document.querySelector('[role="status"]')?.textContent ?? '', /Paused/, 'Start pauses mid-game');
    await press(9);

    pads = [];
    await act(async () => { env.flushFrames(); });
    assert.doesNotMatch(document.querySelector('#star-pairs-controls')?.textContent ?? '', /controller/,
      'the hint goes when the pad does');
  } finally {
    await act(async () => { root.unmount(); });
    env.cleanup();
  }
});
