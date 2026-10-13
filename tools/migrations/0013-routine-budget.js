// Phase 3 (design §8.4, §8.8): the routine budget is a hard invariant. 62 routine options broke it:
//   free  — a pure gain with no cost or risk: add the smallest cost that fits what it gives
//           (skill → health -tiny, the effort; rel/spark/mood → gold -tiny, the treat; else mood -tiny);
//   over  — worth more than ±1.5 medium-equivalents: the first top-level gain of medium or more steps down
//           one tier (else the first small gain becomes tiny).
// The worklist is the lint output at the time (file, event line, option key, kind).
'use strict';
const WORK = [["content/events/classes.grim", 41, "left", "free"], ["content/events/classes.grim", 314, "right", "free"], ["content/events/classes.grim", 568, "left", "free"], ["content/events/classes.grim", 612, "right", "over"], ["content/events/clubs.grim", 68, "right", "free"], ["content/events/clubs.grim", 204, "right", "over"], ["content/events/clubs.grim", 328, "right", "free"], ["content/events/clubs.grim", 434, "right", "free"], ["content/events/clubs.grim", 454, "left", "free"], ["content/events/clubs.grim", 454, "right", "over"], ["content/events/expansion_classes.grim", 159, "right", "free"], ["content/events/expansion_faculty.grim", 8, "left", "free"], ["content/events/expansion_faculty.grim", 8, "left", "over"], ["content/events/expansion_faculty.grim", 54, "left", "free"], ["content/events/expansion_faculty.grim", 76, "right", "free"], ["content/events/expansion_life.grim", 77, "right", "free"], ["content/events/expansion_life.grim", 172, "right", "free"], ["content/events/expansion_people.grim", 30, "right", "free"], ["content/events/expansion_people.grim", 80, "right", "free"], ["content/events/expansion_people.grim", 128, "right", "free"], ["content/events/expansion_people.grim", 152, "left", "free"], ["content/events/expansion_people.grim", 197, "left", "free"], ["content/events/expansion_people.grim", 300, "right", "free"], ["content/events/expansion_people.grim", 354, "right", "free"], ["content/events/expansion_people.grim", 378, "right", "free"], ["content/events/expansion_people.grim", 405, "right", "free"], ["content/events/expansion_social.grim", 209, "left", "free"], ["content/events/expansion_summer.grim", 7, "right", "free"], ["content/events/expansion_summer.grim", 7, "right", "over"], ["content/events/expansion_summer.grim", 32, "right", "free"], ["content/events/expansion_summer.grim", 123, "left", "free"], ["content/events/expansion_summer.grim", 186, "right", "free"], ["content/events/expansion_y3.grim", 184, "left", "free"], ["content/events/expansion_y3.grim", 222, "right", "free"], ["content/events/jobs.grim", 330, "right", "free"], ["content/events/jobs.grim", 330, "right", "over"], ["content/events/life.grim", 198, "right", "free"], ["content/events/life.grim", 233, "right", "free"], ["content/events/life.grim", 433, "left", "free"], ["content/events/life.grim", 535, "left", "over"], ["content/events/life.grim", 722, "right", "free"], ["content/events/life.grim", 744, "right", "free"], ["content/events/life.grim", 766, "right", "free"], ["content/events/life.grim", 808, "left", "free"], ["content/events/people_others.grim", 249, "right", "over"], ["content/events/people_others.grim", 314, "right", "free"], ["content/events/people_others.grim", 410, "right", "free"], ["content/events/people_others.grim", 483, "right", "free"], ["content/events/people_students.grim", 57, "left", "free"], ["content/events/people_students.grim", 85, "right", "over"], ["content/events/people_students.grim", 178, "right", "free"], ["content/events/people_students.grim", 204, "right", "free"], ["content/events/people_students.grim", 315, "right", "free"], ["content/events/people_students.grim", 315, "right", "over"], ["content/events/people_students.grim", 552, "right", "free"], ["content/events/people_students.grim", 789, "left", "free"], ["content/events/people_students.grim", 851, "left", "free"], ["content/events/people_students.grim", 895, "right", "free"], ["content/events/people_students.grim", 947, "right", "free"], ["content/events/people_students.grim", 947, "right", "over"], ["content/events/social.grim", 215, "left", "free"], ["content/events/social.grim", 367, "left", "free"]];
const SKILLS = ['arcana', 'lore', 'alchemy', 'charm', 'vigor', 'guile'];
const DOWN = { huge: 'large', large: 'medium', medium: 'small', small: 'tiny' };
module.exports = {
  id: '0013-routine-budget',
  description: 'routine options within budget: a tiny cost for free gains, one tier off over-budget gains',
  WORK,
  run(ctx) {
    let free = 0, over = 0;
    for (const [file, evLine, key, kind] of WORK) {
      const L = ctx.lines(file);
      let i = L.findIndex((l, k) => k >= evLine - 1 && new RegExp('^>\\s*' + key + '\\s*:').test(l));
      if (i < 0) throw new Error('option not found: ' + file + ':' + evLine + ' ' + key);
      let end = i + 1; while (end < L.length && !/^(> |@|\s*$)/.test(L[end])) end++;
      const body = L.slice(i + 1, end);
      const top = body.map((l, k) => ({ l, k: i + 1 + k })).filter((x) => /^  [a-z]/.test(x.l) && !/^  (hint|when|say|spell|cost|tone|memory|lesson)(\[[a-z_]+\])?:/.test(x.l));
      if (kind === 'free') {
        const txt = body.join('\n');
        const cost = SKILLS.some((s) => new RegExp('^\\s+' + s + ' \\+', 'm').test(txt)) && !/^\s+health \+/m.test(txt) ? 'health -tiny'
          : /^\s+(rel|spark) |^\s+mood \+/m.test(txt) && !/^\s+gold \+/m.test(txt) ? 'gold -tiny' : 'mood -tiny';
        let j = i; while (j + 1 < end && /^  (hint|when|spell|cost):/.test(L[j + 1])) j++;
        ctx.insertAfter({ file, line: j + 1 }, '  ' + cost); free++;
      } else {
        const all = body.map((l, k) => ({ l, k: i + 1 + k }));
        const big = top.find((x) => /^  [a-z_]+( [a-z_]+)? \+(medium|large|huge)$/.test(x.l)) || all.find((x) => /^\s+[a-z_]+( [a-z_]+)? \+(large|huge)$/.test(x.l))
          || all.find((x) => /^\s+[a-z_]+( [a-z_]+)? \+medium$/.test(x.l)) || all.find((x) => /^\s+[a-z_]+( [a-z_]+)? \+small$/.test(x.l));
        if (!big) throw new Error('no gain to trim: ' + file + ':' + (i + 1));
        ctx.edit({ file, line: big.k + 1 }, big.l.replace(/\+(huge|large|medium|small)$/, (m, t) => '+' + DOWN[t])); over++;
      }
    }
    ctx.report(free + ' free option(s) given a tiny cost; ' + over + ' over-budget option(s) trimmed one tier');
  },
};
