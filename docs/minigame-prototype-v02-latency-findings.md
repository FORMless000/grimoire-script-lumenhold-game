# Preliminary all-spell AI timing — 14 October 2026

The current 0.2.1 AI responds quickly on this desktop with both sides learning all 12 spells, but its node budget often prevents useful Foresight planning. Fast responses alone do not establish adequate search quality. No AI, evaluation weights, node budgets or game rules changed for this benchmark.

## Short browser measurement

Apple M3, 8 logical CPUs, 16 GiB RAM, macOS Darwin 24.6.0; headless Chromium 156.0.8078.4. The worker is the actual localhost prototype's `/app.mjs?worker=1`, with its generated core verified byte-for-byte against the frozen Node sources. Each call measures postMessage-to-response elapsed time, including structured cloning, dispatch and optional fallibility ranking.

32 fixed states at levels 50/80; Evoker/Seer mirrored combat and both asymmetric negotiation fixtures; opening commitments, responses to Strike, first unilateral Foresight planning and first bilateral planning. Four profiles, one excluded warmup and three measured calls per state/profile, using policy seeds 20261014, 77 and 104729: **384 measured decisions**. Calls run sequentially on one persistent worker. This is a short stress panel, not a typical-match latency distribution.

| AI profile | Combat median / p95 / max ms | Negotiation median / p95 / max ms |
|---|---:|---:|
| Full, depth 3 | 19.4 / 29.8 / 30.8 | 11.4 / 15.2 / 15.5 |
| Shallow, depth 1 | 0.4 / 29.7 / 31.8 | 0.2 / 14.9 / 20.9 |
| Fallible, depth 3, 30% attempt | 20.8 / 51.6 / 54.5 | 13.1 / 22.4 / 28.5 |
| Shallow + fallible | 1.2 / 29.9 / 30.1 | 0.7 / 14.8 / 15.0 |

The separate cold-worker startup plus first full search took **45.4 ms**, of which the reported search computation was 39.9 ms. Median roundtrip-minus-reported-computation was 0–0.1 ms, near Chromium's timing resolution; this is an overhead estimate, not proof of zero overhead. Exact AI decisions/search metadata matched Node for all 384 calls. No browser page errors occurred. A 375×667 viewport does **not** simulate smartphone CPU performance.

## Search completion is the limiting factor

Default main search is depth 3 with 5,000 nodes total across iterative deepening. An attempted fallible decision can spend another 5,000 nodes on exact root ranking. Depth counts resolved exchanges, so lowering it does not trim the choices that must be made before the next exchange resolves.

In this short browser panel, full combat AI completed depth 2 for every opening and depth 3 for every Strike response. All first Foresight planning decisions at levels 50/80—unilateral and bilateral, both game modes—completed **depth 0**: all 48 full-profile planning calls exhausted the budget before completing depth 1 and used the deterministic move-order fallback. The shallow profile had the same planning failures. Thus the low shallow median describes ordinary decisions; its planning tail still spends the entire node allowance.

This arises because Foresight binds three subsequent actions, creating several decision branches before the search consumes even one exchange of depth. Adding all spells widens those branches. A current node ceiling bounds work; it does not guarantee a wall-clock ceiling or a useful completed search. The present result supports keeping the worker and investigating planning-specific search limits/heuristics next; it does not justify increasing depth or claiming that Foresight is already handled intelligently.

## Node cross-check and preserved runs

Before the request to shorten further arrived, the broader Node run had already completed: 384 fixed states, four profiles, one warmup and three measured calls = **4,608 measured decisions**. It includes all six mirrored combat kits at 20/50/80, both commitment orders, midgame states, three planning slots, bilateral planning and forced queues. The negotiation panel rotates approaches and audience kits rather than crossing every combination. Forced queues are excluded from aggregates below because the live UI executes them without search.

| Mode / profile | Median ms | p95 ms | Observed max ms |
|---|---:|---:|---:|
| Combat / full | 40.5 | 57.5 | 75.8 |
| Combat / fallible | 43.2 | 88.8 | 117.2 |
| Negotiation / full | 30.9 | 40.4 | 62.1 |
| Negotiation / fallible | 32.7 | 68.9 | 109.6 |

The highest measured Node latency, 117.2 ms, spent both 5,000-node budgets and ultimately declined the random error because ranking could not finish the required depth. Browser and Node timing panels differ in scenario coverage and JavaScript runtime; these are separate measurements, not a controlled engine speed comparison.

A further short Node check used the new default quick panel: 36 states, all three presets, four profiles, one warmup and one measured call = **144 measured decisions**. Full AI peaked at 64.6 ms in combat and 41.7 ms in negotiation. This single seed produced no fallibility attempts, so it cannot measure the extra ranking cost; the three-seed browser/broader measurements above do. A 94.0 ms shallow+fallible timing outlier also demonstrates why one small wall-clock sample is not a performance guarantee.

Both actors learn all 12 spells; ordinary entry and unilateral first planning expose all 15 commands. Existing mana costs, spell ranks, forecast locks and projected mana still apply, so some later/bilateral states have fewer affordable commands. This tests unrestricted learned rosters under actual rules, rather than free spells or infinite mana. All full-panel depth-0 cases occurred in first unilateral/bilateral planning; ordinary full-profile decisions always completed at least depth 1. Combat first planning failed at 50/80; negotiation bilateral planning also failed in some level-20 states.

Local artifacts, each with immutable source snapshots, exact fixtures, seeds, raw timings, summaries and audits:

- `experiments/minigames/results/v02-20261014-all-spells-latency/` — broader Node run; `browser-worker/` holds the short browser measurements and served sources.
- `experiments/minigames/results/v02-20261014-all-spells-quick/` — short single-pass Node check.

The harness checks legal actions, budgets, input immutability and exact seeded replays outside the timed region. The two v02 engine/AI test files passed all 22 tests. `node tools/grim.js check` also passed in an isolated project copy (`/private/tmp/lumenhold-latency-check-1i618nup/grim-check.log`), preserving shared campaign build files. Frozen source hashes were verified, and the current game/AI core still matches both recorded runs. Benchmark runs were sequential, without concurrent test suites. Results describe this machine and selected reachable states; background activity, JIT and garbage collection still vary. They are preliminary measurements, not exhaustive worst-case bounds or balance tests.

Reproduction commands and panel definitions are in [the simulation README](../experiments/minigames/README.md#preliminary-all-spell-decision-timing). Use fresh output directories; saved-source runners reproduce the historical panels even after future code changes.
