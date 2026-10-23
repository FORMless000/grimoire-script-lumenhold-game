// Standalone testplay version 8. Prior v3 rules remain an explicit legacy fixture.
import {createState as baseState,rng,SPELLS,observation as baseObservation} from '../reference-engine.mjs';
import {core} from '../core.mjs';
import {researchPreset,combatSpellCost,canon} from './progression.mjs';
export const POLICY_VARIANTS=['normal','dumb','hyper-frugal','ignorant'];
export const OBJECTIVES={
 frugal:{name:'Frugal · minimize spending',slack:.06,weights:{gold:.35,renown:.35,health:.40,mana:.25,mood:.08}},
 prudent:{name:'Prudent · lightly preserve',slack:.02,weights:{gold:.04,renown:.05,health:.06,mana:.04,mood:.02}},
 allout:{name:'All-out · maximize wins',slack:0,weights:{gold:0,renown:0,health:0,mana:0,mood:0}}
};
export const PARAMETERS={
 version:8,resolveEffort:1,goldTrace:1,checkBase:.56,checkSlope:.012,levelGapScale:.5,dcSpread:.55,dcBias:0,charmWeight:2,
 targetBase:4,targetSlope:.025,resolveBase:17,resolveSlope:.30,
 skipResolve:4,skipPatience:2,skipRiskBase:.10,skipRiskStep:.12,fatigue:.16,
 spellPower:1,spellSuspicion:1,
 frameWeights:[3,2,2,1.5,1.5,1],moodStake:.35,leafSamples:18
};
export const FRAMES=[
 {id:'open',name:'An open question',text:'They lean forward. “Tell me how it works.”',dc:-5,resolveHit:0,suspicionHit:0,patienceHit:0},
 {id:'record',name:'On the record',text:'They lift a quill. “I will hold you to that answer.”',dc:5,resolveHit:0,suspicionHit:1,patienceHit:0,successSuspicion:1},
 {id:'personal',name:'A personal appeal',text:'Their voice softens. “Can I trust you with this?”',dc:0,resolveHit:2,suspicionHit:0,patienceHit:0,successResolve:4},
 {id:'public',name:'An audience watches',text:'They raise their voice. “Let everyone hear your answer.”',dc:2,resolveHit:0,suspicionHit:-1,patienceHit:0,rejectRenown:4,successPatience:1},
 {id:'demonstration',name:'Show your work',text:'They clear a space. “Show me. Words are not enough.”',dc:7,resolveHit:0,suspicionHit:0,patienceHit:0,demonstration:true},
 {id:'ultimatum',name:'The last word',text:'They reach for the door. “One answer. Make it count.”',dc:-9,resolveHit:0,suspicionHit:0,patienceHit:1,deflectPatience:1}
];
// Effect adaptations are local research parameters. Mana always comes from combat.
// Auras last the stated number of responses, including this one.
const fx=(summary,x={})=>({summary,suspicion:1,duration:1,...x});
export const EFFECTS={
 flame:fx('The papers catch fire. “I agree: you should leave.” The meeting fails.',{fail:true}),
 foresight:fx('Reveal the rolling next argument for three responses.',{duration:3,foresight:true}),
 mend:fx('Spend 3 Health to restore 7 Resolve.',{health:3,restoreResolve:7}),
 glamour:fx('This Charm or Guile check gains 20 percentage points.',{chance:.20,only:['skills:charm','skills:guile']}),
 haste:fx('This Deflect costs 1 less Patience; Vigor checks gain 12 points.',{deflectPatience:-1,chance:.12,only:['skills:vigor']}),
 shadowstep:fx('Slip past this lead: Deflect costs 1 Patience, no Resolve and no Suspicion roll.',{deflectResolve:0,deflectPatience:-1,deflectRisk:0}),
 ward:fx('Ward has no useful effect on this conversation. Mana and casting Suspicion still apply.',{irrelevant:true,duration:0}),
 animate:fx('Animated evidence supports work/preparation checks by 22 points for two responses.',{chance:.22,only:['job','preparation','project'],duration:2}),
 starlight:fx('Stake 3 Renown to restore 2 Patience, capped at entry.',{renown:3,restorePatience:2}),
 seal:fx('For two responses, absorb 2 rejection Suspicion but lose 3 Renown on each rejection.',{duration:2,suspicionShield:2,rejectRenown:3}),
 wildfire:fx('A controlled spectacle: +30 points in public/demonstration, +8 otherwise; responding costs 1 Patience.',{chance:.08,frameChance:.22,frames:['public','demonstration'],responsePatience:1}),
 heartwood:fx('Restore 4 Resolve now; acceptance restores another 2 for two responses.',{restoreResolve:4,successResolve:2,duration:2}),
 omen:fx('Block 1 rejection Suspicion. A rejection gives the next check +15 points.',{suspicionShield:1,afterFailure:.15}),
 sleight:fx('Halve the current crown payment and conceal its Suspicion trail; Guile checks gain 16 points.',{goldDiscount:.5,concealGold:true,chance:.16,only:['skills:guile']}),
 contraption:fx('Use Alchemy if stronger than the requested signal, then gain 8 points.',{swap:'alchemy',chance:.08}),
 hoarfrost:fx('Cool the exchange: all response Patience losses fall by 1; lose 2 Resolve.',{resolve:2,patienceShield:1}),
 candour:fx('Lose 2 Resolve to remove 2 Suspicion. This Guile check loses 15 points.',{resolve:2,suspicion:-2,chance:-.15,only:['skills:guile']}),
 brace:fx('For two responses, block 5 Resolve damage and ignore low-Resolve fatigue.',{resolveShield:5,noFatigue:true,duration:2}),
 quickquill:fx('Record evidence: Lore/preparation/work checks gain 14 points and rejection Suspicion falls by 1.',{chance:.14,only:['skills:lore','preparation','job','project'],suspicionShield:1}),
 bramble:fx('Tangle the objection: Deflect risk is halved; Guile gains 16 points for two responses.',{deflectRisk:.5,chance:.16,only:['skills:guile'],duration:2}),
 index:fx('Use Lore if stronger than the requested signal. An actual Lore request gains 8 points.',{swap:'lore',chance:.08,only:['skills:lore']}),
 rapport:fx('This Deflect costs no Resolve; acceptance restores 3 Resolve.',{deflectResolve:0,successResolve:3}),
 purify:fx('Distil focus: spend 3 Health and 2 Resolve to restore 7 Mana.',{health:3,resolve:2,restoreMana:7}),
 tailwind:fx('For two responses, all Patience losses fall by 1.',{patienceShield:1,duration:2}),
 rime:fx('Block 2 rejection Suspicion; this check loses 8 points.',{suspicionShield:2,chance:-.08}),
 reflect:fx('Double this presentation’s success benefit and gain 10 check points; rejection adds 1 Suspicion.',{chance:.10,successMultiplier:2,rejectSuspicion:1}),
 moonwell:fx('Trade 2 Patience and 3 Resolve for 10 Mana.',{patience:2,resolve:3,restoreMana:10}),
 lodestar:fx('For two responses, +10 check points; +8 more when the same kind of signal follows.',{suspicion:2,chance:.10,repeatSource:.08,duration:2}),
 torment:fx('Force an ordinary check to pass: pay 7 Health, 4 Renown and 3 Suspicion.',{health:7,renown:4,suspicion:3,force:true}),
 extraction:fx('Spend 4 Renown and 2 Health to remove 1 Suspicion and restore 6 Resolve.',{renown:4,health:2,suspicion:-1,restoreResolve:6}),
 siphon:fx('Spend 5 Health for 8 Mana and block 3 Resolve damage on this response.',{health:5,restoreMana:8,resolveShield:3}),
 compel:fx('Force an ordinary check or knowledge/flag request to pass; pay 6 Renown and 3 Suspicion. Payments still require funds.',{renown:6,suspicion:3,force:true,waiveGate:true}),
 eclipse:fx('This rejection adds no Suspicion, but responding costs 1 extra Patience.',{suspicionShield:99,responsePatience:1}),
 heartprice:fx('Trade 6 Health for 9 Resolve. No Mana cost.',{health:6,restoreResolve:9})
};
function draw(s){let a=(s.cardRng=(s.cardRng+0x6D2B79F5)|0),t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;let u=((t^(t>>>14))>>>0)/4294967296;const previous=s.pool.find(c=>c.id===s.card)?.baseId,deck=s.pool.filter(c=>c.baseId!==previous),total=deck.reduce((n,c)=>n+c.weight,0);for(const c of deck){u-=c.weight/total;if(u<=0)return c.id;}return deck.at(-1).id;}
export function createResearchState(options={}){
 const tune={...PARAMETERS,...options.tune},difficulty=options.difficulty??options.level??20;
 const target=options.target??Math.max(3,Math.round(tune.targetBase+tune.targetSlope*(difficulty-20)));
 const preset=researchPreset(options.level??20,options.loadout??'Balanced',options.allSpells??false);
 const s=baseState({...options,target,manaScale:1,player:{...preset,...options.player,skills:{...preset.skills,...options.player?.skills}}});
 s.config.research=true;s.config.tune=tune;s.config.objective=options.objective??'prudent';s.config.objectives=OBJECTIVES;
 s.config.policyVariant=options.policyVariant??'normal';
 if(!POLICY_VARIANTS.includes(s.config.policyVariant))throw Error('Unknown research policy variant');
 s.config.unlimitedMana=s.config.policyVariant==='hyper-frugal';
 s.config.canonicalSourceHashes=canon.sourceHashes;
 // Ward is deliberately irrelevant. Old tuning proposals must not turn it
 // back into protection, recovery, a check bonus or a free Suspicion cleanse.
 s.config.spellEffects=Object.fromEntries(Object.entries(EFFECTS).map(([id,e])=>{
  const effect={...(id==='ward'?e:{...e,...options.effectOverrides?.[id]})},rank=s.player.spells[id]??1;
  // Course ranks use their canonical duration arrays. Fixed adaptations retain
  // their effect strengths; no global rank multiplier or Mana discount is added.
  if(['foresight','haste','shadowstep'].includes(id))effect.duration=canon.spells[id].duration[rank-1];
  if(id==='haste')effect.deflectPatience=rank===3?-2:-1;
  return [id,{...effect,mana:combatSpellCost(id,rank)}];
 }));
 s.pool=s.pool.flatMap(c=>FRAMES.map((f,i)=>({...c,baseId:c.id,id:c.id+'~'+f.id,frame:f.id,frameName:f.name,frameText:f.text,weight:c.weight*(c.source==='skills'&&c.key==='charm'?tune.charmWeight/3:1)*tune.frameWeights[i],dc:Math.round(c.dc*tune.dcSpread+tune.dcBias+f.dc),resolveHit:Math.max(1,c.resolveHit+f.resolveHit),suspicionHit:Math.max(0,c.suspicionHit+f.suspicionHit),patienceHit:Math.max(1,c.patienceHit+f.patienceHit),successResolve:f.successResolve??0,successSuspicion:f.successSuspicion??0,successPatience:f.successPatience??0,rejectRenown:f.rejectRenown??0,deflectPatience:f.deflectPatience??0,demonstration:f.demonstration??false})));
 s.fullResolve=Math.round(tune.resolveBase+tune.resolveSlope*(.65*s.player.skills.guile+.2*s.player.skills.charm+.15*s.player.skills.lore));s.resolveMax=Math.max(1,Math.round(s.fullResolve*(s.entry.mood>=30?1:.4+.6*s.entry.mood/30)));s.resolve=s.resolveMax;
 s.card=null;s.cardRng=(s.config.seed^0xA341316C)>>>0;s.card=draw(s);s.pending=draw(s);s.researchState={active:[],lastSource:'',insight:0};
 return s;
}
export function observeResearch(s){const t=baseObservation(s);return t;}
export const researchAction=(s,id)=>Object.assign(s,core('apply',s,{id}));
export const researchSearch=(s,options={})=>core('search',observeResearch(s),{options});
export const simulateResearch=(s,options={})=>core('simulate',s,{options});
export const spellDescription=(s,id)=>s.config.spellEffects[id]?.summary??(SPELLS[id]?.castable===false?'Story-only magic.':'No research adaptation.');
