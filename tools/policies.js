/*
 * Simulator play styles. A play style picks one enabled option of the card or menu on screen:
 *
 *   const style = Policies.get('focused:arcana');
 *   const key = style.pick(eng, view);          // view = engine card view, eng = Engine instance
 *
 * random, cautious and social are the v0.2 policies, unchanged (same RNG use, so old sim results
 * reproduce). The others score each option by estimate(): the expected change of every resource,
 * skill and relationship from the engine's exact preview (design §8.3), plus the commitments
 * (electives, clubs, jobs) an option starts.
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
        case 'check': { const p = eng.checkChance(st.skill, eng.value(st.dc, actor)) / 100; walk(st.body, w * p); walk(st.else, w * (1 - p)); break; }
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
  social: (npc) => scorer('social:' + npc, { health: 0.6, mood: 0.6, gold: 0.3, renown: 0.2, skill: 0.3, 'rel:': (k) => (k === 'rel:' + npc ? 5 : 0.2), 'spark:': (k) => (k === 'spark:' + npc ? 4 : 0), 'bond:': (k) => (k === 'bond:' + npc ? 1 : 0), 'gain:': 3 }),
};

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
    const duty = opts.truant ? [] : open.filter((p) => p.track && p.track.due > picks.filter((x) => x === p.id).length);
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
  if (STYLES[base]) return STYLES[base](arg);
  throw new Error('unknown play style "' + name + '" (' + list().join(', ') + ')');
}
function list() { return ['random', 'cautious', 'social', 'balanced', 'focused:<skill>', 'aggressive', 'moneymaxx', 'caster', 'truant', 'lumen', 'hollow', 'plot', 'social:<npc>', 'nightowl', 'nojob']; }

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
  let r = newGame(eng, style, opts);
  const record = opts.record ? { seed: eng.s.seed, name: eng.s.name, origin: eng.s.origin || null, steps: [] } : null;
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
    if (record) record.steps.push(['choose', key]);
    const out = eng.choose(key);
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
    if (want === 'pick') eng.pickPlaces(step[1]); else eng.choose(step[1]);
    r = eng.advance();
  }
  return { eng, r };
}

module.exports = { get, list, estimate, pickPlaces, pickMany, pickOrigin, newGame, choiceFor, play, replay };
