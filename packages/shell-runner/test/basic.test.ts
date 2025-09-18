import assert from 'node:assert';
import { test } from 'node:test';
import { run } from '../src/index.js';

test('run executes simple command', async () => {
  const res = await run('echo hello');
  assert.strictEqual(res.exitCode, 0);
  assert.ok(res.stdout.toLowerCase().includes('hello'));
});
