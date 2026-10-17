// How good each spell and action is, from a traced suite (tools/playtest.sh, or tools/suite-f5.sh with TRACE=1).
//   node tools/action-report.mjs <name> [--gaps|--all]   reads out/<name>_cross.traces.jsonl (and _gaps with --gaps; only the all-spells arm with --all); prints markdown
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {SPELLS} from '../setup/roster.mjs';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const [name,...flags]=process.argv.slice(2);if(!name){console.error('usage: node tools/action-report.mjs <name> [--gaps]');process.exit(2);}
const files=(flags.includes('--all')?[`${name}_all`]:[`${name}_cross`,...(flags.includes('--gaps')?[`${name}_gaps`]:[])]).map(f=>path.join(root,'out',f+'.traces.jsonl'));
for(const f of files)if(!fs.existsSync(f))throw Error(`No ${path.relative(root,f)}: run tools/playtest.sh ${name} (or suite-f5.sh with TRACE=1)`);

const BASIC={strike:'Strike',guard:'Guard',reclaim:'Reclaim'};
const label=k=>k.startsWith('bundle:')?'Haste: '+parts(k).map(p=>BASIC[p]).join(' + '):k.startsWith('hold:')?`Hold (${SPELLS[k.slice(5)].name})`:k.startsWith('release:')?`Release (${SPELLS[k.slice(8)].name})`:BASIC[k]??SPELLS[k]?.name??k;
// The action key a command counts under: Hold/Release by their channel.
const key=(id,channel)=>id==='hold'||id==='release'?`${id}:${channel}`:id;
const parts=id=>id.startsWith('bundle:')?id.slice(7).split('+'):[id];
const A={};const row=k=>A[k]??={holders:0,legal:0,picked:0,uses:0,parts:0,damage:0,usedW:0,usedN:0,unusedW:0,unusedN:0};
let fighters=0,decisions=0,forced=0;

for(const f of files)for(const line of fs.readFileSync(f,'utf8').trim().split('\n')){
 const {trace:t}=JSON.parse(line),r=t.result;
 const score=side=>!r||r.outcome==='draw'||r.winner===undefined?.5:r.winner===side?1:0;
 const byRound=new Map(t.history.map(h=>[h.round,h]));
 // Decisions: what the searcher picked out of what was legal (forced single options left out).
 for(const d of t.stats){
  const channel=byRound.get(d.round)?.channels?.[d.side]??null,menu=new Set(d.legal.map(id=>key(id,channel)));
  if(menu.size<2){forced++;continue;}decisions++;
  for(const k of menu)row(k).legal++;
  row(key(d.id,channel)).picked++;
 }
 for(const side of [0,1]){
  fighters++;
  const kit=new Set([...Object.keys(BASIC),...Object.keys(t.kits[side].spells)]);
  const used=new Set();
  for(const h of t.history){
   const id=h.pair[side];if(id==='frozen'||id==='cancel')continue;
   const k=key(id,h.channels[side]);row(k).uses++;used.add(k);
   if(!k.includes(':'))for(const p of parts(id)){row(p).parts++;used.add(p);} // a bundle's Strikes also count as Strikes
   for(const e of h.eventData??[]){
    if(e.type==='dealt'&&e.source===side&&e.target!==side)row(e.reflected?'reflect':e.id).damage+=e.amount;
    if(e.type==='tormentCharged'&&e.side!==side)row('torment').damage+=e.value;
   }
  }
  for(const k of kit){const a=row(k);a.holders++;if(used.has(k)){a.usedW+=score(side);a.usedN++;}else{a.unusedW+=score(side);a.unusedN++;}}
  for(const k of used)if(!kit.has(k)){const a=row(k);a.usedW+=score(side);a.usedN++;} // Hold/Release and bundles
 }
}

const pct=(a,b)=>b?Math.round(100*a/b)+'%':'—',num=(x,d=1)=>Number.isFinite(x)?x.toFixed(d):'—';
const rows=Object.entries(A).filter(([k,a])=>a.legal>0||a.uses>0).map(([k,a])=>({k,...a,pick:a.legal?a.picked/a.legal:0}));
rows.sort((x,y)=>y.pick-x.pick);
console.log(`### Spells and actions (${fighters/2} fights, ${decisions} AI decisions with a real choice; ${forced} forced ones left out)\n`);
console.log('How to read: **Picked when legal** is how often the searching AI judged the action best when it was on the menu, the main measure of strength. **Damage per use** counts HP actually dealt to the opponent after defences: for channels and constructs, everything the cast went on to deal; for Torment, the HP it charged; for Reflect, what it sent back; for Strike, per Strike including those in Haste bundles. **Win % used / unused** compares fighters who used it at least once with those who had it but never did. It mixes cause and effect (losing fighters reach for different tools), so read it alongside the pick rate.\n');
const main=rows.filter(a=>!a.k.includes(':')&&!a.k.startsWith('bundle:')),inner=rows.filter(a=>!main.includes(a));
console.log('| Action | In kits | Times legal | Picked when legal | Uses per fight (holders) | Damage per use | Win % used / unused (n) |');
console.log('|---|---:|---:|---:|---:|---:|---|');
for(const a of main){
 const perUse=a.k==='strike'?a.damage/a.parts:a.damage/a.uses; // Strike: per Strike, bundles included
 console.log(`| ${label(a.k)} | ${pct(a.holders,fighters)} | ${a.legal} | **${pct(a.picked,a.legal)}** | ${num(a.uses/a.holders,2)} | ${a.damage?num(perUse):'—'} | ${pct(a.usedW,a.usedN)} / ${pct(a.unusedW,a.unusedN)} (${a.usedN}/${a.unusedN}) |`);
}
console.log('\n### Inside channels and Haste\n\nThe choices on these narrower menus: Hold or Release while channelling, and which bundle under Haste.\n');
console.log('| Choice | Times legal | Picked when legal | Win % of fighters who made it (n) |');
console.log('|---|---:|---:|---|');
for(const a of inner.sort((x,y)=>x.k.localeCompare(y.k)))console.log(`| ${label(a.k)} | ${a.legal} | **${pct(a.picked,a.legal)}** | ${pct(a.usedW,a.usedN)} (${a.usedN}) |`);
