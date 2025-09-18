import { loadSettings, lintPolicy, dryRun } from '@claude/permissions-linter';
export async function cmdPermissions(argv: string[]) {
  const sub = argv[0] || 'help';
  if (sub==='help') {
    console.log(`permissions lint|fix|show|dry-run`);
    return;
  }
  if (sub==='dry-run') {
    const file = argv[1] || './.claude/settings.json';
    const tool = argv[2] || 'Bash';
    const cmd = argv.slice(3).join(' ') || 'echo ok';
    const s = loadSettings(file);
    const res = dryRun(s, tool, cmd);
    console.log(JSON.stringify(res, null, 2));
    return;
  }
  console.log('Use dedicated binaries from @claude/permissions-linter for lint/fix/show.');
}
