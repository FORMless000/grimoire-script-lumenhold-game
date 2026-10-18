// Spells v2 (docs/spells-v2-list.md §K): Tide, Mirror and Beast-speech are cut. Their practice lessons are retired the
// 0001 way (text and translations kept, `when: false`, tag `retired`), since saves and `seen()` may name them. The other
// uses of the cut spells (up[] options, milestones that taught them) are rewritten by hand: they need new text.
'use strict';
const RETIRE = { lesson_tide: 'tide', lesson_mirror: 'mirror', lesson_beast_speech: 'beast_speech' };
module.exports = {
  id: '0033-spells-v2',
  description: 'Retire the practice lessons of the spells v2 cut (Tide, Mirror, Beast-speech)',
  run(ctx) {
    const blockLines = (row) => {
      const lines = ctx.lines(row.file), out = [];
      for (let i = row.line; i < lines.length && (i === row.line || !lines[i].startsWith('@')); i++) out.push({ n: i + 1, text: lines[i] });
      return out;
    };
    for (const [id, spell] of Object.entries(RETIRE)) {
      const row = ctx.query('event', 'id == "' + id + '"')[0];
      if (!row) { ctx.report('not found: ' + id); continue; }
      const lines = blockLines(row);
      const when = lines.find((l) => /^when:/.test(l.text));
      const tags = lines.find((l) => /^tags:/.test(l.text));
      if (!when || /^when:\s*false/.test(when.text)) { ctx.report('already retired: ' + id); continue; }
      ctx.insertAfter({ file: row.file, line: row.line }, '# retired by spells v2 (was "' + when.text.replace(/^when:\s*/, '') + '"): ' + spell + ' is cut');
      ctx.edit({ file: row.file, line: when.n }, 'when: false');
      if (tags) ctx.edit({ file: row.file, line: tags.n }, (l) => (/\bretired\b/.test(l) ? l : l + ' retired'));
      else ctx.insertAfter({ file: row.file, line: when.n }, 'tags: retired');
      ctx.report('retired ' + id);
    }
  },
};
