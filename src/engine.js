/*
 * Lumenhold engine — DOM-free game logic. Runs in browser (window.Engine) and Node.
 *
 * Flow:   newGame() -> {kind:'month'}  -> advance() -> {kind:'card'} -> choose(key) -> outcome
 *         advance() ... when the month's deck is empty, advance() returns the next {kind:'month'}
 *         or {kind:'ending'} once the game is over.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./grimoire.js'));
  else root.Engine = factory(root.Grimoire);
})(typeof self !== 'undefined' ? self : this, function (G) {
  'use strict';

  const PRONOUNS = {
    she: { they: 'she', them: 'her', their: 'her', theirs: 'hers', are: 'is', s: 's' },
    he: { they: 'he', them: 'him', their: 'his', theirs: 'his', are: 'is', s: 's' },
    they: { they: 'they', them: 'them', their: 'their', theirs: 'theirs', are: 'are', s: '' },
  };
  const DEFAULT_PRIORITY = { queued: 60, auto: 50, social: 20, random: 10 };
  const ANY_EVENT_REST = 2;
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
      this.maxTurns = this.years * this.months.length;
      this.cardsPerMonth = g.cards_per_month || 3;
      this.maxCards = g.max_cards_per_month || 7;
      this.socialPerMonth = g.social_per_month == null ? 1 : g.social_per_month;
      this.minRandom = g.min_random_per_month == null ? 1 : g.min_random_per_month;
      this.events = Object.values(content.events);
      this.byTrigger = { random: [], auto: [], social: [], queued: [] };
      for (const e of this.events) (this.byTrigger[e.trigger] || []).push(e);
      this.hooks = Object.values(content.hooks);
      // Index every `say` line of every option (event.option.n) so the journal can re-render
      // outcomes in whatever language is loaded now.
      this.sayIndex = {};
      for (const e of this.events) for (const o of e.options) {
        let n = 0;
        G.walkEffects(o.effects, (st) => { if (st.t === 'say') { st.sid = e.id + '.' + o.key + '.' + (++n); this.sayIndex[st.sid] = st; } });
      }
      // Static analysis: which resources each option may touch (for the Reigns-style preview dots).
      for (const e of this.events) for (const o of e.options) {
        const set = new Set();
        G.walkEffects(o.effects, (st) => { if ((st.t === 'delta' || st.t === 'assign') && content.resources[st.name]) set.add(st.name); });
        o.affects = [...set];
        o.firstCheck = o.effects.find((st) => st.t === 'check') || null;
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
        version: 1, seed, rng: seed, name: opts.name || 'Wren', turn: 0,
        vals: {}, flags: {}, states: {}, npcs: {}, seen: {}, last: {}, lastBy: {}, choices: {},
        queue: [], deck: [], cur: null, log: [], ended: null, pending: [], cardsThisMonth: 0,
      };
      for (const id of this.c.order.resources) s.vals[id] = this.c.resources[id].start ?? 50;
      for (const id of this.c.order.skills) s.vals[id] = this.c.skills[id].start ?? 0;
      for (const id of this.c.order.npcs) s.npcs[id] = { met: false, rel: this.c.npcs[id].start_rel || 0, love: 0, bond: 'none' };
      this.runHooks('game_start');
      return this.beginMonth();
    }
    save() { return JSON.stringify(this.s); }
    load(json) { this.s = typeof json === 'string' ? JSON.parse(json) : json; return this; }

    /* ---------------- Calendar ---------------- */
    get turn() { return this.s.turn; }
    monthIndex(turn = this.s.turn) { return ((turn - 1) % this.months.length) + 1; }
    yearOf(turn = this.s.turn) { return Math.ceil(turn / this.months.length); }
    monthName(turn = this.s.turn) { return this.months[this.monthIndex(turn) - 1]; }

    /* ---------------- Expression environment ---------------- */
    env(actor) {
      const eng = this, s = this.s;
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
          }
          const v = s.vals[n];
          return v == null ? 0 : v;
        },
        fn(n, a) {
          switch (n) {
            case 'has': return !!s.flags[a[0]] || !!s.states[a[0]];
            case 'flag': return !!s.flags[a[0]];
            case 'left': { const st = s.states[a[0]]; return st ? (st.left == null ? 99 : st.left) : 0; }
            case 'rel': return s.npcs[a[0]] ? s.npcs[a[0]].rel : 0;
            case 'love': return s.npcs[a[0]] ? s.npcs[a[0]].love : 0;
            case 'bond': return s.npcs[a[0]] ? s.npcs[a[0]].bond : 'none';
            case 'met': return !!(s.npcs[a[0]] && s.npcs[a[0]].met);
            case 'npc_is': return actor === a[0];
            case 'romanceable': return !!(eng.c.npcs[a[0]] && eng.c.npcs[a[0]].romance);
            case 'tagged': return !!(eng.c.npcs[a[0]] && (eng.c.npcs[a[0]].tags || []).includes(a[1]));
            case 'seen': return s.seen[a[0]] || 0;
            case 'since': return s.last[a[0]] != null ? s.turn - s.last[a[0]] : 999;
            case 'chosen': return s.choices[a[0]] === a[1];
            case 'bonds': return Object.values(s.npcs).filter((x) => x.met && x.bond === a[0]).length;
            case 'known': return Object.values(s.npcs).filter((x) => x.met).length;
            case 'rand': return eng.randInt(Math.round(a[0]), Math.round(a[1]));
            case 'chance_of': return eng.checkChance(a[0], a[1]);
            case 'min': return Math.min(...a);
            case 'max': return Math.max(...a);
            case 'abs': return Math.abs(a[0]);
            case 'floor': return Math.floor(a[0]);
            case 'round': return Math.round(a[0]);
            case 'clamp': return clamp(a[0], a[1], a[2]);
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
      return clamp(Math.round(50 + (v - dc) * 3), 5, 95);
    }

    /* ---------------- Text ---------------- */
    interp(text, actor) {
      if (!text) return '';
      const s = this.s;
      return text.replace(/\{([^{}]+)\}/g, (m, k) => {
        k = k.trim();
        if (k === 'player') return s.name;
        if (k === 'month') return this.monthName();
        if (k === 'year') return String(this.yearOf());
        if (k[0] === '=') {
          const src = k.slice(1);
          try { const ex = this._exprCache[src] || (this._exprCache[src] = G.expr(src)); const v = ex.fn(this.env(actor)); return typeof v === 'number' ? String(Math.round(v)) : String(v); } catch (e) { return m; }
        }
        let npcId = actor, key = k;
        const dot = k.indexOf('.');
        if (dot > 0) { npcId = k.slice(0, dot) === 'npc' ? actor : k.slice(0, dot); key = k.slice(dot + 1); }
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
    newCtx(actor, label) { return { actor, label, deltas: {}, say: [], sayIds: [], notes: [], checks: [], zeroed: [], nowIdx: 0 }; }

    change(name, amount, ctx) {
      const s = this.s, c = this.c;
      const def = c.resources[name] || c.skills[name];
      const old = s.vals[name] == null ? 0 : s.vals[name];
      let nv = old + amount;
      if (def) {
        const min = def.min == null ? 0 : def.min;
        const max = def.max == null ? 100 : def.max;
        nv = clamp(nv, min, max);
        if (c.resources[name] && nv <= min && old > min) ctx.zeroed.push(name);
      }
      nv = Math.round(nv * 100) / 100;
      s.vals[name] = nv;
      const d = nv - old;
      if (d) ctx.deltas[name] = (ctx.deltas[name] || 0) + d;
    }

    npcOf(ref, ctx) { return ref === 'npc' ? ctx.actor : ref; }
    touchNpc(id, ctx) {
      const n = this.s.npcs[id];
      if (!n) return null;
      if (!n.met) { n.met = true; ctx.notes.push({ kind: 'meet', npc: id, text: 'You met ' + this.c.npcs[id].name + '.' }); }
      return n;
    }

    run(effects, ctx) {
      if (!effects) return;
      const s = this.s, c = this.c;
      for (const st of effects) {
        if (s.ended && st.t !== 'say') return;
        switch (st.t) {
          case 'delta': this.change(st.name, this.randInt(st.min, st.max), ctx); break;
          case 'assign': {
            const v = this.value(st.expr, ctx.actor);
            if (st.op === '=') this.change(st.name, v - (s.vals[st.name] || 0), ctx);
            else this.change(st.name, st.op === '+=' ? v : -v, ctx);
            break;
          }
          case 'say': ctx.say.push(this.interp(st.text, ctx.actor)); if (st.sid) ctx.sayIds.push(st.sid); break;
          case 'flag': st.names.forEach((n) => { s.flags[n] = true; }); break;
          case 'unflag': st.names.forEach((n) => { delete s.flags[n]; }); break;
          case 'gain': this.addState(st.state, st.dur ? this.value(st.dur, ctx.actor) : null, ctx); break;
          case 'lose': this.removeState(st.state, ctx, false); break;
          case 'queue': {
            if (!c.events[st.event]) { this.warn(new Error('queue: unknown event ' + st.event), st); break; }
            const actor = st.with ? this.npcOf(st.with, ctx) : (c.events[st.event].actor === 'npc' ? ctx.actor : null);
            if (st.now) s.deck.splice(ctx.nowIdx++, 0, { id: st.event, actor, src: 'queued' });
            else {
              const delay = st.delay ? Math.max(0, Math.round(this.value(st.delay, ctx.actor))) : 1;
              if (delay === 0) s.deck.push({ id: st.event, actor, src: 'queued' });
              else s.queue.push({ id: st.event, actor, due: s.turn + delay });
            }
            break;
          }
          case 'rel': case 'love': {
            const id = this.npcOf(st.npc, ctx); const n = this.touchNpc(id, ctx);
            if (!n) break;
            const amt = this.randInt(st.min, st.max);
            const old = n[st.t];
            n[st.t] = st.t === 'rel' ? clamp(old + amt, -100, 100) : clamp(old + amt, 0, 100);
            const key = st.t + ':' + id;
            if (n[st.t] !== old) ctx.deltas[key] = (ctx.deltas[key] || 0) + (n[st.t] - old);
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
            const p = this.value(st.p, ctx.actor);
            this.run(this.rand() * 100 < p ? st.body : st.else, ctx);
            break;
          }
          case 'check': {
            const p = this.checkChance(st.skill, this.value(st.dc, ctx.actor));
            const ok = this.rand() * 100 < p;
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
      if (!def.hidden) ctx.notes.push({ kind: 'gain', state: id, text: '+ ' + (def.name || id) });
      this.run(def.on_add, ctx);
    }
    removeState(id, ctx, expired) {
      const s = this.s, def = this.c.states[id];
      if (!s.states[id]) return;
      delete s.states[id];
      if (def) {
        if (!def.hidden) ctx.notes.push({ kind: 'lose', state: id, text: '− ' + (def.name || id) });
        if (expired) this.run(def.on_expire, ctx);
        this.run(def.on_remove, ctx);
      }
    }

    runHooks(on, summary) {
      for (const h of this.hooks) {
        if (h.on !== on || !this.test(h.when, null)) continue;
        const ctx = this.newCtx(null, h.label || h.desc || h.id);
        this.run(h.do, ctx);
        this.handleZeroed(ctx);
        if (summary) summary.push(this.summaryItem(ctx, h.label || null));
      }
    }
    summaryItem(ctx, label) { return { label, deltas: ctx.deltas, notes: ctx.notes, say: ctx.say }; }

    /* ---------------- Month cycle ---------------- */
    beginMonth() {
      const s = this.s;
      s.turn++;
      s.cardsThisMonth = 0;
      const summary = s.pending || []; s.pending = [];
      // State ticks & durations
      for (const id of Object.keys(s.states)) {
        const def = this.c.states[id]; const st = s.states[id];
        if (!def || !st) continue;
        const ctx = this.newCtx(null, def.name || id);
        if (st.since < s.turn) {
          this.run(def.tick, ctx);
          if (st.left != null) { st.left--; if (st.left <= 0) this.removeState(id, ctx, true); }
        }
        this.handleZeroed(ctx);
        if (Object.keys(ctx.deltas).length || ctx.notes.length || ctx.say.length) summary.push(this.summaryItem(ctx, def.hidden ? null : (def.name || id)));
      }
      this.runHooks('month_start', summary);
      if (!s.ended) this.buildDeck();
      return { kind: 'month', turn: s.turn, month: this.monthName(), monthIndex: this.monthIndex(), year: this.yearOf(), maxTurns: this.maxTurns, summary: summary.filter((x) => Object.keys(x.deltas).length || x.notes.length || x.say.length), deckSize: s.deck.length, ended: !!s.ended };
    }

    // once / repeat bookkeeping. For `actor: any` events it is per person:
    // "once" means once with each character, `repeat: N` is a per-character cooldown,
    // and the event as a whole rests for ANY_EVENT_REST months so it doesn't recur back-to-back.
    eligible(e, used) {
      if (used.has(e.id)) return false;
      if (e.actor === 'any') return this.s.last[e.id] == null || (this.s.turn - this.s.last[e.id]) >= ANY_EVENT_REST;
      const seen = this.s.seen[e.id] || 0;
      if (!e.repeat) return seen === 0;
      return seen === 0 || (this.s.turn - this.s.last[e.id]) >= e.repeat;
    }
    eligibleFor(e, actor) {
      if (e.actor !== 'any') return true;
      const last = (this.s.lastBy || {})[e.id + '@' + actor];
      if (last == null) return true;
      return !!e.repeat && (this.s.turn - last) >= e.repeat;
    }
    // [{e, actor, w}] for an event, honouring actor binding
    candidates(e) {
      const out = [];
      let actors;
      if (e.actor === 'any') actors = Object.keys(this.s.npcs).filter((id) => this.s.npcs[id].met);
      else if (e.actor && e.actor !== 'npc') actors = [e.actor];
      else actors = [null];
      for (const a of actors) {
        if (a && e.trigger === 'social' && !(this.s.npcs[a] && this.s.npcs[a].met)) continue;
        if (a && !this.eligibleFor(e, a)) continue;
        if (!this.test(e.when, a)) continue;
        const w = e.weight ? this.value(e.weight, a, 10) : 10;
        if (w > 0) out.push({ e, actor: a, w });
      }
      // For `actor: any`, people you're closer to (or at war with) turn up more often,
      // while the event's total weight stays what the author wrote.
      if (e.actor === 'any' && out.length > 1) {
        const aff = (x) => { const n = this.s.npcs[x.actor]; return 1 + Math.abs(n.rel) / 20 + n.love / 15 + (n.bond !== 'none' ? 1 : 0); };
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
      for (const q of due) { head.push({ id: q.id, actor: q.actor, src: 'queued', p: prio(q.id, 'queued') }); used.add(q.id); }
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
      this.runHooks('month_end', summary);
      s.pending = summary;
      if (s.ended) return this.ending();
      if (s.turn >= this.maxTurns) { s.ended = { id: this.finalEnding() }; return this.ending(); }
      return this.beginMonth();
    }

    /* ---------------- Cards ---------------- */
    advance() {
      const s = this.s;
      if (s.ended) return this.ending();
      if (s.cur) return { kind: 'card', view: this.view(s.cur), onShow: null };
      while (s.deck.length) {
        const item = s.deck.shift();
        const e = this.c.events[item.id];
        if (!e) { this.warn(new Error('unknown event in deck: ' + item.id)); continue; }
        if (e.actor && e.actor !== 'any' && e.actor !== 'npc') item.actor = e.actor;
        // item.force (debug/preview) skips the `when` check
        if ((e.actor === 'any' || e.actor === 'npc') && !item.actor) {
          const c = this.candidates(e); const pick = this.pickWeighted(c);
          if (!pick) continue;
          item.actor = pick.actor;
        } else if (!item.force && !this.test(e.when, item.actor)) continue;
        s.cur = item;
        s.seen[e.id] = (s.seen[e.id] || 0) + 1;
        s.last[e.id] = s.turn;
        if (item.actor) { s.lastBy = s.lastBy || {}; s.lastBy[e.id + '@' + item.actor] = s.turn; }
        s.cardsThisMonth++;
        let onShow = null;
        if (e.on_show) { const ctx = this.newCtx(item.actor); this.run(e.on_show, ctx); this.handleZeroed(ctx); onShow = this.outcome(ctx); }
        return { kind: 'card', view: this.view(item), onShow };
      }
      return this.endMonth();
    }

    view(item) {
      const e = this.c.events[item.id];
      const a = item.actor;
      const npc = a && this.c.npcs[a];
      return {
        id: e.id, type: e.type, src: item.src,
        title: this.interp(e.title, a), text: this.interp(e.text, a),
        art: e.art || null, scene: e.scene ? this.interp(e.scene, a) : null, tags: e.tags || [],
        actor: npc ? { id: a, name: npc.name, title: npc.title, color: npc.color, house: npc.house, ...this.s.npcs[a] } : null,
        options: e.options.map((o) => ({
          key: o.key, label: this.interp(o.label, a), hint: o.hint ? this.interp(o.hint, a) : null,
          disabled: o.when ? !this.test(o.when, a) : false,
          affects: o.affects,
          check: o.firstCheck ? { skill: o.firstCheck.skill, p: this.checkChance(o.firstCheck.skill, this.value(o.firstCheck.dc, a)) } : null,
        })),
      };
    }

    choose(key) {
      const s = this.s;
      if (!s.cur) throw new Error('no current card');
      const item = s.cur, e = this.c.events[item.id];
      const opt = e.options.find((o) => o.key === key);
      if (!opt) throw new Error('no option ' + key + ' on ' + e.id);
      if (opt.when && !this.test(opt.when, item.actor)) throw new Error('option ' + key + ' is not available');
      const ctx = this.newCtx(item.actor);
      this.run(opt.effects, ctx);
      this.handleZeroed(ctx);
      s.choices[e.id] = key;
      s.cur = null;
      const out = this.outcome(ctx);
      s.log.push({ turn: s.turn, id: e.id, key, title: this.interp(e.title, item.actor), choice: this.interp(opt.label, item.actor), say: out.say, sayIds: ctx.sayIds.slice(), actor: item.actor || null });
      if (s.log.length > 400) s.log.shift();
      return out;
    }
    outcome(ctx) { return { say: ctx.say.join(' '), deltas: ctx.deltas, notes: ctx.notes, checks: ctx.checks, ended: !!this.s.ended }; }

    /* ---------------- Endings ---------------- */
    finalEnding() {
      const list = Object.values(this.c.endings).filter((x) => x.kind !== 'early').sort((a, b) => (b.priority || 0) - (a.priority || 0));
      const hit = list.find((x) => this.test(x.when, null));
      return hit ? hit.id : (list[list.length - 1] || {}).id;
    }
    ending() {
      const id = this.s.ended.id; const d = this.c.endings[id] || { title: 'The End', text: '' };
      return { kind: 'ending', id, title: this.interp(d.title), text: this.interp(d.text), art: d.art || 'star', scene: d.scene || null, turn: this.s.turn, early: this.s.turn < this.maxTurns };
    }

    /* ---------------- Snapshot for UI ---------------- */
    snapshot() {
      const s = this.s, c = this.c;
      return {
        name: s.name, turn: s.turn, maxTurns: this.maxTurns, month: this.monthName(), monthIndex: this.monthIndex(), year: this.yearOf(), years: this.years,
        deckLeft: s.deck.length, cardsThisMonth: s.cardsThisMonth,
        resources: c.order.resources.map((id) => ({ id, ...pick(c.resources[id], ['name', 'icon', 'color', 'min', 'max', 'desc']), value: s.vals[id] })),
        skills: c.order.skills.map((id) => ({ id, ...pick(c.skills[id], ['name', 'icon', 'color', 'max', 'desc']), value: s.vals[id] })),
        states: Object.keys(s.states).filter((id) => c.states[id] && !c.states[id].hidden).map((id) => ({ id, name: c.states[id].name || id, desc: this.interp(c.states[id].desc || ''), art: c.states[id].art, kind: c.states[id].kind || null, group: c.states[id].group || null, left: s.states[id].left })),
        npcs: c.order.npcs.filter((id) => s.npcs[id].met).map((id) => ({ id, ...pick(c.npcs[id], ['name', 'short', 'title', 'house', 'desc', 'color', 'romance', 'pronouns', 'look']), ...s.npcs[id] })),
        log: s.log,
      };
    }
  }
  function pick(o, keys) { const r = {}; for (const k of keys) if (o[k] != null) r[k] = o[k]; return r; }

  Engine.shortName = shortName;
  return Engine;
});
