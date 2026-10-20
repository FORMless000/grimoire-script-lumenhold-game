# Combat v04 search optimization findings

2026-10-16. Rules **combat-spells-v2-0.4.6**; policy **alpha-beta-2**. Combat numbers, loadouts, evaluator, and the resolver/settlement body are unchanged. The browser at <http://127.0.0.1:61040/> now offers Fast (100 ms, default) and Deep (500 ms) in Setup.

## Measured results

Environment: Apple M3, darwin/arm64, Node v20.20.1. There are 48 reproducible public positions: three levels, two commitment phases, and eight scenarios. Timing benchmarks ran without simulation workers. Desktop scheduling varied substantially; the primary comparisons alternate reference and optimized searches in one process and record both wall and process CPU time. CPU time includes V8 worker threads. These are desktop measurements, not phone-speed claims.

| Comparison | Result |
|---|---|
| Equal depth: one exchange, three paired repeats per position | 1.18× median paired wall speedup; 1.19× CPU speedup; all fixed-depth values and selected-action optimality checks passed |
| Equal budget: 5,000 nodes, one paired timing per position | 2.36× median paired wall speedup; 2.38× CPU speedup; 13 deeper / 29 equal / 6 shallower |
| Equal 100 ms deadline, fixed horizons | 17 deeper / 31 equal / 0 shallower |
| Equal 500 ms deadline, fixed horizons | 30 deeper / 12 equal / 6 shallower |

Speedup is the median of per-position time ratios, not a ratio of aggregate medians. Timed comparisons add only a cooperative deadline check to a frozen copy of the original AI. The main comparisons use fixed horizons so tactical extensions cannot inflate depth. Equal-time runs should improve completed depth rather than reduce the allocated time. One timing per position is preliminary evidence, not a confidence interval.

At 500 ms, depth regressions occurred in three depleted-Mana and three lethal responder positions. Every one retained the same selected action and the same value within floating-point roundoff. They are still reported as depth regressions. There is no action pruning or skipping draw checks.

| Scenario | 5,000-node wall speedup | 100 ms: deeper/equal/shallower | 500 ms: deeper/equal/shallower |
|---|---:|---:|---:|
| opening | 1.37× | 1/5/0 | 3/3/0 |
| depleted | 1.99× | 3/3/0 | 0/3/3 |
| lethal | 1.25× | 4/2/0 | 2/1/3 |
| foresight | 2.45× | 1/5/0 | 5/1/0 |
| haste | 1.56× | 3/3/0 | 6/0/0 |
| channel | 2.96× | 4/2/0 | 3/3/0 |
| omen | 3.71× | 0/6/0 | 6/0/0 |
| construct | 2.22× | 1/5/0 | 5/1/0 |

## Actual tactical profiles

The actual browser profiles use one bounded tactical extension, so their nominal depths are not directly comparable with the fixed-horizon table above. These measurements use fresh contexts per position; live games retain per-actor encounter contexts.

| Profile | Median search ms | p95 ms | Maximum ms | Median nominal depth | No completed iteration |
|---|---:|---:|---:|---:|---:|
| Fast 100 ms | 100.66 | 129.37 | 130.67 | 1 | 2/48 |
| Deep 500 ms | 500.12 | 516.31 | 532.39 | 2 | 0/48 |

Deadlines are cooperative: one rule-resolution operation, garbage collection, or OS scheduling can overrun them. The 100 ms tactical profile used its legal heuristic fallback in two all-spell stress positions; Deep completed at least one iteration throughout this suite. The real-browser quickstarts separately completed an iteration at all three levels for both profiles. An unfinished iteration never replaces a completed result.

## Implementation and correctness

- Legal lists and ordering scores are computed once per expansion; validated public application and unchecked internal search application share the same resolver.
- Unresolved commitments share actor state; resolving branches copy flat mutable records into reusable decision-ply buffers. Search-only kit costs and skill factors are compiled per encounter.
- Bounded encounter-local tables use 128-bit hashes plus full numeric-key verification. Scores match remaining depth and extension state; best moves, history and killers improve ordering. PVS handles adjacent floating-point scores, and aspiration failures re-search.
- Tactical leaves extend one full exchange for an active channel, an Omen due, or construct expiry. The extension cannot recur down the same path.
- Behavior degradation is independent of compute profile. Seeded mistake attempts reserve half the compute budget for exact ranking; incomplete ranking keeps the main action. Legacy calls retain deterministic depth-three / 5,000-node fixed-horizon settings.
- Fast/Deep table capacities are 4,096/16,384 positions. Analyst uses six nominal exchanges, 200,000 total nodes, tactical horizons and 65,536 positions without a clock deadline. Depth means exchanges, not individual commitments.

74 prototype tests passed: frozen-reference transitions and values, exhaustive small trees, exact root rankings, forced commitment ownership, channel/Haste/Omen/construct states, deliberate hash collisions, invalidation/capacity, deadlines, fallibility, accounting and state immutability. Source checks confirm unchanged evaluator text, resolver/settlement body, economy, roster and loadouts.

Final browser smoke: 88 checks, 231 layout checks, zero page errors, including 320×568 and 375×667 layouts, both real compute profiles and all-spell quickstarts. Mobile viewports establish layout only. `node tools/grim.js check` passed in an isolated copy. `npm run verify` passed there: 122 campaign tests, zero balance invariant failures (five existing advisory alarms), 120 unchanged golden games, and browser playthrough/previews. Campaign files and generated assets in the working checkout were not rewritten.

## Simulation and convergence

One-versus-two-worker deterministic pilots produced identical commands, executed commands, outcomes and settlement results across 32 decisions. Analyst smoke runs used the full 200,000-node profile and replayed legally. These short fights were intentionally censored and provide no win-rate or balance evidence. The separately invoked 108-fight generic panels for each profile are documented in the prototype README; the long panels were not run.

| Position | Nodes | Completed nominal depth | Action | Value |
|---|---:|---:|---|---:|
| 20-opening-commit | 50,000 | 4 | flame | 0.920000 |
| 20-opening-commit | 200,000 | 5 | flame | 0.920000 |
| 20-opening-commit | 1,000,000 | 5 | flame | 0.920000 |
| 50-channel-respond | 50,000 | 4 | release | 15.046667 |
| 50-channel-respond | 200,000 | 5 | release | 19.386667 |
| 50-channel-respond | 1,000,000 | 5 | release | 19.386667 |

Those two preliminary convergence samples used a 4,096-position table. A repeat of the opening sample at the Analyst capacity of 65,536 positions also completed depths 4/5/5 at 50,000/200,000/1,000,000 nodes and retained Flame. Its exact common-depth ranking measured zero regret for the selected actions. The channel sample could not finish a full exact root ranking at its reference depth, so its regret is explicitly unavailable. Stable action IDs do not establish convergence: its evaluation rose between depths four and five. The convergence runner now defaults to the Analyst table capacity, records it, and checkpoints each budget.

## Evidence and reproduction

All evidence is in `experiments/minigames/results/v04-20261016-search-optimization/`:

- `baseline-manifest.json`, frozen `baseline/`, and the durable `reference/v04-search-046/` preserve the pre-optimization code.
- `paired-fixed/`, `paired-nodes/`, `paired-100ms/`, `paired-500ms/` contain source snapshots, hashes, exact input positions and raw paired measurements. `comparison-*.json` includes every scenario and position.
- `profile-fast/` and `profile-deep/` measure actual tactical profiles. CPU profiles (`baseline.cpuprofile`, `optimized-first.cpuprofile`, `optimized-final.cpuprofile`) explain the successive optimization passes.
- `convergence-final/`, `convergence-analyst-cache/`, `schedule-one/`, `schedule-two/`, `analyst-final/` retain reproducible probes and audits.
- `prototype-tests-complete.log`, `browser-smoke-final.json`, `verify.log`, `grim-check-final.log`, `rules-equivalence.json`, and `validation.json` record checks.

Benchmark and panel commands are in `experiments/minigames/iterations/v04/README.md`. Raw earlier passes are retained, including scheduling-noisy unpaired timings. Rust, evaluator fitting and aggressive/selective pruning remain deferred.
