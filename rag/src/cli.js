'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const U = require('./util.js');
const R = require('./retrieve.js');
const E = require('./experiments.js');
const Review = require('./review.js');
const C = require('./catalog.js');
const Authoring = require('./authoring.js');

const { render } = require('./presentation.js');
async function retrieve(root, argv) {
  const { opts, positional } = U.args(argv), [operation, ...rest] = positional;
  const allowed=new Set(['run','backend','profile','config','root','cache','log','out','json','limit','budget','kind','place','cast','track','arc','required','draft','dry-run','resume','rebuild','mode']);
  for(const key of Object.keys(opts))if(!allowed.has(key))throw new Error('Unsupported retrieval option: --'+key);
  const runFile = opts.run || (fs.existsSync(path.join(root, 'authoring-input/run.json')) ? path.join(root, 'authoring-input/run.json') : null);
  const run = runFile ? U.readJSON(path.resolve(runFile)) : null;
  // Frozen trials and explicit diagnostic/config choices never inherit the everyday default.
  const selected = !run && !opts.backend && !opts.profile && !opts.config ? Authoring.selection() : null;
  const cfg = R.config({ ...opts, value: run?.retrievalConfig, backend: opts.backend || run?.backend || selected?.backend, profile: opts.profile || run?.profile || selected?.profile });
  if (run && (cfg.backend !== run.backend || cfg.profile !== run.profile)) throw new Error('Retrieval does not match assigned workflow');
  if (run && R.identity(cfg) !== run.indexIdentity) throw new Error('Retrieval configuration differs from the registered index identity');
  const service = R.create(run?.sourceRoot || path.resolve(opts.root || root), cfg, { cache: opts.cache || run?.cache });
  if (run && operation === 'index') throw new Error('Frozen evaluation indexes cannot be synchronized by authors');
  if (run && service.cat.corpusHash !== run.corpusHash) throw new Error('Frozen corpus fingerprint changed');
  const start = Date.now(); let result;
  try {
    if (run && operation === 'brief' && U.positive(opts.budget, 24000) > run.budget.briefChars) throw new Error('Brief budget exceeds the registered limit');
    if (operation === 'status') result = Authoring.status(service, run ? 'evaluation' : 'authoring');
    else if (operation === 'index') result = await service.index(opts);
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
    } else throw new Error('retrieve status|index|search QUERY|read ID…|neighbors ID|brief QUERY|related --draft FILE [index: --dry-run|--resume|--rebuild --mode batch|sync] [--config FILE] [--json]');
  } catch (error) {
    U.appendJSON(run?.log || path.join(root,'rag/receipts/retrieval.jsonl'), { run: run.id, backend: cfg.backend, profile: cfg.profile, corpusHash: service.cat.corpusHash, at:new Date(start).toISOString(), argv, operation, error: error.message, stages: service.stages, calls: service.service.calls, elapsedMs: Date.now() - start });
    throw error;
  }
  const output = render(result, operation, opts.json);
  const receipt = { at:new Date(start).toISOString(), argv, run: run?.id || null, backend: cfg.backend, profile: cfg.profile, components: cfg.components, indexComponents: cfg.components, indexIdentity: R.identity(cfg), corpusHash: service.cat.corpusHash,
    operation, query: rest.join(' '), indexHash: result.indexHash || null, stages: service.stages, calls: service.service.calls, elapsedMs: Date.now() - start, resultHash: U.hash(result), outputHash: U.hash(output.trimEnd()), returnedChars: output.length, returnedBytes: Buffer.byteLength(output), result };
  if (run) {
    const used = fs.existsSync(run.log) ? fs.readFileSync(run.log, 'utf8').split('\n').filter(Boolean).map((s) => JSON.parse(s)).reduce((n, e) => n + (e.returnedChars || 0), 0) : 0;
    if (used + receipt.returnedChars > run.budget.returnedChars) { receipt.error = 'Returned evidence budget exceeded'; U.appendJSON(run.log, receipt); throw new Error(receipt.error); }
  }
  U.appendJSON(run?.log || (opts.log ? path.resolve(opts.log) : path.join(root,'rag/receipts/retrieval.jsonl')), receipt);
  if (opts.out) U.writeJSON(path.resolve(opts.out), result, true);
  else process.stdout.write(output);
  if (result.incomplete) process.exitCode = 2;
  if (operation === 'status' && !result.ready) process.exitCode = 1;
  return result;
}
async function evaluation(root, argv) {
  const { opts, positional } = U.args(argv), [operation, id] = positional;
  const dir = path.resolve(opts.experiment || 'rag/runs/default');
  let result;
  if (operation === 'workspaces') {
    const W = require('./workspaces.js');
    if (id === 'prepare') result = await W.prepare(root, path.resolve(opts.out || dir), { resume: !!opts.resume });
    else if (id === 'status') result = W.status(dir);
    else if (id === 'scan') result = W.scan(dir);
    else if (id === 'import') result = require('./batch-import.js').importWorkspaces(root,dir,{scan:opts.scan,prompt:opts.prompt,seed:opts.seed,out:opts.out,final:!!opts.final});
    else if (id === 'reset-review') result = require('./batch-review.js').reset(dir);
    else if (id === 'traces') result = require('./batch-traces.js').build(dir,{review:opts.review,out:opts.out,sessions:opts.sessions,claudeProjects:opts['claude-projects']});
    else if (id === 'review') {
      const review=opts.review ? path.resolve(opts.review) : require('./batch-import.js').latest(dir);
      const server=require('./batch-review.js').serve(review,opts.port?Number(opts.port):0,root);
      server.on('listening',()=>console.log('Authoring batch review: http://127.0.0.1:'+server.address().port));return server;
    }
    else throw new Error('author-eval workspaces prepare --out DIR [--resume] | status|scan|import|review|traces|reset-review --experiment DIR (import: --prompt FILE [--scan FILE] [--final]; review: [--review DIR] [--port N]; traces: [--sessions DIR] [--out DIR])');
    console.log(JSON.stringify(result, null, 2));
    if (['prepare','status'].includes(id) && !result.ready) process.exitCode = 1;
    return result;
  }
  else if (operation === 'environment') result = await require('./environment.js').inspect(opts.config ? U.readJSON(opts.config) : undefined);
  else if (operation === 'handoff') result = require('./handoff.js').prepare(dir, id, { withLocalKey: opts['with-local-key'] });
  else if (operation === 'prepare') result = E.prepare(root, path.resolve(opts.out || dir), { phase: opts.phase, factor: opts.factor, finalists: opts.finalists, model: opts.model, harness: opts.harness, harnessVersion: opts['harness-version'], seed: opts.seed, settings: opts.settings ? U.readJSON(opts.settings) : {}, retrievalConfig: opts.config ? U.readJSON(opts.config) : R.config(), tasks: opts.tasks ? U.readJSON(opts.tasks) : undefined, requiredSources: opts['required-sources'] ? U.readJSON(opts['required-sources']) : {}, environment: opts.environment ? U.readJSON(opts.environment) : null });
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
    const module=E.load(dir).kind==='workspace-batch-review'?require('./batch-review.js'):Review;
    const server = module.serve(dir, opts.port ? Number(opts.port) : 0); server.on('listening', () => console.log('Authoring review: http://127.0.0.1:' + server.address().port)); return;
  } else if (operation === 'report') result = E.load(dir).kind==='workspace-batch-review'?require('./batch-review.js').state(dir):E.report(dir);
  else if (operation === 'panel-prepare') result = require('./panels.js').prepare(dir, U.readJSON(opts.members), opts['critic-workflows'] ? String(opts['critic-workflows']).split(',') : []);
  else if (operation === 'panel-import') result = require('./panels.js').importResult(dir, U.readJSON(opts.file));
  else if (operation === 'lock') {
    if (E.load(dir).kind==='workspace-batch-review') throw new Error('Batch ratings autosave and remain editable; reveal workflows from the review page.');
    result = Review.lock(dir);
  }
  else throw new Error('author-eval prepare|handoff|packet|draft|validate|freeze|trace|audit|critic-packet|critic|review|lock|report [TRIAL_ID] --experiment DIR (see rag/EVALUATION.md)');
  if (opts.out && operation !== 'prepare') U.writeJSON(path.resolve(opts.out), result, true); else console.log(JSON.stringify(result, null, 2));
  return result;
}
async function main(root, command, argv) { try { return command === 'retrieve' ? await retrieve(root, argv) : await evaluation(root, argv); } catch (error) { console.error(command + ': ' + error.message); process.exitCode = 1; } }
module.exports = { main, retrieve, evaluation, render };
