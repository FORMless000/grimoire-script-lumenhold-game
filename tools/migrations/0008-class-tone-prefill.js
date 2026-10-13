// Phase 3 step 3: every legacy event gets `class:` and `tone:` (design §8.6, docs/authoring/classes.md).
// A guess from structure, to be corrected where the budget lint or a reader disagrees:
//   crisis.grim → crisis; auto/queued/menu events, chains and arc beats → story (budget-exempt);
//   an option that makes someone a friend, close friend or partner → milestone;
//   every option pure gain → windfall; every option pure loss → incident; anything else → routine.
// Tone from tags: crisis → grim; mystery/hollowstar/ghost → eerie; romance/friendship/family → warm;
// exam/duel/rivalry/danger → tense; otherwise light.
'use strict';
const G = require('../../src/grimoire.js');

const sign = (st) => (st.tier ? st.sign : st.min != null ? Math.sign((st.min + st.max) / 2) : 0);
// Signs of an option's outcomes: does any path gain, does any path cost?
function signs(effects) {
  let gain = false, cost = false;
  G.walkEffects(effects || [], (st) => {
    if (st.t === 'delta' || st.t === 'rel' || st.t === 'spark' || st.t === 'study' || st.t === 'perform' || st.t === 'progress') {
      const s = sign(st); if (s > 0) gain = true; if (s < 0) cost = true;
    } else if (st.t === 'preset') { gain = true; if (/^(grind|work|social)$/.test(st.name)) cost = true; }
    else if (st.t === 'gain' || st.t === 'learn_spell' || st.t === 'discover') gain = true;
    else if (st.t === 'lose') cost = true;
  });
  return { gain, cost };
}
function hasBond(effects) { let b = false; G.walkEffects(effects || [], (st) => { if (st.t === 'bond' && ['friend', 'close', 'partner'].includes(st.status)) b = true; }); return b; }
function hasPlot(effects) { let b = false; G.walkEffects(effects || [], (st) => { if (st.t === 'find' || st.t === 'advance' || st.t === 'end' || (st.t === 'assign' && st.name === 'hollow') || (st.t === 'delta' && st.name === 'hollow')) b = true; }); return b; }

function classify(e, file) {
  const opts = e.options || [];
  const all = opts.flatMap((o) => o.effects || []);
  if (/crisis\.grim$/.test(file)) return 'crisis';
  if (e.trigger === 'auto' || e.trigger === 'queued' || e.type === 'menu' || e.chain || hasPlot(all)) return 'story';
  if (opts.some((o) => hasBond(o.effects))) return 'milestone';
  const s = opts.map((o) => signs(o.effects));
  if (s.length && s.every((x) => x.gain && !x.cost)) return 'windfall';
  if (s.length && s.every((x) => x.cost && !x.gain)) return 'incident';
  return 'routine';
}
function tone(e, cls) {
  const t = new Set(e.tags || []);
  const any = (...xs) => xs.some((x) => t.has(x));
  if (cls === 'crisis' || any('crisis', 'grief', 'loss')) return 'grim';
  if (any('mystery', 'hollowstar', 'ghost', 'eerie', 'curse', 'forbidden')) return 'eerie';
  if (any('romance', 'friendship', 'family', 'home', 'kindness')) return 'warm';
  if (any('exam', 'duel', 'rivalry', 'rival', 'danger', 'conflict', 'debt')) return 'tense';
  return 'light';
}

module.exports = {
  id: '0008-class-tone-prefill',
  description: 'class: and tone: for legacy events (structural guess)',
  classify, tone,
  run(ctx) {
    const by = {};
    for (const row of ctx.query('event', 'not class')) {
      const e = ctx.content.events[row.id];
      if (!e) continue;
      const cls = classify(e, row.file);
      const lines = ctx.lines(row.file);
      // after the title line (or the @event header)
      let n = row.line;
      while (n < lines.length && !/^title:/.test(lines[n]) && !lines[n].startsWith('@')) n++;
      const at = /^title:/.test(lines[n] || '') ? n + 1 : row.line;
      ctx.insertAfter({ file: row.file, line: at }, 'class: ' + cls + (e.tone ? '' : '\ntone: ' + tone(e, cls)));
      by[cls] = (by[cls] || 0) + 1;
    }
    ctx.report(Object.entries(by).map(([k, v]) => k + ' ' + v).join(', '));
  },
};
