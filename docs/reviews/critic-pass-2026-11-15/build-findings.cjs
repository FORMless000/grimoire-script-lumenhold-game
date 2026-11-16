'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
const p = JSON.parse(fs.readFileSync(path.join(__dirname, 'progress.json')));
const rows = new Map(p.queue.map(row => [row.id, row]));
const reports = p.verdictsWritten.map(file => ({ file, report: JSON.parse(fs.readFileSync(path.join(root, file))) }));
const count = reports.reduce((sum, { report }) => sum + report.issues.length, 0);
const link = id => { const r = rows.get(id); return r ? '[' + id + '](' + path.join(root, r.file) + ':' + r.line + ')' : id; };
let out = '# Independent critic findings\n\n' + count + ' findings from the completed 644-card pass. Shared findings are written once and list the other affected cards. These are review requests; no source repairs have been applied.\n\n';
out += 'Scope and validation: [review ledger](progress.json), [completion audit](completion-audit.json), [method and evidence](README.md). The project has 2,147 active definitions, or 2,187 including 40 retired/disabled definitions.\n\n';
for (const { file, report } of reports) {
  out += '## ' + report.batch + '\n\n';
  out += '**' + (report.accept ? 'Accepted' : 'Revise') + '** · ' + report.scope.reviewedEventIds.length + ' cards · ' + report.issues.length + ' findings · [JSON verdict](' + path.join(root, file) + ')\n\n' + report.summary + '\n\n';
  for (const issue of report.issues) {
    out += '### ' + link(issue.event) + (issue.category ? ' — ' + issue.category : '') + '\n\n';
    out += issue.problem + '\n\n**Fix:** ' + issue.fix + '\n\n';
    const also = (issue.affectedEvents || []).filter(id => id !== issue.event);
    if (also.length) out += '**Also affects:** ' + also.map(link).join(', ') + '.\n\n';
  }
}
fs.writeFileSync(path.join(__dirname, 'findings.md'), out);
console.log(JSON.stringify({ findings: count, batches: reports.length, file: path.join(__dirname, 'findings.md') }));
