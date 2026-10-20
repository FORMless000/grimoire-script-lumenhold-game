#!/usr/bin/env node
// Run alone, not alongside simulation workers. Every output is write-once.
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';import {Worker} from 'node:worker_threads';
import {searchFixtures} from './search-fixtures.mjs';
const args=process.argv.slice(2),arg=(k,d)=>{const i=args.indexOf('--'+k);return i<0?d:args[i+1];};
let sources=path.resolve(arg('sources','experiments/minigames')),out=path.resolve(arg('out','experiments/minigames/results/search-'+Date.now())),repeats=Number(arg('repeats','3')),limit=Number(arg('limit','48')),mode=arg('mode','nodes');
const moduleDirectory=value=>{const base=path.resolve(value),nested=path.join(base,'iterations/v04');return fs.existsSync(nested)?nested:base;};
if(!Number.isInteger(repeats)||repeats<1||!Number.isInteger(limit)||limit<1||limit>48||!['fixed','nodes','timed','live_fast','live_deep','analyst'].includes(mode))throw Error('Invalid benchmark settings');
fs.mkdirSync(out);
for(const name of ['bench-v04-search.mjs','search-fixtures.mjs'])fs.copyFileSync(new URL('./'+name,import.meta.url),path.join(out,name));
const instrument=args.includes('--instrument-reference'),deadlineReference=args.includes('--deadline-reference');
if(instrument||deadlineReference){
 const frozen=path.join(out,'instrumented','iterations/v04');fs.mkdirSync(frozen,{recursive:true});fs.cpSync(moduleDirectory(sources),frozen,{recursive:true});
 if(instrument)for(const [name,replacements]of Object.entries({'engine.mjs':[['export function cloneState(s){','export function cloneState(s){globalThis.__v04SearchCounters.stateCopies++;'],['export function legalActions(s,side=actorToMove(s)){','export function legalActions(s,side=actorToMove(s)){globalThis.__v04SearchCounters.legalGenerations++;']],'ai.mjs':[["export function moveValue(s,side,id){","export function moveValue(s,side,id){globalThis.__v04SearchCounters.orderingEvaluations++;"]]})){
  const target=path.join(frozen,name);let code=fs.readFileSync(target,'utf8');for(const [before,after]of replacements){if(!code.includes(before))throw Error('Instrumentation target changed');code=code.replace(before,after);}fs.writeFileSync(target,code);
 }
 if(deadlineReference){const target=path.join(frozen,'ai.mjs');let code=fs.readFileSync(target,'utf8');code=code.replace('const start=performance.now(),side=','const start=performance.now(),deadline=start+(options.budgetMs??Infinity),side=');code=code.replace('if(++nodes>nodeBudget)throw ABORT;','if(++nodes>nodeBudget||performance.now()>=deadline)throw ABORT;');fs.writeFileSync(target,code);}
 sources=path.join(out,'instrumented');globalThis.__v04SearchCounters={legalGenerations:0,stateCopies:0,orderingEvaluations:0};
}
const inputSources=sources;const frozenSources=path.join(out,'sources','iterations/v04');fs.mkdirSync(path.dirname(frozenSources),{recursive:true});fs.cpSync(moduleDirectory(sources),frozenSources,{recursive:true});sources=path.join(out,'sources');
const engine=await import(pathToFileURL(path.join(sources,'iterations/v04/engine.mjs'))),ai=await import(pathToFileURL(path.join(sources,'iterations/v04/ai.mjs'))),fixtures=searchFixtures(engine).slice(0,limit);
const options=mode==='fixed'?{maxDepth:1,nodeBudget:2000000}:mode==='nodes'?{maxDepth:8,nodeBudget:Number(arg('nodes','5000'))}:mode==='timed'?{maxDepth:8,nodeBudget:5000000,budgetMs:Number(arg('budget-ms','100')),horizonMode:arg('horizon','fixed'),tableLimit:Number(arg('table-limit','4096'))}:{computeProfile:mode};
const reference=arg('reference',null),paired=args.includes('--paired-reference');let ref;
if(paired&&!reference)throw Error('Paired measurements require --reference');
if(reference){
 let refPath=moduleDirectory(reference);
 if(paired){const destination=path.join(out,'reference','iterations/v04');fs.mkdirSync(path.dirname(destination),{recursive:true});fs.cpSync(refPath,destination,{recursive:true});refPath=destination;
  if(mode==='timed'){const file=path.join(refPath,'ai.mjs');let code=fs.readFileSync(file,'utf8');code=code.replace('const start=performance.now(),side=','const start=performance.now(),deadline=start+(options.budgetMs??Infinity),side=');code=code.replace('if(++nodes>nodeBudget)throw ABORT;','if(++nodes>nodeBudget||performance.now()>=deadline)throw ABORT;');fs.writeFileSync(file,code);}
 }
 ref=await import(pathToFileURL(path.join(refPath,'ai.mjs')));
}

const measured=(fn,state,settings)=>{const begin=process.cpuUsage(),result=fn(state,settings),used=process.cpuUsage(begin);return {...result,cpuMs:(used.user+used.system)/1000};};
const rows=[],referenceRows=[];for(const f of fixtures.slice(0,2)){ai.chooseAIAction(f.state,options);if(paired)ref.chooseAIAction(f.state,options);}
for(let repeat=0;repeat<repeats;repeat++)for(const f of fixtures){
 const before=JSON.stringify(f.state);if(instrument)globalThis.__v04SearchCounters={legalGenerations:0,stateCopies:0,orderingEvaluations:0};let d,referenceDecision;
 if(paired&&(repeat+fixtures.indexOf(f))%2===0)referenceDecision=measured(ref.chooseAIAction,f.state,options);
 d=measured(ai.chooseAIAction,f.state,options);
 if(paired&&!referenceDecision)referenceDecision=measured(ref.chooseAIAction,f.state,options);assert(engine.legalActions(f.state).includes(d.id));assert.equal(JSON.stringify(f.state),before);
 if(mode==='fixed'){assert.equal(d.completedDepth,1);if(ref){const r=ref.searchAction(f.state,options);assert(Math.abs(d.value-r.value)<1e-9);const child=engine.cloneState(f.state),step=engine.applyChoice(child,d.id);assert(Math.abs(ref.exhaustiveValue(child,1-Number(step.resolved))-r.value)<1e-9);}}
 const row={fixture:f.id,scenario:f.scenario,phase:f.phase,repeat,...d,...(instrument?globalThis.__v04SearchCounters:{})};rows.push(row);fs.appendFileSync(path.join(out,'decisions.ndjson'),JSON.stringify(row)+'\n');
 if(referenceDecision){const r={fixture:f.id,scenario:f.scenario,phase:f.phase,repeat,...referenceDecision};referenceRows.push(r);fs.appendFileSync(path.join(out,'reference-decisions.ndjson'),JSON.stringify(r)+'\n');}
 if(rows.length%24===0)console.log(JSON.stringify({progress:rows.length,total:fixtures.length*repeats,out}));
}
const dist=xs=>{const a=xs.slice().sort((x,y)=>x-y);return {n:a.length,median:a[Math.ceil(a.length*.5)-1],p95:a[Math.ceil(a.length*.95)-1],max:a.at(-1)};};
const summaries=[];for(const scenario of ['all',...new Set(fixtures.map(f=>f.scenario))]){const group=rows.filter(r=>scenario==='all'||r.scenario===scenario);summaries.push({scenario,latencyMs:dist(group.map(r=>r.elapsedMs)),cpuMs:dist(group.map(r=>r.cpuMs)),nodesPerSecond:dist(group.map(r=>(r.totalNodes??r.nodes)/r.elapsedMs*1000)),completedDepth:dist(group.map(r=>r.completedDepth)),budgetExhausted:group.filter(r=>r.stoppingReason==='nodes'||r.stoppingReason==='deadline'||(r.completedDepth<options.maxDepth&&r.nodes>=options.nodeBudget)).length});}
const workerStart=performance.now();await new Promise((resolve,reject)=>{const w=new Worker('const {parentPort}=require("node:worker_threads");import('+JSON.stringify(pathToFileURL(path.join(sources,'iterations/v04/ai.mjs')).href)+').then(()=>parentPort.postMessage("ready"))',{eval:true});w.once('message',()=>{w.terminate();resolve();});w.once('error',reject);});const coldNodeWorkerStartupMs=performance.now()-workerStart;
const files=['engine','ai','roster','loadouts','cast-stats','economy','search-state','search-cache'].map(n=>'iterations/v04/'+n+'.mjs').filter(f=>fs.existsSync(path.join(sources,f)));
const runnerHashes=Object.fromEntries(['bench-v04-search.mjs','search-fixtures.mjs'].map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(out,f))).digest('hex')]));
const referenceHashes=paired?Object.fromEntries(files.filter(f=>fs.existsSync(path.join(out,'reference',f))).map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(out,'reference',f))).digest('hex')])):null;
const hashes=Object.fromEntries(files.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(sources,f))).digest('hex')]));
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({rulesVersion:engine.RULES_VERSION,policyVersion:ai.POLICY_VERSION??'baseline',sources,inputSources,hashes,runnerHashes,referenceHashes,node:process.version,cpu:os.cpus()[0].model,platform:process.platform,arch:process.arch,options,repeats,mode,paired,reference,instrumented:instrument,deadlineReference,coldNodeWorkerStartupMs,note:'Warmed sequential search; no rendering or transfer. Worker startup measured separately. Fixture seed 20261016; timings are device-dependent.'},null,2));
fs.writeFileSync(path.join(out,'fixtures.json'),JSON.stringify(fixtures));fs.writeFileSync(path.join(out,'decisions.json'),JSON.stringify(rows));if(paired)fs.writeFileSync(path.join(out,'reference-decisions.json'),JSON.stringify(referenceRows));fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify(summaries,null,2));console.log(JSON.stringify({out,summary:summaries[0]}));
