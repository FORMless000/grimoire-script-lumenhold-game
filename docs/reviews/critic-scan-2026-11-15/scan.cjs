'use strict';
// Inventory only: no card edits, retrieval/model calls, or critic verdicts.
const fs = require('fs'), path = require('path'), cp = require('child_process');
const crypto = require('crypto'), assert = require('assert');
const root = path.resolve(__dirname, '../../..');
const project = require(root + '/tools/project.js').project(root);
const previous = JSON.parse(fs.readFileSync(root + '/docs/reviews/critic-scan-2026-10-29/inventory.json'));
const git = args => cp.execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const { content, errors } = project.compileAll();
assert.equal(errors.length, 0, JSON.stringify(errors));
const events = Object.values(content.events);
const previousById = new Map(previous.allCards.map(e => [e.id, e]));
const disabled = e => e.tags?.includes('retired') || (e.when?.ast?.t === 'bool' && e.when.ast.v === false);
// Same definition comparison as October 29; includes inherited wiring, ignores locations.
const scrub = v => typeof v === 'function' ? undefined : Array.isArray(v) ? v.map(scrub) :
  v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort()
    .filter(k => !['file', 'line'].includes(k)).map(k => [k, scrub(v[k])]).filter(([, x]) => x !== undefined)) : v;
const hash = e => crypto.createHash('sha256').update(JSON.stringify(scrub(e))).digest('hex');
const coverage = new Map(), unresolvedScopes = [], archives = [];
function add(id, evidence) {
  if (!content.events[id]) return;
  if (!coverage.has(id)) coverage.set(id, []);
  coverage.get(id).push(evidence);
}
for (const dir of [root + '/build/batches', path.resolve(root, '../lifesim-reviews/event-critique')]) {
  archives.push({ path: path.relative(root, dir), available: fs.existsSync(dir) });
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.critic.json')).sort()) {
    const reportPath = path.relative(root, path.join(dir, file));
    const report = JSON.parse(fs.readFileSync(path.join(dir, file)));
    const selfReview = /self[- ]review|author['’]s? (?:own |session)|author own review/i
      .test([report.reviewer, report.summary].filter(Boolean).join(' '));
    const evidence = { report: reportPath, accept: report.accept, selfReview,
      reviewerNamed: !!report.reviewer };
    let ids = report.scope?.reviewedEventIds || report.events || report.reviewed_events || report.reviewed;
    let basis = 'explicit report scope';
    const companion = path.join(dir, file.replace('.critic.json', '.json'));
    if (!ids && fs.existsSync(companion)) {
      ids = JSON.parse(fs.readFileSync(companion)).events;
      basis = 'companion batch event list (historical ID coverage, not current-version certification)';
    }
    if (ids) for (const row of ids) add(typeof row === 'string' ? row : row.id, { ...evidence, basis });
    else unresolvedScopes.push(reportPath);
    // An issue naming exactly one existing ID proves it received criticism, even outside a batch list.
    for (const issue of report.issues || []) add(issue.event, { ...evidence, basis: 'explicit per-event critic issue' });
  }
}
// Six accepted reports have no machine-readable scope. Their notes identify whole-file batches.
// Freeze IDs from those files at the commit that last wrote each verdict, not from today's file.
const noteScopes = {
  'M1-fixtures': ['content/events/fixtures_2.grim'],
  'M4-night-market': ['content/events/night_market.grim'],
  'M5-pushers': ['content/events/pushers.grim'],
  'M6-agents': ['content/events/hollowstar/agents.grim'],
  'S2-offer-hints': ['content/events/offer_hints.grim'],
};
const scopeResolutions = [];
function documentedScope(batch, ids, basis) {
  const report = 'build/batches/' + batch + '.critic.json';
  const verdict = JSON.parse(fs.readFileSync(root + '/' + report));
  assert.equal(verdict.accept, true);
  for (const id of ids) add(id, { report, accept: true, selfReview: false,
    reviewerNamed: !!verdict.reviewer, basis });
  scopeResolutions.push({ report, ids, basis });
}
for (const [batch, files] of Object.entries(noteScopes)) {
  const commit = git(['log', '-1', '--format=%H', '--', 'build/batches/' + batch + '.critic.json']);
  assert(commit, 'Missing report commit: ' + batch);
  const ids = files.flatMap(file => [...git(['show', commit + ':' + file]).matchAll(/^@event\s+(\S+)/gm)].map(m => m[1]));
  documentedScope(batch, ids, 'Whole-file scope in batch notes; IDs read at verdict commit ' + commit);
}
documentedScope('M3-placeholders', ['courier_loft_broom_pension', 'village_barge_scarf', 'headmistress_tower_dictation'],
  'Three cards explicitly identified in batch notes and accepted round-2 summary');
documentedScope('C3-capital-port', ['printing_row_jammed_press', 'rookery_watch_guide'],
  'Replacement IDs in round-1-fix notes; accepted round-2 summary explicitly reviews both replacement premises');
const rows = events.map(e => {
  const evidence = coverage.get(e.id) || [];
  const old = previousById.get(e.id);
  return { id: e.id, file: e.file, line: e.line, disabled: !!disabled(e), newSinceOctober29: !old,
    recordedCritic: evidence.some(x => !x.selfReview), evidence,
    changedSinceOctober29: !!old && old.compiledDefinitionHash !== hash(e), compiledDefinitionHash: hash(e) };
});
const active = rows.filter(e => !e.disabled);
const gaps = active.filter(e => !e.recordedCritic);
const added = rows.filter(e => e.newSinceOctober29);
const changedReviewed = active.filter(e => e.recordedCritic && e.changedSinceOctober29);
const counts = { compiled: rows.length, active: active.length, disabled: rows.length - active.length,
  addedSinceOctober29: added.length, newActive: added.filter(e => !e.disabled).length,
  newDisabled: added.filter(e => e.disabled).length,
  removedSinceOctober29: previous.allCards.filter(e => !content.events[e.id]).length,
  activeCoverageGaps: gaps.length, newActiveCoverageGaps: gaps.filter(e => e.newSinceOctober29).length,
  activeSelfReviewOnly: gaps.filter(e => e.evidence.length).length,
  changedPreviouslyReviewed: changedReviewed.length };
// Broader user-requested scope: coverage by the documented independent passes, not just any verdict.
// Model identity is not inferred from an importing commit's co-author trailer.
const independentPassIds = new Set();
for (const [id, evidence] of coverage) if (evidence.some(e =>
  e.report.startsWith('../lifesim-reviews/event-critique/') ||
  /^build\/batches\/current-.*2026-10-28\.critic\.json$/.test(e.report) ||
  e.report === 'build/batches/new-cards-2026-10-20.critic.json')) independentPassIds.add(id);
const outsideIndependentPasses = active.filter(e => !independentPassIds.has(e.id));
const selfReviewScopes = {
  bonds: ['content/events/bonds/'], romance: ['content/events/romance/'],
  whisperwood: ['content/events/whisperwood/'], intro: ['content/events/intro.grim'],
};
const selfReviewReports = [];
for (const file of fs.readdirSync(root + '/build/batches').filter(f => f.endsWith('.critic.json'))) {
  const reportPath = 'build/batches/' + file;
  const report = JSON.parse(fs.readFileSync(root + '/' + reportPath));
  if (!/self[- ]review|author['’]s? (?:own |session)/i.test([report.reviewer, report.summary].join(' '))) continue;
  const batch = file.replace('.critic.json', '');
  const commit = git(['log', '-1', '--format=%H', '--', reportPath]);
  const body = git(['show', '-s', '--format=%B', commit]);
  const companion = root + '/build/batches/' + batch + '.json';
  const sources = fs.existsSync(companion) ? JSON.parse(fs.readFileSync(companion)).files : selfReviewScopes[batch];
  assert(sources?.length, 'Missing self-review scope: ' + batch);
  const paths = git(['ls-tree', '-r', '--name-only', commit, '--', ...sources]).split('\n').filter(f => f.endsWith('.grim'));
  const ids = [...new Set(paths.flatMap(f => [...git(['show', commit + ':' + f]).matchAll(/^@event\s+(\S+)/gm)].map(m => m[1])))];
  const activeIds = ids.filter(id => active.some(e => e.id === id));
  selfReviewReports.push({ report: reportPath, selfReviewStatement: report.reviewer || report.summary,
    commit, claudeCoauthorInCommit: /Co-Authored-By: Claude/i.test(body),
    attributionLimit: 'Commit links Claude to the change; it does not prove which model performed the self-review.',
    scopeBasis: 'Historical event definitions in the companion batch files or directories named by the self-review summary',
    sourceFiles: paths, activeIds, activeOutsideIndependentPasses: activeIds.filter(id => !independentPassIds.has(id)) });
}
counts.activeOutsideDocumentedIndependentPasses = outsideIndependentPasses.length;
counts.outsideIndependentPassesWithOtherVerdicts = outsideIndependentPasses.filter(e => e.recordedCritic).length;
counts.explicitSelfReviewReports = selfReviewReports.length;
counts.selfReviewedActiveOutsideIndependentPasses = new Set(selfReviewReports.flatMap(r => r.activeOutsideIndependentPasses)).size;
assert.equal(rows.length, new Set(rows.map(e => e.id)).size);
assert.equal(active.length, active.filter(e => e.recordedCritic).length + gaps.length);
const inventory = { date: '2026-11-15', head: git(['rev-parse', 'HEAD']), contentHash: project.contentHash(),
  baseline: 'docs/reviews/critic-scan-2026-10-29/inventory.json', counts, archives, scopeResolutions,
  reportsWithoutMachineReadableScope: unresolvedScopes, gaps, newCards: added, changedReviewed,
  outsideIndependentPasses, selfReviewReports,
  method: 'Join exact compiled IDs to local/external report scopes, companion batches, explicit issues and documented scope resolutions. A recorded verdict may reject; coverage is not acceptance, reviewer independence, or certification of the current definition. Static active means neither retired nor literal when:false, not measured reachability. Changed definitions include inherited wiring and only flag candidates for later triage.' };
fs.writeFileSync(__dirname + '/inventory.json', JSON.stringify(inventory, null, 2) + '\n');
const groups = new Map();
for (const e of outsideIndependentPasses) {
  if (!groups.has(e.file)) groups.set(e.file, []);
  groups.get(e.file).push(e);
}
fs.writeFileSync(__dirname + '/independent-queue.md',
  '# Cards outside the documented independent passes\n\n' +
  '644 active IDs: 632 have other recorded verdicts with unattributed reviewers; 12 have no coverage. ' +
  'This is a conservative review queue, not proof these cards have never had an independent reader. ' +
  'No card has been critiqued in this scan. See README.md for scope and procedure.\n\n' +
  [...groups].map(([file, cards]) => '## ' + file + ' (' + cards.length + ')\n\n' +
    cards.map(e => '- [' + e.id + '](../../../' + e.file + ':' + e.line + ')' +
      (e.recordedCritic ? '' : ' — no recorded coverage')).join('\n')).join('\n\n') + '\n');
console.log(JSON.stringify(counts, null, 2));
console.log(JSON.stringify(gaps.map(({ id, file, line }) => ({ id, file, line })), null, 2));
