import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

function id() { return crypto.randomBytes(6).toString('hex'); }

export async function cmdSession(argv: string[]) {
  const sub = argv[0];
  const root = path.join(process.cwd(), '.claude', 'sessions');
  fs.mkdirSync(root, {recursive:true});

  if (sub==='start') {
    const ttlArgIdx = argv.findIndex(x=>x==='--ttl');
    const ttl = ttlArgIdx>=0 ? argv[ttlArgIdx+1] : undefined;
    const ephemeral = argv.includes('--ephemeral');
    const sid = id();
    const dir = path.join(root, sid);
    fs.mkdirSync(dir, {recursive:true});
    fs.writeFileSync(path.join(dir,'meta.json'), JSON.stringify({ sid, createdAt: Date.now(), ephemeral, ttl }, null, 2));
    console.log(JSON.stringify({sid, dir, ephemeral}, null, 2));
    return;
  }
  if (sub==='cleanup') {
    const now = Date.now();
    const entries = fs.readdirSync(root, {withFileTypes:true}).filter(e=>e.isDirectory()).map(e=>e.name);
    let removed = 0;
    for (const d of entries) {
      const metaPath = path.join(root, d, 'meta.json');
      const meta = JSON.parse(fs.readFileSync(metaPath,'utf-8'));
      if (meta.ttl) {
        const m = String(meta.ttl);
        const ms = m.endsWith('h') ? parseInt(m)*3600*1000 : (m.endsWith('m')? parseInt(m)*60*1000 : parseInt(m));
        if (!Number.isNaN(ms) && meta.createdAt + ms < now) meta.ephemeral = true;
      }
      if (meta.ephemeral) {
        fs.rmSync(path.join(root,d), {recursive:true, force:true});
        removed++;
      }
    }
    console.log(JSON.stringify({removed}, null, 2));
    return;
  }
  console.log('session start [--ephemeral] | session cleanup');
}
