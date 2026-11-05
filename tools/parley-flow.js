// Small paired campaign comparison, not a tuning optimum. Each mode can branch into different later cards.
// node tools/parley-flow.js --out <new-file.json> [--seed 13]
'use strict';
const fs = require('fs'), path = require('path');
const Engine = require('../src/engine.js'), Policies = require('./policies.js');
const B = require('../src/parley.js');
const { project } = require('./project.js');
const args = process.argv.slice(2), arg = (key) => args[args.indexOf(key) + 1];
if (!args.includes('--out')) throw Error('Supply --out <new-file.json>; existing results are never overwritten.');
const output = path.resolve(arg('--out'));
if (fs.existsSync(output)) throw Error('Result already exists: ' + output);
const seed = args.includes('--seed') ? Number(arg('--seed')) : 13;
if (!Number.isSafeInteger(seed)) throw Error('Seed must be an integer');
const P = project(path.resolve(__dirname, '..')), { content, errors } = P.compileAll();
if (errors.length) throw Error('Content did not compile');
const report = { seed, contentHash: P.contentHash(), rules: require('../build/crux.bundle.js').rules,
  note: 'One seed per style; descriptive smoke comparison only. Resource totals are net Crux deltas, excluding authored branches. Modes can reach different cards.', games: [] };
for (const style of ['balanced', 'social', 'random']) for (const scale of [null, 0.5, 1]) {
  const c = { ...content, balance: { ...content.balance, parley_scale: scale == null ? 0.5 : scale } }, e = new Engine(c), meetings = [];
  if (scale != null) e.parleys = (req) => {
    const result = B.autoplay(req, { bot: style === 'random' ? 'naive' : 'smart' });
    meetings.push({ request: req.id, event: req.event, outcome: result.outcome, deltas: result.deltas }); return result;
  };
  Policies.play(e, Policies.get(style), { seed, name: 'Crux flow', runId: 'crux-flow', strict: true, parleys: scale != null });
  const checks = e.s.hist.flatMap((h) => h.out?.checks || []).filter((x) => x.parley);
  const net = {}; for (const m of meetings) for (const [k, v] of Object.entries(m.deltas)) net[k] = (net[k] || 0) + v;
  const game = { style, scale, ending: e.s.ended, turn: e.s.turn, negotiations: checks.length,
    outcomes: Object.fromEntries(['win', 'partial', 'lose'].map((key) => [key, checks.filter((x) => x.result === key).length])), net, final: e.s.vals, meetings };
  report.games.push(game);
  console.log(style, scale == null ? 'roll' : scale, checks.length, 'negotiations', JSON.stringify(net));
}
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log('Saved ' + output);
