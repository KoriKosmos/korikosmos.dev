import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JSDOM } from 'jsdom';
import { HeartRate } from '../src/page-components/HeartRate';
import { HeartRateCard } from '../src/page-components/HeartRateCard';
import { todayGroups } from '../src/page-components/heartRateParts';
import type { HeartStatus } from '../src/lib/heartRateTypes';

const SKINS = ['modern', 'retro', 'mandy'] as const;

const stats = {
  heart: { bpm: '72', min: '58', max: '121', rhr: '63', rhr_src: 'watch', hrv: '41' },
  day: { steps: '8123', active: '19', calories: '1840' },
  night: { sleep: '7h 12m', sleep_score: '88', sleep_score_src: 'oura' },
};
const live: HeartStatus = { mode: 'live', bpm: 72, measuredAt: 0, bpm_text: '72', stats };
const recent: HeartStatus = { mode: 'recent', bpm: 68, measuredAt: 0, bpm_text: '~68', bpm_age: '5 min ago' };
const offline: HeartStatus = { mode: 'offline', stats: { day: { steps: '900' } } };

const dom = (element: ReturnType<typeof createElement>) =>
  new JSDOM(`<body>${renderToStaticMarkup(element)}</body>`).window.document;

test('today rows: range folds min/max, units only on bare numbers, empty groups vanish', () => {
  assert.deepEqual(todayGroups(undefined), []);
  assert.deepEqual(todayGroups({ heart: { bpm: '72' } }), [], 'bpm alone is the monitor, not a row');
  const groups = todayGroups({ heart: { min: '58', max: '121', min_src: 'watch' }, day: { active: '19 min', steps: '10' } });
  assert.deepEqual(groups, [
    { group: 'heart', title: 'Heart', rows: [{ key: 'range', label: 'range', value: '58–121', unit: 'bpm', src: 'watch' }] },
    { group: 'day', title: 'Day', rows: [{ key: 'steps', label: 'steps', value: '10' }, { key: 'active', label: 'active', value: '19 min' }] },
  ]);
  assert.equal(todayGroups({ heart: { max: '121' } })[0].rows[0].label, 'high');
});

for (const skin of SKINS) {
  test(`${skin}: the footer pill marks a recent reading as not live`, () => {
    const doc = dom(createElement(HeartRate, { skin, initial: recent }));
    const text = doc.body.textContent ?? '';
    assert.match(text, /~(about )?0?68/);
    assert.match(text, /5 min ago/);
    assert.doesNotMatch(text, /LIVE/);
    assert.match(doc.querySelector('[title]')?.getAttribute('title') ?? '', /not live/);
    assert.ok(!doc.querySelector('[style*="animation-duration"]'), 'a recent heart does not beat');

    const livePill = dom(createElement(HeartRate, { skin, initial: live }));
    assert.ok(livePill.querySelector('[style*="animation-duration"]'), 'a live heart beats');
    assert.equal(dom(createElement(HeartRate, { skin, initial: offline })).body.innerHTML, '');
  });

  test(`${skin}: the card shows today's stats, only rows with data, and no strap`, () => {
    const doc = dom(createElement(HeartRateCard, { skin, initial: live }));
    const text = doc.body.textContent ?? '';
    for (const expected of ['58–121', 'resting', '63', 'watch', 'HRV', '1840', '7h 12m', 'oura']) {
      assert.ok(text.includes(expected), `${expected} in ${skin}`);
    }
    for (const missing of ['readiness', 'zone min', 'recovery', 'stress']) assert.ok(!text.includes(missing), missing);
    assert.doesNotMatch(text, /strap/i);
    assert.ok(doc.querySelector('a[href="https://github.com/KoriKosmos/health-display"]'));

    const off = dom(createElement(HeartRateCard, { skin, initial: offline })).body.textContent ?? '';
    assert.ok(off.includes('900'), 'offline still shows the day');
    assert.match(off, /no reading right now/);

    const old = dom(createElement(HeartRateCard, { skin, initial: recent })).body.textContent ?? '';
    assert.match(old, /5 min ago/);
    assert.doesNotMatch(old, /LIVE/);
  });
}

test('a card with no stats renders no empty today section', () => {
  for (const skin of SKINS) {
    const doc = dom(createElement(HeartRateCard, { skin, initial: { mode: 'live', bpm: 70, measuredAt: 0 } }));
    assert.ok(!doc.querySelector('dl, table'));
  }
});
