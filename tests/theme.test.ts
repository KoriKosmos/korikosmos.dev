import assert from 'node:assert/strict';
import test from 'node:test';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeBar } from '../src/components/ThemeBar';
import { DEFAULT_THEME, THEMES, parseTheme } from '../src/lib/theme';
import { setupDom } from './dom';

function deferred() {
  let resolve!: () => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

/** Drive the browser's snapshot boundaries without pretending JSDOM paints. */
function mockViewTransitions() {
  const transitions: {
    update: () => void;
    ready: ReturnType<typeof deferred>;
    finished: ReturnType<typeof deferred>;
    before: { theme: string | null; selected: string | null; stored: string | null; cookie: string };
  }[] = [];
  const animations: { frames: PropertyIndexedKeyframes; options: KeyframeAnimationOptions }[] = [];
  Object.defineProperty(window, 'matchMedia', { value: () => ({ matches: false }) });
  Object.defineProperty(document, 'startViewTransition', {
    value: (update: () => void) => {
      const ready = deferred();
      const finished = deferred();
      transitions.push({ update, ready, finished, before: {
        theme: document.documentElement.getAttribute('data-theme'),
        selected: document.querySelector('[aria-pressed="true"]')?.getAttribute('aria-label') ?? null,
        stored: localStorage.getItem('theme'),
        cookie: document.cookie,
      } });
      return { ready: ready.promise, finished: finished.promise };
    },
  });
  Object.defineProperty(document.documentElement, 'animate', {
    value: (frames: PropertyIndexedKeyframes, options: KeyframeAnimationOptions) => {
      animations.push({ frames, options });
    },
  });
  return { transitions, animations };
}

test('theme values accept supported names, migrate the legacy name, and reject unknown values', () => {
  for (const theme of THEMES) assert.equal(parseTheme(theme), theme);
  assert.equal(parseTheme('spiderman'), 'spider-man');
  for (const value of [undefined, null, '', 'unknown', '__proto__', 'constructor']) {
    assert.equal(parseTheme(value), DEFAULT_THEME);
  }
});

test('the theme picker remains usable when local storage is blocked', async () => {
  const env = setupDom();
  const root = createRoot(document.getElementById('root')!);
  document.documentElement.setAttribute('data-theme', 'batman');
  Object.defineProperty(window, 'matchMedia', { value: () => ({ matches: true }) });
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true, get() { throw new Error('Storage blocked'); },
  });
  try {
    await act(async () => { root.render(createElement(ThemeBar)); });
    assert.equal(document.querySelector('[aria-label="Batman theme"]')?.getAttribute('aria-pressed'), 'true');
    await act(async () => { document.querySelector<HTMLButtonElement>('[aria-label="Forest theme"]')!.click(); });
    assert.equal(document.documentElement.getAttribute('data-theme'), 'forest');
    assert.match(document.cookie, /kk-theme=forest/);
    assert.equal(document.querySelector('[aria-label="Forest theme"]')?.getAttribute('aria-pressed'), 'true');
    assert.equal(document.documentElement.hasAttribute('data-theme-switching'), false);
    assert.equal(document.documentElement.hasAttribute('data-theme-fade'), false);
  } finally {
    await act(async () => { root.unmount(); });
    env.cleanup();
  }
});

test('the theme picker follows the displayed theme and saves swatch choices in both stores', async () => {
  const env = setupDom();
  const root = createRoot(document.getElementById('root')!);
  Object.defineProperty(window, 'matchMedia', { value: () => ({ matches: true }) });
  document.documentElement.setAttribute('data-theme', 'batman');
  localStorage.setItem('theme', 'dark');
  try {
    await act(async () => { root.render(createElement(ThemeBar)); });
    assert.equal(document.querySelector('[aria-label="Batman theme"]')?.getAttribute('aria-pressed'), 'true');
    // The command palette and navigation reconciler update this same attribute.
    await act(async () => { document.documentElement.setAttribute('data-theme', 'light'); });
    assert.equal(document.querySelector('[aria-label="Light theme"]')?.getAttribute('aria-pressed'), 'true');
    await act(async () => { document.querySelector<HTMLButtonElement>('[aria-label="Forest theme"]')!.click(); });
    assert.equal(localStorage.getItem('theme'), 'forest');
    assert.match(document.cookie, /kk-theme=forest/);
  } finally {
    await act(async () => { root.unmount(); });
    env.cleanup();
  }
});

test('a reveal saves before snapshot capture and changes the swatch with the new page colours', async () => {
  const env = setupDom();
  const root = createRoot(document.getElementById('root')!);
  const { transitions, animations } = mockViewTransitions();
  document.documentElement.setAttribute('data-theme', 'dark');
  try {
    await act(async () => { root.render(createElement(ThemeBar)); });
    const swatch = document.querySelector<HTMLButtonElement>('[aria-label="Forest theme"]')!;
    swatch.getBoundingClientRect = () => ({ left: 100, top: 20, width: 24, height: 24 } as DOMRect);
    await act(async () => { swatch.click(); });
    assert.equal(transitions.length, 1);
    const transition = transitions[0];
    assert.equal(transition.before.theme, 'dark');
    assert.equal(transition.before.selected, 'Dark theme');
    assert.equal(transition.before.stored, 'forest');
    assert.match(transition.before.cookie, /kk-theme=forest/);
    assert.equal(animations.length, 0);

    await act(async () => {
      transition.update();
      // React must finish this DOM update before the browser captures it.
      assert.equal(swatch.getAttribute('aria-pressed'), 'true');
      assert.equal(document.documentElement.getAttribute('data-theme'), 'forest');
      transition.ready.resolve();
    });
    const radius = Math.hypot(window.innerWidth - 112, window.innerHeight - 32);
    assert.deepEqual(animations[0], {
      frames: { clipPath: [`circle(0px at 112px 32px)`, `circle(${radius}px at 112px 32px)`] },
      options: { duration: 500, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'both', pseudoElement: '::view-transition-new(root)' },
    });
    assert.equal(document.documentElement.hasAttribute('data-theme-switching'), true);
    await act(async () => { transition.finished.resolve(); });
    assert.equal(document.documentElement.hasAttribute('data-theme-switching'), false);
  } finally {
    await act(async () => { root.unmount(); });
    env.cleanup();
  }
});

test('an interrupted reveal cannot restore page animations during the next theme change', async () => {
  const env = setupDom();
  const root = createRoot(document.getElementById('root')!);
  const { transitions, animations } = mockViewTransitions();
  document.documentElement.setAttribute('data-theme', 'dark');
  try {
    await act(async () => { root.render(createElement(ThemeBar)); });
    await act(async () => { document.querySelector<HTMLButtonElement>('[aria-label="Forest theme"]')!.click(); });
    await act(async () => { transitions[0].update(); });
    await act(async () => { document.querySelector<HTMLButtonElement>('[aria-label="Light theme"]')!.click(); });
    await act(async () => {
      transitions[0].ready.reject(new Error('Transition skipped'));
      transitions[0].finished.resolve();
    });
    assert.equal(document.documentElement.hasAttribute('data-theme-switching'), true);
    assert.equal(animations.length, 0);
    await act(async () => {
      transitions[1].update();
      transitions[1].ready.resolve();
    });
    assert.equal(animations.length, 1);
    assert.equal(document.documentElement.getAttribute('data-theme'), 'light');
    assert.equal(document.querySelector('[aria-label="Light theme"]')?.getAttribute('aria-pressed'), 'true');
    await act(async () => { transitions[1].finished.resolve(); });
    assert.equal(document.documentElement.hasAttribute('data-theme-switching'), false);
  } finally {
    await act(async () => { root.unmount(); });
    env.cleanup();
  }
});

test('a skipped reveal still applies and saves the choice and clears its animation styles', async () => {
  const env = setupDom();
  const root = createRoot(document.getElementById('root')!);
  const { transitions, animations } = mockViewTransitions();
  document.documentElement.setAttribute('data-theme', 'dark');
  try {
    await act(async () => { root.render(createElement(ThemeBar)); });
    await act(async () => { document.querySelector<HTMLButtonElement>('[aria-label="Batman theme"]')!.click(); });
    await act(async () => {
      transitions[0].ready.reject(new Error('Transition skipped'));
      transitions[0].update();
      transitions[0].finished.resolve();
    });
    assert.equal(document.documentElement.getAttribute('data-theme'), 'batman');
    assert.equal(localStorage.getItem('theme'), 'batman');
    assert.match(document.cookie, /kk-theme=batman/);
    assert.equal(document.querySelector('[aria-label="Batman theme"]')?.getAttribute('aria-pressed'), 'true');
    assert.equal(animations.length, 0);
    assert.equal(document.documentElement.hasAttribute('data-theme-switching'), false);
  } finally {
    await act(async () => { root.unmount(); });
    env.cleanup();
  }
});

test('repeated fallback switches each receive a full fade without an old timer cutting it short', async t => {
  const env = setupDom();
  const root = createRoot(document.getElementById('root')!);
  Object.defineProperty(window, 'matchMedia', { value: () => ({ matches: false }) });
  document.documentElement.setAttribute('data-theme', 'dark');
  t.mock.timers.enable({ apis: ['setTimeout'] });
  try {
    await act(async () => { root.render(createElement(ThemeBar)); });
    await act(async () => { document.querySelector<HTMLButtonElement>('[aria-label="Forest theme"]')!.click(); });
    await act(async () => { t.mock.timers.tick(300); });
    await act(async () => { document.querySelector<HTMLButtonElement>('[aria-label="Light theme"]')!.click(); });
    await act(async () => { t.mock.timers.tick(100); });
    assert.equal(document.documentElement.hasAttribute('data-theme-fade'), true);
    assert.equal(document.documentElement.getAttribute('data-theme'), 'light');
    assert.equal(localStorage.getItem('theme'), 'light');
    assert.match(document.cookie, /kk-theme=light/);
    await act(async () => { t.mock.timers.tick(300); });
    assert.equal(document.documentElement.hasAttribute('data-theme-fade'), false);
    assert.equal(document.documentElement.hasAttribute('data-theme-switching'), false);
  } finally {
    await act(async () => { root.unmount(); });
    t.mock.timers.reset();
    env.cleanup();
  }
});
