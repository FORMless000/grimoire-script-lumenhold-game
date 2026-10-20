#!/usr/bin/env node
// Seeded paired loadout panel. Worker scheduling cannot affect kits or choices.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import {LOADOUTS,NAMED_LOADOUTS,fixedLoadoutLevel,RULES_VERSION} from './iterations/v04/engine.mjs';
import {seededRng} from './harness.mjs';
import {COMPUTE_PROFILES,POLICY_VERSION} from './iterations/v04/ai.mjs';

const root=path.dirname(fileURLToPath(import.meta.url));
export function makeCases(seed,{decisionLimit=240,maxDepth=3,nodeBudget=5000,healthModel='offset',damageMultiplier=1,profile='full',computeProfile='legacy'}={}){
 const rng=seededRng(seed),generic=Object.keys(LOADOUTS),cases=[];
 const shuffle=xs=>{const a=[...xs];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 let pairId=0;
 function add(panel,focal,opponent,focalLevel,opponentLevel,band){
  // All four seat/initial-order combinations: neither seat nor initiative is
  // confounded with loadout. The four are paired observations, not replicates.
  for(const focalSide of [0,1])for(const firstLeader of [0,1]){
   const names=focalSide?[opponent,focal]:[focal,opponent],levels=focalSide?[opponentLevel,focalLevel]:[focalLevel,opponentLevel];
   cases.push({caseId:cases.length,pairId,panel,focal,focalSide,band,config:{playerLoadout:names[0],opponentLoadout:names[1],playerLevel:levels[0],opponentLevel:levels[1],playerYear:1,opponentYear:1,firstLeader,spellAccess:'kit',resourceBudget:'standard',healthModel,observers:false,damageMultiplier,encounterSeed:seed,search:computeProfile==='legacy'?{maxDepth,nodeBudget}:{computeProfile},ai:[{profile,seed},{profile,seed:seed+1}]},leftPolicy:'alpha',rightPolicy:'alpha',keepTrace:true,decisionLimit,censorAtLimit:true});
  }
  pairId++;
 }
 for(const level of [20,50,80]){
  // Random ring: every generic meets two different generic opponents per band.
  const ring=shuffle(generic);for(let i=0;i<ring.length;i++)add('generic',ring[i],ring[(i+1)%ring.length],level,level,level);
 }
 for(const name of Object.keys(NAMED_LOADOUTS)){
  const fixed=fixedLoadoutLevel(name),levels=fixed===null?[20,50,80]:[fixed];
  for(const level of levels)add('character',name,generic[Math.floor(rng()*generic.length)],level,level,fixed===null?level:'fixed');
 }
 for(const name of generic)add('skill-gap',name,name,60,40,'60v40');
 return cases;
}

async function workerLoop(){
 const adapter=await import(pathToFileURL(path.join(workerData.sources,'iterations/v04/adapter.mjs')));
 const engine=await import(pathToFileURL(path.join(workerData.sources,'iterations/v04/engine.mjs')));
 const {runMatch}=await import(pathToFileURL(path.join(workerData.sources,'harness.mjs')));
 const measured={...adapter,choose(g,side,policy){
  const before=performance.now(),phase=g.pending[1-side]===null?'commit':'respond',legal=engine.legalActions(g,side);
  const decision=adapter.choose(g,side,policy);
  return {...decision,wallMs:performance.now()-before,phase,legal,incoming:g.pending[1-side],hpBefore:g.actors.map(a=>a.hp),manaBefore:g.actors.map(a=>a.resources.mana)};
 }};
 parentPort.on('message',c=>{
  try{
   const start=performance.now(),result=runMatch(measured,c);
   // searchStats already exists at top level; avoid duplicating it in traces.
   delete result.trace.searchStats;
   parentPort.postMessage({row:{...c,...result,matchWallMs:performance.now()-start}});
  }catch(error){parentPort.postMessage({error:error.stack,caseId:c.caseId});}
 });
 parentPort.postMessage({ready:true});
}
async function main(){
 const args=process.argv.slice(2),arg=(k,d)=>{const i=args.indexOf('--'+k);return i<0?d:args[i+1];};
 const seed=Number(arg('seed','20261016')),workers=Number(arg('workers','4')),decisionLimit=Number(arg('decisions','240')),maxDepth=Number(arg('depth','3')),nodeBudget=Number(arg('nodes','5000')),limit=Number(arg('limit','0'));
 for(const [name,n,min,max]of [['seed',seed,0,0xffffffff],['workers',workers,1,8],['decisions',decisionLimit,2,10000],['depth',maxDepth,1,10],['nodes',nodeBudget,1,1000000],['limit',limit,0,100000]])if(!Number.isInteger(n)||n<min||n>max)throw Error('Invalid --'+name);
 const panel=arg('panel','all'),computeProfile=arg('compute-profile','legacy');
 if(!['all','generic','character','skill-gap'].includes(panel))throw Error('Invalid panel');
 if(computeProfile!=='legacy'&&!COMPUTE_PROFILES[computeProfile])throw Error('Invalid compute profile');
 if(computeProfile!=='legacy'&&(args.includes('--depth')||args.includes('--nodes')))throw Error('Explicit depth/nodes require --compute-profile legacy');
 const healthModel=arg('health-model','offset'),damageMultiplier=Number(arg('damage','1')),profile=arg('profile','full'),caseFile=arg('case-file',null);
 const all=caseFile?JSON.parse(fs.readFileSync(caseFile)):makeCases(seed,{decisionLimit,maxDepth,nodeBudget,healthModel,damageMultiplier,profile,computeProfile}),selected=all.filter(c=>panel==='all'||c.panel===panel),cases=(limit?selected.slice(0,limit):selected).map((c,i)=>({...c,caseId:i}));
 const out=path.resolve(arg('out','experiments/minigames/results/v04-random-'+new Date().toISOString().replace(/[:.]/g,'-')));
 fs.mkdirSync(path.dirname(out),{recursive:true});fs.mkdirSync(out);fs.mkdirSync(path.join(out,'cases'));
 const sourceHashes={};
 for(const f of ['run-v04-random.mjs','analyze-v04-random.mjs','harness.mjs','policies.mjs',...['economy','loadouts','cast-stats','roster','engine','search-state','search-cache','ai','adapter'].map(f=>'iterations/v04/'+f+'.mjs')]){
  const bytes=fs.readFileSync(path.join(root,f)),target=path.join(out,'sources',f);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);sourceHashes[f]=crypto.createHash('sha256').update(bytes).digest('hex');
 }
 const manifest={panel,computeProfile,policyVersion:POLICY_VERSION,computeSettings:computeProfile==='legacy'?{maxDepth,nodeBudget}:COMPUTE_PROFILES[computeProfile],schema:'combat-v04-random-panel-1',rulesVersion:RULES_VERSION,createdUTC:new Date().toISOString(),seed,workers,node:process.version,platform:os.platform(),arch:os.arch(),cpu:os.cpus()[0].model,availableParallelism:os.availableParallelism(),cases,sourceHashes,semantics:'Seed selects matchup sampling only. Gameplay is deterministic. Legacy/analyst policies use reproducible node budgets; live profiles use device-dependent deadlines. Persistent per-actor encounter contexts are worker-local. Paired seats and initial commitment orders are not independent replicates. Default economy 0.4.6: year 1, un-taken Ilse, standard resources, Health 70 plus skill endurance, no observers, kit spells, damage x1. Exact config and policy recorded per case. Fixed named levels use canon top-two mean; generic opponent matched to that level. Named skills retain canon ratios, not equal six-skill vectors; Grey is provisional. Work-limit unfinished fights are censored, not draws. Decision times under parallel load include CPU contention; sequential timings are a separate measurement.'};
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));
 console.log('RESULTS='+out+'\n'+JSON.stringify({cases:cases.length,workers,seed,decisionLimit,maxDepth,nodeBudget,computeProfile,panel}));
 const start=performance.now(),rows=new Array(cases.length);let next=0,done=0;
 await new Promise((resolve,reject)=>{
  const pool=[];let failed=false;
  const fail=error=>{if(failed)return;failed=true;for(const w of pool)w.terminate();reject(error);};
  function dispatch(w){if(next<cases.length)w.postMessage(cases[next++]);else w.terminate();}
  for(let i=0;i<Math.min(workers,cases.length);i++){
   const w=new Worker(new URL(import.meta.url),{workerData:{sources:path.join(out,'sources')}});pool.push(w);
   w.on('error',fail);w.on('exit',code=>{if(code!==0&&code!==1&&!failed)fail(Error('Worker exited '+code));});
   w.on('message',message=>{
    if(message.error){fail(Error(message.error));return;}
    if(message.ready){dispatch(w);return;}
    const row=message.row;rows[row.caseId]=row;fs.writeFileSync(path.join(out,'cases',String(row.caseId).padStart(4,'0')+'.json'),JSON.stringify(row));done++;
    if(done%16===0||done===cases.length)console.log(JSON.stringify({done,total:cases.length,elapsedSeconds:Math.round((performance.now()-start)/1000),completed:rows.filter(r=>r&&!r.censored).length}));
    if(done===cases.length){for(const worker of pool)worker.terminate();resolve();}else dispatch(w);
   });
  }
 });
 fs.writeFileSync(path.join(out,'matches.json'),JSON.stringify(rows));
 fs.writeFileSync(path.join(out,'run-timing.json'),JSON.stringify({elapsedMs:performance.now()-start,matches:rows.length,decisions:rows.reduce((n,r)=>n+r.searchStats.length,0),workers},null,2));
 console.log('FINISHED='+out);
}
if(!isMainThread)await workerLoop();
else if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
