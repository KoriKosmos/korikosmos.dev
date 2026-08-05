// Generates the artwork layered onto the social/OG cards by src/pages/og/[...route].ts.
//
// Run with `npm run gen:og`. Output is committed to src/assets/og/, so the site
// build never runs this script — same arrangement as scripts/gen-retro-assets.mjs.
//
// Why PNG and not SVG: astro-og-canvas draws the card with CanvasKit, and
// `CanvasKit.MakeImageFromEncoded` has no SVG decoder. The artwork is composed
// here as SVG for legibility and rasterised with sharp before it is committed.
// Nothing in the emitted SVG uses <text> — a text element would be rendered by
// librsvg against whatever fonts happen to be installed, which is exactly the
// system dependency the vendored TTFs in src/fonts/ exist to avoid.
//
// Everything is drawn from a seeded PRNG so re-running produces byte-identical
// files. Without that, every run would dirty the working tree with a new star
// layout and the committed output would be meaningless as a diff.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const OUT_DIR = fileURLToPath(new URL('../src/assets/og/', import.meta.url));

const WIDTH = 1200;
const HEIGHT = 630;

/**
 * mulberry32 — small, fast, and good enough for scattering stars. The point is
 * reproducibility, not statistical quality.
 */
function makeRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * How brightly a star at (x, y) is allowed to burn.
 *
 * The card's text is drawn on top of this artwork, top-left, in a block roughly
 * 984px wide starting ~200px down (astro-og-canvas pins the paragraph near the
 * top — see the minTop/maxTop clamp in its generateOpenGraphImage). Stars are
 * dimmed inside that region so they read as depth behind the headline rather
 * than as noise competing with it, and are left at full strength toward the
 * bottom-right, which is the dead space the old card left empty.
 */
function brightnessAt(x, y) {
  const tx = Math.min(1, Math.max(0, (x - 120) / 900));
  const ty = Math.min(1, Math.max(0, (y - 150) / 380));
  // Distance from the text block's centre of mass, normalised and softened.
  const shelter = (1 - tx * 0.55) * (1 - ty * 0.55);
  return 0.28 + 0.72 * (1 - shelter);
}

const STAR_COUNT = 130;
const LINK_DISTANCE = 165;
const MAX_LINKS_PER_STAR = 2;

function buildStars(random) {
  const stars = [];
  let guard = 0;

  while (stars.length < STAR_COUNT && guard++ < STAR_COUNT * 40) {
    const x = random() * WIDTH;
    const y = random() * HEIGHT;

    // Rejection-sample against brightness so the field is genuinely sparser
    // behind the text, not merely dimmer there.
    if (random() > 0.35 + 0.65 * brightnessAt(x, y)) continue;

    // A minimum separation stops clumps that read as smudges once blurred.
    if (stars.some(s => Math.hypot(s.x - x, s.y - y) < 26)) continue;

    stars.push({
      x,
      y,
      radius: 0.9 + random() * 2.1,
      // A minority of stars take the accent colour and a soft halo.
      accent: random() < 0.18,
      brightness: brightnessAt(x, y),
    });
  }

  return stars;
}

/**
 * Connect each star to its nearest neighbours within LINK_DISTANCE. Capping the
 * degree keeps the result reading as constellations rather than as a mesh.
 */
function buildLinks(stars) {
  const links = [];
  const degree = new Map(stars.map(s => [s, 0]));

  for (const star of stars) {
    if (degree.get(star) >= MAX_LINKS_PER_STAR) continue;

    const candidates = stars
      .filter(other => other !== star && degree.get(other) < MAX_LINKS_PER_STAR)
      .map(other => ({ other, distance: Math.hypot(other.x - star.x, other.y - star.y) }))
      .filter(({ distance }) => distance < LINK_DISTANCE)
      .sort((a, b) => a.distance - b.distance);

    for (const { other, distance } of candidates) {
      if (degree.get(star) >= MAX_LINKS_PER_STAR) break;
      if (links.some(l => (l.a === star && l.b === other) || (l.a === other && l.b === star))) continue;

      links.push({ a: star, b: other, distance });
      degree.set(star, degree.get(star) + 1);
      degree.set(other, degree.get(other) + 1);
    }
  }

  return links;
}

const round = n => Math.round(n * 100) / 100;

function buildSvg(stars, links, accent) {
  const parts = [];

  // Links first so stars sit on top of their own connections.
  for (const { a, b, distance } of links) {
    // Fade with length: a long line at full strength dominates the composition.
    const falloff = 1 - distance / LINK_DISTANCE;
    const opacity = round(Math.min(a.brightness, b.brightness) * falloff * 0.32);
    if (opacity < 0.02) continue;
    parts.push(
      `<line x1="${round(a.x)}" y1="${round(a.y)}" x2="${round(b.x)}" y2="${round(b.y)}" ` +
        `stroke="${accent}" stroke-width="1.1" stroke-opacity="${opacity}"/>`
    );
  }

  for (const star of stars) {
    const color = star.accent ? accent : '#e8ecf4';

    if (star.accent) {
      // A wide, very faint disc stands in for a glow. An SVG blur filter would
      // work too, but librsvg's filter output is not stable across versions and
      // this file's whole reason for being committed is that it never changes.
      parts.push(
        `<circle cx="${round(star.x)}" cy="${round(star.y)}" r="${round(star.radius * 4.5)}" ` +
          `fill="${accent}" fill-opacity="${round(star.brightness * 0.1)}"/>`
      );
    }

    parts.push(
      `<circle cx="${round(star.x)}" cy="${round(star.y)}" r="${round(star.radius)}" ` +
        `fill="${color}" fill-opacity="${round(star.brightness * (star.accent ? 0.95 : 0.8))}"/>`
    );
  }

  // A soft accent bloom anchored off the bottom-right corner, so the half of the
  // card the text never reaches has some tonal movement of its own.
  const bloom =
    `<radialGradient id="bloom" cx="0.5" cy="0.5" r="0.5">` +
    `<stop offset="0" stop-color="${accent}" stop-opacity="0.22"/>` +
    `<stop offset="1" stop-color="${accent}" stop-opacity="0"/>` +
    `</radialGradient>`;

  // A scrim down the left edge, under the stars. The title can be one line or
  // four depending on the entry, so rather than trying to keep the field clear
  // of wherever the text lands, the whole column it can occupy is darkened.
  // Drawn before the stars, so it deepens the background without dimming them —
  // which also gives the card a consistent lit-from-the-right read.
  const scrim =
    `<linearGradient id="scrim" x1="0" y1="0" x2="1" y2="0">` +
    `<stop offset="0" stop-color="#05070f" stop-opacity="0.55"/>` +
    `<stop offset="0.45" stop-color="#05070f" stop-opacity="0.28"/>` +
    `<stop offset="1" stop-color="#05070f" stop-opacity="0"/>` +
    `</linearGradient>`;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" ` +
    `viewBox="0 0 ${WIDTH} ${HEIGHT}">` +
    `<defs>${bloom}${scrim}</defs>` +
    `<circle cx="${WIDTH - 90}" cy="${HEIGHT - 40}" r="420" fill="url(#bloom)"/>` +
    `<rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="url(#scrim)"/>` +
    `${parts.join('')}</svg>`
  );
}

// One starfield per card family. The geometry is shared (same seed) so every
// card is recognisably the same site; only the accent changes, which is what
// makes blog, portfolio, and site cards tell apart in a chat scrollback.
const VARIANTS = [
  { name: 'starfield-site', accent: '#818cf8' },
  { name: 'starfield-blog', accent: '#38bdf8' },
  { name: 'starfield-portfolio', accent: '#c084fc' },
];

// The site mark, matching public/favicon.svg but with the fill fixed. The
// favicon switches fill via prefers-color-scheme, which means nothing to a
// rasteriser — the card is always dark, so the mark is always light.
const MARK_PATH =
  'M50.4 78.5a75.1 75.1 0 0 0-28.5 6.9l24.2-65.7c.7-2 1.9-3.2 3.4-3.2h29c1.5 0 2.7 1.2 3.4 3.2l24.2 65.7s-11.6-7-28.5-7L67 45.5' +
  'c-.4-1.7-1.6-2.8-2.9-2.8-1.3 0-2.5 1.1-2.9 2.7L50.4 78.5Zm-1.1 28.2Zm-4.2-20.2c-2 6.6-.6 15.8 4.2 20.2a17.5 17.5 0 0 1 .2-.7' +
  ' 5.5 5.5 0 0 1 5.7-4.5c2.8.1 4.3 1.5 4.7 4.7.2 1.1.2 2.3.2 3.5v.4c0 2.7.7 5.2 2.2 7.4a13 13 0 0 0 5.7 4.9v-.3l-.2-.3' +
  'c-1.8-5.6-.5-9.5 4.4-12.8l1.5-1a73 73 0 0 0 3.2-2.2 16 16 0 0 0 6.8-11.4c.3-2 .1-4-.6-6l-.8.6-1.6 1a37 37 0 0 1-22.4 2.7' +
  'c-5-.7-9.7-2-13.2-6.2Z';

function buildMarkSvg() {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">` +
    `<path d="${MARK_PATH}" fill="#f3f4f6"/></svg>`
  );
}

async function writePng(name, svg, width, height) {
  const file = path.join(OUT_DIR, `${name}.png`);
  const png = await sharp(Buffer.from(svg), { density: 288 })
    .resize(width, height)
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();
  await fs.writeFile(file, png);
  return { file, bytes: png.length };
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  // Same seed for every variant: shared geometry, different accent.
  const stars = buildStars(makeRandom(0x4b4f5249));
  const links = buildLinks(stars);

  const written = [];
  for (const { name, accent } of VARIANTS) {
    written.push(await writePng(name, buildSvg(stars, links, accent), WIDTH, HEIGHT));
  }
  written.push(await writePng('mark', buildMarkSvg(), 128, 128));

  for (const { file, bytes } of written) {
    console.log(`${path.relative(process.cwd(), file)}  ${(bytes / 1024).toFixed(1)} kB`);
  }
  console.log(`\n${stars.length} stars, ${links.length} links`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
