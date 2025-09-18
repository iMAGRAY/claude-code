import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { isComplex } from './util.js';

export interface RunOptions {
  cwd?: string;
  env?: Record<string, string>;
  timeoutMs?: number;
  useScriptMode?: boolean;
  input?: string;
  onStdout?: (chunk: string) => void;
  onStderr?: (chunk: string) => void;
  redact?: (value: string) => string;
  capture?: boolean;
  safeEnv?: 'inherit' | 'minimal';
  strictMode?: boolean;
}

export interface ShellResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

const TMP_PREFIX = 'claude-bash-';

function bashPath(): string {
  return process.env.SHELL_RUNNER_BASH || 'bash';
}

function buildEnv(opts: RunOptions): Record<string, string> {
  if (opts.safeEnv === 'minimal') {
    return { ...(opts.env ?? {}) };
  }
  return { ...process.env, ...(opts.env ?? {}) } as Record<string, string>;
}

function applyRedaction(value: string, redact?: (input: string) => string): string {
  return redact ? redact(value) : value;
}

export function runBash(command: string, opts: RunOptions = {}): Promise<ShellResult> {
  const scriptMode = opts.useScriptMode ?? isComplex(command);
  const env = buildEnv(opts);
  const capture = opts.capture !== false;
  const prolog = opts.strictMode === false ? '' : 'set -euo pipefail\n';

  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    let timer: NodeJS.Timeout | undefined;
    let tempDir: string | undefined;
    let scriptPath: string | undefined;

    const cleanup = () => {
      if (scriptPath) {
        try { fs.rmSync(scriptPath, { force: true }); } catch {}
      }
      if (tempDir) {
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
      }
    };

    const args: string[] = [];
    try {
      if (scriptMode) {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), TMP_PREFIX));
        scriptPath = path.join(tempDir, 'script.sh');
        const body = `#!/usr/bin/env bash\n${prolog}${command}\n`;
        fs.writeFileSync(scriptPath, body, { encoding: 'utf-8', mode: 0o755 });
        args.push(scriptPath);
      } else {
        args.push('-lc', `${prolog}${command}`);
      }
    } catch (err) {
      cleanup();
      reject(err);
      return;
    }

    const child = spawn(bashPath(), args, {
      cwd: opts.cwd,
      env,
      windowsHide: true,
    });

    child.on('error', (err) => {
      if (timer) clearTimeout(timer);
      cleanup();
      reject(err);
    });

    child.stdout.on('data', (chunk: Buffer) => {
      let text = chunk.toString();
      text = applyRedaction(text, opts.redact);
      opts.onStdout?.(text);
      if (capture) stdout += text;
    });

    child.stderr.on('data', (chunk: Buffer) => {
      let text = chunk.toString();
      text = applyRedaction(text, opts.redact);
      opts.onStderr?.(text);
      if (capture) stderr += text;
    });

    if (opts.input) {
      child.stdin.write(opts.input);
      child.stdin.end();
    }

    if (opts.timeoutMs) {
      timer = setTimeout(() => {
        try { child.kill('SIGKILL'); } catch {}
      }, opts.timeoutMs);
    }

    child.on('close', (code) => {
      if (timer) clearTimeout(timer);
      cleanup();
      resolve({ stdout, stderr, exitCode: code ?? -1 });
    });
  });
}
