import { createRequire } from 'node:module';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadSettings, dryRun } from '@claude/permissions-linter';

const require = createRequire(import.meta.url);
const permPkgPath = require.resolve('@claude/permissions-linter/package.json');
const permRoot = path.dirname(permPkgPath);

const BIN_COMMANDS = new Set(['lint', 'fix', 'show', 'coverage', 'normalize', 'risk']);

function runPermissionsBin(cmd: string, args: string[]): number {
  const binFile = path.join(permRoot, 'dist', 'bin', `claude-permissions-${cmd}.js`);
  const result = spawnSync(process.execPath, [binFile, ...args], { stdio: 'inherit' });
  if (result.error) throw result.error;
  return result.status ?? 0;
}

export async function cmdPermissions(argv: string[]) {
  const sub = argv[0] || 'help';
  if (sub === 'help') {
    console.log('permissions lint|fix|show|dry-run|coverage|normalize|risk');
    return;
  }
  if (BIN_COMMANDS.has(sub)) {
    const status = runPermissionsBin(sub, argv.slice(1));
    if (status !== 0) process.exitCode = status;
    return;
  }
  if (sub === 'dry-run') {
    const file = argv[1] || './.claude/settings.json';
    const tool = argv[2] || 'Bash';
    const cmd = argv.slice(3).join(' ') || 'echo ok';
    const s = loadSettings(file);
    const res = dryRun(s, tool, cmd);
    console.log(JSON.stringify(res, null, 2));
    return;
  }
  console.log('Unknown permissions command. Use `permissions help` for usage.');
}
