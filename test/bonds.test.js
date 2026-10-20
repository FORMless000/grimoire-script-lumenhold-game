'use strict';
// Romance, friendship and rivalry sets (world expansion 1, plan §2): content/events/romance/ and content/events/bonds/.
// Generic social cards stop casting the characters who have their own (migrations 0039 and 0040), each character's
// own version of a generic card plays in its place (`specializes:`), and the written bonds aren't pre-empted.
const test = require('node:test');
const assert = require('node:assert/strict');
const Engine = require('../src/engine.js');
const { project } = require('../tools/project.js');
const { ROOT } = require('./helpers.js');

const { content } = project(ROOT).compileAll();
const fresh = () => { const e = new Engine(content); e.newGame({ seed: 7, name: 'T' }); return e; };
const ev = (id) => content.events[id];
// Does the generic card's first role take this character, with these relationship values?
const casts = (id, npc, set = {}, flags = {}) => {
  const e = fresh();
  Object.assign(e.s.npcs[npc], { met: true }, set);
  Object.assign(e.s.flags, flags);
  return e.castHolds(ev(id), { [ev(id).cast[0].role]: npc });
};

test('bonds: generic cards no longer cast the characters who have their own', () => {
  const out = {
    soc_drift: ['lyra', 'kael'], soc_homework_help: ['lyra', 'mir'], soc_argument: ['tobias', 'seraphine', 'kael'],
    soc_bad_news: ['kael'], soc_friend_sick: ['kael'], soc_rumour: ['nessa'], soc_make_peace: ['lyra', 'bram'],
    letter_from_a_friend: ['tamsin'],
  };
  const rich = { rel: 30, bond: 'friend' };
  for (const [id, who] of Object.entries(out)) for (const npc of who) assert.equal(casts(id, npc, id === 'soc_make_peace' ? { rel: 5, bond: 'rival' } : rich), false, id + ' casts ' + npc);
  assert.equal(casts('soc_argument', 'corvin', { rel: 10 }), true, 'soc_argument still casts others');
  assert.equal(casts('soc_make_peace', 'corvin', { rel: 5, bond: 'rival' }), true, 'the truce still casts other rivals');
  // the taunt is Lyra's and Bram's only
  assert.equal(casts('soc_rival_taunt', 'bram', { rel: -20, bond: 'rival' }), true);
  assert.equal(casts('soc_rival_taunt', 'corvin', { rel: -20 }), false);
});

test('bonds: Bram befriends you only once he has softened; bram_turns never undoes a close bond', () => {
  assert.equal(casts('soc_become_friends', 'bram', { rel: 20 }), false);
  assert.equal(casts('soc_become_friends', 'bram', { rel: 20 }, { bram_softened: true }), true);
  const e = fresh();
  Object.assign(e.s.npcs.bram, { met: true, rel: 40, bond: 'close' });
  e.s.flags.bram_softened = true;
  assert.equal(e.test(ev('bram_turns').when, 'bram'), false, 'close');
  e.s.npcs.bram.bond = 'nemesis';
  assert.equal(e.test(ev('bram_turns').when, 'bram'), true, 'a nemesis can still turn');
});

test('bonds: a confession never fires for an ex', () => {
  for (const who of ['lyra', 'tobias', 'seraphine', 'corvin', 'mir', 'kael', 'nessa']) {
    const e = fresh();
    Object.assign(e.s.npcs[who], { met: true, rel: 30, spark: 40, bond: 'ex' });
    assert.equal(e.test(ev(who + '_confession').when, who), false, who);
    e.s.npcs[who].bond = 'friend';
    assert.equal(e.test(ev(who + '_confession').when, who), true, who + ' as a friend');
  }
});

test('bonds: each character\'s own version replaces the generic card for them', () => {
  const e = fresh();
  const ix = e.directorIndex();
  const own = {
    soc_become_close: ['lyra', 'bram', 'ilse'], soc_ex_encounter: ['lyra', 'tobias', 'seraphine', 'corvin', 'mir', 'kael', 'nessa'],
    soc_gift_given: ['mir', 'kael'], soc_argument: ['nessa'], align_saint_jibe: ['corvin'], soc_teach_spell: ['lyra'], soc_birthday: ['mir'],
  };
  for (const [gen, who] of Object.entries(own)) for (const npc of who) {
    const spec = ix.special[gen] && ix.special[gen][npc];
    assert.ok(spec, gen + ' for ' + npc);
    assert.equal(e.specialize({ id: gen, actor: null, cast: { [ev(gen).cast[0].role]: npc } }, new Set()).id, spec.id);
  }
  // a close milestone still sets the bond
  const lyra = ix.special.soc_become_close.lyra;
  assert.ok(JSON.stringify(lyra.options.find((o) => o.key === 'right').effects).includes('"close"'));
});

test('bonds: the rivals have a way in and a way out', () => {
  // Bram can become a rival early, at his worst; Lyra's truce is her own card now
  const e = fresh();
  Object.assign(e.s.npcs.bram, { met: true, rel: -15, bond: 'none' });
  e.s.turn = 2;
  assert.equal(e.test(ev('bram_marked').when, 'bram'), true);
  e.s.turn = 5;
  assert.equal(e.test(ev('bram_marked').when, 'bram'), false, 'only in months 2–3');
  Object.assign(e.s.npcs.lyra, { met: true, rel: 10, bond: 'rival' });
  assert.equal(e.test(ev('lyra_rival_respect').when, 'lyra'), true);
  assert.equal(casts('soc_make_peace', 'lyra', { rel: 10, bond: 'rival' }), false);
});
