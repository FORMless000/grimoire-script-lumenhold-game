// Per-spell usage from tools/human-study.mjs --json results: each action's share of all actions, and its share of the actions
// of the loadouts whose kit has it at that tier (the kit at the tier's own level; --spread fights a few levels off share it).
//   node tools/spell-usage.mjs label=out/a.json[:role] …     role: 0 (player side) or 1 (foe side) of an asymmetric study
import fs from 'node:fs';
const R=await import('../setup/roster.mjs');
const BASIC=['strike','guard','reclaim'];
const cols=process.argv.slice(2).map(a=>{const [label,rest]=a.split('='),[file,role]=rest.split(':');const j=JSON.parse(fs.readFileSync(file,'utf8'));
 const moves=Array.isArray(j.moves)?j.moves[Number(role??0)]:j.moves;return {label,levels:j.levels,pool:j.pool,moves};});
const stats=cols.map(c=>{const all={},known={},knownTot={};let tot=0;
 for(const l of c.pool)for(const lv of c.levels){const m=c.moves[l]?.[lv]??{},n=Object.values(m).reduce((a,b)=>a+b,0);tot+=n;
  const kit=new Set([...BASIC,...Object.keys(R.generateLoadout(l,lv).spells)]);
  for(const [k,v]of Object.entries(m))all[k]=(all[k]??0)+v;
  // Hold and Release stay their own rows: the counts don't say which channel they belong to.
  for(const id of kit){knownTot[id]=(knownTot[id]??0)+n;known[id]=(known[id]??0)+(m[id]??0);}
 }
 return {all,known,knownTot,tot};});
const ids=[...new Set(stats.flatMap(s=>Object.keys(s.all)))].sort((a,b)=>stats.reduce((x,s)=>x+(s.all[b]??0)/s.tot,0)-stats.reduce((x,s)=>x+(s.all[a]??0)/s.tot,0));
const f=x=>x===undefined||!isFinite(x)?'    -':(100*x).toFixed(1).padStart(5);
console.log('action'.padEnd(12)+cols.map(c=>c.label.padStart(19)).join(''));
console.log(''.padEnd(12)+cols.map(()=>'    all  where known').join(''));
for(const id of ids)console.log(id.padEnd(12)+stats.map(s=>`  ${f((s.all[id]??0)/s.tot)}   ${s.knownTot[id]?f((s.known[id]??0)/s.knownTot[id]):'    -'}     `).join(''));
