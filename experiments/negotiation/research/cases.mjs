// Context controls are explicit research fixtures; concession cards appear only
// in the configured broker case. No campaign events or player grants are edited.
export const SCENARIOS=['ordinary','concessions','scholarly','social','practical','worn'];
export function caseOptions(c){const level=c.level,variant=['dumb','hyper-frugal','ignorant'].includes(c.objective)?c.objective:'normal';const defaults={level,difficulty:Math.max(1,Math.min(100,level+(c.gap??0))),seed:c.seed,objective:variant==='normal'?c.objective:'allout',policyVariant:variant};switch(c.scenario){
 case 'ordinary':return defaults;
 case 'concessions':return {...defaults,pool:'broker',gold:24,requests:[{type:'gold',amount:8,weight:5},{type:'health',amount:6,weight:2}]};
 case 'scholarly':return {...defaults,pool:'scholarly',loadout:'Scholar',player:{preparation:{evocation:Math.min(100,level+15),astromancy:Math.max(0,level-15),alchemy:level,illusion:level,beastcraft:Math.max(0,level-10),umbral:level,artifice:level,starcalling:Math.max(0,level-20),hollow_studies:level}}};
 case 'social':return {...defaults,pool:'intimate',loadout:'Showman',player:{relationship:Math.max(0,level-12)}};
 case 'practical':return {...defaults,pool:'practical',loadout:'Brawler',player:{job:{work:Math.min(100,level+18),tavern:level,library_assistant:Math.max(0,level-15),apothecary_clerk:level,broom_courier:level,intern_royal_library:level,intern_conclave:level,intern_alchemists:level,intern_expedition:level,intern_field_station:level,intern_thornwick:level,intern_unseen_office:level}}};
 case 'worn':return {...defaults,health:25,mood:15,gold:8,mana:Math.min(18,Math.round(12+level*.1))};
 case 'all-spells':return {...defaults,allSpells:true};
 case 'resource-access':return {...defaults,allSpells:true,pool:'broker',gold:24,requests:[{type:'gold',amount:8,weight:5},{type:'health',amount:6,weight:2}]};
 default:throw Error('Unknown research scenario '+c.scenario);
}}
