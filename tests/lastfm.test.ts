import assert from 'node:assert/strict';
import test from 'node:test';
import { createAsyncCache } from '../src/lib/asyncCache';
import { createLastfmClient, readLastfmQuery } from '../src/lib/lastfmClient';

test('concurrent cache readers share work, expire from completion, and retry failures', async () => {
  let now = 0;
  let calls = 0;
  const cache = createAsyncCache<number>({ now: () => now });
  const load = async () => { calls++; now += 10; return calls; };
  assert.deepEqual(await Promise.all(Array.from({ length: 20 }, () => cache.get('recent', load, 15))), Array(20).fill(1));
  now = 24;
  assert.equal(await cache.get('recent', load, 15), 1);
  now = 25;
  assert.equal(await cache.get('recent', load, 15), 2);
  await assert.rejects(cache.get('failure', async () => { throw new Error('offline'); }, 15));
  assert.equal(await cache.get('failure', async () => 42, 15), 42);
});

test('cache evicts least recently used values and bounds pending requests', async () => {
  const cache = createAsyncCache<number>({ maxEntries: 2 });
  await cache.get('a', async () => 1, 1000);
  await cache.get('b', async () => 2, 1000);
  await cache.get('a', async () => 99, 1000);
  await cache.get('c', async () => 3, 1000);
  assert.equal(await cache.get('b', async () => 4, 1000), 4);
  let finish!: (value: number) => void;
  const pending = createAsyncCache<number>({ maxEntries: 1 });
  const first = pending.get('a', () => new Promise(resolve => { finish = resolve; }), 1000);
  await Promise.resolve();
  await assert.rejects(pending.get('b', async () => 2, 1000), /pending requests/);
  finish(1);
  await first;
});

test('public Last.fm queries reject invalid limits, periods and methods', () => {
  for (const limit of ['0', '-1', '51', '1.5', '10abc', 'Infinity', '']) {
    assert.throws(() => readLastfmQuery(new URLSearchParams({ limit })), /Limit/);
  }
  assert.throws(() => readLastfmQuery(new URLSearchParams('period=never')), /period/);
  assert.throws(() => readLastfmQuery(new URLSearchParams('method=unknown')), /method/);
  assert.deepEqual(readLastfmQuery(new URLSearchParams()), { method: 'recent', limit: 10, period: 'overall' });
});

test('/now and Tunes share recent requests and a stopped track refreshes after expiry', async () => {
  let now = 0;
  let calls = 0;
  const track = { name: 'Song', artist: { '#text': 'Artist' }, album: { '#text': 'Album' }, image: [] };
  const fetcher: typeof fetch = async (_input, init) => {
    assert.ok(init?.signal, 'Upstream calls carry a timeout signal');
    calls++;
    return Response.json({ recenttracks: { track: [{ ...track, '@attr': { nowplaying: calls === 1 ? 'true' : 'false' } }, track] } });
  };
  const client = createLastfmClient({ user: 'test', apiKey: 'test', fetcher, now: () => now });
  const [one, ten] = await Promise.all([client.getRecentTracks(1), client.getRecentTracks(10)]);
  assert.equal(calls, 1);
  assert.equal(one[0]['@attr']?.nowplaying, 'true');
  assert.equal(ten.length, 1, 'Consecutive duplicate scrobbles stay filtered');
  now = 15_000;
  assert.equal((await client.getRecentTracks(10))[0]['@attr']?.nowplaying, 'false');
  assert.equal(calls, 2);
});

test('HTTP-200 API errors and malformed collections are not cached as empty success', async () => {
  const payloads = [{ error: 29, message: 'Rate limit' }, { topalbums: { album: {} } }, { topalbums: { album: [] } }];
  let calls = 0;
  const client = createLastfmClient({ user: 'test', apiKey: 'test', fetcher: async () => Response.json(payloads[calls++]) });
  await assert.rejects(client.getTopAlbums(), /API error/);
  await assert.rejects(client.getTopAlbums(), /invalid collection/);
  assert.deepEqual(await client.getTopAlbums(), []);
  assert.deepEqual(await client.getTopAlbums(), []);
  assert.equal(calls, 3);
});

test('both plain and enriched artist lists cache successful results', async () => {
  const methods: string[] = [];
  const fetcher: typeof fetch = async input => {
    const method = new URL(String(input)).searchParams.get('method')!;
    methods.push(method);
    return Response.json(method === 'artist.getinfo'
      ? { artist: { image: [{ '#text': 'https://example.com/art.jpg', size: 'large' }] } }
      : { topartists: { artist: [{ name: 'Artist', url: 'https://example.com', image: [] }] } });
  };
  const client = createLastfmClient({ user: 'test', apiKey: 'test', fetcher });
  await client.getTopArtists('overall', 5, false);
  await client.getTopArtists('overall', 5, false);
  const [a, b] = await Promise.all([client.getTopArtists('overall', 5), client.getTopArtists('overall', 5)]);
  assert.deepEqual(a, b);
  assert.equal(a[0].image[0]['#text'], 'https://example.com/art.jpg');
  assert.deepEqual(methods, ['user.gettopartists', 'artist.getinfo']);
});
