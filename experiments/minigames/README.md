# Minigame simulation bench

Standalone research code; no campaign saves or production engine changes. The frozen `iterations/v01/engine.mjs` is the temporary testplay engine, before any proposed redesign. The browser's compact layout does not change these rules.

## Reproduce a run

Node 20 or later, no additional packages:

```sh
node --test experiments/minigames/harness.test.mjs experiments/minigames/iterations/v01/engine.test.mjs
node experiments/minigames/run.mjs --iteration v01 --episodes 32 --seed 20261014 --out /private/tmp/lumenhold-v01-new-run
```

Use a new output directory: the runner refuses to overwrite results. A small dry run uses `--episodes 2`, but its rates are too noisy for tuning. Output includes:

- `manifest.json`: exact cases, seeds, environment and source hashes.
- `sources/`: the actual runnable source snapshot, so later edits cannot change a recorded experiment. Run `sources/run.mjs` with another fresh `--out` to reproduce that snapshot.
- `matches.csv`: one row per match, focal seat, outcomes, duration and gross/net resource costs.
- `summary.json`: grouped rates, intervals, action counts and archetype matrices.
- `REPORT.md`: readable tables; `traces.json`: selected complete episode traces.

Results are ignored by Git and kept locally. The first full run is `results/v01-20261014-benchmark/`; its interpretation is in [the research notes](../../docs/minigame-simulation-review.md).

## What the experiment varies

Opponent level remains the seed for kit generation and archetype AI candidate draws. Repeating the same deterministic encounter cannot estimate a win rate. An **episode seed varies only the two check rolls per exchange**. Kit variations are measured separately in the level-gap panel. The same 32 episode streams are deliberately reused across cases for paired comparisons.

Combat cases run in both engine seats, moving the focal kit, policy and skill adjustment together. In native information, the left actor receives the existing incoming tell/Forecast; the right actor sees preceding public actions. Seat averaging balances this role advantage but does not make the underlying rules simultaneous.

The panels are:

| Panel | Controlled comparison |
|---|---|
| Policy | Scripted/rush/greedy/reactive, all ordered pairs, six mirrored kits at level 50 |
| Archetype | All six-by-six kit pairings at levels 20/50/80, greedy policies |
| Skill only | Shift all six focal skill values by −15 to +15; hold kit seed, ranks, capacity and entry budgets fixed; reject clipping |
| Accuracy only | Shift virtual check attack/defence values by the same gaps; keep actual skills and initiative fixed |
| Level gap | Actual encounter levels differ; this also changes seeded kit details, ranks and capacity |
| Negotiation | Honest/deceiver/opportunist persuaders versus scripted/skeptic/impatient audiences; two player kits, six audience kits, two fixtures and three levels |
| Information | Blind/native/exact current intent, focal actor in left seat, against scripted AI |

`scripted` follows the prototype archetype's actual recommendation. `rush` uses ordinary physical attacks, no spells or optional spending. `greedy` values approximate immediate damage, healing and protection minus resource costs. `reactive` places more value on countering the tell or preceding action. Negotiation policies differ in truth preference, scrutiny avoidance, spending and urgency. These are simple, bounded heuristics; none is an optimal player.

## Statistical interpretation

Report **full wins, partial outcomes and losses separately**. In v01 a timeout can label both combatants as failures; do not infer the other actor's win rate by subtracting from 100%. Timeout wins are adjudicated outcomes, not knockouts. Negotiation is inherently asymmetric; the audience's objective is to prevent agreement, and its outcome is derived from that objective.

Intervals are 95% percentile bootstrap intervals with 1,000 resamples of the 32 **episode-index clusters**. All dependent cases and seat swaps sharing an episode stream stay together. They describe check-roll uncertainty over this finite panel, not independent evidence from 54,912 humans, uncertainty over every possible level, or confidence in the policy design. Zero-width intervals at 0/100% are an empirical bootstrap limitation, not proof of impossibility/certainty.

Action entropy and resource costs are descriptive. A varied action distribution does not demonstrate tactical depth. A tell-aware policy losing does not prove that information is useless to stronger play. Scripted AI can also make harmful decisions; its performance is not a balance target.

## Carry this into the next iteration

Keep v01 frozen. Add `iterations/v02/engine.mjs` and an adapter exporting:

```js
id; archetypes;
create(config, {episodeSeed, skillShift, skillShiftSide, checkShift});
observe(game, side, {information}); // cloned public state + legal option metadata
commitOpponent(game, command);
advance(game, command);
ended(game);
metrics(game); // outcomes[2], ledgers[2], rounds, timeout, noWinner, commands
trace(game);
```

Only adapters know an engine's internals. Policies receive cloned observations with no future rolls, hidden commands in blind mode or live engine references. Keep the metadata schema consistent or explicitly revise the policy for the changed semantics. Unsupported ablations should throw rather than silently do nothing. `harness.mjs` still runs the match; the runner still stores cases, source snapshots and raw results.

For simultaneous decisions, give both policies blind observations of the same pre-exchange state. `commitOpponent` must store the command without changing public state; `advance` must resolve both commands together. The runner currently defaults to v01's native information; change the new iteration's case definitions explicitly. Benchmark randomness lives in the shared harness and does not depend on an iteration's engine.

Policy score weights and candidate panels are deliberately readable constants, not fitted parameters. New exposure mechanics would require policies that understand exposure; reusing their v01 scores unchanged would be an invalid comparison of strategy quality. Retain common rush and cost-aware baselines, add a state-aware policy, and measure whether it wins for an understandable reason. Add independent Health sweeps and gross/net cost reporting before judging low-health viability or day-to-day resource balance.
