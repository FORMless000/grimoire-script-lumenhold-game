'use strict';
// Rebind the built index to a new implementation identity after query-only alias registrations
// (model-aliases.json: which bare model names a reranker may report back). Aliases never touch
// extraction or embeddings, but the file is hashed into the identity, so registering one would
// otherwise orphan the graph. Unlike legacy-import.js's rebindRerankerAlias, several aliases may be
// added at once and a stale corpus is allowed: the manifest's records stay exactly as they were
// (snapshot.js keeps answering from them until the next sync). No model calls; every native byte
// is kept, moved by rename, and the prior manifest is saved beside it.
//
//   node rag/src/rebind.js proof <file>     capture the identity and implementation hashes before editing
//   node rag/src/rebind.js apply <file>     after editing model-aliases.json: verify and move the index
const fs = require('fs'), path = require('path');
const U = require('./util'), R = require('./retrieve'), Authoring = require('./authoring');
const adapter = require('./adapters/lightrag');
const ROOT = path.resolve(__dirname, '../..');
const FILES = ['catalog.js', 'retrieve.js', ...adapter.files];

function config() { const s = Authoring.selection(); return R.config({ backend: s.backend, profile: s.profile }); }
function hashes() { return Object.fromEntries(FILES.map((f) => [f, U.hash(fs.readFileSync(path.join(__dirname, f)))])); }

function proof() {
  const cfg = config(), dir = R.create(ROOT, cfg).dir;
  if (!fs.existsSync(path.join(dir, 'index.json'))) throw new Error('No built index at the current identity: ' + dir);
  return { identity: R.identity(cfg), directory: dir, aliases: U.readJSON(path.join(__dirname, 'model-aliases.json')), implementationHashes: hashes(), at: new Date().toISOString() };
}

function apply(p) {
  const cfg = config(), now = hashes();
  for (const [f, h] of Object.entries(p.implementationHashes)) if (f !== 'model-aliases.json' && now[f] !== h) throw new Error('Non-alias implementation changed: ' + f);
  const aliases = U.readJSON(path.join(__dirname, 'model-aliases.json'));
  // Only additions: every alias the index was built with is still there, unchanged.
  for (const [k, v] of Object.entries(p.aliases)) if (U.hash(aliases[k]) !== U.hash(v)) throw new Error('An existing alias changed: ' + k);
  const added = Object.keys(aliases).filter((k) => !(k in p.aliases));
  if (!added.length) throw new Error('No alias was added');
  const oldDir = p.directory, destination = R.create(ROOT, cfg).dir;
  if (path.dirname(oldDir) !== path.dirname(destination) || oldDir === destination) throw new Error('Invalid migration paths');
  if (fs.existsSync(destination) || fs.existsSync(path.join(oldDir, 'pending.json')) || fs.existsSync(path.join(oldDir, 'writer.lock'))) throw new Error('Needs an idle completed graph and an unused destination');
  const m = U.readJSON(path.join(oldDir, 'index.json'));
  if (m.identity !== p.identity || m.indexHash !== R.digest(m)) throw new Error('Prior identity or manifest digest differs');
  if (m.config.models.extract !== cfg.models.extract || m.config.models.embedding !== cfg.models.embedding || m.config.preprocessing !== cfg.preprocessing) throw new Error('Extraction or embedding configuration changed');
  const prior = m.indexHash;
  U.writeJSON(path.join(oldDir, 'index-before-alias-rebind.json'), m, true);
  m.identity = R.identity(cfg);
  m.backendIdentity.compatibilityUpdates = [...(m.backendIdentity.compatibilityUpdates || []), { reason: 'Register reranker provider aliases (query-only); extraction, embeddings and indexed inputs unchanged', priorIdentity: p.identity, priorIndexHash: prior, added, at: new Date().toISOString() }];
  m.indexHash = R.digest(m);
  fs.renameSync(oldDir, destination);
  U.writeJSON(path.join(destination, 'index.json'), m);
  U.writeJSON(path.join(destination, 'alias-rebind.json'), { proof: p, added, priorIndexHash: prior, indexHash: m.indexHash, modelCalls: 0 }, true);
  return { directory: destination, added, indexHash: m.indexHash, records: m.records.length, modelCalls: 0 };
}

if (require.main === module) {
  const [cmd, file] = process.argv.slice(2);
  if (cmd === 'proof') { U.writeJSON(path.resolve(file), proof(), true); console.log('proof written: ' + file); }
  else if (cmd === 'apply') console.log(JSON.stringify(apply(U.readJSON(path.resolve(file))), null, 2));
  else { console.error('node rag/src/rebind.js proof|apply <file>'); process.exitCode = 1; }
}
module.exports = { proof, apply };
