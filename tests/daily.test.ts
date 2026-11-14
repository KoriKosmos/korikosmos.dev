import assert from 'node:assert/strict';
import test from 'node:test';
import { dailyKey, dailyRandom, isDailyKey, msUntilNextDaily, seededRandom } from '../src/lib/daily';
import { DUEL_ROUNDS, duelThrows, judge, parseDuel, tally } from '../src/lib/rpsDuel';
import { createPairGame } from '../src/lib/starPairs';
import { TetrisEngine } from '../src/lib/tetris';
import { normaliseDaily, parseTetrisDaily } from '../src/lib/scores';

test('the daily key is the UTC date, and midnight UTC starts the next one', () => {
  assert.equal(dailyKey(Date.UTC(2026, 10, 14, 23, 59, 59)), '2026-11-14');
  assert.equal(dailyKey(Date.UTC(2026, 10, 15, 0, 0, 0)), '2026-11-15');
  assert.equal(msUntilNextDaily(Date.UTC(2026, 10, 14, 23, 0, 0)), 3_600_000);
  assert.ok(isDailyKey('2026-11-14'));
  for (const bad of ['2026-02-30', '2026-1-1', 'today', 20261114, null]) assert.equal(isDailyKey(bad), false);
});

test('seeded sources repeat for the same seed and differ between games and days', () => {
  const a = seededRandom('x'), b = seededRandom('x');
  const run = Array.from({ length: 20 }, () => a());
  assert.deepEqual(run, Array.from({ length: 20 }, () => b()));
  assert.ok(run.every(n => n >= 0 && n < 1));
  const first = (r: () => number) => Array.from({ length: 5 }, r);
  assert.notDeepEqual(first(dailyRandom('tetris', '2026-11-14')), first(dailyRandom('tetris', '2026-11-15')));
  assert.notDeepEqual(first(dailyRandom('tetris', '2026-11-14')), first(dailyRandom('rps', '2026-11-14')));
});

test("everyone gets the same daily Tetris pieces, and a free game after it doesn't", () => {
  const pieces = (game: TetrisEngine) => [game.piece?.type, ...game.queue].join('');
  const one = new TetrisEngine(), two = new TetrisEngine();
  one.start(dailyRandom('tetris', '2026-11-14'));
  two.start(dailyRandom('tetris', '2026-11-14'));
  assert.equal(pieces(one), pieces(two));
  let calls = 0;
  const free = new TetrisEngine({ random: () => { calls += 1; return 0.5; } });
  free.start(dailyRandom('tetris', '2026-11-14'));
  free.start();
  assert.ok(calls > 0, 'A plain start() goes back to the engine’s own random source');
});

test('the daily sky deals the same board for the same day and size', () => {
  const deal = (day: string) => createPairGame('nebula', dailyRandom('star-pairs:nebula', day)).cards.map(c => c.sign);
  assert.deepEqual(deal('2026-11-14'), deal('2026-11-14'));
  assert.notDeepEqual(deal('2026-11-14'), deal('2026-11-15'));
});

test('the duel opponent is fixed per day and has a favourite throw', () => {
  assert.deepEqual(duelThrows('2026-11-14'), duelThrows('2026-11-14'));
  assert.equal(duelThrows('2026-11-14').length, DUEL_ROUNDS);
  // Over many days the favourite shows up well above a third of the time.
  let lean = 0;
  for (let d = 1; d <= 28; d++) {
    const throws = duelThrows(`2026-02-${String(d).padStart(2, '0')}`);
    const counts = ['rock', 'paper', 'scissors'].map(t => throws.filter(x => x === t).length);
    lean += Math.max(...counts);
  }
  assert.ok(lean / (28 * DUEL_ROUNDS) > 0.5);
  assert.equal(judge('rock', 'scissors'), 'win');
  assert.equal(judge('rock', 'paper'), 'lose');
  assert.equal(judge('paper', 'paper'), 'tie');
  assert.deepEqual(tally(['rock', 'paper'], ['scissors', 'scissors']), { win: 1, lose: 1, tie: 0 });
  assert.deepEqual(parseDuel({ throws: ['rock', 'lizard'] }), []);
  assert.equal(parseDuel({ throws: Array(15).fill('rock') }).length, DUEL_ROUNDS);
});

test('the daily Tetris board only accepts and keeps today', () => {
  assert.deepEqual(normaliseDaily({ day: '2026-11-13', scores: [{ name: 'a', score: 1 }] }, '2026-11-14'), { day: '2026-11-14', scores: [] });
  assert.deepEqual(normaliseDaily({ day: '2026-11-14', scores: [{ name: 'a', score: 1 }] }, '2026-11-14').scores.length, 1);
  assert.equal(parseTetrisDaily({ name: 'a', score: 5, day: '2026-11-13' }, '2026-11-14').ok, false);
  assert.deepEqual(parseTetrisDaily({ name: 'a', score: 5, day: '2026-11-14' }, '2026-11-14'), { ok: true, entry: { name: 'a', score: 5 } });
});
