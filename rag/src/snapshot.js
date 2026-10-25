'use strict';
// Stale-index fallback for everyday authoring: when sources changed since the last sync but the build
// configuration did not, queries run against the last published snapshot with a notice instead of failing.
// Kept outside the files hashed into the extraction identity (retrieve.js, catalog.js, the adapter), so
// changing it never orphans a built index.
const U = require('./util.js');
const R = require('./retrieve.js');
const C = require('./catalog.js');
const { run } = require('./process.js');

const list = (keys, n = 8) => keys.slice(0, n).join(', ') + (keys.length > n ? ', … (' + (keys.length - n) + ' more)' : '');

function fallback(root, cfg, options = {}) {
  const cat = options.catalog || C.catalog(root), probe = R.create(root, cfg, { ...options, catalog: cat });
  const state = probe.status();
  if (state.state === 'unbuilt' || !state.indexHash) return null;
  const m = U.readJSON(require('path').join(probe.dir, 'index.json'));
  if (m.identity !== R.identity(cfg) || m.corpusHash === cat.corpusHash) return null;
  const delta = state.changes, deleted = new Set(delta.deleted), live = new Set(cat.records.map((r) => r.key));
  // Placeholders keep the snapshot's deleted blocks resolvable inside the engine; their hits are dropped below.
  const placeholders = m.records.filter((r) => !live.has(r.key)).map((r) => ({ key: r.key, kind: r.kind, file: r.file, line: r.line, metadata: r.metadata || {},
    sourceHash: r.sourceHash, title: r.key, text: '', prose: '', branches: [], authority: r.kind === 'event' ? 'conditional-event' : 'worldbook', retired: true }));
  const patched = { ...cat, corpusHash: m.corpusHash, records: cat.records.concat(placeholders) };
  const inner = options.execute || run;
  const execute = async (bin, argv, input, o) => {
    const out = await inner(bin, argv, input, o);
    if (input.action !== 'search' || !deleted.size) return out;
    const r = JSON.parse(out); if (Array.isArray(r.hits)) r.hits = r.hits.filter((h) => !deleted.has(h.key));
    return JSON.stringify(r);
  };
  const parts = ['Notice: sources changed since the last index sync' + (m.at ? ' (' + m.at + ')' : '') + '; searching that snapshot.'];
  if (delta.added.length) parts.push(delta.added.length + ' new block(s) are not searchable yet: ' + list(delta.added) + '.');
  if (delta.modified.length) parts.push(delta.modified.length + ' edited block(s) rank by their synced text: ' + list(delta.modified) + '.');
  if (delta.deleted.length) parts.push(delta.deleted.length + ' deleted block(s) are hidden.');
  parts.push('Run `npm run grim -- retrieve index` to synchronize.');
  return {
    service: R.create(root, cfg, { ...options, catalog: patched, execute }),
    notice: parts.join(' '),
    snapshot: { at: m.at || null, indexHash: m.indexHash, corpusHash: m.corpusHash, liveCorpusHash: cat.corpusHash, added: delta.added, modified: delta.modified, deleted: delta.deleted },
  };
}
module.exports = { fallback };
