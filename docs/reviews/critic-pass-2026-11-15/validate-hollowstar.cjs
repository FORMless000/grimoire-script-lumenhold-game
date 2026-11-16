'use strict';
// Isolated route and narration probes against compiled cards.
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
const { content, errors } = require(root + '/tools/project.js').project(root).compileAll();
const Engine = require(root + '/src/engine.js');
assert.equal(errors.length, 0);
const make = () => {
  const e = new Engine(content);
  e.newGame({ seed: 7, name: 'Critic fixture' });
  e.s.turn = 45;
  e.s.arcs.hollowstar = { clock: 12 };
  return e;
};
const solo = make();
for (const id of ['kael', 'ilse', 'maud', 'isolde']) assert.equal(solo.s.npcs[id].met, false);
const company = { id: 'hs_night_company', actor: null };
const view = solo.withContext(company, () => solo.view(company));
assert.match(view.text, /Nobody has followed/);
solo.s.cur = company;
const alone = solo.choose('alone');
assert.match(alone.say, /their protests/);
const recovery = make();
recovery.s.flags.ilse_went_north = true;
recovery.s.flags.ilse_saved = true;
recovery.s.flags.key_taken = true;
assert(recovery.gone('ilse'));
assert(recovery.test(content.events.hs_key_recover.when));
const family = content.events.hs_key_recover.options.find(o => o.key === 'family');
assert(recovery.test(family.when));
const returnVisit = make();
returnVisit.s.flags.hollow_tempted = true;
returnVisit.s.cur = { id: 'hs_grey_offer', actor: null };
returnVisit.choose('left');
const next = { id: 'hs_grey_return', actor: null };
const nextView = returnVisit.withContext(next, () => returnVisit.view(next));
assert.match(nextView.text, /You liked what you tasted/);
const fled = make();
fled.s.cur = { id: 'hs_beneath', actor: null };
fled.choose('flee');
const after = fled.s.queue.find(item => item.id === 'hs_aftermath_fled');
assert.equal(after.due, fled.s.turn + 1);
const event = { id: after.id, actor: 'isolde' };
const afterView = fled.withContext(event, () => fled.view(event));
assert.match(afterView.text, /came back up at dawn/);
console.log(JSON.stringify({
  solo: { opening: view.text, outcome: alone.say },
  family: { ilseGone: true, ilseSaved: true, chooseFamilyAvailable: true },
  greyVisitAfterRefusal: nextView.text,
  fleeAftermath: { fledOn: fled.s.turn, due: after.due, text: afterView.text }
}, null, 2));
