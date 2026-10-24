'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),os=require('os');
const U=require('../src/util.js'),W=require('../src/workspaces.js'),I=require('../src/batch-import.js'),R=require('../src/batch-review.js');
const G=require('../../src/grimoire.js'),I18n=require('../../src/i18n.js');
const dirs=[],root=path.resolve(__dirname,'../..');
function temp(){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'lifesim-batch-review-'));dirs.push(dir);return dir;}
function write(root,file,text){const p=path.join(root,file);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,text);}
function event(id,body='') {return `@event ${id}\ntitle: A submitted scene\ntext: <script>bad()</script> {npc} asks a question.\n> left: Help\n  if flag(earlier_choice):\n    say: You remember.\n  else:\n    say: You do not remember.\n  ${body||'say: It costs you time.'}\n> right: Decline\n  say: You leave.\n`;}
function fixture(){
  const dir=temp(),names=['baseline','grim','qmd','lightrag'];
  write(dir,'_operator/snapshot/content/events/base.grim',event('old'));
  for(const name of names){write(dir,name+'/content/events/base.grim',event('old'));U.writeJSON(path.join(dir,'_operator/initial',name+'.json'),W.inventory(path.join(dir,name)));}
  const corpusHash=I.parseSources([{path:'content/events/base.grim',text:event('old')}]).catalog.corpusHash;
  U.writeJSON(path.join(dir,'_operator/manifest.json'),{version:1,destination:dir,snapshotHash:'snapshot',corpusHash,projects:Object.fromEntries(names.map(name=>[name,{backend:name}]))});
  for(const name of names){
    write(dir,name+'/content/events/base.grim',event('old')+'\n'+event(name+'_one',`queue ${name}_two in 1`));
    write(dir,name+'/content/events/new.grim',event(name+'_two'));
  }
  const scan=W.scan(dir).file;write(dir,'prompt.txt','The exact shared task.\n');
  return {dir,scan,prompt:path.join(dir,'prompt.txt')};
}
function imported(){const f=fixture();return {...f,...I.importWorkspaces(root,f.dir,{scan:f.scan,prompt:f.prompt})};}
test.after(()=>dirs.forEach(d=>fs.rmSync(d,{recursive:true,force:true})));

test('imports additions in existing/new files, freezes scan bytes, preserves branches and linked cards',()=>{
  const f=fixture();write(f.dir,'grim/content/events/new.grim',event('grim_two','say: later mutable edit'));
  const result=I.importWorkspaces(root,f.dir,{scan:f.scan,prompt:f.prompt}),state=R.state(result.directory);
  assert.equal(result.events,8);assert.equal(result.presentations,9);assert.equal(state.provisional,true);assert.equal(state.prompt,'The exact shared task.\n');
  assert.ok(state.cards.some(c=>c.linked.length===1));assert.ok(state.cards.every(c=>c.source.includes('> right: Decline')));
  assert.ok(state.cards.some(c=>c.source.includes('if flag(earlier_choice)')));assert.ok(state.cards.every(c=>c.authoredDef.options.length===2));assert.ok(state.cards.every(c=>c.mechanics.sizes));assert.ok(!JSON.stringify(state).includes('later mutable edit'));
  assert.equal(I.latest(f.dir),result.directory);assert.ok(!fs.existsSync(path.join(f.dir,'baseline','.git')));
  const later=I.importWorkspaces(root,f.dir,{scan:f.scan,prompt:f.prompt});assert.notEqual(later.directory,result.directory);
  assert.throws(()=>I.importWorkspaces(root,f.dir,{scan:f.scan,out:result.directory}),/exists/);
});
test('retains modified/deleted/moved blocks, supporting changes and malformed files',()=>{
  const f=fixture();write(f.dir,'baseline/content/events/base.grim',event('old','say: changed.'));
  write(f.dir,'qmd/content/events/base.grim',event('qmd_one','queue qmd_two in 1'));
  write(f.dir,'qmd/content/events/moved.grim',event('old'));
  write(f.dir,'grim/content/events/base.grim',event('grim_one','queue grim_two in 1'));
  write(f.dir,'grim/content/support.grim','@state supporting\nname: Supporting definition\n');
  write(f.dir,'lightrag/content/events/broken.grim','@event BROKEN HEADER\nraw malformed source');
  const scan=W.scan(f.dir).file,result=I.importWorkspaces(root,f.dir,{scan}),m=R.load(result.directory);
  const arts=m.batches.map(b=>R.artifact(result.directory,b));
  assert.ok(arts.some(a=>a.cards.some(c=>c.change==='modified')));
  assert.ok(arts.some(a=>a.cards.some(c=>c.change==='deleted')));
  assert.ok(arts.some(a=>a.cards.some(c=>c.change==='moved')));
  assert.ok(arts.some(a=>a.changes.blocks.some(c=>c.key==='state:supporting')));
  assert.ok(arts.some(a=>a.parseErrors.some(e=>e.text.includes('raw malformed'))));
  assert.ok(R.state(result.directory).cards.some(c=>c.source.includes('raw malformed')));
});
test('rejects mismatched snapshot, file/block fingerprints and tampered frozen artifacts',()=>{
  const f=fixture(),bad=U.readJSON(f.scan);bad.snapshotHash='other';const p=path.join(f.dir,'bad.json');U.writeJSON(p,bad);
  assert.throws(()=>I.importWorkspaces(root,f.dir,{scan:p}),/does not match/);
  bad.snapshotHash='snapshot';bad.projects.grim.files.find(f=>f.file.endsWith('new.grim')).text+='tamper';U.writeJSON(p,bad);
  assert.throws(()=>I.importWorkspaces(root,f.dir,{scan:p}),/hash/);
  const result=I.importWorkspaces(root,f.dir,{scan:f.scan}),m=R.load(result.directory),b=m.batches[0],a=R.artifact(result.directory,b);a.cards[0].block.def.title='tamper';U.writeJSON(path.join(result.directory,b.file),a);
  assert.throws(()=>R.state(result.directory),/artifact changed/);
});
test('simple ratings remain blinded, allow partial autosaves and validate fields',()=>{
  const f=imported(),s=R.state(f.directory),json=JSON.stringify(s),label=s.cards[0].label,reviewEpoch=s.reviewEpoch;
  for(const name of ['baseline','grim','qmd','lightrag'])assert.ok(!json.includes(name+'_one'));
  assert.ok(!json.includes('"identity"'));assert.ok(!json.includes('compileErrors'));assert.ok(s.cards.every(c=>c.key.includes('draft_')));
  assert.throws(()=>R.reveal(f.directory,{reviewEpoch}),/Rate every/);
  const put=patch=>R.rate(f.directory,{label,reviewEpoch,...patch});
  put({rating:4,comments:'First impression'});let j=R.state(f.directory).cards.find(c=>c.label===label).judgment;
  assert.equal(j.rating,4);assert.equal(j.worldFit,null);assert.equal(R.state(f.directory).complete,false);
  put({worldFit:'partial'});put({rating:2});j=R.state(f.directory).cards.find(c=>c.label===label).judgment;
  assert.equal(j.worldFit,'partial');assert.equal(j.rating,2);assert.equal(j.comments,'First impression');
  for(const patch of [{rating:0},{rating:6},{rating:'3'},{worldFit:'unknown'},{comments:[]},{decision:'accept'}])assert.throws(()=>put(patch));
  assert.throws(()=>R.rate(f.directory,{label,rating:3}),/reset/);
  assert.ok(!JSON.stringify(R.state(f.directory)).includes('compileErrors'));
});
test('ratings, world fit and comments persist; summaries and concealed repeats use the simple model',()=>{
  const f=imported(),s=R.state(f.directory),reviewEpoch=s.reviewEpoch;
  for(const c of s.cards)R.rate(f.directory,{label:c.label,reviewEpoch,rating:4,worldFit:'yes',comments:'Independent'});
  assert.equal(R.state(f.directory).complete,true);const source=R.source(f.directory,s.cards[0].label,'event:old');assert.ok(source.sourceHash);
  R.reveal(f.directory,{reviewEpoch});const done=R.state(f.directory);assert.equal(done.revealed,true);assert.ok(done.cards.every(c=>c.identity));assert.equal(done.report.withinReviewerConsistency.length,1);assert.equal(done.report.withinReviewerConsistency[0].ratingDifference,0);assert.equal(done.report.withinReviewerConsistency[0].sameWorldFit,true);
  assert.equal(done.report.batches.reduce((n,b)=>n+b.events,0),8);assert.ok(done.report.batches.every(b=>b.meanRating===4));
  R.rate(f.directory,{label:s.cards[0].label,reviewEpoch,rating:2,worldFit:'conflicted',comments:'修改后的评语',language:'zh-CN'});
  const j=R.state(f.directory).cards[0].judgment;assert.equal(j.rating,2);assert.equal(j.worldFit,'conflicted');assert.equal(j.comments,'修改后的评语');assert.equal(j.language,'zh-CN');assert.ok(R.markdown(R.state(f.directory)).includes('修改后的评语'));assert.ok(!fs.existsSync(path.join(f.directory,'verdict-history.jsonl')));
});
test('reset deletes every saved batch judgment and legacy history, preserves evidence and fences old tabs',()=>{
  const f=imported(),s=R.state(f.directory),reviewEpoch=s.reviewEpoch,label=s.cards[0].label;
  R.rate(f.directory,{label,reviewEpoch,rating:5,worldFit:'yes',comments:'Delete me'});
  const before=U.hash(fs.readFileSync(path.join(f.directory,'batch-1.json'))),m=R.load(f.directory);m.version=1;m.pairs={old:{notes:'Delete me too'}};m.locked=true;U.writeJSON(path.join(f.directory,'private.json'),m);fs.writeFileSync(path.join(f.directory,'verdict-history.jsonl'),'legacy data');
  fs.writeFileSync(path.join(f.directory,'trace-latest.json'),'trace pointer');
  const other=I.importWorkspaces(root,f.dir,{scan:f.scan,prompt:f.prompt});
  const result=R.reset(f.dir);assert.equal(result.reviews,2);assert.equal(result.removedRecords,2);
  for(const dir of [f.directory,other.directory]){const reset=R.load(dir);assert.equal(reset.version,2);assert.deepEqual(reset.judgments,{});assert.equal(reset.revealed,false);assert.ok(!('pairs' in reset));assert.ok(!('locked' in reset));}
  assert.notEqual(R.load(f.directory).reviewEpoch,reviewEpoch);assert.throws(()=>R.rate(f.directory,{label,reviewEpoch,rating:1}),/reset/);assert.ok(!fs.existsSync(path.join(f.directory,'verdict-history.jsonl')));assert.equal(U.hash(fs.readFileSync(path.join(f.directory,'batch-1.json'))),before);assert.equal(fs.readFileSync(path.join(f.directory,'trace-latest.json'),'utf8'),'trace pointer');
});
test('loopback server enforces origins and serves only review UI, source APIs and game assets',async()=>{
  const f=imported(),server=R.serve(f.directory);await new Promise(resolve=>server.on('listening',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  try{
    assert.equal((await fetch(base+'/')).status,200);assert.equal((await fetch(base+'/src/art.js')).status,200);assert.equal((await fetch(base+'/src/engine.js')).status,200);assert.equal((await fetch(base+'/preview.js')).status,200);
    assert.equal((await fetch(base+'/private.json')).status,404);assert.equal((await fetch(base+'/src/ui.js')).status,404);
    assert.equal((await fetch(base+'/api/state',{headers:{Origin:'https://external.example'}})).status,403);
    assert.equal((await fetch(base+'/api/lock',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,403);
    const r=await fetch(base+'/api/state');const s=await r.json();assert.ok(!s.revealed);assert.equal(s.cards.length,9);
    const saved=await fetch(base+'/api/rating',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({label:s.cards[0].label,reviewEpoch:s.reviewEpoch,rating:5})});assert.equal(saved.status,200);assert.equal((await saved.json()).judgment.rating,5);
    assert.equal((await fetch(base+'/api/initial',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:'{}'})).status,404);
  }finally{await new Promise(resolve=>server.close(resolve));}
});
test('freezes agent zh-CN files and uses game say keys through branches, with explicit missing/stale status',()=>{
  const f=fixture(),name='qmd';
  const content=G.compile([{path:'content/new.grim',text:event(name+'_two')}]).content;
  const fields=I18n.extract(content);let text='@event qmd_two\n';
  for(const field of fields){if(field.key==='opt.right.say.1')continue;const hash=field.key==='opt.left.say.2'?'000000':field.hash;text+=field.key+' ['+hash+'] = '+({'title':'借来的笔记本','text':'莱拉问了一个问题。','opt.left.say.1':'你记得。'}[field.key]||'中文：'+field.text)+'\n';}
  write(f.dir,name+'/locales/zh-CN/new.lang',text);
  write(f.dir,name+'/locales/zh-CN/_in/review.lang','@event qmd_two\ntitle = 收件箱标题\nopt.left.say.1 = \n');
  const scan=W.scan(f.dir).file,result=I.importWorkspaces(root,f.dir,{scan}),en=R.state(result.directory),zh=R.state(result.directory,'zh-CN');
  const card=zh.cards.find(c=>c.def?.title==='收件箱标题');assert.ok(card);assert.equal(card.translation.unfingerprinted,1);assert.equal(card.translation.stale,1);assert.equal(card.translation.missing,1);
  const says=[];G.walkEffects(card.def.options[0].effects,s=>{if(s.t==='say')says.push(s.text);});assert.ok(says.includes('你记得。'));assert.ok(says.includes('You do not remember.'));
  assert.equal(card.def.options[1].effects[0].text,'You leave.');
  assert.equal(en.cards.find(c=>c.label===card.label).def.title,'A submitted scene');
  write(f.dir,name+'/locales/zh-CN/new.lang','@event qmd_two\ntitle = 后来的修改\n');
  assert.equal(R.state(result.directory,'zh-CN').cards.find(c=>c.label===card.label).def.title,'收件箱标题');
  R.rate(result.directory,{label:card.label,reviewEpoch:zh.reviewEpoch,rating:3,worldFit:'partial',comments:'中文评价',language:'zh-CN'});
  const saved=R.state(result.directory).cards.find(c=>c.label===card.label).judgment;assert.equal(saved.language,'zh-CN');assert.equal(saved.localeHash,card.translation.localeHash);assert.equal(saved.translationCoverage.missing,1);
  assert.ok(!JSON.stringify(zh).includes('qmd_two'));assert.equal(R.searchSources(result.directory,card.label,'收件箱标题','submission','zh-CN')[0].key,card.key);
});
module.exports={fixture};

test('review variants use game semantics, synchronize prose and outcomes, preserve tokens and expose nested alternatives',()=>{
  const P=require('../src/review-preview.js');
  const def={text:'{~A {npc}|B|C} {flag(old): known|unknown}',options:[{label:'{&first|second|third}',effects:[{t:'say',text:'{one|two|three} {~outer {&x|y|z}|other|last}'}]}]};
  assert.deepEqual(P.variants(def),{count:3,conditions:['flag(old)']});
  assert.equal(P.vary(def.text,{variant:1,conditions:{'flag(old)':false}}),'B unknown');
  assert.equal(P.vary(def.options[0].label,{variant:1}),'second');
  assert.equal(P.vary(def.options[0].effects[0].text,{variant:0}),'one outer x');
  assert.equal(P.vary('{a|b} {&a|b} {~a|b}',{variant:2}),'b a a');
  assert.equal(P.vary('{npc} {=gold*2} {broken'),'{npc} {=gold*2} {broken');
  assert.equal(P.variants({text:'{gold > 1: a {x|y|z}|b}'}).count,3);
});
test('selected path changes exclude other branch effects and tier amounts use frozen game balance',()=>{
  const P=require('../src/review-preview.js');
  const delta=n=>({t:'delta',name:'gold',tier:'small',sign:n});
  const steps=[{t:'if',branches:[{cond:{src:'flag(old)'},body:[delta(1)]}],else:[{t:'challenge',win:[delta(-1)],lose:[{t:'flag',names:['lost']}]}]}];
  assert.deepEqual(P.selected(steps),[delta(1)]);
  assert.deepEqual(P.selected(steps,{'effects.0':1,'effects.0.1.0':1}),[{t:'flag',names:['lost']}]);
  assert.equal(P.stat(delta(1),{sizes:{gold:[1,11,20,30,50]}}).amount,'+11');
  assert.equal(P.stat(delta(-1)).amount,'-8');
  assert.deepEqual(P.stat({t:'delta',name:'arcana',tier:'medium',sign:1},{skills:{arcana:true},sizes:{xp:[1,3,6,9,12]},names:{arcana:'奥术'}}),{label:'奥术',amount:'+6',tier:'medium',xp:true,type:'delta'});
  assert.equal(P.stat({t:'study',tier:'small',sign:1},{sizes:{study:[1,7,9,10,12]}}).amount,'+7');
  assert.equal(P.stat({t:'delta',name:'mood',min:-3,max:5}).amount,'-3…5');
  assert.equal(P.stat({t:'learn_spell',spell:'reflect'}),null);
});

test('batch trace exports are separate, hashed, redacted and immutable; quality state stays blinded',async()=>{
  const T=require('../src/batch-traces.js'),f=imported(),sessions=path.join(f.dir,'native');fs.mkdirSync(sessions);
  for(const name of ['baseline','grim','qmd','lightrag']){
    const lines=[{type:'user',sessionId:name,cwd:path.join(f.dir,name),timestamp:'2026-10-24T06:00:00Z',message:{content:'The exact shared task.\n'}},{type:'assistant',timestamp:'2026-10-24T06:00:01Z',version:'fixture-version',message:{model:'fixture-model',content:[{type:'thinking',thinking:'DO NOT EXPORT REASONING'},{type:'tool_use',id:name,name:'Bash',input:{command:'node tools/grim.js query event'}}]}},{type:'user',timestamp:'2026-10-24T06:00:02Z',message:{content:[{type:'tool_result',tool_use_id:name,content:'<img src=x onerror=bad()> sk-or-v1-abcdefghijklmnopqrstuv'}]}},{type:'system',subtype:'stop_hook_summary',timestamp:'2026-10-24T06:00:03Z'}];fs.writeFileSync(path.join(sessions,name+'.jsonl'),lines.map(JSON.stringify).join('\n'));
  }
  const out=path.join(f.dir,'trace-export'),result=T.build(f.dir,{review:f.directory,sessions,out}),r=T.read(f.directory);
  assert.equal(r.runs.length,4);assert.ok(r.runs.every(v=>v.summary.originalSites.query===1&&v.traceStatus==='unverifiable'));
  assert.ok(!JSON.stringify(r).includes('DO NOT EXPORT REASONING'));assert.ok(!JSON.stringify(r).includes('sk-or-v1-abcdefghijklmnopqrstuv'));assert.deepEqual(r.runs[0].harnessVersions,['fixture-version']);
  assert.throws(()=>T.build(f.dir,{review:f.directory,sessions,out}),/already exists/);assert.throws(()=>T.build(f.dir,{review:f.directory,claudeProjects:path.join(f.dir,'missing')}),/matching native/);
  assert.ok(!JSON.stringify(R.state(f.directory)).includes('"identity"'));
  const server=R.serve(f.directory);await new Promise(resolve=>server.on('listening',resolve));
  try{const base='http://127.0.0.1:'+server.address().port;const html=await fetch(base+'/traces');assert.equal(html.status,200);assert.equal(html.headers.get('content-type'),'text/html; charset=utf-8');assert.equal((await fetch(base+'/trace-client.js')).status,200);assert.equal((await(await fetch(base+'/api/traces')).json()).runs.length,4);assert.equal((await fetch(base+'/traces.json')).headers.get('content-disposition'),'attachment; filename="author-tool-traces.json"');assert.ok((await(await fetch(base+'/traces.md')).text()).includes('Author tool traces'));}
  finally{await new Promise(resolve=>server.close(resolve));}
  fs.appendFileSync(path.join(result.directory,'report.json'),' ');assert.equal(T.read(f.directory).runs.length,4,'insignificant JSON whitespace is not a semantic change');
  const tamper=U.readJSON(path.join(result.directory,'report.json'));tamper.at='tampered';U.writeJSON(path.join(result.directory,'report.json'),tamper);assert.throws(()=>T.read(f.directory),/report changed/);
});
