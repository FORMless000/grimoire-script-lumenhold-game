/* Campaign adapter for Crux. No negotiation rules here: setup, replay, and translate the core's resource balances. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(() => require('../build/crux.bundle.js'), require('./negotiation.js'));
  else root.ParleyBridge = factory(() => root.LumenholdCrux, root.Negotiation);
})(typeof self !== 'undefined' ? self : this, function (runtime, registry) {
  'use strict';
  const round = (n) => Math.round(n * 100) / 100;
  const rules = () => runtime().rules;
  function valuesOf(req) {
    const C = runtime(), p = req.player, binding = registry.lookup(req.event, req.option);
    if (!binding || !C.encounters.some((e) => e.key === req.event + '/' + req.option)) throw Error('No Crux encounter for ' + req.id);
    const who = binding.bond === false ? null : binding.bond || (req.vs && req.vs.npc) || req.actor;
    const npc = req.cast && req.cast[who] || who;
    const target = binding.record || req.track;
    const track = target && (req.tracks[target] ? target : Object.keys(req.tracks).find((id) => req.trackKinds[id] === target && req.tracks[id].status === 'member'));
    const t = track && req.tracks[track];
    const signals = { ...p.skills, standing: p.renown,
      bond: npc && req.relationships[npc] != null ? req.relationships[npc] : null,
      record: t ? (req.trackKinds[track] === 'thesis' ? t.progress : ['job', 'club', 'internship'].includes(req.trackKinds[track]) ? t.perf : null) : null };
    return { signals, npc, track };
  }
  function setupOf(req) {
    const C = runtime(), p = req.player, { signals } = valuesOf(req);
    const spells = Object.fromEntries(Object.entries(p.spells).filter(([id]) => C.spells.spells[id]));
    return { seed: req.seed, level: Math.max(1, Math.round(Object.values(p.skills).reduce((a, v) => a + v, 0) / Object.keys(p.skills).length)),
      enc: req.event + '/' + req.option, mana: p.mana, crowns: p.gold, health: p.health, renown: p.renown,
      campaign: { signals, spells, maxMana: p.maxMana, resourceScale: req.resourceScale,
        difficulty: C.setup.difficultyOf(req), using: req.using === 'renown' ? 'standing' : req.using,
        partial: req.partial, facts: req.facts.map((f) => registry.factLabel(f.condition)) } };
  }
  function createParley(request) {
    const C = runtime(); C.core.initSync();
    const game = C.core.newGame(setupOf(request));
    return { request, game, entry: { ...game.view }, rules: rules() };
  }
  function resume(saved) {
    if (saved.rules !== rules()) throw Error('This negotiation uses a different Crux version.');
    const C = runtime(); C.core.initSync(); const game = C.core.newGame(saved.setup);
    for (const key of saved.moves) game.play(key);
    return { request: saved.request, entry: saved.entry, game, rules: saved.rules };
  }
  function snapshot(parley) {
    return { request: parley.request, rules: parley.rules, entry: parley.entry, setup: parley.game.setup, moves: parley.game.moves.slice() };
  }
  function parleyResult(parley) {
    const { game, entry, request } = parley, v = game.view;
    if (!v.over) throw Error('Negotiation is not finished');
    const deltas = {};
    for (const [key, value] of Object.entries({ mana: v.mana - entry.mana, gold: v.crowns - entry.crowns, health: v.health - entry.health, renown: v.renown - entry.renown, alignment: v.alignment - entry.alignment })) if (value) deltas[key] = round(value);
    return { request: request.id, outcome: v.over.outcome === 'lost' ? 'lose' : v.over.outcome, reason: v.over.why,
      deltas, followUps: v.casts.includes('compel') ? ['forbidden_cast_report'] : [], rules: parley.rules,
      actions: v.actions, moves: game.moves.slice() };
  }
  function autoplay(req, { bot = 'smart' } = {}) { const p = createParley(req); p.game.autoplay(bot); return parleyResult(p); }
  function signalSources(req, content, missing = {}) {
    const { signals, npc, track } = valuesOf(req);
    return { standing: (content.resources.renown.name || 'Renown') + ' ' + signals.standing,
      bond: signals.bond == null ? missing.bond || '—' : ((content.npcs[npc] || {}).name || npc) + ' ' + signals.bond,
      record: signals.record == null ? missing.record || '—' : ((content.tracks[track] || {}).name || track) + ' ' + signals.record };
  }
  return { signalSources, setupOf, createParley, resume, snapshot, parleyResult, autoplay };
});
