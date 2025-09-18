export type Shell = 'bash' | 'pwsh' | 'cmd';

const COMPLEX_PATTERN = /[|&><`$]|\b(?:&&|\|\|)\b|<<</;

export function isComplex(command: string): boolean {
  return command.length > 200 || COMPLEX_PATTERN.test(command);
}

function normalizeShell(preference?: string | null): Shell | undefined {
  if (!preference) return undefined;
  const lower = preference.toLowerCase();
  if (lower === 'bash' || lower === 'pwsh' || lower === 'cmd') return lower;
  if (lower === 'powershell' || lower === 'powershell.exe') return 'pwsh';
  return undefined;
}

export function detectDefaultShell(): Shell {
  const fromEnv = normalizeShell(process.env.SHELL_RUNNER_SHELL);
  if (fromEnv) return fromEnv;
  if (process.platform === 'win32') return 'pwsh';
  return 'bash';
}

export function computeShellOrder(preferred: Shell): Shell[] {
  switch (preferred) {
    case 'bash':
      return ['bash', 'pwsh', 'cmd'];
    case 'pwsh':
      return ['pwsh', 'bash', 'cmd'];
    case 'cmd':
      return ['cmd', 'bash', 'pwsh'];
    default:
      return ['bash', 'pwsh', 'cmd'];
  }
}

export function isMissingShellError(error: unknown): error is NodeJS.ErrnoException {
  if (!error || typeof error !== 'object') return false;
  const err = error as NodeJS.ErrnoException;
  return err.code === 'ENOENT' || /ENOENT/.test(String(err));
}
