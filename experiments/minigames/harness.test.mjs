import test from 'node:test';
import assert from 'node:assert/strict';
import * as adapter from './iterations/v01/adapter.mjs';
import {runMatch,episodeSeed} from './harness.mjs';

test('fixed level kit remains fixed while only check tape changes',()=>{
  const a=adapter.create({playerLevel:50},{episodeSeed:1}),b=adapter.create({playerLevel:50},{episodeSeed:2});
  assert.deepEqual(a.player.kit,b.player.kit);assert.deepEqual(a.opponent.kit,b.opponent.kit);
  assert.notEqual(a.tape[0][0],b.tape[0][0]);assert.equal(a.tape[0][2],b.tape[0][2]);
});
test('observations cannot leak future rolls or the uncommitted player choice',()=>{
  const g=adapter.create({playerLevel:50},{episodeSeed:1});
  const a=adapter.observe(g,1),b=adapter.observe(g,0,{information:'blind'});
  for(const v of [a,b]){assert.equal(v.tell,null);assert(!('tape' in v));assert(!('game' in v));assert(!('intent' in v));}
  a.self.resources.health=0;assert.equal(g.opponent.resources.health,70);
});
test('policy-vs-policy replay reproduces complete traces',()=>{
  const c={config:{playerLevel:50},episodeSeed:episodeSeed(20261014,5),leftPolicy:'greedy',rightPolicy:'reactive',keepTrace:true};
  assert.deepEqual(runMatch(adapter,c),runMatch(adapter,c));
  const m=runMatch(adapter,c);assert(m.rounds<=8);for(const ledger of m.ledgers)for(const row of Object.values(ledger))assert(row.final<=row.entry&&row.final>=0);
});
test('skill-only ablation preserves ranks, budgets and seed characteristics',()=>{
  const a=adapter.create({playerLevel:50},{episodeSeed:1}),b=adapter.create({playerLevel:50},{episodeSeed:1,skillShift:10});
  assert.deepEqual(a.player.kit.spells,b.player.kit.spells);assert.deepEqual(a.player.entry,b.player.entry);assert.deepEqual(a.tape,b.tape);
  for(const k of Object.keys(a.player.kit.skills))assert.equal(b.player.kit.skills[k]-a.player.kit.skills[k],10);
});
test('scripted policy selects the actual archetype recommendation',async()=>{
  const {choose}=await import('./policies.mjs');
  const g=adapter.create({playerLevel:50},{episodeSeed:1});
  for(const side of [0,1]){
    const view=adapter.observe(g,side);
    assert.deepEqual(choose('scripted',view),view.referenceAction);
  }
});
test('accuracy-only diagnostic leaves initiative and displayed kit unchanged',()=>{
  const g=adapter.create({playerLevel:50},{episodeSeed:1,checkShift:10,skillShiftSide:1});
  const view=adapter.observe(g,0);
  const strike=view.options.find(o=>o.command.id==='strike'&&!o.command.focus&&!o.command.stake&&!o.command.exert);
  assert.equal(g.player.kit.skills.vigor,42);assert.equal(g.opponent.kit.skills.vigor,42);
  assert.equal(strike.chance,.08); // 42 versus virtual defence 60 clamps to the lower bound.
});
test('all supported policies play all presets without illegal actions',()=>{
  for(const level of [20,50,80])for(const leftPolicy of ['scripted','rush','greedy','reactive'])for(const rightPolicy of ['scripted','rush','greedy','reactive']){
    const m=runMatch(adapter,{config:{playerLevel:level},episodeSeed:1,leftPolicy,rightPolicy});assert(m.rounds<=8);
  }
  for(const leftPolicy of ['honest','deceiver','opportunist'])for(const rightPolicy of ['scripted','skeptic','impatient']){
    const m=runMatch(adapter,{config:{mode:'negotiation'},episodeSeed:1,leftPolicy,rightPolicy});assert(m.rounds<=8);
  }
});
