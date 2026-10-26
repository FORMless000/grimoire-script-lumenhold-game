// Preset weights from docs/spells-v2-loadouts.md. Skill order is explicit.
export const LOADOUT_SKILLS=['arcana','lore','alchemy','charm','vigor','guile'];
export const COURSE_PICKS=['foresight','mend','glamour','haste','shadowstep'];
// extras: capstone weights (club and job spells; see COMBAT_TUNING.kits.capstones); hidden: hidden-pool and hidden-course weights.
// standIn: {capstone: spell} plays a combat spell (a hidden or a peer's) in place of a capstone with no combat effect.
// offsets: each skill's % above or below the level, in LOADOUT_SKILLS order (F5.9; were fixed points, half these).
export const LOADOUTS={
 Duellist:{salt:1,offsets:[12,-2,-16,-2,10,-2],flameBase:.9,course:[2,1,.5,3,2],extras:{brace:3,tailwind:1},hidden:{reflect:1,lodestar:1,starlight:.5}},
 Scholar:{salt:2,offsets:[10,14,2,-4,-8,-14],flameBase:.4,course:[4,1,1,.5,1],extras:{index:2,quickquill:1},standIn:{index:'omen'},hidden:{starlight:3,seal:1,moonwell:1}},
 Healer:{salt:3,offsets:[4,4,16,4,-8,-20],flameBase:.6,course:[1,4,.5,1,.5],extras:{bramble:3,purify:1},hidden:{moonwell:1}},
 Illusionist:{salt:4,offsets:[8,-8,-6,8,-4,2],flameBase:.4,course:[1,2,4,.5,3],extras:{rapport:2,brace:1},standIn:{rapport:'hoarfrost'},hidden:{reflect:3,seal:1,starlight:.5}},
 Brawler:{salt:5,offsets:[-8,-19,-15,4,28,10],flameBase:.6,course:[.5,1,.5,4,1],extras:{tailwind:3,brace:2,purify:.5},hidden:{rime:1}},
 Prefect:{salt:6,offsets:[10,6,-8,-8,8,-8],flameBase:.7,course:[2,2,.5,1,1],extras:{brace:3,index:1},hidden:{lodestar:2,seal:1}},
 Showman:{salt:7,offsets:[6,-8,-12,20,6,-12],flameBase:.6,course:[1,.5,4,2,.5],extras:{tailwind:3,rapport:2,brace:1},hidden:{reflect:1,starlight:.5}},
 'Underground tough':{salt:8,offsets:[-4,-16,-8,-4,16,16],flameBase:.7,course:[.5,1,1,3,3],extras:{tailwind:2,brace:1},hidden:{rime:1},underground:true,forbidden:{extraction:3,torment:2,heartprice:1}},
 Sailor:{salt:32,offsets:[-4,-15,-7,8,22,-4],flameBase:.5,course:[.5,1,.5,4,1],extras:{tailwind:3,brace:2,purify:.5},hidden:{lodestar:1}}, // F5.9: barge crews, deckhands, the ring's sailor
 'Hollow adept':{salt:9,offsets:[12,12,-8,-12,-12,8],flameBase:.5,course:[3,1,.5,.5,3],extras:{index:1},hidden:{seal:2,rime:2,moonwell:1},underground:true,forbidden:{siphon:3,eclipse:2,torment:1,compel:.5}}
};
// Special foes (F5.9): creatures and other fighters outside the classes. Skills from offsets like a class; the spells are a
// fixed kit, {spell: level it is learned at}; no Flame or Ward unless listed.
export const SPECIAL_LOADOUTS={
 // Creature pass 1 (2026-10-24): `strike` scales a creature's Impulse (its race's otherwise; RACES in roster.mjs). The oaks
 // and the Spinner hit at 0.55, so their HP pools, not their blows, make them hard (they won 85–100% at equal level).
 // F5.11: the stag is a beast (no healing) and fades into the shadows on its own spell.
 'Shadow stag':{salt:40,offsets:[-12,-20,-20,-20,44,28],kit:{gore:1,fade:1,brace:15,tailwind:30},creature:true,race:'beast'},
 // The Whisperwood (world expansion 1; the plan's M4). race: critter | beast | monster | boss scales HP and Mana and forbids
 // healing (RACES in setup/roster.mjs); hp / mana set a creature's own multipliers within its race's band. Humans have no
 // race. mods: a foe's own modifiers, the worn-kit form (cost, onCast, onDefend, taken). F5.11: every move is the
 // creature's own spell (setup/roster.mjs), and the big blows are delayed hits that Ward stops.
 'Practice mannequin':{salt:41,offsets:[-30,-40,-40,-40,-10,-30],kit:{flame:1},idle:true,creature:true,race:'critter',mana:.7},   // the intro's lesson: strike, guard, reclaim and Flame (Thorne's wand), nothing else; Mana for a Flame every drill until about exchange 12 (EVENTS loop)
 'Bramble ferret':{salt:42,offsets:[-30,-30,-30,-20,-10,30],kit:{nip:1,skitter:1,filch:5,burrow:10},creature:true,race:'critter'},
 Bristleback:{salt:43,offsets:[-30,-30,-30,-20,40,-10],kit:{maul:1,hide:1,roar:10},creature:true,race:'monster',hp:1.75,mana:.6},
 'Stag beetle':{salt:44,offsets:[-30,-30,-30,-30,30,0],kit:{charge:1,carapace:1,pinch:1,beetle_flame:1},creature:true,race:'monster',hp:1.5,mana:.5},
 'Grumpy oak':{salt:45,offsets:[-20,10,-10,-30,30,-30],kit:{root:1,bough:1,bark:1,acorns:10},creature:true,race:'monster',hp:2,mana:.4,strike:.55},
 'Elder oak':{salt:46,offsets:[-10,30,0,-30,40,-30],kit:{root:1,slow_fall:1,bark:1,acorns:1,thicket:10},creature:true,race:'monster',hp:2.5,mana:.6,strike:.55},
 'Spiderling swarm':{salt:47,offsets:[-30,-30,-30,-40,-10,20],kit:{swarm:1,skitter:1,threads:1,burrow:10},creature:true,race:'critter'},
 'The Spinner':{salt:48,offsets:[10,30,0,20,40,20],kit:{venom:1,web:1,brood:1,the_long_wait:1,carapace:1},creature:true,race:'boss',strike:.55},
 // Weakened (she showed you her blind side, F5.11): the same Spinner at the same level, starting hurt (`start`: the share of
 // max HP she enters with, createState's opponentStart), rather than missing a spell.
 'The Spinner, weakened':{salt:48,offsets:[10,30,0,20,40,20],kit:{venom:1,web:1,brood:1,the_long_wait:1,carapace:1},creature:true,race:'boss',strike:.55,start:{hp:.6}},
 // Forbidden practitioners (F5.11): human, so no race; generated like the forbidden classes (Hollow adept, Underground
 // tough), expanded with their own iconic spells, and carrying their worn kit (content/world/items.grim).
 // The thornwitch: a Hollow adept of the thicket, Siphon first, with Bramble and the thorn wand (on_cast forbidden spell 2).
 Thornwitch:{salt:50,offsets:[10,0,30,0,-10,20],flameBase:.4,course:[1,3,.5,.5,1],iconic:['siphon'],extras:{bramble:3},hidden:{moonwell:1,seal:1},underground:true,forbidden:{torment:3,eclipse:2,extraction:1},mods:{onCast:{forbidden:2}}},
 // The masked circle: the Outcast's dabblers, an Underground tough's shape around Compel.
 'Masked circle':{salt:51,offsets:[20,10,0,10,0,30],flameBase:.7,course:[1,1,.5,1,3],iconic:['compel'],extras:{tailwind:1},hidden:{seal:1,rime:1},underground:true,forbidden:{torment:3,eclipse:2,extraction:1}},
 // The Outcast: a grandmaster of every forbidden spell with his grimoire (cost forbidden −2, on_cast forbidden spell 2).
 // `maxed`: every skill 100 at any level (F5.11); only his kit is tuned.
 'The Outcast':{salt:52,offsets:[0,0,0,0,0,0],maxed:true,kit:{torment:1,extraction:1,siphon:1,compel:1,eclipse:1,heartprice:1,ward:1,shadowstep:1,flame:1},mods:{cost:{forbidden:-2},onCast:{forbidden:2}}},
 // The Hollow Star's Night (v2, 2026-10-26; docs/plots/hollowstar-v2.md). Madame Dumont, who leads the cult's circle:
 // the man in grey's frost and Compel, with the families' forbidden craft.
 'Madame Dumont':{salt:53,offsets:[22,12,-10,0,-6,22],flameBase:0,course:[2,0,0,0,2],iconic:['rime','compel'],extras:{ward:2},hidden:{seal:1},underground:true,forbidden:{eclipse:3,siphon:2,heartprice:1}},
 // A thing of frost and whispers come ashore from the lake (Act II's climax): Hoarfrost and Rime, and it feeds.
 'Frost wraith':{salt:54,offsets:[16,-12,-12,-20,18,10],flameBase:0,course:[2,0,0,1,1],iconic:['hoarfrost'],extras:{tailwind:1},hidden:{rime:2},underground:true,forbidden:{siphon:2,eclipse:1}},
 // Your own shadow as the Star's champion (the Night): it steps a beat behind you, and takes what you give it.
 'Your shadow':{salt:55,offsets:[10,4,0,0,0,10],flameBase:.6,course:[1,1,1,1,1],iconic:['shadowstep','eclipse'],extras:{reflect:2},hidden:{seal:1},underground:true,forbidden:{eclipse:2,siphon:1}}
};
// Stable salts 10–31 follow the document's named-character order. Faculty Rest
// lists have no numerical weights: their listed choices use equal weight 1.
export const NAMED_LOADOUTS={
 Lyra:{salt:10,npc:'lyra',reference:'arcana',iconic:['wildfire'],place:'brace',flameBase:1,prodigy:'flame',course:[1,0,0,3,.5],extras:{tailwind:1}},
 Tobias:{salt:11,npc:'tobias',reference:'vigor',iconic:['heartwood'],place:'bramble',flameBase:0,course:[.5,4,0,2,0],extras:{purify:1}},
 Seraphine:{salt:12,npc:'seraphine',reference:'lore',iconic:['omen','foresight'],flameBase:.2,course:[0,1,1,0,3],grants:[['starlight',50]],hidden:{starlight:1}},
 Corvin:{salt:13,npc:'corvin',reference:'guile',iconic:['sleight'],place:'rapport',flameBase:.4,course:[1,0,2,1,4],extras:{quickquill:.5}},
 Mir:{salt:14,npc:'mir',reference:'alchemy',iconic:['contraption'],place:'animate',flameBase:.6,course:[1,2,0,2,0],extras:{purify:1}},
 Kael:{salt:15,npc:'kael',reference:'arcana',iconic:['hoarfrost'],place:'index',flameBase:.3,course:[3,1,0,.5,2],grants:[['starlight',50]],hidden:{starlight:1}},
 Nessa:{salt:16,npc:'nessa',reference:'charm',iconic:['candour'],place:'quickquill',flameBase:.3,course:[2,.5,1,.5,1],extras:{index:1}},
 Bram:{salt:17,npc:'bram',reference:'vigor',iconic:['brace'],flameBase:.8,course:[1,1,0,3,0],grants:[['lodestar',50]]},
 Ilse:{salt:18,npc:'ilse',reference:'arcana',iconic:['rime'],flameBase:.2,course:[1,0,0,2,2]},
 Tamsin:{salt:19,npc:'tamsin',reference:'charm',iconic:['glamour'],prodigy:'glamour',flameBase:.3,course:[1,0,0,1,3],grants:[['rapport',30],['reflect',40]]},
 'The man in grey':{salt:20,iconic:['compel','rime'],underground:true,flameBase:0,course:[2,0,0,0,2],forbidden:{eclipse:2,siphon:2,heartprice:1}},
 Grisk:{salt:21,npc:'grisk',fixed:true,iconic:['extraction','rapport'],underground:true,flameBase:0,course:[1,0,3,0,2],forbidden:{compel:2,torment:1}},
 Thorne:{salt:22,npc:'thorne',fixed:true,iconic:['flame'],flameBase:1,course:[1,0,0,0,0],extras:{brace:1},hidden:{seal:1,lodestar:1}},
 Isolde:{salt:23,npc:'isolde',fixed:true,iconic:['seal'],flameBase:0,course:[1,0,0,0,1],hidden:{starlight:1,reflect:1}},
 Vey:{salt:24,npc:'vey',fixed:true,iconic:['glamour'],flameBase:0,course:[0,0,0,0,1],extras:{rapport:1},hidden:{reflect:1}},
 Brask:{salt:25,npc:'brask',fixed:true,iconic:['haste'],prodigy:'haste',flameBase:0,course:[0,1,0,0,0],extras:{tailwind:1}},
 Marisol:{salt:26,npc:'marisol',fixed:true,iconic:['moonwell'],flameBase:0,course:[0,1,0,1,0]},
 Amaranth:{salt:27,npc:'amaranth',fixed:true,iconic:['mend'],prodigy:'mend',flameBase:0,course:[0,0,0,0,0],extras:{purify:1,brace:1}},
 Maud:{salt:28,npc:'maud',fixed:true,iconic:['mend'],prodigy:'mend',flameBase:0,course:[0,0,0,0,0],extras:{bramble:1,purify:1}},
 Pell:{salt:29,npc:'pell',fixed:true,iconic:['purify'],flameBase:0,course:[0,1,0,0,0]},
 Mabel:{salt:30,npc:'mabel',fixed:true,iconic:['rapport'],flameBase:0,course:[0,1,1,0,0]},
 Grimsby:{salt:31,npc:'grimsby',fixed:true,iconic:['index'],flameBase:0,course:[1,0,0,0,0]}
};
