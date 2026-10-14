// Playtest 2, step 3 (L-1): the economy on the finished mechanics.
//   L24: tuition 30 → 16 a term; noble and merchant families pay their child's tuition instead of most of their
//        cash (allowance and purse cut); the scholarship halves it (8) and its stipend is 2 while the GPA holds.
//   L25: the thesis asks 2 visits a term (was 3).
//   L26: internships pay a stipend through their host cards: `pay: 18` and `wage` in every option.
'use strict';
const ORIGIN = {
  origin_noble: { tick: [/^  gold \+6$/, '  gold +1'], add: [/^  gold \+60$/, '  gold +40'],
    money: 'Comfortable: your family pays your tuition, and there are some savings. You will rarely need to work.' },
  origin_merchant: { tickRemove: /^  gold \+3$/, add: [/^  gold \+90$/, '  gold +70'],
    money: 'Comfortable: the company pays your tuition, and you arrive with the largest purse.' },
  origin_scholar: { tick: [/^    gold \+5$/, '    gold +2'],
    money: 'Tight: half tuition, and a small stipend while your GPA stays at 2.0 or above. Expect to work some terms.' },
  origin_hedge: { money: 'Poor: a few crowns, no allowance, and tuition to pay yourself. You will need a job from the first term.' },
  origin_street: { money: 'Poor: almost nothing in your pockets, and tuition to pay yourself. You will need a job from the first term.' },
};
const INTERNSHIPS = new Set(['intern_royal_library', 'intern_conclave', 'intern_alchemists', 'intern_expedition', 'intern_field_station', 'intern_thornwick', 'intern_unseen_office']);
module.exports = {
  id: '0028-economy',
  description: 'origins sponsor tuition, lower tuition, thesis due 2, internship stipends (L24, L25, L26)',
  run(ctx) {
    const files = ctx.project.compileAll().sources.map((s) => s.path).filter((f) => f.endsWith('.grim'));
    let wages = 0;
    for (const file of files) {
      const L = ctx.lines(file);
      let block = null, id = null, inTick = false, inAdd = false, internEvent = false;
      L.forEach((l, i) => {
        const at = { file, line: i + 1 };
        let m;
        if ((m = l.match(/^@(\w+) ([a-z0-9_]+)$/))) { block = m[1]; id = m[2]; inTick = inAdd = false; internEvent = false; return; }
        if (/^@/.test(l)) { block = id = null; return; }
        if (/^[a-z_]+:/.test(l)) { inTick = /^tick:/.test(l); inAdd = /^on_add:/.test(l); }
        // origins
        if (block === 'state' && ORIGIN[id]) {
          const o = ORIGIN[id];
          if (/^money:/.test(l)) ctx.edit(at, 'money: ' + o.money);
          if (inTick && o.tick && o.tick[0].test(l)) ctx.edit(at, l.replace(o.tick[0], o.tick[1]));
          if (inTick && o.tickRemove && o.tickRemove.test(l)) ctx.remove(at);
          if (inAdd && o.add && o.add[0].test(l)) ctx.edit(at, l.replace(o.add[0], o.add[1]));
          if (o.tickRemove && /^tick:$/.test(l) && L[i + 1] && o.tickRemove.test(L[i + 1]) && !/^  /.test(L[i + 2] || '')) ctx.remove(at);
        }
        // tuition
        if (block === 'hook' && id === 'tuition') {
          if (/^  else:$/.test(l)) ctx.edit(at, '  elif not (has(origin_noble) or has(origin_merchant)):');
          if (/^    gold -15$/.test(l)) ctx.edit(at, '    gold -8');
          if (/^    gold -30$/.test(l)) ctx.edit(at, '    gold -16');
        }
        // the thesis
        if (block === 'track' && id === 'thesis' && /^due: 3$/.test(l)) ctx.edit(at, 'due: 2');
        // internships
        if (block === 'track' && INTERNSHIPS.has(id) && /^skill:/.test(l)) ctx.insertAfter(at, 'pay: 18');
        if (block === 'event' && (m = l.match(/^track: ([a-z_]+)$/)) && INTERNSHIPS.has(m[1])) internEvent = true;
        if (block === 'event' && internEvent && /^> [a-z0-9_]+:/.test(l)) { ctx.insertAfter(at, '  wage'); wages++; }
      });
    }
    ctx.report('origins, tuition and the thesis retuned; ' + wages + ' internship options pay a stipend');
  },
};
