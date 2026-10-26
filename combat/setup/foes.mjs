// Who the player fights (F5.9): AI personas, the foes the main game's cards name, the pools generic foes are drawn from,
// and the decision for every current combat card. EVENTS.md explains each choice; tools/event-coverage.mjs checks that
// every `challenge combat` / `challenge duel` in content/ has an entry here.
// A foe is {name, loadout | pool, persona?, context?, start?, pronouns?}:
//   name     how the fight text names it (fighterNames); the card can override it
//   loadout  a class (LOADOUTS), a character (NAMED_LOADOUTS) or a special foe (SPECIAL_LOADOUTS); pool: one of POOLS,
//            picked by the encounter seed
//   persona  overrides the loadout's persona (PERSONAS)
//   context  the fight's stakes (CONTEXTS); default from the card's kind (combat → real_conflict, duel → practice_duel)
//   start    {hp, mana} shares the foe starts with (createState's opponentStart, no condition floors), for a foe hurt before
//            the fight; unused so far: a card's rung and odds word already price circumstances, so don't count them twice
//   pronouns how the fight text refers to it when it isn't a character (a creature is 'it', anyone else 'they' by default)
import {LOADOUTS,NAMED_LOADOUTS,SPECIAL_LOADOUTS,scaleToMean} from './roster.mjs';

// Personas: points added to an action's value when the AI chooses (about 4 points = 1 HP of lead), so it favours these
// even when slightly worse, never past its maxRegret. Applied by every preset but engine (AI_PRESETS), scaled by its tiltScale.
// A channel's Hold and Release can be favoured on their own as `<spell>_hold` / `<spell>_release`.
export const PERSONAS={
 // Classes (F5.9b: about 1.5× F5.9's)
 Duellist:{flame:9,ward:5},
 Scholar:{foresight:12,omen:9,starlight:6,seal:6},   // feedback 2026-10-24: Omen, its stand-in capstone; Starlight eased (was 9)
 Healer:{mend:12,bramble:6,guard:3},
 Illusionist:{shadowstep:9,reflect:9,hoarfrost:6},   // feedback 2026-10-24: Hoarfrost, its stand-in capstone
 Brawler:{strike:9,tailwind:9,haste:6},
 Prefect:{brace:9,guard:6,ward:5},
 Showman:{haste:9,tailwind:6,flame:3},
 'Underground tough':{strike:6,extraction:9,torment:6},
 'Hollow adept':{siphon:9,eclipse:9,seal:6},
 Sailor:{tailwind:9,haste:6,brace:6},
 // Characters: their unique spell pulls hardest (their canon leanings: content/world/cast.grim)
 Lyra:{wildfire:16,wildfire_hold:12,flame:12},   // she lets the wildfire build before she releases it
 Tobias:{heartwood:16,bramble:9,mend:6},
 Seraphine:{omen:16,foresight:9},
 Corvin:{shadowstep:12,seal:6},
 Mir:{contraption:16,animate:9},
 Kael:{hoarfrost:16,ward:6},
 Nessa:{foresight:8,ward:6},
 Bram:{brace:14,strike:6,guard:3},
 Ilse:{rime:14,ward:6},
 Tamsin:{reflect:12,shadowstep:6},
 'The man in grey':{compel:16,eclipse:9,rime:6},
 Grisk:{extraction:14,compel:6},
 Thorne:{flame:12,brace:6},
 Isolde:{seal:14,foresight:6},
 Vey:{reflect:10,shadowstep:6},
 Brask:{haste:14,tailwind:6},
 Marisol:{moonwell:14},
 Amaranth:{mend:14,purify:6},
 Maud:{mend:12,bramble:9},
 Pell:{purify:12},
 Mabel:{ward:6,mend:6},
 Grimsby:{foresight:8},
 // Special foes
 // The Whisperwood (world expansion 1; F5.11: every move is the creature's own spell). A delayed blow's Hold and Release
 // no longer exist: its cast is the whole move.
 'Practice mannequin':{flame:10},
 'Bramble ferret':{skitter:10,nip:10,filch:8,burrow:4},
 Bristleback:{maul:12,roar:6,hide:6,strike:4},
 'Stag beetle':{charge:12,pinch:8,beetle_flame:6,carapace:6},
 'Grumpy oak':{root:10,bough:10,acorns:6,bark:6},
 'Elder oak':{slow_fall:10,root:8,thicket:8,acorns:6,bark:6},
 'Spiderling swarm':{swarm:12,threads:8,skitter:8,burrow:4},
 'Shadow stag':{gore:12,fade:8,brace:6,tailwind:4},
 'The Spinner':{web:10,venom:10,the_long_wait:10,brood:8,carapace:6},
 'The Spinner, weakened':{web:10,venom:10,the_long_wait:10,brood:8,carapace:6},
 Thornwitch:{siphon:12,siphon_hold:6,bramble:8,torment:8,ward:4},
 'Masked circle':{compel:10,torment:8,flame:6,shadowstep:6,eclipse:6},
 'The Outcast':{heartprice:8,compel:10,siphon:8,eclipse:8,extraction:8,torment:6}
};
export const personaOf=loadout=>PERSONAS[loadout]??{};

// Pools of classes for generic foes, by archetype.
export const POOLS={
 student:['Duellist','Prefect','Brawler','Scholar','Showman','Healer','Illusionist'],   // academy duellists: tournament, Circle, practice
 thornwick:['Illusionist','Showman','Duellist'],                                         // the rival school (its lore: content/world/lore/soft/places.grim)
 champion:['Duellist','Prefect','Scholar','Illusionist','Hollow adept'],                 // visiting champions, expert opposition
 ring:['Brawler','Underground tough','Sailor','Showman']                                 // the boathouse ring's first bout
};

export const FOES={
 // Academy duellists
 tournament_entrant:{name:'your opponent',pool:'student',context:'public_duel'},
 tournament_unbeaten:{name:'the unbeaten fourth-year',loadout:'Duellist',persona:{flame:9,haste:6,strike:3},context:'public_duel'},
 quick_fourth_year:{name:'the fourth-year',loadout:'Duellist',persona:{flame:6,strike:6,haste:9},context:'practice_duel'},
 club_partner:{name:'your sparring partner',pool:'student',context:'practice_duel'},
 visiting_champion:{name:'the visiting champion',pool:'champion',context:'public_duel'},
 // Thornwick
 thornwick_best:{name:'Thornwick’s best',pool:'thornwick',context:'public_duel'},
 thornwick_duellist:{name:'the Thornwick duellist',pool:'thornwick',context:'public_duel'},
 thornwick_illusionist:{name:'the Thornwick illusionist',loadout:'Illusionist',context:'public_duel'},
 thornwick_sketcher:{name:'the boy with the sketchbook',loadout:'Illusionist',persona:{shadowstep:12,reflect:6},context:'practice_duel'},
 thornwick_final_year:{name:'the Thornwick final-year',pool:'thornwick',context:'practice_duel'},
 // The boathouse ring
 ring_opener:{name:'your opponent',pool:'ring',context:'ring_bout'},
 ring_rower:{name:'the rower',loadout:'Brawler',persona:{strike:9,guard:6},context:'ring_bout'},
 ring_villager:{name:'the villager',loadout:'Underground tough',persona:{strike:9,extraction:6},context:'ring_bout'},
 ring_scarf:{name:'the student in the scarf',loadout:'Illusionist',context:'ring_bout'},
 ring_duellist:{name:'the club duellist',loadout:'Duellist',context:'ring_bout'},
 ring_farrier:{name:'the farrier’s apprentice',loadout:'Brawler',persona:{strike:12,brace:9},context:'ring_bout'},
 ring_hood:{name:'the hooded fighter',loadout:'Hollow adept',context:'ring_bout'},
 ring_champion:{name:'the ring’s champion',loadout:'Prefect',persona:{brace:9,guard:9},context:'ring_bout'},
 ring_bookmaker:{name:'the bookmaker',loadout:'Underground tough',persona:{extraction:9,torment:9},context:'ring_bout'},
 ring_sailor:{name:'the sailor',loadout:'Sailor',context:'ring_bout'},
 // Characters: the main game names them (a character's short name); their skills from namedFoeSkills below.
 lyra:{loadout:'Lyra'},bram:{loadout:'Bram'},kael:{loadout:'Kael'},tamsin:{loadout:'Tamsin'},
 peer:{loadout:'(the peer present)'},   // duel_hall_gallery: whichever peer the card cast as `here`
 // Danger
 man_in_grey:{name:'the man in grey',loadout:'The man in grey',context:'real_conflict'},
 shadow_stag:{name:'the shadow stag',loadout:'Shadow stag',context:'real_conflict'},
 // The intro's lesson (world expansion 1): a straw mannequin Thorne works with a wand. Nothing is at stake.
 practice_mannequin:{name:'the practice mannequin',loadout:'Practice mannequin',context:'rehearsal'},
 // The Whisperwood (world expansion 1)
 bramble_ferret:{name:'the bramble ferret',loadout:'Bramble ferret',context:'real_conflict'},
 bristleback:{name:'the bristleback',loadout:'Bristleback',context:'real_conflict'},
 stag_beetle:{name:'the stag beetle',loadout:'Stag beetle',context:'real_conflict'},
 grumpy_oak:{name:'the grumpy oak',loadout:'Grumpy oak',context:'real_conflict'},
 elder_oak:{name:'the elder oak',loadout:'Elder oak',context:'real_conflict'},
 spiderling_swarm:{name:'the spiderling swarm',loadout:'Spiderling swarm',context:'real_conflict'},
 the_spinner:{name:'the Spinner',loadout:'The Spinner',context:'real_conflict',pronouns:'she'},
 the_spinner_weak:{name:'the Spinner',loadout:'The Spinner, weakened',context:'real_conflict',pronouns:'she'},
 thornwitch:{name:'the thornwitch',loadout:'Thornwitch',context:'real_conflict',pronouns:'she'},
 masked_circle:{name:'the masked circle',loadout:'Masked circle',context:'real_conflict'},
 the_outcast:{name:'the Outcast',loadout:'The Outcast',context:'practice_duel',pronouns:'he'}
};

// Every current combat card, by event/option. play: a minigame fight against `foe` (several foes: matched to the card's
// random text variant, in order). The seven cards that weren't fights (races, sports, brawls you defuse) became `challenge feat`
// in content (2026-10-18, EVENTS.md §6). Level: the engine's DC → foeLevel.
// `setup` lists extra fight setup the card implies. EVENTS.md gives the reasons.
// Every played card states its audience (F5.9c), since it's the scene's, not the foe's: `observers` (a crowd whose Renown
// counts: Glamour and Rapport pay out) and `witnesses` (someone from the academy sees it, so a forbidden cast is reported;
// an audience always is one). A list gives one value per challenge on the card, in source order. `context` (the rebates)
// comes from the card, else the foe; fightSetting() resolves all three.
// Fight setup the card implies, read by the main game's bridge (src/combat.js); a list gives one value per challenge:
//   firstLeader      0: the player leads the first exchange, 1: the foe does (createState's firstLeader)
//   foeCommitsFirst  n: the foe commits its move first, visibly, for n exchanges (as under the player's Foresight)
//   nature           the odds word the foe's level uses instead of the card's (the setup already prices the circumstance)
//   script           (a lesson) the foe's first moves, one per exchange, played as written when legal; 'idle' stands still
//                    (src/combat.js). The lesson's tutorial keys are one coach mark per exchange, the last staying up.
//   loop             (a lesson) the drill the foe repeats after its script, one move per exchange, so it never searches. It
//                    sees a committed Impulse and Parries it in place of a drilled Strike; a drilled spell it can't afford
//                    is a Strike, a Refocus with no flux a Parry (feedback 2026-10-25: no stalemate, Refocus that pays).
export const EVENTS={
 'spring_tournament/right':{play:'tournament_entrant',observers:true,witnesses:true},
 'spring_tournament_circle/left':{play:'tournament_entrant',observers:true,witnesses:true},
 'spring_tournament_circle/right':{play:'tournament_entrant',observers:true,witnesses:true},
 'tournament_semifinal/left':{play:'tournament_unbeaten',observers:true,witnesses:true},
 'tournament_final/left':{play:'lyra',context:'public_duel',observers:true,witnesses:true},
 'hs_tunnel/fight':{play:'man_in_grey',setup:'two challenges at master- unlikely: with Kael (`with kael`: his Hoarfrost every few exchanges, 2026-10-25) and alone',observers:false,witnesses:[true,false]},
 'ilse_grey_returns/left':{play:'man_in_grey',setup:'his hand on Ilse is in the rung (journeyman likely): no extra handicap',observers:false,witnesses:true},
 'rival_contest/left':{play:['tamsin','thornwick_illusionist'],foeCommitsFirst:[3,0],nature:['even',null],setup:'Tamsin if met, else the Thornwick illusionist. With thornwick_secrets (adept likely): the foe commits first for 3 exchanges (as if under your Foresight) at the even level, instead of the likely −3 levels',context:'public_duel',observers:true,witnesses:true},
 'rival_last_match/left':{play:['tamsin','thornwick_final_year'],context:'practice_duel',setup:'Tamsin if met, else a Thornwick final-year',observers:true,witnesses:true},
 'curse_cure_2/right':{play:'shadow_stag',observers:false,witnesses:false},
 'pyro_lyra_spar/right':{play:'lyra',context:'practice_duel',observers:true,witnesses:true},
 'intro_practice_circle/right':{play:'practice_mannequin',context:'rehearsal',observers:false,witnesses:false,foeCommitsFirst:5,script:['idle','strike','flame','guard','reclaim'],loop:['flame','reclaim','strike'],tutorial:['idle','strike','spell','guard','reclaim','commit','finish']},   // the intro's lesson (feedback 2026-10-20): five telegraphed moves, then the usual alternation, Thorne coaching each exchange
 'item_ashwood_lyra/right':{play:'lyra',context:'practice_duel',observers:true,witnesses:true},   // world expansion 1: ashwood against Vaneshade
 // World expansion 1: the Whisperwood delve. Alone in the wood: nobody watches, nobody tells.
 'ww1_bramble_ferret/right':{play:'bramble_ferret',observers:false,witnesses:false},
 'ww1_bristleback/right':{play:'bristleback',observers:false,witnesses:false},
 'ww2_grumpy_oak_fight/right':{play:'grumpy_oak',observers:false,witnesses:false},
 'ww2_stag_beetle/right':{play:'stag_beetle',observers:false,witnesses:false},
 'ww2_thornwitch/up':{play:'thornwitch',observers:false,witnesses:false},
 'ww2_thornwitch_fight/right':{play:'thornwitch',observers:false,witnesses:false},
 'ww3_shadow_stag_fight/right':{play:'shadow_stag',observers:false,witnesses:false},
 'ww3_elder_oak_fight/right':{play:'elder_oak',observers:false,witnesses:false},
 'ww3_masked_circle/up':{play:'masked_circle',observers:false,witnesses:false},
 'ww3_spiderlings/right':{play:'spiderling_swarm',observers:false,witnesses:false},
 'ww_spinner_fight/right':{play:'the_spinner',observers:false,witnesses:false},
 'ww_spinner_fight_weak/right':{play:'the_spinner_weak',nature:['even'],observers:false,witnesses:false},   // F5.11: she's weakened by starting hurt (her loadout's start), not by a lower level
 'ww_outcast_fight/right':{play:'the_outcast',context:'practice_duel',stakes:'none',observers:false,witnesses:false},   // nothing at stake: "Walk away" settles at no cost
 'duel_practice_bout/left':{play:'quick_fourth_year',firstLeader:1,setup:'Hold your ground: the fourth-year leads every exchange (firstLeader 1)',observers:false,witnesses:true},
 'duel_practice_bout/right':{play:'quick_fourth_year',firstLeader:0,setup:'Go on the attack: you lead the first exchange (firstLeader 0)',observers:false,witnesses:true},
 'duel_bram_hazing/right':{play:'bram',context:'public_duel',observers:true,witnesses:true},
 'y3_last_duel/left':{play:'lyra',context:'practice_duel',observers:false,witnesses:true},
 'xchg_farewell/right':{play:'thornwick_sketcher',observers:false,witnesses:true},
 'life_rival_academy/right':{play:'thornwick_best',observers:true,witnesses:true},
 'midnight_boathouse_ring/left':{play:'ring_opener',observers:true,witnesses:true},
 'bram_duel/right':{play:'bram',context:'public_duel',observers:true,witnesses:true},
 'bram_rematch/right':{play:'bram',context:'public_duel',observers:true,witnesses:true},   // world expansion 1: the rivalry sets
 'lyra_glove_thrown/right':{play:'lyra',context:'public_duel',observers:true,witnesses:true},
 'lyra_date_dawn_duel/left':{play:'lyra',context:'practice_duel',observers:false,witnesses:true},
 'duel_hall_gallery/left':{play:'peer',context:'practice_duel',observers:false,witnesses:true},
 'ring_on_yourself/left':{play:'ring_opener',observers:true,witnesses:true},
 'ring_on_yourself/right':{play:'ring_opener',observers:true,witnesses:true},
 'ring_bout_2/left':{play:['ring_rower','ring_villager','ring_scarf'],observers:true,witnesses:true},
 'ring_bout_3/left':{play:['ring_duellist','ring_farrier','ring_hood'],observers:true,witnesses:true},
 'ring_bout_4/left':{play:['ring_champion','ring_bookmaker','ring_sailor'],observers:true,witnesses:true},
 'duelling_captain_challenge/left':{play:'visiting_champion',observers:true,witnesses:true},
 'slice_candle_flame/right':{play:'lyra',context:'practice_duel',observers:false,witnesses:true},
 'slice_frost_duel/left':{play:'kael',context:'practice_duel',observers:true,witnesses:true},
 'duel_first_practice/right':{play:'club_partner',observers:false,witnesses:true},
 'duel_fixture/left':{play:'thornwick_duellist',observers:true,witnesses:true},
};

// A foe's level is the card's own challenge level (F5.9b): the DC the stub would roll against, computed as the main engine's
// ladderOdds does: the rung (dc_tiers) or a character's stat, ± 4 per rung (rungStep), pulled toward the expected skill
// E(turn) by the drift (story none, milestone and crisis low, otherwise high, or the card's own word). A class's mean skill
// is its level, so a foe at level DC is the opponent the rung describes. The odds word moves the level by the measured
// fight odds instead of the stub's: in F5.9 the higher side wins 69% at +5 levels and 91% at +10, so likely (70%) is −5
// levels and sure (90%) −10. The luck word (steady, wild) changes nothing: a fight has its own variance.
export const DRIFT={none:0,low:.15,mid:.3,high:.5};
export const NATURE_LEVELS={certain:-15,sure:-10,likely:-5,even:0,unlikely:5,slim:8,long_shot:12,freak:20};
export const defaultDrift=cardClass=>cardClass==='story'?'none':['milestone','crisis'].includes(cardClass)?'low':'high';
// {base: the rung's DC or the character's stat, rungs: ±n, drift: word, expected: E(turn)} → the DC.
export function challengeDC({base,rungs=0,drift='high',expected,rungStep=4}){const b=base+rungs*rungStep;return b+(DRIFT[drift]??0)*(expected-b);}
export function foeLevel({dc,nature='even'}){return Math.max(1,Math.min(100,Math.round(dc+(NATURE_LEVELS[nature]??0))));}
// A character named by `vs npc.stat ±n` keeps their shape: their current skills (canon × the main game's npc_growth),
// scaled to a mean skill of the foe's level (scaleToMean, as generateLoadout does), so the card's challenge level is their
// strength, as it is a class's. `stat` stays in the signature for the card's record; F5.9b set that stat to the level,
// which left a character about 15 levels weaker than the card's DC.
export const namedFoeSkills=(skills,stat,level)=>scaleToMean(skills,level);

// A played card's fight setting: {context, observers, witnesses} for its i-th challenge and the foe chosen.
export function fightSetting(key,i=0,foe){
 const e=EVENTS[key];if(!e?.play)throw Error('No played fight for '+key);
 const at=v=>Array.isArray(v)?v[i]:v,f=FOES[foe??[e.play].flat()[0]];
 return {context:at(e.context)??f?.context,observers:at(e.observers),witnesses:at(e.witnesses)};
}

// Every loadout a foe names must exist (checked by tools/event-coverage.mjs).
export const foeLoadouts=()=>Object.values(FOES).flatMap(f=>f.pool?POOLS[f.pool]:[f.loadout]).filter(l=>!l.startsWith('('));
export const knownLoadout=l=>!!(LOADOUTS[l]??NAMED_LOADOUTS[l]??SPECIAL_LOADOUTS[l]);
