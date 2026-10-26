'use strict';
// The framework (docs/grimoire-script.md §9): @pool, @cond, @thread and thread templates compile into the cards a
// writer would have written by hand; `queue any in` draws from a pool's or a thread's queued cards; threads have clocks.
const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('../src/grimoire.js');
const Engine = require('../src/engine.js');
const { content, quiet } = require('./helpers.js');

// The real core (rules, balance, templates) plus a test file.
const core = Object.values(content.events).length ? require('./helpers.js').sources.filter((s) => s.path.startsWith('content/core/')) : [];
const build = (text) => G.compile(core.concat([{ path: 'content/t.grim', text }]));
const card = (id, more = '') => '@event ' + id + '\ntitle: ' + id + '\ntext: ' + id + '\n' + more + '> left: L\n  say: l\n> right: R\n  say: r\n';

test('a pool gives its cards its properties; the card wins; when ANDs; tags come first; from: inherits', () => {
  const { content: c, errors } = build([
    '@pool base\nclass: routine\nrepeat: 5\ntags: class\n',
    '@pool evo\nfrom: base\ntrack: evocation\nwhen: term\n',
    card('a', 'pool: evo\nlevel: 1\ntags: magic\nwhen: arcana > 3\n'),
    card('b', 'pool: evo\nrepeat: 2\n'),
  ].join('\n'));
  assert.deepEqual(errors.map((e) => e.message), []);
  const a = c.events.a, b = c.events.b;
  assert.equal(a.track, 'evocation'); assert.equal(a.class, 'routine'); assert.equal(a.repeat, 5);
  assert.deepEqual(a.tags, ['class', 'magic']);
  assert.equal(a.when.src, '(term) and (arcana > 3)');
  assert.equal(a.own_when.src, 'arcana > 3');
  assert.deepEqual(a.pools, ['evo', 'base']);
  assert.equal(a.from.repeat, 'pool:base');
  assert.equal(b.repeat, 2, 'the card\'s own value wins');
});

test('two sources giving one property different values is an error', () => {
  const { errors } = build(['@pool p\nrepeat: 5\n', '@thread t\nrepeat: 3\n', card('a', 'pool: p\nthread: t\n')].join('\n'));
  assert.ok(errors.some((e) => /(pool:p gives repeat: 5.*thread:t gives repeat: 3|thread:t gives repeat: 3.*pool:p gives repeat: 5)/.test(e.message)), errors.map((e) => e.message).join('\n'));
});

test('a @cond expands in place: the compiled condition is the written-out one', () => {
  const { content: c, errors } = build(['@cond wooing\nparams: who\nis: bond(who) != "partner" and bond(who) != "ex"\n', card('a', 'when: rel(lyra) >= 9 and wooing(lyra)\n')].join('\n'));
  assert.deepEqual(errors, []);
  const by = G.parseExprAst('rel(lyra) >= 9 and (bond(lyra) != "partner" and bond(lyra) != "ex")');
  assert.deepEqual(c.events.a.when.ast, by);
  assert.equal(c.events.a.when.src, 'rel(lyra) >= 9 and wooing(lyra)', 'the source keeps the name');
  const npc = build(['@cond wooing\nparams: who\nis: bond(who) != "ex"\n', card('a', 'actor: lyra\nwhen: wooing(npc)\n')].join('\n'));
  assert.deepEqual(npc.content.events.a.when.ast, G.parseExprAst('bond(npc) != "ex"'));
  assert.ok(build(card('a', 'when: nosuch(lyra)\n')).errors.some((e) => /unknown function or @cond "nosuch"/.test(e.message)));
  assert.ok(build(['@cond c1\nparams: x y\nis: x > y\n', card('a', 'when: c1(1)\n')].join('\n')).errors.some((e) => /takes 2 argument/.test(e.message)));
});

test('the quest template: role gates, count(), and `next` expanding to the routing a capstone writes by hand', () => {
  const src = ['@thread brace\nfrom: quest\nwith: begun=brace_chain\nwhen: spell_level(brace) == 0\ntrack: duelling\nrank: 2\nmembers:\n  start s1\n  part p1 flag=f1\n  part p2 flag=f2\n  part p3 flag=f3\n  final fin\n',
    card('s1', 'when: rank(duelling) >= 2\n'), '@event p1\ntitle: P\ntext: p\n> ok: Go\n  flag f1\n  next\n', card('p2'), card('p3'), card('fin')].join('\n');
  const { content: c, errors } = build(src);
  assert.deepEqual(errors.map((e) => e.message), []);
  assert.equal(c.events.s1.trigger, 'auto'); assert.equal(c.events.s1.repeat, 3); assert.equal(c.events.s1.role, 'start');
  assert.equal(c.events.p1.weight.src, '60'); assert.equal(c.events.fin.class, 'milestone'); assert.equal(c.events.fin.track, 'duelling');
  assert.equal(c.events.p1.chain, 'brace');
  const flatAnd = (n) => (n.t === 'bin' && n.op === '&&' ? flatAnd(n.a).concat(flatAnd(n.b)) : [JSON.stringify(n)]);
  assert.deepEqual(flatAnd(c.events.fin.when.ast).sort(), flatAnd(G.parseExprAst('flag(brace_chain) and spell_level(brace) == 0 and since(s1) >= 1 and (flag(f1) + flag(f2) + flag(f3) >= 2 or since(s1) >= 4)')).sort());
  const hand = G.parseFile('@event x\ntitle: X\ntext: x\n> ok: Go\n  flag f1\n  if chain_beat != turn:\n    chain_beat = turn\n    if since(s1) >= 1 and flag(f1) + flag(f2) + flag(f3) >= 2:\n      queue fin now\n    else:\n      if not flag(f2):\n        queue p2 now\n      elif not flag(f3):\n        queue p3 now\n', 'h.grim')[0];
  const strip = (x) => JSON.parse(JSON.stringify(x, (k, v) => (['line', 'src', 'file', 'preset'].includes(k) || typeof v === 'function' ? undefined : v)));
  assert.deepEqual(strip(c.events.p1.options[0].effects), strip(hand.options[0].effects));
});

test('a template\'s role pools and presets are only for its threads\' cards', () => {
  assert.ok(build(card('a', 'pool: quest.part\n')).errors.some((e) => /is a role of thread template quest/.test(e.message)));
  assert.ok(build('@event a\ntitle: A\ntext: a\n> ok: Go\n  quest.next\n').errors.some((e) => /belongs to thread template quest/.test(e.message)));
  assert.ok(build('@thread t\nfrom: quest\n').errors.some((e) => /with: needs begun/.test(e.message)));
});

test('story: unlisted members are steps and wait on $begun', () => {
  const { content: c, errors } = build(['@thread key\nfrom: story\nwith: begun=flag(has_key)\nmembers:\n  start found\n', card('found'), card('door', 'thread: key\nwhen: term\n')].join('\n'));
  assert.deepEqual(errors, []);
  assert.equal(c.events.door.role, 'step');
  assert.equal(c.events.door.when.src, '(flag(has_key)) and (term)');
  assert.equal(c.events.found.when, undefined, 'the start card is not gated on what it begins');
});

test('queue any in <pool|thread> draws one of its queued cards; a thread has a clock', () => {
  const src = ['@thread deck\nfrom: scene\nclock: 0..3\n', card('enter', '> up[ward]: x\n').replace('> up[ward]: x\n', ''),
    card('s1', 'thread: deck\n'), card('s2', 'thread: deck\n'), card('other', 'trigger: queued\n')].join('\n')
    .replace('@event enter\ntitle: enter\ntext: enter\n> left: L\n  say: l', '@event enter\ntitle: enter\ntext: enter\n> left: L\n  queue any in deck now\n  advance deck +1');
  const { content: c, errors } = build(src);
  assert.deepEqual(errors.map((e) => e.message), []);
  assert.equal(c.events.s1.trigger, 'queued');
  const eng = new Engine(c); quiet(() => eng.newGame({ seed: 3, name: 'T' }));
  const got = new Set();
  quiet(() => { for (let i = 0; i < 40; i++) { const ctx = eng.newCtx(null); eng.s.deck = []; eng.run(c.events.enter.options[0].effects, ctx); got.add(eng.s.deck[0] && eng.s.deck[0].id); } });
  assert.deepEqual([...got].sort(), ['s1', 's2']);
  assert.equal(eng.test(G.expr('clock(deck) == 3'), null), true, 'advance moves a thread clock, up to its max');
});

test('the real content compiles with the framework and nothing unresolved', () => {
  const r = require('../tools/project.js').project(require('./helpers.js').ROOT).compileAll();
  assert.deepEqual(r.errors.map((e) => e.message), []);
  assert.ok(r.content.threads.quest && r.content.threads.story && r.content.threads.scene);
});

test('appointments: the library declares the built-in defaults, in their order; content without it gets them', () => {
  // The library's own appointments; content may declare more (spell_uses.grim).
  const real = Object.fromEntries(Object.entries(require('./helpers.js').content.appointments).filter(([, a]) => a.file === 'content/core/appointments.grim'));
  const shape = (a) => ({ id: a.id, at: a.at, for: a.for, deals: a.deals, use: a.use || null, limit: a.limit || null, takes: !!a.takes });
  const bare = G.compile([{ path: 'content/t.grim', text: card('x') }]).content;
  const lib = Object.values(real).map(shape), def = Object.values(bare.appointments).map(shape);
  // the defaults deal the @game cards, which bare content lacks; compare everything else
  const noCard = (a) => Object.assign({}, a, { deals: a.deals.card ? { card: '…' } : a.deals });
  assert.deepEqual(lib.map(noCard), def.map(noCard));
  assert.ok(Object.values(real).every((a) => !a.builtin), 'every one is declared in content/core/appointments.grim');
  assert.equal(require('./helpers.js').content.game.exam, real.exam.deals.card[0], '@game exam reads the exam appointment');
});

test('appointments: a month appointment deals a pool card; a visit appointment deals first at its place; errors name the field', () => {
  const src = ['@appointment market\nat: month\nwhen: turn >= 1\ndeals: pool stalls\nslot: noon\n', '@pool stalls\ntrigger: queued\nclass: routine\nrepeat: 1\n',
    card('stall_a', 'pool: stalls\n'), card('stall_b', 'pool: stalls\n')].join('\n');
  const { content: c, errors } = build(src);
  assert.deepEqual(errors.map((e) => e.message), []);
  assert.equal(c.appointments.market.at, 'month');
  const eng = new Engine(c); quiet(() => eng.newGame({ seed: 3, name: 'T' }));
  const pushed = [], used = new Set();
  quiet(() => eng.dealMonth(c.appointments.market, pushed, used, { plot: 0, plotNow: () => 0 }));
  assert.equal(pushed.length, 1);
  assert.ok(['stall_a', 'stall_b'].includes(pushed[0].id) && pushed[0].slot === 'noon' && pushed[0].src === 'appointment');
  assert.ok(build('@appointment bad\nat: sometime\ndeals: card x\n').errors.some((e) => /at: one of/.test(e.message)));
  assert.ok(build('@appointment bad\nat: month\ndeals: cards x\n').errors.some((e) => /deals: card/.test(e.message)));
  assert.ok(build('@appointment bad\nat: month\ndeals: own\nuse: festival\n').errors.some((e) => /not a built-in way of dealing at month/.test(e.message)));
});

test('order: last puts a slot\'s cards after its other cards, keeping both groups\' order; a pool can give it', () => {
  const { content: c, errors } = build(['@pool starts\norder: last\n', card('start', 'pool: starts\n'), card('walk_a'), card('walk_b')].join('\n'));
  assert.deepEqual(errors.map((e) => e.message), []);
  assert.equal(c.events.start.order, 'last');
  const eng = new Engine(c); quiet(() => eng.newGame({ seed: 3, name: 'T' }));
  const ids = (items) => eng.orderLast(items.map((id) => ({ id }))).map((it) => it.id);
  assert.deepEqual(ids(['start', 'walk_a', 'walk_b']), ['walk_a', 'walk_b', 'start']);
  assert.deepEqual(ids(['walk_b', 'start', 'walk_a']), ['walk_b', 'walk_a', 'start']);
  assert.deepEqual(ids(['walk_a', 'walk_b']), ['walk_a', 'walk_b']);
  // The Whisperwood delve's start cards come after the forest's routine cards.
  for (const id of ['ww_edge', 'ww_edge_night', 'ww_night_first']) assert.equal(content.events[id].order, 'last', id);
});

test('a visit appointment deals only cards for the visited place, and only once its spell is known (spell_uses.grim)', () => {
  const visit = (eng, place) => {
    const rec = eng.recipe(), at = rec.findIndex((r) => r.source === 'visit');
    eng.s.day = { v: 2, phase: 'slots', at, stage: 1, picks: [], nextPicks: [], used: [], items: [], withToday: [], pushed: [], spread: {}, count: 0 };
    eng.s.day.picks = Array(eng.visitIndex(at)).fill(null).concat([place]);
    return quiet(() => eng.fillSlot(rec[at]));
  };
  const dealt = (ward, place) => {
    const eng = new Engine(content); quiet(() => eng.newGame({ seed: 5, name: 'T', origin: 'street' }));
    eng.s.spells.ward = ward; eng.rand = () => 0;   // every chance passes
    return visit(eng, place).filter((it) => it.src === 'ward_in_use').map((it) => it.id);
  };
  assert.deepEqual(dealt(1, 'alchemy_lab'), ['alchemy_lab_do_not_drop'], 'known: opens the visit at a place with one of its cards');
  assert.deepEqual(dealt(1, 'library'), [], 'no ward card at the library: nothing dealt there');
  assert.deepEqual(dealt(0, 'alchemy_lab'), [], 'not known: never dealt');
  const eng = new Engine(content); quiet(() => eng.newGame({ seed: 5, name: 'T', origin: 'street' }));
  const w = () => eng.value(content.events.alchemy_lab_do_not_drop.weight, null, 10);
  eng.s.spells.ward = 0; assert.equal(w(), 10);
  eng.s.spells.ward = 2; assert.equal(w(), 25, 'drawn more often once known');
});
