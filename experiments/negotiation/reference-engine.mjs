import {encounterOptions,meetingLimits} from './encounters.mjs';
import schema from './schema.mjs';import {makePool,POOLS} from './cards.mjs';
export {POOLS};export const SPELLS=schema.spells,ICONS=schema.icons,VERSION=schema.version;
export const SKILLS=['arcana','lore','alchemy','charm','vigor','guile'];
export const RESOURCES=['mood','mana','health','gold','renown','alignment'];
export const SUPPORT=['glamour','foresight','candour','index','rapport','quickquill','haste','shadowstep','reflect','starlight'];
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function manaCapacity(skills){const c=schema.tuning.capacity,weights=Object.entries(c.weights),mean=weights.reduce((n,[key,w])=>n+skills[key]*w,0)/weights.reduce((n,[,w])=>n+w,0);return Math.max(c.min??0,Math.round(c.base+c.slope*(mean-50)));}
const maps=(keys,value)=>Object.fromEntries(keys.map(k=>[k,value]));
export function rng(seed){let state=seed>>>0;return()=>{let a=(state=(state+0x6D2B79F5)|0),t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296;};}
function roll(s,key){let a=(s[key]=(s[key]+0x6D2B79F5)|0),t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296;}
export function playerPreset(level=20,loadout='Balanced',all=false){
 const k=schema.kits[loadout]?.[level],skills=k?{...k.skills}:maps(SKILLS,level),rank=level>=schema.tuning.kits.ranks[1]?3:level>=schema.tuning.kits.ranks[0]?2:1;
 if(loadout!=='Balanced'&&!k)throw Error('Unknown loadout');
 const capacity=manaCapacity(skills);
 // Combat omits social-only spells. Restore the class's declared social extras here.
 const extras=level>=16?Object.keys(schema.loadouts[loadout]?.extras??{}).filter(id=>['rapport','index','quickquill','sleight'].includes(id)):[];
 const learned=all?Object.keys(SPELLS).filter(id=>SPELLS[id].castable!==false):[...new Set([...(k?Object.keys(k.spells):['flame','mend','foresight','haste','shadowstep']),'ward','glamour',...extras])];
 return {level,loadout,skills,spells:Object.fromEntries(learned.map(id=>[id,SPELLS[id].levels===3?rank:1])),capacity,renown:level,relationship:level,alignment:0,preparation:maps(['evocation','astromancy','alchemy','illusion','beastcraft','umbral','artifice','starcalling','hollow_studies'],level),club:maps(['duelling','lumen_ledger','verdant','cartographers'],level),job:maps(['library_assistant','tavern','apothecary_clerk','broom_courier','intern_royal_library','intern_conclave','intern_alchemists','intern_expedition','intern_field_station','intern_thornwick','intern_unseen_office','work'],level),project:maps(['thesis'],level),flags:[]};
}
export function clone(s){return {...s,resources:{...s.resources},spent:{...s.spent},gained:{...s.gained},effects:{...s.effects},events:[],history:[]};}
export function observation(s){const t=clone(s);delete t.cardRng;delete t.checkRng;if(!s.effects.foresight)delete t.pending;t.config={...s.config};delete t.config.seed;return t;}
export function createState(options={}){
 if(options.encounter)options={...encounterOptions(options.encounter,options.level??20),...options};
 const config={level:20,loadout:'Balanced',allSpells:false,pool:'general',difficulty:options.level??20,...meetingLimits(options.difficulty??options.level??20),seed:options.level??20,mood:70,health:70,gold:30,manaScale:1,requests:[],underground:false,...options};
 for(const key of ['level','difficulty'])if(!Number.isInteger(config[key])||config[key]<1||config[key]>100)throw Error('Level and check difficulty must be 1–100');
 if(config.patience!==8||config.suspicionLimit!==6)throw Error('Patience is fixed at 8; Suspicion is fixed at 6');
 for(const key of ['target','patience','suspicionLimit'])if(!Number.isInteger(config[key])||config[key]<1||config[key]>(key==='patience'?40:20))throw Error('Invalid encounter limit (Agreement/Suspicion 1–20; Patience 1–40)');
 if(!Number.isInteger(config.seed)||config.seed<0||config.seed>4294967295)throw Error('Use an unsigned integer seed');
 const base=playerPreset(config.level,config.loadout,config.allSpells),p={...base,...config.player,skills:{...base.skills,...config.player?.skills}};
 for(const key of SKILLS)if(!Number.isFinite(p.skills[key])||p.skills[key]<1||p.skills[key]>100)throw Error('Invalid '+key);
 p.capacity=manaCapacity(p.skills);
 if(!Array.isArray(p.flags)||p.flags.some(f=>typeof f!=='string'))throw Error('Flags must be an array of strings');
 for(const key of ['renown','relationship'])if(!Number.isFinite(p[key])||p[key]<-100||p[key]>100)throw Error('Invalid '+key);
 if(!Number.isFinite(p.alignment)||p.alignment<-100||p.alignment>100)throw Error('Invalid alignment');
 for(const group of ['preparation','club','job','project'])for(const value of Object.values(p[group]))if(!Number.isFinite(value)||value<0||value>100)throw Error('Invalid '+group);
 for(const [id,rank]of Object.entries(p.spells))if(!SPELLS[id]||!Number.isInteger(rank)||rank<1||rank>SPELLS[id].levels)throw Error('Invalid learned spell');
 const entry={mood:config.mood,health:config.health,gold:config.gold,mana:config.mana??p.capacity,renown:p.renown,alignment:p.alignment};
 for(const key of ['mood','health','gold','mana'])if(!Number.isFinite(entry[key])||entry[key]<0||entry[key]>(key==='gold'?99999:key==='mana'?p.capacity:100))throw Error('Invalid entry '+key);
 if(!Number.isFinite(config.manaScale)||config.manaScale<=0)throw Error('Invalid Mana scale');
 config.rebates={mood:.5,mana:.5,health:.5,renown:.5,...options.rebates,gold:0,alignment:0};
 for(const v of Object.values(config.rebates))if(!Number.isFinite(v)||v<0||v>1)throw Error('Invalid rebate');
 const fullResolve=Math.round(12+.22*p.skills.guile+.08*p.skills.charm+.05*p.skills.lore),resolveMax=Math.max(1,Math.round(fullResolve*(entry.mood>=30?1:.4+.6*entry.mood/30)));
 const s={config,player:p,entry,resources:{...entry},spent:maps(RESOURCES,0),gained:maps(RESOURCES,0),pool:makePool(config),fullResolve,resolveMax,resolve:resolveMax,agreement:0,patience:config.patience,suspicion:0,bypasses:0,round:1,castUsed:false,effects:{},card:null,pending:null,result:null,settlement:null,opponentGold:30,events:[],history:[],cardRng:(config.seed^0xA341316C)>>>0,checkRng:(config.seed^0xC8013EA4)>>>0};
 s.card=drawCard(s,null);s.pending=drawCard(s,s.card);return s;
}
export function distribution(s,current=s.card){const list=s.pool.filter(c=>c.id!==current),total=list.reduce((n,c)=>n+c.weight,0);return list.map(c=>({id:c.id,p:c.weight/total}));}
function drawCard(s,current){let u=roll(s,'cardRng');const d=distribution(s,current);for(const c of d){u-=c.p;if(u<=0)return c.id;}return d.at(-1).id;}
export const cardOf=s=>s.pool.find(c=>c.id===s.card);
export function signal(s,card=cardOf(s)){
 if(s.effects.index&&card.type==='check')return {name:'Lore · Index',value:s.player.skills.lore,skill:'lore'};
 const source=card.source,key=card.key;let value;
 if(source==='skills')value=s.player.skills[key];
 else if(source==='alignment')value=50+(key==='lumen'?1:-1)*s.resources.alignment/2;
 else if(['preparation','club','job','project'].includes(source))value=s.player[source][key]??0;
 else value=source==='renown'?s.resources.renown:s.player.relationship;
 return {name:source==='skills'?key:source+(key?' · '+key:''),value:clamp(value,0,100),skill:source==='skills'?key:null};
}
export function chance(s,card=cardOf(s)){
 if(card.type==='flag')return s.player.flags.includes(card.key)?1:0;
 if(card.type==='spell')return s.player.spells[card.key]?1:0;
 if(['gold','health'].includes(card.type))return s.resources[card.type]>=card.amount?1:0;
 const x=signal(s,card),score=x.value,dc=s.config.difficulty+card.dc;
 const fatigue=s.resolve/s.resolveMax<.5?.22*(1-s.resolve/s.resolveMax*2):0;
 const glamour=s.effects.glamour&&(x.skill==='charm'||x.skill==='guile')?s.effects.glamour:0;
 return clamp(.5+.015*(score-dc)+glamour+(s.effects.reflect?.12:0)-fatigue,.05,.95);
}
export const deflectCost=s=>s.effects.rapport?0:4;
export const deflectRisk=s=>s.effects.rapport?0:Math.min(.9,.12+.18*s.bypasses);
export const spellCost=(s,id)=>(SPELLS[id].cost[(s.player.spells[id]??1)-1])*s.config.manaScale;
export function legalActions(s){if(s.result)return [];return ['face',...(s.resolve>0&&s.resolve>=deflectCost(s)?['deflect']:[]),...(!s.castUsed?Object.keys(s.player.spells).filter(id=>SPELLS[id].castable!==false&&s.resources.mana>=spellCost(s,id)):[]),'withdraw'];}
function debit(s,key,n){const paid=Math.min(s.resources[key],Math.max(0,n));s.resources[key]-=paid;s.spent[key]+=paid;return paid;}
const bank=s=>s.agreement>=s.config.target?'win':s.agreement>=s.config.target/2?'partial':'lose';
export function finish(s,outcome,reason){
 if(s.result)return;s.result={outcome,reason};
 const resolveLoss=s.resolveMax-s.resolve,moodHit=Math.min(s.entry.mood,Math.ceil(s.entry.mood*.4*resolveLoss/s.resolveMax));debit(s,'mood',moodHit);
 s.settlement={resolveLoss,moodHit,resources:Object.fromEntries(RESOURCES.map(key=>{const before=s.resources[key],loss=Math.max(0,s.entry[key]-before),rebate=Math.floor(loss*s.config.rebates[key]);s.resources[key]+=rebate;return [key,{entry:s.entry[key],spent:s.spent[key],gained:s.gained[key],before,rebate,final:s.resources[key],netLoss:s.entry[key]-s.resources[key]}];}))};
}
function close(s){if(s.suspicion>=s.config.suspicionLimit)finish(s,'lose','Suspicion reached its limit');else if(s.agreement>=s.config.target)finish(s,'win','Agreement reached');else if(s.patience<=0)finish(s,bank(s),'Patience ran out');else if(s.round>40)finish(s,bank(s),'The meeting has run its course');}
const HOSTILE=new Set(['flame','wildfire','hoarfrost','animate','heartwood','contraption','bramble']);
export function project(state,id,event=false){
 if(!legalActions(state).includes(id))throw Error('Illegal action: '+id);const s=clone(state),card=cardOf(s);
 if(id==='withdraw'){finish(s,'lose','You withdrew');return s;}
 if(SPELLS[id]){
   const rank=s.player.spells[id];debit(s,'mana',spellCost(s,id));s.castUsed=true;
   if(id==='candour'){s.suspicion=Math.max(0,s.suspicion-3);s.effects.candourAt=s.round;}
   else s.suspicion+=id==='glamour'?2:1;
   if(SPELLS[id].alignment){const amount=SPELLS[id].alignment==='tiny'?3:2;s.resources.alignment=Math.max(-100,s.resources.alignment-amount);s.spent.alignment+=amount;}
   s.events.push(`${SPELLS[id].name}: −${spellCost(state,id)} Mana.`);
   if(HOSTILE.has(id)||SPELLS[id].group==='forbidden'&&!s.config.underground){finish(s,'lose','Hostile magic ended the negotiation');return s;}
   if(id==='foresight')s.effects.foresight=SPELLS[id].duration[rank-1];
   if(id==='glamour')s.effects.glamour=[.14,.18,.22][rank-1];
   if(id==='haste')s.effects.haste=rank===3?2:1;
   if(id==='index')s.effects.index=true;
   if(id==='rapport')s.effects.rapport=true;
   if(id==='quickquill'){s.effects.quickquill=true;if(s.effects.candourAt===s.round-1){s.agreement++;s.resources.alignment=Math.max(-100,s.resources.alignment-6);s.spent.alignment+=6;s.events.push('The prior candid answer is on record: +1 Agreement.');}}
   if(id==='reflect')s.effects.reflect=true;
   if(id==='starlight')s.patience=Math.min(s.config.patience+4,s.patience+2);
   if(id==='sleight'){const n=Math.min(5,s.opponentGold);s.opponentGold-=n;s.resources.gold+=n;s.gained.gold+=n;}
   if(id==='compel'&&s.config.underground)s.agreement++;
   if(id==='shadowstep'){close(s);if(!s.result)finish(s,bank(s),'You left through a shadow');return s;}
   close(s);return s;
 }
 if(id==='face'){
   if(event){if(['gold','health'].includes(card.type))debit(s,card.type,card.amount);s.agreement+=1;s.events.push(`Accepted: +1 Agreement.`);}
   else{const hit=s.effects.quickquill?0:card.resolveHit;s.resolve=Math.max(0,s.resolve-hit);s.suspicion+=card.suspicionHit+(s.effects.reflect?1:0);s.patience-=card.patienceHit;s.events.push(`Rejected: −${hit} Resolve, +${card.suspicionHit+(s.effects.reflect?1:0)} Suspicion.`);}
 }else{
   s.resolve-=deflectCost(s);if(event)s.suspicion++;s.patience-=Math.max(1,2-(s.effects.haste??0));s.bypasses++;s.events.push(`Deflected: −${deflectCost(state)} Resolve${event?', +1 Suspicion':''}.`);
 }
 s.round++;s.castUsed=false;
 const {foresight,candourAt}=s.effects;s.effects={...(foresight>1?{foresight:foresight-1}:{}),...(candourAt!==undefined&&candourAt>=s.round-1?{candourAt}:{})};
 close(s);if(!s.result)s.card=null;return s;
}
export function applyAction(s,id){
 if(!legalActions(s).includes(id))throw Error('Illegal action: '+id);
 const history=s.history,round=s.round,card=s.card,isSpell=!!SPELLS[id],p=id==='face'?chance(s):id==='deflect'?deflectRisk(s):null;
 const u=p!==null&&p>0&&p<1?roll(s,'checkRng'):null,success=p===null?false:p===1||u!==null&&u<p;
 const next=project(s,id,success);next.cardRng=s.cardRng;next.checkRng=s.checkRng;
 if(!next.result&&!isSpell){next.card=s.pending;next.pending=drawCard(next,next.card);}
 Object.assign(s,next);s.history=[...history,{round,card,action:id,p,roll:u,event:success,agreement:s.agreement,patience:s.patience,resolve:s.resolve,suspicion:s.suspicion,events:[...s.events]}];return s;
}
export function spellDescription(s,id){const rank=s.player.spells[id]??1;return ({
 glamour:`This Charm/Guile check gains ${Math.round([.14,.18,.22][rank-1]*100)} percentage points. +2 Suspicion.`,
 foresight:`See the next argument, rolling, for ${SPELLS.foresight.duration[rank-1]} responses. It does not change the pool.`,
 candour:'Remove 3 Suspicion. No casting Suspicion. Quickquill on the following turn can record this answer.',
 quickquill:'This failed check costs no Resolve. After last turn’s Candour: +1 Agreement, −6 Alignment.',
 index:'Use Lore alone for this check. Does not bypass an explicit gate or payment.',
 rapport:'This Deflect costs no Resolve and has no Suspicion risk. Still needs positive Resolve and costs Patience.',
 reflect:'This check gains 12 percentage points; rejection adds +1 extra Suspicion. Agreement stays +1.',
 starlight:'Restore 2 Patience, capped at entry Patience +4. +1 Suspicion.',
 haste:'This Deflect costs 1 Patience instead of 2. It does not make a failed ordinary check free.',
 shadowstep:'Leave and settle existing progress: partial at half the Agreement target. Casting Suspicion resolves first.',
 sleight:'Steal up to 5 crowns from the opponent; −3 Alignment. These are real gains, not rebates.',
 compel:s.config.underground?'Gain 1 Agreement; +1 Suspicion, −2 Alignment.':'Forbidden coercion ends this meeting.'
 })[id]??(HOSTILE.has(id)?'Hostile magic immediately fails this meeting.':SPELLS[id].group==='forbidden'?(s.config.underground?'Its underground negotiation effect is not defined; pays Mana, adds Suspicion and costs Alignment.':'Forbidden magic immediately fails this meeting.'):'No negotiation effect. The spell still pays Mana and adds Suspicion.');}
