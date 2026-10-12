/*
 * The director (design §5): builds each month's day. DOM-free; installed onto Engine.prototype.
 *
 *   beginMonth -> s.day = {phase: 'pick'} -> advance() returns {kind: 'map', view: mapView()}
 *   pickPlaces([afternoon, evening]) -> attendance, then buildDay(): the day's cards, slot by slot
 *
 * A day follows @game day_term / day_break: morning=courses noon=social:1-2 afternoon=visit evening=visit
 * night=world:1-2 midnight=special:0-1. Each slot draws from its source by weighted sampling:
 *   score = weight × novelty × relevance × variety          (design §5.2)
 * Pushed cards (queued, auto, arc beats, track notices) go into their slot (event `slot:`, else morning);
 * when the day overflows max_cards_per_day, priority decides: story > track > pushed > social > ambient,
 * and pushed cards that don't fit move to the next day.
 *
 * Older content without places, slots or tracks is drawn too: random events fill the night and, through
 * `@place draws:` tags, the visits; social events fill noon; class/club/job events gated on a track's
 * `legacy:` states count as that track's events.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Director = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const SLOTS = ['morning', 'noon', 'afternoon', 'evening', 'night', 'midnight'];
  const PRIORITY = { story: 5, track: 4, pushed: 3, social: 2, ambient: 1 };
  const TAU = 6;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const methods = {
    get dayMode() { return !!(this.c.game.day_term && this.c.game.day_term.length); },
    recipe() { return (this.phaseOf() === 'break' ? this.c.game.day_break : this.c.game.day_term) || []; },
    visitSlots() { return this.recipe().filter((r) => r.source === 'visit').map((r) => r.slot); },

    /* ---------------- index (built once) ---------------- */
    directorIndex() {
      if (this._dir) return this._dir;
      const c = this.c, ix = { legacyTrack: {}, byPlace: {}, byTrack: {}, byPlan: {}, slotBound: [], ambient: [], social: [], arc: [] };
      for (const t of Object.values(c.tracks || {})) for (const st of t.legacy || []) ix.legacyTrack[st] = t.id;
      // Events gated on a legacy state count as that track's events (compat).
      const legacyOf = (e) => { if (!e.when) return null; let hit = null; const G = this.G; G.walkAst(e.when.ast, (n) => { if (n.t === 'call' && n.n === 'has' && n.args[0] && n.args[0].t === 'sym' && ix.legacyTrack[n.args[0].v]) hit = ix.legacyTrack[n.args[0].v]; }); return hit; };
      for (const e of this.events) {
        if (e.trigger === 'auto' || e.trigger === 'queued') { if (e.arc) ix.arc.push(e); continue; }
        if (e.arc && e.beat != null) { ix.arc.push(e); continue; }
        const track = e.track || legacyOf(e);
        if (e.place) (ix.byPlace[e.place] = ix.byPlace[e.place] || []).push(e);
        else if (track) (ix.byTrack[track] = ix.byTrack[track] || []).push(e);
        else if (e.plan) (ix.byPlan[e.plan] = ix.byPlan[e.plan] || []).push(e);
        else if (e.slot) ix.slotBound.push(e);
        else if (e.trigger === 'social') ix.social.push(e);
        else ix.ambient.push(e);
      }
      return (this._dir = ix);
    },

    /* ---------------- the map (design §6.3) ---------------- */
    placeOpen(p, slot) {
      if (p.open && !p.open.includes(slot)) return false;
      if (p.closed_when && this.test(p.closed_when, null)) return false;
      if (p.season && p.season !== 'any') {
        const se = this.seasonOf(); const neg = /^not\s+/.test(p.season); const list = p.season.replace(/^not\s+/, '').split(/[\s,]+/);
        if (neg ? list.includes(se) : !list.includes(se)) return false;
      }
      return true;
    },
    // Festivals and other events that take a visit (design §4.4): `replaces: visit1|visit2` with a `place:`.
    festivals() {
      const out = [], used = new Set();
      for (const e of this.events) {
        if (!e.replaces || !e.place || used.has(e.id)) continue;
        if (!this.eligible(e, used) || !this.test(e.when, null)) continue;
        for (const r of e.replaces) { const i = { visit1: 0, visit2: 1 }[r]; if (i != null) out.push({ visit: i, place: e.place, event: e.id }); }
        used.add(e.id);
      }
      return out;
    },
    mapView() {
      const s = this.s, slots = this.visitSlots(), fest = this.festivals();
      // Which map (design §4.3): home for the home plan, the host's map during an internship, else the campus.
      let breakMap = 'campus';
      if (this.phaseOf() === 'break' && s.states.plan_home) breakMap = 'home';
      else if (this.phaseOf() === 'break' && s.states.plan_internship) {
        const host = Object.entries(s.tracks || {}).find(([id, t]) => t.kind === 'internship' && t.status === 'member');
        const pl = host && this.c.tracks[host[0]] && this.c.places[this.c.tracks[host[0]].place];
        if (pl && pl.map) breakMap = pl.map.map;
      }
      const places = [];
      for (const p of Object.values(this.c.places || {})) {
        if (!p.map || p.map.map !== breakMap) continue;
        const found = !!s.places[p.id];
        const hinted = !found && p.hinted_when && this.test(p.hinted_when, null);
        if (!found && !hinted) continue;
        const open = slots.map((sl) => found && this.placeOpen(p, sl));
        const t = p.track && s.tracks[p.track] && s.tracks[p.track].status === 'member' ? s.tracks[p.track] : null;
        const here = found ? [...new Set(slots.flatMap((sl) => this.presentAt(p.id, sl).filter((id) => s.npcs[id] && s.npcs[id].met)))] : [];
        const ix = this.directorIndex();
        const news = found && (ix.byPlace[p.id] || []).some((e) => !s.seen[e.id] && this.eligible(e, new Set()) && this.test(e.when, null));
        places.push({ id: p.id, name: p.name, x: p.map.x, y: p.map.y, kind: p.kind || 'public', art: p.art || null, hint: hinted ? p.hint || '' : null, state: found ? (open.some(Boolean) ? 'open' : 'closed') : 'hinted', open, hours: p.open || null,
          track: t ? { id: p.track, due: Math.max(0, (t.due || 0) - (t.visits || 0)), urgent: this.isTermEnd() && t.visits < t.due, kind: this.c.tracks[p.track].kind } : null,
          present: here, news, festival: fest.filter((f) => f.place === p.id).map((f) => ({ slot: slots[f.visit], event: f.event })) });
      }
      return { map: breakMap, slots, places, locked: fest.filter((f) => f.visit < slots.length).map((f) => ({ slot: slots[f.visit], place: f.place, event: f.event })), season: this.seasonOf(), phase: this.phaseOf() };
    },
    // The player's picks for the visit slots; festival-locked slots ignore the pick. Returns the attendance outcome.
    pickPlaces(ids) {
      const s = this.s;
      if (!s.day || s.day.phase !== 'pick') throw new Error('no places to pick now');
      const view = this.mapView();
      const picks = view.slots.map((sl, i) => {
        const lock = view.locked.find((l) => l.slot === sl);
        if (lock) return lock.place;
        const id = ids[i];
        const p = view.places.find((x) => x.id === id);
        if (!id) return null;
        if (!p || p.state !== 'open' || !p.open[i]) throw new Error('place ' + id + ' is not open in the ' + sl);
        return id;
      });
      const ctx = this.newCtx(null, null);
      for (const id of new Set(picks.filter(Boolean))) {
        const p = this.c.places[id];
        if (p && p.track) for (const n of picks.filter((x) => x === id)) this.attend(p.track, ctx);   // each visit counts
      }
      this.handleZeroed(ctx);
      s.day.picks = picks;
      s.hist.push({ t: 'pick', turn: s.turn, picks, at: Date.now() });
      this.buildDay(picks, view.locked);
      return this.outcome(ctx);
    },

    /* ---------------- building the day ---------------- */
    novelty(e) {
      const s = this.s, since = s.last[e.id] != null ? s.turn - s.last[e.id] : 999;
      return (1 - Math.exp(-since / TAU)) * Math.pow(0.6, s.seen[e.id] || 0) * Math.pow(0.85, (s.runsSeen || {})[e.id] || 0);
    },
    relevance(e, actor) {
      const s = this.s;
      let aff = 0;
      if (actor && s.npcs[actor]) { const n = s.npcs[actor]; aff = clamp((Math.abs(n.rel) / 50 + n.spark / 40 + (n.bond !== 'none' ? 0.5 : 0)) / 2, 0, 1); }
      const arc = e.arc && this.actOf(e.arc) > 0 ? 1 : 0;
      const recent = (this._recentTags || []);
      const overlap = (e.tags || []).length ? (e.tags || []).filter((t) => recent.includes(t)).length / e.tags.length : 0;
      return (1 + 0.5 * aff) * (1 + 0.5 * arc) * (1 + 0.3 * overlap);
    },
    variety(e, dayItems) {
      const prev = dayItems.slice(-2).map((x) => this.c.events[x.id]).filter(Boolean);
      const primary = (x) => (x.tags || [])[0];
      return prev.some((p) => (e.tone && p.tone === e.tone) || (primary(e) && primary(p) === primary(e))) ? 0.5 : 1;
    },
    // Weighted draw of one card from a pool of events; respects once/repeat, `when`, casting.
    draw(pool, used, dayItems, extra) {
      const cands = [];
      for (const e of pool) {
        if (used.has(e.id) || !this.eligible(e, used)) continue;
        for (const c of this.candidates(e)) {
          const sc = c.w * this.novelty(e) * this.relevance(e, c.actor) * this.variety(e, dayItems);
          if (sc > 0) cands.push({ ...c, w: sc });
        }
      }
      const pick = this.pickWeighted(cands);
      if (!pick) return null;
      used.add(pick.e.id);
      return Object.assign({ id: pick.e.id, actor: pick.actor || null, cast: pick.cast || undefined }, extra || {});
    },
    buildDay(picks, locked) {
      const s = this.s, ix = this.directorIndex(), used = new Set(s.deck.map((d) => d.id));
      const maxCards = this.c.game.max_cards_per_day || 14;
      this._recentTags = [].concat(...s.hist.filter((h) => h.t === 'card').slice(-6).map((h) => (this.c.events[h.id] || {}).tags || []));
      // Pushed cards: due queue items (windows by chance), auto events, arc beats.
      const pushed = [];
      const keep = [];
      for (const q of s.queue) {
        if (q.due > s.turn) { keep.push(q); continue; }
        if (q.until != null && q.until > s.turn && this.rand() >= 1 / (q.until - s.turn + 1)) { keep.push(q); continue; }
        pushed.push({ id: q.id, actor: q.actor || null, src: 'queued', track: q.track, cast: q.cast, prio: this.c.events[q.id] && this.c.events[q.id].class === 'story' ? 'story' : q.track ? 'track' : 'pushed' });
        used.add(q.id);
      }
      s.queue = keep;
      for (const e of this.byTrigger.auto) {
        if (!this.eligible(e, used)) continue;
        const c = this.candidates(e);
        if (!c.length) continue;
        const pick = this.pickWeighted(c);
        pushed.push({ id: e.id, actor: pick.actor, cast: pick.cast, src: 'auto', prio: e.class === 'story' || e.arc ? 'story' : 'pushed', p: e.priority != null ? e.priority : 50 });
        used.add(e.id);
      }
      // Arc beats (design §10.6): at most one plot card a month, except in a beat month.
      let plot = 0;
      for (const e of ix.arc) {
        if (e.trigger === 'queued' || used.has(e.id) || !this.eligible(e, used)) continue;
        const a = s.arcs[e.arc] || { clock: 0 };
        if (e.beat != null && a.clock < e.beat) continue;
        const beatNow = (this.c.arcs[e.arc] && this.c.arcs[e.arc].beats || []).some((b) => b.year === this.yearOf() && b.month === this.monthIndex());
        if (plot >= (beatNow ? 2 : 1)) break;
        const c = this.candidates(e); if (!c.length) continue;
        const pick = this.pickWeighted(c);
        pushed.push({ id: e.id, actor: pick.actor, cast: pick.cast, src: 'arc', prio: 'story', slot: e.slot });
        used.add(e.id); plot++;
      }
      pushed.sort((a, b) => (b.p || 0) - (a.p || 0));
      // Slot by slot.
      const day = [];
      let visit = 0;
      for (const r of this.recipe()) {
        this._slot = r.slot;
        const items = [];
        const count = r.min == null ? 1 : r.min + Math.floor(this.rand() * ((r.max || r.min) - r.min + 1));
        if (r.source === 'courses') {
          for (const [id, t] of Object.entries(s.tracks || {})) {
            const d = this.c.tracks[id];
            if (!d || !((t.status === 'enrolled' && d.kind === 'course') || (t.status === 'member' && d.kind === 'thesis'))) continue;
            const pool = (ix.byTrack[id] || []).filter((e) => !e.level || e.level <= (t.level || 1));
            const it = this.draw(pool, used, day.concat(items), { track: id, prio: 'track' });
            if (it) items.push(it);
          }
        } else if (r.source === 'visit') {
          const place = picks[visit];
          const lock = (locked || []).find((l) => l.slot === r.slot);
          visit++;
          if (lock) { items.push({ id: lock.event, actor: null, place: lock.place, prio: 'story', src: 'festival' }); used.add(lock.event); }
          else if (place) {
            const p = this.c.places[place];
            this._place = place;
            const n = r.min == null ? 1 + Math.floor(this.rand() * 2) : count;
            for (let k = 0; k < n; k++) {
              const t = p.track && s.tracks[p.track] && s.tracks[p.track].status === 'member' ? p.track : null;
              const it = (t && k === 0 && this.draw((ix.byTrack[t] || []).filter((e) => !e.rank || e.rank <= s.tracks[t].rank + 1), used, day.concat(items), { place, track: t, prio: 'track' }))
                || this.draw(ix.byPlace[place] || [], used, day.concat(items), { place, prio: 'ambient' })
                || this.draw(ix.ambient.filter((e) => (e.tags || []).some((tg) => (p.draws || []).includes(tg))), used, day.concat(items), { place, prio: 'ambient' });
              if (it) items.push(it);
            }
            this._place = null;
          }
        } else if (r.source === 'social' || r.source === 'world' || r.source === 'special' || r.source === 'plan') {
          const plan = Object.keys(s.states).find((k) => this.c.states[k] && this.c.states[k].kind === 'plan');
          const pool = r.source === 'social' ? ix.social
            : r.source === 'special' ? ix.slotBound.filter((e) => e.slot === r.slot)
            : r.source === 'plan' ? (plan && ix.byPlan[plan.replace(/^plan_/, '')]) || ix.ambient
            : ix.ambient.concat(ix.slotBound.filter((e) => e.slot === r.slot));
          for (let k = 0; k < count; k++) { const it = this.draw(pool, used, day.concat(items), { prio: r.source === 'social' ? 'social' : 'ambient' }); if (it) items.push(it); }
        }
        // Pushed cards for this slot (their own `slot:`, else the first slot of the day).
        const mine = pushed.filter((p) => { const e = this.c.events[p.id]; const sl = p.slot || (e && e.slot) || this.recipe()[0].slot; return sl === r.slot; });
        for (const it of mine.concat(items)) day.push(Object.assign(it, { slot: r.slot }));
        this._slot = null;
      }
      // Pushed cards whose slot isn't in today's recipe go first.
      for (const p of pushed) if (!day.includes(p)) day.unshift(Object.assign(p, { slot: this.recipe()[0].slot }));
      // Overflow (design §5.3): drop the lowest priority; pushed cards move to the next day.
      while (day.length > maxCards) {
        let worst = 0;
        day.forEach((x, i) => { if (PRIORITY[x.prio || 'ambient'] < PRIORITY[day[worst].prio || 'ambient']) worst = i; });
        const [out] = day.splice(worst, 1);
        if (out.src === 'queued' || out.src === 'auto' || out.src === 'arc') s.queue.push({ id: out.id, actor: out.actor, due: s.turn + 1, track: out.track, cast: out.cast, src: 'queued' });
      }
      // Variant hard (design §8.6): more likely as the years go by.
      for (const it of day) { const e = this.c.events[it.id]; if (e && e.variant === 'hard' && this.rand() < (this.yearOf() - 1) * 0.15) it.variant = 'hard'; }
      s.deck = s.deck.concat(day.map(({ prio, p, ...rest }) => rest));
      s.day.phase = 'cards';
    },
  };

  function install(Engine, G) {
    for (const [k, d] of Object.entries(Object.getOwnPropertyDescriptors(methods))) Object.defineProperty(Engine.prototype, k, d);
    Engine.prototype.G = G;
  }
  return { install, SLOTS };
});
