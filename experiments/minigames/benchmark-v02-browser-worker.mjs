#!/usr/bin/env node
// Optional Chromium transport check using an existing all-spells timing run.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const args=process.argv.slice(2),option=(key,fallback)=>{const i=args.indexOf('--'+key);return i<0?fallback:args[i+1];};
const run=path.resolve(option('run','')),url=option('url','http://127.0.0.1:61040/');
assert(args.includes('--run'),'Pass --run with a completed Node latency run');
const out=path.join(run,'browser-worker');fs.mkdirSync(out);
const manifest=JSON.parse(fs.readFileSync(path.join(run,'manifest.json'))),all=JSON.parse(fs.readFileSync(path.join(run,'fixtures.json')));
const fixtures=all.filter(f=>[50,80].includes(f.playerLevel)&&f.firstLeader===1&&
  ['opening','respond-strike','forecast-slot-1','bilateral-forecast-slot-1','foresight-1-commit','bilateral-foresight-commit'].includes(f.phase)&&
  (f.mode==='negotiation'||['Evoker','Seer'].includes(f.playerArchetype)));
assert(fixtures.length>0,'No representative browser fixtures in this run');
const reference=JSON.parse(fs.readFileSync(path.join(run,'decisions.json')));
const {chromium}=createRequire(path.resolve('package.json'))('playwright');
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:375,height:667}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto(url);
  const served=await page.evaluate(async()=>({engine:await(await fetch('/engine.mjs')).text(),app:await(await fetch('/app.mjs')).text(),ua:navigator.userAgent}));
  const sources=['roster.mjs','engine.mjs','ai.mjs'].map(f=>fs.readFileSync(path.join(run,'sources/iterations/v02',f),'utf8').replace(/^import .*;\n/gm,'').replace(/^export \{ARCHETYPES,SPELLS,CONTEXTS,RESOURCES,generateKit\};\n/m,''));
  assert.equal(served.engine,'// Generated from experiments/minigames/iterations/v02; edit those sources.\n'+sources.join('\n'),'Browser and frozen Node core must match');
  fs.writeFileSync(path.join(out,'served-engine.mjs'),served.engine);fs.writeFileSync(path.join(out,'served-app.mjs'),served.app);
  fs.copyFileSync(new URL(import.meta.url),path.join(out,'benchmark-v02-browser-worker.mjs'));
  const result=await page.evaluate(async({fixtures,settings})=>{
    const profiles=Object.keys(settings.profiles),tasks=fixtures.flatMap(f=>profiles.map(profile=>({f,profile})));
    const worker=new Worker('/app.mjs?worker=1',{type:'module'});let token=0;
    async function call(f,profile,repeat){
      return await new Promise((resolve,reject)=>{
        const id=++token,timeout=setTimeout(()=>reject(Error('Worker decision timeout')),10000);
        worker.onmessage=e=>{if(e.data.token!==id)return;clearTimeout(timeout);if(e.data.error)reject(Error(e.data.error));else resolve({fixtureId:f.id,mode:f.mode,level:f.playerLevel,phase:f.phase,profile,repeat,roundTripMs:performance.now()-start,...e.data.decision});};
        worker.onerror=e=>{clearTimeout(timeout);reject(Error(e.message));};
        const start=performance.now();worker.postMessage({token:id,state:f.state,options:{...settings.profiles[profile],...settings.search,seed:settings.seeds[repeat%settings.seeds.length]}});
      });
    }
    // This first call includes worker/module startup; keep it out of warm timings.
    const cold=await call(fixtures[0],'full',0),rows=[];
    for(let pass=-settings.warmups;pass<settings.repeats;pass++){
      const offset=((pass+settings.warmups)*97)%tasks.length;
      for(let i=0;i<tasks.length;i++){
        const {f,profile}=tasks[(i+offset)%tasks.length],row=await call(f,profile,Math.max(0,pass));if(pass>=0)rows.push(row);
      }
    }
    worker.terminate();return {cold,rows};
  },{fixtures,settings:manifest.settings});
  const stable=r=>Object.fromEntries(['id','value','completedDepth','nodes','cutoffs','cacheHits','planning','bestId','degraded','mistakeAttempted','regret','eligible','rankingDepth','rankingNodes','totalNodes','seed','mistakeChance','maxDepth','mistakeRoll','degradationSkipped'].filter(k=>k in r).map(k=>[k,r[k]]));
  for(const row of result.rows){const expected=reference.find(r=>r.fixtureId===row.fixtureId&&r.profile===row.profile&&r.repeat===row.repeat);assert(expected);assert.deepEqual(stable(row),stable(expected),'Browser and Node decisions must match exactly');}
  assert.deepEqual(errors,[]);
  const q=(xs,p)=>{const a=[...xs].sort((a,b)=>a-b);return a[Math.max(0,Math.ceil(a.length*p)-1)];};
  const groups=[];
  for(const mode of ['combat','negotiation'])for(const profile of Object.keys(manifest.settings.profiles)){
    const rows=result.rows.filter(r=>r.mode===mode&&r.profile===profile),xs=rows.map(r=>r.roundTripMs);
    groups.push({mode,profile,n:rows.length,p50Ms:q(xs,.5),p95Ms:q(xs,.95),p99Ms:q(xs,.99),maxMs:Math.max(...xs),workerComputeP95Ms:q(rows.map(r=>r.elapsedMs),.95),medianTransportAndWrapperMs:q(rows.map(r=>r.roundTripMs-r.elapsedMs),.5),depthZero:rows.filter(r=>r.completedDepth===0).length});
  }
  const summary={browserVersion:browser.version(),userAgent:served.ua,url,viewport:{width:375,height:667},fixtureIds:fixtures.map(f=>f.id),cold:result.cold,groups,matchingNodeDecisions:result.rows.length,errors,
    engineSha256:crypto.createHash('sha256').update(served.engine).digest('hex'),method:'Headless Chromium on desktop, sequential requests to the actual live prototype worker. Roundtrip includes structured cloning/dispatch and AI. One cold startup call is separate. Warmup/repeats/seeds match Node; same exact decisions verified. A narrow stress panel, not a phone hardware measurement.'};
  fs.writeFileSync(path.join(out,'decisions.json'),JSON.stringify(result.rows,null,2));fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify(summary,null,2));
  console.log(JSON.stringify(summary,null,2));
}finally{await browser.close();}
