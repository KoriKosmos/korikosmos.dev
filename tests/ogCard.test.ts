import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { PAGE_META, ogImageFor } from '../src/data/pageMeta';
import { OG_HEIGHT, OG_WIDTH, renderOgCard, woffToSfnt } from '../src/lib/ogCard';

const require = createRequire(import.meta.url);

test('woffToSfnt rebuilds a TrueType font from a Fontsource WOFF', async () => {
  const woff = await readFile(require.resolve('@fontsource/vt323/files/vt323-latin-400-normal.woff'));
  const sfnt = Buffer.from(woffToSfnt(woff));
  assert.equal(sfnt.readUInt32BE(0), 0x00010000);
  assert.equal(sfnt.readUInt16BE(4), woff.readUInt16BE(12));
  // Every table record points inside the file.
  for (let i = 0; i < sfnt.readUInt16BE(4); i++) {
    const offset = sfnt.readUInt32BE(12 + i * 16 + 8);
    const length = sfnt.readUInt32BE(12 + i * 16 + 12);
    assert.ok(offset + length <= sfnt.length);
  }
});

test('renderOgCard draws 1200x630 PNGs for page and home cards', async () => {
  for (const card of [
    { title: 'About', description: PAGE_META['/about'].description, kicker: '/about' },
    { home: true, title: 'KoriKosmos', description: PAGE_META['/'].description },
    { title: 'A very long post title that has to shrink to fit beside the signal in two lines', description: 'x '.repeat(200) },
  ]) {
    const png = Buffer.from(await renderOgCard(card));
    assert.equal(png.toString('latin1', 1, 4), 'PNG');
    assert.equal(png.readUInt32BE(16), OG_WIDTH);
    assert.equal(png.readUInt32BE(20), OG_HEIGHT);
  }
});

test('ogImageFor gives fixed pages their own card and everything else the site card', () => {
  assert.equal(ogImageFor('/about'), '/og/page/about.png');
  assert.equal(ogImageFor('/games/tetris/'), '/og/page/games/tetris.png');
  assert.equal(ogImageFor('/'), '/og/site.png');
  assert.equal(ogImageFor('/no-such-page'), '/og/site.png');
  assert.equal(ogImageFor('/blog/some-post'), '/og/site.png');
});
