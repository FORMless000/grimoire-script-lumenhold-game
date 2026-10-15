/*
 * The odds of every check and roll on a card, over the run (docs/authoring/checks.md, step 6):
 *
 *   node tools/grim.js odds <event> [<event> …]
 *
 * For each `challenge`, the win chance (and, with `partial:`, partial-or-better) for a passive player (every skill at
 * the expected skill, `@balance curve`) and a focused one (+25 in the tested skills), at months 3, 12, 24 and 48.
 * A course card is read as enrolled at its own `level:`; a cast role on `vs` reads as the expected skill. Circumstance
 * steps are shown off and all on. `chance` rolls show their odds. Legacy tiers (trivial … heroic) use the old formula.
 */
'use strict';
const G = require('../src/grimoire.js');
const Engine = require('../src/engine.js');

const MONTHS = [3, 12, 24, 48];
const FOCUS = 25;
const always = { src: 'true', fn: () => true };

function odds(content, ids) {
  const out = [];
  for (const id of ids) {
    const ev = content.events[id];
    if (!ev) { out.push('odds: unknown event "' + id + '"'); continue; }
    out.push('== ' + id + ' (' + (ev.class || '?') + (ev.repeat ? ', repeat ' + ev.repeat : '') + (ev.track ? ', ' + ev.track + (ev.level ? ' ' + ev.level : '') : '') + ')');
    out.push('   ' + 'option/line'.padEnd(18) + 'check'.padEnd(46) + 'passive m' + MONTHS.join('/') + '   focused m' + MONTHS.join('/'));
    let n = 0;
    for (const o of ev.options || []) {
      G.walkEffects(o.effects, (st) => {
        if (st.t !== 'challenge' && st.t !== 'chance') return;
        n++;
        const where = (o.key + ':' + st.line).padEnd(18);
        if (st.t === 'chance') {
          const e = setup(content, ev, 12, 0, null);
          const p = st.word ? e.likelihoodP(st.word, st.steps, ev.actor) : Math.round(e.value(st.p, ev.actor));
          const all = st.word && st.steps && st.steps.length ? ' (all steps: ' + e.likelihoodP(st.word, st.steps.map((x) => ({ n: x.n, cond: always })), ev.actor) + ')' : '';
          out.push('   ' + where + ('chance ' + (st.word || st.p.src)).padEnd(46) + p + '%' + all);
          return;
        }
        const label = 'challenge ' + st.kind + (st.using ? ' using ' + st.using : '') + (st.vs ? ' vs ' + st.vs.who + '.' + st.vs.stat + (st.offset ? (st.offset > 0 ? ' +' : ' ') + st.offset : '') : '') +
          (st.ladder ? (st.rung ? ' ' + st.rung : st.standard ? ' standard' + (st.offset ? (st.offset > 0 ? '+' : '') + st.offset : '') : '') + (st.odds ? ' ' + st.odds : '') + (st.drift ? ' drift ' + st.drift : '') : ' ' + st.tier + ' (legacy)') +
          (st.swing ? ' ' + st.swing : '') + (st.partial ? ' +partial' : '');
        const row = (focus, sts) => MONTHS.map((m) => { const e = setup(content, ev, m, focus, st); const r = e.challengeOdds(sts, ev.actor, ev.id); return st.partial ? r.win + '/' + r.atLeastPartial : String(r.win); }).join(' ');
        out.push('   ' + where + label.slice(0, 45).padEnd(46) + row(0, st).padEnd(22) + row(FOCUS, st));
        if (st.steps && st.steps.length) {
          const on = Object.assign({}, st, { steps: st.steps.map((x) => ({ n: x.n, cond: always })) });
          out.push('   ' + ''.padEnd(18) + ('  with all ' + st.steps.length + ' step(s)').padEnd(46) + row(0, on).padEnd(22) + row(FOCUS, on));
        }
      });
    }
    if (!n) out.push('   (no checks or rolls)');
  }
  return out.join('\n');
}

// A scratch game at month m: every skill at the expected skill (+focus in the tested ones), condition at 50, no spells;
// a course card's track enrolled at the card's level.
function setup(content, ev, m, focus, st) {
  const e = new Engine(content);
  e.newGame({ seed: 1, name: 'Odds' });
  e.s.turn = m;
  const E = e.expectedSkill(m);
  for (const k of Object.keys(content.skills)) e.s.vals[k] = E;
  for (const k of ['health', 'mood', e.spellResource]) if (content.resources[k]) e.s.vals[k] = 50;
  e.s.spells = {};
  const tr = ev.track && content.tracks[ev.track];
  if (tr) {
    e.s.tracks[ev.track] = Object.assign({}, e.s.tracks[ev.track] || {}, { kind: tr.kind, status: tr.kind === 'course' ? 'enrolled' : 'member', level: ev.level || 1, study: 0, grades: [], passed: {} });
    e._ctxTrack = ev.track;
  }
  if (st && focus) {
    const skills = st.using ? [st.using] : st.kind === 'exam' && tr && tr.kind === 'course' ? e.trackSkills(ev.track) : (G.CHALLENGE_KINDS[st.kind] || ['lore']);
    for (const k of skills) if (content.skills[k]) e.s.vals[k] = E + focus;
  }
  return e;
}

module.exports = { odds };
