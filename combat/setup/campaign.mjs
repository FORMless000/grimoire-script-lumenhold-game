// The bridge between the main game and a fight: the player's skills, learned spells, Health and Mana in; resource changes out.
// Numbers live in COMBAT_TUNING (setup/roster.mjs): condition (how worn or drained you start) and settle (what a fight costs).
//   const state=createState(fightOptions({player,opponent,context}))   … play with web/core.mjs …   settle(state,player)
// player:   {skills:{arcana,lore,alchemy,charm,vigor,guile}, spells:{id:rank}, health, mana, mood, renown, gold, alignment}
// opponent: {loadout, level} for a preset or named character, or {skills, spells} for a custom one; optional condition {health, mana}
// context, observers, witnesses: the card's fight setting (fightSetting in setup/foes.mjs: the rebates, an audience whose
// Renown counts, someone who would report a forbidden cast).
// The main game's Mana uses the fight's scale (INTEGRATION.md §2): its pool is manaCapacity(skills), so player.mana ≤ capacity.
import {COMBAT_TUNING,COMBAT_EXCLUDED,manaCapacity} from './roster.mjs';
// Spells with no effect in this fight stay out of the kit: Glamour and Rapport act only before an audience; Index and
// Quickquill never do. Sleight steals Crowns, so it stays.
const inFight=(id,observers)=>!COMBAT_EXCLUDED.has(id)||id==='sleight'||observers&&(id==='glamour'||id==='rapport');

export function fightOptions({player,opponent,context='practice_duel',observers=false,witnesses=observers,firstLeader=1,encounterSeed}){
 const c=COMBAT_TUNING.condition,capacity=manaCapacity(player.skills);
 // Fit means Health at or above healthFull (30) and Mana at or above the combat capacity. Below that: HP drops in a straight
 // line to 70% at Health 0; you keep exactly the Mana you had, and the rest of capacity starts as flux (combatStart).
 const playerCondition={health:Math.min(1,player.health/c.healthFull),mana:Math.min(1,player.mana/capacity)};
 const foe=opponent.loadout?{opponentLoadout:opponent.loadout,opponentLevel:opponent.level}:{opponentKit:{skills:opponent.skills,spells:opponent.spells,level:opponent.level}};
 const spells=Object.fromEntries(Object.entries(player.spells).filter(([id])=>inFight(id,observers)));
 // player.mods: the worn kit (world expansion 1; the main game's Engine#wornMods), applied by createState.
 return {playerKit:{skills:player.skills,spells,level:player.level,...(player.mods?{mods:player.mods}:{})},playerCondition,...foe,...(opponent.condition?{opponentCondition:opponent.condition}:{}),
  playerResources:{mood:clamp(player.mood??60,0,100),renown:clamp(player.renown??0,0,100),crowns:clamp(player.gold??0,0,99999),alignment:clamp(player.alignment??0,-100,100)},
  context,observers,witnesses,firstLeader,...(encounterSeed!==undefined?{encounterSeed}:{})};
}

// The settled fight → changes to the player's resources. Health: only below settle.healthFreeAbove HP left, the stake ×
// how far below (all of it at 0 HP), less the context's rebate; never below 1 (a lost duel hurts, it doesn't collapse you). Mana: what the fight spent net of collected flux and the
// rebate, at most what the player had. Mood: the outcome. Renown, Crowns and alignment: what the fight moved.
export function settle(state,player){
 const s=COMBAT_TUNING.settle,a=state.actors[0],st=state.settlement?.[0],r=state.result;
 if(!r||!st)throw Error('Settle a finished fight');
 const outcome=r.winner===0?'win':r.winner===1?'lose':'draw';
 const below=Math.max(0,s.healthFreeAbove-Math.max(0,a.hp))/s.healthFreeAbove;
 const health=-Math.min(Math.round(below*s.healthStake*(1-state.rebates.health)),Math.max(0,(player.health??0)-1))||0;
 const mana=-Math.min(Math.max(0,Math.round(st.mana.netLoss)),player.mana??0);
 const gained=k=>-Math.round(st[k].netLoss);
 return {outcome,reason:r.reason,deltas:{health,mana,mood:s.mood[outcome],renown:gained('renown'),gold:gained('crowns'),alignment:gained('alignment')},followUps:r.followUps??[]};
}
const clamp=(x,lo,hi)=>Math.min(hi,Math.max(lo,x));
