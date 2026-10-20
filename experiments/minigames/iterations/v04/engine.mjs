import {LOADOUTS,NAMED_LOADOUTS,fixedLoadoutLevel,SPELLS,CONSTRUCTS,CONTEXTS,RESOURCES,FLUX_RATIO,ALIGNMENT_COST,ECONOMY,generateLoadout,levelRng,cap} from './roster.mjs';
export {LOADOUTS,NAMED_LOADOUTS,fixedLoadoutLevel,SPELLS,CONSTRUCTS,CONTEXTS,RESOURCES,FLUX_RATIO,generateLoadout};
export const RULES_VERSION='combat-spells-v2-0.4.6';
const P=ECONOMY.spells;
export const BASICS=['strike','guard','reclaim'];
const maps=n=>Object.fromEntries(RESOURCES.map(k=>[k,n]));
const eps=1e-9;
export function createState(options={}){
 const config={mode:'combat',playerLoadout:'Duellist',opponentLoadout:options.playerLoadout??'Duellist',playerYear:1,opponentYear:options.playerYear??1,playerIlseTaken:false,opponentIlseTaken:options.playerIlseTaken??false,playerLevel:50,opponentLevel:options.playerLevel??50,
  spellAccess:'kit',resourceBudget:'standard',manaCostScale:1,combatScale:1,damageMultiplier:1,encounterSeed:options.opponentLevel??options.playerLevel??50,firstLeader:1,healthModel:'offset',context:'practice_duel',observers:false,...options};
 if(!Number.isInteger(config.encounterSeed)||config.encounterSeed<0||config.encounterSeed>0xffffffff)throw Error('Encounter seed must be an integer from 0 to 4294967295');
 const enemy=config.opponentLoadout==='random'?Object.keys(LOADOUTS)[Math.floor(levelRng(config.encounterSeed)()*Object.keys(LOADOUTS).length)]:config.opponentLoadout;
 config.resolvedOpponentLoadout=enemy;
 if(config.mode!=='combat'||!['direct','offset'].includes(config.healthModel)||!['standard','depleted'].includes(config.resourceBudget)||![0,1].includes(config.firstLeader)||!CONTEXTS[config.context]||typeof config.observers!=='boolean')throw Error('Invalid combat setup');
 if(!Number.isFinite(config.manaCostScale)||config.manaCostScale<=0||!Number.isFinite(config.combatScale)||config.combatScale<=0||!Number.isFinite(config.damageMultiplier)||config.damageMultiplier<=0)throw Error('Positive scales required');
 const rebates={...CONTEXTS[config.context],...options.rebates,crowns:0,alignment:0};
 for(const n of Object.values(rebates))if(!Number.isFinite(n)||n<0||n>1)throw Error('Rebates must be in [0,1]');
 const actors=[0,1].map(side=>{
  const kit=generateLoadout(side?enemy:config.playerLoadout,side?config.opponentLevel:config.playerLevel,config.spellAccess,{year:side?config.opponentYear:config.playerYear,ilseTaken:side?config.opponentIlseTaken:config.playerIlseTaken,skills:side?options.opponentSkills:options.playerSkills}),standard=config.resourceBudget==='standard';
  let overrides=side?options.opponentResources:options.playerResources;
  if(side&&!overrides&&config.playerLoadout===enemy&&config.playerLevel===config.opponentLevel&&options.playerResources){const {crowns,...mirrored}=options.playerResources;overrides=mirrored;}
  const entry={health:standard?70:35,mood:standard?60:30,renown:standard?30:5,mana:standard?kit.capacity:Math.min(30,kit.capacity),crowns:standard?30:6,alignment:0,...overrides};
  for(const [k,n]of Object.entries(entry))if(!RESOURCES.includes(k)||!Number.isFinite(n)||n<(k==='alignment'?-100:0)||n>(k==='mana'?kit.capacity:k==='crowns'?99999:100))throw Error('Invalid entry '+k);
  const maxHP=entry.health+(config.healthModel==='offset'?10+2*kit.level:0);
  if(maxHP<=0)throw Error('Positive entry HP required');
  return {kit,entry,resources:{...entry},spent:maps(0),restored:maps(0),hp:maxHP,maxHP,flux:0,effects:{},channel:null,constructs:[],omens:[],lastAction:null,rimeReady:false,rimeUsed:false,freezeUntil:0,pendingRenown:0,glamourAwarded:0,rapportCrowns:0};
 });
 config.resolvedPlayerLevel=actors[0].kit.level;config.resolvedOpponentLevel=actors[1].kit.level;
 return {config,rebates,actors,round:1,normalLeader:config.firstLeader,leader:config.firstLeader,earlyCommit:[0,0],pending:[null,null],lastPair:null,lastEvents:[],reports:[],bursts:[],result:null,settlement:null};
}
export function cloneState(s){return {...s,pending:[...s.pending],earlyCommit:[...s.earlyCommit],reports:[...s.reports],bursts:[],lastEvents:[],searching:true,actors:s.actors.map(a=>({...a,resources:{...a.resources},spent:{...a.spent},restored:{...a.restored},effects:Object.fromEntries(Object.entries(a.effects).map(([k,e])=>[k,{...e}])),channel:a.channel?{...a.channel}:null,constructs:a.constructs.map(c=>({...c})),omens:a.omens.map(o=>({...o}))}))};}
const event=(s,t)=>{if(!s.searching)s.lastEvents.push(t);};
export const has=(s,side,key)=>!!s.actors[side].effects[key]&&s.actors[side].effects[key].from<=s.round&&(s.actors[side].effects[key].until===null||s.actors[side].effects[key].until>=s.round);
const put=(s,side,key,value,from=s.round,until=s.round)=>s.actors[side].effects[key]={value,from,until,born:s.round};
export const rank=(s,side,id)=>s.actors[side].kit.spells[id]??1;
export const skillValue=(s,side,id)=>{if(s.searchKits?.[side]?.skills[id]!==undefined)return s.searchKits[side].skills[id];const skills=SPELLS[id]?.skills??['vigor'];return skills.length?skills.reduce((n,k)=>n+s.actors[side].kit.skills[k],0)/skills.length:50;};
export const skillFactor=(s,side,id)=>s.searchKits?.[side]?.factors[id]??(.75+skillValue(s,side,id)/200);
// Compiled only for an immutable search encounter; live states use the ordinary path.
export function compileSearchKits(s){return s.actors.map((a,side)=>{const ids=['strike',...Object.keys(SPELLS)],skills={},factors={},costs={};for(const id of ids){skills[id]=skillValue(s,side,id);factors[id]=.75+skills[id]/200;costs[id]=(SPELLS[id]?.cost[rank(s,side,id)-1]??0)*s.config.manaCostScale;}return {skills,factors,costs,actions:[...BASICS,...Object.keys(a.kit.spells)]};});}
export const amount=(s,side,id,base,physical=true)=>base*skillFactor(s,side,id)*(physical?s.config.combatScale:1);
export const healingPower=(s,side,id,budget)=>Math.floor(.8*Math.ceil(amount(s,side,id,budget)-eps)+eps);
const roundedAmount=(s,side,id,n)=>Math.round(amount(s,side,id,n));
const manaAmount=(s,side,id,n)=>Math.floor(amount(s,side,id,n,false)+eps);
// Damage is scaled independently of healing, shields and voluntary HP prices.
// Round the outgoing hit up, then round the defended hit up (zero stays zero).
export const damagePower=(s,side,id,base)=>Math.ceil(amount(s,side,id,base)*(has(s,side,'foreAim')&&!SPELLS[id]?.construct&&id!=='omen'?(.75+Math.min(100,skillValue(s,side,id)+10)/200)/skillFactor(s,side,id):1)*s.config.damageMultiplier-eps);
const actionPartCache=new Map();
export const actionParts=id=>{let parts=actionPartCache.get(id);if(!parts){parts=Object.freeze(id.startsWith('bundle:')?id.slice(7).split('+'):[id]);actionPartCache.set(id,parts);}return parts;};
export const label=id=>id?.startsWith('bundle:')?actionParts(id).map(label).join(' + '):SPELLS[id]?.name??({strike:'Strike',guard:'Guard',reclaim:'Reclaim',hold:'Hold',release:'Release',frozen:'Frozen',cancel:'Cancelled'}[id]??id);
const bundleCache=new Map();
function cachedBundles(count){
 if(bundleCache.has(count))return bundleCache.get(count);
 const out=new Set();
 function add(parts,start){if(parts.length===count){const normalized=parts.filter((id,i)=>id==='strike'||parts.indexOf(id)===i);out.add('bundle:'+normalized.join('+'));return;}for(let i=start;i<3;i++)add([...parts,BASICS[i]],i);}
 add([],0);const result=Object.freeze([...out]);bundleCache.set(count,result);return result;
}
export function basicBundles(count){return [...cachedBundles(count)];}
export function actorToMove(s){return s.result?null:s.pending[s.leader]===null?s.leader:1-s.leader;}
export function cost(s,side,id){
 if(id==='hold')return (SPELLS[s.actors[side].channel?.id]?.holdCost??0)*s.config.manaCostScale;
 return s.searchKits?.[side]?.costs[id]??((SPELLS[id]?.cost[rank(s,side,id)-1]??0)*s.config.manaCostScale);
}
export const hpCost=(s,side,id)=>(has(s,side,'heartprice')?Math.ceil(cost(s,side,id)*P.heartprice.hpPerMana-eps):0)+(SPELLS[id]?.hpCost?Math.ceil(amount(s,side,id,SPELLS[id].hpCost)-eps):0);
export function available(s,side,id){
 const a=s.actors[side];
 if(a.freezeUntil>=s.round)return id==='frozen'?'':'Frozen this exchange';
 if(id==='frozen'||id==='cancel')return 'Not an available action';
 if(a.channel&&!['hold','release'].includes(id))return 'Hold or Release while channeling';
 if(!a.channel&&['hold','release'].includes(id))return 'Not channeling';
 if(!a.channel&&has(s,side,'haste')){if(!cachedBundles(a.effects.haste.value).includes(id))return 'Haste requires one basic-action bundle';}
 else if(id.startsWith('bundle:'))return 'No Haste bundle available';
 if(!BASICS.includes(id)&&!id.startsWith('bundle:')&&!['hold','release'].includes(id)){
  if(!SPELLS[id]||!a.kit.spells[id])return 'Not learned';
  if(SPELLS[id].castable===false)return 'Cards/story only';
 }
 if(!has(s,side,'heartprice')&&a.resources.mana+eps<cost(s,side,id))return 'Not enough ready Mana';
 if(a.hp+eps<hpCost(s,side,id))return 'Not enough HP';
 return '';
}
export function legalActions(s,side=actorToMove(s)){
 if(side===null)return [];
 const a=s.actors[side];
 const ids=a.freezeUntil>=s.round?['frozen']:a.channel?['hold','release']:has(s,side,'haste')?cachedBundles(a.effects.haste.value):(s.searchKits?.[side]?.actions??[...BASICS,...Object.keys(a.kit.spells)]);
 return ids.filter(id=>!available(s,side,id));
}
export const wardBlock=()=>Infinity;
export function attackPower(s,side,id,bonus=0){
 const base=id==='strike'?ECONOMY.basics.strikeDamage:SPELLS[id]?.damage?.[rank(s,side,id)-1];
 const prep=has(s,side,'foreAim')?(.75+Math.min(100,skillValue(s,side,id)+10)/200)/skillFactor(s,side,id):1;
 return base===undefined?0:Math.ceil((amount(s,side,id,base)*prep+bonus)*s.config.damageMultiplier-eps);
}
function debit(a,key,n){const actual=Math.min(Math.max(0,n),a.resources[key]-(key==='alignment'?-100:0));a.resources[key]-=actual;a.spent[key]+=actual;return actual;}
function gain(s,side,key,n){
 const a=s.actors[side],limit=key==='mana'?a.kit.capacity:key==='crowns'?99999:key==='health'?a.entry.health:100;
 const actual=Math.max(0,Math.min(n,limit-a.resources[key]));a.resources[key]+=actual;a.restored[key]+=actual;
 if(key==='mana'&&actual>eps)delete a.effects.shadowstep;
 return actual;
}
function heal(s,side,n){const a=s.actors[side],actual=Math.max(0,Math.min(n,a.maxHP-a.hp));a.hp+=actual;gain(s,side,'health',n);return actual;}
function endConstruct(s,side,c){if(CONSTRUCTS[c.id].burst){const power=damagePower(s,side,c.id,CONSTRUCTS[c.id].burst);for(const target of [0,1])s.bursts.push({source:side,target,power,spell:true,id:'contraption',group:`burst:${s.round}:${side}`,self:side===target});}event(s,`${label(c.id)} ended.`);}
function reduceHP(s,side,n,damage=true){
 const a=s.actors[side],actual=Math.max(0,Math.min(a.hp,n));a.hp-=actual;debit(a,'health',actual);
 if(damage&&actual>0){
  for(const c of a.constructs)c.taken+=actual;
  const ending=a.constructs.filter(c=>c.taken+eps>=c.threshold);a.constructs=a.constructs.filter(c=>!ending.includes(c));for(const c of ending)endConstruct(s,side,c);
 }
 if(a.hp<=eps&&a.rimeReady&&!a.rimeUsed){a.rimeReady=false;a.rimeUsed=true;a.hp=1;a.freezeUntil=s.round+1;if(s.config.healthModel==='direct')gain(s,side,'health',1);event(s,`${side===0?'You':'Opponent'} froze on 1 HP; thaw after next exchange.`);}
 return actual;
}
function pay(s,side,id){
 const a=s.actors[side],c=cost(s,side,id),h=hpCost(s,side,id);
 if(has(s,side,'heartprice')){reduceHP(s,side,h,false);}else{const paid=debit(a,'mana',c);a.flux+=paid*FLUX_RATIO;if(h)reduceHP(s,side,h,false);}
 const tier=SPELLS[id]?.alignment;
 if(tier)debit(a,'alignment',ALIGNMENT_COST[tier]);
 if(SPELLS[id]?.group==='forbidden'&&s.config.observers){s.reports.push({side,spell:id,round:s.round});event(s,`Observers witnessed forbidden ${label(id)}.`);}
}
function summon(s,side,id){
 const a=s.actors[side],coexist=(id==='bramble'&&a.constructs.some(c=>c.id==='heartwood'))||(id==='heartwood'&&a.constructs.some(c=>c.id==='bramble'));
 const keep=coexist?a.constructs.filter(c=>c.id!==id):[];
 for(const c of a.constructs)if(!keep.includes(c))endConstruct(s,side,c);
 const spec=CONSTRUCTS[id];a.constructs=[...keep,{id,power:spec.action==='heal'?healingPower(s,side,id,P.heartwood.damageEquivalentHealingBudget):damagePower(s,side,id,spec.power),reduction:roundedAmount(s,side,id,spec.reduction),threshold:Math.ceil(amount(s,side,id,spec.threshold)),taken:0,expires:s.round+spec.maxExchanges-1}];
}
function hit(s,source,id,power,extra={}){return {source,target:1-source,id,power,spell:true,group:`action:${s.round}:${source}`,...extra};}
// Each phase is simultaneous. Shadowstep breaks after its outgoing damage phase.
function hits(s,initial){
 let queue=[...initial],waves=0;
 while(queue.length||s.bursts.length){
  if(++waves>12)throw Error('Unexpected damage chain');
  const batch=[...queue,...s.bursts];s.bursts=[];queue=[];const expose=new Set();
  for(const h of batch){
   const a=s.actors[h.target];let n=h.power;
   if(n<=eps||a.freezeUntil>=s.round||has(s,h.target,'shadowstep'))continue;
   if(h.spell&&h.source!==h.target&&has(s,h.target,'reflect')&&!h.reflected){const e=a.effects.reflect;if(e.action===undefined)e.action=h.group;if(e.action===h.group){queue.push({...h,power:Math.ceil(h.power*P.reflect.returnedFraction-eps),source:h.target,target:h.source,reflected:true,group:h.group+':reflected'});continue;}}
   if(has(s,h.target,'guard'))n*=h.spell?1-ECONOMY.basics.guardSpellBlockFraction:1-ECONOMY.basics.guardPhysicalBlockFraction;
   if(n>eps&&has(s,h.target,'ward')){
    const e=a.effects.ward;if(e.action===undefined)e.action=h.group;
    if(e.action===h.group)n=h.id==='starlight'?n/3:0;
   }
   if(n>eps&&has(s,h.target,'brace'))n=Math.max(0,n-a.effects.brace.value);
   n=Math.max(0,n-a.constructs.reduce((sum,c)=>sum+c.reduction,0));
   if(n>eps&&a.effects.lodestar){const absorbed=Math.min(n,a.effects.lodestar.value);n-=absorbed;a.effects.lodestar.value-=absorbed;if(a.effects.lodestar.value<=eps)delete a.effects.lodestar;}
   const actual=reduceHP(s,h.target,Math.max(0,Math.ceil(n-eps)));
   if(actual>eps){
    if(h.source!==h.target)expose.add(h.source);
    if(h.id==='siphon'&&s.actors[h.source].channel?.id==='siphon')s.actors[h.source].channel.total+=actual;
    if(h.source!==h.target&&!h.self&&has(s,h.target,'eclipse')){const e=a.effects.eclipse,received=gain(s,h.target,'mana',Math.min(Math.floor(actual*P.eclipse.manaPerHpDamage),e.value));e.value-=received;}
    event(s,`${label(h.id)} dealt ${Math.round(actual*100)/100} HP to ${h.target===0?'you':'opponent'}.`);
   }
  }
  for(const side of expose)delete s.actors[side].effects.shadowstep;
 }
}
function prepared(s,side,id,attacks){
 const a=s.actors[side],other=s.actors[1-side],r=rank(s,side,id)-1;
 if(id.startsWith('bundle:')){if(actionParts(id).includes('guard'))put(s,side,'guard',1);return;}
 if(SPELLS[id]?.construct){summon(s,side,id);return;}
 if(SPELLS[id]?.channel){a.channel={id,holds:0,bank:0,total:0};if(id==='siphon')attacks.push(hit(s,side,id,damagePower(s,side,id,P.siphon.damageOnStart)));return;}
 switch(id){
  case 'guard':put(s,side,'guard',1);break;
  case 'mend':heal(s,side,healingPower(s,side,id,P.mend.damageEquivalentBudgets[r]));break;
  case 'ward':put(s,side,'ward',1);break;
  case 'brace':put(s,side,'ward',1);put(s,side,'brace',roundedAmount(s,side,id,P.brace.reductions[0]),s.round+1,s.round+3);break;
  case 'foresight':put(s,side,'foreAim',10,s.round,s.round+1);break;
  case 'haste':put(s,side,'haste',SPELLS.haste.actions[r],s.round+1,s.round+1);break;
  case 'shadowstep':put(s,side,'shadowstep',1,s.round,s.round+SPELLS.shadowstep.duration[r]-1);break;
  case 'glamour':if(s.config.observers){const award=Math.max(0,SPELLS.glamour.renown[r]-a.glamourAwarded);a.pendingRenown+=award;a.glamourAwarded+=award;};break;
  case 'seal':other.flux=Math.max(0,other.flux-manaAmount(s,side,id,P.seal.fluxErased));break;
  case 'omen':a.omens.push({due:s.round+2,power:damagePower(s,side,id,P.omen.damage)});break;
  case 'sleight':break; // Simultaneous transfers are resolved before preparations.
  case 'rapport':break; // Pay the fixed Crowns spend before simultaneous theft.
  case 'purify':gain(s,side,'mana',manaAmount(s,side,id,P.purify.manaGain));break;
  case 'tailwind':put(s,side,'tailwind',0,s.round+1,s.round+3);break;
  case 'rime':if(!a.rimeUsed)a.rimeReady=true;break;
  case 'reflect':put(s,side,'reflect',1);break;
  case 'torment':put(s,1-side,'torment',damagePower(s,side,id,P.torment.hpCostPerOpponentAction),s.round,s.round+2);s.actors[1-side].effects.torment.source=side;break;
  case 'extraction':break; // Transfers are simultaneous below, before preparations.
  case 'eclipse':put(s,side,'eclipse',manaAmount(s,side,id,P.eclipse.manaGainCap),s.round+1,s.round+1);break;
  case 'heartprice':put(s,side,'heartprice',1,s.round,null);break;
  case 'hold':{
   const c=a.channel;c.holds++;
   if(c.id==='moonwell')c.bank+=manaAmount(s,side,c.id,P.moonwell.manaBankedPerHold);
   if(c.id==='lodestar')c.bank+=Math.ceil(amount(s,side,c.id,P.lodestar.absorbPerHold));
   if(c.id==='wildfire'){attacks.push(hit(s,side,c.id,damagePower(s,side,c.id,P.wildfire.holdDamage),{hot:true}));attacks.push(hit(s,side,c.id,damagePower(s,side,c.id,P.wildfire.holdSelfDamage),{target:side,self:true,hot:true}));}
   if(c.id==='siphon')attacks.push(hit(s,side,c.id,damagePower(s,side,c.id,P.siphon.damagePerHold)));
   break;
  }
  case 'release':{
   const c=a.channel;a.channel=null;
   if(c.id==='starlight')attacks.push(hit(s,side,c.id,damagePower(s,side,c.id,c.holds?P.starlight.releaseDamageAfterHold:P.starlight.releaseDamage)));
   if(c.id==='wildfire')attacks.push(hit(s,side,c.id,damagePower(s,side,c.id,P.wildfire.releaseDamage),{hot:true}));
   if(c.id==='siphon')heal(s,side,Math.floor(c.total*P.siphon.healFractionOfActualDamage));
   if(c.id==='moonwell')gain(s,side,'mana',c.bank);
   if(c.id==='lodestar')put(s,side,'lodestar',Math.ceil(amount(s,side,c.id,P.lodestar.initialAbsorb))+c.bank,s.round,null);
   break;
  }
 }
}
function replay(s,side){const id=s.actors[side].lastAction;return id&&!available(s,side,id)?id:'cancel';}
function terminal(s){
 const alive=s.actors.map(a=>a.hp>eps);if(alive.every(Boolean))return false;
 const winner=alive[0]?0:alive[1]?1:s.leader;
 finish(s,winner===0?'win':'lose','knockout',{winner,...(!alive[0]&&!alive[1]?{tiebreak:'telegraphed initiative'}:{})});return true;
}
export function canDamage(s,side){
 const a=s.actors[side],target=s.actors[1-side],flat=target.constructs.reduce((n,c)=>n+c.reduction,0);
 if(attackPower(s,side,'strike')>flat+eps)return true;
 if(a.constructs.some(c=>CONSTRUCTS[c.id].action!=='heal'&&c.power>flat+eps)||a.omens.some(o=>o.power>flat+eps))return true;
 const channelBase={starlight:P.starlight.releaseDamageAfterHold,wildfire:P.wildfire.releaseDamage}[a.channel?.id];
 if(channelBase&&damagePower(s,side,a.channel.id,channelBase)>flat+eps)return true;
 const mana=a.resources.mana+a.flux+(a.channel?.id==='moonwell'?a.channel.bank:0);
 const canFund=!!a.kit.spells.moonwell||(a.kit.spells.purify&&a.hp>hpCost(s,side,'purify'));
 const blood=has(s,side,'heartprice')||!!a.kit.spells.heartprice;
 for(const id of Object.keys(a.kit.spells)){
  if(!canFund&&cost(s,side,id)>mana+eps&&!(blood&&a.hp+eps>=Math.ceil(cost(s,side,id)*P.heartprice.hpPerMana)))continue;
  if(id==='torment')return true; // HP action costs bypass hit reduction.
  if(id==='compel'&&target.lastAction&&!available(s,1-side,target.lastAction)&&hpCost(s,1-side,target.lastAction)>0)return true;
  const spec=CONSTRUCTS[id];if(spec&&spec.action!=='heal'&&damagePower(s,side,id,spec.power)>flat+eps)return true;
  const power=id==='starlight'?damagePower(s,side,id,P.starlight.releaseDamageAfterHold):id==='wildfire'?damagePower(s,side,id,P.wildfire.releaseDamage):id==='siphon'?damagePower(s,side,id,P.siphon.damageOnStart):id==='omen'?damagePower(s,side,id,P.omen.damage):attackPower(s,side,id);
  if(power>flat+eps)return true;
 }
 return false;
}
export function finish(s,outcome,reason,details={}){
 if(s.result)return;s.result={outcome,reason,round:s.round,...details};
 s.settlement=s.actors.map((a,side)=>{
  const flux=a.flux,collected=gain(s,side,'mana',flux);a.flux=0;
  const award=gain(s,side,'renown',a.pendingRenown);a.pendingRenown=0;
  return Object.fromEntries(RESOURCES.map(k=>{
   const before=a.resources[k],loss=Math.max(0,a.entry[k]-before),refund=k==='alignment'||k==='crowns'?0:Math.floor(loss*s.rebates[k]+eps),final=before+refund;a.resources[k]=final;
   return [k,{entry:a.entry[k],spent:a.spent[k],restored:a.restored[k],before,refund,final,netLoss:a.entry[k]-final,...(k==='mana'?{fluxCollected:collected,fluxDiscarded:flux-collected}:{}),...(k==='renown'?{earnedAtSettlement:award}:{})}];
  }));
 });
 s.result.followUps=s.reports.length?[{type:'forbidden_cast_report',casts:s.reports.map(r=>({...r}))}]:[];
}
function resolve(s){
 const original=[...s.pending],pair=[...original];s.lastPair=pair;s.lastEvents=[];s.bursts=[];
 const wasHaste=s.actors.map((_,i)=>has(s,i,'haste'));
 // Compel replays deterministic public history, never chooses an opponent menu.
 for(const side of [0,1])if(has(s,side,'compelled')&&s.actors[side].freezeUntil<s.round)pair[side]=replay(s,side);
 const compels=pair.map(id=>id==='compel');
 if(compels[0]&&compels[1]){for(const side of [0,1])pay(s,side,'compel');pair[0]=pair[1]='cancel';event(s,'Opposing Compels cancel each other.');}
 else for(const side of [0,1])if(compels[side]){
  pay(s,side,'compel');const target=1-side;put(s,target,'compelled',1,s.round+1,s.round+1);
  if(s.actors[target].freezeUntil<s.round)pair[target]=replay(s,target);
 }
 const attacks=[];
 for(const side of [0,1]){
  const id=pair[side],a=s.actors[side];
  if(!['cancel','frozen','compel'].includes(id)){
   // A replay can become unaffordable after another preparation; cancel safely.
   if(available(s,side,id)){pair[side]='cancel';continue;}
   pay(s,side,id);
  }
  if(has(s,side,'tailwind')&&!(actionParts(id).every(p=>p==='strike')))delete a.effects.tailwind;
 }
 // Own voluntary spending happens before theft; two Sleights transfer from
 // the same snapshot, so neither engine seat can steal newly incoming Crowns.
 if(s.config.observers)for(const side of [0,1])if(pair[side]==='rapport'){const a=s.actors[side],n=Math.floor(Math.min(Math.max(0,P.rapport.maxCrownsPerFight-a.rapportCrowns),a.resources.crowns)/2)*2;debit(a,'crowns',n);a.rapportCrowns+=n;a.pendingRenown+=n/2;}
 const thefts=[0,1].map(side=>pair[side]==='sleight'?Math.min(5,s.actors[1-side].resources.crowns,99999-s.actors[side].resources.crowns):0);
 for(const side of [0,1])debit(s.actors[1-side],'crowns',thefts[side]);
 for(const side of [0,1])gain(s,side,'crowns',thefts[side]);
 // Snapshot transfers so two Extractions have no engine-seat ordering advantage.
 const transfers=[0,1].map(side=>pair[side]==='extraction'?Math.min(manaAmount(s,side,'extraction',P.extraction.manaTransferred),s.actors[1-side].resources.mana,s.actors[side].kit.capacity-s.actors[side].resources.mana):0);
 for(const side of [0,1])debit(s.actors[1-side],'mana',transfers[side]);
 for(const side of [0,1])gain(s,side,'mana',transfers[side]);
 for(const side of [0,1])if(!['cancel','frozen','compel'].includes(pair[side]))prepared(s,side,pair[side],attacks);
 for(const side of [0,1]){
  const id=pair[side],a=s.actors[side];
  for(const part of actionParts(id)){
   if(part==='strike'){
    let bonus=0;if(has(s,side,'tailwind')){a.effects.tailwind.value=Math.min(3,a.effects.tailwind.value+1);bonus=amount(s,side,'tailwind',P.tailwind.strikeBonuses[a.effects.tailwind.value-1]);}const power=attackPower(s,side,'strike',bonus);
    attacks.push(hit(s,side,'strike',power,{spell:false}));
   }else if(SPELLS[part]?.damage)attacks.push(hit(s,side,part,attackPower(s,side,part),{hot:part==='flame'}));
  }
  if(has(s,side,'torment')&&!['cancel','frozen'].includes(id)){reduceHP(s,side,a.effects.torment.value,false);event(s,`Torment charged ${a.effects.torment.value.toFixed(2)} HP for the action.`);}
 }
 for(const cold of attacks.filter(h=>h.id==='hoarfrost')){
  const hot=attacks.filter(h=>h.source===cold.target&&h.hot);
  if(hot.length){cold.power=0;for(const h of hot)h.power=0;event(s,'Hoarfrost and opposing fire cancel.');}
 }
 // Reclaim exposes the caster for this whole damage phase, but pays out later.
 // Empty flux or a full Mana pool still means no recovery and no evasion break.
 for(const side of [0,1])if(actionParts(pair[side]).includes('reclaim')){
  const a=s.actors[side];if(Math.min(a.flux,a.kit.capacity-a.resources.mana)>eps)delete a.effects.shadowstep;
 }
 hits(s,attacks);
 if(terminal(s))return;
 for(const side of [0,1])if(actionParts(pair[side]).includes('reclaim')){const a=s.actors[side],n=gain(s,side,'mana',a.flux);a.flux=0;event(s,`${side===0?'You':'Opponent'} reclaimed ${n.toFixed(2)} Mana.`);}
 const endings=[];
 for(const side of [0,1]){
  const a=s.actors[side];
  for(const o of a.omens.filter(o=>o.due===s.round))endings.push(hit(s,side,'omen',o.power,{group:`omen:${s.round}:${side}`}));
  a.omens=a.omens.filter(o=>o.due>s.round);
  for(const c of a.constructs){if(CONSTRUCTS[c.id].action==='heal')heal(s,side,c.power);else endings.push(hit(s,side,c.id,c.power,{spell:CONSTRUCTS[c.id].action!=='strike',group:`construct:${s.round}:${side}:${c.id}`}));}
 }
 hits(s,endings);
 // A construct gets its final public tick before lifetime expiry and its burst.
 for(const side of [0,1]){const a=s.actors[side],expired=a.constructs.filter(c=>c.expires<=s.round);a.constructs=a.constructs.filter(c=>!expired.includes(c));for(const c of expired)endConstruct(s,side,c);}
 hits(s,[]);if(terminal(s))return;
 for(const side of [0,1]){
  const a=s.actors[side],id=pair[side];a.lastAction=id;
  if(wasHaste[side])delete a.effects.haste;
  if(attacks.some(h=>h.source===side&&h.target!==side&&h.power>0))delete a.effects.foreAim;
  if(has(s,side,'brace')){const e=a.effects.brace;const age=s.round-e.from+1;e.value=roundedAmount(s,side,'brace',P.brace.reductions[age]??0);}
  for(const [k,e]of Object.entries(a.effects))if(e.until!==null&&e.until<=s.round)delete a.effects[k];
 }
 s.earlyCommit=s.earlyCommit.map(n=>Math.max(0,n-1));
 for(const side of [0,1])if(pair[side]==='foresight')s.earlyCommit[1-side]=SPELLS.foresight.duration[rank(s,side,'foresight')-1];
 s.round++;s.normalLeader=1-s.normalLeader;s.leader=(s.earlyCommit[0]>0)===(s.earlyCommit[1]>0)?s.normalLeader:s.earlyCommit[0]>0?0:1;s.pending=[null,null];
 if(!canDamage(s,0)&&!canDamage(s,1))finish(s,'draw','stalemate');
}
export function applyChoice(s,id){
 const side=actorToMove(s);if(side===null)throw Error('Fight ended');if(!legalActions(s,side).includes(id))throw Error('Illegal or unaffordable action: '+id);
 return applyKnownChoice(s,id,false);
}
// Internal search API: caller must generate this action from legalActions(s).
export function applySearchChoice(s,id){return applyKnownChoice(s,id,true);}
function applyKnownChoice(s,id,search){
 const side=actorToMove(s);s.pending[side]=id;
 if(s.pending[0]!==null&&s.pending[1]!==null){
  if(search){resolve(s);return {resolved:true};}
  const round=s.round,leader=s.leader,committed=[...s.pending];resolve(s);return {resolved:true,round,leader,committed,pair:s.lastPair,events:[...s.lastEvents],result:s.result};
 }
 return {resolved:false,side};
}
export function describe(s,side,id){
 const a=s.actors[side],r=rank(s,side,id)-1,fmt=n=>Math.round(n*100)/100,d=(spell,n)=>damagePower(s,side,spell,n),v=(spell,n)=>Math.ceil(amount(s,side,spell,n)),m=(spell,n)=>manaAmount(s,side,spell,n);
 const channelText=(spell,release=false)=>{
  const c=a.channel,holds=c?.holds??0;
  if(spell==='starlight')return release?`Deal ${d(spell,holds?P.starlight.releaseDamageAfterHold:P.starlight.releaseDamage)} spell damage; a third passes Ward.`:`Charge the release to ${d(spell,P.starlight.releaseDamageAfterHold)} spell damage. Further Holds add no damage.`;
  if(spell==='wildfire')return release?`Deal ${d(spell,P.wildfire.releaseDamage)} spell damage.`:`Deal ${d(spell,P.wildfire.holdDamage)} spell damage to them and ${d(spell,P.wildfire.holdSelfDamage)} to yourself.`;
  if(spell==='siphon')return release?`Heal ${Math.floor((c?.total??0)*P.siphon.healFractionOfActualDamage)} HP from damage dealt.`:`Deal ${d(spell,P.siphon.damagePerHold)} spell damage; bank actual damage for 60% healing.`;
  if(spell==='moonwell')return release?`Gain up to ${fmt(c?.bank??0)} ready Mana, capped at capacity.`:`Bank ${m(spell,P.moonwell.manaBankedPerHold)} Mana; Release makes it ready.`;
  if(spell==='lodestar')return release?`Gain ${v(spell,P.lodestar.initialAbsorb)+(c?.bank??0)} absorb, consumed across hits.`:`Bank ${v(spell,P.lodestar.absorbPerHold)} additional absorb for Release.`;
  return '';
 };
 if(id.startsWith('bundle:'))return 'One public bundle: '+actionParts(id).map(label).join(', ')+`. Each Strike deals ${attackPower(s,side,'strike')} physical damage before defenses. Repeated Guard/Reclaim add nothing.`;
 if(id==='strike')return `Deal ${attackPower(s,side,id,has(s,side,'tailwind')?amount(s,side,'tailwind',P.tailwind.strikeBonuses[Math.min(2,a.effects.tailwind.value)]):0)} physical damage before defenses; Guard stops two thirds.`;
 if(id==='guard')return 'Stop two thirds of physical damage and one third of spell damage this exchange.';
 if(id==='reclaim')return `Recover up to ${fmt(a.flux)} flux after attacks, capped at capacity; recovering Mana breaks Shadowstep before this exchange's attacks.`;
 if(id==='hold'||id==='release')return `${label(id)} ${label(a.channel?.id)}. ${channelText(a.channel?.id,id==='release')}`;
 if(id==='frozen')return 'Cannot act or be hurt this exchange; then thaw.';
 if(SPELLS[id]?.construct){const c=CONSTRUCTS[id];return `${c.action==='heal'?'Heal '+healingPower(s,side,id,P.heartwood.damageEquivalentHealingBudget)+' HP':'Deal '+d(id,c.power)+(c.action==='strike'?' physical':' spell')+' damage before defenses'} each exchange end; reduce each hit by ${roundedAmount(s,side,id,c.reduction)}; ends after ${v(id,c.threshold)} HP damage taken or ${c.maxExchanges} exchanges including this one.${c.burst?' On ending: '+d(id,c.burst)+' spell damage to both sides before defenses.':''}`;}
 const text={
  flame:`Deal ${attackPower(s,side,id)} spell damage before defenses. Guard stops one third.`,foresight:`Opponent commits first for ${SPELLS.foresight.duration[r]} subsequent exchanges. Next direct damaging action by the following exchange uses +10 relevant skill, capped at 100.`,mend:`Heal ${healingPower(s,side,id,P.mend.damageEquivalentBudgets[r])} HP/Health, capped at entry.`,
  glamour:`With observers: earn up to ${SPELLS.glamour.renown[r]} total Renown this fight at settlement; repeated casts do not stack.`,haste:`Next exchange commit ${SPELLS.haste.actions[r]} basic actions as one bundle.`,shadowstep:`Evade attacks for ${SPELLS.shadowstep.duration[r]} exchanges including this one; breaks on outgoing damage or Mana recovery.`,ward:'Block the next damaging action this exchange. One third of Starlight passes.',
  starlight:`Start channel. Release for ${d(id,P.starlight.releaseDamage)} spell damage, or ${d(id,P.starlight.releaseDamageAfterHold)} after a Hold; a third passes Ward. Holds cost ${SPELLS[id].holdCost*s.config.manaCostScale} Mana.`,seal:`Erase up to ${m(id,P.seal.fluxErased)} opposing flux.`,wildfire:`Start channel. Each Hold: ${d(id,P.wildfire.holdDamage)} spell damage to them, ${d(id,P.wildfire.holdSelfDamage)} to you. Release: ${d(id,P.wildfire.releaseDamage)} spell damage. All before defenses.`,omen:`Public hit of ${d(id,P.omen.damage)} spell damage before defenses two exchanges later.`,sleight:'Steal up to 5 Crowns; alignment −tiny.',hoarfrost:`Deal ${attackPower(s,side,id)} cold spell damage before defenses; opposing Flame or Wildfire damage cancels with it.`,
  candour:'No combat effect.',brace:`Ward this exchange, then reduce every hit by ${P.brace.reductions.map(n=>roundedAmount(s,side,id,n)).join('/')} over the next three exchanges.`,quickquill:'No combat effect.',index:'No combat effect.',rapport:'With observers, spend up to 10 Crowns total this fight; earn 1 Renown per 2 spent at settlement.',purify:`Pay ${fmt(hpCost(s,side,id))} HP; gain up to ${m(id,P.purify.manaGain)} ready Mana, capped at capacity.`,tailwind:`Next three exchanges: consecutive Strikes deal ${P.tailwind.strikeBonuses.map(n=>attackPower(s,side,'strike',amount(s,side,id,n))).join('/')} physical damage before defenses. Any other action ends the bonus.`,
  rime:'Arm once-per-fight rescue: first knockout freezes you on 1 HP through the following exchange.',reflect:'Block the next damaging spell action this exchange; return half its incoming damage, rounded up. Physical hits are unaffected; one bounce only.',moonwell:`Start channel. Free Holds bank ${m(id,P.moonwell.manaBankedPerHold)} Mana each; Release makes it ready.`,lodestar:`Start channel. Free Holds bank ${v(id,P.lodestar.absorbPerHold)} additional absorb; Release grants ${v(id,P.lodestar.initialAbsorb)} plus bank, consumed across hits.`,toll:'Cards/story only; not a combat cast.',
  torment:`For three exchanges including this one, each opposing action pays ${d(id,P.torment.hpCostPerOpponentAction)} HP, bypassing hit reductions.`,extraction:`Transfer up to ${m(id,P.extraction.manaTransferred)} opposing ready Mana to your available capacity.`,siphon:`Start deals ${d(id,P.siphon.damageOnStart)} spell damage; each Hold deals ${d(id,P.siphon.damagePerHold)}. Release heals 60% of actual total damage dealt, rounded down; Holds cost ${SPELLS[id].holdCost*s.config.manaCostScale} Mana.`,compel:'Replace their action with their last legal public action, now and next exchange. No history: cancel.',eclipse:`External damage actually taken next exchange returns 75% as ready Mana, rounded down, up to ${m(id,P.eclipse.manaGainCap)} total.`,heartprice:'For the rest of the fight, pay 0.8 HP per nominal Mana, rounded up per payment; HP payments create no flux.'
 };
 return (text[id]??'')+(SPELLS[id]?.group==='forbidden'?' Forbidden: alignment −small each cast; witnessed casts are reported.':'');
}

export function concede(s,side=0){if(![0,1].includes(side))throw Error('Invalid actor');finish(s,side===0?'lose':'win','conceded',{winner:1-side});}
