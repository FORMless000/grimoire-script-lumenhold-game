/*
 * Lumenhold client ↔ server (design §1). Optional: when the page isn't served by `npm start`
 * (e.g. opened as a file), Net.available stays false and the game uses localStorage only.
 *
 *   await Net.detect()                  is the Lumenhold server there?
 *   Net.flush(eng, meta, {final})       send new / changed run-history entries (telemetry)
 *   Net.markDirty(n)                    a hist entry changed after it was sent (feedback)
 *   Net.listSaves() / getSave(slot) / putSave(slot, json)
 *   Net.addSeen(runId, eventIds)        cross-run "seen" counters (for the director)
 *
 * A `?token=` in the page URL is sent along, for servers that require ADMIN_TOKEN.
 */
(function (root) {
  'use strict';
  const STATE_KEY = 'lumenhold.telemetry.v1';
  const token = new URLSearchParams(location.search).get('token');
  const headers = (json) => Object.assign(json ? { 'Content-Type': 'application/json' } : {}, token ? { 'X-Admin-Token': token } : {});
  const store = {
    get() { try { return JSON.parse(localStorage.getItem(STATE_KEY) || '{}'); } catch (e) { return {}; } },
    set(v) { try { localStorage.setItem(STATE_KEY, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
  };
  async function call(method, p, body, opts = {}) {
    const r = await fetch(p, { method, headers: headers(body !== undefined), body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)), cache: 'no-store', keepalive: !!opts.keepalive });
    if (!r.ok) throw new Error(p + ': ' + r.status);
    return r.json();
  }

  const Net = {
    available: false,
    info: null,
    async detect() {
      if (!/^https?:$/.test(location.protocol)) return false;
      try {
        const j = await call('GET', 'api/health');
        if (j && j.server === 'lumenhold') { this.available = true; this.info = j; }
      } catch (e) { /* static hosting without the API */ }
      return this.available;
    },

    /* ---------------- telemetry: the engine's run history, sent in batches */
    _inflight: false,
    markDirty(runId, n) { const st = store.get(); const r = st[runId] = st[runId] || { sent: 0, dirty: [] }; if (!r.dirty.includes(n)) r.dirty.push(n); store.set(st); },
    // Sends hist entries not yet acknowledged, plus re-sends of changed ones. Entries after the first
    // unresolved card are sent too but stay pending, so their resolution is sent again later.
    flush(eng, meta, { final = false } = {}) {
      if (!this.available || !eng || !eng.s || !eng.s.hist) return Promise.resolve(false);
      if (this._inflight && !final) return Promise.resolve(false);
      const s = eng.s, h = s.hist;
      const st = store.get();
      const r = st[s.runId] = st[s.runId] || { sent: 0, dirty: [] };
      let settled = h.length;
      for (let i = r.sent; i < h.length; i++) if (h[i].t === 'card' && h[i].choice == null) { settled = i; break; }
      const entries = h.slice(r.sent);
      for (const n of r.dirty) { const e = eng.histEntry(n); if (e && h.indexOf(e) < r.sent) entries.push(e); }
      if (!entries.length) return Promise.resolve(true);
      const body = JSON.stringify({ run: meta, entries });
      const sentDirty = r.dirty.slice();
      this._inflight = true;
      return call('POST', 'api/log', body, { keepalive: final && body.length < 60000 })
        .then(() => {
          const now = store.get(); const cur = now[s.runId] = now[s.runId] || { sent: 0, dirty: [] };
          cur.sent = Math.max(cur.sent, settled);
          cur.dirty = cur.dirty.filter((n) => !sentDirty.includes(n));
          // Forget finished runs' bookkeeping after a while: keep the 20 most recent.
          const ids = Object.keys(now); if (ids.length > 20) ids.slice(0, ids.length - 20).forEach((k) => delete now[k]);
          store.set(now);
          return true;
        })
        .catch((e) => { console.warn('[net] log', e.message); return false; })
        .finally(() => { this._inflight = false; });
    },

    /* ---------------- saves */
    listSaves() { return call('GET', 'api/saves'); },
    getSave(slot) { return call('GET', 'api/saves/' + slot); },
    putSave(slot, json) { return call('PUT', 'api/saves/' + slot, json); },
    deleteSave(slot) { return call('DELETE', 'api/saves/' + slot); },

    /* ---------------- cross-run seen counters */
    addSeen(runId, events) { return call('POST', 'api/seen', { runId, events }).catch((e) => console.warn('[net] seen', e.message)); },
  };
  root.Net = Net;
})(typeof self !== 'undefined' ? self : this);
