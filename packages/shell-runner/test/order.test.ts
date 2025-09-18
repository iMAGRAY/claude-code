import assert from 'node:assert';
import { test } from 'node:test';
import { computeShellOrder, detectDefaultShell } from '../src/util.js';

const originalEnv = process.env.SHELL_RUNNER_SHELL;

test('compute shell order permutations', () => {
  assert.deepStrictEqual(computeShellOrder('bash'), ['bash', 'pwsh', 'cmd']);
  assert.deepStrictEqual(computeShellOrder('pwsh'), ['pwsh', 'bash', 'cmd']);
  assert.deepStrictEqual(computeShellOrder('cmd'), ['cmd', 'bash', 'pwsh']);
});

test('detect default shell respects override', () => {
  process.env.SHELL_RUNNER_SHELL = 'cmd';
  assert.strictEqual(detectDefaultShell(), 'cmd');
  if (originalEnv === undefined) {
    delete process.env.SHELL_RUNNER_SHELL;
  } else {
    process.env.SHELL_RUNNER_SHELL = originalEnv;
  }
});
