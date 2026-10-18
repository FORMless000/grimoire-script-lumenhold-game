// What each action looks like, for the fight log and the telegraph: one plain sentence of what the fighter visibly does
// and what it does in this fight. No numbers or rules (the action's description gives those), no inner states, no gore.
// When a spell is no use in a fight, the line says so ("…, but it does little here").
//   {name}  the fighter acting (or holding the effect, for `end`); {foe}  the other fighter
//   cast:    the action as it happens (a list rotates by exchange)
//   hold / release:  a channel's held and released exchanges (cast is its first exchange)
//   end:     a lasting effect or construct ending (Mend: the wounds closing; `broken` when a hit spoils it)
//   ko:      this action finishing the foe
//   tired:   (Guard) a Guard raised again too soon, against a Strike
// Names come from the fight (fighterNames below): the player's name and the opponent's as the card sets them.
import {COMBAT_TUNING,NAMED_LOADOUTS,SPECIAL_LOADOUTS} from './roster.mjs';
export const FLAVOR={
 // Basics
 strike:{cast:['{name} lunges in and swings at {foe}.','{name} closes the distance and strikes at {foe}.','{name} throws a quick blow at {foe}.'],ko:'{foe} goes down under {name}’s blows.'},
 guard:{cast:['{name} raises a guard against {foe}’s blows.','{name} steps back, arms up, ready for {foe}.'],tired:'{name}’s guard sags, and {foe}’s blows start to get through.'},
 reclaim:{cast:['{name} draws the spent magic in the air back in.','{name} gathers up the loose sparks of magic left in the air.']},
 frozen:{cast:['{name} is frozen solid in rime and can’t move.'],end:'The rime around {name} cracks, and {name} moves again.'},

 // Course spells and Ward
 flame:{cast:['A burst of flame leaps from {name}’s hand at {foe}.','{name} hurls a ball of fire at {foe}.'],ko:'{foe} falls before {name}’s fire.'},
 foresight:{cast:['{name}’s eyes glaze over, reading {foe}’s next moves before they happen.'],end:'{name} can no longer read {foe}’s moves ahead.'},
 mend:{cast:['{name} lays a glowing hand on the wounds and starts to knit them shut.'],end:'{name}’s wounds close up.',broken:'{foe}’s attack breaks {name}’s mending before it can take hold.'},
 glamour:{cast:['{name} strikes a dazzling pose for the onlookers, but it does nothing to {foe}.']},
 haste:{cast:['{name} speeds up, moving twice as fast as {foe}.'],end:'{name} slows back to a normal pace.'},
 shadowstep:{cast:['{name} steps into the shadows, out of {foe}’s reach.'],end:'{name} steps back out of the shadows.'},
 ward:{cast:['A translucent ward appears before {name}, blocking off {foe}’s spells.']},

 // Hidden courses
 animate:{cast:['A chair, a coat stand and a bucket lurch to life and lumber at {foe} on {name}’s command.'],end:'{name}’s animated furniture clatters apart.',ko:'{foe} goes down under {name}’s animated furniture.'},
 starlight:{cast:['Starlight gathers in {name}’s open palm.'],hold:'The starlight in {name}’s palm grows brighter.',release:'A beam of starlight shoots from {name}’s palm at {foe}.',ko:'{foe} falls in a flood of {name}’s starlight.'},
 seal:{cast:['{name} twists a hand, snuffing out the loose magic around {foe}.']},

 // Peer capstones
 wildfire:{cast:['A cluster of flames sparks to life before {name}.'],hold:'The cluster of flames enlarges before {name}, radiating fiery sparks.',release:'The wildfire breaks loose from {name} and sweeps over {foe}.',ko:'{foe} falls before {name}’s wildfire.'},
 heartwood:{cast:['A sapling bursts from the floor beside {name}, ready to shelter and mend.'],end:'{name}’s sapling withers back into the floor.'},
 omen:{cast:['{name} speaks an omen over {foe}: it will strike in two exchanges.'],end:'The omen {name} spoke comes true and strikes {foe}.'},
 sleight:{cast:['{name} slips a hand into {foe}’s purse in passing.']},
 contraption:{cast:['{name} snaps together a whirring contraption and aims it at {foe}.'],end:'{name}’s contraption bursts in a shower of sparks and cogs.'},
 hoarfrost:{cast:['A lance of frost flies from {name} at {foe}.'],ko:'{foe} falls, frozen stiff by {name}’s frost.'},
 candour:{cast:['{name} asks {foe} a disarming question, but it does little here.']},

 // Club and job spells
 brace:{cast:['{name} plants both feet, braced to take {foe}’s hits.'],end:'{name} eases out of the braced stance.'},
 quickquill:{cast:['A quill flies around {name}, but it does little in this situation.']},
 bramble:{cast:['Thorny vines burst from the floor around {foe} at {name}’s call.'],end:'{name}’s brambles wither away.'},
 index:{cast:['{name} leafs through a conjured index, but it does little here.']},
 rapport:{cast:['{name} flaunts a handful of crowns, and the crowd cheers.']},
 purify:{cast:['{name} draws some of their own strength out and distils it into magic.']},
 // Creatures (SPECIAL_LOADOUTS)
 gore:{cast:['{name} lowers its antlers and charges at {foe}.','{name} paws the ground, then drives its antlers at {foe}.'],ko:'{foe} is flung down by {name}’s charge.'},
 tailwind:{cast:['A wind rises at {name}’s back, driving each blow harder.'],end:'The wind at {name}’s back dies down.'},

 // Hidden pool
 rime:{cast:['{name} sews a sliver of rime into their collar, against a fall.']},
 reflect:{cast:['A mirror-bright sheen settles over {name}, ready to throw {foe}’s spells back.'],end:'The mirror sheen around {name} fades.'},
 moonwell:{cast:['A pool of moonlight opens at {name}’s feet.'],hold:'The moonwell at {name}’s feet fills higher.',release:'{name} drinks the moonwell down and fills with magic.'},
 lodestar:{cast:['A small star kindles above {name}.'],hold:'The star above {name} grows heavier, pulling in loose force.',release:'The star settles around {name} as a shield.'},
 toll:{cast:['A single bell note sounds from nowhere.']},

 // Forbidden pool
 torment:{cast:['{name} lays a curse on {foe}: every move will hurt.'],end:'{name}’s curse on {foe} wears off.'},
 extraction:{cast:['{name} pulls the ready magic straight out of {foe}.']},
 siphon:{cast:['A dark thread links {name} to {foe} and starts to drink.'],hold:'The dark thread drinks more from {foe}.',release:'{name} snaps the thread and takes in everything it drank.',ko:'{foe} sags, drained by {name}’s dark thread.'},
 compel:{cast:['{name} speaks a word of command: {foe} will repeat the last move.'],end:'{name} shakes off the compulsion.'},
 eclipse:{cast:['A dark disc slides over {name}, turning the next blows into magic.'],end:'The eclipse over {name} passes.'},
 heartprice:{cast:['{name} strikes a bargain: from now on, spells cost life instead of magic.']}
};
// How a fight ends, when the finishing action has no ko line of its own (or it isn't a knockout).
// A foe whose defeat isn't a fall (F5.9): its own line however the fight ends, {name} the winner, {foe} the foe.
export const DEFEAT={'Shadow stag':'{foe} lowers its head and steps aside for {name}.'};
export const ENDINGS={knockout:'{foe} can fight no more, and {name} wins.',decision:'Neither falls; {name} wins on points.',stalemate:'Neither {name} nor {foe} can finish it: a draw.',conceded:'{foe} yields to {name}.'};
// Effects that end with a line, by effect key → the spell whose `end` it uses. {name} is the effect's holder, except for
// Torment, whose effect sits on the cursed side but is told from the caster's.
const LASTING={brace:'brace',haste:'haste',shadowstep:'shadowstep',tailwind:'tailwind',reflect:'reflect',torment:'torment',eclipse:'eclipse',compelled:'compel'};
const HELD_BY_FOE=new Set(['torment']);

// The two fighters' names, [player, opponent]. The main game passes the player's name and the card's opponent; the bench
// names generic loadouts "the Duellist" and characters by name. Names starting "The" read lower-case mid-sentence.
export function fighterNames({playerName,opponentName,playerLoadout,opponentLoadout}={}){
 const of=l=>!l?null:NAMED_LOADOUTS[l]?l.replace(/^The /,'the '):SPECIAL_LOADOUTS[l]?'the '+l.toLowerCase():'the '+l;
 const a=playerName??of(playerLoadout)??'the player',b=opponentName??of(opponentLoadout)??'the opponent';
 return [a,b===a?'the rival '+b.replace(/^the /,''):b];
}
const fill=(line,name,foe)=>{if(!line)return null;const s=line.replaceAll('{name}',name).replaceAll('{foe}',foe);return s[0].toUpperCase()+s.slice(1);};
const pick=(x,round)=>Array.isArray(x)?x[(round-1)%x.length]:x;
const BUNDLE_PART={strike:'a blow',guard:'a guard',reclaim:'a breath to gather magic'};

// The line for one side's action: a channel's Hold/Release, a Haste bundle as its parts, else the cast line.
//   names: [player, opponent]; side: who acts.
export function flavorLine(id,{channel=null,round=1,names=['the player','the opponent'],side=0}={}){
 const name=names[side],foe=names[1-side];
 if(id==='hold'||id==='release')return fill(FLAVOR[channel]?.[id],name,foe);
 if(id?.startsWith('bundle:'))return fill('{name} moves at double speed: '+id.slice(7).split('+').map(p=>BUNDLE_PART[p]).join(', then ')+'.',name,foe);
 return fill(pick(FLAVOR[id]?.cast,round),name,foe);
}
// Lines for what one resolved exchange finished, from plain snapshots of the state before and after it (no rules involved):
// a Mend heals or is broken, a tired Guard gives, lasting effects, Foresight and constructs end, a foretold Omen arrives,
// the rime thaws, and the fight ends (the finishing action's ko line, else ENDINGS).
export function finishLines(before,after,pair,round,names=['the player','the opponent']){
 const out=[],add=(line,side)=>{const l=fill(line,names[side],names[1-side]);if(l&&!out.includes(l))out.push(l);};
 const g=COMBAT_TUNING.guard;
 for(const side of [0,1]){
  const id=pair[side],b=before.actors[side],a=after.actors[side];
  if(id==='mend'&&!after.result)add(a.hp>b.hp?FLAVOR.mend.end:FLAVOR.mend.broken,side);
  if(g?.repeatLeak>0&&(id==='guard'||id?.startsWith('bundle:')&&id.includes('guard'))&&b.guardRound>0&&round-b.guardRound<=(g.lookback??1)&&pair[1-side]?.includes('strike'))add(FLAVOR.guard.tired,side);
  for(const k of Object.keys(b.effects))if(!a.effects[k]&&LASTING[k])add(FLAVOR[LASTING[k]].end,HELD_BY_FOE.has(k)?1-side:side);
  if(before.earlyCommit[side]>0&&!after.earlyCommit[side])add(FLAVOR.foresight.end,1-side);
  for(const c of b.constructs)if(!a.constructs.some(x=>x.id===c.id))add(FLAVOR[c.id]?.end,side);
  if(b.omens.some(o=>o.due===round))add(FLAVOR.omen.end,side);
  if(id==='frozen'&&a.freezeUntil<=round)add(FLAVOR.frozen.end,side);
 }
 const r=after.result;
 if(r&&!before.result){
  const w=r.winner;
  if(w===undefined||w===null)add(ENDINGS.stalemate,0);
  else{
   const id=pair[w],key=id==='hold'||id==='release'?before.actors[w].channel?.id:id?.startsWith('bundle:')&&id.includes('strike')?'strike':id;
   add(DEFEAT[after.actors[1-w].kit?.loadout]??(r.reason==='knockout'?FLAVOR[key]?.ko??ENDINGS.knockout:ENDINGS[r.reason]??ENDINGS.knockout),w);
  }
 }
 return out;
}
