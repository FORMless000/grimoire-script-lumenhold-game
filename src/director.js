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
 * people come by two tracks (design §5.5): encounters at visited places and lunch, and each met character's own
 * monthly roll to find you, driven by warmth;
 * when the day overflows max_cards_per_day, priority decides: story > track > pushed > friend > social > ambient,
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
  const PRIORITY = { story: 5, track: 4, pushed: 3, friend: 2.5, social: 2, ambient: 1 };
  // Two tracks for people (design §5.5). Warmth (0–100) is recent, chosen contact with one character.
  //   base: every met character's standing pull · presence: visiting a place where they are · engage / cool: a card with them where you did / didn't warm to them
  //   meet: warmth on meeting · fade: monthly multiplier · encounter: chance of a card with someone present at a visit
  //   lunch: the same at the social slot, with anyone scheduled there at a place you know
  //   push: a character's monthly chance to find you = pull / 100, capped at maxP; at most `cap` such cards a month
  //   (capBreak in break months, when the chance is also halved).
  const FRIENDS = { base: 4, presence: 6, engage: 18, cool: 8, meet: 35, fade: 0.8, encounter: 0.55, lunch: 0.35, maxP: 0.85, cap: 2, capBreak: 1, bond: { partner: 30, close: 20, friend: 12, rival: 10, nemesis: 10 } };
  const TAU = 6;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const methods = {
    get dayMode() { return !!(this.c.game.day_term && this.c.game.day_term.length); },
    recipe() { return (this.phaseOf() === 'break' ? this.c.game.day_break : this.c.game.day_term) || []; },
    visitSlots() { return this.recipe().filter((r) => r.source === 'visit').map((r) => r.slot); },

    /* ---------------- index (built once) ---------------- */
    directorIndex() {
      if (this._dir) return this._dir;
      const c = this.c, ix = { legacyTrack: {}, byPlace: {}, byTrack: {}, byPlan: {}, slotBound: [], ambient: [], social: [], arc: [], personal: {} };
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
        // One character's own cards (design §5.5) also go on that character's track: drawn when you meet them at a place
        // or when they come looking for you, outside the shared pools' competition.
        if (!e.place && !track && !e.plan && !e.slot && e.actor && e.actor !== 'any' && e.actor !== 'npc' && c.npcs[e.actor]) (ix.personal[e.actor] = ix.personal[e.actor] || []).push(e);
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
      if (!s.visitsTo) s.visitsTo = {};
      for (const id of picks) if (id) s.visitsTo[id] = (s.visitsTo[id] || 0) + 1;
      const ctx = this.newCtx(null, null);
      for (const id of new Set(picks.filter(Boolean))) {
        const p = this.c.places[id];
        if (p && p.track) for (const n of picks.filter((x) => x === id)) this.attend(p.track, ctx);   // each visit counts
      }
      this.handleZeroed(ctx);
      s.day.picks = picks;
      s.hist.push(Object.assign({ t: 'pick', turn: s.turn, picks, at: Date.now() }, Object.keys(ctx.deltas).length ? { deltas: { ...ctx.deltas } } : {}));   // attendance pay etc.
      this.buildDay(picks, view.locked);
      return this.outcome(ctx);
    },

    /* ---------------- building the day ---------------- */
    // Within this run only (design §5.2): earlier runs, and other players on a shared server, don't make a card rarer.
    novelty(e) {
      const s = this.s, since = s.last[e.id] != null ? s.turn - s.last[e.id] : 999;
      return (1 - Math.exp(-since / TAU)) * Math.pow(0.6, s.seen[e.id] || 0);
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
    /* ---------------- people: two tracks (design §5.5) ---------------- */
    // How strongly a character comes looking for you: recent warmth, plus standing friendship, spark and bond.
    pull(id) {
      const n = this.s.npcs[id]; if (!n) return 0;
      const hostile = n.bond === 'rival' || n.bond === 'nemesis';
      return FRIENDS.base + (n.warmth || 0) + 0.3 * Math.max(0, hostile ? -n.rel : n.rel) + 0.3 * (n.spark || 0) + (FRIENDS.bond[n.bond] || 0);
    },
    warm(id, d) { const n = this.s.npcs[id]; if (n) n.warmth = clamp(Math.round((n.warmth || 0) + d), 0, 100); },
    // Cards with one character: their own events, and generic social events cast with them in the `per:` role.
    boundCandidates(e, id) {
      if (e.actor === id) return this.candidates(e);
      if (e.actor === 'any') return this.candidates(e).filter((c) => c.actor === id).map((c) => Object.assign(c, { w: e.weight ? this.value(e.weight, id, 10) : 10 }));
      if (e.cast && e.per) {
        if (!this.eligibleFor(e, id)) return [];
        const cast = this.fillCast(e, { [e.per]: id }); if (!cast) return [];
        const prev = this._cast; this._cast = cast; const w = e.weight ? this.value(e.weight, id, 10) : 10; this._cast = prev;
        return w > 0 ? [{ e, actor: id, cast, w }] : [];
      }
      return [];
    },
    drawWith(id, used, dayItems, extra) {
      const ix = this.directorIndex(), cands = [];
      for (const e of (ix.personal[id] || []).concat(ix.social.filter((x) => x.actor === 'any' || x.per))) {
        if (used.has(e.id) || !this.eligible(e, used)) continue;
        if (this._plotLeft != null && this._plotLeft <= 0 && this.isPlot(e)) continue;
        for (const c of this.boundCandidates(e, id)) { const sc = c.w * this.novelty(e) * this.variety(e, dayItems) * ((ix.personal[id] || []).includes(e) ? 2 : 1); if (sc > 0) cands.push({ ...c, w: sc }); }
      }
      const pick = this.pickWeighted(cands);
      if (!pick) return null;
      if (this._plotLeft != null && this.isPlot(pick.e)) this._plotLeft--;
      used.add(pick.e.id);
      return Object.assign({ id: pick.e.id, actor: id, cast: pick.cast || undefined }, extra || {});
    },
    // After a card: warmth for everyone it touched (`contact`: id → sign of the rel/spark amounts applied). Choosing to
    // warm to someone (a rel or spark gain, even at the cap) draws them closer;
    // a card with them where you didn't cools it. Rivals warm on any contact.
    noteContact(item, contact) {
      const s = this.s, who = new Set();
      if (item.actor && s.npcs[item.actor]) who.add(item.actor);
      for (const id of Object.values(item.cast || {})) if (s.npcs[id]) who.add(id);
      for (const [id, sg] of Object.entries(contact)) if (s.npcs[id] && sg > 0) who.add(id);
      for (const id of who) {
        const n = s.npcs[id]; if (!n.met) continue;
        const hostile = n.bond === 'rival' || n.bond === 'nemesis';
        if (contact[id] > 0 || (hostile && contact[id] != null)) this.warm(id, FRIENDS.engage);
        else this.warm(id, -FRIENDS.cool);
      }
    },
    isPlot(e) { return !!e && !!(e.arc || (e.chain && this.c.arcs && this.c.arcs[e.chain])); },
    // Plot cards allowed this month: 1, or 2 when any arc has a beat now.
    plotCap() { return Object.values(this.c.arcs || {}).some((a) => (a.beats || []).some((b) => b.year === this.yearOf() && b.month === this.monthIndex())) ? 2 : 1; },
    // Weighted draw of one card from a pool of events; respects once/repeat, `when`, casting.
    draw(pool, used, dayItems, extra) {
      const cands = [];
      for (const e of pool) {
        if (used.has(e.id) || !this.eligible(e, used)) continue;
        if (this._plotLeft != null && this._plotLeft <= 0 && this.isPlot(e)) continue;   // the month's plot card is spent
        for (const c of this.candidates(e)) {
          const sc = c.w * this.novelty(e) * this.relevance(e, c.actor) * this.variety(e, dayItems);
          if (sc > 0) cands.push({ ...c, w: sc });
        }
      }
      const pick = this.pickWeighted(cands);
      if (!pick) return null;
      if (this._plotLeft != null && this.isPlot(pick.e)) this._plotLeft--;
      used.add(pick.e.id);
      return Object.assign({ id: pick.e.id, actor: pick.actor || null, cast: pick.cast || undefined }, extra || {});
    },
    buildDay(picks, locked) {
      const s = this.s, ix = this.directorIndex(), used = new Set(s.deck.map((d) => d.id));
      const maxCards = this.c.game.max_cards_per_day || 14;
      // Warmth fades a little every month (design §5.5).
      for (const n of Object.values(s.npcs)) if (n.warmth) n.warmth = Math.floor(n.warmth * FRIENDS.fade);
      const brk = this.phaseOf() === 'break', withToday = new Set();
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
      // Arc beats (design §10.6): at most one plot card a month, except in a beat month. A plot card is an arc
      // beat or any event whose `chain:` is an arc; queued follow-ups (a scene already under way) are not held back.
      let plot = s.deck.concat(pushed).filter((x) => x.src !== 'queued' && this.isPlot(this.c.events[x.id])).length;
      for (const e of ix.arc) {
        if (e.trigger === 'queued' || used.has(e.id) || !this.eligible(e, used)) continue;
        const a = s.arcs[e.arc] || { clock: 0 };
        if (e.beat != null && a.clock < e.beat) continue;
        if (plot >= this.plotCap()) break;
        const c = this.candidates(e); if (!c.length) continue;
        const pick = this.pickWeighted(c);
        pushed.push({ id: e.id, actor: pick.actor, cast: pick.cast, src: 'arc', prio: 'story', slot: e.slot });
        used.add(e.id); plot++;
      }
      this._plotLeft = this.plotCap() - plot;
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
            // Track 1 (design §5.5): the people here. Being where they are warms them; sometimes a card with one of them.
            // Unmet characters count too, so introductions happen where people actually are.
            const here = this.presentAt(place, r.slot).filter((id) => s.npcs[id] && !withToday.has(id));
            for (const id of here) if (s.npcs[id].met) this.warm(id, FRIENDS.presence);
            if (here.length && this.rand() < FRIENDS.encounter) {
              const order = here.slice(); const cards = [];
              while (order.length && !cards.length) {
                const w = order.map((id) => 10 + this.pull(id)); let x = this.rand() * w.reduce((a, b) => a + b, 0), k = 0;
                for (; k < order.length - 1; k++) { x -= w[k]; if (x < 0) break; }
                const id = order.splice(k, 1)[0];
                const it = this.drawWith(id, used, day.concat(items), { place, prio: 'social', src: 'encounter' });
                if (it) { cards.push(it); withToday.add(id); }
              }
              items.push(...cards);
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
          // Track 1 at lunch (design §5.5): anyone whose schedule has them at a place you know in this slot, met or not.
          if (r.source === 'social') {
            const here = Object.keys(s.npcs).filter((id) => !withToday.has(id) && (this.c.npcs[id].schedule || []).some((x) => x.slots.includes(r.slot) && s.places[x.place]));
            if (here.length && this.rand() < FRIENDS.lunch) {
              const w = here.map((id) => 10 + this.pull(id)); let x = this.rand() * w.reduce((a, b) => a + b, 0), k = 0;
              for (; k < here.length - 1; k++) { x -= w[k]; if (x < 0) break; }
              const it = this.drawWith(here[k], used, day.concat(items), { prio: 'social', src: 'encounter' });
              if (it) { items.push(it); withToday.add(here[k]); }
            }
          }
        }
        // Pushed cards for this slot (their own `slot:`, else the first slot of the day).
        const mine = pushed.filter((p) => { const e = this.c.events[p.id]; const sl = p.slot || (e && e.slot) || this.recipe()[0].slot; return sl === r.slot; });
        for (const it of mine.concat(items)) day.push(Object.assign(it, { slot: r.slot }));
        this._slot = null;
      }
      // Track 2 (design §5.5): each character you know may come and find you this month, on their own roll.
      const rec = this.recipe().map((x) => x.slot), friendSlot = rec.includes('noon') ? 'noon' : rec.includes('night') ? 'night' : rec[rec.length - 1];
      const callers = Object.keys(s.npcs).filter((id) => s.npcs[id].met && !withToday.has(id)).sort((a, b) => this.pull(b) - this.pull(a));
      let calls = 0;
      for (const id of callers) {
        if (calls >= (brk ? FRIENDS.capBreak : FRIENDS.cap)) break;
        const p = Math.min(FRIENDS.maxP, this.pull(id) / 100) * (brk ? 0.5 : 1);
        if (p <= 0 || this.rand() >= p) continue;
        const it = this.drawWith(id, used, day, { prio: 'friend', src: 'friend' });
        if (!it) continue;
        calls++; withToday.add(id);
        let at = -1; day.forEach((x, i) => { if (rec.indexOf(x.slot) <= rec.indexOf(friendSlot)) at = i; });   // after the slot's other cards
        day.splice(at + 1, 0, Object.assign(it, { slot: friendSlot }));
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
    Engine.prototype.FRIENDS = FRIENDS;
  }
  return { install, SLOTS, FRIENDS };
});
