// Phase 3: `love` (the v0.2 romance meter) is `spark` since phase 2a; the alias is legacy in schema v1.
// `love x ±n` → `spark x ±n` and `love(x)` → `spark(x)` in conditions and expressions. Prose is untouched:
// only statement lines and function-call syntax change, so translations keep their keys.
'use strict';
const STMT = /^(\s*)love(\s+[a-z_][a-z0-9_]*\s*[+-])/;
const CALL = /\blove\(/g;
module.exports = {
  id: '0003-love-to-spark',
  description: 'love → spark (statements and love(x) calls)',
  run(ctx) {
    let n = 0;
    for (const file of ctx.project.contentFiles()) {
      const lines = ctx.lines(file);
      lines.forEach((text, i) => {
        if (/^\s*#/.test(text)) return;
        let next = text.replace(STMT, '$1spark$2');
        // calls only outside prose fields
        if (!/^\s*(text|title|scene|say(\[[a-z_]+\])?|> [a-z]+(\[[a-z_]+\])?)\s*:/.test(text)) next = next.replace(CALL, 'spark(');
        else next = next.replace(/\{([^{}:]*)\blove\(/g, (m, pre) => '{' + pre + 'spark(');   // {love(x) > 5: …|…} conditions in text
        if (next !== text) { ctx.edit({ file, line: i + 1 }, next); n++; }
      });
    }
    ctx.report(n + ' line(s) changed');
  },
};
