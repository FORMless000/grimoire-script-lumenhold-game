'use strict';
// Screening existing cards in the current Grim index. Run from the project root
// with the exact source paths to screen. A doubtful premise still gets a draft search.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
const ledger = require('./progress.json');
const { catalog, words } = require(root + '/rag/src/catalog.js');
const Grim = require(root + '/rag/src/grim-retrieve.js');
const { cosine, fuse } = require(root + '/rag/src/adapters/grim.js');
const { hash } = require(root + '/rag/src/util.js');
const cat = catalog(root);
const manifest = Grim.create(root, Grim.config(), { catalog: cat }).load();
const records = new Map(cat.records.map(record => [record.key, record]));
const active = manifest.records.filter(record => record.kind === 'event' && !records.get(record.key).retired);
const indexed = new Map(active.map(record => [record.key, record]));
const rank = (a, b) => b.score - a.score || a.key.localeCompare(b.key);
const postings = new Map(), lengths = new Map();
for (const doc of active) {
  const tokens = words(doc.searchText);
  lengths.set(doc.key, tokens.length);
  const counts = new Map();
  for (const token of tokens) counts.set(token, (counts.get(token) || 0) + 1);
  for (const [token, count] of counts) {
    if (!postings.has(token)) postings.set(token, []);
    postings.get(token).push([doc.key, count]);
  }
}
const averageLength = [...lengths.values()].reduce((sum, length) => sum + length, 0) / active.length;

function lexical(query, self) {
  const scores = new Map();
  for (const token of new Set(words(query))) {
    const matches = postings.get(token);
    if (!matches) continue;
    const idf = Math.log(1 + (active.length - matches.length + 0.5) / (matches.length + 0.5));
    for (const [key, count] of matches) {
      if (key === self) continue;
      const penalty = 1.2 * (0.25 + 0.75 * lengths.get(key) / averageLength);
      scores.set(key, (scores.get(key) || 0) + idf * count * 2.2 / (count + penalty));
    }
  }
  return [...scores].map(([key, score]) => ({ key, score, reason: 'BM25' })).sort(rank).slice(0, 20);
}

for (const file of process.argv.slice(2)) {
  const output = path.join(__dirname, 'indexed-' + path.basename(file, '.grim') + '.json');
  if (fs.existsSync(output)) continue;
  const scope = ledger.queue.filter(row => row.file === file && row.status === 'pending');
  assert(scope.length, file);
  const results = scope.map(row => {
    const doc = indexed.get('event:' + row.id);
    const source = records.get(doc.key);
    assert.equal(source.sourceHash, doc.sourceHash, row.id);
    assert.equal(source.file, file, row.id);
    const lex = lexical(source.prose, doc.key);
    const dense = active.filter(candidate => candidate.key !== doc.key).map(candidate => ({
      key: candidate.key, score: cosine(doc.vector, candidate.vector), reason: 'Indexed vector cosine',
    })).sort(rank).slice(0, 20);
    const hits = fuse([lex, dense]);
    const top3NonSelfCandidates = hits.slice(0, 3).map(hit => {
      const candidate = records.get(hit.key);
      assert.equal(indexed.get(hit.key).sourceHash, candidate.sourceHash, hit.key);
      return { id: hit.key, sourceHash: candidate.sourceHash, file: candidate.file, line: candidate.line,
        title: candidate.title, score: hit.score, reason: hit.reason };
    });
    return { id: row.id, file, sourceHash: source.sourceHash, exitCode: 0,
      queryHash: hash({ prose: source.prose, vector: doc.vector }), corpusHash: cat.corpusHash,
      indexHash: manifest.indexHash, total: hits.length, top3NonSelfCandidates };
  });
  fs.writeFileSync(output, JSON.stringify({ batch: file, method: 'Local BM25 and indexed vector cosine with reciprocal rank fusion. No query embedding or reranker request.',
    expected: scope.length, completed: results.length, results }, null, 2) + '\n', { flag: 'wx' });
  console.log(file, results.length);
}
