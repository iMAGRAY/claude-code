import { spawnSync } from 'node:child_process';
import os from 'node:os';
import fs from 'node:fs';

function check(cmd: string, args: string[]) {
  const r = spawnSync(cmd, args, {encoding:'utf-8'});
  return { ok: r.status === 0, status: r.status, stdout: r.stdout, stderr: r.stderr };
}

export async function cmdDoctor(argv: string[]) {
  const out: any = {};
  out.node = process.version;
  out.platform = process.platform;
  out.bash = check('bash', ['--version']).ok;
  out.pwsh = check(process.platform==='win32' ? 'powershell.exe' : 'pwsh', process.platform==='win32' ? ['-Command','$PSVersionTable.PSVersion'] : ['-NoProfile','-NonInteractive','-Command','$PSVersionTable.PSVersion']).ok;
  out.cmd = process.platform === 'win32' ? true : false;
  out.git = check('git', ['--version']).ok;
  out.tmpWritable = (()=>{
    try {
      const f = os.tmpdir()+'/.cc_probe_'+Date.now();
      fs.writeFileSync(f,'x'); fs.unlinkSync(f); return true;
    } catch { return false; }
  })();
  console.log(JSON.stringify(out, null, 2));
  const critical = (!out.bash && !out.pwsh && !out.cmd) || !out.tmpWritable;
  process.exit(critical ? 2 : 0);
}
