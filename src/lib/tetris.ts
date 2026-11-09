// Pure Tetris rules: no DOM, no canvas, no timers. Tetris.tsx owns the
// animation frame and input; tetrisCanvas.ts owns drawing. Keeping the rules
// here is what makes them testable (tests/tetris.test.ts).
//
// Follows the Tetris Guideline where it matters to play: SRS rotation with
// wall kicks, a 7-bag randomiser, hold, ghost piece, 0.5s lock delay with a
// 15-move reset cap, T-spin detection, back-to-back, combos, perfect clears,
// and the guideline gravity curve.
//
// Coordinates are y-down (row 0 is the top). The board has HIDDEN_ROWS above
// the 20 visible rows so pieces can spawn and rotate above the stack; only
// the visible rows are drawn.

export const COLS = 10;
export const VISIBLE_ROWS = 20;
export const HIDDEN_ROWS = 2;
export const TOTAL_ROWS = VISIBLE_ROWS + HIDDEN_ROWS;
export const NEXT_COUNT = 3;

export const LOCK_DELAY_MS = 500;
export const MAX_LOCK_RESETS = 15;
export const DAS_MS = 170;
export const ARR_MS = 50;
export const SOFT_DROP_MS = 35;
/** Levels past this keep the level-20 speed, which is already 1 row a frame. */
export const MAX_GRAVITY_LEVEL = 20;

export const PIECES = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'] as const;
export type PieceType = (typeof PIECES)[number];
/** 0 = empty, 1..7 = the PIECES index + 1 (used for colour). */
export type Cell = number;
export type Matrix = Cell[][];
export type Rotation = 0 | 1 | 2 | 3;

const CELL: Record<PieceType, Cell> = { I: 1, J: 2, L: 3, O: 4, S: 5, T: 6, Z: 7 };

// SRS spawn orientations, in their full bounding boxes. The box matters: SRS
// rotates about the box centre, so trimming the empty rows (as a 1×4 I or a
// 2×3 T) moves the pivot and breaks every kick.
const SHAPES: Record<PieceType, string[]> = {
  I: ['....', '####', '....', '....'],
  J: ['#..', '###', '...'],
  L: ['..#', '###', '...'],
  O: ['##', '##'],
  S: ['.##', '##.', '...'],
  T: ['.#.', '###', '...'],
  Z: ['##.', '.##', '...'],
};

export function shapeOf(type: PieceType): Matrix {
  return SHAPES[type].map(row => [...row].map(ch => (ch === '#' ? CELL[type] : 0)));
}

/** Rotate a square matrix a quarter turn: 1 = clockwise, -1 = anticlockwise. */
export function rotateMatrix(mat: Matrix, dir: 1 | -1): Matrix {
  const n = mat.length;
  return Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) => (dir === 1 ? mat[n - 1 - c][r] : mat[c][n - 1 - r])),
  );
}

// The SRS kick tables exactly as the Guideline publishes them, in y-UP
// coordinates (positive y = up). kickOffsets() flips y for this y-down board;
// the old engine used these numbers unflipped, which kicked pieces the wrong
// way vertically and made T-spin setups impossible.
type Kick = readonly [number, number];
const JLSTZ_KICKS: Record<string, readonly Kick[]> = {
  '0>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '1>0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '1>2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '2>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '2>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '3>2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '3>0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '0>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};
const I_KICKS: Record<string, readonly Kick[]> = {
  '0>1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '1>0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '1>2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  '2>1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '2>3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '3>2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '3>0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '0>3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};

/** Kick tests for a rotation, converted to this board's y-down coordinates. */
export function kickOffsets(type: PieceType, from: Rotation, to: Rotation): Kick[] {
  if (type === 'O') return [[0, 0]];
  const table = type === 'I' ? I_KICKS : JLSTZ_KICKS;
  return table[`${from}>${to}`].map(([x, y]) => [x, -y] as const);
}

/** Guideline gravity: milliseconds per row at a given level (1-based). */
export function gravityMs(level: number): number {
  const l = Math.min(Math.max(level, 1), MAX_GRAVITY_LEVEL) - 1;
  return Math.pow(0.8 - l * 0.007, l) * 1000;
}

export type ClearKind = 'none' | 'single' | 'double' | 'triple' | 'tetris';
export type TSpin = 'none' | 'mini' | 'full';

export interface ClearResult {
  /** Increments on every lock, so the UI can tell two identical clears apart. */
  id: number;
  lines: number;
  tSpin: TSpin;
  backToBack: boolean;
  combo: number;
  perfectClear: boolean;
  points: number;
}

const LINE_KINDS: ClearKind[] = ['none', 'single', 'double', 'triple', 'tetris'];
const BASE_POINTS: Record<TSpin, number[]> = {
  none: [0, 100, 300, 500, 800],
  mini: [100, 200, 400, 400, 400],
  full: [400, 800, 1200, 1600, 1600],
};
const PERFECT_CLEAR_POINTS = [0, 800, 1200, 1800, 2000];
const B2B_PERFECT_TETRIS_POINTS = 3200;

/** Guideline scoring for one lock, before the level multiplier. */
export function scoreClear(lines: number, tSpin: TSpin, backToBack: boolean, combo: number, perfectClear: boolean, level: number): number {
  let points = BASE_POINTS[tSpin][lines];
  if (backToBack) points = Math.floor(points * 1.5);
  if (perfectClear) {
    points += lines === 4 && backToBack ? B2B_PERFECT_TETRIS_POINTS : PERFECT_CLEAR_POINTS[lines];
  }
  if (combo > 0) points += 50 * combo;
  return points * level;
}

/** A clear that keeps (or starts) a back-to-back chain. */
export function isDifficult(lines: number, tSpin: TSpin): boolean {
  return lines === 4 || (lines > 0 && tSpin !== 'none');
}

/** A short label for the clear, e.g. "T-Spin Double", or '' for nothing. */
export function describeClear(clear: ClearResult): string {
  const parts: string[] = [];
  if (clear.backToBack) parts.push('Back-to-Back');
  if (clear.tSpin !== 'none') parts.push(clear.tSpin === 'mini' ? 'T-Spin Mini' : 'T-Spin');
  if (clear.lines > 0) {
    const kind = LINE_KINDS[clear.lines];
    parts.push(kind[0].toUpperCase() + kind.slice(1));
  }
  const label = parts.join(' ');
  const extras = [label];
  if (clear.combo > 0) extras.push(`${clear.combo} Combo`);
  if (clear.perfectClear) extras.push('Perfect Clear!');
  return extras.filter(Boolean).join(' · ');
}

export interface ActivePiece {
  type: PieceType;
  matrix: Matrix;
  x: number;
  y: number;
  rot: Rotation;
}

export type GameStatus = 'ready' | 'playing' | 'paused' | 'over';

export interface TetrisOptions {
  /** Defaults to Math.random. Tests inject a seeded one. */
  random?: () => number;
  startLevel?: number;
}

export function emptyBoard(): Matrix {
  return Array.from({ length: TOTAL_ROWS }, () => Array<Cell>(COLS).fill(0));
}

export class TetrisEngine {
  board: Matrix = emptyBoard();
  piece: ActivePiece | null = null;
  queue: PieceType[] = [];
  hold: PieceType | null = null;
  holdUsed = false;
  status: GameStatus = 'ready';

  score = 0;
  lines = 0;
  level = 1;
  combo = -1;
  backToBack = false;
  lastClear: ClearResult | null = null;

  private random: () => number;
  private startLevel: number;
  private bag: PieceType[] = [];
  private lockCount = 0;

  // Timers (ms)
  private gravityTimer = 0;
  private lockTimer = 0;
  private lockResets = 0;
  private lowestY = 0;

  // Held inputs
  private horiz: -1 | 0 | 1 = 0;
  private dasTimer = 0;
  private arrTimer = 0;
  private softDropping = false;

  // T-spin bookkeeping: was the last successful action a rotation, and which
  // kick test placed it (the 5th test promotes a mini to a full T-spin).
  private lastActionRotate = false;
  private lastKickIndex = 0;

  constructor(options: TetrisOptions = {}) {
    this.random = options.random ?? Math.random;
    this.startLevel = Math.max(1, Math.floor(options.startLevel ?? 1));
    this.level = this.startLevel;
  }

  /** Clear everything and begin a new game. */
  start(): void {
    this.board = emptyBoard();
    this.bag = [];
    this.queue = [];
    this.hold = null;
    this.holdUsed = false;
    this.score = 0;
    this.lines = 0;
    this.level = this.startLevel;
    this.combo = -1;
    this.backToBack = false;
    this.lastClear = null;
    this.lockCount = 0;
    this.releaseInputs();
    this.fillQueue();
    this.status = 'playing';
    this.spawn(this.takeNext());
  }

  pause(): void {
    if (this.status === 'playing') {
      this.status = 'paused';
      this.releaseInputs();
    }
  }

  resume(): void {
    if (this.status === 'paused') this.status = 'playing';
  }

  togglePause(): void {
    if (this.status === 'playing') this.pause();
    else this.resume();
  }

  get playing(): boolean {
    return this.status === 'playing';
  }

  // ---- Randomiser -------------------------------------------------------

  private refillBag(): void {
    const bag = [...PIECES];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    this.bag.push(...bag);
  }

  private fillQueue(): void {
    while (this.queue.length < NEXT_COUNT) {
      if (!this.bag.length) this.refillBag();
      this.queue.push(this.bag.shift()!);
    }
  }

  private takeNext(): PieceType {
    const next = this.queue.shift()!;
    this.fillQueue();
    return next;
  }

  // ---- Placement --------------------------------------------------------

  /** True if `mat` fits at (x, y): inside the walls and floor, on empty cells. */
  fits(mat: Matrix, x: number, y: number): boolean {
    for (let r = 0; r < mat.length; r++) {
      for (let c = 0; c < mat[r].length; c++) {
        if (!mat[r][c]) continue;
        const bx = x + c;
        const by = y + r;
        if (bx < 0 || bx >= COLS || by < 0 || by >= TOTAL_ROWS) return false;
        if (this.board[by][bx]) return false;
      }
    }
    return true;
  }

  private spawn(type: PieceType): void {
    const matrix = shapeOf(type);
    const topRow = matrix.findIndex(row => row.some(Boolean));
    // The piece's top filled row starts on the second hidden row; it then
    // drops one row straight away (Guideline), so it appears at the very top
    // of the visible field.
    const piece: ActivePiece = {
      type,
      matrix,
      x: Math.floor((COLS - matrix[0].length) / 2),
      y: HIDDEN_ROWS - 1 - topRow,
      rot: 0,
    };

    // Block out: the spawn position is already occupied.
    if (!this.fits(piece.matrix, piece.x, piece.y)) {
      this.piece = piece;
      this.gameOver();
      return;
    }
    this.piece = piece;
    if (this.fits(piece.matrix, piece.x, piece.y + 1)) piece.y += 1;

    this.gravityTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lowestY = piece.y;
    this.lastActionRotate = false;
    this.lastKickIndex = 0;
  }

  private gameOver(): void {
    this.status = 'over';
    this.releaseInputs();
  }

  private grounded(): boolean {
    const p = this.piece;
    return !!p && !this.fits(p.matrix, p.x, p.y + 1);
  }

  /** Called after any successful move or rotation: the Guideline's move reset. */
  private afterManipulation(): void {
    const p = this.piece!;
    if (p.y > this.lowestY) {
      // Reaching a new lowest row refreshes the whole allowance.
      this.lowestY = p.y;
      this.lockResets = 0;
      this.lockTimer = 0;
    } else if (this.lockResets < MAX_LOCK_RESETS) {
      this.lockResets++;
      this.lockTimer = 0;
    }
    // With the allowance spent the timer keeps running, so endless spinning
    // on the floor still locks.
  }

  ghostY(): number {
    const p = this.piece;
    if (!p) return 0;
    let y = p.y;
    while (this.fits(p.matrix, p.x, y + 1)) y++;
    return y;
  }

  // ---- Player actions ---------------------------------------------------

  move(dx: -1 | 1): boolean {
    const p = this.piece;
    if (!this.playing || !p || !this.fits(p.matrix, p.x + dx, p.y)) return false;
    p.x += dx;
    this.lastActionRotate = false;
    this.afterManipulation();
    return true;
  }

  rotate(dir: 1 | -1): boolean {
    const p = this.piece;
    if (!this.playing || !p) return false;
    if (p.type === 'O') return false;
    const to = ((p.rot + (dir === 1 ? 1 : 3)) % 4) as Rotation;
    const rotated = rotateMatrix(p.matrix, dir);
    const kicks = kickOffsets(p.type, p.rot, to);
    for (let i = 0; i < kicks.length; i++) {
      const [kx, ky] = kicks[i];
      if (this.fits(rotated, p.x + kx, p.y + ky)) {
        p.matrix = rotated;
        p.x += kx;
        p.y += ky;
        p.rot = to;
        this.lastActionRotate = true;
        this.lastKickIndex = i;
        this.afterManipulation();
        return true;
      }
    }
    return false;
  }

  /** One row of soft drop. Scores 1 point per row, like the Guideline. */
  softDrop(): boolean {
    const p = this.piece;
    if (!this.playing || !p || !this.fits(p.matrix, p.x, p.y + 1)) return false;
    p.y += 1;
    this.score += 1;
    this.lastActionRotate = false;
    this.afterManipulation();
    return true;
  }

  hardDrop(): void {
    const p = this.piece;
    if (!this.playing || !p) return;
    const target = this.ghostY();
    const distance = target - p.y;
    if (distance > 0) {
      p.y = target;
      this.score += distance * 2;
      this.lastActionRotate = false;
    }
    this.lock();
  }

  holdPiece(): boolean {
    const p = this.piece;
    if (!this.playing || !p || this.holdUsed) return false;
    const swapIn = this.hold;
    this.hold = p.type;
    // The held piece comes back in spawn orientation; the old engine kept the
    // rotated matrix but reset nothing, so its kicks ran from the wrong state.
    this.spawn(swapIn ?? this.takeNext());
    this.holdUsed = true;
    return true;
  }

  // Held inputs, for DAS/ARR and continuous soft drop.
  setHoriz(dir: -1 | 0 | 1): void {
    if (this.horiz === dir) return;
    this.horiz = dir;
    this.dasTimer = 0;
    this.arrTimer = 0;
    if (dir !== 0) this.move(dir);
  }

  /** Release a direction only if it is still the one held (left/right overlap). */
  releaseHoriz(dir: -1 | 1): void {
    if (this.horiz === dir) this.setHoriz(0);
  }

  setSoftDrop(on: boolean): void {
    if (this.softDropping === on) return;
    this.softDropping = on;
    this.gravityTimer = 0;
    if (on) this.softDrop();
  }

  releaseInputs(): void {
    this.horiz = 0;
    this.dasTimer = 0;
    this.arrTimer = 0;
    this.softDropping = false;
  }

  // ---- Locking & clearing ------------------------------------------------

  private detectTSpin(): TSpin {
    const p = this.piece!;
    if (p.type !== 'T' || !this.lastActionRotate) return 'none';
    const occupied = (cx: number, cy: number) =>
      cx < 0 || cx >= COLS || cy < 0 || cy >= TOTAL_ROWS || this.board[cy][cx] !== 0;
    // Corners of the 3×3 box, clockwise from top-left.
    const corners = [
      occupied(p.x, p.y),
      occupied(p.x + 2, p.y),
      occupied(p.x + 2, p.y + 2),
      occupied(p.x, p.y + 2),
    ];
    if (corners.filter(Boolean).length < 3) return 'none';
    // The two corners either side of the T's point, per orientation.
    const front: Record<Rotation, [number, number]> = { 0: [0, 1], 1: [1, 2], 2: [2, 3], 3: [3, 0] };
    const [a, b] = front[p.rot];
    if ((corners[a] && corners[b]) || this.lastKickIndex === 4) return 'full';
    return 'mini';
  }

  private lock(): void {
    const p = this.piece;
    if (!p) return;
    const tSpin = this.detectTSpin();

    let anyVisible = false;
    for (let r = 0; r < p.matrix.length; r++) {
      for (let c = 0; c < p.matrix[r].length; c++) {
        if (!p.matrix[r][c]) continue;
        this.board[p.y + r][p.x + c] = p.matrix[r][c];
        if (p.y + r >= HIDDEN_ROWS) anyVisible = true;
      }
    }

    const lines = this.clearLines();
    const perfectClear = lines > 0 && this.board.every(row => row.every(cell => cell === 0));
    const difficult = isDifficult(lines, tSpin);
    const backToBack = difficult && this.backToBack;

    if (lines > 0) {
      this.combo++;
      // Only line clears touch the chain: a difficult clear keeps or starts it,
      // an ordinary one breaks it, and a zero-line T-spin leaves it alone.
      this.backToBack = difficult;
    } else {
      this.combo = -1;
    }

    const combo = Math.max(this.combo, 0);
    const points = scoreClear(lines, tSpin, backToBack, combo, perfectClear, this.level);
    this.score += points;
    this.lastClear = { id: ++this.lockCount, lines, tSpin, backToBack, combo, perfectClear, points };

    this.lines += lines;
    // Fixed goal: one level per 10 lines cleared.
    this.level = Math.max(this.level, this.startLevel + Math.floor(this.lines / 10));

    this.holdUsed = false;
    this.piece = null;

    // Lock out: the whole piece settled above the visible field.
    if (!anyVisible) {
      this.gameOver();
      return;
    }
    this.spawn(this.takeNext());
  }

  private clearLines(): number {
    const kept = this.board.filter(row => row.some(cell => cell === 0));
    const cleared = TOTAL_ROWS - kept.length;
    if (cleared) {
      this.board = [...Array.from({ length: cleared }, () => Array<Cell>(COLS).fill(0)), ...kept];
    }
    return cleared;
  }

  // ---- Time ---------------------------------------------------------------

  /**
   * Advance the game by `dt` milliseconds. The caller clamps `dt` (a tab
   * that was in the background must not dump seconds of gravity at once).
   */
  step(dt: number): void {
    if (!this.playing || !this.piece) return;

    // Auto-shift: after DAS, repeat every ARR. Loops so a long frame still
    // moves the right distance.
    if (this.horiz !== 0) {
      const charged = this.dasTimer >= DAS_MS;
      this.dasTimer += dt;
      if (!charged && this.dasTimer >= DAS_MS) {
        // DAS just charged: shift once now, and carry only the overshoot
        // into the repeat timer (not the whole charge time).
        this.move(this.horiz);
        this.arrTimer = this.dasTimer - DAS_MS;
      } else if (charged) {
        this.arrTimer += dt;
      }
      if (this.dasTimer >= DAS_MS) {
        while (this.arrTimer >= ARR_MS && this.playing) {
          this.arrTimer -= ARR_MS;
          if (!this.move(this.horiz)) {
            this.arrTimer = 0;
            break;
          }
        }
      }
    }

    // Gravity, or soft drop in its place. Soft drop is never slower than
    // gravity, so at high levels holding down cannot slow a piece.
    const gravity = gravityMs(this.level);
    const interval = this.softDropping ? Math.min(SOFT_DROP_MS, gravity) : gravity;
    this.gravityTimer += dt;
    while (this.gravityTimer >= interval && this.piece && this.playing) {
      this.gravityTimer -= interval;
      const p = this.piece;
      if (!this.fits(p.matrix, p.x, p.y + 1)) {
        this.gravityTimer = 0;
        break;
      }
      if (this.softDropping) {
        this.softDrop();
      } else {
        p.y += 1;
        this.lastActionRotate = false;
        if (p.y > this.lowestY) {
          this.lowestY = p.y;
          this.lockResets = 0;
          this.lockTimer = 0;
        }
      }
    }

    if (!this.piece || !this.playing) return;
    if (this.grounded()) {
      this.lockTimer += dt;
      if (this.lockTimer >= LOCK_DELAY_MS) this.lock();
    } else {
      this.lockTimer = 0;
    }
  }
}
