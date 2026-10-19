/*
 * File storage for the server (design §1.3). No database: everything is plain files under data/.
 *
 *   data/runs/<runId>.ndjson                meta line(s) + hist entries, append-only (folded by tools/runlog.js);
 *                                           the meta carries `player` (set by the server, never by the client)
 *   data/players/<pid>/player.json          {createdAt, lastSeenAt, revoked}
 *   data/players/<pid>/saves/<slot>.json    engine saves: slot "auto" and "1".."3"
 *   data/players/<pid>/seen.json            cross-run counters: {eventId: {runs_seen, last_run, last_at}}
 *
 * <pid> is a hash of the player's code (server/auth.js). Saves from before player codes (data/saves/,
 * data/seen.json) are left alone and no longer read.
 * JSON files are written atomically (temp file + rename). Appends are single writes per batch, so a crash
 * can at most tear the last line, which the reader skips.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const RunLog = require('../tools/runlog.js');

const SLOTS = ['auto', '1', '2', '3'];
const RUN_ID = /^[A-Za-z0-9_~.-]{1,100}$/;
const PID = /^[0-9a-f]{24}$/;
const DEVICE = /^[\w-]{1,40}$/;

function createStore(dataDir, { maxRunBytes = 32 * 1024 * 1024 } = {}) {
  const dirs = { runs: path.join(dataDir, 'runs'), players: path.join(dataDir, 'players') };
  Object.values(dirs).forEach((d) => fs.mkdirSync(d, { recursive: true }));

  function writeJSON(file, obj) {
    const tmp = file + '.' + process.pid + '.' + Date.now() + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(obj));
    fs.renameSync(tmp, file);
  }
  function readJSON(file, dflt) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return dflt; } }
  const runFile = (id) => { if (!RUN_ID.test(String(id))) throw httpError(400, 'bad run id'); return path.join(dirs.runs, id + '.ndjson'); };
  const playerDir = (pid) => { if (!PID.test(String(pid))) throw httpError(400, 'bad player'); return path.join(dirs.players, pid); };
  // The player a run file belongs to: the first meta line that names one.
  function runOwner(file) {
    const fd = fs.openSync(file, 'r');
    try {
      const buf = Buffer.alloc(4096);
      const n = fs.readSync(fd, buf, 0, buf.length, 0);
      const m = buf.toString('utf8', 0, n).match(/"player":"([0-9a-f]{24})"/);
      return m ? m[1] : null;
    } finally { fs.closeSync(fd); }
  }

  // Saves and seen counters of one player.
  function forPlayer(pid) {
    const dir = playerDir(pid);
    const savesDir = path.join(dir, 'saves');
    const seenPath = path.join(dir, 'seen.json');
    const slotFile = (slot) => { if (!SLOTS.includes(slot)) throw httpError(404, 'no such slot'); return path.join(savesDir, slot + '.json'); };
    return {
      listSaves() {
        return SLOTS.map((slot) => {
          const s = readJSON(path.join(savesDir, slot + '.json'), null);
          return s ? { slot, updatedAt: s.updatedAt, device: s.device || null, runId: s.data && s.data.runId, name: s.data && s.data.name, turn: s.data && s.data.turn } : { slot, empty: true };
        });
      },
      // The engine save, or null for an empty slot. `withMeta` returns {updatedAt, device, data} instead.
      getSave(slot, withMeta) { const s = readJSON(slotFile(slot), null); return s ? (withMeta ? { updatedAt: s.updatedAt, device: s.device || null, data: s.data } : s.data) : null; },
      putSave(slot, data, device) {
        const f = slotFile(slot);
        if (!data || typeof data !== 'object' || data.version == null || !data.vals) throw httpError(400, 'not an engine save');
        fs.mkdirSync(savesDir, { recursive: true });
        writeJSON(f, { slot, updatedAt: Date.now(), device: DEVICE.test(String(device)) ? device : null, data });
      },
      deleteSave(slot) { const f = slotFile(slot); try { fs.unlinkSync(f); } catch (e) { /* already gone */ } },
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

  return {
    dataDir,
    forPlayer,
    // ---- players
    createPlayer(pid) {
      const dir = playerDir(pid);
      if (fs.existsSync(dir)) throw httpError(409, 'player exists');
      fs.mkdirSync(path.join(dir, 'saves'), { recursive: true });
      const now = Date.now();
      writeJSON(path.join(dir, 'player.json'), { createdAt: now, lastSeenAt: now, revoked: false });
    },
    getPlayer(pid) { return PID.test(String(pid)) ? readJSON(path.join(dirs.players, pid, 'player.json'), null) : null; },
    // Records activity at most once a minute (one small write).
    touchPlayer(pid) {
      const f = path.join(playerDir(pid), 'player.json');
      const p = readJSON(f, null);
      if (p && Date.now() - (p.lastSeenAt || 0) > 60000) writeJSON(f, Object.assign(p, { lastSeenAt: Date.now() }));
    },
    setRevoked(pid, revoked) {
      const f = path.join(playerDir(pid), 'player.json');
      const p = readJSON(f, null);
      if (!p) throw httpError(404, 'no such player');
      writeJSON(f, Object.assign(p, { revoked: !!revoked }));
    },
    listPlayers() {
      return fs.readdirSync(dirs.players).filter((d) => PID.test(d)).map((pid) => Object.assign({ pid }, readJSON(path.join(dirs.players, pid, 'player.json'), {})));
    },
    playerCount() { return fs.readdirSync(dirs.players).filter((d) => PID.test(d)).length; },

    // ---- telemetry: one batch = run meta + any number of hist entries, from player `pid`.
    appendRun(meta, entries, pid) {
      if (!meta || !meta.runId) throw httpError(400, 'run.runId required');
      if (!Array.isArray(entries)) throw httpError(400, 'entries must be an array');
      const file = runFile(meta.runId);
      if (fs.existsSync(file)) {
        const owner = runOwner(file);
        if (owner && pid && owner !== pid) throw httpError(403, 'run belongs to another player');
        if (fs.statSync(file).size > maxRunBytes) throw httpError(413, 'run log too large');
      }
      const lines = [JSON.stringify(Object.assign({}, meta, { t: 'meta', updatedAt: Date.now(), player: pid || null }))];
      for (const e of entries) { if (!e || typeof e !== 'object' || typeof e.t !== 'string') throw httpError(400, 'bad entry'); lines.push(JSON.stringify(e)); }
      fs.appendFileSync(file, lines.join('\n') + '\n');
      return entries.length;
    },
    readRun(id) { const f = runFile(id); return fs.existsSync(f) ? RunLog.foldNdjson(fs.readFileSync(f, 'utf8')) : null; },
    listRuns() {
      return fs.readdirSync(dirs.runs).filter((f) => f.endsWith('.ndjson')).map((f) => RunLog.foldNdjson(fs.readFileSync(path.join(dirs.runs, f), 'utf8'))).filter(Boolean)
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    },
  };
}

function httpError(status, message) { const e = new Error(message); e.status = status; return e; }

module.exports = { createStore, httpError, SLOTS };
