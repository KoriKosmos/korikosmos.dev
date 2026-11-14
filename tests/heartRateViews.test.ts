import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JSDOM } from 'jsdom';
import { HeartRate } from '../src/page-components/HeartRate';
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
}
