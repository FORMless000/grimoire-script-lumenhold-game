'use strict';
// Dispatch outside retrieve.js so restoring Grim does not invalidate the existing LightRAG graph.
const fs = require('fs'), path = require('path');
const U = require('./util.js');
const light = require('./retrieve.js');
const grim = require('./grim-retrieve.js');
const engine = cfg => cfg.backend === 'grim' ? grim : light;
function config(opts = {}) {
  const local = path.join(__dirname, '../envs/retrieval.json');
  const file = opts.value || (opts.config ? U.readJSON(path.resolve(opts.config)) : fs.existsSync(local) ? U.readJSON(local) : {});
  // Machine-local paths from an earlier installation must not override the committed default.
  const backend = opts.backend || (opts.value || opts.config ? file.backend : null) || require('./authoring.js').selection().backend;
  if (!['grim', 'lightrag'].includes(backend)) throw new Error('Supported retrieval backends: grim, lightrag');
  return engine({ backend }).config({ ...opts, value: file, backend });
}
module.exports = { config, create: (root, cfg, opts) => engine(cfg).create(root, cfg, opts),
  identity: cfg => engine(cfg).identity(cfg), extractionIdentity: cfg => engine(cfg).extractionIdentity(cfg),
  queryIdentity: cfg => engine(cfg).queryIdentity(cfg) };
