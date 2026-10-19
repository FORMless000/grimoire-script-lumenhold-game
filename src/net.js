/*
 * Lumenhold client ↔ server (design §1). Optional: when the page isn't served by `npm start`
 * (e.g. opened as a file), Net.available stays false and the game uses localStorage only.
 *
 *   await Net.detect()                  is the Lumenhold server there, and do we have a player code?
 *   Net.flush(eng, meta, {final})       send new / changed run-history entries (telemetry), plus client errors
 *   Net.markDirty(n)                    a hist entry changed after it was sent (feedback)
 *   Net.uploadRun(record)               send a whole archived run (the outbox); idempotent
 *   Net.reportError(msg, src)           queue a client error for the current run's next batch
 *   Net.listSaves() / getSave(slot, withMeta) / putSave(slot, json)
 *   Net.getSeen() / addSeen(runId, eventIds)   cross-run "seen" counters (for the director)
 *   Net.code() / useCode(code) / syncLink()    the player code, which is also the sync code for other devices
 *   Net.takeSwitched()                  true once after useCode replaced the code
 *
 * The player code is minted by the server on the first visit (with ?invite=… when the server requires
 * one) and kept in this browser. Opening …/?sync=CODE on another device adopts it, sharing the saves.
 */
(function (root) {
  'use strict';
  const STATE_KEY = 'lumenhold.telemetry.v1';
  const PLAYER_KEY = 'lumenhold.player.v1';
  const DEVICE_KEY = 'lumenhold.device.v1';
  const SWITCHED_KEY = 'lumenhold.player.switched';   // set when a sync code replaced this browser's code
  const MAX_ERRORS = 20;   // per page visit
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } },
  };
  const store = {
    get() { try { return JSON.parse(ls.get(STATE_KEY) || '{}'); } catch (e) { return {}; } },
    set(v) { ls.set(STATE_KEY, JSON.stringify(v)); },
  };
  const randomId = (n) => { const a = new Uint8Array(n); (root.crypto || {}).getRandomValues ? root.crypto.getRandomValues(a) : a.forEach((_, i) => { a[i] = Math.random() * 256; }); return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join(''); };
  let device = ls.get(DEVICE_KEY);
  if (!device) { device = 'd' + randomId(6); ls.set(DEVICE_KEY, device); }
  // Same forgiving form as the server (server/auth.js): case, dashes and spaces don't matter.
  const tidyCode = (s) => {
    const c = String(s || '').toUpperCase().replace(/[\s-]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
    return /^[0-9A-HJKMNP-TV-Z]{16}$/.test(c) ? c.match(/.{4}/g).join('-') : null;
  };
  let code = tidyCode(ls.get(PLAYER_KEY));

  async function call(method, p, body, opts = {}) {
    const headers = Object.assign(body !== undefined ? { 'Content-Type': 'application/json' } : {}, (opts.code || code) ? { 'X-Player': opts.code || code } : {});
    const r = await fetch(p, { method, headers, body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)), cache: 'no-store', keepalive: !!opts.keepalive });
    if (!r.ok) { const e = new Error(p + ': ' + r.status); e.status = r.status; throw e; }
    return r.json();
  }
  // Removes ?invite= and ?sync= from the address bar, so they aren't bookmarked or shared by accident.
  function dropParams(names) {
    try {
      const u = new URL(location.href);
      if (!names.some((n) => u.searchParams.has(n))) return;
      names.forEach((n) => u.searchParams.delete(n));
      history.replaceState(null, '', u.toString());
    } catch (e) { /* ignore */ }
  }

  const Net = {
    available: false,
    info: null,
    device,
    // Why there's no player code, when the server is there: 'invite' (one is needed) or 'sync' (a bad sync link).
    problem: null,
    async detect() {
      if (!/^https?:$/.test(location.protocol)) return false;
      try {
        const j = await call('GET', 'api/health');
        if (!j || j.server !== 'lumenhold') return false;
        this.info = j;
      } catch (e) { return false; }   // static hosting without the API
      const params = new URLSearchParams(location.search);
      const sync = params.get('sync'), invite = params.get('invite');
      dropParams(['sync', 'invite']);
      if (sync) {
        if (await this.useCode(sync)) return (this.available = true);
        this.problem = 'sync';
      }
      if (code) {
        try { await call('GET', 'api/player'); return (this.available = true); } catch (e) { if (e.status !== 401) return false; }
        code = null; ls.del(PLAYER_KEY);   // unknown or revoked: get a new one below
      }
      if (this.info.invite && !invite) { this.problem = this.problem || 'invite'; return false; }
      try {
        const r = await call('POST', 'api/player', { invite: invite || undefined });
        code = r.code; ls.set(PLAYER_KEY, code);
        this.problem = null;
        return (this.available = true);
      } catch (e) { console.warn('[net] player code', e.message); this.problem = e.status === 403 ? 'invite' : null; return false; }
    },
    code() { return code; },
    // True once after switching codes (survives the reload): the code's own autosave should take over.
    takeSwitched() { const v = ls.get(SWITCHED_KEY) === '1'; ls.del(SWITCHED_KEY); return v; },
    syncLink() { if (!code) return null; const u = new URL(location.href); u.search = '?sync=' + code; u.hash = ''; return u.toString(); },
    // Adopts a code typed or opened on this device, after the server confirms it. True on success.
    async useCode(s) {
      const c = tidyCode(s);
      if (!c) return false;
      try { await call('GET', 'api/player', undefined, { code: c }); } catch (e) { return false; }
      if (c !== code) ls.set(SWITCHED_KEY, '1');
      code = c; ls.set(PLAYER_KEY, c); store.set({});   // telemetry bookkeeping belonged to the old code's runs
      this.problem = null;
      return true;
    },

    /* ---------------- telemetry: the engine's run history, sent in batches */
    _inflight: false,
    _errors: [],
    _errorCount: 0,
    markDirty(runId, n) { const st = store.get(); const r = st[runId] = st[runId] || { sent: 0, dirty: [] }; if (!r.dirty.includes(n)) r.dirty.push(n); store.set(st); },
    reportError(msg, src) {
      if (this._errorCount >= MAX_ERRORS) return;
      this._errorCount++;
      this._errors.push({ t: 'error', msg: String(msg || '').slice(0, 500), src: String(src || '').slice(0, 200), at: Date.now(), page: location.pathname });
    },
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
      const errors = this._errors.splice(0);
      entries.push(...errors);
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
        .catch((e) => { this._errors.unshift(...errors); console.warn('[net] log', e.message); return false; })
        .finally(() => { this._inflight = false; });
    },
    // A whole run record (from the local archive) in chunks. Re-sending is harmless: the server keeps the
    // last copy of each entry. Resolves 'ok', 'gone' (the server won't take it: another player's run) or false.
    async uploadRun(rec) {
      if (!this.available || !rec || !rec.runId || !Array.isArray(rec.hist)) return false;
      const meta = Object.assign({}, rec); delete meta.hist; delete meta.synced;
      try {
        for (let i = 0; i < Math.max(rec.hist.length, 1); i += 1000) await call('POST', 'api/log', { run: meta, entries: rec.hist.slice(i, i + 1000) });
        return 'ok';
      } catch (e) { if (e.status === 403 || e.status === 413 || e.status === 400) return 'gone'; console.warn('[net] upload', e.message); return false; }
    },

    /* ---------------- saves */
    listSaves() { return call('GET', 'api/saves'); },
    // withMeta: {updatedAt, device, data} instead of the engine save.
    getSave(slot, withMeta) { return call('GET', 'api/saves/' + slot + (withMeta ? '?meta=1' : '')); },
    putSave(slot, json) { return call('PUT', 'api/saves/' + slot + '?device=' + device, json); },
    deleteSave(slot) { return call('DELETE', 'api/saves/' + slot); },

    /* ---------------- cross-run seen counters */
    getSeen() { return call('GET', 'api/seen'); },
    addSeen(runId, events) { return call('POST', 'api/seen', { runId, events }).catch((e) => console.warn('[net] seen', e.message)); },
  };
  root.Net = Net;
})(typeof self !== 'undefined' ? self : this);
