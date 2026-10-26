// The Hollow Star, v2 (docs/plots/hollowstar-v2.md): act threads with deadlines, the Night as a scene, and a plot
// that never needs a won fight (decision 2026-10-26).
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Engine = require('../src/engine.js');
const G = require('../src/grimoire.js');
const { content, quiet } = require('./helpers.js');

const fresh = (seed = 5) => { const eng = new Engine(content); quiet(() => eng.newGame({ seed, name: 'T', origin: 'street' })); return eng; };
const run = (eng, src) => quiet(() => eng.run(src, eng.newCtx(null, null)));
const hasFight = (o) => { let f = false; G.walkEffects(o.effects || [], (st) => { if (st.t === 'challenge' && (st.kind === 'combat' || st.kind === 'duel')) f = true; }); return f; };
const plot = (e) => e.arc === 'hollowstar' || /^hs_|^ilse_grey/.test(e.id);
// The engine at the start of a month, with these cards next in the deck.
const at = (eng, turn, ids) => { eng.s.turn = turn; eng.s.day = null; eng.s.cur = null; eng.s.deck = ids.map((id) => ({ id, actor: null, src: 'queued' })); };
// Plays on until no card of the given ids is showing, choosing by pick(view); returns the ids shown.
function playOn(eng, pick, max = 40) {
  const shown = [];
  for (let i = 0; i < max; i++) {
    const r = quiet(() => eng.advance());
    if (r.kind !== 'card') break;
    shown.push(r.view.id);
    quiet(() => eng.choose(pick(r.view)));
  }
  return shown;
}

test('advance <arc> to N raises the clock and never lowers it', () => {
  const eng = fresh();
  eng.s.arcs.hollowstar.clock = 2;
  run(eng, [{ t: 'advance', arc: 'hollowstar', to: 4 }]);
  assert.equal(eng.s.arcs.hollowstar.clock, 4);
  run(eng, [{ t: 'advance', arc: 'hollowstar', to: 3 }]);
  assert.equal(eng.s.arcs.hollowstar.clock, 4);
  assert.deepEqual(G.parseFile('@event x\n> left: a\n  advance hollowstar to 7\n', 'x.grim')[0].options[0].effects[0], { t: 'advance', arc: 'hollowstar', to: 7, line: 3 });
});

test('every fight in the plot sits beside a way that is not a fight', () => {
  for (const e of Object.values(content.events)) {
    if (!plot(e) || e.when && e.when.src === 'false') continue;
    if (!e.options.some(hasFight)) continue;
    assert.ok(e.options.some((o) => !hasFight(o) && !o.when), e.id + ': a fight with no other way past it');
  }
});

test('the act threads carry the arc, so closing it ends them all', () => {
  for (const t of ['hs_omens', 'hs_investigation', 'hs_escalation', 'hs_convergence', 'hs_night']) {
    const members = Object.values(content.events).filter((e) => e.chain === t);
    assert.ok(members.length >= 3, t + ' has its cards');
    for (const e of members) assert.equal(e.arc, 'hollowstar', e.id);
  }
  // The aftermaths belong to no arc: they come after it is closed.
  for (const id of ['hs_aftermath', 'hs_aftermath_lost', 'hs_aftermath_bargain', 'hs_aftermath_freed', 'hs_aftermath_fled']) assert.ok(!content.events[id].arc, id);
});

test('the Night can be played to a sealed door without a single fight, and closes the arc', () => {
  const eng = fresh(11);
  eng.fights = (req) => ({ outcome: 'lose', request: req.id, deltas: {} });
  for (const n of ['kael', 'isolde', 'maud']) eng.s.npcs[n].met = 1;
  Object.assign(eng.s.flags, { kael_ally: true, warden_trial: true, knows_founders_seal: true, sided_wardens: true });
  eng.s.arcs.hollowstar.clock = 12;
  at(eng, 45, ['hs_the_night']);
  const pick = (v) => {
    const open = v.options.filter((o) => !o.disabled);
    const def = (k) => eng.optionsOf(eng.c.events[v.id]).find((o) => o.key === k);
    if (v.id === 'hs_the_night') return 'left';
    if (v.id === 'hs_beneath') return 'seal';
    if (v.id === 'hs_night_company') return 'kael';
    return (open.find((o) => !hasFight(def(o.key))) || open[0]).key;
  };
  const shown = playOn(eng, pick);
  for (const id of ['hs_the_night', 'hs_night_company', 'hs_night_cult', 'hs_tunnel', 'hs_night_shadow', 'hs_threshold', 'hs_beneath']) assert.ok(shown.includes(id), id + ' shown: ' + shown.join(' '));
  assert.ok(eng.s.flags.hollow_sealed || eng.s.flags.hollow_failed, 'an outcome');
  assert.notEqual(eng.s.arcs.hollowstar.closed, undefined, 'the arc is closed');
  // Next month its aftermath comes, though the arc is closed (it belongs to none).
  const after = playOn(eng, (v) => v.options.find((o) => !o.disabled).key, 30);
  assert.ok(after.some((id) => /^hs_aftermath/.test(id)), 'the aftermath shows: ' + after.join(' '));
  assert.ok(!after.some((id) => (eng.c.events[id] || {}).arc === 'hollowstar'), 'and no card of the arc after it');
  // Kael rode along as each card's actor, so a fight `with npc` had him beside you.
  assert.ok(eng.s.flags.night_kael);
});

test('the early descent: a player holding the key goes down before the deadline, with only who promised', () => {
  const eng = fresh(13);
  for (const n of ['kael', 'ilse']) eng.s.npcs[n].met = 1;
  Object.assign(eng.s.flags, { star_key: true, kael_ally: true, winter_kael: false, ilse_saved: true, warden_trial: true });
  eng.s.clues.seven_locks = 20;
  eng.s.arcs.hollowstar.clock = 10;
  eng.s.turn = 43;   // year 4, month 7
  assert.equal(quiet(() => eng.test(eng.c.events.hs_go_down_early.when, null)), true, 'it is offered');
  at(eng, 43, ['hs_go_down_early']);
  let company = null;
  const shown = playOn(eng, (v) => { if (v.id === 'hs_night_company') company = v; return v.id === 'hs_go_down_early' || v.id === 'hs_the_night' ? 'left' : v.options.find((o) => !o.disabled).key; }, 3);
  assert.deepEqual(shown, ['hs_go_down_early', 'hs_the_night', 'hs_night_company']);
  assert.equal(eng.s.arcs.hollowstar.clock, 12);
  // Going early, only the allies who promised come: Kael was an ally but never trained with you, Ilse never promised.
  const open = company.options.filter((o) => !o.disabled).map((o) => o.key);
  assert.ok(!open.includes('kael') && !open.includes('ilse') && open.includes('alone'), open.join(' '));
});

test('a key the man in grey took can be won back without a fight, and "not yet" brings the card back', () => {
  const e = content.events.hs_key_recover;
  assert.ok(e.options.some((o) => o.key === 'isolde' && !hasFight(o)), 'the headmistress, when the Wardens trust you');
  assert.ok(e.options.some((o) => !o.when && !hasFight(o)), 'a way with no condition');
  assert.ok(e.repeat >= 1, 'it comes back');
  const eng = fresh(17);
  Object.assign(eng.s.flags, { key_taken: true, wardens_noticed: true });
  eng.s.npcs.isolde.met = 1;
  eng.s.arcs.hollowstar.clock = 8;
  at(eng, 32, ['hs_key_recover']);
  playOn(eng, () => 'isolde', 1);
  assert.ok(eng.s.flags.gave_star_key && !eng.s.flags.key_taken);
});

test('a player the Night never called sees the lake freeze from above, and the arc closes', () => {
  const eng = fresh(19);
  eng.s.flags.hollow_out = true;
  eng.s.arcs.hollowstar.clock = 12;
  eng.s.turn = 45;
  assert.equal(quiet(() => eng.test(eng.c.events.hs_the_night.when, null)), false);
  assert.equal(quiet(() => eng.test(eng.c.events.hs_the_night_above.when, null)), true);
  at(eng, 45, ['hs_the_night_above']);
  playOn(eng, () => 'left', 1);
  assert.notEqual(eng.s.arcs.hollowstar.closed, undefined);
});
