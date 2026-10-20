#!/usr/bin/env node
// Sequential, warmed decision timings from frozen simulation states. Run after
// simulation workers finish: wall times under contention are not comparable.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import os from 'node:os';import {pathToFileURL} from 'node:url';
const run=path.resolve(process.argv[2]??'');if(!process.argv[2])throw Error('Pass frozen result directory');
const target=path.join(run,'decision-latency.json');if(fs.existsSync(target))throw Error('Refusing to overwrite timings');
const engine=await import(pathToFileURL(path.join(run,'sources/iterations/v04/engine.mjs'))),{chooseAIAction}=await import(pathToFileURL(path.join(run,'sources/iterations/v04/ai.mjs')));
const rows=JSON.parse(fs.readFileSync(path.join(run,'matches.json'))),states=[];
for(const row of rows.filter(r=>r.caseId%8===0)){
 const s=engine.createState(row.config),indexes=new Set([0,1,Math.floor(row.searchStats.length/4)*2,Math.floor(row.searchStats.length/4)*2+1]);
 for(let i=0;i<row.searchStats.length;i++){if(indexes.has(i))states.push({kind:'kit',caseId:row.caseId,decisionIndex:i,state:engine.cloneState(s)});engine.applyChoice(s,row.searchStats[i].id);}
}
for(const level of [20,50,80]){const s=engine.createState({playerLevel:level,opponentLevel:level,spellAccess:'all',firstLeader:0});for(let i=0;i<4;i++){states.push({kind:'all-spells',level,decisionIndex:i,state:engine.cloneState(s)});engine.applyChoice(s,chooseAIAction(s).id);}}
for(const item of [...states.slice(0,4),...states.slice(-4)])chooseAIAction(item.state);
const timings=[];for(let repeat=0;repeat<3;repeat++)for(const [stateId,item]of states.entries()){const side=engine.actorToMove(item.state),before=performance.now(),d=chooseAIAction(item.state);assert(engine.legalActions(item.state).includes(d.id));timings.push({stateId,kind:item.kind,level:item.level??item.state.actors[side].kit.level,caseId:item.caseId??null,decisionIndex:item.decisionIndex,repeat,phase:item.state.pending[1-side]===null?'commit':'respond',elapsedMs:performance.now()-before,depth:d.completedDepth,nodes:d.totalNodes,id:d.id});}
const dist=xs=>{const a=xs.slice().sort((a,b)=>a-b);return {n:a.length,median:a[Math.ceil(a.length*.5)-1],p95:a[Math.ceil(a.length*.95)-1],max:a.at(-1)};};
const groups=[];for(const kind of ['kit','all-spells'])for(const phase of ['all','commit','respond']){const xs=timings.filter(t=>t.kind===kind&&(phase==='all'||t.phase===phase));groups.push({kind,phase,...dist(xs.map(x=>x.elapsedMs)),depths:xs.reduce((m,x)=>(m[x.depth]=(m[x.depth]??0)+1,m),{})});}
const result={rulesVersion:engine.RULES_VERSION,node:process.version,cpu:os.cpus()[0].model,measurement:'Sequential chooseAIAction in milliseconds, 3 warmed repeats per fixed state. Default depth3/5000 nodes, full AI. Excludes IO, startup, browser rendering, worker transfer; no simulation workers should be running. State samples are structured, not a uniform distribution of all decisions.',groups,timings};fs.writeFileSync(target,JSON.stringify(result,null,2));fs.copyFileSync(new URL(import.meta.url),path.join(run,'latency-runner.mjs'));console.log(JSON.stringify(groups));
