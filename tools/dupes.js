'use strict';
/*
 * Near-duplicate events (design §11.1.6): shingled-text Jaccard over each event's player-visible prose
 * (title, text, option labels and say lines). 5-word shingles; pairs at or above 0.6 are flagged.
 *
 *   dupes(content, {only, threshold})   -> [{a, b, score}], highest first
 *                                         `only`: a Set of event ids; then only pairs touching them are checked
 */
const G = require('../src/grimoire.js');

const K = 5;
function prose(e) {
  const parts = [e.title, e.text];
  for (const o of e.options || []) {
    parts.push(o.label);
    G.walkEffects(o.effects, (st) => { if (st.t === 'say' && !st.who) parts.push(st.text); });
  }
  return parts.filter(Boolean).join(' ');
}
function shingles(text) {
  const w = String(text).toLowerCase()
    .replace(/\{~([^}]*)\}/g, (m, alts) => alts.split('|')[0])   // inline variation: the first alternative
    .replace(/\{[^}]*\}/g, ' ')
    .replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter(Boolean);
  const out = new Set();
  for (let i = 0; i + K <= w.length; i++) out.add(w.slice(i, i + K).join(' '));
  return out;
}
function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  const [s, l] = a.size < b.size ? [a, b] : [b, a];
  for (const x of s) if (l.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}
function dupes(content, opts = {}) {
  const threshold = opts.threshold != null ? opts.threshold : 0.6;
  const evs = Object.values(content.events).map((e) => ({ id: e.id, sh: shingles(prose(e)) }));
  const out = [];
  for (let i = 0; i < evs.length; i++) {
    for (let j = i + 1; j < evs.length; j++) {
      if (opts.only && !opts.only.has(evs[i].id) && !opts.only.has(evs[j].id)) continue;
      const score = jaccard(evs[i].sh, evs[j].sh);
      if (score >= threshold) out.push({ a: evs[i].id, b: evs[j].id, score: Math.round(score * 100) / 100 });
    }
  }
  return out.sort((x, y) => y.score - x.score);
}

module.exports = { dupes, shingles, jaccard, prose };
