// What each action looks like, for the fight log and the telegraph: one plain sentence of what the fighter visibly does
// and what it does in this fight. No numbers or rules (the action's description gives those), no inner states, no gore.
// When a spell is no use in a fight, the line says so ("…, but it does little here").
//   {name}  the fighter acting (or holding the effect, for `end`); {foe}  the other fighter. The player is "you" (F5.9b), so:
//   {name’s} / {foe’s}  possessive ("your", "Lyra’s"); {v:third|second} the form agreeing with {name} ("lunges|lunge",
//   "is|are"), {fv:third|second} the same for {foe}; {pos} / {fpos} / {fobj} pronouns (fighterNames: opponentPronouns).
//   cast:    the action as it happens (a list rotates by exchange)
//   hold / release:  a channel's held and released exchanges (cast is its first exchange)
//   end:     a lasting effect or construct ending (Mend: the wounds closing; `broken` when a hit spoils it)
//   ko:      this action finishing the foe
//   tired:   (Parry) a Parry raised again too soon, against Impact damage
//   beast:   (Impulse, Parry) the cast lines for a creature, which has no wand (F5.11-plan.1)
// Names come from the fight (fighterNames below): "you" for the player, the opponent as the card names them.
import {COMBAT_TUNING,NAMED_LOADOUTS,SPECIAL_LOADOUTS,SPELLS} from './roster.mjs';
// The rule a spell plays (F5.11): a creature's copy (Skitter) is told by its own lines but lasts as its base's effect.
const ruleOf=id=>SPELLS[id]?.rule??id;
import {tx} from './text.mjs';
// A spell's name as the fight shows it (label.<id> when translated).
const spellName=id=>tx('label.'+id,SPELLS[id]?.name??id);
export const FLAVOR={
 // Basics (F5.11-plan.1): Impulse (strike), a blunt magical punch driven through the wand; Parry (guard), a magical
 // deflection; Refocus (reclaim), the loose light gathered back. A creature has no wand: its own lines (beast).
 strike:{cast:['{name} {v:drives|drive} {pos} wand forward; a blunt pulse of force strikes toward {foe}.','{name} {v:thrusts|thrust} {pos} wand at {foe}, and a punch of raw force follows it.','{name} {v:snaps|snap} {pos} wand forward, throwing a hard shove of force at {foe}.'],
  beast:['{name} {v:lunges|lunge} in and {v:strikes|strike} at {foe}.','{name} {v:closes|close} the distance and {v:strikes|strike} at {foe}.','{name} {v:throws|throw} {pos} weight at {foe}.'],ko:'{foe} {fv:yields|yield}, beaten back by {name’s} force.'},
 guard:{cast:['{name} {v:sets|set} {pos} feet and {v:turns|turn} the force aside with a sharp motion of {pos} wand.','{name} {v:sweeps|sweep} {pos} wand across, ready to turn {foe’s} force aside.'],
  beast:['{name} {v:hunches|hunch} low, ready to shrug off {foe’s} force.'],tired:'{name’s} parry slows, and {foe’s} force starts to get through.'},
 reclaim:{cast:['{name} {v:turns|turn} {pos} wand inward; the loose light gathers at its tip.','{name} {v:draws|draw} the loose sparks of magic in the air back to {pos} wand.']},
 break_free:{cast:['{name} {v:strains|strain} against the bonds, working free.','{name} {v:twists|twist} and {v:tears|tear} at the bonds.']},
 frozen:{cast:['{name} {v:is|are} frozen solid in rime and can’t move.'],end:'The rime around {name} cracks, and {name} {v:moves|move} again.'},

 // Course spells and Ward
 flame:{cast:['A burst of flame leaps from {name’s} wand at {foe}.','{name} {v:hurls|hurl} a ball of fire at {foe}.'],ko:'{foe} {fv:yields|yield} before {name’s} fire.'},
 foresight:{cast:['{name’s} eyes glaze over, reading {foe’s} next moves before they happen.'],end:'{name} can no longer read {foe’s} moves ahead.'},
 mend:{cast:['{name} {v:lays|lay} a glowing hand on {pos} wounds and {v:starts|start} to knit them shut.'],end:'{name’s} wounds close up.',broken:'{foe’s} attack breaks {name’s} mending before it can take hold.'},
 glamour:{cast:['{name} {v:strikes|strike} a dazzling pose for the onlookers, but it does nothing to {foe}.']},
 haste:{cast:['{name} {v:quickens|quicken}, ready to slip a blow in between spells.'],end:'{name} {v:slows|slow} back to a normal pace.'},
 shadowstep:{cast:['{name} {v:steps|step} into the shadows, out of {foe’s} reach.'],end:'{name} {v:steps|step} back out of the shadows.'},
 ward:{cast:['A translucent ward appears before {name}, blocking off {foe’s} spells.']},

 // Hidden courses
 animate:{cast:['A chair, a coat stand and a bucket lurch to life and lumber at {foe} on {name’s} command.'],end:'{name’s} animated furniture clatters apart.',ko:'{foe} {fv:goes|go} down under {name’s} animated furniture.'},
 starlight:{cast:['{name} {v:raises|raise} {pos} wand to the sky, and starlight begins to gather high above.'],hold:'The starlight gathered above {name} grows brighter.',release:'A piercing beam of starlight falls from the sky at {foe}.',ko:'{foe} {fv:yields|yield} in a flood of {name’s} starlight.'},
 seal:{cast:['{name} {v:twists|twist} a hand, snuffing out the loose magic around {foe}.']},

 // Peer capstones
 wildfire:{cast:['Flames spring up before {name} and lash out at {foe}; {name} {v:flinches|flinch} from their heat.'],hold:'The wildfire grows fiercer and harder to hold, and its heat scorches {name} too.',release:'The wildfire breaks loose from {name} and sweeps at {foe}.',ko:'{foe} {fv:yields|yield} before {name’s} wildfire.'},
 heartwood:{cast:['A sapling bursts from the floor beside {name}, ready to shelter and mend.'],end:'{name’s} sapling withers back into the floor.'},
 omen:{cast:['{name} {v:speaks|speak} of two small misfortunes; the light around {foe} falters.'],end:'A misfortune {name} foretold comes due for {foe}.'},
 sleight:{cast:['{name} {v:slips|slip} a hand into {foe’s} purse in passing.']},
 contraption:{cast:['{name} {v:snaps|snap} together a whirring contraption and {v:aims|aim} it at {foe}.'],end:'{name’s} contraption bursts in a shower of sparks and cogs.'},
 hoarfrost:{cast:['A lance of frost flies from {name} at {foe}.'],ko:'{foe} {fv:falls|fall}, frozen stiff by {name’s} frost.'},
 candour:{cast:['{name} {v:asks|ask} {foe} a disarming question, but it does little here.']},

 // Club and job spells
 brace:{cast:['{name} {v:plants|plant} both feet, braced to take {foe’s} hits.'],end:'{name} {v:eases|ease} out of the braced stance.'},
 quickquill:{cast:['A quill flies around {name}, but it does little in this situation.']},
 bramble:{cast:['Thorny vines lash out at {foe} at {name’s} call and snatch at {fpos} ankles.']},
 index:{cast:['{name} {v:leafs|leaf} through a conjured index, but it does little here.']},
 rapport:{cast:['{name} {v:flaunts|flaunt} a handful of crowns, and the crowd cheers.']},
 purify:{cast:['{name} {v:draws|draw} some of {pos} own strength out and {v:distills|distill} it into magic.']},
 // Creatures (SPECIAL_LOADOUTS)
 gore:{cast:['{name} {v:lowers|lower} its antlers and {v:charges|charge} at {foe}.','{name} {v:paws|paw} the ground, then {v:drives|drive} its antlers at {foe}.'],ko:'{foe} {fv:is|are} flung down by {name’s} charge.'},
 tailwind:{cast:['A gust rises at {name’s} back and hurls {name} at {foe}.','The wind at {name’s} back gusts again, stronger, and drives {name} at {foe}.'],end:'The wind at {name’s} back dies down.',ko:'{foe} {fv:is|are} bowled over on {name’s} wind.'},
 // The Whisperwood (world expansion 1; real spells since F5.11). A delayed blow's `cast` says it's coming, its `end` lands it.
 nip:{cast:['{name} {v:darts|dart} in and {v:nips|nip} at {foe}.','{name} {v:snaps|snap} at {foe’s} ankles and {v:darts|dart} away.'],ko:'{foe} {fv:gives|give} up, nipped one time too many by {name}.'},
 skitter:{cast:['{name} {v:skitters|skitter} aside, out of reach.','{name} {v:whisks|whisk} out of sight.'],end:'{name} {v:edges|edge} back into view.'},
 burrow:{cast:['{name} {v:digs|dig} in low, braced.'],end:'{name} {v:wriggles|wriggle} back up out of {pos} hollow.'},
 filch:{cast:['{name} {v:snatches|snatch} at the loose sparks around {foe} and {v:gulps|gulp} them down.']},
 hide:{cast:['{name} {v:hunches|hunch} down behind {pos} thick, quilled hide.'],end:'{name} {v:uncurls|uncurl}, bristling.'},
 bark:{cast:['{name’s} bark creaks and thickens, closing over like a shield.']},
 carapace:{cast:['{name} {v:draws|draw} in under {pos} carapace.']},
 roar:{cast:['{name} {v:rears|rear} up and {v:roars|roar}: the blast of it rolls at {foe}, and loose magic scatters like startled birds.']},
 maul:{cast:['{name} {v:rears|rear} up on {pos} hind legs, towering over {foe}: the maul comes down next exchange.'],end:'{name} {v:comes|come} down on {foe} with a crushing maul.',ko:'{foe} {fv:goes|go} down under {name’s} maul.'},
 charge:{cast:['{name} {v:lowers|lower} {pos} horns and {v:scrapes|scrape} the ground: the charge comes next exchange.'],end:'{name} {v:thunders|thunder} into {foe}.',ko:'{foe} {fv:is|are} bowled over by {name’s} charge.'},
 pinch:{cast:['{name} {v:snaps|snap} {pos} great mandibles at {foe}.','{name} {v:scissors|scissor} {pos} pincers at {foe}.'],ko:'{foe} {fv:staggers|stagger} back from {name’s} mandibles and {fv:goes|go} no further.'},
 beetle_flame:{cast:['Sparks crackle between {name’s} mandibles and leap at {foe} as a spurt of flame.'],ko:'{foe} {fv:backs|back} away from {name’s} sparking mandibles.'},
 bough:{cast:['{name} {v:draws|draw} back a heavy bough, creaking: it swings in two exchanges.'],end:'{name’s} bough sweeps into {foe}.',ko:'{foe} {fv:is|are} swept off {fpos} feet by {name’s} bough.'},
 acorns:{cast:['{name} {v:shakes|shake} {pos} crown: a glowing acorn flies at {foe}, and a second hangs, waiting to drop.'],end:'The second enchanted acorn drops at {foe}.'},
 slow_fall:{cast:['{name} {v:begins|begin}, very slowly, to lean: a bough the size of a house comes down in two exchanges.'],end:'{name’s} bough comes down on {foe} like the sky falling.',ko:'{foe} {fv:is|are} pinned beneath {name’s} fallen bough.'},
 thicket:{cast:['Saplings and brambles shoulder up out of the earth around {name}, thorns turned on {foe}.'],end:'{name’s} thicket sinks back into the ground.'},
 the_long_wait:{cast:['{name} {v:goes|go} utterly still, and a strand of glowing silk around {foe} begins, very gently, to tighten: in three exchanges it closes.'],end:'The enchanted silk snaps taut, and {name} {v:lunges|lunge} with all eight legs behind it.',ko:'{foe} {fv:hangs|hang} in {name’s} silk, finished.'},
 brood:{cast:['A scuttle of little spiders pours out from under {name} and swarms over {foe}.'],end:'{name’s} brood scatters into the dark.'},
 root:{cast:['Roots heave out of the ground and coil around {foe’s} legs at {name’s} call.']},
 web:{cast:['{name} {v:flings|fling} a sheet of sticky silk at {foe}.']},
 threads:{cast:['{name} {v:trails|trail} a mesh of sticky threads around {foe’s} feet.']},
 venom:{cast:['{name} {v:darts|dart} in to bite, fangs dripping.']},
 fade:{cast:['{name} {v:steps|step} back into the shadows and {v:is|are} gone.'],end:'{name} {v:steps|step} out of the dark again.'},
 swarm:{cast:['{name} {v:pours|pour} over {foe} in a biting, scuttling wave.'],ko:'{foe} {fv:staggers|stagger} out of {name}, beaten.'},

 // Hidden pool
 rime:{cast:['{name} {v:sews|sew} a sliver of rime into {pos} collar, against a fall.']},
 reflect:{cast:['A mirror-bright sheen settles over {name}, ready to throw {foe’s} spells back.'],end:'The mirror sheen around {name} fades.'},
 moonwell:{cast:['A pool of moonlight opens at {name’s} feet.'],hold:'The moonwell at {name’s} feet fills higher.',release:'{name} {v:drinks|drink} the moonwell down and {v:fills|fill} with magic.'},
 lodestar:{cast:['A small star kindles above {name} and begins, slowly, to rise.'],end:'The star above {name} reaches its height, and its light settles over {pos} wounds.'},
 toll:{cast:['A single bell note sounds from nowhere.']},

 // Forbidden pool
 torment:{cast:['{name} {v:lays|lay} a curse on {foe}: every move will hurt.'],end:'{name’s} curse on {foe} wears off.'},
 extraction:{cast:['{name} {v:pulls|pull} the ready magic straight out of {foe}.']},
 siphon:{cast:['A dark thread links {name} to {foe} and starts to drink.'],hold:'The dark thread drinks more from {foe}.',release:'{name} {v:snaps|snap} the thread and {v:takes|take} in everything it drank.',ko:'{foe} {fv:sags|sag}, drained by {name’s} dark thread.'},
 compel:{cast:['{name} {v:speaks|speak} a word of command, binding {foe} to the move {fv:is|are} making now.'],end:'{name} {v:shakes|shake} off the compulsion.',forced:'{name} {v:is|are} compelled to repeat the seized move: {action}.',shut:'{foe’s} defences shut out {name’s} command.'},
 eclipse:{cast:['A dark disc slides over {name}, turning the next blows into magic.'],end:'The eclipse over {name} passes.'},
 heartprice:{cast:['{name} {v:strikes|strike} a bargain: from now on, spells cost life instead of magic.']}
};
// How a fight ends, when the finishing action has no ko line of its own (or it isn't a knockout).
// A foe whose defeat isn't a fall (F5.9): its own line however the fight ends, {name} the winner, {foe} the foe.
export const DEFEAT={'Shadow stag':'{foe} {fv:lowers|lower} its head and {fv:steps|step} aside for {name}.',
 // The Whisperwood (world expansion 1)
 'Practice mannequin':'{foe} {fv:topples|topple} over in a puff of straw, and Thorne nods at {name}.',
 'Bramble ferret':'{foe} {fv:chatters|chatter} something rude and {fv:vanishes|vanish} into the brambles.',
 Bristleback:'{foe} {fv:huffs|huff}, {fv:turns|turn} and {fv:lumbers|lumber} off into the trees.',
 'Stag beetle':'{foe} {fv:clicks|click} {fpos} horns once and {fv:trundles|trundle} away under a log.',
 'Grumpy oak':'{foe} {fv:goes|go} still and creaky, the way trees are meant to be.',
 'Elder oak':'{foe} {fv:sighs|sigh} through every leaf and {fv:goes|go} still.',
 'Spiderling swarm':'{foe} {fv:scatters|scatter} into a thousand cracks.',
 'The Spinner':'{foe} {fv:bows|bow} {fpos} forelegs to {name}.',
 'The Spinner, weakened':'{foe} {fv:bows|bow} {fpos} forelegs to {name}.',
 'The Outcast':'{foe} {fv:laughs|laugh}, {fv:bows|bow}, and {fv:vanishes|vanish} into silver frost.'};
export const ENDINGS={knockout:'{foe} can fight no more, and {name} {v:wins|win}.',decision:'Neither falls; {name} {v:wins|win} on points.',stalemate:'Neither {name} nor {foe} can finish it: a draw.',conceded:'{foe} {fv:yields|yield} to {name}.'};
// Effects that end with a line, by effect key → the spell whose `end` it uses. {name} is the effect's holder, except for
// Torment, whose effect sits on the cursed side but is told from the caster's.
const LASTING={brace:'brace',haste:'haste',shadowstep:'shadowstep',tailwind:'tailwind',reflect:'reflect',torment:'torment',eclipse:'eclipse',compelled:'compel',lodestar:'lodestar'};
const HELD_BY_FOE=new Set(['torment']);

// Translations (setup/text.mjs) replace any line by its key: flavor.<action>.cast.<n> / .hold / .release / .end / .ko /
// .tired / .broken / .forced / .shut, attack.<action>.<defence>, defended.<defence>, noun.<action>, effect.<effect>,
// line.<name> (LINES), ending.<reason>, defeat.<foe>, grammar.<name> (GRAMMAR). flavorTable() lists them
// all with their English. A translation keeps {name} {foe} {name’s} {foe’s} {pos} {fpos} {fobj} and the {n}-style values;
// the {v:…|…} agreement forms are English grammar and need not appear in it.
const fl=(key,en)=>en==null?null:tx('flavor.'+key,en);
const slug=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,'_');
// Sentences told around the actions (resolvedLines): {n} a number, {noun} an attack's noun, {ex} a span of exchanges.
export const LINES={
 hits:'{name’s} {noun} hits {foe}.',
 reflectedBack:'{name} {v:takes|take} {n} damage from {pos} own {noun}.',
 noDamage:'It does no damage.',
 takes:'{foe} {fv:takes|take} {n} damage.',
 takesHits:'{foe} {fv:takes|take} {n} damage from {hits} hits.',
 regains:'{name} {v:regains|regain} {n} Mana.',
 noLooseMagic:'There is no loose magic left to gather.',
 heals:'{name} {v:heals|heal} {n} HP.',
 mendBreaks:'The mending breaks: no healing.',
 extractionBlocked:'{foe’s} defences keep {fpos} Mana in place: it takes nothing.',
 extraction:'{n} of {foe’s} Mana becomes {pos} loose magic.',
 extractionFull:'There is no room for more magic: it takes nothing.',
 sealBlocked:'{foe’s} defences keep {fpos} loose magic safe.',
 seal:'{foe} {fv:loses|lose} {n} loose magic.',
 sealNothing:'There was no loose magic to snuff out.',
 purify:'{name} {v:pays|pay} Health for {n} Mana.',
 commitFirst:'{foe} must commit first for the next {ex}.',
 repeatAgain:'{foe} must repeat it for the next three exchanges.',
 repeatAgainAction:'{foe} must repeat it for the next three exchanges: {action}.',
 compelledRepeat:'Compelled, {name} {v:repeats|repeat} the seized move.',
 applyBlocked:'{foe’s} defences keep {name’s} {spell} off.',
 applyReflected:'{foe’s} mirror sheen turns {name’s} {spell} back on {name}.',
 applyReflectedBlocked:'{foe’s} mirror sheen turns {name’s} {spell} back, and {name’s} own defences keep it off.'
};
// The grammar the lines are filled with: the player ("you"), possessives and pronouns, and spans of exchanges.
export const GRAMMAR={you:'you',your:'your',possessive:'{n}’s',then:', then ',exchange1:'1 exchange',exchanges:'{n} exchanges',restOfFight:'the rest of the fight',two:'two',three:'three',
 'you.pos':'your','you.obj':'you','they.pos':'their','they.obj':'them','she.pos':'her','she.obj':'her','he.pos':'his','he.obj':'him','it.pos':'its','it.obj':'it'};
const gr=k=>tx('grammar.'+k,GRAMMAR[k]);
const line=k=>tx('line.'+k,LINES[k]);

// The two fighters' names, [player, opponent]: the player is always "you" (F5.9b); the main game passes the card's opponent,
// and the bench names generic loadouts "the Duellist" and characters by name. Names starting "The" read lower-case mid-sentence.
export const YOU='you';
// Pronouns for {pos} / {fpos} (possessive) and {fobj} (object). The main game passes a character's own (their worldbook
// `pronouns:`, e.g. 'she'); generic foes are 'they' and creatures 'it'. The player is 'you'.
const PRONOUNS=['you','they','she','he','it'];
export function fighterNames({opponentName,opponentLoadout,opponentPronouns}={}){
 const of=l=>!l?null:NAMED_LOADOUTS[l]?l.replace(/^The /,'the '):SPECIAL_LOADOUTS[l]?(/^the /i.test(l)?l.replace(/^The /,'the '):'the '+l.toLowerCase()):'the '+l;
 const names=[gr('you'),opponentName??of(opponentLoadout)??'the opponent'];
 const p=String(opponentPronouns??(SPECIAL_LOADOUTS[opponentLoadout]?.creature?'it':'they')).split('/')[0].toLowerCase();
 names.pronouns=['you',PRONOUNS.includes(p)?p:'they'];
 return names;
}
const isYou=n=>n===YOU||n===gr('you');
const possessive=n=>isYou(n)?gr('your'):gr('possessive').replace('{n}',n);
const pron=(n,p,form)=>gr((isYou(n)?'you':PRONOUNS.includes(p)?p:'they')+'.'+form);
const fill=(line,name,foe,pn,pf)=>{if(!line)return null;
 const s=line.replaceAll('{name’s}',possessive(name)).replaceAll('{foe’s}',possessive(foe))
  .replaceAll('{pos}',pron(name,pn,'pos')).replaceAll('{fpos}',pron(foe,pf,'pos')).replaceAll('{fobj}',pron(foe,pf,'obj'))
  .replace(/\{(f?)v:([^|}]*)\|([^}]*)\}/g,(_,f,third,second)=>isYou(f?foe:name)?second:third)
  .replaceAll('{name}',name).replaceAll('{foe}',foe);
 return s[0].toUpperCase()+s.slice(1);};
// A cast line: one of the action's (a list rotates by exchange); a creature's own (beast) when the action has them.
const castLine=(id,round,beast=false)=>{const key=beast&&FLAVOR[id]?.beast?'beast':'cast',c=FLAVOR[id]?.[key];if(!c)return null;const i=Array.isArray(c)?(round-1)%c.length:0;return fl(id+'.'+key+'.'+i,Array.isArray(c)?c[i]:c);};

// The line for one side's action: a channel's Hold/Release, else the cast line. A creature (pronoun "it") has no wand.
//   names: [player, opponent]; side: who acts.
// labels: the acting side's kit.labels (a creature's alias for a base spell: {shadowstep:'skitter'}, world expansion 1).
export function flavorLine(id,{channel=null,round=1,names=['the player','the opponent'],side=0,labels=null}={}){
 const name=names[side],foe=names[1-side],pr=[names.pronouns?.[side],names.pronouns?.[1-side]];
 if(labels){if(labels[id])id=labels[id];if(labels[channel])channel=labels[channel];}
 if(id==='hold'||id==='release')return fill(fl(channel+'.'+id,FLAVOR[channel]?.[id]),name,foe,...pr);
 return fill(castLine(id,round,pr[0]==='it'),name,foe,...pr);
}
// What an attack looks like when a defence changed it (F5.9b), by the attack and the defence that mattered most; any attack
// without its own line uses ATTACK_DEFENDED with its noun. {name} the attacker, {foe} the target.
const ATTACK_NOUN={nip:'nip',maul:'maul',charge:'charge',pinch:'mandibles',beetle_flame:'spurt of flame',bough:'bough',acorns:'acorn',thicket:'thicket',slow_fall:'falling bough',the_long_wait:'silk and strike',swarm:'swarm',venom:'venom',brood:'brood',strike:'force',flame:'fireball',hoarfrost:'frost lance',gore:'charge',tailwind:'wind-driven rush',roar:'roar',wildfire:'wildfire',starlight:'beam of starlight',siphon:'dark thread',bramble:'thorns',animate:'furniture',contraption:'contraption',omen:'misfortune',torment:'curse',heartwood:'sapling',attack:'attack'};
const noun=aid=>tx('noun.'+(ATTACK_NOUN[aid]?aid:'attack'),ATTACK_NOUN[aid]??ATTACK_NOUN.attack);
export const ATTACK_LINES={
 strike:{evaded:'{name’s} force drives into the shadows, but {foe} {fv:is|are} not there.',guarded:'{foe} {fv:turns|turn} {name’s} force aside with a parry.',tiredGuard:'{foe’s} tiring parry gives, and part of {name’s} force gets through.',warded:'{name’s} force thuds into {foe’s} ward, losing half its push.',braced:'{foe} {fv:takes|take} {name’s} force braced, barely moving.'},
 flame:{evaded:'{name’s} fireball passes through the shadows where {foe} stood.',warded:'{name’s} fireball splashes against {foe’s} ward and fizzles out.',guarded:'{foe’s} parry turns half of {name’s} fireball aside.',braced:'{foe} {fv:plants|plant} {fpos} feet and {fv:weathers|weather} {name’s} fireball.',reflected:'{name’s} fireball bounces off {foe’s} mirror sheen and flies back at {name}.'},
 hoarfrost:{evaded:'{name’s} frost lance flies through the shadows where {foe} stood.',warded:'{name’s} frost lance shatters on {foe’s} ward.',guarded:'{foe} {fv:knocks|knock} {name’s} frost lance aside with a parry, taking half the chill.',reflected:'{name’s} frost lance glances off {foe’s} mirror sheen and turns back on {name}.'},
 gore:{evaded:'{name} {v:charges|charge} into the shadows and finds no one there.',guarded:'{foe} {fv:turns|turn} {name’s} antlers aside with a parry.',warded:'{name’s} antlers drive into {foe’s} ward, which takes half the charge.',braced:'{foe} {fv:meets|meet} {name’s} charge braced and {fv:holds|hold} firm.'},
 wildfire:{evaded:'{name’s} wildfire sweeps through the shadows where {foe} stood.',warded:'{name’s} wildfire breaks against {foe’s} ward, and part of it burns on through.',guarded:'{foe’s} parry turns half of {name’s} wildfire aside.',reflected:'{name’s} wildfire rolls off {foe’s} mirror sheen and back over {name}.'},
 starlight:{evaded:'{name’s} beam of starlight lights up empty shadows.',warded:'{name’s} beam of starlight scatters on {foe’s} ward.',guarded:'{foe’s} parry turns half of {name’s} starlight aside.',reflected:'{name’s} starlight bounces off {foe’s} mirror sheen straight back at {name}.'}
};
const attackLine=(aid,def)=>ATTACK_LINES[aid]?.[def]==null?null:tx('attack.'+aid+'.'+def,ATTACK_LINES[aid][def]);
const ATTACK_DEFENDED={evaded:'{foe} {fv:is|are} in the shadows: {name’s} {noun} passes straight through.',warded:'{foe’s} ward meets {name’s} {noun}.',guarded:'{foe} {fv:parries|parry} {name’s} {noun}.',tiredGuard:'{foe’s} tiring parry lets part of {name’s} {noun} through.',braced:'{foe} {fv:weathers|weather} {name’s} {noun} in a braced stance.',reflected:'{foe’s} mirror sheen throws {name’s} {noun} back at {name}.',absorbed:'{foe’s} summoning soaks up part of {name’s} {noun}.',negated:'{foe’s} risen star swallows {name’s} {noun} whole.',frozen:'{foe} {fv:is|are} frozen in rime, and {name’s} {noun} can’t touch {foe}.'};
// What a lasting effect does, for "for N exchanges" sentences. {n} the exchanges it lasts; {x} its value where it has one.
const EFFECT_WORDS={
 shadowstep:'{name} can’t be hit for {n}, until {name} {v:attacks|attack} or {v:gathers|gather} Mana.',
 haste:'For {n}, {name’s} spells without damage of their own also throw an Impulse, and every other action also parries.',
 brace:'{name} {v:shrugs|shrug} off most of the damage for {n}.',
 reflect:'Spells cast at {name} bounce back for {n}.',
 torment:'Every move {foe} {fv:makes|make} costs {fobj} Health for {n}.',
 eclipse:'Blows that hit {name} turn into Mana for {n}.',
 compelled:'{foe} must repeat that move for {n}.',
 heartprice:'{name’s} magic becomes Health, and {name’s} spells cost Health from now on.',
 lodestar:'The star rises over {name}: in {n} it shields and heals.',
 bound:'{foe} must break free for {n}.',
 poison:'The poison works in {foe} for {n}.'
};
const EFFECT_ON_FOE=new Set(['torment','compelled','bound','poison']);   // placed on the foe, told from the caster's side
const ex=n=>n===1?gr('exchange1'):gr('exchanges').replace('{n}',n);
const r0=x=>Math.round(x);
// The most telling defence on a hit: what the defender's line should say.
function defence(by){for(const d of ['lodestar','shadowstep','reflect','frozen','ward','tiredGuard','guard','brace','construct'])if(by.includes(d))return d==='construct'?'absorbed':d==='lodestar'?'negated':d==='shadowstep'?'evaded':d==='ward'?'warded':d==='guard'?'guarded':d==='brace'?'braced':d==='reflect'?'reflected':d;return null;}
// The log line for each side's action in a resolved exchange, with its consequences in plain words: the attack and what
// stopped or let it through ("Lyra takes 14 damage"), and what a non-attack did ("for 3 exchanges", "regains 9 Mana").
//   before/after: plain state snapshots; r: the resolved exchange ({pair, round, channels, eventData}); names: [player, opponent].
export function resolvedLines(before,after,r,names=['the player','the opponent']){
 const ev=r.eventData??[],out=[null,null];
 for(const side of [0,1]){
  const id=r.pair[side],ch=r.channels?.[side],spell=id==='hold'||id==='release'?ch:id;
  const name=names[side],foe=names[1-side],F=line=>fill(line,name,foe,names.pronouns?.[side],names.pronouns?.[1-side]),parts=[];
  const L=(k,v={})=>F(Object.entries(v).reduce((s,[a,b])=>s.replaceAll('{'+a+'}',b),line(k)));
  const labels=after.actors[side]?.kit?.labels??null,lab=x=>labels?.[x]??x;
  const mine=ev.filter(e=>e.type==='hit'&&e.source===side&&!e.reflected).map(e=>labels?{...e,id:lab(e.id)}:e);
  // Attacks: one sentence per kind of attack this side landed or lost, then the damage.
  const byId={};for(const e of mine)(byId[e.id]??=[]).push(e);
  const head=flavorLine(id,{channel:ch,round:r.round,names,side,labels});
  let usedHead=false;
  for(const [aid,hits]of Object.entries(byId)){
   const dealt=hits.reduce((n,e)=>n+e.amount,0),def=hits.map(e=>defence(e.by)).find(Boolean);
   const special=def&&(attackLine(aid,def)??(def==='tiredGuard'?attackLine(aid,'guarded'):null));
   const said=def?special??tx('defended.'+def,ATTACK_DEFENDED[def]).replaceAll('{noun}',noun(aid)):null;
   const own=aid===lab(spell);
   if(said)parts.push(F(said));else if(own&&!usedHead&&head){parts.push(head);usedHead=true;}else if(!own)parts.push(L('hits',{noun:noun(aid)}));
   const back=ev.filter(e=>e.type==='hit'&&e.reflected&&e.source===1-side&&e.id===aid).reduce((n,e)=>n+e.amount,0);
   if(def==='reflected')parts.push(back>0?L('reflectedBack',{n:r0(back),noun:noun(aid)}):L('noDamage'));
   else parts.push(dealt>0?(hits.length>1?L('takesHits',{n:r0(dealt),hits:hits.length}):L('takes',{n:r0(dealt)})):L('noDamage'));
  }
  if(!usedHead&&head&&!Object.keys(byId).includes(lab(spell)))parts.unshift(head);
  // Non-attacks: what changed for this side.
  const b=before.actors[side],a=after.actors[side];
  const reclaimed=ev.filter(e=>e.type==='reclaimed'&&e.side===side).reduce((n,e)=>n+e.amount,0);
  if(reclaimed>0)parts.push(L('regains',{n:r0(reclaimed)}));
  else if(id==='reclaim')parts.push(L('noLooseMagic'));
  if(spell==='mend'&&!after.result)parts.push(a.hp>b.hp?L('heals',{n:r0(a.hp-b.hp)}):L('mendBreaks'));
  for(const m of ev.filter(e=>e.type==='moved'&&e.side===side)){const n=r0(m.amount);
   if(m.id==='extraction')parts.push(m.blocked?L('extractionBlocked'):n>0?L('extraction',{n}):L('extractionFull'));
   if(m.id==='seal')parts.push(m.blocked?L('sealBlocked'):n>0?L('seal',{n}):L('sealNothing'));
   if(m.id==='purify')parts.push(L('purify',{n}));}
  // A hostile spell kept off or turned back (F5.11-plan.1): told for the spells without a line of their own.
  for(const e of ev.filter(e=>e.type==='applied'&&e.side===side&&e.outcome!=='landed'&&!['extraction','seal','compel'].includes(e.id)))
   parts.push(L(e.outcome==='blocked'?'applyBlocked':e.outcome==='reflected'?'applyReflected':'applyReflectedBlocked',{spell:spellName(lab(e.id))}));
  if(spell==='foresight'&&after.earlyCommit?.[1-side]>0)parts.push(L('commitFirst',{ex:ex(after.earlyCommit[1-side])}));
  for(const [k,words]of Object.entries(EFFECT_WORDS)){
   const holder=EFFECT_ON_FOE.has(k)?1-side:side,e1=after.actors[holder].effects?.[k],e0=before.actors[holder].effects?.[k];
   if(!e1||(e0&&e0.until===e1.until&&e0.from===e1.from))continue;
   if(![LASTING_SPELL[k]].flat().includes(ruleOf(spell))&&![LASTING_SPELL[k]].flat().includes(spell))continue;
   const n=k==='lodestar'?e1.from-r.round:e1.until==null?null:e1.until-Math.max(e1.from,r.round)+1,x=k==='lodestar'?r0(e1.value):'';
   parts.push(F(tx('effect.'+k,words).replace('{n}',n==null?gr('restOfFight'):ex(n)).replace('{x}',x)));
  }
  // Compel (F5.11-plan.1): the move it seized this exchange, kept off, or turned back by Reflect.
  const cp=spell==='compel'&&!after.result?ev.find(e=>e.type==='applied'&&e.side===side&&e.id==='compel'):null;
  if(cp){parts.length=0;
   if(cp.outcome==='landed'){parts.push(F(fl('compel.cast.0',FLAVOR.compel.cast[0])));parts.push(r.actionNames?.[1-side]?L('repeatAgainAction',{action:r.actionNames[1-side]}):L('repeatAgain'));}
   else parts.push(cp.outcome==='blocked'?F(fl('compel.shut',FLAVOR.compel.shut)):L(cp.outcome==='reflected'?'applyReflected':'applyReflectedBlocked',{spell:spellName('compel')}));}
  if(isCompelled({...before,round:r.round},side))parts.unshift(L('compelledRepeat'));
  out[side]=parts.length?parts.join(tx('grammar.sentenceSep',' ')):null;
 }
 return out;
}
// A side compelled this exchange (Compel, F5.9b): its move is forced and shown in advance.
export const isCompelled=(state,side)=>{const e=state.actors[side].effects?.compelled;return !!e&&e.from<=state.round&&(e.until==null||e.until>=state.round);};
export const compelledLine=(action,{names=['the player','the opponent'],side=1}={})=>fill(fl('compel.forced',FLAVOR.compel.forced).replace('{action}',action),names[side],names[1-side],names.pronouns?.[side],names.pronouns?.[1-side]);
const LASTING_SPELL={shadowstep:'shadowstep',haste:'haste',brace:'brace',reflect:'reflect',torment:'torment',eclipse:'eclipse',compelled:'compel',heartprice:'heartprice',lodestar:'lodestar',bound:['root','web','threads','bramble'],poison:'venom'};
// Lines for what one resolved exchange finished, from plain snapshots of the state before and after it (no rules involved):
// a Mend heals or is broken, a tired Guard gives, lasting effects, Foresight and constructs end, a foretold Omen arrives,
// the rime thaws, and the fight ends (the finishing action's ko line, else ENDINGS).
export function finishLines(before,after,pair,round,names=['the player','the opponent']){
 const out=[],add=(line,side)=>{const l=fill(line,names[side],names[1-side],names.pronouns?.[side],names.pronouns?.[1-side]);if(l&&!out.includes(l))out.push(l);};
 const end=id=>fl(id+'.end',FLAVOR[id]?.end);
 const g=COMBAT_TUNING.guard;
 for(const side of [0,1]){
  const id=pair[side],b=before.actors[side],a=after.actors[side];
  if(g?.repeatLeak>0&&id==='guard'&&b.guardRound>0&&round-b.guardRound<=(g.lookback??1)&&(pair[1-side]==='strike'||SPELLS[pair[1-side]]?.physical))add(fl('guard.tired',FLAVOR.guard.tired),side);
  // A lasting effect's end, told by the kit's own spell for it (a creature's Skitter for Shadowstep's), else the rule's.
  const lab=x=>Object.keys(a.kit?.spells??{}).find(id=>id!==x&&ruleOf(id)===x&&!a.kit.spells[x]&&FLAVOR[id]?.end)??x;
  for(const k of Object.keys(b.effects))if(!a.effects[k]&&LASTING[k])add(end(HELD_BY_FOE.has(k)?LASTING[k]:lab(LASTING[k])),HELD_BY_FOE.has(k)?1-side:side);
  if(before.earlyCommit[side]>0&&!after.earlyCommit[side])add(end('foresight'),1-side);
  for(const c of b.constructs)if(!a.constructs.some(x=>x.id===c.id))add(end(lab(c.id)),side);
  for(const o of b.omens)if(o.due===round)add(end(o.id&&FLAVOR[o.id]?.end?o.id:'omen'),side);
  if(id==='frozen'&&a.freezeUntil<=round)add(end('frozen'),side);
 }
 const r=after.result,ending=k=>tx('ending.'+k,ENDINGS[k]);
 if(r&&!before.result){
  const w=r.winner;
  if(w===undefined||w===null)add(ending('stalemate'),0);
  else{
   // A delayed blow that lands this exchange finishes the fight under its own name (F5.11).
   const landed=before.actors[w].omens?.find(o=>o.due===round&&o.id&&FLAVOR[o.id]?.ko)?.id;
   const id=pair[w],key0=id==='hold'||id==='release'?before.actors[w].channel?.id:id,key=landed??after.actors[w].kit?.labels?.[key0]??key0;
   const foeLoadout=after.actors[1-w].kit?.loadout,defeat=DEFEAT[foeLoadout]?tx('defeat.'+slug(foeLoadout),DEFEAT[foeLoadout]):null;
   add(defeat??(r.reason==='knockout'?fl(key+'.ko',FLAVOR[key]?.ko)??ending('knockout'):ENDINGS[r.reason]?ending(r.reason):ending('knockout')),w);
  }
 }
 return out;
}
// Every line above by its translation key, with its English (the main game's source for translations: web/text-table.mjs).
export function flavorTable(){
 const t={};
 for(const [id,f]of Object.entries(FLAVOR))for(const [k,v]of Object.entries(f)){if(Array.isArray(v))v.forEach((x,i)=>{t['flavor.'+id+'.'+k+'.'+i]=x;});else t['flavor.'+id+'.'+k]=v;}
 for(const [id,f]of Object.entries(ATTACK_LINES))for(const [k,v]of Object.entries(f))t['attack.'+id+'.'+k]=v;
 for(const [k,v]of Object.entries(ATTACK_DEFENDED))t['defended.'+k]=v;
 for(const [k,v]of Object.entries(ATTACK_NOUN))t['noun.'+k]=v;
 for(const [k,v]of Object.entries(EFFECT_WORDS))t['effect.'+k]=v;
 for(const [k,v]of Object.entries(LINES))t['line.'+k]=v;
 for(const [k,v]of Object.entries(ENDINGS))t['ending.'+k]=v;
 for(const [k,v]of Object.entries(DEFEAT))t['defeat.'+slug(k)]=v;
 for(const [k,v]of Object.entries(GRAMMAR))t['grammar.'+k]=v;
 t['grammar.sentenceSep']=' ';
 return t;
}
