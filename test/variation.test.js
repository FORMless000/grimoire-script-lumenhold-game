// Linked variation (docs/grimoire-script.md § Inline variation): every group of a card picks the same position.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Engine = require('../src/engine.js');
const { project } = require('../tools/project.js');
const { ROOT, content } = require('./helpers.js');


test('random groups of one card pick the same position', () => {
  const e = new Engine(content);
  const seen = new Set();
  for (let seed = 1; seed <= 40; seed++) {
    e.newGame({ seed, name: 'T' });
    for (let turn = 1; turn <= 20; turn++) {
      e.s.turn = turn;
      const a = e.interp('{~a|b|c}', null, 'k'), b = e.interp('x {~A|B|C} {~1|2|3}', null, 'k');
      assert.equal(b, 'x ' + a.toUpperCase() + ' ' + (a.charCodeAt(0) - 96));
      seen.add(a);
    }
  }
  assert.equal(seen.size, 3);   // and every position comes up
});

test('a group nested in a chosen part uses the same position', () => {
  const e = new Engine(content); e.newGame({ seed: 5, name: 'T' });
  for (let turn = 1; turn <= 30; turn++) {
    e.s.turn = turn;
    const top = e.interp('{~a|b}', null, 'k'), nested = e.interp('{season == "never": x|{~a|b}}', null, 'k');
    assert.equal(nested, top);
  }
});

test('sequence and cycle follow the showing count; the seen() conditional matches a sequence', () => {
  const e = new Engine(content); e.newGame({ seed: 3, name: 'T' });
  for (const n of [0, 1, 2, 3, 5]) {
    e.s.seen.k = n;
    assert.equal(e.interp('{a|b|c} {A|B|C}', null, 'k'), ['a A', 'a A', 'b B', 'c C', 'c C', 'c C'][n]);
    assert.equal(e.interp('{&a|b} {&A|B}', null, 'k'), ['a A', 'a A', 'b B', 'a A', 'b B', 'a A'][n]);
    assert.equal(e.interp('{seen(k) <= 1: a|{seen(k) == 2: b|c}}', null, 'k'), e.interp('{a|b|c}', null, 'k'));
  }
});

test('the run log records the title, label and say lines as shown, and re-renders them the same', () => {
  const G = require('../src/grimoire.js');
  const { sources } = project(ROOT).compileAll();
  const extra = '@event t_var\nclass: routine\ntitle: {~North|South|East}\ntext: {~n|s|e}\n> left: {~Go north|Go south|Go east}\n  say: {~Cold.|Warm.|Windy.}\n> right: Stay\n  mood -tiny\n';
  const { content: c2, errors } = G.compile(sources.concat([{ path: 't.grim', text: extra }]));
  assert.deepEqual(errors.map((e) => e.message), []);
  for (let seed = 1; seed <= 12; seed++) {
    const e = new Engine(c2); e.newGame({ seed, name: 'T' }); e.s.turn = seed;
    e.s.cur = null; e.s.deck.unshift({ id: 't_var', actor: null, src: 'test', force: true });
    const view = e.advance().view, k = ['North', 'South', 'East'].indexOf(view.title);
    assert.equal(view.text, 'nse'[k]);
    assert.equal(view.options[0].label, ['Go north', 'Go south', 'Go east'][k]);
    const out = e.choose('left'), l = e.s.log[e.s.log.length - 1];
    assert.equal(out.say, ['Cold.', 'Warm.', 'Windy.'][k]);
    assert.equal(l.title, view.title); assert.equal(l.choice, view.options[0].label);
    e.s.turn += 3;
    assert.equal(e.interpLogged(c2.events.t_var.title, l), view.title);
    assert.equal(e.interpLogged(c2.events.t_var.options[0].effects.find((x) => x.t === 'say').text, l), out.say);
  }
});
