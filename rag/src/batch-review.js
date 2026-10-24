'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const U = require('./util.js');
const C = require('./catalog.js');
const L = require('./review-localization.js');

const WORLD_FIT=['yes','partial','conflicted'];
function load(dir) {
  const m=U.readJSON(path.join(dir,'private.json'));
  if(m.kind!=='workspace-batch-review'||m.version!==2||!m.reviewEpoch)throw new Error('Not a workspace batch review');
  return m;
}
function artifact(dir,batch) {
  const a=U.readJSON(U.inside(dir,batch.file));
  if(U.hash(a.sources)!==batch.artifactHash||U.hash(a)!==batch.fileHash)throw new Error('Frozen review artifact changed');
  return a;
}
const escaped=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function mask(value,batch,reverse=false) {
  let json=JSON.stringify(value);
  if(json===undefined)return null;
  const replacements=Object.entries({...batch.paths,...batch.ids});
  for(const [from,to] of replacements.sort((a,b)=>b[0].length-a[0].length)) {
    const a=reverse?to:from,b=reverse?from:to;
    json=json.replace(new RegExp('(?<![A-Za-z0-9_])'+escaped(a)+'(?![A-Za-z0-9_])','g'),()=>b);
  }
  return JSON.parse(json);
}
function context(dir,m,label) {
  const p=m.mapping[label];if(!p)throw new Error('Unknown review presentation');
  const batch=m.batches.find(b=>b.id===p.batch),a=artifact(dir,batch),card=a.cards.find(c=>c.key===p.key);
  if(!card)throw new Error('Frozen presentation is missing');
  return {batch,a,card};
}
function related(a,key) {
  const changed=new Set(a.cards.map(c=>c.key)), reached=new Set([key]);
  const edges=(a.catalog?.edges||[]).filter(e=>e.relation.startsWith('queue')&&changed.has(e.from)&&changed.has(e.to));
  let size;
  do {size=reached.size;for(const e of edges)if(reached.has(e.from)||reached.has(e.to)){reached.add(e.from);reached.add(e.to);}}while(reached.size!==size);
  return {cards:a.cards.filter(c=>reached.has(c.key)&&c.key!==key),edges:edges.filter(e=>reached.has(e.from)&&reached.has(e.to))};
}
function cardView(a,card,base,language='en') {
  const localized=L.localize(card.compiledDef||card.block?.def,a,language),def=localized.def;
  const actor=def?.actor&&def.actor!=='npc'?def.actor:def?.cast?.find(c=>c.role==='npc')?.npc;
  const npc=L.localize(base.blocks.find(b=>b.key==='npc:'+actor)?.def,a,language).def;
  const place=L.localize(base.blocks.find(b=>b.key==='place:'+def?.place)?.def,a,language).def;
  const linked=related(a,card.key);
  const sources=a.catalog?.records.some(r=>r.key===card.key)?C.neighbors(a.catalog,card.key,40):{edges:[],omitted:0};
  // Use frozen submission sizes, including any captured balance edits.
  const mechanics={sizes:a.blocks.find(b=>b.def.block==='balance')?.def.sizes||{},skills:{},names:{}};
  for(const b of a.blocks.filter(b=>['resource','skill'].includes(b.def.block))){
    if(b.def.block==='skill')mechanics.skills[b.def.id]=true;
    mechanics.names[b.def.id]=L.localize(b.def,a,language).def?.name||b.def.id;
  }
  return {key:card.key,change:card.change,source:card.block?.text||card.raw||card.before?.text||'',before:card.before?.text||null,
    authoredDef:card.block?.def||null,mechanics,
    sourceHash:card.block?.sourceHash||card.before?.hash||null,def:def||null,translation:localized.translation,npc:npc?{id:npc.id,name:npc.name,look:npc.look,color:npc.color}:null,
    place:place?.name||def?.place||'Unspecified place',dependencies:sources,
    linked:linked.cards.map(c=>{const l=L.localize(c.compiledDef||c.block?.def,a,language);return {key:c.key,def:l.def,authoredDef:c.block?.def||null,mechanics,translation:l.translation,source:c.block?.text||c.raw||c.before?.text||''};}),queueEdges:linked.edges};
}
function audit(a,batch,locked) {
  const files=a.changes.files,drift=files.filter(f=>!['authored-content','generated-bundle'].includes(f.category)&&!f.file.startsWith('build/'));
  const balance=files.find(f=>f.file==='build/balance-report.json');let reportedBalance=null;
  if(balance?.text)try {reportedBalance=JSON.parse(balance.text);}catch { /* Raw bytes remain in the immutable scan. */ }
  return {compileErrors:a.compileErrors,parseErrors:a.parseErrors.map(e=>({file:e.file,message:e.message})),
    supportChanges:a.changes.blocks.filter(b=>!b.key.startsWith('event:')),sourceChangeCount:files.filter(f=>f.category==='authored-content').length,
    generatedBundleChanges:files.filter(f=>f.category==='generated-bundle').length,driftCount:drift.length,
    runtimeChanges:a.changes.runtimeChanges.map(r=>locked?r:{category:r.category,change:r.before&&r.after?'modified':r.before?'deleted':'added'}),
    drift:locked?drift:undefined,reportedBalance,validationScope:'Parser/compiler checks on this frozen copy. Balance reports are captured author outputs, not independently rerun here.',
    trace:batch.trace,receiptEntries:batch.receiptEntries,receiptIncompleteLines:batch.receiptIncompleteLines};
}
function completed(j){return Number.isInteger(j?.rating)&&WORLD_FIT.includes(j?.worldFit);}
function state(dir,language='en') {
  if(!['en','zh-CN'].includes(language))throw new Error('Unsupported review language');
  const m=load(dir),base=U.readJSON(path.join(dir,'base.json')),cache=new Map(m.batches.map(b=>[b.id,artifact(dir,b)]));
  const complete=Object.keys(m.mapping).every(label=>completed(m.judgments[label]));
  const cards=Object.entries(m.mapping).map(([label,p])=>{
    const batch=m.batches.find(b=>b.id===p.batch),a=cache.get(p.batch),card=a.cards.find(c=>c.key===p.key);
    const value={label,batch:batch.label,...cardView(a,card,base,language),judgment:m.judgments[label]||{rating:null,worldFit:null,comments:''}};
    if(complete)value.audit=audit(a,batch,m.revealed);
    if(m.revealed)value.identity={project:batch.project,backend:batch.backend,artifactHash:batch.artifactHash};
    return m.revealed?value:mask(value,batch);
  });
  return {kind:m.kind,version:m.version,ordering:'theme-place-chain-v1',reviewEpoch:m.reviewEpoch,language,languages:['en','zh-CN'],provisional:m.provisional,at:m.at,scanAt:m.scanAt,snapshotHash:m.snapshotHash,prompt:m.prompt,promptHash:m.promptHash,
    promptProvenance:m.promptProvenance,revealed:m.revealed,complete,cards:require('./review-order.js').arrange(m,cache,cards),
    rules:base.rules.map(r=>({file:r.file,sourceHash:r.sourceHash})),report:m.revealed?report(m):null};
}
function report(m) {
  const primary=new Map();for(const [label,p] of Object.entries(m.mapping)){const key=p.batch+'/'+p.key;if(!primary.has(key))primary.set(key,label);}
  const batches=m.batches.map(b=>{
    const labels=[...primary].filter(([key])=>key.startsWith(b.id+'/')).map(([,label])=>label),ratings=labels.map(l=>m.judgments[l]?.rating).filter(Number.isInteger);
    return {batch:b.label,project:b.project,events:labels.length,reviewed:labels.filter(l=>completed(m.judgments[l])).length,
      meanRating:ratings.length?ratings.reduce((a,b)=>a+b,0)/ratings.length:null,
      worldFit:Object.fromEntries(WORLD_FIT.map(v=>[v,labels.filter(l=>m.judgments[l]?.worldFit===v).length])),trace:b.trace};
  });
  const seen=new Map(),repeats=[];
  for(const [label,p] of Object.entries(m.mapping)){const key=p.batch+'/'+p.key,prior=seen.get(key);if(prior){const a=m.judgments[prior],b=m.judgments[label];repeats.push({labels:[prior,label],reviewLanguages:[a?.language,b?.language],sameLanguage:a?.language===b?.language,ratingDifference:Number.isInteger(a?.rating)&&Number.isInteger(b?.rating)?Math.abs(a.rating-b.rating):null,sameWorldFit:a?.worldFit!=null&&a.worldFit===b?.worldFit});}else seen.set(key,label);}
  return {batches,withinReviewerConsistency:repeats,note:'Four exploratory batches; cards and concealed repeat presentations are not independent authoring trials. No adoption decision is made by this tool.'};
}
function rate(dir,data) {
  const m=load(dir);if(data.reviewEpoch!==m.reviewEpoch)throw new Error('This review was reset. Reload the page.');
  const {a,card}=context(dir,m,data.label),language=data.language||'en';
  if(!['en','zh-CN'].includes(language))throw new Error('Unsupported review language');
  if(Object.keys(data).some(k=>!['label','reviewEpoch','language','rating','worldFit','comments'].includes(k)))throw new Error('Unsupported review field');
  const j={rating:null,worldFit:null,comments:'',...m.judgments[data.label]};
  if('rating' in data){if(data.rating!==null&&(!Number.isInteger(data.rating)||data.rating<1||data.rating>5))throw new Error('Rating must be 1–5');j.rating=data.rating;}
  if('worldFit' in data){if(data.worldFit!==null&&!WORLD_FIT.includes(data.worldFit))throw new Error('World fit must be yes, partial or conflicted');j.worldFit=data.worldFit;}
  if('comments' in data){if(typeof data.comments!=='string'||data.comments.length>10000)throw new Error('Comments must be text, at most 10,000 characters');j.comments=data.comments;}
  const tr=language==='zh-CN'?L.localize(card.compiledDef||card.block?.def,a,language).translation:null;
  Object.assign(j,{language,localeHash:tr?a.localeHash:null,translationCoverage:tr?Object.fromEntries(['total','translated','missing','stale','unfingerprinted'].map(k=>[k,tr[k]])):null,updatedAt:new Date().toISOString()});
  m.judgments[data.label]=j;U.writeJSON(path.join(dir,'private.json'),m);return {saved:true,judgment:j};
}
function reveal(dir,data) {
  const m=load(dir);if(data.reviewEpoch!==m.reviewEpoch)throw new Error('This review was reset. Reload the page.');
  if(!Object.keys(m.mapping).every(l=>completed(m.judgments[l])))throw new Error('Rate every card and choose its world fit first');
  m.revealed=true;U.writeJSON(path.join(dir,'private.json'),m);return {revealed:true};
}
function reset(experiment) {
  const root=path.join(path.resolve(experiment),'_operator/reviews');
  const reviews=fs.readdirSync(root,{withFileTypes:true}).filter(e=>e.isDirectory()).map(e=>path.join(root,e.name)).filter(dir=>fs.existsSync(path.join(dir,'private.json'))).map(dir=>({dir,m:U.readJSON(path.join(dir,'private.json'))}));
  if(reviews.some(({m})=>m.kind!=='workspace-batch-review'))throw new Error('Unexpected review format; nothing was reset');
  const records=reviews.reduce((n,{m})=>n+Object.keys(m.judgments||{}).length+Object.keys(m.pairs||{}).length,0);
  for(const {dir,m} of reviews){
    Object.assign(m,{version:2,reviewEpoch:require('crypto').randomUUID(),judgments:{},revealed:false});
    for(const key of ['pairs','pairings','locked','adoption'])delete m[key];
    U.writeJSON(path.join(dir,'private.json'),m);
    fs.rmSync(path.join(dir,'verdict-history.jsonl'),{force:true});
  }
  return {reviews:reviews.length,removedRecords:records,note:'Review judgments and old verdict history cleared. Source artifacts and trace evidence retained.'};
}
function source(dir,label,key,scope='starting',language='en') {
  const m=load(dir),{batch,a}=context(dir,m,label),base=U.readJSON(path.join(dir,'base.json'));
  if(!['starting','submission'].includes(scope))throw new Error('Unknown evidence scope');
  const real=mask(String(key),batch,true),data=scope==='starting'?base:a;
  const found=data.blocks.filter(b=>b.key===real||b.def.id===real);
  if(found.length!==1)throw new Error('Source not found or ambiguous in this frozen snapshot; use kind:id');
  const r=found[0],record=data.catalog?.records.find(c=>c.key===r.key);
  const out={key:r.key,file:r.file,line:r.line,text:r.text,sourceHash:r.sourceHash,scope,
    authority:r.def.block==='event'?'conditional-event':scope==='starting'?'starting-worldbook':'authored-support',metadata:record?.metadata||{}};
  if(language==='zh-CN')out.translation=L.localize(r.def,data,language).translation;
  return m.revealed?out:mask(out,batch);
}
function searchSources(dir,label,query,scope='starting',language='en') {
  const m=load(dir),{batch,a}=context(dir,m,label);
  if(!['starting','submission'].includes(scope))throw new Error('Unknown evidence scope');
  const data=scope==='submission'?a:U.readJSON(path.join(dir,'base.json')),words=C.words(query);
  if(!words.length)return [];
  const ranked=data.blocks.map(b=>{const localized=language==='zh-CN'?L.localize(b.def,data,language):null;const title=localized?.def?.title||localized?.def?.name||b.def.title||b.def.name||b.def.id,text=b.text+' '+(localized?.translation?.fields.map(f=>f.text).join(' ')||'');return {b,title,score:words.reduce((n,w)=>n+(C.words(b.key+' '+title).includes(w)?5:0)+(text.toLowerCase().includes(w)?1:0),0)};}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,20);
  return ranked.map(({b,title})=>{const v={key:b.key,title,scope};return m.revealed?v:mask(v,batch);});
}
function markdown(s) {
  return '# Authoring batch review\n\n'+(s.provisional?'Provisional frozen import.':'Operator-declared final import.')+'\n\nTask:\n\n'+(s.prompt||'Unrecorded')+'\n\n'+s.cards.map(c=>'## '+c.label+' · '+c.batch+'\n\n```grim\n'+c.source+'\n```\n\n```json\n'+JSON.stringify({judgment:c.judgment,identity:c.identity},null,2)+'\n```').join('\n\n')+(s.report?'\n\n## Report\n\n```json\n'+JSON.stringify(s.report,null,2)+'\n```\n':'');
}
function serve(dir,port=0,root=path.resolve(__dirname,'../..')) {
  const manifest=load(dir); // Fail before binding on corrupt frozen evidence.
  if(U.hash(U.readJSON(path.join(dir,'base.json')))!==manifest.baseFileHash)throw new Error('Starting review evidence changed');
  for(const batch of manifest.batches)artifact(dir,batch);
  const assets={'/':'batch-review.html','/traces':'batch-traces.html','/trace-client.js':'batch-traces-client.js','/client.js':'batch-review-client.js','/preview.js':'review-preview.js','/i18n.js':'batch-review-i18n.js','/review.css':'batch-review.css'};
  const server=http.createServer(async(req,res)=>{
    const host=req.headers.host,origin=req.headers.origin;
    const reply=(value,status=200)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));};
    if(!/^127\.0\.0\.1:\d+$/.test(host||'')||origin&&origin!=='http://'+host)return reply({error:'Loopback origin required'},403);
    try{
      const url=new URL(req.url,'http://'+host);
      if(req.method==='GET'){
        let file,mime;
        if(assets[url.pathname]){file=path.join(__dirname,assets[url.pathname]);mime=assets[url.pathname].endsWith('.html')?'text/html; charset=utf-8':url.pathname.endsWith('.css')?'text/css':'text/javascript';}
        else if(['/src/style.css','/src/art.js','/src/grimoire.js','/src/director.js','/src/engine.js'].includes(url.pathname)){file=path.join(root,url.pathname.slice(1));mime=url.pathname.endsWith('.css')?'text/css':'text/javascript';}
        else if(/^\/src\/portraits\/minimal\/[a-z_]+\.png$/.test(url.pathname)){file=U.inside(root,url.pathname.slice(1));mime='image/png';}
        if(file){res.writeHead(200,{'Content-Type':mime,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});res.end(fs.readFileSync(file));return;}
        const language=url.searchParams.get('lang')||'en';
        // Separate operator view: backend identities never enter the blinded quality state.
        if(url.pathname==='/api/traces')return reply(require('./batch-traces.js').read(dir));
        if(url.pathname==='/traces.json'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store','Content-Disposition':'attachment; filename="author-tool-traces.json"'});return res.end(JSON.stringify(require('./batch-traces.js').read(dir),null,2));}
        if(url.pathname==='/traces.md'){res.writeHead(200,{'Content-Type':'text/markdown; charset=utf-8','Cache-Control':'no-store'});return res.end(require('./batch-traces.js').markdown(require('./batch-traces.js').read(dir)));}
        if(url.pathname==='/api/state')return reply(state(dir,language));
        if(url.pathname==='/api/source')return reply(source(dir,url.searchParams.get('label'),url.searchParams.get('key'),url.searchParams.get('scope')||'starting',language));
        if(url.pathname==='/api/sources')return reply(searchSources(dir,url.searchParams.get('label'),url.searchParams.get('q'),url.searchParams.get('scope')||'starting',language));
        if(url.pathname==='/api/rule'){
          const rule=U.readJSON(path.join(dir,'base.json')).rules.find(r=>r.file===url.searchParams.get('file'));
          if(!rule)throw new Error('Unknown frozen rule');return reply(rule);
        }
        if(url.pathname==='/export.json')return reply(state(dir,language));
        if(url.pathname==='/export.md'){res.writeHead(200,{'Content-Type':'text/markdown; charset=utf-8','Cache-Control':'no-store'});res.end(markdown(state(dir,language)));return;}
      }
      if(req.method!=='POST')return reply({error:'Not found'},404);
      if(origin!=='http://'+host||req.headers['content-type']?.split(';')[0]!=='application/json')return reply({error:'Same-origin JSON POST required'},403);
      let body='';for await(const chunk of req){body+=chunk;if(body.length>1024*1024)throw new Error('Request too large');}
      const data=JSON.parse(body);
      if(url.pathname==='/api/rating')return reply(rate(dir,data));
      if(url.pathname==='/api/reveal')return reply(reveal(dir,data));
      reply({error:'Not found'},404);
    }catch(error){reply({error:error.message},400);}
  });
  server.listen(port,'127.0.0.1');return server;
}
module.exports={load,artifact,mask,state,rate,reveal,reset,completed,source,searchSources,report,markdown,serve,WORLD_FIT};
