/*
 * The fight screen: a combat or duel challenge played in the combat minigame (combat/, build/combat.bundle.js), in the
 * stage in place of the card, which waits until the fight ends (HANDOFF §5; the host gets .fighting, src/combat.css). Ported from combat/web/app.mjs, the fight only: the fighters, the exchange track, the telegraph,
 * the square actions and the inspect sheet. None of the bench (setup, dock, engine view, journal, log), no header and no
 * concession: a fight runs until someone falls, a stalemate or a decision on points.
 *   CombatUI.open({host, request, content, t, difficulty, avatar, saved, onSave, onDone, engineHelp, engineShown, onEngineShown})
 *     request   the engine's fightRequest (eng.fightAhead(key))
 *     saved     a fight in progress to resume (what onSave was last handed)
 *     onSave    (snapshot) after every exchange: plain JSON, kept with the run (s.fightInProgress)
 *     onDone    (result) once, when the player leaves the result: the engine's result (choose(key, {fights: [result]}))
 *     engineHelp   the "engine analysis" setting (a cheat): a toggle in the fight shows the engine's analysis on the player's
 *                  turn (combat/web/analysis.mjs, in its own worker): an eval bar, each action's score, the best move outlined
 *                  and its top lines. engineShown is the toggle's last state; onEngineShown(on) when it changes.
 *                  engineBudget: its time per turn in ms (Infinity: it searches until the turn ends); onEngineBudget(ms).
 *     kit       (world expansion 1) the worn kit, changeable before the first exchange: {slots: [{slot, worn, items: [{id, name}]}],
 *               equip(slot, id) → the player's new modifiers}; the fight is set up again with them
 *   A card's fight may be a lesson (EVENTS `tutorial: [keys]`: a coach mark per exchange; `script`: the foe's first moves,
 *   CombatBridge.scriptedMove; no way out, as in every fight: feedback 2026-10-20) or carry nothing at stake
 *   (`stakes: none`: "Walk away" settles as a loss); either way the fight changes no bar.
 *   CombatUI.autoResolve(request, content)  a fight played by two AIs at once (a safety net; never the normal path)
 * Look: src/combat.css. Text: the UI's fight.* strings (src/i18n.js); the fight's own lines come from the minigame.
 */
(function (root) {
  'use strict';
  const C = () => root.LumenholdCombat, B = () => root.CombatBridge;
  const esc = (x) => String(x).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n) => (Number.isInteger(n) ? n : Math.abs(n - Math.round(n)) < 0.05 ? Math.round(n) : n.toFixed(1));
  const QUESTION = '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="32" cy="32" r="26"/><path d="M24 25a8 8 0 1 1 11 7.4c-2 .9-3 2.4-3 4.6v2"/><path d="M32 46v1"/></svg>';
  const EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  // A foe with no portrait (combat/web/art.mjs): a silhouette on a tint picked from the loadout, so each keeps one look.
  const TINTS = ['#628B90', '#7d6a9c', '#8c6f55', '#5e7d63', '#86606a', '#5a6f94', '#8a7d4e', '#6b7480'];
  const hash = (s) => [...String(s)].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);
  const SHAPES = {
    bust: '<circle cx="32" cy="25" r="11"/><path d="M11 60c1-13 10-20 21-20s20 7 21 20z"/>',
    hooded: '<path d="M32 10c-10 0-16 8-16 18v6c0 4 3 6 6 7l-11 19h42l-11-19c3-1 6-3 6-7v-6c0-10-6-18-16-18z"/><ellipse cx="32" cy="30" rx="7" ry="8" fill="#0b0f1d" opacity=".55"/>',
    hat: '<path d="M14 23h36l-4-3c-2-6-7-10-14-10s-12 4-14 10z"/><circle cx="32" cy="30" r="9"/><path d="M12 60c1-12 9-19 20-19s19 7 20 19z"/>',
    creature: '<path d="M24 12l-3-6M24 12l-6-1M24 12l1 8M40 12l3-6M40 12l6-1M40 12l-1 8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none"/><path d="M25 20c2-2 12-2 14 0l1 12c0 5-4 10-8 12-4-2-8-7-8-12z"/><path d="M14 60c2-10 9-16 18-16s16 6 18 16z"/>',
  };
  function placeholder(key, shape) {
    const tint = shape === 'hat' ? '#6b7480' : shape === 'creature' ? '#2c3348' : TINTS[hash(key) % TINTS.length];
    return '<svg viewBox="0 0 64 64" aria-hidden="true" class="ph"><rect width="64" height="64" fill="' + tint + '"/><g fill="#1a1f38" color="#1a1f38" opacity=".72">' + (SHAPES[shape] || SHAPES.bust) + '</g></svg>';
  }
  const BLANK = '<svg viewBox="0 0 64 64" aria-hidden="true" class="ph blank"><rect width="64" height="64" fill="#1b2043"/></svg>';
    const AHEAD = 4, CAST_ON_FOE = new Set(['compelled', 'torment']), EFFECT_ICON = { compelled: 'compel', guard: 'guard', frozen: 'frozen' };
  const RESULT_BARS = ['health', 'mana', 'mood', 'renown', 'gold', 'alignment'];
  const ENGINE_BUDGETS = [500, 1500, 4000, Infinity];
  const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V'];   // the engine analysis's time per turn, ms

  function open(opts) {
    const { host, content } = opts;
    const tr = (k, v) => opts.t('fight.' + k, v);
    const layer = document.createElement('div');
    layer.className = 'fight-layer'; layer.id = 'fightLayer';
    layer.innerHTML = '<div class="fight-wrap"><div class="fight-loading">' + esc(tr('loading')) + '</div></div><div class="sheet" hidden></div>';
    // The entrance (src/combat.css): the fight's panels rise over the card view, then the fight takes the card's place.
    const animate = document.documentElement.dataset.motion !== 'reduced' && !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    host.classList.add('fighting'); if (animate) host.classList.add('fight-enter'); host.appendChild(layer);
    let entered = !animate;
    const settleIn = () => { if (entered) return; entered = true; setTimeout(() => host.classList.remove('fight-enter'), 900); };
    const $ = (sel) => layer.querySelector(sel);
    let fight = null, game = null, names = null, history = [], selected = null, busy = false, moves = 0, bars = {}, seen = {}, sheet = null, focusEx = null, ai = null, closed = false, done = false;
    let analyst = null, analysis = null, analysisFor = -1, analysisRunning = false, engineOn = !!(opts.engineHelp && opts.engineShown);
    let engineBudget = ENGINE_BUDGETS.includes(opts.engineBudget) ? opts.engineBudget : 1500;

    const close = () => { closed = true; if (ai) ai.terminate(); if (analyst) analyst.terminate(); document.removeEventListener('keydown', onKey); layer.remove(); host.classList.remove('fighting', 'fight-enter'); };
    const foeName = (id, en) => C().tx('foe.' + id, en);
    const snapshot = () => ({ key: opts.key, request: fight.request, state: game, history, foe: fight.foe, setting: fight.setting, names, rules: fight.rules });

    C().init().then(() => {
      if (closed) return;
      if (opts.saved && opts.saved.state && opts.saved.request && opts.saved.request.id === opts.request.id) {
        const s = opts.saved;
        // The foe's name again, in the language the game is in now (a reload may have switched it).
        const foe = Object.assign({}, s.foe, B().foeOf(s.request, { content, foeName }));
        fight = { request: s.request, state: s.state, foe, setting: s.setting, rules: s.rules,
          names: C().fighterNames({ opponentName: foe.name, opponentLoadout: foe.loadout, opponentPronouns: foe.pronouns }) };
        history = s.history || [];
      } else {
        fight = B().createFight(opts.request, { content, difficulty: opts.difficulty || 'easy', foeName });
      }
      game = fight.state; names = fight.names;
      if (CombatUI.foeAI) game.config.ai[1] = Object.assign({}, game.config.ai[1], CombatUI.foeAI);
      if (CombatUI.playerAI) game.config.ai[0] = C().expandAI(Object.assign({ maxDepth: 2, nodeBudget: 2e4, mistakeChance: 0, seed: 7, preset: 'medium' }, CombatUI.playerAI), null);
      ai = C().createAI();
      render(); settleIn(); pump();
    }).catch((e) => { console.error(e); if (!closed) { close(); opts.onDone(autoResolve(opts.request, content)); } });

    // ---- Playing ----
    function submit(id) {
      const C_ = C(), channels = game.actors.map((a) => a.channel && a.channel.id), before = C_.cloneState(game), r = C_.applyChoice(game, id);
      moves++;
      if (analyst && analysisRunning) { analyst.stop(); analysisRunning = false; }   // that position is gone
      if (r.resolved) {
        const actionNames = r.pair.map((x, i) => (['hold', 'release'].includes(x) ? C_.label(x) + ' ' + C_.label(channels[i]) : C_.label(x)));
        history.push(Object.assign({}, r, { channels, lines: C_.resolvedLines(before, game, Object.assign({}, r, { channels, actionNames }), names), finish: C_.finishLines(before, game, r.pair, r.round, names), actionNames }));
        focusEx = null;
        if (opts.onSave) opts.onSave(snapshot());
      }
      selected = null; render();
    }
    // Whoever is to move but the player: the foe's AI (or, in a test, the player's own).
    function pump() {
      if (closed || !game || game.result) return;
      const side = C().actorToMove(game);
      if (side === 0 && !game.config.ai[0]) return;
      const actions = C().legalActions(game);
      if (actions.length === 1) { submit(actions[0]); pump(); return; }
      // A lesson's scripted foe (feedback 2026-10-20): its first moves are written, not searched.
      const scripted = side === 1 && B().scriptedMove(fight);
      if (scripted) { submit(scripted); pump(); return; }
      busy = side === 1; render();
      const at = moves;
      ai.choose(game, game.config.ai[side]).then((d) => { if (closed || at !== moves) return; busy = false; submit(d.id); pump(); })
        .catch((e) => { console.error(e); busy = false; render(); });
    }

    // ---- Pieces ----
    function actionIcon(id, side = 0, channel) {
      const C_ = C(); if (channel === undefined) channel = game.actors[side].channel && game.actors[side].channel.id;
      const key = ['hold', 'release'].includes(id) ? channel + '_' + id : id;
      return (C_.SPELL_ICONS || {})[id] || C_.ACTION_ICONS[key] || (C_.SPELLS[id] && C_.SPELLS[id].physical ? C_.ACTION_ICONS.strike : id === 'frozen' ? '<b class="glyph">❄</b>' : id === 'cancel' ? '<b class="glyph">∅</b>' : QUESTION);
    }
    // A lesson's foe standing still (its script's 'idle', the core's `cancel`) is idle, not a lost turn.
    const label = (id) => (id === 'cancel' && fight && fight.setting && fight.setting.script ? tr('idle') : C().label(id));
    // A creature's own name for a base rule (kit.labels: {shadowstep: 'skitter'}, world expansion 1).
    const labelsOf = (side) => (game.actors[side].kit && game.actors[side].kit.labels) || null;
    const sideLabel = (id, side) => { const l = labelsOf(side); return label(l && l[id] ? l[id] : id); };
    const actionName = (id, side) => (['hold', 'release'].includes(id) ? label(id) + ' ' + sideLabel((game.actors[side].channel && game.actors[side].channel.id) || '', side) : sideLabel(id, side));
    // Blows on their way to the player (an Omen's, a delayed blow's: the foe's omens): when each lands, for how much, and what
    // stops it (combat/web/app.mjs incoming(), F5.11).
    function incoming() {
      const C_ = C(), os = [];
      // A blow with a spell part and an Impact part (The Long Wait) queues two omens: one line, its total and its split.
      for (const o of game.actors[1].omens.filter((x) => x.due >= game.round).sort((a, b) => a.due - b.due)) {
        const g = os.find((x) => x.id === (o.id || 'omen') && x.due === o.due);
        if (g) g.parts.push(o); else os.push({ id: o.id || 'omen', due: o.due, parts: [o] });
      }
      return os.map((o) => {
        const id = o.id, now = o.due === game.round, k = o.due - game.round;
        const n = Math.round(o.parts.reduce((a, p) => a + p.power, 0)), split = o.parts.length > 1 ? ' ' + tr('incomingSplit', { parts: o.parts.map((p) => '<span class="split-' + (p.impact ? 'impact' : 'spell') + '">' + Math.round(p.power) + ' ' + esc(tr(p.impact ? 'impactNote' : 'spellNote')) + '</span>').join(' + ') }) : '';
        let stops = ''; try { const d = C_.describeData(game, 1, id); stops = d && d.stops ? C_.renderText(d.stops) : id === 'omen' ? describe(1, id) : ''; } catch (e) { /* not in its kit */ }
        const when = k === 1 ? tr('whenNext') : tr('whenIn', { k });
        const head = (now ? tr('incomingNow', { move: sideLabel(id, 1), n }) : tr('incomingLater', { move: sideLabel(id, 1), n, ex: o.due, when }));
        return '<div class="intent incoming' + (now ? ' now' : '') + '"><span class="tele-icon">' + actionIcon(id, 1) + '</span><div class="it"><b>' + esc(head) + split + '</b>' + (stops ? '<small>' + esc(stops) + '</small>' : '') + '</div></div>';
      }).join('');
    }
    const describe = (side, id) => { try { return C().describe(game, side, id); } catch (e) { return ''; } };
    // The skill a spell scales with (feedback 2026-10-19), under its description; nothing for an action that isn't a spell.
    const scales = (id) => {
      const sp = content && content.spells && content.spells[id]; if (!sp) return '';
      const sk = String(sp.skill || '').split(/[,\s]+/).filter(Boolean).map((k) => (opts.skillName ? opts.skillName(k) : k));
      return '<small class="scales">' + esc(sk.length ? opts.t('spell.scales', { skill: sk.join(' + ') }) : opts.t('spell.flat')) + '</small>';
    };
    const briefOf = (side, id) => { let d = null; try { d = C().describeData(game, side, id); } catch (e) { /* not an action now */ } return C().brief(id, d, game.actors[side].channel && game.actors[side].channel.id); };
    const effHtml = (b, name) => {
      const v = b.value !== '' && b.value !== null && b.value !== undefined;
      return '<span class="eff k-' + b.kind + (v ? ' has-v' : '') + '">' + (v ? '<b>' + esc(b.value) + '</b>' : '') +
        (b.label ? '<small class="lbl' + (name && name.toLowerCase() === b.label.toLowerCase() ? ' same' : '') + '">' + esc(b.label) + '</small>' : '') + (b.turns ? '<small class="t">' + b.turns + 't</small>' : '') + '</span>';
    };
    const costs = (side, id) => { const C_ = C(); return { h: C_.hpCost(game, side, id), m: C_.has(game, side, 'heartprice') ? 0 : C_.cost(game, side, id) }; };
    const price = (side, id) => { const { h, m } = costs(side, id); return [m ? tr('mana', { n: fmt(m) }) : '', h ? tr('hp', { n: fmt(h) }) : ''].filter(Boolean).join(' + ') || tr('free'); };
    const costHtml = (side, id) => { const { h, m } = costs(side, id); return '<span class="a-cost">' + (m ? '<b class="c-mana" aria-label="' + esc(tr('mana', { n: fmt(m) })) + '">' + fmt(m) + '</b>' : '') + (h ? '<b class="c-hp" aria-label="' + esc(tr('hp', { n: fmt(h) })) + '">' + fmt(h) + '</b>' : '') + '</span>'; };
    const nameOf = (i) => (i === 0 ? tr('you') : fight.foe.name);
    // The level shown for a fighter: the average of their six skills (a player's kit.level is their best skill, a label the
    // rules never read; a generated foe's skills already average its level).
    // A spell's level in a fighter's kit (I–III), shown on the action buttons and in the opponent's sheet; 0 (not shown)
    // for a spell with one level.
    const spellLevel = (side, id) => { const d = C().SPELLS[id]; return d && d.levels > 1 ? (game.actors[side].kit.spells || {})[id] || 0 : 0; };
    const lvBadge = (side, id) => (spellLevel(side, id) ? '<small class="a-lv" title="' + esc(tr('spellLevel', { n: ROMAN[spellLevel(side, id)] })) + '">' + ROMAN[spellLevel(side, id)] + '</small>' : '');
    const levelOf = (i) => { const v = Object.values(game.actors[i].kit.skills || {}).filter(Number.isFinite); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : game.actors[i].kit.level; };
    const who = (i) => (i ? esc(nameOf(1)) : esc(tr('you')));
    function portraitOf(i) {
      if (i === 0) return BLANK;
      const f = fight.foe, C_ = C(), npc = f.npc && content.npcs[f.npc];
      if (npc && opts.avatar) return opts.avatar(Object.assign({ id: f.npc }, npc), 48);
      const k = C_.SPECIAL_LOADOUTS[f.loadout] ? 'creature' : f.loadout === 'The man in grey' ? 'hat' : game.actors[1].kit.underground ? 'hooded' : 'bust';
      return placeholder(f.loadout, k);
    }

    // Bars: layers start at their last shown width and move on the next frame, so a re-render mid-animation doesn't snap;
    // a changed value floats its difference once (re-renders don't replay it).
    function layerHtml(cls, key, to, left) {
      const from = bars[key] != null ? bars[key] : to, fromLeft = bars[key + '@'] != null ? bars[key + '@'] : left;
      return '<i class="' + cls + '" data-bar="' + key + '" data-to="' + to + '"' + (left !== undefined ? ' data-left="' + left + '"' : '') + ' style="width:' + from + '%' + (left !== undefined ? ';left:' + fromLeft + '%' : '') + '"></i>';
    }
    function bar(side, kind, value, max, flux = 0, shield = 0) {
      const k = side + kind, pct = (v) => Math.max(0, Math.min(100, 100 * v / max)), now = pct(value), fluxShown = Math.min(flux, Math.max(0, max - value)), prev = seen[k];
      let delta = '';
      if (prev && prev.v !== value && prev.at !== moves) seen[k] = { v: value, at: moves, d: value - prev.v, fresh: true };
      else if (!prev) seen[k] = { v: value, at: -1, d: 0 };
      const s = seen[k], fresh = s.fresh; s.fresh = false;
      if (fresh && Math.abs(s.d) >= 0.5) delta = '<span class="delta ' + (s.d < 0 ? 'neg' : 'pos') + '">' + (s.d < 0 ? '−' : '+') + fmt(Math.abs(s.d)) + '</span>';
      const title = (kind === 'hp' ? tr('hpBar', { v: fmt(value), max: fmt(max) }) : tr('manaBar', { v: fmt(value), max: fmt(max), flux: fmt(flux) }));
      return '<div class="bar ' + kind + ' ' + (fresh && s.d ? (s.d < 0 ? 'drop' : 'rise') : '') + '" title="' + esc(title) + '">' +
        '<span class="bnum"><span class="bk">' + (kind === 'hp' ? '♥' : '✦') + '</span>' + Math.round(value) + '<small>/' + Math.round(max) + '</small>' + delta + '</span>' +
        '<span class="btrack">' + layerHtml('trail', k + 'trail', now) + (kind === 'mana' ? layerHtml('flux', k + 'flux', pct(fluxShown), now) : '') + layerHtml('fill', k + 'fill', now) +
        (kind === 'hp' ? layerHtml('shield', k + 'shield', pct(shield), Math.max(0, Math.min(now, 100 - pct(shield)))) : '') + '</span>' +
        (kind === 'mana' ? '<span class="bflux' + (flux > 0 ? '' : ' none') + '" title="' + esc(tr('flux')) + '">↻' + fmt(flux) + '</span>'
          : '<span class="bshield' + (shield > 0 ? '' : ' none') + '" title="' + esc(tr('shield')) + '">' + (shield > 0 ? '◈' + Math.round(shield) : '') + '</span>') + '</div>';
    }
    function snapshotBars() {
      for (const el of layer.querySelectorAll('[data-bar]')) {
        const w = el.parentElement.clientWidth; if (!w) continue;
        bars[el.dataset.bar] = 100 * el.offsetWidth / w;
        if (el.dataset.left !== undefined) bars[el.dataset.bar + '@'] = 100 * el.offsetLeft / w;
      }
    }
    function animateBars() {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        for (const el of layer.querySelectorAll('[data-bar]')) {
          el.style.width = el.dataset.to + '%'; bars[el.dataset.bar] = Number(el.dataset.to);
          if (el.dataset.left !== undefined) { el.style.left = el.dataset.left + '%'; bars[el.dataset.bar + '@'] = Number(el.dataset.left); }
        }
      }));
    }
    const constructChips = (a, i) => a.constructs.map((c) => {
      const left = Math.round(Math.max(0, c.threshold - c.taken));
      return '<span class="cx" title="' + esc(tr('construct', { name: label(c.id), left, of: Math.round(c.threshold), until: c.expires })) + '"><span class="mini-icon">' + actionIcon(c.id, i) + '</span>♥' + left + '</span>';
    }).join('');
    function fighter(i) {
      const a = game.actors[i];
      const purse = [a.resources.crowns !== a.entry.crowns ? '◎' + fmt(a.resources.crowns) : '', a.resources.alignment !== a.entry.alignment ? '☾' + fmt(a.resources.alignment) : ''].filter(Boolean).join(' ');
      return '<article class="fighter ' + (i ? 'opp' : 'you') + '"' + (i ? ' data-sheet="inspect" role="button" tabindex="0" title="' + esc(tr('inspect')) + '"' : '') + '>' +
        '<div class="pf' + (i ? '' : ' blank') + '">' + portraitOf(i) + (i ? '<span class="pf-eye">' + EYE + '</span>' : '') + '</div>' +
        '<div class="fi"><div class="fname"><b>' + esc(nameOf(i)) + '</b><small>' + esc(tr('lv', { n: levelOf(i) })) + (purse ? ' · ' + purse : '') + '</small>' + constructChips(a, i) + '</div>' +
        bar(i, 'hp', a.hp, a.maxHP) + bar(i, 'mana', a.resources.mana, a.kit.capacity, a.flux) + '</div></article>';
    }
    // Blows on their way first, then their move.
    function intent() { return game.result ? '' : incoming() + theirMove(); }
    // Their move: committed and shown, compelled, or hidden until the player commits.
    function theirMove() {
      if (game.result) return '';
      const C_ = C(), opponent = game.pending[1], forced = C_.isCompelled(game, 1) ? (opponent || C_.legalActions(game, 1)[0]) : null, shown = forced || opponent;
      if (busy) return '<div class="intent wait"><span class="tele-icon hidden-move">' + QUESTION + '</span><div class="it"><b>' + esc(tr('choosing', { name: nameOf(1) })) + '</b><small>' + esc(tr('choosingHint')) + '</small></div></div>';
      if (shown) {
        const b = briefOf(1, shown), fl = forced ? C_.compelledLine(sideLabel(shown, 1), { names, side: 1 }) : C_.flavorLine(shown, { channel: game.actors[1].channel && game.actors[1].channel.id, round: game.round, names, side: 1, labels: labelsOf(1) });
        return '<div class="intent shown' + (forced ? ' forced' : '') + '" data-sheet="intent" role="button" tabindex="0" title="' + esc(tr('theirMove')) + '"><span class="tele-icon">' + actionIcon(shown, 1) + '</span><div class="it"><b>' +
          esc(forced ? tr('compelled') : tr('theyCommit')) + ' ' + esc(actionName(shown, 1)) + ' ' + effHtml(b) + '</b>' + (fl ? '<small class="flavor">' + esc(fl) + '</small>' : '') + '</div><span class="it-more">' + EYE + '</span></div>';
      }
      return '<div class="intent hidden"><span class="tele-icon hidden-move">' + QUESTION + '</span><div class="it"><b>' + esc(tr('youFirst')) + '</b><small>' + esc(tr('youFirstHint')) + '</small></div></div>';
    }

    // The exchange track: the past (both moves), this exchange and the next few, with every lasting effect as a line.
    function leaderAt(c) { if (!c) return game.leader; const e = game.earlyCommit.map((n) => n - c > 0), normal = c % 2 ? 1 - game.normalLeader : game.normalLeader; return e[0] === e[1] ? normal : e[0] ? 0 : 1; }
    const castAt = (side, id) => { for (let k = history.length - 1; k >= 0; k--) if (history[k].pair[side] === id) return history[k].round; return undefined; };
    // The spell behind a Bind or a poison on `side`: the caster's (or, reflected, its own) bind or poison spell cast last.
    function appliedBy(k, side) {
      const prop = k === 'bound' ? 'bind' : 'poison', S = C().SPELLS; let best = null, at = -Infinity;
      for (const s of [1 - side, side]) for (const id of Object.keys(game.actors[s].kit.spells)) if (S[id] && S[id][prop]) { const c = or(castAt(s, id), -1); if (c > at) { best = { id, side: s }; at = c; } }
      return best;
    }
    const or = (a, b) => (a === undefined || a === null ? b : a);
    function effectRows() {
      const r = game.round, rows = [];
      game.actors.forEach((a, side) => {
        for (const [k, e] of Object.entries(a.effects)) {
          if (!e || (e.until !== null && e.until < r)) continue;
          // A Lodestar is forecast like a blow on its way: its icon and its heal, in green, on the exchange it matures.
          if (k === 'lodestar') { rows.push({ side, icon: 'lodestar', name: label('lodestar'), due: e.from, heal: true, note: '+' + Math.round(e.value), tip: tr('lodestarUp', { n: Math.round(e.value) }) }); continue; }
          const by = k === 'bound' || k === 'poison' ? appliedBy(k, side) : null;
          if (by) { rows.push({ side: by.side, icon: by.id, name: sideLabel(by.id, by.side), on: by.side === side ? null : side, from: or(e.from, or(e.born, r)), until: or(e.until, Infinity), note: '' }); continue; }
          const on = CAST_ON_FOE.has(k);
          rows.push({ side: on ? 1 - side : side, icon: EFFECT_ICON[k] || k, name: k === 'compelled' ? label('compel') : label(k), on: on ? side : null, from: or(e.from, or(e.born, r)), until: or(e.until, Infinity),
            note: k === 'tailwind' ? tr('tailwindChain', { n: Math.round(e.value) }) : '' });
        }
        if (a.channel) rows.push({ side, icon: a.channel.id, name: sideLabel(a.channel.id, side), from: or(castAt(side, a.channel.id), r), until: Infinity, note: tr('holds', { n: a.channel.holds }) + (a.channel.bank ? ' · ' + tr('banked', { n: Math.round(a.channel.bank) }) : '') + (a.channel.id === 'wildfire' ? ' · ' + tr('nextBurn', { n: 2 * (a.channel.holds + 2) }) : '') });
        for (const c of a.constructs) rows.push({ side, icon: c.id, name: sideLabel(c.id, side), from: or(castAt(side, c.id), r), until: c.expires, note: tr('hpOf', { left: Math.round(Math.max(0, c.threshold - c.taken)), of: Math.round(c.threshold) }) });
        if (game.earlyCommit[side] > 0) rows.push({ side: 1 - side, on: side, icon: 'foresight', name: label('foresight'), from: or(castAt(1 - side, 'foresight'), r - 1) + 1, until: r + game.earlyCommit[side] - 1, note: side ? tr('theyFirst') : tr('youFirst') });
        if (a.freezeUntil >= r) rows.push({ side, icon: 'frozen', name: tr('frozenName'), from: a.freezeUntil, until: a.freezeUntil, note: '' });
        if (a.rimeReady) rows.push({ side, icon: 'rime', name: tr('rimeReady'), from: or(castAt(side, 'rime'), r), until: Infinity, note: '' });
        for (const o of a.omens) rows.push({ side, icon: o.id || 'omen', name: label(o.id || 'omen'), due: o.due, spell: !o.impact, note: fmt(o.power) + ' ' + tr(o.impact ? 'impactNote' : 'spellNote') });
      });
      return rows;
    }
    function futureSlot(side, c) {
      const ex = game.round + c, a = game.actors[side], lead = leaderAt(c) === side, last = a.compelAction || null, comp = a.effects.compelled;
      if (a.freezeUntil >= ex) return '<span class="slot lost" title="' + esc(tr('slotFrozen', { n: ex, who: side ? nameOf(1) : tr('you') })) + '">' + actionIcon('frozen', side) + '</span>';
      if (comp && comp.until !== null && comp.until >= ex && last) {
        const lost = last === 'cancel' || !!C().available(game, side, last);
        return '<span class="slot forced' + (lead ? ' lead' : '') + '" title="' + esc(tr(lost ? 'slotCompelledLost' : 'slotCompelled', { n: ex, action: label(last) })) + '">' + actionIcon(lost ? 'cancel' : last, side) + '</span>';
      }
      if (side) return lead ? '<span class="slot shows lead" title="' + esc(tr('slotTheyLead', { n: ex })) + '">' + EYE + '</span>' : '<span class="slot hid" title="' + esc(tr('slotYouLead', { n: ex })) + '">?</span>';
      return lead ? '<span class="slot lead mine" title="' + esc(tr('slotYouLead', { n: ex })) + '">' + esc(tr('first')) + '</span>' : '<span class="slot open"></span>';
    }
    function nowSlot(side) {
      const C_ = C();
      if (side === 0) return '<span class="slot now-you' + (leaderAt(0) === 0 ? ' lead' : '') + '" data-now title="' + esc(tr('yourMove')) + '">' + (selected ? actionIcon(selected) : leaderAt(0) === 0 ? esc(tr('first')) : '') + '</span>';
      const forced = C_.isCompelled(game, 1) ? (game.pending[1] || C_.legalActions(game, 1)[0]) : null, shown = forced || game.pending[1];
      if (busy) return '<span class="slot hid wait" title="' + esc(tr('choosing', { name: nameOf(1) })) + '">…</span>';
      if (shown) return '<button class="slot shows lead' + (forced ? ' forced' : '') + '" data-sheet="intent" title="' + esc((forced ? tr('compelled') : tr('theyCommit')) + ' ' + actionName(shown, 1)) + '">' + actionIcon(shown, 1) + '</button>';
      return '<span class="slot hid" title="' + esc(tr('youFirstHint')) + '">?</span>';
    }
    function track() {
      const r = game.round, shown = focusEx !== null ? focusEx : history.length - 1, rows = effectRows(), fin = !!game.result;
      const pastCells = (f) => history.map((h, k) => '<span class="tk-c past' + (k === shown ? ' on' : '') + (k === history.length - 1 ? ' last' : '') + '">' + f(h, k) + '</span>').join('');
      const ahead = (f) => (fin ? '' : Array.from({ length: AHEAD + 1 }, (_, c) => '<span class="tk-c ' + (c ? 'fut' : 'now') + '">' + f(c) + '</span>').join(''));
      const head = '<div class="tk-row tk-head"><span class="tk-l"></span>' + pastCells((h, k) => '<button data-ex="' + k + '" title="' + esc(tr('exchangeShow', { n: h.round })) + '">' + h.round + '</button>') +
        ahead((c) => '<b title="' + esc(tr('exchange', { n: r + c }) + ': ' + (leaderAt(c) ? tr('theyLead') : tr('youLead'))) + '">' + (r + c) + '</b>') + '</div>';
      const movesRow = (side) => '<div class="tk-row tk-act s' + side + '"><span class="tk-l"><span class="tk-who">' + who(side) + '</span></span>' +
        pastCells((h, k) => '<button class="mini-icon" data-ex="' + k + '" title="' + esc(tr('exchange', { n: h.round }) + ': ' + (side ? nameOf(1) : tr('you')) + ' · ' + h.actionNames[side]) + '">' + actionIcon(h.pair[side], side, h.channels && h.channels[side]) + '</button>') +
        ahead((c) => (c ? futureSlot(side, c) : nowSlot(side))) + '</div>';
      const cell = (row, at) => {
        const past = typeof at === 'object', ex = past ? at.round : r + at, c = past ? -1 : at;
        const tip = esc((row.side ? nameOf(1) : tr('you')) + ' · ' + row.name + (row.on != null ? ' → ' + (row.on ? nameOf(1) : tr('you')) : '') + (row.note ? ' · ' + row.note : ''));
        const ico = '<span class="tk-ico">' + actionIcon(row.icon, row.side, row.icon) + '</span>';
        // Due past the window: shown in the last column, with an arrow and its exchange.
        if (row.due !== undefined && !past && c === AHEAD && row.due > ex) return '<i class="tl-hit later' + (row.heal ? ' heal' : row.spell ? ' spell' : '') + '" title="' + (row.heal ? esc((row.side ? nameOf(1) : tr('you')) + ' · ' + row.name + ' · ' + row.tip) : tip) + ' · ' + esc(tr('exchange', { n: row.due })) + '">' + ico + row.note + '<small>›' + row.due + '</small></i>';
        if (row.due !== undefined) return row.due === ex ? '<i class="tl-hit' + (row.heal ? ' heal' : row.spell ? ' spell' : '') + '" title="' + (row.heal ? esc((row.side ? nameOf(1) : tr('you')) + ' · ' + row.name + ' · ' + row.tip) : tip) + '">' + ico + row.note + '</i>' : '';
        if (ex < row.from || ex > row.until) return '';
        const first = ex === row.from, openEnd = row.until === Infinity && c === AHEAD;
        return '<i class="tl-on' + (first ? ' first' : '') + (ex === row.until || openEnd ? ' last' : '') + (openEnd ? ' open' : '') + '" title="' + tip + (row.until === Infinity ? '' : ' · ' + esc(tr('until', { n: row.until }))) + '">' + (first ? ico : '') + '</i>';
      };
      const effects = fin ? '' : rows.map((row) => '<div class="tk-row tk-eff s' + row.side + '"><span class="tk-l"></span>' + pastCells((h) => cell(row, h)) + ahead((c) => cell(row, c)) + '</div>').join('');
      const full = history[shown];
      return '<section class="track" aria-label="' + esc(tr('trackLabel')) + '"><div class="tk-scroll">' + head + movesRow(1) + movesRow(0) + effects + '</div>' +
        (full ? '<div class="hfull">' + exchangeFull(full) + (focusEx !== null ? '<button class="link" data-ex="latest">' + esc(tr('latest')) + '</button>' : '') + '</div>' : '') + '</section>';
    }
    function exchangeFull(r) {
      return '<article class="hx-full"><h4>' + esc(tr('exchange', { n: r.round })) + ' <small>· ' + esc(r.leader === 0 ? tr('youLed') : tr('theyLed')) + '</small></h4>' +
        [r.leader, 1 - r.leader].map((i) => '<div class="hl ' + (i ? 'opp' : 'you') + '"><span class="mini-icon">' + actionIcon(r.pair[i], i, r.channels && r.channels[i]) + '</span><p><b>' + who(i) + '</b> · ' + esc(r.actionNames[i]) +
          (r.committed[i] !== r.pair[i] ? ' <small>(' + esc(tr('committed', { action: label(r.committed[i]) })) + ')</small>' : '') + (r.lines && r.lines[i] ? ' <span class="flavor">' + esc(r.lines[i]) + '</span>' : '') + '</p></div>').join('') +
        (r.finish || []).map((f) => '<p class="flavor finish">' + esc(f) + '</p>').join('') + '</article>';
    }

    // The player's actions: square buttons; pick one to see it, pick it again (or Commit) to act.
    const myTurn = () => !busy && !game.result && C().actorToMove(game) === 0 && !game.config.ai[0];
    // Their Compel, committed in the open, rewrites the player's move this exchange (unless Ward or Shadowstep stops it):
    // the menu stays open, since Ward is an answer, but says what any other pick turns into.
    function incomingCompel(prev) {
      // Combat F5.11-plan.1: their Compel seizes the move you pick now and forces it for three exchanges; Ward or Shadowstep keeps it off.
      if (game.pending[1] !== 'compel' || C().actorToMove(game) !== 0 || C().has(game, 0, 'shadowstep')) return '';
      return tr('compelSeize');
    }
    // A compelled turn that can't be paid is a cancel: legal, though `available` (a menu check) refuses it.
    const forcedLegal = (id) => (id === 'cancel' || id === 'break_free') && C().legalActions(game, 0).includes(id);
    function actionButton(id) {
      const reason = forcedLegal(id) ? null : C().available(game, 0, id), disabled = !myTurn() || reason, name = actionName(id, 0), b = briefOf(0, id), tip = esc(name + ' · ' + price(0, id) + (reason ? ' · ' + reason : ''));
      return '<button class="act k-' + b.kind + (selected === id ? ' selected' : '') + '" data-action="' + id + '" aria-label="' + tip + '" aria-pressed="' + (selected === id) + '" title="' + tip + '"' + (disabled ? ' disabled' : '') + '>' +
        (engineOn ? '<i class="a-eval" data-eval="' + id + '"></i>' : '') + '<span class="a-ico" aria-hidden="true">' + actionIcon(id) + lvBadge(0, id) + '</span>' + '<span class="a-name">' + esc(['hold', 'release'].includes(id) ? label(id) : name) + '</span>' + effHtml(b, name) + costHtml(0, id) + '</button>';
    }
    function preview() {
      if (!selected) return '<div class="preview hint">' + esc(myTurn() ? tr('pickHint') : tr('waiting')) + '</div><button class="fl-commit primary" disabled>' + esc(tr('commit')) + '</button>';
      const spell = C().SPELLS[selected];
      return '<div class="preview"><b>' + esc(actionName(selected, 0)) + '</b> <span class="price">' + esc(price(0, selected)) + '</span><p>' + esc(describe(0, selected)) + '</p>' + scales(selected) + '</div>' +
        '<button class="fl-commit primary"' + (myTurn() ? '' : ' disabled') + '>' + (spell ? '<span class="control-icon" aria-hidden="true">' + C().ACTION_ICONS.cast + '</span>' + esc(tr('cast')) : esc(tr('commit'))) + '</button>';
    }
    function actions() {
      // Combat F5.11-plan.1: Bound (Breaking Free only) comes before Compelled; Haste no longer narrows the menu.
      const a = game.actors[0], C_ = C(), frozen = a.freezeUntil >= game.round, bound = !frozen && C_.has(game, 0, 'bound'), compelled = !frozen && !bound && C_.isCompelled(game, 0);
      const forced = frozen || bound || compelled || a.channel;
      const ids = forced ? C_.legalActions(game, 0) : ['strike', 'guard', 'reclaim'].concat(Object.keys(a.kit.spells));
      // Compelled: the only move is the repeat, or a lost turn when it can't be paid (the core cancels it either way).
      const prev = a.compelAction && a.compelAction !== 'cancel' ? a.compelAction : null;
      const state = frozen ? tr('frozen') : bound ? tr('bound') : compelled ? (ids[0] !== 'cancel' ? tr('compelledYou', { action: actionName(ids[0], 0) }) : prev ? tr('compelledLost', { action: label(prev) }) : tr('compelledNone'))
        : a.channel ? tr('channel', { spell: label(a.channel.id) }) : incomingCompel(prev) || (C_.has(game, 0, 'haste') ? tr('haste') : '');
      return (state ? '<div class="action-state">' + esc(state) + '</div>' : '') +
        '<div class="acts' + (forced ? ' forced' : '') + '">' + ids.map(actionButton).join('') + '</div><div class="commit-bar">' + preview() + '</div>';
    }
    function commit(id = selected) {
      if (!id || !myTurn() || (!forcedLegal(id) && C().available(game, 0, id))) return;
      try { submit(id); pump(); } catch (e) { console.error(e); }
    }
    function selectAction(id) {
      selected = id;
      for (const b of layer.querySelectorAll('[data-action]')) { const on = b.dataset.action === id; b.classList.toggle('selected', on); b.setAttribute('aria-pressed', String(on)); }
      $('.commit-bar').innerHTML = preview();
      const now = $('[data-now]'); if (now) now.innerHTML = actionIcon(id);
      $('.fl-commit').onclick = () => commit();
    }

    // ---- Sheets: inspect the foe, their committed move ----
    function inspectSheet() {
      const a = game.actors[1], C_ = C(), forced = a.channel || a.freezeUntil >= game.round || C_.has(game, 1, 'bound') || C_.isCompelled(game, 1);
      const ids = forced ? C_.legalActions(game, 1) : ['strike', 'guard', 'reclaim'].concat(Object.keys(a.kit.spells)), recent = history.slice(-6).reverse();
      const skills = Object.keys(a.kit.skills);
      return '<header class="sh-head"><div class="pf">' + portraitOf(1) + '</div><div><b>' + esc(nameOf(1)) + '</b><small>' + esc(tr('sheetLine', { level: levelOf(1), hp: fmt(a.hp), maxHp: fmt(a.maxHP), mana: fmt(a.resources.mana), maxMana: a.kit.capacity })) +
        (a.flux ? ' ' + esc(tr('plusFlux', { n: fmt(a.flux) })) : '') + '</small></div><button class="close" data-close aria-label="' + esc(tr('close')) + '">×</button></header>' +
        '<div class="sk">' + skills.map((k) => '<span><small>' + esc(opts.skillName ? opts.skillName(k) : k) + '</small><i style="--w:' + a.kit.skills[k] + '%"></i><b>' + a.kit.skills[k] + '</b></span>').join('') + '</div>' +
        '<h4>' + esc(forced ? tr('canDoNow') : tr('canDo')) + '</h4><ul class="kit">' + ids.map((id) => {
          const reason = C_.available(game, 1, id), b = briefOf(1, id);
          return '<li class="' + (reason ? 'off' : '') + '"><span class="mini-icon">' + actionIcon(id, 1) + '</span><div><b>' + esc(actionName(id, 1)) + (spellLevel(1, id) ? ' ' + ROMAN[spellLevel(1, id)] : '') + '</b> ' + effHtml(b) + ' <span class="price">' + esc(price(1, id)) + '</span>' + (reason ? ' <em>' + esc(reason) + '</em>' : '') + '<p>' + esc(describe(1, id)) + '</p></div></li>';
        }).join('') + '</ul>' +
        (recent.length ? '<h4>' + esc(tr('lastMoves')) + '</h4><div class="recent">' + recent.map((r) => '<span class="ply opp" title="' + esc(tr('exchange', { n: r.round })) + '"><span class="mini-icon">' + actionIcon(r.pair[1], 1, r.channels && r.channels[1]) + '</span>' + esc(r.actionNames[1]) + '</span>').join('') + '</div>' : '');
    }
    function intentSheet() {
      const C_ = C(), id = C_.isCompelled(game, 1) ? (game.pending[1] || C_.legalActions(game, 1)[0]) : game.pending[1];
      if (!id) return inspectSheet();
      return '<header class="sh-head"><span class="tele-icon">' + actionIcon(id, 1) + '</span><div><b>' + esc(nameOf(1) + ': ' + actionName(id, 1)) + '</b><small>' + esc(price(1, id)) + '</small></div><button class="close" data-close aria-label="' + esc(tr('close')) + '">×</button></header>' +
        '<p>' + esc(describe(1, id)) + '</p>' + scales(id) + '<button class="link" data-sheet="inspect">' + esc(tr('everything')) + '</button>';
    }
    function renderSheet() {
      const el = $('.sheet');
      if (!sheet || !game) { el.hidden = true; el.innerHTML = ''; return; }
      el.hidden = false;
      el.innerHTML = '<div class="sheet-card sheet-' + sheet + '" role="dialog" aria-modal="true">' + (sheet === 'inspect' ? inspectSheet() : intentSheet()) + '</div>';
      el.onclick = (e) => {
        if (e.target === el || e.target.closest('[data-close]')) { sheet = null; renderSheet(); }
        else { const s = e.target.closest('[data-sheet]'); if (s) { sheet = s.dataset.sheet; renderSheet(); } }
      };
    }
    function onKey(e) { if (e.key === 'Escape' && sheet) { e.preventDefault(); e.stopPropagation(); sheet = null; renderSheet(); } }
    document.addEventListener('keydown', onKey, true);

    // ---- The result: what the fight did, then back to the card ----
    // The fight's setting, always in view (feedback 2026-10-19): the situation and what comes back afterwards (the context's
    // rebates), when Health is at stake, whether a crowd watches (Renown), and, for a fighter who knows a forbidden spell,
    // whether anyone would report one.
    function settingLine() {
      const C_ = C(), st = fight.setting || {}, rb = (C_.CONTEXTS && C_.CONTEXTS[st.context]) || {}, free = ((C_.COMBAT_TUNING || {}).settle || {}).healthFreeAbove;
      const pct = (x) => Math.round((x || 0) * 100);
      // A lesson or a fight with nothing at stake (world expansion 1): nothing is lost, whatever the context's rebates.
      if (st.tutorial || st.stakes === 'none') return '<p class="fight-setting"><span><b>' + esc(tr(st.tutorial ? 'lessonTitle' : 'freeTitle')) + '</b> · ' + esc(tr(st.tutorial ? 'lessonStakes' : 'nothingAtStake')) + '</span></p>';
      const parts = ['<b>' + esc(tr('context.' + st.context)) + '</b>'];
      if (free) parts.push(esc(tr('healthBelow', { n: free })));
      if (rb.health === rb.mana) { if (rb.health) parts.push(esc(tr('rebateBoth', { pct: pct(rb.health) }))); }
      else { if (rb.health) parts.push(esc(tr('rebateHealth', { pct: pct(rb.health) }))); if (rb.mana) parts.push(esc(tr('rebateMana', { pct: pct(rb.mana) }))); }
      const lines = ['<span>' + parts.join(' · ') + '</span>'];
      lines.push('<span>' + esc(st.observers ? tr('watched', { pct: pct(rb.renown) }) : tr('unwatched')) + '</span>');
      const forbidden = Object.keys((game.actors[0].kit || {}).spells || {}).some((id) => C_.SPELLS[id] && C_.SPELLS[id].group === 'forbidden');
      if (forbidden) lines.push('<span>' + esc(st.witnesses ? tr('witnessed') : tr('unwitnessed')) + '</span>');
      // Someone beside you (the card's `with <who>`, 2026-10-25): they throw in a spell now and then.
      for (const a of st.allies || []) lines.push('<span>' + esc(tr('allyBeside', { name: a.name, spell: C_.label(a.spell) })) + '</span>');
      return '<p class="fight-setting">' + lines.join('') + '</p>';
    }
    function unfitNote() {
      if (history.length || game.result) return '';
      const p = fight.request.player, lines = [], full = ((C().COMBAT_TUNING || {}).condition || {}).healthFull || 30;
      if (p.health < full) lines.push(tr('unfitHealth', { n: Math.round(p.health), full }));
      if (p.mana < p.maxMana) lines.push(tr('unfitMana', { n: Math.round(p.mana), max: Math.round(p.maxMana) }));
      return lines.length ? '<p class="fight-note">' + esc(lines.join(' ')) + '</p>' : '';
    }
    // A lesson (EVENTS `tutorial`, world expansion 1): one coach mark per exchange, the last staying up.
    function coach() {
      const keys = (fight.setting && fight.setting.tutorial) || [];
      if (!keys.length || game.result) return '';
      const k = keys[Math.min(history.length, keys.length - 1)];
      return '<div class="coach" role="note"><b>' + esc(tr('coachTitle')) + '</b> ' + esc(tr('coach.' + k)) + '</div>';
    }
    // A bonus challenge with nothing at stake can be walked away from (a loss). A lesson can't be left, as no fight can
    // (feedback 2026-10-20): it's a straw mannequin.
    function leaveButton() {
      const st = fight.setting || {};
      if (game.result || st.tutorial || st.stakes !== 'none') return '';
      return '<button class="fl-leave" data-leave="walk">' + esc(tr('walkAway')) + '</button>';
    }
    function leave() {
      if (done || game.result) return;
      C().concede(game, 0);
      done = true;
      const res = B().fightResult(fight);
      close(); opts.onDone(res);
    }
    // The kit (world expansion 1): changeable on the opening screen, until the first exchange; then it's locked.
    function kitPicker() {
      const k = opts.kit;
      const choice = k && k.slots ? k.slots.filter((x) => x.items.length > 1) : [];
      if (!choice.length || history.length || game.result || moves) return '';
      return '<div class="fight-kit"><b>' + esc(tr('kit')) + '</b>' + choice.map((x) => '<label><small>' + esc(opts.t('kit.slot.' + x.slot)) + '</small><select data-slot="' + esc(x.slot) + '">' +
        x.items.map((it) => '<option value="' + esc(it.id) + '"' + (it.id === x.worn ? ' selected' : '') + '>' + esc(it.name) + '</option>').join('') + '</select></label>').join('') + '</div>';
    }
    function reKit(slot, id) {
      const k = opts.kit; if (!k || moves) return;
      const mods = k.equip(slot, id);
      for (const x of k.slots) if (x.slot === slot) x.worn = id;
      const req = Object.assign({}, fight.request, { player: Object.assign({}, fight.request.player, { mods }) });
      fight = B().createFight(req, { content, difficulty: opts.difficulty || 'easy', foeName });
      game = fight.state; names = fight.names; bars = {}; seen = {};
      if (CombatUI.foeAI) game.config.ai[1] = Object.assign({}, game.config.ai[1], CombatUI.foeAI);
      render(); pump();
    }
    function result() {
      const r = game.result, won = r.winner === 0, lost = r.winner === 1, res = B().fightResult(fight);
      const ds = RESULT_BARS.filter((k) => res.deltas && res.deltas[k]).map((k) => { const n = res.deltas[k]; return '<span>' + esc(opts.resName ? opts.resName(k) : k) + ' <b class="' + (n < 0 ? 'neg' : 'pos') + '">' + (n < 0 ? '−' : '+') + fmt(Math.abs(n)) + '</b></span>'; }).join('');
      return '<div class="result ' + (won ? 'win' : lost ? 'loss' : 'draw') + '"><h2>' + esc(won ? tr('win') : lost ? tr('lose') : tr('draw')) + '</h2>' +
        '<p>' + esc(tr('reason.' + r.reason)) + '</p>' + (ds ? '<div class="net-costs">' + ds + '</div>' : '') +
        '<button class="primary fl-continue" id="fightDone">' + esc(tr('continue')) + '</button></div>';
    }
    function finish() {
      if (done) return; done = true;
      const res = B().fightResult(fight);
      close(); opts.onDone(res);
    }

    function render() {
      if (closed || !game) return;
      snapshotBars();
      const sc = $('.tk-scroll'), kept = sc ? sc.scrollLeft : undefined;
      $('.fight-wrap').innerHTML = '<section class="fight">' + settingLine() + unfitNote() + kitPicker() + coach() + '<div class="fighters' + (engineOn ? ' with-eval' : '') + '">' + (engineOn ? '<div class="evalbar" title="' + esc(tr('evalBar')) + '"></div>' : '') + fighter(0) + fighter(1) + '</div><div class="fight-body"><div class="fight-main">' + track() +
        (opts.engineHelp ? '<button class="eng-toggle" aria-pressed="' + engineOn + '">' + esc(tr('engine')) + '</button>' + (engineOn ? '<div class="engine"><div class="engine-top"><b class="engine-head"></b><select class="eng-budget" aria-label="' + esc(tr('engineTime')) + '">' +
          ENGINE_BUDGETS.map((ms) => '<option value="' + ms + '"' + (ms === engineBudget ? ' selected' : '') + '>' + (ms === Infinity ? '∞' : esc(tr('seconds', { n: ms / 1000 }))) + '</option>').join('') + '</select></div><div class="engine-lines"></div><p class="fine">' + esc(tr('engineNote')) + '</p></div>' : '') : '') + '</div>' +
        '<div class="controls">' + intent() + (game.result ? result() : actions()) + leaveButton() + '</div></div></section>';
      const sc2 = $('.tk-scroll'); if (sc2) sc2.scrollLeft = focusEx !== null && kept !== undefined ? kept : sc2.scrollWidth;
      animateBars(); renderSheet();
      for (const b of layer.querySelectorAll('.fight [data-sheet]')) {
        const show = () => { sheet = b.dataset.sheet; renderSheet(); };
        b.onclick = show; b.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(); } };
      }
      for (const b of layer.querySelectorAll('[data-ex]')) b.onclick = () => { focusEx = b.dataset.ex === 'latest' ? null : Number(b.dataset.ex); render(); };
      for (const b of layer.querySelectorAll('[data-action]')) b.onclick = () => { const id = b.dataset.action; if (selected === id) commit(id); else selectAction(id); };
      const cb = $('.fl-commit'); if (cb) cb.onclick = () => commit();
      const d = $('#fightDone'); if (d) { d.onclick = finish; d.focus({ preventScroll: true }); }
      const lv = $('[data-leave]'); if (lv) lv.onclick = () => leave();
      for (const sel of layer.querySelectorAll('.fight-kit select')) sel.onchange = () => reKit(sel.dataset.slot, sel.value);
      const et = $('.eng-toggle'); if (et) et.onclick = () => setEngine(!engineOn);
      const eb = $('.eng-budget'); if (eb) eb.onchange = () => { engineBudget = Number(eb.value); if (opts.onEngineBudget) opts.onEngineBudget(engineBudget); analysisFor = -1; analysis = null; requestAnalysis(); paintEngine(); };
      requestAnalysis(); paintEngine();
    }

    // ---- The engine's analysis (a cheat, behind the engineHelp setting) ----
    const evalText = (v) => (v === undefined ? '…' : v >= 9000 ? 'KO' : v <= -9000 ? '−KO' : (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1));
    const evalShare = (v) => (v >= 9000 ? 100 : v <= -9000 ? 0 : 100 / (1 + Math.exp(-v / 12)));
    function plyChip(p) {
      if (p.end) return '<span class="ply end">' + esc(tr(p.end === 'win' ? 'lineWin' : p.end === 'loss' ? 'lineLoss' : 'lineDraw')) + '</span>';
      return '<span class="ply ' + (p.side ? 'opp' : 'you') + '" title="' + esc(nameOf(p.side) + ' · ' + tr('exchange', { n: p.round })) + '"><span class="mini-icon">' + actionIcon(p.id, p.side, p.channel) + '</span>' + esc(label(p.id)) + '</span>';
    }
    function lineHtml(line) {
      let out = '', round = null;
      for (const p of line) { if (!p.end && round !== null && p.round !== round) out += '<span class="sep">|</span>'; if (!p.end) round = p.round; out += plyChip(p); }
      return out;
    }
    const live = () => engineOn && analysis && analysisFor === moves;
    function paintEngine() {
      if (!engineOn || closed) return;
      // The head and the lines only: the time menu stays as it is (a re-render would close it while open).
      const head = $('.engine-head'), lines = $('.engine-lines');
      if (head) head.textContent = live() ? tr('engineHead', { depth: analysis.depth, nodes: Math.round(analysis.nodes / 1000), s: (analysis.ms / 1000).toFixed(1) }) + (analysisRunning ? ' · ' + tr('engineDeeper') : '')
        : myTurn() ? tr('engineThinking') : tr('engineWaits');
      if (lines) lines.innerHTML = live() ? '<ol class="lines">' + analysis.lines.map((l, k) => '<li class="' + (k === 0 ? 'best' : '') + '"><span class="eval">' + evalText(l.value) + '</span><span class="line">' + lineHtml(l.line) + '</span></li>').join('') + '</ol>' : '';
      const v = live() ? analysis.scores[analysis.best] : undefined, bar = $('.evalbar');
      if (bar) bar.innerHTML = '<i style="height:' + (v === undefined ? 50 : evalShare(v)) + '%"></i><span>' + (v === undefined ? '' : evalText(v)) + '</span>';
      for (const b of layer.querySelectorAll('[data-action]')) b.classList.toggle('best', !!live() && b.dataset.action === analysis.best);
      for (const e of layer.querySelectorAll('[data-eval]')) { const x = live() ? analysis.scores[e.dataset.eval] : undefined; e.textContent = x === undefined ? '' : evalText(x); }
    }
    // On the player's turn only (a value is from the side to move); a new turn restarts it.
    function requestAnalysis() {
      if (!engineOn || !myTurn() || analysisFor === moves) return;
      if (!analyst) analyst = C().createAnalyst({
        update: (a) => { analysis = a; paintEngine(); },
        done: () => { analysisRunning = false; paintEngine(); },
        error: (m) => { console.error('[fight] engine analysis: ' + m); analysisRunning = false; paintEngine(); },
      });
      analysisFor = moves; analysis = null; analysisRunning = true;
      analyst.analyze(game, engineBudget === Infinity ? { budgetMs: Infinity } : { budgetMs: engineBudget, maxDepth: 8 });
    }
    function setEngine(on) {
      engineOn = !!on;
      if (!engineOn && analyst) { analyst.stop(); analysisRunning = false; analysis = null; analysisFor = -1; }
      if (opts.onEngineShown) opts.onEngineShown(engineOn);
      render();
    }
    return { close, get state() { return game; } };
  }

  // A fight played by two AIs at once, on the main thread (the core must be started): the safety net when a fight reaches
  // the engine without having been played on screen. Logged, never silent.
  function autoResolve(request, content) {
    console.error('[fight] ' + request.id + ' was not played on screen: resolved by the AI');
    const search = { maxDepth: 2, nodeBudget: 2e4, mistakeChance: 0 };
    return root.CombatBridge.autoplay(root.CombatBridge.createFight(request, { content, ai: { player: Object.assign({ preset: 'medium' }, search), foe: search } }));
  }

  // A test driver (tools/e2e.js) may set foeAI ({maxDepth, nodeBudget}: search less) and playerAI (the player's side played by
  // the AI too); the game never does.
  const CombatUI = { open, autoResolve, foeAI: null, playerAI: null };
  root.CombatUI = CombatUI;
})(typeof self !== 'undefined' ? self : this);
