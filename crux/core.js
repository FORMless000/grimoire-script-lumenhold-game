/*
 * Crux's rules and engine for the page: the Rust core (rust/), compiled to WebAssembly and inlined in crux-wasm.js
 * (build-wasm.js). The page reads a game only through its view (rust/core/src/view.rs) and plays it by move keys.
 *
 *   CruxCore.statics                       the tune, the spell kinds, the loadouts
 *   const g = CruxCore.newGame(setup)      setup: { seed, level, enc, loadout, gap, skip, mana, crowns, health, renown }
 *   g.view                                 everything the page shows, its log included
 *   g.play(key)                            'press', 'confront:<uid>', 'deflect:<uid>', 'cast:<spell>', 'bury',
 *                                          'fact:<id>:<uid>', 'leave'; throws with the reason when it can't be played
 *   const a = CruxCore.analyst(onReport)   the engine, in a Web Worker: a.search(g) searches g depth by depth,
 *                                          onReport(report, running) after each; a.stop()
 * Works from file:// (classic scripts, the worker from a blob).
 */
(function (root) {
  'use strict';

  // The wasm's C ABI, wrapped: strings in through alloc, out through the output buffer. Self-contained, as the worker
  // runs it too (its source goes into the worker's blob).
  function makeCore(module) {
    const W = new WebAssembly.Instance(module, {}).exports;
    W.init();
    const enc = new TextEncoder(), dec = new TextDecoder();
    const read = () => dec.decode(new Uint8Array(W.memory.buffer, W.out_ptr(), W.out_len()));
    const call = (f, s) => {
      const b = enc.encode(s), p = W.alloc(b.length);
      new Uint8Array(W.memory.buffer, p, b.length).set(b);
      try { return f(p, b.length); } catch (e) { throw Error(read() || e.message); } finally { W.dealloc(p, b.length); }
    };
    const check = (status) => { if (status) throw Error(read()); };
    return {
      statics() { W.statics(); return JSON.parse(read()); },
      newGame(setup) { check(call(W.new_game, JSON.stringify(setup))); },
      play(key) { check(call(W.play, key)); },
      autoplay(bot) { check(call(W.auto_play, bot)); return JSON.parse(read()); },
      view() { W.view(); return JSON.parse(read()); },
      analyzeStart() { W.analyze_start(); },
      analyzeStep() { return !!W.analyze_step(); },
      report() { W.analyze_report(); return JSON.parse(read()); },
    };
  }

  // The worker: replays the game it is sent, then searches it a depth at a time, posting what it found after each,
  // until the search is done or its time is up.
  function workerMain() {
    let core = null;
    self.onmessage = ({ data }) => {
      if (data.module) { core = makeCore(data.module); return; }
      const t0 = Date.now();
      core.newGame(data.setup);
      for (const key of data.moves) core.play(key);
      core.analyzeStart();
      let more = true;
      while (more) {
        more = core.analyzeStep();
        const running = more && Date.now() - t0 < data.ms;
        self.postMessage({ report: core.report(), running, ms: Date.now() - t0 });
        if (!running) break;
      }
    };
  }

  let module, core, starting;
  const bytes = () => typeof Buffer !== 'undefined' ? new Uint8Array(Buffer.from(root.CRUX_WASM, 'base64')) : Uint8Array.from(atob(root.CRUX_WASM), (c) => c.charCodeAt(0));
  function ready(m) { module = m; core = makeCore(m); api.statics = core.statics(); return api; }
  function initSync() { return core ? api : ready(new WebAssembly.Module(bytes())); }
  function init() { return core ? Promise.resolve(api) : starting || (starting = WebAssembly.compile(bytes()).then(ready)); }
  let current = null;   // the game the wasm holds now

  // A game: its setup and moves, replayed into the wasm whenever another game took its place.
  function newGame(setup) {
    if (!core) throw Error('Crux is not initialized');
    const g = { setup: JSON.parse(JSON.stringify(setup)), moves: [], view: null };
    const load = () => { if (current !== g) { core.newGame(g.setup); for (const k of g.moves) core.play(k); current = g; } };
    core.newGame(g.setup);
    current = g;
    g.view = core.view();
    g.play = (key) => { load(); core.play(key); g.moves.push(key); g.view = core.view(); return g.view; };
    g.autoplay = (bot = 'smart') => { load(); g.moves.push(...core.autoplay(bot)); g.view = core.view(); return g.view; };
    return g;
  }

  // The engine runs in a worker, so the table stays responsive; a new position stops the old search (its worker is
  // ended) and starts another.
  const workerSource = `${makeCore};(${workerMain})();`;
  let url = null;
  function analyst(onReport, { ms = 8000 } = {}) {
    let worker = null;
    const stop = () => { if (worker) { worker.terminate(); worker = null; } };
    return {
      search(g) {
        stop();
        url = url || URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' }));
        const w = (worker = new Worker(url));
        w.onmessage = ({ data }) => { if (worker === w) onReport(data.report, data.running, data.ms); };
        w.onerror = (e) => { if (worker === w) onReport(null, false, 0, e.message); };
        w.postMessage({ module });
        w.postMessage({ setup: g.setup, moves: g.moves, ms });
      },
      stop,
    };
  }

  const api = root.CruxCore = { init, initSync, newGame, analyst };
})(typeof self !== 'undefined' ? self : this);
