import {SPELL_ICONS,ACTION_ICONS,createState,applyChoice,actorToMove,legalActions,available,cost,describe,label,concede,hpCost,has,RULES_VERSION,SPELLS,LOADOUTS,NAMED_LOADOUTS,fixedLoadoutLevel,CONTEXTS,chooseAIAction,createSearchContext,COMPUTE_PROFILES} from './engine.mjs';
// The same served module supplies a worker, preserving the existing localhost server.
if(typeof document==='undefined'){
  let encounterId=null,contexts=[];
  self.onmessage=e=>{try{
    const state=e.data.state,side=actorToMove(state),name=e.data.options?.computeProfile??state.config.search?.computeProfile??state.config.computeProfile,limit=COMPUTE_PROFILES[name]?.tableLimit??4096;
    if(e.data.encounterId!==encounterId){encounterId=e.data.encounterId;contexts=[];}
    if(!contexts[side]||contexts[side].tableLimit!==limit)contexts[side]=createSearchContext({tableLimit:limit});
    self.postMessage({token:e.data.token,decision:chooseAIAction(state,e.data.options,contexts[side])});
  }catch(error){self.postMessage({token:e.data.token,error:error.message});}};
}else{
const $=id=>document.getElementById(id),esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),fmt=n=>Number.isInteger(n)?n:n.toFixed(1);
let game=null,selected=null,view='play',busy=false,history=[],stats=[],token=0,encounterSerial=0;
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
function config(){const same=!$('opponent-loadout').value;return {playerYear:Number($('player-year').value),opponentYear:Number($(same?'player-year':'opponent-year').value),playerIlseTaken:$('player-ilse-taken').checked,opponentIlseTaken:$(same?'player-ilse-taken':'opponent-ilse-taken').checked,encounterSeed:$('encounter-seed').value===''?crypto.getRandomValues(new Uint32Array(1))[0]:Number($('encounter-seed').value),search:{computeProfile:$('compute-profile').value},damageMultiplier:Number($('damage-multiplier').value),mode:'combat',ai:[null,{profile:$('ai-profile').value,seed:Number($('ai-seed').value)}],playerLoadout:$('player-loadout').value,opponentLoadout:$('opponent-loadout').value||$('player-loadout').value,playerLevel:Number($('player-level').value),opponentLevel:Number($('opponent-level').value),firstLeader:Number($('first-leader').value),healthModel:$('health-model').value,resourceBudget:$('budget').value,spellAccess:$('all-spells').checked?'all':'kit',manaCostScale:Number($('mana-scale').value),observers:$('observers').checked,playerResources:$('player-crowns').value===''?undefined:{crowns:Number($('player-crowns').value)},opponentResources:$('opponent-crowns').value===''?undefined:{crowns:Number($('opponent-crowns').value)},context:$('context').value,rebates:Object.fromEntries([...document.querySelectorAll('[data-rebate]')].map(i=>[i.dataset.rebate,Number(i.value)/100]))};}
function start(c=config()){try{const seed=c.ai?.[1]?.seed;if(seed!==undefined&&(!Number.isInteger(seed)||seed<0||seed>4294967295))throw Error('Choose an integer AI seed from 0 to 4294967295');token++;encounterSerial++;busy=false;game=createState(c);history=[];stats=[];selected=null;view='play';$('setup-error').textContent='';$('return').hidden=false;render();pump();window.scrollTo(0,0);}catch(e){$('setup-error').textContent=e.message;}}
$('begin').onclick=()=>start();$('return').onclick=()=>{view='play';render();};setRebates();setup();
function submit(id,ai){const channels=game.actors.map(a=>a.channel?.id),r=applyChoice(game,id);if(ai)stats.push({round:r.round??game.round,side:1,...ai});if(r.resolved)history.push({...r,actionNames:r.pair.map((id,i)=>['hold','release'].includes(id)?`${label(id)} ${label(channels[i])}`:label(id)),hp:game.actors.map(a=>a.hp),ready:game.actors.map(a=>a.resources.mana),flux:game.actors.map(a=>a.flux)});selected=null;render();}
function pump(){if(!game||game.result||actorToMove(game)!==1)return;
 const actions=legalActions(game);if(actions.length===1){submit(actions[0]);pump();return;}
 busy=true;render();const current=++token;worker.postMessage({token:current,encounterId:encounterSerial,state:game,options:{}});
}
worker.onmessage=e=>{if(e.data.token!==token)return;busy=false;if(e.data.error){$('setup-error').textContent=e.data.error;render();return;}submit(e.data.decision.id,e.data.decision);pump();};
worker.onerror=e=>{busy=false;$('setup-error').textContent=e.message;render();};
function actors(){return '<div class="actors">'+game.actors.map((a,i)=>`<article class="actor"><div class="actor-heading"><b>${i===0?'You':'Opponent'}</b><span>${a.kit.loadout} · ${a.kit.level}</span></div><div class="resource health"><span>♥ HP</span><b>${fmt(a.hp)} / ${fmt(a.maxHP)}</b><div class="track"><i style="width:${100*a.hp/a.maxHP}%"></i></div></div><div class="mana-row"><span>✧ <b>${fmt(a.resources.mana)}</b> Mana</span><span>↻ <b>${fmt(a.flux)}</b> flux</span></div><div class="purse">${fmt(a.resources.crowns)} Crowns${game.config.observers?` · Renown ${fmt(a.resources.renown)} (+${fmt(a.pendingRenown)})`:''}${a.resources.alignment!==a.entry.alignment?` · Align ${a.resources.alignment}`:''}${game.config.healthModel==='offset'?` · Health ${fmt(a.resources.health)}`:''}</div><div class="effects" title="${esc(Object.keys(a.effects).join(', '))}">${a.channel?`${label(a.channel.id)} · ${a.channel.holds} Holds · bank ${fmt(a.channel.bank)}`:a.constructs.length?a.constructs.map(c=>`${label(c.id)} ${fmt(c.taken)}/${fmt(c.threshold)}`).join(' · '):Object.keys(a.effects).join(' · ')||'—'}</div></article>`).join('')+'</div>';}
function recentOpponent(){const r=history.at(-1);return `<div class="recent-opponent"><span>Opponent last acted</span> <b>${r?esc(r.actionNames[1]):'—'}</b>${r?` <small>· exchange ${r.round}</small>`:''}</div>`;}

function forecasts(){
 const rows=[];
 if(game.earlyCommit.some(n=>n>0))rows.push(game.earlyCommit.map((n,i)=>n?`${i===0?'You':'Opponent'} reveal first: ${n}`:'').filter(Boolean).join(' · '));
 for(const [side,a]of game.actors.entries())if(a.omens.length)rows.push(`${side===0?'Your':'Enemy'} Omen → `+a.omens.map(o=>`E${o.due} (${fmt(o.power)})`).join(', '));
 return rows.length?'<div class="forecasts">'+rows.join('<br>')+'</div>':'';
}
function intent(){const opponent=game.pending[1];
 if(busy)return '<b>Opponent is committing…</b><p>The game stays responsive while search runs.</p>';
 if(opponent)return `<b>Telegraph · initiative: ${label(opponent)}</b><p>${esc(describe(game,1,opponent))}</p>`;
 return '<b>You commit first · initiative</b><p>Your action is shown before the opponent responds. Initiative breaks mutual knockouts.</p>';
}
function price(id){const h=hpCost(game,0,id),m=has(game,0,'heartprice')?0:cost(game,0,id);return [m?fmt(m)+' Mana':'',h?fmt(h)+' HP':''].filter(Boolean).join(' + ')||'No cost';}
// Haste composes the same basic icons; Hold/Release use the active spell motif.
function actionIcon(id){
 if(id.startsWith('bundle:'))return id.slice(7).split('+').map(p=>ACTION_ICONS[p]).join('');
 const key=['hold','release'].includes(id)?game.actors[0].channel?.id+'_'+id:id;
 return SPELL_ICONS[id]??ACTION_ICONS[key]??(id==='frozen'?'Fr':'?');
}
function card(id){const reason=available(game,0,id),disabled=busy||actorToMove(game)!==0||reason,m=has(game,0,'heartprice')?0:cost(game,0,id),h=hpCost(game,0,id),bundle=id.startsWith('bundle:'),name=label(id);
 return `<button class="action ${selected===id?'selected':''} ${bundle?'bundle':''}" data-action="${id}" aria-label="${esc(name+' · '+price(id)+(reason?' · '+reason:''))}" aria-pressed="${selected===id}" title="${esc(name+' · '+price(id)+(reason?' · '+reason:''))}" ${disabled?'disabled':''}><span class="action-icon ${SPELL_ICONS[id]?'spell-art':id!=='frozen'?'action-art':''}" aria-hidden="true">${actionIcon(id)}</span><span class="action-name">${esc(name)}</span><small class="mana-cost" aria-label="${fmt(m)} Mana">✧${fmt(m)}</small>${h?`<small class="hp-cost">♥${fmt(h)}</small>`:''}</button>`;}
function preview(){return `<div class="preview">${selected?`<b>${esc(label(selected))} · ${price(selected)}</b><p>${esc(describe(game,0,selected))}</p>`:'Select an icon for details. Click it again to act.'}</div><button id="commit" class="primary" ${!selected||busy||actorToMove(game)!==0?'disabled':''}>${SPELLS[selected]?`<span class="control-icon" aria-hidden="true">${ACTION_ICONS.cast}</span>Cast`:'Commit'}</button>`;}
function commit(id=selected){if(!id||busy||actorToMove(game)!==0||available(game,0,id))return;try{submit(id);pump();}catch(e){$('setup-error').textContent=e.message;}}
// Selection stays until execution or a different choice; there is no click timer.
function selectAction(id){selected=id;for(const b of document.querySelectorAll('[data-action]')){const active=b.dataset.action===id;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));}document.querySelector('.commit-bar').innerHTML=preview();$('commit').onclick=()=>commit();}
function choices(){
 const a=game.actors[0],forced=a.channel||has(game,0,'haste')||a.freezeUntil>=game.round;
 const ids=forced?legalActions(game,0):['strike','guard','reclaim',...Object.keys(a.kit.spells)];
 return `${forced?`<div class="action-state">${a.freezeUntil>=game.round?'Frozen · thaw after this exchange':a.channel?label(a.channel.id)+' · Hold or Release':'Haste · one public basic bundle'}</div>`:''}<div class="action-grid ${forced?'forced':''}">${ids.map(card).join('')}</div><div class="commit-bar">${preview()}</div>`;
}
function actionLog(){return `<div class="action-log"><h2>Action history</h2><p class="fine">Latest exchange first. Both commitments are public; initiative breaks mutual knockouts. Damage below includes defenses.</p>${game.pending.some(Boolean)&&!game.result?`<div class="pending-log">Pending · ${game.pending.map((id,i)=>`${i===0?'You':'Opponent'}: ${id?esc(label(id)):'waiting'}`).join(' · ')}</div>`:''}${history.length?history.slice().reverse().map(r=>`<article><h3>Exchange ${r.round} <small>· ${r.leader===0?'You':'Opponent'} had initiative</small></h3><div class="log-actions">${r.pair.map((id,i)=>`<p><b>${i===0?'You':'Opponent'}</b> ${esc(r.actionNames[i])}${r.committed[i]!==id?` <small>(committed ${esc(label(r.committed[i]))})</small>`:''}</p>`).join('')}</div><ul>${r.events.map(e=>`<li>${esc(e)}</li>`).join('')||'<li>No damage or resource events.</li>'}</ul><small>HP ${r.hp.map(fmt).join(' / ')} · Mana ${r.ready.map(fmt).join(' / ')}</small></article>`).join(''):'<p>No exchanges resolved yet.</p>'}</div>`;}

function result(){const r=game.result;return `<div class="result ${r.outcome}"><h2>${r.outcome.toUpperCase()}</h2><p>${r.reason}${r.tiebreak?' · telegraphed initiative wins':''}</p><div class="net-costs">${COMBAT_RESOURCES.map(k=>`${k}: ${game.settlement[0][k].netLoss<0?'+':'−'}${fmt(Math.abs(game.settlement[0][k].netLoss))}`).join(' · ')}</div><p class="fine">Flux collected; rebates cover net loss only. Crowns and alignment are never rebated.${game.result.followUps.length?` Observers reported ${game.reports.length} forbidden cast(s).`:""}</p><button id="replay" class="primary">Replay same setup</button><button id="carry" ${game.config.healthModel==='direct'&&game.actors[0].resources.health<=0?'disabled':''}>Next bout · carry balances</button><button id="export">Export log</button></div>`;}
function debug(){return `<div class="debug"><h3>Search and exchange journal</h3><p>Decisions ${stats.length}; deepest completed ${Math.max(0,...stats.map(a=>a.completedDepth))}; slowest ${Math.max(0,...stats.map(a=>a.elapsedMs)).toFixed(1)} ms; accepted weaker choices ${stats.filter(a=>a.degraded).length} / ${stats.length}.</p><details><summary>Kits and ledgers</summary><pre>${esc(JSON.stringify({kits:game.actors.map(a=>a.kit),settlement:game.settlement,reports:game.reports},null,2))}</pre></details>${history.slice().reverse().map(r=>`<details open><summary>Exchange ${r.round}: ${r.pair.map(label).join(' / ')}</summary><ul>${r.events.map(e=>`<li>${esc(e)}</li>`).join('')}</ul></details>`).join('')}</div>`;}
function render(){if(!game)return;document.body.classList.add('playing');document.body.classList.toggle('setup-open',view==='setup');document.body.classList.toggle('debug-open',view==='debug');document.body.classList.toggle('log-open',view==='log');
 $('play').innerHTML=`<nav><b>Combat · ${game.result?'Complete':'Exchange '+game.round}</b><button data-view="setup">Setup</button><button data-view="play">Play</button><button data-view="log">Log</button><button data-view="debug">Debug</button></nav><div class="play-stage"><div class="intent">${game.result?'Encounter settled.':intent()}</div>${recentOpponent()}${actors()}${forecasts()}${game.result?result():choices()}${!game.result?`<button id="leave" class="leave"><span class="control-icon" aria-hidden="true">${ACTION_ICONS.concede}</span>Leave encounter</button>`:''}</div>${actionLog()}${debug()}`;
 for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>{view=b.dataset.view;render();window.scrollTo(0,0);};for(const b of document.querySelectorAll('[data-action]'))b.onclick=()=>{const id=b.dataset.action;if(selected===id)commit(id);else selectAction(id);};
 if($('commit'))$('commit').onclick=()=>commit();
 if($('leave'))$('leave').onclick=()=>{token++;busy=false;concede(game,0);render();};
 if($('replay'))$('replay').onclick=()=>start(game.config);
 if($('carry'))$('carry').onclick=()=>start({...game.config,playerResources:{...game.actors[0].resources},opponentResources:undefined});
 if($('export'))$('export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({rulesVersion:RULES_VERSION,config:game.config,kits:game.actors.map(a=>a.kit),history,stats,result:game.result,settlement:game.settlement,reports:game.reports},null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='lumenhold-combat-v04-'+Date.now()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
}
const params=new URLSearchParams(location.search);if(params.has('quickstart')){const n=Number(params.get('quickstart'));if([20,50,80].includes(n)){$('player-level').value=n;setup();start();}}
}
