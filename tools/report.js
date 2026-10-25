'use strict';
/*
 * grim report: what the content needs next (design §11.1–11.2).
 *
 *   gaps(content, runs)   per draw source (places, course levels, club/job ranks, plans, slots):
 *                         pool size, repeatable events (the floor counts these), how often a draw came up empty in `runs`,
 *                         and the floor (phase 3 baseline) and depth target (§7.4)
 *   pacing(runs)          cards per term day / break day, empty visits overall
 *
 * `runs` are run records ({hist}) from sim (`playGame`) or run logs (tools/runlog.js).
 */
const Engine = require('../src/engine.js');

// Floors are the phase 3 baseline (every source has something to draw); targets are §7.4's depth.
const FLOOR = { place: 3, course: 2, club: 3, job: 3, plan: 4, thesis: 3, internship: 2, slot: 3 };
const TARGET = { place: 8, course: 15, club: 30, job: 30, plan: 12, thesis: 8, internship: 6, slot: 10 };

const repeatable = (e) => !!e.repeat;

function pools(content) {
  const eng = new Engine(content);
  const ix = eng.directorIndex();
  const rows = [];
  const drawsCompat = (p) => ix.ambient.filter((e) => (e.tags || []).some((t) => (p.draws || []).includes(t)));
  for (const p of Object.values(content.places || {})) {
    if (p.kind === 'internship') continue;   // internship places are counted with their track
    if (p.deprecated) continue;              // merged into another place (E11): counted there
    const own = ix.byPlace[p.id] || [];
    const tr = p.track ? (ix.byTrack[p.track] || []) : [];
    rows.push({ kind: 'place', id: p.id, region: p.region || '', events: own.length, repeatable: own.filter(repeatable).length, track: tr.length, compat: drawsCompat(p).length, hidden: !!p.discover });
  }
  for (const t of Object.values(content.tracks || {})) {
    const evs = ix.byTrack[t.id] || [];
    if (t.kind === 'course') {
      for (let l = 1; l <= (t.levels || 1); l++) {
        const lv = evs.filter((e) => (e.level || 1) === l);
        rows.push({ kind: 'course', id: t.id + ' ' + ['I', 'II', 'III'][l - 1], trackId: t.id, level: l, events: lv.length, repeatable: lv.filter(repeatable).length, compat: lv.filter((e) => !e.track).length, hidden: !!t.hidden });
      }
    } else if (t.kind === 'club' || t.kind === 'job') {
      const ranks = String(t.ranks || '').split(',').map((x) => x.trim()).filter(Boolean);
      const byRank = ranks.map((_, i) => evs.filter((e) => (e.rank || 1) === i + 1).length);
      rows.push({ kind: t.kind, id: t.id, events: evs.length, repeatable: evs.filter(repeatable).length, compat: evs.filter((e) => !e.track).length, ranks: byRank, hidden: !!t.hidden });
    } else {
      const place = t.place && content.places[t.place];
      const atPlace = place ? (ix.byPlace[place.id] || []) : [];
      const all = evs.concat(atPlace);
      rows.push({ kind: t.kind, id: t.id, events: all.length, repeatable: all.filter(repeatable).length, compat: 0, hidden: !!t.hidden });
    }
  }
  for (const st of Object.values(content.states || {})) {
    if (st.kind !== 'plan') continue;
    const id = st.id.replace(/^plan_/, '');
    const evs = ix.byPlan[id] || [];
    rows.push({ kind: 'plan', id, events: evs.length, repeatable: evs.filter(repeatable).length, compat: 0 });
  }
  // Slots with their own source: noon (social), night (world), midnight (special).
  rows.push({ kind: 'slot', id: 'noon (social)', events: ix.social.length, repeatable: ix.social.filter(repeatable).length, compat: ix.social.filter((e) => e.actor === 'any').length });
  rows.push({ kind: 'slot', id: 'night (world)', events: ix.ambient.length, repeatable: ix.ambient.filter(repeatable).length, compat: 0 });
  for (const sl of [...new Set(ix.slotBound.map((e) => e.slot))]) {
    const evs = ix.slotBound.filter((e) => e.slot === sl);
    rows.push({ kind: 'slot', id: sl + ' (special)', events: evs.length, repeatable: evs.filter(repeatable).length, compat: 0 });
  }
  for (const r of rows) { r.floor = FLOOR[r.kind] || 0; r.target = TARGET[r.kind] || 0; }
  return rows;
}

// From run histories: visits per place and how many drew no card; course mornings without a course card;
// plan days without a plan card; cards per day.
function usage(content, runs) {
  const places = {}, courses = {}, plans = {}, day = { term: [], break: [] };
  // A run log from before a merge names the old place: count it with its survivor (E11).
  const alias = (id) => Engine.placeAlias(content, id);
  let visits = 0, empty = 0;
  const visitSlots = (phase) => ((phase === 'break' ? content.game.day_break : content.game.day_term) || []).filter((r) => r.source === 'visit').map((r) => r.slot);
  const phaseOf = (month) => (content.game.calendar || [])[month - 1] || 'term';
  for (const run of runs) {
    const h = run.hist || [];
    const byTurn = {};
    for (const e of h) if (e.turn != null) (byTurn[e.turn] = byTurn[e.turn] || []).push(e);
    for (const [, es] of Object.entries(byTurn)) {
      const pick = es.find((e) => e.t === 'pick');
      const cards = es.filter((e) => e.t === 'card');
      const month = (cards[0] && cards[0].month) || null;
      if (month == null && !pick) continue;
      const phase = month ? phaseOf(month) : 'term';
      if (pick) day[phase].push(cards.length);
      if (pick) {
        const slots = visitSlots(phase);
        pick.picks.forEach((raw, i) => {
          if (!raw) return;
          const pl = alias(raw);
          const u = places[pl] = places[pl] || { visits: 0, empty: 0 };
          u.visits++; visits++;
          if (!cards.some((c) => c.slot === slots[i] && alias(c.place) === pl)) { u.empty++; empty++; }
        });
      }
      for (const c of cards) if (c.slot === 'morning' && c.track && content.tracks[c.track] && content.tracks[c.track].kind === 'course') { const u = courses[c.track] = courses[c.track] || { cards: 0 }; u.cards++; }
      if (phase === 'break' && pick) {
        const planCard = cards.find((c) => c.slot === 'morning');
        const u = plans._all = plans._all || { days: 0, empty: 0 };
        u.days++; if (!planCard) u.empty++;
      }
    }
  }
  const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  return { places, courses, plans, visits, empty, emptyShare: visits ? empty / visits : 0, termDay: mean(day.term), breakDay: mean(day.break), runs: runs.length };
}

function gaps(content, runs) {
  const rows = pools(content);
  const u = usage(content, runs || []);
  for (const r of rows) if (r.kind === 'place' && u.places[r.id]) { r.visits = u.places[r.id].visits; r.emptyShare = u.places[r.id].empty / u.places[r.id].visits; }
  // Baseline pools must keep repeating, so the floor counts repeatable events (once-only ones get used up).
  for (const r of rows) r.short = Math.max(0, r.floor - r.repeatable);
  return { rows, usage: u };
}

module.exports = { FLOOR, TARGET, pools, usage, gaps };
