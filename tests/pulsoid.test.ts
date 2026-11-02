import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createPulsoidClient, parsePulsoidReading, parseWidgetUrl,
  HEART_CACHE_MS, HEART_REJECTED_RETRY_MS, HEART_STALE_MS, PULSOID_LATEST_URL,
} from '../src/lib/pulsoidClient';

const WIDGET = 'https://pulsoid.net/widget/view/d30ee086-7bd6-4376-999f-f7301ec5aceb';

test('readings parse, round, and go offline when stale or malformed', () => {
  const now = 1_000_000;
  assert.deepEqual(parsePulsoidReading({ measured_at: now - 1000, data: { heart_rate: 71.6 } }, now),
    { mode: 'live', bpm: 72, measuredAt: now - 1000 });
  assert.deepEqual(parsePulsoidReading({ measured_at: now - HEART_STALE_MS - 1, data: { heart_rate: 70 } }, now), { mode: 'offline' });
  for (const body of [null, 'x', {}, { measured_at: now }, { measured_at: now, data: { heart_rate: 0 } },
    { measured_at: now, data: { heart_rate: '80' } }, { measured_at: 'now', data: { heart_rate: 80 } }]) {
    assert.deepEqual(parsePulsoidReading(body, now), { mode: 'offline' });
  }
});

test('only real Pulsoid widget pages may be framed', () => {
  assert.equal(parseWidgetUrl(` ${WIDGET}/ `), WIDGET);
  for (const bad of [undefined, '', 'nope', WIDGET.replace('https', 'http'), WIDGET.replace('pulsoid.net', 'evil.example'),
    'https://pulsoid.net/ui/keys', 'javascript:alert(1)', `${WIDGET}/../../x`]) {
    assert.equal(parseWidgetUrl(bad), null, String(bad));
  }
});

test('the API is cached, sends the bearer token, and treats 412 as offline', async () => {
  let now = 5_000_000;
  const calls: RequestInit[] = [];
  let status = 200;
  const client = createPulsoidClient({
    token: 'tok', now: () => now,
    fetch: async (url, init) => {
      assert.equal(url, PULSOID_LATEST_URL);
      calls.push(init!);
      return Response.json({ measured_at: now, data: { heart_rate: 64 } }, { status });
    },
  });
  assert.equal(client.enabled, true);
  assert.deepEqual(client.initial(), { mode: 'offline' });
  const [a, b] = await Promise.all([client.getHeartRate(), client.getHeartRate()]);
  assert.equal(a.mode === 'live' && a.bpm, 64);
  assert.deepEqual(a, b);
  assert.equal(calls.length, 1);
  assert.equal(new Headers(calls[0].headers).get('authorization'), 'Bearer tok');
  now += HEART_CACHE_MS + 1;
  status = 412;
  assert.deepEqual(await client.getHeartRate(), { mode: 'offline' });
});

test('a rejected token (plan lapsed) falls back to the widget, then retries later', async () => {
  let now = 0;
  let status = 403;
  let calls = 0;
  const client = createPulsoidClient({
    token: 'tok', widgetUrl: WIDGET, now: () => now,
    fetch: async () => { calls++; return Response.json({ measured_at: now, data: { heart_rate: 90 } }, { status }); },
  });
  assert.deepEqual(await client.getHeartRate(), { mode: 'widget', src: WIDGET });
  now += HEART_CACHE_MS + 1;
  assert.deepEqual(await client.getHeartRate(), { mode: 'widget', src: WIDGET });
  assert.equal(calls, 1, 'no upstream calls while backing off');
  now += HEART_REJECTED_RETRY_MS;
  status = 200;
  assert.equal((await client.getHeartRate()).mode, 'live');
});

test('no token: the widget is the starting state, and nothing is fetched', async () => {
  const client = createPulsoidClient({ widgetUrl: WIDGET, fetch: async () => { throw new Error('should not fetch'); } });
  assert.equal(client.enabled, true);
  assert.deepEqual(client.initial(), { mode: 'widget', src: WIDGET });
  assert.deepEqual(await client.getHeartRate(), { mode: 'widget', src: WIDGET });
  const none = createPulsoidClient({});
  assert.equal(none.enabled, false);
  assert.deepEqual(await none.getHeartRate(), { mode: 'offline' });
});

test('outages read as offline without a widget configured', async () => {
  const client = createPulsoidClient({ token: 'tok', fetch: async () => { throw new Error('down'); } });
  assert.deepEqual(await client.getHeartRate(), { mode: 'offline' });
});
