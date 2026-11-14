// Copies Bounty Office (https://github.com/KoriKosmos/BountyIdle) into
// public/games/bounty-office/, where the site serves it as a standalone page.
//
//   npm run sync:bounty                 # latest main
//   npm run sync:bounty -- <ref>        # a branch, tag or commit
//   npm run sync:bounty -- --from <dir> # a local checkout instead of GitHub
//
// The game is plain HTML, CSS and ES modules with no build step, so this is a
// copy, not a build. Output is committed (like public/retro/), so the site
// build never needs the network or the game's repo. The only change to the
// game's files is in index.html: one link in its status bar back to /games
// (marked data-kk-backlink) and absolute paths for its stylesheet and script.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = 'https://github.com/KoriKosmos/BountyIdle';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public', 'games', 'bounty-office');

// Everything the page loads, plus the licence (AGPL: the source link in
// SOURCE.txt and the licence travel with the copy).
const FILES = ['index.html', 'styles.css', 'LICENSE'];
const DIRS = ['src'];

const BACKLINK =
  '<a class="status-item link" href="/games/" data-kk-backlink style="color: inherit">&larr; korikosmos.dev</a>';
const SPACER = '<span class="status-spacer"></span>';

function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

function checkout(ref) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bounty-office-'));
  if (ref) {
    git(['init', '-q'], dir);
    git(['remote', 'add', 'origin', REPO], dir);
    git(['fetch', '-q', '--depth', '1', 'origin', ref], dir);
    git(['checkout', '-q', 'FETCH_HEAD'], dir);
  } else {
    git(['clone', '-q', '--depth', '1', REPO, dir]);
  }
  return dir;
}

const args = process.argv.slice(2);
const fromIdx = args.indexOf('--from');
const local = fromIdx >= 0 ? path.resolve(args[fromIdx + 1]) : null;
const ref = local ? null : args[0] ?? null;
const src = local ?? checkout(ref);

const commit = git(['rev-parse', 'HEAD'], src);
const dirty = local ? git(['status', '--porcelain'], src) !== '' : false;

for (const file of [...FILES, ...DIRS]) {
  if (!fs.existsSync(path.join(src, file))) {
    throw new Error(`${file} is missing from the game checkout at ${src}`);
  }
}

let html = fs.readFileSync(path.join(src, 'index.html'), 'utf8');
if (!html.includes(SPACER)) {
  throw new Error('The game\'s status bar changed: no status-spacer to put the back link before.');
}
html = html.replace(SPACER, `${BACKLINK}\n        ${SPACER}`);

// The server answers /games/bounty-office without the trailing slash too, and
// there a relative "styles.css" would resolve to /games/styles.css. Pin the
// page's two entry points; the ES modules import each other relative to their
// own URL, so they need nothing.
for (const asset of ['styles.css', 'src/main.js']) {
  const attr = new RegExp(`((?:href|src)=")${asset.replace('.', '\\.')}"`);
  if (!attr.test(html)) throw new Error(`index.html no longer references ${asset}`);
  html = html.replace(attr, `$1/games/bounty-office/${asset}"`);
}

// Write in place and prune, rather than deleting the folder, so a running
// `astro dev` keeps serving it.
const written = new Set();
function write(rel, data) {
  const dest = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, data);
  written.add(path.normalize(rel));
}

write('index.html', html);
for (const file of FILES.filter(f => f !== 'index.html')) {
  write(file, fs.readFileSync(path.join(src, file)));
}
for (const dir of DIRS) {
  for (const entry of fs.readdirSync(path.join(src, dir), { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const rel = path.relative(src, path.join(entry.parentPath, entry.name));
    write(rel, fs.readFileSync(path.join(src, rel)));
  }
}
write(
  'SOURCE.txt',
  `Bounty Office, copied from ${REPO}\ncommit ${commit}${dirty ? ' (with uncommitted local changes)' : ''}\n` +
    'Regenerate with `npm run sync:bounty`; do not edit these files by hand.\n',
);

for (const entry of fs.readdirSync(OUT, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile()) continue;
  const rel = path.normalize(path.relative(OUT, path.join(entry.parentPath, entry.name)));
  if (!written.has(rel)) fs.rmSync(path.join(OUT, rel));
}

if (!local) fs.rmSync(src, { recursive: true, force: true });
console.log(`Bounty Office ${commit.slice(0, 7)} → ${path.relative(ROOT, OUT)} (${written.size} files)`);
