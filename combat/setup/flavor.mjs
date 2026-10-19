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
//   tired:   (Guard) a Guard raised again too soon, against a Strike
// Names come from the fight (fighterNames below): "you" for the player, the opponent as the card names them.
import {COMBAT_TUNING,NAMED_LOADOUTS,SPECIAL_LOADOUTS} from './roster.mjs';
import {tx} from './text.mjs';
export const FLAVOR={
 // Basics
 strike:{cast:['{name} {v:lunges|lunge} in and {v:swings|swing} at {foe}.','{name} {v:closes|close} the distance and {v:strikes|strike} at {foe}.','{name} {v:throws|throw} a quick blow at {foe}.'],ko:'{foe} {fv:goes|go} down under {name’s} blows.'},
 guard:{cast:['{name} {v:raises|raise} a guard against {foe’s} blows.','{name} {v:steps|step} back, arms up, ready for {foe}.'],tired:'{name’s} guard sags, and {foe’s} blows start to get through.'},
 reclaim:{cast:['{name} {v:draws|draw} the spent magic in the air back in.','{name} {v:gathers|gather} up the loose sparks of magic left in the air.']},
 frozen:{cast:['{name} {v:is|are} frozen solid in rime and can’t move.'],end:'The rime around {name} cracks, and {name} {v:moves|move} again.'},

 // Course spells and Ward
 flame:{cast:['A burst of flame leaps from {name’s} hand at {foe}.','{name} {v:hurls|hurl} a ball of fire at {foe}.'],ko:'{foe} {fv:falls|fall} before {name’s} fire.'},
 foresight:{cast:['{name’s} eyes glaze over, reading {foe’s} next moves before they happen.'],end:'{name} can no longer read {foe’s} moves ahead.'},
 mend:{cast:['{name} {v:lays|lay} a glowing hand on {pos} wounds and {v:starts|start} to knit them shut.'],end:'{name’s} wounds close up.',broken:'{foe’s} attack breaks {name’s} mending before it can take hold.'},
 glamour:{cast:['{name} {v:strikes|strike} a dazzling pose for the onlookers, but it does nothing to {foe}.']},
 haste:{cast:['{name} {v:speeds|speed} up, moving twice as fast as {foe}.'],end:'{name} {v:slows|slow} back to a normal pace.'},
 shadowstep:{cast:['{name} {v:steps|step} into the shadows, out of {foe’s} reach.'],end:'{name} {v:steps|step} back out of the shadows.'},
 ward:{cast:['A translucent ward appears before {name}, blocking off {foe’s} spells.']},

 // Hidden courses
 animate:{cast:['A chair, a coat stand and a bucket lurch to life and lumber at {foe} on {name’s} command.'],end:'{name’s} animated furniture clatters apart.',ko:'{foe} {fv:goes|go} down under {name’s} animated furniture.'},
 starlight:{cast:['Starlight gathers in {name’s} open palm.'],hold:'The starlight in {name’s} palm grows brighter.',release:'A beam of starlight shoots from {name’s} palm at {foe}.',ko:'{foe} {fv:falls|fall} in a flood of {name’s} starlight.'},
 seal:{cast:['{name} {v:twists|twist} a hand, snuffing out the loose magic around {foe}.']},

 // Peer capstones
 wildfire:{cast:['A cluster of flames sparks to life before {name} and lashes out at {foe}.'],hold:'The cluster of flames enlarges before {name}, radiating fiery sparks.',release:'The wildfire breaks loose from {name} and sweeps over {foe}.',ko:'{foe} {fv:falls|fall} before {name’s} wildfire.'},
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
 purify:{cast:['{name} {v:draws|draw} some of {pos} own strength out and {v:distils|distil} it into magic.']},
 // Creatures (SPECIAL_LOADOUTS)
 gore:{cast:['{name} {v:lowers|lower} its antlers and {v:charges|charge} at {foe}.','{name} {v:paws|paw} the ground, then {v:drives|drive} its antlers at {foe}.'],ko:'{foe} {fv:is|are} flung down by {name’s} charge.'},
 tailwind:{cast:['A wind rises at {name’s} back, driving each blow harder.'],end:'The wind at {name’s} back dies down.'},

 // Hidden pool
 rime:{cast:['{name} {v:sews|sew} a sliver of rime into {pos} collar, against a fall.']},
 reflect:{cast:['A mirror-bright sheen settles over {name}, ready to throw {foe’s} spells back.'],end:'The mirror sheen around {name} fades.'},
 moonwell:{cast:['A pool of moonlight opens at {name’s} feet.'],hold:'The moonwell at {name’s} feet fills higher.',release:'{name} {v:drinks|drink} the moonwell down and {v:fills|fill} with magic.'},
 lodestar:{cast:['A small star kindles above {name}.'],hold:'The star above {name} grows heavier, pulling in loose force.',release:'The star settles around {name} as a shield.'},
 toll:{cast:['A single bell note sounds from nowhere.']},

 // Forbidden pool
 torment:{cast:['{name} {v:lays|lay} a curse on {foe}: every move will hurt.'],end:'{name’s} curse on {foe} wears off.'},
 extraction:{cast:['{name} {v:pulls|pull} the ready magic straight out of {foe}.']},
 siphon:{cast:['A dark thread links {name} to {foe} and starts to drink.'],hold:'The dark thread drinks more from {foe}.',release:'{name} {v:snaps|snap} the thread and {v:takes|take} in everything it drank.',ko:'{foe} {fv:sags|sag}, drained by {name’s} dark thread.'},
 compel:{cast:['{name} {v:speaks|speak} a word of command, and {foe} {fv:repeats|repeat} {fpos} last move.'],end:'{name} {v:shakes|shake} off the compulsion.',forced:'{name} {v:is|are} compelled to repeat {pos} last move: {action}.',shut:'{foe’s} defences shut out {name’s} command.'},
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

// Translations (setup/text.mjs) replace any line by its key: flavor.<action>.cast.<n> / .hold / .release / .end / .ko /
// .tired / .broken / .forced / .shut, attack.<action>.<defence>, defended.<defence>, noun.<action>, effect.<effect>,
// bundle.<action>, line.<name> (LINES), ending.<reason>, defeat.<foe>, grammar.<name> (GRAMMAR). flavorTable() lists them
// all with their English. A translation keeps {name} {foe} {name’s} {foe’s} {pos} {fpos} {fobj} and the {n}-style values;
// the {v:…|…} agreement forms are English grammar and need not appear in it.
const fl=(key,en)=>en==null?null:tx('flavor.'+key,en);
const slug=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,'_');
// Sentences told around the actions (resolvedLines): {n} a number, {noun} an attack's noun, {ex} a span of exchanges.
export const LINES={
 bundle:'{name} {v:moves|move} at double speed: {parts}.',
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
 repeatAgain:'{foe} must repeat it again next exchange.',
 repeatAgainAction:'{foe} must repeat it again next exchange: {action}.',
 compelledRepeat:'Compelled, {name} {v:repeats|repeat} {pos} last move.'
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
 const of=l=>!l?null:NAMED_LOADOUTS[l]?l.replace(/^The /,'the '):SPECIAL_LOADOUTS[l]?'the '+l.toLowerCase():'the '+l;
 const names=[gr('you'),opponentName??of(opponentLoadout)??'the opponent'];
 const p=String(opponentPronouns??(SPECIAL_LOADOUTS[opponentLoadout]?'it':'they')).split('/')[0].toLowerCase();
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
// A cast line: one of the action's (a list rotates by exchange).
const castLine=(id,round)=>{const c=FLAVOR[id]?.cast;if(!c)return null;const i=Array.isArray(c)?(round-1)%c.length:0;return fl(id+'.cast.'+i,Array.isArray(c)?c[i]:c);};
const BUNDLE_PART={strike:'a blow',guard:'a guard',reclaim:'a breath to gather magic'};

// The line for one side's action: a channel's Hold/Release, a Haste bundle as its parts, else the cast line.
//   names: [player, opponent]; side: who acts.
export function flavorLine(id,{channel=null,round=1,names=['the player','the opponent'],side=0}={}){
 const name=names[side],foe=names[1-side],pr=[names.pronouns?.[side],names.pronouns?.[1-side]];
 if(id==='hold'||id==='release')return fill(fl(channel+'.'+id,FLAVOR[channel]?.[id]),name,foe,...pr);
 if(id?.startsWith('bundle:'))return fill(line('bundle').replace('{parts}',id.slice(7).split('+').map(p=>tx('bundle.'+p,BUNDLE_PART[p])).join(gr('then'))),name,foe,...pr);
 return fill(castLine(id,round),name,foe,...pr);
}
// What an attack looks like when a defence changed it (F5.9b), by the attack and the defence that mattered most; any attack
// without its own line uses ATTACK_DEFENDED with its noun. {name} the attacker, {foe} the target.
const ATTACK_NOUN={strike:'blow',flame:'fireball',hoarfrost:'frost lance',gore:'charge',wildfire:'wildfire',starlight:'beam of starlight',siphon:'dark thread',bramble:'thorns',animate:'furniture',contraption:'contraption',omen:'omen',heartwood:'sapling',attack:'attack'};
const noun=aid=>tx('noun.'+(ATTACK_NOUN[aid]?aid:'attack'),ATTACK_NOUN[aid]??ATTACK_NOUN.attack);
export const ATTACK_LINES={
 strike:{evaded:'{name} {v:swings|swing} at {foe}, but {foe} {fv:is|are} in the shadows and the blow meets nothing.',guarded:'{foe} {fv:catches|catch} {name’s} blow on a raised guard.',tiredGuard:'{foe’s} tired guard gives, and part of {name’s} blow gets through.',warded:'{name’s} blow thuds into {foe’s} ward, losing half its force.',braced:'{foe} {fv:takes|take} {name’s} blow braced, barely moving.'},
 flame:{evaded:'{name’s} fireball passes through the shadows where {foe} stood.',warded:'{name’s} fireball splashes against {foe’s} ward and fizzles out.',guarded:'{foe} {fv:takes|take} {name’s} fireball on crossed arms, smothering half the burn.',braced:'{foe} {fv:plants|plant} {fpos} feet and {fv:weathers|weather} {name’s} fireball.',reflected:'{name’s} fireball bounces off {foe’s} mirror sheen and flies back at {name}.'},
 hoarfrost:{evaded:'{name’s} frost lance flies through the shadows where {foe} stood.',warded:'{name’s} frost lance shatters on {foe’s} ward.',guarded:'{foe} {fv:knocks|knock} {name’s} frost lance aside, taking half the chill.',reflected:'{name’s} frost lance glances off {foe’s} mirror sheen and turns back on {name}.'},
 gore:{evaded:'{name} {v:charges|charge} into the shadows and finds no one there.',guarded:'{foe} {fv:catches|catch} {name’s} antlers on a raised guard.',warded:'{name’s} antlers drive into {foe’s} ward, which takes half the charge.',braced:'{foe} {fv:meets|meet} {name’s} charge braced and {fv:holds|hold} firm.'},
 wildfire:{embers:'{foe’s} defences stop the heart of {name’s} wildfire, but its embers burn through.',evaded:'{name’s} wildfire sweeps through the shadows where {foe} stood.',warded:'{name’s} wildfire breaks against {foe’s} ward and burns out.',guarded:'{foe} {fv:shields|shield} {fpos} face from {name’s} wildfire, taking half of it.',reflected:'{name’s} wildfire rolls off {foe’s} mirror sheen and back over {name}.'},
 starlight:{evaded:'{name’s} beam of starlight lights up empty shadows.',warded:'{name’s} beam of starlight scatters on {foe’s} ward.',guarded:'{foe} {fv:turns|turn} {fpos} guard to {name’s} starlight, taking half of it.',reflected:'{name’s} starlight bounces off {foe’s} mirror sheen straight back at {name}.'}
};
const attackLine=(aid,def)=>ATTACK_LINES[aid]?.[def]==null?null:tx('attack.'+aid+'.'+def,ATTACK_LINES[aid][def]);
const ATTACK_DEFENDED={evaded:'{foe} {fv:is|are} in the shadows: {name’s} {noun} passes straight through.',warded:'{foe’s} ward stops {name’s} {noun}.',guarded:'{foe} {fv:takes|take} {name’s} {noun} on a raised guard.',tiredGuard:'{foe’s} tired guard lets part of {name’s} {noun} through.',braced:'{foe} {fv:weathers|weather} {name’s} {noun} in a braced stance.',reflected:'{foe’s} mirror sheen throws {name’s} {noun} back at {name}.',absorbed:'{foe’s} shield soaks up part of {name’s} {noun}.',frozen:'{foe} {fv:is|are} frozen in rime, and {name’s} {noun} can’t touch {foe}.'};
// What a lasting effect does, for "for N exchanges" sentences. {n} the exchanges it lasts; {x} its value where it has one.
const EFFECT_WORDS={
 shadowstep:'{name} can’t be hit for {n}, until {name} {v:attacks|attack} or {v:gathers|gather} Mana.',
 haste:'{name} {v:acts|act} {x} times in each of the next {n}.',
 brace:'{name} {v:blocks|block} all damage this exchange, then half, a quarter and a quarter.',
 tailwind:'{name’s} blows hit harder for {n}.',
 reflect:'Spells cast at {name} bounce back for {n}.',
 torment:'Every move {foe} {fv:makes|make} costs {fobj} Health for {n}.',
 eclipse:'Blows that hit {name} turn into Mana for {n}.',
 compelled:'{foe} must repeat {fpos} last move next exchange.',
 heartprice:'{name’s} spells cost Health instead of Mana from now on.',
 lodestar:'A shield of {x} absorbs the next damage {name} {v:takes|take}.'
};
const EFFECT_ON_FOE=new Set(['torment','compelled']);   // placed on the foe, told from the caster's side
const ex=n=>n===1?gr('exchange1'):gr('exchanges').replace('{n}',n);
const r0=x=>Math.round(x);
// The most telling defence on a hit: what the defender's line should say.
function defence(by){for(const d of ['shadowstep','reflect','frozen','ward','tiredGuard','guard','brace','construct','lodestar'])if(by.includes(d))return d==='construct'||d==='lodestar'?'absorbed':d==='shadowstep'?'evaded':d==='ward'?'warded':d==='guard'?'guarded':d==='brace'?'braced':d==='reflect'?'reflected':d;return null;}
// The log line for each side's action in a resolved exchange, with its consequences in plain words: the attack and what
// stopped or let it through ("Lyra takes 14 damage"), and what a non-attack did ("for 3 exchanges", "regains 9 Mana").
//   before/after: plain state snapshots; r: the resolved exchange ({pair, round, channels, eventData}); names: [player, opponent].
export function resolvedLines(before,after,r,names=['the player','the opponent']){
 const ev=r.eventData??[],out=[null,null];
 for(const side of [0,1]){
  const id=r.pair[side],ch=r.channels?.[side],spell=id==='hold'||id==='release'?ch:id?.startsWith('bundle:')?null:id;
  const name=names[side],foe=names[1-side],F=line=>fill(line,name,foe,names.pronouns?.[side],names.pronouns?.[1-side]),parts=[];
  const L=(k,v={})=>F(Object.entries(v).reduce((s,[a,b])=>s.replaceAll('{'+a+'}',b),line(k)));
  const mine=ev.filter(e=>e.type==='hit'&&e.source===side&&!e.reflected);
  // Attacks: one sentence per kind of attack this side landed or lost, then the damage.
  const byId={};for(const e of mine)(byId[e.id]??=[]).push(e);
  const head=flavorLine(id,{channel:ch,round:r.round,names,side});
  let usedHead=false;
  for(const [aid,hits]of Object.entries(byId)){
   const dealt=hits.reduce((n,e)=>n+e.amount,0),def=hits.map(e=>defence(e.by)).find(Boolean);
   // Wildfire's embers (F5.9c) get through Guard and Ward, so a defended Release can still burn.
   const special=def&&(def!=='evaded'&&def!=='reflected'&&dealt>0&&ATTACK_LINES[aid]?.embers&&hits.length>1?attackLine(aid,'embers'):attackLine(aid,def)??(def==='tiredGuard'?attackLine(aid,'guarded'):null));
   const said=def?special??tx('defended.'+def,ATTACK_DEFENDED[def]).replaceAll('{noun}',noun(aid)):null;
   const own=aid===spell||aid==='strike'&&id?.startsWith('bundle:');
   if(said)parts.push(F(said));else if(own&&!usedHead&&head){parts.push(head);usedHead=true;}else if(!own)parts.push(L('hits',{noun:noun(aid)}));
   const back=ev.filter(e=>e.type==='hit'&&e.reflected&&e.source===1-side&&e.id===aid).reduce((n,e)=>n+e.amount,0);
   if(def==='reflected')parts.push(back>0?L('reflectedBack',{n:r0(back),noun:noun(aid)}):L('noDamage'));
   else parts.push(dealt>0?(hits.length>1?L('takesHits',{n:r0(dealt),hits:hits.length}):L('takes',{n:r0(dealt)})):L('noDamage'));
  }
  if(!usedHead&&head&&!Object.keys(byId).includes(spell)&&!(id?.startsWith('bundle:')&&byId.strike))parts.unshift(head);
  // Non-attacks: what changed for this side.
  const b=before.actors[side],a=after.actors[side];
  const reclaimed=ev.filter(e=>e.type==='reclaimed'&&e.side===side).reduce((n,e)=>n+e.amount,0);
  if(reclaimed>0)parts.push(L('regains',{n:r0(reclaimed)}));
  else if(id==='reclaim'||id?.includes('reclaim'))parts.push(L('noLooseMagic'));
  if(spell==='mend'&&!after.result)parts.push(a.hp>b.hp?L('heals',{n:r0(a.hp-b.hp)}):L('mendBreaks'));
  for(const m of ev.filter(e=>e.type==='moved'&&e.side===side)){const n=r0(m.amount);
   if(m.id==='extraction')parts.push(m.blocked?L('extractionBlocked'):n>0?L('extraction',{n}):L('extractionFull'));
   if(m.id==='seal')parts.push(m.blocked?L('sealBlocked'):n>0?L('seal',{n}):L('sealNothing'));
   if(m.id==='purify')parts.push(L('purify',{n}));}
  if(spell==='foresight'&&after.earlyCommit?.[1-side]>0)parts.push(L('commitFirst',{ex:ex(after.earlyCommit[1-side])}));
  for(const [k,words]of Object.entries(EFFECT_WORDS)){
   const holder=EFFECT_ON_FOE.has(k)?1-side:side,e1=after.actors[holder].effects?.[k],e0=before.actors[holder].effects?.[k];
   if(!e1||(e0&&e0.until===e1.until&&e0.from===e1.from))continue;
   if(LASTING_SPELL[k]!==spell)continue;
   const n=e1.until==null?null:e1.until-Math.max(e1.from,r.round)+1,x=k==='haste'?(after.actors[side].kit?.spells?.haste===3?gr('three'):gr('two')):k==='tailwind'?`+${r0(e1.value)}`:k==='lodestar'?r0(e1.value):'';
   parts.push(F(tx('effect.'+k,words).replace('{n}',n==null?gr('restOfFight'):ex(n)).replace('{x}',x)));
  }
  if(spell==='compel'&&!after.result){const took=isCompelled({...after,round:r.round+1},1-side);
   parts.length=0;parts.push(took?F(fl('compel.cast.0',FLAVOR.compel.cast[0])):F(fl('compel.shut',FLAVOR.compel.shut)));
   if(took)parts.push(r.actionNames?.[1-side]?L('repeatAgainAction',{action:r.actionNames[1-side]}):L('repeatAgain'));}
  if(isCompelled({...before,round:r.round},side)||r.committed?.[side]&&r.committed[side]!==id&&r.pair[1-side]==='compel')parts.unshift(L('compelledRepeat'));
  out[side]=parts.length?parts.join(tx('grammar.sentenceSep',' ')):null;
 }
 return out;
}
// A side compelled this exchange (Compel, F5.9b): its move is forced and shown in advance.
export const isCompelled=(state,side)=>{const e=state.actors[side].effects?.compelled;return !!e&&e.from<=state.round&&(e.until==null||e.until>=state.round);};
export const compelledLine=(action,{names=['the player','the opponent'],side=1}={})=>fill(fl('compel.forced',FLAVOR.compel.forced).replace('{action}',action),names[side],names[1-side],names.pronouns?.[side],names.pronouns?.[1-side]);
const LASTING_SPELL={shadowstep:'shadowstep',haste:'haste',brace:'brace',tailwind:'tailwind',reflect:'reflect',torment:'torment',eclipse:'eclipse',compelled:'compel',heartprice:'heartprice',lodestar:'lodestar'};
// Lines for what one resolved exchange finished, from plain snapshots of the state before and after it (no rules involved):
// a Mend heals or is broken, a tired Guard gives, lasting effects, Foresight and constructs end, a foretold Omen arrives,
// the rime thaws, and the fight ends (the finishing action's ko line, else ENDINGS).
export function finishLines(before,after,pair,round,names=['the player','the opponent']){
 const out=[],add=(line,side)=>{const l=fill(line,names[side],names[1-side],names.pronouns?.[side],names.pronouns?.[1-side]);if(l&&!out.includes(l))out.push(l);};
 const end=id=>fl(id+'.end',FLAVOR[id]?.end);
 const g=COMBAT_TUNING.guard;
 for(const side of [0,1]){
  const id=pair[side],b=before.actors[side],a=after.actors[side];
  if(g?.repeatLeak>0&&(id==='guard'||id?.startsWith('bundle:')&&id.includes('guard'))&&b.guardRound>0&&round-b.guardRound<=(g.lookback??1)&&pair[1-side]?.includes('strike'))add(fl('guard.tired',FLAVOR.guard.tired),side);
  for(const k of Object.keys(b.effects))if(!a.effects[k]&&LASTING[k])add(end(LASTING[k]),HELD_BY_FOE.has(k)?1-side:side);
  if(before.earlyCommit[side]>0&&!after.earlyCommit[side])add(end('foresight'),1-side);
  for(const c of b.constructs)if(!a.constructs.some(x=>x.id===c.id))add(end(c.id),side);
  if(b.omens.some(o=>o.due===round))add(end('omen'),side);
  if(id==='frozen'&&a.freezeUntil<=round)add(end('frozen'),side);
 }
 const r=after.result,ending=k=>tx('ending.'+k,ENDINGS[k]);
 if(r&&!before.result){
  const w=r.winner;
  if(w===undefined||w===null)add(ending('stalemate'),0);
  else{
   const id=pair[w],key=id==='hold'||id==='release'?before.actors[w].channel?.id:id?.startsWith('bundle:')&&id.includes('strike')?'strike':id;
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
 for(const [k,v]of Object.entries(BUNDLE_PART))t['bundle.'+k]=v;
 for(const [k,v]of Object.entries(LINES))t['line.'+k]=v;
 for(const [k,v]of Object.entries(ENDINGS))t['ending.'+k]=v;
 for(const [k,v]of Object.entries(DEFEAT))t['defeat.'+slug(k)]=v;
 for(const [k,v]of Object.entries(GRAMMAR))t['grammar.'+k]=v;
 t['grammar.sentenceSep']=' ';
 return t;
}
