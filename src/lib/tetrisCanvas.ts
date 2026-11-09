// Canvas drawing for the Tetris island. Reads a TetrisEngine; never mutates it.
import { COLS, HIDDEN_ROWS, VISIBLE_ROWS, shapeOf, type Matrix, type PieceType, type TetrisEngine } from './tetris';

export const CELL_PX = 30;
export const BOARD_W = COLS * CELL_PX;
export const BOARD_H = VISIBLE_ROWS * CELL_PX;
export const PREVIEW_CELL_PX = 24;
export const PREVIEW_W = 4 * PREVIEW_CELL_PX;
/** Height of one queue/hold slot: 3 cells, enough for any piece plus a gap. */
export const PREVIEW_SLOT_H = 3 * PREVIEW_CELL_PX;

// Guideline colours, indexed by cell value (1..7 = I J L O S T Z).
export const PIECE_COLORS = ['', '#00d8e8', '#2f5bea', '#f39c12', '#f1d500', '#2ecc40', '#a040e8', '#e8322e'];
const BACKGROUND = '#0b0d14';
const GRID = 'rgba(255, 255, 255, 0.06)';

/**
 * Size a canvas's backing store for the device pixel ratio and return a
 * context that draws in logical (CSS) pixels. Display size comes from CSS, so
 * the canvas can shrink to fit a phone without the drawing code knowing.
 */
export function setupCanvas(canvas: HTMLCanvasElement, width: number, height: number): CanvasRenderingContext2D | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const dpr = Math.max(1, Math.min(3, globalThis.devicePixelRatio || 1));
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

function drawBlock(ctx: CanvasRenderingContext2D, px: number, py: number, size: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(px, py, size, size);
  // A light top-left and dark bottom-right edge, so adjacent blocks of the
  // same colour still read as separate cells.
  const edge = Math.max(2, Math.round(size / 10));
  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.fillRect(px, py, size, edge);
  ctx.fillRect(px, py, edge, size);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(px, py + size - edge, size, edge);
  ctx.fillRect(px + size - edge, py, edge, size);
}

function drawGhostBlock(ctx: CanvasRenderingContext2D, px: number, py: number, size: number, color: string) {
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.18;
  ctx.fillRect(px, py, size, size);
  ctx.globalAlpha = 0.75;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(px + 1, py + 1, size - 2, size - 2);
  ctx.globalAlpha = 1;
}

export function drawBoard(ctx: CanvasRenderingContext2D, game: TetrisEngine): void {
  ctx.fillStyle = BACKGROUND;
  ctx.fillRect(0, 0, BOARD_W, BOARD_H);

  ctx.strokeStyle = GRID;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 1; x < COLS; x++) {
    ctx.moveTo(x * CELL_PX + 0.5, 0);
    ctx.lineTo(x * CELL_PX + 0.5, BOARD_H);
  }
  for (let y = 1; y < VISIBLE_ROWS; y++) {
    ctx.moveTo(0, y * CELL_PX + 0.5);
    ctx.lineTo(BOARD_W, y * CELL_PX + 0.5);
  }
  ctx.stroke();

  for (let r = HIDDEN_ROWS; r < game.board.length; r++) {
    for (let c = 0; c < COLS; c++) {
      const v = game.board[r][c];
      if (v) drawBlock(ctx, c * CELL_PX, (r - HIDDEN_ROWS) * CELL_PX, CELL_PX, PIECE_COLORS[v]);
    }
  }

  const p = game.piece;
  if (!p || game.status === 'ready') return;
  const ghost = game.ghostY();
  const each = (y: number, draw: (px: number, py: number, color: string) => void) => {
    p.matrix.forEach((row, r) => row.forEach((v, c) => {
      const by = y + r - HIDDEN_ROWS;
      if (v && by >= 0) draw((p.x + c) * CELL_PX, by * CELL_PX, PIECE_COLORS[v]);
    }));
  };
  if (ghost !== p.y && game.status === 'playing') {
    each(ghost, (px, py, color) => drawGhostBlock(ctx, px, py, CELL_PX, color));
  }
  each(p.y, (px, py, color) => drawBlock(ctx, px, py, CELL_PX, color));
}

/** The filled bounding box of a matrix, so previews centre the piece itself. */
function bounds(mat: Matrix) {
  let top = Infinity, bottom = -1, left = Infinity, right = -1;
  mat.forEach((row, r) => row.forEach((v, c) => {
    if (!v) return;
    top = Math.min(top, r); bottom = Math.max(bottom, r);
    left = Math.min(left, c); right = Math.max(right, c);
  }));
  return { top, left, w: right - left + 1, h: bottom - top + 1 };
}

/** Draw pieces stacked in slots (the next queue, or the single hold slot). */
export function drawPreview(ctx: CanvasRenderingContext2D, types: (PieceType | null)[], dimmed = false): void {
  const height = types.length * PREVIEW_SLOT_H;
  ctx.fillStyle = BACKGROUND;
  ctx.fillRect(0, 0, PREVIEW_W, height);
  const size = PREVIEW_CELL_PX;
  types.forEach((type, slot) => {
    if (!type) return;
    const mat = shapeOf(type);
    const b = bounds(mat);
    const ox = (PREVIEW_W - b.w * size) / 2;
    const oy = slot * PREVIEW_SLOT_H + (PREVIEW_SLOT_H - b.h * size) / 2;
    if (dimmed) ctx.globalAlpha = 0.35;
    mat.forEach((row, r) => row.forEach((v, c) => {
      if (v) drawBlock(ctx, ox + (c - b.left) * size, oy + (r - b.top) * size, size, PIECE_COLORS[v]);
    }));
    ctx.globalAlpha = 1;
  });
}
