// Additional horizon/breadth checks against a frozen same-state depth audit.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const [directory,auditFile,output]=process.argv.slice(2);
if(!output||fs.existsSync(output))throw Error('Usage: convergence.mjs <frozen run> <audit.json> <new output.json>');
const root=path.resolve(directory,'source');
const {createResearchState}=await import(pathToFileURL(path.join(root,'research/model.mjs')));
const {nativeCore}=await import(pathToFileURL(path.join(root,'research/native.mjs')));
const native=nativeCore(),rows=fs.readFileSync(path.join(directory,'matches.ndjson'),'utf8').trim().split('\n').map(JSON.parse);
const audit=JSON.parse(fs.readFileSync(auditFile));
// Deterministically spaced completed depth-three states, excluding the explicit
// all-spell stress tests, whose much wider search needs separate interpretation.
const eligible=audit.results.filter(r=>r.probes[2].depth===3&&!['all-spells','resource-access'].includes(r.scenario));
const sample=Array.from({length:Math.min(12,eligible.length)},(_,i)=>eligible[Math.floor(i*eligible.length/Math.min(12,eligible.length))]);
const results=[];
try{
 for(const [i,item]of sample.entries()){
  const row=rows.find(r=>r.level===item.level&&r.seed===item.seed&&r.objective===item.objective&&r.scenario===item.scenario);
  const state=createResearchState(row.state.config);
  for(const h of row.state.history.slice(0,item.historyIndex))Object.assign(state,await native.request({op:'apply',state,id:h.action}));
  const deeper=await native.request({op:'search',state,options:{depth:4,samples:3,beam:0,nodeBudget:12000000,fixedNodes:true}});
  const widerState=structuredClone(state);widerState.config.tune.leafSamples=0;
  const wider=await native.request({op:'search',state:widerState,options:{depth:3,samples:7,beam:0,nodeBudget:6000000,fixedNodes:true}});
  const reference=item.probes[2];
  const regret=p=>p.value-p.scores.find(s=>s.id===reference.id).value;
  results.push({level:item.level,scenario:item.scenario,objective:item.objective,seed:item.seed,historyIndex:item.historyIndex,reference,deeper,wider,deeperDisagrees:reference.id!==deeper.id,widerDisagrees:reference.id!==wider.id,deeperRegret:regret(deeper),widerRegret:regret(wider)});
  console.log((i+1)+'/'+sample.length,reference.id,deeper.id,wider.id,'depths',deeper.depth,wider.depth);
 }
 const average=key=>results.reduce((n,r)=>n+Number(r[key]),0)/results.length;
 const depths=key=>results.reduce((a,r)=>(a[r[key].depth]=(a[r[key].depth]??0)+1,a),{});
 fs.copyFileSync(new URL(import.meta.url),output+'.source.mjs');
 fs.writeFileSync(output,JSON.stringify({source:directory,auditFile,n:results.length,deeperDisagreement:average('deeperDisagrees'),widerDisagreement:average('widerDisagrees'),meanDeeperRegret:average('deeperRegret'),meanWiderRegret:average('widerRegret'),deeperDepths:depths('deeper'),widerDepths:depths('wider'),results},null,2),{flag:'wx'});
}finally{native.close();}
