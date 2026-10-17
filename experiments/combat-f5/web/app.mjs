import {SPELL_ICONS,ACTION_ICONS,flavorLine,finishLines,createState,applyChoice,actorToMove,legalActions,available,cost,describe,label,concede,hpCost,has,RULES_VERSION,SPELLS,LOADOUTS,NAMED_LOADOUTS,fixedLoadoutLevel,CONTEXTS,chooseAIAction,searchAction,createSearchContext,searchPositionKey,probeSearchCache,cloneState} from './engine.mjs';
// The same served module supplies a worker, preserving the existing localhost server.
if(typeof document==='undefined'){
  self.onmessage=e=>{try{if(e.data.type==='analyze')analyze(e.data);else self.postMessage({token:e.data.token,decision:chooseAIAction(e.data.state,e.data.options)});}catch(error){self.postMessage({token:e.data.token,error:error.message});}};
}
// Player analysis: iterative deepening with every root move scored, streamed after each completed depth.
// Lines follow the best move stored in the transposition table from each position.
function principal(state,first,ctx,limit){
  const s=cloneState(state),line=[];let id=first;
  for(let i=0;i<limit&&id&&!s.result;i++){
    const side=actorToMove(s);if(!legalActions(s).includes(id))break;
    line.push({side,id,round:s.round,channel:s.actors[side].channel?.id??null});applyChoice(s,id);
    if(s.result){line.push({end:s.result.winner===0?'win':s.result.winner===1?'loss':'draw'});break;}
    id=probeSearchCache(ctx,searchPositionKey(ctx,s))?.bestId;
  }
  return line;
}
function analyze({token,state,budgetMs,maxDepth}){
  const ctx=createSearchContext({tableLimit:65536}),start=performance.now();let nodes=0;
  for(let depth=1;depth<=maxDepth;depth++){
    const left=budgetMs-(performance.now()-start);if(left<=0)break;
    const r=searchAction(state,{maxDepth:depth,nodeBudget:20000000,budgetMs:left,rankActions:true,prune:true,horizonMode:'tactical'},ctx);nodes+=r.nodes;
    if(r.completedDepth<depth)break;
    const ranked=[...r.rankedActions].sort((a,b)=>b.value-a.value);
    self.postMessage({token,analysis:{depth,nodes,ms:performance.now()-start,best:ranked[0].id,scores:Object.fromEntries(ranked.map(a=>[a.id,a.value])),lines:ranked.slice(0,3).map(a=>({id:a.id,value:a.value,line:principal(state,a.id,ctx,10)}))}});
    if(Math.abs(ranked[0].value)>=9000)break;
  }
  self.postMessage({token,done:true});
}
if(typeof document!=='undefined'){
const $=id=>document.getElementById(id),esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),fmt=n=>Number.isInteger(n)?n:n.toFixed(1);
let game=null,selected=null,view='play',busy=false,history=[],stats=[],token=0,moves=0,bars={},targets={};
let analysis=null,analysisToken=0,analysisFor=-1,analysisRunning=false,engineBudget=(()=>{try{return Number(localStorage.getItem('engineBudget'))||1500;}catch{return 1500;}})(),engineOn=(()=>{try{return localStorage.getItem('engineOn')!=='0';}catch{return true;}})();
const QUESTION='<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="32" cy="32" r="26"/><path d="M24 25a8 8 0 1 1 11 7.4c-2 .9-3 2.4-3 4.6v2"/><path d="M32 46v1"/></svg>';
function makeAnalyst(){const w=new Worker('/app.mjs?worker=analysis',{type:'module'});w.onmessage=onAnalysis;w.onerror=e=>{analysisRunning=false;$('setup-error').textContent='Engine: '+e.message;};return w;}
let analyst=null;
const COMBAT_RESOURCES=['health','mana','crowns','renown','alignment'];
const worker=new Worker('/app.mjs?worker=1',{type:'module'});
for(const id of ['player-loadout','opponent-loadout'])for(const [group,items]of Object.entries({General:LOADOUTS,Characters:NAMED_LOADOUTS}))$(id).insertAdjacentHTML('beforeend',`<optgroup label="${group}">${Object.keys(items).map(name=>`<option>${name}</option>`).join('')}</optgroup>`);
$('rebates').innerHTML=['health','mana'].map(k=>`<label>${k} rebate %<input data-rebate="${k}" type="number" min="0" max="100"></label>`).join('');
function setRebates(){for(const input of document.querySelectorAll('[data-rebate]'))input.value=CONTEXTS[$('context').value][input.dataset.rebate]*100;}
function setup(){
 const player=$('player-loadout').value,opponent=$('opponent-loadout').value||player,pFixed=fixedLoadoutLevel(player),oFixed=fixedLoadoutLevel(opponent);
 if(pFixed)$('player-level').value=pFixed;if(oFixed&&oFixed!==Number($('player-level').value))$('match-level').checked=false;$('player-level').disabled=!!pFixed;
 if($('match-level').checked)$('opponent-level').value=$('player-level').value;if(oFixed)$('opponent-level').value=oFixed;
 $('opponent-level').disabled=$('match-level').checked||!!oFixed;$('match-level').disabled=!!oFixed;
 for(const b of document.querySelectorAll('[data-level]')){b.disabled=!!pFixed;b.classList.toggle('active',b.dataset.level===$('player-level').value);}
 for(const [side,name]of [['player',player],['opponent',opponent]]){const growing=!!NAMED_LOADOUTS[name]&&!fixedLoadoutLevel(name)&&name!=='The man in grey';$(side+'-year-label').hidden=!growing||side==='opponent'&&!$('opponent-loadout').value;$(side+'-ilse-label').hidden=name!=='Ilse'||side==='opponent'&&!$('opponent-loadout').value;}
 $('begin').textContent=`Begin combat · level ${$('player-level').value} →`;
}

for(const b of document.querySelectorAll('[data-level]'))b.onclick=()=>{$('player-level').value=b.dataset.level;setup();};
$('player-loadout').onchange=setup;$('opponent-loadout').onchange=setup;$('player-level').oninput=setup;$('match-level').onchange=setup;$('context').onchange=setRebates;
function config(){const same=!$('opponent-loadout').value;return {playerYear:Number($('player-year').value),opponentYear:Number($(same?'player-year':'opponent-year').value),playerIlseTaken:$('player-ilse-taken').checked,opponentIlseTaken:$(same?'player-ilse-taken':'opponent-ilse-taken').checked,encounterSeed:$('encounter-seed').value===''?crypto.getRandomValues(new Uint32Array(1))[0]:Number($('encounter-seed').value),damageMultiplier:Number($('damage-multiplier').value),mode:'combat',ai:[null,{profile:$('ai-profile').value,seed:Number($('ai-seed').value)}],playerLoadout:$('player-loadout').value,opponentLoadout:$('opponent-loadout').value||$('player-loadout').value,playerLevel:Number($('player-level').value),opponentLevel:Number($('opponent-level').value),firstLeader:Number($('first-leader').value),healthModel:$('health-model').value,resourceBudget:$('budget').value,spellAccess:$('all-spells').checked?'all':'kit',manaCostScale:Number($('mana-scale').value),observers:$('observers').checked,playerResources:$('player-crowns').value===''?undefined:{crowns:Number($('player-crowns').value)},opponentResources:$('opponent-crowns').value===''?undefined:{crowns:Number($('opponent-crowns').value)},context:$('context').value,rebates:Object.fromEntries([...document.querySelectorAll('[data-rebate]')].map(i=>[i.dataset.rebate,Number(i.value)/100]))};}
function start(c=config()){try{const seed=c.ai?.[1]?.seed;if(seed!==undefined&&(!Number.isInteger(seed)||seed<0||seed>4294967295))throw Error('Choose an integer AI seed from 0 to 4294967295');token++;busy=false;game=createState(c);history=[];stats=[];selected=null;moves++;bars={};targets={};analysis=null;view='play';$('setup-error').textContent='';$('return').hidden=false;render();pump();window.scrollTo(0,0);}catch(e){$('setup-error').textContent=e.message;}}
$('begin').onclick=()=>start();$('return').onclick=()=>{view='play';render();};setRebates();setup();
function submit(id,ai){const channels=game.actors.map(a=>a.channel?.id),mover=actorToMove(game),commits=game.pending.map((p,i)=>i===mover?id:p),descs=commits.map((c,i)=>{try{return c?describe(game,i,c):'';}catch{return '';}}),before=structuredClone(game),r=applyChoice(game,id);moves++;if(ai)stats.push({round:r.round??game.round,side:1,...ai});if(r.resolved)history.push({...r,channels,descs,finish:finishLines(before,game,r.pair,r.round),actionNames:r.pair.map((id,i)=>['hold','release'].includes(id)?`${label(id)} ${label(channels[i])}`:label(id)),hp:game.actors.map(a=>a.hp),ready:game.actors.map(a=>a.resources.mana),flux:game.actors.map(a=>a.flux)});selected=null;render();}
function pump(){if(!game||game.result||actorToMove(game)!==1)return;
 const actions=legalActions(game);if(actions.length===1){submit(actions[0]);pump();return;}
 busy=true;render();const current=++token;worker.postMessage({token:current,state:game,options:{}});
}
worker.onmessage=e=>{if(e.data.token!==token)return;busy=false;if(e.data.error){$('setup-error').textContent=e.data.error;render();return;}submit(e.data.decision.id,e.data.decision);pump();};
worker.onerror=e=>{busy=false;$('setup-error').textContent=e.message;render();};
// Vertical bars: height scales with the actual maximum; layers start at their last shown value and
// move to the new one on the next frame (fill quickly, the pale trail after a delay, the gain preview at once).
const UNIT=1.9;
function layer(cls,key,to,bottom){const from=bars[key]??to,fromBottom=bars[key+'@']??bottom;return `<i class="${cls}" data-bar="${key}" data-to="${to}"${bottom!==undefined?` data-bottom="${bottom}"`:''} style="height:${from}%${bottom!==undefined?`;bottom:${fromBottom}%`:''}"></i>`;}
function vbar(side,kind,value,max,flux=0,col=1){
 const k=side+kind,pct=v=>Math.max(0,Math.min(100,100*v/max)),now=pct(value),before=targets[k],change=before===undefined?'':now<before-1e-6?'drop':now>before+1e-6?'rise':'';
 const fluxShown=Math.min(flux,Math.max(0,max-value));targets[k]=now;
 return `<div class="vbar ${kind} ${change}" title="${kind==='hp'?'HP':'Mana'} ${fmt(value)} / ${fmt(max)}${kind==='mana'?` · flux ${fmt(flux)} (Reclaim restores up to ${fmt(Math.min(flux,max-value))})`:''}">
  <b class="vnum" style="grid-column:${col}">${fmt(value)}<small>/${fmt(max)}</small></b>
  <div class="vtrack" title="${kind==='hp'?'HP':'Mana'} ${fmt(value)} / ${fmt(max)}" style="grid-column:${col};height:${max*UNIT}px">${layer('trail',k+'trail',now)}${layer('gain',k+'gain',now)}${kind==='mana'?layer('flux',k+'flux',pct(fluxShown),now):''}${layer('fill',k+'fill',now)}</div>
  <span class="vlabels" style="grid-column:${col}"><span class="vlabel">${kind==='hp'?'♥ HP':'✧ Mana'}</span>${kind==='mana'?`<span class="vflux">↻ ${fmt(flux)} flux</span>`:''}</span></div>`;
}
// Start each new bar from its current on-screen height, so a re-render mid-animation doesn't snap.
function snapshotBars(){for(const el of document.querySelectorAll('[data-bar]')){const t=el.parentElement.clientHeight;if(!t)continue;bars[el.dataset.bar]=100*el.offsetHeight/t;if(el.dataset.bottom!==undefined)bars[el.dataset.bar+"@"]=100*(t-el.offsetTop-el.offsetHeight)/t;}}
function animateBars(){requestAnimationFrame(()=>requestAnimationFrame(()=>{for(const el of document.querySelectorAll('[data-bar]')){el.style.height=el.dataset.to+'%';bars[el.dataset.bar]=Number(el.dataset.to);if(el.dataset.bottom!==undefined){el.style.bottom=el.dataset.bottom+'%';bars[el.dataset.bar+'@']=Number(el.dataset.bottom);}}}));}
// One track row for both panels: the tallest bar of either side, so every bar shares one bottom line.
const trackRow=()=>Math.max(...game.actors.flatMap(a=>[a.maxHP,a.kit.capacity]))*UNIT;
function actorPanel(i){const a=game.actors[i];
 return `<article class="actor ${i?'opp':'you'}"><div class="actor-heading"><b>${i===0?'You':'Opponent'}</b><span>${esc(a.kit.loadout)} · ${a.kit.level}</span></div>
 <div class="vbars" style="grid-template-rows:${trackRow()}px auto auto">${(i?[1,0]:[0,1]).map((k,j)=>k?vbar(i,'mana',a.resources.mana,a.kit.capacity,a.flux,j+1):vbar(i,'hp',a.hp,a.maxHP,0,j+1)).join('')}</div>
 <div class="purse">${fmt(a.resources.crowns)} Crowns${game.config.observers?` · Renown ${fmt(a.resources.renown)} (+${fmt(a.pendingRenown)})`:''}${a.resources.alignment!==a.entry.alignment?` · Align ${a.resources.alignment}`:''}</div>
 <div class="effects">${effects(i)}</div></article>`;}
function effects(i){const a=game.actors[i],out=[];
 if(a.channel)out.push(`${label(a.channel.id)} · ${a.channel.holds} Hold${a.channel.holds===1?'':'s'}${a.channel.bank?` · bank ${fmt(a.channel.bank)}`:''}`);
 for(const c of a.constructs)out.push(`${label(c.id)} ${fmt(c.taken)}/${fmt(c.threshold)}`);
 for(const [k,e]of Object.entries(a.effects))if(e.until===null||e.until>=game.round)out.push(esc(k)+(e.until!==null&&e.until>game.round?` → E${e.until}`:''));
 return out.map(x=>`<span>${x}</span>`).join('')||'<span class="none">no effects</span>';}
function arena(){return `<div class="arena ${engineOn?'':'no-eval'}">${engineOn?`<div class="evalbar" id="evalbar" title="Engine evaluation for you, in HP">${evalBar()}</div>`:''}${actorPanel(0)}<section class="center-log" id="center-log" aria-label="Combat log">${centerLog()}</section>${actorPanel(1)}</div>`;}
// The full log, oldest first; every action carries its icon and the effect it had when committed.
function logAction(r,i){const id=r.pair[i],committed=r.committed[i],desc=r.descs?.[i]??'';
 return `<div class="log-act ${i?'opp':'you'}"><span class="mini-icon">${actionIcon(id,i,r.channels?.[i])}</span><div><b>${i===0?'You':'Opponent'}</b> ${esc(r.actionNames[i])}${committed!==id?` <small>(committed ${esc(label(committed))})</small>`:''}${flavorOf(r,i)}${desc?`<p class="${i?'':'own'}">${esc(desc)}</p>`:''}</div></div>`;}
function flavorOf(r,i){const line=flavorLine(r.pair[i],{channel:r.channels?.[i],round:r.round});return line?`<p class="flavor">${esc(line)}</p>`:'';}
function centerLog(){
 const rows=history.map(r=>`<article><h3>Exchange ${r.round} <small>· ${r.leader===0?'you':'opponent'} led</small></h3>${[r.leader,1-r.leader].map(i=>logAction(r,i)).join('')}${(r.finish??[]).map(f=>`<p class="flavor finish">${esc(f)}</p>`).join('')}<ul>${r.events.map(e=>`<li>${esc(e)}</li>`).join('')||'<li>No damage or resource events.</li>'}</ul><small class="after">HP ${r.hp.map(fmt).join(' / ')} · Mana ${r.ready.map(fmt).join(' / ')} · flux ${r.flux.map(fmt).join(' / ')}</small></article>`);
 if(!game.result){const lead=game.leader,p=game.pending;
  rows.push(`<article class="now"><h3>Exchange ${game.round} <small>· ${lead===0?'you lead':'opponent leads'}</small></h3>${[lead,1-lead].map(i=>`<div class="log-act ${i?'opp':'you'}"><span class="mini-icon">${p[i]?actionIcon(p[i],i):QUESTION}</span><div><b>${i===0?'You':'Opponent'}</b> ${p[i]?esc(label(p[i])):i===actorToMove(game)?(i===0?'choosing…':'thinking…'):'hidden until the leader commits'}${p[i]&&i===1?`<p>${esc(describe(game,1,p[i]))}</p>`:''}</div></div>`).join('')}</article>`);}
 return `<h2>Log</h2>${rows.join('')||'<p class="fine">No exchanges yet.</p>'}`;}

function forecasts(){
 const rows=[];
 if(game.earlyCommit.some(n=>n>0))rows.push(game.earlyCommit.map((n,i)=>n?`${i===0?'You':'Opponent'} reveal first: ${n}`:'').filter(Boolean).join(' · '));
 for(const [side,a]of game.actors.entries())if(a.omens.length)rows.push(`${side===0?'Your':'Enemy'} Omen → `+a.omens.map(o=>`E${o.due} (${fmt(o.power)})`).join(', '));
 return rows.length?'<div class="forecasts">'+rows.join('<br>')+'</div>':'';
}
function intent(){const opponent=game.pending[1];
 if(busy)return `<div class="tele"><span class="tele-icon hidden-move">${QUESTION}</span><div><b>Opponent is committing…</b><p>The game stays responsive while search runs.</p></div></div>`;
 if(opponent)return `<div class="tele"><span class="tele-icon">${actionIcon(opponent,1)}</span><div><b>Telegraph · initiative: ${esc(label(opponent))}</b>${(l=>l?`<p class="flavor">${esc(l)}</p>`:'')(flavorLine(opponent,{channel:game.actors[1].channel?.id,round:game.round}))}<p>${esc(describe(game,1,opponent))}</p></div></div>`;
 return `<div class="tele"><span class="tele-icon hidden-move">${QUESTION}</span><div><b>You commit first · initiative</b><p>The opponent's reply stays hidden until you commit. Initiative breaks mutual knockouts.</p></div></div>`;
}
function price(id){const h=hpCost(game,0,id),m=has(game,0,'heartprice')?0:cost(game,0,id);return [m?fmt(m)+' Mana':'',h?fmt(h)+' HP':''].filter(Boolean).join(' + ')||'No cost';}
// Haste composes the same basic icons; Hold/Release use the active spell motif.
function actionIcon(id,side=0,channel=game.actors[side].channel?.id){
 if(id.startsWith('bundle:'))return `<span class="bundle-icons">${id.slice(7).split('+').map(p=>ACTION_ICONS[p]).join('')}</span>`;
 const key=['hold','release'].includes(id)?channel+'_'+id:id;
 return SPELL_ICONS[id]??ACTION_ICONS[key]??(id==='frozen'?'<b class="glyph">❄</b>':id==='cancel'?'<b class="glyph">∅</b>':QUESTION);
}
function card(id){const reason=available(game,0,id),disabled=busy||actorToMove(game)!==0||reason,m=has(game,0,'heartprice')?0:cost(game,0,id),h=hpCost(game,0,id),bundle=id.startsWith('bundle:'),name=label(id);
 return `<button class="action ${selected===id?'selected':''} ${bundle?'bundle':''}" data-action="${id}" aria-label="${esc(name+' · '+price(id)+(reason?' · '+reason:''))}" aria-pressed="${selected===id}" title="${esc(name+' · '+price(id)+(reason?' · '+reason:''))}" ${disabled?'disabled':''}><span class="action-icon ${SPELL_ICONS[id]?'spell-art':id!=='frozen'?'action-art':''}" aria-hidden="true">${actionIcon(id)}</span><span class="action-name">${esc(name)}</span><em class="card-eval" data-eval="${id}"></em><small class="mana-cost" aria-label="${fmt(m)} Mana">✧${fmt(m)}</small>${h?`<small class="hp-cost">♥${fmt(h)}</small>`:''}</button>`;}
function preview(){return `<div class="preview">${selected?`<b>${esc(label(selected))} · ${price(selected)}</b><p>${esc(describe(game,0,selected))}</p>`:'Select an icon for details. Click it again to act.'}</div><button id="commit" class="primary" ${!selected||busy||actorToMove(game)!==0?'disabled':''}>${SPELLS[selected]?`<span class="control-icon" aria-hidden="true">${ACTION_ICONS.cast}</span>Cast`:'Commit'}</button>`;}
function commit(id=selected){if(!id||busy||actorToMove(game)!==0||available(game,0,id))return;try{submit(id);pump();}catch(e){$('setup-error').textContent=e.message;}}
// Selection stays until execution or a different choice; there is no click timer.
function selectAction(id){selected=id;for(const b of document.querySelectorAll('[data-action]')){const active=b.dataset.action===id;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));}document.querySelector('.commit-bar').innerHTML=preview();$('commit').onclick=()=>commit();}
function choices(){
 const a=game.actors[0],forced=a.channel||has(game,0,'haste')||a.freezeUntil>=game.round;
 const ids=forced?legalActions(game,0):['strike','guard','reclaim',...Object.keys(a.kit.spells)];
 return `${forced?`<div class="action-state">${a.freezeUntil>=game.round?'Frozen · thaw after this exchange':a.channel?label(a.channel.id)+' · Hold or Release':'Haste · one public basic bundle'}</div>`:''}<div class="action-grid ${forced?'forced':''}">${ids.map(card).join('')}</div><div class="commit-bar">${preview()}</div>`;
}

const evalText=v=>v===undefined?'…':v>=9000?'KO':v<=-9000?'−KO':(v>0?'+':v<0?'−':'')+Math.abs(v).toFixed(1);
const evalShare=v=>v>=9000?100:v<=-9000?0:100/(1+Math.exp(-v/12));
function evalBar(){const v=analysis?.scores?.[analysis.best];return `<i style="height:${v===undefined?50:evalShare(v)}%"></i><span>${v===undefined?'':evalText(v)}</span>`;}
function plyChip(p){if(p.end)return `<span class="ply end">${p.end==='win'?'KO · you win':p.end==='loss'?'KO · you lose':'draw'}</span>`;
 return `<span class="ply ${p.side?'opp':'you'}" title="${p.side?'Opponent':'You'} · exchange ${p.round}"><span class="mini-icon">${actionIcon(p.id,p.side,p.channel)}</span>${esc(label(p.id))}</span>`;}
function lineHtml(line){let out='',round=null;for(const p of line){if(!p.end&&round!==null&&p.round!==round)out+='<span class="sep">|</span>';if(!p.end)round=p.round;out+=plyChip(p);}return out;}
function enginePanel(){
 const mine=!game.result&&actorToMove(game)===0,head=!analysis?(mine?'Engine · starting…':'Engine · waits for your turn'):`Engine · depth ${analysis.depth}${analysisRunning?'…':''} · ${(analysis.nodes/1000).toFixed(0)}k nodes · ${(analysis.ms/1000).toFixed(1)} s`;
 return `<div class="engine-head"><b>${head}</b><select id="engine-budget" aria-label="Engine time">${[[500,'0.5 s'],[1500,'1.5 s'],[4000,'4 s']].map(([v,t])=>`<option value="${v}" ${v===engineBudget?'selected':''}>${t}</option>`).join('')}</select></div>${analysis?.lines?`<ol class="lines">${analysis.lines.map((l,k)=>`<li class="${k===0?'best':''}"><span class="eval">${evalText(l.value)}</span><span class="line">${lineHtml(l.line)}</span></li>`).join('')}</ol>`:''}<p class="fine">Values are in HP from your side: + is good for you. The line is each side's best reply as the engine sees it: gold chips are your moves, blue chips the opponent's, and | separates exchanges.</p>`;
}
function paintEngine(){
 const panel=$('engine');if(panel&&engineOn){panel.innerHTML=enginePanel();$('engine-budget').onchange=e=>{engineBudget=Number(e.target.value);try{localStorage.setItem('engineBudget',engineBudget);}catch{}analysisFor=-1;analysis=null;requestAnalysis();paintEngine();};}
 if($('evalbar'))$('evalbar').innerHTML=evalBar();
 const live=engineOn&&analysis&&analysisFor===moves;
 for(const b of document.querySelectorAll('[data-action]'))b.classList.toggle('best',!!live&&b.dataset.action===analysis.best);
 for(const e of document.querySelectorAll('[data-eval]')){const v=live?analysis.scores[e.dataset.eval]:undefined;e.textContent=v===undefined?'':evalText(v);}
}
function onAnalysis(e){if(e.data.token!==analysisToken)return;if(e.data.error){analysisRunning=false;$('setup-error').textContent='Engine: '+e.data.error;paintEngine();return;}if(e.data.done)analysisRunning=false;else analysis=e.data.analysis;paintEngine();}
function setEngine(on){engineOn=on;try{localStorage.setItem('engineOn',on?'1':'0');}catch{}
 if(!on){analyst?.terminate();analyst=null;analysisRunning=false;analysis=null;analysisFor=-1;}render();}
function requestAnalysis(){
 if(!game||game.result||!engineOn||actorToMove(game)!==0||busy||analysisFor===moves)return;
 // A stale search would only queue behind the new one, so restart the worker instead.
 if(analysisRunning||!analyst){analyst?.terminate();analyst=makeAnalyst();}
 analysisFor=moves;analysis=null;analysisRunning=true;analyst.postMessage({type:'analyze',token:++analysisToken,state:game,budgetMs:engineBudget,maxDepth:8});
}
function result(){const r=game.result;return `<div class="result ${r.outcome}"><h2>${r.outcome.toUpperCase()}</h2><p>${r.reason}${r.tiebreak?' · telegraphed initiative wins':''}</p><div class="net-costs">${COMBAT_RESOURCES.map(k=>`${k}: ${game.settlement[0][k].netLoss<0?'+':'−'}${fmt(Math.abs(game.settlement[0][k].netLoss))}`).join(' · ')}</div><p class="fine">Flux collected; rebates cover net loss only. Crowns and alignment are never rebated.${game.result.followUps.length?` Observers reported ${game.reports.length} forbidden cast(s).`:""}</p><button id="replay" class="primary">Replay same setup</button><button id="carry" ${game.config.healthModel==='direct'&&game.actors[0].resources.health<=0?'disabled':''}>Next bout · carry balances</button><button id="export">Export log</button></div>`;}
function debug(){return `<div class="debug"><h3>Search and exchange journal</h3><p>Decisions ${stats.length}; deepest completed ${Math.max(0,...stats.map(a=>a.completedDepth))}; slowest ${Math.max(0,...stats.map(a=>a.elapsedMs)).toFixed(1)} ms; accepted weaker choices ${stats.filter(a=>a.degraded).length} / ${stats.length}.</p><details><summary>Kits and ledgers</summary><pre>${esc(JSON.stringify({kits:game.actors.map(a=>a.kit),settlement:game.settlement,reports:game.reports},null,2))}</pre></details>${history.slice().reverse().map(r=>`<details open><summary>Exchange ${r.round}: ${r.pair.map(label).join(' / ')}</summary><ul>${r.events.map(e=>`<li>${esc(e)}</li>`).join('')}</ul></details>`).join('')}</div>`;}
function render(){if(!game)return;document.body.classList.add('playing');document.body.classList.toggle('setup-open',view==='setup');document.body.classList.toggle('debug-open',view==='debug');document.body.classList.toggle('log-open',view==='log');
 snapshotBars();const keep=$('center-log'),stick=!keep||keep.scrollHeight-keep.scrollTop-keep.clientHeight<40;
 $('play').innerHTML=`<nav><b>Combat · ${game.result?'Complete':'Exchange '+game.round}</b><button data-view="setup">Setup</button><button data-view="play">Play</button><button data-view="debug">Debug</button><button id="engine-toggle" class="${engineOn?'active':''}" aria-pressed="${engineOn}" title="Show or hide the engine's analysis of your turns">Engine: ${engineOn?'on':'off'}</button></nav><div class="play-stage"><div class="intent">${game.result?'Encounter settled.':intent()}</div>${arena()}${forecasts()}${engineOn?'<div class="engine" id="engine"></div>':''}${game.result?result():choices()}${!game.result?`<button id="leave" class="leave"><span class="control-icon" aria-hidden="true">${ACTION_ICONS.concede}</span>Leave encounter</button>`:''}</div>${debug()}`;
 const log=$('center-log');if(log&&stick)log.scrollTop=log.scrollHeight;animateBars();paintEngine();requestAnalysis();
 for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>{view=b.dataset.view;render();window.scrollTo(0,0);};for(const b of document.querySelectorAll('[data-action]'))b.onclick=()=>{const id=b.dataset.action;if(selected===id)commit(id);else selectAction(id);};
 if($('commit'))$('commit').onclick=()=>commit();
 if($('engine-toggle'))$('engine-toggle').onclick=()=>setEngine(!engineOn);
 if($('leave'))$('leave').onclick=()=>{token++;busy=false;concede(game,0);render();};
 if($('replay'))$('replay').onclick=()=>start(game.config);
 if($('carry'))$('carry').onclick=()=>start({...game.config,playerResources:{...game.actors[0].resources},opponentResources:undefined});
 if($('export'))$('export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({rulesVersion:RULES_VERSION,config:game.config,kits:game.actors.map(a=>a.kit),history,stats,result:game.result,settlement:game.settlement,reports:game.reports},null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='lumenhold-combat-v04-'+Date.now()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
}
// Version shown in the header and the tab title, straight from the engine build.
if($('version'))$('version').textContent=RULES_VERSION;document.title='Lumenhold · Combat '+RULES_VERSION;
const params=new URLSearchParams(location.search);if(params.has('quickstart')){const n=Number(params.get('quickstart'));if([20,50,80].includes(n)){$('player-level').value=n;setup();start();}}
}
