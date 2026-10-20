import {LOADOUTS,NAMED_LOADOUTS,SPECIAL_LOADOUTS,LOADOUT_SKILLS,COURSE_PICKS} from './loadouts.mjs';
import {CAST_STATS} from './cast-stats.mjs';
export {LOADOUTS,NAMED_LOADOUTS,SPECIAL_LOADOUTS,LOADOUT_SKILLS,COURSE_PICKS};
// Combat spell redesign v2. Campaign acquisition and negotiation text are metadata.
export const RESOURCES=['health','mood','renown','mana','crowns','alignment'];
export const FLUX_RATIO=2/3;
export const ALIGNMENT_COST={tiny:3,small:6,forbidden:2}; // content/core/balance.grim, 2026-10-16; forbidden: a forbidden cast, a third of small (`@balance forbidden_cast`, 2026-10-19).
// Combat tuning, the one home of these numbers (exported to the Rust core with the spells; setup.mjs reads it too).
// skill: every amount (damage, healing, banks, Strike) × 1 + perPoint × (skill − pivot), averaged over the spell's skills.
//   Since F5.7 every skill scales its spells alike (mainPerPoint = minorPerPoint); Arcana, Vigor and Alchemy matter more only
//   because more spells use them, and Vigor and Arcana also feed HP and Mana.
// hp: combat max HP = entry Health × max(hp.min, the same kind of factor over hp.skills around hp.pivot) (healthModel 'direct').
// capacity: combat Mana capacity (manaCapacity below).
// condition: how the player's state on entering shapes the start (see setup.mjs combatStart).
// settle: what a fight costs the player afterwards (setup/campaign.mjs settle).
export const COMBAT_TUNING={
 // F5.9: every scaling is linear and anchored at skill 50 (×1): factor = 1 + perPoint × (skill − 50).
 skill:{pivot:50,main:['arcana','vigor','alchemy'],mainPerPoint:1/150,minorPerPoint:1/150},   // 2/3 + skill/150: ×1 at 50, doubles from 0 to 100
 strike:{damage:9,perPoint:1/150}, // like every spell (F5.9; F5.4–F5.8 ran faster, 1.4% a point, as Brawler's lever)
 hp:{skills:['vigor','vigor','arcana','lore','alchemy','charm','guile'],perPoint:1/250,pivot:50}, // 0.8 + skill/250 (Vigor counted twice): 70 at 50, +50% from 0 to 100 (gentler, so low-Vigor classes aren't squishy)
 capacity:{base:43,slope:43/150,weights:{arcana:2,lore:1,alchemy:1,charm:1,vigor:1,guile:1}}, // 43 × (2/3 + skill/150): 34 at 20, 52 at 80
 guard:{repeatLeak:.5,lookback:1}, // Guard fatigue (F5.5): a Guard within `lookback` exchanges of the last stops only half a Strike
 shadowstep:{breakOnCast:false}, // true: casting any spell but Ward breaks your own Shadowstep (tried in F5.5: kills comebacks, see rulebook)
 decision:{quietExchanges:5,maxExchanges:60}, // a stalemate (no HP lost, no Mana spent) is called on points after quietExchanges exchanges; any fight
   // after maxExchanges (one where both sides hurt and heal forever; a fight's p99 is under 40)
 // Kit gates (F5.9b, fitted to the main game: card foes run about level 12–65; players reach course level II from year 1
 // spring, E ≈ 20, and III from year 2 spring, E ≈ 34): the level each course slot, extra, forbidden and place spell is
 // learned, and the levels where three-level spells reach rank 2 and 3. Was courses 1/15/40/65, extras 45/70, forbidden
 // 35/80, place 25, ranks 44/68 (F5.0–F5.9), which left most of a kit unseen below level 65.
 kits:{flameBy:10,courses:[1,8,16,26],courseMin:{haste:10,shadowstep:10},place:16,extras:[20,34,46,58],ownExtrasBelow:34,forbidden:[28,58],ranks:[22,36],undergroundExtras:2},
 offsets:{jitter:.09},   // F5.9: class skill offsets are % of level (setup/loadouts.mjs); jitter ± this share of the level // generated kits learn Flame by this level at the latest (F5.6; was 25, which left some classes without an attack below 15)
 // Feedback 2026-10-19: Health 30 or more starts the fight at full HP; below 30 the start falls straight to hpAtZero at
 // Health 0 (the same 30% at most as before, over 0–30 instead of 0–70). (F5.9c: 90% + 10% × Health/70 down to Health 30,
 // then steeply to 70%.) Mana: you start with the ready Mana you had, and the rest of capacity is flux (manaAsFlux), so a
 // drained fighter can Reclaim it but spends exchanges doing so. (F5.4–F5.9b: ready Mana at 90–100%.)
 condition:{healthFull:30,healthFloor:1,healthKnee:30,hpAtZero:.7,manaAsFlux:true,manaFloor:.9},
 // Feedback 2026-10-19: a fight costs Health only when it ends below healthFreeAbove HP: the whole stake at 0 HP, nothing
 // at healthFreeAbove, in a straight line (F5.9c: the share of max HP lost × the stake, at any HP).
 settle:{healthStake:40,healthFreeAbove:30,mood:{win:3,lose:-4,draw:0}}
};
// AI difficulty presets (F5.9b), merged into a side's AI settings by expandAI (setup/setup.mjs); the live opponent searches a
// fixed 5 exchanges with no seeded mistakes, so these are its only knob. slack: pick at random among moves within that many
// points of the best tilted one (about 4 points = 1 HP of lead); maxRegret: never a move worse than that; tiltScale: how
// strongly the persona (PERSONAS in setup/foes.mjs) pulls; persona: whether it applies at all. F5.9's easy/medium/hard are
// now medium/hard/engine. Measured win rates against the engine: EVENTS.md §3.
export const AI_PRESETS={
 easy:{mistakeChance:0,slack:40,maxRegret:100,tiltScale:2,persona:true},     // forgiving: drifts among anything not ruinous, plays its favourites
 medium:{mistakeChance:0,slack:24,maxRegret:60,tiltScale:1.5,persona:true},  // loose, leans hard on its favourites (F5.9 easy)
 hard:{mistakeChance:0,slack:10,maxRegret:24,tiltScale:1,persona:true},      // habits and small slips, never throws a fight away (F5.9 medium)
 engine:{mistakeChance:0,slack:0,tiltScale:0,persona:false}                  // the search's best move, every time (F5.9 hard)
};
export const LEARN_XP={medium:6,large:10,huge:16};
export const cap=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
const spell=(name,source,skills,cost,extra={})=>({name,source,skills,cost,levels:cost.length,group:cost.length===3?'course':'other',...extra});
export const SPELLS={
 flame:spell('Flame','Evocation',['arcana'],[9,8,7],{verb:'Burn',damage:[18,19,20],negotiation:'Fails the meeting.'}),
 foresight:spell('Foresight','Astromancy',['lore'],[7,6,5],{verb:'Foresee',duration:[3,4,5],negotiation:'Rolling next-request reveal for 3/4/5 turns.'}),
 mend:spell('Mend','Alchemy & Healing',['alchemy'],[9,8,7],{verb:'Mend',healing:[25,26,27],negotiation:'None.'}),
 glamour:spell('Glamour','Illusion',['charm'],[9,7,5],{verb:'Dazzle',renown:[3,5,8],negotiation:'Charm/Guile responses cheaper; +2 Suspicion.'}),
 haste:spell('Haste','Beastcraft & Flight',['vigor'],[5,5,5],{verb:'Hasten',actions:[2,2,3],duration:[2,3,4],negotiation:'Response costs 1/1/2 less Patience.'}),
 shadowstep:spell('Shadowstep','Umbral Theory',['guile'],[8,10,12],{verb:'Step',duration:[1,2,2],negotiation:'Leave and settle progress.'}),
 ward:spell('Ward','Orientation safety talk',[],[7],{verb:'Ward',baseline:true,negotiation:'None.'}),
 animate:spell('Animate','Artifice (hidden)',['alchemy','arcana'],[14],{verb:'Animate',construct:true,negotiation:'Later.'}),
 starlight:spell('Starlight','Starcalling (hidden)',['lore'],[9],{verb:'Illuminate',release:[36,64],channel:true,holdCost:2,amounts:{chargedWardPierce:1},negotiation:'+2 Patience.'}),
 seal:spell('Seal','Hollow Studies (hidden)',['guile'],[8],{verb:'Seal',negotiation:'None.'}),
 wildfire:spell('Wildfire',"Lyra's capstone",['arcana'],[8],{verb:'Burn',channel:true,holdCost:2,amounts:{ignite:8,hold:14,self:3,release:36,perHold:7},negotiation:'Fails the meeting.'}),
 heartwood:spell('Heartwood',"Tobias's capstone",['vigor'],[14],{verb:'Root',construct:true,negotiation:'None.'}),
 omen:spell('Omen',"Seraphine's capstone",['lore'],[8],{verb:'Foretell',amounts:{hit:44,wardPierce:1,guardPierce:1,bracePierce:1},negotiation:'None.'}),
 sleight:spell('Sleight',"Corvin's capstone",['guile'],[4],{verb:'Lift',alignment:'tiny',negotiation:'Steal 5 Crowns.'}),
 contraption:spell('Contraption',"Mir's capstone",['alchemy'],[10],{verb:'Build',construct:true,negotiation:'Later.'}),
 hoarfrost:spell('Hoarfrost',"Kael's capstone",['arcana'],[7],{verb:'Freeze',damage:[22],negotiation:'Fails the meeting.'}),
 candour:spell('Candour',"Nessa's capstone",['charm'],[6],{verb:'Confess',negotiation:'−3 Suspicion; following Quickquill adds Agreement/alignment/event flag.'}),
 brace:spell('Brace','Duelling Circle',['vigor'],[10],{verb:'Brace',negotiation:'None.'}),
 quickquill:spell('Quickquill','Lumen Ledger',['guile'],[4],{verb:'Scribble',negotiation:'Next Confront raises no pressure.'}),
 bramble:spell('Bramble','Verdant Circle',['alchemy'],[10],{verb:'Entangle',construct:true,negotiation:'Fails the meeting.'}),
 index:spell('Index','Library Assistant',['lore'],[4],{verb:'Recall',negotiation:'Answer current request with Lore.'}),
 rapport:spell('Rapport','Gilded Newt',['charm'],[4],{verb:'Befriend',negotiation:'Next Deflect costs no Mood and adds no Suspicion.'}),
 purify:spell('Distil','Apothecary Clerk',['alchemy'],[0],{verb:'Distil',hpCost:20,negotiation:'None.'}),
 tailwind:spell('Tailwind','Broom Courier',['vigor'],[5],{verb:'Surge',damage:[4],negotiation:'None.'}),
 // Skill assignments below are provisional: the supplied pool tables omit them.
 rime:spell('Rime','Hidden pool',['arcana'],[4],{verb:'Freeze',group:'hidden',amounts:{thaw:24},provisionalSkill:true,negotiation:'None.'}),
 reflect:spell('Reflect','Hidden pool',['lore'],[8],{verb:'Reflect',duration:[2],group:'hidden',provisionalSkill:true,negotiation:'This Confront: +2 Agreement and +2 pressure.'}),
 moonwell:spell('Moonwell','Hidden pool',['alchemy'],[0],{verb:'Gather',group:'hidden',channel:true,holdCost:0,amounts:{bank:16},provisionalSkill:true,negotiation:'None.'}),
 lodestar:spell('Lodestar','Hidden pool',['lore'],[4],{verb:'Gather',group:'hidden',channel:true,holdCost:0,amounts:{bank:16},provisionalSkill:true,negotiation:'None.'}),
 toll:spell('Toll','Hidden pool',[],[0],{verb:'Toll',group:'hidden',castable:false,negotiation:'Cards/story only.'}),
 torment:spell('Torment','Forbidden pool',['guile'],[14],{verb:'Torment',group:'forbidden',duration:[3],provisionalSkill:true,negotiation:'Underground effect later; otherwise fails with consequences.'}),
 extraction:spell('Extraction','Forbidden pool',['arcana'],[10],{verb:'Extract',group:'forbidden',provisionalSkill:true,negotiation:'Underground mind-reading later; otherwise fails with consequences.'}),
 siphon:spell('Siphon','Forbidden pool',['alchemy'],[12],{verb:'Siphon',group:'forbidden',channel:true,holdCost:3,amounts:{hit:18},provisionalSkill:true,negotiation:'Underground effect later; otherwise fails with consequences.'}),
 compel:spell('Compel','Forbidden pool',['guile'],[16],{verb:'Compel',group:'forbidden',duration:[1],immediate:true,provisionalSkill:true,negotiation:'Underground: 1 Agreement without Suspicion; otherwise fails with consequences.'}),
 eclipse:spell('Eclipse','Forbidden pool',['arcana'],[6],{verb:'Convert',group:'forbidden',provisionalSkill:true,negotiation:'Underground effect later; otherwise fails with consequences.'}),
 heartprice:spell('Heartprice','Forbidden pool',['vigor'],[0],{verb:'Sacrifice',group:'forbidden',provisionalSkill:true,negotiation:'Underground effect later; otherwise fails with consequences.'}),
 // Creature attacks (F5.9): special foes only (SPECIAL_LOADOUTS), never a player's or a class's kit.
 gore:spell('Gore','Creature',['vigor'],[6],{verb:'Gore',damage:[15],physical:true,group:'creature',negotiation:'None.'})
};
for(const s of Object.values(SPELLS)){
 if(s.group==='course')s.baseline=true;
 if(s.group==='forbidden')s.alignment='forbidden';
 s.learnXP=s.skills.map(skill=>({skill,amounts:s.group==='course'?[6,10,16]:[10]}));
}
export const CONSTRUCTS={
 animate:{action:'strike',power:10,reduction:1,threshold:20,maxExchanges:4},
 heartwood:{action:'heal',power:5,reduction:3,threshold:24,maxExchanges:4},
 bramble:{action:'spell',power:6,reduction:1,threshold:20,maxExchanges:4},
 contraption:{action:'spell',power:12,reduction:0,threshold:24,burst:8,maxExchanges:3}
};
export const CONTEXTS={
 practice_duel:{health:.8,mood:.8,renown:.8,mana:.8,crowns:0,alignment:0},
 real_conflict:{health:.5,mood:.5,renown:.5,mana:.5,crowns:0,alignment:0},
 public_duel:{health:.8,mood:.8,renown:.2,mana:.8,crowns:0,alignment:0},
 rehearsal:{health:.8,mood:.8,renown:.8,mana:.8,crowns:0,alignment:0},
 // F5.9: the boathouse ring's bare-knuckle bouts, hurt more than a duel and less than a real fight; a small crowd
 ring_bout:{health:.65,mood:.8,renown:.5,mana:.8,crowns:0,alignment:0}
};
export function levelRng(level){let state=level|0;return()=>{let a=(state=(state+0x6D2B79F5)|0);let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
export const courseRank=level=>{const [r2,r3]=COMBAT_TUNING.kits.ranks;return level>=r3?3:level>=r2?2:1;};
export function fixedLoadoutLevel(name){
 const def=NAMED_LOADOUTS[name];if(!def?.fixed)return null;
 const top=Object.values(CAST_STATS[def.npc].skills).sort((a,b)=>b-a);return Math.floor((top[0]+top[1])/2);
}
// Spell gains have no rolls: descending preference, with table order breaking
// ties. Skill jitter is the only level-seeded random draw in a generated kit.
// Two thirds of F4's tank (52 + mean/4 = 64.5 at par), with arcana counted twice and the slope cut to 2/3.
// Combat Mana capacity: base + slope × (weighted mean skill − 50), at least min; weights, slope and min from COMBAT_TUNING.capacity.
export function manaCapacity(skills){const c=COMBAT_TUNING.capacity,ws=Object.entries(c.weights),w=ws.reduce((n,[k,x])=>n+x*skills[k],0)/(c.divisor??ws.reduce((n,[,x])=>n+x,0));return Math.max(c.min??0,Math.round(c.base+c.slope*(w-50)));}
// Spells whose only effect is Renown or Crowns are for the campaign, not for combat kits.
export const COMBAT_EXCLUDED=new Set(['glamour','rapport','sleight','index','quickquill']);
const keepInCombat=([id])=>!COMBAT_EXCLUDED.has(id);
// The level a generated kit learns Flame: earlier the more the class favours it (flameBase), by COMBAT_TUNING.kits.flameBy at the latest.
export const flameUnlock=def=>Math.max(1,Math.ceil((COMBAT_TUNING.kits?.flameBy??25)*(1-def.flameBase)-1e-9));
function priority(weights={}){return Object.entries(weights).filter(keepInCombat).filter(([,w])=>w>0).sort((a,b)=>b[1]-a[1]).map(([id])=>id);}
function spellUnlocks(def,named,growing,year){
 const levels={ward:1},grant=(id,at)=>{levels[id]=Math.min(levels[id]??101,at);};
 // First level where the former Flame probability would have been certain.
 grant('flame',flameUnlock(def));
 for(const id of def.iconic??[])if(!COMBAT_EXCLUDED.has(id))grant(id,1);
 const g=COMBAT_TUNING.kits;
 if(def.place&&!COMBAT_EXCLUDED.has(def.place))grant(def.place,g.place);
 for(const [id,at]of def.grants??[])if(!COMBAT_EXCLUDED.has(id))grant(id,at);
 const weights=Object.fromEntries(COURSE_PICKS.map((id,i)=>[id,def.course[i]]));
 let courses=priority(weights).filter(id=>!levels[id]);
 const reserved=named?1+(def.iconic??[]).filter(id=>COURSE_PICKS.includes(id)&&!COMBAT_EXCLUDED.has(id)).length:0;
 if(!named){const starter=courses.find(id=>!['haste','shadowstep'].includes(id));courses=[starter,...courses.filter(id=>id!==starter)];}
 for(const [i,id]of courses.slice(0,4-reserved).entries()){
  const at=growing&&year>=i+reserved+1?1:g.courses[i+reserved];
  grant(id,Math.max(at,g.courseMin[id]??1));
 }
 // One extra per gate: the class's own extras first (only those below ownExtrasBelow), then its hidden spells too.
 // Underground classes take at most undergroundExtras: their forbidden spells fill the other places.
 const extras=priority({...def.hidden,...def.extras});let waiting=0,granted=0;
 for(const gate of g.extras){
  waiting++;
  while(waiting&&(!def.underground||granted<(g.undergroundExtras??Infinity))){const id=extras.find(id=>!levels[id]&&(gate>=g.ownExtrasBelow||id in (def.extras??{})));if(!id)break;grant(id,gate);waiting--;granted++;}
 }
 if(growing&&year>=3&&extras.length)grant(extras[0],1);
 if(def.underground)for(const [i,id]of priority(def.forbidden).filter(id=>!levels[id]).slice(0,g.forbidden.length).entries())grant(id,g.forbidden[i]);
 return levels;
}
// A character at level L (F5.9c): their canon skills scaled to a mean of L, so they spend a class's skill points at the
// same level and the card's challenge level sets their strength directly (F5.9b scaled the reference skill to L instead,
// and the canon's low secondary skills left peers ~15 levels weaker). Their shape is kept; points capped at 100 go to
// the other skills, in proportion.
export function scaleToMean(skills,level){
 const keys=Object.keys(skills),target=level*keys.length,fixed={};
 for(let pass=0;pass<keys.length;pass++){
  const free=keys.filter(k=>!(k in fixed)),left=target-Object.values(fixed).reduce((a,b)=>a+b,0),sum=free.reduce((a,k)=>a+skills[k],0);
  const over=free.filter(k=>skills[k]*left/sum>100);if(!over.length)return Object.fromEntries(keys.map(k=>[k,k in fixed?fixed[k]:cap(Math.round(skills[k]*left/sum),1,100)]));
  for(const k of over)fixed[k]=100;
 }
 return Object.fromEntries(keys.map(k=>[k,100]));
}
export function generateLoadout(loadout,level,access='kit',options={}){
 const named=NAMED_LOADOUTS[loadout],special=SPECIAL_LOADOUTS[loadout],base=LOADOUTS[loadout]??named??special;
 if(!base||!Number.isInteger(level)||level<1||level>100||!['kit','all'].includes(access))throw Error('Choose loadout, level 1–100, and kit/all access.');
 const year=options.year??1;if(!Number.isInteger(year)||year<1||year>4||options.ilseTaken!==undefined&&typeof options.ilseTaken!=='boolean')throw Error('Choose year 1–4 and a boolean Ilse flag');
 level=fixedLoadoutLevel(loadout)??level;
 const def=loadout==='Ilse'&&options.ilseTaken?{...base,underground:true,iconic:[...base.iconic,'eclipse'],forbidden:{siphon:2,torment:1}}:base;
 const canon=named?.npc?CAST_STATS[named.npc]:null,growing=!!canon?.grows;
 // Level/preset seed affects skills only; the spell ladder is entirely fixed.
 const seed=level+1000*def.salt,source=levelRng(seed),draws=[],rng=()=>{const n=source();draws.push(n);return n;};
 let skills;
 if(named){
  // The bench has a level rather than a campaign turn: a growing character keeps the canon stat ratios at a mean skill
  // of L (scaleToMean); fixed ones play their canon skills. An encounter adapter can instead supply exact skill values.
  skills=options.skills?{...options.skills}:canon?growing?scaleToMean(Object.fromEntries(LOADOUT_SKILLS.map(k=>[k,canon.skills[k]])),level):{...canon.skills}:Object.fromEntries(LOADOUT_SKILLS.map(k=>[k,level]));
 }else{
  // F5.9: offsets are percentages of the level (F5.8 and before: fixed points; ×2 converts at level 50), and so is the
  // jitter (±9%), so a class keeps its shape at every level: a level-20 Brawler is as lopsided as a level-80 one.
  const jitter=level*(COMBAT_TUNING.offsets?.jitter??.09);skills=Object.fromEntries(LOADOUT_SKILLS.map((k,i)=>[k,cap(Math.round(level*(1+def.offsets[i]/100)+(rng()*2-1)*jitter),1,100)]));}
 if(LOADOUT_SKILLS.some(k=>!Number.isFinite(skills[k])||skills[k]<1||skills[k]>100)||Object.keys(skills).length!==6)throw Error('Six skill values in 1–100 required');
 const unlockLevels=def.kit?{...def.kit}:spellUnlocks(def,!!named,growing,year);
 const ids=access==='all'?Object.keys(SPELLS).filter(id=>SPELLS[id].group!=='creature'):Object.keys(unlockLevels).filter(id=>unlockLevels[id]<=level),r=courseRank(level);
 const spells=Object.fromEntries(ids.map(id=>[id,SPELLS[id].levels===3?Math.min(3,r+Number(def.prodigy===id)):1]));
 return {loadout,level,...(growing?{year}:{}),progression:'level-gated',unlockLevels,underground:!!def.underground,skills,spells,capacity:manaCapacity(skills),seed,draws,...(!canon&&named?{provisionalSkills:true}:{})};
}
