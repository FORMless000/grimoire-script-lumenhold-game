'use strict';
/*
 * `grim leads` (feedback 2026-10-15): "hinted now, act later" pairs that could use a lead in the Clues panel.
 *
 * A pair is a flag one card sets (`flag x`) and a later card reads in its `when:` (`flag(x)` / `has(x)`), where that
 * later card waits somewhere the player has to choose to go: a place, a track or a slot. Each pair is marked when it
 * already has a lead: the setter `find`s a `kind: lead` @clue whose `followed:` names the reader (or the flag).
 *
 *   node tools/grim.js leads [--all]     pairs without a lead (--all: every pair)
 */
const G = require('../src/grimoire.js');

// What a `when:` waits for, positively: flags (`flag(x)`, `has(x)`), and earlier cards (`seen(x) > 0`, `chosen(x, k)`).
// A negated test (`not flag(x)`, `seen(x) == 0`) is a gate, not something to follow.
function waitsFor(src) {
  const flags = new Set(), events = new Set(); let m;
  src = src || '';
  const re = /(\bnot\s+)?\b(flag|has|seen|chosen)\(\s*([a-z0-9_]+)\s*(?:,[^)]*)?\)\s*(==\s*0|<\s*1|<=\s*0|>\s*0|>=\s*1)?/g;
  while ((m = re.exec(src))) {
    if (m[1]) continue;
    if (m[2] === 'seen') { if (m[4] && /^(>|>=)/.test(m[4])) events.add(m[3]); }
    else if (m[2] === 'chosen') events.add(m[3]);
    else flags.add(m[3]);
  }
  return { flags, events };
}

function leads(content) {
  const setters = {}, finds = {};
  const states = new Set(Object.keys(content.states || {}));
  for (const e of Object.values(content.events)) {
    const blocks = [e.on_show || []].concat(e.options.map((o) => o.effects));
    for (const b of blocks) G.walkEffects(b, (st) => {
      if (st.t === 'flag') for (const n of [].concat(st.names || st.name || [])) (setters[n] = setters[n] || new Set()).add(e.id);
      if (st.t === 'find') (finds[e.id] = finds[e.id] || new Set()).add(st.clue);
    });
  }
  const leadFor = (setter, reader, flag) => [...(finds[setter] || [])].some((c) => {
    const d = content.clues[c]; if (!d || d.kind !== 'lead') return false;
    const f = (d.followed && d.followed.src) || '';
    return true;   // any lead the setter leaves counts: its text says where to look
  });
  const pairs = [];
  for (const e of Object.values(content.events)) {
    const where = e.place ? 'place ' + e.place : e.track ? 'track ' + e.track : e.slot ? 'slot ' + e.slot : null;
    if (!where || !e.when) continue;
    const w = waitsFor(e.when.src);
    for (const f of w.flags) {
      if (states.has(f) || !setters[f]) continue;
      for (const s of setters[f]) if (s !== e.id) pairs.push({ flag: f, setter: s, reader: e.id, where, lead: leadFor(s, e.id, f), plot: !!(e.arc || content.events[s].arc) });
    }
    for (const s of w.events) if (s !== e.id && content.events[s]) pairs.push({ flag: 'seen ' + s, setter: s, reader: e.id, where, lead: leadFor(s, e.id, s), plot: !!(e.arc || content.events[s].arc) });
  }
  return pairs;
}

function report(content, all) {
  const pairs = leads(content).filter((p) => all || !p.lead);
  const lines = pairs.map((p) => (p.lead ? '✓ ' : '  ') + p.setter + ' → ' + p.reader + '  [' + p.flag + '; ' + p.where + (p.plot ? '; plot' : '') + ']');
  return lines.join('\n') + '\n' + pairs.length + ' pair(s)' + (all ? '' : ' without a lead') + '; ' + leads(content).filter((p) => p.lead).length + ' with one';
}

module.exports = { leads, report };
