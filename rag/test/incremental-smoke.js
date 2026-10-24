'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),assert=require('node:assert/strict');
const {spawn}=require('child_process');
const R=require('../src/retrieve.js');
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'lightrag-offline-'));
const cfg=R.config({value:{preset:'gemini',models:{extract:'google/gemini-3.8-flash',keyword:'google/gemini-3.8-flash'},lightrag:{python:require('../envs/retrieval.json').lightrag.python}}});
const report=[];
const event=(id,signal)=>`@event ${id}\ntitle: Fixture ${id}\ntext: Shared encounters ${signal} and SIGNAL_COMMON.\n> left: Stay\n  if flag(known):\n    say: ${signal} is visible.\n  else:\n    say: The outcome is uncertain.\n> right: Leave\n  say: You leave.\n`;
function write(file,text){fs.mkdirSync(path.dirname(path.join(temporary,file)),{recursive:true});fs.writeFileSync(path.join(temporary,file),text);}
async function offline(_bin,_args,input){
 return await new Promise((resolve,reject)=>{const child=spawn(cfg.lightrag.python,[path.join(__dirname,'offline_bridge.py')],{env:{...process.env,OPENROUTER_API_KEY:'offline-not-a-real-key'},stdio:['pipe','pipe','pipe']});let out='',err='';child.stdout.on('data',b=>out+=b);child.stderr.on('data',b=>err+=b);child.on('close',code=>code===0?resolve(out):reject(new Error(err)));child.on('error',reject);child.stdin.end(JSON.stringify(input));});
}
function engine(config=cfg){return R.create(temporary,config,{execute:offline});}
async function sync(label,options={},config=cfg){
 const e=engine(config),r=await e.index(options);
 const counts=r.calls?.length===0?{extractionCalls:0,mergeSummaryCalls:0,embeddedInputs:0,extractedIds:[],cacheHits:0,reconstructedEntities:[],reconstructedRelationships:[]}:r.backendIdentity.smokeCounts;
 // A separately built fixture index measures the work a fresh full build does
 // for this exact corpus/config, without reusing the incremental revision/cache.
 const reference=options.rebuild?r:await R.create(temporary,config,{execute:offline,cache:path.join(temporary,'full-reference-'+report.length)}).index({rebuild:true,mode:'sync'});
 report.push({scenario:label,changedDocuments:r.changes.added.length+r.changes.modified.length+r.changes.deleted.length,changes:r.changes,
   counts,fullRebuildCounts:reference.backendIdentity.smokeCounts});
 return {e,r,counts};
}
async function main(){
 write('content/cards.grim',event('a','SIGNAL_ALPHA')+event('b','SIGNAL_BETA'));
 const transportTest=require('child_process').spawnSync(cfg.lightrag.python,[path.join(__dirname,'transport_test.py')],{encoding:'utf8'});assert.equal(transportTest.status,0,transportTest.stdout+transportTest.stderr);
 const first=await sync('full fixture build (mock batch)',{rebuild:true,mode:'batch'});assert(first.counts.extractionCalls>0);const initialVectors=first.r.backendIdentity.chunkVectors;
 let result=await sync('unchanged');assert.equal(result.counts.extractionCalls,0);assert.equal(result.counts.embeddedInputs,0);
 write('content/added.grim',event('c','SIGNAL_GAMMA'));
 result=await sync('add one');assert.deepEqual(result.r.changes.added,['event:c']);assert.deepEqual(result.counts.extractedIds,['event:c']);
 write('content/added.grim',event('c','SIGNAL_DELTA'));
 result=await sync('edit one');for(const [key,vector] of Object.entries(initialVectors))assert.equal(result.r.backendIdentity.chunkVectors[key],vector);assert.deepEqual(result.r.changes.modified,['event:c']);assert(!result.r.backendIdentity.graphSnapshot.nodes.includes('SIGNAL_GAMMA'));assert.deepEqual(result.counts.extractedIds,['event:c']);
 fs.unlinkSync(path.join(temporary,'content/added.grim'));
 result=await sync('delete one');assert.deepEqual(result.r.changes.deleted,['event:c']);assert.equal(result.counts.extractionCalls,0);assert(!result.r.backendIdentity.graphSnapshot.nodes.includes('SIGNAL_DELTA'));assert(result.r.backendIdentity.graphSnapshot.nodes.includes('SIGNAL_COMMON'));assert(result.r.backendIdentity.graphSnapshot.edges.some(e=>e.includes('SIGNAL_COMMON')&&e.some(n=>n.toUpperCase()==='SHARED')));
 const found=await engine().search('Shared SIGNAL_DELTA');assert(found.results.every(r=>r.key!=='event:c'));
 fs.renameSync(path.join(temporary,'content/cards.grim'),path.join(temporary,'content/moved.grim'));
 result=await sync('move unchanged');assert.equal(result.counts.extractionCalls,0);assert.equal(result.counts.embeddedInputs,0);
 const failSearch=R.create(temporary,cfg,{execute:(bin,args,data)=>offline(bin,args,{...data,failRerank:true})});
 await assert.rejects(failSearch.search('Shared injected reranker failure'),/rerank|Retrieval failed/);
 report.push({scenario:'reranker failure',errorVisible:true,activeRevisionPreserved:true});
 const changedQuery=R.config({value:{...cfg,models:{...cfg.models,keyword:'qwen/qwen3.8-flash'}}});
 assert.equal(R.identity(changedQuery),R.identity(cfg));assert.notEqual(R.queryIdentity(changedQuery),R.queryIdentity(cfg));
 result=await sync('keyword model change',{},changedQuery);assert.equal(result.counts.extractionCalls,0);
 const changedReranker=R.config({value:{...cfg,models:{...cfg.models,reranker:'voyageai/rerank-3'}}});
 result=await sync('reranker model change',{},changedReranker);assert.equal(result.counts.extractionCalls,0);assert.equal(result.counts.embeddedInputs,0);
 const revector=R.config({value:{...cfg,models:{...cfg.models,embedding:'test/other-embedding'}}});
 result=await sync('embedding change',{},revector);assert.equal(result.counts.extractionCalls,0);assert(result.counts.embeddedInputs>0);
 const changedExtractor=R.config({value:{...cfg,preset:'qwen',models:{embedding:cfg.models.embedding,reranker:cfg.models.reranker}}});
 assert.notEqual(R.extractionIdentity(changedExtractor),R.extractionIdentity(cfg));await assert.rejects(engine(changedExtractor).index(),/unbuilt|configuration/);
 result=await sync('extraction model rebuild',{rebuild:true,mode:'sync'},changedExtractor);assert.deepEqual(result.counts.extractedIds,['event:a','event:b']);
 // Fail after native storage work, then rerun the same staged revision.
 write('content/added.grim',event('d','SIGNAL_EPSILON'));
 const interrupted=R.create(temporary,revector,{execute:async(...args)=>{await offline(...args);throw new Error('Injected interruption after native work');}});
 const activeBefore=fs.readFileSync(path.join(interrupted.dir,'index.json'),'utf8');
 await assert.rejects(interrupted.index(),/Injected interruption/);assert.equal(fs.readFileSync(path.join(interrupted.dir,'index.json'),'utf8'),activeBefore);
 result=await sync('resume interrupted',{resume:true},revector);assert.equal(result.counts.extractionCalls,0);
 const saved=path.join(__dirname,'../runs','offline-smoke-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json');
 const output=JSON.stringify({offline:true,externalNetworkBlocked:true,paidCalls:0,fixtureOnly:true,scenarios:report,note:'Counts measure work, not an API price estimate.'},null,2);
 fs.mkdirSync(path.dirname(saved),{recursive:true});fs.writeFileSync(saved,output+'\n',{flag:'wx'});
 const lines=['# Offline LightRAG smoke results','','Official LightRAG 1.5.7; scripted extraction and deterministic embeddings, external network blocked, zero paid calls. Counts describe fixture work, not API prices.','','| Scenario | Changed docs | Extracted IDs | Extraction calls | Merge calls | Embedded inputs | Cache hits | Shared reconstructions | Full-build extraction calls |','|---|---:|---|---:|---:|---:|---:|---:|---:|'];
 for(const row of report){if(!row.counts){lines.push('| '+row.scenario+' | Visible error | | | | | | | |');continue;}
  const c=row.counts;lines.push('| '+[row.scenario,row.changedDocuments,c.extractedIds.join(', ')||'none',c.extractionCalls,c.mergeSummaryCalls,c.embeddedInputs,c.cacheHits,(c.reconstructedEntities?.length||0)+(c.reconstructedRelationships?.length||0),row.fullRebuildCounts.extractionCalls].join(' | ')+' |');}
 lines.push('','Full-build reference counts use a separate fresh fixture index for the same corpus/config. Shared entity and relationship reconstruction details are retained separately in the JSON report. Live provider behavior was not tested.');
 fs.writeFileSync(saved.replace(/\.json$/,'.md'),lines.join('\n')+'\n',{flag:'wx'});console.log(lines.join('\n'));console.error('Offline JSON report: '+saved);
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;}).finally(()=>fs.rmSync(temporary,{recursive:true,force:true}));
