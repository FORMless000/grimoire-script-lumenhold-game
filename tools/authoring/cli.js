'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const U = require('./util.js');
const R = require('./retrieve.js');
const E = require('./experiments.js');
const Review = require('./review.js');
const C = require('./catalog.js');

function render(result, operation, json) {
  if (json) return JSON.stringify(result, null, 2) + '\n';
  if (result.text != null) return result.text + (result.omitted.length ? '\nOmitted: ' + result.omitted.join(', ') + '\nIncomplete required evidence: ' + result.incomplete + '\n' : '');
  if (result.results) return (result.warning ? result.warning + '\n' : '') + result.backend + '/' + result.profile + ' · ' + result.results.length + ' of ' + result.total + ' matches\n' + result.results.map((r, i) =>
    (i + 1) + '. ' + r.key + ' — ' + r.title + '\n   ' + r.file + ':' + r.line + ' · ' + r.sourceHash + '\n   ' + r.reason + '\n   ' + r.excerpt.replaceAll('\n', ' ')).join('\n\n') + '\n';
  if (result.edges) return result.warning + '\n' + result.edges.map((e) => e.from + ' → ' + e.to + ' [' + e.relation + '] ' + (e.guards.length ? 'when ' + e.guards.join(' and ') : '')).join('\n') + '\nOmitted edges: ' + result.omitted + '\n';
  return 'Indexed ' + result.records + ' blocks · ' + result.config.backend + '/' + result.config.profile + '\nCorpus: ' + result.corpusHash + '\nIndex: ' + result.indexHash + '\nDimensions: ' + result.dimensions + '\n';
}
async function retrieve(root, argv) {
  const { opts, positional } = U.args(argv), [operation, ...rest] = positional;
  const runFile = opts.run || (fs.existsSync(path.join(root, 'authoring-input/run.json')) ? path.join(root, 'authoring-input/run.json') : null);
  const run = runFile ? U.readJSON(path.resolve(runFile)) : null;
  const cfg = R.config({ ...opts, value: run?.retrievalConfig, backend: opts.backend || run?.backend, profile: opts.profile || run?.profile });
  if (run && (cfg.backend !== run.backend || cfg.profile !== run.profile)) throw new Error('Retrieval does not match assigned workflow');
  if (run && R.identity(cfg) !== run.indexIdentity) throw new Error('Retrieval configuration differs from the registered index identity');
  const service = R.create(run?.sourceRoot || path.resolve(opts.root || root), cfg, { cache: opts.cache || run?.cache });
  if (run && service.cat.corpusHash !== run.corpusHash) throw new Error('Frozen corpus fingerprint changed');
  const start = Date.now(); let result;
  try {
    if (run && operation === 'brief' && U.positive(opts.budget, 24000) > run.budget.briefChars) throw new Error('Brief budget exceeds the registered limit');
    if (operation === 'index') result = await service.index();
    else if (operation === 'search') result = await service.search(rest.join(' '), opts);
    else if (operation === 'read') result = service.read(rest.join(',').split(',').filter(Boolean), opts.budget);
    else if (operation === 'neighbors') result = service.neighbors(rest[0], U.positive(opts.limit, 20));
    else if (operation === 'brief') result = await service.brief(rest.join(' '), opts);
    else if (operation === 'related') {
      if (!opts.draft) throw new Error('related requires --draft FILE');
      const G = require('../../src/grimoire.js'), text = fs.readFileSync(path.resolve(root, opts.draft), 'utf8');
      const defs = G.parseFile(text, opts.draft), parts = [];
      for (const d of defs) { parts.push(d.title, d.text); for (const o of d.options || []) { parts.push(o.label); G.walkEffects(o.effects, (st) => { if (st.t === 'say') parts.push(st.text); }); } }
      result = await service.search(parts.filter(Boolean).join(' '), { ...opts, kind: 'event' }); result.warning = 'Similar premises to inspect, not a duplicate verdict.';
    } else throw new Error('retrieve index|search QUERY|read ID…|neighbors ID|brief QUERY|related --draft FILE [--backend grim|qmd|lightrag] [--profile full|lexical|no-dense|no-rerank|no-graph|no-descriptions] [--config FILE] [--json]');
  } catch (error) {
    if (run) U.appendJSON(run.log, { run: run.id, backend: cfg.backend, profile: cfg.profile, corpusHash: service.cat.corpusHash, operation, error: error.message, stages: service.stages, calls: service.service.calls, elapsedMs: Date.now() - start });
    throw error;
  }
  const output = render(result, operation, opts.json);
  const receipt = { run: run?.id || null, backend: cfg.backend, profile: cfg.profile, components: cfg.components, indexComponents: cfg.components, indexIdentity: R.identity(cfg), corpusHash: service.cat.corpusHash,
    operation, query: rest.join(' '), indexHash: result.indexHash || null, stages: service.stages, calls: service.service.calls, elapsedMs: Date.now() - start, resultHash: U.hash(result), outputHash: U.hash(output.trimEnd()), returnedChars: output.length, returnedBytes: Buffer.byteLength(output), result };
  if (run) {
    const used = fs.existsSync(run.log) ? fs.readFileSync(run.log, 'utf8').split('\n').filter(Boolean).map((s) => JSON.parse(s)).reduce((n, e) => n + (e.returnedChars || 0), 0) : 0;
    if (used + receipt.returnedChars > run.budget.returnedChars) { receipt.error = 'Returned evidence budget exceeded'; U.appendJSON(run.log, receipt); throw new Error(receipt.error); }
  }
  if (run || opts.log) U.appendJSON(run?.log || path.resolve(opts.log), receipt);
  if (opts.out) U.writeJSON(path.resolve(opts.out), result, true);
  else process.stdout.write(output);
  if (result.incomplete) process.exitCode = 2;
  return result;
}
async function evaluation(root, argv) {
  const { opts, positional } = U.args(argv), [operation, id] = positional;
  const dir = path.resolve(opts.experiment || 'experiments/authoring/runs/default');
  let result;
  if (operation === 'environment') result = await require('./environment.js').inspect(opts.config ? U.readJSON(opts.config) : {});
  else if (operation === 'prepare') result = E.prepare(root, path.resolve(opts.out || dir), { phase: opts.phase, factor: opts.factor, finalists: opts.finalists, model: opts.model, harness: opts.harness, harnessVersion: opts['harness-version'], seed: opts.seed, settings: opts.settings ? U.readJSON(opts.settings) : {}, retrievalConfig: opts.config ? U.readJSON(opts.config) : {}, tasks: opts.tasks ? U.readJSON(opts.tasks) : undefined, requiredSources: opts['required-sources'] ? U.readJSON(opts['required-sources']) : {}, environment: opts.environment ? U.readJSON(opts.environment) : null });
  else if (operation === 'draft') result = E.draft(dir, id, String(opts.files || '').split(',').filter(Boolean), opts.stage || 'first');
  else if (operation === 'freeze') result = E.freeze(dir, id);
  else if (operation === 'fail') result = E.fail(dir, id, opts.reason);
  else if (operation === 'trace') {
    if (!opts.file || !opts.format) throw new Error('trace requires --file and --format codex|claude|normalized');
    result = E.importTrace(dir, id, opts.format, fs.readFileSync(opts.file, 'utf8'), opts.attestation ? U.readJSON(opts.attestation) : {}, opts.resolutions ? U.readJSON(opts.resolutions) : {});
  } else if (operation === 'critic') result = E.importCritic(dir, id, U.readJSON(opts.file));
  else if (operation === 'audit') {
    const m = E.load(dir), r = E.trial(m, id), imp = m.imports[id]; if (!imp) throw new Error('Import a native trace first');
    const raw = U.readJSON(path.join(dir, imp.file)); result = E.importTrace(dir, id, raw.format, raw.text, raw.attestation, raw.resolutions);
  } else if (operation === 'validate') {
    const m = E.load(dir), r = E.trial(m, id), cwd = path.join(dir, 'trials', id);
    const draft = m.draftStages[id]?.at(-1);
    if (!draft || r.state === 'frozen') throw new Error('Validation requires a recorded, unfrozen draft');
    const unsafe = draft.sources.flatMap((s) => s.scopeViolations);
    const check = unsafe.length ? { status: 1, stdout: '', stderr: unsafe.join('\n') } : spawnSync(process.execPath, ['tools/grim.js', 'check'], { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
    result = { command: 'node tools/grim.js check', exitCode: check.status, output: (check.stdout || '') + (check.stderr || ''), sourceHash: r.sourceHash, draftHash: draft.hash, at: new Date().toISOString() };
    U.writeJSON(path.join(dir, 'validation', id, U.hash(result) + '.json'), result, true); r.validation = result; E.save(dir, m);
  } else if (operation === 'packet') {
    const m = E.load(dir), r = E.trial(m, id);
    process.stdout.write(fs.readFileSync(path.join(dir, 'trials', id, 'authoring-input/prompt.md'), 'utf8')); return;
  } else if (operation === 'critic-packet') {
    const m = E.load(dir), label = opts.label, runId = label ? m.mapping[label] : id, r = E.trial(m, runId);
    if (r.state !== 'frozen') throw new Error('Freeze the artifact first');
    const artifact = U.readJSON(path.join(dir, 'artifacts', runId, 'frozen.json'));
    const rubric = m.rubric;
    result = { rubricHash: U.hash(rubric), artifactHash: r.artifactHash, prompt: rubric + '\n\nTask:\n' + r.prompt + '\n\nOriginal sources:\n' + path.join(dir, 'snapshot') + '\n\nArtifact:\n' + artifact.sources.map((s) => s.text).join('\n\n'), evidence: C.catalog(path.join(dir, 'trials', runId)).records.filter((x) => x.authority === 'worldbook').map((x) => ({ key: x.key, sourceHash: x.sourceHash })) };
  } else if (operation === 'review') {
    const server = Review.serve(dir, opts.port ? Number(opts.port) : 0); server.on('listening', () => console.log('Authoring review: http://127.0.0.1:' + server.address().port)); return;
  } else if (operation === 'report') result = E.report(dir);
  else if (operation === 'panel-prepare') result = require('./panels.js').prepare(dir, U.readJSON(opts.members), opts['critic-workflows'] ? String(opts['critic-workflows']).split(',') : []);
  else if (operation === 'panel-import') result = require('./panels.js').importResult(dir, U.readJSON(opts.file));
  else if (operation === 'lock') result = Review.lock(dir);
  else throw new Error('author-eval prepare|packet|draft|validate|freeze|trace|audit|critic-packet|critic|review|lock|report [TRIAL_ID] --experiment DIR (see experiments/authoring/README.md)');
  if (opts.out && operation !== 'prepare') U.writeJSON(path.resolve(opts.out), result, true); else console.log(JSON.stringify(result, null, 2));
  return result;
}
async function main(root, command, argv) { try { return command === 'retrieve' ? await retrieve(root, argv) : await evaluation(root, argv); } catch (error) { console.error(command + ': ' + error.message); process.exitCode = 1; } }
module.exports = { main, retrieve, evaluation, render };
