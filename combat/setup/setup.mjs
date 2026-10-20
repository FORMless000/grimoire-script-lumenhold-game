// Fight setup: config defaults and validation, kits from the roster, entry resources and max HP. Plain data in, plain state out;
// the rules that play the fight live in the Rust core (web/core.mjs in the browser, rust/ natively).
import {LOADOUTS,CONTEXTS,RESOURCES,COMBAT_TUNING,SPELLS,LOADOUT_SKILLS,AI_PRESETS,generateLoadout,levelRng,manaCapacity} from './roster.mjs';
import {personaOf} from './foes.mjs';
const maps=n=>Object.fromEntries(RESOURCES.map(k=>[k,n]));
// The tuning's skill factor: the average over keys of 1 + perPoint × (skill − pivot).
export const skillFactor=(skills,keys,perPoint,pivot=COMBAT_TUNING.skill.pivot)=>keys.reduce((n,k)=>n+1+perPoint*(skills[k]-pivot),0)/keys.length;
// Combat max HP's factor: hp.perPoint around hp.pivot (default the skill pivot), never below hp.min (default none).
export const hpFactor=skills=>{const h=COMBAT_TUNING.hp;return Math.max(h.min??-Infinity,skillFactor(skills,h.skills,h.perPoint,h.pivot??COMBAT_TUNING.skill.pivot));};
// Condition on entering ({health, mana} as fractions, 1 = fit and full) → the share of max HP the fight starts with, the
// share of Mana capacity ready, and the share that starts as flux. HP: healthFloor + (1 − healthFloor) × health down to the
// knee (Health healthKnee), then straight down to hpAtZero at Health 0 (since 2026-10-19 the knee is healthFull, 30, and
// healthFloor 1: full HP from Health 30, 70% at 0). Mana (manaAsFlux): ready = the Mana you had, flux =
// the rest of capacity; without manaAsFlux, the F5.4 floor (manaFloor) and no flux.
export function combatStart(condition={}){
 const c=COMBAT_TUNING.condition,clamp=x=>Math.min(1,Math.max(0,x??1)),h=clamp(condition.health),m=clamp(condition.mana);
 const line=x=>c.healthFloor+(1-c.healthFloor)*x,knee=(c.healthKnee??0)/c.healthFull;
 const hp=h>=knee?line(h):c.hpAtZero+(line(knee)-c.hpAtZero)*h/knee;
 return c.manaAsFlux?{hp,mana:m,flux:1-m}:{hp,mana:c.manaFloor+(1-c.manaFloor)*m,flux:0};
}
// {skills:{arcana,…}, spells:{id:rank}, level?} → a kit like generateLoadout's (skills 1–100, ranks within the spell's levels).
export function customKit({skills,spells,level}){
 for(const k of LOADOUT_SKILLS)if(!Number.isFinite(skills?.[k])||skills[k]<1||skills[k]>100)throw Error('Kit skill '+k+' must be 1–100');
 for(const [id,r]of Object.entries(spells??{}))if(!SPELLS[id]||SPELLS[id].castable===false||!Number.isInteger(r)||r<1||r>SPELLS[id].cost.length)throw Error('Kit spell '+id);
 const lv=level??Math.round(Math.max(...LOADOUT_SKILLS.map(k=>skills[k])));
 return {loadout:'custom',level:lv,progression:'learned',skills:{...skills},spells:{...spells},capacity:manaCapacity(skills)};
}
// A side's AI settings: {preset} expands to AI_PRESETS[preset] (the side's own keys win); persona true takes the loadout's
// persona (PERSONAS), an object is the persona itself; the persona joins `tilt`. Hard's persona:false drops it.
export function expandAI(ai,loadout){
 if(!ai)return ai;
 const {preset,persona,...own}=ai,base=preset?AI_PRESETS[preset]:{};
 if(preset&&!base)throw Error('Unknown AI preset '+preset);
 const {persona:presetPersona,...settings}=base??{},use=persona??presetPersona;
 const tilt=use===false||use===undefined?own.tilt:{...(use===true?personaOf(loadout):use),...own.tilt};
 return {...settings,...own,...(tilt&&Object.keys(tilt).length?{tilt}:{}),...(preset?{preset}:{})};
}
export function createState(options={}){
 const config={mode:'combat',playerLoadout:'Duellist',opponentLoadout:options.playerLoadout??'Duellist',playerYear:1,opponentYear:options.playerYear??1,playerIlseTaken:false,opponentIlseTaken:options.playerIlseTaken??false,playerLevel:50,opponentLevel:options.playerLevel??50,
  spellAccess:'kit',resourceBudget:'standard',manaCostScale:1,combatScale:1,damageMultiplier:1,encounterSeed:options.opponentLevel??options.playerLevel??50,firstLeader:1,healthModel:'direct',context:'practice_duel',observers:false,...options};
 // witnesses (optional): someone who would report a forbidden cast; the core defaults it to observers (an audience always is one).
 if(!Number.isInteger(config.encounterSeed)||config.encounterSeed<0||config.encounterSeed>0xffffffff)throw Error('Encounter seed must be an integer from 0 to 4294967295');
 const enemy=config.opponentLoadout==='random'?Object.keys(LOADOUTS)[Math.floor(levelRng(config.encounterSeed)()*Object.keys(LOADOUTS).length)]:config.opponentLoadout;
 config.resolvedOpponentLoadout=enemy;
 if(Array.isArray(config.ai))config.ai=config.ai.map((a,side)=>expandAI(a,side?enemy:config.playerLoadout));
 if(config.mode!=='combat'||!['direct','offset'].includes(config.healthModel)||!['standard','depleted'].includes(config.resourceBudget)||![0,1].includes(config.firstLeader)||!CONTEXTS[config.context]||typeof config.observers!=='boolean'||config.witnesses!==undefined&&(typeof config.witnesses!=='boolean'||config.observers&&!config.witnesses))throw Error('Invalid combat setup');
 if(!Number.isFinite(config.manaCostScale)||config.manaCostScale<=0||!Number.isFinite(config.combatScale)||config.combatScale<=0||!Number.isFinite(config.damageMultiplier)||config.damageMultiplier<=0)throw Error('Positive scales required');
 const rebates={...CONTEXTS[config.context],...options.rebates,crowns:0,alignment:0};
 for(const n of Object.values(rebates))if(!Number.isFinite(n)||n<0||n>1)throw Error('Rebates must be in [0,1]');
 const actors=[0,1].map(side=>{
  // A side's own kit (the player's learned spells, setup/campaign.mjs) instead of a generated preset.
  const own=side?options.opponentKit:options.playerKit;
  const kit=own?customKit(own):generateLoadout(side?enemy:config.playerLoadout,side?config.opponentLevel:config.playerLevel,config.spellAccess,{year:side?config.opponentYear:config.playerYear,ilseTaken:side?config.opponentIlseTaken:config.playerIlseTaken,skills:side?options.opponentSkills:options.playerSkills}),standard=config.resourceBudget==='standard';
  let overrides=side?options.opponentResources:options.playerResources;
  if(side&&!overrides&&config.playerLoadout===enemy&&config.playerLevel===config.opponentLevel&&options.playerResources){const {crowns,...mirrored}=options.playerResources;overrides=mirrored;}
  const entry={health:standard?70:35,mood:standard?60:30,renown:standard?30:5,mana:standard?kit.capacity:Math.min(30,kit.capacity),crowns:standard?30:6,alignment:0,...overrides};
  for(const [k,n]of Object.entries(entry))if(!RESOURCES.includes(k)||!Number.isFinite(n)||n<(k==='alignment'?-100:0)||n>(k==='mana'?kit.capacity:k==='crowns'?99999:100))throw Error('Invalid entry '+k);
  const maxHP=(config.healthModel==='offset'?entry.health+40+Math.floor((kit.skills.arcana+kit.skills.vigor)/4):Math.round(entry.health*hpFactor(kit.skills)))*(config.hpScale??1);
  if(maxHP<=0)throw Error('Positive entry HP required');
  // A worn or drained side starts below full (playerCondition / opponentCondition).
  const condition=side?options.opponentCondition:options.playerCondition,start=combatStart(condition);
  const story=side?options.opponentStart:options.playerStart;   // the story's own handicap ({hp, mana} shares, no floors)
  let hp=condition?Math.max(1,Math.round(maxHP*start.hp)):maxHP,flux=0;
  if(condition){entry.mana=Math.min(entry.mana,Math.round(kit.capacity*start.mana));if(start.flux>0)flux=kit.capacity-entry.mana;}   // 10 of 43 Mana → 10 ready, 33 flux
  if(story?.hp!==undefined)hp=Math.max(1,Math.round(hp*story.hp));
  if(story?.mana!==undefined)entry.mana=Math.round(entry.mana*story.mana);
  flux=Math.max(0,Math.min(flux,kit.capacity-entry.mana));
  return {kit,entry,resources:{...entry},spent:maps(0),restored:maps(0),hp,maxHP,startHP:hp,flux,effects:{},channel:null,constructs:[],omens:[],lastAction:null,rimeReady:false,rimeUsed:false,freezeUntil:0,pendingRenown:0,glamourDone:false,urge:0,guardRound:0};
 });
 config.resolvedPlayerLevel=actors[0].kit.level;config.resolvedOpponentLevel=actors[1].kit.level;
 return {config,rebates,actors,quiet:0,round:1,normalLeader:config.firstLeader,leader:config.firstLeader,earlyCommit:[0,0],pending:[null,null],lastPair:null,lastEvents:[],reports:[],bursts:[],result:null,settlement:null};
}
