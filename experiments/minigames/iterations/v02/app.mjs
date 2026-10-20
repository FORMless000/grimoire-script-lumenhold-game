import {createState,applyChoice,actorToMove,legalActions,available,cost,describe,label,finish,RULES_VERSION,SPELLS,ARCHETYPES,CONTEXTS,chooseAIAction} from './engine.mjs';
// The same served module supplies a worker, preserving the existing localhost server.
if(typeof document==='undefined'){
  self.onmessage=e=>{try{self.postMessage({token:e.data.token,decision:chooseAIAction(e.data.state,e.data.options)});}catch(error){self.postMessage({token:e.data.token,error:error.message});}};
}else{
const $=id=>document.getElementById(id),esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),fmt=n=>Number.isInteger(n)?n:n.toFixed(1);
let game=null,selected=null,section='basic',view='play',busy=false,history=[],stats=[],token=0;
const COMBAT_RESOURCES=['health','mana'];
const worker=new Worker('/app.mjs?worker=1',{type:'module'});
for(const name of Object.keys(ARCHETYPES))for(const id of ['player-archetype','opponent-archetype'])$(id).insertAdjacentHTML('beforeend',`<option>${name}</option>`);
$('rebates').innerHTML=COMBAT_RESOURCES.map(k=>`<label>${k} rebate %<input data-rebate="${k}" type="number" min="0" max="100"></label>`).join('');
function setRebates(){for(const input of document.querySelectorAll('[data-rebate]'))input.value=CONTEXTS[$('context').value][input.dataset.rebate]*100;}
function setup(){if($('match-level').checked)$('opponent-level').value=$('player-level').value;$('opponent-level').disabled=$('match-level').checked;document.querySelectorAll('[data-level]').forEach(b=>b.classList.toggle('active',b.dataset.level===$('player-level').value));$('begin').textContent=`Begin combat · level ${$('player-level').value} →`;}
for(const b of document.querySelectorAll('[data-level]'))b.onclick=()=>{$('player-level').value=b.dataset.level;setup();};
$('player-level').oninput=setup;$('match-level').onchange=setup;$('context').onchange=setRebates;
function config(){return {mode:'combat',ai:[null,{profile:$('ai-profile').value,seed:Number($('ai-seed').value)}],playerArchetype:$('player-archetype').value,opponentArchetype:$('opponent-archetype').value||$('player-archetype').value,playerLevel:Number($('player-level').value),opponentLevel:Number($('opponent-level').value),firstLeader:Number($('first-leader').value),healthModel:$('health-model').value,resourceBudget:$('budget').value,spellAccess:$('all-spells').checked?'all':'kit',manaCostScale:Number($('mana-scale').value),context:$('context').value,rebates:Object.fromEntries([...document.querySelectorAll('[data-rebate]')].map(i=>[i.dataset.rebate,Number(i.value)/100]))};}
function start(c=config()){try{const seed=c.ai?.[1]?.seed;if(seed!==undefined&&(!Number.isInteger(seed)||seed<0||seed>4294967295))throw Error('Choose an integer AI seed from 0 to 4294967295');token++;busy=false;game=createState(c);history=[];stats=[];selected=null;view='play';section='basic';$('setup-error').textContent='';$('return').hidden=false;render();pump();window.scrollTo(0,0);}catch(e){$('setup-error').textContent=e.message;}}
$('begin').onclick=()=>start();$('return').onclick=()=>{view='play';render();};setRebates();setup();
function submit(id,ai){const r=applyChoice(game,id);if(ai)stats.push({round:r.round??game.round,side:1,...ai});if(r.resolved)history.push({...r,hp:game.actors.map(a=>a.hp),ready:game.actors.map(a=>a.resources.mana),flux:game.actors.map(a=>a.flux)});selected=null;render();}
function pump(){if(!game||game.result||actorToMove(game)!==1)return;
 const actions=legalActions(game);if(actions.length===1){submit(actions[0]);pump();return;}
 busy=true;render();const current=++token;worker.postMessage({token:current,state:game,options:{}});
}
worker.onmessage=e=>{if(e.data.token!==token)return;busy=false;if(e.data.error){$('setup-error').textContent=e.data.error;render();return;}submit(e.data.decision.id,e.data.decision);pump();};
worker.onerror=e=>{busy=false;$('setup-error').textContent=e.message;render();};
function actors(){return '<div class="actors">'+game.actors.map((a,i)=>`<article class="actor"><div class="actor-heading"><b>${i===0?'You':'Opponent'}</b><span>${a.kit.archetype} · ${a.kit.level}</span></div><div class="resource health"><span>♥ HP</span><b>${fmt(a.hp)} / ${a.maxHP}</b><div class="track"><i style="width:${100*a.hp/a.maxHP}%"></i></div></div><div class="resource mana"><span>✧ Ready mana</span><b>${fmt(a.resources.mana)}</b></div><div class="resource flux"><span>↻ Flux</span><b>${fmt(a.flux)}</b></div>${game.config.healthModel==='offset'?`<div class="resource"><span>Health</span><b>${fmt(a.resources.health)}</b></div>`:''}<div class="effects">${Object.keys(a.effects).join(' · ')||'—'}</div></article>`).join('')+'</div>';}
function forecasts(){
 if(!game.earlyCommit.some(n=>n>0))return '';
 const both=game.earlyCommit.every(n=>n>0);
 return '<div class="forecasts">'+game.earlyCommit.map((n,i)=>n?`${i===0?'You':'Opponent'}: commit early for ${n} exchange${n===1?'':'s'}`:'').filter(Boolean).join(' · ')+(both?'<br>Both active: normal alternation.':'')+'</div>';
}
function intent(){const opponent=game.pending[1];
 if(busy)return '<b>Opponent is committing…</b><p>The game stays responsive while search runs.</p>';
 if(opponent)return `<b>Telegraph · initiative: ${label(opponent)}</b><p>${esc(describe(game,1,opponent))}</p>`;
 return '<b>You commit first · initiative</b><p>Your action is shown before the opponent responds. Initiative breaks mutual knockouts.</p>';
}
function card(id){const invalid=available(game,0,id),disabled=busy||actorToMove(game)!==0||invalid;
 return `<button class="action ${selected===id?'selected':''}" data-action="${id}" ${disabled?'disabled':''}><b>${label(id)}</b><small>${SPELLS[id]?cost(game,0,id)+' mana':'No mana cost'}</small></button>`;}
function choices(){
 return `<div class="tabs"><button data-section="basic" class="${section==='basic'?'active':''}">Basics</button><button data-section="spells" class="${section==='spells'?'active':''}">Spells</button></div><div class="action-grid">${(section==='basic'?['strike','guard','reclaim']:Object.keys(game.actors[0].kit.spells)).map(card).join('')}</div><div class="commit-bar"><div class="preview">${selected?`<b>${label(selected)} · ${cost(game,0,selected)} mana</b><p>${esc(describe(game,0,selected))}</p>`:'Choose a basic action or cast a spell.'}</div><button id="commit" class="primary" ${!selected||busy||actorToMove(game)!==0?'disabled':''}>${SPELLS[selected]?'Cast':'Commit'}</button></div>`;
}
function result(){const r=game.result;return `<div class="result ${r.outcome}"><h2>${r.outcome.toUpperCase()}</h2><p>${r.reason}${r.tiebreak?' · telegraphed initiative wins':''}</p><div class="net-costs">${COMBAT_RESOURCES.map(k=>`${k}: −${fmt(game.settlement[0][k].netLoss)}`).join(' · ')}</div><p class="fine">Residual flux was collected; rebates applied only to the remaining loss.</p><button id="replay" class="primary">Replay same setup</button><button id="carry" ${game.config.healthModel==='direct'&&game.actors[0].resources.health<=0?'disabled':''}>Next bout · carry balances</button><button id="export">Export log</button></div>`;}
function debug(){return `<div class="debug"><h3>Search and exchange journal</h3><p>Decisions ${stats.length}; deepest completed ${Math.max(0,...stats.map(a=>a.completedDepth))}; slowest ${Math.max(0,...stats.map(a=>a.elapsedMs)).toFixed(1)} ms; accepted weaker choices ${stats.filter(a=>a.degraded).length} / ${stats.length}.</p><details><summary>Kits and ledgers</summary><pre>${esc(JSON.stringify({kits:game.actors.map(a=>a.kit),settlement:game.settlement},null,2))}</pre></details>${history.slice().reverse().map(r=>`<details open><summary>Exchange ${r.round}: ${r.pair.map(label).join(' / ')}</summary><ul>${r.events.map(e=>`<li>${esc(e)}</li>`).join('')}</ul></details>`).join('')}</div>`;}
function render(){if(!game)return;document.body.classList.add('playing');document.body.classList.toggle('setup-open',view==='setup');document.body.classList.toggle('debug-open',view==='debug');
 $('play').innerHTML=`<nav><b>Combat · ${game.result?'Complete':'Exchange '+game.round+'/8'}</b><button data-view="setup">Setup</button><button data-view="play">Play</button><button data-view="debug">Debug</button></nav><div class="play-stage"><div class="intent">${game.result?'Encounter settled.':intent()}</div>${actors()}${forecasts()}${game.result?result():choices()}${!game.result?'<button id="leave" class="leave">Leave encounter</button>':''}</div>${debug()}`;
 for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>{view=b.dataset.view;render();window.scrollTo(0,0);};for(const b of document.querySelectorAll('[data-section]'))b.onclick=()=>{section=b.dataset.section;render();};for(const b of document.querySelectorAll('[data-action]'))b.onclick=()=>{selected=b.dataset.action;render();};
 if($('commit'))$('commit').onclick=()=>{try{submit(selected);pump();}catch(e){$('setup-error').textContent=e.message;}};
 if($('leave'))$('leave').onclick=()=>{token++;busy=false;finish(game,'lose','voluntary exit');render();};
 if($('replay'))$('replay').onclick=()=>start(game.config);
 if($('carry'))$('carry').onclick=()=>start({...game.config,playerResources:{...game.actors[0].resources},opponentResources:undefined});
 if($('export'))$('export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({rulesVersion:RULES_VERSION,config:game.config,kits:game.actors.map(a=>a.kit),history,stats,result:game.result,settlement:game.settlement},null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='lumenhold-v02-'+Date.now()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
}
const params=new URLSearchParams(location.search);if(params.has('quickstart')){const n=Number(params.get('quickstart'));if([20,50,80].includes(n)){$('player-level').value=n;setup();start();}}
}
