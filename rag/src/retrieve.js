'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const C = require('./catalog.js');
const U = require('./util.js');
const DEFAULTS = require('./models.json');
const adapter = require('./adapters/lightrag.js');
const PROFILES = {full: {dense: true, rerank: true, graph: true, descriptions: false}};
function config(opts = {}) {
  const local = path.resolve(__dirname, '../envs/retrieval.json');
  const file = opts.value || (opts.config ? U.readJSON(path.resolve(opts.config)) : fs.existsSync(local) ? U.readJSON(local) : {});
  function checkSecrets(value){for(const [key,v] of Object.entries(value||{})){if(/api[_-]?key|authorization|password|secret/i.test(key))throw new Error('Keep credentials in rag/.env.local, outside retrieval configuration');if(v&&typeof v==='object')checkSecrets(v);}}
  checkSecrets(file);
  if(file.components && Object.entries(file.components).some(([k,v])=>PROFILES.full[k]!==v))throw new Error('Component switches are not supported by the LightRAG workflow');
  const preset = file.preset || require('../authoring.json').preset || 'gemini';
  if (!['gemini','qwen'].includes(preset)) throw new Error('Unknown LightRAG preset');
  if ((opts.backend || file.backend || 'lightrag') !== 'lightrag') throw new Error('Only LightRAG is supported');
  if ((opts.profile || file.profile || 'full') !== 'full') throw new Error('Only the full LightRAG profile is supported');
  const helper = preset === 'qwen' ? 'qwen/qwen3.8-flash' : DEFAULTS.helper;
  const out = {...file, backend:'lightrag', profile:'full', preset, components:{...PROFILES.full},
    models:{...DEFAULTS, helper, ...file.models}, preprocessing:'grim-parent-context-v2'};
  delete out.qmd;
  out.models.extract = file.models?.extract || file.models?.helper || helper;
  out.models.keyword = file.models?.keyword || out.models.extract;
  return out;
}
function extractionIdentity(cfg) {
  return U.hash({preprocessing:cfg.preprocessing, model:cfg.models.extract, endpoint:cfg.baseURL || 'https://openrouter.ai/api/v1',provider:cfg.provider || null,
    implementation:['catalog.js','retrieve.js',...adapter.files].map(f=>U.hash(fs.readFileSync(path.join(__dirname,f))))});
}
function identity(cfg) { return U.hash({extraction:extractionIdentity(cfg),embedding:cfg.models.embedding}); }
function queryIdentity(cfg) { return U.hash({build:identity(cfg),keyword:cfg.models.keyword,reranker:cfg.models.reranker,provider:cfg.provider || null}); }
function withoutLocations(value) {
  if(Array.isArray(value))return value.map(withoutLocations);
  if(value && typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([k])=>!['file','line','endLine'].includes(k)).map(([k,v])=>[k,withoutLocations(v)]));
  return value;
}
function contextRecords(cat,r) {
  const ids=new Set(cat.edges.filter(e=>e.from===r.key).map(e=>e.to));
  for(const f of cat.records)if(f.kind==='fact'&&ids.has('npc:'+f.metadata.npc))ids.add(f.key);
  return cat.records.filter(x=>x.kind!=='event'&&!x.retired&&ids.has(x.key)&&x.key!==r.key).sort((a,b)=>a.key.localeCompare(b.key));
}
function recordsFor(cat,priorRecords=[]) {
  const previous=new Map(priorRecords.map(r=>[r.key,r]));
  return cat.records.filter(r=>!r.retired).map(r=>{
    const context=contextRecords(cat,r),searchText=JSON.stringify(withoutLocations({key:r.key,title:r.title,...r.metadata,branches:r.branches}))+'\n'+r.text.trim()+
      (context.length?'\nReferenced worldbook context (not unconditional event outcomes):\n'+context.map(x=>x.key+'\n'+x.text.trim()).join('\n'):'');
    const prior=previous.get(r.key),canonicalInputKey=U.hash(searchText);
    const preserved=prior?.inputProvenance?.format==='legacy-block-prose-v1' && prior.inputProvenance.canonicalInputKey===canonicalInputKey;
    return {key:r.key,kind:r.kind,file:r.file,line:r.line,metadata:r.metadata,sourceHash:r.sourceHash,inputKey:preserved?prior.inputKey:canonicalInputKey,searchText:preserved?prior.searchText:searchText,
      inputProvenance:preserved?prior.inputProvenance:{format:'grim-parent-context-v2'},
      dependencies:context.map(x=>[x.key,U.hash(x.text.trim())])};
  });
}
function changes(before,records) {
  const old=new Map((before?.records||[]).map(r=>[r.key,r])),now=new Map(records.map(r=>[r.key,r]));
  return {added:records.filter(r=>!old.has(r.key)).map(r=>r.key),modified:records.filter(r=>old.has(r.key)&&old.get(r.key).inputKey!==r.inputKey).map(r=>r.key),
    deleted:[...old.keys()].filter(k=>!now.has(k)),moved:records.filter(r=>old.get(r.key)?.inputKey===r.inputKey&&(old.get(r.key).file!==r.file||old.get(r.key).line!==r.line)).map(r=>r.key),
    reused:records.filter(r=>old.get(r.key)?.inputKey===r.inputKey).length};
}
function digest(m){return U.hash({identity:m.identity,corpusHash:m.corpusHash,records:m.records,backendIdentity:m.backendIdentity,revision:m.revision});}
function create(root,cfg,options={}) {
  const cat=options.catalog||C.catalog(root),id=identity(cfg),dir=path.resolve(options.cache||path.join(root,'rag/cache'),'lightrag',extractionIdentity(cfg));
  const manifestFile=path.join(dir,'index.json'),pendingFile=path.join(dir,'pending.json'),lock=path.join(dir,'writer.lock');
  const stages=[],service={calls:[]},byKey=new Map(cat.records.map(r=>[r.key,r]));
  const stage=(name,data)=>stages.push({stage:name,...data});
  async function observed(call){try{return await call();}catch(error){service.calls.push(...(error.calls||[]));stage('failure',{error:error.message});throw error;}}
  function prior(){if(!fs.existsSync(manifestFile))return null;const m=U.readJSON(manifestFile);if(m.version!==2||m.indexHash!==digest(m))throw new Error('Modified or unsupported index manifest');return m;}
  function status(){
    const m=prior(),records=recordsFor(cat,m?.records),delta=changes(m,records),updating=fs.existsSync(lock),pending=fs.existsSync(pendingFile)?U.readJSON(pendingFile):null;
    const state=updating?'updating':pending?'failed/resumable':!m?'unbuilt':m.identity!==id||m.corpusHash!==cat.corpusHash?'stale':'ready';
    return {backend:'lightrag',profile:'full',state,ready:state==='ready',corpusHash:cat.corpusHash,indexHash:m?.indexHash||null,records:m?.records.length||0,changes:delta,
      reason:state==='ready'?null:!m?'Initial graph build required: retrieve index --rebuild':'Run retrieve index'+(pending?' --resume':''),queryIdentity:queryIdentity(cfg)};
  }
  async function index(opts={}) {
    const before=prior(),records=recordsFor(cat,opts.rebuild?[]:before?.records),delta=changes(before,records),revector=!!before&&before.config.models.embedding!==cfg.models.embedding;
    if(opts['dry-run'])return {dryRun:true,...status(),rebuildRequired:!before,revector,paidCalls:0};
    if(!before&&!opts.rebuild&&!opts.resume)throw new Error('Index unbuilt or extraction configuration changed. Operator must run retrieve index --rebuild.');
    const mode=opts.mode||((opts.rebuild&&cfg.models.extract==='google/gemini-3.8-flash')?'batch':'sync');
    if(!['sync','batch'].includes(mode))throw new Error('Index mode must be sync or batch');
    if(mode==='batch'&&cfg.models.extract!=='google/gemini-3.8-flash')throw new Error('Batch capability is verified only for google/gemini-3.8-flash; select --mode sync for this preset.');
    fs.mkdirSync(dir,{recursive:true});
    let fd;
    try{fd=fs.openSync(lock,'wx',0o600);fs.writeFileSync(fd,JSON.stringify({pid:process.pid,at:new Date().toISOString()}));}
    catch(e){if(e.code!=='EEXIST')throw e;const owner=U.readJSON(lock);let alive=true;try{process.kill(owner.pid,0);}catch(err){if(err.code==='ESRCH')alive=false;}if(!alive&&opts.resume){fs.unlinkSync(lock);return index(opts);}throw new Error('Index writer is locked; if interrupted, use --resume after the writer exits.');}
    try{
      let pending=fs.existsSync(pendingFile)?U.readJSON(pendingFile):null;
      const target=U.hash({identity:id,corpusHash:cat.corpusHash,records});
      if(pending){if(!opts.resume)throw new Error('Unfinished update exists; use --resume.');if(pending.target!==target)throw new Error('Resume refused: source or build configuration changed. Preserve pending work and restore its inputs.');}
      else if(opts.resume)throw new Error('No unfinished update to resume');
      else {
        if(before&&!opts.rebuild&&!revector&&!delta.added.length&&!delta.modified.length&&!delta.deleted.length){
          const m={...before,records,corpusHash:cat.corpusHash};m.indexHash=digest(m);U.writeJSON(manifestFile,m);stage('index',{...delta,modelCalls:0});return {...m,records:records.length,changes:delta,calls:[]};
        }
        const revision=new Date().toISOString().replace(/[:.]/g,'-')+'-'+crypto.randomUUID().slice(0,8),storage=path.join(dir,'revisions',revision);
        fs.mkdirSync(storage,{recursive:true});
        if(before&&!opts.rebuild)fs.cpSync(path.join(dir,before.storage),storage,{recursive:true,mode:fs.constants.COPYFILE_FICLONE});
        for(const marker of ['sync-progress.json','vectors-rebuilt.json'])fs.rmSync(path.join(storage,marker),{force:true});
        pending={target,revision,storage:path.relative(dir,storage),mode,baseRevision:before?.revision||null,rebuild:!!opts.rebuild,revector,at:new Date().toISOString()};U.writeJSON(pendingFile,pending);
      }
      const changed=pending.rebuild?records:records.filter(r=>delta.added.includes(r.key)||delta.modified.includes(r.key));
      const result=await observed(()=>adapter.index(changed,path.join(dir,pending.storage),cfg,options.execute,{expected:records.map(r=>r.key),deleted:pending.rebuild?[]:[...delta.deleted,...delta.modified],mode:pending.mode,resume:!!opts.resume,revector:pending.revector,jobDirectory:path.join(dir,'jobs',pending.revision)}));
      service.calls.push(...(result.calls||[]));
      if(U.hash([...(result.processedIds||[])].sort())!==U.hash(records.map(r=>r.key).sort()))throw new Error('Incomplete native document coverage; revision not published.');
      if(U.hash(options.catalog||C.catalog(root))!==U.hash(cat))throw new Error('Source changed during indexing; update not published. Restore inputs before --resume.');
      const m={version:2,identity:id,corpusHash:cat.corpusHash,config:cfg,records,revision:pending.revision,storage:pending.storage,dimensions:result.dimensions,backendIdentity:result,at:new Date().toISOString()};
      m.indexHash=digest(m);U.writeJSON(manifestFile,m);fs.unlinkSync(pendingFile);U.appendJSON(path.join(dir,'builds.jsonl'),{at:m.at,revision:m.revision,indexHash:m.indexHash,changes:delta,calls:result.calls});
      stage('index',{...delta,revision:m.revision,revector});return {...m,records:records.length,changes:delta,calls:result.calls};
    }finally{if(fd!==undefined)fs.closeSync(fd);fs.rmSync(lock,{force:true});}
  }
  function load(){const m=prior();if(!m)throw new Error('Index unbuilt. Operator must run retrieve index --rebuild.');if(m.identity!==id||m.corpusHash!==cat.corpusHash)throw new Error('Stale index; run retrieve index to synchronize source changes.');return m;}
  async function search(query,opts={}) {
    if(!query?.trim())throw new Error('A nonempty query is required');const m=load();
    const eligible=m.records.filter(r=>{const x=byKey.get(r.key);return (!opts.kind||x.kind===opts.kind)&&(!opts.place||x.metadata.place===opts.place)&&(!opts.cast||opts.cast.split(',').some(k=>x.key==='npc:'+k||x.metadata.npc===k||cat.edges.some(e=>e.from===x.key&&e.to==='npc:'+k)));});
    const result=await observed(()=>adapter.search(query,path.join(dir,m.storage),m.backendIdentity,cfg,options.execute)),allowed=new Set(eligible.map(r=>r.key));
    for(const h of result.hits)if(!byKey.has(h.key))throw new Error('Unknown parent source returned: '+h.key);
    const hits=[...new Map(result.hits.filter(h=>allowed.has(h.key)).map(h=>[h.key,h])).values()];
    stage('external',{backend:'lightrag',version:m.backendIdentity.version,queryIdentity:queryIdentity(cfg),calls:result.calls,ids:hits.map(h=>h.key),stages:result.stages});
    service.calls.push(...(result.calls||[]));
    return {query,backend:'lightrag',profile:'full',corpusHash:cat.corpusHash,indexHash:m.indexHash,total:hits.length,results:hits.slice(0,U.positive(opts.limit,10)).map(h=>{const r=byKey.get(h.key);return {...h,title:r.title,file:r.file,line:r.line,sourceHash:r.sourceHash,authority:r.authority,metadata:r.metadata,excerpt:r.prose.slice(0,280)};}),stages:stages.slice(),calls:service.calls};
  }
  function read(keys,budget){return C.pack(keys.map(key=>C.resolve(cat,key)),budget,keys.map(key=>C.resolve(cat,key).key));}
  async function brief(query, opts = {}) {
    const found = await search(query, opts), required = (opts.required || '').split(',').filter(Boolean).map((key) => C.resolve(cat, key).key);
    for (const id of (opts.cast || '').split(',').filter(Boolean)) {
      required.push(C.resolve(cat, 'npc:' + id).key);
      required.push(...cat.records.filter((r) => r.kind === 'fact' && r.metadata.npc === id).map((r) => r.key));
    }
    for (const kind of ['place', 'track', 'arc']) if (opts[kind]) required.push(C.resolve(cat, kind + ':' + opts[kind]).key);
    const roots = [...required, ...found.results.map((r) => r.key)], expanded = [], truncated = [];
    if (cfg.components.graph) for (const key of roots) {
      const n = C.neighbors(cat, key, 20);
      if (n.omitted) truncated.push({ key, omittedEdges: n.omitted });
      for (const edge of n.edges) expanded.push(edge.from === key ? edge.to : edge.from);
    }
    stage('graph', { enabled: cfg.components.graph, roots, ids: [...new Set(expanded)] });
    const packed = C.pack([...required, ...expanded, ...roots].map((key) => byKey.get(key)).filter(Boolean), opts.budget, required);
    return { ...packed, dependenciesTruncated: truncated, backend: cfg.backend, profile: cfg.profile, corpusHash: cat.corpusHash, indexHash: found.indexHash, stages: stages.slice(), calls: service.calls || [] };
  }
  return { cat, cfg, dir, stages, service, index, load, status, search, read, brief, neighbors: (key, limit) => { stage('graph', { enabled: true }); return C.neighbors(cat, key, limit); } };
}
module.exports = {digest,PROFILES,config,identity,queryIdentity,extractionIdentity,recordsFor,changes,create};
