import assert from 'node:assert/strict';
import test from 'node:test';
import {
  LOVENSE_KEY, isPrivateIPv4, lovenseLevel, lovensePulse, lovenseUrl, parseLovenseConfig, resetLovense,
  saveLovenseConfig,
} from '../src/lib/lovense';
import { HAPTIC_EFFECTS, haptic, resetHaptics, setHapticsEnabled } from '../src/lib/haptics';
import { setupDom } from './dom';

const config = { host: '192.168.1.44', port: 30010 };

function recorder() {
  const calls: { url: string; body: Record<string, unknown>; headers: Record<string, string> }[] = [];
  const fetcher = async (url: string, init: RequestInit) => {
    calls.push({ url, body: JSON.parse(String(init.body)), headers: init.headers as Record<string, string> });
    return new Response('{"code":200}', { status: 200 });
  };
  return { calls, fetcher };
}

test('only private LAN IPv4 addresses and real ports are accepted', () => {
  for (const ok of ['192.168.1.44', '10.0.0.2', '172.16.5.5', '172.31.255.1']) assert.ok(isPrivateIPv4(ok), ok);
  for (const bad of ['8.8.8.8', '172.32.0.1', '192.169.1.1', '192.168.1', '192.168.1.256', 'example.com', '192.168.1.44/x'])
    assert.equal(isPrivateIPv4(bad), false, bad);
  assert.deepEqual(parseLovenseConfig({ host: ' 192.168.1.44 ', port: '30010' }), config);
  assert.equal(parseLovenseConfig({ host: '192.168.1.44', port: 0 }), null);
  assert.equal(parseLovenseConfig({ host: '192.168.1.44', port: 70000 }), null);
  assert.equal(parseLovenseConfig({ host: '192.168.1.44', port: 1.5 }), null);
  assert.equal(parseLovenseConfig(null), null);
});

test('the command URL goes through the dashed lovense.club name', () => {
  assert.equal(lovenseUrl(config), 'https://192-168-1-44.lovense.club:30010/command');
});

test('effect strength maps onto Vibrate 1-20', () => {
  assert.equal(lovenseLevel({ strong: 0, weak: 0 }), 0);
  assert.equal(lovenseLevel({ strong: 0.01, weak: 0 }), 1);
  assert.equal(lovenseLevel(HAPTIC_EFFECTS.big), 20);
  assert.equal(lovenseLevel(HAPTIC_EFFECTS.drop), 9);
});

test('a short effect vibrates, then stops when the effect ends; a newer one replaces the stop', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  t.after(() => { resetLovense(); t.mock.timers.reset(); });
  resetLovense();
  const { calls, fetcher } = recorder();
  assert.ok(lovensePulse(HAPTIC_EFFECTS.drop, config, fetcher));
  assert.deepEqual(calls[0].body, { command: 'Function', action: 'Vibrate:9', timeSec: 1, apiVer: 1 });
  assert.equal(calls[0].url, 'https://192-168-1-44.lovense.club:30010/command');
  assert.equal(calls[0].headers['Content-Type'], 'application/json');

  t.mock.timers.tick(30);
  lovensePulse(HAPTIC_EFFECTS.clear, config, fetcher);
  t.mock.timers.tick(HAPTIC_EFFECTS.drop.duration);
  assert.equal(calls.length, 2, 'the first stop was cancelled by the newer effect');
  t.mock.timers.tick(HAPTIC_EFFECTS.clear.duration);
  assert.deepEqual(calls[2].body, { command: 'Function', action: 'Stop', timeSec: 0, apiVer: 1 });
});

test('a failed request backs off instead of spamming the network', async t => {
  t.after(resetLovense);
  resetLovense();
  let count = 0;
  const failing = async () => { count++; throw new TypeError('Failed to fetch'); };
  lovensePulse({ strong: 1, weak: 1, duration: 1000 }, config, failing);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(lovensePulse({ strong: 1, weak: 1, duration: 1000 }, config, failing), false);
  assert.equal(count, 1);
});

test('haptic() reaches a configured toy whatever the input, and the Vibration switch silences it', async t => {
  const env = setupDom();
  const calls: string[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (url: string) => { calls.push(url); return new Response('{}'); }) as typeof fetch;
  resetHaptics();
  resetLovense();
  t.after(() => { globalThis.fetch = original; resetHaptics(); resetLovense(); env.cleanup(); });

  haptic('big');
  assert.equal(calls.length, 0, 'nothing is configured by default');

  saveLovenseConfig(config);
  assert.ok(localStorage.getItem(LOVENSE_KEY));
  haptic('big');
  assert.deepEqual(calls, ['https://192-168-1-44.lovense.club:30010/command']);

  setHapticsEnabled(false);
  haptic('big');
  assert.equal(calls.length, 1);
});
