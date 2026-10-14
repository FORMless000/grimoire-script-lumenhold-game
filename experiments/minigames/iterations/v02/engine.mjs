// Prototype 0.2. Deterministic mechanics; only kit generation uses a level seed.
import {ARCHETYPES,SPELLS,CONTEXTS,RESOURCES,generateKit,cap} from './roster.mjs';
export {ARCHETYPES,SPELLS,CONTEXTS,RESOURCES,generateKit};
export const BASICS=['strike','guard','reclaim'];
export const label=id=>SPELLS[id]?.name??({strike:'Strike',guard:'Guard',reclaim:'Reclaim'}[id]??id);
const offensive=new Set(['strike','flame','tide','starlight']);
const resourceMap=v=>Object.fromEntries(RESOURCES.map(k=>[k,v]));
export function createState(options={}) {
  const config={mode:'combat',playerArchetype:'Evoker',opponentArchetype:options.playerArchetype??'Evoker',playerLevel:50,opponentLevel:options.playerLevel??50,
    spellAccess:'kit',resourceBudget:'standard',manaCostScale:2,combatScale:3,firstLeader:1,healthModel:'direct',fixture:'workshop_request',approach:'appeal',context:options.mode==='negotiation'?'real_conflict':'practice_duel',...options};
  if(!['combat','negotiation'].includes(config.mode)||!['direct','offset'].includes(config.healthModel)||!['reason','appeal','bluff'].includes(config.approach))throw Error('Invalid game configuration');
  if(![0,1].includes(config.firstLeader)||!Number.isInteger(config.manaCostScale)||config.manaCostScale<1||!CONTEXTS[config.context])throw Error('Invalid setup');
  const rebates={...CONTEXTS[config.context],...options.rebates};
  for(const k of RESOURCES)if(!Number.isFinite(rebates[k])||rebates[k]<0||rebates[k]>1)throw Error('Rebates must be between 0 and 1');
  const kits=[generateKit(config.playerArchetype,config.playerLevel,config.spellAccess),generateKit(config.opponentArchetype,config.opponentLevel,config.spellAccess)];
  const actors=kits.map((kit,i)=>{
    const standard=config.resourceBudget==='standard';
    const entry={health:standard?70:35,mood:standard?60:30,renown:standard?30:5,mana:standard?kit.capacity:Math.min(30,kit.capacity),crowns:standard?30:6,
      ...(i===0?options.playerResources:options.opponentResources)};
    if(i===1&&config.mode==='combat'&&config.playerArchetype===config.opponentArchetype&&config.playerLevel===config.opponentLevel&&!options.opponentResources)Object.assign(entry,options.playerResources);
    for(const k of RESOURCES)if(!Number.isFinite(entry[k])||entry[k]<0||entry[k]>(k==='mana'?kit.capacity:k==='crowns'?99999:100))throw Error('Invalid '+k);
    if(config.healthModel==='direct'&&entry.health===0)throw Error('Direct Health mode requires positive Health');
    const maxHP=entry.health+(config.healthModel==='offset'?40+Math.floor((kit.skills.arcana+kit.skills.vigor)/4):0);
    return {kit,entry,resources:{...entry},spent:resourceMap(0),restored:resourceMap(0),hp:maxHP,maxHP,flux:0,effects:{},queue:[]};
  });
  return {config,rebates,actors,round:1,leader:config.firstLeader,pending:[null,null],planGoals:[0,0],planOrder:[0,1],range:'near',agreement:0,patience:8,suspicion:0,claims:[],demonstrationUsed:false,materialsSecured:false,result:null,settlement:null,lastEvents:[],lastPair:null};
}
// Search forks share immutable config/kit data, not mutable resources, queues or effects.
export function cloneState(s){return {...s,pending:[...s.pending],planGoals:[...s.planGoals],planOrder:[...s.planOrder],claims:s.claims.map(c=>({...c})),lastEvents:[],actors:s.actors.map(a=>({...a,entry:a.entry,resources:{...a.resources},spent:{...a.spent},restored:{...a.restored},effects:Object.fromEntries(Object.entries(a.effects).map(([k,v])=>[k,{...v}])),queue:[...a.queue]}))};}
export const has=(s,side,key)=>!!s.actors[side].effects[key]&&s.actors[side].effects[key].until>=s.round;
const put=(s,side,key,value=1,until=s.round+1)=>s.actors[side].effects[key]={value,until,born:s.round};
const take=(s,side,key)=>{const e=has(s,side,key)?s.actors[side].effects[key]:null;delete s.actors[side].effects[key];return e?.value??0;};
const event=(s,text)=>s.lastEvents.push(text);
const debit=(a,k,n)=>{const v=Math.min(a.resources[k],Math.max(0,n));a.resources[k]-=v;a.spent[k]+=v;return v;};
const restore=(a,k,n)=>{const v=Math.min(a.entry[k]-a.resources[k],Math.max(0,n));a.resources[k]+=v;a.restored[k]+=v;return v;};
export const cost=(s,side,id)=>SPELLS[id]?SPELLS[id].cost[s.actors[side].kit.spells[id]-1]*s.config.manaCostScale:0;
export const planningSide=s=>s.planOrder.find(side=>s.actors[side].queue.length<s.planGoals[side])??null;
export function actorToMove(s){if(s.result)return null;const p=planningSide(s);if(p!==null)return p;return s.pending[s.leader]===null?s.leader:1-s.leader;}
export function projectedMana(s,side){
  const a=s.actors[side];let ready=a.resources.mana,flux=a.flux;
  for(const id of a.queue){if(id==='reclaim'){ready+=flux;flux=0;}else{const c=cost(s,side,id);ready-=c;flux+=.8*c;}}
  return {ready,flux};
}
export function available(s,side,id,planning=planningSide(s)===side){
  if(!BASICS.includes(id)&&!SPELLS[id])return 'Unknown action';
  if(SPELLS[id]&&!s.actors[side].kit.spells[id])return 'Not learned';
  const mana=planning?projectedMana(s,side).ready:s.actors[side].resources.mana;
  return mana+1e-9<cost(s,side,id)?'Not enough ready mana':'';
}
export function legalActions(s,side=actorToMove(s)){
  if(side===null)return [];
  if(planningSide(s)===null&&s.actors[side].queue.length)return [s.actors[side].queue[0]];
  return [...BASICS,...Object.keys(s.actors[side].kit.spells)].filter(id=>!available(s,side,id));
}
export function strength(s,side,id){
  const own=s.actors[side],other=s.actors[1-side],skill=s.config.mode==='combat'?(id==='strike'?'vigor':'arcana'):(side===0?{reason:'lore',appeal:'charm',bluff:'guile'}[s.config.approach]:'lore');
  const defence=s.config.mode==='combat'?(other.kit.skills.arcana+other.kit.skills.vigor)/2:(side===0?(other.kit.skills.charm+other.kit.skills.guile)/2:other.kit.skills[s.claims.length?'guile':'charm']);
  let bonus=has(s,side,'foreAim')?10:0;
  if(id==='strike'&&has(s,side,'attuneAim'))bonus=Math.max(bonus,10);
  if(s.config.mode==='negotiation'&&side===0){if(has(s,1,'anticipation'))bonus-=4;if(s.config.approach==='appeal'&&has(s,1,'authority'))bonus-=4;}
  return cap(1+(own.kit.skills[skill]-defence+bonus)/100,.5,1.5);
}
export function attackPower(s,side,id){const b=(s.actors[side].kit.spells[id]??1)-1;return Math.round(({strike:6,flame:8+b,tide:5+b,starlight:4+b}[id]??0)*s.config.combatScale*strength(s,side,id));}
function damage(s,side,n){const a=s.actors[side],actual=Math.min(a.hp,Math.max(0,n));a.hp-=actual;debit(a,'health',actual);return actual;}
function heal(s,side,n){const a=s.actors[side],v=Math.min(a.maxHP-a.hp,n);a.hp+=v;restore(a,'health',n);return v;}
function prepareCombat(s,side,id){
  const a=s.actors[side],b=(a.kit.spells[id]??1)-1,k=s.config.combatScale;
  switch(id){
    case 'guard':put(s,side,'guard',4*k,s.round);break;
    case 'restoration':event(s,`${side===0?'You':'Opponent'} restored ${heal(s,side,(6+b)*k)} HP.`);break;
    case 'shape':put(s,side,'barricade',(8+b)*k);break;
    case 'glamour':put(s,side,'decoy',(4+b)*k);break;
    case 'hush':put(s,1-side,'suppressed',(4+b)*k);break;
    case 'ward':put(s,side,'ward',(8+b)*k);break;
    case 'foresight':put(s,side,'foreAim',10);break;
    case 'haste':damage(s,side,2*k);put(s,side,'haste');event(s,'Haste costs 6 Health/HP in fatigue.');break;
    case 'attune':put(s,side,'attuneAim',10);put(s,side,'rhythm',(3+b)*k);break;
    case 'shadowstep':s.range='near';put(s,side,'evasion',(3+b)*k);break;
  }
}
function computeAttack(s,side,id){
  if(!offensive.has(id)||s.actors[side].hp<=0)return 0;
  const target=1-side;
  if(id==='strike'&&s.range!=='near')return 0;
  if(id==='flame')take(s,target,'barricade');if(id==='starlight')take(s,target,'decoy');
  let n=attackPower(s,side,id);
  const reduce=(owner,key)=>{if(n>0&&has(s,owner,key))n=Math.max(0,n-take(s,owner,key));};
  if(SPELLS[id])reduce(side,'suppressed');if(id==='flame')reduce(target,'wet');
  if(id==='strike')for(const key of ['guard','barricade','rhythm'])reduce(target,key);
  for(const key of ['decoy','evasion','ward'])reduce(target,key);
  take(s,side,'foreAim');if(id==='strike')take(s,side,'attuneAim');return n;
}
function attackBatch(s,sides,pair){
  const hits=sides.map(side=>[side,computeAttack(s,side,pair[side])]);
  for(const [side,n]of hits){const actual=damage(s,1-side,n);if(offensive.has(pair[side]))event(s,`${side===0?'You':'Opponent'}: ${label(pair[side])} dealt ${actual} HP.`);if(actual>0&&pair[side]==='tide')put(s,1-side,'wet',(3+(s.actors[side].kit.spells.tide-1))*s.config.combatScale);}
}
function demonstrate(s,side,b){if(side===0&&s.config.fixture==='workshop_request'&&!s.demonstrationUsed){s.demonstrationUsed=true;s.agreement+=3+b;event(s,'Demonstration advances Agreement.');}else event(s,'No relevant demonstration target; the cast still costs mana.');}
function negotiate(s,pair){
  const workshop=s.config.fixture==='workshop_request';
  const oldHaste=has(s,0,'haste')&&s.actors[0].effects.haste.born<s.round;
  // Preparations resolve before arguments for both seats, as in combat.
  for(const side of [0,1]){const id=pair[side],a=s.actors[side],b=(a.kit.spells[id]??1)-1;
    switch(id){
      case 'guard':if(side===0)s.suspicion=Math.max(0,s.suspicion-1);break;
      case 'foresight':put(s,side,'foreAim',10);break;
      case 'flame':case 'tide':if(!workshop){finish(s,side===0?'lose':'win','hostile casting');return;}demonstrate(s,side,b);break;
      case 'restoration':if(side===0)demonstrate(s,side,b);else restore(a,'health',(6+b)*3);break;
      case 'shape':if(side===0&&workshop)s.materialsSecured=true;break;
      case 'glamour':if(side===0){put(s,0,'presentation',2+b);s.suspicion++;debit(a,'renown',2);}else put(s,1,'authority',4);break;
      case 'hush':if(side===0&&workshop)put(s,0,'quiet');break;
      case 'ward':if(side===0&&workshop)put(s,0,'materials');break;
      case 'haste':put(s,side,'haste');break;
      case 'attune':if(workshop)put(s,side,'connection',2+b);else if(side===0)s.suspicion++;break;
      case 'shadowstep':finish(s,side===0?closeOutcome(s):'win','voluntary exit');return;
    }
  }
  for(const side of [0,1])if(pair[side]==='starlight')take(s,1-side,side===0?'authority':'presentation');
  if(pair[0]==='strike'){
    const bonus=Math.max(take(s,0,'presentation'),s.config.approach==='bluff'?0:take(s,0,'connection'));
    const pref=ARCHETYPES[s.actors[1].kit.archetype].preference===s.config.approach?1:0;
    const credit=Math.max(1,Math.round(((s.config.approach==='bluff'?6:4)+pref+bonus)*strength(s,0,'strike')));
    s.agreement+=credit;take(s,0,'foreAim');
    if(s.config.approach==='bluff'){s.suspicion++;s.claims.push({credit});}event(s,`Argument gained ${credit} Agreement.`);
  }
  if(pair[1]==='strike'){
    if(s.claims.length){const c=s.claims.shift();s.agreement=Math.max(0,s.agreement-c.credit);s.suspicion+=2;debit(s.actors[0],'renown',4);event(s,'Audience exposed a false claim.');}
    else {const n=Math.max(1,Math.round((2+take(s,1,'connection'))*strength(s,1,'strike')));s.agreement=Math.max(0,s.agreement-n);event(s,`Objection removed ${n} Agreement.`);}
    take(s,1,'foreAim');if(has(s,1,'haste')&&s.actors[1].effects.haste.born<s.round){s.patience--;take(s,1,'haste');}
  }
  if(pair[0]==='strike'){take(s,1,'anticipation');take(s,1,'authority');}
  if(workshop&&s.round===3){if(!s.materialsSecured&&!has(s,0,'materials')){s.agreement=Math.max(0,s.agreement-2);event(s,'Scattering: −2 Agreement.');}else take(s,0,'materials');}
  if(workshop&&s.round===5){if(!has(s,0,'quiet')){s.agreement=Math.max(0,s.agreement-2);event(s,'Noise: −2 Agreement.');}else take(s,0,'quiet');}
  s.patience=Math.max(0,s.patience-(oldHaste?0:1));if(oldHaste)take(s,0,'haste');
  if(s.suspicion>=6)finish(s,'lose','suspicion');else if(s.agreement>=18)finish(s,'win','agreement reached');else if(s.patience<=0||s.round===8)finish(s,closeOutcome(s),'conversation ended');
}
export const closeOutcome=s=>s.agreement>=18?'win':s.agreement>=10?'partial':'lose';
export function finish(s,outcome,reason){
  if(s.result)return;
  s.result={outcome,reason,round:s.round};
  // Safe post-encounter collection is separate from context rebates. No double refund.
  s.settlement=s.actors.map(a=>{
    const collected=a.flux;restore(a,'mana',collected);a.flux=0;
    return Object.fromEntries(RESOURCES.map(k=>{const before=a.resources[k],loss=Math.max(0,a.entry[k]-before),refund=Math.floor(loss*s.rebates[k]+1e-9),final=Math.min(a.entry[k],before+refund);a.resources[k]=final;return [k,{entry:a.entry[k],spent:a.spent[k],restored:a.restored[k],before,refund,final,netLoss:a.entry[k]-final,...(k==='mana'?{fluxCollected:collected}: {})}];}));
  });
}
function resolve(s){
  const pair=[...s.pending];s.lastPair=pair;s.lastEvents=[];
  for(const side of [0,1]){
    const a=s.actors[side],id=pair[side],c=cost(s,side,id);
    debit(a,'mana',c);a.flux+=.8*c;if(a.queue.length)a.queue.shift();
  }
  if(s.config.mode==='combat'){
    const fast=[0,1].filter(side=>has(s,side,'haste')&&s.actors[side].effects.haste.born<s.round);
    for(const side of fast)take(s,side,'haste');
    for(const side of [0,1])prepareCombat(s,side,pair[side]);
    if(fast.length===1){attackBatch(s,fast,pair);attackBatch(s,[1-fast[0]],pair);}else attackBatch(s,[0,1],pair);
    const alive=s.actors.map(a=>a.hp>0);
    if(!alive[0]||!alive[1])finish(s,alive[0]?'win':alive[1]?'lose':'partial','defeat');
    else if(s.round===8){const lead=s.actors[0].hp/s.actors[0].maxHP-s.actors[1].hp/s.actors[1].maxHP;finish(s,lead>=.25?'win':lead>-.25&&s.actors[1].hp<=.75*s.actors[1].maxHP?'partial':'lose','eight-exchange limit');}
  }else negotiate(s,pair);
  // Reclaim is an action, and never funds another cast in the same exchange.
  if(!s.result)for(const side of [0,1])if(pair[side]==='reclaim'){const a=s.actors[side],n=a.flux;restore(a,'mana',n);a.flux=0;event(s,`${side===0?'You':'Opponent'} reclaimed ${n.toFixed(1)} mana.`);}
  if(!s.result){
    const remaining=Math.min(3,8-s.round);s.planOrder=[s.leader,1-s.leader];
    for(const side of [0,1])if(pair[side]==='foresight'&&remaining){s.planGoals[1-side]=Math.max(s.actors[1-side].queue.length,remaining);event(s,`Foresight binds ${remaining} actions from exchange ${s.round+1}.`);}
    for(const a of s.actors)for(const [k,e]of Object.entries(a.effects))if(e.until<=s.round)delete a.effects[k];
    s.round++;s.leader=1-s.leader;s.pending=[null,null];
  }
}
export function applyChoice(s,id){
  const side=actorToMove(s);if(side===null)throw Error('Encounter finished');
  if(!legalActions(s,side).includes(id))throw Error('Illegal or unaffordable action');
  if(planningSide(s)!==null){s.actors[side].queue.push(id);if(s.actors[side].queue.length>=s.planGoals[side])s.planGoals[side]=0;return {resolved:false,planning:true,side};}
  s.pending[side]=id;if(s.pending[0]!==null&&s.pending[1]!==null){const round=s.round;resolve(s);return {resolved:true,round,pair:s.lastPair,events:[...s.lastEvents],result:s.result};}return {resolved:false,side};
}
export function describe(s,side,id){
  const b=(s.actors[side].kit.spells[id]??1)-1,k=s.config.combatScale;
  if(id==='reclaim')return 'Recover all your flux as ready mana after this exchange. No extra action.';
  if(s.config.mode==='combat')return {
    strike:`Deal ${attackPower(s,side,id)} HP at near range.`,guard:`Block ${4*k} from Strike this exchange. Spells bypass Guard.`,flame:`Deal ${attackPower(s,side,id)} HP; destroys Shape.`,tide:`Deal ${attackPower(s,side,id)} HP; Wet weakens the next Flame.`,starlight:`Deal ${attackPower(s,side,id)} HP; removes Glamour.`,restoration:`Restore up to ${(6+b)*k} HP and Health, capped at entry.`,shape:`Block ${(8+b)*k} from the next Strike; Flame destroys it.`,glamour:`Absorb ${(4+b)*k} from the next attack.`,hush:`Reduce the next offensive spell by ${(4+b)*k}.`,ward:`Absorb ${(8+b)*k} from the next attack.`,foresight:'Bind and reveal the next three opponent commands, starting next exchange. +10 power points once.',haste:`Pay ${2*k} Health/HP; next exchange your attack resolves first.`,attune:`+10 Strike power points once; absorb ${(3+b)*k} from the next Strike.`,shadowstep:`Move near; evade ${(3+b)*k} from the next attack.`}[id];
  if(id==='strike')return side===0?`Use ${s.config.approach} to gain Agreement; bluff adds risky claims.`:'Object; if a false claim exists, expose it instead.';
  if(id==='guard')return side===0?'Reduce Suspicion by 1; time still passes.':'Listen without applying pressure.';
  return {foresight:'Bind and reveal three future commands, starting next exchange.',flame:s.config.fixture==='formal_petition'?'Hostile cast: the caster loses the meeting.':'One workshop demonstration, if relevant.',tide:s.config.fixture==='formal_petition'?'Hostile cast: the caster loses the meeting.':'One workshop demonstration, if relevant.',restoration:'Repair a workshop demonstration; audience restores Health.',shape:'Secure workshop materials.',starlight:'Remove opposing Glamour.',glamour:side===0?'+1 Suspicion, −2 Renown; boost next argument.':'Authority weakens the next Appeal.',hush:'Suppress the workshop noise if active on exchange 5.',haste:side===0?'Next exchange avoids base Patience loss.':'Next objection spends extra Patience.',attune:'Boost next argument/objection with consent; formal petition has no consent.',ward:'Protect workshop materials from scattering.',shadowstep:'Leave the meeting; pay mana and settle the outcome.'}[id];
}
