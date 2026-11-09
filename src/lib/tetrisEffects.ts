// Canvas effects for the Tetris island: hard-drop trails, lock flashes,
// line-clear bursts, the big-moment flashes (Tetris, T-spin, perfect clear,
// level up), screen shake, and the game-over grey-out.
//
// Purely cosmetic and driven by TetrisEngine events: the engine never waits
// for an effect, so the game plays identically with them off. Under
// prefers-reduced-motion the moving parts (particles, trails, shake) are
// skipped and only short, still fades remain.
import { COLS, HIDDEN_ROWS, VISIBLE_ROWS, type Cell, type CellPos, type GameEvent } from './tetris';
import { BOARD_H, BOARD_W, CELL_PX, PIECE_COLORS } from './tetrisCanvas';

interface Particle { x: number; y: number; vx: number; vy: number; size: number; color: string; born: number; life: number }
interface Trail { cols: { x: number; top: number; bottom: number }[]; color: string; born: number }
interface CellFlash { cells: CellPos[]; born: number }
interface RowFlash { rows: number[]; born: number; duration: number; color: string }
interface BoardFlash { born: number; duration: number; kind: 'tetris' | 'tspin' | 'perfect' | 'level' }

const TRAIL_MS = 220;
const LOCK_FLASH_MS = 140;
const ROW_FLASH_MS = 320;
const PARTICLE_LIFE_MS = 900;
const MAX_PARTICLES = 500;
const GRAVITY = 0.0016; // px per ms²
export const TOP_OUT_MS = 900;

export class TetrisEffects {
  reducedMotion = false;
  private particles: Particle[] = [];
  private trails: Trail[] = [];
  private cellFlashes: CellFlash[] = [];
  private rowFlashes: RowFlash[] = [];
  private boardFlashes: BoardFlash[] = [];
  private shake = { born: 0, duration: 0, magnitude: 0, vertical: false };
  private topOut: number | null = null;
  private lastTime = 0;

  constructor(private random: () => number = Math.random) {}

  reset(): void {
    this.particles = [];
    this.trails = [];
    this.cellFlashes = [];
    this.rowFlashes = [];
    this.boardFlashes = [];
    this.shake = { born: 0, duration: 0, magnitude: 0, vertical: false };
    this.topOut = null;
  }

  /** True while the game-over grey-out is still sweeping up the board. */
  toppingOut(now: number): boolean {
    return this.topOut !== null && now - this.topOut < TOP_OUT_MS;
  }

  push(event: GameEvent, now: number): void {
    switch (event.type) {
      case 'hardDrop': {
        if (this.reducedMotion || event.distance < 1) break;
        // One streak per column, from where the piece started to the top of
        // its landed cells in that column.
        const byCol = new Map<number, number>();
        for (const [x, y] of event.cells) byCol.set(x, Math.min(byCol.get(x) ?? Infinity, y));
        const cols = [...byCol].map(([x, landedTop]) => ({
          x,
          top: (landedTop - event.distance - HIDDEN_ROWS) * CELL_PX,
          bottom: (landedTop - HIDDEN_ROWS) * CELL_PX,
        }));
        this.trails.push({ cols, color: PIECE_COLORS[event.color], born: now });
        this.startShake(now, Math.min(2 + event.distance / 6, 5), 130, true);
        break;
      }
      case 'lock':
        this.cellFlashes.push({ cells: event.cells, born: now });
        break;
      case 'clear': {
        const { result, rows, colors } = event;
        if (result.lines === 0) {
          // A T-spin with no lines still deserves a flicker.
          this.boardFlashes.push({ born: now, duration: 260, kind: 'tspin' });
          break;
        }
        const big = result.lines === 4;
        const tspin = result.tSpin !== 'none';
        this.rowFlashes.push({
          rows, born: now, duration: big ? ROW_FLASH_MS + 120 : ROW_FLASH_MS,
          color: big ? '#fff3b0' : tspin ? '#e6b8ff' : '#ffffff',
        });
        if (!this.reducedMotion) {
          // Particles: more for bigger clears and longer combos.
          const perCell = (big ? 3 : tspin ? 2 : 1) + Math.min(result.combo, 4) * 0.5;
          rows.forEach((row, i) => colors[i].forEach((cell, x) => this.burst(x, row, cell, perCell, now, big)));
        }
        if (big) {
          this.boardFlashes.push({ born: now, duration: 450, kind: 'tetris' });
          this.startShake(now, 7, 360, false);
        } else if (tspin) {
          this.boardFlashes.push({ born: now, duration: 360, kind: 'tspin' });
          this.startShake(now, 4, 220, false);
        } else if (result.lines >= 2 || result.combo >= 2) {
          this.startShake(now, 1.5 + result.lines + Math.min(result.combo, 5) * 0.5, 180, false);
        }
        if (result.perfectClear) this.boardFlashes.push({ born: now, duration: 1200, kind: 'perfect' });
        break;
      }
      case 'levelUp':
        this.boardFlashes.push({ born: now, duration: 700, kind: 'level' });
        break;
      case 'gameOver':
        this.topOut = now;
        this.startShake(now, 5, 300, false);
        break;
    }
  }

  private burst(col: number, row: number, cell: Cell, perCell: number, now: number, big: boolean) {
    const count = Math.floor(perCell) + (this.random() < perCell % 1 ? 1 : 0);
    const cx = (col + 0.5) * CELL_PX;
    const cy = (row - HIDDEN_ROWS + 0.5) * CELL_PX;
    for (let i = 0; i < count && this.particles.length < MAX_PARTICLES; i++) {
      const angle = -Math.PI / 2 + (this.random() - 0.5) * Math.PI * 1.4;
      const speed = (big ? 0.25 : 0.15) + this.random() * (big ? 0.35 : 0.22);
      this.particles.push({
        x: cx + (this.random() - 0.5) * CELL_PX * 0.6,
        y: cy + (this.random() - 0.5) * CELL_PX * 0.6,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + this.random() * (big ? 6 : 4),
        color: PIECE_COLORS[cell] || '#ffffff',
        born: now,
        life: PARTICLE_LIFE_MS * (0.6 + this.random() * 0.6),
      });
    }
  }

  private startShake(now: number, magnitude: number, duration: number, vertical: boolean) {
    if (this.reducedMotion) return;
    // A weaker shake never cuts a stronger one short.
    const remaining = this.shake.magnitude * Math.max(0, 1 - (now - this.shake.born) / (this.shake.duration || 1));
    if (magnitude < remaining) return;
    this.shake = { born: now, duration, magnitude, vertical };
  }

  /** Pixel offset to apply to the board element this frame. */
  shakeOffset(now: number): [number, number] {
    const { born, duration, magnitude, vertical } = this.shake;
    const t = now - born;
    if (!duration || t >= duration) return [0, 0];
    const amp = magnitude * (1 - t / duration);
    if (vertical) return [0, amp * Math.max(0, Math.cos(t / 25))];
    return [amp * Math.sin(t / 17), amp * Math.cos(t / 23)];
  }

  /** Draw every live effect over an already-drawn board, and drop dead ones. */
  draw(ctx: CanvasRenderingContext2D, now: number): void {
    const dt = this.lastTime ? Math.min(now - this.lastTime, 50) : 16;
    this.lastTime = now;

    // Hard-drop trails: a fading streak above each landed column.
    this.trails = this.trails.filter(trail => {
      const t = (now - trail.born) / TRAIL_MS;
      if (t >= 1) return false;
      for (const col of trail.cols) {
        const top = Math.max(col.top, 0);
        if (col.bottom <= top) continue;
        const grad = ctx.createLinearGradient(0, top, 0, col.bottom);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(1, trail.color);
        ctx.globalAlpha = 0.55 * (1 - t);
        ctx.fillStyle = grad;
        const inset = CELL_PX * (0.15 + 0.2 * t);
        ctx.fillRect(col.x * CELL_PX + inset, top, CELL_PX - inset * 2, col.bottom - top);
      }
      ctx.globalAlpha = 1;
      return true;
    });

    // Lock flash: the cells that just locked glow white for a moment.
    this.cellFlashes = this.cellFlashes.filter(flash => {
      const t = (now - flash.born) / LOCK_FLASH_MS;
      if (t >= 1) return false;
      ctx.fillStyle = `rgba(255,255,255,${0.45 * (1 - t)})`;
      for (const [x, y] of flash.cells) {
        const vy = y - HIDDEN_ROWS;
        if (vy >= 0) ctx.fillRect(x * CELL_PX, vy * CELL_PX, CELL_PX, CELL_PX);
      }
      return true;
    });

    // Cleared rows: a bright bar that pinches shut towards the centre.
    this.rowFlashes = this.rowFlashes.filter(flash => {
      const t = (now - flash.born) / flash.duration;
      if (t >= 1) return false;
      const width = BOARD_W * (this.reducedMotion ? 1 : 1 - t * t);
      ctx.globalAlpha = 0.9 * (1 - t);
      ctx.fillStyle = flash.color;
      for (const row of flash.rows) {
        const vy = row - HIDDEN_ROWS;
        if (vy >= 0) ctx.fillRect((BOARD_W - width) / 2, vy * CELL_PX, width, CELL_PX);
      }
      ctx.globalAlpha = 1;
      return true;
    });

    // Particles: shards of the cleared cells, thrown up and falling back.
    this.particles = this.particles.filter(p => {
      const age = now - p.born;
      if (age >= p.life || p.y > BOARD_H + 20) return false;
      p.vy += GRAVITY * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      ctx.globalAlpha = 1 - age / p.life;
      ctx.fillStyle = p.color;
      const s = p.size * (1 - 0.4 * (age / p.life));
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
      return true;
    });
    ctx.globalAlpha = 1;

    // Whole-board flashes for the big moments.
    this.boardFlashes = this.boardFlashes.filter(flash => {
      const t = (now - flash.born) / flash.duration;
      if (t >= 1) return false;
      const fade = 1 - t;
      if (flash.kind === 'perfect') {
        // A rainbow sweep that climbs the board.
        const band = BOARD_H * (1 - t);
        const grad = ctx.createLinearGradient(0, band - 120, 0, band + 120);
        ['#ff3b3b', '#ffb03b', '#f5ff3b', '#3bff6b', '#3bd5ff', '#8a3bff'].forEach((c, i, all) => grad.addColorStop(i / (all.length - 1), c));
        ctx.globalAlpha = 0.45 * fade;
        ctx.fillStyle = grad;
        ctx.fillRect(0, band - 120, BOARD_W, 240);
      } else {
        const color = flash.kind === 'tetris' ? '255,214,64' : flash.kind === 'tspin' ? '176,90,255' : '90,200,255';
        // Edge glow: brighter at the walls than the middle, so the stack stays readable.
        const grad = ctx.createLinearGradient(0, 0, BOARD_W, 0);
        const edge = 0.4 * fade * fade;
        grad.addColorStop(0, `rgba(${color},${edge})`);
        grad.addColorStop(0.2, `rgba(${color},0)`);
        grad.addColorStop(0.8, `rgba(${color},0)`);
        grad.addColorStop(1, `rgba(${color},${edge})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, BOARD_W, BOARD_H);
      }
      ctx.globalAlpha = 1;
      return true;
    });

    // Game over: grey the stack out row by row, bottom to top.
    if (this.topOut !== null) {
      const progress = Math.min(1, (now - this.topOut) / (this.reducedMotion ? 1 : TOP_OUT_MS));
      const rows = Math.ceil(progress * VISIBLE_ROWS);
      ctx.fillStyle = 'rgba(40, 42, 54, 0.78)';
      ctx.fillRect(0, (VISIBLE_ROWS - rows) * CELL_PX, BOARD_W, rows * CELL_PX);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      for (let r = VISIBLE_ROWS - rows; r < VISIBLE_ROWS; r++) {
        for (let c = 0; c < COLS; c++) ctx.rect(c * CELL_PX + 0.5, r * CELL_PX + 0.5, CELL_PX - 1, CELL_PX - 1);
      }
      ctx.stroke();
    }
  }
}
