#!/usr/bin/env node
/*
 * Extract every bound negotiation from the game into crux/encounters.js (generated; commit it, the page
 * reads it from file:// too). Reads the compiled content and src/negotiation.js PARLEYS; writes nothing else.
 *
 *   node crux/build-encounters.js [--check]
 *
 * Per negotiation: the card's title, text and option label (variants reduced to their first reading), who sits across
 * the table and the room (PARLEYS), the difficulty (the check ladder's rung and odds word, or a character's stat), the
 * skill it turns on (`using`), and its circumstance steps (`+1 if clue(x)`), which Crux plays as facts.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const G = require(path.join(ROOT, 'src/grimoire.js'));
const N = require(path.join(ROOT, 'src/negotiation.js'));
const { content } = require(path.join(ROOT, 'tools/project.js')).project(ROOT).compileAll();

const OUT = path.join(__dirname, 'encounters.js');
const { ODDS_SHIFT } = require('./setup.js');
const ROLE_LEVEL = 35;   // a cast role ("friend") with no fixed character

// Reduce a card's {variant} text to one plain reading: a condition takes its first (true) branch, alternatives their
// first, tokens become words. Good enough for a briefing; the game itself renders the real thing.
function plain(text, who, nested) {
  if (!text) return '';
  const name = who || 'they';
  // Pronoun tokens read as "they", so verb endings ({s}, {es}) agree with it: "they say".
  const TOK = { they: 'they', them: 'them', their: 'their', theirs: 'theirs', s: '', es: '', is: 'are', are: 'are', was: 'were', has: 'have', track: 'your course', friend: 'your friend', npc: name };
  let out = '', i = 0;
  const readBrace = (s, start) => {   // returns [inner, endIndex]
    let depth = 0;
    for (let j = start; j < s.length; j++) {
      if (s[j] === '{') depth++;
      else if (s[j] === '}' && --depth === 0) return [s.slice(start + 1, j), j];
    }
    return [s.slice(start + 1), s.length];
  };
  const topSplit = (s, ch) => { const parts = []; let depth = 0, last = 0; for (let j = 0; j < s.length; j++) { if (s[j] === '{') depth++; else if (s[j] === '}') depth--; else if (s[j] === ch && depth === 0) { parts.push(s.slice(last, j)); last = j + 1; } } parts.push(s.slice(last)); return parts; };
  while (i < text.length) {
    if (text[i] !== '{') { out += text[i++]; continue; }
    const [inner, end] = readBrace(text, i);
    i = end + 1;
    const colon = topSplit(inner, ':');
    let pick;
    if (colon.length > 1 && /^[\w.]+\(|[<>=]|^not /.test(colon[0].trim())) pick = topSplit(colon.slice(1).join(':'), '|')[0];
    else if (topSplit(inner, '|').length > 1) pick = topSplit(inner, '|')[0].replace(/^~/, '');
    else if (/^\w+$/.test(inner)) pick = TOK[inner] ?? (content.npcs[inner] ? short(content.npcs[inner]) : inner === inner.toLowerCase() ? 'they' : inner);
    else pick = inner.replace(/^~/, '');
    out += plain(pick, who, true);
  }
  if (nested) return out;
  return out.replace(/\s+/g, ' ').replace(/ ([.,!?])/g, '$1').trim()
    .replace(/(^|[.!?]["”]? )([a-z])/g, (m, a, b) => a + b.toUpperCase());   // a token that opened a sentence
}
// How the game prints a character: `short:`, else the first word of the name.
const short = (npc) => npc.short || npc.name.split(/[ ·]/)[0];

function challengeOf(option) {
  let ch = null;
  G.walkEffects(option.effects, (st) => { if (st.t === 'challenge' && G.MINIGAME_KINDS[st.kind] === 'parley') ch = st; });
  return ch;
}

const groupOf = (key, p) => key.startsWith('ww') ? 'Whisperwood'
  : /^(hs_|ilse_grey)/.test(key) ? 'The Hollow Star'
  : p.tutorial ? 'Introduction'
  : { official: 'Officials', scholar: 'Scholars', skeptic: 'Skeptics', debater: 'Debaters', social_operator: 'Dealers and hosts', committee: 'Panels' }[p.profile];

const list = [];
for (const [key, p] of Object.entries(N.PARLEYS)) {
  const [eventId, optKey] = key.split('/');
  const e = content.events[eventId];
  const o = e && e.options.find((x) => x.key === optKey);
  const ch = o && challengeOf(o);
  if (!ch) { console.warn('skipped ' + key + ': no negotiation found'); continue; }
  const tiers = content.balance.dc_tiers;
  let level, difficulty;
  if (ch.vs) {
    const npc = content.npcs[ch.vs.who];
    level = npc && npc.stats ? npc.stats[ch.vs.stat] : ROLE_LEVEL;
    difficulty = `${npc ? short(npc) + '’s' : 'your friend’s'} ${ch.vs.stat} (${level})`;
  } else {
    level = (tiers[ch.rung] ?? 28) + (ODDS_SHIFT[ch.odds] || 0);
    difficulty = ch.rung + (ch.odds ? ' · ' + ch.odds : '');
  }
  const who = p.note || null;
  list.push({
    key, event: eventId, option: optKey, group: groupOf(key, p),
    title: e.title || eventId, label: plain(o.label, who), who,
    intro: plain(e.text, who), scene: e.scene || '',
    profile: p.profile, room: p.context, tutorial: !!p.tutorial,
    level: Math.max(5, Math.min(95, Math.round(level))), difficulty,
    using: ch.using || null, partial: !!(ch.partial && ch.partial.length), cls: e.class || null,
    steps: (ch.steps || []).map((s) => s.cond && s.cond.src).filter(Boolean),
    source: path.relative(ROOT, e.file) + ':' + o.line,
  });
}

const body = `/* Generated by crux/build-encounters.js from the game's content and src/negotiation.js. Do not edit. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CruxEncounters = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  return ${JSON.stringify(list, null, 1)};
});
`;
if (process.argv.includes('--check')) {
  const same = fs.existsSync(OUT) && fs.readFileSync(OUT, 'utf8') === body;
  console.log(same ? 'encounters.js is up to date' : 'encounters.js is stale: run node crux/build-encounters.js');
  process.exit(same ? 0 : 1);
}
fs.writeFileSync(OUT, body);
console.log(`wrote ${path.relative(ROOT, OUT)}: ${list.length} negotiations`);
