import { useEffect, useRef } from "react";
import { DEFAULT_MANDY_THEME, MANDY_THEMES, type MandyTheme } from "../lib/skin";

/* =========================================================================
   Mandy mode: the self-playing fandom backdrop.
   The role amandata.dev's othello-bg.ts plays (a quiet game running behind
   the page), re-made around Maan's fandoms — one scene per sub-theme:

     gotham    a rainy skyline; the signal sweeps the low clouds, bats cross
     basement  a top-down cellar; a crying kid wanders and pops flies with tears
     kanto     tall grass on a tile grid; a trainer wanders, a ball wobbles x3
     inkwell   drifting halftone paper, faint panel gutters, SFX bursts

   All of it is original pixel art drawn in code (sprite strings + fillRect),
   nothing downloaded or ripped. Same pixel trick as othello-bg.ts: paint onto
   a tiny offscreen buffer (1 buffer px = PIXEL css px) and upscale with
   smoothing off. Scenes work in buffer pixels throughout.

   Never interactive (pointer-events: none in mandy.css). Simulation is a fixed
   30fps step, paused in background tabs. A "calm column" is cut out of every
   frame over the content column so body text stays readable. Under
   prefers-reduced-motion one representative frame is drawn per theme and
   redrawn only on theme change / resize.
   ========================================================================= */

const PIXEL = 3;
const STEP = 1 / 30;
/* the content column (mandy.css --md-max), in css px */
const COLUMN = 760;

type Rnd = () => number;
type Ctx = CanvasRenderingContext2D;

/** A scene simulates in buffer pixels; dt is in seconds. */
interface Scene<P> {
	init(w: number, h: number, rnd: Rnd): void;
	step(dt: number): void;
	draw(ctx: Ctx, pal: P): void;
}

/* ---------------- shared helpers ---------------- */

/* deterministic PRNG (as othello-bg.ts), so a resize re-lays the same scene */
function mulberry32(a: number): Rnd {
	return function () {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const between = (rnd: Rnd, lo: number, hi: number) => lo + rnd() * (hi - lo);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function easeOutBack(t: number): number {
	const c1 = 1.70158;
	const c3 = c1 + 1;
	return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/** Draw a sprite from strings; each char maps to a colour, '.' is clear. */
function sprite(
	ctx: Ctx,
	rows: readonly string[],
	x: number,
	y: number,
	colors: Record<string, string>,
	flip = false,
	scale = 1,
): void {
	x = Math.round(x);
	y = Math.round(y);
	for (let r = 0; r < rows.length; r++) {
		const row = rows[r];
		for (let c = 0; c < row.length; c++) {
			const col = colors[row[c]];
			if (!col) continue;
			const cx = flip ? row.length - 1 - c : c;
			ctx.fillStyle = col;
			ctx.fillRect(x + cx * scale, y + r * scale, scale, scale);
		}
	}
}

/** A filled pixel ellipse (no anti-aliasing), for rocks, clouds and lumps. */
function pixelBlob(ctx: Ctx, cx: number, cy: number, rx: number, ry: number, color: string): void {
	ctx.fillStyle = color;
	for (let y = -ry; y <= ry; y++) {
		const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
		if (half > 0) ctx.fillRect(Math.round(cx - half), Math.round(cy + y), half * 2, 1);
	}
}

/** A cached layer for the parts of a scene that don't move. */
function layer(w: number, h: number): [HTMLCanvasElement, Ctx] {
	const c = document.createElement("canvas");
	c.width = w;
	c.height = h;
	return [c, c.getContext("2d") as Ctx];
}

/* ===================================================================
   1. gotham — Batman
   =================================================================== */
interface GothamPalette {
	cloud: string; cloudHi: string; beam: string; signal: string; signalBat: string;
	building: string; roof: string; window: string; windowDim: string; rain: string; bat: string;
}
const GOTHAM_PAL: GothamPalette = {
	cloud: "rgba(38, 44, 58, 0.92)",
	cloudHi: "rgba(64, 72, 90, 0.7)",
	beam: "rgba(245, 197, 24, 0.09)",
	signal: "rgba(245, 197, 24, 0.55)",
	signalBat: "#14171F",
	building: "#191D27",
	roof: "#2A303E",
	window: "#F5C518",
	windowDim: "rgba(245, 197, 24, 0.28)",
	rain: "rgba(143, 163, 191, 0.42)",
	bat: "#3A3F4D",
};

/* the emblem the searchlight throws — an original chunky bat */
const SIGNAL_BAT = [
	".......#...#.......",
	"##.....#####.....##",
	"####...#####...####",
	"###################",
	".#################.",
	"..######.#.######..",
	"...###...#...###...",
];
const BAT_FRAMES = [
	["#.....#", "##.#.##", ".#####.", "...#..."],
	["..#.#..", ".#####.", "##...##", "#.....#"],
];

function makeGotham(): Scene<GothamPalette> {
	let W = 0, H = 0, t = 0, rnd: Rnd = Math.random;
	interface Win { x: number; y: number; lit: boolean; timer: number }
	interface Building { x: number; w: number; h: number; spire: number; antenna: boolean; wins: Win[] }
	let buildings: Building[] = [];
	let rain: { x: number; y: number; v: number }[] = [];
	let clouds: { x: number; y: number; rx: number; ry: number; v: number }[] = [];
	let bats: { x: number; y: number; vx: number; phase: number }[] = [];
	let batTimer = 0;
	let srcX = 0;

	return {
		init(w, h, r) {
			W = w; H = h; rnd = r; t = 0;
			buildings = [];
			for (let x = -2; x < W; ) {
				const bw = Math.round(between(rnd, 10, 26));
				/* taller toward the edges: the middle of the screen stays low and calm */
				const edge = Math.abs((x + bw / 2) / W - 0.5) * 2;
				const bh = Math.round(H * between(rnd, 0.07, 0.13) * (0.7 + edge));
				const wins: Win[] = [];
				for (let wy = H - bh + 4; wy < H - 3; wy += 4) {
					for (let wx = x + 2; wx < x + bw - 2; wx += 3) {
						const lit = rnd() < 0.14;
						wins.push({ x: wx, y: wy, lit, timer: between(rnd, 4, 30) });
					}
				}
				buildings.push({
					x, w: bw, h: bh, wins,
					spire: rnd() < 0.18 ? Math.round(between(rnd, 4, 9)) : 0,
					antenna: rnd() < 0.2,
				});
				x += bw + (rnd() < 0.3 ? 1 : 0);
			}
			const base = buildings.reduce((a, b) => (b.h > a.h && b.x > W * 0.6 ? b : a), buildings[0]);
			srcX = base.x + base.w / 2;
			rain = Array.from({ length: Math.round((W * H) / 700) }, () => ({
				x: rnd() * W, y: rnd() * H, v: between(rnd, 90, 140),
			}));
			clouds = Array.from({ length: Math.max(6, Math.round(W / 40)) }, () => ({
				x: rnd() * W, y: between(rnd, H * 0.02, H * 0.14),
				rx: between(rnd, 18, 46), ry: between(rnd, 4, 9), v: between(rnd, 1, 3),
			}));
			bats = [];
			batTimer = between(rnd, 2, 6);
		},
		step(dt) {
			t += dt;
			for (const d of rain) {
				d.y += d.v * dt;
				d.x -= d.v * 0.35 * dt;
				if (d.y > H) { d.y -= H + 4; d.x = rnd() * (W + 40); }
				if (d.x < -4) d.x += W + 8;
			}
			for (const c of clouds) {
				c.x += c.v * dt;
				if (c.x - c.rx > W) c.x = -c.rx;
			}
			for (const b of buildings) for (const wn of b.wins) {
				wn.timer -= dt;
				if (wn.timer <= 0) {
					/* slow flicker: mostly stay put, sometimes a light goes on or off */
					wn.lit = wn.lit ? rnd() < 0.7 : rnd() < 0.08;
					wn.timer = between(rnd, 6, 40);
				}
			}
			batTimer -= dt;
			if (batTimer <= 0) {
				const n = 1 + Math.floor(rnd() * 3);
				const dir = rnd() < 0.5 ? 1 : -1;
				const y0 = between(rnd, H * 0.12, H * 0.32);
				for (let i = 0; i < n; i++) {
					bats.push({
						x: dir > 0 ? -10 - i * 14 : W + 10 + i * 14,
						y: y0 + between(rnd, -8, 8),
						vx: dir * between(rnd, 26, 38),
						phase: rnd() * 6,
					});
				}
				batTimer = between(rnd, 8, 16);
			}
			for (const b of bats) b.x += b.vx * dt;
			bats = bats.filter(b => b.x > -60 && b.x < W + 60);
		},
		draw(ctx, p) {
			/* searchlight: a beam from a right-hand rooftop up into the clouds */
			const sweep = 0.5 + 0.5 * Math.sin(t * 0.11);
			const tx = W * (0.56 + 0.38 * sweep);
			const ty = H * 0.09;
			const sy = H - (buildings.find(b => srcX >= b.x && srcX < b.x + b.w)?.h ?? H * 0.2);
			const s = W > 500 ? 2 : 1;
			const rx = 12 * s, ry = 6 * s;
			ctx.fillStyle = p.beam;
			ctx.beginPath();
			ctx.moveTo(srcX - 1, sy);
			ctx.lineTo(tx - rx, ty);
			ctx.lineTo(tx + rx, ty);
			ctx.lineTo(srcX + 1, sy);
			ctx.closePath();
			ctx.fill();

			for (const c of clouds) {
				pixelBlob(ctx, c.x, c.y, c.rx, c.ry, p.cloud);
				pixelBlob(ctx, c.x - c.rx * 0.2, c.y - c.ry * 0.4, c.rx * 0.5, Math.max(2, c.ry * 0.4), p.cloudHi);
			}
			/* where the beam lands: the ellipse and the bat cut out of it */
			pixelBlob(ctx, tx, ty, rx + 2 * s, ry + 2 * s, p.signal);
			sprite(ctx, SIGNAL_BAT, tx - (SIGNAL_BAT[0].length * s) / 2, ty - (SIGNAL_BAT.length * s) / 2, { "#": p.signalBat }, false, s);

			for (const b of bats) {
				const f = BAT_FRAMES[Math.floor(t * 7 + b.phase) % 2];
				sprite(ctx, f, b.x, b.y + Math.sin(t * 3 + b.phase) * 3, { "#": p.bat });
			}

			ctx.fillStyle = p.rain;
			for (const d of rain) {
				const x = Math.round(d.x), y = Math.round(d.y);
				ctx.fillRect(x, y, 1, 1);
				ctx.fillRect(x - 1, y + 1, 1, 1);
				ctx.fillRect(x - 1, y + 2, 1, 1);
			}

			for (const b of buildings) {
				const top = H - b.h;
				ctx.fillStyle = p.building;
				ctx.fillRect(b.x, top, b.w, b.h);
				if (b.spire) {
					for (let i = 0; i < b.spire; i++) {
						const half = Math.max(0, Math.round((b.w / 2) * (1 - (i + 1) / (b.spire + 1))));
						ctx.fillRect(b.x + b.w / 2 - half, top - i - 1, half * 2, 1);
					}
				}
				if (b.antenna) ctx.fillRect(Math.round(b.x + b.w * 0.3), top - 7, 1, 7);
				ctx.fillStyle = p.roof;
				ctx.fillRect(b.x, top, b.w, 1);
				for (const wn of b.wins) {
					ctx.fillStyle = wn.lit ? p.window : p.windowDim;
					if (wn.lit || (wn.x + wn.y) % 5 === 0) ctx.fillRect(wn.x, wn.y, 1, 2);
				}
			}
			/* the lamp itself */
			ctx.fillStyle = p.window;
			ctx.fillRect(Math.round(srcX) - 1, Math.round(sy) - 2, 3, 2);
		},
	};
}

/* ===================================================================
   2. basement — The Binding of Isaac
   =================================================================== */
interface BasementPalette {
	wall: string; wallHi: string; floorA: string; floorB: string; grout: string; speck: string;
	door: string; doorFrame: string; rock: string; rockHi: string; poop: string; poopHi: string;
	skin: string; skinShade: string; eye: string; tear: string; tearHi: string;
	fly: string; flyWing: string; blood: string; bloodDark: string; shadow: string;
}
const BASEMENT_PAL: BasementPalette = {
	wall: "#120A06", wallHi: "#2A1A10", floorA: "#2E1F15", floorB: "#291B12", grout: "#1E130C",
	speck: "#3A281B", door: "#050302", doorFrame: "#5A4130", rock: "#5E5248", rockHi: "#7A6C5E",
	poop: "#5A3A1E", poopHi: "#7A5230", skin: "#EBDCC4", skinShade: "#C9B79C", eye: "#140C08",
	tear: "#7FB2E5", tearHi: "#E8F4FF", fly: "#050302", flyWing: "rgba(235, 220, 196, 0.85)",
	blood: "#E04A33", bloodDark: "#8E2A1C", shadow: "rgba(0, 0, 0, 0.35)",
};

/* the crying kid: an original round-headed homage (o outline, s skin,
   h shade, e eye, t tear streak) */
const KID = [
	"...ooooo...",
	".oosssssoo.",
	".ossssssso.",
	"ossssssssso",
	"oseessseeso",
	"oseessseeso",
	"ostssssstso",
	"ohtssssstho",
	".ohhhhhhho.",
	"..ooooooo..",
	"...ohsho...",
	"...oo.oo...",
];
const FLY_FRAMES = [
	["w...w", ".bbb.", "..b.."],
	[".w.w.", "wbbbw", "..b.."],
];

function makeBasement(): Scene<BasementPalette> {
	let W = 0, H = 0, t = 0, rnd: Rnd = Math.random;
	let border = 0;
	let floor = { x0: 0, y0: 0, x1: 0, y1: 0 };
	let props: { kind: "rock" | "poop"; x: number; y: number; r: number }[] = [];
	const kid = { x: 0, y: 0, tx: 0, ty: 0, face: 1, cool: 0, wait: 0 };
	interface Fly { x: number; y: number; hx: number; hy: number; ph: number; dead: number; respawn: number }
	let flies: Fly[] = [];
	let tears: { x: number; y: number; vx: number; vy: number; life: number }[] = [];
	let splats: { x: number; y: number; age: number }[] = [];
	let cache: HTMLCanvasElement | null = null;
	let cachePal: BasementPalette | null = null;

	const freeSpot = () => ({
		x: between(rnd, floor.x0 + 6, floor.x1 - 6),
		y: between(rnd, floor.y0 + 6, floor.y1 - 6),
	});
	function spawnFly(f?: Fly): Fly {
		const s = freeSpot();
		const fly = f ?? ({} as Fly);
		Object.assign(fly, { x: s.x, y: s.y, hx: s.x, hy: s.y, ph: rnd() * 6, dead: 0, respawn: 0 });
		return fly;
	}

	function bake(p: BasementPalette): HTMLCanvasElement {
		const [c, g] = layer(W, H);
		g.fillStyle = p.wall;
		g.fillRect(0, 0, W, H);
		/* wall bricks */
		g.fillStyle = p.wallHi;
		for (let y = 0; y < H; y += 6) {
			for (let x = (y / 6) % 2 ? 0 : 5; x < W; x += 10) {
				if (x > border && x < W - border && y > border && y < H - border) continue;
				g.fillRect(x, y, 9, 1);
			}
		}
		const tile = 16;
		for (let y = floor.y0; y < floor.y1; y += tile) {
			for (let x = floor.x0; x < floor.x1; x += tile) {
				const odd = ((x - floor.x0) / tile + (y - floor.y0) / tile) % 2;
				g.fillStyle = odd ? p.floorA : p.floorB;
				g.fillRect(x, y, Math.min(tile, floor.x1 - x), Math.min(tile, floor.y1 - y));
				g.fillStyle = p.grout;
				g.fillRect(x, y, Math.min(tile, floor.x1 - x), 1);
				g.fillRect(x, y, 1, Math.min(tile, floor.y1 - y));
				g.fillStyle = p.speck;
				for (let k = 0; k < 3; k++) {
					g.fillRect(x + 2 + Math.floor(rnd() * (tile - 4)), y + 2 + Math.floor(rnd() * (tile - 4)), 1, 1);
				}
			}
		}
		/* inner shadow under the top wall */
		g.fillStyle = p.shadow;
		g.fillRect(floor.x0, floor.y0, floor.x1 - floor.x0, 3);
		/* four doors, one per wall */
		const door = (x: number, y: number, w: number, h: number) => {
			g.fillStyle = p.doorFrame;
			g.fillRect(x - 2, y - 2, w + 4, h + 4);
			g.fillStyle = p.door;
			g.fillRect(x, y, w, h);
		};
		const dw = 14, dd = Math.max(4, border - 4);
		door(W / 2 - dw / 2, floor.y0 - dd, dw, dd);
		door(W / 2 - dw / 2, floor.y1, dw, dd);
		door(floor.x0 - dd, H / 2 - dw / 2, dd, dw);
		door(floor.x1, H / 2 - dw / 2, dd, dw);
		for (const pr of props) {
			pixelBlob(g, pr.x + 1, pr.y + pr.r * 0.6, pr.r, Math.max(1, pr.r * 0.35), p.shadow);
			if (pr.kind === "rock") {
				pixelBlob(g, pr.x, pr.y, pr.r, pr.r * 0.8, p.rock);
				pixelBlob(g, pr.x - pr.r * 0.3, pr.y - pr.r * 0.3, pr.r * 0.45, pr.r * 0.3, p.rockHi);
			} else {
				pixelBlob(g, pr.x, pr.y, pr.r, pr.r * 0.45, p.poop);
				pixelBlob(g, pr.x, pr.y - pr.r * 0.45, pr.r * 0.7, pr.r * 0.35, p.poop);
				pixelBlob(g, pr.x, pr.y - pr.r * 0.85, pr.r * 0.4, pr.r * 0.25, p.poopHi);
			}
		}
		return c;
	}

	return {
		init(w, h, r) {
			W = w; H = h; rnd = r; t = 0;
			cache = null;
			border = Math.max(10, Math.round(Math.min(W, H) * 0.08));
			floor = { x0: border, y0: border, x1: W - border, y1: H - border };
			/* obstacles keep to the outer bands, away from the reading column */
			props = [];
			const n = Math.max(4, Math.round(W / 70));
			for (let i = 0; i < n; i++) {
				const left = i % 2 === 0;
				const band = (floor.x1 - floor.x0) * 0.22;
				props.push({
					kind: rnd() < 0.6 ? "rock" : "poop",
					x: left ? between(rnd, floor.x0 + 10, floor.x0 + band) : between(rnd, floor.x1 - band, floor.x1 - 10),
					y: between(rnd, floor.y0 + 12, floor.y1 - 10),
					r: Math.round(between(rnd, 4, 7)),
				});
			}
			const s = freeSpot();
			Object.assign(kid, { x: s.x, y: s.y, tx: s.x, ty: s.y, face: 1, cool: 1, wait: 0.5 });
			flies = Array.from({ length: Math.max(3, Math.round(W / 120)) }, () => spawnFly());
			tears = [];
			splats = [];
		},
		step(dt) {
			t += dt;
			/* the kid wanders between random points, pausing a moment at each */
			const dx = kid.tx - kid.x, dy = kid.ty - kid.y;
			const dist = Math.hypot(dx, dy);
			if (dist < 1) {
				kid.wait -= dt;
				if (kid.wait <= 0) {
					const s = freeSpot();
					kid.tx = s.x; kid.ty = s.y; kid.wait = between(rnd, 0.4, 1.6);
				}
			} else {
				const v = 22 * dt;
				kid.x += (dx / dist) * Math.min(v, dist);
				kid.y += (dy / dist) * Math.min(v, dist);
				if (Math.abs(dx) > 0.5) kid.face = dx > 0 ? 1 : -1;
			}
			/* shoot at the nearest live fly in range */
			kid.cool -= dt;
			if (kid.cool <= 0) {
				let best: Fly | null = null, bd = 130;
				for (const f of flies) {
					if (f.dead) continue;
					const d = Math.hypot(f.x - kid.x, f.y - kid.y);
					if (d < bd) { bd = d; best = f; }
				}
				if (best) {
					const ang = Math.atan2(best.y - kid.y, best.x - kid.x);
					tears.push({ x: kid.x, y: kid.y - 1, vx: Math.cos(ang) * 85, vy: Math.sin(ang) * 85, life: 1.6 });
					kid.cool = 0.65;
				} else kid.cool = 0.3;
			}
			for (const f of flies) {
				if (f.dead) {
					f.respawn -= dt;
					if (f.respawn <= 0) spawnFly(f);
					continue;
				}
				/* slow drifting: a wobble around a home point that itself wanders */
				f.ph += dt;
				f.hx = clamp(f.hx + Math.sin(f.ph * 0.4) * 6 * dt, floor.x0 + 6, floor.x1 - 6);
				f.hy = clamp(f.hy + Math.cos(f.ph * 0.33) * 6 * dt, floor.y0 + 6, floor.y1 - 6);
				f.x = f.hx + Math.sin(f.ph * 2.1) * 5;
				f.y = f.hy + Math.cos(f.ph * 1.7) * 4;
			}
			for (const tr of tears) {
				tr.x += tr.vx * dt;
				tr.y += tr.vy * dt;
				tr.life -= dt;
				if (tr.x < floor.x0 || tr.x > floor.x1 || tr.y < floor.y0 || tr.y > floor.y1) tr.life = 0;
				for (const f of flies) {
					if (!f.dead && tr.life > 0 && Math.abs(f.x - tr.x) < 4 && Math.abs(f.y - tr.y) < 4) {
						f.dead = 1;
						f.respawn = between(rnd, 1.2, 2.5);
						tr.life = 0;
						splats.push({ x: f.x, y: f.y, age: 0 });
					}
				}
			}
			tears = tears.filter(tr => tr.life > 0);
			for (const s of splats) s.age += dt;
			splats = splats.filter(s => s.age < 0.5);
		},
		draw(ctx, p) {
			if (!cache || cachePal !== p) { cache = bake(p); cachePal = p; }
			ctx.drawImage(cache, 0, 0);
			for (const s of splats) {
				const k = s.age / 0.5;
				const r = Math.round(1 + k * 5);
				ctx.fillStyle = k < 0.5 ? p.blood : p.bloodDark;
				for (let i = 0; i < 8; i++) {
					const a = (i / 8) * Math.PI * 2;
					ctx.fillRect(Math.round(s.x + Math.cos(a) * r), Math.round(s.y + Math.sin(a) * r), 1, 1);
				}
				if (k < 0.4) ctx.fillRect(Math.round(s.x) - 1, Math.round(s.y) - 1, 2, 2);
			}
			for (const f of flies) {
				if (f.dead) continue;
				sprite(ctx, FLY_FRAMES[Math.floor(t * 14 + f.ph) % 2], f.x - 2, f.y - 1, { b: p.fly, w: p.flyWing });
			}
			const bob = Math.abs(kid.tx - kid.x) + Math.abs(kid.ty - kid.y) > 1 ? Math.round(Math.sin(t * 12)) : 0;
			pixelBlob(ctx, kid.x, kid.y + 6, 4, 1, p.shadow);
			sprite(ctx, KID, kid.x - 5, kid.y - 7 + bob, {
				o: p.eye, s: p.skin, h: p.skinShade, e: p.eye, t: p.tear,
			}, kid.face < 0);
			for (const tr of tears) {
				ctx.fillStyle = p.tear;
				ctx.fillRect(Math.round(tr.x) - 1, Math.round(tr.y) - 1, 3, 3);
				ctx.fillStyle = p.tearHi;
				ctx.fillRect(Math.round(tr.x) - 1, Math.round(tr.y) - 1, 1, 1);
			}
		},
	};
}

/* ===================================================================
   3. kanto — Pokémon
   =================================================================== */
interface KantoPalette {
	grassA: string; grassB: string; grassDot: string; tall: string; tallHi: string; tallDark: string;
	path: string; pathEdge: string; cap: string; shirt: string; skin: string; hair: string;
	pants: string; outline: string; ballRed: string; ballWhite: string; star: string; shadow: string;
}
const KANTO_PAL: KantoPalette = {
	grassA: "#DCE9C4", grassB: "#D2E3B6", grassDot: "#AFCF8A", tall: "#4E9A3E", tallHi: "#78BC57",
	tallDark: "#2F6E2B", path: "#EADCAE", pathEdge: "#D2BF88", cap: "#D7261E", shirt: "#2A62B8",
	skin: "#F3C9A0", hair: "#3A2A1E", pants: "#2E3148", outline: "#1E2230", ballRed: "#D7261E",
	ballWhite: "#FFFFFF", star: "#FFCB05", shadow: "rgba(30, 34, 48, 0.2)",
};

const TILE = 12;
/* trainer, 9 wide: r cap, h hair, s skin, e eye, b shirt, p pants, o shoes */
const TRAINER_HEAD: Record<"down" | "up" | "side", string[]> = {
	down: ["..rrrrr..", ".rrrrrrr.", "rrrrrrrrr", ".hsssssh.", ".sesssse.", "..sssss.."],
	up: ["..rrrrr..", ".rrrrrrr.", ".rrrrrrr.", ".hhhhhhh.", ".hhhhhhh.", "..sssss.."],
	side: ["..rrrrr..", ".rrrrrrrr", ".rrrrrrrr", ".hhssss..", ".hhssses.", "..sssss.."],
};
const TRAINER_BODY = [
	[".bbbbbbb.", "sbbbbbbbs", ".bbbbbbb.", "..pp.pp..", "..oo.oo.."],
	[".bbbbbbb.", "sbbbbbbbs", ".bbbbbbb.", ".pp...pp.", ".oo...oo."],
];

function makeKanto(): Scene<KantoPalette> {
	let W = 0, H = 0, cols = 0, rows = 0, t = 0, rnd: Rnd = Math.random;
	/* 0 grass, 1 path, 2 tall grass */
	let map: Uint8Array = new Uint8Array(0);
	let rustle: Float32Array = new Float32Array(0);
	let phase: Float32Array = new Float32Array(0);
	const tr = { c: 0, r: 0, pc: 0, pr: 0, k: 1, dir: "down" as "down" | "up" | "left" | "right", wait: 0, steps: 0 };
	interface Ball { x0: number; y0: number; x1: number; y1: number; age: number }
	let ball: Ball | null = null;
	let ballTimer = 0;
	let cache: HTMLCanvasElement | null = null;
	let cachePal: KantoPalette | null = null;

	const at = (c: number, r: number) => (c < 0 || r < 0 || c >= cols || r >= rows ? 1 : map[r * cols + c]);

	function bake(p: KantoPalette): HTMLCanvasElement {
		const [c, g] = layer(W, H);
		for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
			const x = q * TILE, y = r * TILE, m = map[r * cols + q];
			if (m === 1) {
				g.fillStyle = p.path;
				g.fillRect(x, y, TILE, TILE);
				g.fillStyle = p.pathEdge;
				if (at(q, r - 1) !== 1) g.fillRect(x, y, TILE, 1);
				if (at(q, r + 1) !== 1) g.fillRect(x, y + TILE - 1, TILE, 1);
				if (at(q - 1, r) !== 1) g.fillRect(x, y, 1, TILE);
				if (at(q + 1, r) !== 1) g.fillRect(x + TILE - 1, y, 1, TILE);
				if ((q * 7 + r * 3) % 5 === 0) g.fillRect(x + 4, y + 6, 1, 1);
			} else {
				g.fillStyle = (q + r) % 2 ? p.grassA : p.grassB;
				g.fillRect(x, y, TILE, TILE);
				g.fillStyle = p.grassDot;
				g.fillRect(x + ((q * 5 + r * 3) % 8) + 2, y + ((q * 3 + r * 7) % 8) + 2, 1, 2);
				g.fillRect(x + ((q * 5 + r * 3) % 8) + 3, y + ((q * 3 + r * 7) % 8) + 3, 1, 1);
			}
		}
		return c;
	}

	/** Pixel-perfect ball, rotated by `ang` — crisp at buffer resolution. */
	function drawBall(ctx: Ctx, p: KantoPalette, cx: number, cy: number, ang: number): void {
		const R = 4.5, cs = Math.cos(-ang), sn = Math.sin(-ang);
		for (let y = -5; y <= 5; y++) for (let x = -5; x <= 5; x++) {
			const d = Math.hypot(x, y);
			if (d > R) continue;
			const ry = x * sn + y * cs;
			const rx = x * cs - y * sn;
			let col: string;
			if (d > R - 1 || Math.abs(ry) < 0.6) col = p.outline;
			else if (Math.hypot(rx, ry) < 1.6) col = Math.hypot(rx, ry) < 1 ? p.ballWhite : p.outline;
			else col = ry < 0 ? p.ballRed : p.ballWhite;
			ctx.fillStyle = col;
			ctx.fillRect(Math.round(cx) + x, Math.round(cy) + y, 1, 1);
		}
	}

	/* ball timeline (seconds): throw, settle, 3 wobbles, click + sparkle, fade */
	const THROW = 0.6, SETTLE = 0.3, WOBBLE = 0.55, GAP = 0.35, CLICK = 0.9;
	const BALL_END = THROW + SETTLE + 3 * (WOBBLE + GAP) + CLICK;

	return {
		init(w, h, r) {
			W = w; H = h; rnd = r; t = 0;
			cache = null;
			cols = Math.ceil(W / TILE);
			rows = Math.ceil(H / TILE);
			map = new Uint8Array(cols * rows);
			rustle = new Float32Array(cols * rows);
			phase = new Float32Array(cols * rows);
			for (let i = 0; i < phase.length; i++) phase[i] = rnd() * 6;
			/* tall-grass patches: random blobs, kept to the sides of the screen */
			const patches = Math.max(4, Math.round((cols * rows) / 90));
			for (let i = 0; i < patches; i++) {
				const side = rnd() < 0.5;
				const pc = Math.floor(side ? between(rnd, 0, cols * 0.32) : between(rnd, cols * 0.68, cols));
				const pr = Math.floor(rnd() * rows);
				const rad = between(rnd, 1.5, 3.5);
				for (let r2 = -4; r2 <= 4; r2++) for (let c2 = -4; c2 <= 4; c2++) {
					if (Math.hypot(c2, r2 * 1.2) <= rad + rnd() * 0.8) {
						const q = pc + c2, rr = pr + r2;
						if (q >= 0 && rr >= 0 && q < cols && rr < rows) map[rr * cols + q] = 2;
					}
				}
			}
			/* a winding route across, and one branch down */
			let pr2 = Math.floor(rows * between(rnd, 0.55, 0.75));
			for (let q = 0; q < cols; q++) {
				map[pr2 * cols + q] = 1;
				if (pr2 + 1 < rows) map[(pr2 + 1) * cols + q] = 1;
				if (q % 6 === 5 && rnd() < 0.5) {
					const np = clamp(pr2 + (rnd() < 0.5 ? -1 : 1), 1, rows - 2);
					map[np * cols + q] = 1;
					if (np + 1 < rows) map[(np + 1) * cols + q] = 1;
					pr2 = np;
				}
			}
			const bc = Math.floor(cols * between(rnd, 0.15, 0.25));
			for (let r3 = 0; r3 < rows; r3++) map[r3 * cols + bc] = map[r3 * cols + bc + 1] = 1;
			tr.c = tr.pc = bc; tr.r = tr.pr = Math.floor(rows / 2); tr.k = 1; tr.wait = 0.5; tr.steps = 0;
			ball = null;
			ballTimer = between(rnd, 3, 6);
		},
		step(dt) {
			t += dt;
			for (let i = 0; i < rustle.length; i++) if (rustle[i] > 0) rustle[i] = Math.max(0, rustle[i] - dt);
			/* tile-to-tile random walk, tweened; tends to keep its heading */
			if (tr.k < 1) {
				tr.k = Math.min(1, tr.k + dt / 0.32);
				if (tr.k >= 1 && at(tr.c, tr.r) === 2) rustle[tr.r * cols + tr.c] = 0.7;
			} else {
				tr.wait -= dt;
				if (tr.wait <= 0 && !ball) {
					const dirs = [["down", 0, 1], ["up", 0, -1], ["left", -1, 0], ["right", 1, 0]] as const;
					const keep = dirs.find(d => d[0] === tr.dir)!;
					const opts = rnd() < 0.7 ? [keep, ...dirs] : [...dirs].sort(() => rnd() - 0.5);
					for (const d of opts) {
						const nc = tr.c + d[1], nr = tr.r + d[2];
						if (nc < 1 || nr < 1 || nc >= cols - 1 || nr >= rows - 1) continue;
						tr.dir = d[0];
						tr.pc = tr.c; tr.pr = tr.r; tr.c = nc; tr.r = nr; tr.k = 0;
						tr.steps++;
						break;
					}
					tr.wait = rnd() < 0.15 ? between(rnd, 0.6, 1.5) : 0;
				}
			}
			ballTimer -= dt;
			if (!ball && ballTimer <= 0 && tr.k >= 1) {
				/* throw at a tall-grass tile near the trainer, or just ahead */
				let target: [number, number] | null = null;
				for (let tries = 0; tries < 30 && !target; tries++) {
					const c = tr.c + Math.round(between(rnd, -5, 5)), r = tr.r + Math.round(between(rnd, -4, 4));
					if (at(c, r) === 2 && (c !== tr.c || r !== tr.r)) target = [c, r];
				}
				target ??= [clamp(tr.c + 3, 0, cols - 1), tr.r];
				ball = {
					x0: tr.c * TILE + TILE / 2, y0: tr.r * TILE,
					x1: target[0] * TILE + TILE / 2, y1: target[1] * TILE + TILE / 2,
					age: 0,
				};
				tr.dir = ball.x1 >= ball.x0 ? "right" : "left";
			}
			if (ball) {
				ball.age += dt;
				if (ball.age > BALL_END) { ball = null; ballTimer = between(rnd, 7, 12); }
			}
		},
		draw(ctx, p) {
			if (!cache || cachePal !== p) { cache = bake(p); cachePal = p; }
			ctx.drawImage(cache, 0, 0);
			const sx = (tr.pc + (tr.c - tr.pc) * tr.k) * TILE;
			const sy = (tr.pr + (tr.r - tr.pr) * tr.k) * TILE;
			const tallUnder = at(tr.c, tr.r) === 2 && tr.k > 0.5;

			/* trainer first, so tall grass can hide its legs */
			const head = tr.dir === "left" || tr.dir === "right" ? TRAINER_HEAD.side : TRAINER_HEAD[tr.dir];
			const body = TRAINER_BODY[tr.k < 1 ? (tr.steps % 2) : 0];
			const colors = { r: p.cap, h: p.hair, s: p.skin, e: p.outline, b: p.shirt, p: p.pants, o: p.outline };
			pixelBlob(ctx, sx + TILE / 2, sy + TILE - 1, 4, 1, p.shadow);
			sprite(ctx, [...head, ...body], sx + 1, sy - 2, colors, tr.dir === "left");

			for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
				if (map[r * cols + q] !== 2) continue;
				const i = r * cols + q, x = q * TILE, y = r * TILE;
				const rs = rustle[i];
				const sway = Math.round(Math.sin(t * 1.6 + phase[i]) * 0.9 + (rs > 0 ? Math.sin(rs * 30) * 2 : 0));
				const covering = tallUnder && q === tr.c && r === tr.r;
				ctx.fillStyle = p.tallDark;
				ctx.fillRect(x, y + TILE - 3, TILE, 3);
				for (let k = 0; k < 3; k++) {
					const bx = x + 1 + k * 4, by = y + (k % 2 ? 3 : 4);
					ctx.fillStyle = p.tall;
					ctx.fillRect(bx + sway, by, 1, 2);
					ctx.fillRect(bx + 2 + sway, by, 1, 2);
					ctx.fillRect(bx, by + 2, 3, TILE - 6 - (by - y) + 3);
					ctx.fillStyle = p.tallHi;
					ctx.fillRect(bx + 1 + sway, by - 1, 1, 2);
				}
				if (covering) {
					ctx.fillStyle = p.tall;
					ctx.fillRect(x, y + TILE - 5, TILE, 3);
				}
				if (rs > 0.3) {
					ctx.fillStyle = p.tallHi;
					const lift = Math.round((0.7 - rs) * 12);
					ctx.fillRect(x + 2, y - lift, 1, 1);
					ctx.fillRect(x + TILE - 3, y - lift + 1, 1, 1);
				}
			}

			if (ball) {
				const a = ball.age;
				let bx = ball.x1, by = ball.y1, ang = 0;
				if (a < THROW) {
					const k = a / THROW;
					bx = ball.x0 + (ball.x1 - ball.x0) * k;
					by = ball.y0 + (ball.y1 - ball.y0) * k - Math.sin(k * Math.PI) * 18;
					ang = k * Math.PI * 4;
				} else {
					const w = a - THROW - SETTLE;
					if (w > 0 && w < 3 * (WOBBLE + GAP)) {
						const local = w % (WOBBLE + GAP);
						if (local < WOBBLE) ang = Math.sin((local / WOBBLE) * Math.PI * 2) * 0.5;
					}
					pixelBlob(ctx, bx, by + 4, 4, 1, p.shadow);
				}
				const fading = a > BALL_END - 0.3;
				ctx.save();
				if (fading) ctx.globalAlpha = Math.max(0, (BALL_END - a) / 0.3);
				drawBall(ctx, p, bx, by, ang);
				/* the click: a little star burst once the third wobble ends */
				const c = a - (THROW + SETTLE + 3 * (WOBBLE + GAP));
				if (c > 0 && c < CLICK) {
					const k = c / CLICK;
					ctx.fillStyle = p.star;
					for (let i = 0; i < 4; i++) {
						const ang2 = -Math.PI / 2 + (i - 1.5) * 0.7;
						const d = 4 + k * 9;
						const x = Math.round(bx + Math.cos(ang2) * d), y = Math.round(by + Math.sin(ang2) * d);
						ctx.fillRect(x, y - 1, 1, 3);
						ctx.fillRect(x - 1, y, 3, 1);
					}
				}
				ctx.restore();
			}
		},
	};
}

/* ===================================================================
   4. inkwell — comics
   =================================================================== */
interface InkwellPalette {
	cyan: string; magenta: string; yellow: string; ink: string; gutter: string; paper: string;
	bursts: readonly string[];
}
const INKWELL_PAL: InkwellPalette = {
	cyan: "rgba(0, 115, 158, 0.5)",
	magenta: "rgba(200, 0, 110, 0.42)",
	yellow: "rgba(230, 190, 20, 0.55)",
	ink: "#161616",
	gutter: "rgba(22, 22, 22, 0.16)",
	paper: "#FFFDF5",
	bursts: ["#FFE14D", "#C8006E", "#00739E", "#FFFDF5"],
};
const SFX = ["POW!", "KRAK!", "THWIP!", "BAM!", "ZAP!", "WHAM!"];

function makeInkwell(): Scene<InkwellPalette> {
	let W = 0, H = 0, t = 0, rnd: Rnd = Math.random;
	let panels: { x: number; y: number; w: number; h: number }[] = [];
	interface Burst { x: number; y: number; r: number; rot: number; word: string; fill: number; age: number; pts: number[] }
	let bursts: Burst[] = [];
	let burstTimer = 0;
	const HOLD_IN = 0.25, HOLD = 1.5, OUT = 0.6;
	let dotCache: HTMLCanvasElement | null = null;
	let dotKey = "";

	/* dot size field: bigger dots toward the corners, almost none mid-screen */
	function weight(x: number, y: number, layerIx: number): number {
		const ex = Math.abs(x / W - 0.5) * 2, ey = Math.abs(y / H - 0.5) * 2;
		const edge = Math.max(ex, ey * 0.8);
		const wave = 0.5 + 0.5 * Math.sin(x * 0.03 + layerIx * 2 + y * 0.02) * Math.cos(y * 0.025 - layerIx);
		return clamp(edge * edge * (0.6 + wave * 0.7), 0, 1);
	}

	function bakeDots(p: InkwellPalette, ox: number, oy: number): HTMLCanvasElement {
		const [c, g] = layer(W, H);
		const layers: [string, number, number][] = [[p.cyan, 0, 0], [p.magenta, 3, 2], [p.yellow, 1, 4]];
		const sp = 6;
		layers.forEach(([col, dx, dy], li) => {
			g.fillStyle = col;
			const lx = (ox * (li + 1)) % sp, ly = (oy * (li % 2 ? 1 : 2)) % sp;
			for (let y = -sp + dy + ly; y < H + sp; y += sp) {
				for (let x = -sp + dx + lx + ((y / sp) % 2 ? sp / 2 : 0); x < W + sp; x += sp) {
					const s = Math.round(weight(x, y, li) * 3);
					if (s > 0) g.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), s, s);
				}
			}
		});
		g.fillStyle = p.gutter;
		for (const pn of panels) {
			g.fillRect(pn.x, pn.y, pn.w, 1);
			g.fillRect(pn.x, pn.y + pn.h - 1, pn.w, 1);
			g.fillRect(pn.x, pn.y, 1, pn.h);
			g.fillRect(pn.x + pn.w - 1, pn.y, 1, pn.h);
		}
		return c;
	}

	function spawn(): void {
		const narrow = W * PIXEL < COLUMN + 240;
		const r = narrow ? between(rnd, 14, 20) : between(rnd, 20, 32);
		/* outside the reading column where there's room for it */
		const sideW = (W - COLUMN / PIXEL) / 2;
		let x: number;
		if (!narrow && sideW > r * 1.6) {
			x = rnd() < 0.5 ? between(rnd, r, sideW - r * 0.4) : between(rnd, W - sideW + r * 0.4, W - r);
		} else x = between(rnd, r, W - r);
		const y = between(rnd, r + H * 0.08, H - r);
		const n = 12 + Math.floor(rnd() * 5);
		const pts: number[] = [];
		for (let i = 0; i < n * 2; i++) pts.push(i % 2 ? between(rnd, 0.55, 0.68) : between(rnd, 0.9, 1.12));
		bursts.push({
			x, y, r, pts,
			rot: between(rnd, -0.25, 0.25),
			word: SFX[Math.floor(rnd() * SFX.length)],
			fill: Math.floor(rnd() * 4),
			age: 0,
		});
	}

	function burstPath(ctx: Ctx, b: Burst, scale: number): void {
		ctx.beginPath();
		const n = b.pts.length;
		for (let i = 0; i < n; i++) {
			const a = (i / n) * Math.PI * 2;
			const rr = b.r * scale * b.pts[i];
			const x = Math.cos(a) * rr * 1.25, y = Math.sin(a) * rr;
			if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
		}
		ctx.closePath();
	}

	return {
		init(w, h, r) {
			W = w; H = h; rnd = r; t = 0;
			dotCache = null;
			/* a comic page's panel grid, ruled faintly */
			panels = [];
			const g = 5;
			let y = g;
			while (y < H - 20) {
				const ph = Math.round(between(rnd, H * 0.22, H * 0.36));
				const hh = Math.min(ph, H - g - y);
				const n = 1 + Math.floor(rnd() * 3);
				let x = g;
				for (let i = 0; i < n; i++) {
					const pw = i === n - 1 ? W - g - x : Math.round(((W - g * (n + 1)) / n) * between(rnd, 0.75, 1.25));
					panels.push({ x, y, w: pw, h: hh });
					x += pw + g;
				}
				y += hh + g;
			}
			bursts = [];
			burstTimer = 0.4;
		},
		step(dt) {
			t += dt;
			burstTimer -= dt;
			/* never leave the page empty: a spawn gap can outlast a burst's life,
			   which also left the reduced-motion frame blank at narrow widths */
			if ((burstTimer <= 0 || (bursts.length === 0 && t > 0.4)) && bursts.length < 3) {
				spawn();
				burstTimer = between(rnd, 1.4, 3);
			}
			for (const b of bursts) b.age += dt;
			bursts = bursts.filter(b => b.age < HOLD_IN + HOLD + OUT);
		},
		draw(ctx, p) {
			/* the halftone drifts ~2 buffer px a second; re-bake only when it moves a pixel */
			const ox = Math.floor(t * 2), oy = Math.floor(t * 1.3);
			const key = `${ox},${oy}`;
			if (!dotCache || dotKey !== key) { dotCache = bakeDots(p, ox, oy); dotKey = key; }
			ctx.drawImage(dotCache, 0, 0);

			for (const b of bursts) {
				const a = b.age;
				const scale = a < HOLD_IN ? Math.max(0.05, easeOutBack(a / HOLD_IN)) : 1;
				const alpha = a > HOLD_IN + HOLD ? Math.max(0, 1 - (a - HOLD_IN - HOLD) / OUT) : 1;
				ctx.save();
				ctx.globalAlpha = alpha;
				ctx.translate(Math.round(b.x), Math.round(b.y));
				ctx.rotate(b.rot);
				/* offset shadow, then the burst, then a chunky ink outline */
				ctx.translate(2, 2);
				burstPath(ctx, b, scale);
				ctx.fillStyle = p.ink;
				ctx.fill();
				ctx.translate(-2, -2);
				burstPath(ctx, b, scale);
				ctx.fillStyle = p.bursts[b.fill];
				ctx.fill();
				ctx.lineWidth = 1;
				ctx.strokeStyle = p.ink;
				ctx.stroke();
				const size = Math.round(b.r * scale * (b.word.length > 4 ? 0.55 : 0.7));
				ctx.font = `${size}px Bangers, Impact, "Arial Black", sans-serif`;
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				const dark = b.fill === 1 || b.fill === 2;
				ctx.lineJoin = "round";
				ctx.lineWidth = Math.max(1, size / 7);
				ctx.strokeStyle = dark ? p.ink : p.paper;
				ctx.strokeText(b.word, 0, 1);
				ctx.fillStyle = dark ? p.paper : p.ink;
				ctx.fillText(b.word, 0, 1);
				ctx.restore();
			}
		},
	};
}

/* ---------------- registry ---------------- */

interface Runner { step(dt: number): void; draw(ctx: Ctx): void; calm: number }

/** Bind a scene to its palette; `calm` is how much of the content column is cut out. */
function bind<P>(make: () => Scene<P>, pal: P, seed: number, calm: number) {
	return (w: number, h: number): Runner => {
		const s = make();
		s.init(w, h, mulberry32(seed));
		return { step: dt => s.step(dt), draw: ctx => s.draw(ctx, pal), calm };
	};
}

const SCENES: Record<MandyTheme, (w: number, h: number) => Runner> = {
	gotham: bind(makeGotham, GOTHAM_PAL, 0xba7, 0.35),
	basement: bind(makeBasement, BASEMENT_PAL, 0x15aac, 0.45),
	kanto: bind(makeKanto, KANTO_PAL, 0x151, 0.5),
	inkwell: bind(makeInkwell, INKWELL_PAL, 0xb0f, 0.4),
};

function readTheme(): MandyTheme {
	const raw = (document.documentElement.dataset.theme ?? "").replace(/^mandy-/, "");
	return (MANDY_THEMES as readonly string[]).includes(raw) ? (raw as MandyTheme) : DEFAULT_MANDY_THEME;
}

/* ---------------- the island ---------------- */

export function MandyBackdrop() {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		const dctx = canvas?.getContext("2d");
		if (!canvas || !dctx) return;
		const buf = document.createElement("canvas");
		const ctx = buf.getContext("2d") as Ctx;

		let reduceMotion = false;
		try {
			reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		} catch { /* fail open */ }

		let theme = readTheme();
		let scene: Runner;
		let W = 0, H = 0, DPR = 1;
		let rafId = 0, last = 0, acc = 0;
		let resizeT: ReturnType<typeof setTimeout> | undefined;

		function build(): void {
			scene = SCENES[theme](buf.width, buf.height);
			/* reduced motion: settle the scene a few seconds in, so the one frame
			   has rain mid-fall, a burst on the page, the kid mid-room */
			if (reduceMotion) for (let i = 0; i < 90; i++) scene.step(STEP);
		}

		function resize(): void {
			DPR = Math.min(window.devicePixelRatio || 1, 2);
			W = window.innerWidth;
			H = window.innerHeight;
			canvas!.width = Math.round(W * DPR);
			canvas!.height = Math.round(H * DPR);
			buf.width = Math.max(1, Math.ceil(W / PIXEL));
			buf.height = Math.max(1, Math.ceil(H / PIXEL));
			build();
		}

		function present(): void {
			ctx.globalCompositeOperation = "source-over";
			ctx.globalAlpha = 1;
			ctx.clearRect(0, 0, buf.width, buf.height);
			scene.draw(ctx);
			/* the calm column: fade the scene out under the content */
			const bw = buf.width, mid = bw / 2;
			const half = COLUMN / PIXEL / 2, feather = 40;
			if (scene.calm > 0) {
				const g = ctx.createLinearGradient(0, 0, bw, 0);
				const stop = (x: number) => clamp(x / bw, 0, 1);
				g.addColorStop(0, "rgba(0,0,0,0)");
				g.addColorStop(stop(mid - half - feather), "rgba(0,0,0,0)");
				g.addColorStop(stop(mid - half), `rgba(0,0,0,${scene.calm})`);
				g.addColorStop(stop(mid + half), `rgba(0,0,0,${scene.calm})`);
				g.addColorStop(stop(mid + half + feather), "rgba(0,0,0,0)");
				g.addColorStop(1, "rgba(0,0,0,0)");
				ctx.globalCompositeOperation = "destination-out";
				ctx.fillStyle = g;
				ctx.fillRect(0, 0, bw, buf.height);
				ctx.globalCompositeOperation = "source-over";
			}
			dctx!.setTransform(1, 0, 0, 1, 0, 0);
			dctx!.imageSmoothingEnabled = false;
			dctx!.clearRect(0, 0, canvas!.width, canvas!.height);
			dctx!.drawImage(buf, 0, 0, buf.width * PIXEL * DPR, buf.height * PIXEL * DPR);
		}

		/* fixed 30fps simulation; draw only on frames where it stepped */
		function frame(now: number): void {
			acc += Math.min((now - last) / 1000, 0.25);
			last = now;
			let stepped = false;
			while (acc >= STEP) {
				scene.step(STEP);
				acc -= STEP;
				stepped = true;
			}
			if (stepped) present();
			rafId = requestAnimationFrame(frame);
		}
		function start(): void {
			if (rafId || reduceMotion || document.hidden) return;
			last = performance.now();
			acc = 0;
			rafId = requestAnimationFrame(frame);
		}
		function stop(): void {
			if (rafId) cancelAnimationFrame(rafId);
			rafId = 0;
		}

		function onResize(): void {
			clearTimeout(resizeT);
			resizeT = setTimeout(() => { resize(); present(); }, 150);
		}
		function onVisibility(): void {
			if (document.hidden) stop();
			else start();
		}
		/* switch scene + palette the moment the sub-theme changes */
		const observer = new MutationObserver(() => {
			const next = readTheme();
			if (next === theme) return;
			theme = next;
			build();
			present();
		});
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
		window.addEventListener("resize", onResize);
		document.addEventListener("visibilitychange", onVisibility);

		resize();
		present();
		start();
		/* inkwell's SFX are set in Bangers, which may land after the first frame */
		let alive = true;
		document.fonts?.load("16px Bangers").then(() => { if (alive && reduceMotion) present(); }, () => {});

		return () => {
			alive = false;
			stop();
			clearTimeout(resizeT);
			observer.disconnect();
			window.removeEventListener("resize", onResize);
			document.removeEventListener("visibilitychange", onVisibility);
		};
	}, []);

	return <canvas ref={canvasRef} className="md-backdrop" aria-hidden="true" />;
}

export default MandyBackdrop;
