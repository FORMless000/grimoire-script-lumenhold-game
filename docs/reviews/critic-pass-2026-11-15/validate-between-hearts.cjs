'use strict';
// Bounded cast/history checks, with explicit state setup; no frequency estimates.
const fs = require('fs'), assert = require('assert'), path = require('path');
const root = path.resolve(__dirname, '../../..');
const { content, errors } = require(root + '/tools/project.js').project(root).compileAll();
assert.equal(errors.length, 0);
const Engine = require(root + '/src/engine.js');
const e = new Engine(content);
e.newGame({ seed: 7, name: 'Critic fixture' });
e.s.turn = 7;
for (const id of ['corvin', 'nessa', 'tobias']) Object.assign(e.s.npcs[id], { met: true, rel: 20 });
const priorCast = { a: 'corvin', b: 'nessa' };
assert(e.castHolds(content.events.between_inside_joke, priorCast));
e.s.cur = { id: 'between_inside_joke', actor: 'corvin', cast: priorCast };
const priorConversation = e.choose('right');
Object.assign(e.s.npcs.corvin, { bond: 'ex' });
Object.assign(e.s.npcs.nessa, { bond: 'partner' });
const exCast = { a: 'nessa', b: 'corvin' };
assert(e.castHolds(content.events.between_partner_meets_ex, exCast));
const item = { id: 'between_partner_meets_ex', actor: 'nessa', cast: exCast };
const laterView = e.withContext(item, () => e.view(item));
assert(laterView.text.includes('They have never properly met'));
assert(e.castHolds(content.events.between_overheard, { a: 'tobias', b: 'nessa' }));
assert.equal(e.npcRel('tobias', 'nessa'), 0);
e.s.turn = 4;
e.s.flags.matchmaker = true;
assert.equal(e.yearOf(), 1);
assert(e.test(content.events.between_matchmaker.when, 'tobias'));
assert(e.castHolds(content.events.between_matchmaker, { a: 'tobias' }));
fs.writeFileSync(__dirname + '/between-hearts-validation.json', JSON.stringify({ seed: 7,
  acquaintance: { priorCast, priorConversation, laterCast: exCast, laterText: laterView.text },
  maliciousRole: { a: 'tobias', b: 'nessa', accepted: true, pairAffinity: 0 },
  firstYearMatchmaker: { turn: 4, year: 1, flag: 'matchmaker', actor: 'tobias', eligible: true }
}, null, 2) + '\n');
console.log('Partner/ex history, malicious role and first-year matchmaker checks passed.');
