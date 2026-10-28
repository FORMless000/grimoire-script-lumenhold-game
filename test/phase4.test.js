// Phase 4 (docs/phase4-plan.md): the Journal (a thread's journal lines and status, an arc's rumours), facts in the
// People panel, the relationships between people a card has shown, and a resource's named tiers.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('../src/grimoire.js');
const Engine = require('../src/engine.js');
const I18n = require('../src/i18n.js');
const H = require('./helpers.js');
const { content, quiet } = H;

const core = H.sources.filter((s) => s.path.startsWith('content/core/') || s.path.startsWith('content/world/'));
const build = (text) => G.compile(core.concat([{ path: 'content/t.grim', text }]));
const fresh = (c = content, seed = 5) => { const eng = new Engine(c); quiet(() => eng.newGame(Object.assign({ seed, name: 'T' }, c === content ? { origin: 'street' } : {}))); return eng; };

const STORY = `
@thread side_story
name: The Lost Glove
premise: Someone keeps leaving one glove on the bridge.
desc: For authors only.
journal:
  flag(glove_seen): You found a glove on the bridge.
  flag(glove_seen) and count_flag_ok: never shown
  flag(glove_returned): You gave it back. She laughed.
status:
  resolved: flag(glove_returned)
  let_go: flag(glove_dropped)

@cond count_flag_ok
is: false
`;

test('a thread’s journal: and status: compile to conditions and texts', () => {
  const r = build(STORY);
  assert.deepEqual(r.errors.map(String), []);
  const t = r.content.threads.side_story;
  assert.equal(t.name, 'The Lost Glove');
  assert.equal(t.premise, 'Someone keeps leaving one glove on the bridge.');
  assert.equal(t.journal.length, 3);
  assert.equal(t.journal[0].text, 'You found a glove on the bridge.');
  assert.ok(t.journal[0].when.fn, 'each line\'s condition is compiled');
  assert.deepEqual(Object.keys(t.status).sort(), ['let_go', 'resolved']);
});

test('a malformed journal: or status: line is an error', () => {
  assert.ok(build('@thread x\njournal:\n  no colon here\n').errors.length);
  assert.ok(build('@thread x\nstatus:\n  finished: flag(a)\n').errors.length);
});

test('the Journal stamps a line the first turn it holds, and keeps it', () => {
  const r = build(STORY); const eng = fresh(r.content);
  assert.equal(eng.journal().stories.find((x) => x.id === 'side_story'), undefined, 'no story before anything happened');
  eng.s.flags.glove_seen = true; eng.stampJournal();
  const at = eng.s.turn;
  let st = eng.journal().stories.find((x) => x.id === 'side_story');
  assert.equal(st.entries.length, 1);
  assert.equal(st.entries[0].turn, at);
  assert.equal(st.status, 'ongoing');
  eng.s.turn += 2; eng.s.flags.glove_returned = true; eng.stampJournal();
  st = eng.journal().stories.find((x) => x.id === 'side_story');
  assert.deepEqual(st.entries.map((x) => x.turn), [at, at + 2], 'each line keeps its own turn');
  assert.equal(st.status, 'resolved');
  delete eng.s.flags.glove_seen; eng.stampJournal();
  assert.equal(eng.journal().stories.find((x) => x.id === 'side_story').entries.length, 2, 'a stamped line stays');
});

test('a side clue owned by a @thread joins that story; others keep their thread name', () => {
  const eng = fresh();
  const owned = Object.values(content.threads).find((t) => (t.clues || []).length && content.clues[t.clues[0]] && content.clues[t.clues[0]].thread);
  assert.ok(owned, 'some thread owns a side lead');
  eng.s.clues[owned.clues[0]] = eng.s.turn;
  const j = eng.journal();
  const story = j.stories.find((x) => x.id === 'thread:' + content.clues[owned.clues[0]].thread);
  if (owned.journal && owned.journal.length) assert.ok(!story, 'a thread with a journal owns its lead');
  else assert.ok(story, 'without a journal the lead keeps its @clue thread: name');
  const listed = j.leads.some((l) => l.id === owned.clues[0]) || j.stories.some((x) => x.leads.some((l) => l.id === owned.clues[0]));
  assert.ok(listed, 'an open lead is shown');
});

test('an arc’s act opens by act_clock, and shows that act’s rumour; a closed arc its epilogue', () => {
  const r = build(`
@arc tale
name: A Tale
canon: hard
acts: one@y1 two@y4
act_clock: 0 3
act_rumours:
  They say it started with a bell.
  They say the bell rang twice.
epilogue: It's over now.
clock: 0..6
`);
  assert.deepEqual(r.errors.map(String), []);
  const eng = fresh(r.content);
  eng.s.arcs.tale = { clock: 1 };
  assert.equal(eng.actOf('tale'), 1);
  assert.equal(eng.journal().arcs.find((a) => a.id === 'tale').rumour, 'They say it started with a bell.');
  eng.s.arcs.tale.clock = 3;
  assert.equal(eng.actOf('tale'), 2, 'the clock opens act two before its year');
  eng.s.arcs.tale.closed = eng.s.turn;
  const a = eng.journal().arcs.find((x) => x.id === 'tale');
  assert.equal(a.epilogue, "It's over now.");
  assert.equal(a.rumour, null);
});

test('facts: the snapshot lists what you know by tier, and what you don’t; opening someone marks them read', () => {
  const eng = fresh();
  const npc = Object.keys(content.npcs).find((id) => Object.values(content.facts).filter((f) => f.id.startsWith(id + '.')).length >= 4);
  const mine = Object.values(content.facts).filter((f) => f.id.startsWith(npc + '.'));
  eng.s.npcs[npc].met = true;
  for (const f of Object.keys(eng.s.facts)) if (f.startsWith(npc + '.')) delete eng.s.facts[f];
  eng.s.facts[mine[0].id] = eng.s.turn;
  let n = eng.snapshot().npcs.find((x) => x.id === npc);
  assert.equal(n.facts.known.length, 1);
  assert.equal(n.facts.locked.length, mine.length - 1);
  assert.equal(n.facts.fresh, 1, 'a fact not yet looked at is new');
  eng.markFactsSeen(npc);
  n = eng.snapshot().npcs.find((x) => x.id === npc);
  assert.equal(n.facts.fresh, 0);
  quiet(() => eng.run([{ t: 'learn', fact: mine[1].id }], eng.newCtx(null, null)));
  assert.equal(eng.snapshot().npcs.find((x) => x.id === npc).facts.fresh, 1);
});

test('facts unlocked at a month\'s start are announced', () => {
  const eng = fresh();
  const f = Object.values(content.facts).find((x) => x.unlock);
  const npc = f.id.split('.')[0];
  eng.s.npcs[npc].met = true; delete eng.s.facts[f.id];
  const was = f.unlock; f.unlock = { fn: () => true, src: 'true' };
  try {
    const summary = []; eng.unlockFacts(summary);
    assert.ok(summary.some((x) => x.notes.some((n) => n.kind === 'fact' && n.fact === f.id)));
  } finally { f.unlock = was; }
});

test('relationships between people show once a card has moved them', () => {
  const eng = fresh();
  for (const id of ['lyra', 'kael', 'bram']) eng.s.npcs[id].met = true;
  assert.equal(eng.relationsOf('lyra').dislikes, null, 'nothing shown before a card');
  quiet(() => eng.run([{ t: 'npc_rel', a: 'lyra', b: 'kael', sign: -1, tier: 'large' }], eng.newCtx(null, null)));
  assert.equal(eng.relationsOf('lyra').dislikes.id, 'kael');
  assert.equal(eng.relationsOf('kael').dislikes.id, 'lyra');
  assert.equal(eng.relationsOf('bram').dislikes, null);
});

test('a resource’s tiers name the step it is on', () => {
  const eng = fresh();
  const c = eng.c.resources.renown, was = c.tiers;
  c.tiers = '30 Known, 60 Famous, 85 Legend';
  try {
    eng.s.vals.renown = 12; assert.deepEqual(eng.tierOf('renown'), { tier: null, tierAt: null, nextTier: 30 });
    eng.s.vals.renown = 61; assert.deepEqual(eng.tierOf('renown'), { tier: 'Famous', tierAt: 60, nextTier: 85 });
  } finally { c.tiers = was; }
});

test('journal lines, premises, act rumours, hints and tiers are translatable', () => {
  const r = build(STORY + `
@arc tale2
name: T
canon: soft
acts: a@y1
act_rumours:
  A rumour.
`);
  const keys = I18n.extract(r.content).map((x) => x.block + ' ' + x.key);
  for (const k of ['thread:side_story name', 'thread:side_story premise', 'thread:side_story journal.1', 'thread:side_story journal.3', 'arc:tale2 act_rumours.1']) assert.ok(keys.includes(k), k);
  assert.ok(!keys.includes('thread:side_story desc'), 'a thread\'s desc is for authors');
});
