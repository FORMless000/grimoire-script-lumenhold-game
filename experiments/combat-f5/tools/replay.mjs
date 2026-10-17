// Replay one simulated fight exactly and write its full log (the browser's export shape: every exchange's actions, descriptions,
// events, HP / ready Mana / flux after it, every AI decision with its value, depth, nodes and any deliberate mistake).
//   node tools/replay.mjs <results.jsonl> <line> [out.json]      line = 1-based line of the fight in the results file
// Needs <results>.arm.json, which tools/sim.mjs writes; the replay is checked against the stored summary line.
import fs from 'node:fs';import path from 'node:path';
import {armCases,play,formatTrace,armFile,readLines,root,applyVariant} from './arms.mjs';
import {RULES_VERSION} from '../web/core.mjs';
const [results,lineArg,outArg]=process.argv.slice(2);
if(!results||!lineArg){console.error('usage: node tools/replay.mjs <results.jsonl> <line> [out.json]');process.exit(2);}
if(!fs.existsSync(armFile(results)))throw Error(`No ${armFile(results)}: rerun the arm with tools/sim.mjs (it saves the arm next to its results)`);
const {arm,rulesVersion}=JSON.parse(fs.readFileSync(armFile(results),'utf8'));
if(rulesVersion!==RULES_VERSION)console.warn(`warning: results are from ${rulesVersion}, the core is ${RULES_VERSION}; the replay plays the current rules`);
await applyVariant(arm.variant);
const line=Number(lineArg),stored=readLines(results)[line-1],cases=armCases(arm),c=cases[line-1];
if(!stored||!c)throw Error(`Line ${line} is out of range (1–${cases.length})`);
for(const [k,v] of Object.entries(c.meta))if(stored[k]!==v)throw Error(`Line ${line} does not match the arm's case ${line} (${k}: ${stored[k]} vs ${v})`);

const [r]=play([{...c,trace:true}],1),trace=await formatTrace(r.trace);delete r.trace;
const strip=x=>JSON.stringify({...x,cpuMs:undefined});
const exact=strip(r)===strip(stored);
const out=outArg??path.join(root,'out/replays',`${path.basename(results,'.jsonl')}-L${line}.json`);
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify({line,...c.meta,search:c.search,maxRounds:c.maxRounds,tableLimit:c.tableLimit,...trace},null,1)+'\n');

// A readable summary on the terminal.
const m=c.meta,fmt=n=>Math.round(n*10)/10,who=['You','Opp'];
console.log(`${m.p} (L${m.levelP??m.level}) vs ${m.o} (L${m.levelO??m.level}), first leader ${m.firstLeader===0?'player':'opponent'}${m.seed!==undefined?', seed '+m.seed:''} — ${trace.result?`player ${trace.result.outcome}s by ${trace.result.reason} after ${trace.history.length} exchanges`:'unfinished'}`);
console.log('  exch  player                 | opponent               HP after         AI: search depth, value in HP from the player\'s side (±10000 = forced knockout), deliberate mistakes and their cost');
const bySide=s=>trace.stats.filter(d=>d.side===s);
for(const h of trace.history){
 const ds=[0,1].map(s=>bySide(s).filter(d=>d.round===h.round)).map(x=>x.at(-1));
 const note=ds.map((d,s)=>d?`${who[s]} d${d.completedDepth} ${d.value>=0?'+':''}${fmt(d.value)}${d.degraded?` (mistake, −${fmt(d.regret)})`:''}`:'').join('  ');
 console.log(`  ${String(h.round).padStart(3)}  ${h.actionNames[0].padEnd(22)} | ${h.actionNames[1].padEnd(22)} HP ${fmt(h.hp[0])} / ${fmt(h.hp[1])}   ${note}`);
}
console.log(`${exact?'Replayed exactly: matches the stored summary line.':'WARNING: the replay differs from the stored line (rules or search changed since the run?).'}\nFull log → ${path.relative(process.cwd(),out)}`);
if(!exact)process.exitCode=1;
