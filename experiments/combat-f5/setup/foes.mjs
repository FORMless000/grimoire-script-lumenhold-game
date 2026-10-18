// Who the player fights (F5.9): AI personas, the foes the main game's cards name, the pools generic foes are drawn from,
// and the decision for every current combat card. EVENTS.md explains each choice; tools/event-coverage.mjs checks that
// every `challenge combat` / `challenge duel` in content/ has an entry here.
// A foe is {name, loadout | pool, persona?, context?, start?}:
//   name     how the fight text names it (fighterNames); the card can override it
//   loadout  a class (LOADOUTS), a character (NAMED_LOADOUTS) or a special foe (SPECIAL_LOADOUTS); pool: one of POOLS,
//            picked by the encounter seed
//   persona  overrides the loadout's persona (PERSONAS)
//   context  the fight's stakes (CONTEXTS); default from the card's kind (combat → real_conflict, duel → practice_duel)
//   start    {hp, mana} shares the foe starts with (createState's opponentStart, no condition floors), for a foe hurt before
//            the fight; unused so far: a card's rung and odds word already price circumstances, so don't count them twice
import {LOADOUTS,NAMED_LOADOUTS,SPECIAL_LOADOUTS,scaleToMean} from './roster.mjs';

// Personas: points added to an action's value when the AI chooses (about 4 points = 1 HP of lead), so it favours these
// even when slightly worse, never past its maxRegret. Applied by every preset but engine (AI_PRESETS), scaled by its tiltScale.
// A channel's Hold and Release can be favoured on their own as `<spell>_hold` / `<spell>_release`.
export const PERSONAS={
 // Classes (F5.9b: about 1.5× F5.9's)
 Duellist:{flame:9,ward:5},
 Scholar:{foresight:12,starlight:9,seal:6},
 Healer:{mend:12,bramble:6,guard:3},
 Illusionist:{shadowstep:9,reflect:9},
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
 'Shadow stag':{gore:12,shadowstep:6,brace:6}
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
 shadow_stag:{name:'the shadow stag',loadout:'Shadow stag',context:'real_conflict'}
};

// Every current combat card, by event/option. play: a minigame fight against `foe` (several foes: matched to the card's
// random text variant, in order); convert: not a fight, the challenge line becomes this (same rung and odds). Level: challengeDC → foeLevel.
// `setup` lists extra fight setup the card implies. EVENTS.md gives the reasons.
export const EVENTS={
 'spring_tournament/right':{play:'tournament_entrant'},
 'spring_tournament_circle/left':{play:'tournament_entrant'},
 'spring_tournament_circle/right':{play:'tournament_entrant'},
 'tournament_semifinal/left':{play:'tournament_unbeaten'},
 'tournament_final/left':{play:'lyra',context:'public_duel'},
 'hs_tunnel/fight':{play:'man_in_grey',setup:'two challenges: with Kael (master-) and alone (master- unlikely, +3 levels); the odds word already prices Kael’s help, so no extra handicap'},
 'ilse_grey_returns/left':{play:'man_in_grey',setup:'his hand on Ilse is in the rung (journeyman likely): no extra handicap'},
 'rival_contest/left':{play:['tamsin','thornwick_illusionist'],setup:'Tamsin if met, else the Thornwick illusionist. With thornwick_secrets (adept likely): the foe commits first for 3 exchanges (as if under your Foresight) at the even level, instead of the likely −3 levels'},
 'rival_last_match/left':{play:['tamsin','thornwick_final_year'],context:'practice_duel',setup:'Tamsin if met, else a Thornwick final-year'},
 'curse_cure_2/right':{play:'shadow_stag'},
 'pyro_lyra_spar/right':{play:'lyra',context:'practice_duel'},
 'duel_practice_bout/left':{play:'quick_fourth_year',setup:'Hold your ground: the fourth-year leads every exchange (firstLeader 1)'},
 'duel_practice_bout/right':{play:'quick_fourth_year',setup:'Go on the attack: you lead the first exchange (firstLeader 0)'},
 'duel_bram_hazing/right':{play:'bram',context:'public_duel'},
 'y3_last_duel/left':{play:'lyra',context:'practice_duel'},
 'xchg_farewell/right':{play:'thornwick_sketcher'},
 'tavern_brawl/right':{convert:'challenge feat apprentice+ wild'},
 'life_pixies/left':{convert:'challenge feat apprentice- wild'},
 'life_rival_academy/right':{play:'thornwick_best'},
 'midnight_boathouse_ring/left':{play:'ring_opener'},
 'bram_duel/right':{play:'bram',context:'public_duel'},
 'courtyard_seasonal_game/left':{convert:'challenge feat apprentice wild'},
 'lyra_date_dawn_duel/left':{play:'lyra',context:'practice_duel'},
 'duel_hall_gallery/left':{play:'peer',context:'practice_duel'},
 'flight_field_pickup_race/left':{convert:'challenge feat journeyman+ wild'},
 'newt_high_table/health':{convert:'challenge feat adept- wild'},
 'ring_on_yourself/left':{play:'ring_opener'},
 'ring_on_yourself/right':{play:'ring_opener'},
 'ring_bout_2/left':{play:['ring_rower','ring_villager','ring_scarf']},
 'ring_bout_3/left':{play:['ring_duellist','ring_farrier','ring_hood']},
 'ring_bout_4/left':{play:['ring_champion','ring_bookmaker','ring_sailor']},
 'gig_newt_brawl/left':{convert:'challenge feat apprentice+'},
 'duelling_captain_challenge/left':{play:'visiting_champion'},
 'slice_candle_flame/right':{play:'lyra',context:'practice_duel'},
 'slice_frost_duel/left':{play:'kael',context:'practice_duel'},
 'duel_first_practice/right':{play:'club_partner'},
 'duel_fixture/left':{play:'thornwick_duellist'},
 'lake_skimming/left':{convert:'challenge feat apprentice wild'}
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

// Every loadout a foe names must exist (checked by tools/event-coverage.mjs).
export const foeLoadouts=()=>Object.values(FOES).flatMap(f=>f.pool?POOLS[f.pool]:[f.loadout]).filter(l=>!l.startsWith('('));
export const knownLoadout=l=>!!(LOADOUTS[l]??NAMED_LOADOUTS[l]??SPECIAL_LOADOUTS[l]);
