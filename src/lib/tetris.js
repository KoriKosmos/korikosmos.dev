export const COLS = 10;
export const ROWS = 20;
export const SIZE = 30;

const COLORS = [
  null,
  '#00f0f0', // 1 cyan
  '#0000f0', // 2 blue
  '#f0a000', // 3 orange
  '#f0f000', // 4 yellow
  '#00f000', // 5 green
  '#a000f0', // 6 purple
  '#f00000', // 7 red,
];

const SHAPES = {
  I: [[1, 1, 1, 1]],
  J: [[2, 0, 0], [2, 2, 2]],
  L: [[0, 0, 3], [3, 3, 3]],
  O: [[4, 4], [4, 4]],
  S: [[0, 5, 5], [5, 5, 0]],
  T: [[0, 6, 0], [6, 6, 6]],
  Z: [[7, 7, 0], [0, 7, 7]],
};

const JLSTZ_KICKS = {
  0: {
    1: [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    "-1": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  },
  1: {
    1: [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
    "-1": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  },
  2: {
    1: [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
    "-1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  },
  3: {
    1: [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    "-1": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  },
};

const I_KICKS = {
  0: {
    1: [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
    "-1": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  },
  1: {
    1: [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
    "-1": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  },
  2: {
    1: [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
    "-1": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  },
  3: {
    1: [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
    "-1": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  },
};

export class TetrisGame {
  constructor(canvas, nextCanvas, holdCanvas, callbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.nextCanvas = nextCanvas;
    this.nextCtx = nextCanvas.getContext('2d');
    this.holdCanvas = holdCanvas;
    this.holdCtx = holdCanvas.getContext('2d');
    
    this.callbacks = callbacks || {}; // { onScore, onGameOver }

    this.scaleForHiDPI(this.canvas, this.ctx);
    this.scaleForHiDPI(this.nextCanvas, this.nextCtx);
    this.scaleForHiDPI(this.holdCanvas, this.holdCtx);

    this.reset();
  }

  scaleForHiDPI(c, context) {
    const dpr = window.devicePixelRatio || 1;
    if (dpr !== 1) {
      c.style.width = c.width + 'px';
      c.style.height = c.height + 'px';
      c.width = Math.floor(c.width * dpr);
      c.height = Math.floor(c.height * dpr);
      context.scale(dpr, dpr);
    }
  }

  reset() {
    this.board = Array.from({length: ROWS}, () => Array(COLS).fill(0));
    this.score = 0;
    this.lines = 0;
    this.level = 0;
    this.dropInterval = 800;
    this.updateSpeed();
    
    this.bag = [];
    this.piece = null;
    this.next = this.getNextPiece();
    this.hold = null;
    this.holdUsed = false;
    
    this.lastTime = 0;
    this.dropCounter = 0;
    this.lockTimer = 0;
    
    // Input State
    this.horiz = 0;
    this.dasTimer = 0;
    this.arrTimer = 0;
    this.isDown = false;
    this.softTimer = 0;
    
    this.running = true;
    
    if (this.callbacks.onScore) this.callbacks.onScore(this.score, this.lines, this.level);
    
    this.spawn();
    this.draw();
  }
  
  start() {
    this.running = true;
    requestAnimationFrame((t) => this.update(t));
  }

  // Input Handling
  setHoriz(dir) {
    if (this.horiz !== dir) {
      this.horiz = dir;
      this.dasTimer = 0;
      this.arrTimer = 0;
      if (dir !== 0) {
        this.tryMove(dir, 0);
      }
    }
  }

  setDown(isDown) {
    this.isDown = isDown;
    if (!isDown) this.softTimer = 0;
  }

  updateSpeed() {
    this.dropInterval = Math.max(100, 800 - this.level * 80);
  }

  // Bag System
  refillBag() {
    this.bag = Object.keys(SHAPES);
    for (let i = this.bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
    }
  }

  getNextPiece() {
    if (!this.bag.length) this.refillBag();
    const t = this.bag.pop();
    return { matrix: SHAPES[t].map(row => row.slice()), type: t };
  }

  // Game Logic
  spawn() {
    const { matrix, type } = this.next;
    this.piece = {
      matrix,
      x: Math.floor((COLS - matrix[0].length) / 2),
      y: -1,
      type,
      rot: 0,
    };
    this.next = this.getNextPiece();
    this.renderPreview(this.nextCtx, this.next.matrix, this.nextCanvas);
    this.holdUsed = false;
    this.renderPreview(this.holdCtx, this.hold ? this.hold.matrix : null, this.holdCanvas);
    this.lockTimer = 0;
    this.dropCounter = 0;
    
    // Check collision immediately (game over condition)
    if (!this.isValidPosition(this.piece.matrix, this.piece.x, this.piece.y)) {
        this.running = false;
        if (this.callbacks.onGameOver) this.callbacks.onGameOver(this.score);
    }
  }

  holdPiece() {
    if (this.holdUsed || !this.running) return;
    if (this.hold) {
      const temp = { matrix: this.piece.matrix, type: this.piece.type };
      this.piece.matrix = this.hold.matrix;
      this.piece.type = this.hold.type;
      this.piece.x = Math.floor((COLS - this.piece.matrix[0].length) / 2);
      this.piece.y = -1;
      this.hold = temp;
    } else {
      this.hold = { matrix: this.piece.matrix, type: this.piece.type };
      this.spawn(); // Spawn new piece, but we need to undo the spawn's piece overwrite? No, spawn is correct behavior for empty hold
      // Wait, spawn() overwrites this.piece with this.next.
      // If hold was empty: hold takes current piece, active piece becomes next.
    }
    
    // Reset position if we swapped back a held piece
    // If we just spawned, spawn() handled it.
    // If we swapped:
    if (this.hold && this.holdUsed) { 
        // Logic in holdPiece above:
        // if hold exists: swap.
        // if hold empty: hold = current, spawn next.
    }
    
    this.holdUsed = true;
    this.lockTimer = 0;
    this.dropCounter = 0;
    this.renderPreview(this.holdCtx, this.hold.matrix, this.holdCanvas);
    this.draw();
  }

  rotate(mat, dir = 1) {
    const h = mat.length, w = mat[0].length;
    const res = Array.from({length: w}, () => Array(h).fill(0));
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (dir === 1) res[x][h - 1 - y] = mat[y][x];
        else res[w - 1 - x][y] = mat[y][x];
      }
    }
    return res;
  }

  isValidPosition(mat, offX, offY) {
    for (let y = 0; y < mat.length; y++) {
      for (let x = 0; x < mat[y].length; x++) {
        const v = mat[y][x];
        if (!v) continue;
        const gx = offX + x;
        const gy = offY + y;
        if (gx < 0 || gx >= COLS || gy >= ROWS) return false;
        if (gy < 0) continue;
        if (this.board[gy][gx]) return false;
      }
    }
    return true;
  }

  tryMove(dx, dy) {
    if (!this.running || !this.piece) return false;
    const nx = this.piece.x + dx;
    const ny = this.piece.y + dy;
    if (this.isValidPosition(this.piece.matrix, nx, ny)) {
      this.piece.x = nx;
      this.piece.y = ny;
      this.lockTimer = 0;
      return true;
    }
    return false;
  }

  tryRotate(dir = 1) {
    if (!this.running || !this.piece) return false;
    if (this.piece.type === 'O') return true;
    const rotated = this.rotate(this.piece.matrix, dir);
    const oldRot = this.piece.rot;
    const newRot = (oldRot + (dir === 1 ? 1 : 3)) % 4;
    const table = this.piece.type === 'I' ? I_KICKS : JLSTZ_KICKS;
    const kicks = table[oldRot][dir === 1 ? 1 : '-1'];
    
    for (const [kx, ky] of kicks) {
      const nx = this.piece.x + kx;
      const ny = this.piece.y + ky;
      if (this.isValidPosition(rotated, nx, ny)) {
        this.piece.matrix = rotated;
        this.piece.x = nx;
        this.piece.y = ny;
        this.piece.rot = newRot;
        this.lockTimer = 0;
        return true;
      }
    }
    return false;
  }

  drop(manual = false) {
    if (this.tryMove(0, 1) && manual) {
      this.score += 1;
      if (this.callbacks.onScore) this.callbacks.onScore(this.score, this.lines, this.level);
    }
  }

  hardDrop() {
    if (!this.running || !this.piece) return;
    let distance = 0;
    while (this.isValidPosition(this.piece.matrix, this.piece.x, this.piece.y + 1)) {
      this.piece.y++;
      distance++;
    }
    if (distance > 0) {
      this.score += distance * 2;
      if (this.callbacks.onScore) this.callbacks.onScore(this.score, this.lines, this.level);
    }
    this.lockPiece();
  }

  lockPiece() {
    const {matrix, x: offX, y: offY} = this.piece;
    for (let y = 0; y < matrix.length; y++) {
      for (let x = 0; x < matrix[y].length; x++) {
        const v = matrix[y][x];
        if (!v) continue;
        const gx = offX + x;
        const gy = offY + y;
        if (gy >= 0) this.board[gy][gx] = v;
      }
    }
    const cleared = this.clearLines();
    if (cleared) {
        const table = [0, 100, 300, 500, 800];
        this.score += table[cleared] * (this.level + 1);
        this.lines += cleared;
        const target = (this.level + 1) * 10;
        if (this.lines >= target) {
            this.level++;
            this.updateSpeed();
        }
        if (this.callbacks.onScore) this.callbacks.onScore(this.score, this.lines, this.level);
    }
    
    this.spawn();
    this.draw();
  }

  clearLines() {
    let cleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
      if (this.board[y].every(v => v !== 0)) {
        this.board.splice(y, 1);
        this.board.unshift(Array(COLS).fill(0));
        cleared++;
        y++;
      }
    }
    return cleared;
  }

  update(time = 0) {
    if (!this.running) return;
    const dt = time - this.lastTime;
    this.lastTime = time;

    this.dropCounter += dt;
    if (this.dropCounter >= this.dropInterval) {
      this.drop();
      this.dropCounter = 0;
    }

    // Input Handling (DAS/ARR)
    const DAS = 170;
    const ARR = 50;
    const SOFT = 40;

    if (this.horiz !== 0) {
        if (this.dasTimer < DAS) {
            this.dasTimer += dt;
        } else {
            this.arrTimer += dt;
            if (this.arrTimer >= ARR) {
                this.tryMove(this.horiz, 0);
                this.arrTimer = 0;
            }
        }
    }

    if (this.isDown) {
        this.softTimer += dt;
        if (this.softTimer >= SOFT) {
            this.drop(true);
            this.softTimer = 0;
        }
    } else {
        this.softTimer = 0;
    }

    // Lock delay logic - simplest form for now
    if (this.piece) {
        const grounded = !this.isValidPosition(this.piece.matrix, this.piece.x, this.piece.y + 1);
        if (grounded) {
          this.lockTimer += dt;
          if (this.lockTimer >= 500) {
            this.lockPiece();
          }
        } else {
          this.lockTimer = 0;
        }
    }

    this.draw();
    requestAnimationFrame((t) => this.update(t));
  }

  // Rendering
  drawCell(x, y, color, ctx = this.ctx, size = SIZE) {
    const px = x * size;
    const py = y * size;
    ctx.fillStyle = color;
    ctx.fillRect(px, py, size, size);
    ctx.strokeStyle = '#111';
    ctx.strokeRect(px + 0.5, py + 0.5, size - 1, size - 1);
  }

  renderPreview(ctx, mat, canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!mat) return;
    const offsetX = Math.floor((4 - mat[0].length) / 2);
    const offsetY = Math.floor((4 - mat.length) / 2);
    for (let y = 0; y < mat.length; y++) {
        for (let x = 0; x < mat[y].length; x++) {
            const v = mat[y][x];
            if (v) this.drawCell(x + offsetX, y + offsetY, COLORS[v], ctx);
        }
    }
  }

  draw() {
    // bg
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, COLS * SIZE, ROWS * SIZE);
    
    // placed
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const v = this.board[y][x];
        if (v) this.drawCell(x, y, COLORS[v]);
      }
    }
    
    // grid
    this.ctx.strokeStyle = '#222';
    this.ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) {
        this.ctx.beginPath();
        this.ctx.moveTo(x * SIZE, 0);
        this.ctx.lineTo(x * SIZE, ROWS * SIZE);
        this.ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, y * SIZE);
        this.ctx.lineTo(COLS * SIZE, y * SIZE);
        this.ctx.stroke();
    }
    
    // piece
    if (this.piece) {
        const mat = this.piece.matrix;
        for (let y = 0; y < mat.length; y++) {
            for (let x = 0; x < mat[y].length; x++) {
                const v = mat[y][x];
                if (v) {
                    const gy = this.piece.y + y;
                    const gx = this.piece.x + x;
                    if (gy >= 0) this.drawCell(gx, gy, COLORS[v]);
                }
            }
        }
    }
  }
}
