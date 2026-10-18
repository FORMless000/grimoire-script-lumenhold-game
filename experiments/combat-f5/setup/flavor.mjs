// What each action looks like, for the fight log and the telegraph: one plain sentence of what the fighter visibly does
// and what it does in this fight. No numbers or rules (the action's description gives those), no inner states, no gore.
// When a spell is no use in a fight, the line says so ("…, but it does little here").
//   {name}  the fighter acting (or holding the effect, for `end`); {foe}  the other fighter. The player is "you" (F5.9b), so:
//   {name’s} / {foe’s}  possessive ("your", "Lyra’s"); {v:third|second} the form agreeing with {name} ("lunges|lunge",
//   "is|are", "their|your"), {fv:third|second} the same for {foe}.
//   cast:    the action as it happens (a list rotates by exchange)
//   hold / release:  a channel's held and released exchanges (cast is its first exchange)
//   end:     a lasting effect or construct ending (Mend: the wounds closing; `broken` when a hit spoils it)
//   ko:      this action finishing the foe
//   tired:   (Guard) a Guard raised again too soon, against a Strike
// Names come from the fight (fighterNames below): "you" for the player, the opponent as the card names them.
import {COMBAT_TUNING,NAMED_LOADOUTS,SPECIAL_LOADOUTS} from './roster.mjs';
export const FLAVOR={
 // Basics
 strike:{cast:['{name} {v:lunges|lunge} in and {v:swings|swing} at {foe}.','{name} {v:closes|close} the distance and {v:strikes|strike} at {foe}.','{name} {v:throws|throw} a quick blow at {foe}.'],ko:'{foe} {fv:goes|go} down under {name’s} blows.'},
 guard:{cast:['{name} {v:raises|raise} a guard against {foe’s} blows.','{name} {v:steps|step} back, arms up, ready for {foe}.'],tired:'{name’s} guard sags, and {foe’s} blows start to get through.'},
 reclaim:{cast:['{name} {v:draws|draw} the spent magic in the air back in.','{name} {v:gathers|gather} up the loose sparks of magic left in the air.']},
 frozen:{cast:['{name} {v:is|are} frozen solid in rime and can’t move.'],end:'The rime around {name} cracks, and {name} {v:moves|move} again.'},

 // Course spells and Ward
 flame:{cast:['A burst of flame leaps from {name’s} hand at {foe}.','{name} {v:hurls|hurl} a ball of fire at {foe}.'],ko:'{foe} {fv:falls|fall} before {name’s} fire.'},
 foresight:{cast:['{name’s} eyes glaze over, reading {foe’s} next moves before they happen.'],end:'{name} can no longer read {foe’s} moves ahead.'},
 mend:{cast:['{name} {v:lays|lay} a glowing hand on {v:their|your} wounds and {v:starts|start} to knit them shut.'],end:'{name’s} wounds close up.',broken:'{foe’s} attack breaks {name’s} mending before it can take hold.'},
 glamour:{cast:['{name} {v:strikes|strike} a dazzling pose for the onlookers, but it does nothing to {foe}.']},
 haste:{cast:['{name} {v:speeds|speed} up, moving twice as fast as {foe}.'],end:'{name} {v:slows|slow} back to a normal pace.'},
 shadowstep:{cast:['{name} {v:steps|step} into the shadows, out of {foe’s} reach.'],end:'{name} {v:steps|step} back out of the shadows.'},
 ward:{cast:['A translucent ward appears before {name}, blocking off {foe’s} spells.']},

 // Hidden courses
 animate:{cast:['A chair, a coat stand and a bucket lurch to life and lumber at {foe} on {name’s} command.'],end:'{name’s} animated furniture clatters apart.',ko:'{foe} {fv:goes|go} down under {name’s} animated furniture.'},
 starlight:{cast:['Starlight gathers in {name’s} open palm.'],hold:'The starlight in {name’s} palm grows brighter.',release:'A beam of starlight shoots from {name’s} palm at {foe}.',ko:'{foe} {fv:falls|fall} in a flood of {name’s} starlight.'},
 seal:{cast:['{name} {v:twists|twist} a hand, snuffing out the loose magic around {foe}.']},

 // Peer capstones
 wildfire:{cast:['A cluster of flames sparks to life before {name}.'],hold:'The cluster of flames enlarges before {name}, radiating fiery sparks.',release:'The wildfire breaks loose from {name} and sweeps over {foe}.',ko:'{foe} {fv:falls|fall} before {name’s} wildfire.'},
 heartwood:{cast:['A sapling bursts from the floor beside {name}, ready to shelter and mend.'],end:'{name’s} sapling withers back into the floor.'},
 omen:{cast:['{name} {v:speaks|speak} an omen over {foe}: it will strike in two exchanges.'],end:'The omen {name} spoke comes true and strikes {foe}.'},
 sleight:{cast:['{name} {v:slips|slip} a hand into {foe’s} purse in passing.']},
 contraption:{cast:['{name} {v:snaps|snap} together a whirring contraption and {v:aims|aim} it at {foe}.'],end:'{name’s} contraption bursts in a shower of sparks and cogs.'},
 hoarfrost:{cast:['A lance of frost flies from {name} at {foe}.'],ko:'{foe} {fv:falls|fall}, frozen stiff by {name’s} frost.'},
 candour:{cast:['{name} {v:asks|ask} {foe} a disarming question, but it does little here.']},

 // Club and job spells
 brace:{cast:['{name} {v:plants|plant} both feet, braced to take {foe’s} hits.'],end:'{name} {v:eases|ease} out of the braced stance.'},
 quickquill:{cast:['A quill flies around {name}, but it does little in this situation.']},
 bramble:{cast:['Thorny vines burst from the floor around {foe} at {name’s} call.'],end:'{name’s} brambles wither away.'},
 index:{cast:['{name} {v:leafs|leaf} through a conjured index, but it does little here.']},
 rapport:{cast:['{name} {v:flaunts|flaunt} a handful of crowns, and the crowd cheers.']},
 purify:{cast:['{name} {v:draws|draw} some of {v:their|your} own strength out and {v:distils|distil} it into magic.']},
 // Creatures (SPECIAL_LOADOUTS)
 gore:{cast:['{name} {v:lowers|lower} its antlers and {v:charges|charge} at {foe}.','{name} {v:paws|paw} the ground, then {v:drives|drive} its antlers at {foe}.'],ko:'{foe} {fv:is|are} flung down by {name’s} charge.'},
 tailwind:{cast:['A wind rises at {name’s} back, driving each blow harder.'],end:'The wind at {name’s} back dies down.'},

 // Hidden pool
 rime:{cast:['{name} {v:sews|sew} a sliver of rime into {v:their|your} collar, against a fall.']},
 reflect:{cast:['A mirror-bright sheen settles over {name}, ready to throw {foe’s} spells back.'],end:'The mirror sheen around {name} fades.'},
 moonwell:{cast:['A pool of moonlight opens at {name’s} feet.'],hold:'The moonwell at {name’s} feet fills higher.',release:'{name} {v:drinks|drink} the moonwell down and {v:fills|fill} with magic.'},
 lodestar:{cast:['A small star kindles above {name}.'],hold:'The star above {name} grows heavier, pulling in loose force.',release:'The star settles around {name} as a shield.'},
 toll:{cast:['A single bell note sounds from nowhere.']},

 // Forbidden pool
 torment:{cast:['{name} {v:lays|lay} a curse on {foe}: every move will hurt.'],end:'{name’s} curse on {foe} wears off.'},
 extraction:{cast:['{name} {v:pulls|pull} the ready magic straight out of {foe}.']},
 siphon:{cast:['A dark thread links {name} to {foe} and starts to drink.'],hold:'The dark thread drinks more from {foe}.',release:'{name} {v:snaps|snap} the thread and {v:takes|take} in everything it drank.',ko:'{foe} {fv:sags|sag}, drained by {name’s} dark thread.'},
 compel:{cast:['{name} {v:speaks|speak} a word of command: {foe} will repeat the last move.'],end:'{name} {v:shakes|shake} off the compulsion.'},
 eclipse:{cast:['A dark disc slides over {name}, turning the next blows into magic.'],end:'The eclipse over {name} passes.'},
 heartprice:{cast:['{name} {v:strikes|strike} a bargain: from now on, spells cost life instead of magic.']}
};
// How a fight ends, when the finishing action has no ko line of its own (or it isn't a knockout).
// A foe whose defeat isn't a fall (F5.9): its own line however the fight ends, {name} the winner, {foe} the foe.
export const DEFEAT={'Shadow stag':'{foe} {fv:lowers|lower} its head and {fv:steps|step} aside for {name}.'};
export const ENDINGS={knockout:'{foe} can fight no more, and {name} {v:wins|win}.',decision:'Neither falls; {name} {v:wins|win} on points.',stalemate:'Neither {name} nor {foe} can finish it: a draw.',conceded:'{foe} {fv:yields|yield} to {name}.'};
// Effects that end with a line, by effect key → the spell whose `end` it uses. {name} is the effect's holder, except for
// Torment, whose effect sits on the cursed side but is told from the caster's.
const LASTING={brace:'brace',haste:'haste',shadowstep:'shadowstep',tailwind:'tailwind',reflect:'reflect',torment:'torment',eclipse:'eclipse',compelled:'compel'};
const HELD_BY_FOE=new Set(['torment']);

// The two fighters' names, [player, opponent]: the player is always "you" (F5.9b); the main game passes the card's opponent,
// and the bench names generic loadouts "the Duellist" and characters by name. Names starting "The" read lower-case mid-sentence.
export const YOU='you';
export function fighterNames({opponentName,opponentLoadout}={}){
 const of=l=>!l?null:NAMED_LOADOUTS[l]?l.replace(/^The /,'the '):SPECIAL_LOADOUTS[l]?'the '+l.toLowerCase():'the '+l;
 return [YOU,opponentName??of(opponentLoadout)??'the opponent'];
}
const possessive=n=>n===YOU?'your':n+'’s';
const fill=(line,name,foe)=>{if(!line)return null;
 const s=line.replaceAll('{name’s}',possessive(name)).replaceAll('{foe’s}',possessive(foe))
  .replace(/\{(f?)v:([^|}]*)\|([^}]*)\}/g,(_,f,third,second)=>(f?foe:name)===YOU?second:third)
  .replaceAll('{name}',name).replaceAll('{foe}',foe);
 return s[0].toUpperCase()+s.slice(1);};
const pick=(x,round)=>Array.isArray(x)?x[(round-1)%x.length]:x;
const BUNDLE_PART={strike:'a blow',guard:'a guard',reclaim:'a breath to gather magic'};

// The line for one side's action: a channel's Hold/Release, a Haste bundle as its parts, else the cast line.
//   names: [player, opponent]; side: who acts.
export function flavorLine(id,{channel=null,round=1,names=['the player','the opponent'],side=0}={}){
 const name=names[side],foe=names[1-side];
 if(id==='hold'||id==='release')return fill(FLAVOR[channel]?.[id],name,foe);
 if(id?.startsWith('bundle:'))return fill('{name} {v:moves|move} at double speed: '+id.slice(7).split('+').map(p=>BUNDLE_PART[p]).join(', then ')+'.',name,foe);
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
