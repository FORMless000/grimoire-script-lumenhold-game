/*
 * Run logs: reading them and summarising playtest feedback. Shared by `grim feedback` and the server.
 *
 * A run is stored by the server as NDJSON (data/runs/<runId>.ndjson): `{"t":"meta",…}` lines carry the run's
 * metadata and every other line is a hist entry (see src/engine.js "Run history"). Entries are re-appended
 * when they change (a card's choice, feedback edits), so readers fold them: the last copy of an entry wins.
 * Exported files from the static game hold the same run records as JSON ({format:'lumenhold-run(s)'}).
 */
'use strict';
const fs = require('fs');
const path = require('path');

// Identity of a hist entry, so re-sent copies replace earlier ones.
function entryKey(h) {
  if (h.n != null) return 'n' + h.n;
  if (h.t === 'month') return 'm' + h.turn;
  if (h.t === 'start') return 's';
  return h.t + ':' + (h.at || '');
}

// NDJSON text -> run record (meta fields + hist), or null when there's no meta line.
function foldNdjson(text) {
  let meta = null;
  const order = [], byKey = new Map();
  for (const line of String(text).split('\n')) {
    if (!line.trim()) continue;
    let o; try { o = JSON.parse(line); } catch (e) { continue; }   // a torn last line after a crash
    if (o.t === 'meta') { meta = Object.assign(meta || {}, o); continue; }
    const k = entryKey(o);
    if (!byKey.has(k)) order.push(k);
    byKey.set(k, o);
  }
  if (!meta) return null;
  delete meta.t;
  const hist = order.map((k) => byKey.get(k));
  const ended = hist.find((h) => h.t === 'end');
  return Object.assign({ format: 'lumenhold-run', v: 1 }, meta, {
    hist,
    turn: hist.reduce((t, h) => Math.max(t, h.turn || 0), meta.turn || 0),
    ended: ended ? { id: ended.id, turn: ended.turn } : (meta.ended || null),
    feedback: hist.filter((h) => h.fb).length,
  });
}

// Every run in a list of files/directories: .json exports and .ndjson server logs. Duplicates keep the newest.
function loadRuns(paths) {
  const files = [];
  const walk = (p) => {
    if (!fs.existsSync(p)) return;
    if (fs.statSync(p).isDirectory()) { for (const f of fs.readdirSync(p).sort()) walk(path.join(p, f)); return; }
    if (/\.(json|ndjson)$/.test(p)) files.push(p);
  };
  paths.forEach(walk);
  const runs = {}, skipped = [];
  for (const f of files) {
    const text = fs.readFileSync(f, 'utf8');
    let recs = [];
    if (f.endsWith('.ndjson')) { const r = foldNdjson(text); if (r) recs = [r]; }
    else {
      let data; try { data = JSON.parse(text); } catch (e) { skipped.push(f + ': ' + e.message); continue; }
      recs = data.format === 'lumenhold-runs' ? data.runs || [] : data.format === 'lumenhold-run' ? [data] : [];
    }
    for (const r of recs) {
      if (!r || !Array.isArray(r.hist)) continue;
      if (!runs[r.runId] || (r.updatedAt || 0) >= (runs[r.runId].updatedAt || 0)) runs[r.runId] = r;
    }
  }
  return { runs: Object.values(runs), files, skipped };
}

// Feedback grouped by event (endings as "<id> (ending)"), most net-negative first.
function aggregateFeedback(runs, { event = null, contentHash = null } = {}) {
  const byEvent = {};
  let total = 0;
  const ids = new Set(runs.map((r) => r.runId));
  for (const r of runs) r.hist.forEach((h, i) => {
    if (!h.fb) return;
    // A run continued from a loaded save inherits the history before its `fork` entry; that feedback is
    // counted with the original run (when it's in the data set).
    const fork = r.hist.findIndex((x) => x.t === 'fork');
    if (fork > i && ids.has(r.hist[fork].from)) return;
    if (event && h.id !== event) return;
    const key = h.t === 'end' ? h.id + ' (ending)' : h.id;
    const b = byEvent[key] = byEvent[key] || { id: h.id, ending: h.t === 'end', up: 0, down: 0, notes: [] };
    if (h.fb.rating === 'up') b.up++; else if (h.fb.rating === 'down') b.down++;
    b.notes.push({ rating: h.fb.rating, comment: h.fb.comment, choice: h.label || null, actor: h.actor || null, turn: h.turn, run: r.runId, lang: r.lang, sim: r.sim || null, stale: !!(contentHash && r.contentHash && r.contentHash !== contentHash), title: h.title });
    total++;
  });
  const rows = Object.entries(byEvent).sort((a, b) => (b[1].down - b[1].up) - (a[1].down - a[1].up) || b[1].notes.length - a[1].notes.length);
  return { total, rows };
}

// One-line summaries for run lists.
function summarize(r) {
  const cards = r.hist.filter((h) => h.t === 'card');
  const decide = cards.filter((h) => h.chosenAt && h.at).map((h) => h.chosenAt - h.at);
  return {
    runId: r.runId, name: r.name, seed: r.seed, lang: r.lang, sim: r.sim || null, contentHash: r.contentHash,
    startedAt: r.startedAt, updatedAt: r.updatedAt, turn: r.turn, ended: r.ended, feedback: r.feedback,
    cards: cards.length, medianDecideMs: decide.length ? decide.sort((a, b) => a - b)[Math.floor(decide.length / 2)] : null,
  };
}

module.exports = { entryKey, foldNdjson, loadRuns, aggregateFeedback, summarize };
