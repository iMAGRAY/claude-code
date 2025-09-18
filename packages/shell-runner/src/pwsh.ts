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
}

export interface ShellResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

const TMP_PREFIX = 'claude-pwsh-';

function defaultBinary(): string {
  return process.env.SHELL_RUNNER_PWSH || 'pwsh';
}

export function resolvePwshBinary(): string {
  return defaultBinary();
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

function isWindowsPowerShell(binary: string): boolean {
  const lower = binary.toLowerCase();
  return lower === 'powershell' || lower === 'powershell.exe';
}

function runPwshWithBinary(command: string, binary: string, opts: RunOptions): Promise<ShellResult> {
  const scriptMode = opts.useScriptMode ?? isComplex(command);
  const env = buildEnv(opts);
  const capture = opts.capture !== false;
  const powershellExe = isWindowsPowerShell(binary);

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

    let args: string[];
    try {
      if (scriptMode) {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), TMP_PREFIX));
        scriptPath = path.join(tempDir, 'script.ps1');
        fs.writeFileSync(scriptPath, `${command}\n`, { encoding: 'utf-8' });
        if (powershellExe) {
          args = ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', scriptPath];
        } else {
          args = ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', scriptPath];
        }
      } else {
        if (powershellExe) {
          args = ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', command];
        } else {
          args = ['-NoProfile', '-NonInteractive', '-Command', command];
        }
      }
    } catch (err) {
      cleanup();
      reject(err);
      return;
    }

    const child = spawn(binary, args, {
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
        try { child.kill(); } catch {}
      }, opts.timeoutMs);
    }

    child.on('close', (code) => {
      if (timer) clearTimeout(timer);
      cleanup();
      resolve({ stdout, stderr, exitCode: code ?? -1 });
    });
  });
}

export function runPwsh(command: string, opts?: RunOptions): Promise<ShellResult> {
  return runPwshWithBinary(command, defaultBinary(), opts ?? {});
}

export function runPwshBinary(command: string, binary: string, opts?: RunOptions): Promise<ShellResult> {
  return runPwshWithBinary(command, binary, opts ?? {});
}
