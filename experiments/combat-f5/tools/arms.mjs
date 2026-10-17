// Simulation arms → fight cases. One home for case order and AI seeds, so tools/replay.mjs rebuilds exactly the fights tools/sim.mjs ran.
//   arm: {pairs|gaps|named|offsets, levels, bases, fallible, seeds, maxRounds, search:{...}, config:{...}, tableLimit}
import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
import {LOADOUTS} from '../setup/roster.mjs';import {createState} from '../setup/setup.mjs';
export const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export function armCases(arm){
 const G=Object.keys(LOADOUTS),cases=[];
 if(arm.gaps){for(const L of arm.bases??[25,50])for(const d of arm.gaps)for(const g of G)for(const hiSide of [0,1])for(const firstLeader of [0,1])cases.push({p:g,o:g,levelP:hiSide?L:L+d,levelO:hiSide?L+d:L,hiSide,gap:d,level:L,firstLeader});}
 else if(arm.pairs){for(const level of arm.levels??[20,50,80])for(let i=0;i<G.length;i++)for(let j=i+1;j<G.length;j++)for(const firstLeader of [0,1])cases.push({p:G[i],o:G[j],level,firstLeader});}
 else if(arm.named){for(const level of arm.levels??[20,50,80])for(const p of arm.named)for(const o of arm.foes??['Duellist','Prefect'])for(const firstLeader of [0,1])cases.push({p,o,level,firstLeader});}
 else for(const level of arm.levels??[20,50,80])for(let i=0;i<G.length;i++)for(const k of arm.offsets??[1,3])for(const firstLeader of [0,1])cases.push({p:G[i],o:G[(i+k)%G.length],level,firstLeader});
 if(arm.fallible){const base=[...cases];cases.length=0;for(const seed of arm.seeds??[1])for(const c of base)cases.push({...c,seed});}
 return cases.map((c,idx)=>{
  const s=createState({playerLoadout:c.p,opponentLoadout:c.o,playerLevel:c.levelP??c.level,opponentLevel:c.levelO??c.level,firstLeader:c.firstLeader,...arm.config,
   ...(arm.fallible?{ai:[{profile:'fallible',seed:(c.seed*7919+idx*2)>>>0},{profile:'fallible',seed:(c.seed*7919+idx*2+1)>>>0}]}:{})});
  const {lastEvents,...state}=s;
  return {meta:c,state,search:arm.search??{},maxRounds:arm.maxRounds??80,tableLimit:arm.tableLimit??16384};
 });
}
// A variant: a module (path from experiments/combat-f5/) whose default export edits the roster in memory, e.g.
//   export default R=>{R.SPELLS.purify.cost=[2];R.COMBAT_TUNING.skill.mainPerPoint=.01;}
// Setup sees the edits directly; the Rust core gets them as an exported data file (COMBAT_DATA). Returns that environment.
let variantEnv=null;
export async function applyVariant(variant){
 if(!variant)return null;
 const R=await import('../setup/roster.mjs'),{rulesData}=await import('./export-data.mjs');
 (await import(path.resolve(root,variant))).default(R);
 const file=path.join(root,'out/variants',path.basename(variant).replace(/\.m?js$/,'')+'.json');
 fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(rulesData()));
 return variantEnv={...process.env,COMBAT_DATA:file};
}
// Play cases natively (all cores); one parsed result line per case, in order.
export function play(cases,threads){
 const run=spawnSync(path.join(root,'rust/target/release/combat-sim'),['run',...(threads?[String(threads)]:[])],{env:variantEnv??process.env,input:cases.map(c=>JSON.stringify(c)).join('\n')+'\n',maxBuffer:2**31-1,encoding:'utf8'});
 if(run.status!==0)throw Error('combat-sim failed: '+run.stderr);
 return run.stdout.trim().split('\n').map(l=>JSON.parse(l));
}
// A trace in the browser's exported-log shape: event texts formatted as the game shows them.
export async function formatTrace(trace){
 const {formatEvent}=await import('../web/core.mjs');
 for(const h of trace.history){h.eventData=h.events;h.events=h.events.map(formatEvent);} // text as the game shows it; eventData keeps the structured events
 return trace;
}
// The arm a results file was made with, saved next to it.
export const armFile=out=>out.replace(/\.jsonl$/,'')+'.arm.json';
export const traceFile=out=>out.replace(/\.jsonl$/,'')+'.traces.jsonl';
export const readLines=f=>fs.readFileSync(f,'utf8').trim().split('\n').map(l=>JSON.parse(l));
