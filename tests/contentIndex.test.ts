import assert from 'node:assert/strict';
import test from 'node:test';
import { CONTENT_INDEX_URL, loadContentIndex } from '../src/lib/contentIndex';

test('content index is fetched once, shared, and retried after a failure', async () => {
  const urls: string[] = [];
  let fail = true;
  const fetcher = (async (input: RequestInfo | URL) => {
    urls.push(String(input));
    if (fail) return new Response('nope', { status: 500 });
    return Response.json([{ section: 'Blog', title: 'Post', desc: 'About', url: '/blog/post' }]);
  }) as typeof fetch;

  assert.deepEqual(await loadContentIndex(fetcher), [], 'A failed fetch degrades to an empty list');
  fail = false;
  const [a, b] = await Promise.all([loadContentIndex(fetcher), loadContentIndex(fetcher)]);
  assert.equal(a, b, 'Concurrent callers share one request');
  assert.equal(a[0].url, '/blog/post');
  await loadContentIndex(fetcher);
  assert.deepEqual(urls, [CONTENT_INDEX_URL, CONTENT_INDEX_URL], 'The failure was retried once, then cached');
});
