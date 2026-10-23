// Timed Wasm boundary benchmark, using the gameplay worker's search settings.
// This measures this host's Node/Wasm runtime, not a physical phone browser.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import crypto from 'node:crypto';
const [directory,output,beamText,runtimeDirectory]=process.argv.slice(2),settings={depth:3,budgetMs:50,beam:Number(beamText??8),samples:3};
if(!output||fs.existsSync(output))throw Error('Usage: timed.mjs <frozen run> <new output.json>');
const root=runtimeDirectory?path.resolve(runtimeDirectory):path.resolve(directory,'source');
const {createResearchState,researchSearch}=await import(pathToFileURL(path.join(root,'research/model.mjs')));
const rows=fs.readFileSync(path.join(directory,'matches.ndjson'),'utf8').trim().split('\n').map(JSON.parse);
const chosen=[];
for(const level of [20,50,80])for(const scenario of ['ordinary','scholarly','social','practical'])chosen.push(rows.find(r=>r.level===level&&r.scenario===scenario&&r.objective==='prudent'));
for(const scenario of ['worn','all-spells','resource-access'])chosen.push(rows.find(r=>r.level===50&&r.scenario===scenario&&r.objective==='prudent'));
researchSearch(createResearchState(chosen[0].state.config),settings);
const results=[];
for(const row of chosen)for(let repeat=0;repeat<3;repeat++){
 const state=createResearchState(row.state.config),start=performance.now();
 const decision=researchSearch(state,settings);
 results.push({level:row.level,scenario:row.scenario,repeat,wallMs:performance.now()-start,decision});
}
const times=results.map(r=>r.wallMs).sort((a,b)=>a-b),depths=results.reduce((a,r)=>(a[r.decision.depth]=(a[r.decision.depth]??0)+1,a),{});
const hashes=Object.fromEntries(['negotiation.wasm','research/model.mjs','rust/src/variety.rs'].map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')]));
const summary={sourceStates:directory,runtimeDirectory:root,hashes,n:results.length,node:process.version,platform:process.platform,architecture:process.arch,settings,meanMs:times.reduce((a,b)=>a+b,0)/times.length,p95Ms:times[Math.ceil(times.length*.95)-1],maxMs:times.at(-1),depths,results};
fs.writeFileSync(output,JSON.stringify(summary,null,2),{flag:'wx'});
fs.copyFileSync(new URL(import.meta.url),output+'.source.mjs');
console.log(JSON.stringify({...summary,results:undefined},null,2));
