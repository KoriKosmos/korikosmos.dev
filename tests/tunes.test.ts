import assert from 'node:assert/strict';
import test from 'node:test';
import { act, createElement } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import { Tunes } from '../src/page-components/Tunes';
import type { LastfmTrack } from '../src/lib/lastfmTypes';
import { setupDom } from './dom';

const track: LastfmTrack = {
  name: 'Same song', artist: { '#text': 'Artist' }, album: { '#text': 'Album' }, image: [], '@attr': { nowplaying: 'true' },
};
const props = { recentTracks: [track], initialArtists: [], initialAlbums: [] };
const button = (name: string) => [...document.querySelectorAll('button')].find(button => button.textContent?.trim() === name)!;

test('Tunes renders artist-name fallbacks in the hero and history', () => {
  const recentTracks: LastfmTrack[] = [
    { ...track, artist: { name: 'Hero artist' } },
    { ...track, artist: { '#text': '', name: 'History artist' } },
    { ...track, artist: { '#text': 'Primary credit', name: 'Fallback credit' } },
  ];
  const env = setupDom(renderToStaticMarkup(createElement(Tunes, { ...props, recentTracks })));
  try {
    assert.match(document.querySelector('section')?.textContent ?? '', /Hero artist/);
    const history = document.querySelectorAll('section')[1].textContent ?? '';
    assert.match(history, /History artist/);
    assert.match(history, /Primary credit/);
    assert.doesNotMatch(history, /Fallback credit/);
  } finally {
    env.cleanup();
  }
});

test('a late response from an old period cannot overwrite the current chart', async t => {
  const env = setupDom();
  const root = createRoot(document.getElementById('root')!);
  const requests: { url: string; signal: AbortSignal | null | undefined; resolve: (response: Response) => void }[] = [];
  t.mock.method(globalThis, 'fetch', (input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>(resolve => {
    requests.push({ url: String(input), signal: init?.signal, resolve });
  }));
  try {
    await act(async () => { root.render(createElement(Tunes, props)); });
    assert.equal(requests.length, 2, 'Only the visible period loads');
    await act(async () => { button('Last Week').click(); });
    assert.equal(requests.length, 4);
    assert.ok(requests[0].signal?.aborted, 'Previous selection is aborted');
    const reply = (request: typeof requests[number], prefix: string) => request.resolve(Response.json(
      request.url.includes('method=artists')
        ? [{ name: `${prefix} Artist`, url: 'https://example.com', image: [] }]
        : [{ name: `${prefix} Album`, artist: { name: 'Artist' }, url: 'https://example.com', image: [] }],
    ));
    await act(async () => { requests.slice(2).forEach(request => reply(request, 'Weekly')); });
    assert.match(document.body.textContent ?? '', /Weekly Artist/);
    // Deliberately resolve the ignored transport even though it was aborted.
    await act(async () => { requests.slice(0, 2).forEach(request => reply(request, 'Old')); });
    assert.match(document.body.textContent ?? '', /Weekly Artist/);
    assert.doesNotMatch(document.body.textContent ?? '', /Old Artist|Old Album/);
    assert.equal(button('Last Week').getAttribute('aria-pressed'), 'true');
  } finally {
    await act(async () => { root.unmount(); });
    env.cleanup();
  }
});

test('polling updates the playing flag for the same track and refreshes history', async t => {
  const env = setupDom();
  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const urls: string[] = [];
  t.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL) => {
    urls.push(String(input));
    return Response.json(String(input).includes('method=recent')
      ? [{ ...track, '@attr': { nowplaying: 'false' } }, { ...track, name: 'Fresh history' }]
      : []);
  });
  const root = createRoot(document.getElementById('root')!);
  try {
    await act(async () => { root.render(createElement(Tunes, props)); });
    assert.equal(document.querySelector('h2')?.textContent, 'Currently Vibing To');
    await act(async () => { t.mock.timers.tick(30_000); });
    assert.equal(document.querySelector('h2')?.textContent, 'Last Listened');
    assert.equal(document.querySelector('h1')?.textContent, 'Same song');
    assert.match(document.body.textContent ?? '', /Fresh history/);
    assert.equal(urls.length, 3, 'No speculative chart prefetching');
    assert.equal(urls[2], '/api/lastfm?method=recent&limit=10', 'No cache-busting timestamp');
    assert.equal(document.querySelector('img')?.getAttribute('src'), '/placeholder-music.svg');
  } finally {
    await act(async () => { root.unmount(); });
    t.mock.timers.reset();
    env.cleanup();
  }
});

test('hidden tabs abort active polls, stop scheduling, and refresh on return', async t => {
  const env = setupDom();
  Object.defineProperty(document, 'hidden', { configurable: true, writable: true, value: false });
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const polls: AbortSignal[] = [];
  t.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    if (!String(input).includes('method=recent')) return Response.json([]);
    polls.push(init!.signal!);
    return new Promise<Response>(() => {});
  });
  const root = createRoot(document.getElementById('root')!);
  try {
    await act(async () => { root.render(createElement(Tunes, props)); });
    await act(async () => { t.mock.timers.tick(30_000); });
    assert.equal(polls.length, 1);
    await act(async () => {
      Object.defineProperty(document, 'hidden', { value: true });
      document.dispatchEvent(new window.Event('visibilitychange'));
      t.mock.timers.tick(90_000);
    });
    assert.ok(polls[0].aborted);
    assert.equal(polls.length, 1);
    await act(async () => {
      Object.defineProperty(document, 'hidden', { value: false });
      document.dispatchEvent(new window.Event('visibilitychange'));
    });
    assert.equal(polls.length, 2);
    await act(async () => { root.unmount(); });
    assert.ok(polls[1].aborted);
    await act(async () => { t.mock.timers.tick(90_000); });
    assert.equal(polls.length, 2);
  } finally {
    t.mock.timers.reset();
    env.cleanup();
  }
});

test('failed charts can retry the same selected period', async t => {
  const env = setupDom();
  const root = createRoot(document.getElementById('root')!);
  let failure = true;
  t.mock.method(globalThis, 'fetch', async () => failure ? Response.json({}, { status: 503 }) : Response.json([]));
  try {
    await act(async () => { root.render(createElement(Tunes, props)); });
    assert.ok(document.querySelector('[role="alert"]'));
    failure = false;
    await act(async () => { button('Retry charts').click(); });
    assert.equal(document.querySelector('[role="alert"]'), null);
    assert.equal(button('All Time').getAttribute('aria-pressed'), 'true');
  } finally {
    await act(async () => { root.unmount(); });
    env.cleanup();
  }
});

for (const failedChart of ['artists', 'albums']) {
  test(`hydration retains ${failedChart} when their refresh fails and updates the other chart`, async t => {
    const initial = {
      ...props,
      initialArtists: [{ name: 'Server artist', url: 'https://example.com/artist', image: [] }],
      initialAlbums: [{ name: 'Server album', artist: { name: 'Artist' }, url: 'https://example.com/album', image: [] }],
    };
    const element = createElement(Tunes, initial);
    const env = setupDom(`<div id="root">${renderToString(element)}</div>`);
    const chart = (kind: string) => [...document.querySelectorAll('section')]
      .find(section => section.querySelector('h2 span')?.textContent === kind)!;
    const calls: string[] = [];
    let failure = true;
    t.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL) => {
      const method = new URL(String(input), 'https://korikosmos.dev').searchParams.get('method')!;
      calls.push(method);
      if (failure && method === failedChart) return Response.json({}, { status: 503 });
      return Response.json(method === 'artists'
        ? [{ ...initial.initialArtists[0], name: 'Refreshed artist' }]
        : [{ ...initial.initialAlbums[0], name: 'Refreshed album' }]);
    });
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => { root = hydrateRoot(document.getElementById('root')!, element); });
      const successfulChart = failedChart === 'artists' ? 'albums' : 'artists';
      assert.match(chart(failedChart).textContent ?? '', /Server/);
      assert.doesNotMatch(chart(failedChart).textContent ?? '', /data is unavailable/);
      assert.match(chart(successfulChart).textContent ?? '', /Refreshed/);
      assert.ok(document.querySelector('[role="alert"]'));

      failure = false;
      await act(async () => { button('Retry charts').click(); });
      assert.match(chart(failedChart).textContent ?? '', /Refreshed/);
      assert.equal(document.querySelector('[role="alert"]'), null);
      assert.deepEqual(calls, ['artists', 'albums', failedChart], 'Retry only the failed chart');
    } finally {
      await act(async () => { root?.unmount(); });
      env.cleanup();
    }
  });
}

test('chart failures keep successful results and cached data belongs to its own period', async t => {
  const env = setupDom();
  const root = createRoot(document.getElementById('root')!);
  const chart = (kind: string) => [...document.querySelectorAll('section')]
    .find(section => section.querySelector('h2 span')?.textContent === kind)!;
  t.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL) => {
    const query = new URL(String(input), 'https://korikosmos.dev').searchParams;
    const weekly = query.get('period') === '7day';
    if (weekly && query.get('method') === 'artists') return Response.json({}, { status: 503 });
    const name = weekly ? 'Weekly result' : 'Overall result';
    return Response.json([{ name, artist: { name: 'Artist' }, url: 'https://example.com', image: [] }]);
  });
  try {
    await act(async () => { root.render(createElement(Tunes, props)); });
    assert.match(chart('artists').textContent ?? '', /Overall result/);
    await act(async () => { button('Last Week').click(); });
    assert.match(chart('artists').textContent ?? '', /Artist data is unavailable/);
    assert.doesNotMatch(chart('artists').textContent ?? '', /Overall result/);
    assert.match(chart('albums').textContent ?? '', /Weekly result/);
    assert.doesNotMatch(chart('albums').textContent ?? '', /Album data is unavailable/);
    await act(async () => { button('All Time').click(); });
    assert.match(chart('artists').textContent ?? '', /Overall result/);
    assert.match(chart('albums').textContent ?? '', /Overall result/);
    assert.equal(document.querySelector('[role="alert"]'), null);
  } finally {
    await act(async () => { root.unmount(); });
    env.cleanup();
  }
});
