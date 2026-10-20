#!/usr/bin/env node
// Fixed-kit causal check and matched mirrored loadouts. Uses an already frozen
// simulation source directory; never imports the changing live engine in workers.
import fs from 'node:fs';
import path from 'node:path';
import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
if(!isMainThread){
 const engine=await import(pathToFileURL(path.join(workerData.sources,'iterations/v04/engine.mjs')));
 const ai=await import(pathToFileURL(path.join(workerData.sources,'iterations/v04/ai.mjs')));
 const adapter=await import(pathToFileURL(path.join(workerData.sources,'iterations/v04/adapter.mjs')));
 const create=c=>{const g=adapter.create(c.config);if(c.fixedCore)for(const a of g.actors)a.kit={...a.kit,spells:{flame:2,ward:1}};return g;};
 parentPort.on('message',c=>{
  try{
   const g=create(c),startHP=g.actors.map(a=>a.maxHP);
   for(let n=0;n<c.decisionLimit&&!g.result;n++){const d=ai.chooseAIAction(g);assert(engine.legalActions(g).includes(d.id));adapter.advance(g,d);}
   const replay=create(c);for(const d of g.searchStats){assert(engine.legalActions(replay).includes(d.id));adapter.advance(replay,d);}
   assert.deepEqual(adapter.metrics(g).commands,adapter.metrics(replay).commands);assert.deepEqual(g.result,replay.result);assert.deepEqual(g.settlement,replay.settlement);
   parentPort.postMessage({row:{...c,...adapter.metrics(g),censored:!g.result,startHP,trace:adapter.trace(g),replayed:true}});
  }catch(e){parentPort.postMessage({error:e.stack});}
 });parentPort.postMessage({ready:true});
}else{
 const args=process.argv.slice(2),get=k=>args[args.indexOf('--'+k)+1];
 const sourceRun=path.resolve(get('sources')),out=path.resolve(get('out'));if(!args.includes('--sources')||!args.includes('--out'))throw Error('Pass --sources RUN and --out NEW-DIR');
 const sources=path.join(sourceRun,'sources'),engine=await import(pathToFileURL(path.join(sources,'iterations/v04/engine.mjs'))),cases=[];
 for(const level of [20,50,80])for(const firstLeader of [0,1]){
  const skills=Object.fromEntries(['arcana','lore','alchemy','charm','vigor','guile'].map(k=>[k,level]));
  for(const healthModel of ['direct','offset'])cases.push({panel:'fixed-core',fixedCore:true,level,decisionLimit:240,config:{playerLevel:level,opponentLevel:level,playerSkills:skills,opponentSkills:skills,firstLeader,healthModel,damageMultiplier:1,spellAccess:'all'}});
  for(const name of Object.keys(engine.LOADOUTS))cases.push({panel:'mirror',level,loadout:name,decisionLimit:240,config:{playerLoadout:name,opponentLoadout:name,playerLevel:level,opponentLevel:level,playerSkills:skills,opponentSkills:skills,firstLeader,healthModel:'offset',damageMultiplier:1}});
 }
 for(const gap of [5,10,20])for(const focalSide of [0,1])for(const firstLeader of [0,1]){
  const levels=focalSide?[50-gap/2,50+gap/2]:[50+gap/2,50-gap/2];
  // Odd gaps center on 50.5: skill values stay integral, both spell ranks and
  // encounter levels remain 50. This isolates skills/capacity from unlocks/HP.
  const skills=levels.map(n=>Object.fromEntries(['arcana','lore','alchemy','charm','vigor','guile'].map(k=>[k,Math.ceil(n)])));
  cases.push({panel:'controlled-gap',gap,focalSide,fixedCore:true,decisionLimit:240,config:{playerLevel:50,opponentLevel:50,playerSkills:skills[0],opponentSkills:skills[1],firstLeader,healthModel:'offset',damageMultiplier:1,spellAccess:'all'}});
 }
 if(args.includes('--mirrors-only'))for(let i=cases.length-1;i>=0;i--)if(cases[i].panel!=='mirror')cases.splice(i,1);
 cases.forEach((c,i)=>c.caseId=i);fs.mkdirSync(out);fs.mkdirSync(path.join(out,'cases'));fs.copyFileSync(new URL(import.meta.url),path.join(out,'runner.mjs'));fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({sourceRun,rulesVersion:engine.RULES_VERSION,workers:4,cases,semantics:'Equal six-skill vectors. Fixed core forces rank-II Flame and Ward only at every level; direct HP is the counterfactual without endurance. Mirrored cases use normal level-gated spells/ranks. Two initial orders are paired observations, not independent repeats.'},null,2));
 const rows=new Array(cases.length);let next=0,done=0;const start=performance.now();
 await new Promise((resolve,reject)=>{const pool=[];const dispatch=w=>next<cases.length?w.postMessage(cases[next++]):w.terminate();for(let i=0;i<4;i++){const w=new Worker(new URL(import.meta.url),{workerData:{sources}});pool.push(w);w.on('error',reject);w.on('message',m=>{if(m.error){pool.forEach(w=>w.terminate());reject(Error(m.error));return;}if(m.ready){dispatch(w);return;}rows[m.row.caseId]=m.row;fs.writeFileSync(path.join(out,'cases',String(m.row.caseId)+'.json'),JSON.stringify(m.row));done++;if(done%12===0)console.log(JSON.stringify({done,total:cases.length}));if(done===cases.length){pool.forEach(w=>w.terminate());resolve();}else dispatch(w);});}});
 fs.writeFileSync(path.join(out,'matches.json'),JSON.stringify(rows));
 const groups=[];for(const panel of ['fixed-core','mirror'])for(const model of ['direct','offset'])for(const level of [20,50,80]){const xs=rows.filter(r=>r.panel===panel&&r.level===level&&r.config.healthModel===model);if(!xs.length)continue;const completed=xs.filter(x=>!x.censored),rounds=completed.map(x=>x.rounds).sort((a,b)=>a-b);groups.push({panel,model,level,n:xs.length,completed:completed.length,censored:xs.length-completed.length,meanRounds:rounds.length?rounds.reduce((a,b)=>a+b,0)/rounds.length:null,medianRounds:rounds.length?rounds[Math.ceil(rounds.length/2)-1]:null,meanStartHP:xs.reduce((n,r)=>n+r.startHP[0],0)/xs.length});}
 const controlledGaps=[5,10,20].map(gap=>{const xs=rows.filter(r=>r.panel==='controlled-gap'&&r.gap===gap);return {gap,n:xs.length,wins:xs.filter(r=>r.outcomes[r.focalSide]==='win').length,losses:xs.filter(r=>r.outcomes[r.focalSide]==='lose').length,censored:xs.filter(r=>r.censored).length};});
 fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify({groups,controlledGaps,elapsedMs:performance.now()-start,replayed:rows.length},null,2));console.log(JSON.stringify(groups));
}
