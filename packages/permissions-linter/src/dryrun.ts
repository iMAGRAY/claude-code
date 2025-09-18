import { toASCII } from 'node:punycode';
import { DryRunResult, EffectiveRule, Settings, Action } from './types.js';

function matchBashRule(args: string, patternArg: string): boolean {
  // Expect 'cmd:rest*' style prefix
  const [cmd, rest] = patternArg.split(':',2);
  if (!cmd) return false;
  const trimmed = args.trim();
  if (!trimmed.startsWith(cmd)) return false;
  if (rest && rest.endsWith('*')) {
    return true; // simple prefix accept given command name matches
  }
  // Exact subcommand match if provided (e.g., 'git log' vs 'git')
  if (rest) {
    const need = rest.replace(/\*$/,'').trim();
    return trimmed.startsWith(`${cmd} ${need}`);
  }
  return true;
}

function matchWebFetchRule(url: string, patternArg: string): boolean {
  try {
    const request = new URL(url);
    const allowAnyPath = patternArg.endsWith(':*');
    const basePattern = allowAnyPath ? patternArg.slice(0, -2) : patternArg;
    const patternUrl = new URL(basePattern);
    const req = normalizeUrlForMatch(url);
    const pat = normalizeUrlForMatch(patternUrl.toString());
    if (pat.scheme && pat.scheme !== req.scheme) return false;
    if (pat.hostWithPort && pat.hostWithPort !== req.hostWithPort) return false;
    if (allowAnyPath) return true;
    const patternPath = patternUrl.pathname || '/';
    const requestPath = request.pathname || '/';
    return requestPath === patternPath;
  } catch {
    return false;
  }
}

function decideForPattern(tool: string, args: string, pattern: string, baseDir?: string): boolean {
  const m = /^([A-Za-z]+)\((.*)\)$/.exec(pattern.trim());
  if (!m) return false;
  const pt = m[1], parg = m[2];
  if (pt !== tool) return false;
  if (tool === 'Bash') return matchBashRule(args, parg);
  if (tool === 'Read' || tool === 'Write' || tool === 'Edit' || tool === 'Grep') {
    return matchPath(parg, args, baseDir);
  }
  if (tool === 'WebFetch') {
    return matchWebFetchRule(args, parg);
  }
  // Fallback: simple wildcard presence allows (prefix‑ish)
  if (parg === '*' || parg.endsWith('*')) return true;
  return false;
}


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

function globToRegExp(glob: string): RegExp {
  return new RegExp('^' + globToRegexBody(glob) + '$');
}

function matchPath(ruleArg: string, p: string, baseDir?: string): boolean {
  const pattern = ruleArg.trim().replace(/^\.\//, '');
  const candidate = p.replace(/\\/g, '/').replace(/^\.\//, '');
  const re = globToRegExp(pattern);
  return re.test(candidate);
}


function normalizeUrlForMatch(url: string) {
  const u = new URL(url);
  const scheme = (u.protocol||'').replace(':','').toLowerCase();
  // default ports
  const port = u.port || (scheme==='https' ? '443' : (scheme==='http' ? '80' : ''));
  const host = toASCII(u.hostname.replace(/\.$/, '').toLowerCase());
  const hostWithPort = port ? host + ':' + port : host;
  return { scheme, host, hostWithPort };
}

export function dryRun(settings: Settings, tool: string, args: string, baseDir?: string): DryRunResult {
  const pol = settings.permissions || {};
  const rules: EffectiveRule[] = [];
  for (const action of (['deny','ask','allow'] as Action[])) {
    const arr = (pol as any)[action] as string[]|undefined;
    if (!arr) continue;
    for (const p of arr) rules.push({action, pattern: p, source: 'merged'});
  }

  for (const r of rules) {
    if (decideForPattern(tool, args, r.pattern, baseDir)) {
      return { decision: r.action, matchedRule: r, notes: [`Matched ${r.pattern}`]};
    }
  }
  if (settings.bypassPermissions) return { decision: 'bypass', notes: ['Bypass enabled']};
  return { decision: 'deny', notes: ['No matching rule and bypass disabled']};
}
