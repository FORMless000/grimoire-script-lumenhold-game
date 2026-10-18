import test from 'node:test';import assert from 'node:assert/strict';
import {fightOptions,settle} from './campaign.mjs';
import {createState,combatStart} from './setup.mjs';
import {EVENTS,fightSetting} from './foes.mjs';
import {CONTEXTS} from './roster.mjs';
import * as core from '../web/core.mjs';
const player={skills:{arcana:50,lore:50,alchemy:50,charm:50,vigor:50,guile:50},spells:{ward:1,flame:3,glamour:1,index:1,extraction:1},level:50,health:70,mana:43,mood:60,renown:20,gold:10,alignment:0};
const start=(over,opts={})=>createState(fightOptions({player:{...player,...over},opponent:{loadout:'Duellist',level:50},...opts})).actors[0];
test('entering Mana stays as it was; the rest of capacity starts as flux',()=>{
 const a=start({mana:10});assert.equal(a.kit.capacity,43);assert.equal(a.resources.mana,10);assert.equal(a.flux,33);
 const b=start({mana:43});assert.equal(b.resources.mana,43);assert.equal(b.flux,0);
 const c=start({mana:0});assert.equal(c.resources.mana,0);assert.equal(c.flux,43);
});
test('Health costs little down to 30 and much more below it',()=>{
 const hp=h=>combatStart({health:h/70}).hp;
 assert.equal(hp(70),1);assert(Math.abs(hp(30)-(.9+.1*30/70))<1e-12);assert(Math.abs(hp(0)-.7)<1e-12);
 assert(hp(50)-hp(30)<.03&&hp(30)-hp(10)>.15,'steeper below the knee');
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
  assert.equal(s.reports.length,reports);assert(s.actors[0].resources.alignment<0);
 }
 assert.throws(()=>createState({observers:true,witnesses:false}),/Invalid combat setup/);
});
test('every played card resolves a context and states its audience',()=>{
 for(const [key,e]of Object.entries(EVENTS))if(e.play)for(const i of [0,1])for(const foe of [e.play].flat()){
  const st=fightSetting(key,i,foe);assert(CONTEXTS[st.context],key);assert.equal(typeof st.observers,'boolean',key);assert.equal(typeof st.witnesses,'boolean',key);
 }
 assert.deepEqual([0,1].map(i=>fightSetting('hs_tunnel/fight',i).witnesses),[true,false]);
});
