// Diagnose the wide-roster decisions that could not finish depth three in the
// unpruned audit. Every root action is retained; continuation beams are explicit.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const [directory,auditFile,output]=process.argv.slice(2);
if(!output||fs.existsSync(output))throw Error('Usage: focused-search.mjs <frozen run> <audit.json> <new output.json>');
const root=path.resolve(directory,'source'),{createResearchState}=await import(pathToFileURL(path.join(root,'research/model.mjs'))),{nativeCore}=await import(pathToFileURL(path.join(root,'research/native.mjs'))),native=nativeCore();
const rows=fs.readFileSync(path.join(directory,'matches.ndjson'),'utf8').trim().split('\n').map(JSON.parse),audit=JSON.parse(fs.readFileSync(auditFile));
const sample=audit.results.filter(r=>['all-spells','resource-access'].includes(r.scenario));
const settings=[{label:'depth3-beam8',depth:3,beam:8,samples:3,nodeBudget:3000000},{label:'depth3-beam16',depth:3,beam:16,samples:3,nodeBudget:6000000},{label:'depth3-wider',depth:3,beam:12,samples:7,nodeBudget:6000000},{label:'depth4-beam8',depth:4,beam:8,samples:3,nodeBudget:6000000}];
const results=[];
fs.copyFileSync(new URL(import.meta.url),output+'.source.mjs');
try{
 for(const item of sample){
  const row=rows.find(r=>r.level===item.level&&r.scenario===item.scenario&&r.seed===item.seed&&r.objective===item.objective),state=createResearchState(row.state.config);
  for(const h of row.state.history.slice(0,item.historyIndex))Object.assign(state,await native.request({op:'apply',state,id:h.action}));
  const result={level:item.level,scenario:item.scenario,seed:item.seed,objective:item.objective,historyIndex:item.historyIndex,prior:item.probes,probes:[]};
  for(const options of settings){
   const decision=await native.request({op:'search',state,options:{...options,fixedNodes:true}});
   result.probes.push({options,decision});
   fs.writeFileSync(output+'.partial.json',JSON.stringify({source:directory,auditFile,settings,results:[...results,result]},null,2));
   console.log(item.scenario,item.objective,options.label,decision.id,'depth',decision.depth);
  }
  results.push(result);
 }
 fs.writeFileSync(output,JSON.stringify({source:directory,auditFile,settings,results},null,2),{flag:'wx'});
}finally{native.close();}
