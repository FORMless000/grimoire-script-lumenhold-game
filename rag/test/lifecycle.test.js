'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),os=require('os');
const {spawnSync}=require('child_process');
const R=require('../src/retrieve.js'),C=require('../src/catalog.js'),U=require('../src/util.js');
const temporary=[];test.after(()=>temporary.forEach(dir=>fs.rmSync(dir,{recursive:true,force:true})));
const cfg=R.config({value:{}});
function fixture(){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'lightrag-lifecycle-'));temporary.push(dir);fs.mkdirSync(path.join(dir,'content'));return dir;}
function event(id,text='Original'){return `@event ${id}\ntitle: Fixture\nactor: shared\ntext: ${text}\n> left: Stay\n  if flag(known):\n    say: Known outcome.\n  else:\n    say: Other outcome.\n> right: Leave\n  say: Gone.\n`;}
function execute(log=[]){return async(_bin,_argv,input)=>{log.push(input);return JSON.stringify({backend:'lightrag',version:'1.5.7',models:input.models,dimensions:3,processedIds:input.expected,calls:[]});};}
test('context input hashes invalidate dependent blocks but exclude source locations',()=>{
 const dir=fixture();fs.writeFileSync(path.join(dir,'content/cards.grim'),event('a')+event('b'));
 fs.writeFileSync(path.join(dir,'content/world.grim'),'@npc shared\nname: Shared\nvoice: Quiet and brief.\n');
 const before=R.recordsFor(C.catalog(dir));
 fs.renameSync(path.join(dir,'content/cards.grim'),path.join(dir,'content/moved.grim'));
 let delta=R.changes({records:before},R.recordsFor(C.catalog(dir)));assert.deepEqual(delta.modified,[]);assert.deepEqual(delta.moved,['event:a','event:b']);
 fs.writeFileSync(path.join(dir,'content/world.grim'),'@npc shared\nname: Shared\nvoice: Loud and direct.\n');
 delta=R.changes({records:before},R.recordsFor(C.catalog(dir)));assert.deepEqual(delta.modified.sort(),['event:a','event:b','npc:shared']);
});
test('unbuilt, failed coverage, writer serialization and modified manifests fail closed',async()=>{
 const dir=fixture();fs.writeFileSync(path.join(dir,'content/a.grim'),event('a'));
 const engine=R.create(dir,cfg,{execute:execute()});assert.equal(engine.status().state,'unbuilt');
 const dry=await engine.index({'dry-run':true});assert.equal(dry.paidCalls,0);assert.ok(!fs.existsSync(engine.dir));
 await assert.rejects(engine.index(),/unbuilt/);await assert.rejects(engine.search('x'),/unbuilt/);
 await engine.index({rebuild:true,mode:'sync'});const active=fs.readFileSync(path.join(engine.dir,'index.json'));
 fs.writeFileSync(path.join(dir,'content/a.grim'),event('a','Edited'));
 const broken=R.create(dir,cfg,{execute:async()=>JSON.stringify({processedIds:[],calls:[]})});
 await assert.rejects(broken.index(),/Incomplete native document coverage/);assert.deepEqual(fs.readFileSync(path.join(engine.dir,'index.json')),active);
 assert.equal(broken.status().state,'failed/resumable');
 const resumed=R.create(dir,cfg,{execute:execute()});await resumed.index({resume:true});
 fs.writeFileSync(path.join(engine.dir,'writer.lock'),JSON.stringify({pid:process.pid}));
 await assert.rejects(resumed.index(),/locked/);fs.unlinkSync(path.join(engine.dir,'writer.lock'));
 const file=path.join(engine.dir,'index.json'),manifest=U.readJSON(file);manifest.records[0].inputKey='contaminated';U.writeJSON(file,manifest);
 assert.throws(()=>resumed.load(),/Modified/);
});
test('retirement deletes discovery input; missing adapters and retired switches cannot be selected',async()=>{
 const dir=fixture();fs.writeFileSync(path.join(dir,'content/a.grim'),event('a'));
 const log=[];await R.create(dir,cfg,{execute:execute(log)}).index({rebuild:true,mode:'sync'});
 fs.writeFileSync(path.join(dir,'content/a.grim'),event('a').replace('title: Fixture','tags: retired\ntitle: Fixture'));
 const result=await R.create(dir,cfg,{execute:execute(log)}).index();assert.deepEqual(result.changes.deleted,['event:a']);assert.deepEqual(log.at(-1).deleted,['event:a']);
 for(const name of ['grim','qmd']){assert.throws(()=>R.config({backend:name}),/Only LightRAG/);assert.ok(!fs.existsSync(path.join(__dirname,'../src/adapters',name+'.js')));assert.ok(!fs.existsSync(path.join(__dirname,'../dependencies',name)));}
 assert.throws(()=>R.config({profile:'no-dense'}),/Only the full/);
});
test('setup entry points prepare LightRAG only and support read-only help',()=>{
 const root=path.resolve(__dirname,'../..'),shell=path.join(root,'rag/setup.sh');
 assert.equal(spawnSync('sh',['-n',shell]).status,0);
 const result=spawnSync('sh',[shell,'--help'],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);assert.equal(JSON.parse(result.stdout).indexBuilt,false);
 for(const file of ['setup.sh','setup.ps1']){const text=fs.readFileSync(path.join(root,'rag',file),'utf8');assert.ok(!/qmd|retrieve index|pip install/i.test(text));assert.ok(text.includes('setup.js'));}
 assert.equal(require('../../package.json').scripts['rag:smoke'],'sh tools/with-node24.sh node rag/test/incremental-smoke.js');
});

test('source drift during an update preserves the previously published revision',async()=>{
 const dir=fixture(),file=path.join(dir,'content/a.grim');fs.writeFileSync(file,event('a'));
 let engine=R.create(dir,cfg,{execute:execute()});await engine.index({rebuild:true,mode:'sync'});
 const active=fs.readFileSync(path.join(engine.dir,'index.json'));
 fs.writeFileSync(file,event('a','Planned edit'));
 engine=R.create(dir,cfg,{execute:async(...args)=>{const result=await execute()(...args);fs.writeFileSync(file,event('a','Unexpected concurrent edit'));return result;}});
 await assert.rejects(engine.index(),/Source changed/);assert.deepEqual(fs.readFileSync(path.join(engine.dir,'index.json')),active);
 await assert.rejects(R.create(dir,cfg,{execute:execute()}).index({resume:true}),/Resume refused/);
});

test('adopted inputs keep real provenance, move without re-extraction, and upgrade changed context',()=>{
 const dir=fixture(),source=path.join(dir,'content/a.grim');fs.writeFileSync(source,event('a'));
 fs.writeFileSync(path.join(dir,'content/world.grim'),'@npc shared\nname: Shared\nvoice: Quiet.\n');
 const original=R.recordsFor(C.catalog(dir)),old=original.map(r=>({...r,searchText:'legacy input '+r.key,inputKey:U.hash('legacy input '+r.key),inputProvenance:{format:'legacy-block-prose-v1',canonicalInputKey:r.inputKey}}));
 fs.renameSync(source,path.join(dir,'content/moved.grim'));
 let records=R.recordsFor(C.catalog(dir),old);assert.deepEqual(R.changes({records:old},records).modified,[]);assert.equal(records.find(r=>r.key==='event:a').searchText,'legacy input event:a');
 fs.writeFileSync(path.join(dir,'content/world.grim'),'@npc shared\nname: Shared\nvoice: Loud.\n');
 records=R.recordsFor(C.catalog(dir),old);assert.equal(records.find(r=>r.key==='event:a').inputProvenance.format,'grim-parent-context-v2');assert.deepEqual(R.changes({records:old},records).modified.sort(),['event:a','npc:shared']);
});
