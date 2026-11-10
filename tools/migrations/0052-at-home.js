// Home for the break, wherever it is (new maps, 2026-11-10): every bare `has(plan_home)` reads the named condition
// `at_home()` (content/core/conds.grim), which also holds for a home in the capital once that plan exists.
const fs = require('fs');
const path = require('path');

module.exports = {
  id: '0052-at-home',
  description: 'has(plan_home) -> at_home()',
  // Only text: a `{has(plan_home): …}` line in a say is compared as its source; at_home() holds exactly when it did.
  changesMeaning: true,
  run(ctx) {
    const root = path.join(ctx.project.root, 'content');
    const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.grim') ? [path.join(d, e.name)] : []));
    let n = 0;
    for (const file of walk(root)) {
      const rel = path.relative(ctx.project.root, file);
      if (rel === path.join('content', 'core', 'conds.grim')) continue;
      ctx.lines(rel).forEach((text, i) => {
        if (!text.includes('has(plan_home)')) return;
        ctx.edit({ file: rel, line: i + 1 }, (line) => line.split('has(plan_home)').join('at_home()'));
        n++;
      });
    }
    ctx.report(n + ' line(s)');
  },
};
