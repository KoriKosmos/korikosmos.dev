// Draws the 1200x630 social cards served from /og/ (src/pages/og/[...route].ts).
//
// Build-time only: the route is prerendered, so none of this ships to the
// server image or the browser. The card is Mandy mode in its default gotham
// sub-theme, because that is what a visitor with no cookie (and so anyone
// following a shared link) actually lands on: night sky, Bat-Signal in the
// clouds, a rainy pixel skyline with lit windows, the pixel bat emblem, and the
// "kori" + yellow "kosmos" wordmark, set in the skin's own fonts.
//
// Drawn with CanvasKit directly rather than through a card template: the scene
// is pixel art on a grid, and the text block needs to fit itself (shrink the
// title, clamp the description) around the signal on the right.
//
// Fonts come from the Fontsource packages Mandy mode already self-hosts. Their
// .woff files are decoded to plain sfnt here, because CanvasKit's font loader
// only reads TTF/OTF; that keeps the card on exactly the faces the site serves
// without vendoring a second copy.

import { Buffer } from 'node:buffer';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { inflateSync } from 'node:zlib';
import type { Canvas, CanvasKit, Paragraph, TypefaceFontProvider } from 'canvaskit-wasm';
import { BAT_ROWS } from '../page-components/PixelBat';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

export interface OgCard {
  title: string;
  description: string;
  /** VT323 line above the title, e.g. `/blog · 12 Nov 2026 · 6 min read`. */
  kicker?: string;
  /** The homepage/site card: the big centred wordmark instead of a title block. */
  home?: boolean;
}

/* gotham tokens, mirrored from mandy.css §1 and MandyBackdrop's GOTHAM_PAL */
const C = {
  skyTop: '#05060A',
  skyBottom: '#11141C',
  ink: '#ECEAE3',
  dim: 'rgba(236, 234, 227, 0.74)',
  accent: '#F5C518',
  tag: '#8FA3BF',
  cloud: 'rgba(38, 44, 58, 0.94)',
  cloudHi: 'rgba(64, 72, 90, 0.75)',
  beam: 'rgba(245, 197, 24, 0.075)',
  signal: 'rgba(245, 197, 24, 0.62)',
  signalRim: 'rgba(255, 220, 90, 0.85)',
  signalBat: '#14171F',
  building: '#191D27',
  roof: '#2A303E',
  window: '#F5C518',
  windowDim: 'rgba(245, 197, 24, 0.13)',
  rain: 'rgba(143, 163, 191, 0.3)',
  bat: '#3A3F4D',
};

/** One grid cell in card pixels. The scene is drawn on a 200x105 grid. */
const CELL = 6;
const GRID_W = OG_WIDTH / CELL;
const GRID_H = OG_HEIGHT / CELL;

const FONTS = {
  display: { family: 'Pixelify Sans', file: '@fontsource/pixelify-sans/files/pixelify-sans-latin-700-normal.woff' },
  micro: { family: 'VT323', file: '@fontsource/vt323/files/vt323-latin-400-normal.woff' },
  body: { family: 'Nunito', file: '@fontsource/nunito/files/nunito-latin-400-normal.woff' },
} as const;

/* ------------------------------------------------------------------ fonts */

/**
 * WOFF 1.0 → sfnt. A WOFF is an sfnt whose tables are individually
 * zlib-compressed behind a slightly different header, so this only has to
 * rebuild the 12-byte offset table and the 16-byte table records and inflate
 * each table back into place (4-byte aligned, as sfnt requires).
 */
export function woffToSfnt(woff: Uint8Array): Uint8Array {
  const src = Buffer.from(woff.buffer, woff.byteOffset, woff.byteLength);
  if (src.toString('latin1', 0, 4) !== 'wOFF') throw new Error('Not a WOFF 1.0 file');

  const flavor = src.readUInt32BE(4);
  const numTables = src.readUInt16BE(12);
  const tables = Array.from({ length: numTables }, (_, i) => {
    const at = 44 + i * 20;
    const offset = src.readUInt32BE(at + 4);
    const compLength = src.readUInt32BE(at + 8);
    const origLength = src.readUInt32BE(at + 12);
    const raw = src.subarray(offset, offset + compLength);
    return {
      tag: src.readUInt32BE(at),
      checksum: src.readUInt32BE(at + 16),
      data: compLength < origLength ? inflateSync(raw) : raw,
    };
  });

  const pad4 = (n: number) => (n + 3) & ~3;
  const headerSize = 12 + numTables * 16;
  const total = tables.reduce((sum, t) => sum + pad4(t.data.length), headerSize);
  const out = Buffer.alloc(total);

  const entrySelector = Math.floor(Math.log2(numTables));
  const searchRange = 2 ** entrySelector * 16;
  out.writeUInt32BE(flavor, 0);
  out.writeUInt16BE(numTables, 4);
  out.writeUInt16BE(searchRange, 6);
  out.writeUInt16BE(entrySelector, 8);
  out.writeUInt16BE(numTables * 16 - searchRange, 10);

  let offset = headerSize;
  tables.forEach((t, i) => {
    const rec = 12 + i * 16;
    out.writeUInt32BE(t.tag, rec);
    out.writeUInt32BE(t.checksum, rec + 4);
    out.writeUInt32BE(offset, rec + 8);
    out.writeUInt32BE(t.data.length, rec + 12);
    out.set(t.data, offset);
    offset += pad4(t.data.length);
  });

  return out;
}

const require = createRequire(import.meta.url);

let kitPromise: Promise<{ kit: CanvasKit; fonts: TypefaceFontProvider }> | undefined;

function load() {
  kitPromise ??= (async () => {
    const { default: init } = await import('canvaskit-wasm/full');
    const kit = await init({ locateFile: (file: string) => require.resolve(`canvaskit-wasm/bin/full/${file}`) });
    const fonts = kit.TypefaceFontProvider.Make();
    for (const { family, file } of Object.values(FONTS)) {
      const sfnt = woffToSfnt(await readFile(require.resolve(file)));
      // Registered under an explicit alias, so the card never depends on how
      // CanvasKit parses the family name out of the font's own name table.
      fonts.registerFont(sfnt.buffer.slice(sfnt.byteOffset, sfnt.byteOffset + sfnt.byteLength) as ArrayBuffer, family);
    }
    return { kit, fonts };
  })();
  return kitPromise;
}

/* ------------------------------------------------------------------ scene */

/** mulberry32, as MandyBackdrop: one seed, so every card shares a skyline. */
function mulberry32(a: number) {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BAT_FRAME = ['#.....#', '##.#.##', '.#####.', '...#...'];

function drawScene(kit: CanvasKit, canvas: Canvas) {
  const rnd = mulberry32(0x6b6f7269); // "kori"
  const paint = new kit.Paint();
  paint.setAntiAlias(false);

  const cells = (x: number, y: number, w: number, h: number, color: string) => {
    paint.setColor(kit.parseColorString(color));
    canvas.drawRect(kit.XYWHRect(x * CELL, y * CELL, w * CELL, h * CELL), paint);
  };
  const sprite = (rows: readonly string[], x: number, y: number, scale: number, color: string) => {
    rows.forEach((row, ry) => {
      for (let rx = 0; rx < row.length; rx++) {
        if (row[rx] === '#') cells(x + rx * scale, y + ry * scale, scale, scale, color);
      }
    });
  };

  // Sky
  const sky = new kit.Paint();
  sky.setShader(
    kit.Shader.MakeLinearGradient(
      [0, 0],
      [0, OG_HEIGHT],
      [kit.parseColorString(C.skyTop), kit.parseColorString(C.skyBottom)],
      null,
      kit.TileMode.Clamp
    )
  );
  canvas.drawRect(kit.XYWHRect(0, 0, OG_WIDTH, OG_HEIGHT), sky);

  // Bat-Signal: a beam from the rooftops up to a lit disc in the clouds.
  const sx = 166;
  const sy = 24;
  const rx = 25;
  const ry = 12;
  const beam = new kit.PathBuilder()
    .addPolygon(
      [140 * CELL, OG_HEIGHT, 146 * CELL, OG_HEIGHT, (sx + rx) * CELL, (sy + 4) * CELL, (sx - rx) * CELL, (sy - 2) * CELL],
      true
    )
    .detachAndDelete();
  const beamPaint = new kit.Paint();
  beamPaint.setAntiAlias(true);
  beamPaint.setColor(kit.parseColorString(C.beam));
  canvas.drawPath(beam, beamPaint);
  beam.delete();

  // A soft halo behind the disc stands in for the site's glow.
  const halo = new kit.Paint();
  halo.setAntiAlias(true);
  halo.setColor(kit.parseColorString('rgba(245, 197, 24, 0.14)'));
  halo.setMaskFilter(kit.MaskFilter.MakeBlur(kit.BlurStyle.Normal, 38, true));
  canvas.drawOval(kit.XYWHRect((sx - rx - 4) * CELL, (sy - ry - 4) * CELL, (rx + 4) * 2 * CELL, (ry + 4) * 2 * CELL), halo);

  for (let y = -ry; y <= ry; y++) {
    for (let x = -rx; x <= rx; x++) {
      const d = (x / rx) ** 2 + (y / ry) ** 2;
      if (d <= 1) cells(sx + x, sy + y, 1, 1, d > 0.8 ? C.signalRim : C.signal);
    }
  }
  const batScale = 2;
  sprite(
    BAT_ROWS,
    sx - Math.floor((BAT_ROWS[0].length * batScale) / 2),
    sy - Math.floor((BAT_ROWS.length * batScale) / 2),
    batScale,
    C.signalBat
  );

  // Low clouds drifting across the top, one clipping the signal's edge.
  const clouds = [
    { x: 118, y: 6, rx: 20, ry: 4 },
    { x: 192, y: 37, rx: 18, ry: 3 },
    { x: 60, y: 4, rx: 26, ry: 3 },
  ];
  for (const c of clouds) {
    for (let y = -c.ry; y <= c.ry; y++) {
      for (let x = -c.rx; x <= c.rx; x++) {
        if ((x / c.rx) ** 2 + (y / c.ry) ** 2 <= 1) cells(c.x + x, c.y + y, 1, 1, y < 0 ? C.cloudHi : C.cloud);
      }
    }
  }

  // Bats crossing the beam, kept right of the text column.
  sprite(BAT_FRAME, 152, 50, 1, C.bat);
  sprite(BAT_FRAME, 161, 56, 1, C.bat);
  sprite(BAT_FRAME, 186, 60, 1, C.bat);

  // Rain, under the skyline so roofs read as shelter.
  paint.setColor(kit.parseColorString(C.rain));
  for (let i = 0; i < 150; i++) {
    const x = Math.floor(rnd() * (GRID_W + 20));
    const y = Math.floor(rnd() * GRID_H);
    const len = 2 + Math.floor(rnd() * 3);
    for (let k = 0; k < len; k++) {
      canvas.drawRect(kit.XYWHRect((x - k) * CELL + CELL / 2, (y + k) * CELL, CELL / 3, CELL), paint);
    }
  }

  // Skyline: low under the text on the left, rising toward the right edge.
  for (let x = -2; x < GRID_W; ) {
    const bw = 8 + Math.floor(rnd() * 12);
    const t = (x + bw / 2) / GRID_W;
    const bh = Math.round((7 + rnd() * 7) * (0.75 + t * 1.25));
    const top = GRID_H - bh;
    cells(x, top, bw, bh, C.building);
    cells(x, top, bw, 1, C.roof);
    if (rnd() < 0.3) cells(x + Math.floor(bw / 2), top - 3, 1, 3, C.roof);
    for (let wy = top + 2; wy < GRID_H - 1; wy += 3) {
      for (let wx = x + 2; wx < x + bw - 1; wx += 3) {
        cells(wx, wy, 1, 1, rnd() < 0.16 ? C.window : C.windowDim);
      }
    }
    x += bw + (rnd() < 0.4 ? 1 : 0);
  }

  // Text scrim on the left and a vignette, so the copy wins over the scene.
  const scrim = new kit.Paint();
  scrim.setShader(
    kit.Shader.MakeLinearGradient(
      [0, 0],
      [880, 0],
      [kit.parseColorString('rgba(8, 9, 13, 0.82)'), kit.parseColorString('rgba(8, 9, 13, 0)')],
      null,
      kit.TileMode.Clamp
    )
  );
  canvas.drawRect(kit.XYWHRect(0, 0, OG_WIDTH, OG_HEIGHT), scrim);

  const vignette = new kit.Paint();
  vignette.setShader(
    kit.Shader.MakeRadialGradient(
      [OG_WIDTH / 2, OG_HEIGHT / 2],
      OG_WIDTH * 0.72,
      [kit.parseColorString('rgba(0, 0, 0, 0)'), kit.parseColorString('rgba(0, 0, 0, 0.55)')],
      [0.55, 1],
      kit.TileMode.Clamp
    )
  );
  canvas.drawRect(kit.XYWHRect(0, 0, OG_WIDTH, OG_HEIGHT), vignette);

  for (const p of [paint, sky, beamPaint, halo, scrim, vignette]) p.delete();
}

/* ------------------------------------------------------------------- text */

interface Run {
  text: string;
  color: string;
  glow?: boolean;
}

function paragraph(
  kit: CanvasKit,
  fonts: TypefaceFontProvider,
  runs: Run[],
  opts: { family: string; size: number; width: number; lineHeight?: number; maxLines?: number; center?: boolean }
): Paragraph {
  const style = new kit.ParagraphStyle({
    textAlign: opts.center ? kit.TextAlign.Center : kit.TextAlign.Left,
    maxLines: opts.maxLines,
    ellipsis: opts.maxLines ? '…' : undefined,
    textStyle: {
      fontFamilies: [opts.family],
      fontSize: opts.size,
      heightMultiplier: opts.lineHeight ?? 1.15,
    },
  });
  const builder = kit.ParagraphBuilder.MakeFromFontProvider(style, fonts);
  for (const run of runs) {
    builder.pushStyle(
      new kit.TextStyle({
        color: kit.parseColorString(run.color),
        fontFamilies: [opts.family],
        fontSize: opts.size,
        heightMultiplier: opts.lineHeight ?? 1.15,
        shadows: run.glow
          ? [{ color: kit.parseColorString('rgba(245, 197, 24, 0.45)'), offset: [0, 0], blurRadius: opts.size * 0.3 }]
          : undefined,
      })
    );
    builder.addText(run.text);
    builder.pop();
  }
  const p = builder.build();
  p.layout(opts.width);
  builder.delete();
  return p;
}

const WORDMARK: Run[] = [
  { text: 'kori', color: C.ink },
  { text: 'kosmos', color: C.accent, glow: true },
  { text: '.dev', color: C.ink },
];

const PAD = 80;

function drawHomeText(kit: CanvasKit, fonts: TypefaceFontProvider, canvas: Canvas, card: OgCard) {
  // Shrink the wordmark until it fits on one line.
  let size = 128;
  let mark = paragraph(kit, fonts, WORDMARK, { family: FONTS.display.family, size, width: 4000 });
  while (mark.getLongestLine() > OG_WIDTH - PAD * 2 && size > 60) {
    mark.delete();
    size -= 4;
    mark = paragraph(kit, fonts, WORDMARK, { family: FONTS.display.family, size, width: 4000 });
  }
  const markW = mark.getLongestLine();
  const markX = (OG_WIDTH - markW) / 2;

  const tagline = paragraph(kit, fonts, [{ text: card.description, color: C.tag }], {
    family: FONTS.micro.family,
    size: 44,
    width: OG_WIDTH - PAD * 2,
    maxLines: 2,
    center: true,
  });

  const gap = 26;
  const blockH = mark.getHeight() + gap + tagline.getHeight();
  const top = Math.max(PAD, (OG_HEIGHT - blockH) / 2 - 30);
  canvas.drawParagraph(mark, markX, top);
  const taglineY = top + mark.getHeight() + gap;
  canvas.drawParagraph(tagline, PAD, taglineY);

  // The hero typewriter's block cursor. Drawn, not typed: █ isn't in the
  // VT323 latin subset. Sits after the last line, which is centred.
  const lines = tagline.getLineMetrics();
  const last = lines[lines.length - 1];
  if (last) {
    const cursor = new kit.Paint();
    cursor.setColor(kit.parseColorString(C.accent));
    const lineRight = PAD + (OG_WIDTH - PAD * 2 + last.width) / 2;
    const lineTop = taglineY + last.baseline - last.ascent;
    canvas.drawRect(kit.XYWHRect(lineRight + 10, lineTop + 6, 20, last.ascent - 4), cursor);
    cursor.delete();
  }
  mark.delete();
  tagline.delete();
}

function drawPageText(kit: CanvasKit, fonts: TypefaceFontProvider, canvas: Canvas, card: OgCard) {
  const accent = new kit.Paint();
  accent.setAntiAlias(false);
  accent.setColor(kit.parseColorString(C.accent));

  // Header: the pixel bat emblem and the small wordmark, as in the Mandy nav.
  const batScale = 3;
  BAT_ROWS.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === '#') canvas.drawRect(kit.XYWHRect(PAD + x * batScale, 66 + y * batScale, batScale, batScale), accent);
    }
  });
  const mark = paragraph(kit, fonts, WORDMARK, { family: FONTS.display.family, size: 36, width: 800 });
  canvas.drawParagraph(mark, PAD + BAT_ROWS[0].length * batScale + 18, 66 + (BAT_ROWS.length * batScale) / 2 - mark.getHeight() / 2);
  mark.delete();

  // Title: the largest size that fits in two lines beside the signal.
  const textX = PAD + 28;
  const width = 760;
  let title!: Paragraph;
  for (const size of [80, 70, 60, 52]) {
    title?.delete();
    title = paragraph(kit, fonts, [{ text: card.title, color: C.ink }], {
      family: FONTS.display.family,
      size,
      width,
      lineHeight: 1.08,
      maxLines: size === 52 ? 3 : undefined,
    });
    if (title.getLineMetrics().length <= 2) break;
  }
  const titleLines = title.getLineMetrics().length;

  const kicker = card.kicker
    ? paragraph(kit, fonts, [{ text: card.kicker, color: C.tag }], { family: FONTS.micro.family, size: 34, width, maxLines: 1 })
    : undefined;
  const description = paragraph(kit, fonts, [{ text: card.description, color: C.dim }], {
    family: FONTS.body.family,
    size: 30,
    width,
    lineHeight: 1.35,
    maxLines: titleLines >= 3 ? 1 : titleLines === 2 ? 2 : 3,
  });

  const kickerGap = 10;
  const descGap = 20;
  const blockH = (kicker ? kicker.getHeight() + kickerGap : 0) + title.getHeight() + descGap + description.getHeight();
  // Centred in the band between the header and the rooftops.
  const bandTop = 140;
  const bandBottom = 540;
  let y = Math.max(bandTop, bandTop + (bandBottom - bandTop - blockH) / 2);

  // The left rule of a Mandy card, beside the whole block.
  canvas.drawRect(kit.XYWHRect(PAD, y + 4, 6, blockH - 8), accent);

  if (kicker) {
    canvas.drawParagraph(kicker, textX, y);
    y += kicker.getHeight() + kickerGap;
    kicker.delete();
  }
  canvas.drawParagraph(title, textX, y);
  y += title.getHeight() + descGap;
  canvas.drawParagraph(description, textX, y);

  title.delete();
  description.delete();
  accent.delete();
}

/** Renders one card to PNG bytes. */
export async function renderOgCard(card: OgCard): Promise<Uint8Array> {
  const { kit, fonts } = await load();
  const surface = kit.MakeSurface(OG_WIDTH, OG_HEIGHT);
  if (!surface) throw new Error('CanvasKit could not create a surface');
  const canvas = surface.getCanvas();

  drawScene(kit, canvas);
  if (card.home) drawHomeText(kit, fonts, canvas, card);
  else drawPageText(kit, fonts, canvas, card);

  const image = surface.makeImageSnapshot();
  const png = image.encodeToBytes();
  image.delete();
  surface.delete();
  if (!png) throw new Error('CanvasKit could not encode the card');
  return png;
}
