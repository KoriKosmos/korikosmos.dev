import assert from 'node:assert/strict';
import test from 'node:test';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeBar } from '../src/components/ThemeBar';
import { switchTheme } from '../src/lib/themeSwitch';
import { setupDom } from './dom';

/**
 * A stand-in for the View Transitions API that keeps the parts the switcher
 * relies on: the update callback runs only once the old view is captured,
 * starting a transition skips the one in flight, and a skipped transition
 * rejects `ready` but still runs its update before `finished` settles.
 */
class FakeTransition {
  skipped = false;
  private updated = false;
  private settle!: () => void;
  private start!: () => void;
  private abort!: (error: Error) => void;
  readonly ready = new Promise<void>((resolve, reject) => { this.start = resolve; this.abort = reject; });
  readonly finished = new Promise<void>(resolve => { this.settle = resolve; });

  constructor(private readonly update: () => void) {}

  private runUpdate() {
    if (this.updated) return;
    this.updated = true;
    this.update();
  }

  /** The old view is captured: the DOM updates and the animation begins. */
  capture() {
    this.runUpdate();
    this.start();
  }

  end() {
    this.settle();
  }

  skipTransition() {
    if (this.skipped) return;
    this.skipped = true;
    this.abort(new Error('AbortError: Transition was skipped'));
    queueMicrotask(() => { this.runUpdate(); this.settle(); });
  }
}

function setup({ reduceMotion = false } = {}) {
  const env = setupDom();
  const transitions: FakeTransition[] = [];
  const root = document.documentElement;
  root.setAttribute('data-theme', 'dark');
  root.animate = (() => {}) as unknown as HTMLElement['animate'];
  Object.defineProperty(window, 'matchMedia', { value: () => ({ matches: reduceMotion }) });
  Object.defineProperty(document, 'startViewTransition', {
    configurable: true,
    value: (update: () => void) => {
      transitions.at(-1)?.skipTransition();
      const transition = new FakeTransition(update);
      transitions.push(transition);
      return transition;
    },
  });
  return { env, root, transitions };
}

const settle = () => new Promise(resolve => setTimeout(resolve, 0));
const at = { x: 10, y: 10 };

test('a newer swatch click interrupts the reveal in flight instead of queueing', async () => {
  const { env, root, transitions } = setup();
  try {
    switchTheme('forest', at);
    transitions[0].capture();
    switchTheme('light', at);
    assert.equal(transitions.length, 2);
    assert.equal(transitions[0].skipped, true);
    await settle();
    // The interrupted reveal settles while its replacement is still running.
    assert.equal(root.hasAttribute('data-theme-switching'), true);

    transitions[1].capture();
    assert.equal(root.getAttribute('data-theme'), 'light');
    transitions[1].end();
    await settle();
    assert.equal(root.hasAttribute('data-theme-switching'), false);
    assert.match(document.cookie, /kk-theme=light/);
  } finally {
    env.cleanup();
  }
});

test('a skipped reveal whose update runs late cannot bring its theme back', async () => {
  const { env, root, transitions } = setup();
  try {
    switchTheme('forest', at);
    // A palette choice lands before the browser captured the old view.
    switchTheme('batman');
    assert.equal(root.getAttribute('data-theme'), 'batman');
    assert.equal(root.hasAttribute('data-theme-fade'), true);
    await settle();
    assert.equal(transitions[0].skipped, true);
    assert.equal(root.getAttribute('data-theme'), 'batman');
    assert.equal(root.hasAttribute('data-theme-switching'), false);
    assert.equal(localStorage.getItem('theme'), 'batman');
  } finally {
    env.cleanup();
  }
});

test('the choice is saved before the snapshot, and repeating it does not restart the reveal', async () => {
  const { env, root, transitions } = setup();
  try {
    switchTheme('spider-man', at);
    assert.equal(root.getAttribute('data-theme'), 'dark');
    assert.equal(localStorage.getItem('theme'), 'spider-man');
    assert.match(document.cookie, /kk-theme=spider-man/);

    switchTheme('spider-man', at);
    assert.equal(transitions.length, 1);

    transitions[0].capture();
    transitions[0].end();
    await settle();
    switchTheme('spider-man', at);
    assert.equal(transitions.length, 1);
  } finally {
    env.cleanup();
  }
});

test('reduced motion switches instantly with no reveal or fade', () => {
  const { env, root, transitions } = setup({ reduceMotion: true });
  try {
    switchTheme('forest', at);
    assert.equal(transitions.length, 0);
    assert.equal(root.getAttribute('data-theme'), 'forest');
    assert.equal(root.hasAttribute('data-theme-fade'), false);
  } finally {
    env.cleanup();
  }
});

test('the swatch highlight moves with the colours, not with the click', async () => {
  const { env, transitions } = setup();
  const reactRoot = createRoot(document.getElementById('root')!);
  const pressed = () => document.querySelector('[aria-pressed="true"]')?.getAttribute('aria-label');
  try {
    await act(async () => { reactRoot.render(createElement(ThemeBar)); });
    assert.equal(pressed(), 'Dark theme');
    await act(async () => { document.querySelector<HTMLButtonElement>('[aria-label="Forest theme"]')!.click(); });
    assert.equal(pressed(), 'Dark theme');
    await act(async () => { transitions[0].capture(); });
    assert.equal(pressed(), 'Forest theme');
    transitions[0].end();
    await settle();
  } finally {
    await act(async () => { reactRoot.unmount(); });
    env.cleanup();
  }
});
