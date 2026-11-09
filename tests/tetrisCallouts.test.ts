import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { CALLOUT_MAX_MS } from '../src/page-components/Tetris';

const css = (name: string) => readFile(new URL(`../src/styles/${name}`, import.meta.url), 'utf8');

/** The body of the first `@media (prefers-reduced-motion: reduce)` block that contains `marker`. */
function reducedMotionBlock(source: string, marker: string): string {
  let from = 0;
  for (;;) {
    const start = source.indexOf('@media (prefers-reduced-motion: reduce)', from);
    assert.ok(start >= 0, `no reduced-motion block contains ${marker}`);
    let depth = 0;
    let end = source.indexOf('{', start);
    for (let i = end; i < source.length; i++) {
      if (source[i] === '{') depth++;
      else if (source[i] === '}' && --depth === 0) { end = i; break; }
    }
    const block = source.slice(start, end + 1);
    if (block.includes(marker)) return block;
    from = end + 1;
  }
}

// retro.css kills every animation and mandy.css shrinks them to 0.001ms under
// reduced motion. Either would leave callouts stale (no animationend) or
// unreadable, so each skin must hand the callout its still fade back.
for (const [file, blanket] of [['retro.css', 'animation: none !important'], ['mandy.css', 'animation-duration: 0.001ms !important']] as const) {
  test(`${file}: reduced motion keeps the Tetris callout's still fade`, async () => {
    const block = reducedMotionBlock(await css(file), blanket);
    assert.match(block, /\.kk-tetris-callout\s*\{\s*animation:\s*kk-tetris-callout-still[^;]*!important/);
  });
}

test('the still-fade keyframes exist outside any media query', async () => {
  const global = await css('global.css');
  const at = global.indexOf('@keyframes kk-tetris-callout-still');
  assert.ok(at >= 0);
  const before = global.slice(0, at);
  const opens = (before.match(/\{/g) ?? []).length;
  const closes = (before.match(/\}/g) ?? []).length;
  assert.equal(opens, closes, 'not nested inside @media, so every skin can use it');
});

test('the callout removal timer outlasts every callout animation', async () => {
  const global = await css('global.css');
  const durations = [...global.matchAll(/kk-tetris-(?:pop|slam|rise|callout-still)\s+([\d.]+)s|(?<=\.kk-tetris-callout[^{]*\{[^}]*)animation-duration:\s*([\d.]+)s/g)]
    .map(m => parseFloat(m[1] ?? m[2]) * 1000);
  assert.ok(durations.length >= 4, 'found the callout animations');
  assert.ok(CALLOUT_MAX_MS > Math.max(...durations), `${CALLOUT_MAX_MS}ms must exceed ${Math.max(...durations)}ms`);
});
