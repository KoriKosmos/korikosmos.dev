import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createHealthDisplayClient, parseHealthStatus, parseStatusUrl, pickStats, withHealthDisplay,
  HEALTH_CACHE_MS, HEALTH_RETRY_MS, HEALTH_STALE_MS,
} from '../src/lib/healthDisplayClient';
import { createPulsoidClient, HEART_CACHE_MS } from '../src/lib/pulsoidClient';

const URL_ = 'http://health.lan:8766/status';
const WIDGET = 'https://pulsoid.net/widget/view/d30ee086-7bd6-4376-999f-f7301ec5aceb';

const snapshot = (now: number, extra: Record<string, unknown> = {}) => ({
  v: 1, updated_at: now - 1000, mode: 'live', bpm: 72, bpm_text: '72', bpm_age_s: 2, bpm_src: 'pulsoid',
  presence: { details: '❤️ 72 bpm', state: '👟 330', hover: 'secret-ish' },
  values: { bpm: '72', min: '58', max: '121', rhr: '63', rhr_src: 'watch', steps: '330', steps_src: 'phone' },
  ...extra,
});

test('only whitelisted values leave the server, grouped and cleaned', () => {
  const stats = pickStats({
    bpm: '72', hrv: '41', hrv_src: 'ultrahuman', steps: 8123, calories: '1,840', azm: '22',
    sleep: '7h 12m', sleep_score: '88', sleep_score_src: 'oura', stress: 'restored',
    // Health-sensitive or simply unlisted: never passed on.
    weight: '72.4', weight_src: 'scale', glucose: '5.4', glucose_mgdl: '97', ecg: 'sinus', kcal_in: '1200',
    spo2: '97', temp_delta: '+0.2', bpm_age: '5 min ago', presence: 'x',
    // A _src without its value is dropped; junk values are dropped.
    rhr_src: 'watch', active: '', avg: { nested: true }, max: 'x'.repeat(40), min: 'ok\u0007',
  });
  assert.deepEqual(stats, {
    heart: { bpm: '72', min: 'ok', hrv: '41', hrv_src: 'ultrahuman' },
    day: { steps: '8123', calories: '1,840', azm: '22' },
    night: { sleep: '7h 12m', sleep_score: '88', sleep_score_src: 'oura', stress: 'restored' },
  });
  const json = JSON.stringify(stats);
  for (const banned of ['weight', 'glucose', 'ecg', 'kcal_in', 'spo2', 'scale', '72.4']) assert.ok(!json.includes(banned), banned);
  assert.equal(pickStats({ weight: '72' }), undefined);
  assert.equal(pickStats(null), undefined);
});

test('live and phone snapshots become live readings with stats', () => {
  const now = 10_000_000;
  const live = parseHealthStatus(snapshot(now, { values: { ...snapshot(now).values, weight: '72.4' } }), now);
  assert.deepEqual(live, {
    mode: 'live', bpm: 72, measuredAt: now - 3000, bpm_text: '72',
    stats: { heart: { bpm: '72', min: '58', max: '121', rhr: '63', rhr_src: 'watch' }, day: { steps: '330', steps_src: 'phone' } },
  });
  assert.ok(!JSON.stringify(live).includes('presence') && !JSON.stringify(live).includes('secret'));
  assert.equal(parseHealthStatus(snapshot(now, { mode: 'phone', bpm: 80.4 }), now)?.mode, 'live');
});

test('recent readings keep the tilde and the age string', () => {
  const now = 10_000_000;
  const recent = parseHealthStatus(snapshot(now, {
    mode: 'recent', bpm: 68, bpm_text: '~68', bpm_age_s: 300, bpm_src: 'watch',
    values: { bpm: '~68', bpm_age: '5 min ago' },
  }), now);
  assert.deepEqual(recent, {
    mode: 'recent', bpm: 68, measuredAt: now - 1000 - 300_000, bpm_text: '~68', bpm_age: '5 min ago',
    stats: { heart: { bpm: '~68' } },
  });
  // A missing or odd bpm_text is rebuilt rather than trusted.
  const rebuilt = parseHealthStatus(snapshot(now, { mode: 'recent', bpm: 68, bpm_text: '<b>68</b>' }), now);
  assert.equal(rebuilt?.mode === 'recent' && rebuilt.bpm_text, '~68');
});

test('offline keeps the day stats; stale snapshots and missing heart rates are offline', () => {
  const now = 10_000_000;
  assert.deepEqual(parseHealthStatus(snapshot(now, { mode: 'offline', bpm: null, values: { steps: '900' } }), now),
    { mode: 'offline', stats: { day: { steps: '900' } } });
  assert.deepEqual(parseHealthStatus(snapshot(now, { updated_at: now - HEALTH_STALE_MS - 1 }), now), { mode: 'offline' });
  for (const bpm of [null, 0, -3, 400, '72', Number.NaN]) {
    assert.equal(parseHealthStatus(snapshot(now, { bpm }), now)?.mode, 'offline', String(bpm));
  }
  assert.equal(parseHealthStatus(snapshot(now, { mode: 'party' }), now)?.mode, 'offline');
});

test('anything that is not a v1 snapshot is rejected outright', () => {
  const now = 10_000_000;
  for (const body of [null, 'x', [], {}, { ...snapshot(now), v: 2 }, { ...snapshot(now), updated_at: 'now' }]) {
    assert.equal(parseHealthStatus(body, now), null);
  }
});

test('status URLs must be http(s)', () => {
  assert.equal(parseStatusUrl(` ${URL_} `), URL_);
  assert.equal(parseStatusUrl('https://health.korikosmos.dev/status'), 'https://health.korikosmos.dev/status');
  for (const bad of [undefined, '', 'nope', 'file:///etc/passwd', 'javascript:alert(1)']) assert.equal(parseStatusUrl(bad), null);
});

test('the client is cached, coalesced, and sends the bearer token', async () => {
  let now = 50_000_000;
  const calls: [string, RequestInit][] = [];
  const client = createHealthDisplayClient({
    url: URL_, token: 'tok', now: () => now,
    fetch: async (url, init) => { calls.push([String(url), init!]); return Response.json(snapshot(now)); },
  });
  assert.equal(client.enabled, true);
  const [a, b] = await Promise.all([client.getStatus(), client.getStatus()]);
  assert.equal(a?.mode, 'live');
  assert.deepEqual(a, b);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], URL_);
  assert.equal(new Headers(calls[0][1].headers).get('authorization'), 'Bearer tok');
  now += HEALTH_CACHE_MS + 1;
  await client.getStatus();
  assert.equal(calls.length, 2);
  assert.equal(createHealthDisplayClient({ url: URL_ }).enabled, false);
  assert.equal(createHealthDisplayClient({ token: 'tok' }).enabled, false);
});

test('unreachable Health Display falls back to Pulsoid, then retries later', async () => {
  let now = 0;
  let healthUp = false;
  let healthCalls = 0;
  let pulsoidCalls = 0;
  const health = createHealthDisplayClient({
    url: URL_, token: 'tok', now: () => now,
    fetch: async () => {
      healthCalls++;
      if (!healthUp) throw new Error('ECONNREFUSED');
      return Response.json(snapshot(now, { bpm: 90 }));
    },
  });
  const pulsoid = createPulsoidClient({
    token: 'p', now: () => now,
    fetch: async () => { pulsoidCalls++; return Response.json({ measured_at: now, data: { heart_rate: 64 } }); },
  });
  const source = withHealthDisplay(health, pulsoid);
  assert.equal(source.enabled, true);
  assert.deepEqual(source.initial(), { mode: 'offline' });

  const fallback = await source.getHeartRate();
  assert.equal(fallback.mode === 'live' && fallback.bpm, 64);
  now += Math.max(HEALTH_CACHE_MS, HEART_CACHE_MS) + 1;
  await source.getHeartRate();
  assert.equal(healthCalls, 1, 'no Health Display calls while backing off');
  assert.equal(pulsoidCalls, 2);

  now += HEALTH_RETRY_MS;
  healthUp = true;
  const back = await source.getHeartRate();
  assert.equal(back.mode === 'live' && back.bpm, 90);
  assert.equal(pulsoidCalls, 2, 'Pulsoid is not asked once Health Display answers');
});

test('HTTP errors and bad bodies fall back too, including to the widget', async () => {
  for (const respond of [
    () => new Response('nope', { status: 401 }),
    () => new Response('oops', { status: 500 }),
    () => Response.json({ hello: 'world' }),
  ]) {
    const source = withHealthDisplay(
      createHealthDisplayClient({ url: URL_, token: 'tok', fetch: async () => respond() }),
      createPulsoidClient({ widgetUrl: WIDGET }),
    );
    assert.deepEqual(await source.getHeartRate(), { mode: 'widget', src: WIDGET });
  }
});

test('without Health Display configured the Pulsoid path is unchanged', async () => {
  const source = withHealthDisplay(createHealthDisplayClient({}), createPulsoidClient({ widgetUrl: WIDGET }));
  assert.equal(source.enabled, true);
  assert.deepEqual(source.initial(), { mode: 'widget', src: WIDGET });
  assert.deepEqual(await source.getHeartRate(), { mode: 'widget', src: WIDGET });
  const none = withHealthDisplay(createHealthDisplayClient({}), createPulsoidClient({}));
  assert.equal(none.enabled, false);
});
