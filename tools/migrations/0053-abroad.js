// Away is away (new maps, round 2, 2026-11-11): while you're off campus only cards that belong where you are are dealt
// (src/engine.js belongsHere). The cards that happen anywhere get the @game `abroad:` tag: sleep, the break menu, the
// year's recaps, letters from home, the registrar's letters, a collapse, an offer. The late bloomer's queued scenes at
// home belong to the countryside (`region: countryside`), where the scholar's home is.
const fs = require('fs');
const path = require('path');

const EVENTS = ['night_sleep', 'break_plan', 'track_promotion', 'track_warning', 'job_term_review', 'grade_appeal', 'crisis_collapse',
  'tamsin_second_letter', 'starfall_at_home', 'y3_offer_letter'];
const POOLS = ['year_recap', 'origin_funding_auto_story', 'career_letter'];
const REGION = ['home_cottage_bloomer_father', 'home_cottage_bloomer_letter', 'home_market_bloomer_charm', 'home_market_bloomer_ice'];

module.exports = {
  id: '0053-abroad',
  description: 'tag the cards that happen anywhere `abroad`; the late bloomer at home is countryside',
  // New dealing behaviour comes with the engine change; the tags and regions themselves are the meaning.
  changesMeaning: true,
  run(ctx) {
    const root = path.join(ctx.project.root, 'content');
    const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.grim') ? [path.join(d, e.name)] : []));
    const want = new Map([...EVENTS.map((id) => ['@event ' + id, 'tag']), ...POOLS.map((id) => ['@pool ' + id, 'tag']), ...REGION.map((id) => ['@event ' + id, 'region'])]);
    const done = new Set();
    for (const file of walk(root)) {
      const rel = path.relative(ctx.project.root, file);
      const L = ctx.lines(rel);
      L.forEach((text, i) => {
        const head = text.trim();
        if (!want.has(head)) return;
        const what = want.get(head);
        let j = i + 1, tagLine = -1;
        for (; j < L.length && L[j].trim() && !/^[@>]/.test(L[j]); j++) if (/^tags:/.test(L[j])) tagLine = j;
        if (what === 'tag') {
          if (tagLine >= 0) ctx.edit({ file: rel, line: tagLine + 1 }, (line) => line.replace(/\s*$/, ' abroad'));
          else ctx.insertAfter({ file: rel, line: i + 1 }, 'tags: abroad');
        } else ctx.insertAfter({ file: rel, line: i + 1 }, 'region: countryside');
        done.add(head);
      });
    }
    const missing = [...want.keys()].filter((k) => !done.has(k));
    if (missing.length) throw new Error('not found: ' + missing.join(', '));
    ctx.report(done.size + ' block(s)');
  },
};
