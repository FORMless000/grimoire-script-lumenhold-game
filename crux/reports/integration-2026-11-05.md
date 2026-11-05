# Campaign resource smoke comparison

Reproduce from the repository root with Node 24:

```sh
node tools/parley-flow.js --seed 13 --out <new-result.json>
```

Raw results: `integration-2026-11-05.json`. Content hash `a22848`; Crux rules `ae80f403982008b1`. The existing campaign styles and fight simulator are unchanged. Random uses Crux's native naive player; balanced and social use its native smart player. Each style uses the same campaign seed in three modes: the old roll, half resource transfers, and full transfers.

| Style | Mode | Last month | Meetings | Wins / partials / losses | Net Mana | Net Crowns | Net Health |
|---|---|---:|---:|---|---:|---:|---:|
| balanced | old roll | 48 | 10 | 9 / 0 / 1 | 0 | 0 | 0 |
| balanced | 0.5 | 48 | 9 | 4 / 0 / 5 | −26.5 | −13 | −5 |
| balanced | 1 | 48 | 10 | 5 / 0 / 5 | −74 | −56 | 0 |
| social | old roll | 48 | 8 | 7 / 0 / 1 | 0 | 0 | 0 |
| social | 0.5 | 48 | 10 | 7 / 0 / 3 | −45.5 | −34 | 0 |
| social | 1 | 48 | 8 | 2 / 0 / 6 | −67 | −23 | 0 |
| random | old roll | 46 | 6 | 3 / 0 / 3 | 0 | 0 | 0 |
| random | 0.5 | 31 | 3 | 2 / 0 / 1 | 0 | −1.5 | 0 |
| random | 1 | 48 | 6 | 1 / 0 / 5 | 0 | −3 | 0 |

Resource columns are net Crux deltas only. Authored card consequences are additional, in every mode. No Alignment transfer occurred in these nine runs; targeted cast tests cover it. There are no refunds.

These are nine descriptive runs, one seed per style, not an estimate of player win rates or a tuning optimum. Outcomes change which cards and spells are reached, so half scale does not imply half the whole-run bill. The two deliberate players finish at half scale with smaller Mana bills than full scale. The random player can still end early; its ending month cannot be attributed to negotiation costs from this sample. Keep 0.5 as an initial setting and assess difficulty, duration and direct signal distributions in human playtests.

## Campaign golden baseline

The standard 120 games (random/social/cautious × 40, seeds `424242 + i * 7919`) finish without simulation errors. Compared with the previous working-tree baseline, 118 games differ. Random's Health departures change from 9 to 4 and Mood departures from 5 to 10; the two other styles still have no Health/Mood departures in this set. Later cards, careers and relationships differ as negotiation outcomes change. This is not a refactor preserving the old roll's probabilities.

The old baseline's content hash is `4ef950`; removing just the added `parley_scale` lines from current content reproduces that hash. The previous file is preserved at `build/snapshots/pre-crux-2026-11-05.json`; the candidate is `build/snapshots/crux-integration-2026-11-05.json`. After inspecting the diff and confirming no errors, the candidate was copied to `test/golden/baseline.json`. These campaign results do not replace Crux's retained Rust golden fixtures.

The full verification independently generated `build/snapshots/latest.json`; comparing that file with the refreshed baseline gives no gameplay changes across all 120 games.

## Required checks

- `grim check`: passes.
- Offline Rust workspace tests: pass (retained golden/search comparisons, 15 rule tests and four campaign tests). The payment test exercises all current encounter pools and explicitly requires Crowns, Health and Renown gates and all three resource failure kinds to be visited.
- `node --test test/parley-bridge.test.js`: ten pass, including all 65 challenge statements.
- Focused browser checks: pass in English and Chinese, including phone overflow, analysis worker, disabled analysis, exact refresh, scaled settlement, lesson skip, missing runtime and the standalone bench.
- HTTP browser playthrough/previews: pass; 671/671 card records stored, ending reached, zero unresolved cards.
- `balance --quick`: seven styles × 30 games, zero invariant failures. Preview property check: 61,867 choices in 100 additional games, zero violations. Five alarms: random Health departures 37%, social searching headline 50%, truant archmage headline 37%, aggressive Mood lasting 24 term months, and 146 unseen events. The previous report is preserved in `build/snapshots/pre-crux-balance-report-2026-11-05.json`.
- `verify:full` remains red because of two pre-existing retrieval tests at `rag/test/authoring.test.js:100` and `rag/test/lifecycle.test.js:43` (the retired retriever reports "Only LightRAG is supported"). Its initial stale-bundle and old-baseline findings were resolved and rechecked separately after generation/refresh. Its remaining gameplay tests, including the slow style tests, passed. The browser gate was run separately because verification stops after a failed group.

No commit, push or deployment was performed.
