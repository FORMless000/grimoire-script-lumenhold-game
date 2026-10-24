'use strict';
// Deliberately independent of the operator CLI and other installed implementations.
const fs = require('fs');
const path = require('path');
const U = require('./util.js');
const R = require('./retrieve.js');
const { render } = require('./presentation.js');
const ALLOWED = new Set(['json', 'limit', 'budget', 'kind', 'place', 'cast', 'track', 'arc', 'required', 'draft']);
async function execute(root, argv) {
  const started = Date.now(), log = path.join(root, 'rag/receipts/retrieval.jsonl');
  const receipt = { at: new Date().toISOString(), argv, operation: null };
  let engine;
  try {
    const {opts, positional} = U.args(argv), [op, ...rest] = positional;
    receipt.operation = op;
    for (const key of Object.keys(opts)) if (!ALLOWED.has(key)) throw new Error('Retrieval configuration is fixed; unsupported override: --' + key);
    if (!['status', 'search', 'read', 'neighbors', 'brief', 'related'].includes(op)) throw new Error('retrieve status|search QUERY|read ID…|neighbors ID|brief QUERY|related --draft FILE [--json]');
    const binding = U.readJSON(path.join(root, 'rag/binding.json'));
    const cfg = R.config({value: binding.config});
    if (cfg.profile !== 'full' || R.identity(cfg) !== binding.identity) throw new Error('Fixed retrieval implementation or configuration changed');
    engine = R.create(path.join(root, 'rag/frozen'), cfg, {cache: path.join(root, 'rag/cache')});
    if (engine.cat.corpusHash !== binding.corpusHash) throw new Error('Frozen source fingerprint changed');
    receipt.corpusHash = engine.cat.corpusHash; receipt.indexIdentity = binding.identity;
    let result;
    if (op === 'status') {
      const m = engine.load();
      result = {ready: true, corpusHash: binding.corpusHash, indexHash: m.indexHash, records: m.records.length, scope: 'Starting sources and manifest; live search also checks external runtime/models.'};
    } else if (op === 'search') result = await engine.search(rest.join(' '), opts);
    else if (op === 'read') result = engine.read(rest.join(',').split(',').filter(Boolean), opts.budget);
    else if (op === 'neighbors') result = engine.neighbors(rest[0], U.positive(opts.limit, 20));
    else if (op === 'brief') result = await engine.brief(rest.join(' '), opts);
    else {
      if (!opts.draft) throw new Error('related requires --draft FILE');
      const draft = U.inside(root, opts.draft);
      if (!path.relative(root, draft).startsWith('content' + path.sep)) throw new Error('Draft must be under content/');
      const G = require('../../src/grimoire.js'), defs = G.parseFile(fs.readFileSync(draft, 'utf8'), opts.draft), parts = [];
      for (const d of defs) { parts.push(d.title, d.text); for (const o of d.options || []) { parts.push(o.label); G.walkEffects(o.effects, s => {if (s.t === 'say') parts.push(s.text);}); } }
      result = await engine.search(parts.filter(Boolean).join(' '), {...opts, kind: 'event'});
      result.warning = 'Candidates for inspection, not a duplicate verdict.';
    }
    const output = render(result, op, opts.json);
    Object.assign(receipt, {indexHash: result.indexHash || null, result, outputHash: U.hash(output), returnedChars: output.length, returnedBytes: Buffer.byteLength(output)});
    return {result, output};
  } catch (error) { receipt.error = error.message; throw error; }
  finally {
    Object.assign(receipt, {elapsedMs: Date.now() - started, stages: engine?.stages || [], calls: engine?.service.calls || []});
    U.appendJSON(log, receipt);
  }
}
async function main(root, argv) {
  try {const {result, output} = await execute(root, argv); process.stdout.write(output); if (result.incomplete) process.exitCode = 2;}
  catch (error) { console.error('retrieve: ' + error.message); process.exitCode = 1; }
}
module.exports = {execute, main};
