import assert from 'node:assert/strict';
import test from 'node:test';
import { checkRateLimit, getClientKey } from '../src/lib/rateLimit';

const req = (headers: Record<string, string>) => new Request('https://korikosmos.dev/api/guestbook', { headers });

test('client key prefers the Cloudflare-verified address over client-supplied forwarding headers', () => {
  // A spoofed first X-Forwarded-For entry must not decide the bucket when Cloudflare names the real peer.
  assert.equal(getClientKey(req({ 'cf-connecting-ip': '203.0.113.7', 'x-forwarded-for': '1.2.3.4, 203.0.113.7' })), '203.0.113.7');
  assert.equal(getClientKey(req({ 'x-forwarded-for': ' 198.51.100.2 , 10.0.0.1' })), '198.51.100.2');
  assert.equal(getClientKey(req({ 'x-real-ip': '198.51.100.9' })), '198.51.100.9');
  assert.equal(getClientKey(req({}), '127.0.0.1'), '127.0.0.1');
  assert.equal(getClientKey(req({})), 'unknown');
});

test('rate limiter allows a burst up to the limit, then blocks within the window', () => {
  const bucket = `test-${Math.random()}`;
  assert.equal(checkRateLimit(bucket, 'a', 60_000, 2), true);
  assert.equal(checkRateLimit(bucket, 'a', 60_000, 2), true);
  assert.equal(checkRateLimit(bucket, 'a', 60_000, 2), false);
  assert.equal(checkRateLimit(bucket, 'b', 60_000, 2), true, 'Other clients have their own budget');
});
