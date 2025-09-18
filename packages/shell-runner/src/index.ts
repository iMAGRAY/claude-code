import { detectDefaultShell, computeShellOrder, isMissingShellError, Shell } from './util.js';
import { runBash, RunOptions as BashRunOptions } from './bash.js';
import { runPwshBinary, resolvePwshBinary, RunOptions as PwshRunOptions } from './pwsh.js';

export type RunOptions = (BashRunOptions & PwshRunOptions) & { shell?: Shell };

function enrichMissingShellError(shell: Shell, original: unknown): Error {
  const suffix = shell === 'bash'
    ? "Install bash or point SHELL_RUNNER_BASH to the binary."
    : shell === 'pwsh'
      ? "Install PowerShell (pwsh) or set SHELL_RUNNER_PWSH/PWSH to an existing executable."
      : "Install cmd.exe or set SHELL_RUNNER_SHELL to an available shell.";
  const err = original instanceof Error ? original : undefined;
  const message = `Shell '${shell}' was not found. ${suffix}`;
  const enriched = new Error(message);
  if (err && typeof enriched === 'object') {
    (enriched as Error & { cause?: unknown }).cause = err;
  }
  return enriched;
}

export async function run(command: string, opts: RunOptions = {}) {
  const trySpawn = async (shell: Shell) => {
    try {
      if (shell === 'bash') {
        return await runBash(command, opts);
      }
      if (shell === 'pwsh') {
        try {
          return await runPwshBinary(command, resolvePwshBinary(), opts);
        } catch (err) {
          if (isMissingShellError(err) && process.platform === 'win32') {
            try {
              return await runPwshBinary(command, 'powershell.exe', opts);
            } catch (fallbackErr) {
              if (isMissingShellError(fallbackErr)) {
                throw fallbackErr;
              }
              throw fallbackErr;
            }
          }
          throw err;
        }
      }
      const { runCmd } = await import('./cmd.js');
      return await runCmd(command, opts);
    } catch (err) {
      if (isMissingShellError(err)) {
        throw enrichMissingShellError(shell, err);
      }
      throw err;
    }
  };

  const preferred = opts.shell || detectDefaultShell();
  const order = computeShellOrder(preferred);

  let lastErr: unknown;
  for (const shell of order) {
    try {
      return await trySpawn(shell);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}
