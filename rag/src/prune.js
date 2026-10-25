'use strict';
// Keeps the retrieval cache to what retrieval and the next incremental sync need (rag/AUTHORING.md, "Maintain the
// index"), so outdated index data is deleted as soon as a fresh index is published.
//
// Kept, in the active extraction identity's folder: the manifest (index.json), the build log (builds.jsonl) and the
// manifest's revision. A sync clones that revision, request caches included, so it is all the next sync reuses.
// Deleted: every other revision and batch journal there, and the folders of every other extraction identity (indexes
// orphaned by a configuration change). An unfinished update (pending.json or a writer lock) keeps its whole folder,
// and a folder whose writer is still alive is never touched.
//
// Kept outside the files hashed into the extraction identity (retrieve.js, catalog.js, the adapter), so changing it
// never orphans the index.
const fs = require('fs');
const path = require('path');
const R = require('./retrieve.js');

const alive = (lock) => {
  try { process.kill(JSON.parse(fs.readFileSync(lock, 'utf8')).pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
};
const size = (p) => {
  const st = fs.lstatSync(p);
  return st.isDirectory() ? fs.readdirSync(p).reduce((n, f) => n + size(path.join(p, f)), 0) : st.size;
};

// What to delete under <cache>/lightrag for the active configuration: [{ path, why }].
function plan(cache, cfg) {
  const base = path.join(cache, 'lightrag'), active = R.extractionIdentity(cfg), out = [];
  if (!fs.existsSync(base)) return out;
  for (const id of fs.readdirSync(base)) {
    const dir = path.join(base, id);
    if (!fs.statSync(dir).isDirectory()) continue;
    const lock = path.join(dir, 'writer.lock');
    if (fs.existsSync(lock) && alive(lock)) continue;
    if (id !== active) { out.push({ path: dir, why: 'another extraction identity (orphaned by a configuration change)' }); continue; }
    if (fs.existsSync(lock) || fs.existsSync(path.join(dir, 'pending.json'))) continue;
    const manifest = path.join(dir, 'index.json');
    if (!fs.existsSync(manifest)) continue;
    const keep = path.basename(JSON.parse(fs.readFileSync(manifest, 'utf8')).storage);
    const revisions = path.join(dir, 'revisions'), jobs = path.join(dir, 'jobs');
    if (fs.existsSync(revisions)) for (const r of fs.readdirSync(revisions)) if (r !== keep) out.push({ path: path.join(revisions, r), why: 'a revision the manifest no longer uses' });
    if (fs.existsSync(jobs)) out.push({ path: jobs, why: 'batch journals of finished updates' });
  }
  return out;
}

function prune(cache, cfg, { dryRun = false } = {}) {
  const items = plan(cache, cfg).map((x) => ({ ...x, bytes: size(x.path) }));
  if (!dryRun) for (const x of items) fs.rmSync(x.path, { recursive: true, force: true });
  return { dryRun, removed: items, bytes: items.reduce((n, x) => n + x.bytes, 0) };
}

module.exports = { plan, prune };
