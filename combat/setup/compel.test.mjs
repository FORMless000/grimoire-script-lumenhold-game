// Compel (F5.11-plan.1): never in the first exchange; it captures the target's move of the exchange it lands, which plays as
// usual, and forces that move for the next three exchanges (a turn it can't be played is lost). Ward or Shadowstep keeps it
// off; Reflect turns it on its caster; two Compels cancel. Control order: frozen, then Bound, then Compelled, then a channel.
// Every case on both actor sides and in both commitment orders. More fixtures: plan1.test.mjs.
import test from 'node:test';import assert from 'node:assert/strict';
import {createState} from './setup.mjs';
import * as core from '../web/core.mjs';

const skills={arcana:50,lore:50,alchemy:50,charm:50,vigor:50,guile:50};
const ORDERS=[[0,0],[0,1],[1,0],[1,1]];
// `me` (side 0 or 1) is the target, with Ward, Shadowstep II, Reflect, Flame, Haste and Starlight; the caster has Compel.
const TARGET={ward:1,shadowstep:2,reflect:1,flame:1,haste:1,starlight:1};
const CASTER={compel:1,ward:1,threads:1,reflect:1};
function duel(me,leader,mine=TARGET,theirs=CASTER){const k=me===0?[mine,theirs]:[theirs,mine];return createState({playerKit:{skills,spells:k[0]},opponentKit:{skills,spells:k[1]},firstLeader:leader});}
function play(s,me,mine,theirs){for(let i=0;i<2&&!s.result;i++){const side=core.actorToMove(s);core.applyChoice(s,side===me?mine:theirs);}}
const edit=(s,f)=>{const t=structuredClone(s);f(t);return t;};

test('Compel can\'t be cast in the first exchange, by either side, in either order',()=>{
 for(const [me,leader]of ORDERS){
  const s=duel(me,leader);
  assert.equal(core.available(s,1-me,'compel'),'Not in the first exchange');assert(!core.legalActions(s,1-me).includes('compel'));
  play(s,me,'guard','guard');
  assert.equal(core.available(s,1-me,'compel'),'','from the second exchange on');
 }
});

test('the captured move plays as committed, then is forced for exactly three exchanges, shown in advance',()=>{
 for(const [me,leader]of ORDERS){
  const s=duel(me,leader);
  play(s,me,'guard','guard');
  const hp=s.actors[1-me].hp;
  play(s,me,'flame','compel');
  assert.equal(s.lastPair[me],'flame','the capture exchange is not rewritten');assert.equal(s.actors[1-me].hp,hp-20,'and it plays');
  assert.equal(s.actors[me].compelAction,'flame');assert.equal(s.actors[me].effects.compelled.from,3);assert.equal(s.actors[me].effects.compelled.until,5);
  assert.match(core.describe(s,1-me,'compel'),/next 3 exchanges/);
  // Flame costs 10 of 43 Mana: the third forced cast (after 10 + 10 + 10) still pays; a fourth would not.
  for(let i=0;i<3;i++){assert.deepEqual(core.legalActions(s,me),['flame'],'forced '+(i+1));play(s,me,'flame','guard');}
  assert(core.legalActions(s,me).length>1,'free to choose after three');assert.equal(s.actors[me].compelAction,null,'the payload is cleared');
 }
});

test('a forced move that can\'t be paid, or isn\'t legal any more, is a lost turn',()=>{
 for(const [me,leader]of ORDERS){
  let s=duel(me,leader);
  play(s,me,'guard','guard');play(s,me,'flame','compel');
  s=edit(s,t=>{t.actors[me].resources.mana=5;});
  assert.deepEqual(core.legalActions(s,me),['cancel'],'Flame unaffordable: lost');
  play(s,me,'cancel','guard');assert.equal(s.lastPair[me],'cancel');
  // Release captured: not channelling any more, so every forced turn is lost.
  s=duel(me,leader);
  play(s,me,'starlight','guard');play(s,me,'release','compel');
  for(let i=0;i<3;i++){assert.deepEqual(core.legalActions(s,me),['cancel']);play(s,me,'cancel','guard');}
  // Hold captured: forced Holds while the channel lasts.
  s=duel(me,leader);
  play(s,me,'starlight','guard');play(s,me,'hold','compel');
  assert.deepEqual(core.legalActions(s,me),['hold'],'Hold captured: forced to keep holding');
 }
});

test('Ward or Shadowstep keeps Compel off, cast that exchange or already up; an Impulse gives a Shadowstep up first',()=>{
 for(const [me,leader]of ORDERS){
  let s=duel(me,leader);
  play(s,me,'guard','guard');play(s,me,'ward','compel');assert(!core.has(s,me,'compelled'),'Ward');
  s=duel(me,leader);
  play(s,me,'guard','guard');play(s,me,'shadowstep','compel');assert(!core.has(s,me,'compelled'),'a Shadowstep cast that exchange');
  s=duel(me,leader);
  play(s,me,'shadowstep','guard');play(s,me,'guard','compel');assert(!core.has(s,me,'compelled'),'a Shadowstep held');
  s=duel(me,leader);
  play(s,me,'shadowstep','guard');play(s,me,'strike','compel');assert(core.has(s,me,'compelled'),'attacking breaks the step before Compel');
  assert.equal(s.actors[me].compelAction,'strike');
 }
});

test('Reflect turns Compel on its caster, forced to Compel again (unpaid: lost); two Compels cancel each other',()=>{
 for(const [me,leader]of ORDERS){
  let s=duel(me,leader);
  play(s,me,'guard','guard');play(s,me,'reflect','compel');
  assert(!core.has(s,me,'compelled'));assert(core.has(s,1-me,'compelled'));assert.equal(s.actors[1-me].compelAction,'compel');
  assert.deepEqual(core.legalActions(s,1-me),['compel'],'its caster must Compel again while it can pay');
  s=duel(me,leader,{...TARGET,compel:1});
  play(s,me,'guard','guard');play(s,me,'compel','compel');
  assert(!core.has(s,me,'compelled')&&!core.has(s,1-me,'compelled'),'both cancel');
  assert(s.actors[me].spent.mana>=18&&s.actors[1-me].spent.mana>=18,'both still pay');
 }
});

test('control order: Bound comes before Compelled; the forced turns still pass while Breaking Free',()=>{
 for(const [me,leader]of ORDERS){
  const s=duel(me,leader);
  play(s,me,'guard','guard');play(s,me,'flame','threads');   // Threads: Bound next exchange
  assert.deepEqual(core.legalActions(s,me),['break_free']);
  play(s,me,'break_free','compel');                         // Compel lands while Breaking Free: the capture is Breaking Free
  assert.equal(s.actors[me].compelAction,'break_free');
  assert.deepEqual(core.legalActions(s,me),['cancel'],'Breaking Free once free: lost, no free bind immunity');
 }
});

test('Countertempo: a forced eligible spell under Haste still throws its Impulse',()=>{
 for(const [me,leader]of ORDERS){
  const s=duel(me,leader,{...TARGET,haste:3});
  play(s,me,'haste','reclaim');                               // Haste up from the next exchange
  play(s,me,'haste','compel');                                // a recast while active, captured
  assert.equal(s.actors[me].compelAction,'haste');
  for(let i=0;i<3;i++){const hp=s.actors[1-me].hp;assert.deepEqual(core.legalActions(s,me),['haste']);play(s,me,'haste','reclaim');assert.equal(s.actors[1-me].hp,hp-9,'forced recast '+(i+1)+': an Impulse');}
 }
});

test('a fresh Compel on a compelled side captures the forced move and starts the three exchanges over',()=>{
 for(const [me,leader]of ORDERS){
  const s=duel(me,leader,{...TARGET},{...CASTER});
  play(s,me,'guard','guard');play(s,me,'guard','compel');
  play(s,me,'guard','guard');
  play(s,me,'guard','compel');
  assert.equal(s.actors[me].compelAction,'guard');assert.equal(s.actors[me].effects.compelled.until,s.round+2);
 }
});
