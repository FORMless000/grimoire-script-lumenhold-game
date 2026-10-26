import test from 'node:test';import assert from 'node:assert/strict';
import {fightOptions,settle} from './campaign.mjs';
import {createState,combatStart} from './setup.mjs';
import {EVENTS,fightSetting} from './foes.mjs';
import {CONTEXTS,COMBAT_TUNING,ALIGNMENT_COST} from './roster.mjs';
import * as core from '../web/core.mjs';
const player={skills:{arcana:50,lore:50,alchemy:50,charm:50,vigor:50,guile:50},spells:{ward:1,flame:3,glamour:1,index:1,extraction:1},level:50,health:70,mana:43,mood:60,renown:20,gold:10,alignment:0};
const start=(over,opts={})=>createState(fightOptions({player:{...player,...over},opponent:{loadout:'Duellist',level:50},...opts})).actors[0];
test('entering Mana stays as it was; the rest of capacity starts as flux',()=>{
 const a=start({mana:10});assert.equal(a.kit.capacity,43);assert.equal(a.resources.mana,10);assert.equal(a.flux,33);
 const b=start({mana:43});assert.equal(b.resources.mana,43);assert.equal(b.flux,0);
 const c=start({mana:0});assert.equal(c.resources.mana,0);assert.equal(c.flux,43);
});
test('Health 30 or more starts the fight at full HP; below it the start falls straight to 70% at 0 (2026-10-19)',()=>{
 const hp=h=>start({health:h}).hp/start({health:100}).maxHP;
 assert.equal(hp(100),1);assert.equal(hp(30),1);assert(Math.abs(combatStart({health:0}).hp-.7)<1e-12);
 assert(Math.abs(combatStart({health:.5}).hp-.85)<1e-12,'halfway to 30, halfway down');
});
test('a fight costs Health only when it ends below 30 HP: the whole stake at 0, less the rebate (2026-10-19)',()=>{
 const s=createState(fightOptions({player,opponent:{loadout:'Duellist',level:50},context:'real_conflict'}));
 while(!s.result)core.applyChoice(s,'strike');
 const at=hp=>{s.actors[0].hp=hp;return settle(s,player).deltas.health;};
 assert.equal(at(30),0);assert.equal(at(45),0);
 assert.equal(at(0),-Math.round(COMBAT_TUNING.settle.healthStake*(1-CONTEXTS.real_conflict.health)));
 assert.equal(at(15),-Math.round(COMBAT_TUNING.settle.healthStake*.5*(1-CONTEXTS.real_conflict.health)));
});
test('a fight never hands back more Mana than the player brought',()=>{
 const s=createState(fightOptions({player:{...player,mana:10},opponent:{loadout:'Duellist',level:50}}));
 while(!s.result)core.applyChoice(s,core.actorToMove(s)===0?'reclaim':'strike');
 assert(settle(s,{...player,mana:10}).deltas.mana<=0);
});
test('Glamour and Rapport join the kit only before an audience; no-effect spells never do',()=>{
 assert(!('glamour' in start({}).kit.spells));assert('glamour' in start({},{observers:true}).kit.spells);
 for(const o of [false,true]){const k=start({},{observers:o}).kit.spells;assert(!('index' in k));assert('extraction' in k);}
});
test('a witnessed forbidden cast is reported without an audience; an unseen one only costs alignment',()=>{
 for(const [witnesses,reports]of [[true,1],[false,0]]){
  const s=createState(fightOptions({player:{...player},opponent:{loadout:'Duellist',level:50},observers:false,witnesses}));
  core.applyChoice(s,core.actorToMove(s)===0?'extraction':'guard');core.applyChoice(s,core.actorToMove(s)===0?'extraction':'guard');
  assert.equal(s.reports.length,reports);assert.equal(s.actors[0].resources.alignment,-ALIGNMENT_COST.forbidden,'one forbidden cast: −2 (2026-10-19)');
 }
 // A crowd that won't report (the boathouse ring, 2026-10-25): an audience, and an explicit witnesses:false.
 const ring=createState(fightOptions({player:{...player},opponent:{loadout:'Duellist',level:50},observers:true,witnesses:false}));
 core.applyChoice(ring,core.actorToMove(ring)===0?'extraction':'guard');core.applyChoice(ring,core.actorToMove(ring)===0?'extraction':'guard');
 assert.equal(ring.reports.length,0,'nobody in the ring reports');assert.equal(ring.actors[0].resources.alignment,-ALIGNMENT_COST.forbidden,'the cast still costs alignment');
});
test('every played card resolves a context and states its audience',()=>{
 for(const [key,e]of Object.entries(EVENTS))if(e.play)for(const i of [0,1])for(const foe of [e.play].flat()){
  const st=fightSetting(key,i,foe);assert(CONTEXTS[st.context],key);assert.equal(typeof st.observers,'boolean',key);assert.equal(typeof st.witnesses,'boolean',key);
 }
 assert.deepEqual([0,1].map(i=>fightSetting('hs_tunnel/fight',i).witnesses),[true,false]);
});
