// Phase 3: `check <skill> <dc>:` / `else:` (legacy in schema v1) becomes `challenge <kind> [using <skill>] <tier>:`
// with `win:` / `lose:` (design §8.3). The skill is kept exactly (by the kind's own skill or `using`); the tier is
// chosen so that a player at the expected skill E(turn) keeps about the same odds as before, at the turn the event
// is typically seen (from a short simulation). Old odds: 50 + 3 (skill − dc); new: 50 + 2.5 (skill − E − tier).
// A review list for the judged pass (kind fits the scene? a partial outcome?) goes to build/worklists/challenges.md.
'use strict';
const fs = require('fs');
const path = require('path');
const Engine = require('../../src/engine.js');
const Policies = require('../policies.js');

const DIFF = [['trivial', -15], ['easy', -7], ['medium', 0], ['hard', 8], ['heroic', 16]];
const tierFor = (off) => DIFF.reduce((best, d) => (Math.abs(d[1] - off) < Math.abs(best[1] - off) ? d : best))[0];

function kindFor(skill, tags) {
  const has = (...t) => t.some((x) => (tags || []).includes(x));
  if ((skill === 'arcana' || skill === 'vigor') && has('duel', 'dueling', 'duelling', 'fight')) return { kind: 'duel', using: skill };
  return {
    charm: { kind: 'negotiate' }, guile: { kind: 'deceive' }, alchemy: { kind: 'brew' },
    lore: has('exam') ? { kind: 'exam' } : { kind: 'research' },
    arcana: { kind: 'spell' }, vigor: { kind: 'feat' },
  }[skill] || { kind: 'research', using: skill };
}

// Mean turn each event is shown, over a few simulated games (random and balanced styles).
function typicalTurns(content, games = 24) {
  const sum = {}, n = {};
  const w = console.warn; console.warn = () => {};
  try {
    for (let g = 0; g < games; g++) {
      const style = Policies.get(g % 2 ? 'balanced' : 'random');
      const eng = new Engine(content);
      let r = eng.newGame({ seed: 9001 + g * 7919, name: 'M' });
      for (let i = 0; i < 6000 && r.kind !== 'ending'; i++) {
        if (r.kind === 'month') { r = eng.advance(); continue; }
        if (r.kind === 'map') { eng.pickPlaces((style.pickPlaces || Policies.pickPlaces)(eng, r.view)); r = eng.advance(); continue; }
        const v = r.view;
        if (v.pick > 1) { const o = v.options.filter((x) => !x.disabled && x.key !== 'none'); const k = Policies.pickMany(eng, v, o); eng.choose(k.length ? k : [v.options.find((x) => !x.disabled).key]); }
        else { sum[v.id] = (sum[v.id] || 0) + eng.s.turn; n[v.id] = (n[v.id] || 0) + 1; eng.choose(style.pick(eng, v)); }
        r = eng.advance();
      }
    }
  } finally { console.warn = w; }
  const out = {};
  for (const id of Object.keys(sum)) out[id] = Math.round(sum[id] / n[id]);
  return out;
}

module.exports = {
  id: '0007-check-to-challenge',
  description: 'check → challenge (kind by skill, tier keeps the odds at E(turn)); review list in build/worklists/challenges.md',
  tierFor, kindFor,
  run(ctx) {
    const content = ctx.content;
    const rows = ctx.query('check');
    if (!rows.length) return;
    const turns = typicalTurns(content);
    const eng = new Engine(content);
    const w = console.warn; console.warn = () => {};
    try { eng.newGame({ seed: 1, name: 'M' }); } finally { console.warn = w; }
    const byFile = {};
    for (const r of rows) (byFile[r.file] = byFile[r.file] || []).push(r);
    const review = [];
    for (const [file, list] of Object.entries(byFile)) {
      const lines = ctx.lines(file);
      const ind = (t) => t.length - t.trimStart().length;
      const delta = new Array(lines.length + 2).fill(0);
      const conv = {};   // line number (1-based) -> {indent, head} | {indent, lose: true}
      const blockEnd = (from, indent) => { let j = from; while (j < lines.length && (!lines[j].trim() || ind(lines[j]) > indent)) j++; return j; };   // 0-based exclusive
      for (const r of list) {
        const L = r.line, text = lines[L - 1], I = ind(text);
        const m = text.trim().match(/^check\s+([a-z_][a-z0-9_]*)\s+(.+):$/);
        if (!m) { ctx.report('skipped ' + file + ':' + L + ' ' + text.trim()); continue; }
        const ev = content.events[r.block];
        const turn = (ev && turns[ev.id]) || 24;
        eng.s.turn = turn;
        let dc;
        try { dc = eng.value(ctx.content.events[r.block] ? require('../../src/grimoire.js').expr(m[2], file, L) : null, null); } catch (e) { dc = null; }
        if (typeof dc !== 'number' || !isFinite(dc)) dc = Number(m[2]) || 15;
        const E = eng.expectedSkill(turn);
        const tier = tierFor(1.2 * (dc - E));
        const k = kindFor(m[1], (ev && ev.tags) || []);
        const using = k.using || (Engine.CHALLENGE_SKILLS ? null : null) || (['negotiate', 'deceive', 'research', 'exam', 'brew', 'spell', 'feat'].includes(k.kind) ? null : m[1]);
        conv[L] = { indent: I, head: 'challenge ' + k.kind + (using ? ' using ' + using : '') + ' ' + tier + ':' };
        const bodyEnd = blockEnd(L, I);
        for (let j = L; j < bodyEnd; j++) delta[j + 1] += 2;
        if (bodyEnd < lines.length && lines[bodyEnd].trim() === 'else:' && ind(lines[bodyEnd]) === I) {
          conv[bodyEnd + 1] = { indent: I, lose: true };
          const elseEnd = blockEnd(bodyEnd + 1, I);
          for (let j = bodyEnd + 1; j < elseEnd; j++) delta[j + 1] += 2;
        }
        const oldP = Math.max(5, Math.min(95, Math.round(50 + 3 * (E - dc)))), newP = Math.max(8, Math.min(92, Math.round(50 - 2.5 * DIFF.find((d) => d[0] === tier)[1])));
        const flags = [];
        if (k.kind === 'feat' || k.kind === 'spell' || k.kind === 'research') flags.push('kind?');
        if (/[a-z_]+\(|npc/.test(m[2])) flags.push('dc used ' + m[2]);
        review.push('- [ ] `' + r.block + '` ' + file + ':' + L + ' — `check ' + m[1] + ' ' + m[2] + '` → `' + conv[L].head + '` (turn ~' + turn + ', E ' + E + ', odds at E ' + oldP + '% → ' + newP + '%)' + (flags.length ? ' **' + flags.join(', ') + '**' : ''));
      }
      for (let n = 1; n <= lines.length; n++) {
        const t = lines[n - 1];
        if (conv[n] && conv[n].head) { const pad = ' '.repeat(conv[n].indent + delta[n]); ctx.edit({ file, line: n }, pad + conv[n].head + '\n' + pad + '  win:'); }
        else if (conv[n] && conv[n].lose) ctx.edit({ file, line: n }, ' '.repeat(conv[n].indent + delta[n] + 2) + 'lose:');
        else if (delta[n] && t.trim()) ctx.edit({ file, line: n }, ' '.repeat(delta[n]) + t);
      }
    }
    const out = path.join(ctx.project.root, 'build', 'worklists', 'challenges.md');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, '# check → challenge: review list (migration 0007)\n\nFor each: does the kind fit the scene (the chip shows it)? Is there a middle outcome worth a `partial:`?\n**kind?** marks guesses (feat, spell, research); **dc used** marks DCs that depended on the character, flags or other state (keep that preparation: a `vs`, an `if` around tiers, or a better tier).\n\n' + review.join('\n') + '\n');
    ctx.report(review.length + ' check(s) converted; review list: build/worklists/challenges.md');
  },
};
