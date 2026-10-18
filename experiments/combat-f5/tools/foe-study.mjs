// A foe (any loadout, e.g. a SPECIAL_LOADOUTS creature) against every class at equal level, the suite's fallible AIs (seeded mistakes), depth 4:
// the class's win rate per level, and how often the foe uses each action.
//   node tools/foe-study.mjs "Shadow stag" [--levels 20,35,50] [--depth 4] [--seeds 2]
import {armCases,play} from './arms.mjs';
import {LOADOUTS} from '../setup/roster.mjs';
const args=process.argv.slice(2),foe=args[0],opt=(k,d)=>{const i=args.indexOf('--'+k);return i<0?d:args[i+1];};
const levels=opt('levels','20,35,50').split(',').map(Number),depth=Number(opt('depth',4)),seeds=Array.from({length:Number(opt('seeds',4))},(_,i)=>i+1);
const cases=armCases({named:Object.keys(LOADOUTS),foes:[foe],levels,seeds,fallible:true,maxRounds:120,search:{maxDepth:depth,nodeBudget:3e6,prune:true}});
const rs=play(cases),cell={},acts={};
rs.forEach((r,i)=>{const {p,level}=cases[i].meta,k=p+'|'+level;(cell[k]??=[]).push(!r.result||r.result.winner===undefined?.5:r.result.winner===0?1:0);for(const [a,n]of Object.entries(r.acts?.[1]??{}))acts[a]=(acts[a]??0)+n;});
console.log(`| Class vs ${foe} | ${levels.join(' | ')} |\n|---|${levels.map(()=>'---:').join('|')}|`);
for(const p of Object.keys(LOADOUTS))console.log(`| ${p} | ${levels.map(l=>{const v=cell[p+'|'+l];return (100*v.reduce((a,b)=>a+b,0)/v.length).toFixed(0)+'%';}).join(' | ')} |`);
const all=Object.values(cell).flat();console.log(`\nClasses win ${(100*all.reduce((a,b)=>a+b,0)/all.length).toFixed(0)}% overall (${all.length} fights). ${foe}'s actions: ${Object.entries(acts).sort((a,b)=>b[1]-a[1]).map(([a,n])=>a+' '+n).join(', ')}`);
