/*
 * Worldbook exports for content production (design §3.4).
 *
 *   lorebook(content)            -> [{id, kind, keys, text, canon, refs}]   (`grim lorebook`)
 *   brief(content, sources, opt) -> markdown context pack                   (`grim brief`)
 *
 * A brief gathers what an author (Claude Code now, the live harness later) needs to write events
 * around one topic: the cast with voice and facts up to a tier, the place, the track, the arc, the
 * lore entries whose keys match, three similar existing events as style examples, and the authoring
 * rules. It is capped at about `budget` characters (default 24k ≈ 6k tokens): lore and examples are
 * trimmed first.
 */
'use strict';
const G = require('../src/grimoire.js');

const TIERS = ['surface', 'personal', 'secret'];
const npcName = (content, id) => (content.npcs[id] ? content.npcs[id].name : id);

function refsIn(text, content) {
  const refs = new Set();
  for (const m of String(text || '').matchAll(/\{([a-z_][a-z0-9_]*)(?:\.[a-z]+)?\}/g)) if (content.npcs[m[1]]) refs.add(m[1]);
  return [...refs];
}

function lorebook(content) {
  const out = [];
  const push = (id, kind, keys, text, canon, refs) => out.push({ id, kind, keys: keys.filter(Boolean), text: text || '', canon: canon || 'hard', refs: refs || [] });
  for (const n of Object.values(content.npcs)) push(n.id, 'npc', [n.name, n.short, n.id], [n.title, n.desc, n.voice ? 'Voice: ' + n.voice : null].filter(Boolean).join(' '), 'hard', Object.keys(n.relations || {}));
  for (const f of Object.values(content.facts)) push(f.id, 'fact', [npcName(content, f.id.split('.')[0]), f.id], f.text, 'hard', [f.id.split('.')[0]].concat(refsIn(f.text, content)));
  for (const p of Object.values(content.places)) push(p.id, 'place', [p.name, p.id], p.desc, 'hard', p.track ? [p.track] : []);
  for (const t of Object.values(content.tracks)) push(t.id, 'track', [t.name, t.id], t.desc, 'hard', [t.place, t.lead].concat((t.teaches || []).map((x) => x.spell)).filter(Boolean));
  for (const s of Object.values(content.spells)) push(s.id, 'spell', [s.name, s.id], s.desc, 'hard', s.discipline ? [s.discipline] : []);
  for (const f of Object.values(content.factions)) push(f.id, 'faction', [f.name, f.id], f.desc, 'hard', f.members || []);
  for (const a of Object.values(content.arcs)) push(a.id, 'arc', [a.name, a.id], a.desc, a.canon, a.cast || []);
  for (const l of Object.values(content.lore)) push(l.id, 'lore', l.keys || [], l.text, l.canon, refsIn(l.text, content));
  for (const t of Object.values(content.timeline)) push(t.id, 'timeline', [t.id, t.date], t.text, 'hard', t.event ? [t.event] : []);
  return out;
}

const words = (s) => String(s || '').toLowerCase().match(/[a-z][a-z'’]+/g) || [];
const STOP = new Set('the a an and or of to in on at for with from by is are was be it its this that your you their they he she his her as into over about not but'.split(' '));

function brief(content, sources, opt = {}) {
  const budget = opt.budget || 24000;
  const tier = TIERS.indexOf(opt.tier || 'personal');
  const cast = (opt.cast || []).filter((id) => content.npcs[id]);
  const place = opt.place && content.places[opt.place];
  const track = opt.track && content.tracks[opt.track];
  const arc = opt.arc && content.arcs[opt.arc];
  const missing = [].concat((opt.cast || []).filter((id) => !content.npcs[id]).map((x) => 'npc ' + x), opt.place && !place ? ['place ' + opt.place] : [], opt.track && !track ? ['track ' + opt.track] : [], opt.arc && !arc ? ['arc ' + opt.arc] : []);
  if (missing.length) throw new Error('unknown: ' + missing.join(', '));
  const parts = [];
  parts.push('# Brief' + (opt.topic ? ': ' + opt.topic : ''));
  parts.push('Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **' + TIERS[tier] + '**.');

  if (cast.length) {
    const lines = ['## Cast'];
    for (const id of cast) {
      const n = content.npcs[id];
      lines.push('### ' + n.name + ' (`' + id + '`)');
      lines.push([n.pronouns, n.age != null ? 'age ' + n.age : null, n.role ? n.role + (n.year ? ' year ' + n.year : '') : null, n.house].filter(Boolean).join(' · ') + (n.romance ? ' · romanceable' : ''));
      if (n.title) lines.push('*' + n.title + '*');
      if (n.desc) lines.push(n.desc);
      if (n.voice) lines.push('**Voice:** ' + n.voice);
      if (n.traits) lines.push('**Traits:** ' + n.traits.join(', ') + (n.interests ? ' · **Interests:** ' + n.interests.join(', ') : ''));
      if (n.stats) lines.push('**Stats:** ' + Object.entries(n.stats).map(([k, v]) => k + ' ' + v).join(', '));
      if (n.schedule) lines.push('**Schedule:** ' + n.schedule.map((x) => (content.places[x.place] ? content.places[x.place].name : x.place) + ' (' + x.slots.join(', ') + ')').join('; '));
      const rel = Object.entries(n.relations || {});
      if (rel.length) lines.push('**Relations:** ' + rel.map(([k, v]) => npcName(content, k) + ' ' + (v > 0 ? '+' : '') + v).join(', '));
      const facts = Object.values(content.facts).filter((f) => f.id.startsWith(id + '.') && TIERS.indexOf(f.tier) <= tier);
      if (facts.length) lines.push('**Facts:**\n' + facts.map((f) => '- [' + f.tier + '] ' + f.text + ' (`' + f.id + '`' + (f.unlock ? ', known when `' + f.unlock.src + '`' : '') + ')').join('\n'));
    }
    parts.push(lines.join('\n\n'));
  }
  if (place) {
    const here = Object.values(content.npcs).filter((n) => (n.schedule || []).some((x) => x.place === place.id)).map((n) => n.name + ' (' + n.schedule.find((x) => x.place === place.id).slots.join(', ') + ')');
    parts.push(['## Place: ' + place.name + ' (`' + place.id + '`)', [place.region, place.kind, 'open ' + (place.open || []).join(', ')].filter(Boolean).join(' · '), place.desc, place.hint ? 'Teaser while undiscovered: ' + place.hint : null, here.length ? '**Usually here:** ' + here.join('; ') : null].filter(Boolean).join('\n\n'));
  }
  if (track) {
    parts.push(['## Track: ' + track.name + ' (`' + track.id + '`)', [track.kind, [].concat(track.skill || []).join('/'), track.levels ? track.levels + ' level(s): ' + track.level_names : null, track.ranks ? 'ranks: ' + track.ranks : null, track.due ? track.due + ' required visits per term' : null].filter(Boolean).join(' · '), track.desc,
      (track.teaches || []).length ? '**Teaches:** ' + track.teaches.map((x) => (content.spells[x.spell] ? content.spells[x.spell].name : x.spell) + ' (level ' + x.level + ')').join(', ') : null, track.lead ? '**Lead:** ' + npcName(content, track.lead) : null].filter(Boolean).join('\n\n'));
  }
  if (arc) {
    parts.push(['## Arc: ' + arc.name + ' (`' + arc.id + '`, ' + arc.canon + ' canon)', arc.desc, arc.acts ? '**Acts:** ' + arc.acts.map((a) => a.name + ' (year ' + a.year + ')').join(' → ') : null, arc.clues ? '**Clues:** ' + arc.clues.join(', ') + (arc.key_clues ? ' · **key:** ' + arc.key_clues.join(', ') : '') : null,
      'Batch content may read the act for flavour and point toward clue sources. Only hard-canon events grant key clues or move the clock.'].filter(Boolean).join('\n\n'));
  }

  // Lore: keys matched against the topic and the names involved.
  const query = [opt.topic, ...cast.map((id) => content.npcs[id].name), place && place.name, track && track.name, arc && arc.name, ...(arc ? arc.clues || [] : [])].filter(Boolean).join(' ');
  const qw = new Set(words(query).filter((w) => !STOP.has(w) && w.length > 2));
  const ql = query.toLowerCase();
  const scored = Object.values(content.lore).map((l) => {
    let sc = 0;
    for (const k of l.keys || []) { const kl = k.toLowerCase(); if (ql.includes(kl)) sc += 3; else if (words(k).some((w) => qw.has(w))) sc += 1; }
    sc += words(l.text).filter((w) => qw.has(w)).length * 0.2;
    return { l, sc };
  }).filter((x) => x.sc >= 1).sort((a, b) => b.sc - a.sc);
  const lore = scored.map(({ l }) => '- **' + l.keys[0] + '** (`' + l.id + '`, ' + l.canon + '): ' + l.text);

  // Similar events: shared cast, tags and topic words.
  const lines = {}; for (const s of sources) lines[s.path] = s.text.split('\n');
  const src = (e) => { const L = lines[e.file] || []; let end = e.line; while (end < L.length && !L[end].startsWith('@')) end++; return L.slice(e.line - 1, end).join('\n').trimEnd(); };
  const evScore = (e) => {
    let sc = 0;
    if (e.actor && cast.includes(e.actor)) sc += 4;
    for (const id of cast) if (e.id.startsWith(id + '_') || (e.text || '').includes('{' + id)) sc += 2;
    sc += (e.tags || []).filter((t) => qw.has(t)).length * 1.5;
    sc += words(e.title + ' ' + e.text).filter((w) => qw.has(w)).length * 0.3;
    if (track && (e.tags || []).includes(track.kind)) sc += 1;
    return sc;
  };
  const examples = Object.values(content.events).map((e) => ({ e, sc: evScore(e) })).filter((x) => x.sc > 0).sort((a, b) => b.sc - a.sc).slice(0, 3)
    .map(({ e }) => '```grim\n# ' + e.file + ':' + e.line + '\n' + src(e) + '\n```');

  const rules = opt.rules ? '## Rules\n\n' + opt.rules.trim() : '';
  // Assemble within budget: drop lore, then examples, from the end.
  const assemble = (nl, ne) => parts.concat(nl ? ['## Lore\n\n' + lore.slice(0, nl).join('\n')] : [], ne ? ['## Style examples\n\n' + examples.slice(0, ne).join('\n\n')] : [], rules ? [rules] : []).join('\n\n') + '\n';
  let nl = Math.min(lore.length, 12), ne = examples.length;
  let text = assemble(nl, ne);
  while (text.length > budget && (nl > 3 || ne > 1)) { if (nl > 3) nl--; else ne--; text = assemble(nl, ne); }
  return { text, lore: nl, examples: ne, chars: text.length };
}

module.exports = { lorebook, brief, TIERS };
