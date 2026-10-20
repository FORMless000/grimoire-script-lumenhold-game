# Saved combat 0.4.6: complete cross-loadout test

Tested my unchanged 0.4.6 engine and original depth-3/5,000-node AI snapshot, separately from the concurrent balance/search fork. No live game files or balancing numbers were changed for this test.

**432 fights; all ended in knockout.** Nine general loadouts, every different opponent, levels 20/50/80, both engine seats and both first-commitment orders. Each loadout has 32 fights per level and 96 overall. Full AI, no random degradation, normal deterministic loadout-specific skills and spell gates, standard resources, no observers.

| Loadout | Level 20 | Level 50 | Level 80 | Overall |
|---|---:|---:|---:|---:|
| Hollow adept | 100.0% | 87.5% | 81.3% | 89.6% |
| Duellist | 87.5% | 87.5% | 81.3% | 85.4% |
| Prefect | 31.3% | 87.5% | 50.0% | 56.3% |
| Underground tough | 68.8% | 25.0% | 75.0% | 56.3% |
| Showman | 50.0% | 50.0% | 56.3% | 52.1% |
| Brawler | 68.8% | 50.0% | 18.8% | 45.8% |
| Scholar | 31.3% | 43.8% | 12.5% | 29.2% |
| Healer | 6.3% | 18.8% | 50.0% | 25.0% |
| Illusionist | 6.3% | 0.0% | 25.0% | 10.4% |

The main findings:

- **Hollow adept and Duellist dominate overall**, but neither is universally best. Hollow adept already wins 32/32 at level 20, before its first forbidden spell unlocks. Its lead therefore cannot be attributed solely to forbidden spells.
- **Counters exist.** At level 50, Duellist beats Prefect, Prefect beats Hollow adept, and Hollow adept beats Duellist, each 4–0. At level 80, Healer beats Hollow adept 4–0, Hollow adept beats Duellist 4–0, and Duellist beats Healer 4–0.
- **Progression changes class strength substantially.** Healer rises from 6.3% to 50%; Brawler falls from 68.8% to 18.8%. Underground tough falls at level 50 and recovers at 80. Aggregate percentages hide these differences.
- **Illusionist remains weak in this combat context** (10.4% overall), and Scholar falls to 12.5% at level 80. These results include their normal stat allocations and noncombat spells; they do not isolate the value of a single spell or measure negotiation/story usefulness.

Median fight lengths at levels 20/50/80 are 20/29/32 exchanges. The initial first committer wins 48.1% overall; paired scheduling removes any unequal allocation of that role between loadouts.

These are exact AI win shares for the selected fixtures, not estimates of human win probability. Four seat/order variants are paired observations, not independent random trials. Equal levels retain each loadout’s skill offsets and spell selection. All AIs have the same node budget, but wider kits may complete less search depth. Forbidden spell alignment/observer costs are not scored in combat utility. No named-character fixtures or self mirrors are included.

Validation: **23,462 legal decisions replayed**, **5,184 resource-ledger rows reconciled**, frozen source hashes match the selected baseline exactly, and complete pair/seat/order coverage checked. The new runner passed a four-case dry run and script syntax checks; the project check passed in an isolated campaign checkout. No decision-time benchmark was run under the observed machine contention.

Full pairwise matrices, raw traces, CSVs, source snapshots and reproduction metadata: [result report](../experiments/minigames/results/v04-20261016-cross-loadouts-ours/REPORT.md), [win-rate CSV](../experiments/minigames/results/v04-20261016-cross-loadouts-ours/winrates.csv), [structured results](../experiments/minigames/results/v04-20261016-cross-loadouts-ours/cross-winrates.json).

Reproduce with:

```sh
node experiments/minigames/run-v04-cross-loadouts.mjs --workers 4 --out /private/tmp/combat-cross-fresh
node /private/tmp/combat-cross-fresh/sources/analyze-v04-random.mjs /private/tmp/combat-cross-fresh --no-benchmark
node experiments/minigames/analyze-v04-cross-loadouts.mjs /private/tmp/combat-cross-fresh
```

The runner defaults to the immutable `v04-20261016-economy-construct-followup` source snapshot; it deliberately does not import the changing live workspace AI. Every output directory must be new.
