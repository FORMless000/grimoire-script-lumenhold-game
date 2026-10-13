// Phase 3 step 4: events gated on a v0.2 state get the v0.3 structure (design §7.1, §6.1).
//   has(class_x) / has(club_x) / has(job_x) listed in a track's `legacy:` → `track: <track>`;
//   the dropped clubs and jobs move to the place where they happened → `place: <place>`.
// The has() conjunct leaves `when:` (the line goes if nothing is left). Option-level and text uses are
// reported, not rewritten.
'use strict';
const DROPPED = { club_choir: 'great_hall', club_stargazers: 'observatory', club_skyrace: 'flight_field', job_stables: 'stables', job_tutor: 'courtyard' };

function stripConjunct(src, call) {
  const esc = call.replace(/[()]/g, '\\$&');
  if (new RegExp('^\\s*' + esc + '\\s*$').test(src)) return '';
  for (const re of [new RegExp('^\\s*' + esc + '\\s+and\\s+'), new RegExp('\\s+and\\s+' + esc + '(?=\\s*$|\\s+and\\s)')]) {
    if (re.test(src)) { const out = src.replace(re, ''); return /\bor\b/.test(out) && !/^\(.*\)$/.test(out.trim()) && /\bor\b/.test(src.split(call)[0] + src.split(call)[1]) ? null : out.trim(); }
  }
  return null;
}

module.exports = {
  id: '0009-legacy-states-to-tracks',
  description: 'has(class_/club_/job_) gates → track: (or place: for the dropped clubs and jobs)',
  DROPPED, stripConjunct,
  run(ctx) {
    const c = ctx.content;
    const legacy = {};
    for (const t of Object.values(c.tracks)) for (const st of t.legacy || []) legacy[st] = t.id;
    const by = {}, edited = new Set();
    for (const e of Object.values(c.events)) {
      if (!e.when || !e.when.src) continue;
      const m = e.when.src.match(/\bhas\(((?:class|club|job)_[a-z_]+)\)/);
      if (!m) continue;
      const st = m[1], track = legacy[st], place = DROPPED[st];
      if (!track && !place) { ctx.report('no target for ' + st + ' in ' + e.id); continue; }
      if ((track && e.track) || (place && e.place)) continue;
      const lines = ctx.lines(e.file);
      let n = e.line;   // 1-based header line; find the when: line inside the block
      while (n < lines.length && !/^when:/.test(lines[n]) && !lines[n].startsWith('@') && !lines[n].startsWith('>')) n++;
      if (!/^when:/.test(lines[n] || '')) { ctx.report('no top-level when in ' + e.id); continue; }
      const rest = stripConjunct(lines[n].replace(/^when:\s*/, ''), 'has(' + st + ')');
      if (rest == null) continue;   // left to the substitution below
      const field = track ? 'track: ' + track : 'place: ' + place;
      edited.add(e.file + ':' + (n + 1));
      if (rest === '') ctx.edit({ file: e.file, line: n + 1 }, field);
      else { ctx.edit({ file: e.file, line: n + 1 }, 'when: ' + rest); ctx.insertAfter({ file: e.file, line: n + 1 }, field); }
      by[track || place] = (by[track || place] || 0) + 1;
    }
    ctx.report(Object.entries(by).map(([k, v]) => k + ' ' + v).join(', '));
    // Everything else (complex whens, option whens, text conditions): an equivalent v0.3 condition.
    const subst = (st) => {
      const t = legacy[st];
      if (t) return c.tracks[t].kind === 'course' ? '(enrolled(' + t + ') or passed(' + t + ', 1))' : 'member(' + t + ')';
      if (DROPPED[st]) return 'visits_to(' + DROPPED[st] + ') >= 3';
      return null;
    };
    const files = [...new Set(Object.values(c.events).map((e) => e.file))];
    let n2 = 0;
    for (const f of files) {
      const lines = ctx.lines(f);
      lines.forEach((l, i) => {
        if (!/\bhas\((?:class|club|job)_/.test(l) || edited.has(f + ':' + (i + 1))) return;
        const out = l.replace(/\bhas\(((?:class|club|job)_[a-z_]+)\)/g, (m0, st) => subst(st) || m0);
        if (out !== l) { ctx.edit({ file: f, line: i + 1 }, out); n2++; }
      });
    }
    ctx.report(n2 + ' other has() condition(s) rewritten');
  },
};
