/*
 * Lumenhold engine — DOM-free game logic. Runs in browser (window.Engine) and Node.
 *
 * Flow:   newGame() -> {kind:'month'}  -> advance() -> {kind:'card'} -> choose(key) -> outcome
 *         advance() ... when the month's deck is empty, advance() returns the next {kind:'month'}
 *         or {kind:'ending'} once the game is over.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./grimoire.js'), require('./director.js'));
  else root.Engine = factory(root.Grimoire, root.Director);
})(typeof self !== 'undefined' ? self : this, function (G, Director) {
  'use strict';

  const PRONOUNS = {
    she: { they: 'she', them: 'her', their: 'her', theirs: 'hers', are: 'is', s: 's' },
    he: { they: 'he', them: 'him', their: 'his', theirs: 'his', are: 'is', s: 's' },
    they: { they: 'they', them: 'them', their: 'their', theirs: 'theirs', are: 'are', s: '' },
  };
  const DEFAULT_PRIORITY = { queued: 60, auto: 50, social: 20, random: 10 };
  const ANY_EVENT_REST = 2;
  const SAVE_VERSION = 3;
  const FIGHT_BARS = ['health', 'mana', 'mood', 'renown', 'gold', 'alignment'];   // what a played fight's settlement moves
  const YEARBOOK = [['headline', 1], ['mystery', 1], ['relationships', 3], ['personal', 2]];   // design §10.5
  // Defaults when content has no @balance block (design §8.4).
  const TIER_INDEX = { tiny: 0, small: 1, medium: 2, large: 3, huge: 4 };
  const DEFAULT_SIZES = { _: [2, 4, 7, 12, 20], gold: [3, 8, 15, 30, 60], renown: [1, 3, 6, 10, 16], mana: [3, 6, 10, 16, 25], xp: [1, 2, 4, 7, 12], rel: [2, 4, 7, 12, 20], spark: [3, 6, 10, 15, 25] };
  const DEFAULT_DIFFICULTY = { trivial: -15, easy: -7, medium: 0, hard: 8, heroic: 16 };
  // The check ladder (docs/authoring/checks.md, design §8.6). Each value is a @balance default: 24 rungs, 4 apart;
  // the odds of each odds-by-nature word (%); the bell's σ per luck word; drift per drift word; the z a circumstance
  // step moves; the bell's floor and ceiling; a course's standard rung per level; rungs per course level above a card's own.
  const LADDER_DEFAULTS = {
    likelihood: { certain: 97, sure: 90, likely: 70, even: 50, unlikely: 30, slim: 15, long_shot: 5, freak: 1 },
    sigma: { steady: 12, normal: 20, wild: 32, luck: 80 },
    drift: { none: 0, low: 0.15, mid: 0.3, high: 0.5 },
    odds_step: 0.5, bell: { floor: 2, ceil: 98 }, course_standard: ['apprentice+', 'journeyman+', 'adept+'], course_step: 3, course_drift: 'high',
  };
  const DEFAULT_RUNGS = {};
  ['novice', 'apprentice', 'journeyman', 'adept', 'expert', 'master', 'grandmaster', 'archmage'].forEach((r, i) => { DEFAULT_RUNGS[r + '-'] = 12 * i; DEFAULT_RUNGS[r] = 12 * i + 4; DEFAULT_RUNGS[r + '+'] = 12 * i + 8; });
  // The normal CDF (Abramowitz–Stegun 7.1.26) and its inverse (bisection): the bell the ladder's odds follow.
  const erf = (x) => { const sg = Math.sign(x), a = Math.abs(x), t = 1 / (1 + 0.3275911 * a); return sg * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a)); };
  const Phi = (z) => 0.5 * (1 + erf(z / Math.SQRT2));
  const invPhi = (p) => { let lo = -8, hi = 8; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (Phi(m) < p) lo = m; else hi = m; } return (lo + hi) / 2; };
  // Which skill a challenge rolls (design §9.2); `using <skill>` overrides.
  const CHALLENGE_SKILLS = G.CHALLENGE_KINDS;
  // Kinds played as a minigame (M2): fight (combat, duel) and parley (negotiate; the stub until its minigame).
  const MINIGAME_KINDS = G.MINIGAME_KINDS;
  class SaveVersionError extends Error { constructor(v) { super('This save is from an older version of the game (save version ' + v + ', now ' + SAVE_VERSION + ') and can no longer be loaded.'); this.code = 'SAVE_VERSION'; this.saveVersion = v; } }
  const now = () => Date.now();
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  // Display name used by {npc}: the npc's `short:` if given, else the first word of `name`.
  const shortName = (def) => def.short || String(def.name).split(/[\s·]/)[0];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  class Engine {
    constructor(content) {
      this.c = content;
      this.s = null;
      this._exprCache = {};
      const g = content.game;
      this.years = g.years || 3;
      this.months = g.months && g.months.length ? g.months : ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6', 'Month 7', 'Month 8', 'Month 9', 'Month 10', 'Month 11', 'Month 12'];
      // The run ends in `last_month` of the final year (design §4.1: Goldenhaze of year 4 = turn 47).
      this.maxTurns = (this.years - 1) * this.months.length + (g.last_month || this.months.length);
      this.calendar = g.calendar || null;   // month index -> 'term' | 'break'
      this.seasons = g.seasons || null;
      this.cardsPerMonth = g.cards_per_month || 3;
      this.maxCards = g.max_cards_per_month || 7;
      this.socialPerMonth = g.social_per_month == null ? 1 : g.social_per_month;
      this.minRandom = g.min_random_per_month == null ? 1 : g.min_random_per_month;
      this.events = Object.values(content.events);
      this.byTrigger = { random: [], auto: [], social: [], queued: [], letter: [] };
      for (const e of this.events) (this.byTrigger[e.trigger] || []).push(e);
      this.hooks = Object.values(content.hooks);
      // Index every `say` line of every option (event.option.n) so the journal can re-render
      // outcomes in whatever language is loaded now.
      this.sayIndex = {};
      for (const e of this.events) for (const o of e.options) {
        let n = 0;
        G.walkEffects(o.effects, (st) => { if (st.t === 'say') { st.sid = e.id + '.' + o.key + '.' + (++n); this.sayIndex[st.sid] = st; } });
      }
      // A track's `picked:` line, the outcome of choosing it in a generated menu (feedback 2026-10-15).
      for (const d of Object.values(content.tracks || {})) if (d.picked) this.sayIndex['track:' + d.id] = { t: 'say', text: d.picked, sid: 'track:' + d.id };
      // Static analysis: which resources each option may touch (for the Reigns-style preview dots).
      for (const e of this.events) for (const o of e.options) {
        const set = new Set();
        G.walkEffects(o.effects, (st) => { if ((st.t === 'delta' || st.t === 'assign') && content.resources[st.name]) set.add(st.name); });
        o.firstCheck = o.effects.find((st) => st.t === 'check' || st.t === 'challenge' || st.t === 'sit_exam' || st.t === 'chance') || null;
        if (o.spell) set.add(content.game.spell_resource || 'mana');
        o.affects = [...set];
      }
    }

    /* ---------------- RNG (state persisted in save) ---------------- */
    rand() {
      let a = (this.s.rng = (this.s.rng + 0x6D2B79F5) | 0);
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    randInt(a, b) { if (a > b) [a, b] = [b, a]; return a + Math.floor(this.rand() * (b - a + 1)); }
    pickWeighted(items) {
      let total = 0; for (const it of items) total += it.w;
      if (total <= 0) return null;
      let r = this.rand() * total;
      for (const it of items) { r -= it.w; if (r < 0) return it; }
      return items[items.length - 1];
    }
    shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(this.rand() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

    /* ---------------- Setup / save ---------------- */
    newGame(opts = {}) {
      const seed = opts.seed != null && opts.seed !== '' ? (Number(opts.seed) | 0) : Math.floor(Math.random() * 2147483647);
      const s = this.s = {
        version: SAVE_VERSION, seed, rng: seed, name: opts.name || 'Wren', pronouns: opts.pronouns || 'they', turn: 0,
        vals: {}, flags: {}, states: {}, npcs: {}, seen: {}, last: {}, lastBy: {}, choices: {},
        queue: [], deck: [], cur: null, log: [], ended: null, pending: [], cardsThisMonth: 0,
        runId: opts.runId || newRunId(seed), hist: [], seq: 0,
        spells: {}, facts: {}, memories: [], npcRel: {},
        tracks: {}, places: {}, arcs: {}, clues: {}, skillGain: {}, peak: {}, day: null, runsSeen: opts.runsSeen || {},
        visitsTo: {}, runsCompleted: opts.runsCompleted | 0,
        items: {}, worn: {}, itemsHad: {},
      };
      s.hist.push({ t: 'start', at: now(), seed, name: s.name });
      for (const id of this.c.order.resources) s.vals[id] = this.c.resources[id].start ?? 50;
      for (const id of this.c.order.skills) { s.vals[id] = this.c.skills[id].start ?? 0; s.peak[id] = s.vals[id]; }
      for (const p of Object.values(this.c.places || {})) if (!p.discover && !p.deprecated) s.places[p.id] = { found: 0 };
      for (const id of this.c.order.npcs) s.npcs[id] = { met: false, rel: this.c.npcs[id].start_rel || 0, spark: 0, bond: 'none', touched: 0, sparked: 0, lowSpark: 0 };
      // The origin, picked before the game (design §3, playtest 2 M32): applied before month 1's charges see it.
      if (opts.origin != null) this.applyOrigin(opts.origin);
      // Flags chosen before the game (E7): `skip_intros` from the title screen's checkbox or Settings.
      // A list of names, or {name: true} (E7).
      const pre = opts.flags && !Array.isArray(opts.flags) && typeof opts.flags === 'object' ? Object.keys(opts.flags).filter((k) => opts.flags[k]) : [].concat(opts.flags || []);
      for (const f of pre) if (f) s.flags[f] = true;
      // The kit you arrive with (E4): `start: true` items, owned and worn.
      for (const d of Object.values(this.c.items || {})) if (d.start) { s.items[d.id] = { since: 0 }; s.itemsHad[d.id] = 0; if (!s.worn[d.slot]) s.worn[d.slot] = d.id; }
      this.runHooks('game_start');
      // The prologue (feedback 2026-10-20): with no origin picked before the game, the cards game_start queued (the arrival,
      // then the mirror, where you pick it) play first, and month 1 begins when they're done, so its charges and summary
      // come after the pick. It reads as month 1 throughout (s.turn 1); advance() then starts the month for real.
      if (opts.prologue && opts.origin == null) {
        s.deck = s.deck.concat(s.queue.filter((q) => q.due <= s.turn).map((q) => ({ id: q.id, actor: q.actor || null, src: 'queued' })));
        s.queue = s.queue.filter((q) => q.due > s.turn);
        s.turn = 1; s.prologue = true;
        return this.advance();
      }
      return this.beginMonth();
    }
    // The origins on offer: the options of `@game origins:` (a menu event), with the origin state each one grants.
    originChoices() {
      const e = this.c.events[this.c.game.origins];
      if (!e) return [];
      return e.options.map((o) => {
        const gain = []; G.walkEffects(o.effects, (st) => { if (st.t === 'gain' && this.c.states[st.state] && this.c.states[st.state].kind === 'origin') gain.push(st.state); });
        const d = gain.length ? this.c.states[gain[0]] : null;
        return { key: o.key, label: o.label, hint: o.hint || '', state: d ? d.id : null, name: d ? d.name : o.label, desc: d ? d.desc || '' : '', money: d ? d.money || '' : '', poor: !!(d && (d.tags || []).includes('poor')), art: d ? d.art || null : null };
      });
    }
    applyOrigin(key) {
      const e = this.c.events[this.c.game.origins], o = e && e.options.find((x) => x.key === key);
      if (!o) throw new Error('no origin "' + key + '"');
      const ctx = this.newCtx(null, null, e.id);
      this.run(o.effects, ctx);
      this.handleZeroed(ctx);
      const s = this.s;
      s.origin = key; s.seen[e.id] = (s.seen[e.id] || 0) + 1; s.choices[e.id] = key;
      s.hist.push({ t: 'origin', key, at: now() });
      // Its numbers show in month 1's summary; its words belong to the mirror scene in the game itself.
      ctx.say = []; ctx.sayIds = [];
      s.pending.push(this.summaryItem(ctx, this.interp(o.label, null, e.id)));
    }
    save() { return JSON.stringify(this.s); }
    load(json) {
      const s = typeof json === 'string' ? JSON.parse(json) : json;
      // Saves may break until 1.0 (design §13): older versions are refused, not migrated.
      // The UI archives the old run's log (s.hist) before discarding it.
      if ((s.version || 1) < SAVE_VERSION) throw new SaveVersionError(s.version || 1);
      if (!s.visitsTo) s.visitsTo = {};
      this.s = s;
      // Spells v2: a spell content no longer has is dropped, and a level past the spell's levels is clamped (Ward 3 → 1).
      for (const [id, lv] of Object.entries(s.spells || {})) { if (!(this.c.spells || {})[id]) delete s.spells[id]; else s.spells[id] = Math.min(lv, this.spellLevels(id)); }
      this.remapDeprecated();
      // A place without `discover:` is known from the start, so one a save never had (a merge undone, migration 0043)
      // is added here. Its visits stay counted at the place it had been merged into.
      for (const p of Object.values(this.c.places || {})) if (!p.discover && !p.deprecated && !s.places[p.id]) s.places[p.id] = { found: 0 };
      // The kit (E4) in a save from before it: the start items, then whatever old flags and states grant.
      if (!s.items) { s.items = {}; s.worn = {}; s.itemsHad = {}; for (const d of Object.values(this.c.items || {})) if (d.start) { s.items[d.id] = { since: 0 }; s.itemsHad[d.id] = 0; if (!s.worn[d.slot]) s.worn[d.slot] = d.id; } }
      this.grantLegacyItems(null);
      if (this.dayMode) this.upgradeDay();   // a save from before the slot-by-slot day (M1)
      return this;
    }

    // A place merged into another (`@place x deprecated: y`, E11) resolves to its survivor; any other id to itself.
    placeAlias(id) { let p = this.c.places && this.c.places[id], n = 0; while (p && p.deprecated && this.c.places[p.deprecated] && n++ < 8) p = this.c.places[p.deprecated]; return p ? p.id : id; }
    // A save from before a merge (E11): its discoveries, visit counts and picks move to the survivor. Run logs keep the old
    // ids; their viewers resolve them with placeAlias.
    remapDeprecated() {
      const s = this.s, A = (id) => (id ? this.placeAlias(id) : id);
      for (const p of Object.values(this.c.places || {})) {
        if (!p.deprecated) continue;
        const to = A(p.id); if (to === p.id) continue;
        if (s.places && s.places[p.id]) { if (!s.places[to]) s.places[to] = s.places[p.id]; delete s.places[p.id]; }
        if (s.visitsTo && s.visitsTo[p.id]) { s.visitsTo[to] = (s.visitsTo[to] || 0) + s.visitsTo[p.id]; delete s.visitsTo[p.id]; }
      }
      const d = s.day;
      if (d) { if (d.picks) d.picks = d.picks.map(A); if (d.nextPicks) d.nextPicks = d.nextPicks.map(A); }
      for (const it of (s.deck || []).concat(s.cur ? [s.cur] : [])) if (it.place) it.place = A(it.place);
    }

    /* ---------------- The kit (E4, world expansion 1) ----------------
     * s.items: what you own ({id: {since}}); s.worn: one item per slot (wand, robe, trinket); s.itemsHad: every item you
     * have ever owned (a `legacy:` grant comes once, unless the item is `bound:`). Owned items add options to cards
     * (`> up[item:x]:`) and, rarely, a monthly `tick:`; worn items act only in fights (fightPlayer().mods). */
    hasItem(id) { return !!(this.s.items || {})[id]; }
    giveItem(id, ctx) {
      const s = this.s, d = this.c.items && this.c.items[id];
      if (!d || s.items[id]) return false;
      s.items[id] = { since: s.turn }; s.itemsHad[id] = s.itemsHad[id] != null ? s.itemsHad[id] : s.turn;
      if (!s.worn[d.slot]) s.worn[d.slot] = id;
      if (ctx) ctx.notes.push({ kind: 'item', item: id, gained: true, worn: s.worn[d.slot] === id || undefined });
      return true;
    }
    takeItem(id, ctx) {
      const s = this.s, d = this.c.items && this.c.items[id];
      if (!d || !s.items[id]) return false;
      delete s.items[id];
      if (s.worn[d.slot] === id) {
        delete s.worn[d.slot];
        // Back to what you arrived with in that slot, if you still have it.
        const back = Object.values(this.c.items).find((x) => x.slot === d.slot && x.start && s.items[x.id]);
        if (back) s.worn[d.slot] = back.id;
      }
      if (ctx) ctx.notes.push({ kind: 'item', item: id, gained: false });
      return true;
    }
    // Whatever `legacy:` grants now; a `bound:` item also goes when its condition stops holding (at load and month start).
    grantLegacyItems(ctx) {
      const s = this.s;
      for (const d of Object.values(this.c.items || {})) {
        if (!d.legacy) continue;
        const on = this.test(d.legacy, null);
        if (on && !s.items[d.id] && (d.bound || s.itemsHad[d.id] == null)) this.giveItem(d.id, ctx);
        else if (!on && d.bound && s.items[d.id]) this.takeItem(d.id, ctx);
      }
    }
    // Locked while a minigame is under way: from a fight's first exchange (the UI keeps it as s.fightInProgress) to its end.
    kitLocked() { return !!(this.s && (this.s.minigame || this.s.fightInProgress)); }
    // Wear an item you own in its slot (or `null` to clear the slot). Refused while the kit is locked.
    equip(slot, id) {
      const s = this.s;
      if (this.kitLocked()) throw new Error('the kit is locked until the fight is over');
      if (!G.ITEM_SLOTS.includes(slot)) throw new Error('no item slot "' + slot + '"');
      if (id == null) { delete s.worn[slot]; return s.worn; }
      const d = this.c.items[id];
      if (!d || !s.items[id]) throw new Error('you don\'t own ' + id);
      if (d.slot !== slot) throw new Error(id + ' is worn as a ' + d.slot + ', not a ' + slot);
      s.worn[slot] = id;
      return s.worn;
    }
    // What the worn kit does in a fight: one table, summed over the slots (flat numbers only).
    wornMods() {
      const m = { hp: 0, mana: 0, cost: {}, onCast: {}, onDefend: 0, taken: [], items: [] };
      for (const id of Object.values(this.s.worn || {})) {
        const d = this.c.items && this.c.items[id], w = d && d.worn;
        if (!d) continue;
        m.items.push(id);
        if (!w) continue;
        m.hp += w.hp || 0; m.mana += w.mana || 0; m.onDefend += w.onDefend || 0;
        for (const [k, v] of Object.entries(w.cost || {})) m.cost[k] = (m.cost[k] || 0) + v;
        for (const [k, v] of Object.entries(w.onCast || {})) m.onCast[k] = (m.onCast[k] || 0) + v;
        for (const t of w.taken || []) m.taken.push({ n: t.n, from: t.from.slice() });
      }
      return m;
    }
    tickItems(summary) {
      const s = this.s;
      for (const id of Object.keys(s.items || {})) {
        const d = this.c.items && this.c.items[id];
        if (!d || !d.tick || !d.tick.length || s.items[id].since >= s.turn) continue;
        const ctx = this.newCtx(null, d.name || id, id);
        this.run(d.tick, ctx);
        this.handleZeroed(ctx);
        if (Object.keys(ctx.deltas).length || ctx.notes.length || ctx.say.length) summary.push(Object.assign(this.summaryItem(ctx, d.name || id), { src: 'item ' + id }));
      }
    }

    /* ---------------- Run history ----------------
     * s.hist is the complete, uncapped record of a run (s.log is the player's journal):
     *   {t:'start', at, seed, name}
     *   {t:'month', n?, turn, year, month, summary}          — month-start effects (rent, ticks, hooks)
     *   {t:'card', n, turn, id, actor, src, type, title, text, options, onShow?, at,
     *              choice?, label?, out?, vals?, chosenAt?}   — every card shown and what was picked
     *   {t:'end', n, turn, id, early, at}
     * Cards and endings carry a sequence number `n`; feedback attaches to them as `fb`. */
    histEntry(n) { const h = this.s.hist; for (let i = h.length - 1; i >= 0; i--) if (h[i].n === n) return h[i]; return null; }
    // The most recent rateable entries (cards and the ending), newest first.
    recentEntries(count = 2) { const out = []; const h = this.s.hist; for (let i = h.length - 1; i >= 0 && out.length < count; i--) if (h[i].n != null) out.push(h[i]); return out; }
    // fb: {rating: 'up' | 'down' | null, comment: string}. Clearing both removes the feedback.
    setFeedback(n, fb) {
      const e = this.histEntry(n);
      if (!e) return null;
      const rating = fb.rating === 'up' || fb.rating === 'down' ? fb.rating : null;
      const comment = String(fb.comment || '').trim();
      if (!rating && !comment) { delete e.fb; return e; }
      if (e.fb && e.fb.rating === rating && e.fb.comment === comment) return e;
      e.fb = { rating, comment, at: now() };
      return e;
    }
    // Continue from a loaded save as a new run (its history so far is kept), so two timelines from the
    // same start never mix in one log.
    forkRun() {
      const s = this.s, from = s.runId;
      s.runId = newRunId(s.seed);
      s.hist.push({ t: 'fork', from, turn: s.turn, at: now() });
      return s.runId;
    }
    // A self-contained record of this run (the format the UI exports and `grim feedback` reads).
    exportRun(meta = {}) {
      const s = this.s;
      return {
        format: 'lumenhold-run', v: 1, runId: s.runId, name: s.name, seed: s.seed,
        startedAt: s.hist.length ? s.hist[0].at : null, updatedAt: now(), turn: s.turn, maxTurns: this.maxTurns,
        ended: s.ended ? Object.assign({ id: s.ended.id, turn: s.turn }, s.ended.book ? { yearbook: s.ended.book.map((x) => x.slot + ':' + x.id) } : {}) : null,
        feedback: s.hist.filter((h) => h.fb).length,
        ...meta, hist: s.hist,
      };
    }

    /* ---------------- Numbers (design §8) ---------------- */
    // Amount for a tier word on a row: a resource, 'xp' for skills, 'rel', 'spark' or 'alignment'.
    tierAmount(row, tier) {
      const sizes = (this.c.balance && this.c.balance.sizes) || {};
      const r = sizes[row] || (this.c.skills[row] ? sizes.xp : null) || DEFAULT_SIZES[row] || (this.c.skills[row] ? DEFAULT_SIZES.xp : DEFAULT_SIZES._);
      return r[TIER_INDEX[tier]];
    }
    // The size tier an amount falls in (0 tiny … 4 huge), for compact displays: the largest tier it reaches, at least
    // tiny. A skill's points are turned back into XP at the current level's cost; track numbers use their own rows.
    sizeOf(key, amount) {
      const a = Math.abs(amount || 0), sizes = (this.c.balance && this.c.balance.sizes) || {};
      const [kind, id] = String(key).split(':');
      let row = null, x = a;
      if (id && ['perf', 'progress', 'study'].includes(kind)) row = sizes[{ perf: 'performance' }[kind] || kind] || { perf: [2, 5, 8, 15, 25], progress: [2, 4, 8, 15, 25], study: [1, 3, 5, 8, 12] }[kind];
      else if (id) row = sizes[kind] || DEFAULT_SIZES[kind] || DEFAULT_SIZES._;
      else if (this.c.skills[key]) {
        const cost = (this.c.balance && this.c.balance.xp_cost) || { a: 1, b: 0 };
        x = a * Math.max(0.05, cost.a + cost.b * ((this.s && this.s.vals[key]) || 0));
        row = sizes.xp || DEFAULT_SIZES.xp;
      } else row = sizes[key] || DEFAULT_SIZES[key] || DEFAULT_SIZES._;
      let k = 0;
      for (let i = 1; i < row.length; i++) if (x >= row[i] * 0.85) k = i;
      return k;
    }
    // Expected skill of a balanced player at a turn (the @balance curve; a straight line until it's fitted).
    expectedSkill(turn = this.s.turn) {
      const c = this.c.balance && this.c.balance.curve;
      if (c && c.length) return c[clamp(turn - 1, 0, c.length - 1)];
      return 9 + turn * 1.1;
    }
    difficulty(tier) { const d = (this.c.balance && this.c.balance.difficulty) || DEFAULT_DIFFICULTY; return d[tier] != null ? d[tier] : DEFAULT_DIFFICULTY[tier]; }
    resMax(def) { return def.max == null ? 100 : typeof def.max === 'object' ? this.value(def.max, null, 100) : def.max; }
    statOf(who, stat, actor) {
      const id = who === 'npc' ? actor : who;
      if (!id) return 0;
      if (stat === 'rel' || stat === 'spark') return this.s.npcs[id] ? this.s.npcs[id][stat] : 0;
      const d = this.c.npcs[id];
      if (!(d && d.stats && d.stats[stat] != null)) return this.expectedSkill();
      return this.c.skills[stat] ? Math.round(d.stats[stat] * this.peerGrowth(id)) : d.stats[stat];
    }
    // Peers grow with the player (feedback 2026-10-15, `@balance npc_growth: share 0.9 tags peer thornwick`): a character
    // with one of the tags has every skill stat × k(turn), rising with E(turn) from 1 to K, where K brings their best skill to `share` of
    // the final E(turn). So each keeps their shape, and checks against classmates stay contests.
    peerGrowth(id) {
      const g = this.c.balance && this.c.balance.npc_growth, d = this.c.npcs[id], cv = this.c.balance && this.c.balance.curve;
      if (!g || !d || !(d.tags || []).some((x) => g.tags.includes(x)) || !cv || cv.length < 2) return 1;
      const top = Math.max(0, ...Object.keys(d.stats || {}).filter((k) => this.c.skills[k]).map((k) => d.stats[k]));
      const K = top > 0 ? g.share * cv[cv.length - 1] / top : 1, e1 = cv[0], eN = cv[cv.length - 1];
      return K > 1 && eN > e1 ? 1 + (K - 1) * clamp((this.expectedSkill() - e1) / (eN - e1), 0, 1) : 1;
    }
    // The value a challenge tests (design §9.2): the kind's skill (or `using`), the combat stub's mix, and the modifiers.
    checkValue(st) {
      const ct = this._ctxTrack && this.trackState(this._ctxTrack);
      // An exam inside a course's card tests that course's skill (design §9.2).
      const parley = MINIGAME_KINDS[st.kind] === 'parley';
      // A negotiation's stub always reads its whole mix; `using` doubles that skill's weight (E8).
      const skills = parley ? (st.using && !CHALLENGE_SKILLS[st.kind].includes(st.using) ? [st.using].concat(CHALLENGE_SKILLS[st.kind]) : CHALLENGE_SKILLS[st.kind])
        : st.using ? [st.using] : (st.kind === 'exam' && ct && this.trackSkills(this._ctxTrack).length ? this.trackSkills(this._ctxTrack) : (CHALLENGE_SKILLS[st.kind] || ['lore']));
      const combat = st.kind === 'combat' && !st.using;
      // A resource in `using` (renown, M15) isn't on the skill scale: 50 reads as the expected skill now, ±25 at the ends.
      const val = (k) => (this.c.resources[k] && !this.c.skills[k] ? this.expectedSkill() + ((this.s.vals[k] || 0) - 50) / 2 : this.s.vals[k] || 0);
      let sv = combat ? this.combatValue() : parley ? this.parleyValue(st.using) : skills.reduce((a, k) => a + val(k), 0) / skills.length;
      // Modifiers (design §9.2): per known spell whose skill is tested (`@balance spell_check`); study points for an exam.
      // (Combat counts every spell level in its own value.)
      let sp = 0;
      const spc = this.spellCheck();
      if (!combat) for (const id of Object.keys(this.s.spells || {})) if (this.c.spells[id] && this.spellSkills(id).some((k) => skills.includes(k))) sp += spc.per;
      sv += Math.min(spc.cap, sp);
      if (st.kind === 'exam' && ct && ct.status === 'enrolled') sv += Math.min(this.studyRule().cap, ct.study || 0);
      sv += this.advisorBonus(this._ctxTrack);
      if (!combat && !parley) sv += this.boost(st.kind);
      return { skills, value: sv };
    }
    // A tonic (world expansion 1, K3): a state whose `boost:` names this check's kind adds `@balance tonic` to it. Tonics
    // share a `group:`, so one holds at a time; two states naming the same kind still add it once. Never on a fight or a
    // negotiation (minigames: what you drank doesn't win an argument).
    boost(kind) {
      const b = (this.c.balance && this.c.balance.tonic) || 0;
      if (!b || MINIGAME_KINDS[kind]) return 0;
      for (const id of Object.keys(this.s.states || {})) { const d = this.c.states[id]; if (d && !d.deprecated && (d.boost || []).includes(kind)) return b; }
      return 0;
    }
    // The check ladder (docs/authoring/checks.md, design §8.6). A @balance value, or its default.
    ladder(key) { const b = this.c.balance || {}; return b[key] != null ? b[key] : LADDER_DEFAULTS[key]; }
    rungValue(w) { const t = (this.c.balance && this.c.balance.dc_tiers) || DEFAULT_RUNGS; return t[w] != null ? t[w] : DEFAULT_RUNGS[w]; }
    rungStep() { return (this.rungValue('novice') - this.rungValue('novice-')) || 4; }
    // A course's standard at a level: its `standard:` rung, else @balance course_standard.
    courseStandard(trackId, level) { const d = trackId && this.c.tracks[trackId], l = (d && d.standard) || this.ladder('course_standard'); return this.rungValue(l[clamp(level || 1, 1, l.length) - 1]); }
    // Odds by nature as a z: the word's odds, moved by each circumstance step whose condition holds.
    likelihoodZ(word, steps, actor) {
      let z = invPhi(clamp((this.ladder('likelihood')[word || 'even'] ?? 50) / 100, 0.0005, 0.9995));
      for (const s of steps || []) if (this.test(s.cond, actor)) z += s.n * this.ladder('odds_step');
      return z;
    }
    likelihoodP(word, steps, actor) { return Math.round(100 * Phi(this.likelihoodZ(word, steps, actor))); }
    // Drift by significance (checks.md): a story card's challenge is what the story says; milestones and crises barely
    // move; routine, incident, windfall and repeat cards keep up.
    defaultDrift(ev) { return !ev ? 'high' : ev.class === 'story' ? 'none' : ['milestone', 'crisis'].includes(ev.class) ? 'low' : 'high'; }
    // The bell: floor + (ceil − floor) × Φ(z + (skill − DC) / σ); a milestone and an exam run 0–100.
    bellOdds(sv, dc, z0, swing, milestone) {
      const b = this.ladder('bell'), [lo, hi] = milestone ? [0, 100] : [b.floor ?? 2, b.ceil ?? 98], sg = this.ladder('sigma')[swing || 'normal'] || 20;
      return Math.round(lo + (hi - lo) * Phi(z0 + (sv - dc) / sg));
    }
    // A ladder challenge's odds: the difficulty (a rung, the course standard, or a character's stat; ± rungs; the course
    // step for a card shown above its level; +2 for the hard variant), pulled toward the expected skill by drift.
    ladderOdds(st, actor, eventId) {
      const { skills, value: sv } = this.checkValue(st);
      const ev = eventId && this.c.events[eventId], tr = this._ctxTrack, ct = tr && this.trackState(tr);
      const inCourse = !!(ct && ct.status === 'enrolled' && this.c.tracks[tr] && this.c.tracks[tr].kind === 'course');
      const own = (ev && ev.level) || null;
      let base;
      if (st.vs) base = this.statOf((this._cast && this._cast[st.vs.who]) || st.vs.who, st.vs.stat, actor);
      else if (st.standard) base = this.courseStandard(inCourse ? tr : ev && ev.track, own || (inCourse ? ct.level : 1));
      else base = this.rungValue(st.rung);
      let rungs = st.offset || 0;
      if (inCourse && own) rungs += this.ladder('course_step') * Math.max(0, (ct.level || 1) - own);
      if (this._variant === 'hard') rungs += 2;
      base += rungs * this.rungStep();
      // A course card's standard check inside its course drifts `course_drift` (feedback 2026-10-15: at `high`, half of
      // each level's rise was pulled back, and higher levels felt easier).
      const dw = st.drift || (st.standard && inCourse && ev && !['story', 'milestone', 'crisis'].includes(ev.class) ? this.ladder('course_drift') : this.defaultDrift(ev));
      const k = this.ladder('drift')[dw] || 0;
      const dc = base + k * (this.expectedSkill() - base);
      const z0 = this.likelihoodZ(st.odds, st.steps, actor), ms = this.isMilestone(eventId);
      const odds = (x) => this.bellOdds(sv, x, z0, st.swing, ms);
      return { skill: skills.join('+'), value: sv, dc, win: odds(st.partial ? dc + 5 : dc), atLeastPartial: odds(st.partial ? dc - 5 : dc) };
    }
    // Challenge odds (design §8.6, §9.2): {skill value, dc, win %, partial-or-better %}
    challengeOdds(st, actor, eventId) {
      if (st.ladder) return this.ladderOdds(st, actor, eventId);
      const ct = this._ctxTrack && this.trackState(this._ctxTrack);
      const { skills, value: sv } = this.checkValue(st);
      const e = this.expectedSkill();
      const DT = ['trivial', 'easy', 'medium', 'hard', 'heroic'];
      // Harder at higher course levels (L-3, L6): a course card's check is one tier up per level above I; the hard
      // variant adds one more (capped at heroic).
      const lvUp = ct && ct.status === 'enrolled' && this.c.tracks[this._ctxTrack] && this.c.tracks[this._ctxTrack].kind === 'course' ? Math.max(0, (ct.level || 1) - 1) : 0;
      const tier = DT[Math.min(4, DT.indexOf(st.tier) + lvUp + (this._variant === 'hard' ? 1 : 0))];
      let dc = e + this.difficulty(tier);
      if (st.vs) dc += clamp(this.statOf((this._cast && this._cast[st.vs.who]) || st.vs.who, st.vs.stat, actor) - e, -15, 15);   // a cast role resolves to its character
      const slope = this.swingSlope(st.swing), [lo, hi] = this.oddsRange(this.isMilestone(eventId));
      const odds = (x) => clamp(Math.round(50 + slope * (sv - x)), lo, hi);
      return st.partial ? { skill: skills.join('+'), value: sv, dc, win: odds(dc + 5), atLeastPartial: odds(dc - 5) } : { skill: skills.join('+'), value: sv, dc, win: odds(dc), atLeastPartial: odds(dc) };
    }
    // The range odds are clamped to (L-3, `@balance odds: min 5 max 95`): a forced fail and a forced success. A milestone
    // (a `class: milestone` card, an exam) has no forced fail: enough skill makes it certain.
    oddsRange(milestone) { const o = Object.assign({ min: 5, max: 95 }, (this.c.balance && this.c.balance.odds) || {}); return [o.min, milestone ? 100 : o.max]; }
    // Exam preparation (L-3, `@balance study: attend 1 cap 15`): what a course card adds by itself, and the most it counts.
    // Exams (2026-10-19): `sigma` is the careful exam's spread; preparation lifts the pass chance smoothly from `pass_from`
    // to certain at `pass_at`, and B-or-better from `b_from` to certain at `b_at`.
    examRule() { return Object.assign({ a: 15, b: 5, pass: -5, ambitious: 8, ambitious_sigma: 20, sigma: 12, pass_from: 99, pass_at: 100, b_from: 99, b_at: 100 }, (this.c.balance && this.c.balance.exam_bands) || {}); }
    // `check`: a month's class preparation when a check in that course's class is won (instead of `monthly`).
    studyRule() { return Object.assign({ attend: 3, cap: 15, monthly: 0, check: 0 }, (this.c.balance && this.c.balance.study) || {}); }
    // A known spell's bonus on checks that test its discipline's skill (design §9.2; L-3, `@balance spell_check: per 2 cap 6`).
    spellCheck() { return Object.assign({ per: 3, cap: 15 }, (this.c.balance && this.c.balance.spell_check) || {}); }
    // An exam's bar before study and the advisor: a legacy tier is the expected skill + its offset; a ladder tier
    // (a rung, or `standard±N`) is that difficulty with low drift (checks.md).
    examBar(id, level) {
      const tier = this.examTier(level);
      if (DEFAULT_DIFFICULTY.hasOwnProperty(tier)) return this.expectedSkill() + this.difficulty(tier);
      const m = tier.match(/^standard([+-]\d+)?$/);
      const base = m ? this.courseStandard(id, level) + (m[1] ? +m[1] : 0) * this.rungStep() : this.rungValue(tier);
      return base + this.ladder('drift').low * (this.expectedSkill() - base);
    }
    // A course exam's difficulty at a course level (`@balance exam_tiers: easy medium hard`; L alarms).
    examTier(level) { const w = (this.c.balance && this.c.balance.exam_tiers) || ['medium', 'hard', 'heroic']; return w[Math.min(w.length, Math.max(1, level)) - 1]; }
    isMilestone(eventId) { const e = eventId && this.c.events[eventId]; return !!e && e.class === 'milestone'; }
    // How much skill moves the odds (playtest 2, M14): `wild` checks swing whatever your skill, `steady` ones follow it closely.
    swingSlope(sw) { const d = (this.c.balance && this.c.balance.swing) || {}, k = sw || 'normal'; return d[k] != null ? d[k] : { normal: 2.5, wild: 1.2, steady: 4 }[k]; }
    // The combat stub (playtest 2, M39), until the minigame: a mix of arcana, vigor and guile, how you are right now
    // (health, mood and mana, each around half its max) and every spell level you know. Weights in `@balance combat:`.
    combatWeights() { return Object.assign({ arcana: 1, vigor: 1, guile: 0.5, condition: 0.2, spells: 1.5 }, (this.c.balance && this.c.balance.combat) || {}); }
    combatValue() {
      const s = this.s, w = this.combatWeights();
      let sum = 0, tw = 0;
      for (const k of Object.keys(w)) if (this.c.skills[k] && w[k]) { sum += w[k] * (s.vals[k] || 0); tw += w[k]; }
      const cond = ['health', 'mood', this.spellResource].filter((k) => this.c.resources[k]);
      // Each as a share of its max (one Mana scale with the fight, 2026-10-18: Mana's pool is about 32–53, not 100).
      const shape = cond.length ? cond.reduce((a, k) => a + 100 * (s.vals[k] || 0) / Math.max(1, this.resMax(this.c.resources[k])), 0) / cond.length - 50 : 0;
      const levels = Object.entries(s.spells || {}).reduce((a, [id, lv]) => a + (this.c.spells[id] ? lv || 0 : 0), 0);
      return (tw ? sum / tw : 0) + (w.condition || 0) * shape + Math.min(15, (w.spells || 0) * levels);
    }
    // The negotiation stub (E8), until the minigame: a weighted mean of charm, lore and guile, plus how you come across now:
    // mood and renown, each counted from where it starts a run (a newcomer's renown costs nothing; fame helps, gloom hurts).
    // `using <skill>` doubles that skill's weight. Weights in `@balance negotiate:`.
    negotiateWeights() { return Object.assign({ charm: 1, lore: 1, guile: 1, mood: 0.15, renown: 0.15 }, (this.c.balance && this.c.balance.negotiate) || {}); }
    parleyValue(using) {
      const s = this.s, w = this.negotiateWeights();
      if (using) w[using] = (w[using] || 1) * 2;
      let sum = 0, tw = 0, cond = 0;
      for (const [k, x] of Object.entries(w)) {
        if (!x) continue;
        if (this.c.skills[k]) { sum += x * (s.vals[k] || 0); tw += x; }
        else if (this.c.resources[k]) { const r = this.c.resources[k]; cond += x * 100 * ((s.vals[k] || 0) - (r.start ?? 50)) / Math.max(1, this.resMax(r)); }
      }
      return (tw ? sum / tw : 0) + cond;
    }
    // Coursework (feedback 2026-10-15): each enrolled course trains its main skill once a term month, at its level's
    // size (`@balance coursework: small small small`), like a job's wage: through the first of its cards you play that
    // month (or a `coursework` statement), else at the month's end. Returns whether it was given now.
    courseworkFor(id, ctx) {
      const s = this.s, t = s.tracks && s.tracks[id], d = this.c.tracks[id];
      if (!t || !d || d.kind !== 'course' || t.status !== 'enrolled' || this.phaseOf() !== 'term' || t.cw === s.turn) return false;
      const sk = this.trackSkills(id)[0]; if (!sk) return false;
      const tiers = (this.c.balance && this.c.balance.coursework) || ['small', 'small', 'small'];
      t.cw = s.turn;
      // XP from the xp row for every course, whatever its skill (Lore has a smaller row of its own), so courses of one
      // level train equally.
      const xp = this.tierAmount('xp', tiers[Math.min(tiers.length, Math.max(1, t.level || 1)) - 1]);
      this.run([{ t: 'delta', name: sk, min: xp, max: xp }], ctx);
      // And exam preparation (feedback 2026-10-15b): `@balance study: monthly N`, shown like any study. Only in the
      // months before the exam (2026-10-19): the exam month's class comes too late to count.
      const prep = this.isTermEnd() ? 0 : this.studyRule().monthly || 0;
      if (prep) this.run([{ t: 'study', track: id, min: prep, max: prep }], ctx);
      return true;
    }
    // A check won in a course's class (2026-10-19) makes that month's preparation `@balance study: check` instead of
    // `monthly`: once a month per course, however many checks its cards hold, and not in the exam month.
    classCheckPrep(id, ctx) {
      const s = this.s, t = s.tracks && s.tracks[id], d = this.c.tracks[id], sr = this.studyRule();
      if (!t || !d || d.kind !== 'course' || t.status !== 'enrolled' || this.phaseOf() !== 'term' || this.isTermEnd() || t.cw !== s.turn || t.cwCheck === s.turn) return;
      const extra = (sr.check || 0) - (sr.monthly || 0);
      if (extra <= 0 || !ctx.checks.some((c) => (c.challenge ? c.result === 'win' : c.ok))) return;
      t.cwCheck = s.turn;
      this.run([{ t: 'study', track: id, min: extra, max: extra }], ctx);
    }
    // One shift's pay (M10): the job's `pay:` at your rank × the wage word's share (`@balance wage:`), less while
    // benched. No double wage on a break (M6): holiday work is the gigs'.
    wageFor(id, size) {
      const d = this.c.tracks[id], t = this.trackState(id);
      if (!d || !d.pay || !t || t.status !== 'member') return 0;
      const share = Object.assign({ short: 0.5, full: 1, overtime: 2 }, (this.c.balance && this.c.balance.wage) || {})[size || 'full'];
      return Math.round(d.pay[Math.min(t.rank || 0, d.pay.length - 1)] * (share == null ? 1 : share) * (t.benched ? 0.6 : 1));
    }
    // Rivalry bottoms out at −50 (feedback 2026-10-20); friendship still runs to 100.
    relFloor() { return -50; }
    sparkFollow() { return Object.assign({ per: 25, cap: 2, partner: 3, cooldown: 30, from: 0 }, (this.c.balance && this.c.balance.spark_follow) || {}); }
    // Crossing the cooldown mark upward pushes `@game spark_cooldown` once (until spark falls back below it), so the
    // player can say whether they want this (M37). Partners aren't asked.
    sparkCheck(id, n) {
      const ev = this.c.game.spark_cooldown, th = this.sparkFollow().cooldown;
      if (!ev || !this.c.events[ev]) return;
      if (n.spark < th) { n.coolAsked = false; return; }
      if (n.coolAsked || n.bond === 'partner') return;
      n.coolAsked = true; n.sparkAsked = true;   // from now on, spark that friendship carries along shows (2026-10-20)
      this.s.queue.push({ id: ev, actor: id, due: this.s.turn + 1, src: 'queued' });
    }
    // A job up front (M23): what one shift pays a new hire, read from the job's own cards (wages, tips and fines
    // averaged over their options and outcomes), and the shifts a term asks for.
    jobOutlook(id) {
      const d = this.c.tracks[id]; if (!d || d.kind !== 'job' || !d.pay) return null;
      const share = Object.assign({ short: 0.5, full: 1, overtime: 2 }, (this.c.balance && this.c.balance.wage) || {});
      const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
      const gold = (effs) => (effs || []).reduce((sum, st) => {
        if (st.t === 'wage') return sum + d.pay[0] * (share[st.size || 'full'] == null ? 1 : share[st.size || 'full']);
        if (st.t === 'delta' && st.name === 'gold') return sum + (st.tier ? st.sign * this.tierAmount('gold', st.tier) : (st.min + st.max) / 2);
        if (st.t === 'challenge') return sum + mean([st.win, st.partial, st.lose].filter(Boolean).map(gold));
        if (st.t === 'chance') { const p = /^\d+$/.test((st.p && st.p.src) || '') ? +st.p.src / 100 : 0.5; return sum + p * gold(st.body) + (1 - p) * gold(st.else); }
        if (st.t === 'if') return sum + mean(st.branches.map((b) => gold(b.body)).concat(st.else ? [gold(st.else)] : []));
        return sum;
      }, 0);
      const cards = Object.values(this.c.events).filter((e) => e.track === id && (!e.rank || e.rank <= 1));
      const shift = cards.length ? mean(cards.map((e) => mean((e.options || []).map((o) => gold(o.effects))))) : d.pay[0];
      return { shift: Math.round(shift), due: d.due || 0 };
    }
    // Entering a fight spends mana (M5): `@balance combat_cost:` (a tier, default small).
    combatCost() { return this.tierAmount(this.spellResource, (this.c.balance && this.c.balance.combat_cost) || 'small') || 0; }

    /* ---------------- Fights: the combat minigame (combat/, wired 2026-10-18) ----------------
     * Every combat and duel challenge is played. The engine stays DOM-free: it describes the fight (fightRequest), and a
     * result comes back either from the UI (fightAhead before choose, then choose(key, {fights: [result]})) or from a
     * resolver set as `eng.fights = request => result` (the simulated players, tools/combat-sim.js). A result is
     * {outcome: win|lose|draw, reason: knockout|decision|stalemate|conceded, deltas: {health, mana, mood, renown, gold,
     * alignment}, followUps: [], foe, exchanges, rules} (src/combat.js turns the minigame's settle() into one). */
    // The player as the fight reads them: skills, the spells content knows and their levels, the bars.
    fightPlayer() {
      const s = this.s, skills = {}, spells = {};
      for (const k of this.c.order.skills || Object.keys(this.c.skills)) skills[k] = Math.round((s.vals[k] || 0) * 100) / 100;
      for (const [id, lv] of Object.entries(s.spells || {})) if (this.c.spells[id] && lv > 0) spells[id] = lv;
      const v = (k) => s.vals[k] || 0;
      return { name: s.name, pronouns: s.pronouns || 'they', skills, spells, health: v('health'), mana: v(this.spellResource), maxMana: this.resMax(this.c.resources[this.spellResource]),
        mood: v('mood'), renown: v('renown'), gold: v('gold'), alignment: v('alignment'),
        // The worn kit (E4): flat modifiers the fight applies to you (hp, mana, costs, on-cast and on-defend damage, damage taken).
        mods: this.wornMods() };
    }
    // Everything the bridge needs to set up a challenge's fight. `id` (event/option#index) ties a result to its fight.
    fightRequest(st, ctx) { return this.minigameRequest(st, ctx, 'fight'); }
    // A negotiation's request (E8), the same shape: for the minigame's resolver (`eng.parleys`), the registry
    // (src/negotiation.js) keys it by event/option.
    parleyRequest(st, ctx) { return this.minigameRequest(st, ctx, 'parley'); }
    minigameRequest(st, ctx, mg) {
      const s = this.s, e = this.c.events[ctx.key] || {}, key = this._optKey || 'show';
      const list = []; G.walkEffects(this._optEffects || e.on_show || [], (x) => { if (x.t === 'challenge' && MINIGAME_KINDS[x.kind] === mg) list.push(x); });
      const index = Math.max(0, list.indexOf(st));
      const odds = this.challengeOdds(st, ctx.actor, ctx.key);
      let vs = null;
      if (st.vs) { const who = (this._cast && this._cast[st.vs.who]) || (st.vs.who === 'npc' ? ctx.actor : st.vs.who); if (who && this.c.npcs[who]) vs = { npc: who, stat: st.vs.stat }; }
      let h = 2166136261; const str = s.seed + ':' + s.turn + ':' + e.id + ':' + key + ':' + index;
      for (let k = 0; k < str.length; k++) { h ^= str.charCodeAt(k); h = Math.imul(h, 16777619); }
      return { id: e.id + '/' + key + '#' + index, event: e.id, option: key, index, kind: st.kind, cls: e.class || null, line: st.line || null,
        dc: Math.round(odds.dc * 100) / 100, odds: st.odds || 'even', swing: st.swing || null, vs, partial: !!(st.partial && st.partial.length),
        actor: ctx.actor || null, cast: this._cast || null, variantHash: this.variantHash(e.id), seed: h >>> 0,
        turn: s.turn, year: this.yearOf(), met: Object.keys(s.npcs).filter((id) => s.npcs[id].met), player: this.fightPlayer() };
    }
    // A played fight: its result picks the challenge's outcome; the fight's own costs are applied, and the outcome runs without
    // its Health lines. win → win; a draw, or a loss on points, → partial when the challenge has one, else lose; a knockout → lose.
    playFight(st, ctx) {
      const s = this.s, req = this.fightRequest(st, ctx);
      const res = this._fightQueue && this._fightQueue.length ? this._fightQueue.shift() : this.fights(req);
      if (!res || !['win', 'lose', 'draw'].includes(res.outcome)) throw new Error('fight ' + req.id + ': no result');
      (ctx.fights = ctx.fights || []).push(res);   // the run log keeps the results, so a logged run replays without its fights
      if (res.request && res.request !== req.id) throw new Error('fight result for ' + res.request + ' handed to ' + req.id);
      const partial = !!(st.partial && st.partial.length);
      const result = res.outcome === 'win' ? 'win' : (res.outcome === 'draw' || res.reason === 'decision') && partial ? 'partial' : 'lose';
      for (const [k, v] of Object.entries(res.deltas || {})) if (v && (this.c.resources[k] || this.c.skills[k])) this.change(k, v, ctx);
      ctx.checks.push({ challenge: st.kind, fight: true, result, ok: result !== 'lose', outcome: res.outcome, reason: res.reason || null });
      ctx.notes.push({ kind: 'fight', outcome: res.outcome, reason: res.reason || null, foe: res.foe || null, exchanges: res.exchanges || null });
      (s.fights = s.fights || []).push({ turn: s.turn, id: req.id, foe: res.foe ? res.foe.id || res.foe.name || null : null, level: res.foe ? res.foe.level || null : null,
        outcome: res.outcome, reason: res.reason || null, result, exchanges: res.exchanges || null, rules: res.rules || null });
      if (s.fights.length > 300) s.fights.shift();
      // The minigame invents no story: a witnessed forbidden cast becomes the academy's consequence (`@game forbidden_report`).
      for (const f of res.followUps || []) {
        const ev = f === 'forbidden_cast_report' || (f && f.kind === 'forbidden_cast_report') ? (this.c.game || {}).forbidden_report : null;
        if (ev && this.c.events[ev]) s.deck.push({ id: ev, actor: null, src: 'queued' });
      }
      const was = this._fightOutcome; this._fightOutcome = true;
      try { this.run(st[result], ctx); } finally { this._fightOutcome = was; }
    }
    // A played negotiation (E8): the minigame's result {outcome: win|partial|lose, deltas} picks the challenge's outcome.
    playParley(st, ctx) {
      const req = this.parleyRequest(st, ctx);
      const res = this._parleyQueue && this._parleyQueue.length ? this._parleyQueue.shift() : this.parleys(req);
      if (!res || !['win', 'partial', 'lose'].includes(res.outcome)) throw new Error('negotiation ' + req.id + ': no result');
      (ctx.parleys = ctx.parleys || []).push(res);
      const result = res.outcome === 'partial' && !(st.partial && st.partial.length) ? 'lose' : res.outcome;
      for (const [k, v] of Object.entries(res.deltas || {})) if (v && (this.c.resources[k] || this.c.skills[k])) this.change(k, v, ctx);
      ctx.checks.push({ challenge: st.kind, parley: true, played: true, result, ok: result !== 'lose' });
      this.run(st[result], ctx);
    }
    // The fight choosing `key` would start, before anything happens: the option is played on a copy of the run (same random
    // state) up to its first fight. null when the option starts none on this path.
    fightAhead(key) {
      if (!this.s.cur) return null;
      const twin = new this.constructor(this.c).load(JSON.parse(this.save()));
      const STOP = {}; let found = null;
      twin.fights = (req) => { found = req; throw STOP; };
      try { twin.choose(key); } catch (err) { if (err !== STOP) throw err; }
      return found;
    }
    // The advisor modifier (design §9.2): how the track's `lead:` (its professor, captain or employer) feels about you, rel / 5, within ±15.
    advisorBonus(trackId) {
      const d = trackId && this.c.tracks[trackId], n = d && d.lead && this.s.npcs[d.lead];
      return n && n.met ? clamp(Math.round(n.rel / 5), -15, 15) : 0;
    }
    // Spells v2: a spell has one or three levels (its `cost:` values), and its skills (`skill:`, else its discipline's).
    spellLevels(id) { const d = this.c.spells && this.c.spells[id]; return d && d.cost && d.cost.length ? d.cost.length : 1; }
    spellSkills(id) { const d = this.c.spells && this.c.spells[id]; if (!d) return []; if (d.skill) return [].concat(d.skill).filter((k) => this.c.skills[k]); return d.discipline ? this.trackSkills(d.discipline) : []; }
    // Casting a known spell from an `up[]` option: its Mana, and alignment for a spell that moves it (`alignment: small`);
    // a forbidden spell's cast costs `@balance forbidden_cast: alignment N` instead, when set (feedback 2026-10-19).
    chargeCast(id, cost, ctx) {
      this.change(this.spellResource, -cost, ctx);
      const d = this.c.spells[id], fc = d && d.pool === 'forbidden' && this.c.balance && this.c.balance.forbidden_cast;
      const al = d && d.alignment && this.c.resources.alignment ? (fc && fc.alignment != null ? fc.alignment : this.tierAmount('alignment', d.alignment)) : 0;
      if (al) this.change('alignment', -al, ctx);
    }
    spellCost(id, level) { const d = this.c.spells && this.c.spells[id]; return d && d.cost ? d.cost[clamp((level || 1) - 1, 0, d.cost.length - 1)] : 0; }
    get spellResource() { return this.c.game.spell_resource || 'mana'; }
    // What an option charges up front in `@game afford:`'s resource (review fixes): the top-level costs, not those
    // inside a check, a chance or a condition. A range counts at its worst. 0 when the game doesn't set `afford:`.
    priceOf(o) {
      const res = this.c.game.afford; if (!res) return 0;
      let p = 0;
      for (const st of o.effects || []) if (st.t === 'delta' && st.name === res) {
        const v = st.tier ? st.sign * this.tierAmount(res, st.tier) : Math.min(st.min, st.max);
        if (v < 0) p -= v;
      }
      return p;
    }
    // Options you can't pay for are locked, unless that would lock every option on the card (never soft-lock: then
    // you pay what you have). Returns the set of keys locked for want of money.
    poorKeys(e, opts, a) {
      const res = this.c.game.afford; if (!res) return new Set();
      const have = this.s.vals[res] || 0;
      const poor = new Set(opts.filter((o) => { const p = this.priceOf(o); return p > 0 && have < p; }).map((o) => o.key));
      if (!poor.size) return poor;
      const open = opts.some((o) => !poor.has(o.key) && !(o.when && !this.test(o.when, a)) && !(o.spell && !(this.s.spells || {})[o.spell]) && !(o.item && !this.hasItem(o.item)) && o.key !== 'up');
      return open ? poor : new Set();
    }

    /* ---------------- Tracks (design §7) ---------------- */
    trackState(id) { id = this._ctxTrack && id === 'track' ? this._ctxTrack : id; return (this.s.tracks || {})[id] || null; }
    levelPassed(id) { const t = this.trackState(id); if (!t || !t.passed) return 0; return Math.max(0, ...Object.keys(t.passed).filter((l) => t.passed[l] !== 'F').map(Number)); }
    trackSkills(id) { const d = this.c.tracks[id]; return d && d.skill ? [].concat(d.skill) : []; }
    // GPA from every graded course (A 4 · B 3 · C 2 · F 0); 0 before the first exams.
    gpa() {
      const pts = { A: 4, B: 3, C: 2, F: 0 }, all = [];
      for (const t of Object.values(this.s.tracks || {})) for (const g of t.grades || []) all.push(pts[g]);
      return all.length ? Math.round((all.reduce((a, b) => a + b, 0) / all.length) * 100) / 100 : 0;
    }
    // `term_gpa` (origin design 2026-10-16): the GPA of the latest completed term, appeals included; 0 when that
    // term graded no course. Grades are recorded by term as they are sat (sitExam) and rewritten by `regrade`.
    termGpa() {
      const s = this.s, pts = { A: 4, B: 3, C: 2, F: 0 };
      let last = this.termIndex();
      if (this.phaseOf() === 'term' && !this.isTermEnd()) last -= 1;   // the current term isn't complete yet
      const gs = ((s.termGrades || {})[last] || []).map((x) => pts[x.grade]);
      return gs.length ? Math.round((gs.reduce((a, b) => a + b, 0) / gs.length) * 100) / 100 : 0;
    }
    trackSize(row, tier, dflt) { const sz = this.c.balance && this.c.balance.sizes && this.c.balance.sizes[row]; return (sz || dflt)[TIER_INDEX[tier]]; }
    // Legacy states a track stands for (compat: old class/club/job events stay gated on them).
    grantLegacy(id, ctx, on) {
      // Bypasses `group:` exclusivity: one track may stand for several old electives (Evocation = Pyromancy + Tidecalling).
      for (const st of (this.c.tracks[id] || {}).legacy || []) {
        const d = this.c.states[st]; if (!d) continue;
        if (on && !this.s.states[st]) { this.s.states[st] = { left: null, since: this.s.turn, legacy: id }; this.run(d.on_add, ctx); }
        else if (!on && this.s.states[st] && this.s.states[st].legacy === id) { delete this.s.states[st]; this.run(d.on_remove, ctx); }
      }
    }
    trackKinds() { return this._kinds || (this._kinds = new Set(Object.values(this.c.tracks || {}).map((d) => d.kind))); }
    // The track a track statement acts on: `track` is the card's own; a track kind (`leave job`, `perform internship`,
    // X12) is whichever one of that kind you have. Tools ask this too, so they never re-derive it (A1).
    trackTarget(st, ctxTrack) {
      const s = this.s, id = st.track === 'track' ? ctxTrack : st.track;
      if (!this.c.tracks[id] && this.trackKinds().has(id)) return Object.keys(s.tracks || {}).find((k) => s.tracks[k].kind === id && s.tracks[k].status === 'member');
      return id;
    }
    trackOp(st, ctx) {
      const s = this.s;
      const id = this.trackTarget(st, ctx.track);
      const d = this.c.tracks[id];
      if (!d) return;
      if (d.kind === 'society' && (st.t === 'perform' || st.t === 'rank_xp' || st.t === 'promote')) return;   // no performance or ranks (M40)
      s.tracks = s.tracks || {};
      const t = s.tracks[id] = s.tracks[id] || { kind: d.kind, status: 'none', passed: {}, grades: [], rank: 0, perf: 50, rankXp: 0, visits: 0, due: d.due || 0, progress: 0, study: 0 };
      switch (st.t) {
        case 'enrol': {
          if (d.kind !== 'course' && d.kind !== 'thesis') return;
          t.status = 'enrolled'; t.level = st.level || Math.min(d.levels || 1, this.levelPassed(id) + 1); t.study = 0;
          ctx.notes.push({ kind: 'enrol', track: id, level: t.level });
          // You meet the course's professor (design §5.5) first: their intro card goes ahead of the start card.
          this.meetLead(id, d, ctx);
          // A course's `start:` card (spells v2: the lesson that teaches its spell) comes later the same month, in its context.
          if (d.start && this.c.events[d.start] && !s.deck.some((q) => q.id === d.start)) s.deck.push({ id: d.start, actor: null, track: id, src: 'queued' });
          this.grantLegacy(id, ctx, true);
          break;
        }
        case 'join': {
          if (t.status === 'member') return;
          if (d.kind === 'job' && t.unreliableUntil && this.termIndex() < t.unreliableUntil) return;
          // One club, one job and one internship at a time (decision D3; M16).
          for (const [oid, o] of Object.entries(s.tracks)) if (oid !== id && o.status === 'member' && o.kind === d.kind && (d.kind === 'club' || d.kind === 'job' || d.kind === 'internship')) { o.status = 'left'; this.grantLegacy(oid, ctx, false); ctx.notes.push({ kind: 'leave', track: oid }); }
          t.status = 'member'; t.perf = t.dropped ? 30 : 50; t.visits = 0; t.due = d.due || 0; t.benched = false;
          // Joining mid-term (M34): at most one visit is due per month left in the term, this one included; a job one fewer
          // (feedback 2026-10-20: a month's grace to settle in).
          if (this.phaseOf() === 'term') { let left = 0; for (let k = s.turn; k <= this.maxTurns && this.phaseOf(k) === 'term'; k++) left++; t.due = Math.min(t.due, Math.max(0, left - (d.kind === 'job' ? 1 : 0))); }
          ctx.notes.push({ kind: 'join', track: id });
          // A member is shown the way in: the track's place is discovered (the duel hall, the courier loft, …).
          if (d.place && this.c.places[d.place] && !s.places[d.place]) { s.places[d.place] = { found: s.turn }; ctx.notes.push({ kind: 'discover', place: d.place }); }
          this.meetLead(id, d, ctx);   // and whoever runs it
          this.grantLegacy(id, ctx, true);
          break;
        }
        case 'leave': if (t.status === 'member' || t.status === 'enrolled') { t.status = 'left'; this.grantLegacy(id, ctx, false); ctx.notes.push({ kind: 'leave', track: id }); }
          else if (t.status === 'applied') t.status = 'none';   // withdrawing, or turned down (M36)
          break;
        case 'apply': if (t.status === 'none' || t.status === 'left') t.status = 'applied'; break;
        case 'promote': {
          const ranks = (d.ranks || '').split(/\s*[,，、]\s*/).filter(Boolean).length || 1;
          if (t.rank < ranks - 1) { t.rank++; t.rankXp = 0; t.perf = 50;   // a new rank starts its performance afresh (M12)
            ctx.notes.push({ kind: 'promote', track: id, rank: t.rank }); }
          break;
        }
        case 'perform': { const amt = st.tier ? st.sign * this.trackSize('performance', st.tier, [2, 5, 8, 15, 25]) : st.min; t.perf = clamp((t.perf || 0) + amt, 0, 100); ctx.deltas['perf:' + id] = (ctx.deltas['perf:' + id] || 0) + amt; break; }
        case 'rank_xp': { const amt = st.tier ? st.sign * this.tierAmount('xp', st.tier) : st.min; t.rankXp = Math.max(0, (t.rankXp || 0) + amt); break; }
        case 'progress': { const amt = st.tier ? st.sign * this.trackSize('progress', st.tier, [2, 4, 8, 15, 25]) : st.min; t.progress = clamp((t.progress || 0) + amt, 0, 100); ctx.deltas['progress:' + id] = (ctx.deltas['progress:' + id] || 0) + amt; break; }
      }
    }
    // Visiting a club/job/thesis place you belong to (design §6.2): attendance, performance, pay, rank XP.
    attend(id, ctx) {
      const s = this.s, t = this.trackState(id), d = this.c.tracks[id];
      if (!t || t.status !== 'member' || !d) return;
      if (d.kind === 'society') return;   // a society keeps no attendance (M40)
      // On a break, a visit is an extra one: it never counts toward the next term's due (playtest 2, B6).
      const brk = this.phaseOf() === 'break';
      // A job is a fixed number of shifts a term (playtest 2, I1, I2): on a break, or once the term's shifts are done,
      // a visit to its place is an ordinary one (no shift card, pay or attendance).
      if (d.kind === 'job' && (brk || t.visits >= (t.due || 0))) return 'off';
      // An internship is the break's work (M16): every visit there counts in full; so does every club visit in term
      // (feedback 2026-10-20: clubs are open-ended, expecting one visit a term unsaid).
      const extra = d.kind !== 'internship' && (brk || (d.kind !== 'club' && t.visits >= t.due));
      if (!brk) t.visits++;
      t.perf = clamp((t.perf || 0) + (extra ? 2 : 8), 0, 100);
      t.rankXp = (t.rankXp || 0) + (extra ? 1 : 2);
      // A job pays through its shift cards (`wage`, M10); only a shift with no card to draw pays here.
      if (d.kind === 'job' && d.pay && !(this.hasShift && this.hasShift(id))) this.change('gold', this.wageFor(id, null), ctx);
      if (d.kind === 'thesis') t.progress = clamp((t.progress || 0) + (extra ? 2 : 5), 0, 100);
      // A club's visit in term says nothing (feedback 2026-10-20: clubs are open-ended; the one visit a term they expect goes
      // unsaid, and only missing it all term is noticed).
      if (!(d.kind === 'club' && !brk)) ctx.notes.push(Object.assign({ kind: 'attend', track: id }, brk ? {} : { left: Math.max(0, t.due - t.visits) }));
      return 'on';
    }
    // End of a term (design §6.2, §7.3): exams for enrolled courses, missed obligations, warnings, promotions.
    endTerm(summary) {
      const s = this.s, pts = { A: 4, B: 3, C: 2, F: 0 };
      const ctx = this.newCtx(null, 'term');
      const excused = Object.keys(s.states).some((k) => this.c.states[k] && (this.c.states[k].tags || []).includes('excuse'));
      for (const [id, t] of Object.entries(s.tracks || {})) {
        const d = this.c.tracks[id]; if (!d) continue;
        // A course not graded by its exam card this month (no `@game exam:`, or the card was never shown) sits it here.
        if (t.status === 'enrolled' && d.kind === 'course') this.sitExam(id, null, ctx);
        if (t.status === 'member' && (d.kind === 'club' || d.kind === 'job' || d.kind === 'thesis')) {
          const missed = excused ? 0 : Math.max(0, (t.due || 0) - (t.visits || 0));
          if (missed) {
            t.perf = clamp(t.perf - 15 * missed, 0, 100);
            if (d.kind === 'thesis') t.progress = clamp((t.progress || 0) - 8 * missed, 0, 100);
            if (d.lead && s.npcs[d.lead]) s.npcs[d.lead].rel = clamp(s.npcs[d.lead].rel - 5 * missed, this.relFloor(), 100);
            ctx.notes.push({ kind: 'missed', track: id, n: missed });
          }
          t.visits = 0;
          if (t.perf <= 0 && d.kind !== 'thesis') {
            t.status = 'dropped'; t.dropped = true; this.grantLegacy(id, ctx, false);
            if (d.kind === 'job') t.unreliableUntil = this.termIndex() + 2;
            ctx.notes.push({ kind: 'dropped', track: id });
          } else {
            t.benched = t.perf < 20;
            // A good term with a club or job pleases whoever runs it (missed visits already cost their regard).
            if (t.perf >= 70 && d.lead && s.npcs[d.lead] && s.npcs[d.lead].met) this.run([{ t: 'rel', npc: d.lead, tier: 'small', sign: 1 }], ctx);
            t.due = t.benched && d.kind === 'job' ? Math.min(2, d.due || 0) : d.due || 0;
            if (t.perf < 40) this.pushTrackEvent('track_warning', id);
            // Every job asks at term end: another term, or not (M33). Not after the last term.
            if (d.kind === 'job') { let more = false; for (let k = s.turn + 1; k <= this.maxTurns && !more; k++) more = this.phaseOf(k) === 'term'; if (more) this.pushTrackEvent('job_term_review', id); }
            const need = ((this.c.balance && this.c.balance.rank_xp) || [10, 25])[t.rank];
            const ranks = (d.ranks || '').split(/\s*[,，、]\s*/).filter(Boolean).length || 1;
            if (t.perf >= 70 && need != null && t.rankXp >= need && t.rank < ranks - 1) this.pushTrackEvent('track_promotion', id);
          }
        }
      }
      // `src` names every month entry for the flow report (A2), labelled or not.
      if (ctx.notes.length) summary.push(Object.assign(this.summaryItem(ctx, null), { src: 'term end' }));
      this.runHooks('term_end', summary);
    }
    // A course's exam (design §7.3): the skill it tests, the bar (the level's difficulty, lowered by study and the
    // advisor) and the chance of each grade: A at 15+ over the bar, B above it, C within 5 below, else F.
    examOdds(id, swing) {
      const s = this.s, t = this.trackState(id), sk = this.trackSkills(id);
      const sv = sk.reduce((a, k) => a + (s.vals[k] || 0), 0) / Math.max(1, sk.length) + this.boost('exam');
      const lv = (t && t.level) || 1, ladder = !DEFAULT_DIFFICULTY.hasOwnProperty(this.examTier(lv));
      const dc = this.examBar(id, lv) - Math.min(this.studyRule().cap, (t && t.study) || 0) - this.advisorBonus(id);
      const slope = this.swingSlope(swing), [lo, hi] = this.oddsRange(true), ex = this.examRule(), wild = swing === 'wild';
      // Grade bands on the bell (feedback 2026-10-15): A, B and a pass each at their margin over the bar. Going for top
      // marks lowers the A mark and is sat at its own spread, so it trades B for A and some F, at about the same GPA.
      const bell = (x) => Math.round(100 * Phi((sv - x) / (wild ? ex.ambitious_sigma : ex.sigma)));
      const odds = ladder ? bell : (x) => clamp(Math.round(50 + slope * (sv - x)), lo, hi);
      // Preparation keeps the floor up (2026-10-19): each floor rises smoothly (smoothstep) to certain, and joins the
      // skill's chance as either one being enough, so 12 prepared is a sure pass and 15 a sure B, whatever the skill.
      const p = Math.min(this.studyRule().cap, (t && t.study) || 0);
      const ramp = (from, at) => { const u = clamp((p - from) / Math.max(1, at - from), 0, 1); return u * u * (3 - 2 * u); };
      const lift = (q, f) => Math.round(100 - (100 - q) * (1 - f));
      const pass = lift(odds(dc + ex.pass), ramp(ex.pass_from, ex.pass_at)), top = Math.min(pass, lift(odds(dc + ex.b), ramp(ex.b_from, ex.b_at)));
      const a = Math.min(top, odds(dc + ex.a - (wild ? ex.ambitious : 0)));
      return { skills: sk, value: sv, bar: dc, probs: [a, top - a, pass - top, 100 - pass], pass, top, a };
    }
    // Sitting a course's exam (M4: an exam card's `sit_exam`, else at term end): the grade, its reasons, the professor's regard, spells.
    sitExam(id, swing, ctx) {
      const s = this.s, t = this.trackState(id), d = this.c.tracks[id];
      if (!t || !d || d.kind !== 'course' || t.status !== 'enrolled') return;
      const o = this.examOdds(id, swing);
      const grade = ['A', 'B', 'C', 'F'][this.pick('exam', o.probs, { exam: id })];
      t.grades.push(grade); t.passed[t.level] = grade; t.status = grade === 'F' ? 'failed' : 'done';
      const ti = this.termIndex(); s.termGrades = s.termGrades || {}; (s.termGrades[ti] = s.termGrades[ti] || []).push({ track: id, level: t.level, grade });
      // Why (B7): the skill tested, its value, the exam's bar (after study and the advisor) and the pass chance.
      ctx.notes.push({ kind: 'grade', track: id, level: t.level, grade, skills: o.skills, value: Math.round(o.value), bar: Math.round(o.bar), pass: o.pass });
      // The professor notices (design §5.5): A warms them a good deal, B a little, F cools them.
      const regard = { A: ['medium', 1], B: ['small', 1], F: ['small', -1] }[grade];
      if (regard && d.lead && s.npcs[d.lead] && s.npcs[d.lead].met) this.run([{ t: 'rel', npc: d.lead, tier: regard[0], sign: regard[1] }], ctx);
      // Passing a level teaches its spells (design §9.1: `teaches: flame@1 tide@2 …`).
      if (grade !== 'F') this.teachLevel(id, t.level, ctx);
      // A failed course can be appealed (playtest 2, N4): `@game appeal` comes next, in the course's context.
      else if (this.c.game.appeal) this.pushTrackEvent(this.c.game.appeal, id);
      this.grantLegacy(id, ctx, false);
    }
    // A course with a `start:` card teaches at the start of each level; passing then only makes up what the start card
    // missed (the spell up to the number of its `teaches:` entries so far), so it never teaches ahead of the next start.
    teachLevel(id, level, ctx) {
      const d = this.c.tracks[id], all = d.teaches || [];
      for (const x of all) if (x.level === level && this.c.spells[x.spell]) {
        const lv = d.start ? all.filter((y) => y.spell === x.spell && y.level <= level).length : null;
        this.run([{ t: 'learn_spell', spell: x.spell, level: lv }], ctx);
      }
    }
    // `regrade track C` (N4): the course's latest grade becomes another; a pass where there was an F teaches the level.
    regrade(st, ctx) {
      const id = this.trackTarget(st, ctx.track || this._ctxTrack), t = this.trackState(id), d = this.c.tracks[id];
      if (!t || !d || d.kind !== 'course' || !t.grades || !t.grades.length) return;
      const was = t.grades[t.grades.length - 1], lv = t.level;
      if (was === st.grade) return;
      t.grades[t.grades.length - 1] = st.grade; t.passed[lv] = st.grade;
      // The term record too (term_gpa): the latest grade of this course at this level.
      const rec = Object.values(this.s.termGrades || {}).flat().filter((x) => x.track === id && x.level === lv).pop();
      if (rec) rec.grade = st.grade;
      if (t.status === 'failed' || t.status === 'done') t.status = st.grade === 'F' ? 'failed' : 'done';
      ctx.notes.push({ kind: 'regrade', track: id, level: lv, from: was, grade: st.grade });
      if (was === 'F' && st.grade !== 'F') this.teachLevel(id, lv, ctx);
    }
    // What an option's first roll looks like on its button: a challenge (with its swing, and combat's mana), an exam, a legacy check.
    checkView(st, actor, item) {
      // A fight (combat, duel) is played (fight: true): its p is the stub's estimate, and it charges no entry Mana.
      if (st.t === 'challenge') { const odds = this.challengeOdds(st, actor, item && item.id), fight = MINIGAME_KINDS[st.kind] === 'fight', parley = MINIGAME_KINDS[st.kind] === 'parley'; return { skill: st.kind, using: odds.skill, p: odds.win, challenge: true, swing: st.swing || null, combat: st.kind === 'combat', fight, parley: parley || undefined, cost: st.kind === 'combat' && !fight ? this.combatCost() : 0 }; }
      if (st.t === 'sit_exam') { const id = (item && item.track) || this._ctxTrack; const o = id && this.trackState(id) ? this.examOdds(id, st.swing) : null; return o ? { exam: true, skill: 'exam', using: o.skills.join('+'), p: o.pass, top: o.top, a: o.a, swing: st.swing || null } : null; }
      // Pure luck (`chance likely:`): the roll's odds and no skill (feedback 2026-10-19: drawn as a roll all the same).
      if (st.t === 'chance') return { luck: true, p: Math.round(st.word ? this.likelihoodP(st.word, st.steps, actor) : clamp(this.value(st.p, actor), 0, 100)) };
      return { skill: st.skill, p: this.checkChance(st.skill, this.value(st.dc, actor)) };
    }
    // An enrolled course as it stands (playtest 2, step 5): exam preparation, the exam's odds if it were sat today,
    // and the months until it (0 = this month, the term's last).
    courseStanding(id) {
      const t = this.trackState(id), sr = this.studyRule(), o = this.examOdds(id, null);
      let examIn = 0;
      for (let k = this.s.turn; k < this.maxTurns && this.phaseOf(k) === 'term' && !this.isTermEnd(k); k++) examIn++;
      return { study: Math.min(sr.cap, (t && t.study) || 0), studyCap: sr.cap, pass: o.pass, top: o.top, examIn };
    }
    // A course on the enrolment menu, up front (playtest 2, M4): what it tests, how hard its exam is, what it teaches,
    // and the pass chance if the exam were today without study.
    courseOutlook(id, level) {
      const d = this.c.tracks[id]; if (!d) return null;
      const lv = level || this.levelPassed(id) + 1;
      const tier = this.examTier(lv);
      const sk = this.trackSkills(id), sv = sk.reduce((a, k) => a + (this.s.vals[k] || 0), 0) / Math.max(1, sk.length);
      const dc = this.examBar(id, lv) - this.advisorBonus(id);
      const pass = DEFAULT_DIFFICULTY.hasOwnProperty(tier) ? clamp(Math.round(50 + this.swingSlope(null) * (sv - (dc - 5))), ...this.oddsRange(true)) : this.bellOdds(sv, dc - 5, 0, null, true);
      return { skills: sk, level: lv, exam: tier, teaches: (d.teaches || []).filter((x) => x.level === lv).map((x) => x.spell), pass };
    }
    // Generated menu options (design §7.3, §7.4): `offers: courses | clubs | jobs`.
    offered(kind) {
      const s = this.s, out = [], ti = this.termIndex();
      for (const d of Object.values(this.c.tracks || {})) {
        const t = (s.tracks || {})[d.id];
        if (kind === 'courses' && d.kind === 'course') {
          if (t && t.status === 'enrolled') continue;
          const lv = this.levelPassed(d.id) + 1;
          if (lv > (d.levels || 1)) continue;
          if (d.hidden) { if (ti < 5 || !(d.prereq && this.test(d.prereq, null))) continue; }
          else if (lv === 1 ? ti < (d.opens || 1) : ti < ({ 2: 2, 3: 4 }[lv] || 99)) continue;
          const names = (d.level_names || d.name).split(/\s*[,，、]\s*/);
          out.push({ key: d.id, label: names[lv - 1] || d.name, hint: d.desc || null, effects: [{ t: 'enrol', track: d.id, level: lv }].concat(this.pickedSay(d)) });
        } else if ((kind === 'clubs' && d.kind === 'club') || (kind === 'jobs' && d.kind === 'job')) {
          if (d.hidden || (t && t.status === 'member') || (t && t.unreliableUntil && ti < t.unreliableUntil)) continue;
          // No one takes on staff in a term's last month (feedback 2026-10-20): jobs start next term (or on a break).
          if (d.kind === 'job' && this.phaseOf() === 'term' && this.isTermEnd()) continue;
          // Switching (M35): joining leaves the one you're in, its rank and performance with it.
          const cur = Object.entries(s.tracks || {}).find(([k, o]) => o.status === 'member' && o.kind === d.kind && k !== d.id);
          out.push({ key: d.id, label: d.name, hint: d.desc || null, effects: [{ t: 'join', track: d.id }].concat(this.pickedSay(d)), switching: cur ? { from: cur[0], rank: cur[1].rank || 0, perf: Math.round(cur[1].perf || 0) } : null });
        }
      }
      return out;
    }
    // A generated option's outcome: the track's `picked:` line. A multi-pick menu joins the chosen ones in order.
    pickedSay(d) { return d.picked ? [this.sayIndex['track:' + d.id] || { t: 'say', text: d.picked, sid: 'track:' + d.id }] : []; }
    optionsOf(e) {
      if (!e.offers) return e.options;
      const gen = this.offered(e.offers).map((o) => ({ ...o, when: null, memory: null, spell: null, line: e.line, affects: [], firstCheck: null, generated: true }));
      return gen.concat(e.options);
    }
    // How many options a menu takes (`pick: N`; the year-4 thesis takes one course slot).
    pickCount(e) {
      if (!e.pick) return 1;
      const thesis = Object.values(this.s.tracks || {}).some((t) => t.kind === 'thesis' && t.status === 'member');
      return Math.max(1, e.pick - (e.offers === 'courses' && thesis ? 1 : 0));
    }
    // A track's lead (design §5.5): already met, they notice you; not yet, the track's `intro:` card is pushed so you meet
    // them on a card of their own (playtest 2, N1); a track without one meets them at once, as before. The intro joins
    // today's deck when its `when` holds now, so it plays before the track's start card and its routine draws (a zh-CN
    // playtest, 2026-10-20: Vey taught two scenes before her intro); otherwise it waits in the queue as before.
    meetLead(id, d, ctx) {
      const s = this.s, n = d.lead && s.npcs[d.lead];
      if (!n) return;
      const intro = !n.met && d.intro && this.c.events[d.intro];
      if (intro) {
        if (s.deck.some((q) => q.id === d.intro)) return;
        if (this.test(intro.when, d.lead)) {
          s.queue = s.queue.filter((q) => q.id !== d.intro);
          s.deck.push({ id: d.intro, actor: d.lead, track: id, src: 'queued' });
        } else if (!s.queue.some((q) => q.id === d.intro)) s.queue.push({ id: d.intro, actor: d.lead, track: id, due: s.turn, src: 'queued' });
        return;
      }
      this.touchNpc(d.lead, ctx);
    }
    pushTrackEvent(eventId, track) { if (this.c.events[eventId]) this.s.queue.push({ id: eventId, actor: null, track, due: this.s.turn + 1, src: 'queued' }); }

    /* ---------------- Places, arcs, skills (design §6, §10.6, §8.5) ---------------- */
    presentAt(place, slot) {
      slot = slot || (this.s.cur && this.s.cur.slot) || this._slot || '';
      return Object.keys(this.s.npcs).filter((id) => this.scheduleOf(id).some((x) => x.place === place && (!slot || x.slots.includes(slot)) && this.onSchedule(id, x, slot)));
    }
    // Where a character can be this month (M42): their break schedule on a break, if they have one.
    scheduleOf(id) {
      const d = this.c.npcs[id]; if (!d) return [];
      if (this.gone(id) || d.distant) return [];
      if (d.schedule_break && this.phaseOf() === 'break') return d.schedule_break.entries;
      return d.schedule || [];
    }
    // Off campus (M38): on a break, under a plan state tagged `away` (home, an internship).
    offCampus() {
      if (this.phaseOf() !== 'break') return false;
      return Object.keys(this.s.states || {}).some((k) => this.c.states[k] && this.c.states[k].kind === 'plan' && (this.c.states[k].tags || []).includes('away'));
    }
    // Away for the break (`schedule_break: away`): reachable only by letter (M19).
    isAway(id) { const d = this.c.npcs[id]; return !!(d && d.schedule_break && d.schedule_break.away && this.phaseOf() === 'break') || this.gone(id) || this.distant(id); }
    // Distant (`distant: true` on the @npc, feedback 2026-10-15): a pen pal. Never on the map or `around()`, fills no
    // cast role and no `actor: any` (letters included), and reaches you only through their own cards, as letters.
    distant(id) { const d = this.c.npcs[id]; return !!(d && d.distant); }
    // Gone (`gone_when:` on the @npc, review fixes): while the condition holds the character is nowhere on the map,
    // fills no role and is drawn for no card except letters; scenes queued for them still play.
    gone(id) { const d = this.c.npcs[id]; return !!(d && d.gone_when && this.test(d.gone_when, id)); }
    // A `place@slot:30` entry holds on 30% of days, decided per month, character, place and slot by a hash of the
    // run's seed (no RNG drawn: the map and the visit agree, and previews stay pure).
    onSchedule(id, x, slot) {
      if (x.chance == null || x.chance >= 100) return true;
      let h = 2166136261; const str = this.s.seed + ':' + this.s.turn + ':' + id + ':' + x.place + ':' + (slot || '');
      for (let k = 0; k < str.length; k++) { h ^= str.charCodeAt(k); h = Math.imul(h, 16777619); }
      return (h >>> 0) % 100 < x.chance;
    }
    // The Journal's view of an arc (X11): the act by name, the clues found and the leads picked up (struck through once
    // `followed:` holds), each in the order found. Null until the arc has begun (its clock moved, or anything found).
    journalOf(arcId) {
      const a = this.c.arcs && this.c.arcs[arcId]; if (!a) return null;
      const s = this.s, act = this.actOf(arcId), found = Object.values(this.c.clues || {}).filter((d) => d.arc === arcId && (s.clues || {})[d.id] != null);
      if (!found.length && !((s.arcs[arcId] || {}).clock > 0)) return null;
      found.sort((x, y) => s.clues[x.id] - s.clues[y.id]);
      const names = (a.act_names || '').split(/\s*[,，、]\s*/).filter(Boolean);
      const row = (d) => ({ id: d.id, name: d.name, text: d.text, turn: s.clues[d.id], key: (a.key_clues || []).includes(d.id) });
      return { id: arcId, name: a.name, act, actName: act ? names[act - 1] || (a.acts[act - 1] || {}).name : null, acts: (a.acts || []).length,
        clues: found.filter((d) => d.kind !== 'lead').map(row),
        leads: found.filter((d) => d.kind === 'lead').map((d) => Object.assign(row(d), { followed: !!(d.followed && this.test(d.followed, null)) })) };
    }
    // Every thread in the Clues panel (feedback 2026-10-15): the arcs with something to show (journalOf), then the side
    // threads (`@clue thread:`) with anything found, in the order they began. A side thread whose leads are all
    // followed is `done`.
    threads() {
      const s = this.s, out = [];
      for (const id of Object.keys(this.c.arcs || {})) {
        const j = this.journalOf(id); if (!j || (!j.clues.length && !j.leads.length && !j.act)) continue;
        if (!j.clues.length && !j.leads.length && this.c.arcs[id].canon !== 'hard') continue;
        out.push(Object.assign(j, { arc: true, hard: this.c.arcs[id].canon === 'hard' }));
      }
      out.sort((a, b) => b.hard - a.hard);
      const side = {};
      for (const d of Object.values(this.c.clues || {})) {
        if (d.arc || !d.thread || (s.clues || {})[d.id] == null) continue;
        const th = side[d.thread] = side[d.thread] || { id: 'thread:' + d.thread, name: d.thread, clues: [], leads: [], first: 999 };
        const row = { id: d.id, name: d.name, text: d.text, turn: s.clues[d.id] };
        th.first = Math.min(th.first, row.turn);
        if (d.kind === 'lead') th.leads.push(Object.assign(row, { followed: !!(d.followed && this.test(d.followed, null)) })); else th.clues.push(row);
      }
      for (const th of Object.values(side).sort((a, b) => a.first - b.first)) {
        th.clues.sort((a, b) => a.turn - b.turn); th.leads.sort((a, b) => a.turn - b.turn);
        th.done = th.leads.length > 0 && th.leads.every((x) => x.followed);
        out.push(th);
      }
      return out;
    }
    actOf(arcId) { const a = this.c.arcs && this.c.arcs[arcId]; if (!a || !a.acts) return 0; return a.acts.filter((x) => x.year <= this.yearOf()).length; }
    monthlyWorld(summary) {
      const s = this.s, ctx = this.newCtx(null, null);
      for (const p of Object.values(this.c.places || {})) if (!s.places[p.id] && p.discover && !p.deprecated && this.test(p.discover, null)) { s.places[p.id] = { found: s.turn }; ctx.notes.push({ kind: 'discover', place: p.id }); }
      for (const a of Object.values(this.c.arcs || {})) {
        const st = s.arcs[a.id] = s.arcs[a.id] || { clock: (a.clock && a.clock.min) || 0 };
        for (const b of a.beats || []) if (b.year === this.yearOf() && b.month === this.monthIndex() && st.clock < b.clock) st.clock = b.clock;
      }
      // Rust (design §8.5): −1 a month after 3 idle months in term time, never below 60% of the peak.
      if (this.phaseOf() === 'term') for (const k of this.c.order.skills) {
        if (s.turn - (s.skillGain[k] || 0) > 3 && s.vals[k] > 0.6 * (s.peak[k] || 0)) { this.change(k, -Math.min(1, s.vals[k] - 0.6 * s.peak[k]), ctx, true); }
      }
      if (ctx.notes.length || Object.keys(ctx.deltas).length) summary.push(Object.assign(this.summaryItem(ctx, null), { src: 'rust and discovery' }));
    }
    // Skill gains are XP (design §8.5): the next point costs a + b × level; mastery and an aligned club or job multiply.
    skillGain(name, amount) {
      const s = this.s, cost = (this.c.balance && this.c.balance.xp_cost) || { a: 1, b: 0 };
      let mult = 1;
      for (const [id, t] of Object.entries(s.tracks || {})) {
        if (!this.trackSkills(id).includes(name)) continue;
        if (t.kind === 'course' && this.levelPassed(id) >= 2) mult += 0.3;
        if ((t.kind === 'club' || t.kind === 'job') && t.status === 'member') mult += 0.15;
      }
      mult = Math.min(mult, 1.6);
      let v = s.vals[name] || 0, xp = amount * mult;
      while (xp > 1e-9) { const c = Math.max(0.05, cost.a + cost.b * v); const step = Math.min(1, xp / c); v += step; xp -= step * c; }
      s.skillGain[name] = s.turn;
      return v - (s.vals[name] || 0);
    }

    /* ---------------- Calendar ---------------- */
    get turn() { return this.s.turn; }
    monthIndex(turn = this.s.turn) { return ((turn - 1) % this.months.length) + 1; }
    yearOf(turn = this.s.turn) { return Math.ceil(turn / this.months.length); }
    monthName(turn = this.s.turn) { return this.months[this.monthIndex(turn) - 1]; }
    phaseOf(turn = this.s.turn) { return this.calendar ? this.calendar[this.monthIndex(turn) - 1] || 'term' : 'term'; }
    seasonOf(turn = this.s.turn) { return this.seasons ? this.seasons[this.monthIndex(turn) - 1] || '' : ''; }
    // 1 for the first term, 2 for the second, … (counting terms only); 0 before the first.
    termIndex(turn = this.s.turn) {
      if (!this.calendar) return Math.ceil(turn / 6);
      let n = 0, prev = null;
      for (let t = 1; t <= turn; t++) { const ph = this.phaseOf(t); if (ph === 'term' && prev !== 'term') n++; prev = ph; }
      return n;
    }
    isTermStart(turn = this.s.turn) { return this.phaseOf(turn) === 'term' && (turn === 1 || this.phaseOf(turn - 1) !== 'term'); }
    // The final year's wrap-up (`@game wrapup:`): break months that close the run, with no plans or duties (playtest 2, M21).
    isWrapUp(turn = this.s.turn) { return this.yearOf(turn) === this.years && (this.c.game.wrapup || []).includes(this.monthIndex(turn)); }
    isTermEnd(turn = this.s.turn) { return this.phaseOf(turn) === 'term' && (turn >= this.maxTurns || this.phaseOf(turn + 1) !== 'term'); }

    /* ---------------- Expression environment ---------------- */
    env(actor) {
      const eng = this, s = this.s, cast = this._cast || null;
      const R = (x) => (cast && typeof x === 'string' && cast[x]) || x;
      return {
        actor,
        ident(n) {
          switch (n) {
            case 'npc': return actor || '';
            case 'turn': return s.turn;
            case 'month': return eng.monthIndex();
            case 'year': return eng.yearOf();
            case 'turns_left': return eng.maxTurns - s.turn;
            case 'max_turns': return eng.maxTurns;
            case 'cards_this_month': return s.cardsThisMonth;
            // phase 2b calendar (design §4.1)
            case 'term': return eng.phaseOf() === 'term';
            case 'break': return eng.phaseOf() === 'break';
            case 'season': return eng.seasonOf();
            case 'final_year': return eng.yearOf() === eng.years;
            case 'wrapup': return eng.isWrapUp();
            case 'off_campus': return eng.offCampus();
            case 'slot': return eng._slot || (s.cur && s.cur.slot) || '';   // the slot being drawn (director) or shown
            case 'term_index': return eng.termIndex();
            case 'gpa': return eng.gpa();
            case 'term_gpa': return eng.termGpa();
            case 'runs_completed': return s.runsCompleted || 0;
          }
          if (n.includes('.')) { const [who, stat] = n.split('.'); return eng.statOf(R(who), stat, actor); }
          const v = s.vals[n];
          return v == null ? 0 : v;
        },
        fn(n, a) {
          // cast_as(role, npc) reads the role by name: resolving it first turned it into its character (fix, 2026-10-20).
          if (n === 'cast_as') return !!cast && cast[a[0]] === R(a[1]);
          a = a.map(R);
          switch (n) {
            case 'has': return !!s.flags[a[0]] || !!s.states[a[0]];
            case 'flag': return !!s.flags[a[0]];
            case 'left': { const st = s.states[a[0]]; return st ? (st.left == null ? 99 : st.left) : 0; }
            case 'rel': return s.npcs[a[0]] ? s.npcs[a[0]].rel : 0;
            case 'love': case 'spark': return s.npcs[a[0]] ? s.npcs[a[0]].spark : 0;
            case 'spell_level': return (s.spells || {})[a[0]] || 0;
            case 'knows': return !!(s.facts || {})[a[0]];
            case 'npc_rel': return eng.npcRel(a[0] === 'npc' ? actor : a[0], a[1] === 'npc' ? actor : a[1]);
            // tracks (design §7)
            case 'enrolled': { const t = eng.trackState(a[0]); return !!t && t.status === 'enrolled'; }
            case 'member': {   // member(club), member(job), …: in any track of that kind (as `leave club`)
              if (!eng.c.tracks[a[0]] && eng.trackKinds().has(a[0])) return Object.values(eng.s.tracks || {}).some((t) => t.kind === a[0] && t.status === 'member');
              const t = eng.trackState(a[0]); return !!t && t.status === 'member'; }
            case 'offered': return eng.offered(a[0]).length;   // offered(courses): what an `offers:` menu would list (I10)
            case 'kind_is': { const id = a[0] === 'track' ? eng._ctxTrack : a[0], d = id && eng.c.tracks[id]; return !!d && d.kind === a[1]; }
            case 'applied': {   // applied(internship): to any of that kind
              if (!eng.c.tracks[a[0]] && eng.trackKinds().has(a[0])) return Object.values(eng.s.tracks || {}).some((t) => t.kind === a[0] && t.status === 'applied');
              const t = eng.trackState(a[0]); return !!t && t.status === 'applied'; }
            // rank() and performance() also take a track kind: the one of that kind you're in (X12).
            case 'rank': { const t = eng.trackState(eng.c.tracks[a[0]] || a[0] === 'track' ? a[0] : eng.trackTarget({ track: a[0] })); return t && t.status === 'member' ? t.rank + 1 : 0; }
            case 'performance': { const t = eng.trackState(eng.c.tracks[a[0]] || a[0] === 'track' ? a[0] : eng.trackTarget({ track: a[0] })); return t ? t.perf || 0 : 0; }
            case 'level': return eng.levelPassed(a[0]);
            case 'progress': { const t = eng.trackState(a[0]); return t ? t.progress || 0 : 0; }
            case 'due': { const t = eng.trackState(a[0]); return t && t.status === 'member' ? Math.max(0, (t.due || 0) - (t.visits || 0)) : 0; }
            case 'visits': { const t = eng.trackState(a[0]); return t ? t.visits || 0 : 0; }
            // places, arcs, casting (design §6, §10.6, §5.4)
            case 'discovered': return !!(s.places || {})[eng.placeAlias(a[0])];
            case 'visits_to': return (s.visitsTo || {})[eng.placeAlias(a[0])] || 0;
            case 'on_shift': return !!eng._shift;
            case 'has_item': return !!(s.items || {})[a[0]];
            case 'worn': return Object.values(s.worn || {}).includes(a[0]);
            case 'present': return eng.presentAt(a[0]).length;
            case 'act': return eng.actOf(a[0]);
            case 'clock': return ((s.arcs || {})[a[0]] || {}).clock || 0;
            case 'clues': { const d = eng.c.arcs && eng.c.arcs[a[0]]; return d ? (d.clues || []).filter((x) => (s.clues || {})[x]).length : 0; }   // clues of an arc found so far
            case 'plan': return Object.keys(s.states).some((k) => eng.c.states[k] && eng.c.states[k].kind === 'plan' && k === 'plan_' + a[0]);
            case 'bond': return s.npcs[a[0]] ? s.npcs[a[0]].bond : 'none';
            case 'met': return !!(s.npcs[a[0]] && s.npcs[a[0]].met);
            case 'around': return !!eng.c.npcs[a[0]] && !eng.isAway(a[0]);
            case 'apart': { const n = s.npcs[a[0]]; return n && n.touched ? s.turn - n.touched : 999; }
            case 'npc_is': return actor === a[0];
            case 'romanceable': return !!(eng.c.npcs[a[0]] && eng.c.npcs[a[0]].romance);
            case 'tagged': { const d = eng.c.npcs[a[0]]; return !!d && ((d.tags || []).includes(a[1]) || d.role === a[1]); }   // a character's role counts as a tag (student, prefect, professor, staff, outsider)
            case 'seen': return s.seen[a[0]] || 0;
            case 'since': return s.last[a[0]] != null ? s.turn - s.last[a[0]] : 999;
            case 'chosen': return s.choices[a[0]] === a[1];
            case 'bonds': return Object.values(s.npcs).filter((x) => x.met && x.bond === a[0]).length;
            case 'bonds_around': return Object.entries(s.npcs).filter(([k, x]) => x.met && x.bond === a[0] && eng.c.npcs[k] && !eng.isAway(k)).length;
            case 'known': return Object.values(s.npcs).filter((x) => x.met).length;
            case 'rand': return eng.randInt(Math.round(a[0]), Math.round(a[1]));
            case 'chance_of': return eng.checkChance(a[0], a[1]);
            case 'min': return Math.min(...a);
            case 'max': return Math.max(...a);
            case 'abs': return Math.abs(a[0]);
            case 'floor': return Math.floor(a[0]);
            case 'round': return Math.round(a[0]);
            case 'clamp': return clamp(a[0], a[1], a[2]);
            case 'passed': return eng.levelPassed(a[0]) >= (a[1] || 1);
            case 'clue': return !!(s.clues || {})[a[0]];
          }
          return 0;
        },
      };
    }
    test(exprObj, actor) { if (!exprObj) return true; try { return !!exprObj.fn(this.env(actor)); } catch (e) { this.warn(e, exprObj); return false; } }
    value(exprObj, actor, dflt = 0) { if (!exprObj) return dflt; try { const v = exprObj.fn(this.env(actor)); return typeof v === 'number' ? v : (v ? 1 : 0); } catch (e) { this.warn(e, exprObj); return dflt; } }
    warn(e, where) { if (typeof console !== 'undefined') console.warn('[engine]', where && where.file ? where.file + ':' + where.line : '', e.message); }

    // skill-vs-difficulty success chance, in percent
    checkChance(skill, dc) {
      const v = typeof skill === 'number' ? skill : (this.s.vals[skill] || 0);
      return clamp(Math.round(50 + (v - dc) * 3), ...this.oddsRange(false));
    }

    /* ---------------- Text ---------------- */
    // Inline variation (design §12, Ink-style): {~a|b} one at random, {&a|b} cycle, {a|b} sequence (stays on the
    // last), {cond: a|b} conditional. `key` is the event id: cycles and sequences follow how often it was seen.
    // Deterministic and RNG-free (a hash of seed, turn and event), so it never changes what happens. Every group of a
    // card picks the same position, so variant k of the text meets variant k of the outcome (the lint keeps one mode
    // and one count per card).
    vary(text, actor, key) {
      // Fast path: no braces, or nothing that could be a variant. (A variant may open with a token, `{~{partner} …|…}`.)
      if (text.indexOf('{') < 0 || !/[|:]/.test(text)) return text;
      let out = '', i = 0;
      while (i < text.length) {
        if (text[i] !== '{') { out += text[i++]; continue; }
        let d = 0, j = i;
        for (; j < text.length; j++) { if (text[j] === '{') d++; else if (text[j] === '}' && --d === 0) break; }
        if (j >= text.length) { out += text.slice(i); break; }
        const res = this.variant(text.slice(i + 1, j), actor, key);
        out += res == null ? text.slice(i, j + 1) : this.vary(res, actor, key);
        i = j + 1;
      }
      return out;
    }
    variant(inner, actor, key) {
      if (inner[0] === '=') return null;
      const parts = []; let d = 0, start = 0;
      for (let k = 0; k < inner.length; k++) { const ch = inner[k]; if (ch === '{') d++; else if (ch === '}') d--; else if (ch === '|' && !d) { parts.push(inner.slice(start, k)); start = k + 1; } }
      parts.push(inner.slice(start));
      let colon = -1; d = 0;
      // {~…} and {&…} never take a condition, so a colon in their text is just a colon.
      if (inner[0] !== '~' && inner[0] !== '&') for (let k = 0; k < parts[0].length; k++) { const ch = parts[0][k]; if (ch === '{') d++; else if (ch === '}') d--; else if (ch === ':' && !d) { colon = k; break; } }
      if (colon > 0) {
        const src = parts[0].slice(0, colon).trim();
        let ex; try { ex = this._exprCache['?' + src] || (this._exprCache['?' + src] = G.expr(src)); } catch (e) { return null; }
        return this.test(ex, actor) ? parts[0].slice(colon + 1).replace(/^ /, '') : (parts[1] || '').replace(/^ /, '');
      }
      if (parts.length < 2) return null;
      const s = this.s, mode = inner[0] === '~' ? 'shuffle' : inner[0] === '&' ? 'cycle' : 'seq';
      if (mode !== 'seq') parts[0] = parts[0].slice(1);
      const seen = Math.max(1, (key && s.seen[key]) || 1);
      if (mode === 'cycle') return parts[(seen - 1) % parts.length];
      if (mode === 'seq') return parts[Math.min(seen - 1, parts.length - 1)];
      return parts[this.variantHash(key) % parts.length];
    }
    // The shuffled variant's index this month ({~a|b|c}: hash % parts): a fight that names its foe by the card's text
    // variant (ring_bout_2: the rower, the villager, the student in the scarf) takes the same index.
    variantHash(key) {
      const s = this.s;
      let h = 2166136261; const str = s.seed + ':' + s.turn + ':' + (key || '');
      for (let k = 0; k < str.length; k++) { h ^= str.charCodeAt(k); h = Math.imul(h, 16777619); }
      return h >>> 0;
    }
    // Re-render text from a run-log entry as it was shown: its event, turn and showing count.
    interpLogged(text, l, actor) {
      const s = this.s, turn = s.turn, had = l.id in s.seen, seen = s.seen[l.id];
      s.turn = l.turn; if (l.seen != null) s.seen[l.id] = l.seen;
      try { return this.withContext(l, () => this.interp(text, actor === undefined ? l.actor : actor, l.id)); }
      finally { s.turn = turn; if (had) s.seen[l.id] = seen; else delete s.seen[l.id]; }
    }
    interp(text, actor, key, castOverride) {
      if (!text) return '';
      const s = this.s;
      text = this.vary(text, actor, key);
      return text.replace(/\{([^{}]+)\}/g, (m, k) => {
        k = k.trim();
        if (k === 'player') return s.name;
        if (k === 'month') return this.monthName();
        if (k === 'year') return String(this.yearOf());
        if (k[0] === '=') {
          const src = k.slice(1);
          try { const ex = this._exprCache[src] || (this._exprCache[src] = G.expr(src)); const v = ex.fn(this.env(actor)); return typeof v === 'number' ? String(Math.round(v)) : String(v); } catch (e) { return m; }
        }
        const cast = castOverride || this._cast || {};
        if (k === 'track') { const id = this._ctxTrack; const d = id && this.c.tracks[id]; return d ? d.name : m; }
        if (k === 'place') { const id = this._ctxPlace; const d = id && this.c.places[id]; return d ? d.name : m; }
        let npcId = actor, key = k;
        const dot = k.indexOf('.');
        if (dot > 0) { const head = k.slice(0, dot); npcId = head === 'npc' ? actor : cast[head] || head; key = k.slice(dot + 1); }
        else if (cast[k]) { npcId = cast[k]; key = 'name'; }
        else if (this.c.npcs[k]) { npcId = k; key = 'name'; }
        else if (k === 'npc') key = 'name';
        const def = npcId && this.c.npcs[npcId];
        if (!def) return m;
        const table = this.c.pronouns || PRONOUNS;
        const p = table[(def.pronouns || 'they').split('/')[0]] || table.they;
        const lower = key.toLowerCase();
        let out;
        if (lower === 'name') out = shortName(def);
        else if (lower === 'fullname') out = def.name;
        else if (lower === 'title') out = def.title || '';
        else if (lower === 'house') out = def.house || '';
        else if (p[lower] != null) out = p[lower];
        else return m;
        return key[0] === key[0].toUpperCase() && key[0] !== key[0].toLowerCase() ? cap(out) : out;
      });
    }

    /* ---------------- Effects ---------------- */
    newCtx(actor, label, key) { return { actor, label, key: key || null, deltas: {}, say: [], sayIds: [], notes: [], checks: [], zeroed: [], nowIdx: 0 }; }

    change(name, amount, ctx, raw) {
      const s = this.s, c = this.c;
      if (c.skills[name] && amount > 0 && !raw) amount = this.skillGain(name, amount);
      const def = c.resources[name] || c.skills[name];
      const old = s.vals[name] == null ? 0 : s.vals[name];
      if (def && def.drag && amount > 0 && old < def.drag.below) amount *= def.drag.factor;
      let nv = old + amount, bound = false;
      if (def) {
        const min = def.min == null ? 0 : def.min;
        const max = this.resMax(def);
        bound = nv > max || nv < min;
        nv = clamp(nv, min, max);
        if (c.resources[name] && nv <= min && old > min) ctx.zeroed.push(name);
      }
      nv = Math.round(nv * 100) / 100;
      s.vals[name] = nv;
      if (c.skills[name] && nv > (s.peak[name] || 0)) s.peak[name] = nv;
      // A preview shows what the option does even past a cap or a floor (feedback 2026-10-19); the outcome shows what changed.
      const d = this._oracle && bound ? amount : nv - old;
      if (this._oracle && bound) (ctx.over = ctx.over || {})[name] = true;
      if (d) ctx.deltas[name] = (ctx.deltas[name] || 0) + d;
    }

    npcOf(ref, ctx) { if (ref === 'npc') return ctx.actor; if (ctx && ctx.cast && ctx.cast[ref]) return ctx.cast[ref]; return ref; }
    touchNpc(id, ctx) {
      const n = this.s.npcs[id];
      if (!n) return null;
      n.touched = this.s.turn;
      if (!n.met) {
        n.met = true;
        if (this.FRIENDS) n.warmth = Math.max(n.warmth || 0, this.FRIENDS.meet);
        ctx.notes.push({ kind: 'meet', npc: id, text: 'You met ' + this.c.npcs[id].name + '.' });
        // Surface facts are known on meeting (design §10.1).
        for (const f of Object.values(this.c.facts || {})) if (f.tier === 'surface' && f.id.startsWith(id + '.')) this.s.facts[f.id] = this.s.turn;
      }
      return n;
    }
    // NPC-to-NPC relationship (design §10.3): a's view of b, seeded from `relations:`.
    npcRel(a, b) {
      const v = (this.s.npcRel || {})[a + '>' + b];
      if (v != null) return v;
      const d = this.c.npcs[a];
      return d && d.relations && d.relations[b] != null ? d.relations[b] : 0;
    }
    amountOf(st, row) {
      // A card drawn as its `variant: hard` (design §8.6): rewards ×1.5 (the director chooses when, in phase 2b).
      if (st.tier) return st.sign * this.tierAmount(row, st.tier) * (this._variant === 'hard' && st.sign > 0 ? 1.5 : 1);
      if (this._oracle && st.min !== st.max) return this._oracle.amount(st.min, st.max);
      return this.randInt(st.min, st.max);
    }
    // A random branch: with a preview oracle, the oracle decides (probabilities in percent, one per outcome).
    pick(kind, probs, label) {
      if (this._oracle) return this._oracle.branch(kind, probs, label);
      const r = this.rand() * 100;
      let acc = 0;
      for (let i = 0; i < probs.length; i++) { acc += probs[i]; if (r < acc) return i; }
      return probs.length - 1;
    }

    run(effects, ctx) {
      if (!effects) return;
      const s = this.s, c = this.c;
      for (const st of effects) {
        if (s.ended && st.t !== 'say') return;
        switch (st.t) {
          // A played fight settles Health itself: its outcome's own `health` lines (written for the dice) are skipped.
          case 'delta': if (!(this._fightOutcome && st.name === 'health')) this.change(st.name, this.amountOf(st, st.name), ctx); break;
          case 'assign': {
            const v = this.value(st.expr, ctx.actor);
            if (st.op === '=') this.change(st.name, v - (s.vals[st.name] || 0), ctx);
            else this.change(st.name, st.op === '+=' ? v : -v, ctx);
            break;
          }
          case 'say': {
            const who = st.overrides && Object.keys(st.overrides).find((id) => id === ctx.actor || Object.values(ctx.cast || {}).includes(id));
            ctx.say.push(this.interp(who ? st.overrides[who] : st.text, ctx.actor, ctx.key, ctx.cast));
            if (st.sid) ctx.sayIds.push(st.sid + (who ? '@' + who : ''));
            break;
          }
          case 'flag': st.names.forEach((n) => { s.flags[n] = true; }); break;
          case 'unflag': st.names.forEach((n) => { delete s.flags[n]; }); break;
          case 'gain': this.addState(st.state, st.dur ? this.value(st.dur, ctx.actor) : null, ctx); break;
          case 'lose': this.removeState(st.state, ctx, false); break;
          case 'queue': {
            // `queue any tagged <tag>` (feedback 2026-10-16): `now` (or no delay) draws from the pool at once; a later
            // one is drawn when it falls due (the queue item's id stays null and `tagged` names the pool).
            const later = !!st.tagged && !st.now && !!(st.window || st.byMonth || !st.delay || Math.round(this.value(st.delay, ctx.actor)) > 0);
            const ev = st.tagged ? (later ? null : this.drawTagged(st.tagged)) : st.event;
            if (st.tagged && !later && !ev) break;   // nothing in the pool is eligible
            if (ev && !c.events[ev]) { this.warn(new Error('queue: unknown event ' + ev), st); break; }
            const actor = st.with ? this.npcOf(st.with, ctx) : (ev && c.events[ev].actor === 'npc' ? ctx.actor : null);
            const carry = { track: ctx.track || undefined, cast: st.with && ctx.cast && ctx.cast[st.with] ? { npc: ctx.cast[st.with] } : undefined };
            // `chance N` (I4): rolled when the card falls due (at once for `now`); a failed roll drops it.
            const qc = st.chanceWord ? this.likelihoodP(st.chanceWord) : st.chance;   // `chance <word>` (checks.md)
            if (qc != null) carry.chance = qc;
            if (qc != null && (st.now || (!st.window && !st.byMonth && st.delay && Math.round(this.value(st.delay, ctx.actor)) <= 0)) && this.rand() * 100 >= qc) break;
            if (st.now) s.deck.splice(ctx.nowIdx++, 0, { id: ev, actor, src: 'queued', ...carry });
            else if (st.window || st.byMonth) {
              // A window (design §5.3): the chance rises each month (1 / months left), forced on the last one.
              const to = st.window ? s.turn + st.window.to : s.turn + (((st.byMonth - this.monthIndex()) + this.months.length) % this.months.length || this.months.length);
              const from = st.window ? s.turn + st.window.from : s.turn + 1;
              s.queue.push({ id: ev, actor, due: from, until: to, src: 'queued', ...carry, ...(st.tagged ? { tagged: st.tagged } : {}) });
            } else {
              const delay = st.delay ? Math.max(0, Math.round(this.value(st.delay, ctx.actor))) : 1;
              if (delay === 0) s.deck.push({ id: ev, actor, src: 'queued' });
              else s.queue.push({ id: ev, actor, due: s.turn + delay, ...carry, ...(st.tagged ? { tagged: st.tagged } : {}) });
            }
            break;
          }
          case 'rel': case 'spark': {
            const id = this.npcOf(st.npc, ctx); const n = this.touchNpc(id, ctx);
            if (!n) break;
            const amt = this.amountOf(st, st.t);
            const old = n[st.t];
            n[st.t] = st.t === 'rel' ? clamp(old + amt, this.relFloor(), 100) : clamp(old + amt, 0, 100);
            if (st.t === 'spark' && amt > 0) n.sparked = s.turn;
            if (amt) { ctx.contact = ctx.contact || {}; ctx.contact[id] = Math.max(ctx.contact[id] || -1, Math.sign(amt)); if (amt < 0) (ctx.contact.neg = ctx.contact.neg || {})[id] = true; }   // warmth (design §5.5, M17)
            const key = st.t + ':' + id;
            if (this._oracle && amt) { ctx.deltas[key] = (ctx.deltas[key] || 0) + amt; if (n[st.t] - old !== amt) (ctx.over = ctx.over || {})[key] = true; }   // a preview shows it past the cap
            else if (n[st.t] !== old) ctx.deltas[key] = (ctx.deltas[key] || 0) + (n[st.t] - old);
            else if (amt > 0) (ctx.capped = ctx.capped || {})[key] = amt;   // a gain at the cap still shows (M37)
            // Spark follows friendship (M37): with some spark already there (at least `from`, 2026-10-20: a romantic moment
            // has to start it), a friendship gain carries spark along. Until the card asking whether you want this has come
            // (`sparkAsked`) or you're partners, the spark it carries is applied but not shown (feedback 2026-10-20).
            const f = this.sparkFollow();
            if (st.t === 'rel' && amt > 0 && n.spark > 0 && n.spark >= (f.from || 0) && this.c.npcs[id] && this.c.npcs[id].romance) {
              const mult = Math.min(n.bond === 'partner' ? f.partner : f.cap, n.spark / f.per);
              const add = Math.round(amt * mult), sOld = n.spark, shown = n.sparkAsked || n.bond === 'partner';
              if (add > 0) { n.spark = clamp(sOld + add, 0, 100); n.sparked = s.turn; if (!shown && !this._oracle) n.sparkHid = (n.sparkHid || 0) + (n.spark - sOld); const dd = this._oracle ? add : n.spark - sOld; if (dd && shown) ctx.deltas['spark:' + id] = (ctx.deltas['spark:' + id] || 0) + dd; if (this._oracle && shown && add !== n.spark - sOld) (ctx.over = ctx.over || {})['spark:' + id] = true; }
            }
            if (n.spark !== undefined) this.sparkCheck(id, n);
            break;
          }
          case 'npc_rel': {
            const a = this.npcOf(st.a, ctx), b = this.npcOf(st.b, ctx);
            if (!this.c.npcs[a] || !this.c.npcs[b]) break;
            const amt = st.tier ? st.sign * this.tierAmount('rel', st.tier) : st.min;
            s.npcRel = s.npcRel || {};
            for (const [x, y] of [[a, b], [b, a]]) s.npcRel[x + '>' + y] = clamp(this.npcRel(x, y) + amt, -100, 100);
            break;
          }
          case 'enrol': case 'join': case 'leave': case 'promote': case 'apply': case 'perform': case 'rank_xp': case 'progress': this.trackOp(st, ctx); break;
          case 'study': {
            // Exam preparation (design §7.3): one course (`track` = the event's own), else every enrolled course.
            const amt = st.tier ? st.sign * this.trackSize('study', st.tier, [1, 3, 5, 8, 12]) : st.min;
            const one = st.track === 'track' ? ctx.track : st.track;
            const ids = one ? [one] : Object.keys(s.tracks || {}).filter((k) => s.tracks[k].status === 'enrolled');
            for (const id of ids) { const t = (s.tracks || {})[id]; if (!t || t.status !== 'enrolled') continue; t.study = clamp((t.study || 0) + amt, 0, this.studyRule().cap); ctx.deltas['study:' + id] = (ctx.deltas['study:' + id] || 0) + amt; }
            break;
          }
          case 'discover': { const pl = this.placeAlias(st.place); if (!s.places[pl] && this.c.places[pl]) { s.places[pl] = { found: s.turn }; ctx.notes.push({ kind: 'discover', place: pl }); } break; }
          case 'find': if (!s.clues[st.clue]) { s.clues[st.clue] = s.turn; ctx.notes.push({ kind: 'clue', clue: st.clue }); } break;
          case 'advance': { const a = s.arcs[st.arc] = s.arcs[st.arc] || { clock: 0 }; const d = this.c.arcs[st.arc]; a.clock = Math.min(d && d.clock ? d.clock.max : 99, a.clock + st.n); break; }
          case 'spawn': ctx.notes.push({ kind: 'spawn', id: st.id, archetype: st.archetype }); break;   // phase 4
          case 'unqueue': s.queue = s.queue.filter((q) => q.id !== st.event); s.deck = s.deck.filter((q) => q.id !== st.event); break;
          case 'learn': {
            s.facts = s.facts || {};
            if (!s.facts[st.fact]) { s.facts[st.fact] = s.turn; ctx.notes.push({ kind: 'fact', fact: st.fact }); }
            break;
          }
          case 'sit_exam': this.sitExam(ctx.track || this._ctxTrack, st.swing, ctx); break;
          // `visit midnight` (M41): that slot of today becomes a visit, picked on the map when it comes.
          case 'visit': if (s.day && s.day.v === 2 && this.recipe().some((r) => r.slot === st.slot)) s.day.extraVisit = st.slot; break;
          case 'cool': { const id = this.npcOf(st.npc, ctx), n = id && s.npcs[id]; if (n && n.spark) { ctx.deltas['spark:' + id] = (ctx.deltas['spark:' + id] || 0) - n.spark; n.spark = 0; } break; }   // spark cleared (M37)
          case 'coursework': { const id = !st.track || st.track === 'track' ? ctx.track || this._ctxTrack : st.track; if (id) this.courseworkFor(id, ctx); break; }
          case 'wage': {
            const ev = ctx.key && this.c.events[ctx.key], id = ctx.track || this._ctxTrack || (ev && ev.track);
            const pay = id ? this.wageFor(id, st.size) : 0;
            if (pay) { this.change('gold', pay, ctx); ctx.notes.push({ kind: 'wage', track: id, gold: pay }); }
            break;
          }
          case 'regrade': this.regrade(st, ctx); break;
          case 'give': this.giveItem(st.item, ctx); break;
          case 'take': this.takeItem(st.item, ctx); break;
          case 'learn_spell': {
            s.spells = s.spells || {};
            const max = this.spellLevels(st.spell), lv = Math.min(max, st.level || (s.spells[st.spell] || 0) + 1);
            if (lv > (s.spells[st.spell] || 0)) {
              s.spells[st.spell] = lv;
              // Learning or upgrading a spell is a reward (L-6): skill XP in its skill, `@balance spell_bonus` by level for a
              // three-level spell, `spell_bonus_one` for a one-level spell.
              const b = this.c.balance || {}, tier = max > 1 ? (b.spell_bonus || [])[lv - 1] : b.spell_bonus_one || (b.spell_bonus || [])[1], bonus = {};
              if (tier) for (const k of this.spellSkills(st.spell)) { const before = s.vals[k] || 0; this.change(k, this.tierAmount('xp', tier), ctx); bonus[k] = Math.round(((s.vals[k] || 0) - before) * 100) / 100; }
              ctx.notes.push(Object.assign({ kind: 'spell', spell: st.spell, level: lv }, Object.keys(bonus).length ? { bonus } : {}));
            }
            break;
          }
          case 'challenge': {
            // A fight (combat, duel) is played, never rolled (2026-10-18): a result handed to choose() (the UI played it), or
            // the resolver's (`eng.fights`: the simulated players, and the UI's safety net). Previews keep the stub's odds as
            // the expected value and, where fights are played, run the outcome as a played fight does (no Health lines).
            // A negotiation (E8) is the same: played when a resolver (`eng.parleys`) or a queued result is there, else the stub rolls.
            const mg = MINIGAME_KINDS[st.kind], fight = mg === 'fight', parley = mg === 'parley';
            const played = fight ? !!(this.fights || (this._fightQueue && this._fightQueue.length)) : parley ? !!(this.parleys || (this._parleyQueue && this._parleyQueue.length)) : false;
            if (played && !this._oracle) { if (fight) this.playFight(st, ctx); else this.playParley(st, ctx); break; }
            if (fight && this._oracle) this._oracle.fight = true;
            // The stub's entry cost (Mana) only where fights are still rolled: unit-test fixtures with no resolver.
            if (st.kind === 'combat' && !played) this.change(this.spellResource, -this.combatCost(), ctx);
            const o = this.challengeOdds(st, ctx.actor, ctx.key);
            const probs = [o.win, st.partial ? o.atLeastPartial - o.win : 0, 100 - o.atLeastPartial];
            const result = ['win', 'partial', 'lose'][this.pick('challenge', probs, { challenge: st.kind })];
            ctx.checks.push(Object.assign({ challenge: st.kind, skill: o.skill, p: o.win, partial: st.partial ? o.atLeastPartial - o.win : null, result, ok: result !== 'lose', swing: st.swing || null }, parley ? { parley: true } : {}));
            const was = this._fightOutcome; if (played) this._fightOutcome = true;
            try { this.run(st[result], ctx); } finally { this._fightOutcome = was; }
            break;
          }
          case 'bond': {
            const id = this.npcOf(st.npc, ctx); const n = this.touchNpc(id, ctx);
            if (!n || n.bond === st.status) break;
            n.bond = st.status;
            ctx.notes.push({ kind: 'bond', npc: id, status: st.status, text: shortName(this.c.npcs[id]) + ': ' + st.status });
            break;
          }
          case 'meet': this.touchNpc(this.npcOf(st.npc, ctx), ctx); break;
          case 'end': s.ended = { id: st.ending }; return;
          case 'if': {
            const br = st.branches.find((b) => this.test(b.cond, ctx.actor));
            this.run(br ? br.body : st.else, ctx);
            break;
          }
          case 'chance': {
            // `chance <word>` (checks.md): odds by nature with circumstance steps; `chance N` (legacy) a percentage.
            const p = st.word ? this.likelihoodP(st.word, st.steps, ctx.actor) : clamp(this.value(st.p, ctx.actor), 0, 100);
            this.run(this.pick('chance', [p, 100 - p], { p }) === 0 ? st.body : st.else, ctx);
            break;
          }
          case 'check': {
            const p = this.checkChance(st.skill, this.value(st.dc, ctx.actor));
            const ok = this.pick('check', [p, 100 - p], { skill: st.skill }) === 0;
            ctx.checks.push({ skill: st.skill, p, ok });
            this.run(ok ? st.body : st.else, ctx);
            break;
          }
        }
      }
    }

    // Resources that hit their minimum run their on_zero block once.
    handleZeroed(ctx) {
      let guard = 0;
      while (ctx.zeroed.length && guard++ < 5) {
        const list = [...new Set(ctx.zeroed)]; ctx.zeroed = [];
        for (const id of list) { const r = this.c.resources[id]; if (r && r.on_zero) this.run(r.on_zero, ctx); }
      }
    }

    addState(id, dur, ctx) {
      const s = this.s, def = this.c.states[id];
      if (!def) { this.warn(new Error('gain: unknown state ' + id)); return; }
      if (def.group) for (const other of Object.keys(s.states)) {
        if (other !== id && this.c.states[other] && this.c.states[other].group === def.group) this.removeState(other, ctx, false);
      }
      const left = dur != null ? dur : (def.duration != null ? def.duration : null);
      if (s.states[id]) {
        const st = s.states[id];
        if (st.left != null) st.left = left == null ? null : Math.max(st.left, left);
        return;
      }
      s.states[id] = { left, since: s.turn };
      if (!def.hidden && !def.deprecated) ctx.notes.push({ kind: 'gain', state: id, text: '+ ' + (def.name || id) });
      this.run(def.on_add, ctx);
    }
    removeState(id, ctx, expired) {
      const s = this.s, def = this.c.states[id];
      if (!s.states[id]) return;
      delete s.states[id];
      if (def) {
        if (!def.hidden && !def.deprecated) ctx.notes.push({ kind: 'lose', state: id, text: '− ' + (def.name || id) });
        if (expired) this.run(def.on_expire, ctx);
        this.run(def.on_remove, ctx);
      }
    }

    runHooks(on, summary) {
      for (const h of this.hooks) {
        if (h.on !== on || !this.test(h.when, null)) continue;
        const ctx = this.newCtx(null, h.label || h.desc || h.id, h.id);
        this.run(h.do, ctx);
        this.handleZeroed(ctx);
        if (summary) summary.push(Object.assign(this.summaryItem(ctx, h.label || null), { src: 'hook ' + h.id }));
      }
    }
    summaryItem(ctx, label) { return { label, deltas: ctx.deltas, notes: ctx.notes, say: ctx.say }; }

    /* ---------------- Month cycle ---------------- */
    // State ticks and durations, at the start of a month.
    tickStates(summary) {
      const s = this.s;
      for (const id of Object.keys(s.states)) {
        const def = this.c.states[id]; const st = s.states[id];
        if (!def || !st || def.deprecated) continue;   // a deprecated state (E11) stays in the save, still and unseen
        const ctx = this.newCtx(null, def.name || id, id);
        if (st.since < s.turn) {
          this.run(def.tick, ctx);
          if (st.left != null) { st.left--; if (st.left <= 0) this.removeState(id, ctx, true); }
        }
        this.handleZeroed(ctx);
        if (Object.keys(ctx.deltas).length || ctx.notes.length || ctx.say.length) summary.push(Object.assign(this.summaryItem(ctx, def.hidden ? null : (def.name || id)), { src: 'state ' + id }));
      }
    }
    // What next month's start will take or give (feedback 2026-10-15): state ticks, then term-start and month-start
    // hooks, dry-run on a copy of the state (its own RNG copy too), so the run itself is untouched. One entry per
    // label: { label, src, deltas }.
    upcoming() {
      const s = this.s;
      if (!s || s.ended || s.turn >= this.maxTurns) return [];
      const sh = this._shadow || (this._shadow = new this.constructor(this.c));
      const copy = {}; for (const [k, v] of Object.entries(s)) if (k !== 'hist' && k !== 'log') copy[k] = v;
      sh.s = JSON.parse(JSON.stringify(copy)); sh.s.hist = []; sh.s.log = []; sh.s.pending = [];
      const summary = [];
      try {
        sh.s.turn++;
        sh.tickStates(summary);
        sh.tickItems(summary);
        if (sh.dayMode && sh.isTermStart()) sh.runHooks('term_start', summary);
        sh.runHooks('month_start', summary);
      } catch (e) { return []; }
      return summary.filter((x) => Object.values(x.deltas).some(Boolean)).map((x) => ({ label: x.label, src: x.src, deltas: x.deltas }));
    }
    beginMonth() {
      const s = this.s;
      s.turn++;
      s.cardsThisMonth = 0;
      const summary = s.pending || []; s.pending = [];
      this.tickStates(summary);
      { const ctx = this.newCtx(null, null, null); this.grantLegacyItems(ctx); if (ctx.notes.length) summary.push(Object.assign(this.summaryItem(ctx, null), { src: 'kit' })); }
      this.tickItems(summary);
      this.relationshipDrift(summary);
      this.unlockFacts();
      if (this.c.places && Object.keys(this.c.places).length) this.monthlyWorld(summary);
      if (this.dayMode && this.isTermStart()) this.runHooks('term_start', summary);
      // Exams are cards (playtest 2, M4): in a term's last month, one `@game exam:` card per enrolled course, in its context.
      if (this.dayMode && this.isTermEnd() && this.c.events[this.c.game.exam]) {
        for (const [id, t] of Object.entries(s.tracks || {})) if (t.status === 'enrolled' && (this.c.tracks[id] || {}).kind === 'course') s.queue.push({ id: this.c.game.exam, actor: null, track: id, due: s.turn, src: 'queued' });
      }
      this.runHooks('month_start', summary);
      if (!s.ended) {
        if (this.dayMode) {
          this.startDay();   // the day is filled slot by slot as it's played (playtest 2, M1)
        } else this.buildDeck();
      }
      const shown = summary.filter((x) => Object.keys(x.deltas).length || x.notes.length || x.say.length);
      s.hist.push({ t: 'month', turn: s.turn, year: this.yearOf(), month: this.monthIndex(), summary: shown, deck: s.deck.map((d) => d.id), vals: { ...s.vals }, at: now() });
      return { kind: 'month', turn: s.turn, month: this.monthName(), monthIndex: this.monthIndex(), year: this.yearOf(), maxTurns: this.maxTurns, summary: shown, deckSize: s.deck.length, ended: !!s.ended };
    }

    // Design §8.2: spark fades 15% a month without a romantic moment; a partnership ends after 2 months below spark
    // 20. Friendship doesn't fade (feedback 2026-10-15b; it used to after 6 months without contact).
    // The month's fading is one summary line for everyone (src 'spark fade', `away` off campus); a partnership that
    // ends is a line of its own (src 'relationship drift'). Feedback 2026-10-19: one line per character was clutter.
    relationshipDrift(summary) {
      const s = this.s, away = this.offCampus(), fade = { label: null, deltas: {}, notes: [], say: [], src: 'spark fade', away };
      for (const [id, n] of Object.entries(s.npcs)) {
        if (!n.met) continue;
        const notes = [];
        // Off campus, spark fades at half the pace (M29, M38).
        const keep = away ? 0.925 : 0.85;
        if (n.spark > 0 && n.sparked !== s.turn - 1) { const nv = Math.floor(n.spark * keep); if (nv !== n.spark) { fade.deltas['spark:' + id] = nv - n.spark; n.spark = nv; } }
        if (n.bond === 'partner') {
          n.lowSpark = n.spark < 20 ? (n.lowSpark || 0) + 1 : 0;
          if (n.lowSpark >= 2) { n.bond = 'ex'; n.lowSpark = 0; notes.push({ kind: 'bond', npc: id, status: 'ex', text: shortName(this.c.npcs[id]) + ': ex' }); }
        }
        if (notes.length) summary.push({ label: null, deltas: {}, notes, say: [], src: 'relationship drift', npc: id });
      }
      if (Object.keys(fade.deltas).length) summary.push(fade);
    }
    unlockFacts() {
      const s = this.s;
      s.facts = s.facts || {};
      for (const f of Object.values(this.c.facts || {})) {
        if (s.facts[f.id] || !f.unlock) continue;
        const npc = s.npcs[f.id.split('.')[0]];
        if (npc && npc.met && this.test(f.unlock, null)) s.facts[f.id] = s.turn;
      }
    }

    // once / repeat bookkeeping. For `actor: any` events it is per person:
    // "once" means once with each character, `repeat: N` is a per-character cooldown,
    // and the event as a whole rests for ANY_EVENT_REST months so it doesn't recur back-to-back.
    eligible(e, used) {
      if (used.has(e.id)) return false;
      if (e.actor === 'any' || e.per) return this.s.last[e.id] == null || (this.s.turn - this.s.last[e.id]) >= ANY_EVENT_REST;
      const seen = this.s.seen[e.id] || 0;
      if (!e.repeat) return seen === 0;
      return seen === 0 || (this.s.turn - this.s.last[e.id]) >= e.repeat;
    }
    eligibleFor(e, actor) {
      if (e.actor !== 'any' && !e.per) return true;
      const last = (this.s.lastBy || {})[e.id + '@' + actor];
      if (last == null) return true;
      return !!e.repeat && (this.s.turn - last) >= e.repeat;
    }
    // Radiant casting (design §5.4): fill the event's roles in order, weighted by affinity, with up to 50
    // backtracking attempts, on a scratch copy of the RNG (eligibility never changes what happens).
    fillCast(e, bind) {
      const s = this.s, rng = s.rng, roles = e.cast;
      let tries = 0;
      const aff = (id) => { const n = s.npcs[id]; return n ? 1 + Math.abs(n.rel) / 20 + n.spark / 15 + (n.bond !== 'none' ? 1 : 0) + (s.turn - (n.touched || 0) < 3 ? 0.5 : 0) : 1; };
      const pool = (r) => {
        if (r.pool === 'fixed') return this.c.npcs[r.npc] ? [r.npc] : [];
        if (r.pool === 'present') return this.presentAt(r.place === 'place' || !r.place ? this._place : r.place).filter((id) => s.npcs[id] && s.npcs[id].met);
        return Object.keys(s.npcs).filter((id) => r.pool === 'anyone' || s.npcs[id].met);
      };
      const here = (id) => (bind && Object.values(bind).includes(id)) || (!this.distant(id) && (e.trigger === 'letter' || !this.gone(id)));
      const fill = (i, cast) => {
        if (i === roles.length) { const prev = this._cast; this._cast = cast; const ok = this.test(e.when, cast.npc || null); this._cast = prev; return ok ? { ...cast } : null; }
        const r = roles[i];
        let opts = pool(r).filter((id) => (here(id) || (r.pool === 'fixed' && !this.gone(id))) && !Object.values(cast).includes(id) && (r.role !== e.per || this.eligibleFor(e, id)) && (!bind || !bind[r.role] || bind[r.role] === id));
        opts = opts.filter((id) => { if (!r.where) return true; const prev = this._cast; this._cast = { ...cast, [r.role]: id }; const ok = this.test(r.where, cast.npc || id); this._cast = prev; return ok; });
        // weighted order
        const order = [];
        while (opts.length) { const w = opts.map(aff); let x = this.rand() * w.reduce((a, b) => a + b, 0); let k = 0; for (; k < opts.length - 1; k++) { x -= w[k]; if (x < 0) break; } order.push(opts.splice(k, 1)[0]); }
        for (const id of order) { if (++tries > 50) return null; const got = fill(i + 1, { ...cast, [r.role]: id }); if (got) return got; }
        return null;
      };
      try { return fill(0, {}); } finally { s.rng = rng; }
    }
    // A cast bound earlier (a push, a queue `with`) still meets each role's `where:` now: a card re-checks its cast
    // before it shows, as it re-checks its `when` (feedback 2026-10-16: a confession pushed in the morning dropped
    // once the spark was cooled that day). Roles the binding leaves unfilled aren't tested.
    castHolds(e, cast) {
      if (!e.cast || !cast) return true;
      const prev = this._cast, part = {};
      try {
        for (const r of e.cast) {
          const id = cast[r.role];
          if (!id) continue;
          // as fillCast tests it: the roles filled so far plus this one
          this._cast = { ...part, [r.role]: id };
          if (r.where && !this.test(r.where, part.npc || id)) return false;
          part[r.role] = id;
        }
        return true;
      } finally { this._cast = prev; }
    }
    // [{e, actor, w}] for an event, honouring actor binding
    candidates(e) {
      if (e.cast) {
        const cast = this.fillCast(e);
        if (!cast) return [];
        const actor = cast.npc || Object.values(cast)[0] || null;
        if (!e.per && actor && !this.eligibleFor(e, actor)) return [];
        const prev = this._cast; this._cast = cast;
        const w = e.weight ? this.value(e.weight, actor, 10) : 10;
        this._cast = prev;
        return w > 0 ? [{ e, actor, cast, w }] : [];
      }
      const out = [];
      let actors;
      if (e.actor === 'any') actors = Object.keys(this.s.npcs).filter((id) => this.s.npcs[id].met && !this.distant(id));
      else if (e.actor && e.actor !== 'npc') actors = [e.actor];
      else actors = [null];
      for (const a of actors) {
        if (a && e.trigger === 'social' && !(this.s.npcs[a] && this.s.npcs[a].met)) continue;
        if (a && e.trigger !== 'letter' && this.gone(a)) continue;
        if (a && !this.eligibleFor(e, a)) continue;
        if (!this.test(e.when, a)) continue;
        const w = e.weight ? this.value(e.weight, a, 10) : 10;
        if (w > 0) out.push({ e, actor: a, w });
      }
      // For `actor: any`, people you're closer to (or at war with) turn up more often,
      // while the event's total weight stays what the author wrote.
      if (e.actor === 'any' && out.length > 1) {
        const aff = (x) => { const n = this.s.npcs[x.actor]; return 1 + Math.abs(n.rel) / 20 + n.spark / 15 + (n.bond !== 'none' ? 1 : 0); };
        let sum = 0; out.forEach((x) => { x.aff = aff(x); sum += x.aff; });
        out.forEach((x) => { x.w = x.w * x.aff / sum; });
      }
      return out;
    }

    buildDeck() {
      const s = this.s;
      const head = [];
      const used = new Set(s.deck.map((d) => d.id));
      const due = s.queue.filter((q) => q.due <= s.turn);
      s.queue = s.queue.filter((q) => q.due > s.turn);
      const prio = (id, src) => { const e = this.c.events[id]; return e && e.priority != null ? e.priority : DEFAULT_PRIORITY[src]; };
      for (const q of due) { if (q.chance != null && (used.has(q.id) || this.rand() * 100 >= q.chance)) continue; if (q.tagged) { const id = this.drawTagged(q.tagged, used); if (!id) continue; q.id = id; } head.push({ id: q.id, actor: q.actor, src: 'queued', p: prio(q.id, 'queued') }); used.add(q.id); }
      for (const e of this.byTrigger.auto) {
        if (!this.eligible(e, used)) continue;
        const c = this.candidates(e);
        if (!c.length) continue;
        const pick = this.pickWeighted(c);
        head.push({ id: e.id, actor: pick.actor, src: 'auto', p: prio(e.id, 'auto') }); used.add(e.id);
      }
      head.sort((a, b) => b.p - a.p);
      const tail = [];
      const total = () => s.deck.length + head.length + tail.length;
      // The social slot grows with your web of relationships.
      let nSocial = this.socialPerMonth;
      const strong = Object.values(s.npcs).filter((n) => n.met && (Math.abs(n.rel) >= 30 || n.bond !== 'none')).length;
      if (strong >= 1 && this.rand() < 0.6) nSocial++;
      if (strong >= 4 && this.rand() < 0.4) nSocial++;
      for (let k = 0; k < nSocial && total() < this.maxCards; k++) {
        const pool = [];
        for (const e of this.byTrigger.social) if (this.eligible(e, used)) pool.push(...this.candidates(e));
        const pick = this.pickWeighted(pool);
        if (!pick) break;
        tail.push({ id: pick.e.id, actor: pick.actor, src: 'social' }); used.add(pick.e.id);
      }
      // Fill with random cards up to cards_per_month — and always at least min_random_per_month,
      // so busy calendar months still leave room for everyday life.
      let nRandom = 0;
      while ((total() < this.cardsPerMonth || nRandom < this.minRandom) && total() < this.maxCards) {
        const pool = [];
        for (const e of this.byTrigger.random) if (this.eligible(e, used)) pool.push(...this.candidates(e));
        const pick = this.pickWeighted(pool);
        if (!pick) break;
        tail.push({ id: pick.e.id, actor: pick.actor, src: 'random' }); used.add(pick.e.id); nRandom++;
      }
      s.deck = s.deck.concat(head.map(({ id, actor, src }) => ({ id, actor, src })), this.shuffle(tail));
    }

    endMonth() {
      const s = this.s;
      const summary = [];
      // Coursework not yet given this month (no card of the course played): given now, before exams close the term.
      for (const id of Object.keys(s.tracks || {})) {
        const ctx = this.newCtx(null, null, null);
        if (this.courseworkFor(id, ctx)) {
          const d = this.c.tracks[id], lv = (s.tracks[id].level || 1), names = (d.level_names || d.name).split(/\s*[,，、]\s*/);
          summary.push(Object.assign(this.summaryItem(ctx, names[lv - 1] || d.name), { src: 'coursework ' + id }));
        }
      }
      if (this.dayMode && this.isTermEnd()) this.endTerm(summary);
      s.day = null;
      this.runHooks('month_end', summary);
      s.pending = summary;
      if (s.ended) return this.ending();
      if (s.turn >= this.maxTurns) { const book = this.yearbook(); s.ended = { id: book[0].id, book }; return this.ending(); }
      return this.beginMonth();
    }

    /* ---------------- Cards ---------------- */
    advance() {
      const s = this.s;
      if (s.ended) return this.ending();
      if (s.cur) return { kind: 'card', view: this.withContext(s.cur, () => this.view(s.cur)), onShow: null };
      for (;;) {
        if (s.day && s.day.phase === 'pick') return { kind: 'map', view: this.mapView() };
        if (!s.deck.length) {
          if (s.day && s.day.v === 2 && !s.day.done) { this.stepDay(); continue; }
          break;
        }
        const item = s.deck.shift();
        const e = this.c.events[item.id];
        if (!e) { this.warn(new Error('unknown event in deck: ' + item.id)); continue; }
        if (e.actor && e.actor !== 'any' && e.actor !== 'npc') item.actor = e.actor;
        // `defer:` (playtest 2, I6): while it holds, a pushed card goes back to the queue for next month instead of showing.
        if (e.defer && !item.force && this.test(e.defer, item.actor || null)) {
          s.queue.push({ id: item.id, actor: item.actor || null, due: s.turn + 1, track: item.track, cast: item.cast, src: 'queued' });
          continue;
        }
        // item.force (debug/preview) skips the `when` check
        if ((e.actor === 'any' || e.actor === 'npc' || (e.cast && !item.cast)) && !item.actor && !item.cast) {
          this._place = item.place || null; this._slot = item.slot || null;
          const c = this.candidates(e); const pick = this.pickWeighted(c);
          this._place = null; this._slot = null;
          if (!pick) continue;
          item.actor = pick.actor; if (pick.cast) item.cast = pick.cast;
        } else if (!item.force) {
          this._cast = item.cast || null; this._place = item.place || null; this._slot = item.slot || null; this._shift = !!item.shift;
          const ok = this.test(e.when, item.actor) && this.castHolds(e, item.cast);
          this._cast = null; this._place = null; this._slot = null; this._shift = false;
          if (!ok) continue;
        }
        s.cur = item;
        s.seen[e.id] = (s.seen[e.id] || 0) + 1;
        s.last[e.id] = s.turn;
        const who = e.per && item.cast ? item.cast[e.per] : item.actor;
        if (who) { s.lastBy = s.lastBy || {}; s.lastBy[e.id + '@' + who] = s.turn; }
        // A specialization (E1) shares its generic card's once / repeat bookkeeping, for that character.
        const gen = e.specializes && this.c.events[e.specializes];
        if (gen) { s.seen[gen.id] = (s.seen[gen.id] || 0) + 1; s.last[gen.id] = s.turn; if (item.actor) { s.lastBy = s.lastBy || {}; s.lastBy[gen.id + '@' + item.actor] = s.turn; } }
        s.cardsThisMonth++;
        let onShow = null;
        this.withContext(item, () => { if (e.on_show) { const ctx = this.newCtx(item.actor, null, e.id); ctx.cast = item.cast; ctx.track = item.track; this.run(e.on_show, ctx); this.handleZeroed(ctx); onShow = this.outcome(ctx); } });
        const view = this.withContext(item, () => this.view(item));
        item.n = ++s.seq;
        s.hist.push({
          t: 'card', n: item.n, turn: s.turn, year: this.yearOf(), month: this.monthIndex(), id: e.id, actor: item.actor || null, src: item.src, type: e.type,
          slot: item.slot || undefined, place: item.place || undefined, track: item.track || undefined, class: e.class || undefined, cast: item.cast || undefined, variant: item.variant || undefined,
          title: view.title, text: view.text,
          options: view.options.map((o) => ({ key: o.key, label: o.label, disabled: o.disabled || undefined, check: o.check || undefined })),
          onShow: onShow || undefined, at: now(),
        });
        return { kind: 'card', view, onShow };
      }
      // The prologue's cards are done (newGame): month 1 begins now.
      if (s.prologue) { delete s.prologue; s.turn = 0; return this.beginMonth(); }
      return this.endMonth();
    }

    // What a journal entry keeps of its card's context, to name people and places when it is shown again.
    logContext(item) { const o = {}; for (const k of ['cast', 'track', 'place']) if (item[k]) o[k] = item[k]; return o; }
    withContext(item, fn) {
      const prev = [this._cast, this._ctxTrack, this._ctxPlace, this._place];
      this._cast = item.cast || null; this._ctxTrack = item.track || null; this._ctxPlace = item.place || null; this._place = item.place || null;
      try { return fn(); } finally { [this._cast, this._ctxTrack, this._ctxPlace, this._place] = prev; }
    }
    view(item) {
      const e = this.c.events[item.id];
      const a = item.actor;
      const npc = a && this.c.npcs[a];
      return {
        id: e.id, type: e.type, src: item.src, slot: item.slot || null, place: item.place || null, track: item.track || null, cast: item.cast || null, offers: e.offers || null,
        title: this.interp(e.title, a, e.id), text: this.interp(e.text, a, e.id),
        art: e.art || null, scene: e.scene ? this.interp(e.scene, a, e.id) : null, tags: e.tags || [],
        actor: npc ? { id: a, name: npc.name, title: npc.title, color: npc.color, house: npc.house, ...this.s.npcs[a] } : null,
        pick: this.pickCount(e),
        // Option visibility (M24): in a menu, an option whose `when` fails is hidden unless it names its `locked:`
        // reason (a stated prerequisite); then it shows, disabled, with the reason. Cards keep both sides.
        options: ((all) => { const poor = this.poorKeys(e, all, a); return all.map((o) => [o, poor.has(o.key)]); })(this.optionsOf(e).filter((o) => (!o.spell || (this.s.spells || {})[o.spell]) && (!o.item || this.hasItem(o.item)))
          .filter((o) => e.type !== 'menu' || !o.when || o.locked || this.test(o.when, a))).map(([o, poor]) => {
          const lv = o.spell ? this.s.spells[o.spell] : 0;
          const cost = o.spell ? this.spellCost(o.spell, lv) : 0;
          const short = o.spell && (this.s.vals[this.spellResource] || 0) < cost;
          return {
            key: o.key, label: this.interp(o.label, a, e.id), hint: o.hint ? this.interp(o.hint, a, e.id) : null,
            disabled: (o.when ? !this.test(o.when, a) : false) || short || poor,
            poor: poor ? this.priceOf(o) : undefined,
            affects: o.affects,
            spell: o.spell ? { id: o.spell, level: lv, cost, short } : null,
            item: o.item ? { id: o.item } : null,
            check: o.firstCheck ? this.checkView(o.firstCheck, a, item) : null,
            course: (o.effects[0] && o.effects[0].t === 'enrol') ? this.courseOutlook(o.effects[0].track, o.effects[0].level) : null,
            job: (o.effects[0] && o.effects[0].t === 'join') ? this.jobOutlook(o.effects[0].track) : null,
            switching: o.switching || null,
            locked: o.locked && o.when && !this.test(o.when, a) ? this.interp(o.locked, a, e.id) : null,
          };
        }),
      };
    }

    // `opts.fights`: results of fights the UI played (fightAhead → the minigame → its result), used in order by the
    // option's combat and duel challenges instead of the resolver.
    choose(key, opts = {}) {
      const s = this.s;
      if (!s.cur) throw new Error('no current card');
      const item = s.cur, e = this.c.events[item.id];
      if (Array.isArray(key)) return this.chooseMany(key);
      const opt = this.withContext(item, () => this.optionsOf(e)).find((o) => o.key === key);
      if (!opt) throw new Error('no option ' + key + ' on ' + e.id);
      if (opt.when && !this.test(opt.when, item.actor)) throw new Error('option ' + key + ' is not available');
      if (this.withContext(item, () => this.poorKeys(e, this.optionsOf(e), item.actor)).has(key)) throw new Error('option ' + key + ' costs more than you have');
      // The origin picked in the mirror itself (the prologue) is recorded as one picked before the game (applyOrigin).
      if (e.id === this.c.game.origins) { s.origin = key; s.hist.push({ t: 'origin', key, at: now() }); }
      const ctx = this.newCtx(item.actor, null, e.id);
      ctx.cast = item.cast || null; ctx.track = item.track || null;
      this._cast = ctx.cast; this._ctxTrack = ctx.track; this._ctxPlace = item.place || null;
      this._variant = item.variant || null;
      if (opt.item && !this.hasItem(opt.item)) throw new Error('item ' + opt.item + ' is not owned');
      if (opt.spell) {
        const lv = (s.spells || {})[opt.spell];
        if (!lv) throw new Error('spell ' + opt.spell + ' is not known');
        const cost = this.spellCost(opt.spell, lv);
        if ((s.vals[this.spellResource] || 0) < cost) throw new Error('not enough ' + this.spellResource + ' for ' + opt.spell);
        this.chargeCast(opt.spell, cost, ctx);
      }
      this._fightQueue = opts.fights ? opts.fights.slice() : null; this._optKey = key; this._optEffects = opt.effects;
      try { this.run(opt.effects, ctx); } finally { this._fightQueue = null; this._optKey = null; this._optEffects = null; }
      if (item.track) { this.courseworkFor(item.track, ctx); this.classCheckPrep(item.track, ctx); }
      this.handleZeroed(ctx);
      this._variant = null;
      // Track cards (design §6.2, §7.3): a course card is study for the exam; outcomes move performance.
      if (item.track && s.tracks && s.tracks[item.track]) {
        const t = s.tracks[item.track];
        if (t.status === 'enrolled' && this.studyRule().attend) { const sr = this.studyRule(); t.study = Math.min(sr.cap, (t.study || 0) + sr.attend); }
        if (t.status === 'member') for (const c of ctx.checks) { const good = c.challenge ? c.result === 'win' : c.ok; const bad = c.challenge ? c.result === 'lose' : !c.ok; if (good) t.perf = Math.min(100, t.perf + 5); if (bad) t.perf = Math.max(0, t.perf - 5); }
      }
      this._cast = null; this._ctxTrack = null; this._ctxPlace = null;
      if (opt.memory) {
        const who = opt.memory.who === 'npc' ? item.actor : opt.memory.who;
        if (who && this.c.npcs[who]) { s.memories = s.memories || []; s.memories.push({ npc: who, event: e.id, kind: opt.memory.kind, turn: s.turn }); if (s.memories.length > 400) s.memories.shift(); }
      }
      if (item.actor && s.npcs[item.actor]) s.npcs[item.actor].touched = s.turn;
      if (this.noteContact) this.noteContact(item, ctx.contact || {}, [key]);
      s.choices[e.id] = key;
      s.cur = null;
      const out = this.outcome(ctx);
      const h = item.n != null ? this.histEntry(item.n) : null;
      // Titles and labels in the card's own context (its cast, track and place), so a log names people, not {friend}.
      const said = (x) => this.withContext(item, () => this.interp(x, item.actor, e.id));
      if (h) Object.assign(h, { choice: key, label: said(opt.label), out: { say: out.say, deltas: out.deltas, notes: out.notes, checks: out.checks }, vals: { ...s.vals }, chosenAt: now() }, ctx.fights ? { fights: ctx.fights } : {});
      s.log.push({ n: item.n, turn: s.turn, id: e.id, key, title: said(e.title), choice: said(opt.label), say: out.say, sayIds: ctx.sayIds.slice(), actor: item.actor || null, seen: s.seen[e.id] || 0, ...this.logContext(item) });
      if (s.log.length > 400) s.log.shift();
      return out;
    }
    // A `pick: N` menu: several options at once (design §7.3 enrolment).
    chooseMany(keys) {
      const s = this.s, item = s.cur, e = this.c.events[item.id];
      const opts = this.withContext(item, () => this.optionsOf(e));
      const n = this.pickCount(e);
      keys = [...new Set(keys)];
      if (keys.length < 1 || keys.length > n) throw new Error(e.id + ' takes 1 to ' + n + ' option(s)');
      const ctx = this.newCtx(item.actor, null, e.id);
      ctx.cast = item.cast || null; ctx.track = item.track || null;
      this._cast = ctx.cast; this._ctxTrack = ctx.track;
      const chosen = keys.map((k) => { const o = opts.find((x) => x.key === k); if (!o) throw new Error('no option ' + k + ' on ' + e.id); if (o.when && !this.test(o.when, item.actor)) throw new Error('option ' + k + ' is not available'); return o; });
      for (const o of chosen) this.run(o.effects, ctx);
      this.handleZeroed(ctx);
      this._cast = null; this._ctxTrack = null;
      if (this.noteContact) this.noteContact(item, ctx.contact || {}, keys);
      s.choices[e.id] = keys.join('+');
      s.cur = null;
      const out = this.outcome(ctx);
      const said = (x) => this.withContext(item, () => this.interp(x, item.actor, e.id));
      const label = chosen.map((o) => said(o.label)).join(' · ');
      const h = item.n != null ? this.histEntry(item.n) : null;
      if (h) Object.assign(h, { choice: keys.join('+'), label, out: { say: out.say, deltas: out.deltas, notes: out.notes, checks: out.checks }, vals: { ...s.vals }, chosenAt: now() });
      s.log.push({ n: item.n, turn: s.turn, id: e.id, key: keys.join('+'), title: said(e.title), choice: label, say: out.say, sayIds: ctx.sayIds.slice(), actor: item.actor || null, seen: s.seen[e.id] || 0, ...this.logContext(item) });
      return out;
    }

    /* ---------------- Previews (design §8.3) ---------------- */
    // Every way an option can turn out, by running its effects on a scratch copy of the state for each path
    // through its chances, checks and challenges, with random amounts at both ends of their range. Nothing
    // in the real state (or the RNG) changes. Paths more than 2 branches deep are merged into ranges.
    //   -> { paths: [{p, labels, deltas: {key: [lo, hi]}, follows, what, over}], deltas (envelope), follows, what, cost }
    //   deltas are the amounts as written, also past a cap or floor (feedback 2026-10-19); over: the keys that met one
    //   what: what the "…" stands for: {notes, followUp, remembered, ends} (no titles or flag names)
    preview(eventId, key, actor) {
      const e = this.c.events[eventId];
      const opt = e && this.optionsOf(e).find((o) => o.key === key);
      if (!opt) throw new Error('no option ' + key + ' on ' + eventId);
      const s = this.s;
      const cost = opt.spell ? this.spellCost(opt.spell, (s.spells || {})[opt.spell] || 1) : 0;
      // `day`: a `visit <slot>` in a previewed option must not open the slot (A1: hovering "Go out" opened midnight).
      const KEYS = ['vals', 'flags', 'states', 'npcs', 'queue', 'deck', 'ended', 'spells', 'facts', 'memories', 'npcRel', 'rng', 'cur', 'tracks', 'places', 'arcs', 'clues', 'skillGain', 'peak', 'day', 'termGrades', 'items', 'worn', 'itemsHad'];
      const runOnce = (prefix, mode) => {
        const saved = {}; for (const k of KEYS) saved[k] = s[k];
        if (saved.day) s.day = { ...saved.day };
        s.vals = { ...saved.vals }; s.flags = { ...saved.flags }; s.spells = { ...(saved.spells || {}) }; s.facts = { ...(saved.facts || {}) };
        s.npcRel = { ...(saved.npcRel || {}) }; s.memories = (saved.memories || []).slice(); s.queue = saved.queue.slice(); s.deck = saved.deck.slice();
        s.states = {}; for (const [k, v] of Object.entries(saved.states)) s.states[k] = { ...v };
        s.tracks = {}; for (const [k, v] of Object.entries(saved.tracks || {})) s.tracks[k] = { ...v, passed: { ...v.passed }, grades: (v.grades || []).slice() };
        s.items = { ...(saved.items || {}) }; s.worn = { ...(saved.worn || {}) }; s.itemsHad = { ...(saved.itemsHad || {}) };   // the kit (E4)
        s.places = { ...(saved.places || {}) }; s.arcs = {}; for (const [k, v] of Object.entries(saved.arcs || {})) s.arcs[k] = { ...v };
        s.clues = { ...(saved.clues || {}) }; s.skillGain = { ...(saved.skillGain || {}) }; s.peak = { ...(saved.peak || {}) };
        s.termGrades = {}; for (const [k, v] of Object.entries(saved.termGrades || {})) s.termGrades[k] = v.map((x) => ({ ...x }));
        s.npcs = {}; for (const [k, v] of Object.entries(saved.npcs)) s.npcs[k] = { ...v };
        const decisions = [];
        const fightSeen = this._oracle = {
          branch: (kind, probs, label) => {
            const i = decisions.length;
            const choice = i < prefix.length ? prefix[i] : probs.findIndex((x) => x > 0);
            decisions.push({ kind, probs, label, choice: choice < 0 ? 0 : choice });
            return decisions[i].choice;
          },
          amount: (a, b) => (mode === 'min' ? Math.min(a, b) : Math.max(a, b)),
        };
        const ctx = this.newCtx(actor, null, eventId);
        const cur = s.cur && s.cur.id === eventId ? s.cur : {};
        this._variant = cur.variant || null; ctx.cast = cur.cast || null; ctx.track = cur.track || null;
        this._cast = ctx.cast; this._ctxTrack = ctx.track;
        try {
          if (opt.spell) this.chargeCast(opt.spell, cost, ctx);
          this.run(opt.effects, ctx);
          if (ctx.track) { this.courseworkFor(ctx.track, ctx); this.classCheckPrep(ctx.track, ctx); }
          this.handleZeroed(ctx);
        } finally {
          const follows = ctx.notes.some((n) => n.kind !== 'wage') || s.queue.length !== saved.queue.length || s.deck.length !== saved.deck.length || !!s.ended !== !!saved.ended ||
            Object.keys(s.flags).length !== Object.keys(saved.flags).length || Object.keys(s.flags).some((k) => !saved.flags[k]);
          // What follows, for the preview's "…": the notes (a spell learned, someone met…), a follow-up card, something
          // remembered (a flag), or the end of the run. No card titles or flag names: those could give a story away.
          const what = { notes: ctx.notes.filter((n) => n.kind !== 'wage').map((n) => JSON.parse(JSON.stringify(n))),
            followUp: s.queue.length > saved.queue.length || s.deck.length !== saved.deck.length,
            remembered: Object.keys(s.flags).length !== Object.keys(saved.flags).length || Object.keys(s.flags).some((k) => !saved.flags[k]),
            ends: !!s.ended && !saved.ended };
          this._oracle = null; this._variant = null; this._cast = null; this._ctxTrack = null;
          for (const k of KEYS) s[k] = saved[k];
          runOnce.last = { decisions, deltas: ctx.deltas, follows, what, fight: !!fightSeen.fight, over: Object.keys(ctx.over || {}) };
        }
        return runOnce.last;
      };
      const paths = [];
      const queue = [[]];
      const mergeWhat = (a, b) => {
        if (!a) return b; if (!b) return a;
        const seen = new Set(a.notes.map((n) => JSON.stringify(n)));
        return { notes: a.notes.concat(b.notes.filter((n) => !seen.has(JSON.stringify(n)))), followUp: a.followUp || b.followUp, remembered: a.remembered || b.remembered, ends: a.ends || b.ends };
      };
      while (queue.length && paths.length < 64) {
        const prefix = queue.shift();
        const lo = runOnce(prefix, 'min'), hi = runOnce(lo.decisions.map((d) => d.choice), 'max');
        const deltas = {};
        for (const k of new Set([...Object.keys(lo.deltas), ...Object.keys(hi.deltas)])) { const a = lo.deltas[k] || 0, b = hi.deltas[k] || 0; deltas[k] = [Math.min(a, b), Math.max(a, b)]; }
        let p = 1;
        lo.decisions.forEach((d) => { p *= (d.probs[d.choice] || 0) / 100; });
        paths.push({ p, decisions: lo.decisions.map((d) => ({ kind: d.kind, choice: d.choice, label: d.label })), deltas, follows: lo.follows || hi.follows, what: mergeWhat(lo.what, hi.what), fight: lo.fight || hi.fight, over: [...new Set(lo.over.concat(hi.over))] });
        for (let i = prefix.length; i < lo.decisions.length; i++) {
          lo.decisions[i].probs.forEach((x, a) => { if (x > 0 && a !== lo.decisions[i].choice) queue.push(lo.decisions.slice(0, i).map((d) => d.choice).concat([a])); });
        }
      }
      // Merge paths beyond 2 branches deep into ranges.
      const merged = new Map();
      for (const pth of paths) {
        const head = pth.decisions.slice(0, 2);
        const k = head.map((d) => d.kind + d.choice).join('/');
        const m = merged.get(k);
        if (!m) { merged.set(k, { p: pth.p, labels: head, deltas: { ...pth.deltas }, follows: pth.follows, what: pth.what, fight: pth.fight, over: pth.over.slice() }); continue; }
        m.p += pth.p; m.follows = m.follows || pth.follows; m.what = mergeWhat(m.what, pth.what); m.fight = m.fight || pth.fight; m.over = [...new Set(m.over.concat(pth.over))];
        for (const key2 of new Set([...Object.keys(m.deltas), ...Object.keys(pth.deltas)])) {
          const a = m.deltas[key2] || [0, 0], b = pth.deltas[key2] || [0, 0];
          m.deltas[key2] = [Math.min(a[0], b[0]), Math.max(a[1], b[1])];
        }
      }
      const out = [...merged.values()];
      const envelope = {};
      for (const pth of out) for (const [k, [a, b]] of Object.entries(pth.deltas)) { const cur = envelope[k] || [Infinity, -Infinity]; envelope[k] = [Math.min(cur[0], a), Math.max(cur[1], b)]; }
      for (const pth of out) for (const k of Object.keys(envelope)) if (!pth.deltas[k]) { envelope[k] = [Math.min(envelope[k][0], 0), Math.max(envelope[k][1], 0)]; }
      // `fight`: the option plays a fight; its odds are the stub's estimate, and the fight settles its own bars (FIGHT_BARS).
      return { paths: out, deltas: envelope, follows: out.some((x) => x.follows), what: out.reduce((w, x) => mergeWhat(w, x.what), null), cost, spell: opt.spell || null, fight: out.some((x) => x.fight) };
    }
    // Does a real outcome fit one of the preview's paths? (The preview property test, design §8.3.)
    // A path through a played fight doesn't predict the bars the fight settles (FIGHT_BARS).
    static fits(preview, deltas) {
      const keys = (d) => Object.keys(d).filter((k) => d[k]);
      return preview.paths.some((pth) => {
        for (const k of new Set([...keys(deltas), ...Object.keys(pth.deltas)])) {
          if (pth.fight && FIGHT_BARS.includes(k)) continue;
          const v = deltas[k] || 0, r = pth.deltas[k] || [0, 0];
          // A preview shows the amounts as written; where one met a cap or floor (`over`), the real change differs.
          if (pth.over && pth.over.includes(k)) continue;
          if (v < r[0] - 1e-9 || v > r[1] + 1e-9) return false;
        }
        return true;
      });
    }
    outcome(ctx) { return Object.assign({ say: ctx.say.join(' '), deltas: ctx.deltas, notes: ctx.notes, checks: ctx.checks, ended: !!this.s.ended }, ctx.capped ? { capped: ctx.capped } : {}); }

    /* ---------------- Endings ---------------- */
    // Yearbook endings (design §10.5). Each final ending has a `slot:` (default headline): headline takes 1 (the
    // highest priority whose `when` holds, else the fallback with no `when`), mystery 0–1, relationships 0–3,
    // personal 0–2. A picked ending's `excludes:` removes others. Early endings stay exclusive.
    yearbook() {
      const list = Object.values(this.c.endings).filter((x) => x.kind !== 'early').sort((a, b) => (b.priority || 0) - (a.priority || 0));
      const out = [], excluded = new Set(), slotOf = (x) => x.slot || 'headline';
      for (const [slot, max] of YEARBOOK) {
        const pool = list.filter((x) => slotOf(x) === slot);
        for (const x of pool) {
          if (out.filter((y) => y.slot === slot).length >= max) break;
          if (excluded.has(x.id) || !x.when || !this.test(x.when, null)) continue;
          out.push({ slot, id: x.id }); for (const e of x.excludes || []) excluded.add(e);
        }
        if (slot === 'headline' && !out.length) { const fb = pool.filter((x) => !x.when).pop() || pool[pool.length - 1]; if (fb) out.push({ slot, id: fb.id }); }
      }
      return out;
    }
    finalEnding() { const b = this.yearbook(); return b.length ? b[0].id : null; }
    ending() {
      const s = this.s, id = s.ended.id; const d = this.c.endings[id] || { title: 'The End', text: '' };
      const book = (s.ended.book || []).filter((x) => x.slot !== 'headline' && this.c.endings[x.id]).map((x) => { const e = this.c.endings[x.id]; return { slot: x.slot, id: x.id, title: this.interp(e.title), text: this.interp(e.text), art: e.art || 'star' }; });
      const last = s.hist[s.hist.length - 1];
      if (!last || last.t !== 'end') s.hist.push(Object.assign({ t: 'end', n: ++s.seq, turn: s.turn, id, title: this.interp(d.title), early: s.turn < this.maxTurns, vals: { ...s.vals }, at: now() }, book.length ? { yearbook: book.map((x) => x.slot + ':' + x.id) } : {}));
      return { kind: 'ending', n: s.seq, id, title: this.interp(d.title), text: this.interp(d.text), art: d.art || 'star', scene: d.scene || null, turn: this.s.turn, early: this.s.turn < this.maxTurns, yearbook: book };
    }

    /* ---------------- Snapshot for UI ---------------- */
    snapshot() {
      const s = this.s, c = this.c;
      return {
        name: s.name, turn: s.turn, maxTurns: this.maxTurns, month: this.monthName(), monthIndex: this.monthIndex(), year: this.yearOf(), years: this.years,
        deckLeft: s.deck.length, cardsThisMonth: s.cardsThisMonth,
        resources: c.order.resources.map((id) => ({ id, ...pick(c.resources[id], ['name', 'icon', 'color', 'min', 'desc', 'display', 'warn_below']), maxNow: this.resMax(c.resources[id]), value: s.vals[id] })),
        gpa: this.gpa(), phase: this.isWrapUp() ? 'wrapup' : this.phaseOf(), season: this.seasonOf(),
        tracks: Object.entries(s.tracks || {}).filter(([id, t]) => c.tracks[id] && ['enrolled', 'member', 'done', 'failed', 'applied'].includes(t.status)).map(([id, t]) => {
          const d = c.tracks[id], ranks = (d.ranks || '').split(/\s*[,，、]\s*/).filter(Boolean), levels = (d.level_names || d.name).split(/\s*[,，、]\s*/);
          return { id, name: d.name, kind: d.kind, status: t.status, level: t.level || null, levelName: t.level ? levels[t.level - 1] || d.name : null, passed: this.levelPassed(id), grades: (t.grades || []).slice(), rank: ranks[t.rank] || null, perf: Math.round(t.perf || 0), due: Math.max(0, (t.due || 0) - (t.visits || 0)), progress: Math.round(t.progress || 0),
            done: d.kind === 'job' && t.status === 'member' && t.visits >= (t.due || 0), ...(d.kind === 'course' && t.status === 'enrolled' ? this.courseStanding(id) : {}) };
        }),
        // The kit (E4): what you own, and what you wear in each slot.
        items: Object.keys(s.items || {}).filter((id) => c.items && c.items[id]).map((id) => ({ id, ...pick(c.items[id], ['name', 'slot', 'art', 'start']), desc: this.interp(c.items[id].desc || ''), effects: c.items[id].worn || null, worn: Object.values(s.worn || {}).includes(id), since: s.items[id].since })),
        worn: Object.assign({}, s.worn || {}),
        spells: Object.entries(s.spells || {}).filter(([id]) => c.spells && c.spells[id]).map(([id, level]) => ({ id, level, ...pick(c.spells[id], ['name', 'desc', 'art', 'skill']), cost: this.spellCost(id, level) })),
        skills: c.order.skills.map((id) => ({ id, ...pick(c.skills[id], ['name', 'icon', 'color', 'max', 'desc']), value: s.vals[id] })),
        states: Object.keys(s.states).filter((id) => c.states[id] && !c.states[id].hidden && !c.states[id].deprecated).map((id) => ({ id, name: c.states[id].name || id, desc: this.interp(c.states[id].desc || ''), art: c.states[id].art, kind: c.states[id].kind || null, group: c.states[id].group || null, left: s.states[id].left })),
        npcs: c.order.npcs.filter((id) => s.npcs[id].met).map((id) => { const n = s.npcs[id]; return { id, ...pick(c.npcs[id], ['name', 'short', 'title', 'house', 'desc', 'color', 'romance', 'pronouns', 'look']), ...n, ...(n.sparkHid && !n.sparkAsked && n.bond !== 'partner' ? { spark: Math.max(0, (n.spark || 0) - n.sparkHid) } : {}) }; }),   // carried spark stays out of sight until asked (2026-10-20)
        log: s.log,
      };
    }
  }
  function newRunId(seed) { return 'r' + now().toString(36) + '-' + ((seed >>> 0) % 1679616).toString(36); }
  function pick(o, keys) { const r = {}; for (const k of keys) if (o[k] != null) r[k] = o[k]; return r; }

  if (Director) Director.install(Engine, G);
  Engine.shortName = shortName;
  Engine.SAVE_VERSION = SAVE_VERSION;
  Engine.SaveVersionError = SaveVersionError;
  return Engine;
});
