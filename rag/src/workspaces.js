'use strict';
// Operator-only: no author/critic model is launched by these commands.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {spawn} = require('child_process');
const U = require('./util.js');
const C = require('./catalog.js');
const R = require('./retrieve.js');
const P = require('./workspace-projection.js');
const G = require('../../src/grimoire.js');
const Setup = require('../setup.js');
const {openRouterKey} = require('./credentials.js');
const VERSION = 1;
const PROMPT = `Write approximately ten cards for Lumenhold Academy, following AGENTS.md and the writing skill. Use existing characters and places, inspecting their canon and prior scenes. Write anywhere under content/. Work in one uninterrupted session, validate deterministically, and report changed file paths and block IDs. Do not translate, refresh goldens, invoke model critics, change tools/instructions, or adopt/deploy the cards.\n\nThemes (operator: finish these before pasting this exact prompt into two fresh sessions):\n1. An inconvenient favour: an ordinary request for help creates a visible opportunity cost.\n2. [UNFILLED]\n3. [UNFILLED]\n4. [UNFILLED]\n5. [UNFILLED]\n\n[UNFILLED: card counts per theme; any shared creative constraints.]\n`;
function operator(dir) {return path.join(dir, '_operator');}
function manifestFile(dir) {return path.join(operator(dir), 'manifest.json');}
function load(dir) {const m = U.readJSON(manifestFile(dir)); if (m.version !== VERSION || path.resolve(dir) !== m.destination) throw new Error('Unrecognized or relocated workspace experiment'); return m;}
function save(dir, m) {U.writeJSON(manifestFile(dir), m);}
function filesAt(root, rel = '') {
  const skip = /(^|\/)(\.git|node_modules|target|out|\.DS_Store)(\/|$)|^rag\/(envs|dependencies|receipts|cache)($|\/)/;
  return fs.readdirSync(path.join(root, rel), {withFileTypes: true}).sort((a,b)=>a.name.localeCompare(b.name)).flatMap(d => {
    const f = rel ? rel + '/' + d.name : d.name;
    if (skip.test(f) || /(^|\/)\.env(?:\.|$)/.test(f)) return [];
    if (d.isSymbolicLink()) return [f];
    return d.isDirectory() ? filesAt(root, f) : [f];
  });
}
function inventory(root) {
  const files = [], blocks = [], errors = [];
  for (const file of filesAt(root)) {
    const abs = path.join(root,file), st = fs.lstatSync(abs);
    if (st.isSymbolicLink()) {files.push({file, hash: U.hash('symlink:' + fs.readlinkSync(abs)), symlink: fs.readlinkSync(abs)}); continue;}
    const raw = fs.readFileSync(abs); files.push({file, hash: U.hash(raw), bytes: raw.length});
    if (!/^content\/.*\.grim$/.test(file)) continue;
    const text = raw.toString('utf8'), lines = text.split('\n');
    try {
      const defs = G.parseFile(text,file);
      defs.forEach((d,i) => {
        const end = defs[i+1] ? defs[i+1].line-1 : lines.length, block = lines.slice(d.line-1,end).join('\n');
        blocks.push({key: d.block+':'+d.id, kind: d.block, id: d.id, file, line: d.line, endLine: end, hash: U.hash(block), text: block});
      });
    } catch(e) {errors.push({file, message:e.message, raw:text});}
  }
  const keys = new Map(); for (const b of blocks) {if (keys.has(b.key)) errors.push({file:b.file,message:'Duplicate block identity: '+b.key,other:keys.get(b.key)}); keys.set(b.key,b.file);}
  return {hash:U.hash(files), files, blocks, errors};
}

function runtimeInventory(root) {
  const files=[];
  function walk(rel) {
    const abs=path.join(root,rel); if (!fs.existsSync(abs))return;
    const st=fs.lstatSync(abs);
    if (/(__pycache__|\.DS_Store)(\/|$)|\.(pyc|log)$|api-calls\.jsonl$|bridge-stderr|-(wal|shm)$/.test(rel))return;
    if (st.isSymbolicLink()) {files.push({file:rel,hash:U.hash('symlink:'+fs.readlinkSync(abs))});return;}
    if(st.isDirectory())for(const f of fs.readdirSync(abs).sort())walk(rel+'/'+f);
    else files.push({file:rel,hash:U.hash(fs.readFileSync(abs)),bytes:st.size});
  }
  for(const rel of ['node_modules','rag/envs','rag/dependencies','rag/cache'])walk(rel);
  return {hash:U.hash(files),files};
}
function runtimeDiff(before,after) {
 const old=new Map(before.files.map(f=>[f.file,f.hash])), now=new Map(after.files.map(f=>[f.file,f.hash]));
 return [...new Set([...old.keys(),...now.keys()])].sort().flatMap(file=>old.get(file)===now.get(file)?[]:[{file,category:file.startsWith('rag/cache/')?'retrieval-runtime-state':'runtime-dependency',before:old.get(file)||null,after:now.get(file)||null}]);
}

function category(file) {
  if (file.startsWith('content/core/')) return 'rules';
  if (file.startsWith('content/')) return 'authored-content';
  if (/^build\/(content|combat)\.bundle\.js$/.test(file)) return 'generated-bundle';
  if (/^rag\/frozen\//.test(file) || file === 'rag/binding.json') return 'frozen-retrieval-input';
  if (/^(AGENTS\.md|CLAUDE\.md|skills\/|docs\/)/.test(file)) return 'instructions';
  if (/^(tools\/|src\/|rag\/src\/|package)/.test(file)) return 'tools';
  return 'other';
}
function compare(before, after, root) {
  const old = new Map(before.files.map(r=>[r.file,r])), now = new Map(after.files.map(r=>[r.file,r]));
  const files = [...new Set([...old.keys(),...now.keys()])].sort().flatMap(file => {
    const a=old.get(file), b=now.get(file); if(a?.hash===b?.hash) return [];
    const row={file,category:category(file),change:!a?'added':!b?'deleted':'modified',before:a?.hash||null,after:b?.hash||null};
    // Preserve raw changed sources even when their parser failed. Binary output is hashed separately.
    if (b && !b.symlink && /\.(?:grim|md|js|json|py|sh|ps1|txt|lang)$/.test(file) && (file.endsWith('.grim') || b.bytes < 2*1024*1024)) row.text=fs.readFileSync(path.join(root,file),'utf8');
    if (b?.symlink) row.symlink=b.symlink;
    return [row];
  });
  const a = new Map(before.blocks.map(b=>[b.key,b])), b = new Map(after.blocks.map(b=>[b.key,b]));
  const broken = new Set(after.errors.map(e=>e.file));
  const blocks = [...new Set([...a.keys(),...b.keys()])].sort().flatMap(key=> {
    const x=a.get(key), y=b.get(key);
    if (!y && broken.has(x.file)) return [{key,change:'unresolved-parse-error',before:x,after:null}];
    if (x && y && x.hash===y.hash && x.file===y.file) return [];
    return [{key,change:!x?'added':!y?'deleted':x.file!==y.file?'moved':'modified',modified:!!x&&!!y&&x.hash!==y.hash,before:x||null,after:y||null}];
  });
  return {files,blocks,parseErrors:after.errors,counts:Object.fromEntries(['added','modified','deleted','moved','unresolved-parse-error'].map(k=>[k,blocks.filter(b=>b.change===k).length]))};
}
function scan(dir) {
  const m=load(dir), report={version:VERSION,at:new Date().toISOString(),snapshotHash:m.snapshotHash,projects:{}};
  for(const name of Object.keys(m.projects)) {
    const projectRoot=path.join(dir,name), before=U.readJSON(path.join(operator(dir),'initial',name+'.json'));
    const current=inventory(projectRoot); report.projects[name]=compare(before,current,projectRoot);
    report.projects[name].currentInventoryHash=current.hash;
    const runtimeFile=path.join(operator(dir),'initial',name+'-runtime.json');
    report.projects[name].runtimeChanges=fs.existsSync(runtimeFile)?runtimeDiff(U.readJSON(runtimeFile),runtimeInventory(projectRoot)):[];
  }
  const id=report.at.replaceAll(':','-')+'-'+crypto.randomUUID().slice(0,8), file=path.join(operator(dir),'scans',id+'.json');
  U.writeJSON(file,report,true); return {file,projects:Object.fromEntries(Object.keys(report.projects).map(name=>[name,{counts:report.projects[name].counts,fileChanges:report.projects[name].files.length,parseErrors:report.projects[name].parseErrors.length}]))};
}
function command(bin,args,cwd,log) {
  return new Promise((resolve,reject)=>{
    fs.mkdirSync(path.dirname(log),{recursive:true}); const output=fs.openSync(log,'a',0o600);
    const child=spawn(bin,args,{cwd,env:process.env,stdio:['ignore',output,output]});
    child.on('error',e=>{fs.closeSync(output);reject(new Error('Dependency command unavailable: '+bin));});
    child.on('close',code=>{fs.closeSync(output);code===0?resolve():reject(new Error('Dependency command failed, exit '+code+'; see '+log));});
  });
}
async function captureRuntime(root,config,op) {
  const log=path.join(op,'logs/capture-runtime.log');
  const run=require('./process.js').run;
  const pythonInfo=JSON.parse(await run(config.lightrag.python,['-c','import sys,json,importlib.metadata; print(json.dumps({"base":sys._base_executable,"version":sys.version,"lightrag":importlib.metadata.version("lightrag-hku")}))']));
  const freeze=await run(config.lightrag.python,['-m','pip','freeze']);
  if (/^(?:-e |[^\n]* @ (?:file|git)[:+])/m.test(freeze)) throw new Error('Nonportable Python freeze; capture a portable pinned installation first');
  const lock=path.join(op,'requirements-lightrag.txt');
  if(fs.existsSync(lock)&&fs.readFileSync(lock,'utf8')!==freeze)throw new Error('Captured Python package versions changed');
  if(!fs.existsSync(lock))fs.writeFileSync(lock,freeze,{flag:'wx'});
  U.writeJSON(log+'.json',{pythonInfo,freezeHash:U.hash(freeze),node:process.version});
  return {pythonInfo,freezeHash:U.hash(freeze),node:process.version};
}
function snapshotFiles(root) {
  const own=fs.readdirSync(path.join(root,'rag/src')).filter(f=>/\.(js|json|py)$/.test(f)).map(f=>'rag/src/'+f);
  const adapters=fs.readdirSync(path.join(root,'rag/src/adapters')).filter(f=>f.endsWith('.js')).map(f=>'rag/src/adapters/'+f);
  return [...P.selectedFiles(root),...own,...adapters,'rag/setup.js','rag/authoring.json'].sort();
}
function sourceIdentity(root) {return snapshotFiles(root).map(file=>[file,U.hash(fs.readFileSync(path.join(root,file)))]);}
async function dependencies(root,dir,name,m) {
  const target=path.join(dir,name), envs=path.join(target,'rag/envs');fs.mkdirSync(envs,{recursive:true});
  let config={backend:name,profile:'full',indexConcurrency:8,models:{...require('./models.json')},components:{...R.PROFILES.full},preprocessing:'grim-block-prose-v1'};
  const op=operator(dir), original=m.sourceConfig;
  if(name==='lightrag') {
    const key=openRouterKey(path.join(root,'rag'));
    if(!key)throw new Error('Missing OpenRouter credential');
    const keyFile=path.join(target,'rag/.env.local');
    if(!fs.existsSync(keyFile))fs.writeFileSync(keyFile,'OPENROUTER_API_KEY='+key+'\n',{flag:'wx',mode:0o600});
    fs.chmodSync(keyFile,0o600);
    config={...config,...(original.baseURL?{baseURL:original.baseURL}:{}),...(original.provider?{provider:original.provider}:{}),models:{...config.models,...original.models}};
  }
  if(name==='lightrag') {
    const venv=path.join(envs,'lightrag'), py=path.join(venv,process.platform==='win32'?'Scripts/python.exe':'bin/python');
    const log=path.join(op,'logs/lightrag-install.log');
    if(!fs.existsSync(py))await command(m.runtime.pythonInfo.base,['-m','venv',venv],target,log);
    await command(py,['-m','pip','install','-r',path.join(op,'requirements-lightrag.txt')],target,log);
    const run=require('./process.js').run;
    const freeze=await run(py,['-m','pip','freeze']);if(U.hash(freeze)!==m.runtime.freezeHash)throw new Error('Installed Python packages differ from captured versions');
    config.lightrag={python:py};
  }
  U.writeJSON(path.join(envs,'retrieval.json'),config);
  // Source paths remain the original content-relative addresses inside the frozen root.
  if(!fs.existsSync(path.join(target,'rag/frozen/content')))fs.cpSync(path.join(op,'snapshot/content'),path.join(target,'rag/frozen/content'),{recursive:true,mode:fs.constants.COPYFILE_FICLONE});
  const localR=require(path.join(target,'rag/src/retrieve.js'));
  const cfg=localR.config({value:config}), engine=localR.create(path.join(target,'rag/frozen'),cfg,{cache:path.join(target,'rag/cache')});
  U.writeJSON(path.join(target,'rag/binding.json'),{config:cfg,identity:localR.identity(cfg),corpusHash:engine.cat.corpusHash});
  return {config:cfg,identity:localR.identity(cfg),corpusHash:engine.cat.corpusHash,receipt:path.join(target,'rag/receipts/retrieval.jsonl')};
}
async function buildAndProbe(dir,name,m) {
  const target=path.join(dir,name), binding=U.readJSON(path.join(target,'rag/binding.json'));
  const localR=require(path.join(target,'rag/src/retrieve.js'));
  const engine=localR.create(path.join(target,'rag/frozen'),binding.config,{cache:path.join(target,'rag/cache')});
  let indexed;
  try {indexed=await engine.index(fs.existsSync(path.join(engine.dir,'pending.json'))?{resume:true}:{rebuild:true});}
  catch(e){U.appendJSON(path.join(operator(dir),'logs',name+'-index-errors.jsonl'),{at:new Date().toISOString(),message:e.message,calls:engine.service.calls});throw e;}
  const manifest=engine.load();
  const expected=engine.cat.records.filter(r=>!r.retired).map(r=>[r.key,r.sourceHash]).sort();
  const actual=manifest.records.map(r=>[r.key,r.sourceHash]).sort();
  if(U.hash(expected)!==U.hash(actual) || engine.cat.corpusHash!==m.corpusHash)throw new Error('Incomplete index coverage or source mismatch');
  const runtime=require(path.join(target,'rag/src/workspace-runtime.js'));
  const search=(await runtime.execute(target,['search','library overdue fine favour','--limit','3','--json'])).result;
  if(!search.results.length)throw new Error('Live search returned no sources');
  const key=search.results[0].key, source=C.resolve(engine.cat,key);
  const read=(await runtime.execute(target,['read',key,'--json'])).result;
  if(read.incomplete||!read.text.includes(source.text))throw new Error('Original source probe incomplete');
  const brief=(await runtime.execute(target,['brief','library overdue fine favour','--required',key,'--budget','24000','--json'])).result;
  if(brief.chars>24000||brief.incomplete)throw new Error('Bounded required evidence probe failed');
  const tiny=(await runtime.execute(target,['read',key,'--budget','1','--json'])).result;
  if(!tiny.incomplete||tiny.text.length)throw new Error('Strict budget probe failed');
  // A draft in working content must not contaminate or invalidate discovery.
  const probe=path.join(target,'content/events/workspace_readiness_probe.grim');
  if(fs.existsSync(probe))throw new Error('Probe path already exists');
  try {
    fs.writeFileSync(probe,'@event workspace_readiness_probe\ntitle: Readiness probe\ntext: zxqv_draft_probe_only\n> left: Stay\n  say: Stay.\n> right: Leave\n  say: Leave.\n',{flag:'wx'});
    const checked=(await runtime.execute(target,['status','--json'])).result;
    if(checked.indexHash!==indexed.indexHash||engine.cat.records.some(r=>r.id==='workspace_readiness_probe'))throw new Error('Draft contaminated starting index');
    const draftSearch=(await runtime.execute(target,['search','zxqv_draft_probe_only','--limit','1','--json'])).result;
    if(draftSearch.results.some(r=>r.key==='event:workspace_readiness_probe'))throw new Error('Draft entered retrieval');
  } finally {fs.unlinkSync(probe);}
  const result={at:new Date().toISOString(),expectedRecords:expected.length,records:actual.length,indexHash:indexed.indexHash,corpusHash:indexed.corpusHash,indexIdentity:binding.identity,backendIdentity:manifest.backendIdentity,dimensions:indexed.dimensions,probe:{query:search.query,ids:search.results.map(r=>r.key),read:key,briefChars:brief.chars,draftExcluded:true},calls:manifest.calls};
  U.writeJSON(path.join(operator(dir),'readiness',name+'.json'),result);return result;
}
function status(dir) {
  const m=load(dir), projects={};
  for (const name of Object.keys(m.projects)) {
    const state=m.projects[name], view={ready:!!state?.ready,phase:state?.phase||'pending',error:state?.error||null,records:state?.index?.records||null,indexHash:state?.index?.indexHash||null,receipt:state?.runtime?.receipt||null};
    if(view.ready && name !== 'baseline')try {
      const target=path.join(dir,name), binding=U.readJSON(path.join(target,'rag/binding.json')), localR=require(path.join(target,'rag/src/retrieve.js'));
      if(localR.identity(binding.config)!==state.runtime.identity || binding.corpusHash!==m.corpusHash)throw new Error('Fixed binding or implementation changed');
      const engine=localR.create(path.join(target,'rag/frozen'),binding.config,{cache:path.join(target,'rag/cache')}), indexed=engine.load();
      if(indexed.indexHash!==state.index.indexHash || indexed.records.length!==state.index.records)throw new Error('Index changed after readiness');
      if(name==='lightrag'&&!fs.existsSync(binding.config.lightrag.python))throw new Error('Local Python runtime missing');
    } catch(error) {view.ready=false;view.error=error.message;}
    projects[name]=view;
  }
  return {destination:dir,snapshotHash:m.snapshotHash,corpusHash:m.corpusHash,ready:Object.values(projects).every(p=>p.ready),projects,report:path.join(operator(dir),'READINESS.md')};
}
function report(dir,m) {
  const rows=Object.keys(m.projects).map(n=>`| ${n} | ${m.projects[n]?.ready?'ready':'NOT READY'} | ${m.projects[n]?.phase||'pending'} | ${m.projects[n]?.error||''} |`).join('\n');
  fs.writeFileSync(path.join(operator(dir),'READINESS.md'),`# Preparation readiness\n\nSnapshot: ${m.snapshotHash}\n\nCorpus: ${m.corpusHash}\n\n| Project | State | Last phase | Failure |\n|---|---|---|---|\n${rows}\n\n${m.error ? 'Preparation error: '+m.error+'\n\n' : ''}These are exploratory batches, not independent card-level randomized trials. Readiness is functional, not evidence of quality. See manifest.json and readiness/*.json for actual versions, identities, probes, API usage and check logs. No authors or judges were launched.\n`);
}
async function prepare(root,dir,opts={}) {
  if (Number(process.versions.node.split('.')[0])!==24)throw new Error('Run with the project Node 24 wrapper');
  if(dir===root||dir.startsWith(root+path.sep))throw new Error('Use a destination outside the source project');
  const signature=sourceIdentity(root), config=R.config(), configHash=U.hash(config), op=operator(dir);
  if(/api.?key|authorization|password|secret/i.test(Object.keys(config).join(' ')))throw new Error('Keep credentials in ignored .env.local, outside retrieval configuration');
  let m;
  if(fs.existsSync(dir)) {
    if(!opts.resume||!fs.existsSync(manifestFile(dir)))throw new Error('Destination exists; only a matching recorded --resume is allowed');
    m=load(dir);if(m.snapshotHash!==U.hash(signature)||m.configurationHash!==configHash)throw new Error('Resume refused: source snapshot or configuration changed');
  } else {
    fs.mkdirSync(op,{recursive:true});
    m={version:VERSION,destination:path.resolve(dir),source:path.resolve(root),created:new Date().toISOString(),snapshotHash:U.hash(signature),sourceFiles:signature,configurationHash:configHash,sourceConfig:config,projects:{},promptHash:null,mode:'two exploratory batches, approximately ten cards each'};
    save(dir,m);
    for(const [f] of signature)P.copyFile(path.join(root,f),path.join(op,'snapshot',f));
    m.corpusHash=C.catalog(path.join(op,'snapshot')).corpusHash;save(dir,m);
    fs.writeFileSync(path.join(op,'prompt-template.md'),PROMPT,{flag:'wx'});
    fs.writeFileSync(path.join(op,'README.md'),`# Operator procedure\n\nFinish prompt-template.md and remove every UNFILLED marker. Save its exact SHA-256 in manifest.json promptHash before authoring. Paste the same bytes into two fresh agent sessions, one opened at each project root. Use the same harness/model/reasoning settings and resources; record actual settings, versions, session times and any failures alongside native exports under sessions/. Do not resume or fork a prior author session or read sibling drafts.\n\nRetain each GUI agent's native session export here under sessions/<project>/; automatic receipts in <project>/rag/receipts/retrieval.jsonl supplement them. Receipts alone cannot establish that the agent avoided alternative tools or sibling directories. These folders are not an OS security boundary.\n\nAfter the authors finish, run from the main source project:\n\nnpm run grim -- author-eval workspaces scan --experiment "${dir}"\n\nScan reports are immutable, retain raw changed sources and parser failures, and distinguish authored content, generated bundles and instruction/tool/input drift. Review-page import is a later step. Do not adopt these cards or translate them yet.\n\nPreparation can be retried with prepare --out "${dir}" --resume only while source/config fingerprints match. status --experiment reports readiness. Never expose .env.local in exports.\n`,{flag:'wx'});
  }
  for(const [file, expected] of signature) {
    const target=path.join(op,'snapshot',file);
    if(!fs.existsSync(target))P.copyFile(path.join(root,file),target);
    if(U.hash(fs.readFileSync(target))!==expected)throw new Error('Recorded snapshot file changed: '+file);
  }
  if(!m.corpusHash){m.corpusHash=C.catalog(path.join(op,'snapshot')).corpusHash;save(dir,m);}
  if(!m.runtime)try {m.runtime=await captureRuntime(root,config,op);delete m.error;save(dir,m);}
  catch(error) {m.error=error.message;save(dir,m);report(dir,m);throw error;}
  await Promise.all(P.NAMES.map(async name => {
    const state=m.projects[name] ||= {backend:name==='baseline'?null:name,ready:false,phase:'pending'};
    if(state.ready)return;
    try {
      if(!state.projected) {
        console.error('Preparing '+name+': project files');
        P.project(path.join(op,'snapshot'),path.join(dir,name),name);
        // Validators/browser tests share the same ordinary game dependencies.
        if(fs.existsSync(path.join(root,'node_modules')))fs.cpSync(path.join(root,'node_modules'),path.join(dir,name,'node_modules'),{recursive:true,dereference:false,mode:fs.constants.COPYFILE_FICLONE});
        state.projected=true;state.phase='projected';save(dir,m);
      }
      if(name!=='baseline'&&!state.runtime) {
        console.error('Preparing '+name+': runtime');state.runtime=await dependencies(root,dir,name,m);state.phase='runtime';save(dir,m);
      }
      if(name!=='baseline'&&!state.index) {
        console.error('Preparing '+name+': full corpus index and live probes');state.index=await buildAndProbe(dir,name,m);state.phase='index-and-probes';save(dir,m);
      }
      console.error('Preparing '+name+': grim check');
      const log=path.join(op,'logs',name+'-grim-check.log');
      await command(process.execPath,['tools/grim.js','check'],path.join(dir,name),log);
      const inv=inventory(path.join(dir,name));
      if(inv.errors.length)throw new Error('Initial inventory has parser errors');
      const common=inv.files.filter(f=>/^content\//.test(f.file)||/^docs\/authoring\//.test(f.file)||/^skills\//.test(f.file)).map(f=>[f.file,f.hash]);
      state.commonHash=U.hash(common);
      if(Object.values(m.projects).some(s=>s.commonHash&&s.commonHash!==state.commonHash))throw new Error('Game content or common authoring rules differ between projects');
      const runtimeFile=path.join(op,'initial',name+'-runtime.json');
      const runtime=runtimeInventory(path.join(dir,name));
      if(!fs.existsSync(runtimeFile))U.writeJSON(runtimeFile,runtime,true);
      else if(U.readJSON(runtimeFile).hash!==runtime.hash)throw new Error('Runtime changed since initial inventory');
      state.runtimeHash=runtime.hash;
      const initial=path.join(op,'initial',name+'.json');
      if(fs.existsSync(initial)) {if(U.readJSON(initial).hash!==inv.hash)throw new Error('Initial inventory changed since preparation');}
      else U.writeJSON(initial,inv,true);
      state.initialHash=inv.hash;state.checkLog=log;state.ready=true;state.phase='ready';delete state.error;
    }catch(e){state.error=e.message;state.failedAt=new Date().toISOString();console.error('Preparation failed for '+name+': '+e.message);}
    save(dir,m);report(dir,m);
  }));
  return status(dir);
}
module.exports={runtimeInventory,runtimeDiff,prepare,status,scan,inventory,compare,category,sourceIdentity,load,PROMPT};
