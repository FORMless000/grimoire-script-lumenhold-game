// The bridge between the main game and a fight: the player's skills, learned spells, Health and Mana in; resource changes out.
// Numbers live in COMBAT_TUNING (setup/roster.mjs): condition (how worn or drained you start) and settle (what a fight costs).
//   const state=createState(fightOptions({player,opponent,context}))   … play with web/core.mjs …   settle(state,player)
// player:   {skills:{arcana,lore,alchemy,charm,vigor,guile}, spells:{id:rank}, health, mana, mood, renown, gold, alignment}
// opponent: {loadout, level} for a preset or named character, or {skills, spells} for a custom one; optional condition {health, mana}
import {COMBAT_TUNING,manaCapacity} from './roster.mjs';

export function fightOptions({player,opponent,context='practice_duel',observers=false,firstLeader=1,encounterSeed}){
 const c=COMBAT_TUNING.condition,capacity=manaCapacity(player.skills);
 // Fit means Health at or above healthFull and Mana at or above the combat capacity; below that the start drops (combatStart).
 const playerCondition={health:Math.min(1,player.health/c.healthFull),mana:Math.min(1,player.mana/capacity)};
 const foe=opponent.loadout?{opponentLoadout:opponent.loadout,opponentLevel:opponent.level}:{opponentKit:{skills:opponent.skills,spells:opponent.spells,level:opponent.level}};
 return {playerKit:{skills:player.skills,spells:player.spells,level:player.level},playerCondition,...foe,...(opponent.condition?{opponentCondition:opponent.condition}:{}),
  playerResources:{mood:clamp(player.mood??60,0,100),renown:clamp(player.renown??0,0,100),crowns:clamp(player.gold??0,0,99999),alignment:clamp(player.alignment??0,-100,100)},
  context,observers,firstLeader,...(encounterSeed!==undefined?{encounterSeed}:{})};
}

// The settled fight → changes to the player's resources. Health: the share of combat HP lost × the stake, less the context's
// rebate; never below 1 (a lost duel hurts, it doesn't collapse you). Mana: what the fight spent net of collected flux and the
// rebate, at most what the player had. Mood: the outcome. Renown, Crowns and alignment: what the fight moved.
export function settle(state,player){
 const s=COMBAT_TUNING.settle,a=state.actors[0],st=state.settlement?.[0],r=state.result;
 if(!r||!st)throw Error('Settle a finished fight');
 const outcome=r.winner===0?'win':r.winner===1?'lose':'draw';
 const lostShare=Math.max(0,(a.startHP??a.maxHP)-a.hp)/a.maxHP;
 const health=-Math.min(Math.round(lostShare*s.healthStake*(1-state.rebates.health)),Math.max(0,(player.health??0)-1));
 const mana=-Math.min(Math.max(0,Math.round(st.mana.netLoss)),player.mana??0);
 const gained=k=>-Math.round(st[k].netLoss);
 return {outcome,reason:r.reason,deltas:{health,mana,mood:s.mood[outcome],renown:gained('renown'),gold:gained('crowns'),alignment:gained('alignment')},followUps:r.followUps??[]};
}
const clamp=(x,lo,hi)=>Math.min(hi,Math.max(lo,x));
