import assert from 'node:assert/strict';
import test from 'node:test';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { formatPostDate, readingMinutes } from '../src/lib/reading';
import { PostContents } from '../src/page-components/PostContents';
import { ReadingTools } from '../src/page-components/ReadingTools';
import { setupDom } from './dom';

test('reading estimates ignore link destinations and dates use British UTC formatting', () => {
  assert.equal(readingMinutes(''), 1);
  assert.equal(readingMinutes('word '.repeat(221)), 2);
  assert.equal(readingMinutes('[A short link](https://example.com/' + 'path/'.repeat(400) + ')'), 1);
  assert.equal(formatPostDate('2026-07-10T00:00:00.000Z'), '10 July 2026');
});

test('contents links reuse actual heading slugs and short posts have no empty contents box', () => {
  const headings = [
    { depth: 1, slug: 'title', text: 'Title' },
    { depth: 2, slug: 'same-name', text: 'Same name' },
    { depth: 3, slug: 'same-name-1', text: 'Same name' },
    { depth: 4, slug: 'detail', text: 'Detail' },
  ];
  const html = renderToStaticMarkup(createElement(PostContents, { headings }));
  assert.match(html, /href="#same-name-1"/);
  assert.doesNotMatch(html, /href="#title"|href="#detail"/);
  assert.equal(renderToStaticMarkup(createElement(PostContents, { headings: [] })), '');
});

test('reading tools copy exact code and section links, and restore the article on unmount', async () => {
  const env = setupDom('<div id="root"></div><div data-reader-content><pre><code>const x = 1;\n  x++;</code></pre></div>');
  const root = createRoot(document.getElementById('root')!);
  const copied: string[] = [];
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => { copied.push(text); } } });
  try {
    await act(async () => { root.render(createElement(ReadingTools)); });
    const codeButton = document.querySelector<HTMLButtonElement>('[aria-label="Copy code block"]')!;
    await act(async () => { codeButton.click(); });
    assert.equal(copied[0], 'const x = 1;\n  x++;');
    assert.equal(document.querySelector('[role="status"]')?.textContent, 'Code copied.');
    await act(async () => { document.querySelector<HTMLButtonElement>('#root button')!.click(); });
    assert.equal(copied[1], 'https://korikosmos.dev/blog/example#details');
    await act(async () => { root.unmount(); });
    assert.equal(document.querySelectorAll('.reader-code').length, 0);
    assert.equal(document.querySelectorAll('[data-reader-content] > pre').length, 1);
  } finally {
    env.cleanup();
  }
});

test('clipboard failure is announced without losing the readable content', async () => {
  const env = setupDom('<div id="root"></div><div data-reader-content>Still readable</div>');
  const root = createRoot(document.getElementById('root')!);
  try {
    await act(async () => { root.render(createElement(ReadingTools, { retro: true })); });
    await act(async () => { document.querySelector<HTMLButtonElement>('#root button')!.click(); });
    assert.match(document.querySelector('[role="status"]')?.textContent ?? '', /Copy is unavailable/);
    assert.equal(document.querySelector('[data-reader-content]')?.textContent, 'Still readable');
  } finally {
    await act(async () => { root.unmount(); });
    env.cleanup();
  }
});
