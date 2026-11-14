import assert from 'node:assert/strict';
import test from 'node:test';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { EcgTrace } from '../src/page-components/heartRateParts';
import { setupDom } from './dom';

const WIDTH = 300;
const HEIGHT = 56;

/** A fake 2D context that keeps the y of every point of the last full redraw. */
function fakeCanvas(window: Window & typeof globalThis) {
  const drawn: number[] = [];
  const ctx = {
    clearRect: () => { drawn.length = 0; },
    moveTo: (_x: number, y: number) => { drawn.push(y); },
    lineTo: (_x: number, y: number) => { drawn.push(y); },
    setTransform() {}, beginPath() {}, stroke() {}, arc() {}, fill() {},
  };
  window.HTMLCanvasElement.prototype.getContext = (() => ctx) as never;
  Object.defineProperty(window.HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => WIDTH });
  /** R spikes: runs of points reaching the top 30% of the strip. */
  return () => {
    let peaks = 0;
    let inPeak = false;
    for (const y of drawn) {
      const high = y < HEIGHT * 0.3;
      if (high && !inPeak) peaks++;
      inPeak = high;
    }
    return peaks;
  };
}

for (const [name, reduce, still] of [['reduced motion', true, false], ['a recent reading', false, true]] as const) {
  test(`the still strip follows the BPM (${name})`, async () => {
    const env = setupDom();
    const window = env.dom.window as unknown as Window & typeof globalThis;
    const peaks = fakeCanvas(window);
    window.matchMedia = ((query: string) => ({ matches: reduce && query.includes('reduce') })) as never;
    Object.defineProperty(globalThis, 'getComputedStyle', { configurable: true, writable: true, value: window.getComputedStyle.bind(window) });
    Object.defineProperty(globalThis, 'ResizeObserver', {
      configurable: true, writable: true,
      value: class { observe() {} disconnect() {} },
    });
    try {
      const root = createRoot(document.getElementById('root')!);
      const render = (bpm: number | null) => act(async () => {
        root.render(createElement(EcgTrace, { bpm, label: 'ecg', still, height: HEIGHT }));
      });
      // The sweep covers 3 seconds: bpm / 20 beats across the strip.
      await render(60);
      assert.equal(peaks(), 3);
      await render(120);
      assert.equal(peaks(), 6, 'redrawn for the new BPM');
      await render(null);
      assert.equal(peaks(), 0, 'a flatline once the reading is gone');
      await act(async () => { root.unmount(); });
    } finally {
      Reflect.deleteProperty(globalThis, 'ResizeObserver');
      Reflect.deleteProperty(globalThis, 'getComputedStyle');
      env.cleanup();
    }
  });
}
