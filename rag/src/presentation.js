'use strict';
function render(result, operation, json) {
  if (operation === 'status' || result.dryRun) return JSON.stringify(result, null, 2) + '\n';
  if (json) return JSON.stringify(result, null, 2) + '\n';
  if (result.text != null) return result.text + (result.omitted.length ? '\nOmitted: ' + result.omitted.join(', ') + '\nIncomplete required evidence: ' + result.incomplete + '\n' : '');
  if (result.results) return (result.warning ? result.warning + '\n' : '') + result.backend + '/' + result.profile + ' · ' + result.results.length + ' of ' + result.total + ' matches\n' + result.results.map((r, i) =>
    (i + 1) + '. ' + r.key + ' — ' + r.title + '\n   ' + r.file + ':' + r.line + ' · ' + r.sourceHash + '\n   ' + r.reason + '\n   ' + r.excerpt.replaceAll('\n', ' ')).join('\n\n') + '\n';
  if (result.edges) return result.warning + '\n' + result.edges.map((e) => e.from + ' → ' + e.to + ' [' + e.relation + '] ' + (e.guards.length ? 'when ' + e.guards.join(' and ') : '')).join('\n') + '\nOmitted edges: ' + result.omitted + '\n';
  if (operation === 'prune') return pruned(result);
  return 'Indexed ' + result.records + ' blocks · ' + result.config.backend + '/' + result.config.profile + '\nCorpus: ' + result.corpusHash + '\nIndex: ' + result.indexHash + '\nDimensions: ' + result.dimensions + '\n' + (result.pruned ? pruned(result.pruned) : '');
}
// What a prune removed (rag/src/prune.js).
function pruned(p) {
  const gb = (n) => (n / 1e9).toFixed(2) + ' GB';
  return (p.removed.length ? 'Pruned ' + p.removed.length + ' outdated item(s), ' + gb(p.bytes) + ':\n' + p.removed.map((x) => '  ' + x.path + ' (' + x.why + ', ' + gb(x.bytes) + ')').join('\n') : 'Pruned nothing: only the current index is kept') + '\n';
}
module.exports = { render };
