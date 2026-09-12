import assert from 'node:assert/strict';
import test from 'node:test';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { StarPairs } from '../src/page-components/StarPairs';
import { BEST_KEY, DIFFICULTIES, concealPairCards, createPairGame, flipPairCard, isBetterScore, parsePersonalBests, type Difficulty } from '../src/lib/starPairs';
import { setupDom } from './dom';

test('each difficulty deals exactly two of each chosen constellation', () => {
  for (const difficulty of Object.keys(DIFFICULTIES) as Difficulty[]) {
    const game = createPairGame(difficulty, () => 0.4);
    const counts = new Map<number, number>();
    game.cards.forEach(card => counts.set(card.sign, (counts.get(card.sign) ?? 0) + 1));
    assert.equal(game.cards.length, DIFFICULTIES[difficulty].pairs * 2);
    assert.equal(counts.size, DIFFICULTIES[difficulty].pairs);
    assert.ok([...counts.values()].every(count => count === 2));
    assert.equal(new Set(game.cards.map(card => card.id)).size, game.cards.length);
  }
});

test('a mismatch locks further reveals until it is concealed and counts one move', () => {
  let game = createPairGame('orbit', () => 0.4);
  const [first, second] = [game.cards[0], game.cards.find(card => card.sign !== game.cards[0].sign)!];
  game = flipPairCard(game, first.id);
  assert.equal(flipPairCard(game, first.id), game);
  assert.equal(flipPairCard(game, -1), game);
  game = flipPairCard(game, second.id);
  assert.equal(game.moves, 1);
  assert.equal(game.flipped.length, 2);
  const third = game.cards.find(card => !game.flipped.includes(card.id))!;
  assert.equal(flipPairCard(game, third.id), game);
  assert.equal(concealPairCards(game).flipped.length, 0);
});

test('all matched pairs complete the game and completed cards cannot be replayed', () => {
  let game = createPairGame('orbit');
  const initial = game;
  for (const sign of new Set(game.cards.map(card => card.sign))) {
    const pair = game.cards.filter(card => card.sign === sign);
    game = flipPairCard(flipPairCard(game, pair[0].id), pair[1].id);
    assert.equal(flipPairCard(game, pair[0].id), game);
  }
  assert.equal(game.won, true);
  assert.equal(game.moves, 6);
  assert.equal(game.matched.length, 12);
  assert.equal(initial.moves, 0, 'The original state is immutable');
});

test('personal bests prioritise moves, then time, and ignore damaged storage', () => {
  assert.equal(isBetterScore({ moves: 8, seconds: 100 }, { moves: 9, seconds: 20 }), true);
  assert.equal(isBetterScore({ moves: 8, seconds: 30 }, { moves: 8, seconds: 20 }), false);
  assert.equal(isBetterScore({ moves: 8, seconds: 10 }, { moves: 8, seconds: 20 }), true);
  assert.deepEqual(parsePersonalBests('{broken'), {});
  assert.deepEqual(parsePersonalBests('{"orbit":{"moves":1,"seconds":5},"galaxy":{"moves":20,"seconds":-1}}'), {});
  assert.deepEqual(parsePersonalBests('{"orbit":{"moves":8,"seconds":45}}'), { orbit: { moves: 8, seconds: 45 } });
});

test('the game supports keyboard focus, mismatch delay, pause, and a clean restart', async t => {
  const env = setupDom();
  Object.defineProperty(document, 'hidden', { configurable: true, writable: true, value: false });
  t.mock.method(Math, 'random', () => 0.4);
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] });
  const expected = createPairGame('orbit');
  const root = createRoot(document.getElementById('root')!);
  const click = async (button: HTMLButtonElement) => { await act(async () => { button.click(); }); };
  const findButton = (text: string) => [...document.querySelectorAll('button')].find(button => button.textContent === text)!;
  try {
    await act(async () => { root.render(createElement(StarPairs)); });
    await click(findButton('Start game'));
    const cards = [...document.querySelectorAll<HTMLButtonElement>('.star-pairs-card')];
    assert.equal(cards.length, 12);
    await act(async () => {
      cards[0].focus();
      cards[0].dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    });
    assert.equal(document.activeElement, cards[1]);
    await click(cards[0]);
    const other = expected.cards.find(card => card.sign !== expected.cards[0].sign)!;
    await click(cards[other.id]);
    assert.match(document.querySelector('[role="status"]')?.textContent ?? '', /Try another pair/);
    await act(async () => { t.mock.timers.tick(1000); });
    assert.equal(document.querySelectorAll('[data-revealed="true"]').length, 0);
    await click(findButton('Pause'));
    const stoppedAt = document.querySelectorAll('dd')[2].textContent;
    await act(async () => { t.mock.timers.tick(5000); });
    assert.equal(document.querySelectorAll('dd')[2].textContent, stoppedAt);
    await click(cards[0]);
    assert.equal(document.querySelectorAll('[data-revealed="true"]').length, 0);
    await click(findButton('Resume'));
    await act(async () => { document.dispatchEvent(new window.Event('visibilitychange')); });
    await click(findButton('New game'));
    assert.deepEqual([...document.querySelectorAll('dd')].map(node => node.textContent), ['0 / 6', '0', '0:00']);
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    await act(async () => { document.dispatchEvent(new window.Event('visibilitychange')); });
    assert.match(document.querySelector('[role="status"]')?.textContent ?? '', /Paused/);
    await click(findButton('Resume'));
    for (const sign of new Set(expected.cards.map(card => card.sign))) {
      for (const card of expected.cards.filter(card => card.sign === sign)) {
        await click(document.querySelectorAll<HTMLButtonElement>('.star-pairs-card')[card.id]);
      }
    }
    assert.match(document.querySelector('[role="status"]')?.textContent ?? '', /Sky complete/);
    assert.match(document.querySelector('footer')?.textContent ?? '', /Your best Orbit: 6 moves/);
  } finally {
    await act(async () => { root.unmount(); });
    t.mock.timers.reset();
    env.cleanup();
  }
});

test('restarting an active round resets its timer without resetting it on card flips', async t => {
  const env = setupDom();
  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  t.mock.method(Math, 'random', () => 0.4);
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] });
  const expected = createPairGame('orbit');
  const root = createRoot(document.getElementById('root')!);
  const click = async (button: HTMLButtonElement) => { await act(async () => { button.click(); }); };
  const findButton = (text: string) => [...document.querySelectorAll('button')].find(button => button.textContent === text)!;
  const time = () => document.querySelectorAll('dd')[2].textContent;
  try {
    await act(async () => { root.render(createElement(StarPairs)); });
    await click(findButton('Start game'));
    await act(async () => { t.mock.timers.tick(900); });
    await click(findButton('New game'));
    await act(async () => { t.mock.timers.tick(100); });
    assert.equal(time(), '0:00', 'The previous round must not advance the new clock');
    await act(async () => { t.mock.timers.tick(400); });
    await click(document.querySelectorAll<HTMLButtonElement>('.star-pairs-card')[0]);
    await act(async () => { t.mock.timers.tick(499); });
    assert.equal(time(), '0:00');
    await act(async () => { t.mock.timers.tick(1); });
    assert.equal(time(), '0:01', 'A card flip must not delay the round timer');

    for (const sign of new Set(expected.cards.map(card => card.sign))) {
      for (const card of expected.cards.filter(card => card.sign === sign)) {
        await click(document.querySelectorAll<HTMLButtonElement>('.star-pairs-card')[card.id]);
      }
    }
    assert.match(document.querySelector('[role="status"]')?.textContent ?? '', /Sky complete/);
    assert.deepEqual(JSON.parse(localStorage.getItem(BEST_KEY)!).orbit, { moves: 6, seconds: 1 });
    await act(async () => { t.mock.timers.tick(5000); });
    assert.equal(time(), '0:01', 'Completion stops the clock');
  } finally {
    await act(async () => { root.unmount(); });
    t.mock.timers.reset();
    env.cleanup();
  }
});
