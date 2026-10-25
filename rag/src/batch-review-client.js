'use strict';
let data,current,tab='Assess',lastSource=null,controlId=0;
let language=new URL(location.href).searchParams.get('lang')||localStorage.getItem('lumenhold-review-language')||'en';
if(!['en','zh-CN'].includes(language))language='en';
const t=text=>ReviewText(text,language);
const $=s=>document.querySelector(s);
function rawEl(tag,text,parent,cls){const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;if(parent)parent.append(n);return n;}
function el(tag,text,parent,cls){return rawEl(tag,text==null?text:tag==='pre'?text:t(text),parent,cls);}
function message(text){$('#status').textContent=t(text);}
function fail(e){$('#error').textContent=t(e.message);}
async function api(url,body){const target=new URL(url,location.origin);target.searchParams.set('lang',language);const r=await fetch(target.pathname+target.search,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},keepalive:true,body:JSON.stringify({language,...body})});const v=await r.json();if(!r.ok)throw new Error(v.error||'Request failed');return v;}
function btn(parent,text,fn,disabled=false,cls='btn ghost'){const b=el('button',text,parent,cls);b.type='button';b.disabled=disabled;b.onclick=()=>{ $('#error').textContent='';message('');Promise.resolve().then(fn).catch(fail);};return b;}
function details(parent,title,literal=false){const d=el('details',null,parent);(literal?rawEl:el)('summary',title,d);return d;}
function section(parent,title){const s=el('section',null,parent,'panel-section');el('h2',title,s);return s;}
function input(parent,title,area=false,value=''){const box=el('div',null,parent),l=el('label',title,box),n=el(area?'textarea':'input',null,box);n.id='control-'+(++controlId);l.htmlFor=n.id;n.value=value;return n;}
function select(parent,title,choices,value=''){const box=el('div',null,parent),l=el('label',title,box),s=el('select',null,box);s.id='control-'+(++controlId);l.htmlFor=s.id;for(const choice of choices){const [v,t]=Array.isArray(choice)?choice:[choice,choice];const o=el('option',t,s);o.value=v;}s.value=value;return s;}
function pretty(v){return JSON.stringify(v,null,2);}
const previewSelections=new Map();
function effectLabel(effect,card){const s=effect,stat=ReviewPreview.stat(s,card.mechanics);if(stat)return stat.label+' '+stat.amount+(stat.xp?' XP':'')+(stat.tier?' · '+stat.tier:'');switch(s.t){
  case 'preset':return s.name+' '+(s.args||[]).join(' ');
  case 'queue':return 'Queue '+(s.event||(s.pool?'pool:'+s.pool:'tag:'+s.tagged))+(s.now?' now':s.delay?' in '+s.delay.src:s.window?' within '+s.window.from+'…'+s.window.to:'')+(s.byMonth?' by month '+s.byMonth.src:'')+(s.with?' with '+s.with:'')+(s.chanceWord?' · '+s.chanceWord:s.chance!=null?' · chance '+s.chance:'');
  case 'flag':case 'unflag':return t(s.t)+' '+(s.names||[]).join(' ');
  default:return Object.entries(s).filter(([k])=>!['t','line','body','else','block','legacy'].includes(k)).map(([k,v])=>k+': '+(v&&typeof v==='object'?v.src||JSON.stringify(v):v)).reduce((out,part)=>out+' · '+part,t(s.t));
}}
function effectTitle(s){return s.t==='if'?'Conditional branch':s.t==='challenge'?'Challenge '+s.kind+' · '+s.tier:s.t==='check'?'Check '+s.skill+' / '+s.dc.src:s.t==='chance'?'Chance '+(s.word||s.p?.src||'')+(s.steps?.length?' · '+s.steps.map(v=>pretty(v)).join(', '):''):s.t;}
function effects(parent,steps,card,state,redraw,prefix,all=false){for(const [i,s] of (steps||[]).entries()){
  const key=prefix+'.'+i,branches=ReviewPreview.branches(s);
  if(s.t==='say'){if(s.who)rawEl('div',s.who,parent,'branch-title');rawEl('p',ReviewPreview.vary(s.text,state),parent,'say');}
  else if(branches.length){
    const box=el('div',null,parent,'branch');el('div',effectTitle(s),box,'branch-title');
    const n=state.branches[key]||0;
    if(!all){const pick=select(box,'Preview outcome',branches.map((b,j)=>[String(j),t(b.label)]),String(n));pick.dataset.branch=key;pick.onchange=()=>{state.branches[key]=Number(pick.value);redraw();};}
    for(const [j,b] of branches.entries())if(all||j===n){if(all)el('div',b.label,box,'branch-title');effects(box,b.body,card,state,redraw,key+'.'+j,all);}
  }else el('span',effectLabel(s,card),parent,'chip effect');
}}
function attributes(parent,card){
  const box=details(parent,'All event attributes');box.className='event-attributes';box.open=true;
  const d=card.def;
  function table(target,values){const table=el('table',null,target);for(const [key,value] of Object.entries(values)){if(value===undefined)continue;const tr=el('tr',null,table);rawEl('th',key,tr);rawEl('td',typeof value==='object'?value?.src||pretty(value):String(value),tr);}}
  el('p','Compiled attributes include defaults and expanded presets. Original properties and every effect remain available below.',box,'muted');
  const omitted=new Set(['text','title','scene','options','on_show']);table(box,Object.fromEntries(Object.entries(d).filter(([k])=>!omitted.has(k))));
  for(const option of d.options||[]){el('h4',option.key.toUpperCase(),box);table(box,Object.fromEntries(Object.entries(option).filter(([k])=>!['label','effects'].includes(k))));el('pre',pretty(option.effects),details(box,'All effects · '+option.key));}
  if(d.on_show?.length)el('pre',pretty(d.on_show),details(box,'All effects · on_show'));
  const operations=[];Grimoire.walkEffects(d.on_show||[],s=>{if(['flag','unflag','queue','unqueue'].includes(s.t))operations.push(s);});for(const o of d.options||[])Grimoire.walkEffects(o.effects||[],s=>{if(['flag','unflag','queue','unqueue'].includes(s.t))operations.push({option:o.key,...s});});
  if(operations.length){const flags=details(box,'Flags and queues · all branches');flags.open=true;el('pre',pretty(operations),flags);}
  el('pre',pretty(card.authoredDef),details(box,'All original parsed properties'));
}
function preview(parent,card,linked=true){
  const story=el('div',null,parent,'story-panel'),stateKey=(card.label||card.batch||'')+':'+card.key;
  if(!previewSelections.has(stateKey))previewSelections.set(stateKey,{variant:0,conditions:{},branches:{},option:card.def?.options?.[0]?.key});
  const state=previewSelections.get(stateKey);
  function render(){
    story.replaceChildren();const id=el('div',null,story,'presentation-id');el('span',card.label||card.key,id);if(card.batch)el('span',card.batch,id,'muted');
    const d=card.def;
    if(card.translation){const tr=card.translation,warn=el('div',null,story,'translation-warning');rawEl('div',language==='zh-CN'?'简体中文译文：'+tr.translated+' / '+tr.total+' 个字段；缺失 '+tr.missing+'，过期 '+tr.stale+'，未标注指纹 '+tr.unfingerprinted+'。':'Translation: '+tr.translated+'/'+tr.total+' fields.',warn);if(tr.missing||tr.stale)rawEl('div',language==='zh-CN'?'缺失或过期字段明确保留英文。此处不会自动生成译文。':'Missing or stale fields retain English; no translation is generated.',warn);el('pre',pretty(tr.fields),details(warn,'Translation field status'));}
    if(d){
      const meta=ReviewPreview.variants(d),controls=el('div',null,story,'preview-controls');
      if(meta.count>1){const variants=el('div',null,controls,'variant-controls');btn(variants,'Previous text',()=>{state.variant=(state.variant+meta.count-1)%meta.count;render();});const pick=select(variants,'Text alternative',Array.from({length:meta.count},(_,n)=>[String(n),String(n+1)+' / '+meta.count]),String(state.variant));pick.dataset.field='text-alternative';pick.onchange=()=>{state.variant=Number(pick.value);render();};btn(variants,'Next text',()=>{state.variant=(state.variant+1)%meta.count;render();});}
      if(meta.conditions.length){const conditions=details(controls,'Inline text conditions');for(const c of meta.conditions){const pick=select(conditions,c,[['true','True'],['false','False']],state.conditions[c]===false?'false':'true');pick.onchange=()=>{state.conditions[c]=pick.value==='true';render();};}}
      el('p','Selections are inspection controls, not player state. Numbers are nominal authored changes; caps, skill conversion and implicit mechanical effects depend on the game state.',controls,'muted');
      const deck=el('div',null,story,'deck'),node=el('div',null,deck,'card'),art=el('div',null,node,'card-art');
      const tags=(d.tags||[]).filter(t=>typeof t==='string'&&Array.isArray(Art.paletteFor([t])));
      art.innerHTML=Art.scene(Art.has(d.art)?d.art:'book',tags,d.id);el('div',card.place||d.place||'Lumenhold Academy',art,'tagline');
      const body=el('div',null,node,'card-body');rawEl('h2',ReviewPreview.vary(d.title||d.id,state),body);if(d.scene)rawEl('p',ReviewPreview.vary(d.scene,state),body,'scene-note');rawEl('p',ReviewPreview.vary(d.text,state),body,'text');
      if(card.npc){const row=el('div',null,body,'actor-row'),av=el('div',null,row);av.innerHTML=Art.avatar({...card.npc,color:/^#[0-9a-f]{3,8}$/i.test(card.npc.color)?card.npc.color:'#556'},42);const who=el('div',null,row,'who');rawEl('b',card.npc.name,who);el('span','Existing character',who);}
      const chips=el('div',null,body,'chips');for(const [k,v] of Object.entries({class:d.class,canon:d.canon,trigger:d.trigger,track:d.track}))if(v)el('span',k+': '+v,chips,'chip note');
      for(const k of ['when','defer','followed'])if(d[k])el('div',k+': '+d[k].src,body,'condition');
      const choices=el('div',null,story,'choices');
      for(const option of d.options||[]){const button=btn(choices,'',()=>{state.option=option.key;render();},false,'choice '+option.key+(state.option===option.key?' selected':''));button.dataset.choice=option.key;button.setAttribute('aria-pressed',String(state.option===option.key));rawEl('strong',option.key.toUpperCase()+' · '+ReviewPreview.vary(option.label,state),button);
        const summary=el('span',null,button,'choice-effects');const steps=ReviewPreview.selected(option.effects,state.branches,'option.'+option.key).filter(s=>s.t!=='say');if(!steps.length)el('span','No explicit effect on this path',summary);for(const s of steps)rawEl('span',effectLabel(s,card),summary,'effect');
      }
      if(d.on_show?.length){const box=el('div',null,story,'option-outcome');el('h4','On show',box);effects(box,d.on_show,card,state,render,'on_show');}
      const option=d.options?.find(o=>o.key===state.option);
      if(option){const box=el('section',null,story,'option-outcome');box.dataset.option=option.key;rawEl('h4',option.key.toUpperCase()+' · '+ReviewPreview.vary(option.label,state),box);for(const k of ['when','hint','locked'])if(option[k])rawEl('p',k+': '+(option[k].src||ReviewPreview.vary(option[k],state)),box,'muted');effects(box,option.effects,card,state,render,'option.'+option.key);}
      const all=details(story,'Inspect all outcome branches');el('p','All branches are static references, not proof of reachability.',all,'muted');if(d.on_show?.length){el('h4','On show',all);effects(all,d.on_show,card,state,render,'on_show',true);}for(const o of d.options||[]){rawEl('h4',o.key.toUpperCase()+' · '+ReviewPreview.vary(o.label,state),all);effects(all,o.effects,card,state,render,'option.'+o.key,true);}
      attributes(story,card);
    }else el('p','No current parseable event. Inspect the preserved source and earlier block below.',story,'muted');
    const raw=details(story,'Complete original block · '+card.key);el('pre',card.source,raw);
    if(card.before){const before=details(story,'Starting version of the changed/deleted block');el('pre',card.before,before);}
    if(linked&&card.linked?.length){const box=details(story,'Linked new scenes ('+card.linked.length+') · static queues');el('p','These links describe source references, not a proof that every branch reaches the next card.',box,'muted');for(const linked of card.linked){const target=data.cards.find(c=>c.key===linked.key&&c.batch===card.batch);if(target)btn(box,'Open '+target.label+' · '+(linked.def?.title||linked.key),()=>show(target.label));const entry=details(box,linked.def?.title||linked.key);preview(entry,{...linked,batch:card.batch,place:linked.def?.place},false);}el('pre',pretty(card.queueEdges),details(box,'Queue conditions and delays'));}
  }
  render();return story;
}
const versions=new Map(),queuedVersions=new Map(),commentTimers=new Map(),failedSaves=new Set();
let saveQueue=Promise.resolve(),pendingSaves=0;
function completed(card){return Number.isInteger(card.judgment?.rating)&&['yes','partial','conflicted'].includes(card.judgment?.worldFit);}
function draftKey(label){return 'lumenhold-batch-rating:'+data.reviewEpoch+':'+label;}
function remember(card){const j=card.judgment;try{localStorage.setItem(draftKey(card.label),JSON.stringify({rating:j.rating??null,worldFit:j.worldFit??null,comments:j.comments||'',language:j.language||language}));}catch{ /* Server autosave remains available. */ }}
function edit(card,patch,immediate=true){
  Object.assign(card.judgment,patch,{language});versions.set(card.label,(versions.get(card.label)||0)+1);remember(card);message('Saving automatically…');renderProgress();renderNav();
  clearTimeout(commentTimers.get(card.label));commentTimers.delete(card.label);
  if(immediate)queueSave(card);else commentTimers.set(card.label,setTimeout(()=>{commentTimers.delete(card.label);queueSave(card);},300));
}
function queueSave(card){
  const version=versions.get(card.label)||0;if((queuedVersions.get(card.label)??-1)>=version)return;
  queuedVersions.set(card.label,version);
  const j=card.judgment,payload={label:card.label,reviewEpoch:data.reviewEpoch,rating:j.rating??null,worldFit:j.worldFit??null,comments:j.comments||'',language:j.language||language};
  pendingSaves++;message('Saving automatically…');
  saveQueue=saveQueue.then(async()=>{
    let last;for(let attempt=0;attempt<3;attempt++){
      try{const result=await api('/api/rating',payload);failedSaves.delete(card.label);if(versions.get(card.label)===version){Object.assign(card.judgment,result.judgment);localStorage.removeItem(draftKey(card.label));}return;}
      catch(error){last=error;if(attempt<2)await new Promise(resolve=>setTimeout(resolve,250*(attempt+1)));}
    }
    throw last;
  }).catch(error=>{failedSaves.add(card.label);queuedVersions.delete(card.label);fail(error);}).finally(()=>{
    pendingSaves--;if(failedSaves.size)message('Autosave failed. Changes remain in this browser.');else if(pendingSaves===0&&commentTimers.size===0)message('Saved automatically.');
  });
}
function flushComments(){for(const [label,timer] of commentTimers){clearTimeout(timer);commentTimers.delete(label);const card=data.cards.find(c=>c.label===label);if(card)queueSave(card);}}
async function flushAll(){flushComments();await saveQueue;if(failedSaves.size)throw new Error('Autosave failed. Changes remain in this browser.');}
function choose(parent,title,items,value,onChange,cls){
  const field=el('fieldset',null,parent),legend=el('legend',title,field),row=el('div',null,field,'decisions '+cls);const buttons=[];
  for(const [v,text] of items){const b=btn(row,text,()=>{for(const other of buttons){const on=other.dataset.value===String(v);other.classList.toggle('selected',on);other.setAttribute('aria-pressed',String(on));}onChange(v);});b.dataset.value=v;const on=String(value)===String(v);b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));buttons.push(b);}
  return {field,legend};
}
function assessment(parent,card){
  const box=section(parent,'Card review'),j=card.judgment;
  el('p',card.reviewGroup?.title||'Other events',box,'muted');
  if(card.reviewChain){const chain=card.reviewChain;el('p','Story chain '+chain.number+' · '+chain.position+' / '+chain.length,box,'chain-position');if(chain.sourceOrderFallback)el('p','Cyclic static references; source order resolves ties.',box,'muted');}
  choose(box,'Rating',[1,2,3,4,5].map(n=>[n,String(n)]),j.rating,v=>edit(card,{rating:v}), 'rating-choices');
  el('p','1 · poor — 5 · excellent',box,'muted');
  choose(box,'Fits the world setting?',[['yes','Yes'],['partial','Partial'],['conflicted','Conflicted']],j.worldFit,v=>edit(card,{worldFit:v}),'world-fit-choices');
  const comments=input(box,'Comments (optional)',true,j.comments||'');comments.dataset.field='comments';comments.maxLength=10000;
  comments.oninput=()=>edit(card,{comments:comments.value},false);comments.onblur=()=>{if(commentTimers.has(card.label)){clearTimeout(commentTimers.get(card.label));commentTimers.delete(card.label);queueSave(card);}};
  el('p','Selections save immediately. Comments save while you type.',box,'muted');
  const nav=el('div',null,box,'actions'),i=data.cards.findIndex(c=>c.label===card.label);
  btn(nav,'Previous card',()=>show(data.cards[i-1].label),i===0);btn(nav,'Next card',()=>show(data.cards[i+1].label),i===data.cards.length-1,'btn primary');
  if(card.identity)el('p',card.identity.project+' · '+card.identity.backend,box,'muted');
}
async function lookup(card,key,scope='starting'){
  lastSource=await api('/api/source?label='+encodeURIComponent(card.label)+'&key='+encodeURIComponent(key)+'&scope='+scope);
  tab='Evidence';renderPanel(card);renderSource(card,lastSource);
}
function renderSource(card,s){const out=$('#source-result');out.replaceChildren();el('h3',s.key,out);el('p',s.scope+' · '+s.authority+' · '+s.file+':'+s.line,out,'muted');el('div','Original source SHA-256: '+s.sourceHash,out,'evidence-hash');if(s.translation){for(const field of s.translation.fields){rawEl('p',field.key+' · '+field.status,out,'muted');rawEl('p',field.text,out);}el('pre',pretty(s.translation),details(out,'Translation field status'));}el('pre',s.text,out);el('pre',pretty(s.metadata),details(out,'Fact tiers / conditions / metadata'));}

function evidence(parent,card){
  const box=section(parent,'Frozen source evidence'),scope=select(box,'Snapshot',[['starting','Starting corpus · common to every author'],['submission','This frozen submission · includes authored changes']],'starting');
  const q=input(box,'Search text or exact kind:id');q.placeholder=language==='zh-CN'?'映照术、莱拉、午夜、旗标名称……':'reflect, Lyra, midnight, flag name…';const results=el('div',null,box,'evidence-results');
  const search=async()=>{const hits=await api('/api/sources?label='+encodeURIComponent(card.label)+'&q='+encodeURIComponent(q.value)+'&scope='+scope.value);results.replaceChildren();if(!hits.length)el('p','No matching frozen sources.',results,'muted');for(const h of hits){const b=btn(results,'',()=>lookup(card,h.key,scope.value));el('strong',h.key,b);rawEl('span',h.title,b);}};
  btn(box,'Search sources',search,false,'btn primary');q.onkeydown=e=>{if(e.key==='Enter')search().catch(fail);};
  const direct=input(box,'Or read an exact source ID');btn(box,'Read source',()=>lookup(card,direct.value,scope.value));
  const out=section(parent,'Source reader');out.id='source-result';el('p','Search the frozen sources or open a dependency below. Source lookup never calls an LLM or a retrieval backend.',out,'muted');
  const deps=section(parent,'Static dependencies');el('p',card.dependencies.warning||'References are not proof of runtime reachability.',deps,'muted');
  for(const e of card.dependencies.edges||[]){const key=e.from===card.key?e.to:e.from,row=el('div',null,deps,'citation');btn(row,key,()=>lookup(card,key,key.startsWith('event:draft_')||key.includes(':draft_')?'submission':'starting'));el('span',e.relation+(e.guards?.length?' · '+e.guards.join(' AND '):''),row,'muted');}
  if(card.dependencies.omitted)el('p',card.dependencies.omitted+' additional references omitted from this bounded list. Original source remains complete.',deps,'muted');
  const rules=section(parent,'Common authoring rules'),rule=select(rules,'Document',data.rules.map(r=>r.file),data.rules[0]?.file),ruleText=el('div',null,rules);
  btn(rules,'Read rule',async()=>{const r=await api('/api/rule?file='+encodeURIComponent(rule.value));ruleText.replaceChildren();el('div',r.sourceHash,ruleText,'evidence-hash');el('pre',r.text,ruleText);});
}
function renderPanel(card){
  const panel=$('#audit-panel');panel.replaceChildren();const tabs=el('div',null,panel,'tabs');
  for(const title of ['Assess','Evidence']){const b=btn(tabs,title,()=>{tab=title;renderPanel(card);if(title==='Evidence'&&lastSource)renderSource(card,lastSource);});b.className=tab===title?'on':'';}
  if(tab==='Assess')assessment(panel,card);else evidence(panel,card);
}
function show(label){
  flushComments();const same=current===label;current=label;if(!same){lastSource=null;tab='Assess';}
  const card=data.cards.find(c=>c.label===label);if(!card)return;
  const view=$('#view');view.replaceChildren();preview(view,card);const panel=el('aside',null,view,'audit-panel');panel.id='audit-panel';renderPanel(card);renderNav();
  try{localStorage.setItem('lumenhold-review-current:'+data.reviewEpoch,label);}catch{}
}
function renderNav(){
  const nav=$('#nav'),query=$('#filter').value.toLowerCase(),filter=$('#review-filter').value;nav.replaceChildren();let group=null,chain=null;
  for(const c of data.cards){const done=completed(c);if(filter==='pending'&&done||filter==='assessed'&&!done)continue;if(query&&!JSON.stringify([c.label,c.reviewGroup?.title,t(c.reviewGroup?.title||''),c.def?.title,c.place,c.npc?.name,c.def?.actor]).toLowerCase().includes(query))continue;
    if(c.reviewGroup?.key!==group){group=c.reviewGroup?.key;chain=null;el('h3',c.reviewGroup?.title||'Other events',nav,'review-group-heading');}
    if(c.reviewChain?.id!==chain){chain=c.reviewChain?.id||null;if(chain)el('p','Story chain '+c.reviewChain.number,nav,'review-chain-heading');}
    const b=btn(nav,'',()=>show(c.label));b.className=c.label===current?'on':'';el('strong',c.label+(done?' ✓':''),b);rawEl('span',c.def?.title||c.key,b);
  }
}
function renderProgress(){
  const count=data.cards.filter(completed).length;
  $('#progress').textContent=language==='zh-CN'?count+' / '+data.cards.length+' 项已评'+(data.revealed?' · 已揭晓身份':' · 盲评'):count+' / '+data.cards.length+' reviewed'+(data.revealed?' · workflows revealed':' · blind review');
  $('#timeline').replaceChildren();for(const c of data.cards)el('i',null,$('#timeline'),completed(c)?'done':'');
  $('#reveal').disabled=data.revealed||count!==data.cards.length;
}
async function refresh(label){
  data=await api('/api/state');
  // Epoch-scoped drafts prevent reset/deleted judgments from reappearing.
  for(const key of Object.keys(localStorage))if(key.startsWith('lumenhold-review:')||key.startsWith('lumenhold-batch-rating:')&&!key.startsWith('lumenhold-batch-rating:'+data.reviewEpoch+':'))localStorage.removeItem(key);
  for(const card of data.cards){let saved;try{saved=JSON.parse(localStorage.getItem(draftKey(card.label))||'null');}catch{}if(saved){Object.assign(card.judgment,saved);versions.set(card.label,(versions.get(card.label)||0)+1);queueSave(card);}}
  document.documentElement.lang=language;document.title=t('Lumenhold · Authoring review');$('#language').value=language;
  for(const [selector,text] of [['.brand span','Authoring review'],['#reveal','Reveal workflows'],['label[for="filter"]','Find a card'],['label[for="review-filter"]','Show']])$(selector).textContent=t(text);
  $('#filter').placeholder=t('Title, place, character…');for(const o of $('#review-filter').options)o.textContent=t({all:'All presentations',pending:'Not reviewed',assessed:'Reviewed'}[o.value]);
  for(const a of document.querySelectorAll('a[download]'))a.href=a.pathname+'?lang='+language;
  renderProgress();
  $('#notice').textContent=t(data.provisional?'Frozen interim snapshot':'Operator-declared final snapshot')+' · '+new Date(data.at).toLocaleString(language==='zh-CN'?'zh-CN':'en-US')+'。 '+t('Later workspace edits are not included.')+' '+t(data.prompt?'Review the exact shared task below.':'The actual author prompt has not been recorded.');
  let chosen=label||current;try{chosen=chosen||localStorage.getItem('lumenhold-review-current:'+data.reviewEpoch);}catch{}
  show(chosen&&data.cards.some(c=>c.label===chosen)?chosen:data.cards.find(c=>!completed(c))?.label||data.cards[0]?.label);
  const notice=$('#notice'),task=details(notice,(language==='zh-CN'?'共用任务 · ':'Shared task · ')+(data.promptHash?data.promptHash.slice(0,12):'unrecorded'));el('pre',data.prompt||'Not recorded',task);el('p',data.promptProvenance,task,'muted');
}
$('#filter').oninput=renderNav;$('#review-filter').onchange=renderNav;
$('#language').onchange=async()=>{try{await flushAll();language=$('#language').value;localStorage.setItem('lumenhold-review-language',language);await refresh(current);}catch(e){fail(e);}};
$('#reveal').onclick=async()=>{try{await flushAll();await api('/api/reveal',{reviewEpoch:data.reviewEpoch});await refresh(current);}catch(e){fail(e);}};
window.addEventListener('pagehide',flushComments);
window.addEventListener('online',()=>{for(const label of failedSaves){const card=data.cards.find(c=>c.label===label);if(card)queueSave(card);}});
refresh().catch(fail);
