/*
 * Converter: decks of queued cards drawn by tag -> threads `from: scene` (migration 0048; the template is in
 * content/core/templates.grim).
 *
 * Detection is structural: every tag T that some `queue any tagged T` draws from is a deck, its cards the queued cards
 * tagged T. A deck with a card already in a pool, thread, chain or arc is left alone. Each deck card's `trigger: queued`
 * becomes `thread: <id>` (the scene's step pool gives the trigger), its own `queue any tagged T now` becomes `next`,
 * and every other card's draw from the deck becomes `queue any in <id>`. Cards keep their tags (other things read
 * them). The whole conversion is tried in memory and kept only if every card compiles the same (tools/equiv.js).
 */
'use strict';
const G = require('../../src/grimoire.js');
const Eq = require('../equiv.js');
const L = require('./lib.js');
const { applyInMemory } = require('./quests.js');

// Deck tag -> thread id, where the tag alone doesn't say what the scene is.
const NAMES = { ww: 'ww_delve' };

function plan(content, linesOf, sources) {
  const taken = new Set([].concat(...['threads', 'pools', 'spells', 'arcs', 'tracks', 'places', 'npcs', 'events', 'items'].map((c) => Object.keys(content[c] || {}))));
  const draws = new Map();   // tag -> [{e, line}]
  for (const e of Object.values(content.events)) for (const o of e.options) G.walkEffects(o.effects, (st) => {
    if (st.t === 'queue' && st.tagged) { if (!draws.has(st.tagged)) draws.set(st.tagged, []); draws.get(st.tagged).push({ e, line: st.line }); }
  });
  const scenes = [], report = [];
  for (const [tag, uses] of draws) {
    const deck = G.deckOf(content, { tagged: tag });
    if (deck.some((e) => e.thread || e.chain || e.arc || e.pool || e.specializes)) { report.push({ tag, left: 'a card is already in a pool or storyline' }); continue; }
    const id = L.uniqueId(taken, NAMES[tag] || tag);
    const inDeck = new Set(deck.map((e) => e.id)), edits = [];
    for (const e of deck) {
      const t = L.blockSource(linesOf(e.file), e.line).props.trigger;
      if (!t || t.text !== 'queued') { report.push({ tag, left: e.id + ' has no `trigger: queued` line' }); edits.length = 0; break; }
      edits.push({ file: e.file, line: t.line, edit: 'thread: ' + id });
    }
    if (!edits.length) continue;
    const seen = new Set();
    for (const u of uses) {
      const k = u.e.file + ':' + u.line; if (seen.has(k)) continue; seen.add(k);
      const text = linesOf(u.e.file)[u.line - 1], m = text.match(new RegExp('^(\\s*)queue any tagged ' + tag + '\\b(.*)$'));
      if (!m) { report.push({ tag, left: 'a draw not on one line at ' + k }); edits.length = 0; break; }
      edits.push({ file: u.e.file, line: u.line, edit: m[1] + (inDeck.has(u.e.id) && m[2].trim() === 'now' ? 'next' : 'queue any in ' + id + m[2]) });
    }
    if (!edits.length) continue;
    // The thread goes in the file holding most of its cards, before the first of them there.
    const byFile = {};
    for (const e of deck) byFile[e.file] = (byFile[e.file] || 0) + 1;
    const file = Object.keys(byFile).sort((a, b) => byFile[b] - byFile[a] || a.localeCompare(b))[0];
    const first = Math.min(...deck.filter((e) => e.file === file).map((e) => e.line));
    edits.push({ file, line: L.insertionPoint(linesOf(file), first), after: '@thread ' + id + '\nfrom: scene\n' });
    scenes.push({ id, tag, cards: deck.length, entries: [...new Set(uses.filter((u) => !inDeck.has(u.e.id)).map((u) => u.e.id))], edits });
  }
  // Tried together: every card must compile the same.
  const changed = applyInMemory(linesOf, scenes.flatMap((s) => s.edits));
  const r = G.compile(sources.map((s) => (changed[s.path] != null ? { path: s.path, text: changed[s.path] } : s)));
  const diffs = r.errors.length ? r.errors.map((e) => ({ at: 'error', after: e.message })) : Eq.compare(content, r.content, ['events']);
  return { scenes: diffs.length ? [] : scenes, rejected: diffs.slice(0, 5), report };
}

function apply(ctx, P) {
  for (const s of P.scenes) for (const x of s.edits) {
    if (x.edit != null) ctx.edit({ file: x.file, line: x.line }, x.edit);
    else ctx.insertAfter({ file: x.file, line: x.line }, x.after);
  }
}

module.exports = { plan, apply };
