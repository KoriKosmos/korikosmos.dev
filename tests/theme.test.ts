import assert from 'node:assert/strict';
import test from 'node:test';
import { register } from 'node:module';
import { act, createElement } from 'react';
import { ThemeBar } from '../src/components/ThemeBar';
import { DEFAULT_THEME, THEMES, parseTheme } from '../src/lib/theme';
import { setupDom } from './dom';

// React checks input-event support on import. Give it a DOM so palette focus
// uses the browser path rather than the old Internet Explorer event polyfill.
const initialDom = setupDom();
const { createRoot } = await import('react-dom/client');
initialDom.cleanup();
register(new URL('./astroNavigationLoader.mjs', import.meta.url));
const { CommandPalette } = await import('../src/page-components/CommandPalette');

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

async function mountThemeControls() {
  const env = setupDom('<div id="root"></div><div id="palette"></div>');
  const root = createRoot(document.getElementById('root')!);
  const palette = createRoot(document.getElementById('palette')!);
  const errors: unknown[] = [];
  window.addEventListener('error', event => errors.push(event.error));
  Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', { value() {} });
  Object.defineProperties(window.HTMLDialogElement.prototype, {
    showModal: { value(this: HTMLDialogElement) { this.setAttribute('open', ''); } },
    close: { value(this: HTMLDialogElement) {
      this.removeAttribute('open');
      this.dispatchEvent(new window.Event('close'));
    } },
  });
  document.documentElement.setAttribute('data-theme', 'dark');
  const mocked = mockViewTransitions();
  await act(async () => {
    root.render(createElement(ThemeBar));
    palette.render(createElement(CommandPalette, { links: [] }));
  });
  return {
    ...mocked,
    async swatch(name: string) {
      await act(async () => { document.querySelector<HTMLButtonElement>(`[aria-label="${name} theme"]`)!.click(); });
    },
    async palette(name: string) {
      await act(async () => { document.querySelector<HTMLButtonElement>('[data-palette-trigger]')!.click(); });
      const button = [...document.querySelectorAll<HTMLButtonElement>('#palette button')]
        .find(button => button.querySelector('span')?.textContent === `Theme: ${name}`);
      assert.ok(button, `Palette offers ${name}`);
      await act(async () => { button.click(); });
    },
    async cleanup() {
      await act(async () => { root.unmount(); palette.unmount(); });
      env.cleanup();
      assert.deepEqual(errors, [], 'Theme controls must not throw browser errors');
    },
  };
}

function assertTheme(theme: string, label: string) {
  assert.equal(document.documentElement.getAttribute('data-theme'), theme);
  assert.equal(localStorage.getItem('theme'), theme);
  assert.match(document.cookie, new RegExp(`kk-theme=${theme}(?:;|$)`));
  assert.equal(document.querySelector(`[aria-label="${label} theme"]`)?.getAttribute('aria-pressed'), 'true');
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
    assert.equal(transitions.length, 1, 'The next swatch waits for the active update and reveal to settle');
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

for (const phase of ['before update', 'during reveal', 'skipped reveal'] as const) {
  test(`palette requests wait for the complete transition: ${phase}`, async () => {
    const controls = await mountThemeControls();
    try {
      await controls.swatch('Forest');
      const first = controls.transitions[0];
      if (phase === 'during reveal') {
        await act(async () => { first.update(); first.ready.resolve(); });
      } else if (phase === 'skipped reveal') {
        await act(async () => { first.ready.reject(new Error('Transition skipped')); });
      }

      // Choosing the still-visible old theme must not be discarded as a no-op.
      const label = phase === 'before update' ? 'Dark' : 'Batman';
      const theme = label.toLowerCase();
      await controls.palette(label);
      assert.equal(document.documentElement.getAttribute('data-theme'), phase === 'during reveal' ? 'forest' : 'dark');
      assert.equal(localStorage.getItem('theme'), 'forest');
      assert.match(document.cookie, /kk-theme=forest/);
      assert.equal(document.documentElement.hasAttribute('data-theme-fade'), false);
      assert.equal(document.documentElement.hasAttribute('data-theme-switching'), true);

      if (phase !== 'during reveal') {
        await act(async () => {
          first.update();
          if (phase !== 'skipped reveal') first.ready.resolve();
        });
      }
      assertTheme('forest', 'Forest');
      await act(async () => { first.finished.resolve(); });
      assertTheme(theme, label);
      assert.equal(document.documentElement.hasAttribute('data-theme-switching'), false);
      assert.equal(document.documentElement.hasAttribute('data-theme-fade'), true);
      assert.equal(controls.transitions.length, 1, 'The queued palette choice keeps its colour fade');
    } finally {
      await controls.cleanup();
    }
  });
}

test('rapid palette and swatch requests apply only the latest queued choice after the reveal', async () => {
  const controls = await mountThemeControls();
  try {
    await controls.swatch('Forest');
    const first = controls.transitions[0];
    await act(async () => { first.update(); first.ready.resolve(); });
    await controls.palette('Light');
    assertTheme('forest', 'Forest');
    await controls.swatch('Dark');
    await controls.palette('Batman');
    await controls.swatch('Spider-Man');
    assertTheme('forest', 'Forest');
    assert.equal(controls.transitions.length, 1);

    await act(async () => { first.finished.resolve(); });
    assert.equal(controls.transitions.length, 2);
    const last = controls.transitions[1];
    assert.equal(last.before.theme, 'forest');
    assert.equal(last.before.stored, 'spider-man');
    assert.match(last.before.cookie, /kk-theme=spider-man/);
    await act(async () => { last.update(); last.ready.resolve(); });
    assertTheme('spider-man', 'Spider-Man');
    await act(async () => { last.finished.resolve(); });
    assert.equal(document.documentElement.hasAttribute('data-theme-switching'), false);
    assert.equal(document.documentElement.hasAttribute('data-theme-fade'), false);
    assert.equal(controls.transitions.length, 2);
  } finally {
    await controls.cleanup();
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
