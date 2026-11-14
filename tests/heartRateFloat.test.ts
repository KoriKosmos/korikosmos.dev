import assert from 'node:assert/strict';
import test from 'node:test';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { HeartRateFloat } from '../src/page-components/HeartRateFloat';
import type { HeartStatus } from '../src/lib/heartRateTypes';
import { setupDom } from './dom';

const live: HeartStatus = {
  mode: 'live', bpm: 72, measuredAt: 0, bpm_text: '72',
  stats: {
    heart: { min: '58', max: '121', rhr: '63', rhr_src: 'watch', hrv: '41' },
    day: { steps: '8123', active: '19', calories: '1840', azm: '22' },
    night: { sleep: '7h 12m', sleep_score: '88', readiness: '81', recovery: '70', stress: 'restored' },
  },
};

for (const skin of ['modern', 'retro', 'mandy'] as const) {
  test(`${skin}: the floating window is "Vitals" and carries every stat`, async () => {
    const env = setupDom();
    // jsdom has no canvas; the ECG already copes with a missing context.
    env.dom.window.HTMLCanvasElement.prototype.getContext = () => null;
    const realFetch = globalThis.fetch;
    // The shared poller asks /api/heartrate as soon as an island subscribes.
    globalThis.fetch = async () => Response.json(live);
    try {
      localStorage.setItem('kk-heart-float', JSON.stringify({ open: true, x: null, y: null }));
      const { setHeartFloat } = await import('../src/lib/heartRateStore');
      setHeartFloat({ open: true });
      const root = createRoot(document.getElementById('root')!);
      await act(async () => { root.render(createElement(HeartRateFloat, { skin, initial: live })); });

      const region = document.querySelector('[role="region"]');
      assert.equal(region?.getAttribute('aria-label'), 'Vitals');
      assert.match(region?.textContent ?? '', /vitals/i);
      assert.doesNotMatch(region?.textContent ?? '', /heart_monitor|heart monitor/i);
      const text = region?.textContent ?? '';
      for (const expected of ['58–121', 'resting', 'HRV', '8123', 'zone min', '7h 12m', 'sleep score', 'readiness', 'recovery', 'restored']) {
        assert.ok(text.includes(expected), `${expected} in the ${skin} window`);
      }
      assert.ok(!region?.querySelector('h1, h2, h3, h4'), 'the window adds no headings to the page outline');

      const dock = document.querySelector('button[aria-pressed]');
      assert.match(dock?.textContent ?? '', /Hide/);
      await act(async () => { setHeartFloat({ open: false }); });
      assert.match(document.querySelector('button[aria-pressed]')?.textContent ?? '', /Vitals/);
      assert.equal(document.querySelector('[role="region"]'), null);
      await act(async () => { root.unmount(); });
    } finally {
      globalThis.fetch = realFetch;
      env.cleanup();
    }
  });
}
