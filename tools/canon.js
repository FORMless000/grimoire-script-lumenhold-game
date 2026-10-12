/*
 * Canon lint (design §3.3): proper nouns in player-visible text must be known to the worldbook.
 *
 * Known names come from: @npc names, short names and titles; @place, @track, @spell, @faction, @arc names;
 * @lore keys; @vocab houses and canon_allowlist; month, resource and skill names; and the English column
 * of locales/zh-CN/GLOSSARY.md. A candidate is a run of Capitalised words (joined by "of", "the", "&",
 * "and") that doesn't start a sentence, or any multi-word run. Single capitalised words at the start
 * of a sentence are skipped: they are usually ordinary words.
 *
 *   unknownNames(content, glossaryText) -> [{name, where}]
 */
'use strict';
const G = require('../src/grimoire.js');

const CONNECT = new Set(['of', 'the', '&', 'and', 'de', 'du']);
// Capitalised words that are not names (titles, pronouns, interjections, common sentence words).
const COMMON = new Set(('I Im Ill Ive Id OK Oh Ah Mr Mrs Miss Ms Sir Madam Lady Lord Professor Headmistress Sister Brother Master Duke Duchess ' +
  'Saint King Queen Prince Princess Captain Doctor Dr Year Years Month Months Monday Tuesday Wednesday Thursday Friday Saturday Sunday ' +
  'Yes No Not Nobody Somebody Everyone Everybody Anyone Someone Something Nothing Everything Thank Thanks Hello Hi Goodbye Welcome Fine Good ' +
  'Right Wait Well Stop Go Come Look Listen Please Sorry Of And The A An But Or If Then So Still Just Only Even Now Later Today Tomorrow ' +
  'Never Always Again Next Last First Second Third One Two Three Four Five Six Seven Eight Nine Ten Eleven Twelve Forty Fifty Hundred ' +
  'You Your We Our They Their He His She Her It Its My Me Us Them This That These Those There Here What Who Why How When Where Which ' +
  'Do Dont Does Did Is Are Was Were Be Been Being Have Has Had Can Cant Could Would Should Will Wont May Might Must Shall Let Lets ' +
  'Exam Exams Class Classes Club Clubs Job Jobs Front Page Headline Chapter Rule Rules Law Laws Third Volume Foundations ' +
  'Hope Tower Star Fool Death Lovers Wheel Fortune Moon Sun World Hermit Justice Strength Temperance Devil Judgement Emperor Empress Chariot Magician ' +
  'Wizards Hand Distinction Detention North South East West Northern Southern Eastern Western Spring Summer Autumn Winter Midwinter ' +
  'Requires Costs Dear Mister T C Q').split(/\s+/));

function words(s) { return String(s).toLowerCase().split(/[\s,·:;()"'’.!?\-–—/]+/).filter(Boolean); }

function knownWords(content, glossaryText) {
  const known = new Set();
  const add = (s) => { if (s) for (const w of words(s)) known.add(w); };
  for (const n of Object.values(content.npcs)) { add(n.name); add(n.short); add(n.title); add(n.house); }
  for (const col of ['places', 'tracks', 'spells', 'factions', 'arcs']) for (const d of Object.values(content[col] || {})) { add(d.name); add(d.level_names); add(d.ranks); }
  for (const d of Object.values(content.lore || {})) (d.keys || []).forEach(add);
  for (const v of ['houses', 'canon_allowlist']) if (content.vocab && content.vocab[v]) (content.vocab[v].values || []).forEach(add);
  (content.game.months || []).forEach(add);
  for (const col of ['resources', 'skills', 'states']) for (const d of Object.values(content[col] || {})) add(d.name);
  if (glossaryText) {
    for (const line of glossaryText.split('\n')) {
      const m = line.match(/^\|\s*([^|]+?)\s*\|/);
      if (m && !/^(English|id|-+)$/i.test(m[1])) add(m[1].replace(/\(.*?\)/g, ''));
      if (/^Minor characters|^Houses/.test(line)) line.split(/·|:/).forEach((part) => add(part.replace(/[一-鿿（）()]+/g, ' ')));
    }
  }
  return known;
}

// Player-visible text of every block, with locations.
function texts(content) {
  const out = [];
  const push = (text, d, line) => { if (text) out.push({ text: String(text), where: d.file + ':' + (line || d.line) }); };
  for (const col of ['events', 'endings', 'states', 'npcs', 'hooks', 'places', 'tracks', 'spells', 'facts', 'factions', 'arcs']) {
    for (const d of Object.values(content[col] || {})) {
      // Prose only: titles, names and option labels are Title Case by convention.
      for (const f of ['text', 'scene', 'desc', 'hint']) push(d[f], d);
      for (const f of ['on_show', 'tick', 'on_add', 'on_expire', 'on_remove', 'do']) G.walkEffects(d[f], (st) => { if (st.t === 'say') push(st.text, d, st.line); });
      for (const o of d.options || []) { push(o.hint, d, o.line); G.walkEffects(o.effects, (st) => { if (st.t === 'say') push(st.text, d, st.line); }); }
    }
  }
  push(content.game.intro, { file: 'content/core/rules.grim', line: 1 });
  return out;
}

// Inline variations ({~a|b}, {cond: a|b}) become their alternatives as separate sentences; other tokens go.
function flatten(text) {
  let out = '', i = 0;
  while (i < text.length) {
    if (text[i] !== '{') { out += text[i++]; continue; }
    let d = 0, j = i;
    for (; j < text.length; j++) { if (text[j] === '{') d++; else if (text[j] === '}' && --d === 0) break; }
    const inner = text.slice(i + 1, j);
    const parts = []; let dd = 0, start = 0;
    for (let k = 0; k < inner.length; k++) { const ch = inner[k]; if (ch === '{') dd++; else if (ch === '}') dd--; else if (ch === '|' && !dd) { parts.push(inner.slice(start, k)); start = k + 1; } }
    parts.push(inner.slice(start));
    const colon = parts[0].indexOf(':');
    if (inner[0] !== '=' && (parts.length > 1 || colon > 0)) {
      if (colon > 0) parts[0] = parts[0].slice(colon + 1);
      else if (inner[0] === '~' || inner[0] === '&') parts[0] = parts[0].slice(1);
      out += ' ' + parts.map((p) => flatten(p)).join('. ') + ' ';
    } else out += ' ';
    i = j + 1;
  }
  return out;
}

// Runs of capitalised words in a text, with whether they start a sentence.
function candidates(text) {
  const clean = flatten(text).replace(/[“”"]/g, ' " ');
  const toks = clean.match(/[A-Za-z][A-Za-z'’]*|&|[.!?:;"—–,()]/g) || [];
  const out = [];
  let run = [], start = true, runStart = false;
  const flush = () => {
    while (run.length && CONNECT.has(run[run.length - 1].toLowerCase())) run.pop();
    if (run.length) out.push({ name: run.join(' ').replace(/ & /g, ' & '), sentenceStart: runStart });
    run = [];
  };
  for (const t of toks) {
    if (/^[,()]$/.test(t)) { flush(); start = false; continue; }   // ends a name, not a sentence
    if (/^[.!?:;"—–]$/.test(t)) { flush(); start = true; continue; }
    const cap = /^[A-Z]/.test(t) && !/^[A-Z]{2,}[’']?[A-Z]*$/.test(t);   // ALL-CAPS signage isn't a name
    if (cap) { if (!run.length) runStart = start; run.push(t); }
    else if (run.length && CONNECT.has(t.toLowerCase())) run.push(t);
    else flush();
    start = false;
  }
  flush();
  return out;
}

function unknownNames(content, glossaryText) {
  const known = knownWords(content, glossaryText);
  const seen = new Map();
  for (const { text, where } of texts(content)) {
    for (const c of candidates(text)) {
      const parts = c.name.split(' ').filter((w) => !CONNECT.has(w.toLowerCase()));
      const meaningful = parts.filter((w) => !COMMON.has(w.replace(/[’']/g, '')) && !COMMON.has(w.replace(/[’'].*$/, '')));
      if (!meaningful.length) continue;
      if (c.sentenceStart && parts.length === 1) continue;
      const norm = (w) => w.toLowerCase().replace(/[’']s?$/, '');
      const isKnown = (w) => known.has(norm(w)) || known.has(w.toLowerCase()) || (/s$/.test(w) && (known.has(norm(w).slice(0, -1)) || COMMON.has(w.slice(0, -1))));
      // At the start of a sentence the first word is often an ordinary word ("Tell Kael", "Somehow Bram").
      const check = c.sentenceStart && !isKnown(meaningful[0]) ? meaningful.slice(1) : meaningful;
      const unknown = check.filter((w) => !isKnown(w));
      if (!unknown.length) continue;
      const key = c.name;
      if (!seen.has(key)) seen.set(key, { name: key, where: [] });
      seen.get(key).where.push(where);
    }
  }
  return [...seen.values()].sort((a, b) => b.where.length - a.where.length || a.name.localeCompare(b.name));
}

module.exports = { unknownNames, candidates, knownWords };
