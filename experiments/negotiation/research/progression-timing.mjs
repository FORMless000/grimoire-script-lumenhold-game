// Warmed whole-call Wasm timings with the browser worker's actual options.
import fs from 'node:fs';import crypto from 'node:crypto';
import {createResearchState,researchSearch} from './model.mjs';import proposal from './live-config.mjs';import {caseOptions} from './cases.mjs';
const output=process.argv[2];if(!output||fs.existsSync(output))throw Error('Pass a new output JSON path');
const options={depth:3,budgetMs:50,beam:8,samples:3},results=[];
const make=c=>createResearchState({...caseOptions(c),tune:proposal.tune,effectOverrides:proposal.effectOverrides});
researchSearch(make({level:80,objective:'allout',scenario:'ordinary',seed:80}),options);
for(const level of [20,50,80])for(const objective of ['allout','hyper-frugal'])for(const scenario of ['ordinary','concessions'])for(let repeat=0;repeat<3;repeat++){
 const state=make({level,objective,scenario,seed:level+repeat}),start=performance.now(),decision=researchSearch(state,options);
 results.push({level,objective,scenario,repeat,wallMs:performance.now()-start,depth:decision.depth,elapsedMs:decision.elapsedMs,nodes:decision.nodes,rootCount:decision.scores.length});
}
const sorted=results.map(r=>r.wallMs).sort((a,b)=>a-b),summary={options,node:process.version,platform:process.platform,architecture:process.arch,n:results.length,meanMs:sorted.reduce((a,b)=>a+b,0)/sorted.length,p95Ms:sorted[Math.ceil(sorted.length*.95)-1],maxMs:sorted.at(-1),depths:results.reduce((a,r)=>(a[r.depth]=(a[r.depth]??0)+1,a),{}),hashes:Object.fromEntries(['../negotiation.wasm','model.mjs','progression.mjs','combat-canon.mjs'].map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(new URL(f,import.meta.url))).digest('hex')])),results};
fs.writeFileSync(output,JSON.stringify(summary,null,2),{flag:'wx'});fs.copyFileSync(new URL(import.meta.url),output+'.source.mjs');console.log(JSON.stringify({...summary,results:undefined},null,2));
