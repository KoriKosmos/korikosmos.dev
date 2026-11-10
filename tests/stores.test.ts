import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

// The stores resolve ./data from the working directory when they load, so
// move into a scratch directory first and import them afterwards.
const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'kk-stores-'));
process.chdir(dir);
const { getGuestbook, signGuestbook } = await import('../src/lib/guestbook');
const { bumpHits, getHits } = await import('../src/lib/hits');

const readData = async (file: string) => JSON.parse(await fs.readFile(path.join(dir, 'data', file), 'utf-8'));

test.after(() => fs.rm(dir, { recursive: true, force: true }));

test('hit counter persists, and concurrent bumps never lose an increment', async () => {
  assert.equal(await getHits(), 0);
  const counts = await Promise.all(Array.from({ length: 10 }, () => bumpHits()));
  assert.deepEqual([...counts].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal(await getHits(), 10);
  assert.deepEqual(await readData('hits.json'), { count: 10 });
});

test('guestbook keeps the on-disk shape, sorts newest first, and drops unsafe URLs', async () => {
  await fs.writeFile(path.join(dir, 'data', 'guestbook.json'), JSON.stringify({
    entries: [{ id: 'old', date: '2020-01-01T00:00:00.000Z', name: 'Old', message: 'Hi' }, { junk: true }],
  }));
  assert.deepEqual((await getGuestbook()).map(e => e.id), ['old'], 'Malformed entries are filtered out');

  const signed = await signGuestbook({ name: '  Ada ', message: 'Hello', url: 'javascript:alert(1)' });
  assert.ok(signed.ok);
  assert.equal(signed.entries[0].name, 'Ada');
  assert.equal(signed.entries[0].url, undefined);
  assert.deepEqual(signed.entries.map(e => e.name), ['Ada', 'Old']);

  const file = await readData('guestbook.json');
  assert.deepEqual(Object.keys(file), ['entries']);
  assert.equal(file.entries.length, 2);

  assert.deepEqual(await signGuestbook({ name: '', message: 'x' }), { ok: false, error: 'Please enter a name.' });
});

test('a full guestbook refuses new signatures without rewriting the file', async () => {
  const entries = Array.from({ length: 200 }, (_, i) => ({
    id: String(i), date: new Date(Date.UTC(2021, 0, 1, 0, 0, i)).toISOString(), name: `N${i}`, message: 'm',
  }));
  const target = path.join(dir, 'data', 'guestbook.json');
  await fs.writeFile(target, JSON.stringify({ entries }));
  const before = await fs.stat(target);

  const result = await signGuestbook({ name: 'Late', message: 'Too late' });
  assert.equal(result.ok, false);
  assert.match(!result.ok ? result.error : '', /full/);
  assert.equal((await fs.stat(target)).mtimeMs, before.mtimeMs, 'No write happens when the book is full');
  assert.equal((await getGuestbook()).length, 200);
});
