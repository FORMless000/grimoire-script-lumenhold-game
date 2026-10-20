// Club and job spell chains run faster (feedback 2026-10-19): a chain card that does its part pulls the next one into
// the same visit, so a visit plays two beats of the chain instead of one.
//   - The start card's accepting option (the one that sets <spell>_chain) queues the first preparation card `now`.
//   - A preparation card's working option (the one that can set its flag) queues, once per visit (`chain_beat`), the
//     final when it is ready (two preparations done) or else the next preparation not yet done.
//   - The final no longer waits two months after the start (one is enough), and its fallback comes at four months, not six.
// A card queued `now` re-checks its `when`, so a beat that no longer fits is dropped quietly. Measured shape: start and
// a preparation on the first visit, a preparation and the final on the second.
'use strict';
const FILE = 'content/events/club_spell_chains.grim';
module.exports = {
  id: '0035-chain-beats',
  description: 'Club and job spell chains: two beats a visit, the final sooner',
  run(ctx) {
    const L = ctx.lines(FILE);
    // Events in file order: {id, at (0-based header line), end, when: {k, text}, trigger, options: [{at, end, body}]}
    const evs = [];
    for (let k = 0; k < L.length; k++) {
      const m = /^@event\s+(\S+)/.exec(L[k]);
      if (m) evs.push({ id: m[1], at: k, options: [] });
    }
    evs.forEach((e, i) => {
      e.end = i + 1 < evs.length ? evs[i + 1].at : L.length;
      while (e.end > e.at && (/^\s*$/.test(L[e.end - 1]) || /^#/.test(L[e.end - 1]))) e.end--;
      for (let k = e.at; k < e.end; k++) {
        if (/^when:/.test(L[k])) e.when = { k, text: L[k].slice(5).trim() };
        if (/^trigger:\s*auto/.test(L[k])) e.auto = true;
        if (/^> /.test(L[k])) e.options.push({ at: k });
      }
      e.options.forEach((o, j) => {
        o.end = j + 1 < e.options.length ? e.options[j + 1].at : e.end;
        while (o.end > o.at && /^\s*$/.test(L[o.end - 1])) o.end--;
        o.body = L.slice(o.at + 1, o.end).join('\n');
      });
    });
    // Chains: a start card (trigger auto) and the cards up to the next start.
    const chains = [];
    for (const e of evs) { if (e.auto) chains.push({ start: e, preps: [], final: null }); else if (chains.length) chains[chains.length - 1].preps.push(e); }
    for (const c of chains) {
      c.final = c.preps.find((e) => /since\(/.test(e.when.text));
      c.preps = c.preps.filter((e) => e !== c.final).map((e) => ({ e, flag: (/not flag\((\w+)\)/.exec(e.when.text) || [])[1] })).filter((p) => p.flag);
      const chainFlag = (/not flag\((\w+_chain)\)/.exec(c.start.when.text) || [])[1];
      if (!c.final || c.preps.length !== 3 || !chainFlag) { ctx.report('skipped chain at ' + c.start.id); continue; }
      if (/chain_beat/.test(c.start.options.map((o) => o.body).join('\n'))) { ctx.report('already done: ' + c.start.id); continue; }
      const S = c.start.id, flags = c.preps.map((p) => 'flag(' + p.flag + ')').join(' + ');
      // Start: the accepting option queues the first preparation.
      const accept = c.start.options.find((o) => new RegExp('\\bflag ' + chainFlag + '\\b').test(o.body));
      ctx.insertAfter({ file: FILE, line: accept.end }, '  chain_beat = turn\n  queue ' + c.preps[0].e.id + ' now');
      // Preparations: the working option queues one more beat, once a visit.
      for (const p of c.preps) {
        const others = c.preps.filter((q) => q !== p);
        for (const o of p.e.options.filter((x) => new RegExp('\\bflag ' + p.flag + '\\b').test(x.body))) {
          const lines = ['  if chain_beat != turn:', '    chain_beat = turn', '    if since(' + S + ') >= 1 and ' + flags + ' >= 2:', '      queue ' + c.final.id + ' now'];
          for (const q of others) lines.push('    elif not flag(' + q.flag + '):', '      queue ' + q.e.id + ' now');
          ctx.insertAfter({ file: FILE, line: o.end }, lines.join('\n'));
        }
      }
      // The final: one month after the start, the fallback at four.
      ctx.edit({ file: FILE, line: c.final.when.k + 1 }, (l) => l.replace('since(' + S + ') >= 2', 'since(' + S + ') >= 1').replace('since(' + S + ') >= 6', 'since(' + S + ') >= 4'));
      ctx.report(S + ': ' + c.preps.map((p) => p.e.id).join(', ') + ' → ' + c.final.id);
    }
  },
};
