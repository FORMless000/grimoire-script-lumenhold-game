// Native balance simulations: the arm's fights played by rust/target/release/combat-sim on all cores.
//   node tools/sim.mjs '<armJSON>' <out.jsonl> [threads] [--trace]
// Writes one summary line per fight (outcome, rounds, final HP/Mana, action counts, search depth/nodes, CPU) to <out.jsonl>,
// and the arm to <out>.arm.json, so any fight can be replayed exactly with tools/replay.mjs.
// --trace (or "trace": true in the arm) also writes <out>.traces.jsonl: every fight's full log, one line each, in the browser's export shape.
import fs from 'node:fs';
import {armCases,play,formatTrace,armFile,traceFile,applyVariant} from './arms.mjs';
import {RULES_VERSION} from '../web/core.mjs';
const args=process.argv.slice(2),trace=args.includes('--trace'),[armJSON,out,threads]=args.filter(a=>a!=='--trace');
if(!armJSON||!out){console.error("usage: node tools/sim.mjs '<armJSON>' <out.jsonl> [threads] [--trace]");process.exit(2);}
const arm=JSON.parse(armJSON),traced=trace||arm.trace===true;
await applyVariant(arm.variant); // "variant": a roster-editing module (see tools/arms.mjs)
const cases=armCases(arm).map(c=>traced?{...c,trace:true}:c),t0=performance.now();
const lines=play(cases,threads),errors=lines.filter(l=>l.error);
fs.writeFileSync(armFile(out),JSON.stringify({rulesVersion:RULES_VERSION,arm},null,1)+'\n');
if(traced){
 const t=fs.openSync(traceFile(out),'w');
 for(const [i,l] of lines.entries()){if(!l.trace)continue;fs.writeSync(t,JSON.stringify({line:i+1,...cases[i].meta,trace:await formatTrace(l.trace)})+'\n');delete l.trace;}
 fs.closeSync(t);
}
fs.writeFileSync(out,lines.map(l=>JSON.stringify(l)).join('\n')+'\n');
console.log(`${lines.length} fights in ${((performance.now()-t0)/1000).toFixed(1)} s wall; ${errors.length} errors → ${out}${traced?' (traces: '+traceFile(out)+')':''}`);
if(errors.length){console.error(errors.slice(0,3));process.exitCode=1;}
