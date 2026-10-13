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
      // engagement with a plot: new clues, new flags, a queued follow-up (each distinct one once, whichever branch)
      if (st.t === 'find' && !(eng.s.clues || {})[st.clue]) seen.add('find:' + st.clue);
      if (st.t === 'flag') for (const f of st.names || []) if (!eng.s.flags[f]) seen.add('flag:' + f);
      if (st.t === 'queue') seen.add('queue:' + st.event);
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
        case 'if': {
          const br = st.branches.find((b) => eng.test(b.cond, actor));
          walk(br ? br.body : st.else, w);
          break;
        }
        case 'chance': { const p = Math.max(0, Math.min(100, eng.value(st.p, actor))) / 100; walk(st.body, w * p); walk(st.else, w * (1 - p)); break; }
        case 'check': { const p = eng.checkChance(st.skill, eng.value(st.dc, actor)) / 100; walk(st.body, w * p); walk(st.else, w * (1 - p)); break; }
      }
    }
  };
  walk(opt.effects, 1);
  eng.s.rng = rng;
  return out;
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
function scorer(name, weights, guard = 4) {
  return {
    name,
    pick(eng, view) {
      const ev = eng.c.events[view.id];
      let best = null, bestScore = -Infinity;
      for (const o of view.options) {
        if (o.disabled) continue;
        const def = eng.optionsOf(ev).find((q) => q.key === o.key); if (!def) continue;
        const est = estimate(eng, def, view.actor ? view.actor.id : null, view.id);
        let sc = eng.rand() * 0.5;   // small noise breaks ties and varies runs
        if (o.spell && weights.cast) sc += weights.cast;
        // A player who wants to keep playing avoids an option that ends the run early (the scorer would value it at 0).
        if (reachesEnd(eng, def.effects, view.actor ? view.actor.id : null)) sc -= 100;
        for (const [k, v] of Object.entries(est)) {
          let w = weights[k];
          if (w == null) w = weights[k.slice(0, k.indexOf(':') + 1)] ?? (SKILLS.includes(k) ? weights.skill : null) ?? 0;
          if (typeof w === 'function') w = w(k);
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
  random: { name: 'random', pick(eng, view) { const o = view.options.filter((x) => !x.disabled); return o[Math.floor(eng.rand() * o.length)].key; } },
  // prefer options that don't risk low resources
  cautious: {
    name: 'cautious',
    pick(eng, view) {
      const all = view.options.filter((x) => !x.disabled);
      const opts = all.filter((x) => !endsEarly(eng, view, x.key)).length ? all.filter((x) => !endsEarly(eng, view, x.key)) : all;
      const low = eng.c.order.resources.filter((id) => eng.s.vals[id] <= 25);
      // Avoid options that can lower a low resource (the worst case of the engine's preview); gains are welcome.
      const risky = (x) => { try { const pv = eng.preview(view.id, x.key, view.actor ? view.actor.id : null); return low.some((id) => pv.deltas[id] && pv.deltas[id][0] < 0); } catch (e) { return x.affects.some((a) => low.includes(a)); } };
      const safe = opts.filter((x) => !risky(x));
      return (safe.length ? safe : opts)[Math.floor(eng.rand() * (safe.length ? safe.length : opts.length))].key;
    },
  },
  // prefer options that raise relationships / romance / bonds (tests the social content)
  social: {
    name: 'social',
    pick(eng, view) {
      const ev = eng.c.events[view.id]; let best = -Infinity, o;
      for (const x of view.options.filter((y) => !y.disabled)) {
        const def = eng.optionsOf(ev).find((q) => q.key === x.key); if (!def) continue; let sc = eng.rand() * 3 - (endsEarly(eng, view, x.key) ? 100 : 0);
        G.walkEffects(def.effects, (st) => { if (st.t === 'rel' || st.t === 'spark') { const a = amount(eng, st, st.t, 'max'); if (a > 0) sc += a; } if (st.t === 'bond' && ['friend', 'close', 'partner'].includes(st.status)) sc += 20; });
        if (sc > best) { best = sc; o = x; }
      }
      return o.key;
    },
  },
};

// Weights per play style (design §2). Resource units: one point of health ≈ one point of mood.
// Enrolment for a focused player: courses that train the focus skill first, then random ones.
function pickManyFor(skill) {
  return (eng, view, opts) => {
    const fits = (o) => [].concat((eng.c.tracks[o.key] || {}).skill || []).includes(skill);
    const pool = opts.filter(fits).concat(opts.filter((o) => !fits(o))), keys = [];
    for (const o of pool) if (keys.length < view.pick) keys.push(o.key);
    return keys;
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
    const duty = opts.truant ? [] : open.filter((p) => p.track && p.track.due > picks.filter((x) => x === p.id).length);
    const fresh = open.filter((p) => p.news && !picks.includes(p.id));
    // social:<npc> seeks out the places where that character is (shown on the map once met).
    const near = opts.seek ? open.filter((p) => (p.present || []).includes(opts.seek) && !picks.includes(p.id)) : [];
    const pool = opts.truant ? open.filter((p) => !p.track) : duty.length ? duty : near.length && eng.rand() < 0.7 ? near : fresh.length && eng.rand() < 0.6 ? fresh : open;
    const from = pool.length ? pool : open;
    // Habit: people go back to places they like. Weight by 1 + past visits (s.visitsTo), so favourites form.
    const seen = eng.s.visitsTo || {};
    const w = from.map((p) => 1 + (seen[p.id] || 0));
    let x = eng.rand() * w.reduce((a, b) => a + b, 0), k = 0;
    for (; k < from.length - 1; k++) { x -= w[k]; if (x < 0) break; }
    picks.push(from[k].id);
  });
  return picks;
}
// Several options of a `pick: N` menu (enrolment): random distinct ones, up to N.
function pickMany(eng, view, opts) {
  const pool = opts.slice(), keys = [];
  while (keys.length < view.pick && pool.length) keys.push(pool.splice(Math.floor(eng.rand() * pool.length), 1)[0].key);
  return keys;
}

function get(name) {
  name = name || 'random';
  if (LEGACY[name]) return LEGACY[name];
  const [base, arg] = name.split(':');
  if (base === 'focused' && !SKILLS.includes(arg)) throw new Error('focused:<skill> needs one of ' + SKILLS.join(' '));
  if ((base === 'social') && !arg) return LEGACY.social;
  if (base === 'truant') return Object.assign(STYLES.balanced(), { name: 'truant', pickPlaces: (eng, view) => pickPlaces(eng, view, { truant: true }) });
  if (base === 'social') return Object.assign(STYLES.social(arg), { pickPlaces: (eng, view) => pickPlaces(eng, view, { seek: arg }) });
  if (STYLES[base]) return STYLES[base](arg);
  throw new Error('unknown play style "' + name + '" (' + list().join(', ') + ')');
}
function list() { return ['random', 'cautious', 'social', 'balanced', 'focused:<skill>', 'aggressive', 'moneymaxx', 'caster', 'truant', 'lumen', 'hollow', 'plot', 'social:<npc>']; }

module.exports = { get, list, estimate, pickPlaces, pickMany };
