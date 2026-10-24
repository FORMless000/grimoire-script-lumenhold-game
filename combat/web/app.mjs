import {SPELL_ICONS,ACTION_ICONS,PORTRAITS,flavorLine,finishLines,resolvedLines,isCompelled,compelledLine,fighterNames,createState,applyChoice,actorToMove,legalActions,available,cost,describe,describeData,renderText,label,concede,hpCost,has,expandAI,RULES_VERSION,SPELLS,LOADOUTS,SPECIAL_LOADOUTS,NAMED_LOADOUTS,fixedLoadoutLevel,CONTEXTS,EVENTS,FOES,POOLS,fightSetting,levelRng,generateLoadout,COMBAT_TUNING,settle,GAME_TEXT,WORN_ITEMS,GAME_NPCS,chooseAIAction,searchAction,createSearchContext,searchPositionKey,probeSearchCache,cloneState,analyzePosition} from './engine.mjs';
import {brief} from './brief.mjs';
import {portrait,BLANK} from './art.mjs';
// The same served module supplies a worker, preserving the existing localhost server.
if(typeof document==='undefined'){
  self.onmessage=e=>{try{if(e.data.type==='analyze')analyze(e.data);else self.postMessage({token:e.data.token,decision:chooseAIAction(e.data.state,e.data.options)});}catch(error){self.postMessage({token:e.data.token,error:error.message});}};
}
// Player analysis (web/analysis.mjs): every root move scored, streamed after each completed depth.
function analyze({token,state,budgetMs,maxDepth}){
  analyzePosition(state,{budgetMs,maxDepth,onDepth:analysis=>self.postMessage({token,analysis})});
  self.postMessage({token,done:true});
}
if(typeof document!=='undefined'){
const $=id=>document.getElementById(id),esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),fmt=n=>Number.isInteger(n)?n:Math.abs(n-Math.round(n))<.05?Math.round(n):n.toFixed(1);
const store={get:(k,d)=>{try{const v=localStorage.getItem(k);return v===null?d:v;}catch{return d;}},set:(k,v)=>{try{localStorage.setItem(k,v);}catch{}}};
let names=['you','the opponent'],game=null,setting={},selected=null,view='play',busy=false,history=[],stats=[],token=0,moves=0,bars={},seen={},sheet=null,focusEx=null;
let analysis=null,analysisToken=0,analysisFor=-1,analysisRunning=false,engineBudget=Number(store.get('engineBudget',1500))||1500,engineOn=store.get('engineOn','0')==='1';
// Which pieces of the main game's screen to imitate around the fight (stubs, for judging the look in context).
const chrome=Object.fromEntries(['top','meters','side','card'].map(k=>[k,store.get('chrome.'+k,'1')==='1']));
const QUESTION='<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="32" cy="32" r="26"/><path d="M24 25a8 8 0 1 1 11 7.4c-2 .9-3 2.4-3 4.6v2"/><path d="M32 46v1"/></svg>';
const EYE='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const worker=new Worker(new URL('app.mjs?worker=1',import.meta.url),{type:'module'});
function makeAnalyst(){const w=new Worker(new URL('app.mjs?worker=analysis',import.meta.url),{type:'module'});w.onmessage=onAnalysis;w.onerror=e=>{analysisRunning=false;$('setup-error').textContent='Engine: '+e.message;};return w;}
let analyst=null;
const COMBAT_RESOURCES=['health','mana','crowns','renown','alignment'];

// ---- Setup (the bench's side panel) ----
// The main game's English UI text (src/i18n.js, fight.* and kit.slot.*, read by tools/build.mjs), with the bench's own as fallback.
const gt=(k,v={},fallback=k)=>Object.entries(v).reduce((t,[a,b])=>t.replaceAll('{'+a+'}',b),GAME_TEXT[k]??fallback);
// Special foes split as the main game sees them: creatures (race, "it", no healing) and humans outside the classes.
const pick=f=>Object.fromEntries(Object.entries(SPECIAL_LOADOUTS).filter(([,d])=>f(d)));
for(const id of ['player-loadout','opponent-loadout'])for(const [group,items]of Object.entries({General:LOADOUTS,Characters:NAMED_LOADOUTS,Creatures:pick(d=>d.creature),'Special foes':pick(d=>!d.creature)}))$(id).insertAdjacentHTML('beforeend',`<optgroup label="${group}">${Object.keys(items).map(name=>`<option>${esc(name)}</option>`).join('')}</optgroup>`);
// The pools generic foes are drawn from (POOLS in setup/foes.mjs); the encounter seed picks one, as a card's seed does.
$('opponent-loadout').insertAdjacentHTML('beforeend',`<optgroup label="Pools · the encounter seed picks">${Object.entries(POOLS).map(([k,v])=>`<option value="pool:${k}" title="${esc(v.join(', '))}">Pool · ${k}</option>`).join('')}</optgroup>`);
// Every played combat card (EVENTS): picking one sets the foe and the setting as the main game's bridge (src/combat.js) does.
const at=(v,i=0)=>Array.isArray(v)?v[i]:v;
$('card').insertAdjacentHTML('beforeend',Object.entries(EVENTS).filter(([,e])=>e.play).map(([k,e])=>`<option value="${esc(k)}">${esc(k)} · ${esc([e.play].flat().join(' / '))}</option>`).join(''));
// A card's foe: the first it names (the main game picks among several by who you've met or the card's text).
function cardFoe(key){const e=EVENTS[key];if(!e?.play)return null;const id=[e.play].flat()[0];return {id,...FOES[id]};}
function applyCard(){
 const key=$('card').value,e=EVENTS[key],note=$('card-note');note.hidden=!e;if(!e)return;
 const f=cardFoe(key),st=fightSetting(key,0,f.id),foes=[e.play].flat();
 if(f.pool)$('opponent-loadout').value='pool:'+f.pool;else if(f.loadout&&!f.loadout.startsWith('('))$('opponent-loadout').value=f.loadout;
 $('context').value=st.context??f.context??'practice_duel';setRebates();
 $('observers').checked=st.observers??false;$('witnesses').value=(st.witnesses??true)?'1':'0';
 $('first-leader').value=String(at(e.firstLeader)??1);
 note.textContent=[foes.length>1?`The card picks among ${foes.join(', ')}; the bench plays ${f.id}.`:'',f.id==='peer'?'The peer present: pick the character above.':'',e.setup??'',
  e.tutorial?'A lesson: a coach mark each exchange; nothing is at stake.':at(e.stakes)==='none'?'Nothing at stake: "Walk away" costs nothing.':'',
  at(e.foeCommitsFirst)?`The foe commits first, in the open, for ${at(e.foeCommitsFirst)} exchanges.`:'',f.persona?'Its own persona: '+Object.entries(f.persona).map(([k,v])=>k+' '+v).join(', ')+'.':''].filter(Boolean).join(' ');
 note.hidden=!note.textContent;setup();
}
// The worn kit (content/world/items.grim, read by tools/build.mjs): one item a slot, summed as the main game's Engine#wornMods.
const SLOTS=['wand','robe','trinket'];
const wornText=w=>[w.hp?`HP +${w.hp}`:'',w.mana?`Mana +${w.mana}`:'',...Object.entries(w.cost??{}).map(([k,n])=>`${k} costs ${n>0?'+':'−'}${Math.abs(n)}`),...Object.entries(w.onCast??{}).map(([k,n])=>`${k} casts deal +${n}`),w.onDefend?`blocked blows shock ${w.onDefend}`:'',...(w.taken??[]).map(t=>`−${t.n} from ${t.from.join('/')}`)].filter(Boolean).join(', ');
$('worn').innerHTML=Object.keys(WORN_ITEMS).length?SLOTS.map(slot=>`<label>Worn ${esc(gt('kit.slot.'+slot,{},slot).toLowerCase())}<select data-worn="${slot}"><option value="">Nothing with an effect</option>${Object.entries(WORN_ITEMS).filter(([,d])=>d.slot===slot&&d.worn).map(([id,d])=>`<option value="${id}">${esc(d.name)} · ${esc(wornText(d.worn))}</option>`).join('')}</select></label>`).join(''):'<p class="fine">No worn items: the bench was built without the main game\'s content.</p>';
function wornMods(){
 const m={hp:0,mana:0,cost:{},onCast:{},onDefend:0,taken:[]};let any=false;
 for(const sel of document.querySelectorAll('[data-worn]')){const w=WORN_ITEMS[sel.value]?.worn;if(!w)continue;any=true;
  m.hp+=w.hp||0;m.mana+=w.mana||0;m.onDefend+=w.onDefend||0;
  for(const [k,v]of Object.entries(w.cost??{}))m.cost[k]=(m.cost[k]||0)+v;for(const [k,v]of Object.entries(w.onCast??{}))m.onCast[k]=(m.onCast[k]||0)+v;
  for(const t of w.taken??[])m.taken.push({n:t.n,from:[...t.from]});}
 return any?m:null;
}
$('rebates').innerHTML=['health','mana'].map(k=>`<label>${k} rebate %<input data-rebate="${k}" type="number" min="0" max="100"></label>`).join('');
function setRebates(){for(const input of document.querySelectorAll('[data-rebate]'))input.value=CONTEXTS[$('context').value][input.dataset.rebate]*100;}
function setup(){
 const player=$('player-loadout').value,chosen=$('opponent-loadout').value,opponent=chosen.startsWith('pool:')?'':chosen||player,pFixed=fixedLoadoutLevel(player),oFixed=opponent?fixedLoadoutLevel(opponent):null;
 if(pFixed)$('player-level').value=pFixed;if(oFixed&&oFixed!==Number($('player-level').value))$('match-level').checked=false;$('player-level').disabled=!!pFixed;
 if($('match-level').checked)$('opponent-level').value=$('player-level').value;if(oFixed)$('opponent-level').value=oFixed;
 $('opponent-level').disabled=$('match-level').checked||!!oFixed;$('match-level').disabled=!!oFixed;
 for(const b of document.querySelectorAll('[data-level]')){b.disabled=!!pFixed;b.classList.toggle('active',b.dataset.level===$('player-level').value);}
 for(const [side,name]of [['player',player],['opponent',opponent]]){const growing=!!NAMED_LOADOUTS[name]&&!fixedLoadoutLevel(name)&&name!=='The man in grey';$(side+'-year-label').hidden=!growing||side==='opponent'&&!$('opponent-loadout').value;$(side+'-ilse-label').hidden=name!=='Ilse'||side==='opponent'&&!$('opponent-loadout').value;}
 // A creature wears nothing; the witnesses follow the observers when a crowd watches (an audience always is one).
 for(const sel of document.querySelectorAll('[data-worn]'))sel.disabled=!!SPECIAL_LOADOUTS[player]?.creature;
 $('witnesses').disabled=$('observers').checked;
 $('begin').textContent=`Begin combat · level ${$('player-level').value} →`;
}
for(const b of document.querySelectorAll('[data-level]'))b.onclick=()=>{$('player-level').value=b.dataset.level;setup();};
$('player-loadout').onchange=setup;$('opponent-loadout').onchange=()=>{$('card').value='';applyCard();setup();};$('card').onchange=applyCard;$('player-level').oninput=setup;$('match-level').onchange=setup;$('context').onchange=setRebates;$('observers').onchange=setup;
for(const box of document.querySelectorAll('[data-chrome]')){box.checked=chrome[box.dataset.chrome];box.onchange=()=>{chrome[box.dataset.chrome]=box.checked;store.set('chrome.'+box.dataset.chrome,box.checked?'1':'0');render();};}
// The opponent (F5.9b): a fixed depth-5 search with no seeded mistakes; the difficulty preset is its only knob.
const LIVE_AI={maxDepth:5,nodeBudget:3e6,mistakeChance:0};
// The opponent's AI for a preset, with the card's own persona when its foe has one (FOES persona), as the main game sets it.
const foeAI=(preset,seed,card)=>{const persona=card?cardFoe(card)?.persona:null;return {...LIVE_AI,seed,preset,...(persona?{persona}:{})};};
const num=id=>$(id).value===''?undefined:Number($(id).value);
function config(){const same=!$('opponent-loadout').value,card=$('card').value||undefined,encounterSeed=$('encounter-seed').value===''?crypto.getRandomValues(new Uint32Array(1))[0]:Number($('encounter-seed').value);
 let opponentLoadout=$('opponent-loadout').value||$('player-loadout').value;
 if(opponentLoadout.startsWith('pool:')){const pool=POOLS[opponentLoadout.slice(5)];opponentLoadout=pool[Math.floor(levelRng(encounterSeed%1e9)()*pool.length)];}
 const c={playerYear:Number($('player-year').value),opponentYear:Number($(same?'player-year':'opponent-year').value),playerIlseTaken:$('player-ilse-taken').checked,opponentIlseTaken:$(same?'player-ilse-taken':'opponent-ilse-taken').checked,encounterSeed,damageMultiplier:Number($('damage-multiplier').value),mode:'combat',ai:[null,foeAI($('ai-difficulty').value,Number($('ai-seed').value),card)],playerLoadout:$('player-loadout').value,opponentLoadout,playerLevel:Number($('player-level').value),opponentLevel:Number($('opponent-level').value),firstLeader:Number($('first-leader').value),healthModel:$('health-model').value,resourceBudget:$('budget').value,spellAccess:$('all-spells').checked?'all':'kit',manaCostScale:Number($('mana-scale').value),observers:$('observers').checked,opponentResources:$('opponent-crowns').value===''?undefined:{crowns:Number($('opponent-crowns').value)},context:$('context').value,rebates:Object.fromEntries([...document.querySelectorAll('[data-rebate]')].map(i=>[i.dataset.rebate,Number(i.value)/100])),...(card?{card}:{})};
 if(!c.observers&&$('witnesses').value!=='')c.witnesses=$('witnesses').value==='1';
 // Entering from the main game (setup/campaign.mjs fightOptions): Health and Mana set the condition, the rest the purse.
 const kit=generateLoadout(c.playerLoadout,c.playerLevel,c.spellAccess,{year:c.playerYear,ilseTaken:c.playerIlseTaken}),mods=SPECIAL_LOADOUTS[c.playerLoadout]?.creature?null:wornMods();
 const health=num('entry-health'),mana=num('entry-mana'),purse=Object.fromEntries([['mood','entry-mood'],['renown','entry-renown'],['crowns','player-crowns'],['alignment','entry-alignment']].map(([k,id])=>[k,num(id)]).filter(([,v])=>v!==undefined));
 if(Object.keys(purse).length)c.playerResources=purse;
 if(health!==undefined||mana!==undefined)c.playerCondition={health:Math.min(1,(health??COMBAT_TUNING.condition.healthFull)/COMBAT_TUNING.condition.healthFull),mana:Math.min(1,(mana??kit.capacity)/kit.capacity)};
 // The worn kit: the player's kit as the main game hands it over (its skills and spells, no class), with the items' modifiers.
 if(mods)c.playerKit={skills:kit.skills,spells:Object.fromEntries(Object.entries(kit.spells).filter(([id])=>SPELLS[id].castable!==false)),level:kit.level,mods};
 c.mainGame={health:health??null,mana:mana??null,maxMana:kit.capacity};
 return c;}
// Names in the fight text, as the main game gives them: a character by their short name and pronouns (content/world/cast.grim),
// a special foe as its card's foe (FOES) calls it, anyone else by their loadout.
function opponentNames(c){
 const l=game.actors[1].kit.loadout,n=GAME_NPCS[NAMED_LOADOUTS[l]?.npc];
 if(n)return fighterNames({opponentName:n.short??String(n.name).split(/[\s·]+/)[0],opponentLoadout:l,opponentPronouns:n.pronouns});
 const f=c.card&&cardFoe(c.card)?.loadout===l?cardFoe(c.card):SPECIAL_LOADOUTS[l]?Object.values(FOES).find(f=>f.loadout===l):null;
 return fighterNames({opponentName:f?.name,opponentLoadout:l,opponentPronouns:f?.pronouns});
}
function start(c){try{c??=config();const seed=c.ai?.[1]?.seed;if(seed!==undefined&&(!Number.isInteger(seed)||seed<0||seed>4294967295))throw Error('Choose an integer AI seed from 0 to 4294967295');token++;busy=false;game=createState(c);
 // The card's lesson or free fight, and a foe that commits first in the open (rival_contest), as src/combat.js sets them.
 const e=c.card?EVENTS[c.card]:null,early=at(e?.foeCommitsFirst);if(early>0){game.earlyCommit[1]=early;game.leader=1;}
 // `tutorial` is the lesson's list of coach keys (combat/HANDOFF.md), not one value per challenge like the card's other fields.
 setting={tutorial:e?.tutorial?[].concat(e.tutorial):null,free:!!(e?.tutorial||at(e?.stakes)==='none'),left:null};
 names=opponentNames(c);history=[];stats=[];selected=null;moves++;bars={};seen={};analysis=null;sheet=null;focusEx=null;view='play';$('setup-error').textContent='';$('return').hidden=false;render();pump();window.scrollTo(0,0);}catch(e){$('setup-error').textContent=e.message;}}
$('begin').onclick=()=>start();$('return').onclick=()=>{view='play';render();};setRebates();setup();

// ---- Playing ----
function submit(id,ai){const channels=game.actors.map(a=>a.channel?.id),mover=actorToMove(game),commits=game.pending.map((p,i)=>i===mover?id:p),descs=commits.map((c,i)=>{try{return c?describe(game,i,c):'';}catch{return '';}}),before=structuredClone(game),r=applyChoice(game,id);moves++;if(ai)stats.push({round:r.round??game.round,side:1,...ai});if(r.resolved){r.pair.forEach((id,i)=>{if(r.committed?.[i]!==id&&!['hold','release','cancel','frozen'].includes(id)){try{descs[i]=describe(game,i,id);}catch{}}});   // a compelled side: describe what it actually did
 const actionNames=r.pair.map((id,i)=>['hold','release'].includes(id)?`${label(id)} ${sideLabel(channels[i],i)}`:sideLabel(id,i));history.push({...r,channels,descs,lines:resolvedLines(before,game,{...r,channels,actionNames},names),finish:finishLines(before,game,r.pair,r.round,names),actionNames,hp:game.actors.map(a=>a.hp),ready:game.actors.map(a=>a.resources.mana),flux:game.actors.map(a=>a.flux)});focusEx=null;}selected=null;render();}
function pump(){if(!game||game.result||actorToMove(game)!==1)return;
 const actions=legalActions(game);if(actions.length===1){submit(actions[0]);pump();return;}
 busy=true;render();const current=++token;worker.postMessage({token:current,state:game,options:{}});
}
worker.onmessage=e=>{if(e.data.token!==token)return;busy=false;if(e.data.error){$('setup-error').textContent=e.data.error;render();return;}submit(e.data.decision.id,e.data.decision);pump();};
worker.onerror=e=>{busy=false;$('setup-error').textContent=e.message;render();};

// ---- Pieces ----
// Haste composes the same basic icons; Hold/Release use the active spell motif.
function actionIcon(id,side=0,channel=game.actors[side].channel?.id){
 if(id.startsWith('bundle:'))return `<span class="bundle-icons">${id.slice(7).split('+').map(p=>ACTION_ICONS[p]).join('')}</span>`;
 const key=['hold','release'].includes(id)?channel+'_'+id:id;
 return SPELL_ICONS[id]??ACTION_ICONS[key]??(SPELLS[id]?.physical?ACTION_ICONS.strike:id==='frozen'?'<b class="glyph">❄</b>':id==='cancel'?'<b class="glyph">∅</b>':QUESTION);
}
// A creature's own name for a base rule (kit.labels: {shadowstep: 'skitter'}, world expansion 1), as the main game shows it.
const labelsOf=side=>game.actors[side].kit?.labels??null;
const sideLabel=(id,side)=>{const al=labelsOf(side)?.[id];return al?SPELLS[al]?.name??label(al):label(id);};
const actionName=(id,side)=>['hold','release'].includes(id)?`${label(id)} ${sideLabel(game.actors[side].channel?.id??'',side)}`:sideLabel(id,side);
// Blows on their way (F5.11): the foe's Omens and delayed blows (a creature's Maul, Charge, …), cast in the open. Each says
// when it lands, how hard, and what stops it (the spell's own description), so the player can answer it in time.
// A blow with a spell part and an Impact part (The Long Wait) queues two omens: one line, its total and its split.
function incoming(){
 const os=[];for(const o of game.actors[1].omens.filter(o=>o.due>=game.round).sort((a,b)=>a.due-b.due)){const g=os.find(x=>x.id===(o.id??'omen')&&x.due===o.due);if(g)g.parts.push(o);else os.push({id:o.id??'omen',due:o.due,parts:[o]});}
 if(!os.length)return '';
 return os.map(o=>{const id=o.id,now=o.due===game.round,n=Math.round(o.parts.reduce((a,p)=>a+p.power,0)),d=describeData(game,1,id),stops=d?.stops?renderText(d.stops):id==='omen'?describe(game,1,id):'';
  const split=o.parts.length>1?' '+gt('fight.incomingSplit',{parts:o.parts.map(p=>`<span class="split-${p.impact?'impact':'spell'}">${Math.round(p.power)} ${p.impact?'Impact':'spell'}</span>`).join(' + ')},'({parts})'):'';
  const k=o.due-game.round,when=k===1?gt('fight.whenNext',{},'next exchange'):gt('fight.whenIn',{k},'in {k} exchanges');
  const head=(now?gt('fight.incomingNow',{move:label(id),n},'{move} lands this exchange: {n} damage before defences.'):gt('fight.incomingLater',{move:label(id),n,ex:o.due,when},'{move} lands {when} (exchange {ex}): {n} damage before defences.'));
  return `<div class="intent incoming${now?' now':''}"><span class="tele-icon">${actionIcon(id,1)}</span><div class="it"><b>${esc(head)}${split}</b>${stops?`<small>${esc(stops)}</small>`:''}</div></div>`;}).join('');
}
const briefOf=(side,id)=>{let d=null;try{d=describeData(game,side,id);}catch{}return brief(id,d,game.actors[side].channel?.id);};
// same: the label repeats the action's name, which the button already shows (hidden there unless the name is).
const effHtml=(b,name)=>{const v=b.value!==''&&b.value!==null&&b.value!==undefined;return `<span class="eff k-${b.kind}${v?' has-v':''}">${v?`<b>${esc(b.value)}</b>`:''}${b.label?`<small class="lbl${name&&name.toLowerCase()===b.label.toLowerCase()?' same':''}">${esc(b.label)}</small>`:''}${b.turns?`<small class="t">${b.turns}t</small>`:''}</span>`;};
function price(side,id){const h=hpCost(game,side,id),m=has(game,side,'heartprice')?0:cost(game,side,id);return [m?fmt(m)+' Mana':'',h?fmt(h)+' HP':''].filter(Boolean).join(' + ')||'Free';}
const costHtml=(side,id)=>{const h=hpCost(game,side,id),m=has(game,side,'heartprice')?0:cost(game,side,id);return `<span class="a-cost">${m?`<b class="c-mana" aria-label="${fmt(m)} Mana">${fmt(m)}</b>`:''}${h?`<b class="c-hp" aria-label="${fmt(h)} HP">${fmt(h)}</b>`:''}</span>`;};
const npcOf=a=>NAMED_LOADOUTS[a.kit.loadout]?.npc;
const nameOf=i=>i===0?'You':NAMED_LOADOUTS[game.actors[1].kit.loadout]?game.actors[1].kit.loadout:game.actors[1].kit.loadout==='custom'?'Opponent':game.actors[1].kit.loadout;
const portraitOf=i=>{const a=game.actors[i];return i===0?BLANK:portrait({npc:npcOf(a),loadout:a.kit.loadout,creature:!!SPECIAL_LOADOUTS[a.kit.loadout],underground:a.kit.underground,portraits:PORTRAITS});};

// Horizontal bars: layers start at their last shown width and move on the next frame (fill quickly, the pale trail after
// a delay), so a re-render mid-animation doesn't snap. A changed value floats its difference above the number.
function layer(cls,key,to,left){const from=bars[key]??to,fromLeft=bars[key+'@']??left;return `<i class="${cls}" data-bar="${key}" data-to="${to}"${left!==undefined?` data-left="${left}"`:''} style="width:${from}%${left!==undefined?`;left:${fromLeft}%`:''}"></i>`;}
function bar(side,kind,value,max,flux=0,shield=0){
 const k=side+kind,pct=v=>Math.max(0,Math.min(100,100*v/max)),now=pct(value),fluxShown=Math.min(flux,Math.max(0,max-value)),prev=seen[k];
 let delta='';if(prev&&prev.v!==value&&prev.at!==moves){seen[k]={v:value,at:moves,d:value-prev.v,fresh:true};}else if(!prev)seen[k]={v:value,at:-1,d:0};
 // A change animates on the first render that shows it only: re-renders (a click on the track, a sheet) don't replay it.
 const s=seen[k],fresh=s.fresh;s.fresh=false;if(fresh&&Math.abs(s.d)>=.5)delta=`<span class="delta ${s.d<0?'neg':'pos'}">${s.d<0?'−':'+'}${fmt(Math.abs(s.d))}</span>`;
 return `<div class="bar ${kind} ${fresh&&s.d?s.d<0?'drop':'rise':''}" title="${kind==='hp'?'HP':'Mana'} ${fmt(value)} / ${fmt(max)}${kind==='mana'?` · flux ${fmt(flux)}: Refocus restores up to ${fmt(Math.min(flux,max-value))}`:''}">
  <span class="bnum"><span class="bk">${kind==='hp'?'♥':'✦'}</span>${Math.round(value)}<small>/${Math.round(max)}</small>${delta}</span>
  <span class="btrack">${layer('trail',k+'trail',now)}${kind==='mana'?layer('flux',k+'flux',pct(fluxShown),now):''}${layer('fill',k+'fill',now)}${kind==='hp'?layer('shield',k+'shield',pct(shield),Math.max(0,Math.min(now,100-pct(shield)))):''}</span>
  ${kind==='mana'?`<span class="bflux${flux>0?'':' none'}" title="Flux: Refocus turns it back into Mana">↻${fmt(flux)}</span>`:`<span class="bshield${shield>0?'':' none'}" title="Shield: absorbs damage before HP">${shield>0?'◈'+Math.round(shield):''}</span>`}</div>`;
}
function snapshotBars(){for(const el of document.querySelectorAll('[data-bar]')){const t=el.parentElement.clientWidth;if(!t)continue;bars[el.dataset.bar]=100*el.offsetWidth/t;if(el.dataset.left!==undefined)bars[el.dataset.bar+'@']=100*el.offsetLeft/t;}}
function animateBars(){requestAnimationFrame(()=>requestAnimationFrame(()=>{for(const el of document.querySelectorAll('[data-bar]')){el.style.width=el.dataset.to+'%';bars[el.dataset.bar]=Number(el.dataset.to);if(el.dataset.left!==undefined){el.style.left=el.dataset.left+'%';bars[el.dataset.bar+'@']=Number(el.dataset.left);}}}));}

// Constructs standing for a side, each with the HP it has left before it breaks.
const constructChips=(a,i)=>a.constructs.map(c=>{const left=Math.round(Math.max(0,c.threshold-c.taken));return `<span class="cx" title="${esc(sideLabel(c.id,i))}: ${left} of ${Math.round(c.threshold)} HP left, until exchange ${c.expires}"><span class="mini-icon">${actionIcon(c.id,i)}</span>♥${left}</span>`;}).join('');
function fighter(i){const a=game.actors[i],purse=[game.config.observers?`★${fmt(a.resources.renown)}${a.pendingRenown?`<em>+${fmt(a.pendingRenown)}</em>`:''}`:'',a.resources.crowns!==a.entry.crowns?`◎${fmt(a.resources.crowns)}`:'',a.resources.alignment!==a.entry.alignment?`☾${fmt(a.resources.alignment)}`:''].filter(Boolean).join(' ');
 return `<article class="fighter ${i?'opp':'you'}"${i?' data-sheet="inspect" role="button" tabindex="0" title="Inspect the opponent"':''}>
  <div class="pf${i?'':' blank'}">${portraitOf(i)}${i?`<span class="pf-eye">${EYE}</span>`:''}</div>
  <div class="fi"><div class="fname"><b>${esc(nameOf(i))}</b><small>${i&&game.actors[1].kit.loadout==='custom'?'':'Lv '+a.kit.level}${purse?' · '+purse:''}</small>${constructChips(a,i)}</div>
  ${bar(i,'hp',a.hp,a.maxHP,0,0)}${bar(i,'mana',a.resources.mana,a.kit.capacity,a.flux)}</div></article>`;}

function intent(){
 if(game.result)return '';
 return incoming()+move();
}
function move(){
 const opponent=game.pending[1],forced=isCompelled(game,1)?(opponent??legalActions(game,1)[0]):null,shown=forced??opponent;
 if(busy)return `<div class="intent wait"><span class="tele-icon hidden-move">${QUESTION}</span><div class="it"><b>${esc(nameOf(1))} is choosing…</b><small>Their move appears when they commit.</small></div></div>`;
 if(shown){const b=briefOf(1,shown),fl=forced?compelledLine(sideLabel(shown,1),{names,side:1}):flavorLine(shown,{channel:game.actors[1].channel?.id,round:game.round,names,side:1,labels:labelsOf(1)});
  return `<div class="intent shown${forced?' forced':''}" data-sheet="intent" role="button" tabindex="0" title="What their move does"><span class="tele-icon">${actionIcon(shown,1)}</span><div class="it"><b>${forced?'Compelled: ':'They commit: '}${esc(actionName(shown,1))} ${effHtml(b)}</b>${fl?`<small class="flavor">${esc(fl)}</small>`:''}</div><span class="it-more">${EYE}</span></div>`;}
 return `<div class="intent hidden"><span class="tele-icon hidden-move">${QUESTION}</span><div class="it"><b>You commit first</b><small title="Initiative breaks a double knockout.">Their reply stays hidden until you do.</small></div></div>`;
}

// The exchange track: one axis through the past (both moves, as icons), this exchange and the next few (who commits first,
// so whether their move will show) with every lasting effect, channel, construct and foretold hit as a bar along it.
// Bound and poison sit on the foe too (setup/flavor.mjs EFFECT_ON_FOE); the main game's track still lists only the first two.
const AHEAD=4,CAST_ON_FOE=new Set(['compelled','torment','bound','poison']),EFFECT_ICON={compelled:'compel',guard:'guard',frozen:'frozen'};
// Who commits first c exchanges from now, as things stand: turns alternate and Foresight makes its target lead.
function leaderAt(c){if(!c)return game.leader;const e=game.earlyCommit.map(n=>n-c>0),normal=c%2?1-game.normalLeader:game.normalLeader;return e[0]===e[1]?normal:e[0]?0:1;}
// The exchange a side last cast this spell: where its line starts, so a line stays put as exchanges pass.
const castAt=(side,id)=>history.findLast(h=>h.pair[side]===id)?.round;
// The spell behind a Bind or a poison on `side`: the caster's (or, reflected, its own) bind or poison spell cast last.
function appliedBy(k,side){const prop=k==='bound'?'bind':'poison';let best=null,at=-Infinity;
 for(const s of [1-side,side])for(const id of Object.keys(game.actors[s].kit.spells))if(SPELLS[id]?.[prop]){const c=castAt(s,id)??-1;if(c>at){best={id,side:s};at=c;}}
 return best;}
function effectRows(){
 const r=game.round,rows=[];
 game.actors.forEach((a,side)=>{
  // Every line is a spell's duration in its caster's colour: Compel, Torment and Foresight sit on the other side.
  for(const [k,e]of Object.entries(a.effects)){if(e.until!==null&&e.until<r)continue;
   // A Lodestar is forecast like a blow on its way: its icon and its heal, in green, on the exchange it matures.
   if(k==='lodestar'){rows.push({side,icon:'lodestar',name:label('lodestar'),due:e.from,heal:true,note:'+'+Math.round(e.value),tip:`matures: all damage negated, then heals ${Math.round(e.value)}`});continue;}
   const by=k==='bound'||k==='poison'?appliedBy(k,side):null;
   if(by){rows.push({side:by.side,icon:by.id,name:sideLabel(by.id,by.side),on:by.side===side?null:side,from:e.from??e.born??r,until:e.until??Infinity,note:k==='bound'?'bound: Breaking Free':`${fmt(e.value)} a tick`});continue;}
   const on=CAST_ON_FOE.has(k);rows.push({side:on?1-side:side,icon:EFFECT_ICON[k]??k,name:k==='compelled'?label('compel'):sideLabel(k,on?1-side:side),on:on?side:null,from:e.from??e.born??r,until:e.until??Infinity,note:k==='tailwind'?`chain ${Math.round(e.value)}`:k==='compelled'&&a.compelAction?sideLabel(a.compelAction,side):''});}
  if(a.channel)rows.push({side,icon:a.channel.id,name:sideLabel(a.channel.id,side),from:castAt(side,a.channel.id)??r,until:Infinity,note:`${a.channel.holds} hold${a.channel.holds===1?'':'s'}${a.channel.bank?' · '+Math.round(a.channel.bank)+' banked':''}${a.channel.id==='wildfire'?' · next burn '+2*(a.channel.holds+2):''}`});
  for(const c of a.constructs)rows.push({side,icon:c.id,name:sideLabel(c.id,side),from:castAt(side,c.id)??r,until:c.expires,note:`${Math.round(Math.max(0,c.threshold-c.taken))} of ${Math.round(c.threshold)} HP`});
  if(game.earlyCommit[side]>0)rows.push({side:1-side,on:side,icon:'foresight',name:label('foresight'),from:(castAt(1-side,'foresight')??r-1)+1,until:r+game.earlyCommit[side]-1,note:side?'they commit first':'you commit first'});
  if(a.freezeUntil>=r)rows.push({side,icon:'frozen',name:'Frozen',from:a.freezeUntil,until:a.freezeUntil,note:''});
  if(a.rimeReady)rows.push({side,icon:'rime',name:'Rime ready',from:castAt(side,'rime')??r,until:Infinity,note:''});
  for(const o of a.omens)rows.push({side,icon:o.id??'omen',name:label(o.id??'omen'),due:o.due,spell:!o.impact,note:fmt(o.power)+(o.impact?' Impact':' spell')});
 });
 return rows;
}
const who=i=>i?esc(nameOf(1)):'You';
// A future slot: lost to a freeze, forced by Bind (Breaking Free) or Compel (the captured move), or open; the leader's move
// shows first.
function futureSlot(side,c){
 const ex=game.round+c,a=game.actors[side],lead=leaderAt(c)===side,last=a.compelAction,comp=a.effects.compelled,bound=a.effects.bound;
 if(a.freezeUntil>=ex)return `<span class="slot lost" title="Exchange ${ex}: ${who(side)} ${side?'is':'are'} frozen">${actionIcon('frozen',side)}</span>`;
 if(bound&&bound.from<=ex&&bound.until!==null&&bound.until>=ex)return `<span class="slot forced${lead?' lead':''}" title="Exchange ${ex}: ${who(side)} ${side?'is':'are'} bound: Breaking Free">${actionIcon('break_free',side)}</span>`;
 if(comp&&comp.until!==null&&comp.until>=ex&&last){const lost=last==='cancel'||!!available(game,side,last);
  return `<span class="slot forced${lead?' lead':''}" title="${esc(gt(lost?'fight.slotCompelledLost':'fight.slotCompelled',{n:ex,action:sideLabel(last,side)}))}">${actionIcon(lost?'cancel':last,side)}</span>`;}
 if(side)return lead?`<span class="slot shows lead" title="Exchange ${ex}: they commit first, so you see their move">${EYE}</span>`:`<span class="slot hid" title="Exchange ${ex}: you commit first; their move stays hidden">?</span>`;
 return lead?`<span class="slot lead mine" title="Exchange ${ex}: you commit first and they see your move">1st</span>`:'<span class="slot open"></span>';
}
function nowSlot(side){
 if(side===0)return `<span class="slot now-you${leaderAt(0)===0?' lead':''}" id="tk-you-now" title="Your move this exchange">${selected?actionIcon(selected):leaderAt(0)===0?'1st':''}</span>`;
 const forced=isCompelled(game,1)?(game.pending[1]??legalActions(game,1)[0]):null,shown=forced??game.pending[1];
 if(busy)return '<span class="slot hid wait" title="They are choosing">…</span>';
 if(shown)return `<button class="slot shows lead${forced?' forced':''}" data-sheet="intent" title="${forced?'Compelled':'They commit'}: ${esc(actionName(shown,1))}">${actionIcon(shown,1)}</button>`;
 return '<span class="slot hid" title="Their move stays hidden until you commit">?</span>';
}
function track(){
 const r=game.round,shown=focusEx??history.length-1,rows=effectRows(),done=!!game.result;
 const pastCells=f=>history.map((h,k)=>`<span class="tk-c past${k===shown?' on':''}${k===history.length-1?' last':''}">${f(h,k)}</span>`).join('');
 const ahead=f=>done?'':Array.from({length:AHEAD+1},(_,c)=>`<span class="tk-c ${c?'fut':'now'}">${f(c)}</span>`).join('');
 const head=`<div class="tk-row tk-head"><span class="tk-l"></span>${pastCells((h,k)=>`<button data-ex="${k}" title="Exchange ${h.round}: show it in full">${h.round}</button>`)}${ahead(c=>`<b title="${c?'Exchange '+(r+c):'This exchange'}: ${leaderAt(c)?'they lead':'you lead'}">${r+c}</b>`)}</div>`;
 const moves=side=>`<div class="tk-row tk-act s${side}"><span class="tk-l"><span class="tk-who">${who(side)}</span></span>${pastCells((h,k)=>`<button class="mini-icon" data-ex="${k}" title="Exchange ${h.round}: ${who(side)} · ${esc(h.actionNames[side])}">${actionIcon(h.pair[side],side,h.channels?.[side])}</button>`)}${ahead(c=>c?futureSlot(side,c):nowSlot(side))}</div>`;
 // A lasting effect: a thin line from the exchange it starts, with its icon at the start; name and numbers on hover.
 const cell=(row,at)=>{const past=typeof at==='object',ex=past?at.round:r+at,c=past?-1:at,tip=esc(`${who(row.side)} · ${row.name}${row.on!=null?' on '+(row.on?nameOf(1):'you'):''}${row.note?' · '+row.note:''}`),ico=`<span class="tk-ico">${actionIcon(row.icon,row.side,row.icon)}</span>`;
  // Due past the window: shown in the last column, with an arrow and its exchange.
  if(row.due!==undefined&&!past&&c===AHEAD&&row.due>ex)return `<i class="tl-hit later${row.heal?' heal':row.spell?' spell':''}" title="${esc(`${who(row.side)} · ${row.name} · ${row.heal?row.tip:row.note+' damage'}, exchange ${row.due}`)}">${ico}${row.note}<small>›${row.due}</small></i>`;
  if(row.due!==undefined)return row.due===ex?(row.heal?`<i class="tl-hit heal" title="${esc(`${who(row.side)} · ${row.name} · ${row.tip}, exchange ${ex}`)}">${ico}${row.note}</i>`:`<i class="tl-hit${row.spell?' spell':''}" title="${tip} damage, lands in exchange ${ex}">${ico}${row.note}</i>`):'';
  if(ex<row.from||ex>row.until)return '';const first=ex===row.from,open=row.until===Infinity&&c===AHEAD;
  return `<i class="tl-on${first?' first':''}${ex===row.until||open?' last':''}${open?' open':''}" title="${tip}${row.until===Infinity?'':` · until exchange ${row.until}`}">${first?ico:''}</i>`;};
 const effects=done?'':rows.map(row=>`<div class="tk-row tk-eff s${row.side}"><span class="tk-l"></span>${pastCells(h=>cell(row,h))}${ahead(c=>cell(row,c))}</div>`).join('');
 const full=history[shown];
 return `<section class="track" aria-label="Exchanges: the past, this one and the next ones"><div class="tk-scroll" id="tk-scroll">${head}${moves(1)}${moves(0)}${effects}</div>${full?`<div class="hfull">${exchangeFull(full)}${focusEx!==null?'<button class="link" data-ex="latest">Back to the latest</button>':''}</div>`:''}</section>`;
}

// The exchange picked on the track (the latest by default), in full.
function exchangeFull(r){
 return `<article class="hx-full"><h4>Exchange ${r.round} <small>· ${r.leader===0?'you led':'they led'}</small></h4>${[r.leader,1-r.leader].map(i=>`<div class="hl ${i?'opp':'you'}"><span class="mini-icon">${actionIcon(r.pair[i],i,r.channels?.[i])}</span><p><b>${who(i)}</b> · ${esc(r.actionNames[i])}${r.committed[i]!==r.pair[i]?` <small>(committed ${esc(sideLabel(r.committed[i],i))})</small>`:''}${r.lines?.[i]?` <span class="flavor">${esc(r.lines[i])}</span>`:''}</p></div>`).join('')}${(r.finish??[]).map(f=>`<p class="flavor finish">${esc(f)}</p>`).join('')}</article>`;}

// A compelled turn that can't be paid is a cancel: legal, though `available` (a menu check) refuses it (as src/combat-ui.js).
const forcedLegal=id=>(id==='cancel'||id==='break_free')&&legalActions(game,0).includes(id);
// Their Compel, committed in the open (F5.11-plan.1): the move you pick now plays, then you must repeat it for three exchanges,
// unless Ward or Shadowstep keeps it off (or Reflect turns it back).
function incomingCompel(){
 if(game.pending[1]!=='compel'||actorToMove(game)!==0||has(game,0,'shadowstep'))return '';
 return gt('fight.compelSeize',{},'They cast Compel: the move you pick now you must repeat for the next three exchanges, unless Ward or Shadowstep keeps it off');
}
function actionButton(id){const reason=forcedLegal(id)?null:available(game,0,id),disabled=busy||actorToMove(game)!==0||reason,name=actionName(id,0),b=briefOf(0,id);
 return `<button class="act k-${b.kind}${selected===id?' selected':''}" data-action="${id}" aria-label="${esc(name+' · '+price(0,id)+(reason?' · '+reason:''))}" aria-pressed="${selected===id}" title="${esc(name+' · '+price(0,id)+(reason?' · '+reason:''))}" ${disabled?'disabled':''}><span class="a-ico" aria-hidden="true">${actionIcon(id)}</span>${id.startsWith('bundle:')?'':`<span class="a-name">${esc(['hold','release'].includes(id)?label(id):name)}</span>`}${effHtml(b,name)}${costHtml(0,id)}<em class="card-eval" data-eval="${id}"></em></button>`;}
function preview(){if(!selected)return `<div class="preview hint">${busy||actorToMove(game)!==0?'Waiting for the opponent…':'Pick an action to see what it does. Pick it again to act.'}</div><button id="commit" class="primary" disabled>Commit</button>`;
 return `<div class="preview"><b>${esc(actionName(selected,0))}</b> <span class="price">${price(0,selected)}</span><p>${esc(describe(game,0,selected))}</p></div><button id="commit" class="primary" ${busy||actorToMove(game)!==0?'disabled':''}>${SPELLS[selected]?`<span class="control-icon" aria-hidden="true">${ACTION_ICONS.cast}</span>Cast`:'Commit'}</button>`;}
function actions(){
 const a=game.actors[0],frozen=a.freezeUntil>=game.round,bound=!frozen&&has(game,0,'bound'),compelled=!frozen&&!bound&&isCompelled(game,0),forced=frozen||bound||compelled||a.channel;
 const ids=forced?legalActions(game,0):['strike','guard','reclaim',...Object.keys(a.kit.spells)];
 // Compelled: the only move is the captured one, or a lost turn when it can't be played (the core cancels it either way).
 const prev=a.compelAction&&a.compelAction!=='cancel'?a.compelAction:null;
 const haste=has(game,0,'haste')?gt('fight.haste',{},'Haste · a spell without damage of its own also throws an Impulse'):'';
 const state=frozen?'Frozen · you thaw after this exchange':bound?gt('fight.bound',{},'Bound · Breaking Free is your only move'):compelled?(ids[0]!=='cancel'?gt('fight.compelledYou',{action:actionName(ids[0],0)}):prev?gt('fight.compelledLost',{action:label(prev)}):gt('fight.compelledNone'))
  :a.channel?sideLabel(a.channel.id,0)+' · Hold or Release':incomingCompel()||haste;
 return `${state?`<div class="action-state">${esc(state)}</div>`:''}<div class="acts${forced?' forced':''}">${ids.map(actionButton).join('')}</div><div class="commit-bar">${preview()}</div>`;
}
function commit(id=selected){if(!id||busy||actorToMove(game)!==0||(!forcedLegal(id)&&available(game,0,id)))return;try{submit(id);pump();}catch(e){$('setup-error').textContent=e.message;}}
// Selection stays until execution or a different choice; there is no click timer.
function selectAction(id){selected=id;for(const b of document.querySelectorAll('[data-action]')){const active=b.dataset.action===id;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));}document.querySelector('.commit-bar').innerHTML=preview();const now=$('tk-you-now');if(now)now.innerHTML=actionIcon(id);$('commit').onclick=()=>commit();}

// ---- Sheets: inspect the opponent, their committed move, the full log ----
function inspectSheet(){const a=game.actors[1],forced=a.channel||a.freezeUntil>=game.round||has(game,1,'bound')||isCompelled(game,1);
 const ids=forced?legalActions(game,1):['strike','guard','reclaim',...Object.keys(a.kit.spells)],recent=history.slice(-6).reverse();
 const sk=['arcana','lore','alchemy','charm','vigor','guile'];
 return `<header class="sh-head"><div class="pf">${portraitOf(1)}</div><div><b>${esc(nameOf(1))}</b><small>${NAMED_LOADOUTS[a.kit.loadout]?'':esc(a.kit.loadout)+' · '}Level ${a.kit.level} · HP ${fmt(a.hp)}/${fmt(a.maxHP)} · Mana ${fmt(a.resources.mana)}/${a.kit.capacity}${a.flux?` (+${fmt(a.flux)} flux)`:''}</small></div><button class="close" data-close aria-label="Close">×</button></header>
  <div class="sk">${sk.map(k=>`<span><small>${k}</small><i style="--w:${a.kit.skills[k]}%"></i><b>${a.kit.skills[k]}</b></span>`).join('')}</div>
  <h4>What they can do${forced?' now':''}</h4><ul class="kit">${ids.map(id=>{const reason=available(game,1,id),b=briefOf(1,id);let d='';try{d=describe(game,1,id);}catch{}return `<li class="${reason?'off':''}"><span class="mini-icon">${actionIcon(id,1)}</span><div><b>${esc(actionName(id,1))}</b> ${effHtml(b)} <span class="price">${price(1,id)}</span>${reason?` <em>${esc(reason)}</em>`:''}<p>${esc(d)}</p></div></li>`;}).join('')}</ul>
  ${recent.length?`<h4>Their last moves</h4><div class="recent">${recent.map(r=>`<span class="ply opp" title="Exchange ${r.round}"><span class="mini-icon">${actionIcon(r.pair[1],1,r.channels?.[1])}</span>${esc(r.actionNames[1])}</span>`).join('')}</div>`:''}`;}
function intentSheet(){const id=isCompelled(game,1)?(game.pending[1]??legalActions(game,1)[0]):game.pending[1];if(!id)return inspectSheet();
 return `<header class="sh-head"><span class="tele-icon">${actionIcon(id,1)}</span><div><b>${esc(nameOf(1))}: ${esc(actionName(id,1))}</b><small>${price(1,id)}</small></div><button class="close" data-close aria-label="Close">×</button></header><p>${esc(describe(game,1,id))}</p><button class="link" data-sheet="inspect">Everything they can do →</button>`;}
function logSheet(){
 const rows=history.map(r=>`<article><h3>Exchange ${r.round} <small>· ${r.leader===0?'you led':'they led'}</small></h3>${[r.leader,1-r.leader].map(i=>`<div class="log-act ${i?'opp':'you'}"><span class="mini-icon">${actionIcon(r.pair[i],i,r.channels?.[i])}</span><div><b>${i?esc(nameOf(1)):'You'}</b> ${esc(r.actionNames[i])}${r.committed[i]!==r.pair[i]?` <small>(committed ${esc(sideLabel(r.committed[i],i))})</small>`:''}${r.lines?.[i]?`<p class="flavor">${esc(r.lines[i])}</p>`:''}${r.descs?.[i]?`<p>${esc(r.descs[i])}</p>`:''}</div></div>`).join('')}${(r.finish??[]).map(f=>`<p class="flavor finish">${esc(f)}</p>`).join('')}<ul>${r.events.map(e=>`<li>${esc(e)}</li>`).join('')||'<li>No damage or resource events.</li>'}</ul><small class="after">HP ${r.hp.map(fmt).join(' / ')} · Mana ${r.ready.map(fmt).join(' / ')} · flux ${r.flux.map(fmt).join(' / ')}</small></article>`);
 return `<header class="sh-head"><div><b>Fight log</b><small>${history.length} exchange${history.length===1?'':'s'}</small></div><button class="close" data-close aria-label="Close">×</button></header><div class="log">${rows.join('')||'<p class="fine">No exchanges yet.</p>'}</div>`;}
function renderSheet(){const el=$('sheet');if(!sheet||!game){el.hidden=true;el.innerHTML='';return;}
 el.hidden=false;el.innerHTML=`<div class="sheet-card sheet-${sheet}" role="dialog" aria-modal="true">${sheet==='inspect'?inspectSheet():sheet==='intent'?intentSheet():logSheet()}</div>`;
 el.onclick=e=>{if(e.target===el||e.target.closest('[data-close]')){sheet=null;renderSheet();}else{const s=e.target.closest('[data-sheet]');if(s){sheet=s.dataset.sheet;renderSheet();}}};
 if(sheet==='log'){const log=el.querySelector('.log');log.scrollTop=log.scrollHeight;}}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&sheet){sheet=null;renderSheet();}});

// ---- The main game's screen, as stubs: what the fight sits inside ----
const ORB={health:['#e06a6a','♥','Health',100],mood:['#e2b23f','☀','Mood',100],mana:['#5fa8e8','✦','Mana'],alignment:['#8a7fd6','☾','Alignment',100]};
function stubTop(){return `<div class="brand">Lumenhold Academy</div><div class="date"><div class="when">Harvestmoon<small>YEAR 1 · MONTH 3 OF 48</small></div><div class="tl48">${Array.from({length:48},(_,i)=>`<i class="${i<2?'done':i===2?'now':''}"></i>`).join('')}</div></div><div class="top-actions">${['⌘','☼','✎','☖'].map(c=>`<span class="icon-btn">${c}</span>`).join('')}</div>`;}
function stubMeters(){const a=game.actors[0],v={health:game.config.mainGame?.health??a.entry.health,mood:a.resources.mood,mana:a.resources.mana,alignment:a.resources.alignment};
 return `${Object.entries(ORB).map(([k,[c,ico,lbl,max]])=>{const m=max??a.kit.capacity,p=k==='alignment'?50+v[k]/2:100*v[k]/m;return `<div class="meter"><div class="orb"><i style="height:${Math.max(0,Math.min(100,p))}%;background:${c}"></i><span>${ico}</span></div><b>${Math.round(v[k])}</b><small>${lbl}</small></div>`;}).join('')}<div class="meter num"><div class="numv">◎<b>${fmt(a.resources.crowns)}</b></div><small>Crowns</small></div><div class="meter num"><div class="numv">★<b>${fmt(a.resources.renown)}</b></div><small>Renown</small></div>`;}
function stubSide(){const k=game.actors[0].kit.skills;return `<nav class="side-tabs"><b class="on">You</b><b>People</b><b>Clues</b><b>Journal</b></nav><h5>YOUR SKILLS</h5>${Object.entries(k).map(([s,v])=>`<div class="skill"><span>${s[0].toUpperCase()+s.slice(1)}</span><b>${v}</b><i style="--w:${v}%"></i></div>`).join('')}<h5>CONDITIONS &amp; COMMITMENTS</h5><div class="cond"><b>${esc(CONTEXTS[game.config.context]?game.config.context.replace('_',' '):'')}</b><small>The fight's stakes: ${Math.round(100*game.rebates.health)}% of lost Health and ${Math.round(100*game.rebates.mana)}% of spent Mana come back after it.</small></div>`;}
function cardStub(){return `<div class="card-stub"><span class="tag">CHALLENGE</span><h3>${esc(game.config.card?game.config.card.split('/')[0].replaceAll('_',' '):SPECIAL_LOADOUTS[game.actors[1].kit.loadout]?'Between You and the Flower':NAMED_LOADOUTS[game.actors[1].kit.loadout]?'A Duel with '+game.actors[1].kit.loadout:'The Ring Under the Boathouse')}</h3></div>`;}
function renderChrome(){const on=!!game&&view!=='setup';
 $('shell').classList.toggle('with-side',on&&chrome.side);
 for(const [id,key,fn]of [['stub-top','top',stubTop],['stub-meters','meters',stubMeters],['stub-side','side',stubSide]]){const el=$(id),show=on&&chrome[key];el.hidden=!show;if(show)el.innerHTML=fn();}}

// ---- The bench's own controls: out of the fight, in the engine's look (not part of the game) ----
let benchOpen=false;
function setDifficulty(preset){$('ai-difficulty').value=preset;
 // Live: the opponent's next decision uses it. The export's config then holds the latest difficulty.
 if(game&&!game.result){const ai=game.config.ai[1];game.config.ai[1]=expandAI(foeAI(preset,ai.seed,game.config.card),game.config.resolvedOpponentLoadout);}}
function renderBench(){const el=$('bench'),on=!!game&&view!=='setup';el.hidden=!on;if(!on){benchOpen=false;return;}
 el.classList.toggle('open',benchOpen);
 el.innerHTML=`<button class="bench-tab" data-bench title="Test bench controls" aria-expanded="${benchOpen}">Bench</button>${benchOpen?`<div class="bench-pop" role="dialog" aria-label="Test bench controls"><header><b>Test bench</b><button class="bench-x" data-bench aria-label="Close">×</button></header>
  <label>Opponent difficulty<select id="bench-difficulty">${[...$('ai-difficulty').options].map(o=>`<option value="${o.value}"${o.value===(game.config.ai[1]?.preset??$('ai-difficulty').value)?' selected':''}>${esc(o.textContent)}</option>`).join('')}</select></label>
  <label class="check"><input type="checkbox" id="engine-toggle"${engineOn?' checked':''}> Engine analysis</label>
  <fieldset><legend>Main game around the fight</legend>${[['top','Top bar'],['meters','Meters'],['side','Side panel'],['card','Card behind']].map(([k,t])=>`<label class="check"><input type="checkbox" data-bench-chrome="${k}"${chrome[k]?' checked':''}> ${t}</label>`).join('')}</fieldset>
  <div class="bench-row"><button data-bench-view="setup">Setup…</button><button data-bench-view="debug">Search journal</button></div>
  <div class="bench-row"><button data-sheet="log">Full log</button><button id="bench-export">Export log</button>${game.result?'':`<button id="leave" title="Bench only: the game has no concession"><span class="control-icon" aria-hidden="true">${ACTION_ICONS.concede}</span>Concede</button>`}</div></div>`:''}`;
 for(const b of document.querySelectorAll('[data-bench]'))b.onclick=()=>{benchOpen=!benchOpen;renderBench();};
 if(!benchOpen)return;
 $('bench-difficulty').onchange=e=>setDifficulty(e.target.value);
 $('engine-toggle').onchange=e=>setEngine(e.target.checked);
 for(const box of el.querySelectorAll('[data-bench-chrome]'))box.onchange=()=>{const k=box.dataset.benchChrome;chrome[k]=box.checked;store.set('chrome.'+k,box.checked?'1':'0');const twin=document.querySelector(`#setup [data-chrome="${k}"]`);if(twin)twin.checked=box.checked;render();};
 for(const b of el.querySelectorAll('[data-bench-view]'))b.onclick=()=>{view=b.dataset.benchView;benchOpen=false;render();window.scrollTo(0,0);};
 for(const b of el.querySelectorAll('[data-sheet]'))b.onclick=()=>{benchOpen=false;sheet=b.dataset.sheet;render();};
 $('bench-export').onclick=exportLog;
 if($('leave'))$('leave').onclick=()=>{token++;busy=false;benchOpen=false;concede(game,0);render();};
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&benchOpen&&!sheet){benchOpen=false;renderBench();}});

// ---- The engine (optional) ----
const evalText=v=>v===undefined?'…':v>=9000?'KO':v<=-9000?'−KO':(v>0?'+':v<0?'−':'')+Math.abs(v).toFixed(1);
const evalShare=v=>v>=9000?100:v<=-9000?0:100/(1+Math.exp(-v/12));
function evalBar(){const v=analysis?.scores?.[analysis.best];return `<i style="height:${v===undefined?50:evalShare(v)}%"></i><span>${v===undefined?'':evalText(v)}</span>`;}
function plyChip(p){if(p.end)return `<span class="ply end">${p.end==='win'?'KO · you win':p.end==='loss'?'KO · you lose':'draw'}</span>`;
 return `<span class="ply ${p.side?'opp':'you'}" title="${p.side?'Opponent':'You'} · exchange ${p.round}"><span class="mini-icon">${actionIcon(p.id,p.side,p.channel)}</span>${esc(sideLabel(p.id,p.side))}</span>`;}
function lineHtml(line){let out='',round=null;for(const p of line){if(!p.end&&round!==null&&p.round!==round)out+='<span class="sep">|</span>';if(!p.end)round=p.round;out+=plyChip(p);}return out;}
function enginePanel(){
 const mine=!game.result&&actorToMove(game)===0,head=!analysis?(mine?'Engine · starting…':'Engine · waits for your turn'):`Engine · depth ${analysis.depth}${analysisRunning?'…':''} · ${(analysis.nodes/1000).toFixed(0)}k nodes · ${(analysis.ms/1000).toFixed(1)} s`;
 return `<div class="engine-head"><b>${head}</b><select id="engine-budget" aria-label="Engine time">${[[500,'0.5 s'],[1500,'1.5 s'],[4000,'4 s']].map(([v,t])=>`<option value="${v}" ${v===engineBudget?'selected':''}>${t}</option>`).join('')}</select></div>${analysis?.lines?`<ol class="lines">${analysis.lines.map((l,k)=>`<li class="${k===0?'best':''}"><span class="eval">${evalText(l.value)}</span><span class="line">${lineHtml(l.line)}</span></li>`).join('')}</ol>`:''}<p class="fine">Values are in HP from your side: + is good for you. The line is each side's best reply as the engine sees it: gold chips are your moves, blue chips the opponent's, and | separates exchanges.</p>`;
}
function paintEngine(){
 const panel=$('engine');if(panel&&engineOn){panel.innerHTML=enginePanel();$('engine-budget').onchange=e=>{engineBudget=Number(e.target.value);store.set('engineBudget',engineBudget);analysisFor=-1;analysis=null;requestAnalysis();paintEngine();};}
 if($('evalbar'))$('evalbar').innerHTML=evalBar();
 const live=engineOn&&analysis&&analysisFor===moves;
 for(const b of document.querySelectorAll('[data-action]'))b.classList.toggle('best',!!live&&b.dataset.action===analysis.best);
 for(const e of document.querySelectorAll('[data-eval]')){const v=live?analysis.scores[e.dataset.eval]:undefined;e.textContent=v===undefined?'':evalText(v);}
}
function onAnalysis(e){if(e.data.token!==analysisToken)return;if(e.data.error){analysisRunning=false;$('setup-error').textContent='Engine: '+e.data.error;paintEngine();return;}if(e.data.done)analysisRunning=false;else analysis=e.data.analysis;paintEngine();}
function setEngine(on){engineOn=on;store.set('engineOn',on?'1':'0');
 if(!on){analyst?.terminate();analyst=null;analysisRunning=false;analysis=null;analysisFor=-1;}render();}
function requestAnalysis(){
 if(!game||game.result||!engineOn||actorToMove(game)!==0||busy||analysisFor===moves)return;
 // A stale search would only queue behind the new one, so restart the worker instead.
 if(analysisRunning||!analyst){analyst?.terminate();analyst=makeAnalyst();}
 analysisFor=moves;analysis=null;analysisRunning=true;analyst.postMessage({type:'analyze',token:++analysisToken,state:game,budgetMs:engineBudget,maxDepth:8});
}

// ---- The fight ----
// What the main game takes from the fight (setup/campaign.mjs settle, as src/combat.js fightResult): Health only below 30 HP
// left, Mana net of flux and the rebate, Mood by the outcome, the Renown, Crowns and alignment it moved. A lesson or a fight
// with nothing at stake changes nothing; a skipped lesson is a draw.
const MAIN_BARS=[['health','Health'],['mana','Mana'],['mood','Mood'],['renown','Renown'],['gold','Crowns'],['alignment','Alignment']];
function mainResult(){const m=game.config.mainGame??{},a=game.actors[0],st=settle(game,{health:m.health??a.entry.health,mana:m.mana??m.maxMana??a.kit.capacity});
 return {...st,...(setting.left==='lesson'?{outcome:'draw',reason:'conceded'}:{}),...(setting.free?{deltas:{},followUps:[]}:{})};}
function result(){const r=game.result,main=mainResult(),won=main.outcome==='win',lost=main.outcome==='lose',ds=MAIN_BARS.filter(([k])=>main.deltas[k]).map(([k,n])=>{const d=main.deltas[k];return `<span>${n} <b class="${d<0?'neg':'pos'}">${d<0?'−':'+'}${fmt(Math.abs(d))}</b></span>`;}).join('');
 return `<div class="result ${won?'win':lost?'loss':'draw'}"><h2>${won?'Victory':lost?'Defeat':'Draw'}</h2><p>${esc(setting.left==='lesson'?'lesson skipped':setting.left==='walk'?'walked away':r.reason)}${r.tiebreak?' · the telegraphed initiative wins':''}</p>
 <h4 class="res-h">In the main game</h4><div class="net-costs">${ds||'<span class="none">nothing changes</span>'}</div>
 <h4 class="res-h">The fight's ledger</h4><div class="net-costs">${COMBAT_RESOURCES.map(k=>{const n=game.settlement[0][k].netLoss;return `<span>${k} <b class="${n>0?'neg':n<0?'pos':''}">${n<0?'+':n>0?'−':'±'}${fmt(Math.abs(n))}</b></span>`;}).join('')}</div>
 <p class="fine">Flux is collected; rebates cover net losses only. Crowns and alignment are never rebated. The main game loses Health only below ${COMBAT_TUNING.settle.healthFreeAbove} HP, and never past 1.${main.followUps.length?` Witnesses reported ${game.reports.length} forbidden cast${game.reports.length===1?'':'s'}.`:''}</p><div class="result-actions"><button id="replay" class="primary">Replay same setup</button><button id="carry" title="Apply the main game's changes to the entry fields and fight again">Next bout · carry the bars</button><button id="export">Export log</button></div></div>`;}
// The setting as the main game shows it above the fight (src/combat-ui.js settingLine): the situation and what comes back,
// the Health rule, whether a crowd watches and, for a forbidden-spell user, whether anyone would report one.
function settingLine(){const c=game.config,rb=game.rebates,free=COMBAT_TUNING.settle.healthFreeAbove,pct=x=>Math.round((x||0)*100);
 if(setting.free)return `<p class="fight-setting"><span><b>${esc(gt(setting.tutorial?'fight.lessonTitle':'fight.freeTitle'))}</b> · ${esc(gt('fight.nothingAtStake'))}</span></p>`;
 const parts=[`<b>${esc(gt('fight.context.'+c.context,{},c.context.replace('_',' ')))}</b>`];
 if(free)parts.push(esc(gt('fight.healthBelow',{n:free})));
 if(rb.health===rb.mana){if(rb.health)parts.push(esc(gt('fight.rebateBoth',{pct:pct(rb.health)})));}else{if(rb.health)parts.push(esc(gt('fight.rebateHealth',{pct:pct(rb.health)})));if(rb.mana)parts.push(esc(gt('fight.rebateMana',{pct:pct(rb.mana)})));}
 const lines=[`<span>${parts.join(' · ')}</span>`,`<span>${esc(c.observers?gt('fight.watched',{pct:pct(rb.renown)}):gt('fight.unwatched'))}</span>`];
 if(Object.keys(game.actors[0].kit.spells).some(id=>SPELLS[id]?.group==='forbidden'))lines.push(`<span>${esc(gt((c.witnesses??c.observers)?'fight.witnessed':'fight.unwitnessed'))}</span>`);
 return `<p class="fight-setting">${lines.join('')}</p>`;}
// Coming in hurt or drained (src/combat-ui.js unfitNote), before the first exchange.
function unfitNote(){const m=game.config.mainGame??{},full=COMBAT_TUNING.condition.healthFull,lines=[];if(history.length||game.result)return '';
 if(m.health!=null&&m.health<full)lines.push(gt('fight.unfitHealth',{n:Math.round(m.health),full}));
 if(m.mana!=null&&m.mana<m.maxMana)lines.push(gt('fight.unfitMana',{n:Math.round(m.mana),max:Math.round(m.maxMana)}));
 return lines.length?`<p class="fight-note">${esc(lines.join(' '))}</p>`:'';}
// A lesson (EVENTS tutorial): one coach mark an exchange, the last staying up; a free fight can be left (src/combat-ui.js).
function coach(){const keys=setting.tutorial??[];if(!keys.length||game.result)return '';const k=keys[Math.min(history.length,keys.length-1)];return `<div class="coach" role="note"><b>${esc(gt('fight.coachTitle'))}</b> ${esc(gt('fight.coach.'+k))}</div>`;}
function leaveButton(){return game.result||!setting.free?'':`<button class="fl-leave" data-leave="${setting.tutorial?'lesson':'walk'}">${esc(gt(setting.tutorial?'fight.skipLesson':'fight.walkAway'))}</button>`;}
// Next bout: the main game's changes applied to the entry fields (blank fields start from what this fight began with).
function carry(){const main=mainResult(),d=main.deltas,a=game.actors[0],m=game.config.mainGame??{},clamp=(x,lo,hi)=>Math.round(Math.min(hi,Math.max(lo,x)));
 const set=(id,base,delta,lo,hi)=>{$(id).value=clamp(base+(delta||0),lo,hi);};
 set('entry-health',m.health??a.entry.health,d.health,0,100);set('entry-mana',m.mana??m.maxMana,d.mana,0,99999);set('entry-mood',a.entry.mood,d.mood,0,100);
 set('entry-renown',a.entry.renown,d.renown,0,100);set('player-crowns',a.entry.crowns,d.gold,0,99999);set('entry-alignment',a.entry.alignment,d.alignment,-100,100);
 start();}
function fight(){return `<div class="fight-wrap${chrome.card?' with-card':''}">${chrome.card?cardStub():''}<section class="fight">${settingLine()}${unfitNote()}${coach()}<div class="fighters${engineOn?' with-eval':''}">${engineOn?`<div class="evalbar" id="evalbar" title="Engine evaluation for you, in HP">${evalBar()}</div>`:''}${fighter(0)}${fighter(1)}</div><div class="fight-body"><div class="fight-main">${engineOn?'<div class="engine" id="engine"></div>':''}${track()}</div><div class="controls">${intent()}${game.result?result():actions()}${leaveButton()}</div></div></section></div>`;}
function debug(){return `<div class="debug"><nav><button data-view="play">← Back to the fight</button></nav><h3>Search and exchange journal</h3><p>Decisions ${stats.length}; deepest completed ${Math.max(0,...stats.map(a=>a.completedDepth))}; slowest ${Math.max(0,...stats.map(a=>a.elapsedMs)).toFixed(1)} ms; accepted weaker choices ${stats.filter(a=>a.degraded).length} / ${stats.length}.</p><details><summary>Kits and ledgers</summary><pre>${esc(JSON.stringify({kits:game.actors.map(a=>a.kit),settlement:game.settlement,reports:game.reports},null,2))}</pre></details>${history.slice().reverse().map(r=>`<details open><summary>Exchange ${r.round}: ${r.pair.map(label).join(' / ')}</summary><ul>${r.events.map(e=>`<li>${esc(e)}</li>`).join('')}</ul></details>`).join('')}</div>`;}
function render(){
 document.body.classList.toggle('playing',!!game);document.body.classList.toggle('setup-open',!game||view==='setup');
 $('setup').hidden=!!game&&view!=='setup';$('play').hidden=!!game&&view==='setup';
 renderChrome();renderBench();if(!game)return;
 snapshotBars();const kept=$('tk-scroll')?.scrollLeft;
 $('play').innerHTML=view==='debug'?debug():fight();
 const sc=$('tk-scroll');if(sc)sc.scrollLeft=focusEx!==null&&kept!==undefined?kept:sc.scrollWidth;
 animateBars();paintEngine();requestAnalysis();renderSheet();
 for(const b of document.querySelectorAll('#play [data-view]'))b.onclick=()=>{view=b.dataset.view;render();window.scrollTo(0,0);};
 for(const b of document.querySelectorAll('#play [data-sheet]')){const open=()=>{sheet=b.dataset.sheet;renderSheet();};b.onclick=open;b.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}};}
 for(const b of document.querySelectorAll('[data-ex]'))b.onclick=()=>{focusEx=b.dataset.ex==='latest'?null:Number(b.dataset.ex);render();};
 for(const b of document.querySelectorAll('[data-action]'))b.onclick=()=>{const id=b.dataset.action;if(selected===id)commit(id);else selectAction(id);};
 if($('commit'))$('commit').onclick=()=>commit();
 renderBench();
 if($('replay'))$('replay').onclick=()=>start(game.config);
 if($('carry'))$('carry').onclick=carry;
 const lv=document.querySelector('[data-leave]');if(lv)lv.onclick=()=>{token++;busy=false;setting.left=lv.dataset.leave;concede(game,0);render();};
 if($('export'))$('export').onclick=exportLog;
}
function exportLog(){{const url=URL.createObjectURL(new Blob([JSON.stringify({rulesVersion:RULES_VERSION,config:game.config,kits:game.actors.map(a=>a.kit),history,stats,result:game.result,settlement:game.settlement,reports:game.reports},null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='lumenhold-combat-'+Date.now()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
}
// Version shown in the setup panel and the tab title, straight from the engine build.
if($('version'))$('version').textContent=RULES_VERSION;document.title='Lumenhold · Combat '+RULES_VERSION;
render();
const params=new URLSearchParams(location.search);if(params.has('quickstart')){const n=Number(params.get('quickstart'));if([20,45,70].includes(n)){$('player-level').value=n;setup();start();}}
}
