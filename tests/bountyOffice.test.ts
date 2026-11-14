import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

// public/games/bounty-office/ is written by `npm run sync:bounty`. These check
// the committed copy is whole and still carries the script's two edits.
const DIR = path.join(process.cwd(), 'public', 'games', 'bounty-office');
const html = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8');

test('Bounty Office loads its stylesheet and script by absolute path', () => {
  // /games/bounty-office (no slash) serves the same page, where a relative
  // "styles.css" would resolve to /games/styles.css.
  assert.match(html, /href="\/games\/bounty-office\/styles\.css"/);
  assert.match(html, /<script type="module" src="\/games\/bounty-office\/src\/main\.js">/);
  assert.doesNotMatch(html, /(?:href|src)="(?:styles\.css|src\/main\.js)"/);
});

test('Bounty Office links back to the games page', () => {
  assert.match(html, /<a [^>]*href="\/games\/"[^>]*data-kk-backlink/);
});

test('every module Bounty Office imports was copied', () => {
  const srcDir = path.join(DIR, 'src');
  assert.ok(fs.existsSync(path.join(srcDir, 'main.js')));
  assert.ok(fs.existsSync(path.join(DIR, 'styles.css')));
  for (const file of fs.readdirSync(srcDir).filter(f => f.endsWith('.js'))) {
    const code = fs.readFileSync(path.join(srcDir, file), 'utf8');
    for (const [, spec] of code.matchAll(/from '(\.\/[^']+)'/g)) {
      assert.ok(fs.existsSync(path.join(srcDir, spec)), `${file} imports ${spec}`);
    }
  }
});

test('the copy records where it came from', () => {
  const source = fs.readFileSync(path.join(DIR, 'SOURCE.txt'), 'utf8');
  assert.match(source, /github\.com\/KoriKosmos\/BountyIdle/);
  assert.match(source, /^commit [0-9a-f]{40}$/m);
  assert.ok(fs.existsSync(path.join(DIR, 'LICENSE')));
});
