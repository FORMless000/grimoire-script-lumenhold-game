// Preset weights from docs/spells-v2-loadouts.md. Skill order is explicit.
export const LOADOUT_SKILLS=['arcana','lore','alchemy','charm','vigor','guile'];
export const COURSE_PICKS=['foresight','mend','glamour','haste','shadowstep'];
export const LOADOUTS={
 Duellist:{salt:1,offsets:[8,-2,-8,-2,6,-2],flameBase:.9,course:[2,1,.5,3,2],extras:{brace:3,tailwind:1},hidden:{reflect:1,lodestar:1,starlight:.5}},
 Scholar:{salt:2,offsets:[2,10,0,-2,-8,-2],flameBase:.4,course:[4,1,1,.5,1],extras:{index:3,quickquill:2},hidden:{starlight:2,seal:1,moonwell:1}},
 Healer:{salt:3,offsets:[-2,2,10,2,-4,-8],flameBase:.2,course:[1,4,.5,1,.5],extras:{purify:3,bramble:2},hidden:{animate:1,moonwell:1}},
 Illusionist:{salt:4,offsets:[0,0,-8,8,-6,6],flameBase:.4,course:[1,.5,4,.5,3],extras:{rapport:2,quickquill:1},hidden:{reflect:2,seal:1}},
 Brawler:{salt:5,offsets:[-4,-8,-6,2,12,4],flameBase:.6,course:[.5,1,.5,4,1],extras:{tailwind:3,brace:2,rapport:1},hidden:{rime:1}},
 Prefect:{salt:6,offsets:[4,4,-6,-4,4,-2],flameBase:.7,course:[2,2,.5,1,1],extras:{brace:3,index:1},hidden:{lodestar:2,seal:1}},
 Showman:{salt:7,offsets:[2,-4,-8,12,2,-4],flameBase:.6,course:[1,.5,4,2,.5],extras:{rapport:3,tailwind:1},hidden:{reflect:1}},
 'Underground tough':{salt:8,offsets:[-2,-8,-4,-2,8,8],flameBase:.7,course:[.5,1,1,3,3],extras:{tailwind:2,brace:1,rapport:1},hidden:{rime:1},underground:true,forbidden:{extraction:3,torment:2,heartprice:1}},
 'Hollow adept':{salt:9,offsets:[10,6,-6,-8,-6,4],flameBase:.5,course:[3,1,.5,.5,3],extras:{index:1},hidden:{seal:2,rime:2,moonwell:1},underground:true,forbidden:{siphon:3,eclipse:2,torment:1,compel:.5}}
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
