'use strict';
const B = require('./backends.js');
const R = require('./retrieve.js');
const U = require('./util.js');

// Read-only availability/provenance probe. It never installs or calls a model.
async function inspect(config, execute = B.run) {
  const cfg = R.config({ value: config });
  const qmdVersion = (await execute(cfg.qmd?.executable || 'qmd', ['--version'])).trim();
  const weights = B.weightIdentity(cfg.qmd?.weights);
  const python = 'import importlib.metadata as m,json,sys; print(json.dumps({"python":sys.version,"lightrag":m.version("lightrag-hku"),"numpy":m.version("numpy"),"packages":sorted([(d.metadata["Name"],d.version) for d in m.distributions()])}))';
  const light = JSON.parse(await execute(cfg.lightrag?.python || 'python3', ['-c', python]));
  const data = { node: process.version, qmdVersion, weights, light, configHash: U.hash(cfg), at: new Date().toISOString() };
  return { ...data, hash: U.hash(data), qualification: 'Installed dependency identities only. Live model/API behavior still needs an explicit smoke test before paid trials.' };
}
module.exports = { inspect };
