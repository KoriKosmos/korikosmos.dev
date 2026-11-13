import assert from 'node:assert/strict';
import test from 'node:test';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeBar } from '../src/components/ThemeBar';
import { DEFAULT_THEME, THEMES, parseTheme } from '../src/lib/theme';
import { setupDom } from './dom';

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
