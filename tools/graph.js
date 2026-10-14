// The event graph (playtest 2, A2): what a block produces (queues, flags, states, clues, arc steps, tracks, places,
// characters met, spells) and what it reads (its `when`, `defer`, option `when`s and `if` conditions), joined into
// edges. `grim graph <id>` prints, for one block, who leads to it (queues it, or sets what its gates read) and what it
// leads to (what it queues, and who reads what it sets). Queues at odds show their odds.
'use strict';
const G = require('../src/grimoire.js');

// Symbol arguments by function: which kind of thing a read names.
const READS = {
  flag: 'flag', has: 'flagOrState', left: 'state', clue: 'clue', clock: 'arc', clues: 'arc', act: 'arc',
  member: 'track', enrolled: 'track', applied: 'track', passed: 'track', level: 'track', rank: 'track', performance: 'track', progress: 'track', due: 'track', visits: 'track',
  seen: 'event', since: 'event', chosen: 'event', discovered: 'place', visits_to: 'place', met: 'npc', spell_level: 'spell', knows: 'fact',
};

function blocksOf(content) {
  const out = [];
  for (const e of Object.values(content.events)) out.push({ kind: 'event', id: e.id, def: e, effects: [['on_show', e.on_show || []], ...e.options.map((o) => ['option ' + o.key, o.effects])], exprs: [['when', e.when], ['defer', e.defer], ...e.options.map((o) => ['option ' + o.key + ' when', o.when])] });
  for (const s of Object.values(content.states)) out.push({ kind: 'state', id: s.id, def: s, effects: ['tick', 'on_add', 'on_expire', 'on_remove'].map((k) => [k, s[k] || []]), exprs: [] });
  for (const h of Object.values(content.hooks)) out.push({ kind: 'hook', id: h.id, def: h, effects: [['do', h.do || []]], exprs: [['when', h.when]] });
  return out;
}

// Everything a block produces: [{ token, via, note }].
function produces(b) {
  const out = [];
  for (const [via, effs] of b.effects) G.walkEffects(effs, (st) => {
    const add = (token, note) => out.push({ token, via, note: note || '' });
    switch (st.t) {
      case 'queue': add('event:' + st.event, st.chance != null ? 'chance ' + st.chance + '%' : st.now ? 'now' : ''); break;
      case 'flag': for (const n of st.names) add('flag:' + n); break;
      case 'gain': add('state:' + st.state); break;
      case 'find': add('clue:' + st.clue); break;
      case 'advance': add('arc:' + st.arc, '+' + st.n); break;
      case 'enrol': case 'join': case 'apply': add('track:' + st.track, st.t); break;
      case 'discover': add('place:' + st.place); break;
      case 'meet': add('npc:' + st.npc); break;
      case 'learn_spell': add('spell:' + st.spell); break;
    }
  });
  return out;
}

// Everything a block reads: [{ token, via }]. `has(x)` reads a flag or a state.
function reads(b, content) {
  const out = [];
  const scan = (ex, via) => ex && G.walkAst(ex.ast, (n) => {
    if (n.t !== 'call' || !READS[n.n] || !n.args[0] || n.args[0].t !== 'sym') return;
    const v = n.args[0].v, k = READS[n.n];
    out.push({ token: (k === 'flagOrState' ? (content.states[v] ? 'state' : 'flag') : k) + ':' + v, via });
  });
  for (const [via, ex] of b.exprs) scan(ex, via);
  for (const [via, effs] of b.effects) G.walkEffects(effs, (st) => { if (st.t === 'if') st.branches.forEach((br) => scan(br.cond, via + ' if')); });
  return out;
}

function build(content) {
  const blocks = blocksOf(content), by = {}, prod = {}, read = {};
  for (const b of blocks) {
    by[b.kind + ':' + b.id] = b;
    for (const p of produces(b)) (prod[p.token] = prod[p.token] || []).push({ from: b, ...p });
    for (const r of reads(b, content)) (read[r.token] = read[r.token] || []).push({ to: b, ...r });
  }
  // The engine pushes these by name (@game) or by trigger.
  const engineRefs = { exam: 'pushed for each enrolled course in a term\'s last month', off_shift: 'pushed on the first visit after a term\'s last shift', spark_cooldown: 'pushed when spark crosses the cooldown mark', origins: 'the origin screen' };
  for (const [k, why] of Object.entries(engineRefs)) if (content.game[k]) (prod['event:' + content.game[k]] = prod['event:' + content.game[k]] || []).push({ from: { kind: 'engine', id: '@game ' + k }, via: why, note: '' });
  for (const id of ['track_warning', 'track_promotion', 'job_term_review']) (prod['event:' + id] = prod['event:' + id] || []).push({ from: { kind: 'engine', id: 'term end' }, via: 'track notice', note: '' });
  return { blocks, by, prod, read };
}

function describe(content, id) {
  const g = build(content);
  const b = g.by['event:' + id] || g.by['state:' + id] || g.by['hook:' + id];
  if (!b) return null;
  const lines = [];
  const name = (x) => x.kind + ' ' + x.id;
  const e = b.def;
  lines.push(name(b) + (b.kind === 'event' ? '  (trigger ' + (e.trigger || 'random') + (e.class ? ', ' + e.class : '') + (e.place ? ', place ' + e.place : '') + (e.track ? ', track ' + e.track : '') + (e.plan ? ', plan ' + e.plan : '') + (e.slot ? ', slot ' + e.slot : '') + ')' : ''));
  const self = b.kind + ':' + b.id;
  lines.push('\nleads here:');
  const inbound = (g.prod[self] || []).map((p) => '  ' + name(p.from) + ' — ' + p.via + (p.note ? ' (' + p.note + ')' : ''));
  if (b.kind === 'event' && e.trigger === 'auto') inbound.push('  auto: pushed whenever its `when` holds' + (e.when ? ': ' + e.when.src : ''));
  if (b.kind === 'state') for (const p of g.prod['state:' + b.id] || []) inbound.push('  ' + name(p.from) + ' — ' + p.via);
  lines.push(...(inbound.length ? [...new Set(inbound)] : ['  (drawn from a pool; no block leads here by name)']));
  const rd = reads(b, content);
  if (rd.length) {
    lines.push('\ngates (what it reads, and who sets it):');
    for (const r of rd) {
      const set = (g.prod[r.token] || []).map((p) => name(p.from));
      lines.push('  ' + r.token + ' [' + r.via + '] ← ' + (set.length ? [...new Set(set)].slice(0, 8).join(', ') + (set.length > 8 ? ' …+' + (set.length - 8) : '') : '(nothing sets it)'));
    }
  }
  const pr = produces(b);
  if (pr.length) {
    lines.push('\nleads to (what it produces, and who reads it):');
    for (const p of pr) {
      const by = (g.read[p.token] || []).map((r) => name(r.to));
      lines.push('  ' + p.token + ' [' + p.via + (p.note ? ', ' + p.note : '') + '] → ' + (p.token.startsWith('event:') ? 'shows ' + p.token.slice(6) : by.length ? [...new Set(by)].slice(0, 8).join(', ') + (by.length > 8 ? ' …+' + (by.length - 8) : '') : '(nothing reads it)'));
    }
  }
  return lines.join('\n');
}

module.exports = { build, describe, produces, reads };
