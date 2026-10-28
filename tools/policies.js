/*
 * Simulator play styles. A play style picks one enabled option of the card or menu on screen:
 *
 *   const style = Policies.get('focused:arcana');
 *   const key = style.pick(eng, view);          // view = engine card view, eng = Engine instance
 *
 * random, cautious and social are the v0.2 policies, unchanged (same RNG use, so old sim results
 * reproduce). The others score each option by estimate(): the expected change of every resource,
 * skill and relationship from the engine's exact preview (design §8.3), plus the commitments
 * (electives, clubs, jobs) an option starts. The strategy styles (scholar, nightlife, sleuth, romantic, homebody,
 * combatmaxx, explorer) add a goal on top of a scorer: cards they always answer one way, where they go, their origin. about(name)
 * says what each one plays for.
 */
'use strict';
const G = require('../src/grimoire.js');

// The bots' own random numbers (playtest 2, A1): seeded from the game's seed but kept apart from the game's RNG, so a
// simulated game is one a player could have played: replaying its choices and picks gives the same game.
function rnd(eng) {
  let a = (eng._botRng = ((eng._botRng == null ? (eng.s.seed ^ 0x5bd1e995) : eng._botRng) + 0x6D2B79F5) | 0);
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// Expected deltas of an option: {health: -2.5, arcana: 1, 'rel:lyra': 4, 'gain:club': 1, ...}.
// Probability-weighted midpoints of the engine's preview; side-effect free.
function estimate(eng, opt, actor, eventId) {
  const out = {};
  const add = (k, v, w) => { if (v) out[k] = (out[k] || 0) + v * w; };
  if (eventId) {
    const pv = eng.preview(eventId, opt.key, actor), seen = new Set();
    for (const p of pv.paths) for (const [k, r] of Object.entries(p.deltas)) add(k, (r[0] + r[1]) / 2, p.p);
    G.walkEffects(opt.effects, (st) => {
      if (st.t === 'gain') { const d = eng.c.states[st.state]; if (d && d.kind && !eng.s.states[st.state]) add('gain:' + d.kind, 1, 1); }
      if (st.t === 'learn_spell' && !(eng.s.spells || {})[st.spell]) add('learn', 1, 1);
      if (st.t === 'leave' && leaving(eng, st)) add('gain:' + leavingKind(eng, st), -1, 1);   // giving up a club or job you have
      if (st.t === 'join' && joining(eng, st)) add('gain:' + eng.c.tracks[st.track].kind, 1, 1);   // a new club or job
      // engagement with a plot: new clues, new flags, a queued follow-up (each distinct one once, whichever branch)
      if (st.t === 'find' && !(eng.s.clues || {})[st.clue]) seen.add('find:' + st.clue);
      if (st.t === 'flag') for (const f of st.names || []) if (!eng.s.flags[f]) seen.add('flag:' + f);
      // A penalty card queued at odds (`queue … chance N`, I8) is a risk weighted by its odds, not engagement.
      const q = st.t === 'queue' && eng.c.events[st.event];
      const qc = st.chanceWord ? eng.likelihoodP(st.chanceWord) : st.chance;
      if (q && qc != null && ['incident', 'crisis'].includes(q.class)) add('risk', qc / 100, 1);
      else if (st.t === 'queue') seen.add('queue:' + st.event);
    });
    for (const k of seen) add(k.slice(0, k.indexOf(':')), 1, 1);
    return out;
  }
  const rng = eng.s.rng;
  const walk = (effects, w) => {
    for (const st of effects || []) {
      switch (st.t) {
        case 'delta': add(st.name, amount(eng, st, st.name), w); break;
        case 'assign': {
          const v = eng.value(st.expr, actor);
          add(st.name, st.op === '=' ? v - (eng.s.vals[st.name] || 0) : st.op === '+=' ? v : -v, w);
          break;
        }
        case 'rel': case 'spark': add(st.t + ':' + (st.npc === 'npc' ? actor : st.npc), amount(eng, st, st.t), w); break;
        case 'bond': if (['friend', 'close', 'partner'].includes(st.status)) add('bond:' + (st.npc === 'npc' ? actor : st.npc), 20, w); break;
        case 'gain': { const d = eng.c.states[st.state]; if (d && d.kind && !eng.s.states[st.state]) add('gain:' + d.kind, 1, w); break; }
        case 'leave': if (leaving(eng, st)) add('gain:' + leavingKind(eng, st), -1, w); break;
        case 'join': if (joining(eng, st)) add('gain:' + eng.c.tracks[st.track].kind, 1, w); break;
        case 'if': {
          const br = st.branches.find((b) => eng.test(b.cond, actor));
          walk(br ? br.body : st.else, w);
          break;
        }
        case 'chance': { const p = (st.word ? eng.likelihoodP(st.word, st.steps, actor) : Math.max(0, Math.min(100, eng.value(st.p, actor)))) / 100; walk(st.body, w * p); walk(st.else, w * (1 - p)); break; }
      }
    }
  };
  walk(opt.effects, 1);
  eng.s.rng = rng;
  return out;
}

// Whether a `leave` gives up a club or job the player has (the kind form, `leave job`, or `leave track` in context).
function leaving(eng, st) {
  const t = (eng.s.tracks || {})[eng.trackTarget(st, eng._ctxTrack || (eng.s.cur && eng.s.cur.track))];
  return !!t && t.status === 'member' && (t.kind === 'job' || t.kind === 'club');
}
// The kind of club or job a `leave` gives up.
function leavingKind(eng, st) { return eng.s.tracks[eng.trackTarget(st, eng._ctxTrack || (eng.s.cur && eng.s.cur.track))].kind; }
// Whether a `join` takes up a club, job or society the player isn't in (`gain:<kind>` to the scorers, like a state).
function joining(eng, st) {
  const d = eng.c.tracks[st.track], t = (eng.s.tracks || {})[st.track];
  return !!d && ['job', 'club', 'society'].includes(d.kind) && !(t && t.status === 'member');
}
// The amount of a delta/rel/spark statement: a tier word resolves through @balance sizes.
function amount(eng, st, row, edge) { return st.tier ? st.sign * eng.tierAmount(row, st.tier) : edge === 'max' ? st.max : (st.min + st.max) / 2; }

// Does this option end the run early? Every style but random avoids that when it has a choice.
function endsEarly(eng, view, key) {
  const def = eng.optionsOf(eng.c.events[view.id]).find((q) => q.key === key);
  return !!def && reachesEnd(eng, def.effects, view.actor ? view.actor.id : null);
}
// An early `end` this option can reach now: `if` branches are decided by the current state, other branches
// (challenges, chances) count as reachable.
function reachesEnd(eng, effects, actor) {
  for (const st of effects || []) {
    if (st.t === 'end') { if (eng.c.endings[st.ending] && eng.c.endings[st.ending].kind === 'early') return true; continue; }
    if (st.t === 'if') { const br = st.branches.find((b) => eng.test(b.cond, actor)); if (reachesEnd(eng, br ? br.body : st.else, actor)) return true; continue; }
    let hit = false; G.walkEffects([st], (x) => { if (x !== st && x.t === 'end' && eng.c.endings[x.ending] && eng.c.endings[x.ending].kind === 'early') hit = true; });
    if (hit) return true;
  }
  return false;
}

const RESOURCES = ['health', 'mood', 'gold', 'renown'];
const SKILLS = ['arcana', 'lore', 'alchemy', 'charm', 'vigor', 'guile'];

// A scoring play style. weights: per key (resource / skill) or per prefix ('rel:', 'spark:', 'bond:', 'skill').
// guard: weight multiplier for a resource that is low (<= 25), so most styles try to survive.
// Every scorer also minds what a player keeping up with their work minds (L-1): exam preparation (a point of `study`
// is a point on the exam check), a job's or club's performance (at 0 you're dropped) and the thesis.
const WORK = { 'study:': 1, 'perf:': 0.3, 'progress:': 0.5 };
function scorer(name, weights, guard = 4) {
  weights = Object.assign({}, WORK, weights);
  return {
    name,
    pick(eng, view) {
      const ev = eng.c.events[view.id];
      let best = null, bestScore = -Infinity;
      for (const o of view.options) {
        if (o.disabled) continue;
        const def = eng.optionsOf(ev).find((q) => q.key === o.key); if (!def) continue;
        const est = estimate(eng, def, view.actor ? view.actor.id : null, view.id);
        let sc = rnd(eng) * 0.5;   // small noise breaks ties and varies runs
        if (o.spell && weights.cast) sc += weights.cast;
        // A player who wants to keep playing avoids an option that ends the run early (the scorer would value it at 0).
        if (reachesEnd(eng, def.effects, view.actor ? view.actor.id : null)) sc -= 100;
        for (const [k, v] of Object.entries(est)) {
          let w = weights[k];
          if (w == null) w = weights[k.slice(0, k.indexOf(':') + 1)] ?? (SKILLS.includes(k) ? weights.skill : null) ?? 0;
          if (typeof w === 'function') w = w(k);
          if (k === 'risk') w = weights.risk ?? -3;   // a queued penalty card's odds (I8)
          if (RESOURCES.includes(k) && k !== 'renown' && eng.s.vals[k] <= 25) w *= guard;
          sc += w * v;
        }
        if (sc > bestScore) { bestScore = sc; best = o; }
      }
      return best && best.key;
    },
  };
}

const LEGACY = {
  random: { name: 'random', pick(eng, view) { const o = view.options.filter((x) => !x.disabled); return o[Math.floor(rnd(eng) * o.length)].key; } },
  // prefer options that don't risk low resources
  cautious: {
    name: 'cautious',
    pick(eng, view) {
      const all = view.options.filter((x) => !x.disabled);
      const opts = all.filter((x) => !endsEarly(eng, view, x.key)).length ? all.filter((x) => !endsEarly(eng, view, x.key)) : all;
      const low = eng.c.order.resources.filter((id) => eng.s.vals[id] <= 25);
      // Avoid options that can lower a low resource (the worst case of the engine's preview); gains are welcome.
      const risky = (x) => { try { const pv = eng.preview(view.id, x.key, view.actor ? view.actor.id : null); return low.some((id) => pv.deltas[id] && pv.deltas[id][0] < 0); } catch (e) { return x.affects.some((a) => low.includes(a)); } };
      // Nor do they give up a club or job they have, when there's another way.
      const quits = (x) => { const def = eng.optionsOf(eng.c.events[view.id]).find((q) => q.key === x.key); let q = false; if (def) G.walkEffects(def.effects, (st) => { if (st.t === 'leave' && leaving(eng, st)) q = true; }); return q; };
      const safe = opts.filter((x) => !risky(x) && !quits(x));
      return (safe.length ? safe : opts)[Math.floor(rnd(eng) * (safe.length ? safe.length : opts.length))].key;
    },
  },
  // prefer options that raise relationships / romance / bonds (tests the social content)
  social: {
    name: 'social',
    pick(eng, view) {
      const ev = eng.c.events[view.id]; let best = -Infinity, o;
      for (const x of view.options.filter((y) => !y.disabled)) {
        const def = eng.optionsOf(ev).find((q) => q.key === x.key); if (!def) continue; let sc = rnd(eng) * 3 - (endsEarly(eng, view, x.key) ? 100 : 0);
        G.walkEffects(def.effects, (st) => { if (st.t === 'rel' || st.t === 'spark') { const a = amount(eng, st, st.t, 'max'); if (a > 0) sc += a; } if (st.t === 'bond' && ['friend', 'close', 'partner'].includes(st.status)) sc += 20; if (st.t === 'leave' && leaving(eng, st)) sc -= 5; });
        if (sc > best) { best = sc; o = x; }
      }
      return o.key;
    },
  },
};

// Weights per play style (design §2). Resource units: one point of health ≈ one point of mood.
// Enrolment for a focused player: courses that train the focus skill first, then random ones.
// A multi-pick takes at least one option: with nothing left to pick from (all offered options gated), the first
// open one (usually "Not this year").
const orFirst = (view, keys) => (keys.length ? keys : [(view.options.find((o) => !o.disabled) || view.options[0]).key]);
function pickManyFor(skill) {
  return (eng, view, opts) => {
    const fits = (o) => [].concat((eng.c.tracks[o.key] || {}).skill || []).includes(skill);
    const pool = opts.filter(fits).concat(opts.filter((o) => !fits(o))), keys = [];
    for (const o of pool) if (keys.length < view.pick) keys.push(o.key);
    return orFirst(view, keys);
  };
}

const STYLES = {
  balanced: () => scorer('balanced', { health: 1, mood: 1, gold: 0.4, renown: 0.3, skill: 1.2, 'rel:': 0.3, 'spark:': 0.2, 'bond:': 0.1, 'gain:': 5 }),
  aggressive: () => scorer('aggressive', { health: 0, mood: 0, gold: 0.8, renown: 0.5, skill: 2.5, 'rel:': 0, 'spark:': 0, 'bond:': 0 }, 1),
  moneymaxx: () => scorer('moneymaxx', { health: 0.6, mood: 0.6, gold: 3, renown: 0.2, skill: 0.3, 'rel:': 0.1, 'spark:': 0, 'bond:': 0, 'gain:job': 12 }),
  focused: (skill) => Object.assign(scorer('focused:' + skill, { health: 0.6, mood: 0.6, gold: 0.3, renown: 0.2, skill: (k) => (k === skill ? 6 : 0.4), 'rel:': 0.2, 'spark:': 0.1, 'bond:': 0.1, 'gain:': 4 }), { pickMany: pickManyFor(skill) }),
  // Casts whenever it can (design §8.8: casting at every chance keeps mana low).
  caster: () => scorer('caster', { health: 1, mood: 1, gold: 0.4, renown: 0.3, skill: 1.2, 'rel:': 0.3, 'spark:': 0.2, 'bond:': 0.1, 'gain:': 5, learn: 30, cast: 50 }),
  // Alignment and plot styles (design §8.2, §10.6): lean Lumen or Hollow, and follow the Hollow Star.
  lumen: () => scorer('lumen', { health: 1, mood: 1, gold: 0.4, renown: 0.3, skill: 1.2, 'rel:': 0.3, 'spark:': 0.2, 'bond:': 0.1, 'gain:': 5, alignment: 2, find: 8, queue: 8, flag: 1 }),
  hollow: () => scorer('hollow', { health: 1, mood: 1, gold: 0.4, renown: 0.3, skill: 1.2, 'rel:': 0.3, 'spark:': 0.2, 'bond:': 0.1, 'gain:': 5, alignment: -2, find: 8, queue: 8, flag: 1 }),
  plot: () => scorer('plot', { health: 1, mood: 1, gold: 0.4, renown: 0.3, skill: 1.2, 'rel:': 0.3, 'spark:': 0.2, 'bond:': 0.1, 'gain:': 5, find: 20, queue: 10, flag: 2 }),
  // Phase 4: the player who wants to be talked about (renown 3), the one the spotlight tiers are tuned for.
  celebrity: () => scorer('celebrity', { health: 1, mood: 1, gold: 0.4, renown: 3, skill: 1, 'rel:': 0.3, 'spark:': 0.2, 'bond:': 0.1, 'gain:': 5 }),
  social: (npc) => scorer('social:' + npc, { health: 0.6, mood: 0.6, gold: 0.3, renown: 0.2, skill: 0.3, 'rel:': (k) => (k === 'rel:' + npc ? 5 : 0.2), 'spark:': (k) => (k === 'spark:' + npc ? 4 : 0), 'bond:': (k) => (k === 'bond:' + npc ? 1 : 0), 'gain:': 3 }),
};

// What a track still asks of a member this term, as a player sees it: the map's count, and for a club (which shows none
// since 2026-10-20) the habit of going about twice a term.
function owed(eng, tr) {
  if (tr.due != null) return tr.due;
  if (tr.kind !== 'club' || eng.phaseOf() === 'break') return 0;
  const t = (eng.s.tracks || {})[tr.id];
  return t ? Math.max(0, 2 - (t.visits || 0)) : 0;
}
// Places (design §6.3): by default, keep obligations (club/job/thesis places with visits due), then go
// somewhere new, else anywhere open. `truant` never keeps obligations.
function pickPlaces(eng, view, opts = {}) {
  const picks = [];
  view.slots.forEach((sl, i) => {
    if (view.locked.some((l) => l.slot === sl)) { picks.push(null); return; }
    const open = view.places.filter((p) => p.state === 'open' && p.open[i]);
    if (!open.length) { picks.push(null); return; }
    // A festival on today's map (M1: highlighted, no longer forced): most players go.
    const fest = (view.festivals || []).find((f) => f.slot === sl && open.some((p) => p.id === f.place));
    if (fest && rnd(eng) < 0.8) { picks.push(fest.place); return; }
    const duty = opts.truant ? [] : open.filter((p) => p.track && owed(eng, p.track) > picks.filter((x) => x === p.id).length);
    const fresh = open.filter((p) => p.news && !picks.includes(p.id));
    // social:<npc> seeks out the places where that character is
    // (by the character's schedule: someone courting the tea-shop owner knows where the tea shop is, met or not).
    const sched = opts.seek ? ((eng.c.npcs[opts.seek] || {}).schedule || []) : [];
    const near = opts.seek ? open.filter((p) => sched.some((x) => x.place === p.id && x.slots.includes(sl)) && !picks.includes(p.id)) : [];
    const pool = opts.truant ? open.filter((p) => !p.track) : duty.length ? duty : near.length && rnd(eng) < 0.7 ? near : fresh.length && rnd(eng) < 0.6 ? fresh : open;
    const from = pool.length ? pool : open;
    // Habit: people go back to places they like. Weight by 1 + past visits (s.visitsTo), so favourites form.
    const seen = eng.s.visitsTo || {};
    const w = from.map((p) => 1 + (seen[p.id] || 0));
    let x = rnd(eng) * w.reduce((a, b) => a + b, 0), k = 0;
    for (; k < from.length - 1; k++) { x -= w[k]; if (x < 0) break; }
    picks.push(from[k].id);
  });
  return picks;
}
// Several options of a `pick: N` menu (enrolment): random distinct ones, up to N.
function pickMany(eng, view, opts) {
  const pool = opts.slice(), keys = [];
  while (keys.length < view.pick && pool.length) keys.push(pool.splice(Math.floor(rnd(eng) * pool.length), 1)[0].key);
  return orFirst(view, keys);
}

// ---------------- Strategy styles (2026-10-17): players with a goal, each testing one part of the design ----------------
// Each wraps a scorer with the decisions its goal makes for it: the cards it always answers one way, where it goes on
// the map, its origin. `about` says what the strategy is, in a player's words; `node tools/grim.js styles` prints them.

// Wraps a style: `rules(eng, view)` returns a key to force (when that option is open) or null to let the base decide.
function withRules(base, name, rules, extra) {
  return Object.assign({}, base, { name, pick(eng, view) {
    const k = rules(eng, view);
    if (k && view.options.some((o) => o.key === k && !o.disabled)) return k;
    return base.pick(eng, view);
  } }, extra || {});
}
const open = (view, key) => view.options.some((o) => o.key === key && !o.disabled);
// Map routing for a style with its own idea of where to go: the default picks first (so obligations and festivals are
// kept, design §6.3), then `choose(openPlaces, slot)` replaces each free pick; null keeps the default.
function route(eng, view, choose, opts) {
  const def = pickPlaces(eng, view, opts);
  return view.slots.map((sl, i) => {
    if (def[i] == null) return null;
    const openPl = view.places.filter((p) => p.state === 'open' && p.open[i]), d = openPl.find((p) => p.id === def[i]);
    if ((d && d.track && owed(eng, d.track) > 0) || (view.festivals || []).some((f) => f.slot === sl && f.place === def[i])) return def[i];
    return choose(openPl, sl) || def[i];
  });
}
// A place's waiting story (sleuth): eligible cards there now that are story, plot or mystery, for this slot.
// `timed`: only cards meant for the slot (an evening card can show at midnight, but rarely: director timeFit).
function storyAt(eng, place, slot, timed = false) {
  const ix = eng.directorIndex(), pool = ix.byPlace[place] || [];
  const prev = [eng._place, eng._slot]; eng._place = place; eng._slot = slot;
  let n = 0;
  try {
    for (const e of pool) {
      const story = eng.isPlot(e) || e.class === 'story';
      if (!story && !(e.tags || []).includes('mystery')) continue;
      const fit = eng.timeFit(e);
      if (!fit || (timed && fit < 1) || !eng.eligible(e, new Set())) continue;
      if (eng.candidates(e).length) n += story ? 3 : 1;
    }
  } finally { [eng._place, eng._slot] = prev; }
  return n;
}
// Places open at midnight that the player has found (the night card is answered before the midnight map exists).
const nightPlaces = (eng) => Object.values(eng.c.places || {}).filter((p) => eng.s.places[p.id] && (p.open || []).includes('midnight') && eng.placeOpen(p, 'midnight') && (!p.map || p.map.map === (eng.c.game.map_id || 'campus')));
// The romanceable character the player is closest to: spark first, then friendship.
function favourite(eng) {
  let best = null, bs = -1;
  for (const [id, n] of Object.entries(eng.s.npcs || {})) {
    if (!n.met || !(eng.c.npcs[id] || {}).romance || eng.distant(id)) continue;
    const sc = n.spark * 2 + Math.max(0, n.rel);
    if (sc > bs) { bs = sc; best = id; }
  }
  return best;
}
// Eligible cards with a fight (a combat or duel challenge) at a place now, for this slot (combatmaxx).
function fightsAt(eng, place, slot) {
  const ix = eng.directorIndex(), pool = ix.byPlace[place] || [];
  const prev = [eng._place, eng._slot]; eng._place = place; eng._slot = slot;
  let n = 0;
  try {
    for (const e of pool) {
      let fight = false;
      for (const o of eng.optionsOf(e)) G.walkEffects(o.effects || [], (x) => { if (x.t === 'challenge' && G.MINIGAME_KINDS[x.kind] === 'fight') fight = true; });
      if (fight && eng.eligible(e, new Set()) && eng.timeFit(e) && eng.candidates(e).length) n++;
    }
  } finally { [eng._place, eng._slot] = prev; }
  return n;
}
// Tracks that train a fighter's skills (arcana, vigor).
const FIGHT_SKILLS = ['arcana', 'vigor'];
const trainsFight = (eng, id) => [].concat((eng.c.tracks[id] || {}).skill || []).some((k) => FIGHT_SKILLS.includes(k));
// Expected grade points of sitting an exam carefully (steady) or for top marks (wild).
function gradePoints(eng, track, swing) { const o = eng.examOdds(track, swing); return (4 * o.probs[0] + 3 * o.probs[1] + 2 * o.probs[2]) / 100; }

const STRATEGIES = {
  // The scholarship student: the Crown pays for marks (term_gpa >= 3.0, more at 3.5), so everything serves the exams.
  scholar: {
    about: 'Scholarship origin. Studies above all (exam preparation weighs 4x a skill point), takes the courses it is strongest in, and on exam day picks careful or top marks by whichever has the higher expected grade points. Sleeps every night and never goes out. Crowns weigh 0.3 and a job nothing; a queued penalty\'s odds weigh -4.',
    make() {
      const base = scorer('scholar', { health: 1, mood: 1, gold: 0.3, renown: 0.3, skill: 1.2, lore: 2, 'study:': 4, 'rel:': 0.2, 'spark:': 0.1, 'bond:': 0.1, 'gain:': 2, 'gain:job': 0, risk: -4 });
      return withRules(base, 'scholar', (eng, v) => {
        if (v.id === 'night_out') return 'left';
        if (v.id === eng.c.game.exam) { const t = (eng.s.cur && eng.s.cur.track) || v.track; if (t) return gradePoints(eng, t, 'wild') > gradePoints(eng, t, 'steady') ? 'right' : 'left'; }
        return null;
      }, {
        pickOrigin: () => 'scholar',
        pickMany: (eng, view, opts) => {
          const strength = (o) => { try { return eng.c.tracks[o.key] ? eng.examOdds(o.key).a : -1; } catch (e) { return -1; } };
          return orFirst(view, opts.slice().sort((a, b) => strength(b) - strength(a)).slice(0, view.pick).map((o) => o.key));
        },
      });
    },
  },
  // The midnight regular: every night out, the Newt's upstairs room and table, the ring, its bouts and its bets.
  nightlife: {
    about: 'A balanced player by day who goes out every night it can, alternating the Gilded Newt (always takes a seat upstairs or works the room; the cards there by score) and the boathouse ring (steps in, bets its purse on itself, fights on while health is above 40, else takes the purse and goes). Crowns weigh 0.8 and a queued penalty\'s odds only -1, so suspicion barely deters it.',
    make() {
      const base = scorer('nightlife', { health: 1, mood: 1, gold: 0.8, renown: 0.4, skill: 1, 'rel:': 0.3, 'spark:': 0.2, 'bond:': 0.1, 'gain:': 5, risk: -1 });
      return withRules(base, 'nightlife', (eng, v) => {
        if (v.id === 'night_out') return 'right';
        if (v.id === 'newt_company' || v.id === 'newt_company_regular' || v.id === 'midnight_boathouse_ring') return 'left';
        if (v.id === 'ring_on_yourself') return open(v, 'left') ? 'left' : 'right';
        if (/^ring_bout_\d$/.test(v.id)) return eng.s.vals.health > 40 ? 'left' : 'right';
        return null;
      }, {
        pickPlaces: (eng, view) => route(eng, view, (openPl, sl) => {
          if (sl !== 'midnight') return null;
          const want = eng.s.turn % 2 ? ['boathouse', 'gilded_newt'] : ['gilded_newt', 'boathouse'];
          return want.find((id) => openPl.some((p) => p.id === id)) || null;
        }),
      });
    },
  },
  // The detective: goes where the story is. Leads and plot cards wait at places; this player goes to them.
  sleuth: {
    about: 'A plot player who routes itself: each visit goes to the open place with the most eligible story, plot or mystery cards waiting (story cards count triple), and it goes out at night only when a story card (not just an eerie one) meant for the night waits at a midnight place it has found. Values clues, leads and follow-ups (find 20, queue 10, flag 2) on top of a balanced player.',
    make() {
      const base = scorer('sleuth', { health: 1, mood: 1, gold: 0.4, renown: 0.3, skill: 1.2, 'rel:': 0.3, 'spark:': 0.2, 'bond:': 0.1, 'gain:': 5, find: 20, queue: 10, flag: 2 });
      return withRules(base, 'sleuth', (eng, v) => {
        if (v.id === 'night_out') return nightPlaces(eng).some((p) => storyAt(eng, p.id, 'midnight', true) >= 3) ? 'right' : 'left';
        return null;
      }, {
        pickPlaces: (eng, view) => route(eng, view, (openPl, sl) => {
          let best = null, bs = 0;
          for (const p of openPl) { const n = storyAt(eng, p.id, sl); if (n > 0 && n + rnd(eng) * 0.5 > bs) { bs = n + rnd(eng) * 0.5; best = p.id; } }
          return best;
        }),
      });
    },
  },
  // The romantic: lets every spark grow and goes where the one it likes best is.
  romantic: {
    about: 'Pursues romance: spark weighs 3 a point and friendship 0.5, it always lets a spark grow ("Let it grow" on spark_cooldown), and it visits the places where its favourite (the met romanceable character with the most spark, then friendship) is scheduled. Otherwise a balanced player; sleeps every night.',
    make() {
      const base = scorer('romantic', { health: 1, mood: 1, gold: 0.3, renown: 0.2, skill: 0.8, 'rel:': 0.5, 'spark:': 3, 'bond:': 1, 'gain:': 3 });
      return withRules(base, 'romantic', (eng, v) => (v.id === (eng.c.game.spark_cooldown || 'spark_cooldown') ? 'left' : null), {
        pickPlaces: (eng, view) => pickPlaces(eng, view, { seek: favourite(eng) }),
      });
    },
  },
  // The homebody: the careful player bedtime is built for. Every night in bed, every break at home.
  homebody: {
    about: 'A careful player: sleeps every night, spends every break at home (the +20/+10 sleep), weighs the odds of a queued penalty card at -8 (balanced: -3), and values health and mood at 1.5. Keeps its obligations on the map.',
    make() {
      const base = scorer('homebody', { health: 1.5, mood: 1.5, gold: 0.5, renown: 0.2, skill: 1, 'rel:': 0.3, 'spark:': 0.1, 'bond:': 0.1, 'gain:': 3, risk: -8 });
      return withRules(base, 'homebody', (eng, v) => {
        if (v.id === 'night_out') return 'left';
        if (v.id === 'break_plan') return 'home';
        return null;
      });
    },
  },
  // The fighter: trains for the combat minigame and takes every fight it can win (playtests of the fight, 2026-10-19).
  combatmaxx: {
    about: 'Combat maxxing: arcana and vigor weigh 4 a point (other skills 0.6), learning a spell 40 and casting one 30; it takes the fight on any card whose fight is not too unwinnable (the card\'s odds at least 35%, 60% when Health is 35 or lower), joins any club, job or internship that trains arcana or vigor, enrols in those courses first, and goes where fights wait (by day, and out at night when Health is above 50 and a fight waits at a midnight place). Its own side fights at Hard.',
    make() {
      const base = scorer('combatmaxx', { health: 1, mood: 0.8, gold: 0.3, renown: 0.4, skill: 0.6, arcana: 4, vigor: 4, 'rel:': 0.2, 'spark:': 0.1, 'bond:': 0.1, 'gain:': 3, learn: 40, cast: 30 });
      const winnable = (eng, o) => o.check && o.check.fight && o.check.p >= (eng.s.vals.health <= 35 ? 60 : 35);
      return withRules(base, 'combatmaxx', (eng, v) => {
        if (v.id === 'night_out') return eng.s.vals.health > 50 && nightPlaces(eng).some((p) => fightsAt(eng, p.id, 'midnight')) ? 'right' : 'left';
        // A fight it can win, the best odds first (never one that ends the run).
        const fights = v.options.filter((o) => !o.disabled && winnable(eng, o) && !endsEarly(eng, v, o.key)).sort((a, b) => b.check.p - a.check.p);
        if (fights.length) return fights[0].key;
        // A club, job or internship that trains a fighter.
        const ev = eng.c.events[v.id];
        for (const o of v.options) {
          if (o.disabled) continue;
          const def = eng.optionsOf(ev).find((q) => q.key === o.key); let join = false;
          if (def) G.walkEffects(def.effects, (st) => { if (st.t === 'join' && joining(eng, st) && trainsFight(eng, st.track)) join = true; });
          if (join) return o.key;
        }
        return null;
      }, {
        pickMany: (eng, view, opts) => orFirst(view, opts.filter((o) => trainsFight(eng, o.key)).concat(opts.filter((o) => !trainsFight(eng, o.key))).slice(0, view.pick).map((o) => o.key)),
        pickPlaces: (eng, view) => route(eng, view, (openPl, sl) => {
          let best = null, bs = 0;
          for (const p of openPl) { const n = fightsAt(eng, p.id, sl); if (n > 0 && n + rnd(eng) * 0.5 > bs) { bs = n + rnd(eng) * 0.5; best = p.id; } }
          return best;
        }),
      });
    },
  },
  // The spender (world expansion 1, K3): buys the kit. Gold is for gear and tonics, so the shops' sinks are measured.
  spender: {
    about: 'A balanced player with a purse: takes any option that gives it an item it lacks or a tonic it doesn\'t hold (when it can pay), goes to the village shops whenever it has 40 crowns or more, and wears its best piece in each slot (worn Health 1, Mana 1.5, a cheaper spell 1, a hit 2 a point). Crowns weigh 0.2.',
    make() {
      const base = scorer('spender', { health: 1, mood: 1, gold: 0.2, renown: 0.3, skill: 1.2, 'rel:': 0.3, 'spark:': 0.1, 'bond:': 0.1, 'gain:': 3 });
      const SHOPS = ['village', 'mabels', 'grimsbys_books', 'pell_apothecary', 'gilded_newt'];
      const wornValue = (d) => { const w = (d && d.worn) || {}; return (w.hp || 0) + 1.5 * (w.mana || 0) + Object.values(w.cost || {}).reduce((a, n) => a - n, 0) + 2 * Object.values(w.onCast || {}).reduce((a, n) => a + n, 0) + 2 * (w.onDefend || 0) + (w.taken || []).reduce((a, t) => a + t.n, 0); };
      const dressBest = (eng) => {
        if (!eng.equip || !eng.s.items) return;
        for (const slot of ['wand', 'robe', 'trinket']) {
          const own = Object.keys(eng.s.items).filter((id) => eng.c.items[id] && eng.c.items[id].slot === slot);
          const best = own.sort((a, b) => wornValue(eng.c.items[b]) - wornValue(eng.c.items[a]))[0];
          if (best && eng.s.worn[slot] !== best && wornValue(eng.c.items[best]) > wornValue(eng.c.items[eng.s.worn[slot]])) { try { eng.equip(slot, best); } catch (e) { /* locked mid-minigame */ } }
        }
      };
      const buys = (eng, v, o) => {
        const def = eng.optionsOf(eng.c.events[v.id]).find((q) => q.key === o.key); let n = 0;
        if (def) G.walkEffects(def.effects, (st) => {
          if (st.t === 'give' && eng.c.items[st.item] && !eng.hasItem(st.item)) n += 2 + wornValue(eng.c.items[st.item]);
          if (st.t === 'gain' && eng.c.states[st.state] && (eng.c.states[st.state].boost || []).length && !eng.s.states[st.state]) n += 1;
          if (st.t === 'take' && eng.hasItem(st.item)) n -= 3;
        });
        return n;
      };
      const ruled = withRules(base, 'spender', (eng, v) => {
        dressBest(eng);
        const want = v.options.filter((o) => !o.disabled && !endsEarly(eng, v, o.key)).map((o) => [o.key, buys(eng, v, o)]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
        return want.length ? want[0][0] : null;
      });
      return Object.assign(ruled, {
        pickPlaces: (eng, view) => {
          dressBest(eng);
          const used = new Set();   // one visit per place a day
          return route(eng, view, (openPl) => {
            if ((eng.s.vals.gold || 0) < 40) return null;
            const shops = openPl.filter((p) => SHOPS.includes(p.id) && !used.has(p.id));
            const pick = shops.length ? shops[Math.floor(rnd(eng) * shops.length)].id : null;
            if (pick) used.add(pick);
            return pick;
          });
        },
      });
    },
  },
  // The explorer: sees as much of the game as it can.
  explorer: {
    about: 'Goes to the least-visited open place (weight 1 / (1 + visits), places with news first), goes out on half its nights to the least-visited midnight place, and on a card it has answered before prefers a different option from last time. Values anything that leads somewhere (find, queue, flag 3 each). For coverage: it reaches content the goal-driven styles skip.',
    make() {
      const base = scorer('explorer', { health: 1, mood: 1, gold: 0.4, renown: 0.3, skill: 1, 'rel:': 0.3, 'spark:': 0.2, 'bond:': 0.1, 'gain:': 4, find: 3, queue: 3, flag: 3 });
      const leastVisited = (eng, openPl) => {
        if (!openPl.length) return null;
        const pool = openPl.some((p) => p.news) ? openPl.filter((p) => p.news) : openPl;
        const seen = eng.s.visitsTo || {}, w = pool.map((p) => 1 / (1 + (seen[p.id] || 0)));
        let x = rnd(eng) * w.reduce((a, b) => a + b, 0), k = 0;
        for (; k < pool.length - 1; k++) { x -= w[k]; if (x < 0) break; }
        return pool[k].id;
      };
      return Object.assign({}, base, {
        name: 'explorer',
        pick(eng, view) {
          if (view.id === 'night_out' && open(view, 'right') && open(view, 'left')) return rnd(eng) < 0.5 ? 'right' : 'left';
          const last = (eng.s.choices || {})[view.id], fresh = view.options.filter((o) => !o.disabled && o.key !== last);
          if (last && fresh.length) return base.pick(eng, Object.assign({}, view, { options: fresh }));
          return base.pick(eng, view);
        },
        pickPlaces: (eng, view) => route(eng, view, (openPl) => leastVisited(eng, openPl)),
      });
    },
  },
};
// What each style plays for (`grim styles`): the strategy styles above, and a line for the older ones.
const ABOUT = Object.assign({
  random: 'Picks any open option at random, and goes anywhere. The careless-player floor.',
  cautious: 'Random among options that can\'t lower a resource at 25 or below and don\'t give up a club or job.',
  social: 'Picks the option that raises friendship, spark or a bond most.',
  balanced: 'Scores every option by its previewed expected change: health and mood 1, skills 1.2, crowns 0.4, renown 0.3, friendship 0.3, commitments 5; minds exam preparation and performance. Keeps obligations on the map.',
  aggressive: 'Skills 2.5 and crowns 0.8; ignores health, mood and people. The grinder the breakdown alarms are about.',
  moneymaxx: 'Crowns 3 and a job 12; the money-maxxer the sinks are about.',
  'focused:<skill>': 'One skill at 6, the rest 0.4; enrols in courses that train it.',
  caster: 'A balanced player who learns and casts every spell it can.',
  truant: 'A balanced player who never keeps its obligations on the map.',
  lumen: 'A plot player who leans Lumen (alignment 2).',
  hollow: 'A plot player who leans Hollow (alignment -2).',
  plot: 'A balanced player who values clues (20), follow-ups (10) and flags (2).',
  'social:<npc>': 'Courts one character: their friendship 5, spark 4, and goes where they are.',
  nightowl: 'A balanced player who always goes out at night (default places).',
  nojob: 'A balanced player who never takes a job.',
  celebrity: 'A balanced player who wants to be talked about: renown weighs 3 a point. The one the renown tiers are tuned for.',
}, Object.fromEntries(Object.entries(STRATEGIES).map(([k, v]) => [k, v.about])));
function about(name) { const base = String(name).split(':')[0]; return ABOUT[name] || ABOUT[base] || ABOUT[base + ':<skill>'] || ABOUT[base + ':<npc>'] || ''; }

function get(name) {
  name = name || 'random';
  if (LEGACY[name]) return LEGACY[name];
  const [base, arg] = name.split(':');
  if (base === 'focused' && !SKILLS.includes(arg)) throw new Error('focused:<skill> needs one of ' + SKILLS.join(' '));
  if ((base === 'social') && !arg) return LEGACY.social;
  // Scenario styles (A4): a balanced player who always goes out at night, or one who never takes a job.
  if (base === 'nightowl') { const b = STYLES.balanced(); return Object.assign({}, b, { name: 'nightowl', pick: (eng, v) => (v.id === 'night_out' && v.options.some((o) => o.key === 'right' && !o.disabled) ? 'right' : b.pick(eng, v)) }); }
  if (base === 'nojob') {
    const b = STYLES.balanced();
    const joinsJob = (eng, v, key) => { const def = eng.optionsOf(eng.c.events[v.id]).find((o) => o.key === key); let j = false; if (def) G.walkEffects(def.effects, (st) => { if (st.t === 'join' && eng.c.tracks[st.track] && eng.c.tracks[st.track].kind === 'job') j = true; }); return j; };
    return Object.assign({}, b, { name: 'nojob', pick: (eng, v) => { const ok = v.options.filter((o) => !o.disabled && !joinsJob(eng, v, o.key)); return ok.length ? b.pick(eng, Object.assign({}, v, { options: ok })) : b.pick(eng, v); } });
  }
  if (base === 'truant') return Object.assign(STYLES.balanced(), { name: 'truant', pickPlaces: (eng, view) => pickPlaces(eng, view, { truant: true }) });
  if (base === 'social') return Object.assign(STYLES.social(arg), { pickPlaces: (eng, view) => pickPlaces(eng, view, { seek: arg }) });
  if (STRATEGIES[base]) return STRATEGIES[base].make();
  if (STYLES[base]) return STYLES[base](arg);
  throw new Error('unknown play style "' + name + '" (' + list().join(', ') + ')');
}
function list() { return ['random', 'cautious', 'social', 'balanced', 'focused:<skill>', 'aggressive', 'moneymaxx', 'caster', 'truant', 'lumen', 'hollow', 'plot', 'social:<npc>', 'nightowl', 'nojob', 'celebrity'].concat(Object.keys(STRATEGIES)); }

// The origin screen (playtest 2, M32): a sim picks its origin up front, spread evenly over seeds (no RNG used),
// so origin effects apply before month 1's charges, as in play.
function pickOrigin(eng, seed) {
  const o = eng.originChoices();
  return o.length ? o[Math.abs(seed | 0) % o.length].key : null;
}
function newGame(eng, style, opts) {
  const origin = (style.pickOrigin || pickOrigin)(eng, opts.seed);
  return eng.newGame(Object.assign({}, opts, origin ? { origin } : {}));
}

// The choice a style makes on a card: a multi-pick menu (`pick: N`) takes one to N of its options.
function choiceFor(eng, style, v) {
  if (v.pick > 1) {
    const opts = v.options.filter((o) => !o.disabled && o.key !== 'none');
    const keys = (style.pickMany || pickMany)(eng, v, opts);
    return keys.length ? keys : [v.options.find((o) => !o.disabled).key];
  }
  return style.pick(eng, v);
}

// One simulated game, driven exactly as the UI drives the engine (playtest 2, A1): newGame with an origin, then
// advance; a pick for each map, a choice for each card. Every tool and test plays through here.
//   opts: seed, name, runId, maxSteps (8000), setup(eng) after newGame, stop(eng, r) to end early,
//         before(eng, view, key) → state handed to after(eng, view, key, out, state), strict (throw on a soft-lock or
//         a game that never ends), record (keep every pick and choice, for replay()).
// Returns { eng, r, record }.
function play(eng, style, opts = {}) {
  // Every fight is played (the combat minigame's AI on both sides, tools/combat-sim.js), unless the caller set its own.
  if (!eng.fights && opts.fights !== false) eng.fights = require('./combat-sim.js').resolver({ style: style.name || 'balanced', content: eng.c });
  let r = newGame(eng, style, opts);
  const record = opts.record ? { seed: eng.s.seed, name: eng.s.name, origin: eng.s.origin || null, steps: [] } : null;
  // A record keeps each choice's fight results, as the UI hands them to choose(): a replay plays no fights.
  let played = null;
  if (record && eng.fights) { const resolve = eng.fights; eng.fights = (req) => { const res = resolve(req); if (played) played.push(res); return res; }; }
  if (opts.setup) opts.setup(eng);
  let steps = 0, stopped = false;
  for (const max = opts.maxSteps || 8000; steps++ < max && r.kind !== 'ending';) {
    if (opts.stop && opts.stop(eng, r)) { stopped = true; break; }
    if (r.kind === 'month') { r = eng.advance(); continue; }
    if (r.kind === 'map') {
      const picks = (style.pickPlaces || pickPlaces)(eng, r.view);
      if (record) record.steps.push(['pick', picks]);
      eng.pickPlaces(picks); r = eng.advance(); continue;
    }
    const v = r.view;
    if (!v.options.some((o) => !o.disabled)) { if (opts.strict) throw new Error('soft-lock: no available options on ' + v.id); break; }
    const key = choiceFor(eng, style, v);
    const st = opts.before ? opts.before(eng, v, key) : null;
    played = [];
    const out = eng.choose(key);
    if (record) record.steps.push(played.length ? ['choose', key, played] : ['choose', key]);
    played = null;
    if (opts.after) opts.after(eng, v, key, out, st);
    r = eng.advance();
  }
  if (opts.strict && !stopped && r.kind !== 'ending') throw new Error('did not finish after ' + (opts.maxSteps || 8000) + ' steps');
  return { eng, r, record };
}

// Replay a recorded game through the engine the way the UI drives it (A1). Throws where the replay leaves the record.
function replay(eng, record) {
  let r = eng.newGame({ seed: record.seed, name: record.name, ...(record.origin ? { origin: record.origin } : {}) });
  for (let i = 0; r.kind !== 'ending';) {
    if (r.kind === 'month') { r = eng.advance(); continue; }
    const step = record.steps[i++];
    if (!step) break;
    const want = r.kind === 'map' ? 'pick' : 'choose';
    if (step[0] !== want) throw new Error('replay left the record at step ' + i + ': expected ' + step[0] + ', got ' + r.kind + (r.view && r.view.id ? ' ' + r.view.id : ''));
    if (want === 'pick') eng.pickPlaces(step[1]); else eng.choose(step[1], step[2] ? { fights: step[2] } : {});
    r = eng.advance();
  }
  return { eng, r };
}

module.exports = { get, list, about, STRATEGIES: Object.keys(STRATEGIES), estimate, pickPlaces, pickMany, pickOrigin, newGame, choiceFor, play, replay };
