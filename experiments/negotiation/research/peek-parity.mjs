// Search-only optimization golden: score parity at a completed fixed horizon.
// Freeze both executable provenance and all public input states for reproduction.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
const [directory,outText]=process.argv.slice(2);
if(!outText)throw Error('Usage: peek-parity.mjs <old frozen run> <new result directory>');
const oldRoot=path.resolve(directory,'source'),out=path.resolve(outText),current=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
fs.mkdirSync(out);const hashes={};
for(const file of ['schema.mjs','research/native.mjs','rust/Cargo.toml','rust/Cargo.lock','rust/src/lib.rs','rust/src/main.rs','rust/src/variety.rs','rust/target/release/negotiation-core']){
 const bytes=fs.readFileSync(path.join(current,file)),destination=path.join(out,'source',file);
 fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,bytes);
 if(file.endsWith('/negotiation-core'))fs.chmodSync(destination,0o755);
 hashes[file]=crypto.createHash('sha256').update(bytes).digest('hex');
}
fs.copyFileSync(fileURLToPath(import.meta.url),path.join(out,'parity-source.mjs'));
const {createResearchState}=await import(pathToFileURL(path.join(oldRoot,'research/model.mjs')));
const oldCore=(await import(pathToFileURL(path.join(oldRoot,'research/native.mjs')))).nativeCore();
const newCore=(await import(pathToFileURL(path.join(out,'source/research/native.mjs')))).nativeCore();
const rows=fs.readFileSync(path.join(directory,'matches.ndjson'),'utf8').trim().split('\n').map(JSON.parse);
const inputs=[];
for(const level of [20,50,80]){
 const row=rows.find(r=>r.level===level&&r.scenario==='ordinary'&&r.objective==='prudent');
 const state=createResearchState(row.state.config);inputs.push({label:'ordinary-'+level,state,depth:2});
 const cast=await oldCore.request({op:'apply',state,id:'foresight'});
 inputs.push({label:'revealed-'+level,state:cast,depth:3});
}
for(const objective of ['frugal','allout']){
 const row=rows.find(r=>r.scenario==='all-spells'&&r.objective===objective);
 inputs.push({label:'broad-'+objective,state:createResearchState(row.state.config),depth:2});
}
fs.writeFileSync(path.join(out,'inputs.json'),JSON.stringify({oldRun:directory,hashes,inputs},null,2));
const results=[];
try{
 for(const item of inputs){
  const options={depth:item.depth,beam:0,samples:3,nodeBudget:6000000,fixedNodes:true};
  const before=await oldCore.request({op:'search',state:item.state,options}),after=await newCore.request({op:'search',state:item.state,options});
  assert.equal(before.depth,item.depth,item.label+' old horizon');assert.equal(after.depth,item.depth,item.label+' new horizon');
  assert.equal(after.id,before.id,item.label+' action');assert.equal(after.scores.length,before.scores.length);
  let maximumError=0;
  for(const a of before.scores){
   const b=after.scores.find(x=>x.id===a.id);assert(b,a.id);
   for(const key of ['value','winEstimate','partialEstimate'])maximumError=Math.max(maximumError,Math.abs(a[key]-b[key]));
   for(const key of Object.keys(a.netCostFractions))maximumError=Math.max(maximumError,Math.abs(a.netCostFractions[key]-b.netCostFractions[key]));
  }
  assert(maximumError<1e-10,item.label+' score drift '+maximumError);
  results.push({label:item.label,options,before,after,maximumError});
  fs.writeFileSync(path.join(out,'results.partial.json'),JSON.stringify({oldRun:directory,hashes,results},null,2));
  console.log(item.label,'same',after.id,'nodes',before.nodes,'→',after.nodes,'ms',before.elapsedMs.toFixed(1),'→',after.elapsedMs.toFixed(1));
 }
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({passed:true,oldRun:directory,hashes,results},null,2),{flag:'wx'});
}finally{oldCore.close();newCore.close();}
