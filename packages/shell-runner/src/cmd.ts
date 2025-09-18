import { spawn } from 'node:child_process';

export interface RunOptions {
  cwd?: string;
  env?: Record<string, string>;
  timeoutMs?: number;
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

function cmdBinary(): string {
  if (process.platform === 'win32') {
    return process.env.COMSPEC || 'cmd.exe';
  }
  return 'cmd';
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

export function runCmd(command: string, opts: RunOptions = {}): Promise<ShellResult> {
  const env = buildEnv(opts);
  const capture = opts.capture !== false;
  const binary = cmdBinary();
  const args = process.platform === 'win32' ? ['/C', command] : ['-c', command];

  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    let timer: NodeJS.Timeout | undefined;

    const child = spawn(binary, args, {
      cwd: opts.cwd,
      env,
      windowsHide: true,
    });

    child.on('error', (err) => {
      if (timer) clearTimeout(timer);
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
      resolve({ stdout, stderr, exitCode: code ?? -1 });
    });
  });
}
