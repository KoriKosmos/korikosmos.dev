import assert from 'node:assert/strict';
import test from 'node:test';
import {
  TREND_DAYS, normaliseHistory, numericValue, recordDay, sparklinePoints, trendDays, trendSeries, trendValues,
} from '../src/lib/vitalsTrend';

test('display strings become numbers only when they are plainly numeric', () => {
  assert.equal(numericValue('1,234'), 1234);
  assert.equal(numericValue('45 ms'), 45);
  assert.equal(numericValue('88'), 88);
  assert.equal(numericValue('61.5'), 61.5);
  for (const text of ['7h 12m', '~72', '', undefined, '12,34']) assert.equal(numericValue(text), null);
});

test('only the trend stats are taken from a snapshot', () => {
  const values = trendValues({
    heart: { rhr: '58', bpm: '72', hrv: '41 ms' },
    day: { steps: '9,876', calories: '2,100' },
    night: { sleep: '7h 2m', sleep_score: '84' },
  });
  assert.deepEqual(values, { rhr: 58, hrv: 41, steps: 9876, sleep_score: 84 });
});

test('the log keeps the last reading per day and only the last week', () => {
  assert.deepEqual(trendDays('2026-11-14'), ['2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14']);
  let history = recordDay({ days: { '2026-11-01': { rhr: 70 } } }, '2026-11-13', { rhr: 60, steps: 100 });
  history = recordDay(history, '2026-11-14', { rhr: 59 });
  history = recordDay(history, '2026-11-14', { rhr: 58 });
  assert.deepEqual(history, { days: { '2026-11-13': { rhr: 60, steps: 100 }, '2026-11-14': { rhr: 58 } } });
});

test('a stat needs two days before it gets a line', () => {
  const trend = trendSeries({ days: { '2026-11-12': { rhr: 61, steps: 10 }, '2026-11-14': { rhr: 58 } } }, '2026-11-14');
  assert.equal(trend.days.length, TREND_DAYS);
  assert.deepEqual(trend.series.map(s => s.key), ['rhr']);
  assert.deepEqual(trend.series[0].values, [null, null, null, null, 61, null, 58]);
  assert.equal(trend.series[0].latest, 58);
  assert.equal(sparklinePoints(trend.series[0].values, 120, 28).split(' ').length, 2);
});

test('a hand-edited log is cleaned rather than trusted', () => {
  assert.deepEqual(normaliseHistory({ days: { bad: { rhr: 1 }, '2026-11-14': { rhr: '60', steps: 5, weight: 80 } } }), {
    days: { '2026-11-14': { steps: 5 } },
  });
  assert.deepEqual(normaliseHistory(null), { days: {} });
});
