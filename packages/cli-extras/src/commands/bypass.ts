import fs from 'node:fs';
import path from 'node:path';

export async function cmdBypass(argv: string[]) {
  const sub = argv[0] || 'status';
  const base = process.env.CLAUDE_BYPASS_AUDIT_PATH || path.join(process.cwd(), '.claude');
  const file = path.join(base, 'audit-bypass.log.jsonl');
  if (sub==='enable') {
    const keep = parseInt(process.env.CLAUDE_BYPASS_AUDIT_KEEP || '5000', 10);
    fs.mkdirSync(path.dirname(file), {recursive:true});
    fs.appendFileSync(file, JSON.stringify({ ts: Date.now(), action: 'enable-bypass', cwd: process.cwd() }) + '\n');
    try { const lines = fs.readFileSync(file,'utf-8').trim().split('\n'); if (lines.length>keep) fs.writeFileSync(file, lines.slice(-keep).join('\n')+'\n'); } catch {}
    console.log('Bypass ENABLED (audit logged).');
    return;
  }
  if (sub==='disable') {
    fs.mkdirSync(path.dirname(file), {recursive:true});
    fs.appendFileSync(file, JSON.stringify({ ts: Date.now(), action: 'disable-bypass', cwd: process.cwd() }) + '\n');
    console.log('Bypass DISABLED (audit logged).');
    return;
  }
  if (sub==='status') {
    if (fs.existsSync(file)) {
      const lines = fs.readFileSync(file,'utf-8').trim().split('\n').filter(Boolean);
      const last = lines.length ? JSON.parse(lines[lines.length-1]) : null;
      console.log(JSON.stringify({ last }, null, 2));
    } else {
      console.log(JSON.stringify({ last: null }, null, 2));
    }
    return;
  }
  console.log('bypass enable|disable|status');
}
