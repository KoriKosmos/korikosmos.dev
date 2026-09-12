import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test, { mock } from 'node:test';
import { App } from 'astro/app';
import { JSDOM } from 'jsdom';

// Exercise the real production routes in-process, without a listening socket.
process.env.ASTRO_NODE_AUTOSTART = 'disabled';
// Keep this suite independent of credentials and the live Last.fm service.
mock.method(globalThis, 'fetch', async () => Response.json({ error: 'offline fixture' }, { status: 503 }));
const build = new URL('../../dist/server/', import.meta.url);
await import(new URL('entry.mjs', build).href);
const entry = await readFile(new URL('entry.mjs', build), 'utf8');
const manifestFile = entry.match(/from ['"]\.\/(manifest_[^'"]+\.mjs)['"]/)?.[1];
assert.ok(manifestFile, 'Run npm run build before the production render checks.');
const { manifest } = await import(new URL(manifestFile, build).href);
const app = new App(manifest);

async function render(path: string, skin: 'modern' | 'retro') {
  const response = await app.render(new Request(`https://korikosmos.dev${path}`, {
    headers: { cookie: `kk-skin=${skin}; kk-seen=1` },
  }));
  return { response, document: new JSDOM(await response.text()).window.document };
}

for (const skin of ['modern', 'retro'] as const) {
  test(`${skin}: shareable search, ordering, and empty results work without client scripts`, async () => {
    const blog = await render('/blog?q=homelab&sort=oldest', skin);
    assert.equal(blog.response.status, 200);
    assert.equal(blog.document.querySelector<HTMLInputElement>('input[name="q"]')?.value, 'homelab');
    assert.match(blog.document.querySelector('main')?.textContent ?? '', /\d+ of \d+ posts/);
    assert.ok(blog.document.querySelector('main a[href="/blog/rebuilding-react-islands/"]'));

    const sorted = await render('/blog?sort=oldest', skin);
    const cards = [...sorted.document.querySelectorAll('main a[href^="/blog/"]')];
    assert.equal(cards[0]?.getAttribute('href'), '/blog/hello-world/');

    const portfolio = await render('/portfolio?source=github&q=astro', skin);
    assert.match(portfolio.document.querySelector('main')?.textContent ?? '', /\d+ of \d+ projects/);
    assert.ok(portfolio.document.querySelector('main a[href="/portfolio/korikosmos-dev/"]'));

    const empty = await render('/blog?q=unfindableword', skin);
    assert.match(empty.document.querySelector('main')?.textContent ?? '', /No matches yet/);
    assert.doesNotMatch(empty.document.querySelector('main')?.textContent ?? '', /No posts yet/);
  });

  test(`${skin}: article headings, metadata, and missing-post status render correctly`, async () => {
    const { response, document } = await render('/blog/rebuilding-react-islands', skin);
    assert.equal(response.status, 200);
    assert.match(document.querySelector('main')?.textContent ?? '', /min read/);
    const links = [...document.querySelectorAll('nav[aria-label="On this page"] a')];
    assert.ok(links.length > 1);
    for (const link of links) {
      assert.ok(document.getElementById(link.getAttribute('href')!.slice(1)), 'Every contents link has a real destination');
    }
    assert.ok(document.querySelector('[data-reader-content]'));
    assert.equal((await render('/blog/does-not-exist', skin)).response.status, 404);
  });

  test(`${skin}: Star Pairs renders a stable start screen and is discoverable`, async () => {
    const game = await render('/games/star-pairs', skin);
    assert.equal(game.response.status, 200);
    assert.equal(game.document.querySelector('main h1')?.textContent, 'Star Pairs');
    assert.match(game.document.querySelector('main')?.textContent ?? '', /Start game/);
    assert.equal(game.document.querySelectorAll('.star-pairs-card').length, 0, 'No random board during SSR');
    const games = await render('/games', skin);
    assert.ok(games.document.querySelector('main a[href="/games/star-pairs/"]'));
  });

  test(`${skin}: music pages survive an unavailable upstream`, async () => {
    assert.equal((await render('/tunes', skin)).response.status, 200);
    assert.equal((await render('/now', skin)).response.status, 200);
  });
}

test('music API rejects malformed requests and does not cache upstream failures', async () => {
  for (const query of ['limit=-1', 'limit=10000', 'period=invalid', 'method=unknown']) {
    const { response } = await render(`/api/lastfm?${query}`, 'modern');
    assert.equal(response.status, 400);
    assert.equal(response.headers.get('cache-control'), 'no-store');
  }
  const { response } = await render('/api/lastfm?method=recent&limit=10', 'modern');
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('retry-after'), '30');
});
