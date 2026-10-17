'use strict';
/*
 * `grim leads` (feedback 2026-10-15): "hinted now, act later" pairs that could use a lead in the Clues panel.
 *
 * A pair is a flag one card sets (`flag x`) and a later card reads in its `when:` (`flag(x)` / `has(x)`), where that
 * later card waits somewhere the player has to choose to go: a place, a track or a slot. Each pair is marked when it
 * already has a lead: the setter `find`s a `kind: lead` @clue whose `followed:` names the reader (or the flag).
 *
 *   node tools/grim.js leads [--all]     pairs without a lead (--all: every pair)
 *   node tools/grim.js leads --queued [--out <file>]
 *                                        timed follow-ups (`queue x in N`, `within`, `by month`; not `now`, not at odds),
 *                                        the candidates to turn into leads the player acts on (feedback 2026-10-16, §6).
 *                                        `act` marks a payoff the player would plausibly go and do: the card waits on a
 *                                        meeting, a place or a time, or asks for a check.
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

// Timed follow-ups: every `queue x in N` / `within a..b` / `by month m` without odds, from events, states and hooks.
const ACT_RE = /\b(meet(s|ing)?|come (to|by|and)|visit|go (to|and|back)|waiting (for you )?(at|by|in|on)|tonight|tomorrow|at midnight|the next time|when you('re| are) ready)\b/i;
function queued(content) {
  const out = [];
  const scan = (from, kind, effects, sayText) => G.walkEffects(effects || [], (st) => {
    if (st.t !== 'queue' || st.now || st.chance != null || st.chanceWord || st.tagged) return;
    const timed = st.window || st.byMonth || !st.delay || !(st.delay.ast && st.delay.ast.t === 'num' && st.delay.ast.v === 0);
    if (!timed) return;
    const target = content.events[st.event]; if (!target) return;
    const when = st.window ? 'within ' + st.window.from + '..' + st.window.to : st.byMonth ? 'by month ' + st.byMonth : 'in ' + (st.delay ? st.delay.src : '1');
    const prose = (target.text || '') + ' ' + (sayText || '');
    const act = ACT_RE.test(prose) || target.options.some((o) => { let c = false; G.walkEffects(o.effects, (x) => { if (x.t === 'challenge') c = true; }); return c; });
    out.push({ from, kind, target: st.event, when, act, file: (content.events[from] || {}).file || null });
  });
  for (const e of Object.values(content.events)) {
    scan(e.id, 'event', e.on_show);
    for (const o of e.options) { let say = ''; G.walkEffects(o.effects, (x) => { if (x.t === 'say') say += ' ' + x.text; }); scan(e.id, 'event', o.effects, say); }
  }
  for (const d of Object.values(content.states || {})) for (const k of ['on_add', 'tick', 'on_expire', 'on_remove']) scan(d.id, 'state', d[k]);
  for (const h of Object.values(content.hooks || {})) scan(h.id, 'hook', h.do);
  return out;
}
function queuedReport(content) {
  const rows = queued(content);
  const lines = ['# Timed follow-ups: candidates to turn into leads (grim leads --queued)', '',
    'Each row is a `queue` with a delay and no odds. "act" marks a payoff the player would go and do (a meeting, a place, a time, a check): the first candidates to become a lead and a card where the player goes, the way the silver key became one (feedback 2026-10-16, §5.1).', '',
    '| act | from | queues | when | file |', '|---|---|---|---|---|'];
  for (const r of rows.sort((a, b) => (b.act - a.act) || a.from.localeCompare(b.from))) lines.push('| ' + (r.act ? 'act' : '') + ' | ' + r.kind + ' `' + r.from + '` | `' + r.target + '` | ' + r.when + ' | ' + (r.file || '') + ' |');
  lines.push('', rows.length + ' timed follow-up(s); ' + rows.filter((r) => r.act).length + ' marked act.');
  return lines.join('\n') + '\n';
}

module.exports = { leads, report, queued, queuedReport };
