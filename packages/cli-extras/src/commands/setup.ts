import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import os from 'node:os';

function ask(q: string): Promise<string> {
  const rl = readline.createInterface({input: process.stdin, output: process.stdout});
  return new Promise(res => rl.question(q, (ans)=>{ rl.close(); res(ans.trim()); }));
}

function findPresetsDir(start: string): string | null {
  let dir = start;
  for (let i=0;i<6;i++) { // search up to 6 levels
    const p = path.join(dir, 'presets', 'managed');
    if (fs.existsSync(p)) return p;
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return null;
}

export async function cmdSetup(argv: string[]) {
  const cwd = process.cwd();
  const dst = path.join(cwd, '.claude', 'settings.json');
  const profile = (await ask('Profile (Locked-Down/Team/Solo) [Team]: ')) || 'Team';
  const shell = (await ask('Default shell (bash/pwsh) [bash]: ')) || 'bash';
  const telemetry = (await ask('Disable telemetry? (y/N): ')).toLowerCase().startsWith('y');
  const cleanup = parseInt((await ask('Cleanup period days [14]: ')) || '14',10);

  fs.mkdirSync(path.dirname(dst), {recursive:true});
  const base:any = {
    permissions: { allow: ['Bash(git log:*)','Bash(ls:*)'], deny: ['Bash(rm -rf:*)'] },
    cleanupPeriodDays: cleanup,
    telemetry: { disableTelemetry: telemetry, disableErrorReporting: telemetry },
    shell
  };
  fs.writeFileSync(dst, JSON.stringify(base, null, 2));
  console.log(`Wrote ${dst}\nProfile=${profile} Shell=${shell} TelemetryDisabled=${telemetry} Cleanup=${cleanup}`);
}
