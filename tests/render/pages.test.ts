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

// `skin: null` sends no kk-skin cookie at all, i.e. a first-time visitor.
async function render(path: string, skin: 'modern' | 'retro' | 'mandy' | null, theme?: string, extraCookie = '') {
  const cookies = [skin === null ? null : `kk-skin=${skin}`, 'kk-seen=1',
    theme === undefined ? null : `kk-theme=${encodeURIComponent(theme)}`, extraCookie || null].filter(Boolean);
  const response = await app.render(new Request(`https://korikosmos.dev${path}`, {
    headers: { cookie: cookies.join('; ') },
  }));
  return { response, document: new JSDOM(await response.text()).window.document };
}

for (const skin of ['modern', 'retro', 'mandy'] as const) {
  test(`${skin}: shareable search, ordering, and empty results work without client scripts`, async () => {
    const blog = await render('/blog?q=homelab&sort=oldest', skin);
    assert.equal(blog.response.status, 200);
    assert.equal(blog.document.querySelector<HTMLInputElement>('main input[name="q"]')?.value, 'homelab');
    assert.match(blog.document.querySelector('main')?.textContent ?? '', /\d+ of \d+ posts/);
    assert.ok(blog.document.querySelector('main a[href="/blog/rebuilding-react-islands/"]'));

    const sorted = await render('/blog?sort=oldest', skin);
    const cards = [...sorted.document.querySelectorAll('main a[href^="/blog/"]')];
    assert.equal(cards[0]?.getAttribute('href'), '/blog/rebuilding-react-islands/');

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
    assert.ok(document.querySelector('form textarea[id^="comment-body-"]'), 'Every skin renders the comment form');
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

  test(`${skin}: Bounty Office is linked from the games index and the Play menu`, async () => {
    const { document } = await render('/games', skin);
    assert.ok(document.querySelector('main a[href="/games/bounty-office/"]'), 'listed on /games');
    // A standalone document: the modern skin must not ClientRouter-swap into it.
    const links = [...document.querySelectorAll('a[href="/games/bounty-office/"]')];
    assert.ok(links.length >= 2, 'linked from the nav too');
    if (skin === 'modern') {
      assert.ok(links.every(link => link.hasAttribute('data-astro-reload')), 'every modern link forces a full load');
    }
  });

  test(`${skin}: Tetris renders its board, start screen, and controls without a blocking prompt`, async () => {
    const game = await render('/games/tetris', skin);
    assert.equal(game.response.status, 200);
    const main = game.document.querySelector('main')!;
    assert.equal(main.querySelector('h1')?.textContent, 'Tetris');
    for (const id of ['board', 'next', 'hold', 'score', 'level', 'lines', 'highscore', 'leaderboard']) {
      assert.ok(main.querySelector(`#${id}`), `#${id} is present for the island and the retro restyle`);
    }
    assert.match(main.textContent ?? '', /Start game/);
    assert.equal(main.querySelector('dialog[open]'), null, 'No modal opens before the visitor asks to play');
    assert.equal(main.querySelectorAll('.kk-tetris-pad button').length, 7);
    const legend = main.querySelector('section[aria-labelledby="tetris-controls"]');
    assert.ok(legend, 'a visible controls legend, not a collapsed one');
    assert.equal(legend!.closest('details'), null);
    assert.match(legend!.textContent ?? '', /Hard drop/);
    assert.equal(legend!.querySelectorAll('.kk-tetris-keys kbd').length, 11);
  });

  test(`${skin}: music pages survive an unavailable upstream`, async () => {
    assert.equal((await render('/tunes', skin)).response.status, 200);
    assert.equal((await render('/now', skin)).response.status, 200);
  });
}

test('mandy: first-time visitors get Mandy mode, and a chosen skin sticks', async () => {
  const fresh = await render('/', null);
  assert.equal(fresh.document.documentElement.getAttribute('data-skin'), 'mandy');
  assert.equal(fresh.document.documentElement.getAttribute('data-theme'), 'mandy-gotham');
  for (const skin of ['modern', 'retro'] as const) {
    assert.equal((await render('/', skin)).document.documentElement.getAttribute('data-skin'), skin);
  }
  const bogus = await render('/', null, undefined, 'kk-skin=nonsense');
  assert.equal(bogus.document.documentElement.getAttribute('data-skin'), 'mandy');
});

test('mandy: the sub-theme comes from its cookie, server-side, with a safe fallback', async () => {
  const kanto = await render('/about', 'mandy', undefined, 'kk-mandy-theme=kanto');
  assert.equal(kanto.document.documentElement.getAttribute('data-theme'), 'mandy-kanto');
  const bogus = await render('/about', 'mandy', undefined, 'kk-mandy-theme=<script>');
  assert.equal(bogus.document.documentElement.getAttribute('data-theme'), 'mandy-gotham');
});

test('mandy: every nav dropdown link is reachable without JavaScript', async () => {
  const { document } = await render('/', 'mandy');
  const menus = [...document.querySelectorAll('nav[aria-label="Primary"] .md-nav__menu')];
  assert.ok(menus.length >= 3, 'Me, Work and Play render as dropdowns');
  for (const menu of menus) {
    // A native <details> opens on its own; a [hidden] panel would need JS.
    assert.equal(menu.parentElement?.tagName, 'DETAILS');
    assert.equal(menu.parentElement?.firstElementChild?.tagName, 'SUMMARY');
    assert.equal(menu.closest('[hidden]'), null);
    assert.ok(menu.querySelectorAll('a[href]').length > 0);
  }
  assert.ok(document.querySelector('nav[aria-label="Primary"] a[href="/games/tetris"]'));
});

test('retro: newest-post decorations and site totals survive filtering and sorting', async () => {
  const index = await render('/blog', 'retro');
  const summary = 'main .rt-inset.rt-mono.rt-small';
  const badge = 'main article img[alt="New!"]';
  const newestHref = index.document.querySelector(badge)?.closest('article')?.querySelector('h2 a')?.getAttribute('href');
  assert.ok(newestHref);
  const originalSummary = index.document.querySelector(summary)?.textContent;
  assert.match(originalSummary ?? '', /most recent update/);

  for (const query of ['q=hello', 'q=unfindableword', 'sort=oldest', 'q=homelab']) {
    const { document } = await render(`/blog?${query}`, 'retro');
    assert.equal(document.querySelector(summary)?.textContent, originalSummary);
    const articles = [...document.querySelectorAll('main article')];
    for (const article of articles) {
      const isNewest: boolean = article.querySelector('h2 a')?.getAttribute('href') === newestHref;
      assert.equal(Boolean(article.querySelector('img[alt="New!"]')), isNewest);
      assert.equal(article.textContent?.includes('Hot off the modem!'), isNewest);
    }
    assert.equal(document.querySelectorAll(badge).length, articles.some((article): boolean =>
      article.querySelector('h2 a')?.getAttribute('href') === newestHref) ? 1 : 0);
  }
});

test('score API refuses cross-site posts and unknown games', async () => {
  const post = (path: string, headers: Record<string, string>) => app.render(new Request(`https://korikosmos.dev${path}`, {
    method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify({ name: 'x', score: 1 }),
  }));
  assert.equal((await post('/api/scores/tetris', { origin: 'https://evil.example', 'sec-fetch-site': 'cross-site' })).status, 403);
  assert.equal((await post('/api/scores/tetris', {})).status, 403, 'No Origin means no browser');
  assert.equal((await post('/api/scores/pong', { 'sec-fetch-site': 'same-origin' })).status, 404);
  const list = await app.render(new Request('https://korikosmos.dev/api/scores/tetris'));
  assert.equal(list.status, 200);
  assert.ok(Array.isArray(await list.json()));
});

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

test('modern: saved themes render in the initial HTML without running scripts', async () => {
  const cases = [
    ['dark', 'dark'], ['light', 'light'], ['forest', 'forest'],
    ['spider-man', 'spider-man'], ['batman', 'batman'],
    ['spiderman', 'spider-man'], ['unknown', 'dark'], [undefined, 'dark'],
  ];
  for (const [cookie, expected] of cases) {
    const { response, document } = await render('/blog', 'modern', cookie);
    assert.equal(response.status, 200);
    assert.equal(document.documentElement.getAttribute('data-theme'), expected);
    assert.ok(document.querySelector('head script[data-cfasync="false"]'));
  }
});

test('modern: the generated theme script migrates storage and restores themes after stale page swaps', async () => {
  const { document } = await render('/blog', 'modern', 'forest');
  const script = document.querySelector('head script[data-cfasync="false"]')?.textContent;
  assert.ok(script);
  const dom = new JSDOM(document.documentElement.outerHTML, { url: 'https://korikosmos.dev/blog', runScripts: 'outside-only' });
  const win = dom.window;
  try {
    win.localStorage.setItem('theme', 'spiderman');
    win.eval(script);
    assert.equal(win.document.documentElement.getAttribute('data-theme'), 'spider-man');
    assert.equal(win.localStorage.getItem('theme'), 'spider-man');
    assert.match(win.document.cookie, /kk-theme=spider-man/);
    win.localStorage.setItem('theme', 'batman');
    win.document.documentElement.setAttribute('data-theme', 'dark');
    win.document.dispatchEvent(new win.Event('astro:after-swap'));
    assert.equal(win.document.documentElement.getAttribute('data-theme'), 'batman');
    assert.match(win.document.cookie, /kk-theme=batman/);
  } finally {
    win.close();
  }
});

test('modern: blocked local storage preserves the cookie choice through stale page swaps', async () => {
  const { document } = await render('/blog', 'modern', 'forest');
  const script = document.querySelector('head script[data-cfasync="false"]')?.textContent;
  assert.ok(script);
  const dom = new JSDOM(document.documentElement.outerHTML, { url: 'https://korikosmos.dev/blog', runScripts: 'outside-only' });
  const win = dom.window;
  try {
    Object.defineProperty(win, 'localStorage', { get() { throw new Error('Storage blocked'); } });
    win.document.cookie = 'kk-theme=forest; path=/';
    assert.doesNotThrow(() => win.eval(script));
    assert.equal(win.document.documentElement.getAttribute('data-theme'), 'forest');
    win.document.cookie = 'kk-theme=batman; path=/';
    win.document.documentElement.setAttribute('data-theme', 'dark');
    win.document.dispatchEvent(new win.Event('astro:after-swap'));
    assert.equal(win.document.documentElement.getAttribute('data-theme'), 'batman');
    assert.match(win.document.cookie, /kk-theme=batman/);
  } finally {
    win.close();
  }
});

test('retro: the generated theme script restores its own scheme and tolerates blocked storage', async () => {
  const { document } = await render('/blog', 'retro', 'batman');
  assert.equal(document.documentElement.getAttribute('data-retro-theme'), 'y2k');
  assert.equal(document.documentElement.hasAttribute('data-theme'), false);
  const script = document.querySelector('head script[data-cfasync="false"]')?.textContent;
  assert.ok(script);
  const dom = new JSDOM(document.documentElement.outerHTML, { url: 'https://korikosmos.dev/blog', runScripts: 'outside-only' });
  const win = dom.window;
  try {
    win.localStorage.setItem('retro-theme', 'cyber');
    win.eval(script);
    assert.equal(win.document.documentElement.getAttribute('data-retro-theme'), 'cyber');
    win.localStorage.setItem('retro-theme', 'unknown');
    win.eval(script);
    assert.equal(win.document.documentElement.getAttribute('data-retro-theme'), 'y2k');
    Object.defineProperty(win, 'localStorage', { get() { throw new Error('Storage blocked'); } });
    assert.doesNotThrow(() => win.eval(script));
    assert.equal(win.document.documentElement.getAttribute('data-retro-theme'), 'y2k');
  } finally {
    win.close();
  }
});

test('every skin points link previews at a social card that the build generated', async () => {
  const cases = [
    ['/', '/og/site.png'],
    ['/about', '/og/page/about.png'],
    ['/games/tetris', '/og/page/games/tetris.png'],
    ['/blog/rebuilding-react-islands', '/og/blog/rebuilding-react-islands.png'],
  ] as const;
  for (const skin of ['modern', 'retro', 'mandy', null] as const) {
    for (const [path, card] of cases) {
      const { document } = await render(path, skin);
      const image = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
      assert.equal(image, `https://korikosmos.dev${card}`, `${skin ?? 'default'} ${path}`);
      await readFile(new URL(`../../dist/client${card}`, import.meta.url));
    }
  }
  // A cookieless crawler gets Mandy mode, whose embed stripe matches the cards.
  const { document } = await render('/about', null);
  assert.equal(document.querySelector('meta[name="theme-color"]')?.getAttribute('content'), '#F5C518');
});
