/*
 * Combat UI prototypes (experiments/combat-ui, not shipped): the fight's controller and model, shared by the forks.
 * Each fork (a-clash, b-arena, c-feed) is a view only: FightProto.define(view) returns a CombatUI with the game's own
 * contract (src/combat-ui.js: open({host, request, content, t, difficulty, avatar, saved, onSave, onDone, kit, ...}) and
 * autoResolve), so a fork drops into the stage in place of the live screen. The controller is src/combat-ui.js's, cut down
 * (no engine analysis), plus what the forks show that the live screen doesn't: what the last exchange did (recap), the
 * statuses on each side in plain words (statuses), constructs explained (construct).
 *   view = { cls, pick: 'select' | 'commit', render(F) → html, bind?(F) }
 * F is the fight as a view reads it: F.game, F.history, F.selected, F.busy, F.tr, F.esc, and the helpers below.
 */
(function (root) {
  'use strict';
  const C = () => root.LumenholdCombat, B = () => root.CombatBridge;
  const esc = (x) => String(x).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n) => (Number.isInteger(n) ? n : Math.abs(n - Math.round(n)) < 0.05 ? Math.round(n) : n.toFixed(1));
  const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => (v && v[k] !== undefined ? v[k] : m));
  const ICON = {
    question: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="32" cy="32" r="26"/><path d="M24 25a8 8 0 1 1 11 7.4c-2 .9-3 2.4-3 4.6v2"/><path d="M32 46v1"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>',
    eyeOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M4 20L20 4"/></svg>',
    hourglass: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12M6 21h12M7 3c0 5 10 5 10 9s-10 4-10 9M17 3c0 5-10 5-10 9"/></svg>',
  };
  // A foe with no portrait: a silhouette on a tint picked from the loadout (src/combat-ui.js).
  const TINTS = ['#628B90', '#7d6a9c', '#8c6f55', '#5e7d63', '#86606a', '#5a6f94', '#8a7d4e', '#6b7480'];
  const hash = (s) => [...String(s)].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);
  const SHAPES = {
    bust: '<circle cx="32" cy="25" r="11"/><path d="M11 60c1-13 10-20 21-20s20 7 21 20z"/>',
    hooded: '<path d="M32 10c-10 0-16 8-16 18v6c0 4 3 6 6 7l-11 19h42l-11-19c3-1 6-3 6-7v-6c0-10-6-18-16-18z"/><ellipse cx="32" cy="30" rx="7" ry="8" fill="#0b0f1d" opacity=".55"/>',
    hat: '<path d="M14 23h36l-4-3c-2-6-7-10-14-10s-12 4-14 10z"/><circle cx="32" cy="30" r="9"/><path d="M12 60c1-12 9-19 20-19s19 7 20 19z"/>',
    creature: '<path d="M24 12l-3-6M24 12l-6-1M24 12l1 8M40 12l3-6M40 12l6-1M40 12l-1 8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none"/><path d="M25 20c2-2 12-2 14 0l1 12c0 5-4 10-8 12-4-2-8-7-8-12z"/><path d="M14 60c2-10 9-16 18-16s16 6 18 16z"/>',
  };
  const placeholder = (key, shape) => {
    const tint = shape === 'hat' ? '#6b7480' : shape === 'creature' ? '#2c3348' : TINTS[hash(key) % TINTS.length];
    return `<svg viewBox="0 0 64 64" aria-hidden="true" class="ph"><rect width="64" height="64" fill="${tint}"/><g fill="#1a1f38" color="#1a1f38" opacity=".72">${SHAPES[shape] || SHAPES.bust}</g></svg>`;
  };
  const YOU_PORTRAIT = '<svg viewBox="0 0 64 64" aria-hidden="true" class="ph"><rect width="64" height="64" fill="#2a3160"/><g fill="#f0d58c" opacity=".55"><circle cx="32" cy="25" r="11"/><path d="M11 60c1-13 10-20 21-20s20 7 21 20z"/></g></svg>';

  // The prototypes' own words (not in UI_EN yet): the game's fight.<key> wins when it has one.
  const EN = {
    tbWon: 'You both fell in the same exchange, but you committed first: your blow landed first and theirs never did, so you keep your HP.',
    tbLost: 'You both fell in the same exchange, but {name} committed first: their blow landed first and yours never did.',
    tbNever: 'Never landed', tbFirst: 'Struck first', tbTag: 'Won on initiative', tbTagLost: 'Lost on initiative',
    them: 'Them', idleYou: 'Pick your opening move below. Tap any move or status for its full rules.',
    theirSpells: 'Their spells', idleTheyAnswer: '{name} sees nothing of your move and answers it.', idleTheyLead: '{name} opens: their move is shown before you choose.',
    lastEx: 'Exchange {n}', nothingYet: 'No exchange yet: pick your opening move.', youLocked: 'You: {move}', waitingFor: '{name} is choosing…',
    noDamage: 'no damage', blocked: 'Blocked {n}', dealt: '−{n}', healed: '+{n}', manaUp: '+{n} Mana',
    'def.guard': 'Parried', 'def.tiredGuard': 'Half-parried', 'def.ward': 'Warded', 'def.brace': 'Braced', 'def.shadowstep': 'Evaded', 'def.reflect': 'Reflected',
    'def.construct': 'Blunted', 'def.lodestar': 'Negated', 'def.frozen': 'Frozen',
    'applied.landed': 'Landed', 'applied.blocked': 'Blocked', 'applied.reflected': 'Turned back', 'applied.reflectedBlocked': 'Turned back, blocked',
    'ex.constructEnded': '{name} is gone', 'ex.froze': '{who} froze instead of falling', 'ex.compelsCancel': 'Both Compels cancel', 'ex.hoarfrostCancel': 'Frost and fire cancel',
    'ex.torment': 'Torment: {who} −{n}', 'ex.witnessed': 'Seen casting {name}', 'ex.assist': '{name} joins in',
    hits: '{name} → {who} {n}', reflectedHit: '{name}, turned back → {who} {n}',
    statusNone: 'Nothing on', statuses: 'On {who}',
    'st.haste': 'Spells that deal no damage also throw an Impulse; other moves also Parry.',
    'st.shadowstep': 'Evading attacks and spell effects. Attacking or Refocusing breaks it.',
    'st.brace': 'Every opposing hit is softened (not Omen).',
    'st.ward': 'This exchange: stops spells, halves Impact.', 'st.guard': 'This exchange: stops Impact, halves spells.',
    'st.reflect': 'This exchange: spells go back to their caster.',
    'st.tailwind': 'Another Tailwind next hits {n}.',
    'st.torment': 'Each move costs HP: {n}× the Mana paid.',
    'st.compelled': 'Must repeat {action}.', 'st.compelledAny': 'Must repeat the seized move.',
    'st.bound': 'Can only Break Free.',
    'st.poison': '{n} damage at the end of each exchange, past defences.',
    'st.eclipse': 'Damage taken also gives Mana.',
    'st.heartprice': 'Spells cost HP. Nothing heals.',
    'st.lodestar': 'Exchange {n}: blocks all damage, then heals {h}.',
    'st.foresight': '{who} commit first: the move is shown before the other picks.',
    'st.foresightThey': '{name} commits first, in the open: you see their move before you pick.',
    'st.foresightYou': 'You commit first, in the open: {name} sees your move before picking.',
    'st.channel': '{holds} held. Hold to build, Release to fire.',
    'st.frozen': 'Frozen: loses exchange {n}.',
    'st.rime': 'Freezes instead of falling, once.',
    'st.generic': 'In effect.',
    turnsLeft: '{n} left', lastsFight: 'rest of the fight', startsAt: 'from exchange {n}', untilEx: 'through exchange {n}',
    construct: 'Summon', youObj: 'you', lastExShort: 'last exchange', 'cx.strike': '{n} Impact to {foe}', 'cx.spell': '{n} spell damage to {foe}', 'cx.heal': 'Heals {owner} {n}',
    'cx.every': 'Each exchange: {effect}.', 'cx.blunt': 'Each hit on {owner} is {n} lighter.', 'cx.breaks': 'Breaks after {n} more damage to {owner}.',
    'cx.ends': 'Gone after exchange {n}.', 'cx.burst': 'When it goes: {n} spell damage to both sides.', 'cx.hp': '{n} to break',
    incoming: 'Incoming', incomingTo: '{name} on {who}', landsNow: 'lands now', landsIn: 'in {n}', landsNext: 'next',
    blocks: 'Stopped by', yourTurn: 'Your move', theyPickFirst: 'They committed', youPickFirst: 'You pick first — they answer', theirNext: 'Next from {name}',
    moreInfo: 'Details', cast: 'Cast', commit: 'Commit', tapAgain: 'Tap again to commit', holdInfo: 'Hold for details',
    log: 'Log', nowShort: 'Now', blowNow: '{name} lands now', tgThinking: 'Their move', tgHidden: 'Hidden', tgHiddenText: '{name} answers your move', tgShown: 'They committed', tgForced: 'Compelled to', hpLost: 'Lost {n} HP this exchange', 'role.guard': 'Stops Impact', 'role.ward': 'Stops spells', 'role.brace': 'Softens hits', 'role.reflect': 'Returns spells', whatStops: 'What stops it', history: 'Fight so far', sameMove: 'repeat', recapTitle: 'Last exchange',
  };

  const DEFENCE = ['lodestar', 'shadowstep', 'reflect', 'frozen', 'ward', 'tiredGuard', 'guard', 'brace', 'construct'];
  const EFFECT_ICON = { compelled: 'compel', foreAim: 'foresight' };
  const HARMFUL = new Set(['torment', 'compelled', 'bound', 'poison', 'heartprice']);
  const CAST_ON_FOE = new Set(['compelled', 'torment']);
  const GUARDING = new Set(['guard', 'ward', 'brace', 'shadowstep', 'reflect']);
  const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V'];

  function define(view) {
    const ui = { open: (opts) => open(opts, view), autoResolve, foeAI: null, playerAI: null };
    return ui;
  }

  function open(opts, view) {
    const { host, content } = opts;
    const tr = (k, v) => { const key = 'fight.' + k, s = opts.t(key, v); return s !== key ? s : fill(EN[k] != null ? EN[k] : k, v); };
    const layer = document.createElement('div');
    layer.className = 'pf-layer ' + view.cls;
    layer.innerHTML = '<div class="pf-wrap"><div class="pf-loading">' + esc(tr('loading')) + '</div></div><div class="pf-sheet" hidden></div>';
    const animate = document.documentElement.dataset.motion !== 'reduced' && !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    host.classList.add('fighting'); if (animate) host.classList.add('fight-enter'); host.appendChild(layer);
    let entered = !animate;
    const settleIn = () => { if (entered) return; entered = true; setTimeout(() => host.classList.remove('fight-enter'), 900); };
    const $ = (sel) => layer.querySelector(sel);
    let ai = null, closed = false, done = false, bars = {}, seen = {}, animated = 0, freshUntil = 0;
    // The engine's analysis (a cheat behind the game's setting; the bench always offers it): src/combat-ui.js's, ported.
    let analyst = null, analysis = null, analysisFor = -1, analysisRunning = false, engineOn = !!(opts.engineHelp && opts.engineShown);
    let engineBudget = [500, 1500, 4000, Infinity].includes(opts.engineBudget) ? opts.engineBudget : 1500;
    const FRESH_MS = 1100;   // how long an exchange's animations run: renders inside it keep them (feedback 2026-10-29)
    const F = { opts, tr, esc, fmt, ICON, layer, view, history: [], selected: null, busy: false, moves: 0, sheet: null, fresh: false, animate };

    const close = () => { closed = true; if (ai) ai.terminate(); if (analyst) analyst.terminate(); document.removeEventListener('keydown', onKey, true); layer.remove(); host.classList.remove('fighting', 'fight-enter'); };
    const foeName = (id, en) => C().tx('foe.' + id, en);
    const snapshot = () => ({ key: opts.key, request: F.fight.request, state: F.game, history: F.history, foe: F.fight.foe, setting: F.fight.setting, names: F.names, rules: F.fight.rules });
    const aiOverrides = () => {
      const g = F.game, UI = root.CombatUI || {};
      if (UI.foeAI) g.config.ai[1] = Object.assign({}, g.config.ai[1], UI.foeAI);
      if (UI.playerAI) g.config.ai[0] = C().expandAI(Object.assign({ maxDepth: 2, nodeBudget: 2e4, mistakeChance: 0, seed: 7, preset: 'medium' }, UI.playerAI), null);
    };

    C().init().then(() => {
      if (closed) return;
      if (opts.saved && opts.saved.state && opts.saved.request && opts.saved.request.id === opts.request.id) {
        const s = opts.saved, foe = Object.assign({}, s.foe, B().foeOf(s.request, { content, foeName }));
        F.fight = { request: s.request, state: s.state, foe, setting: s.setting, rules: s.rules,
          names: C().fighterNames({ opponentName: foe.name, opponentLoadout: foe.loadout, opponentPronouns: foe.pronouns }) };
        F.history = s.history || [];
      } else F.fight = B().createFight(opts.request, { content, difficulty: opts.difficulty || 'easy', foeName });
      F.game = F.fight.state; F.names = F.fight.names; animated = F.history.length;
      aiOverrides();
      ai = C().createAI();
      render(); settleIn(); pump();
    }).catch((e) => { console.error(e); if (!closed) { close(); opts.onDone(autoResolve(opts.request, content)); } });

    // ---- Playing ----
    const bodyOf = (s) => s.actors.map((a) => ({ hp: a.hp, mana: a.resources.mana, flux: a.flux }));
    function submit(id) {
      const C_ = C(), game = F.game, channels = game.actors.map((a) => a.channel && a.channel.id), before = C_.cloneState(game), r = C_.applyChoice(game, id);
      F.moves++;
      if (analyst && analysisRunning) { analyst.stop(); analysisRunning = false; }   // that position is gone
      if (r.resolved) {
        const actionNames = r.pair.map((x, i) => (['hold', 'release'].includes(x) ? C_.label(x) + ' ' + C_.label(channels[i]) : C_.label(x)));
        F.history.push({ round: r.round, pair: r.pair, committed: r.committed, leader: r.leader, channels, actionNames,
          lines: C_.resolvedLines(before, game, Object.assign({}, r, { channels, actionNames }), F.names), finish: C_.finishLines(before, game, r.pair, r.round, F.names),
          events: r.eventData || [], before: bodyOf(before), after: bodyOf(game),
          omens: before.actors.map((a) => a.omens.filter((o) => o.due === r.round).map((o) => ({ id: o.id, impact: !!o.impact }))),
          constructs: before.actors.map((a) => a.constructs.map((c) => c.id)) });
        if (opts.onSave) opts.onSave(snapshot());
      }
      F.selected = null; render();
    }
    function pump() {
      const game = F.game;
      if (closed || !game || game.result) return;
      const side = C().actorToMove(game);
      if (side === 0 && !game.config.ai[0]) return;
      const actions = C().legalActions(game);
      if (actions.length === 1) { submit(actions[0]); pump(); return; }
      const scripted = side === 1 && B().scriptedMove(F.fight);
      if (scripted) { submit(scripted); pump(); return; }
      F.busy = side === 1; render();
      const at = F.moves;
      ai.choose(game, game.config.ai[side]).then((d) => { if (closed || at !== F.moves) return; F.busy = false; submit(d.id); pump(); })
        .catch((e) => { console.error(e); F.busy = false; render(); });
    }

    // ---- Names, icons, numbers ----
    const lesson = () => !!(F.fight && F.fight.setting && F.fight.setting.script);
    const label = (id) => (id === 'cancel' && lesson() ? tr('idle') : C().label(id));
    const labelsOf = (side) => (F.game.actors[side].kit && F.game.actors[side].kit.labels) || null;
    const sideLabel = (id, side) => { const l = labelsOf(side); return label(l && l[id] ? l[id] : id); };
    const channelOf = (side) => F.game.actors[side].channel && F.game.actors[side].channel.id;
    const actionName = (id, side) => (['hold', 'release'].includes(id) ? label(id) + ' ' + sideLabel(channelOf(side) || '', side) : sideLabel(id, side));
    function icon(id, side = 0, channel) {
      const C_ = C(); if (channel === undefined && F.game) channel = channelOf(side);
      const key = ['hold', 'release'].includes(id) ? channel + '_' + id : id;
      return (C_.SPELL_ICONS || {})[id] || C_.ACTION_ICONS[key] || (C_.SPELLS[id] && C_.SPELLS[id].physical ? C_.ACTION_ICONS.strike : id === 'frozen' ? '<b class="glyph">❄</b>' : id === 'cancel' ? '<b class="glyph">∅</b>' : ICON.question);
    }
    const describe = (side, id) => { try { return C().describe(F.game, side, id); } catch (e) { return ''; } };
    const briefOf = (side, id) => { let d = null; try { d = C().describeData(F.game, side, id); } catch (e) { /* not an action now */ } return C().brief(id, d, channelOf(side)); };
    const costs = (side, id) => { const C_ = C(); return { h: C_.hpCost(F.game, side, id), m: C_.has(F.game, side, 'heartprice') ? 0 : C_.cost(F.game, side, id) }; };
    const price = (side, id) => { const { h, m } = costs(side, id); return [m ? tr('mana', { n: fmt(m) }) : '', h ? tr('hp', { n: fmt(h) }) : ''].filter(Boolean).join(' + ') || tr('free'); };
    const scales = (id) => {
      const sp = content && content.spells && content.spells[id]; if (!sp) return '';
      const sk = String(sp.skill || '').split(/[,\s]+/).filter(Boolean).map((k) => (opts.skillName ? opts.skillName(k) : k));
      return sk.length ? opts.t('spell.scales', { skill: sk.join(' + ') }) : opts.t('spell.flat');
    };
    const spellLevel = (side, id) => { const d = C().SPELLS[id]; return d && d.levels > 1 ? (F.game.actors[side].kit.spells || {})[id] || 0 : 0; };
    const roman = (side, id) => ROMAN[spellLevel(side, id)] || '';
    const nameOf = (i) => (i === 0 ? tr('you') : F.fight.foe.name);
    // Compact names (feedback 2026-10-29: a generic foe's descriptive name, "the unbeaten fourth-year", crowded every panel).
    // A heading drops the leading article ("Unbeaten fourth-year"); a tight label (the timeline, an exchange's lines) takes
    // a short name, or "Them". The full name stays in titles, the sheets and the fight's text.
    const titleOf = (i) => { const n = String(nameOf(i)).replace(/^(the|your|a|an)\s+/i, ''); return n.charAt(0).toUpperCase() + n.slice(1); };
    const tagOf = (i) => { if (i === 0) return tr('you'); const n = titleOf(1); return n.length <= 12 ? n : tr('them'); };
    const levelOf = (i) => { const v = Object.values(F.game.actors[i].kit.skills || {}).filter(Number.isFinite); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : F.game.actors[i].kit.level; };
    function portrait(i) {
      if (i === 0) return YOU_PORTRAIT;
      const f = F.fight.foe, npc = f.npc && content.npcs[f.npc];
      if (npc && opts.avatar) return opts.avatar(Object.assign({ id: f.npc }, npc), 64);
      const k = C().SPECIAL_LOADOUTS[f.loadout] ? 'creature' : f.loadout === 'The man in grey' ? 'hat' : F.game.actors[1].kit.underground ? 'hooded' : 'bust';
      return placeholder(f.loadout, k);
    }
    // A kind of damage by its source: Impact (coral) or spell (violet), for the colour of a number.
    const isImpact = (id) => { const S = C().SPELLS[id], K = C().CONSTRUCTS[id]; return id === 'strike' || id === 'tailwind' || !!(S && S.physical) || !!(K && K.action === 'strike'); };

    // ---- Bars: layers move from their last width, a changed value floats its difference once ----
    function layerHtml(cls, key, to, left) {
      const from = bars[key] != null ? bars[key] : to, fromLeft = bars[key + '@'] != null ? bars[key + '@'] : left;
      return `<i class="${cls}" data-bar="${key}" data-to="${to}"${left !== undefined ? ` data-left="${left}"` : ''} style="width:${from}%${left !== undefined ? `;left:${fromLeft}%` : ''}"></i>`;
    }
    function bar(side, kind) {
      const a = F.game.actors[side], value = kind === 'hp' ? a.hp : a.resources.mana, max = kind === 'hp' ? a.maxHP : a.kit.capacity, flux = kind === 'mana' ? a.flux : 0;
      const shield = 0, k = side + kind, pct = (v) => Math.max(0, Math.min(100, 100 * v / max)), now = pct(value), fluxShown = Math.min(flux, Math.max(0, max - value)), prev = seen[k];
      if (prev && prev.v !== value && prev.at !== F.moves) seen[k] = { v: value, at: F.moves, d: value - prev.v, fresh: true };
      else if (!prev) seen[k] = { v: value, at: -1, d: 0 };
      const s = seen[k], fresh = s.fresh; s.fresh = false;
      const delta = fresh && Math.abs(s.d) >= 0.5 ? `<span class="pf-delta ${s.d < 0 ? 'neg' : 'pos'}">${s.d < 0 ? '−' : '+'}${fmt(Math.abs(s.d))}</span>` : '';
      const title = kind === 'hp' ? tr('hpBar', { v: fmt(value), max: fmt(max) }) : tr('manaBar', { v: fmt(value), max: fmt(max), flux: fmt(flux) });
      return `<div class="pf-bar ${kind}${fresh && s.d ? (s.d < 0 ? ' drop' : ' rise') : ''}" title="${esc(title)}"><span class="pf-num"><span class="pf-k">${kind === 'hp' ? '♥' : '✦'}</span>${Math.round(value)}<small>/${Math.round(max)}</small>${delta}</span>` +
        `<span class="pf-track">${layerHtml('trail', k + 'trail', now)}${kind === 'mana' ? layerHtml('flux', k + 'flux', pct(fluxShown), now) : ''}${layerHtml('fill', k + 'fill', now)}</span>` +
        (kind === 'mana' && flux > 0 ? `<span class="pf-flux" title="${esc(tr('flux'))}">↻${fmt(flux)}</span>` : '') + (shield ? '' : '') + '</div>';
    }
    function snapshotBars() {
      for (const el of layer.querySelectorAll('[data-bar]')) {
        const v = el.dataset.v !== undefined, w = v ? el.parentElement.clientHeight : el.parentElement.clientWidth; if (!w) continue;
        bars[el.dataset.bar] = 100 * (v ? el.offsetHeight : el.offsetWidth) / w;
        if (el.dataset.left !== undefined) bars[el.dataset.bar + '@'] = 100 * (v ? w - el.offsetTop - el.offsetHeight : el.offsetLeft) / w;
      }
    }
    function animateBars() {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        for (const el of layer.querySelectorAll('[data-bar]')) {
          const v = el.dataset.v !== undefined;
          el.style[v ? 'height' : 'width'] = el.dataset.to + '%'; bars[el.dataset.bar] = Number(el.dataset.to);
          if (el.dataset.left !== undefined) { el.style[v ? 'bottom' : 'left'] = el.dataset.left + '%'; bars[el.dataset.bar + '@'] = Number(el.dataset.left); }
        }
      }));
    }
    // Short vertical bars (feedback 2026-10-29): HP and Mana side by side, the numbers beside them (nums), each changed
    // value floating its difference once.
    function vlayer(cls, key, to, bottom) {
      const from = bars[key] != null ? bars[key] : to, fromB = bars[key + '@'] != null ? bars[key + '@'] : bottom;
      return `<i class="${cls}" data-v data-bar="${key}" data-to="${to}"${bottom !== undefined ? ` data-left="${bottom}"` : ''} style="height:${from}%${bottom !== undefined ? `;bottom:${fromB}%` : ''}"></i>`;
    }
    function vbars(side) {
      const a = F.game.actors[side], pct = (v, m) => Math.max(0, Math.min(100, 100 * v / m)), hp = pct(a.hp, a.maxHP), mana = pct(a.resources.mana, a.kit.capacity), flux = pct(Math.min(a.flux, Math.max(0, a.kit.capacity - a.resources.mana)), a.kit.capacity);
      return `<span class="pf-vbars"><span class="pf-vt hp" title="${esc(tr('hpBar', { v: fmt(a.hp), max: fmt(a.maxHP) }))}">${vlayer('trail', side + 'vhpT', hp)}${vlayer('fill', side + 'vhp', hp)}</span>` +
        `<span class="pf-vt mana" title="${esc(tr('manaBar', { v: fmt(a.resources.mana), max: fmt(a.kit.capacity), flux: fmt(a.flux) }))}">${vlayer('trail', side + 'vmT', mana)}${vlayer('flux', side + 'vmF', flux, mana)}${vlayer('fill', side + 'vm', mana)}</span></span>`;
    }
    function num(side, kind) {
      const a = F.game.actors[side], value = kind === 'hp' ? a.hp : a.resources.mana, max = kind === 'hp' ? a.maxHP : a.kit.capacity, k = side + kind, prev = seen[k];
      if (prev && prev.v !== value) seen[k] = { v: value, d: value - prev.v, until: Date.now() + FRESH_MS };
      else if (!prev) seen[k] = { v: value, d: 0, until: 0 };
      const st = seen[k], fresh = Date.now() < st.until;
      const delta = fresh && Math.abs(st.d) >= 0.5 ? `<span class="pf-delta ${st.d < 0 ? 'neg' : 'pos'}">${st.d < 0 ? '−' : '+'}${fmt(Math.abs(st.d))}</span>` : '';
      return `<span class="pf-n ${kind}${fresh && st.d < 0 ? ' drop' : ''}"><span class="pf-k">${kind === 'hp' ? '♥' : '✦'}</span>${Math.round(value)}<small>/${Math.round(max)}</small>${kind === 'mana' && a.flux >= 0.5 ? `<small class="pf-flux" title="${esc(tr('flux'))}"> ↻${fmt(a.flux)}</small>` : ''}${delta}</span>`;
    }

    // ---- What the last exchange did ----
    // Per side: its move, what it did to the other (damage after defences, the defence that mattered, a spell effect
    // landing or not, Mana won), then the rest (constructs, blows that were on their way, poison, an ally, Haste's Impulse).
    function recap(h) {
      if (!h) return null;
      const ev = h.events || [], sides = [0, 1].map((s) => ({ side: s, id: h.pair[s], name: ['hold', 'release'].includes(h.pair[s]) ? h.actionNames[s] : sideLabel(h.pair[s], s), committed: h.committed && h.committed[s] !== h.pair[s] ? h.committed[s] : null,
        channel: h.channels && h.channels[s], dealt: 0, raw: 0, hits: 0, def: null, impact: false, applied: null, mana: 0, moved: null }));
      const extras = [], omenSeq = [0, 1].map(() => ({}));
      const moveHit = (e) => { const m = h.pair[e.source]; return !e.reflected && (e.id === m || (['hold', 'release'].includes(m) && e.id === h.channels[e.source])); };
      for (const e of ev) {
        if (e.type === 'hit') {
          const by = DEFENCE.find((d) => (e.by || []).includes(d)) || null;
          // Two parts of one blow on its way (The Long Wait): the spell part, then the Impact part, as they were scheduled.
          let impact = isImpact(e.id);
          const parts = (h.omens && h.omens[e.source] || []).filter((o) => o.id === e.id);
          if (parts.length && !moveHit(e)) { const k = omenSeq[e.source][e.id] = (omenSeq[e.source][e.id] || 0); impact = !!(parts[Math.min(k, parts.length - 1)] || {}).impact; omenSeq[e.source][e.id] = k + 1; }
          if (moveHit(e)) { const s = sides[e.source]; s.dealt += e.amount; s.raw += e.raw; s.hits++; s.impact = impact; if (by && (!s.def || DEFENCE.indexOf(by) < DEFENCE.indexOf(s.def))) s.def = by; }
          else extras.push({ kind: 'hit', source: e.source, target: e.target, id: e.id, n: e.amount, raw: e.raw, def: by, impact, reflected: e.reflected });
        } else if (e.type === 'applied') { if (e.id === h.pair[e.side]) sides[e.side].applied = e.outcome; else extras.push({ kind: 'applied', source: e.side, id: e.id, outcome: e.outcome }); }
        else if (e.type === 'reclaimed') sides[e.side].mana += e.amount;
        else if (e.type === 'moved') sides[e.side].moved = { id: e.id, n: e.amount, blocked: e.blocked };
        else if (e.type === 'constructEnded') extras.push({ kind: 'ended', id: e.id, source: (h.constructs || [[], []]).findIndex((l) => l.includes(e.id)) });
        else if (e.type === 'tormentCharged') extras.push({ kind: 'torment', target: e.side, n: e.value });
        else if (['froze', 'compelsCancel', 'hoarfrostCancel', 'witnessed', 'assist'].includes(e.type)) extras.push({ kind: e.type, side: e.side, id: e.id, index: e.index });
      }
      // Merge the ticks of one source on one target (two poison ticks, both parts of a blow) into one line with its parts.
      const merged = [];
      for (const x of extras) {
        const m = x.kind === 'hit' && merged.find((y) => y.kind === 'hit' && y.id === x.id && y.source === x.source && y.target === x.target && y.reflected === x.reflected);
        if (m) { m.parts.push({ n: x.n, impact: x.impact }); m.n += x.n; m.def = m.def || x.def; }
        else if (x.kind === 'ended' && merged.some((y) => y.kind === 'ended' && y.id === x.id)) continue;
        else merged.push(x.kind === 'hit' ? Object.assign({ parts: [{ n: x.n, impact: x.impact }] }, x) : x);
      }
      const delta = [0, 1].map((s) => (h.before && h.after ? { hp: h.after[s].hp - h.before[s].hp, mana: h.after[s].mana - h.before[s].mana } : { hp: 0, mana: 0 }));
      return { round: h.round, leader: h.leader, sides, extras: merged, delta, finish: h.finish || [], lines: h.lines || [] };
    }
    // A side's move in words: what it did to the other ("−7", "Parried", "Warded −4") or for itself ("+33 Mana").
    function outcome(rc, s) {
      const x = rc.sides[s], b = briefOf(s, x.id), out = [];
      if (x.hits) {
        if (x.def && x.dealt < x.raw - 0.5) out.push({ cls: 'def', text: tr('def.' + x.def) });
        out.push(x.dealt >= 0.5 ? { cls: x.impact ? 'dmg' : 'spell', text: tr('dealt', { n: fmt(x.dealt) }) } : { cls: 'none', text: x.def ? '' : tr('noDamage') });
      }
      // What this side's own move kept off the other's (Parry, Ward, Brace, a step aside, Reflect): the interaction.
      const o = rc.sides[1 - s], kept = o.hits && o.def && o.def !== 'construct' ? o.raw - o.dealt : 0;
      if (kept >= 0.5) out.push({ cls: 'def blocked', text: tr('blocked', { n: fmt(kept) }) });
      if (x.applied) out.push({ cls: x.applied === 'landed' ? 'ok' : 'def', text: tr('applied.' + x.applied) });
      if (x.mana >= 0.5) out.push({ cls: 'mana', text: tr('manaUp', { n: fmt(x.mana) }) });
      if (x.moved) out.push({ cls: x.moved.blocked ? 'def' : 'mana', text: x.moved.blocked ? tr('applied.blocked') : (label(x.moved.id) + ' ' + fmt(x.moved.n)) });
      const healed = rc.delta[s].hp > 0.5 && !rc.extras.some((e) => e.kind === 'hit' && e.target === s) ? rc.delta[s].hp : 0;
      if (healed && b.kind === 'heal') out.push({ cls: 'heal', text: tr('healed', { n: fmt(healed) }) });
      return out.filter((o) => o.text);
    }
    function extraText(x) {
      const who = (i) => nameOf(i);
      if (x.kind === 'hit') return { cls: x.impact ? 'dmg' : 'spell', icon: x.id, side: x.source, text: tr(x.reflected ? 'reflectedHit' : 'hits', { name: sideLabel(x.id, x.source), who: who(x.target), n: '' }).trim(), n: x.n, parts: x.parts, def: x.def, target: x.target };
      if (x.kind === 'applied') return { cls: 'def', icon: x.id, side: x.source, text: sideLabel(x.id, x.source) + ': ' + tr('applied.' + x.outcome) };
      if (x.kind === 'ended') return { cls: 'muted', icon: x.id, side: x.source, text: tr('ex.constructEnded', { name: sideLabel(x.id, Math.max(0, x.source)) }) };
      if (x.kind === 'torment') return { cls: 'dmg', icon: 'torment', side: 1 - x.target, text: tr('ex.torment', { who: who(x.target), n: fmt(x.n) }) };
      if (x.kind === 'froze') return { cls: 'muted', icon: 'frozen', side: x.side, text: tr('ex.froze', { who: who(x.side) }) };
      if (x.kind === 'assist') { const al = (F.fight.setting.allies || [])[x.index]; return { cls: 'ok', icon: x.id, side: 0, text: tr('ex.assist', { name: al ? al.name : '' }) }; }
      if (x.kind === 'witnessed') return { cls: 'muted', icon: x.id, side: 0, text: tr('ex.witnessed', { name: label(x.id) }) };
      return { cls: 'muted', icon: x.kind === 'compelsCancel' ? 'compel' : 'hoarfrost', side: 0, text: tr('ex.' + x.kind) };
    }

    // ---- What is on each side now, in plain words ----
    const castAt = (side, id) => { for (let k = F.history.length - 1; k >= 0; k--) if (F.history[k].pair[side] === id) return F.history[k].round; return undefined; };
    function appliedBy(k, side) {
      const prop = k === 'bound' ? 'bind' : 'poison', S = C().SPELLS; let best = null, at = -Infinity;
      for (const s of [1 - side, side]) for (const id of Object.keys(F.game.actors[s].kit.spells)) if (S[id] && S[id][prop]) { const c = castAt(s, id); const cc = c === undefined ? -1 : c; if (cc > at) { best = { id, side: s }; at = cc; } }
      return best;
    }
    // The spell in a kit that gives an effect: its own (Haste) or a creature's copy of the rule (Carapace for Ward).
    const sourceOf = (side, key) => { const S = C().SPELLS, ks = Object.keys(F.game.actors[side].kit.spells || {}); return ks.find((id) => id === key) || ks.find((id) => S[id] && S[id].rule === key) || key; };
    function statuses(side) {
      const game = F.game, r = game.round, a = game.actors[side], out = [];
      const span = (from, until) => ({ from, until, left: until == null || until === Infinity ? null : until - Math.max(r, from) + 1 });
      for (const [k, e] of Object.entries(a.effects)) {
        if (!e || (e.until !== null && e.until < r)) continue;
        if (k === 'lodestar') { out.push(Object.assign({ key: k, icon: 'lodestar', caster: side, spell: sourceOf(side, k), good: true, name: label('lodestar'), value: '+' + Math.round(e.value), text: tr('st.lodestar', { n: e.from, h: Math.round(e.value) }) }, span(r, e.from))); continue; }
        const by = k === 'bound' || k === 'poison' ? appliedBy(k, side) : null;
        const caster = by ? by.side : CAST_ON_FOE.has(k) ? 1 - side : side, spell = by ? by.id : k === 'compelled' ? 'compel' : sourceOf(caster, k);
        const v = Math.round(e.value || 0);
        const text = k === 'compelled' ? (a.compelAction && a.compelAction !== 'cancel' ? tr('st.compelled', { action: actionName(a.compelAction, side) }) : tr('st.compelledAny'))
          : k === 'tailwind' ? tr('st.tailwind', { n: v }) : k === 'poison' ? tr('st.poison', { n: v || '' }) : k === 'torment' ? tr('st.torment', { n: fmt(e.value || 1) })
          : EN['st.' + k] ? tr('st.' + k) : tr('st.generic');
        out.push(Object.assign({ key: k, icon: by ? by.id : EFFECT_ICON[k] || spell, iconSide: caster, caster, spell, good: !HARMFUL.has(k), cat: HARMFUL.has(k) ? 'bad' : GUARDING.has(k) ? 'guard' : 'buff', name: by ? sideLabel(by.id, by.side) : k === 'compelled' ? label('compel') : sideLabel(spell, caster),
          value: k === 'tailwind' ? '+' + v : k === 'poison' && v ? v : '', text }, span(e.from == null ? r : Math.max(r, e.from), e.until == null ? Infinity : e.until)));
      }
      if (a.channel) out.push({ key: 'channel', icon: a.channel.id, caster: side, spell: a.channel.id, good: true, cat: 'buff', channel: true, name: sideLabel(a.channel.id, side), value: a.channel.holds ? '×' + a.channel.holds : '',
        text: tr('st.channel', { holds: a.channel.holds }) + (a.channel.bank ? ' ' + tr('banked', { n: Math.round(a.channel.bank) }) : ''), left: null, from: r, until: Infinity });
      for (const c of a.constructs) out.push(Object.assign({ key: 'construct', construct: c, icon: c.id, caster: side, spell: c.id, good: true, cat: 'summon', summon: true, name: sideLabel(c.id, side),
        value: String(Math.round(Math.max(0, c.threshold - c.taken))), text: constructText(c, side) }, span(r, c.expires)));
      // Foresight is its caster's buff (feedback 2026-10-29), shown under the caster: the other side commits first, openly.
      const seen = game.earlyCommit[1 - side];
      if (seen > 0) out.push(Object.assign({ key: 'foresight', icon: 'foresight', caster: side, spell: 'foresight', good: true, cat: 'buff', name: sideLabel('foresight', side),
        value: '', text: side ? tr('st.foresightYou', { name: titleOf(1) }) : tr('st.foresightThey', { name: titleOf(1) }) }, span(r, r + seen - 1)));
      if (a.freezeUntil >= r) out.push({ key: 'frozen', icon: 'frozen', caster: side, good: false, cat: 'bad', name: tr('frozenName'), value: '', text: tr('st.frozen', { n: a.freezeUntil }), left: a.freezeUntil - r + 1, from: r, until: a.freezeUntil });
      if (a.rimeReady) out.push({ key: 'rime', icon: 'rime', caster: side, spell: 'rime', good: true, cat: 'guard', name: tr('rimeReady'), value: '', text: tr('st.rime'), left: null, from: r, until: Infinity });
      return out;
    }
    // A construct in words, from the core's own numbers (CONSTRUCTS and the summon's instance).
    function constructParts(c, side) {
      const spec = C().CONSTRUCTS[c.id] || {}, obj = (i) => (i === 0 ? tr('youObj') : nameOf(1)), owner = obj(side), foe = obj(1 - side), n = fmt(c.power);
      // The burst as the core scales it (its description's number), else the table's.
      let burst = spec.burst ? fmt(spec.burst) : null;
      try { const find = (v) => (v && typeof v === 'object' ? (v.k === 'd.construct.burst' ? v : Object.values(v).map(find).find(Boolean)) : null), b = find(C().describeData(F.game, side, c.id)); if (b && b.n != null) burst = C().renderText(b.n); } catch (e) { /* not in its kit */ }
      const effect = spec.action === 'heal' ? tr('cx.heal', { owner, n }) : tr(spec.action === 'strike' ? 'cx.strike' : 'cx.spell', { n, foe });
      return { effect, kind: spec.action === 'heal' ? 'heal' : spec.action === 'strike' ? 'dmg' : 'spell', power: n, blunt: fmt(c.reduction), left: Math.round(Math.max(0, c.threshold - c.taken)), threshold: Math.round(c.threshold), expires: c.expires,
        burst, owner, foe };
    }
    function constructText(c, side) {
      const p = constructParts(c, side);
      return [tr('cx.every', { effect: p.effect }), c.reduction >= 0.05 ? tr('cx.blunt', { owner: p.owner, n: p.blunt }) : '', tr('cx.breaks', { n: p.left, owner: p.owner }), tr('cx.ends', { n: p.expires }), p.burst ? tr('cx.burst', { n: p.burst }) : ''].filter(Boolean).join(' ');
    }
    // Blows on their way to `target` (the other side's omens), grouped by blow: when, how much, its parts, what stops it.
    function incoming(target) {
      const game = F.game, src = 1 - target, os = [];
      for (const o of game.actors[src].omens.filter((x) => x.due >= game.round).sort((a, b) => a.due - b.due)) {
        const g = os.find((x) => x.id === (o.id || 'omen') && x.due === o.due);
        if (g) g.parts.push({ n: Math.round(o.power), impact: !!o.impact }); else os.push({ id: o.id || 'omen', due: o.due, parts: [{ n: Math.round(o.power), impact: !!o.impact }] });
      }
      return os.map((o) => {
        let stops = ''; try { const d = C().describeData(game, src, o.id); stops = d && d.stops ? C().renderText(d.stops) : ''; } catch (e) { /* not in its kit */ }
        return Object.assign(o, { source: src, target, name: sideLabel(o.id, src), in: o.due - game.round, total: o.parts.reduce((a, p) => a + p.n, 0), stops });
      });
    }
    // Their move this exchange: being chosen, committed in the open (or compelled), or hidden until you commit.
    function their() {
      const C_ = C(), game = F.game;
      if (game.result) return { mode: 'over' };
      if (F.busy) return { mode: 'busy', mine: game.pending[0] || null };
      const pending = game.pending[1], forced = C_.isCompelled(game, 1) ? (pending || C_.legalActions(game, 1)[0]) : null, id = forced || pending;
      if (!id) return { mode: 'hidden' };
      const flavor = forced ? C_.compelledLine(sideLabel(id, 1), { names: F.names, side: 1 }) : C_.flavorLine(id, { channel: channelOf(1), round: game.round, names: F.names, side: 1, labels: labelsOf(1) });
      return { mode: forced ? 'forced' : 'shown', id, name: actionName(id, 1), brief: briefOf(1, id), flavor, text: describe(1, id) };
    }

    // ---- The player's actions ----
    const myTurn = () => !F.busy && !F.game.result && C().actorToMove(F.game) === 0 && !F.game.config.ai[0];
    const forcedLegal = (id) => (id === 'cancel' || id === 'break_free') && C().legalActions(F.game, 0).includes(id);
    function actionList() {
      const game = F.game, a = game.actors[0], C_ = C(), frozen = a.freezeUntil >= game.round, bound = !frozen && C_.has(game, 0, 'bound'), compelled = !frozen && !bound && C_.isCompelled(game, 0);
      const forced = frozen || bound || compelled || !!a.channel;
      const ids = forced ? C_.legalActions(game, 0) : ['strike', 'guard', 'reclaim'].concat(Object.keys(a.kit.spells));
      const prev = a.compelAction && a.compelAction !== 'cancel' ? a.compelAction : null;
      const seize = game.pending[1] === 'compel' && C_.actorToMove(game) === 0 && !C_.has(game, 0, 'shadowstep');
      const state = frozen ? tr('frozen') : bound ? tr('bound') : compelled ? (ids[0] !== 'cancel' ? tr('compelledYou', { action: actionName(ids[0], 0) }) : prev ? tr('compelledLost', { action: label(prev) }) : tr('compelledNone'))
        : a.channel ? tr('channel', { spell: label(a.channel.id) }) : seize ? tr('compelSeize') : '';
      const items = ids.map((id) => {
        const reason = forcedLegal(id) ? null : C_.available(game, 0, id), c = costs(0, id), b = briefOf(0, id);
        return { id, name: actionName(id, 0), short: ['hold', 'release'].includes(id) ? label(id) : actionName(id, 0), brief: b, mana: c.m, hp: c.h, price: price(0, id), reason, disabled: !myTurn() || !!reason, lv: roman(0, id), spell: !!C_.SPELLS[id] };
      });
      return { state, forced, items };
    }
    function commit(id = F.selected) {
      if (!id || !myTurn() || (!forcedLegal(id) && C().available(F.game, 0, id))) return;
      try { submit(id); pump(); } catch (e) { console.error(e); }
    }
    function pick(id) {
      if (view.pick === 'commit' || F.selected === id) return commit(id);
      F.selected = id; render();
    }

    // ---- Around the fight: the setting, a lesson's coach, the kit, the result ----
    function settingParts() {
      const C_ = C(), st = F.fight.setting || {}, rb = (C_.CONTEXTS && C_.CONTEXTS[st.context]) || {}, free = ((C_.COMBAT_TUNING || {}).settle || {}).healthFreeAbove, pct = (x) => Math.round((x || 0) * 100);
      if (st.tutorial || st.stakes === 'none') return { title: tr(st.tutorial ? 'lessonTitle' : 'freeTitle'), lines: [tr(st.tutorial ? 'lessonStakes' : 'nothingAtStake')] };
      const lines = [];
      if (free) lines.push(tr('healthBelow', { n: free }));
      if (rb.health === rb.mana) { if (rb.health) lines.push(tr('rebateBoth', { pct: pct(rb.health) })); }
      else { if (rb.health) lines.push(tr('rebateHealth', { pct: pct(rb.health) })); if (rb.mana) lines.push(tr('rebateMana', { pct: pct(rb.mana) })); }
      lines.push(st.observers ? tr('watched', { pct: pct(rb.renown) }) : tr('unwatched'));
      if (Object.keys((F.game.actors[0].kit || {}).spells || {}).some((id) => C_.SPELLS[id] && C_.SPELLS[id].group === 'forbidden')) lines.push(st.witnesses ? tr('witnessed') : tr('unwitnessed'));
      for (const a of st.allies || []) lines.push(tr('allyBeside', { name: a.name, spell: C_.label(a.spell) }));
      return { title: tr('context.' + st.context), lines };
    }
    function unfit() {
      if (F.history.length || F.game.result) return '';
      const p = F.fight.request.player, lines = [], full = ((C().COMBAT_TUNING || {}).condition || {}).healthFull || 30;
      if (p.health < full) lines.push(tr('unfitHealth', { n: Math.round(p.health), full }));
      if (p.mana < p.maxMana) lines.push(tr('unfitMana', { n: Math.round(p.mana), max: Math.round(p.maxMana) }));
      return lines.join(' ');
    }
    function coach() {
      const keys = (F.fight.setting && F.fight.setting.tutorial) || [];
      if (!keys.length || F.game.result) return '';
      return tr('coach.' + keys[Math.min(F.history.length, keys.length - 1)]);
    }
    const canLeave = () => { const st = F.fight.setting || {}; return !F.game.result && !st.tutorial && st.stakes === 'none'; };
    function leave() { if (done || F.game.result) return; C().concede(F.game, 0); done = true; const res = B().fightResult(F.fight); close(); opts.onDone(res); }
    function kitChoices() { const k = opts.kit; return k && k.slots && !F.history.length && !F.game.result && !F.moves ? k.slots.filter((x) => x.items.length > 1) : []; }
    function kitHtml() {
      const ch = kitChoices(); if (!ch.length) return '';
      return `<div class="pf-kit"><b>${esc(tr('kit'))}</b>` + ch.map((x) => `<label><small>${esc(opts.t('kit.slot.' + x.slot))}</small><select data-slot="${esc(x.slot)}">` +
        x.items.map((it) => `<option value="${esc(it.id)}"${it.id === x.worn ? ' selected' : ''}>${esc(it.name)}</option>`).join('') + '</select></label>').join('') + '</div>';
    }
    function reKit(slot, id) {
      const k = opts.kit; if (!k || F.moves) return;
      const mods = k.equip(slot, id);
      for (const x of k.slots) if (x.slot === slot) x.worn = id;
      const req = Object.assign({}, F.fight.request, { player: Object.assign({}, F.fight.request.player, { mods }) });
      F.fight = B().createFight(req, { content, difficulty: opts.difficulty || 'easy', foeName });
      F.game = F.fight.state; F.names = F.fight.names; bars = {}; seen = {};
      aiOverrides(); render(); pump();
    }
    const RESULT_BARS = ['health', 'mana', 'mood', 'renown', 'gold', 'alignment'];
    function resultHtml() {
      const r = F.game.result, won = r.winner === 0, lost = r.winner === 1, res = B().fightResult(F.fight);
      const ds = RESULT_BARS.filter((k) => res.deltas && res.deltas[k]).map((k) => { const n = res.deltas[k]; return `<span>${esc(opts.resName ? opts.resName(k) : k)} <b class="${n < 0 ? 'neg' : 'pos'}">${n < 0 ? '−' : '+'}${fmt(Math.abs(n))}</b></span>`; }).join('');
      // A mutual knockout (feedback 2026-10-29): said plainly, who committed first and that the winner's HP was kept.
      const tb = r.tiebreak ? `<p class="pf-tb"><b>${esc(tr(won ? 'tbTag' : 'tbTagLost'))}</b> ${esc(won ? tr('tbWon') : tr('tbLost', { name: titleOf(1) }))}</p>` : '';
      return `<div class="pf-result ${won ? 'win' : lost ? 'loss' : 'draw'}"><h2>${esc(won ? tr('win') : lost ? tr('lose') : tr('draw'))}</h2><p>${esc(tr('reason.' + r.reason))}</p>${tb}` +
        (ds ? `<div class="pf-net">${ds}</div>` : '') + `<button class="pf-primary" data-pf-done>${esc(tr('continue'))}</button></div>`;
    }
    function finish() { if (done) return; done = true; const res = B().fightResult(F.fight); close(); opts.onDone(res); }

    // ---- Sheets: the foe, a status, an action ----
    const sheetHead = (ico, title, sub) => `<header class="pf-sh-head">${ico}<div><b>${esc(title)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</div><button class="pf-close" data-close aria-label="${esc(tr('close'))}">×</button></header>`;
    function inspectHtml() {
      const game = F.game, a = game.actors[1], C_ = C(), forced = a.channel || a.freezeUntil >= game.round || C_.has(game, 1, 'bound') || C_.isCompelled(game, 1);
      const ids = forced ? C_.legalActions(game, 1) : ['strike', 'guard', 'reclaim'].concat(Object.keys(a.kit.spells));
      return sheetHead(`<span class="pf-pf">${portrait(1)}</span>`, nameOf(1), tr('sheetLine', { level: levelOf(1), hp: fmt(a.hp), maxHp: fmt(a.maxHP), mana: fmt(a.resources.mana), maxMana: a.kit.capacity })) +
        `<div class="pf-sk">${Object.keys(a.kit.skills).map((k) => `<span><small>${esc(opts.skillName ? opts.skillName(k) : k)}</small><i style="--w:${a.kit.skills[k]}%"></i><b>${a.kit.skills[k]}</b></span>`).join('')}</div>` +
        `<h4>${esc(forced ? tr('canDoNow') : tr('canDo'))}</h4><ul class="pf-kitlist">` + ids.map((id) => {
          const reason = C_.available(game, 1, id), b = briefOf(1, id);
          return `<li class="${reason ? 'off' : ''}"><span class="pf-ico">${icon(id, 1)}</span><div><b>${esc(actionName(id, 1))}${roman(1, id) ? ' ' + roman(1, id) : ''}</b> ${effHtml(b)} <span class="pf-price">${esc(price(1, id))}</span>${reason ? ` <em>${esc(reason)}</em>` : ''}<p>${esc(describe(1, id))}</p></div></li>`;
        }).join('') + '</ul>';
    }
    function statusHtml(side, idx) {
      const st = statuses(side)[idx]; if (!st) return '';
      const when = st.until === Infinity || st.until == null ? '' : st.left != null ? tr('turnsLeft', { n: st.left }) + ' · ' + tr('untilEx', { n: st.until }) : '';
      const full = st.spell ? describe(st.caster, st.spell) : '';
      let body = `<p class="pf-plain">${esc(st.text)}</p>`;
      if (st.construct) {
        const p = constructParts(st.construct, side);
        body = `<div class="pf-cx-facts"><span class="k-${p.kind}"><b>${p.power}</b><small>${esc(p.kind === 'heal' ? tr('healed', { n: '' }).trim() || 'heal' : tr(p.kind === 'dmg' ? 'impactNote' : 'spellNote'))}</small></span>` +
          (Number(p.blunt) ? `<span class="k-guard"><b>−${p.blunt}</b><small>${esc(tr('def.construct'))}</small></span>` : '') + `<span class="k-hp"><b>${p.left}</b><small>${esc(tr('cx.hp', { n: '' }).trim())}</small></span><span><b>${p.expires}</b><small>${esc(tr('lastExShort'))}</small></span></div>` + body;
      }
      return sheetHead(`<span class="pf-ico big ${st.good ? 'good' : 'bad'}">${icon(st.icon, st.iconSide != null ? st.iconSide : st.caster, st.icon)}</span>`, st.name, (side ? nameOf(1) : tr('you')) + (when ? ' · ' + when : '')) + body + (full && full !== st.text ? `<p class="pf-full">${esc(full)}</p>` : '');
    }
    function actionHtml(side, id) {
      const b = briefOf(side, id), sc = scales(id);
      return sheetHead(`<span class="pf-ico big">${icon(id, side)}</span>`, actionName(id, side) + (roman(side, id) ? ' ' + roman(side, id) : ''), price(side, id)) + `<p class="pf-plain">${effHtml(b)}</p><p class="pf-full">${esc(describe(side, id))}</p>` + (sc ? `<p class="pf-scales">${esc(sc)}</p>` : '');
    }
    function incomingHtml(target, idx) {
      const o = incoming(target)[idx]; if (!o) return '';
      return sheetHead(`<span class="pf-ico big bad">${icon(o.id, o.source)}</span>`, o.name, (o.in === 0 ? tr('landsNow') : o.in === 1 ? tr('landsNext') : tr('landsIn', { n: o.in })) + ' · ' + tr('exchange', { n: o.due })) +
        `<p class="pf-plain">${o.parts.map((p) => `<b class="${p.impact ? 'k-dmg' : 'k-spell'}">${p.n}</b> ${esc(tr(p.impact ? 'impactNote' : 'spellNote'))}`).join(' + ')}</p>` + (o.stops ? `<p class="pf-full">${esc(o.stops)}</p>` : '');
    }
    function historyHtml() {
      return sheetHead('', tr('history'), '') + '<ol class="pf-hist">' + F.history.slice().reverse().map((h) => `<li><b>${esc(tr('exchange', { n: h.round }))}</b>` +
        [h.leader, 1 - h.leader].map((i) => `<p class="${i ? 'opp' : 'you'}"><span class="pf-ico">${icon(h.pair[i], i, h.channels && h.channels[i])}</span><span>${esc(nameOf(i))} · ${esc(h.actionNames[i])}${h.lines && h.lines[i] ? ` <em>${esc(h.lines[i])}</em>` : ''}</span></p>`).join('') +
        (h.finish || []).map((f) => `<p class="fin"><em>${esc(f)}</em></p>`).join('') + '</li>').join('') + '</ol>';
    }
    function showSheet(kind) {
      F.sheet = kind; const el = $('.pf-sheet');
      if (!kind || !F.game) { el.hidden = true; el.innerHTML = ''; return; }
      const [k, a1, a2] = kind.split(':');
      const html = k === 'inspect' ? inspectHtml() : k === 'status' ? statusHtml(Number(a1), Number(a2)) : k === 'action' ? actionHtml(Number(a1), a2) : k === 'incoming' ? incomingHtml(Number(a1), Number(a2)) : k === 'history' ? historyHtml() : '';
      if (!html) { F.sheet = null; el.hidden = true; return; }
      el.hidden = false; el.innerHTML = `<div class="pf-sheet-card" role="dialog" aria-modal="true">${html}</div>`;
      el.onclick = (e) => { if (e.target === el || e.target.closest('[data-close]')) showSheet(null); };
    }
    function onKey(e) {
      if (e.key === 'Escape' && F.sheet) { e.preventDefault(); e.stopPropagation(); showSheet(null); return; }
      if (F.sheet || !F.game || e.target.closest && e.target.closest('select, input, textarea')) return;
      // Number keys pick an action (1–9, 0 for the tenth), Enter commits the picked one.
      const n = /^[0-9]$/.test(e.key) ? (e.key === '0' ? 9 : Number(e.key) - 1) : -1;
      if (n >= 0) { const it = actionList().items[n]; if (it && !it.disabled) { e.preventDefault(); pick(it.id); } }
      else if (e.key === 'Enter' && F.selected) { e.preventDefault(); commit(); }
    }
    document.addEventListener('keydown', onKey, true);

    // A brief as a chip: its value coloured by kind, its label and its turns.
    function effHtml(b) {
      const v = b.value !== '' && b.value !== null && b.value !== undefined;
      return `<span class="pf-eff k-${b.kind}">${v ? `<b>${esc(b.value)}</b>` : ''}${b.label ? `<small>${esc(b.label)}</small>` : ''}${b.turns ? `<small class="t">${b.turns}×</small>` : ''}</span>`;
    }
    const leaderNext = () => F.game.leader;

    // ---- Pieces every fork uses the same way ----
    // A side's statuses as chips (tap: its words): effects, a channel, a summon, Foresight, then the blows on their way to it.
    function chipsHtml(side, { incomingToo = true, compact = false } = {}) {
      // Compact (feedback 2026-10-29): the icon and one number (exchanges left, else its value); tap for the rest.
      if (compact) {
        const st = statuses(side).map((x, i) => {
          const cx = x.construct && constructParts(x.construct, side), n = x.left != null ? x.left : cx ? cx.power : x.value;
          return `<button class="pf-chip mini s-${x.key} c-${x.cat}" data-pf-sheet="status:${side}:${i}" title="${esc(x.name + (x.left != null ? ' · ' + tr('turnsLeft', { n: x.left }) : '') + ' · ' + x.text)}"><span class="pf-ico">${icon(x.icon, x.iconSide != null ? x.iconSide : x.caster, x.icon)}</span>${n !== '' && n != null ? `<b>${esc(n)}</b>` : ''}</button>`;
        });
        const inc = incomingToo ? incoming(side).filter((o) => o.in > 0).map((o) => `<button class="pf-chip mini inc c-bad" data-pf-sheet="incoming:${side}:${incoming(side).indexOf(o)}" title="${esc(o.name + ' · ' + tr('landsIn', { n: o.in }))}"><span class="pf-ico">${icon(o.id, o.source)}</span><b class="${o.parts.some((p) => !p.impact) ? 'k-spell' : 'k-dmg'}">${o.total}</b></button>`) : [];
        return st.concat(inc).join('');
      }
      const st = statuses(side).map((x, i) => {
        const cx = x.construct && constructParts(x.construct, side);
        const val = cx ? `<b class="k-${cx.kind}">${cx.kind === 'heal' ? '+' : ''}${cx.power}</b>` : x.value !== '' && x.value != null ? `<b>${esc(x.value)}</b>` : '';
        return `<button class="pf-chip${x.summon ? ' summon' : x.good ? '' : ' bad'}" data-pf-sheet="status:${side}:${i}" title="${esc(x.name + ' · ' + x.text)}"><span class="pf-ico">${icon(x.icon, x.iconSide != null ? x.iconSide : x.caster, x.icon)}</span><span class="pf-chip-n">${esc(x.name)}</span>${val ? ' ' + val : ''}${x.left != null ? `<span class="t" title="${esc(tr('turnsLeft', { n: x.left }))}">${x.left}</span>` : ''}</button>`;
      });
      const inc = incomingToo ? incoming(side).map((o, i) => (o.in === 0 ? '' : `<button class="pf-chip bad inc${o.in === 0 ? ' now' : ''}" data-pf-sheet="incoming:${side}:${i}" title="${esc(o.name + ' · ' + (o.in === 0 ? tr('landsNow') : tr('landsIn', { n: o.in })))}"><span class="pf-ico">${icon(o.id, o.source)}</span>${o.parts.map((p) => `<b class="${p.impact ? 'k-dmg' : 'k-spell'}">${p.n}</b>`).join('+')}<span class="t">${o.in}</span></button>`)).filter(Boolean) : [];
      return st.concat(inc).join('');
    }
    const pillsHtml = (list) => list.map((o) => `<span class="pf-pill ${o.cls}">${esc(o.text)}</span>`).join('');
    function extraHtml(x) {
      const e = extraText(x), num = x.kind === 'hit' ? (x.parts.length > 1 ? x.parts.map((p) => `<b class="${p.impact ? 'k-dmg' : 'k-spell'}">${fmt(p.n)}</b>`).join('+') : `<b class="${x.impact ? 'k-dmg' : 'k-spell'}">${x.n >= 0.5 ? '−' + fmt(x.n) : '0'}</b>`) : '';
      return `<span class="pf-x ${e.cls}${e.side ? ' opp' : ' you'}"><span class="pf-ico">${icon(e.icon, e.side < 0 ? 0 : e.side)}</span><span>${esc(e.text)}</span>${num}${x.def ? `<span class="pf-pill def">${esc(tr('def.' + x.def))}</span>` : ''}</span>`;
    }
    // The setting in one line (its title and first rule); the rest when opened.
    function settingHtml() { const p = settingParts(); return `<details class="pf-setting"><summary><b>${esc(p.title)}</b>${p.lines[0] ? ' · ' + esc(p.lines[0]) : ''}</summary>${p.lines.slice(1).map((l) => `<span>${esc(l)}</span>`).join('')}</details>`; }
    function aroundHtml({ setting = true } = {}) {
      const u = unfit(), k = coach();
      // The setting before the first exchange only (feedback 2026-10-29: room); the Log sheet keeps it. A fork that shows it
      // elsewhere (Arena: in the empty exchange panel, so nothing moves when it goes) passes setting: false.
      return (F.history.length || !setting ? '' : settingHtml()) + (u ? `<p class="pf-note">${esc(u)}</p>` : '') + kitHtml() + (k ? `<div class="pf-coach" role="note"><b>${esc(tr('coachTitle'))}</b> ${esc(k)}</div>` : '');
    }
    const leaveHtml = () => (canLeave() ? `<button class="pf-leave" data-pf-leave>${esc(tr('walkAway'))}</button>` : '');
    // The outline a fighter's panel glows with (feedback 2026-10-29): the ring by what matters most on it (a debuff, then a
    // defence, then a buff, then a summon), a second glow for the next; a blow landing on it now pulses.
    // Each status has its own colour and motion (feedback 2026-10-29: the outline changes with the buff): the most pressing
    // one draws the ring (base.css .a-<key>), the next adds its colour as a glow (.g-<key>).
    const AURA = ['frozen', 'bound', 'compelled', 'torment', 'poison', 'heartprice', 'ward', 'guard', 'reflect', 'shadowstep', 'brace',
      'haste', 'tailwind', 'eclipse', 'lodestar', 'channel', 'construct', 'foresight', 'rime'];
    function aura(side) {
      const keys = statuses(side).map((x) => x.key).filter((k) => AURA.includes(k)).sort((a, b) => AURA.indexOf(a) - AURA.indexOf(b));
      const now = incoming(side).some((o) => o.in === 0);
      return `pf-aura${keys[0] ? ' a-' + keys[0] : ''}${keys[1] ? ' g-' + keys[1] : ''}${now ? ' hit-now' : ''}`;
    }
    // What the last exchange did to a side, for its panel while the exchange is fresh: a hit (light, hard or heavy), a
    // blow kept off, a heal; and the number that pops over the portrait.
    // The fight's result when exchange h is the one that ended it in a mutual knockout, else null.
    const tiebreakIn = (h) => { const r = F.game.result; return r && r.tiebreak && h && h === F.history[F.history.length - 1] ? r : null; };
    function hitFx(side) {
      if (!F.fresh) return { cls: '', pop: '' };
      const h = F.history[F.history.length - 1], rc = recap(h); if (!rc || !h.before) return { cls: '', pop: '' };
      const tb = tiebreakIn(h); if (tb && tb.winner === side) return { cls: ' fx-block', pop: `<span class="pf-pop k-guard">${esc(tr('tbFirst'))}</span>` };
      const lost = h.before[side].hp - h.after[side].hp, o = rc.sides[1 - side], kept = o.hits && o.def && o.def !== 'construct' ? o.raw - o.dealt : 0;
      const spell = rc.extras.concat([]).some((x) => x.kind === 'hit' && x.target === side && !x.impact) || (o.hits && !o.impact && o.dealt >= 0.5);
      const cls = (lost >= 0.5 ? ' fx-hit ' + (lost >= 18 ? 'fx-heavy' : lost >= 8 ? 'fx-hard' : 'fx-light') : '') + (kept >= 0.5 ? ' fx-block' : '') + (lost <= -0.5 ? ' fx-heal' : '');
      const pop = lost >= 0.5 ? `<span class="pf-pop ${spell ? 'k-spell' : 'k-dmg'}${lost >= 18 ? ' big' : ''}">−${fmt(lost)}</span>` : kept >= 0.5 ? `<span class="pf-pop k-guard">${esc(tr('def.' + o.def))}</span>` : lost <= -0.5 ? `<span class="pf-pop k-heal">+${fmt(-lost)}</span>` : '';
      return { cls, pop };
    }

    // The last exchange as a ledger (feedback 2026-10-29): each side's move, what it did for itself, and everything it did to
    // the other (its move's hit, its summon, a blow that was on its way, poison), then the fight text.
    function ledger(h) {
      const rc = recap(h); if (!rc) return null;
      const to = [0, 1].map(() => []), self = [0, 1].map(() => []);
      for (const s of [0, 1]) {
        const x = rc.sides[s], b = briefOf(s, x.id);
        for (const o of outcome(rc, s)) (['mana', 'heal', 'def blocked'].includes(o.cls) ? self : to)[s].push(o);
        if (!x.hits && !x.applied && !x.moved && !x.mana && ['buff', 'guard'].includes(b.kind) && !self[s].length) self[s].push({ cls: 'up', text: b.label || '' });
      }
      for (const x of rc.extras) {
        const s = x.kind === 'hit' ? x.source : x.kind === 'torment' ? 1 - x.target : x.side != null ? x.side : x.source;
        if (s == null || s < 0) continue;
        if (x.kind === 'hit') to[s].push({ cls: 'x', html: `<span class="pf-ico">${icon(x.id, s)}</span>${esc(sideLabel(x.id, s))} ${x.n >= 0.5 ? '−' : ''}${x.parts.map((p) => `<b class="${p.impact ? 'k-dmg' : 'k-spell'}">${fmt(p.n)}</b>`).join('+')}${x.def ? ` <span class="pf-pill def">${esc(tr('def.' + x.def))}</span>` : ''}` });
        else { const e = extraText(x); (x.kind === 'ended' || x.kind === 'assist' ? self : to)[s].push({ cls: 'x', html: `<span class="pf-ico">${icon(e.icon, s)}</span>${esc(e.text)}` }); }
      }
      // The exchange that ended in a mutual knockout: the loser's blows never landed (the core gave the winner its HP back).
      const tb = tiebreakIn(h); if (tb) to[1 - tb.winner] = [{ cls: 'none void', text: tr('tbNever') }];
      return { rc, to, self, lines: [rc.leader, 1 - rc.leader].map((i) => ({ side: i, text: rc.lines[i] || '' })).filter((l) => l.text), finish: rc.finish };
    }
    const itemsHtml = (list) => list.map((o) => (o.html ? `<span class="pf-li">${o.html}</span>` : `<span class="pf-pill ${o.cls}">${esc(o.text)}</span>`)).join('');

    // This exchange (feedback 2026-10-29): what you are answering, said plainly. Telegraphed (they committed in the open),
    // compelled, hidden (you commit first, they answer), or being chosen; and any blow that lands now.
    function telegraphHtml() {
      const t = their(); if (t.mode === 'over') return '';
      const due = incoming(0).filter((o) => o.in === 0);
      const blow = due.map((o) => `<button class="pf-tg-blow" data-pf-sheet="incoming:0:${incoming(0).indexOf(o)}" title="${esc(o.stops)}"><span class="pf-ico">${icon(o.id, 1)}</span><span>${esc(tr('blowNow', { name: o.name }))}</span>${o.parts.map((p) => `<b class="${p.impact ? 'k-dmg' : 'k-spell'}">${p.n}</b>`).join('+')}${o.stops ? `<small>${esc(tr('whatStops'))} ›</small>` : ''}</button>`).join('');
      let main;
      if (t.mode === 'busy') main = `<div class="pf-tg wait"><span class="pf-tg-k">${esc(tr('tgThinking'))}</span><span class="pf-ico spin">${ICON.hourglass}</span><b>${esc(tr('waitingFor', { name: nameOf(1) }))}</b>${t.mine ? `<small>${esc(tr('youLocked', { move: actionName(t.mine, 0) }))}</small>` : ''}</div>`;
      else if (t.mode === 'hidden') main = `<div class="pf-tg hidden"><span class="pf-tg-k">${esc(tr('tgHidden'))}</span><span class="pf-ico">${ICON.eyeOff}</span><b>${esc(tr('tgHiddenText', { name: nameOf(1) }))}</b></div>`;
      else main = `<button class="pf-tg shown${t.mode === 'forced' ? ' forced' : ''}" data-pf-sheet="action:1:${esc(t.id)}"><span class="pf-tg-k">${esc(t.mode === 'forced' ? tr('tgForced') : tr('tgShown'))}</span><span class="pf-ico">${icon(t.id, 1)}</span><b>${esc(t.name)}</b>${effHtml(briefFor(1, t.id, t.name))}${t.flavor ? `<em>${esc(t.flavor)}</em>` : ''}</button>`;
      return `<section class="pf-now" aria-live="polite">${main}${blow}</section>`;
    }

    // The timeline (feedback 2026-10-29): the last few exchanges (both moves, the HP each side lost), this one, and the next
    // few (who commits first, blows landing), with each side's lasting effects as spans under its row.
    function leaderAt(c) { const g = F.game; if (!c) return g.leader; const e = g.earlyCommit.map((n) => n - c > 0), normal = c % 2 ? 1 - g.normalLeader : g.normalLeader; return e[0] === e[1] ? normal : e[0] ? 0 : 1; }
    // Compact (feedback 2026-10-29, as the live track): narrow columns for every exchange so far, now and the next few, kept
    // scrolled to now; the names stay put.
    function laneHtml({ past = Infinity, ahead = 4 } = {}) {
      const g = F.game, r = g.round, hs = F.history.slice(-past), fin = !!g.result, t = their(), inc = [incoming(0), incoming(1)], st = [statuses(0), statuses(1)];
      const cols = hs.map((h) => ({ past: h })).concat(fin ? [] : Array.from({ length: ahead + 1 }, (_, c) => ({ c, ex: r + c })));
      const head = cols.map((col) => col.past ? `<span class="pf-tl-h past" data-pf-sheet="history">${col.past.round}</span>` : `<span class="pf-tl-h${col.c ? '' : ' now'}" title="${esc((col.c ? tr('exchange', { n: col.ex }) : tr('nowShort')) + ' · ' + (leaderAt(col.c) ? tr('theyLead') : tr('youLead')))}">${col.ex}<i class="${leaderAt(col.c) ? 'opp' : 'you'}"></i></span>`).join('');
      const moveCell = (s, col) => {
        if (col.past) {
          const h = col.past, lost = h.before && h.after ? h.before[s].hp - h.after[s].hp : 0;
          return `<span class="pf-tl-c past" title="${esc(tr('exchange', { n: h.round }) + ' · ' + h.actionNames[s] + (lost >= 0.5 ? ' · ' + tr('hpLost', { n: fmt(lost) }) : ''))}"><span class="pf-ico">${icon(h.pair[s], s, h.channels && h.channels[s])}</span>${lost >= 0.5 ? `<small class="lost">${fmt(lost)}</small>` : ''}</span>`;
        }
        const out = [];
        if (col.c === 0) {
          if (s === 1) out.push(t.mode === 'busy' ? '<span class="pf-tok wait">…</span>' : t.id ? `<button class="pf-tok move${t.mode === 'forced' ? ' forced' : ''}" data-pf-sheet="action:1:${esc(t.id)}"><span class="pf-ico">${icon(t.id, 1)}</span></button>` : '<span class="pf-tok hid">?</span>');
          else if (F.selected || t.mine) out.push(`<span class="pf-tok mine"><span class="pf-ico">${icon(F.selected || t.mine)}</span></span>`);
        } else if (leaderAt(col.c) === s && s === 1) out.push(`<span class="pf-tok eye" title="${esc(tr('slotTheyLead', { n: col.ex }))}">${ICON.eye}</span>`);
        inc[s].forEach((o, k) => { if (o.due === col.ex) out.push(`<button class="pf-tok blow" data-pf-sheet="incoming:${s}:${k}" title="${esc(o.name + ' · ' + o.parts.map((p) => p.n).join(' + '))}"><b class="${o.parts.some((p) => !p.impact) ? 'k-spell' : 'k-dmg'}">${o.total}</b></button>`); });
        return `<span class="pf-tl-c${col.c === 0 ? ' now' : ''}">${out.join('')}</span>`;
      };
      const spans = (s) => st[s].map((x, idx) => {
        const cells = cols.map((col) => {
          if (col.past) return '<span class="pf-tl-s"></span>';
          const on = col.ex >= x.from && col.ex <= x.until, first = on && (col.ex === x.from || col.c === 0), last = on && col.ex === x.until;
          return `<span class="pf-tl-s">${on ? `<i class="c-${x.cat} s-${x.key}${first ? ' first' : ''}${last ? ' last' : ''}${x.until === Infinity && col.c === ahead ? ' open' : ''}">${first ? `<span class="pf-ico">${icon(x.icon, x.iconSide != null ? x.iconSide : x.caster, x.icon)}</span>` : ''}</i>` : ''}</span>`;
        }).join('');
        return `<div class="pf-tl-row span" data-pf-sheet="status:${s}:${idx}" title="${esc(x.name + ' · ' + x.text)}"><span class="pf-tl-w"></span>${cells}</div>`;
      }).join('');
      return `<section class="pf-tl" aria-label="${esc(tr('trackLabel'))}"><div class="pf-tl-scroll" data-stick="end"><div class="pf-tl-grid" style="--cols:${cols.length}">` +
        `<div class="pf-tl-row head"><span class="pf-tl-w"></span>${head}</div>` +
        [1, 0].map((s) => `<div class="pf-tl-side s${s}"><div class="pf-tl-row"><span class="pf-tl-w" title="${esc(nameOf(s))}">${esc(tagOf(s))}</span>${cols.map((col) => moveCell(s, col)).join('')}</div>${spans(s)}</div>`).join('') + '</div></div></section>';
    }

    // A brief whose label only repeats the move's name (Parry · Parry) says its role instead (feedback 2026-10-29).
    function briefFor(side, id, name) {
      const b = Object.assign({}, briefOf(side, id)), rule = (C().SPELLS[id] || {}).rule || id;
      if (b.label && String(b.label).toLowerCase() === String(name).toLowerCase() && EN['role.' + rule]) { b.label = tr('role.' + rule); b.turns = 0; }
      return b;
    }
    // The moves as a compact grid (feedback 2026-10-29): each with its icon, name, its brief (the number and what it is)
    // and its price; it wraps, and scrolls only past four rows. A picked move shows its rules under the grid with Cast, so the grid never moves (feedback 2026-10-29).
    function movesHtml() {
      const L = actionList(), sel = F.selected && L.items.find((x) => x.id === F.selected);
      const tile = (it, k) => `<button class="pf-mv${F.selected === it.id ? ' on' : ''} k-${it.brief.kind}" data-pf-act="${esc(it.id)}"${it.disabled ? ' disabled' : ''} title="${esc(it.name + ' · ' + it.price + (it.reason ? ' · ' + it.reason : ''))}">` +
        `<span class="pf-mv-top"><span class="pf-ico">${icon(it.id)}</span>${costHtml(it)}</span><span class="pf-mv-n">${esc(it.short)}${it.lv ? `<i>${it.lv}</i>` : ''}</span>${effHtml(briefFor(0, it.id, it.short))}${k < 10 ? `<kbd>${(k + 1) % 10}</kbd>` : ''}${engineOn ? `<i class="pf-eval" data-eval="${esc(it.id)}"></i>` : ''}</button>`;
      const read = sel ? `<div class="pf-read"><div data-pf-sheet="action:0:${esc(sel.id)}" role="button" tabindex="0"><b>${esc(sel.name)}</b> <span class="pf-price">${esc(sel.price)}</span><p>${esc(describe(0, sel.id))}</p></div><button class="pf-primary pf-go" data-pf-commit${myTurn() ? '' : ' disabled'}>${esc(sel.spell ? tr('cast') : tr('commit'))}</button></div>`
        : '';
      return (L.state ? `<p class="pf-state">${esc(L.state)}</p>` : '') + `<div class="pf-mvs${L.forced ? ' forced' : ''}" data-keep-scroll="moves">${L.items.map(tile).join('')}</div>` + read;
    }
    // ---- The engine's analysis (src/combat-ui.js, ported): a toggle, each move's score, the best move outlined, top lines ----
    const evalText = (v) => (v === undefined ? '…' : v >= 9000 ? 'KO' : v <= -9000 ? '−KO' : (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1));
    const live = () => engineOn && analysis && analysisFor === F.moves;
    function engineHtml() {
      if (!opts.engineHelp || F.game.result) return '';
      return `<section class="pf-engine${engineOn ? ' on' : ''}"><div class="pf-engine-top"><button class="pf-eng-toggle" aria-pressed="${engineOn}">${esc(tr('engine'))}</button>` +
        (engineOn ? `<b class="pf-engine-head"></b><select class="pf-eng-budget" aria-label="${esc(tr('engineTime'))}">${[500, 1500, 4000, Infinity].map((ms) => `<option value="${ms}"${ms === engineBudget ? ' selected' : ''}>${ms === Infinity ? '∞' : esc(tr('seconds', { n: ms / 1000 }))}</option>`).join('')}</select>` : '') +
        `</div>${engineOn ? '<div class="pf-engine-lines"></div>' : ''}</section>`;
    }
    function plyChip(p) {
      if (p.end) return `<span class="pf-ply end">${esc(tr(p.end === 'win' ? 'lineWin' : p.end === 'loss' ? 'lineLoss' : 'lineDraw'))}</span>`;
      return `<span class="pf-ply ${p.side ? 'opp' : 'you'}"><span class="pf-ico">${icon(p.id, p.side, p.channel)}</span>${esc(label(p.id))}</span>`;
    }
    function paintEngine() {
      if (closed) return;
      const head = layer.querySelector('.pf-engine-head'), lines = layer.querySelector('.pf-engine-lines');
      if (head) head.textContent = live() ? tr('engineHead', { depth: analysis.depth, nodes: Math.round(analysis.nodes / 1000), s: (analysis.ms / 1000).toFixed(1) }) + (analysisRunning ? ' · ' + tr('engineDeeper') : '') : myTurn() ? tr('engineThinking') : tr('engineWaits');
      if (lines) lines.innerHTML = live() ? '<ol>' + analysis.lines.slice(0, 3).map((l, k) => { let round = null; return `<li class="${k ? '' : 'best'}"><span class="pf-ev">${evalText(l.value)}</span><span>${l.line.map((p) => { const sep = !p.end && round !== null && p.round !== round ? '<i>|</i>' : ''; if (!p.end) round = p.round; return sep + plyChip(p); }).join('')}</span></li>`; }).join('') + '</ol>' : '';
      for (const b of layer.querySelectorAll('[data-pf-act]')) b.classList.toggle('best', !!live() && b.dataset.pfAct === analysis.best);
      for (const e of layer.querySelectorAll('[data-eval]')) { const x = live() ? analysis.scores[e.dataset.eval] : undefined; e.textContent = x === undefined ? '' : evalText(x); }
    }
    function requestAnalysis() {
      if (!engineOn || !myTurn() || analysisFor === F.moves) return;
      if (!analyst) analyst = C().createAnalyst({ update: (a) => { analysis = a; paintEngine(); }, done: () => { analysisRunning = false; paintEngine(); }, error: (m) => { console.error('[fight] engine analysis: ' + m); analysisRunning = false; paintEngine(); } });
      analysisFor = F.moves; analysis = null; analysisRunning = true;
      analyst.analyze(F.game, engineBudget === Infinity ? { budgetMs: Infinity } : { budgetMs: engineBudget, maxDepth: 8 });
    }
    function setEngine(on) {
      engineOn = !!on;
      if (!engineOn && analyst) { analyst.stop(); analysisRunning = false; analysis = null; analysisFor = -1; }
      if (opts.onEngineShown) opts.onEngineShown(engineOn);
      render();
    }
    const costHtml = (it) => `<span class="pf-cost">${it.mana ? `<b class="c-mana">${fmt(it.mana)}</b>` : ''}${it.hp ? `<b class="c-hp">${fmt(it.hp)}</b>` : ''}</span>`;

    function render() {
      if (closed || !F.game) return;
      snapshotBars();
      if (F.history.length !== animated) { freshUntil = Date.now() + FRESH_MS; animated = F.history.length; }
      F.fresh = Date.now() < freshUntil;
      const keep = [...layer.querySelectorAll('[data-keep-scroll]')].map((el) => [el.dataset.keepScroll, el.scrollTop, el.scrollLeft]);
      // The fight's own scroll and the focused control survive a render (feedback 2026-10-29: picking a move sent a phone
      // back to the top: the picked button, focused, was replaced, and the browser re-read the layout while the fight was empty).
      const top = layer.scrollTop, act = document.activeElement, focusSel = act && layer.contains(act) && ['data-pf-act', 'data-pf-sheet', 'data-pf-commit', 'data-pf-leave'].map((n) => act.hasAttribute(n) ? `[${n}${act.getAttribute(n) ? `="${CSS.escape(act.getAttribute(n))}"` : ''}]` : '').find(Boolean);
      // A piece the view keys (data-k) and that renders the same as before stays as it is, so an animation in it runs on
      // through a render (the foe's turn starting mid-exchange used to cut them short: feedback 2026-10-29). Bar widths
      // (inline styles) don't count as a change: the bars animate themselves.
      const wrap = $('.pf-wrap'), tpl = document.createElement('template'), sig = (el) => el.outerHTML.replace(/ style="[^"]*"/g, '');
      tpl.innerHTML = view.render(F);
      const old = new Map([...wrap.children].filter((el) => el.dataset.k).map((el) => [el.dataset.k, el]));
      wrap.replaceChildren(...[...tpl.content.children].map((el) => { const k = el.dataset.k, o = k && old.get(k), src = sig(el); if (o && o._sig === src) return o; el._sig = src; return el; }));
      if (F.fresh && !layer._freshTimer) layer._freshTimer = setTimeout(() => { layer._freshTimer = null; render(); }, Math.max(0, freshUntil - Date.now()) + 20);
      layer.scrollTop = top;
      if (focusSel) { const el = layer.querySelector(focusSel); if (el && el !== document.activeElement) el.focus({ preventScroll: true }); }
      for (const [k, top] of keep) { const el = layer.querySelector(`[data-keep-scroll="${k}"]`); if (el) el.scrollTop = el.dataset.stick === 'end' ? el.scrollHeight : top; }
      for (const el of layer.querySelectorAll('[data-stick="end"]')) { el.scrollTop = el.scrollHeight; el.scrollLeft = el.scrollWidth; }
      animateBars(); if (F.sheet) showSheet(F.sheet);
      for (const el of layer.querySelectorAll('[data-pf-sheet]')) {
        const go = (e) => { e.stopPropagation(); showSheet(el.dataset.pfSheet); };
        el.onclick = go; el.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(e); } };
      }
      for (const el of layer.querySelectorAll('[data-pf-act]')) el.onclick = () => pick(el.dataset.pfAct);
      for (const el of layer.querySelectorAll('[data-pf-commit]')) el.onclick = () => commit();
      for (const el of layer.querySelectorAll('[data-pf-leave]')) el.onclick = () => leave();
      const d = layer.querySelector('[data-pf-done]'); if (d) { d.onclick = finish; d.focus({ preventScroll: true }); }
      for (const sel of layer.querySelectorAll('.pf-kit select')) sel.onchange = () => reKit(sel.dataset.slot, sel.value);
      const et = layer.querySelector('.pf-eng-toggle'); if (et) et.onclick = () => setEngine(!engineOn);
      const eb = layer.querySelector('.pf-eng-budget'); if (eb) eb.onchange = () => { engineBudget = Number(eb.value); if (opts.onEngineBudget) opts.onEngineBudget(engineBudget); analysisFor = -1; analysis = null; requestAnalysis(); paintEngine(); };
      requestAnalysis(); paintEngine();
      if (view.bind) view.bind(F);
    }

    Object.assign(F, { C, B, render, pick, commit, myTurn, label, sideLabel, actionName, icon, describe, briefOf, price, costs, scales, roman, nameOf, levelOf, portrait, bar,
      titleOf, tagOf, recap, outcome, extraText, statuses, chipsHtml, vbars, num, aura, hitFx, engineHtml, ledger, itemsHtml, telegraphHtml, laneHtml, movesHtml, leaderAt, pillsHtml, extraHtml, settingHtml, aroundHtml, leaveHtml, costHtml, constructParts, incoming, their, actionList, settingParts, unfit, coach, canLeave, kitHtml, resultHtml, effHtml, showSheet, leaderNext });
    return { close, get state() { return F.game; } };
  }

  function autoResolve(request, content) {
    console.error('[fight] ' + request.id + ' was not played on screen: resolved by the AI');
    const search = { maxDepth: 2, nodeBudget: 2e4, mistakeChance: 0 };
    return root.CombatBridge.autoplay(root.CombatBridge.createFight(request, { content, ai: { player: Object.assign({ preset: 'medium' }, search), foe: search } }));
  }

  root.FightProto = { define, esc, fmt, ICON };
})(typeof self !== 'undefined' ? self : this);
