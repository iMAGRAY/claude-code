import path from 'node:path';
import os from 'node:os';

function toPosix(p: string) { return p.replace(/\\+/g,'/'); }

function escapeRegexChar(ch: string): string {
  return ch.replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&');
}

function globToRegexBody(glob: string): string {
  let regex = '';
  for (let i = 0; i < glob.length; ) {
    const ch = glob[i];
    if (ch === '*') {
      if (glob[i + 1] === '*') {
        const next = glob[i + 2];
        if (next === '/') {
          regex += '(?:.*/)?';
          i += 3;
        } else {
          regex += '.*';
          i += 2;
        }
      } else {
        regex += '[^/]*';
        i += 1;
      }
    } else if (ch === '?') {
      regex += '[^/]';
      i += 1;
    } else {
      regex += escapeRegexChar(ch);
      i += 1;
    }
  }
  return regex;
}

export interface IgnoreRule {
  neg: boolean;
  dirOnly: boolean;
  re: RegExp;
}

/** Parse a gitignore-like pattern into flags and RegExp anchored to a base directory. */
export function compileRule(pattern: string, baseDir: string): IgnoreRule | null {
  let p = pattern;
  // strip comments unless escaped
  if (/^\s*#/.test(p)) return null;
  p = p.replace(/\\#/g, '\u0000'); // escape '#'
  p = p.trim();
  p = p.replace(/\u0000/g, '#');

  if (!p) return null;

  let neg = false;
  if (p.startsWith('!')) { neg = true; p = p.slice(1); }

  // Track if pattern is directory-only (trailing slash)
  let dirOnly = false;
  if (p.endsWith('/')) { dirOnly = true; p = p.slice(0,-1); }

  // Anchoring
  let anchored = false;
  let absBase = baseDir;

  if (p.startsWith('//')) { anchored = true; absBase = '/'; p = p.slice(2); }
  if (p.startsWith('~/')) { anchored = true; absBase = os.homedir() || baseDir; p = p.slice(2); }
  if (p.startsWith('/'))  { anchored = true; p = p.slice(1); }
  if (p.startsWith('./')) { anchored = true; p = p.slice(2); }

  // Build regex
  // '**/' → any subdir (optional), '/**' or '**' → any depth
  const body = globToRegexBody(p);

  // Dir suffix
  const suffix = dirOnly ? '(?:/.*)?' : '';

  const root = anchored ? '^' + toPosix(path.resolve(absBase)).replace(/\/+$/,'') + '/' : '(^|.*/)';
  const full = root + body + suffix + '$';
  return { neg, dirOnly, re: new RegExp(full) };
}

/** Match path against multiple patterns with negation precedence (last match wins). */
export function matchGitignore(patterns: string[], filePath: string, baseDir: string): boolean {
  const fp = toPosix(path.resolve(filePath));
  let decision: boolean | null = null;
  for (const raw of patterns) {
    const r = compileRule(raw, baseDir);
    if (!r) continue;
    const hit = r.re.test(fp);
    if (!hit) continue;
    decision = !r.neg; // negation flips last decision
  }
  return decision ?? false;
}

export function matchGitignoreSingle(pattern: string, filePath: string, baseDir: string): boolean {
  const rule = compileRule(pattern, baseDir);
  if (!rule) return false;
  const fp = toPosix(path.resolve(filePath));
  const hit = rule.re.test(fp);
  return rule.neg ? !hit : hit;
}
