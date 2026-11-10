import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

// Its own file (so its own process): hits.ts keeps module-level state, and the
// failure path needs a data/ directory that is readable but not writable.
const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'kk-hits-ro-'));
const dataDir = path.join(dir, 'data');
await fs.mkdir(dataDir);
await fs.writeFile(path.join(dataDir, 'hits.json'), JSON.stringify({ count: 41 }));
await fs.chmod(dataDir, 0o555);
process.chdir(dir);
const { bumpHits, getHits } = await import('../src/lib/hits');

test.after(async () => {
  await fs.chmod(dataDir, 0o755);
  await fs.rm(dir, { recursive: true, force: true });
});

test('a failed first write keeps counting from the persisted total, not from 1', async t => {
  if (process.getuid?.() === 0) return t.skip('root ignores directory permissions');
  const original = console.error;
  console.error = () => {};
  try {
    // First visitor bumps before anything has read the count (no getHits() first).
    assert.equal(await bumpHits(), 42);
    assert.equal(await bumpHits(), 43, 'Later bumps continue in memory');
    assert.equal(await getHits(), 43);
  } finally {
    console.error = original;
  }
  assert.deepEqual(JSON.parse(await fs.readFile(path.join(dataDir, 'hits.json'), 'utf-8')), { count: 41 });
});
