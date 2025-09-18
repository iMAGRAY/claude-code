import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

type StepResult = {
  label: string;
  status: number | null;
  ok: boolean;
  stderr?: string;
};

function run(label: string, cmd: string, args: string[]): StepResult {
  const r = spawnSync(cmd, args, { encoding: 'utf-8', stdio: ['inherit', 'pipe', 'pipe'] });
  return {
    label,
    status: r.status,
    ok: r.status === 0,
    stderr: r.stderr?.trim() || undefined,
  };
}

function resolveFile(preferred: string, fallbacks: string[]): string {
  const candidates = [preferred, ...fallbacks];
  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return preferred;
}

export async function cmdVerify(argv: string[]) {
  const cwd = process.cwd();
  const requestedFile = argv[0] ? path.resolve(cwd, argv[0]) : path.resolve(cwd, '.claude', 'settings.json');
  const requestedTools = argv[1] ? path.resolve(cwd, argv[1]) : path.resolve(cwd, 'examples', 'tools.json');

  const file = resolveFile(requestedFile, [path.resolve(cwd, 'examples', 'project', '.claude', 'settings.json')]);
  const tools = resolveFile(requestedTools, [path.resolve(cwd, 'examples', 'tools.json')]);

  const settingsValidatorScript = path.resolve(cwd, 'node_modules', '@claude', 'settings-schema', 'dist', 'bin', 'validate.js');
  const settingsStep = fs.existsSync(settingsValidatorScript)
    ? { label: 'claude-settings-validate', cmd: process.execPath, args: [settingsValidatorScript, file] }
    : { label: 'claude-settings-validate', cmd: 'npx', args: ['--no-install', 'claude-settings-validate', file] };

  const steps = [
    settingsStep,
    { label: 'claude-permissions-lint', cmd: 'npx', args: ['--no-install', 'claude-permissions-lint', '--', file] },
    { label: 'claude-permissions-coverage', cmd: 'npx', args: ['--no-install', 'claude-permissions-coverage', file, tools] },
    { label: 'claude-permissions-risk', cmd: 'npx', args: ['--no-install', 'claude-permissions-risk', '--file', file, '--json'] },
    { label: 'claude-extras doctor', cmd: 'npx', args: ['--no-install', 'claude-extras', 'doctor'] },
  ] as const;

  const results: StepResult[] = steps.map((step) => run(step.label, step.cmd, [...step.args]));
  const ok = results.every((r) => r.ok);

  for (const r of results) {
    const statusText = r.status === null ? 'not found' : `exit ${r.status}`;
    const icon = r.ok ? '✅' : '❌';
    console.log(`${icon} ${r.label} (${statusText})`);
    if (!r.ok && r.stderr) console.log(`   stderr: ${r.stderr.split('\n')[0]}`);
  }

  console.log(JSON.stringify({ results }, null, 2));
  process.exit(ok ? 0 : 2);
}
