/*
 * The bridge between the engine and the combat minigame (combat/, bundled as build/combat.bundle.js). DOM-free, shared by
 * the fight screen (src/combat-ui.js) and the simulated players (tools/combat-sim.js).
 *   engine fightRequest → createFight(request, opts) → {state, foe, setting, names} → play → fightResult(fight) → engine
 * The minigame's own data says who each card's foe is (combat/setup/foes.mjs: EVENTS, FOES, POOLS), how a challenge's
 * difficulty becomes the foe's level (foeLevel: the engine's own DC plus the odds word) and the fight's setting (context,
 * observers, witnesses). The engine computes the DC (ladderOdds), so it is never duplicated here.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(() => require('../build/combat.bundle.js'));
  else root.CombatBridge = factory(() => root.LumenholdCombat);
})(typeof self !== 'undefined' ? self : this, function (combat) {
  'use strict';

  // A card's kind sets the stakes when nothing else does: a duel is practice, a fight is real.
  const DEFAULT_CONTEXT = { combat: 'real_conflict', duel: 'practice_duel' };
  const LIVE_AI = { maxDepth: 5, nodeBudget: 3e6, mistakeChance: 0 };   // the live opponent (combat/web/app.mjs)
  const at = (v, i) => (Array.isArray(v) ? v[i] : v);
  const u32 = (n) => (n >>> 0) % 4294967295;

  // The character a named loadout stands for, and the named loadout of a character.
  function npcOfLoadout(C, loadout) { const d = C.NAMED_LOADOUTS[loadout]; return d && d.npc ? d.npc : null; }
  function loadoutOfNpc(C, npc) { return Object.keys(C.NAMED_LOADOUTS).find((k) => C.NAMED_LOADOUTS[k].npc === npc) || null; }

  // Which foe a request fights: the card's decision in EVENTS (a list picks by the card's text variant, or "the character
  // if met, else the generic one" when it starts with a character), `peer` = the character the card cast, and for a card
  // with no decision (lint lists them), the character it names or a student.
  function foeFor(req, C) {
    const key = req.event + '/' + req.option, ev = C.EVENTS[key];
    const ids = ev && ev.play ? [ev.play].flat() : [];
    let id = null, loadout = null, npc = null;
    if (ids.length === 1) id = ids[0];
    else if (ids.length > 1) {
      const first = C.FOES[ids[0]], firstNpc = first && npcOfLoadout(C, first.loadout);
      id = firstNpc ? (req.met.includes(firstNpc) ? ids[0] : ids[1]) : ids[req.variantHash % ids.length];
    } else id = req.vs && loadoutOfNpc(C, req.vs.npc) ? 'peer' : req.kind === 'duel' ? 'club_partner' : 'tournament_entrant';
    // `peer` with no character to stand for (a peer without a named loadout yet): a sparring partner from the student pool.
    if (id === 'peer' && !(req.vs && loadoutOfNpc(C, req.vs.npc))) id = 'club_partner';
    const f = C.FOES[id] || {};
    if (id === 'peer') { npc = req.vs.npc; loadout = loadoutOfNpc(C, npc); }
    else if (f.pool) { const pool = C.POOLS[f.pool]; loadout = pool[Math.floor(C.levelRng(req.seed % 1e9)() * pool.length)]; }
    else { loadout = f.loadout; npc = npcOfLoadout(C, loadout); }
    if (!loadout || !(C.LOADOUTS[loadout] || C.NAMED_LOADOUTS[loadout] || C.SPECIAL_LOADOUTS[loadout])) throw new Error('fight ' + req.id + ': no loadout for foe ' + id);
    const sp = C.SPECIAL_LOADOUTS[loadout];
    return { id, loadout, npc, persona: f.persona || null, special: !!sp, creature: !!(sp && sp.creature), pronouns: f.pronouns || null, defaultName: f.name || null, decided: !!ids.length };
  }

  // createFight(request, opts) → {state, foe, setting, names, request}
  //   opts.difficulty  the AI preset for the foe: easy | medium | hard | engine (a player setting, default easy)
  //   opts.content     the game's content (localized): a character's short name and pronouns
  //   opts.foeName     (id, englishName) → the name to show for a generic foe (the UI translates it)
  //   opts.ai          {player, foe}: AI options (simulated players fight both sides; the UI leaves the player to the human)
  // The foe a request fights, with its level and the name the fight shows (also what an option's button says before it).
  function foeOf(req, opts = {}) {
    const C = combat();
    const ev = C.EVENTS[req.event + '/' + req.option] || null, i = req.index || 0;
    const foe = foeFor(req, C);
    const nature = String((ev && at(ev.nature, i)) || req.odds || 'even').replace(/\s+/g, '_');
    foe.level = C.foeLevel({ dc: req.dc, nature });
    // Names for the fight text: the player is "you"; a character by their short name and pronouns; a generic foe as the
    // card describes them; a creature is "it".
    const npc = foe.npc && opts.content && opts.content.npcs[foe.npc];
    foe.name = npc ? npc.short || String(npc.name).split(/[\s·]+/)[0] : opts.foeName ? opts.foeName(foe.id, foe.defaultName) : foe.defaultName;
    foe.pronouns = npc ? String(npc.pronouns || 'they') : foe.pronouns || (foe.creature ? 'it' : 'they');
    return foe;
  }
  function createFight(req, opts = {}) {
    const C = combat();
    const key = req.event + '/' + req.option, ev = C.EVENTS[key] || null, i = req.index || 0;
    const foe = foeOf(req, opts);
    const setting = ev && ev.play ? C.fightSetting(key, i, foe.id) : {};
    setting.context = setting.context || (C.FOES[foe.id] && C.FOES[foe.id].context) || DEFAULT_CONTEXT[req.kind] || 'practice_duel';
    if (typeof setting.observers !== 'boolean') setting.observers = false;
    if (typeof setting.witnesses !== 'boolean') setting.witnesses = true;
    // A lesson (`tutorial: [keys]`) or a fight with nothing at stake (`stakes: none`, world expansion 1): no bar moves.
    if (ev && at(ev.tutorial, i)) setting.tutorial = [].concat(at(ev.tutorial, i));
    if (ev && at(ev.stakes, i) === 'none') setting.stakes = 'none';
    const firstLeader = ev && at(ev.firstLeader, i) != null ? at(ev.firstLeader, i) : 1;
    const p = req.player;
    const base = C.fightOptions({
      player: { skills: p.skills, spells: p.spells, health: p.health, mana: Math.min(p.mana, C.manaCapacity(p.skills)), mood: p.mood, renown: p.renown, gold: p.gold, alignment: p.alignment, mods: p.mods || null },
      opponent: { loadout: foe.loadout, level: foe.level },
      context: setting.context, observers: setting.observers, witnesses: setting.witnesses, firstLeader, encounterSeed: u32(req.seed),
    });
    const ai = opts.ai || {};
    const foeAI = Object.assign({}, LIVE_AI, ai.foe || {}, { seed: u32(req.seed + 1), preset: opts.difficulty || 'easy' }, foe.persona ? { persona: foe.persona } : {});
    const playerAI = ai.player ? Object.assign({}, LIVE_AI, ai.player, { seed: u32(req.seed + 2) }) : null;
    const state = C.createState(Object.assign(base, { ai: [playerAI, foeAI] }));
    // The foe commits first, visibly, for n exchanges (rival_contest with the stolen plan): as under the player's Foresight.
    const early = ev && at(ev.foeCommitsFirst, i);
    if (early > 0) { state.earlyCommit[1] = early; state.leader = 1; }
    const names = C.fighterNames({ opponentName: foe.name, opponentLoadout: foe.loadout, opponentPronouns: foe.pronouns });
    return { request: req, state, foe, setting, names, rules: C.RULES_VERSION };
  }

  // The finished fight → the result the engine takes (choose(key, {fights: [result]}) or a resolver's return).
  function fightResult(fight) {
    const C = combat(), req = fight.request, p = req.player;
    const st = C.settle(fight.state, { health: p.health, mana: Math.min(p.mana, C.manaCapacity(p.skills)) });
    const free = fight.setting && (fight.setting.tutorial || fight.setting.stakes === 'none');
    return { request: req.id, outcome: st.outcome, reason: st.reason, deltas: free ? {} : st.deltas, followUps: free ? [] : st.followUps,
      foe: { id: fight.foe.id, loadout: fight.foe.loadout, name: fight.foe.name, level: fight.foe.level }, exchanges: fight.state.round, rules: C.RULES_VERSION };
  }

  // A whole fight played by two AIs, synchronously (the simulated players; the core must be started: initSync()).
  function autoplay(fight, { maxActions = 800 } = {}) {
    const C = combat(), s = fight.state, ctx = C.createSearchContext();
    try {
      for (let n = 0; !s.result && n < maxActions; n++) {
        const side = C.actorToMove(s); if (side == null) break;
        const d = C.chooseAIAction(s, s.config.ai[side], ctx);
        C.applyChoice(s, d.id);
      }
    } finally { C.freeSearchContext(ctx); }
    if (!s.result) throw new Error('fight ' + fight.request.id + ' did not finish');
    return fightResult(fight);
  }

  return { createFight, fightResult, autoplay, foeOf, foeFor: (req) => foeFor(req, combat()), DEFAULT_CONTEXT, LIVE_AI, combat };
});
