/*
 * The director (design §5): builds each month's day. DOM-free; installed onto Engine.prototype.
 *
 *   beginMonth -> startDay(): what the day holds (pushed cards, spread cards, the friend slot); advance() steps it:
 *   stepDay() fills one slot at a time, in order (M1); at a visit slot it stops on the map for that one visit
 *   ({kind: "map", view}) and pickPlaces([id]) records the pick and its attendance, then the slot is filled.
 *
 * A day follows @game day_term / day_break: morning=courses noon=social:1-2 afternoon=visit evening=visit
 * night=world:1-2 midnight=special:0-1. Each slot draws from its source by weighted sampling:
 *   score = weight × novelty × relevance × variety × time fit          (design §5.2; `time:` ×3 in its slots, else ×0.3)
 * `@game spread:` sources (social, world) keep their budget but are dealt to random non-special slots (M43).
 * Festivals don't take a visit: picking their place in their slot draws them (B3).
 * Pushed cards (queued, auto, arc beats, track notices) go into their slot (event `slot:`, else the day's first);
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
  // `@place always: a b|c` -> [['a'], ['b', 'c']]   (= Grimoire.alwaysGroups)
  const alwaysGroups = (t) => String(t || '').split(/\s+/).filter(Boolean).map((g) => g.split('|').filter(Boolean));
  const PRIORITY = { story: 5, track: 4, pushed: 3, friend: 2.5, social: 2, ambient: 1 };
  // Two tracks for people (design §5.5). Warmth (0–100) is recent, chosen contact with one character.
  //   base: every met character's standing pull · presence: visiting a place where they are (seeking them, M18) · engage / cool: a card with them where you did / didn't warm to them
  //   meet: warmth on meeting · fade: monthly multiplier · encounter: chance of a card with someone present at a visit
  //   lunch: the same at the social slot, with anyone scheduled there at a place you know
  //   push: a character's monthly chance to find you = pull / 100, capped at maxP; at most `cap` such cards a month
  //   (capBreak in break months, when the chance is also halved).
  //   seeks: per character (`@npc seeks:`): pull × mult, and nothing below `min` warmth.
  //   pen: a distant character's own steady pull (`@npc distant:`, feedback 2026-10-15): they can't be met, so warmth
  //   never builds; they write at this rate, more as you grow close.
  const FRIENDS = { base: 4, presence: 12, engage: 18, cool: 8, meet: 35, fade: 0.8, encounter: 0.55, lunch: 0.35, maxP: 0.85, cap: 2, capBreak: 1, bond: { partner: 30, close: 20, friend: 12, rival: 10, nemesis: 10 },
    seeks: { often: { mult: 1, min: 0 }, sometimes: { mult: 0.6, min: 15 }, rarely: { mult: 0.4, min: 35 }, never: { mult: 0, min: 0 } }, pen: 22 };
  const TAU = 6;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const methods = {
    get dayMode() { return !!(this.c.game.day_term && this.c.game.day_term.length); },
    // The last day (`@game day_last:`) resolves the run: only its pushed cards, no pools (playtest 2, M21).
    isLastDay() { return this.s.turn >= this.maxTurns && !!(this.c.game.day_last && this.c.game.day_last.length); },
    // On a break, the active plan's `day:` (E2) shapes the day: four visits at the castle or at home, three around a gig.
    recipe() { return (this.isLastDay() ? this.c.game.day_last : this.phaseOf() === 'break' ? this.planDay() || this.c.game.day_break : this.c.game.day_term) || []; },
    planDay() {
      const k = Object.keys(this.s.states || {}).find((x) => this.c.states[x] && this.c.states[x].kind === 'plan' && this.c.states[x].day);
      return k ? this.c.states[k].day : null;
    },
    visitSlots() { return this.recipe().filter((r) => r.source === 'visit').map((r) => r.slot); },

    /* ---------------- index (built once) ---------------- */
    directorIndex() {
      if (this._dir) return this._dir;
      const c = this.c, ix = { legacyTrack: {}, byPlace: {}, byTrack: {}, byPlan: {}, slotBound: [], ambient: [], social: [], arc: [], personal: {}, letter: [], ramp: [] };
      for (const t of Object.values(c.tracks || {})) for (const st of t.legacy || []) ix.legacyTrack[st] = t.id;
      // Events gated on a legacy state count as that track's events (compat).
      const legacyOf = (e) => { if (!e.when) return null; let hit = null; const G = this.G; G.walkAst(e.when.ast, (n) => { if (n.t === 'call' && n.n === 'has' && n.args[0] && n.args[0].t === 'sym' && ix.legacyTrack[n.args[0].v]) hit = ix.legacyTrack[n.args[0].v]; }); return hit; };
      ix.special = {};
      for (const e of this.events) {
        // A specialization (E1) is never drawn by itself: it plays in place of its generic card, for its character.
        if (e.specializes) { (ix.special[e.specializes] = ix.special[e.specializes] || {})[e.actor] = e; continue; }
        if (e.trigger === 'auto' || e.trigger === 'queued') { if (e.arc) ix.arc.push(e); continue; }
        if (e.trigger === 'letter') { ix.letter.push(e); continue; }   // letters live apart from every other pool (M38)
        if (e.ramp) { ix.ramp.push(e); continue; }   // milestones are pushed on their ramp, outside the pools (M13)
        if (e.arc && e.beat != null) { ix.arc.push(e); continue; }
        const track = e.track || legacyOf(e);
        if (e.place) (ix.byPlace[e.place] = ix.byPlace[e.place] || []).push(e);
        else if (track) (ix.byTrack[track] = ix.byTrack[track] || []).push(e);
        else if (e.plan) (ix.byPlan[e.plan] = ix.byPlan[e.plan] || []).push(e);
        else if (e.trigger === 'social') ix.social.push(e);
        else if (e.slot) ix.slotBound.push(e);
        else ix.ambient.push(e);
        // One character's own cards (design §5.5) also go on that character's track: drawn when you meet them at a place
        // or when they come looking for you, outside the shared pools' competition.
        if (!e.place && !track && !e.plan && e.actor && e.actor !== 'npc' && c.npcs[e.actor]) (ix.personal[e.actor] = ix.personal[e.actor] || []).push(e);
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
    // The map for the visit being picked now (M1): one slot. Outside a pick, every visit slot (tools, the start-of-month check).
    mapView(only) {
      const s = this.s, d = s.day, picking = !only && d && d.v === 2 && d.at < this.recipe().length && this.isVisitAt(d.at);
      const vi = picking ? this.visitIndex(d.at) : 0;
      const slots = picking ? [this.recipe()[d.at].slot] : this.visitSlots();
      // Festivals (B3, M1) no longer take the visit: their place is highlighted in their slot, and picking it draws the festival.
      const fest = this.festivals().filter((f) => !picking || f.visit === vi).map((f) => Object.assign({}, f, { visit: picking ? 0 : f.visit }));
      // A place with a festival later today is closed until then (playtest 2, I5): it is getting ready.
      const later = picking ? this.festivals().filter((f) => f.visit > vi) : [];
      // Which map (design §4.3): the active plan's `map_id:` on a break (a map id, or a track kind: the map of your track
      // of that kind's place, the internship host), else `@game map_id:`.
      let breakMap = this.c.game.map_id || 'campus';
      const planMap = this.phaseOf() === 'break' && this.planMap();
      if (planMap && this.trackKinds().has(planMap)) {
        const host = Object.keys(s.tracks || {}).find((id) => s.tracks[id].kind === planMap && s.tracks[id].status === 'member');
        const pl = host && this.c.tracks[host] && this.c.places[this.c.tracks[host].place];
        if (pl && pl.map) breakMap = pl.map.map;
      } else if (planMap) breakMap = planMap;
      if (only) breakMap = only;
      const places = [];
      for (const p of Object.values(this.c.places || {})) {
        if (!p.map || p.map.map !== breakMap || p.deprecated) continue;
        const found = !!s.places[p.id];
        const hinted = !found && p.hinted_when && this.test(p.hinted_when, null);
        if (!found && !hinted) continue;
        // In an opened slot (midnight, M41) a place is open only if it has something that names the slot.
        const opened = picking && this.recipe()[d.at].source !== 'visit';
        const names = (e) => e.slot === slots[0] || (e.time || []).includes(slots[0]);
        // One visit per place a day (playtest 2, I3); an opened slot's places are different places at night.
        const visited = picking && !opened && d.picks.includes(p.id);
        const waiting = later.find((f) => f.place === p.id);
        const open = slots.map((sl) => found && !visited && !waiting && this.placeOpen(p, sl) && (!opened || this.playsOpened(p, names)));
        const t = p.track && s.tracks[p.track] && s.tracks[p.track].status === 'member' ? s.tracks[p.track] : null;
        const here = found ? [...new Set(slots.flatMap((sl) => this.presentAt(p.id, sl).filter((id) => s.npcs[id] && s.npcs[id].met)))] : [];
        const ix = this.directorIndex();
        const news = found && (ix.byPlace[p.id] || []).some((e) => !s.seen[e.id] && this.eligible(e, new Set()) && this.test(e.when, null));
        places.push({ id: p.id, name: p.name, x: p.map.x, y: p.map.y, kind: p.kind || 'public', art: p.art || null, hint: hinted ? p.hint || '' : null, state: found ? (only || open.some(Boolean) ? 'open' : 'closed') : 'hinted', open, hours: p.open || null, desc: only ? p.desc || '' : undefined, region: p.region || null,
          // Breaks pause term obligations (B6): the place is still marked as yours, without what's due.
          // A job whose shifts are all done this term (I1) says so.
          track: t ? Object.assign({ id: p.track, kind: this.c.tracks[p.track].kind }, this.phaseOf() === 'break' || this.c.tracks[p.track].kind === 'club' ? { due: null, urgent: false } : { due: Math.max(0, (t.due || 0) - (t.visits || 0)), urgent: this.isTermEnd() && t.visits < t.due },
            this.phaseOf() !== 'break' && this.c.tracks[p.track].kind === 'job' && t.visits >= (t.due || 0) ? { done: true } : {}) : null,
          visited: visited || undefined, festLater: waiting ? this.visitSlots()[waiting.visit] : undefined,
          present: here, news, festival: fest.filter((f) => f.place === p.id).map((f) => ({ slot: slots[f.visit], event: f.event })) });
      }
      return { map: breakMap, slots, places, locked: [], festivals: fest.filter((f) => f.visit < slots.length).map((f) => ({ slot: slots[f.visit], place: f.place, event: f.event })),
        visit: picking ? vi + 1 : null, visits: this.visitSlots().length + (d && d.extraVisit && !this.visitSlots().includes(d.extraVisit) ? 1 : 0), season: this.seasonOf(), phase: this.isWrapUp() ? 'wrapup' : this.phaseOf() };
    },
    // The map button (feedback 2026-10-20): the maps you know, to look at, not to pick from: the one you're on now first,
    // the term map, and any other you've visited a place on (a break at home, an internship). Each is a mapView of that
    // map with the name to show: the game's for the term map, the place's for a map of one place, else null (the UI
    // names it by its places' region).
    atlas() {
      const s = this.s, now = this.mapView().map, home = this.c.game.map_id || 'campus', ids = [now];
      if (!ids.includes(home)) ids.push(home);
      for (const p of Object.values(this.c.places || {})) if (p.map && !p.deprecated && s.places[p.id] && (s.visitsTo || {})[p.id] && !ids.includes(p.map.map)) ids.push(p.map.map);
      return ids.map((m) => {
        const v = this.mapView(m), mine = v.places.filter((p) => p.state !== 'hinted');
        return Object.assign(v, { now: m === now, name: m === home ? this.c.game.title || null : Object.values(this.c.places).filter((p) => p.map && p.map.map === m).length === 1 && mine[0] ? mine[0].name : null, region: mine[0] ? mine[0].region : null });
      }).filter((v) => v.places.some((p) => p.state !== 'hinted'));
    },
    // The active plan's `map_id:` (A1), or null.
    planMap() {
      const k = Object.keys(this.s.states || {}).find((x) => this.c.states[x] && this.c.states[x].kind === 'plan' && this.c.states[x].map_id);
      return k ? this.c.states[k].map_id : null;
    },
    // In an opened slot (midnight, M41) a visit plays only cards that name the slot, so a place is open then only if one
    // of them can play now: a fixed card (`always:`) whose `when` holds, or a drawable one. A card that merely names the
    // slot isn't enough: the Whisperwood's midnight edge waits for a clue, and picking the wood before it led to an empty
    // visit that ended the month (2026-10-20).
    playsOpened(p, names) {
      const ix = this.directorIndex(), used = new Set(this.s.deck.map((d) => d.id)), fixed = new Set(alwaysGroups(p.always).flat());
      const prev = [this._place, this._slot]; this._place = p.id; this._slot = this.curSlot();
      try {
        const pool = [...fixed].map((id) => this.c.events[id]).filter(Boolean).concat(ix.byPlace[p.id] || [], p.track ? ix.byTrack[p.track] || [] : []);
        return pool.some((e) => names(e) && (fixed.has(e.id)
          ? e.slot && this.test(e.when, null)
          : this.eligible(e, used) && this.candidates(e).length > 0));
      } finally { [this._place, this._slot] = prev; }
    },
    // Whether a visit to this job's place will draw one of its shift cards, which pay the wage (M10).
    hasShift(id) {
      const t = this.s.tracks[id], ix = this.directorIndex(), used = new Set(this.s.deck.map((d) => d.id));
      return !!t && (ix.byTrack[id] || []).some((e) => (!e.rank || e.rank <= t.rank + 1) && !used.has(e.id) && this.eligible(e, used) && this.timeFit(e) && this.candidates(e).length);
    },
    // The player's pick for the visit on the map now (M1): a place id or null (stay in). Returns the attendance outcome.
    // Extra ids (pickPlaces([a, b]), tests and tools) are kept for the day's next visits.
    pickPlaces(ids) {
      const s = this.s;
      if (!s.day || s.day.phase !== 'pick') throw new Error('no places to pick now');
      const list = [].concat(ids == null ? [null] : ids);
      const ctx = this.pickPlace(list.length ? list[0] : null);
      s.day.nextPicks = list.slice(1);
      return this.outcome(ctx);
    },
    pickPlace(id) {
      const s = this.s, d = s.day, view = this.mapView(), sl = view.slots[0];
      if (id) {
        const p = view.places.find((x) => x.id === id);
        if (!p || p.state !== 'open' || !p.open[0]) throw new Error('place ' + id + ' is not ' + (p && p.visited ? 'open again today' : 'open in the ' + sl));
      }
      d.picks.push(id || null); d.phase = 'slots';
      if (!s.visitsTo) s.visitsTo = {};
      const ctx = this.newCtx(null, null);
      if (id) {
        s.visitsTo[id] = (s.visitsTo[id] || 0) + 1;
        const p = this.c.places[id];
        // Each visit counts; a job visit off shift (I1, I2) is an ordinary one, remembered for the slot's draw.
        // An opened slot (midnight, M41) is never a shift or a class (feedback 2026-10-16): it isn't attended.
        const opened = this.recipe()[d.at] && this.recipe()[d.at].source !== 'visit';
        if (p && p.track && !opened && this.attend(p.track, ctx) === 'off') (d.offDuty = d.offDuty || []).push(d.picks.length - 1);
      }
      this.handleZeroed(ctx);
      s.hist.push(Object.assign({ t: 'pick', turn: s.turn, slot: sl, picks: [id || null], at: Date.now() }, Object.keys(ctx.deltas).length ? { deltas: { ...ctx.deltas } } : {}));   // attendance pay etc.
      return ctx;
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
    // Time of day (M43): `slot:` requires a slot, `time:` favours its slots (×3) and makes others rarer (×0.3).
    timeFit(e) {
      const sl = this._slot;
      if (!sl) return 1;
      if (e.slot && e.slot !== sl) return 0;
      if (e.time && e.time.length) return e.time.includes(sl) ? 3 : 0.3;
      return 1;
    },
    variety(e, dayItems) {
      const prev = dayItems.slice(-2).map((x) => this.c.events[x.id]).filter(Boolean);
      const primary = (x) => (x.tags || [])[0];
      return prev.some((p) => (e.tone && p.tone === e.tone) || (primary(e) && primary(p) === primary(e))) ? 0.5 : 1;
    },
    /* ---------------- people: two tracks (design §5.5) ---------------- */
    // How strongly a character comes looking for you: recent warmth, plus standing friendship, spark and bond.
    // A character's `seeks:` scales it: professors and shopkeepers come only once you've been coming to them.
    pull(id) {
      const n = this.s.npcs[id]; if (!n) return 0;
      if (this.distant(id)) return FRIENDS.pen + 0.3 * Math.max(0, n.rel) + (n.warmth || 0) / 2;
      const sk = FRIENDS.seeks[(this.c.npcs[id] || {}).seeks || 'often'] || FRIENDS.seeks.often;
      if (!sk.mult || (n.warmth || 0) < sk.min) return 0;
      const hostile = n.bond === 'rival' || n.bond === 'nemesis';
      return sk.mult * (FRIENDS.base + (n.warmth || 0) + 0.3 * Math.max(0, hostile ? -n.rel : n.rel) + 0.3 * (n.spark || 0) + (FRIENDS.bond[n.bond] || 0));
    },
    warm(id, d) { const n = this.s.npcs[id]; if (n) n.warmth = clamp(Math.round((n.warmth || 0) + d), 0, 100); },
    // Cards with one character: their own events, and generic social events cast with them in the `per:` role.
    boundCandidates(e, id) {
      if (e.actor === id) return this.candidates(e);
      if (e.cast && e.per) {
        if (!this.eligibleFor(e, id)) return [];
        const cast = this.fillCast(e, { [e.per]: id }); if (!cast) return [];
        const prev = this._cast; this._cast = cast; const w = e.weight ? this.value(e.weight, id, 10) : 10; this._cast = prev;
        return w > 0 ? [{ e, actor: id, cast, w }] : [];
      }
      return [];
    },
    // `letters`: only letter cards (M19): someone who reaches you while one of you is away writes instead.
    drawWith(id, used, dayItems, extra, letters) {
      const ix = this.directorIndex(), cands = [];
      const pool = letters ? ix.letter.filter((x) => x.actor === id || (!this.distant(id) && (x.per || x.cast))) : (ix.personal[id] || []).concat(ix.social.filter((x) => x.per));
      for (const e of pool) {
        if (used.has(e.id) || !this.eligible(e, used)) continue;
        if (this._plotLeft != null && this._plotLeft <= 0 && this.isPlot(e)) continue;
        const fit = this.timeFit(e); if (!fit) continue;
        for (const c of this.boundCandidates(e, id)) { const sc = c.w * fit * this.novelty(e) * this.variety(e, dayItems) * ((ix.personal[id] || []).includes(e) ? 2 : 1); if (sc > 0) cands.push({ ...c, w: sc }); }
      }
      const pick = this.pickWeighted(cands);
      if (!pick) return null;
      if (this._plotLeft != null && this.isPlot(pick.e)) this._plotLeft--;
      used.add(pick.e.id);
      return this.specialize(Object.assign({ id: pick.e.id, actor: id, cast: pick.cast || undefined }, extra || {}), used);
    },
    // E1: a generic card drawn for a character who has their own version of it plays that version instead, when its
    // `when` holds (the generic's once / repeat already passed for them).
    specialize(it, used) {
      const e = this.c.events[it.id], who = e && (e.per && it.cast ? it.cast[e.per] : it.actor);
      const sp = who && (this.directorIndex().special[e.id] || {})[who];
      if (!sp) return it;
      const prev = this._cast; this._cast = it.cast || null;
      const ok = this.test(sp.when, who) && (!sp.cast || this.castHolds(sp, it.cast));
      this._cast = prev;
      if (!ok) return it;
      if (used) used.add(sp.id);
      return Object.assign(it, { id: sp.id, actor: who });
    },
    // After a card: warmth for everyone it touched (`contact`: id → sign of the rel/spark amounts applied). Choosing to
    // warm to someone (a rel or spark gain, even at the cap) draws them closer;
    // a card with them where you didn't cools it. Rivals warm on any contact.
    // M17: it counts as seeking them only when the outcome moves the relationship further its own way (a friend's
    // up, a rival's down, as `contact` records); and when every option moves it that way, only the largest move does.
    noteContact(item, contact, keys) {
      const s = this.s, who = new Set();
      if (item.actor && s.npcs[item.actor]) who.add(item.actor);
      for (const id of Object.values(item.cast || {})) if (s.npcs[id]) who.add(id);
      for (const [id, sg] of Object.entries(contact)) if (s.npcs[id] && sg != null) who.add(id);
      const e = this.c.events[item.id], opts = e ? this.optionsOf(e) : [];
      for (const id of who) {
        const n = s.npcs[id]; if (!n.met) continue;
        const hostile = n.bond === 'rival' || n.bond === 'nemesis' || n.rel < 0, dir = hostile ? -1 : 1;
        let engaged = contact[id] != null && (hostile ? (contact.neg || {})[id] : contact[id] > 0);
        if (engaged && keys && opts.length > 1) {
          const reach = opts.map((o) => this.relReach(o.effects, id, item) * dir);
          const mine = Math.max(...opts.map((o, i) => (keys.includes(o.key) ? reach[i] : -Infinity)));
          if (reach.every((r) => r > 0) && mine < Math.max(...reach)) engaged = false;   // the smaller of two warm ways
        }
        if (engaged) this.warm(id, FRIENDS.engage);
        else this.warm(id, -FRIENDS.cool);
      }
    },
    // The furthest an option can move someone's rel or spark (signed, either branch), from its tier words.
    relReach(effects, id, item) {
      let best = 0;
      this.G.walkEffects(effects || [], (st) => {
        if (st.t !== 'rel' && st.t !== 'spark') return;
        const who = st.npc === 'npc' ? item.actor : (item.cast && item.cast[st.npc]) || st.npc;
        if (who !== id) return;
        const amt = st.tier ? st.sign * this.tierAmount(st.t, st.tier) : (st.min + st.max) / 2;
        if (Math.abs(amt) > Math.abs(best)) best = amt;
      });
      return best;
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
        const fit = this.timeFit(e); if (!fit) continue;
        for (const c of this.candidates(e)) {
          const sc = c.w * fit * this.novelty(e) * this.relevance(e, c.actor) * this.variety(e, dayItems);
          if (sc > 0) cands.push({ ...c, w: sc });
        }
      }
      const pick = this.pickWeighted(cands);
      if (!pick) return null;
      if (this._plotLeft != null && this.isPlot(pick.e)) this._plotLeft--;
      used.add(pick.e.id);
      return this.specialize(Object.assign({ id: pick.e.id, actor: pick.actor || null, cast: pick.cast || undefined }, extra || {}), used);
    },
    // `queue any tagged <tag>` (feedback 2026-10-16): one `trigger: queued` event with the tag, drawn by the usual score
    // (`when`, cast, cooldown, novelty, weight) when it falls due; null when none is eligible. The month's plot cap
    // doesn't apply: a queued follow-up is a scene already under way.
    // `queue any in <pool|thread>` (the framework): the same, over the queued cards of that pool or thread.
    drawTagged(tag, used, inPool) {
      const pool = this.events.filter((e) => e.trigger === 'queued' && (inPool ? (e.pools || []).includes(inPool) || e.thread === inPool : (e.tags || []).includes(tag)));
      const plot = this._plotLeft; this._plotLeft = null;
      try {
        const it = this.draw(pool, used || new Set(this.s.deck.map((d) => d.id)), [], {});
        return it ? it.id : null;
      } finally { this._plotLeft = plot; }
    },
    /* ---------------- the day, slot by slot (design §4.2, §5; playtest 2: M1, M3, M43) ----------------
     * startDay() rolls what the day holds (pushed cards and their slots, who comes looking for you, how many social and
     * world cards each slot gets); stepDay() then fills one slot at a time: its pushed cards first (so a plan chosen in
     * the morning shapes the afternoon), then its own draws. A visit slot stops on the map for that slot alone.
     * Everything lives in s.day, so a save resumes mid-day.
     */
    startDay() {
      const s = this.s, ix = this.directorIndex(), rec = this.recipe(), used = new Set(s.deck.map((d) => d.id));
      // Warmth fades a little every month (design §5.5).
      for (const n of Object.values(s.npcs)) if (n.warmth) n.warmth = Math.floor(n.warmth * FRIENDS.fade);
      const slots = rec.map((r) => r.slot), first = slots[0];
      // Pushed cards: due queue items (windows by chance), auto events, arc beats.
      const pushed = [], keep = [];
      for (const q of s.queue) {
        if (q.due > s.turn) { keep.push(q); continue; }
        if (q.until != null && q.until > s.turn && this.rand() >= 1 / (q.until - s.turn + 1)) { keep.push(q); continue; }
        // `queue … chance N` (I4): pushed with probability N when due, else dropped; two copies give at most one card.
        if (q.chance != null && (used.has(q.id) || this.rand() * 100 >= q.chance)) continue;
        if (q.tagged || q.pool) { const id = this.drawTagged(q.tagged, used, q.pool); if (!id) continue; q.id = id; }
        pushed.push({ id: q.id, actor: q.actor || null, src: 'queued', track: q.track, cast: q.cast, prio: this.c.events[q.id] && this.c.events[q.id].class === 'story' ? 'story' : q.track ? 'track' : 'pushed' });
        used.add(q.id);
      }
      s.queue = keep;
      // Then the month's appointments (content/core/appointments.grim), in order: forced cards, arc beats, milestones
      // on their ramp, and any others. The month's plot cards are counted when the first appointment that needs it asks.
      const st = { plot: null };
      st.plotNow = () => (st.plot != null ? st.plot : (st.plot = s.deck.concat(pushed).filter((x) => x.src !== 'queued' && this.isPlot(this.c.events[x.id])).length));
      for (const a of this.appointmentsAt('month')) this.dealMonth(a, pushed, used, st);
      const plot = st.plotNow();
      pushed.sort((a, b) => (b.p || 0) - (a.p || 0));
      // Each pushed card's slot: its own `slot:`, else the first of the day (and the first when its slot isn't today).
      const friendSlot = slots.includes('noon') ? 'noon' : slots.includes('night') ? 'night' : slots[slots.length - 1];
      for (const p of pushed) { const e = this.c.events[p.id]; const sl = p.slot || (e && e.slot) || (p.ramp ? friendSlot : first); p.slot = slots.includes(sl) ? sl : first; delete p.ramp; }
      // Social and world cards through the day (M43): `@game spread:` keeps each source's budget and deals its cards
      // to random slots of the day (the special slots excepted) instead of drawing them all in their own slot.
      const spread = {}, spreading = new Set(this.c.game.spread || []);
      const open = rec.filter((r) => r.source !== 'special').map((r) => r.slot);
      for (const r of rec) {
        if (!spreading.has(r.source)) continue;
        const n = r.min == null ? 1 : r.min + Math.floor(this.rand() * ((r.max || r.min) - r.min + 1));
        for (let k = 0; k < n; k++) { const sl = open[Math.floor(this.rand() * open.length)]; spread[sl] = spread[sl] || {}; spread[sl][r.source] = (spread[sl][r.source] || 0) + 1; }
      }
      // Those who come looking for you (track 2) arrive in this slot; they roll when it comes, on that moment's warmth.

      s.day = { v: 2, phase: 'slots', at: 0, stage: 0, picks: [], nextPicks: [], used: [...used], items: [], withToday: [], pushed, spread, friendSlot,
        plotLeft: this.plotCap() - plot, count: s.deck.length, done: false };
    },
    // The appointments at one occasion, in the content's order (built once).
    appointmentsAt(at) {
      if (!this._appts) { this._appts = {}; for (const a of Object.values(this.c.appointments || {})) (this._appts[a.at] = this._appts[a.at] || []).push(a); }
      return this._appts[at] || [];
    },
    appointment(id) { return (this.c.appointments || {})[id] || null; },
    // An appointment's subjects (`for:`): your tracks of those kinds that are running (a course you're enrolled in, a
    // club, job or thesis you're a member of), and with `met`, everyone you've met; no `for:`, the game itself.
    subjectsOf(a) {
      if (!a.for.length) return [null];
      const s = this.s, out = [];
      for (const [id, t] of Object.entries(s.tracks || {})) {
        const d = this.c.tracks[id];
        if (d && a.for.includes(d.kind) && (d.kind === 'course' ? t.status === 'enrolled' : t.status === 'member')) out.push({ track: id });
      }
      if (a.for.includes('met')) for (const id of Object.keys(s.npcs)) if (s.npcs[id].met) out.push({ npc: id });
      return out;
    },
    // The cards an appointment deals from, for one subject.
    dealsFrom(a, subj) {
      const d = a.deals, s = this.s;
      if (d.card) return d.card.map((id) => this.c.events[id]).filter(Boolean);
      if (d.pool) return this.events.filter((e) => (e.pools || []).includes(d.pool) || e.thread === d.pool);
      if (d.trigger) return this.byTrigger[d.trigger] || [];
      if (d.own && subj && subj.track) {
        const t = s.tracks[subj.track];
        return (this.directorIndex().byTrack[subj.track] || []).filter((e) => (!e.level || e.level <= (t.level || 1)) && (!e.rank || e.rank <= (t.rank || 0) + 1));
      }
      return [];
    },
    // Whether an appointment holds now: its `when`, then its `chance` (rolled only when it has one).
    appointmentHolds(a, actor) {
      if (a.when && !this.test(a.when, actor || null)) return false;
      if (a.chance && this.rand() * 100 >= (a.chance.word ? this.likelihoodP(a.chance.word) : a.chance.p)) return false;
      return true;
    },
    // One month appointment: the built-in ways (`use:`) keep their own rules; any other deals one card per subject
    // (every eligible one with `pick: each`), drawn by the usual score, into its `slot:` or the card's.
    dealMonth(a, pushed, used, st) {
      const s = this.s, ix = this.directorIndex();
      if (a.use === 'auto') {
        for (const e of this.byTrigger.auto) {
          if (!this.eligible(e, used)) continue;
          const c = this.candidates(e);
          if (!c.length) continue;
          const pick = this.pickWeighted(c);
          pushed.push({ id: e.id, actor: pick.actor, cast: pick.cast, src: 'auto', prio: e.class === 'story' || e.arc ? 'story' : 'pushed', p: e.priority != null ? e.priority : 50 });
          used.add(e.id);
        }
        return;
      }
      // Arc beats (design §10.6): at most one plot card a month, except in a beat month. A plot card is an arc
      // beat or any event whose `chain:` is an arc; queued follow-ups (a scene already under way) are not held back.
      if (a.use === 'beats') {
        st.plotNow();
        for (const e of ix.arc) {
          if (e.trigger === 'queued' || used.has(e.id) || !this.eligible(e, used)) continue;
          const ar = s.arcs[e.arc] || { clock: 0 };
          if (e.beat != null && ar.clock < e.beat) continue;
          if (st.plot >= this.plotCap()) break;
          const c = this.candidates(e); if (!c.length) continue;
          const pick = this.pickWeighted(c);
          pushed.push({ id: e.id, actor: pick.actor, cast: pick.cast, src: 'arc', prio: 'story', slot: e.slot });
          used.add(e.id); st.plot++;
        }
        return;
      }
      // Milestones on a ramp (M13): each month a milestone whose value has reached its low mark is pushed with a
      // chance rising from 40% there to certain at its high mark, for the character furthest along.
      if (a.use === 'ramp') {
        for (const e of ix.ramp) {
          if (used.has(e.id) || !this.eligible(e, used)) continue;
          const cands = e.per ? Object.keys(s.npcs).filter((id) => s.npcs[id].met).flatMap((id) => this.boundCandidates(e, id)) : this.candidates(e);
          let best = null;
          for (const c of cands) {
            const prev = this._cast; this._cast = c.cast || null;
            const ok = this.test(e.when, c.actor), v = ok ? this.value(e.ramp.expr, c.actor) : -Infinity;
            this._cast = prev;
            if (v < e.ramp.lo) continue;
            const p = Math.min(1, 0.4 + 0.6 * (v - e.ramp.lo) / (e.ramp.hi - e.ramp.lo));
            if (!best || p > best.p) best = { c, p };
          }
          if (best && this.rand() < best.p) { pushed.push({ id: e.id, actor: best.c.actor, cast: best.c.cast, src: 'ramp', prio: 'pushed', ramp: true }); used.add(e.id); }
        }
        return;
      }
      if (a.use) return;
      const plotWas = this._plotLeft; this._plotLeft = null;   // the appointment keeps its own count (limit: plot)
      try { this.dealEach(a, pushed, used, st); } finally { this._plotLeft = plotWas; }
    },
    dealEach(a, pushed, used, st) {
      for (const subj of this.subjectsOf(a)) {
        if (a.limit === 'plot' && st.plotNow() >= this.plotCap()) break;
        if (!this.appointmentHolds(a, subj && subj.npc)) continue;
        const from = this.dealsFrom(a, subj).filter((e) => !(a.limit === 'plot' && this.isPlot(e) && st.plot >= this.plotCap()));
        const extra = Object.assign({ src: 'appointment' }, subj && subj.track ? { track: subj.track } : {}, a.slot ? { slot: a.slot } : {});
        const deal = (it) => {
          if (!it) return false;
          const e = this.c.events[it.id];
          pushed.push(Object.assign(it, { prio: e.class === 'story' || e.arc ? 'story' : subj && subj.track ? 'track' : 'pushed', p: a.priority != null ? a.priority : e.priority != null ? e.priority : 50 }));
          if (a.limit === 'plot' && this.isPlot(e)) st.plot++;
          return true;
        };
        if (a.pick === 'each') { for (const e of from) deal(subj && subj.npc ? this.drawWithin([e], subj.npc, used, Object.assign({}, extra)) : this.draw([e], used, [], Object.assign({}, extra))); }
        else deal(subj && subj.npc ? this.drawWithin(from, subj.npc, used, extra) : this.draw(from, used, [], extra));
      }
    },
    // One card from `pool` with a given person (an appointment `for: met`).
    drawWithin(pool, id, used, extra) {
      const cands = [];
      for (const e of pool) { if (used.has(e.id) || !this.eligible(e, used)) continue; for (const c of this.boundCandidates(e, id)) cands.push({ ...c, w: c.w * this.novelty(e) }); }
      const pick = this.pickWeighted(cands);
      if (!pick) return null;
      used.add(pick.e.id);
      return this.specialize(Object.assign({ id: pick.e.id, actor: id, cast: pick.cast || undefined }, extra || {}), used);
    },
    // Old saves (one map for the whole day) resume in the new shape.
    upgradeDay() {
      const d = this.s.day;
      if (!d || d.v === 2) return;
      if (d.phase === 'pick') this.startDay();
      else this.s.day = { v: 2, phase: 'slots', at: this.recipe().length, stage: 0, picks: d.picks || [], nextPicks: [], used: [], items: [], withToday: [], pushed: [], spread: {}, count: 0, done: true };
    },
    // A visit slot: the recipe's, or one opened today by `visit <slot>` (M41).
    isVisitAt(at) { const r = this.recipe()[at], d = this.s.day; return !!r && (r.source === 'visit' || (!!d && d.extraVisit === r.slot)); },
    visitIndex(at) { let n = 0; for (let k = 0; k < at; k++) if (this.isVisitAt(k)) n++; return n; },
    curSlot() { const d = this.s.day, r = d && this.recipe()[d.at]; return r ? r.slot : null; },
    // Adds a slot's cards to the deck (with the day's optional cap: pushed cards that don't fit move to tomorrow).
    addToDeck(items, slot) {
      const s = this.s, d = s.day, max = this.c.game.max_cards_per_day || Infinity;
      for (const it of items) {
        if (d.count >= max) {
          if (it.src === 'queued' || it.src === 'auto' || it.src === 'arc') s.queue.push({ id: it.id, actor: it.actor, due: s.turn + 1, track: it.track, cast: it.cast, src: 'queued' });
          continue;
        }
        const e = this.c.events[it.id];
        // Variant hard (design §8.6): more likely as the years go by.
        if (e && e.variant === 'hard' && this.rand() < (this.yearOf() - 1) * 0.15) it.variant = 'hard';
        const { prio, p, done, ...rest } = it;
        s.deck.push(Object.assign(rest, { slot }));
        d.items.push(it.id); d.count++;
      }
    },
    // One step of the day. Returns 'pick' (the map, for the current visit slot), 'cards', 'next' or 'done'.
    stepDay() {
      const s = this.s, d = s.day, rec = this.recipe();
      if (d.done) return 'done';
      if (d.at >= rec.length) { d.done = true; return 'done'; }
      const r = rec[d.at];
      if (d.stage === 0) {
        const mine = d.pushed.filter((p) => p.slot === r.slot && !p.done);
        for (const p of mine) p.done = true;
        d.stage = 1;
        if (mine.length) { this.addToDeck(mine, r.slot); return 'cards'; }
      }
      if (this.isVisitAt(d.at) && d.picks.length <= this.visitIndex(d.at)) {
        const view = this.mapView();
        const any = view.places.some((p) => p.state === 'open' && p.open[0]);
        // A pick passed ahead of time (pickPlaces([a, b]), tests and tools) is used when its slot comes.
        const ahead = d.nextPicks.length ? d.nextPicks.shift() : undefined;
        if (!any || ahead !== undefined) { this.pickPlace(any ? ahead : null); }
        else { d.phase = 'pick'; return 'pick'; }
      }
      // An opened slot (M41) is filled as a visit: only events that name the slot, at the place picked.
      const items = this.fillSlot(r.source !== 'visit' && d.extraVisit === r.slot ? Object.assign({}, r, { source: 'visit', min: 1, max: 1, opened: true }) : r);
      d.at++; d.stage = 0;
      if (d.at >= rec.length) d.done = true;
      if (items.length) { this.addToDeck(items, r.slot); return 'cards'; }
      return d.done ? 'done' : 'next';
    },
    // One slot's own cards.
    fillSlot(r) {
      const s = this.s, d = s.day, ix = this.directorIndex();
      const used = new Set(d.used), withToday = new Set(d.withToday), day = d.items.map((id) => ({ id }));
      this._recentTags = [].concat(...s.hist.filter((h) => h.t === 'card').slice(-6).map((h) => (this.c.events[h.id] || {}).tags || []));
      this._plotLeft = d.plotLeft;
      this._slot = r.slot;
      const items = [];
      const spreading = new Set(this.c.game.spread || []);
      const count = spreading.has(r.source) ? 0 : r.min == null ? 1 : r.min + Math.floor(this.rand() * ((r.max || r.min) - r.min + 1));
      const plan = Object.keys(s.states).find((k) => this.c.states[k] && this.c.states[k].kind === 'plan');
      // Away on a plan tagged `away` (an internship, M16): no campus pools. Social and world cards come from the
      // plan's own pool and, when the plan's `map_id:` is a track kind, your track of that kind's events (the host's),
      // and nobody from campus comes calling.
      const away = this.offCampus(), hostKind = away && this.trackKinds().has(this.planMap()) ? this.planMap() : null;
      const awayPool = away ? [].concat(ix.byPlan[plan.replace(/^plan_/, '')] || [], ...Object.entries(s.tracks || {}).filter(([, t]) => hostKind && t.kind === hostKind && t.status === 'member').map(([id]) => ix.byTrack[id] || [])) : null;
      const poolOf = (source) => (away && source !== 'special' ? awayPool
        : source === 'social' ? ix.social
        : source === 'special' ? ix.slotBound.filter((e) => e.slot === r.slot)
        : source === 'plan' ? (plan && ix.byPlan[plan.replace(/^plan_/, '')]) || ix.ambient
        : ix.ambient.concat(ix.slotBound));
      if (r.source === 'courses') {
        // The course slot's appointments (`class`: one card from each course and thesis you're in).
        for (const a of this.appointmentsAt('courses')) for (const subj of this.subjectsOf(a)) {
          if (!subj || !subj.track) continue;
          const id = subj.track, t = s.tracks[id], td = this.c.tracks[id];
          if (!a.use && !this.appointmentHolds(a, null)) continue;
          const pool = a.use === 'courses' ? (ix.byTrack[id] || []).filter((e) => !e.level || e.level <= (t.level || 1)) : this.dealsFrom(a, subj);
          const it = this.draw(pool, used, day.concat(items), { track: id, prio: 'track' });
          if (it) items.push(it);
          if (a.use !== 'courses') continue;
          // Track 1 in class (design §5.5): the course's lead and whoever is at its place this slot see you there.
          const crowd = new Set(td.place ? this.presentAt(td.place, r.slot) : []); if (td.lead) crowd.add(td.lead);
          for (const nid of crowd) if (s.npcs[nid] && s.npcs[nid].met) this.warm(nid, FRIENDS.presence / 2);
        }
      } else if (r.source === 'visit') {
        const place = d.picks[this.visitIndex(d.at)], off = (d.offDuty || []).includes(this.visitIndex(d.at));
        // Appointments that take the visit (`takes: visit`): festivals (B3), and any other for this place.
        let taken = false;
        for (const a of this.appointmentsAt('visit')) {
          if (!a.takes || !place || taken) continue;
          if (a.use === 'festival') {
            const fest = this.festivals().find((f) => f.place === place && f.visit === this.visitIndex(d.at));
            if (fest) { items.push({ id: fest.event, actor: null, place, prio: 'story', src: 'festival' }); used.add(fest.event); taken = true; }
            continue;
          }
          if (a.use || r.opened || (a.place && a.place !== place)) continue;
          const here = this.dealsFrom(a, null).filter((e) => !e.place || e.place === place);
          if (!here.length || !this.appointmentHolds(a, null)) continue;
          const it = this.draw(here, used, day.concat(items), { place, prio: 'story', src: a.id });
          if (it) { items.push(it); taken = true; }
        }
        if (!taken && place) {
          const p = this.c.places[place];
          this._place = place;
          // E6: a visit that attends your track here (a shift, a meeting): on_shift() is true for its cards, so a shop's
          // counter (`when: not on_shift()`) steps aside for the worker.
          const shiftTrack = !off && !r.opened && p.track && s.tracks[p.track] && s.tracks[p.track].status === 'member' ? p.track : null;
          this._shift = !!shiftTrack;
          const startAt = items.length;
          const n = r.min == null ? 1 + Math.floor(this.rand() * 2) : count;
          // An opened slot (midnight, M41) draws only events that name it; no ambient fallback.
          const names = (e) => !r.opened || e.slot === r.slot || (e.time || []).includes(r.slot);
          // The visit's first cards, appointment by appointment (content/core/appointments.grim); one drawn card follows
          // a fixed one, so a visit always has both.
          let draws = n, fixedAny = false;
          for (const a of this.appointmentsAt('visit')) {
            if (a.takes) continue;
            if (a.use === 'off_shift') {
              // Off shift in term (I1): the hint card comes first, as often as its `repeat:` allows.
              const hint = off && !r.opened && this.phaseOf() !== 'break' && a.deals.card && a.deals.card[0] && this.c.events[a.deals.card[0]];
              if (hint && this.eligible(hint, used) && this.test(hint.when, null)) { items.push({ id: hint.id, actor: null, place, prio: 'track', src: 'hint' }); used.add(hint.id); }
            } else if (a.use === 'always') {
              // A place's fixed cards (`@place always:`, feedback 2026-10-15 and 2026-10-16): first on every visit, in the
              // order listed, each while its `when` holds, whatever its cooldown; a group `a|b` plays one of its eligible
              // events by weight. An event with `slot:` counts only in that slot (midnight included), one without only on
              // daytime visits.
              for (const group of alwaysGroups(p.always)) {
                const ok = group.map((id) => this.c.events[id]).filter((e) => e && !used.has(e.id) && (e.slot ? e.slot === r.slot : !r.opened) && this.test(e.when, null));
                const pick = ok.length > 1 ? this.pickWeighted(ok.map((e) => ({ e, w: e.weight ? this.value(e.weight, null, 10) : 10 })).filter((x) => x.w > 0)) : ok.length ? { e: ok[0] } : null;
                if (!pick) continue;
                // the group's other members sit this visit out, so the drawn card can't be a second one of them
                items.push({ id: pick.e.id, actor: null, place, prio: 'track', src: 'always' }); for (const id of group) used.add(id); fixedAny = true;
              }
            } else if (!a.use && !r.opened && (!a.place || a.place === place)) {
              // A visit deals only cards that belong here: a card with a `place:` comes only at that place, and the
              // appointment's chance is rolled only when the place has one of its cards.
              const here = this.dealsFrom(a, null).filter((e) => !e.place || e.place === place);
              const it = here.length && this.appointmentHolds(a, null) && this.draw(here, used, day.concat(items), { place, prio: 'track', src: a.id });
              if (it) { items.push(it); fixedAny = true; }
            }
          }
          if (fixedAny) draws = 1;
          for (let k = 0; k < draws; k++) {
            const t = !off && p.track && s.tracks[p.track] && s.tracks[p.track].status === 'member' ? p.track : null;
            const it = (t && k === 0 && this.draw((ix.byTrack[t] || []).filter((e) => (!e.rank || e.rank <= s.tracks[t].rank + 1) && names(e)), used, day.concat(items), { place, track: t, prio: 'track' }))
              || this.draw((ix.byPlace[place] || []).filter(names), used, day.concat(items), { place, prio: 'ambient' })
              || (!r.opened && this.draw(ix.ambient.filter((e) => (e.tags || []).some((tg) => (p.draws || []).includes(tg))), used, day.concat(items), { place, prio: 'ambient' }));
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
            // Time spent with them is part of the visit, not extra: it takes the place of one ambient card.
            const drop = cards.length ? items.map((x) => x.prio).lastIndexOf('ambient') : -1;
            if (drop >= 0 && items.length > 1) used.delete(items.splice(drop, 1)[0].id);
            items.push(...cards);
          }
          if (shiftTrack) for (const it of items.slice(startAt)) it.shift = true;
          this._place = null; this._shift = false;
        }
      } else if (r.source === 'social' || r.source === 'world' || r.source === 'special' || r.source === 'plan') {
        const pool = poolOf(r.source);
        for (let k = 0; k < count; k++) { const it = this.draw(pool, used, day.concat(items), { prio: r.source === 'social' ? 'social' : 'ambient' }); if (it) items.push(it); }
        // Track 1 at lunch (design §5.5): anyone whose schedule has them at a place you know in this slot, met or not.
        if (r.source === 'social' && !away) {
          const here = Object.keys(s.npcs).filter((id) => !withToday.has(id) && this.scheduleOf(id).some((x) => x.slots.includes(r.slot) && s.places[x.place] && this.onSchedule(id, x, r.slot)));
          if (here.length && this.rand() < FRIENDS.lunch) {
            const w = here.map((id) => 10 + this.pull(id)); let x = this.rand() * w.reduce((a, b) => a + b, 0), k = 0;
            for (; k < here.length - 1; k++) { x -= w[k]; if (x < 0) break; }
            const it = this.drawWith(here[k], used, day.concat(items), { prio: 'social', src: 'encounter' });
            if (it) {
              // Lunch with someone replaces one of the slot's drawn cards.
              if (items.length > 1) used.delete(items.pop().id);
              items.push(it); withToday.add(here[k]);
            }
          }
        }
      }
      // The day's share of social and world cards for this slot (M43).
      for (const [src, n] of Object.entries(d.spread[r.slot] || {})) {
        const pool = poolOf(src);
        for (let k = 0; k < n; k++) { const it = this.draw(pool, used, day.concat(items), { prio: src === 'social' ? 'social' : 'ambient' }); if (it) items.push(it); }
      }
      // Track 2 (design §5.5): each character you know may come and find you this month, on their own roll,
      // in the friend slot, after its other cards.
      if (r.slot === d.friendSlot && !this.isLastDay()) {
        const brk = this.phaseOf() === 'break';
        const callers = Object.keys(s.npcs).filter((id) => s.npcs[id].met && !withToday.has(id)).sort((a, b) => this.pull(b) - this.pull(a));
        let calls = 0;
        for (const id of callers) {
          if (calls >= (brk ? FRIENDS.capBreak : FRIENDS.cap)) break;
          const p = Math.min(FRIENDS.maxP, this.pull(id) / 100) * (brk ? 0.5 : 1);
          if (p <= 0 || this.rand() >= p) continue;
          const it = this.drawWith(id, used, day.concat(items), { prio: 'friend', src: 'friend' }, away || this.isAway(id));
          if (it) { items.push(it); withToday.add(id); calls++; }
        }
      }
      // Off campus, a letter comes each night (M38): from the letter pool, whoever it's from.
      if (away && r.slot === 'night' && this.appointmentsAt('night').some((a) => a.use === 'letters') && !items.some((x) => this.c.events[x.id] && this.c.events[x.id].trigger === 'letter')) {
        const it = this.draw(ix.letter, used, day.concat(items), { prio: 'pushed', src: 'letter' });
        if (it) items.push(it);
      }
      this._slot = null;
      d.used = [...used]; d.withToday = [...withToday]; d.plotLeft = this._plotLeft;
      return this.orderLast(items);
    },
    // `order: last` cards go after the slot's other cards, keeping both groups' order. Only the order changes: the
    // slot's cards were drawn already, and no random number is used.
    orderLast(items) {
      const last = items.filter((it) => (this.c.events[it.id] || {}).order === 'last');
      return last.length ? items.filter((it) => !last.includes(it)).concat(last) : items;
    },
  };

  function install(Engine, G) {
    for (const [k, d] of Object.entries(Object.getOwnPropertyDescriptors(methods))) Object.defineProperty(Engine.prototype, k, d);
    Engine.prototype.G = G;
    Engine.prototype.FRIENDS = FRIENDS;
  }
  return { install, SLOTS, FRIENDS };
});
