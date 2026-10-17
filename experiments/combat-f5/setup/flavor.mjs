// What each action looks like, for the fight log and the telegraph. Subjectless on purpose: the log already says who acted,
// so one line serves "You" and "Opponent" alike. No numbers and no rules here (the action's description gives those).
//   cast:    the action as it happens (shown when it is committed and in the log; a list rotates by exchange)
//   finish:  how it ends or lands: impact for instant spells, fading for lasting ones, collapse for constructs
//   hold / release: a channel's held and released exchanges (the cast line is its first exchange)
// Style: docs/authoring/style.md (warm, specific, a little dry; no gore). Spells follow docs/spells-v2-list.md and content/world/spells.grim.
import {COMBAT_TUNING} from './roster.mjs';
export const FLAVOR={
 // Basics
 strike:{cast:['A quick step in and a jab with the wand hand, the way the Duelling Circle drills it.','A shoulder dropped, a fist following it: unglamorous and honest.','A lunge, wand held like a fencing foil and used like a cudgel.']},
 guard:{cast:['Feet planted, forearm up, chin tucked: the first thing every first-year learns.','A half-step back and both hands raised, ready for whatever comes.'],tired:'The guard has been held a beat too long; the arms are getting heavy, and blows start to slip through.'},
 reclaim:{cast:['A long breath in. The spent magic drifting about the room is coaxed back, a thread at a time.','Fingers curl, and the loose sparks of earlier spells come home like moths to a lamp.']},
 frozen:{cast:['Frost holds everything still. Somewhere under it, a heartbeat keeps patient time.'],finish:'The ice cracks, sighs and lets go.'},

 // Course spells and Ward
 flame:{cast:['Fire blooms at the fingertips: a candle at first, then something with opinions.','A cupped hand, a breath, and a fist of flame thrown overarm.'],finish:'The fire spends itself in a gust of heat and the smell of singed wool.'},
 foresight:{cast:['Eyes unfocus. For a moment the next few heartbeats are as plain as a timetable.'],finish:'The glimpse of what comes next fades back into the ordinary fog of the present.'},
 mend:{cast:['Warm hands pressed to the hurt, and the ache begins to sew itself shut.','A murmured recipe, and the torn places start drawing closed like a well-mended hem.'],finish:'The mending settles. Hearts take longer.'},
 glamour:{cast:['A smile that is slightly more charming than its owner, and a posture borrowed from someone braver.'],finish:'The crowd will remember liking it, and not quite why.'},
 haste:{cast:['Speed borrowed from hares and hawks floods the legs: everything else seems to wade.'],finish:'The borrowed speed runs out, leaving a strong wish for a long nap.'},
 shadowstep:{cast:['A step into one shadow and out of another, a little to the left of where anyone was looking.'],finish:'The shadows let go, not entirely willingly.'},
 ward:{cast:['A pale shell unfolds like a soap bubble that has decided to be brave.','Two fingers trace a circle, and the air inside it goes quiet and firm.'],finish:'The shell thins to nothing.'},

 // Hidden courses
 animate:{cast:['A chair leg, a teapot and a coil of wire stand up and look around for someone to hit.'],finish:'The made thing clatters apart into honest furniture again.'},
 starlight:{cast:['A named star is called down, its light gathering in an open palm like water in a cupped hand.'],hold:'The starlight brightens, and the shadows in the room shuffle to the walls.',release:'The gathered light leaves the hand as a clean, silver beam.'},
 seal:{cast:['A sharp twist of the wrist, like locking a door and pocketing the key.'],finish:'The loose magic in the air is shut away, every last spark of it.'},

 // Peer capstones
 wildfire:{cast:['Fire let off its leash: it runs along the floorboards, delighted with itself.'],hold:'The blaze is kept running, licking at both ends of the duel and at the caster’s sleeves.',release:'All of it at once: the wildfire breaks like a wave across the floor.'},
 heartwood:{cast:['Roots crack the flagstones and a sapling shoulders up, already leaning protectively.'],finish:'The little tree folds back into the floor, leaving a ring of moss and good intentions.'},
 omen:{cast:['A prophecy is spoken aloud, slowly, the way you read out a sentence nobody wants to hear.'],finish:'The foretold moment arrives exactly on time.'},
 sleight:{cast:['A friendly clap on the shoulder, and a purse changes owners on the way past.'],finish:'Somewhere, coins clink in the wrong pocket.'},
 contraption:{cast:['Springs, a kettle and something that used to be a clock assemble themselves into a machine that hums.'],finish:'The contraption shudders, whines and bursts in a shower of sparks and cogs.'},
 hoarfrost:{cast:['Breath turns white, and a lance of winter frost leaps across the room.'],finish:'Rime feathers the floor where the cold passed.'},
 candour:{cast:['A gentle question, asked in exactly the tone that makes people answer it.'],finish:'Something true slips out before anyone can stop it.'},

 // Club and job spells
 brace:{cast:['Weight down, heels dug in, the whole body set like a post in hard ground.'],finish:'The stance loosens; the stubbornness takes a while longer.'},
 quickquill:{cast:['A quill scratches across a notebook by itself, faster than anyone can talk.'],finish:'The page is full, word for word, and slightly smug about it.'},
 bramble:{cast:['Thorny vines shoot up between the flagstones and start looking for ankles.'],finish:'The brambles wither back into a few brown twigs.'},
 index:{cast:['Fingers flick through an invisible card catalogue, looking for exactly the right page.'],finish:'The right page is found, and of no use whatsoever in a fight.'},
 rapport:{cast:['A grin at the audience, a joke at one’s own expense, and a round bought for the nearest table.'],finish:'The crowd is firmly on one side now, and has the drinks to prove it.'},
 purify:{cast:['Something is drawn out of the body, bitter and bright, and stoppered into magic.'],finish:'The cure had to come from somewhere; it leaves a tiredness behind.'},
 tailwind:{cast:['A breeze from nowhere fills the coat like a sail, pushing every step forward.'],finish:'The wind drops, and the coat hangs still.'},

 // Hidden pool
 rime:{cast:['A sliver of winter is sewn into a collar, quietly, for later.'],finish:'The winter in the collar wakes and takes hold.'},
 reflect:{cast:['The air turns glassy, and a second, mirrored duel flickers into being just behind it.'],finish:'The mirror folds away like a closing book.'},
 moonwell:{cast:['A pool of moonlight opens at the feet, too deep to see the bottom of.'],hold:'The moonwell fills, silver lapping at its edges.',release:'The moonwell is drunk in a single draught, cold and bright.'},
 lodestar:{cast:['A small steady star is set turning overhead, bending loose force towards itself.'],hold:'The lodestar turns faster, gathering pull.',release:'The lodestar settles close, a bright shield that drinks the next blows.'},
 toll:{cast:['A single bell note, from no bell anyone can see.']},

 // Forbidden pool
 torment:{cast:['A spiteful little curse is muttered and tied to every move the opponent will make.'],finish:'The curse unpicks itself, its spite used up.'},
 extraction:{cast:['A hand closes on empty air and pulls, and someone else’s magic comes away with it.'],finish:'The stolen magic settles in, cold and not quite at home.'},
 siphon:{cast:['A thin dark thread is spun between the duellists, and it starts to drink.'],hold:'The thread drinks again, and the caster’s colour comes back a little.',release:'The thread is snapped, and everything it drank is swallowed down.'},
 compel:{cast:['A voice that is not quite a voice says: again. And the opponent’s body listens.'],finish:'The compulsion lets go, leaving the opponent shaking out their hands.'},
 eclipse:{cast:['A dark disc slides across the caster’s light, hungry for whatever hurts it.'],finish:'The eclipse passes, full of borrowed power.'},
 heartprice:{cast:['A bargain is struck with the heart instead of the wand. From now on, every spell is paid in breath.'],finish:'The bargain is over, and the heart is relieved to have it so.'}
};
// The line to show for an action: a channel's hold/release, a Haste bundle as its parts, else the cast line (rotating by exchange).
export function flavorLine(id,{channel=null,round=1}={}){
 const pick=x=>Array.isArray(x)?x[(round-1)%x.length]:x;
 if(id==='hold'||id==='release')return FLAVOR[channel]?.[id]??null;
 if(id?.startsWith('bundle:'))return id.slice(7).split('+').map(p=>pick(FLAVOR[p]?.cast)).filter(Boolean).join(' Then: ');
 return pick(FLAVOR[id]?.cast)??null;
}
// Finish lines for one resolved exchange, from plain snapshots of the state before and after it (no rules involved):
// instant spells land; lasting effects, Foresight and constructs end; a foretold Omen arrives; a Mend that healed settles;
// a Guard raised again too soon tires (Guard fatigue).
const LASTING={ward:'ward',brace:'brace',haste:'haste',shadowstep:'shadowstep',tailwind:'tailwind',reflect:'reflect',torment:'torment',eclipse:'eclipse',compelled:'compel'};
const LATER=new Set(['animate','heartwood','bramble','contraption','omen','mend','rime','foresight','heartprice','starlight','wildfire','moonwell','lodestar','siphon',...Object.values(LASTING)]);
export function finishLines(before,after,pair,round){
 const out=new Set();
 for(const side of [0,1]){
  const id=pair[side],b=before.actors[side],a=after.actors[side];
  if(FLAVOR[id]?.finish&&!LATER.has(id))out.add(FLAVOR[id].finish);
  if(id==='mend'&&a.hp>b.hp)out.add(FLAVOR.mend.finish);
  const g=COMBAT_TUNING.guard;if(g?.repeatLeak>0&&(id==='guard'||id?.startsWith('bundle:')&&id.includes('guard'))&&b.guardRound>0&&round-b.guardRound<=(g.lookback??1)&&pair[1-side]?.includes('strike'))out.add(FLAVOR.guard.tired); // only felt against a Strike
  for(const k of Object.keys(b.effects))if(!a.effects[k]&&LASTING[k])out.add(FLAVOR[LASTING[k]].finish);
  if(before.earlyCommit[side]>0&&!after.earlyCommit[side])out.add(FLAVOR.foresight.finish);
  for(const c of b.constructs)if(!a.constructs.some(x=>x.id===c.id))out.add(FLAVOR[c.id]?.finish);
  if(b.omens.some(o=>o.due===round))out.add(FLAVOR.omen.finish);
 }
 out.delete(undefined);
 return [...out];
}
