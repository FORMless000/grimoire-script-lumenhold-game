/*
 * File storage for the server (design §1.3). No database: everything is plain files under data/.
 *
 *   data/runs/<runId>.ndjson   meta line(s) + hist entries, append-only (folded by tools/runlog.js)
 *   data/saves/<slot>.json     engine saves: slot "auto" and "1".."3"
 *   data/seen.json             cross-run counters: {eventId: {runs_seen, last_run, last_at}}
 *
 * JSON files are written atomically (temp file + rename). Appends are single writes per batch, so a crash
 * can at most tear the last line, which the reader skips.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const RunLog = require('../tools/runlog.js');

const SLOTS = ['auto', '1', '2', '3'];
const RUN_ID = /^[A-Za-z0-9_~.-]{1,100}$/;

function createStore(dataDir) {
  const dirs = { runs: path.join(dataDir, 'runs'), saves: path.join(dataDir, 'saves') };
  Object.values(dirs).forEach((d) => fs.mkdirSync(d, { recursive: true }));
  const seenPath = path.join(dataDir, 'seen.json');

  function writeJSON(file, obj) {
    const tmp = file + '.' + process.pid + '.' + Date.now() + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(obj));
    fs.renameSync(tmp, file);
  }
  function readJSON(file, dflt) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return dflt; } }
  const runFile = (id) => { if (!RUN_ID.test(String(id))) throw httpError(400, 'bad run id'); return path.join(dirs.runs, id + '.ndjson'); };

  return {
    dataDir,
    // Telemetry: one batch = run meta + any number of hist entries.
    appendRun(meta, entries) {
      if (!meta || !meta.runId) throw httpError(400, 'run.runId required');
      if (!Array.isArray(entries)) throw httpError(400, 'entries must be an array');
      const lines = [JSON.stringify(Object.assign({}, meta, { t: 'meta', updatedAt: Date.now() }))];
      for (const e of entries) { if (!e || typeof e !== 'object' || typeof e.t !== 'string') throw httpError(400, 'bad entry'); lines.push(JSON.stringify(e)); }
      fs.appendFileSync(runFile(meta.runId), lines.join('\n') + '\n');
      return entries.length;
    },
    readRun(id) { const f = runFile(id); return fs.existsSync(f) ? RunLog.foldNdjson(fs.readFileSync(f, 'utf8')) : null; },
    listRuns() {
      return fs.readdirSync(dirs.runs).filter((f) => f.endsWith('.ndjson')).map((f) => RunLog.foldNdjson(fs.readFileSync(path.join(dirs.runs, f), 'utf8'))).filter(Boolean)
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    },
    // Saves
    listSaves() {
      return SLOTS.map((slot) => {
        const s = readJSON(path.join(dirs.saves, slot + '.json'), null);
        return s ? { slot, updatedAt: s.updatedAt, runId: s.data && s.data.runId, name: s.data && s.data.name, turn: s.data && s.data.turn } : { slot, empty: true };
      });
    },
    getSave(slot) { if (!SLOTS.includes(slot)) throw httpError(404, 'no such slot'); const s = readJSON(path.join(dirs.saves, slot + '.json'), null); return s && s.data; },
    putSave(slot, data) {
      if (!SLOTS.includes(slot)) throw httpError(404, 'no such slot');
      if (!data || typeof data !== 'object' || data.version == null || !data.vals) throw httpError(400, 'not an engine save');
      writeJSON(path.join(dirs.saves, slot + '.json'), { slot, updatedAt: Date.now(), data });
    },
    deleteSave(slot) { if (!SLOTS.includes(slot)) throw httpError(404, 'no such slot'); try { fs.unlinkSync(path.join(dirs.saves, slot + '.json')); } catch (e) { /* already gone */ } },
    // Cross-run "seen" counters (design §5.2): each event counts once per run.
    getSeen() { return readJSON(seenPath, {}); },
    addSeen(runId, ids) {
      if (!RUN_ID.test(String(runId)) || !Array.isArray(ids)) throw httpError(400, 'runId and events[] required');
      const seen = readJSON(seenPath, {});
      const at = Date.now();
      for (const id of new Set(ids)) {
        if (typeof id !== 'string') continue;
        const c = seen[id] = seen[id] || { runs_seen: 0, last_run: null, last_at: null };
        if (c.last_run === runId) continue;
        c.runs_seen++; c.last_run = runId; c.last_at = at;
      }
      writeJSON(seenPath, seen);
      return seen;
    },
  };
}

function httpError(status, message) { const e = new Error(message); e.status = status; return e; }

module.exports = { createStore, httpError, SLOTS };
