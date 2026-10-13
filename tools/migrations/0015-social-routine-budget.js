// Phase 3: the same budget fixes as 0013, for the social events 0014 made routine (they were windfalls, so
// their options were often pure gains). Same rules:
//   free  — a pure gain with no cost or risk: add the smallest cost that fits what it gives
//           (skill → health -tiny, the effort; rel/spark/mood → gold -tiny, the treat; else mood -tiny);
//   over  — worth more than ±1.5 medium-equivalents: the first top-level gain of medium or more steps down
//           one tier (else the first small gain becomes tiny).
// The worklist is the lint output at the time (file, event line, option key, kind).
'use strict';
const WORK = [["content/events/expansion_faculty.grim", 30, "left", "free"], ["content/events/expansion_faculty.grim", 105, "left", "free"], ["content/events/expansion_faculty.grim", 105, "left", "over"], ["content/events/expansion_faculty.grim", 105, "right", "free"], ["content/events/expansion_faculty.grim", 105, "right", "over"], ["content/events/expansion_faculty.grim", 152, "right", "free"], ["content/events/expansion_faculty.grim", 179, "left", "free"], ["content/events/expansion_faculty.grim", 179, "right", "free"], ["content/events/expansion_faculty.grim", 199, "left", "free"], ["content/events/expansion_faculty.grim", 199, "right", "free"], ["content/events/expansion_people.grim", 9, "left", "free"], ["content/events/expansion_people.grim", 9, "right", "free"], ["content/events/expansion_people.grim", 108, "left", "free"], ["content/events/expansion_people.grim", 108, "right", "free"], ["content/events/expansion_people.grim", 180, "left", "free"], ["content/events/expansion_people.grim", 180, "left", "over"], ["content/events/expansion_people.grim", 180, "right", "free"], ["content/events/expansion_people.grim", 281, "left", "free"], ["content/events/expansion_people.grim", 281, "left", "over"], ["content/events/expansion_people.grim", 281, "right", "free"], ["content/events/expansion_people.grim", 435, "left", "free"], ["content/events/expansion_people.grim", 435, "right", "free"], ["content/events/expansion_people.grim", 457, "left", "free"], ["content/events/expansion_people.grim", 457, "left", "over"], ["content/events/expansion_people.grim", 457, "right", "free"], ["content/events/expansion_people.grim", 510, "left", "free"], ["content/events/expansion_people.grim", 510, "right", "free"], ["content/events/expansion_people.grim", 533, "right", "free"], ["content/events/expansion_social.grim", 5, "left", "free"], ["content/events/expansion_social.grim", 5, "right", "free"], ["content/events/expansion_social.grim", 72, "left", "free"], ["content/events/expansion_social.grim", 72, "right", "free"], ["content/events/expansion_social.grim", 94, "left", "free"], ["content/events/expansion_social.grim", 94, "right", "free"], ["content/events/expansion_social.grim", 117, "left", "free"], ["content/events/expansion_social.grim", 117, "right", "free"], ["content/events/expansion_social.grim", 188, "left", "free"], ["content/events/expansion_social.grim", 188, "right", "free"], ["content/events/expansion_summer.grim", 104, "left", "free"], ["content/events/expansion_summer.grim", 104, "right", "free"], ["content/events/people_others.grim", 8, "left", "free"], ["content/events/people_others.grim", 8, "right", "free"], ["content/events/people_others.grim", 8, "right", "over"], ["content/events/people_others.grim", 28, "left", "free"], ["content/events/people_others.grim", 28, "right", "free"], ["content/events/people_others.grim", 153, "left", "free"], ["content/events/people_others.grim", 153, "right", "free"], ["content/events/people_others.grim", 270, "left", "free"], ["content/events/people_others.grim", 270, "right", "free"], ["content/events/people_others.grim", 290, "left", "free"], ["content/events/people_others.grim", 290, "right", "free"], ["content/events/people_others.grim", 363, "left", "free"], ["content/events/people_others.grim", 363, "left", "over"], ["content/events/people_others.grim", 363, "right", "free"], ["content/events/people_others.grim", 363, "right", "over"], ["content/events/people_others.grim", 439, "left", "free"], ["content/events/people_others.grim", 439, "right", "free"], ["content/events/people_students.grim", 37, "left", "free"], ["content/events/people_students.grim", 37, "right", "free"], ["content/events/people_students.grim", 251, "left", "free"], ["content/events/people_students.grim", 251, "right", "free"], ["content/events/people_students.grim", 251, "right", "over"], ["content/events/people_students.grim", 389, "left", "free"], ["content/events/people_students.grim", 389, "right", "free"], ["content/events/people_students.grim", 389, "right", "over"], ["content/events/people_students.grim", 487, "right", "free"], ["content/events/people_students.grim", 652, "left", "free"], ["content/events/people_students.grim", 652, "right", "free"], ["content/events/people_students.grim", 773, "left", "free"], ["content/events/people_students.grim", 773, "right", "free"], ["content/events/social.grim", 12, "left", "free"], ["content/events/social.grim", 12, "right", "free"], ["content/events/social.grim", 120, "left", "free"], ["content/events/social.grim", 120, "right", "free"], ["content/events/social.grim", 239, "left", "free"], ["content/events/social.grim", 239, "right", "free"], ["content/events/social.grim", 322, "left", "free"], ["content/events/social.grim", 322, "right", "free"], ["content/events/social.grim", 346, "left", "free"], ["content/events/social.grim", 346, "right", "free"], ["content/events/social.grim", 437, "left", "free"], ["content/events/social.grim", 437, "right", "free"]];
const SKILLS = ['arcana', 'lore', 'alchemy', 'charm', 'vigor', 'guile'];
const DOWN = { huge: 'large', large: 'medium', medium: 'small', small: 'tiny' };
module.exports = {
  id: '0015-social-routine-budget',
  description: 'the social events made routine by 0014: same budget fixes as 0013',
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
