// Refresh the standalone, reproducible worldbook stat snapshot explicitly.
import fs from 'node:fs';import crypto from 'node:crypto';import {createRequire} from 'node:module';
import {LOADOUT_SKILLS} from './loadouts.mjs';
const G=createRequire(import.meta.url)('../../src/grimoire.js');
const bytes=fs.readFileSync(new URL('../../content/world/cast.grim',import.meta.url)),hash=crypto.createHash('sha256').update(bytes).digest('hex');
const stats=Object.fromEntries(G.parseFile(bytes.toString(),'content/world/cast.grim').filter(d=>d.block==='npc').map(d=>[d.id,{skills:Object.fromEntries(LOADOUT_SKILLS.map(k=>[k,d.stats[k]])),grows:d.tags.some(t=>['peer','thornwick'].includes(t))}]));
fs.writeFileSync(new URL('./cast-stats.mjs',import.meta.url),'// Generated from content/world/cast.grim by sync-loadout-stats.mjs.\nexport const CAST_STATS_HASH='+JSON.stringify(hash)+';\nexport const CAST_STATS='+JSON.stringify(stats,null,2)+';\n');
console.log('Updated standalone worldbook stat snapshot: '+hash);
