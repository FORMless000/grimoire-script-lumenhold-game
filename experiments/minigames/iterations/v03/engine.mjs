import {SPELLS,generateKit,levelRng} from './roster.mjs';
export {SPELLS};
export const RESOURCES=['mood','renown','mana','crowns'];
export const FIXTURES={debate:{name:'Academy debate',practical:false,bribery:false},workshop:{name:'Workshop request',practical:true,bribery:false},favor:{name:'Broker’s favor',practical:false,bribery:true}};
export const PROFILES={
 debater:{name:'Debater',weights:{theory:4,motives:3,guarantee:1,scrutiny:1}},
 scholar:{name:'Scholar',weights:{theory:6,motives:2,guarantee:1,scrutiny:2}},
 social:{name:'Social operator',weights:{theory:2,motives:5,guarantee:3,scrutiny:1}},
 skeptic:{name:'Skeptic',weights:{theory:3,motives:2,guarantee:1,scrutiny:4}},
 official:{name:'Official',weights:{theory:3,motives:2,guarantee:4,scrutiny:2}}
};
// Request identities are fixed once drawn. Pressure changes their price, not their identity.
export const REQUESTS={
 theory:{name:'Explain your reasoning',quote:'“Explain why your proposal makes sense.”',confront:'Reason',skill:'lore',deflect:'Bluff',escape:'guile'},
 motives:{name:'Establish common ground',quote:'“Why should I want to help you?”',confront:'Persuade',skill:'charm',deflect:'Reframe',escape:'lore'},
 guarantee:{name:'Put your standing behind it',quote:'“Will you stake your reputation on that?”',confront:'Vouch',skill:'charm',deflect:'Make it personal',escape:'charm',resource:'renown'},
 scrutiny:{name:'Explain the discrepancy',quote:'“Something does not add up. Account for it.”',confront:'Explain',skill:'guile',deflect:'Ask for goodwill',escape:'charm'},
 brazier:{name:'Demonstrate controlled heat',quote:'“Show that you can control the marked brazier.”',confront:'Demonstrate',skill:'arcana',deflect:'Feign expertise',escape:'guile',spell:'flame'},
 spill:{name:'Handle the spill',quote:'“Clear the spill without damaging the samples.”',confront:'Handle it',skill:'alchemy',deflect:'Feign expertise',escape:'guile',spell:'tide'},
 apparatus:{name:'Repair the apparatus',quote:'“Make the broken apparatus usable.”',confront:'Repair',skill:'alchemy',deflect:'Feign expertise',escape:'guile',spell:'shape'},
 sample:{name:'Mend the living sample',quote:'“Restore the damaged specimen.”',confront:'Treat it',skill:'alchemy',deflect:'Feign expertise',escape:'guile',spell:'restoration'},
 disturbance:{name:'Work through the disturbance',quote:'“Keep the demonstration safe in this commotion.”',confront:'Steady it',skill:'vigor',deflect:'Change the subject',escape:'charm',spell:'ward'},
 offer:{name:'Make a contribution',quote:'“A contribution of crowns would settle this point.”',confront:'Pay crowns',skill:'charm',deflect:'Bargain',escape:'charm',resource:'crowns'}
};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const label=id=>SPELLS[id]?.name??({confront:'Confront',deflect:'Deflect',withdraw:'Withdraw'}[id]??id);
export function cloneState(s){return {...s,resources:{...s.resources},spent:{...s.spent},restored:{...s.restored},buffs:{...s.buffs},forecast:[...s.forecast],recent:[...s.recent],events:[...s.events],history:[]};}
export function publicState(s){const t=cloneState(s);delete t.rngState;t.config={...s.config};delete t.config.seed;return t;}
export function createState(options={}){
 const c={level:20,opponentLevel:options.level??20,archetype:'Balanced',opponent:'debater',fixture:'debate',seed:options.opponentLevel??options.level??20,patience:8,target:4,suspicionLimit:6,manaScale:2,...options};
 for(const k of ['level','opponentLevel'])if(!Number.isInteger(c[k])||c[k]<1||c[k]>100)throw Error('Levels must be integers from 1 to 100');
 if(!PROFILES[c.opponent]||!FIXTURES[c.fixture])throw Error('Unknown opponent or encounter');
 if(!Number.isInteger(c.seed)||c.seed<0||c.seed>4294967295)throw Error('Invalid seed');
 if(!Number.isInteger(c.target)||c.target<1||c.target>8||!Number.isInteger(c.patience)||c.patience<1||c.patience>16||!Number.isInteger(c.suspicionLimit)||c.suspicionLimit<1||!Number.isFinite(c.manaScale)||c.manaScale<=0)throw Error('Invalid encounter limits');
 const rank=1+Math.floor((c.level-1)/35),kit=c.archetype==='Balanced'?{archetype:'Balanced',level:c.level,skills:Object.fromEntries(['arcana','vigor','charm','guile','lore','alchemy'].map(k=>[k,c.level])),spells:Object.fromEntries(Object.keys(SPELLS).map(k=>[k,rank])),capacity:40+Math.floor(c.level/2)}:generateKit(c.archetype,c.level,'all');
 const entry={mood:24,renown:3,mana:kit.capacity,crowns:FIXTURES[c.fixture].bribery?18:0,...options.resources};
 for(const k of RESOURCES)if(!Number.isInteger(entry[k])||entry[k]<0||entry[k]>(k==='mana'?kit.capacity:k==='crowns'?99999:100))throw Error('Invalid entry '+k);
 c.rebates={mood:.5,renown:.5,mana:.5,...options.rebates,crowns:0};
 for(const k of RESOURCES)if(!Number.isFinite(c.rebates[k])||c.rebates[k]<0||c.rebates[k]>1)throw Error('Invalid rebate');
 const rng=levelRng(c.opponentLevel),traits=Object.fromEntries(['lore','charm','guile','arcana','alchemy','vigor'].map(k=>[k,Math.floor(rng()*9)-4]));
 const s={config:c,kit,traits,entry,resources:{...entry},spent:Object.fromEntries(RESOURCES.map(k=>[k,0])),restored:Object.fromEntries(RESOURCES.map(k=>[k,0])),agreement:0,patience:c.patience,suspicion:0,pressure:0,round:1,intent:null,forecast:[],recent:[],castUsed:false,deceptions:0,buffs:{},events:[],history:[],result:null,settlement:null,rngState:c.seed>>>0};
 s.intent=draw(s,intentDistribution(s));return s;
}
function random(s){let a=(s.rngState=(s.rngState+0x6D2B79F5)|0),t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296;}
function draw(s,d){let u=random(s);for(const x of d){u-=x.p;if(u<1e-12)return x.id;}return d.at(-1).id;}
export function intentDistribution(s,planned=[]){
 const w={...PROFILES[s.config.opponent].weights},f=FIXTURES[s.config.fixture],history=[...s.recent,...(s.intent?[s.intent]:[]),...planned];
 if(f.practical)for(const k of ['brazier','spill','apparatus','sample','disturbance'])w[k]=2;
 if(f.bribery)w.offer=s.config.opponent==='official'?5:3;
 // State machine uses the request history only, so revealed futures remain valid after any response.
 if(history.at(-1)==='theory')w.motives+=3;
 if(history.at(-1)==='motives')w.theory+=3;
 if(['guarantee','offer','scrutiny'].includes(history.at(-1)))w[history.at(-1)]=0;
 for(const k of ['guarantee','offer'])if(history.slice(-3).filter(x=>x===k).length>=1)w[k]=0;
 if(history.at(-1)===history.at(-2)&&history.length>=2)w[history.at(-1)]=0;
 const total=Object.values(w).reduce((a,b)=>a+b,0);return Object.entries(w).filter(([,v])=>v>0).map(([id,v])=>({id,p:v/total}));
}
export function response(s,id){
 const r=REQUESTS[s.intent],confront=id==='confront',skill=confront?r.skill:r.escape;
 const difficulty=s.config.opponentLevel+s.traits[skill]+(confront?s.pressure*15:s.pressure*4);
 const gap=difficulty-s.kit.skills[skill],c={mood:0,renown:0,mana:0,crowns:0};
 let suspicion=0,patience=confront?1:2;
 if(confront){
   if(r.resource==='renown')c.renown=Math.max(1,1+Math.floor(s.pressure/2)+Math.ceil((s.config.opponentLevel+s.traits.charm-s.kit.skills.charm)/25));
   else if(r.resource==='crowns')c.crowns=6+2*s.pressure;
   else c.mood=Math.max(1,4+Math.ceil(gap/5));
   if(s.intent==='scrutiny')suspicion=-2;
 }else if(skill==='guile'){suspicion=clamp(1+Math.floor(gap/15),0,3);}
 else c.mood=Math.max(1,2+Math.ceil(gap/10));
 if(s.buffs.glamour&&['charm','guile'].includes(skill)){c.mood=Math.max(0,c.mood-s.buffs.glamour);c.renown=Math.max(0,c.renown-1);if(suspicion>0)suspicion--;}
 if(confront&&s.buffs.demonstration===s.intent){c.mood=0;}
 if(s.buffs.haste)patience=Math.max(1,patience-1);
 return {id,name:confront?r.confront:r.deflect,skill,difficulty,cost:c,agreement:confront?1:0,suspicion,patience,pressure:confront?Math.min(3,s.pressure+1):Math.max(0,s.pressure-2)};
}
export function costs(s,id){if(['confront','deflect'].includes(id))return response(s,id).cost;return {mood:0,renown:0,mana:SPELLS[id]?SPELLS[id].cost[s.kit.spells[id]-1]*s.config.manaScale:0,crowns:0};}
export function legalActions(s){if(s.result)return [];return ['confront','deflect',...(!s.castUsed?Object.keys(SPELLS):[]),'withdraw'].filter(id=>RESOURCES.every(k=>s.resources[k]>=costs(s,id)[k]));}
const debit=(s,k,n)=>{const x=Math.min(s.resources[k],n);s.resources[k]-=x;s.spent[k]+=x;return x;};
const restore=(s,k,n)=>{const x=Math.min(s.entry[k]-s.resources[k],n);s.resources[k]+=x;s.restored[k]+=x;return x;};
const bank=s=>s.agreement>=s.config.target?'win':s.agreement>=s.config.target/2?'partial':'lose';
export function finish(s,outcome,reason){if(s.result)return;s.result={outcome,reason};s.settlement=Object.fromEntries(RESOURCES.map(k=>{const before=s.resources[k],rebate=k==='crowns'?0:Math.floor((s.entry[k]-before)*s.config.rebates[k]+1e-9),final=Math.min(s.entry[k],before+rebate);s.resources[k]=final;return [k,{entry:s.entry[k],spent:s.spent[k],restored:s.restored[k],before,rebate,final,netLoss:s.entry[k]-final}];}));}
export function projectAction(state,id){
 if(!legalActions(state).includes(id))throw Error('Illegal or unaffordable action: '+id);
 const s=cloneState(state);s.events=[];
 if(id==='withdraw'){finish(s,bank(s),'You ended the meeting');return s;}
 for(const [k,n] of Object.entries(costs(s,id)))debit(s,k,n);
 if(SPELLS[id]){
   s.castUsed=true;s.suspicion+=id==='glamour'?2:1;const b=s.kit.spells[id]-1;
   s.events.push(`${label(id)} cast; no Patience spent. Spell slot used this turn.`);
   if(id==='foresight')s.forecastGoal=3;
   if(id==='attune')s.events.push(`Recovered ${restore(s,'mood',8+2*b)} encounter-spent Mood.`);
   if(id==='glamour')s.buffs.glamour=6+2*b;
   if(id==='haste')s.buffs.haste=true;
   if(id==='starlight'){s.suspicion=Math.max(0,s.suspicion-3+Math.min(2,s.deceptions));if(s.deceptions){debit(s,'renown',1);s.events.push('Earlier bluffs were exposed; up to 1 Renown lost.');}s.deceptions=0;}
   if(id==='shadowstep'){finish(s,s.suspicion>=s.config.suspicionLimit?'lose':bank(s),'You departed through a shadow');return s;}
   if(REQUESTS[s.intent].spell===id||s.intent==='disturbance'&&id==='hush'){s.buffs.demonstration=s.intent;s.events.push('The spell handles this practical request; confrontation costs no Mood.');}
   else if(['flame','tide'].includes(id)&&!FIXTURES[s.config.fixture].practical){finish(s,'lose',id==='flame'?'The meeting table is on fire.':'The audience and its paperwork are soaking wet.');return s;}
   else if(['flame','tide','ward','hush','shape','restoration'].includes(id))s.events.push('This spell does not address the current request.');
   if(s.suspicion>=s.config.suspicionLimit)finish(s,'lose','Suspicion ended the meeting');
   return s;
 }
 const r=response(s,id);s.agreement+=r.agreement;s.suspicion=Math.max(0,s.suspicion+r.suspicion);s.patience-=r.patience;s.pressure=r.pressure;
 if(id==='deflect'&&r.skill==='guile')s.deceptions++;
 s.events.push(`${r.name}: ${r.agreement?'+1 Agreement; ':''}−${r.patience} Patience; pressure ${s.pressure}; Suspicion ${s.suspicion}.`);
 s.recent=[...s.recent,s.intent].slice(-3);s.buffs={};s.castUsed=false;
 if(s.suspicion>=s.config.suspicionLimit)finish(s,'lose','Suspicion ended the meeting');
 else if(s.agreement>=s.config.target)finish(s,'win','Agreement reached');
 else if(s.patience<=0)finish(s,bank(s),'Patience ran out');
 else{s.round++;s.intent=null;}
 return s;
}
// Exact chance expansion for tests; the timed AI samples only the three-request forecast fan-out.
export function* outcomes(state,id){
 const base=projectAction(state,id);if(base.result){yield {state:base,p:1};return;}
 const goal=base.forecastGoal??(base.intent?base.forecast.length:Math.max(1,base.forecast.length));
 function* fill(s,p){
   if(s.forecast.length>=goal){const t=cloneState(s);if(!t.intent)t.intent=t.forecast.shift();delete t.forecastGoal;yield {state:t,p};return;}
   for(const c of intentDistribution(s,s.forecast)){const t=cloneState(s);t.forecast.push(c.id);yield* fill(t,p*c.p);}
 }
 yield* fill(base,1);
}
export function sampleOutcome(state,id,rng){
 const s=projectAction(state,id);if(s.result)return s;
 const goal=s.forecastGoal??(s.intent?s.forecast.length:Math.max(1,s.forecast.length));
 while(s.forecast.length<goal){let u=rng(),d=intentDistribution(s,s.forecast),chosen=d.at(-1).id;for(const c of d){u-=c.p;if(u<0){chosen=c.id;break;}}s.forecast.push(chosen);}
 if(!s.intent)s.intent=s.forecast.shift();delete s.forecastGoal;return s;
}
export function applyAction(s,id){
 const history=s.history,round=s.round,intent=s.intent;let next=projectAction(s,id);next.rngState=s.rngState;
 if(!next.result){const goal=next.forecastGoal??(next.intent?next.forecast.length:Math.max(1,next.forecast.length));while(next.forecast.length<goal)next.forecast.push(draw(next,intentDistribution(next,next.forecast)));if(!next.intent)next.intent=next.forecast.shift();delete next.forecastGoal;}
 Object.assign(s,next);s.history=[...history,{round,action:id,intent,events:[...s.events],agreement:s.agreement,suspicion:s.suspicion,pressure:s.pressure,patience:s.patience,castUsed:s.castUsed}];return s;
}
export function describeSpell(s,id){return ({foresight:'Reveal the next three requests after this turn. Pressure can still change their costs.',glamour:'This turn: reduce Charm/Guile response Mood cost by '+(6+2*(s.kit.spells[id]-1))+', Renown cost by 1 and response Suspicion by 1. Casting adds 2 Suspicion.',attune:'Recover up to '+(8+2*(s.kit.spells[id]-1))+' encounter-spent Mood, capped at entry.',haste:'This response costs one less Patience, minimum one. Does not grant another spell.',starlight:'Remove 3 Suspicion after casting. Prior bluffs add back up to 2 Suspicion and cost up to 1 Renown.',shadowstep:'Depart immediately and settle the earned result. Casting Suspicion can still end in failure.',flame:'Answer a controlled-heat demonstration. In formal meetings, set the table alight and fail.',tide:'Answer a spill-cleaning demonstration. In formal meetings, soak the audience and fail.',shape:'Answer an apparatus repair request. Otherwise no useful effect.',restoration:'Answer a specimen treatment request. Otherwise no useful effect.',ward:'Answer a physical disturbance request. Otherwise no useful effect.',hush:'Answer a physical disturbance request by quieting the room. Otherwise no useful effect.'})[id];}
