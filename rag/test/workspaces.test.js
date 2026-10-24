'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),os=require('os');
const W=require('../src/workspaces.js'),P=require('../src/workspace-projection.js'),U=require('../src/util.js');
const root=path.resolve(__dirname,'../..'), temporary=[];
function temp(){const p=fs.mkdtempSync(path.join(os.tmpdir(),'rag-workspaces-test-'));temporary.push(p);return p;}
function write(dir,f,text){fs.mkdirSync(path.dirname(path.join(dir,f)),{recursive:true});fs.writeFileSync(path.join(dir,f),text);}
const event=(id,text='original')=>`@event ${id}\ntitle: A card\ntext: ${text}\n> left: Stay\n  say: You stay.\n> right: Leave\n  say: You leave.\n`;
test.after(()=>temporary.forEach(p=>fs.rmSync(p,{recursive:true,force:true})));

test('projected workspaces have identical rules, only one implementation, and no baseline retrieval interface',async()=>{
 const snapshot=temp();
 for(const f of P.selectedFiles(root).filter(f=>!f.startsWith('art/')&&!f.startsWith('combat/')))P.copyFile(path.join(root,f),path.join(snapshot,f));
 fs.cpSync(path.join(root,'rag/src'),path.join(snapshot,'rag/src'),{recursive:true});
 P.copyFile(path.join(root,'rag/authoring.json'),path.join(snapshot,'rag/authoring.json'));
 const out=temp();
 for(const name of P.NAMES)P.project(snapshot,path.join(out,name),name);
 const base=path.join(out,'baseline');
 assert.ok(!fs.existsSync(path.join(base,'rag')));
 assert.ok(!/retrieve|author-eval|rag\//i.test(fs.readFileSync(path.join(base,'AGENTS.md'),'utf8')));
 for(const file of ['docs/authoring/README.md','skills/write-academy-events/SKILL.md'])assert.ok(!/rag\/|retrieve search/.test(fs.readFileSync(path.join(base,file),'utf8')),file);
 const tool=fs.readFileSync(path.join(base,'tools/grim.js'),'utf8');assert.ok(!/case 'retrieve'|author-eval|rag\//.test(tool));
 for(const name of P.NAMES.slice(1)) {
  const dir=path.join(out,name);
  assert.deepEqual(fs.readdirSync(path.join(dir,'rag/src/adapters')),[name+'.js']);
  assert.equal(fs.readFileSync(path.join(dir,'rag/USAGE.md'),'utf8'),P.USAGE);
  assert.ok(!/QMD|LightRAG|Grim RAG|backend/.test(P.USAGE));
  assert.equal(fs.readFileSync(path.join(dir,'AGENTS.md'),'utf8'),fs.readFileSync(path.join(base,'AGENTS.md'),'utf8')+P.RETRIEVAL);
  for(const file of ['skills/write-academy-events/SKILL.md','docs/authoring/README.md','content/core/rules.grim','content/world/cast.grim'])assert.equal(U.hash(fs.readFileSync(path.join(dir,file))),U.hash(fs.readFileSync(path.join(base,file))));
  const runtime=require(path.join(dir,'rag/src/workspace-runtime.js'));
  for(const option of ['backend','profile','root','cache','config','run','log','out'])await assert.rejects(runtime.execute(dir,['search','a','--'+option,'other']),/fixed/);
  const receipts=fs.readFileSync(path.join(dir,'rag/receipts/retrieval.jsonl'),'utf8').trim().split('\n').map(JSON.parse);assert.equal(receipts.length,8);assert.ok(receipts.every(r=>r.error));
 }
});

test('fixed runtime preserves branches and budgets, excludes drafts and rejects changed frozen inputs',async()=>{
 const snapshot=temp(); for(const f of ['AGENTS.md','tools/grim.js','src/grimoire.js','src/i18n.js','tools/project.js'])P.copyFile(path.join(root,f),path.join(snapshot,f));
 fs.cpSync(path.join(root,'rag/src'),path.join(snapshot,'rag/src'),{recursive:true});
 P.copyFile(path.join(root,'rag/authoring.json'),path.join(snapshot,'rag/authoring.json'));
 write(snapshot,'content/events/example.grim',event('original','Rare premise'));
 const dir=path.join(temp(),'lightrag');P.project(snapshot,dir,'lightrag');
 fs.cpSync(path.join(dir,'content'),path.join(dir,'rag/frozen/content'),{recursive:true});
 const R=require(path.join(dir,'rag/src/retrieve.js')),cfg=R.config({value:{backend:'lightrag',profile:'full',models:{},preprocessing:'fixture'}});
 const execute=async(_bin,_argv,input)=>JSON.stringify({backend:'lightrag',version:'1.5.7',models:cfg.models,dimensions:3,processedIds:input.expected,calls:[]});
 const engine=R.create(path.join(dir,'rag/frozen'),cfg,{cache:path.join(dir,'rag/cache'),execute});await engine.index({rebuild:true,mode:'sync'});
 U.writeJSON(path.join(dir,'rag/binding.json'),{config:cfg,identity:R.identity(cfg),corpusHash:engine.cat.corpusHash});
 const runtime=require(path.join(dir,'rag/src/workspace-runtime.js'));
 write(dir,'content/events/new.grim',event('draft'));
 write(dir,'content/events/example.grim',event('original','new draft revision'));
 assert.equal((await runtime.execute(dir,['status'])).result.records,1);
 const read=(await runtime.execute(dir,['read','event:original'])).result;assert.ok(read.text.includes('> right: Leave'));assert.ok(read.text.includes('say: You stay.'));assert.ok(read.text.includes('Rare premise'));assert.ok(!read.text.includes('new draft revision'));
 const tiny=(await runtime.execute(dir,['read','event:original','--budget','1'])).result;assert.equal(tiny.incomplete,true);assert.equal(tiny.text,'');
 await assert.rejects(runtime.execute(dir,['read','event:draft']),/Unknown/);
 write(dir,'rag/frozen/content/events/example.grim',event('original','tampered'));
 await assert.rejects(runtime.execute(dir,['status']),/Frozen source fingerprint/);
});

test('inventory detects blocks in existing/new files, moves, deletions, parser failures, and tool/instruction drift',()=>{
 const dir=temp();write(dir,'content/events/a.grim',event('a')+event('b'));write(dir,'content/events/delete.grim',event('deleted'));write(dir,'content/events/malformed.grim',event('broken'));write(dir,'AGENTS.md','initial');write(dir,'tools/tool.js','initial');
 const before=W.inventory(dir);
 write(dir,'content/events/a.grim',event('a','changed')+event('added_existing'));
 write(dir,'content/events/new.grim',event('added_new'));
 write(dir,'content/events/moved.grim',event('b'));
 fs.unlinkSync(path.join(dir,'content/events/delete.grim'));
 write(dir,'content/events/malformed.grim','@event BAD HEADER\nraw malformed source');
 write(dir,'AGENTS.md','changed');write(dir,'tools/tool.js','changed');write(dir,'build/content.bundle.js','generated');write(dir,'rag/frozen/content/a.grim','tampered');
 const after=W.inventory(dir),diff=W.compare(before,after,dir),changes=Object.fromEntries(diff.blocks.map(b=>[b.key,b.change]));
 assert.equal(changes['event:added_existing'],'added');assert.equal(changes['event:added_new'],'added');assert.equal(changes['event:b'],'moved');assert.equal(changes['event:a'],'modified');assert.equal(changes['event:deleted'],'deleted');assert.equal(changes['event:broken'],'unresolved-parse-error');
 assert.equal(diff.parseErrors.length,1);assert.ok(diff.parseErrors[0].raw.includes('raw malformed'));
 for(const category of ['instructions','tools','generated-bundle','frozen-retrieval-input'])assert.ok(diff.files.some(f=>f.category===category));
 assert.equal(before.blocks.find(b=>b.key==='event:a').text,event('a').trimEnd());
});

test('scan reports are immutable and leave project files unchanged',()=>{
 const dir=temp(),m={version:1,destination:dir,snapshotHash:'fixture',projects:Object.fromEntries(P.NAMES.map(n=>[n,{}]))};
 U.writeJSON(path.join(dir,'_operator/manifest.json'),m);
 for(const name of P.NAMES){const project=path.join(dir,name);write(project,'content/cards.grim',event('a'));U.writeJSON(path.join(dir,'_operator/initial',name+'.json'),W.inventory(project));}
 write(path.join(dir,'lightrag'),'content/cards.grim',event('a')+event('added'));
 const hash=W.inventory(path.join(dir,'lightrag')).hash,a=W.scan(dir),b=W.scan(dir);
 assert.notEqual(a.file,b.file);assert.equal(a.projects.lightrag.counts.added,1);assert.equal(W.inventory(path.join(dir,'lightrag')).hash,hash);
});


test('runtime inventories detect installed tool changes and distinguish search cache activity',()=>{
 const dir=temp();write(dir,'rag/dependencies/qmd/node_modules/tool.js','initial');write(dir,'rag/envs/models/weights.gguf','GGUF');write(dir,'rag/cache/store.json','initial');
 const before=W.runtimeInventory(dir);
 write(dir,'rag/dependencies/qmd/node_modules/tool.js','changed');write(dir,'rag/cache/store.json','query cache updated');write(dir,'rag/receipts/retrieval.jsonl','normal receipt');
 const changed=W.runtimeDiff(before,W.runtimeInventory(dir));assert.equal(changed.length,2);assert.ok(changed.some(f=>f.category==='runtime-dependency'));assert.ok(changed.some(f=>f.category==='retrieval-runtime-state'));
});

test('preparation refuses unrelated destinations and mismatched resumes before installing or overwriting',async()=>{
 const dest=temp();write(dest,'unrelated.txt','keep these bytes');
 await assert.rejects(W.prepare(root,dest),/Destination exists/);
 U.writeJSON(path.join(dest,'_operator/manifest.json'),{version:1,destination:dest,snapshotHash:'different',configurationHash:'different'});
 await assert.rejects(W.prepare(root,dest,{resume:true}),/snapshot or configuration changed/);
 assert.equal(fs.readFileSync(path.join(dest,'unrelated.txt'),'utf8'),'keep these bytes');
 assert.ok(!fs.existsSync(path.join(dest,'baseline')));
});

test('LightRAG recovery uses the native retry fence without reenqueuing existing documents',t=>{
 const {spawnSync}=require('child_process');
 const result=spawnSync(process.platform==='win32'?'python':'python3',[path.join(__dirname,'lightrag_retry_test.py')],{encoding:'utf8'});
 if(result.error?.code==='ENOENT'){t.skip('Optional Python interpreter unavailable');return;}
 assert.equal(result.status,0,(result.stdout||'')+(result.stderr||''));
});
