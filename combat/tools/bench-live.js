// In-page live-play benchmark (paste into the console of either site, or run through the browser tools): same positions on both builds.
// Profiles: live_fast (100 ms), live_deep (500 ms), and the same at a quarter of the time as a slower-phone proxy; then the 1.5 s engine view.
(async () => {
  const E = await import('/engine.mjs'), G = Object.keys(E.LOADOUTS);
  let seed = 12345; const rnd = () => (seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 2 ** 32;
  const positions = [];
  for (let i = 0; i < 9; i++) for (const k of [0, 7, 15]) {
    const s = E.createState({ playerLoadout: G[i % 9], opponentLoadout: G[(i * 4 + 1) % 9], playerLevel: [20, 45, 70][i % 3], opponentLevel: [20, 45, 70][i % 3], firstLeader: i % 2 });
    for (let j = 0; j < k && !s.result; j++) { const l = E.legalActions(s); E.applyChoice(s, l[Math.floor(rnd() * l.length)]); }
    if (!s.result) positions.push(s);
  }
  const q = (a, p) => { a = [...a].sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.floor(p * a.length))]; };
  const out = { positions: positions.length };
  for (const [name, o] of [['fast 100ms', { computeProfile: 'live_fast' }], ['deep 500ms', { computeProfile: 'live_deep' }], ['fast/4 25ms', { computeProfile: 'live_fast', budgetMs: 25 }], ['deep/4 125ms', { computeProfile: 'live_deep', budgetMs: 125 }]]) {
    const d = [], ms = [], n = [];
    for (const s of positions) { const r = E.chooseAIAction(structuredClone(s), o); d.push(r.completedDepth); ms.push(r.elapsedMs); n.push(r.totalNodes); }
    out[name] = { depth: +(d.reduce((a, b) => a + b) / d.length).toFixed(2), minDepth: Math.min(...d), medMs: +q(ms, .5).toFixed(1), p95Ms: +q(ms, .95).toFixed(1), nodesPerMs: Math.round(n.reduce((a, b) => a + b) / ms.reduce((a, b) => a + b)) };
  }
  const view = [];
  for (const s of positions.filter((_, i) => i % 4 === 0)) {
    const ctx = E.createSearchContext({ tableLimit: 65536 }), start = performance.now(); let depth = 0;
    for (let k = 1; k <= 12; k++) { const left = 1500 - (performance.now() - start); if (left <= 0) break; const r = E.searchAction(structuredClone(s), { maxDepth: k, nodeBudget: 20000000, budgetMs: left, rankActions: true, prune: true, horizonMode: 'tactical' }, ctx); if (r.completedDepth < k) break; depth = k; if (Math.abs(Math.max(...r.rankedActions.map(a => a.value))) >= 9000) break; }
    view.push(depth);
  }
  out['engine view 1.5s'] = { depth: +(view.reduce((a, b) => a + b) / view.length).toFixed(2), minDepth: Math.min(...view), positions: view.length };
  return JSON.stringify(out);
})()
