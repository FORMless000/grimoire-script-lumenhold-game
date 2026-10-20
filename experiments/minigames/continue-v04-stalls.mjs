#!/usr/bin/env node
// Resume a small stratified selection of censored fights; never adjudicate a work limit.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
if(!isMainThread){
 const {out}=workerData;
 const adapter=await import(pathToFileURL(path.join(out,'sources/iterations/v04/adapter.mjs')));
 const engine=await import(pathToFileURL(path.join(out,'sources/iterations/v04/engine.mjs')));
 parentPort.on('message',task=>{
  try{
   const g=adapter.create(task.row.config);for(const d of task.row.searchStats)adapter.advance(g,d);
   if(task.variant==='deeper')g.config.search={maxDepth:4,nodeBudget:20000};
   if(task.variant==='fallible')g.config.ai=[0,1].map(side=>({profile:'fallible',seed:(task.seed^Math.imul(task.row.caseId+1,97)^side)>>>0}));
   const extra=[],initialHP=g.actors.map(a=>a.hp),initialRound=g.round;
   while(!g.result&&extra.length<240){
    const side=engine.actorToMove(g),d=adapter.choose(g,side,'alpha');assert(engine.legalActions(g).includes(d.id));
    extra.push({side,round:g.round,...d});adapter.advance(g,d);
   }
   // Replay the continuation through the same frozen rules, without searching.
   const replay=adapter.create(task.row.config);for(const d of task.row.searchStats)adapter.advance(replay,d);
   replay.config.search=g.config.search;replay.config.ai=g.config.ai;
   for(const d of extra){assert.equal(engine.actorToMove(replay),d.side);assert(engine.legalActions(replay).includes(d.id));adapter.advance(replay,d);}
   const result=adapter.metrics(g);assert.deepEqual(adapter.metrics(replay),result);
   parentPort.postMessage({caseId:task.row.caseId,variant:task.variant,loadouts:g.actors.map(a=>a.kit.loadout),levels:g.actors.map(a=>a.kit.level),initialHP,initialRound,extraDecisions:extra,censored:!g.result,outcomes:result.outcomes,result:g.result,roundsAdded:g.history.length-task.row.rounds,finalHP:g.actors.map(a=>a.hp),finalMana:g.actors.map(a=>a.resources.mana),degraded:extra.filter(d=>d.degraded).length,settings:{search:g.config.search,ai:g.config.ai??null}});
  }catch(error){parentPort.postMessage({error:error.stack});}
 });
 parentPort.postMessage({ready:true});
}else{
 const out=path.resolve(process.argv[2]??'');if(!process.argv[2])throw Error('Pass a result directory');
 const target=path.join(out,'continuations.json');if(fs.existsSync(target))throw Error('Refusing to overwrite continuations');
 const manifest=JSON.parse(fs.readFileSync(path.join(out,'manifest.json'))),rows=JSON.parse(fs.readFileSync(path.join(out,'matches.json')));
 for(const [f,hash]of Object.entries(manifest.sourceHashes))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(out,'sources',f))).digest('hex'),hash,f);
 const selected=[];const strata=new Set();
 for(const row of rows.filter(r=>r.censored)){
  const stratum=row.panel+'|'+row.band;if(strata.has(stratum))continue;
  strata.add(stratum);selected.push(row);
 }
 const tasks=selected.flatMap(row=>['unchanged','deeper','fallible'].map(variant=>({row,variant,seed:manifest.seed}))),results=[];
 const start=performance.now();let next=0;
 if(tasks.length)await new Promise((resolve,reject)=>{
  const pool=[];let failed=false;
  function fail(e){if(failed)return;failed=true;for(const w of pool)w.terminate();reject(e);}
  function send(w){if(next<tasks.length)w.postMessage(tasks[next++]);else w.terminate();}
  for(let i=0;i<Math.min(4,tasks.length);i++){
   const w=new Worker(new URL(import.meta.url),{workerData:{out}});pool.push(w);w.on('error',fail);
   w.on('message',m=>{if(m.error){fail(Error(m.error));return;}if(m.ready){send(w);return;}results.push(m);if(results.length===tasks.length){for(const t of pool)t.terminate();resolve();}else send(w);});
  }
 });
 results.sort((a,b)=>a.caseId-b.caseId||a.variant.localeCompare(b.variant));
 const script=fs.readFileSync(fileURLToPath(import.meta.url));fs.mkdirSync(path.join(out,'diagnostic-sources'),{recursive:true});fs.writeFileSync(path.join(out,'diagnostic-sources/continue-v04-stalls.mjs'),script);
 const summary=['unchanged','deeper','fallible'].map(variant=>{const xs=results.filter(r=>r.variant===variant);return {variant,n:xs.length,completed:xs.filter(r=>!r.censored).length,censored:xs.filter(r=>r.censored).length,degraded:xs.reduce((s,r)=>s+r.degraded,0),extraDecisions:xs.reduce((s,r)=>s+r.extraDecisions.length,0)};});
 const report={selection:'First censored case in each panel/band stratum, chosen without looking at continuation outcomes. These are eight illustrative states, not new independent matchup samples.',sourceSHA256:crypto.createHash('sha256').update(script).digest('hex'),workers:4,extraDecisionLimit:240,elapsedMs:performance.now()-start,legalContinuationReplayVerified:true,summary,results};
 fs.writeFileSync(target,JSON.stringify(report));console.log(JSON.stringify({selected:selected.map(r=>r.caseId),summary,elapsedMs:report.elapsedMs}));
}
