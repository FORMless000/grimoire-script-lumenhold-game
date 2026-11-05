// Review fixtures, not frequency estimates. Run from the project root with:
// node docs/reviews/critic-current-2026-10-28/probes.cjs
'use strict';
const path = require('path');
const root = path.resolve(__dirname, '../../..');
const Engine = require(path.join(root, 'src/engine.js'));
const { content, errors } = require(path.join(root, 'tools/project.js')).project(root).compileAll();
if (errors.length) throw new Error(errors.map(String).join('\n'));
const fresh = () => {
  const eng = new Engine(content);
  eng.newGame({ seed: 7, name: 'Review', origin: 'street' });
  eng.s.cur = null;
  eng.s.day = null;
  eng.s.deck = [];
  eng.s.queue = [];
  return eng;
};
const run = (eng, effects) => eng.run(effects, eng.newCtx(null, null));
const show = (eng, id) => {
  eng.s.cur = null;
  eng.s.deck = [{ id, src: 'review-fixture' }];
  const r = eng.advance();
  if (r.kind !== 'card' || r.view.id !== id) throw new Error('Not delivered: ' + id);
  return r.view;
};
const evidence = [];
for (const [id, host, flag, milestone] of [
  ['career_return_conclave', 'intern_conclave', 'return_conclave', 'intern_conclave_your_ward'],
  ['career_return_guild', 'intern_alchemists', 'return_guild', 'intern_alchemists_safety'],
  ['career_return_unseen', 'intern_unseen_office', 'return_unseen', 'intern_unseen_office_file'],
  ['career_return_field_station', 'intern_field_station', 'return_field_station', 'intern_field_station_foal'],
]) {
  const eng = fresh();
  run(eng, [{ t: 'join', track: host }]);
  eng.trackState(host).perf = 80;
  eng.s.turn = 25;
  run(eng, content.events.intern_assessment.on_show);
  eng.s.turn = 39;
  const view = show(eng, id);
  evidence.push({ probe: id, returnFlag: !!eng.s.flags[flag], milestoneSeen: eng.s.seen[milestone] || 0, text: view.text });
}
{
  const eng = fresh();
  eng.s.turn = 48;
  eng.s.vals.renown = 60;
  show(eng, 'last_remembered');
  const out = eng.chooseMany(['renown', 'plain']);
  evidence.push({ probe: 'last_remembered-contradictory-selection', say: out.say, rememberRenown: !!eng.s.flags.remember_renown });
}
{
  const eng = fresh();
  eng.s.turn = 48;
  eng.s.npcs.kael.met = true;
  eng.s.flags.ilse_saved = true;
  eng.s.flags.dumont_reunited = true;
  run(eng, content.events.ilse_northern_letter.options.find(o => o.key === 'left').effects);
  const view = show(eng, 'last_dumonts');
  evidence.push({ probe: 'last_dumonts-after-departure', wentNorth: !!eng.s.flags.ilse_went_north, text: view.text });
}
{
  const eng = fresh();
  eng.s.turn = 20;
  eng.s.flags.red_ink_begun = true;
  const option = content.events.lecture_tower_red_ink_reply.options.find(o => o.key === 'right');
  const challenge = option.effects.find(st => st.t === 'challenge');
  // Execute the actual failure branch and its shared suffix, without a random roll.
  run(eng, challenge.lose);
  run(eng, option.effects.slice(option.effects.indexOf(challenge) + 1));
  const view = show(eng, 'lecture_tower_red_ink_front_row');
  evidence.push({ probe: 'red-ink-failed-surveillance', glimpse: !!eng.s.flags.red_ink_glimpse, text: view.text });
}
{
  const eng = fresh();
  eng.s.turn = 21;
  eng.s.flags.red_ink_begun = true;
  eng.s.flags.red_ink_met = true;
  const option = content.events.lecture_tower_red_ink_seminar.options.find(o => o.key === 'left');
  const challenge = option.effects.find(st => st.t === 'challenge');
  run(eng, challenge.lose);
  run(eng, option.effects.slice(option.effects.indexOf(challenge) + 1));
  eng.stampJournal();
  const story = eng.journal().stories.find(s => s.id === 'red_ink');
  evidence.push({ probe: 'red-ink-failed-seminar', story });
}
{
  const eng = fresh();
  eng.s.turn = 20;
  eng.s.npcs.corvin.met = true;
  eng.s.npcs.corvin.rel = 15;
  show(eng, 'corvin_confiscation_vault');
  const option = content.events.corvin_confiscation_vault.options.find(o => o.key === 'left');
  const challenge = option.effects.find(st => st.t === 'challenge');
  run(eng, option.effects.slice(0, option.effects.indexOf(challenge)));
  run(eng, challenge.lose);
  eng.s.cur = null;
  const view = show(eng, 'corvin_lucky_deck');
  evidence.push({ probe: 'lucky-deck-after-failed-retrieval', vaultSeen: eng.s.seen.corvin_confiscation_vault,
    detention: !!eng.s.states.detention, text: view.text });
}
console.log(JSON.stringify(evidence, null, 2));
