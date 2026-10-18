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
import {LOADOUTS,NAMED_LOADOUTS,SPECIAL_LOADOUTS} from './roster.mjs';

// Personas: points added to an action's value when the AI chooses (about 4 points = 1 HP of lead), so it favours these
// even when slightly worse, never past its maxRegret. Applied by the medium and easy presets (AI_PRESETS), not by hard.
export const PERSONAS={
 // Classes
 Duellist:{flame:6,ward:3},
 Scholar:{foresight:8,starlight:6,seal:4},
 Healer:{mend:8,bramble:4,guard:2},
 Illusionist:{shadowstep:6,reflect:6},
 Brawler:{strike:6,tailwind:6,haste:4},
 Prefect:{brace:6,guard:4,ward:3},
 Showman:{haste:6,tailwind:4,flame:2},
 'Underground tough':{strike:4,extraction:6,torment:4},
 'Hollow adept':{siphon:6,eclipse:6,seal:4},
 Sailor:{tailwind:6,haste:4,brace:4},
 // Characters (their canon leanings: content/world/cast.grim)
 Lyra:{flame:8,wildfire:8},
 Tobias:{heartwood:8,bramble:6,mend:4},
 Seraphine:{omen:8,foresight:6},
 Corvin:{shadowstep:6,seal:4},
 Mir:{contraption:8,animate:6},
 Kael:{hoarfrost:8,ward:4},
 Nessa:{foresight:4,ward:4},
 Bram:{brace:8,strike:4,guard:2},
 Ilse:{rime:8,ward:4},
 Tamsin:{reflect:6,shadowstep:4},
 'The man in grey':{compel:8,eclipse:6,rime:4},
 Grisk:{extraction:8,compel:4},
 Thorne:{flame:6,brace:4},
 // Special foes
 'Shadow stag':{gore:6,shadowstep:4,brace:4}
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
 tournament_unbeaten:{name:'the unbeaten fourth-year',loadout:'Duellist',persona:{flame:6,haste:4,strike:2},context:'public_duel'},
 quick_fourth_year:{name:'the fourth-year',loadout:'Duellist',persona:{flame:4,strike:4,haste:6},context:'practice_duel'},
 club_partner:{name:'your sparring partner',pool:'student',context:'practice_duel'},
 visiting_champion:{name:'the visiting champion',pool:'champion',context:'public_duel'},
 // Thornwick
 thornwick_best:{name:'Thornwick’s best',pool:'thornwick',context:'public_duel'},
 thornwick_duellist:{name:'the Thornwick duellist',pool:'thornwick',context:'public_duel'},
 thornwick_illusionist:{name:'the Thornwick illusionist',loadout:'Illusionist',context:'public_duel'},
 thornwick_sketcher:{name:'the boy with the sketchbook',loadout:'Illusionist',persona:{shadowstep:8,reflect:4},context:'practice_duel'},
 thornwick_final_year:{name:'the Thornwick final-year',pool:'thornwick',context:'practice_duel'},
 // The boathouse ring
 ring_opener:{name:'your opponent',pool:'ring',context:'ring_bout'},
 ring_rower:{name:'the rower',loadout:'Brawler',persona:{strike:6,guard:4},context:'ring_bout'},
 ring_villager:{name:'the villager',loadout:'Underground tough',persona:{strike:6,extraction:4},context:'ring_bout'},
 ring_scarf:{name:'the student in the scarf',loadout:'Illusionist',context:'ring_bout'},
 ring_duellist:{name:'the club duellist',loadout:'Duellist',context:'ring_bout'},
 ring_farrier:{name:'the farrier’s apprentice',loadout:'Brawler',persona:{strike:8,brace:6},context:'ring_bout'},
 ring_hood:{name:'the hooded fighter',loadout:'Hollow adept',context:'ring_bout'},
 ring_champion:{name:'the ring’s champion',loadout:'Prefect',persona:{brace:6,guard:6},context:'ring_bout'},
 ring_bookmaker:{name:'the bookmaker',loadout:'Underground tough',persona:{extraction:6,torment:6},context:'ring_bout'},
 ring_sailor:{name:'the sailor',loadout:'Sailor',context:'ring_bout'},
 // Characters: the main game names them (a character's short name). `vs npc.stat ±n`: their current skills (canon × peer
// growth, Engine.statOf) × (1 + 0.03 n). A generic rung (rival_contest): their canon shape at the rung's level (foeLevel).
 lyra:{loadout:'Lyra'},bram:{loadout:'Bram'},kael:{loadout:'Kael'},tamsin:{loadout:'Tamsin'},
 peer:{loadout:'(the peer present)'},   // duel_hall_gallery: whichever peer the card cast as `here`
 // Danger
 man_in_grey:{name:'the man in grey',loadout:'The man in grey',context:'real_conflict'},
 shadow_stag:{name:'the shadow stag',loadout:'Shadow stag',context:'real_conflict'}
};

// Every current combat card, by event/option. play: a minigame fight against `foe` (several foes: matched to the card's
// random text variant, in order); convert: not a fight, the challenge line becomes this (same rung and odds). Level: the challenge's rung → foeLevel.
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

// A generic foe's level from the card's challenge, so a fight is about as hard as the roll it replaces. The stub rolls
// skill against a DC (the rung, drifted toward the expected skill E); one DC point moves its odds ~2%, one level here ~6%,
// so the foe sits at E + 0.35 × (DC − E). The odds word shifts it: sure −6, likely −3, even 0, unlikely +3, slim +6.
export const LEVEL_PER_DC=.35;
export const NATURE_LEVELS={certain:-9,sure:-6,likely:-3,even:0,unlikely:3,slim:6,long_shot:9,freak:12};
export function foeLevel({expected,dc,nature='even'}){return Math.max(1,Math.min(100,Math.round(expected+LEVEL_PER_DC*(dc-expected)+(NATURE_LEVELS[nature]??0))));}

// Every loadout a foe names must exist (checked by tools/event-coverage.mjs).
export const foeLoadouts=()=>Object.values(FOES).flatMap(f=>f.pool?POOLS[f.pool]:[f.loadout]).filter(l=>!l.startsWith('('));
export const knownLoadout=l=>!!(LOADOUTS[l]??NAMED_LOADOUTS[l]??SPECIAL_LOADOUTS[l]);
