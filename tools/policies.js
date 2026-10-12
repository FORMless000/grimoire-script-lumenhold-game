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
    const pv = eng.preview(eventId, opt.key, actor);
    for (const p of pv.paths) for (const [k, r] of Object.entries(p.deltas)) add(k, (r[0] + r[1]) / 2, p.p);
    G.walkEffects(opt.effects, (st) => {
      if (st.t === 'gain') { const d = eng.c.states[st.state]; if (d && d.kind && !eng.s.states[st.state]) add('gain:' + d.kind, 1, 1); }
      if (st.t === 'learn_spell' && !(eng.s.spells || {})[st.spell]) add('learn', 1, 1);
    });
    return out;
  }
  const rng = eng.s.rng;
  const walk = (effects, w) => {
    for (const st of effects || []) {
      switch (st.t) {
        case 'delta': add(st.name, (st.min + st.max) / 2, w); break;
        case 'assign': {
          const v = eng.value(st.expr, actor);
          add(st.name, st.op === '=' ? v - (eng.s.vals[st.name] || 0) : st.op === '+=' ? v : -v, w);
          break;
        }
        case 'rel': case 'spark': add(st.t + ':' + (st.npc === 'npc' ? actor : st.npc), (st.min + st.max) / 2, w); break;
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

const RESOURCES = ['health', 'mood', 'gold', 'grades', 'renown'];
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
      const opts = view.options.filter((x) => !x.disabled);
      const low = eng.c.order.resources.filter((id) => eng.s.vals[id] <= 25);
      const safe = opts.filter((x) => !x.affects.some((a) => low.includes(a)));
      return (safe.length ? safe : opts)[Math.floor(eng.rand() * (safe.length ? safe.length : opts.length))].key;
    },
  },
  // prefer options that raise relationships / romance / bonds (tests the social content)
  social: {
    name: 'social',
    pick(eng, view) {
      const ev = eng.c.events[view.id]; let best = -1, o;
      for (const x of view.options.filter((y) => !y.disabled)) {
        const def = eng.optionsOf(ev).find((q) => q.key === x.key); if (!def) continue; let sc = eng.rand() * 3;
        G.walkEffects(def.effects, (st) => { if ((st.t === 'rel' || st.t === 'spark') && st.max > 0) sc += st.max; if (st.t === 'bond' && ['friend', 'close', 'partner'].includes(st.status)) sc += 20; });
        if (sc > best) { best = sc; o = x; }
      }
      return o.key;
    },
  },
};

// Weights per play style (design §2). Resource units: one point of health ≈ one point of mood.
const STYLES = {
  balanced: () => scorer('balanced', { health: 1, mood: 1, gold: 0.4, grades: 1, renown: 0.3, skill: 1.2, 'rel:': 0.3, 'spark:': 0.2, 'bond:': 0.1, 'gain:': 5 }),
  aggressive: () => scorer('aggressive', { health: 0, mood: 0, gold: 0.8, grades: 1.5, renown: 0.5, skill: 2.5, 'rel:': 0, 'spark:': 0, 'bond:': 0 }, 1),
  moneymaxx: () => scorer('moneymaxx', { health: 0.6, mood: 0.6, gold: 3, grades: 0.5, renown: 0.2, skill: 0.3, 'rel:': 0.1, 'spark:': 0, 'bond:': 0, 'gain:job': 12 }),
  focused: (skill) => scorer('focused:' + skill, { health: 0.6, mood: 0.6, gold: 0.3, grades: 0.8, renown: 0.2, skill: (k) => (k === skill ? 6 : 0.4), 'rel:': 0.2, 'spark:': 0.1, 'bond:': 0.1, 'gain:': 4 }),
  // Casts whenever it can (design §8.8: casting at every chance keeps mana low).
  caster: () => scorer('caster', { health: 1, mood: 1, gold: 0.4, grades: 1, renown: 0.3, skill: 1.2, 'rel:': 0.3, 'spark:': 0.2, 'bond:': 0.1, 'gain:': 5, learn: 30, cast: 50 }),
  social: (npc) => scorer('social:' + npc, { health: 0.6, mood: 0.6, gold: 0.3, grades: 0.6, renown: 0.2, skill: 0.3, 'rel:': (k) => (k === 'rel:' + npc ? 5 : 0.2), 'spark:': (k) => (k === 'spark:' + npc ? 4 : 0), 'bond:': (k) => (k === 'bond:' + npc ? 1 : 0), 'gain:': 3 }),
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
    const pool = opts.truant ? open.filter((p) => !p.track) : duty.length ? duty : fresh.length && eng.rand() < 0.6 ? fresh : open;
    const from = pool.length ? pool : open;
    picks.push(from[Math.floor(eng.rand() * from.length)].id);
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
  if (STYLES[base]) return STYLES[base](arg);
  throw new Error('unknown play style "' + name + '" (' + list().join(', ') + ')');
}
function list() { return ['random', 'cautious', 'social', 'balanced', 'focused:<skill>', 'aggressive', 'moneymaxx', 'caster', 'truant', 'social:<npc>']; }

module.exports = { get, list, estimate, pickPlaces, pickMany };
