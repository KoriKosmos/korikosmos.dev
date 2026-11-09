import assert from 'node:assert/strict';
import test from 'node:test';
import {
  COLS, DAS_MS, ARR_MS, HIDDEN_ROWS, LOCK_DELAY_MS, MAX_LOCK_RESETS, PIECES, TOTAL_ROWS,
  TetrisEngine, describeClear, gravityMs, isDifficult, kickOffsets, rotateMatrix, scoreClear, shapeOf,
  type ActivePiece,
} from '../src/lib/tetris';
import { cleanName, mergeRps, mergeTetris, normaliseFile, parseTetris, LEADERBOARD_SIZE } from '../src/lib/scores';

/** Deterministic PRNG so bag order is reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

function started() {
  const game = new TetrisEngine({ random: seeded() });
  game.start();
  return game;
}

function place(game: TetrisEngine, piece: Omit<ActivePiece, 'matrix'> & { matrix?: ActivePiece['matrix'] }) {
  let matrix = shapeOf(piece.type);
  for (let i = 0; i < piece.rot; i++) matrix = rotateMatrix(matrix, 1);
  game.piece = { ...piece, matrix: piece.matrix ?? matrix };
}

test('the 7-bag deals every piece exactly once per seven', () => {
  const game = started();
  const seen: string[] = [game.piece!.type];
  for (let i = 0; i < 13; i++) {
    game.hold = null;
    game.holdUsed = false;
    game.holdPiece(); // cycles through the queue without touching the board
    seen.push(game.piece!.type);
  }
  // holdPiece puts each piece into hold and pulls the next from the queue.
  assert.deepEqual([...seen.slice(0, 7)].sort(), [...PIECES].sort());
  assert.deepEqual([...seen.slice(7, 14)].sort(), [...PIECES].sort());
});

test('pieces spawn centred, in spawn orientation, at the top of the visible field', () => {
  const game = started();
  const p = game.piece!;
  assert.equal(p.rot, 0);
  assert.equal(p.x, p.type === 'O' ? 4 : 3);
  const topRow = p.matrix.findIndex(row => row.some(Boolean));
  assert.equal(p.y + topRow, HIDDEN_ROWS, 'spawns then drops one row onto the first visible row');
});

test('SRS uses full bounding boxes and flips the published y-up kicks', () => {
  assert.deepEqual(rotateMatrix(shapeOf('T'), 1).map(r => r.map(Boolean)), [
    [false, true, false], [false, true, true], [false, true, false],
  ]);
  assert.deepEqual(rotateMatrix(rotateMatrix(shapeOf('I'), 1), -1), shapeOf('I'));
  // Guideline JLSTZ 0→R test 3 is (-1, +1) in y-up, i.e. one row *up* here.
  assert.deepEqual(kickOffsets('T', 0, 1)[2], [-1, -1]);
  assert.deepEqual(kickOffsets('I', 0, 1)[4], [1, -2]);
  assert.deepEqual(kickOffsets('O', 0, 1), [[0, 0]]);
});

test('a wall kick lets an I piece rotate flush against the wall', () => {
  const game = started();
  place(game, { type: 'I', x: -1, y: 10, rot: 1 }); // vertical, in column 1
  while (game.move(-1)) { /* slide to the wall */ }
  assert.ok(game.rotate(1), 'rotation succeeds via a kick');
  assert.equal(game.piece!.rot, 2);
  assert.equal(game.piece!.x, 0, 'kicked two columns right, test 3 of the I table');
});

test('a T-spin double is detected, cleared, and scored by the Guideline table', () => {
  const game = started();
  const bottom = TOTAL_ROWS - 1;
  game.board = game.board.map(() => Array(COLS).fill(0));
  game.board[bottom] = Array.from({ length: COLS }, (_, c) => (c === 4 ? 0 : 1));
  game.board[bottom - 1] = Array.from({ length: COLS }, (_, c) => (c >= 3 && c <= 5 ? 0 : 1));
  game.board[bottom - 2][5] = 1; // the overhang that makes it a spin
  place(game, { type: 'T', x: 3, y: bottom - 2, rot: 1 });
  const before = game.score;

  assert.ok(game.rotate(1));
  game.hardDrop();

  const clear = game.lastClear!;
  assert.equal(clear.lines, 2);
  assert.equal(clear.tSpin, 'full');
  assert.equal(clear.backToBack, false);
  assert.equal(game.score - before, 1200);
  assert.equal(describeClear(clear), 'T-Spin Double');
  assert.ok(game.backToBack, 'starts a back-to-back chain');
});

test('scoring: back-to-back, combos, perfect clears, and the level multiplier', () => {
  assert.equal(scoreClear(4, 'none', false, 0, false, 1), 800);
  assert.equal(scoreClear(4, 'none', true, 0, false, 1), 1200);
  assert.equal(scoreClear(1, 'none', false, 3, false, 2), (100 + 150) * 2);
  assert.equal(scoreClear(4, 'none', false, 0, true, 1), 800 + 2000);
  assert.equal(scoreClear(0, 'mini', false, 0, false, 1), 100);
  assert.ok(isDifficult(4, 'none'));
  assert.ok(isDifficult(1, 'mini'));
  assert.ok(!isDifficult(3, 'none'));
  assert.ok(!isDifficult(0, 'full'), 'a zero-line T-spin neither starts nor breaks a chain');
});

test('a perfect-clear tetris is labelled and pays the bonus', () => {
  const game = started();
  game.board = game.board.map(() => Array(COLS).fill(0));
  for (let r = TOTAL_ROWS - 4; r < TOTAL_ROWS; r++) {
    game.board[r] = Array.from({ length: COLS }, (_, c) => (c === 0 ? 0 : 1));
  }
  place(game, { type: 'I', x: -1, y: 5, rot: 3 }); // vertical, in column 0
  const before = game.score;
  game.hardDrop();
  assert.equal(game.lastClear!.lines, 4);
  assert.ok(game.lastClear!.perfectClear);
  assert.match(describeClear(game.lastClear!), /Tetris · Perfect Clear!/);
  assert.ok(game.score - before >= 2800);
});

test('lock delay resets on movement, but only 15 times', () => {
  const game = started();
  while (game.softDrop()) { /* reach the floor */ }
  const locks = game.lastClear?.id ?? 0;
  let dir: 1 | -1 = 1;
  let steps = 0;
  while ((game.lastClear?.id ?? 0) === locks && steps < 100) {
    game.step(LOCK_DELAY_MS - 100);
    if (!game.move(dir)) { dir = dir === 1 ? -1 : 1; game.move(dir); }
    steps++;
  }
  assert.ok(steps > MAX_LOCK_RESETS - 1, 'moving kept the piece alive for a while');
  assert.ok(steps <= MAX_LOCK_RESETS + 2, 'but infinite spinning still locks');
});

test('DAS shifts once on press, once when charged, then every ARR', () => {
  const game = started();
  const x0 = game.piece!.x;
  game.setHoriz(-1);
  assert.equal(game.piece!.x, x0 - 1);
  game.step(DAS_MS - 1);
  assert.equal(game.piece!.x, x0 - 1, 'nothing until DAS charges');
  game.step(1);
  assert.equal(game.piece!.x, x0 - 2, 'one shift as DAS charges');
  game.step(ARR_MS);
  assert.equal(game.piece!.x, x0 - 3);
  game.releaseHoriz(-1);
  game.step(ARR_MS * 3);
  assert.equal(game.piece!.x, x0 - 3);
});

test('hold returns the piece in spawn orientation and is once per drop', () => {
  const game = started();
  const first = game.piece!.type;
  game.rotate(1);
  assert.ok(game.holdPiece());
  assert.equal(game.hold, first);
  assert.ok(!game.holdPiece(), 'second hold before locking is refused');
  game.hardDrop();
  assert.ok(game.holdPiece());
  assert.equal(game.piece!.type, first);
  assert.equal(game.piece!.rot, 0);
});

test('block out: a spawn into the stack ends the game', () => {
  const game = started();
  for (let r = 1; r < TOTAL_ROWS; r++) game.board[r] = Array.from({ length: COLS }, (_, c) => (c === 9 ? 0 : 1));
  game.holdPiece();
  assert.equal(game.status, 'over');
});

test('lock out: a piece that settles entirely above the field ends the game', () => {
  const game = started();
  game.board = game.board.map(() => Array(COLS).fill(0));
  game.board[HIDDEN_ROWS] = Array.from({ length: COLS }, (_, c) => (c === 9 ? 0 : 1));
  place(game, { type: 'I', x: 3, y: HIDDEN_ROWS - 2, rot: 0 }); // occupies hidden row 1
  game.hardDrop();
  assert.equal(game.status, 'over');
});

test('paused games ignore time and input', () => {
  const game = started();
  game.pause();
  const { x, y } = game.piece!;
  game.step(10_000);
  assert.equal(game.move(1), false);
  game.hardDrop();
  assert.deepEqual([game.piece!.x, game.piece!.y], [x, y]);
  game.resume();
  assert.equal(game.status, 'playing');
});

test('gravity follows the Guideline curve and levels every 10 lines', () => {
  assert.equal(Math.round(gravityMs(1)), 1000);
  assert.ok(gravityMs(10) < gravityMs(5));
  assert.equal(gravityMs(40), gravityMs(20));
  const game = started();
  game.lines = 9;
  game.board = game.board.map(() => Array(COLS).fill(0));
  game.board[TOTAL_ROWS - 1] = Array.from({ length: COLS }, (_, c) => (c >= 3 && c <= 6 ? 0 : 1));
  place(game, { type: 'I', x: 3, y: 5, rot: 0 });
  game.hardDrop();
  assert.equal(game.lines, 10);
  assert.equal(game.level, 2);
});

test('leaderboard merge keeps each name\'s best and caps the board', () => {
  let board = mergeTetris([], { name: 'a', score: 10 });
  board = mergeTetris(board, { name: 'a', score: 5 });
  board = mergeTetris(board, { name: 'b', score: 20 });
  assert.deepEqual(board, [{ name: 'b', score: 20 }, { name: 'a', score: 10 }]);
  for (let i = 0; i < 20; i++) board = mergeTetris(board, { name: `p${i}`, score: 100 + i });
  assert.equal(board.length, LEADERBOARD_SIZE);
  assert.equal(board[0].score, 119);

  const rps = mergeRps([], { name: 'x', netScore: 2, playerWins: 3, cpuWins: 1, ties: 0 });
  assert.equal(mergeRps(rps, { name: 'x', netScore: 1, playerWins: 1, cpuWins: 0, ties: 0 })[0].netScore, 2);
});

test('score submissions are validated', () => {
  assert.equal(cleanName('  Kori\u0000 \n Kosmos  '), 'Kori Kosmos');
  assert.equal(cleanName('   '), null);
  assert.equal(cleanName('x'.repeat(40))?.length, 20);
  assert.ok(parseTetris({ name: 'a', score: 100 }).ok);
  assert.ok(!parseTetris({ name: 'a', score: 1.5 }).ok);
  assert.ok(!parseTetris({ name: 'a', score: -1 }).ok);
  assert.ok(!parseTetris({ name: 'a', score: 1e12 }).ok);
  assert.ok(!parseTetris({ score: 100 }).ok);
  assert.deepEqual(normaliseFile({ scores: 'nope' }), { scores: [] });
  assert.deepEqual(normaliseFile(null), { scores: [] });
});
