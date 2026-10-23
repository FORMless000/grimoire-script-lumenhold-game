'use strict';
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { createHash } = require('crypto');
const { hash, writeJSON } = require('./util.js');
const { openRouterKey } = require('./credentials.js');

function run(command, argv, input, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, argv, { cwd: options.cwd, env: { ...process.env, ...options.env }, stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '', err = '';
    child.on('error', () => reject(new Error('Backend executable unavailable: ' + command)));
    child.stdout.on('data', (b) => { out += b; });
    child.stderr.on('data', (b) => { err = (err + b).slice(-4000); });
    child.on('close', (code) => code === 0 ? resolve(out) : reject(new Error('Backend command failed (' + command + ', exit ' + code + '). Check the isolated installation; no fallback.')));
    child.stdin.on('error', () => {});
    child.stdin.end(input == null ? '' : JSON.stringify(input));
  });
}
function weightIdentity(files) {
  if (!Array.isArray(files) || !files.length) throw new Error('QMD requires config.qmd.weights: paths to the three downloaded GGUF models, for checksum provenance.');
  if (files.length !== 3) throw new Error('QMD needs exactly three model weight files (embedding, reranker, expansion).');
  return files.map((f) => {
    const fd = fs.openSync(f, 'r'), digest = createHash('sha256'), buffer = Buffer.alloc(1024 * 1024);
    try { let size; while ((size = fs.readSync(fd, buffer, 0, buffer.length, null))) digest.update(buffer.subarray(0, size)); }
    finally { fs.closeSync(fd); }
    return { file: path.resolve(f), sha256: digest.digest('hex') };
  });
}
function qmdEnvironment(dir) { return { QMD_CONFIG_DIR: path.join(dir, 'config'), XDG_CACHE_HOME: path.join(dir, 'cache'), INDEX_PATH: path.join(dir, 'index.sqlite') }; }
async function qmdIndex(records, dir, config, execute = run) {
  const q = config.qmd || {}, bin = q.executable || 'qmd';
  const version = (await execute(bin, ['--version'])).trim();
  const weights = weightIdentity(q.weights);
  const docs = path.join(dir, 'documents'), configDir = path.join(dir, 'config');
  fs.mkdirSync(docs, { recursive: true }); fs.mkdirSync(configDir, { recursive: true });
  const mapping = {};
  for (const r of records) {
    const name = hash(r.key).slice(0, 24) + '.md'; mapping[name] = r.key;
    fs.writeFileSync(path.join(docs, name), '---\n' + ['key', 'kind', 'sourceHash'].map((k) => k + ': ' + JSON.stringify(r[k])).join('\n') + '\n---\n# ' + r.key + '\nSource: ' + r.file + ':' + r.line + '\n' + r.searchText + '\n');
  }
  // Explicit local paths pin the downloaded defaults instead of relying on mutable aliases.
  const settings = { models: { embed: weights[0].file, rerank: weights[1].file, generate: weights[2].file }, collections: { grim: { path: docs, pattern: '**/*.md' } } };
  fs.writeFileSync(path.join(configDir, 'authoring.yml'), JSON.stringify(settings, null, 2)); // JSON is valid YAML.
  const env = qmdEnvironment(dir);
  await execute(bin, ['--index', 'authoring', 'update'], null, { env });
  await execute(bin, ['--index', 'authoring', 'embed'], null, { env });
  return { backend: 'qmd', version, weights, mapping, configHash: hash(settings) };
}
async function qmdSearch(query, dir, identity, config, execute = run) {
  const q = config.qmd || {};
  const version = (await execute(q.executable || 'qmd', ['--version'])).trim();
  if (version !== identity.version || hash(weightIdentity(q.weights)) !== hash(identity.weights)) throw new Error('QMD runtime/model identity changed; rebuild the index.');
  if (hash(JSON.parse(fs.readFileSync(path.join(dir, 'config/authoring.yml'), 'utf8'))) !== identity.configHash) throw new Error('QMD isolated configuration changed; rebuild the index.');
  const out = await execute(q.executable || 'qmd', ['--index', 'authoring', 'query', query, '--json', '-n', '40'], null, { env: qmdEnvironment(dir) });
  const rows = JSON.parse(out);
  if (!Array.isArray(rows)) throw new Error('Unsupported QMD JSON result format');
  return rows.map((r) => {
    const file = String(r.file || r.path || '').split('/').pop();
    if (!identity.mapping[file]) throw new Error('QMD returned an unmapped parent document');
    return { key: identity.mapping[file], score: Number(r.score) || 0, reason: 'QMD native hybrid retrieval' };
  });
}
async function light(action, records, query, dir, config, identity, execute = run) {
  const input = { action, records: records.map((r) => ({ key: r.key, text: r.searchText })), query, directory: path.join(dir, 'storage'), models: config.models, baseURL: config.baseURL, provider: config.provider, identity };
  const raw = await execute(config.lightrag?.python || 'python3', [path.join(__dirname, 'lightrag_bridge.py')], input, { env: { OPENROUTER_API_KEY: openRouterKey() } });
  return JSON.parse(raw);
}
async function index(backend, records, dir, config, execute) {
  fs.mkdirSync(dir, { recursive: true });
  const identity = backend === 'qmd' ? await qmdIndex(records, dir, config, execute) : (await light('index', records, '', dir, config, null, execute));
  writeJSON(path.join(dir, 'backend.json'), identity);
  return identity;
}
async function search(backend, query, dir, identity, config, execute) {
  if (backend === 'qmd') return { hits: await qmdSearch(query, dir, identity, config, execute), calls: [] };
  return light('search', [], query, dir, config, identity, execute);
}
module.exports = { run, index, search, qmdIndex, qmdSearch, weightIdentity };
