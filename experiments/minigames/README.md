# Minigame simulation bench

Current combat testplay uses **v04 / spell redesign v2**: [implementation and validation](../../docs/minigame-combat-spells-v2.md), [combat rulebook](iterations/v04/rulebook.md). The separate negotiation prototype is v03. Earlier v01/v02 commands and findings below are historical experiments, not the current combat rules.

Combat **0.4.6** now applies the economy calibration through `iterations/v04/economy.mjs`; [the balance/pacing report](../../docs/minigame-combat-v04-economy-findings.md) records all 680 evaluation fights, final tuning, latency and limits; its current rulebook records every price/effect. Endurance defaults to Health + 10 + 2 × encounter level. The [economy draft](../../docs/minigame-combat-economy-draft-1.md) prices actions, permanent Mana, recovery time and all 35 spells. `economy-draft-1.json` is proposal data, not active engine configuration. Reproduce its arithmetic audit with `node experiments/minigames/results/v04-20261016-economy-pricing/sources/analyze-v04-economy.mjs <fresh-output-directory>`; it does not run candidate fights or alter the browser.

## Current combat: random loadout panel

```sh
node experiments/minigames/run-v04-random.mjs --workers 4 --seed 20261016 --out /private/tmp/combat-v04-random-new
node experiments/minigames/analyze-v04-random.mjs /private/tmp/combat-v04-random-new
node experiments/minigames/diagnose-v04-stalls.mjs /private/tmp/combat-v04-random-new
node experiments/minigames/continue-v04-stalls.mjs /private/tmp/combat-v04-random-new
```

The default panel has 320 deterministic fights: 108 generic-versus-generic, 176 character-versus-generic, and 36 same-loadout level-60 versus level-40 controls. Generic pairs form a seeded random ring at levels 20/50/80, giving each loadout two opponents per level. Growing characters and the provisional Grey fixture are tested at all three levels; fixed characters face a random generic at their own fixed level. Every matchup uses both engine seats and both initial commitment orders. The four configurations are paired observations, not independent samples.

Four Node worker threads run full alpha-beta (depth 3, 5,000 nodes), with a 240-decision work limit. Unfinished fights remain censored. The analyzer replays every decision from hash-checked frozen sources, audits resource ledgers, summarizes outcomes and legal action opportunities, then benchmarks recorded decision states sequentially with three timing repeats after warmup. All-spell stress timings are separate. Defaults use year 1, standard resources, endurance + Health HP, damage ×1, no observers, kit access, and no AI degradation. Fixed named skills and the Grey placeholder retain their documented limitations.

Run `benchmark-v04-endurance.mjs --sources <frozen-run> --out <new-dir>` for equal-skill mirrored loadouts, fixed rank-II core-kit duration comparisons with/without endurance, and isolated skill gaps. Run `benchmark-v04-latency.mjs <frozen-run>` after simulation workers finish for short sequential kit/all-spell timings. `run-v04-random.mjs --profile fallible` uses seeded bounded mistakes; `--case-file <json>` accepts an explicit panel. Recorded cases are always authoritative.

Use a fresh output directory; completed case files are preserved as workers finish. `--limit 4 --depth 1 --nodes 100 --decisions 8` provides a small scaffolding check. To reproduce the recorded engine after later changes, run `sources/run-v04-random.mjs` and `sources/analyze-v04-random.mjs` from a result directory. Timing varies by machine and scheduling; actions and outcomes do not.

The optional diagnostics inspect exhausted basic-action states and continue eight stratified censored positions with unchanged, deeper and fallible AI. Continuations preserve the initial fight and export their extra decisions for legal replay. Findings for the first panel are in [the random-loadout report](../../docs/minigame-combat-v04-random-findings.md).

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

## Commitment iteration v02

See [the v02 rules](../../docs/minigame-prototype-v02.md). `run-v02.mjs` supplies policy, balance, cross-kit, negotiation and latency panels through the same `runMatch` harness; v02 adapters expose `decisions`, `actorToMove`, `choose` and decision-level `advance`. This extension preserves the frozen v01 driver and tests. The v02 engine resolves deterministic commitments, so episode seeds do not generate extra trials. Use scenario/skill/kit/first-committer sweeps instead.

```sh
node --test experiments/minigames/iterations/v02/engine.test.mjs
node experiments/minigames/run-v02.mjs --suite policy --out /private/tmp/v02-policy-new
node experiments/minigames/run-v02.mjs --suite balance --out /private/tmp/v02-balance-new
```

The first runs are `results/v02-20261014-policy-direct/` (144 matches) and `results/v02-20261014-balance-direct/` (276 matches). Read [their interpretation](../../docs/minigame-prototype-v02-findings.md) before treating a full-win fraction as balance or assuming search dominates simpler policies. Raw outputs and source snapshots remain ignored by Git and are preserved locally.

### Combined kit and skill sweeps

```sh
node experiments/minigames/run-v02.mjs --suite cross --out /private/tmp/v02-cross-new
node experiments/minigames/analyze-v02-cross.mjs /private/tmp/v02-cross-new
node experiments/minigames/validate-v02-run.mjs /private/tmp/v02-cross-new
node experiments/minigames/run-v02.mjs --suite negotiation --out /private/tmp/v02-negotiation-new
node experiments/minigames/analyze-v02-negotiation.mjs /private/tmp/v02-negotiation-new
node experiments/minigames/validate-v02-run.mjs /private/tmp/v02-negotiation-new
```

`cross` covers all ordered combat kit pairs at levels 20/50/80, focal skill adjustments −10/−5/0/+5/+10 and both initial commitment orders: 1,068 valid cases out of 1,080 requested. Invalid skill values are excluded explicitly in the manifest. The skill analysis uses a complete paired subset, while baseline matrices retain every kit.

`negotiation` covers Envoy/Illusionist persuaders versus every audience kit at the same levels/adjustments/orders, with two fixtures and three approaches: 2,160 cases. It preserves the asymmetric objectives and uses no dialogue clues. Both suites use alpha-beta on both sides. Skill adjustments affect all six focal skills only, preserving the generated level, spell ranks, capacity and initial resources; actual encounter-level differences are a separate experiment.

The analysis scripts add reports and summaries without overwriting existing output. `validate-v02-run.mjs` verifies frozen source hashes, exact case coverage and resource ledgers, then replays 24 selected cases with the saved engine/harness, comparing results and search data except wall-clock timing. It adds an audit and its own source snapshot. Re-running any analysis/audit requires a fresh destination or explicitly removing only its derived outputs.

The completed follow-up runs are `results/v02-20261014-cross-skill-direct/` and `results/v02-20261014-negotiation-skill-direct/`. See [the combined findings](../../docs/minigame-prototype-v02-cross-kit-findings.md), including unchanged rules, exclusions, partial outcomes and search limitations.

### Ward and AI degradation (prototype 0.2.1)

The current prototype changes Ward to rank costs 10/8/6 before the setup multiplier and protection `(10 + 2 × (rank − 1)) × combatScale`. Historical result snapshots keep the previous Ward. Their rates should not be presented as measurements of the rebalance.

AI controls are independent per side in `config.ai`: `maxDepth`, `mistakeChance`, `maxRegret` (default 35) and `seed`. Four setup profiles cover full, shallow, fallible, and combined behavior. `chooseAIAction` performs ordinary alpha-beta first; a seeded attempt can select a strictly weaker plausible move within the utility bound, after completing exact full-window root ranking at the same depth. Ranking has its own node ceiling; incomplete ranking declines the mistake. All mechanics remain deterministic, and forecast locks cannot be rerolled. The AI is not an expectiminimax model of the opponent's errors.

```sh
node --test experiments/minigames/iterations/v02/engine.test.mjs experiments/minigames/iterations/v02/ai-degradation.test.mjs
node experiments/minigames/run-v02-degradation.mjs --episodes 4 --seed 20261014 --chance 0.30 --out /private/tmp/ward-ai-new
node experiments/minigames/validate-v02-run.mjs /private/tmp/ward-ai-new
```

The default panel has 6,960 matches: all ordered combat kit pairs at 20/50/80, mirrored ±5 skill controls at 50, and two persuader kits against all six audience kits in both fixtures/three approaches at all three presets. Full/full and full/shallow are deterministic controls. Full/fallible and fallible/fallible use four policy seed streams; full/shallow+fallible is a smaller exploratory mirrored panel. Seeds are shared across policy comparisons and initial commitment orders for matching actor/exchange/forecast slots; kit generation does not consume them.

The runner preserves exact cases, seeds, source hashes/snapshots, raw actions, accepted/skipped errors, completed search depths, ledgers, per-seed results and reports. The validator now reconstructs every alpha/alpha match, checks every accepted mistake against its legality/safety/regret conditions, and reruns selected matches from frozen sources. A 30% setting is an **attempt** chance: the realised rate is lower when no bounded weaker action exists or exact ranking exceeds its budget. Descriptive per-seed variation is retained; no binomial confidence claims treat the pooled scenario panel as independent people.

The completed 0.2.1 run is `results/v02-20261014-ward-degradation/`. Read [the Ward/degradation findings](../../docs/minigame-prototype-v02-degradation-findings.md) for matched before/after controls, realised mistake rates and remaining strategy compression. To regenerate its comparison report, retain the historical cross-skill/negotiation result directories, then run:

```sh
node experiments/minigames/analyze-v02-degradation.mjs --run /private/tmp/ward-ai-new
```

Use `--old-combat` and `--old-negotiation` to point to moved historical outputs. Each analysis adds its own frozen source and refuses to overwrite derived reports.

### Preliminary all-spell decision timing

```sh
node experiments/minigames/benchmark-v02-all-spells.mjs --panel quick --repeats 3 --warmups 1 --out /private/tmp/all-spells-timing-new
```

The default quick panel has 36 fixed states: levels 20/50/80, Evoker combat and both asymmetric negotiation fixtures, ordinary commitment/response and unilateral/bilateral Foresight commitment states. All actors learn all 12 spells. All 15 actions are affordable at entry; later Mana restrictions still apply. Four AI profiles run sequentially with a 5,000-node main budget and an additional 5,000-node exact-ranking budget when fallibility attempts one. Three fixed policy seeds vary ranking attempts; timing repeats are not independent games. Use `--repeats 1` for a shorter preliminary check, but one seed can miss all ranking attempts.

`--panel full` expands to 384 states: all six mirrored combat archetypes, both initial commitment orders, all three early-commit exchanges, a response under Foresight, and midgame states. Both panels preserve raw states/decisions, source snapshots/hashes, machine settings and seeded replay checks. These are broad-branching stress samples, not a mathematical worst-case time bound or gameplay-frequency-weighted latency estimate. Timings include the whole AI wrapper; fixtures and validation stay outside the timed region.

If Playwright is already installed and the temporary prototype server is running, measure the actual browser worker too:

```sh
node experiments/minigames/benchmark-v02-browser-worker.mjs --run /private/tmp/all-spells-timing-new --url http://127.0.0.1:61040/
```

The browser runner samples levels 50/80, measures sequential worker roundtrips with startup separate, verifies the served core matches the frozen source, and checks every decision against Node. It writes a new `browser-worker/` subdirectory and refuses to overwrite it. This measures desktop Chromium, including structured cloning/dispatch; a smartphone-sized viewport does not measure phone hardware.

Completed runs: `results/v02-20261014-all-spells-quick/` (one measured pass), and the already-completed `results/v02-20261014-all-spells-latency/` (full panel and short browser follow-up). See [the timing findings](../../docs/minigame-prototype-v02-latency-findings.md). No AI or gameplay parameters changed for these measurements.

### Early-commit Foresight and initiative (prototype 0.2.2)

The current engine replaces binding forecasts with three subsequent exchanges of forced early opponent commitment. Each exchange has exactly two choices. Normal order alternates in the background; overlapping effects use that order while both durations tick down. Recasting refreshes without stacking. Mutual knockout goes to the actual telegraphed actor, while both actions and resource costs still resolve. The AI terminal utility and simulator outcomes use the same initiative winner. Ordinary partial negotiation agreements and time-limit outcomes are unchanged.

The historical 0.2.1 timing/strategy findings above describe the retired queue mechanic. Existing result/source snapshots are preserved. Current rules are in [the rulebook](../../docs/minigame-prototype-v02.md#foresight-three-exchanges-of-early-commitment). The timing runners now use the 0.2.2 states and record the rules version.

```sh
node --test experiments/minigames/harness.test.mjs experiments/minigames/iterations/v01/engine.test.mjs experiments/minigames/iterations/v02/engine.test.mjs experiments/minigames/iterations/v02/ai-degradation.test.mjs
node experiments/minigames/iterations/v02/build-browser.mjs /private/tmp/lumenhold-testplay-tymsimxd
node experiments/minigames/iterations/v02/browser-smoke.mjs --out /private/tmp/early-commit-browser-new.json
```

The browser smoke test uses scripted worker fixtures to exercise unilateral/opposing Foresights and initiative ties, then tests the actual combat AI worker with all four profiles and checks all three quickstart presets. All gameplay views, including the twelve-spell grid, must fit a 320×568 viewport. Historical temporary smoke scripts that expect queued forecasts are superseded by this test.

Completed short timing run: `results/v022-20261014-early-commit-latency/` (36 states, 432 Node decisions and a 288-decision browser subset). No depth-0 decisions occurred in either panel; full AI completed depth 2 or 3 and shallow AI completed depth 1. On the Apple M3, browser full-AI p95 was 25.8 ms combat / 16.1 ms negotiation; fallible p95 was 56.0 / 26.0 ms. This is a preliminary timing check, not a balance study or phone hardware measurement. Only the requested Foresight/initiative mechanics changed; search settings remain depth 3/5,000 nodes (plus optional ranking).

The v02 browser is now **combat only**. Its mode switch, social fixture/approach selectors, social meters, and unused resource controls have been removed. Setup rebates and result costs show Health and Mana; the linked browser rulebook covers combat only. The earlier negotiation engine and frozen research outputs remain available for historical analysis; v03 supplies the separate negotiation interface.

Combat UI sources (`index.html`, `app.mjs`, `style.css`, `server.mjs`, `rulebook.md`) now live beside the v02 engine. `build-browser.mjs` copies them into the temporary directory and generates the combined engine/AI module expected by the browser. Serve that built directory, rather than serving the unbundled v02 source directory. Rebuilding preserves this interface cleanup.

## Asymmetric negotiation iteration v03 · pressure redesign

[The current rulebook and preliminary results](../../docs/minigame-negotiation-v03.md) describe the replacement of v03 at the same temporary browser URL. The NPC announces seeded requests; the player chooses contextual Confront or Deflect responses, with at most one optional spell before answering. Casting uses no Patience. Pressure makes successive confrontations more demanding; deflection relieves it at a time cost. All twelve spells remain available. No Mana flux; crowns never receive rebates. Combat/v02 is retained.

```sh
node --test experiments/minigames/iterations/v03/engine.test.mjs experiments/minigames/harness.test.mjs
node experiments/minigames/iterations/v03/build-browser.mjs /private/tmp/lumenhold-negotiation-v03-ojlv605q
node experiments/minigames/run-v03.mjs --episodes 30 --levels 20 --seed 20261018 --out /private/tmp/v03-pressure-new
node experiments/minigames/validate-v03-run.mjs /private/tmp/v03-pressure-new
node experiments/minigames/run-v03.mjs --episodes 5 --levels 20,50,80 --opponents debater,scholar,social,skeptic,official --out /private/tmp/v03-pressure-profiles-new
```

Policies: `search`, `greedy` (immediate spell-plus-response evaluation), `confront` (no spells), and `rhythm` (no spells; deflect at pressure two). `reason` is a historical alias for `confront`. Only the player searches; the NPC uses its state machine. Search has a cooperative 50 ms budget and optional `--nodes` ceiling. `--opponent-level`, `--kit`, `--fixture`, `--target`, `--mood`, `--renown`, `--mana`, and `--crowns` support explicit experiments. Default difficulty equals player level. Every run freezes sources/hashes, cases, command tapes and search data into a fresh directory; the validator replays the frozen engine rather than rerunning timed decisions. Historical v03 results retain their original engines and are not comparable without accounting for the changed rules.

### Negotiation skill scaling and strategy audit

The unchanged pressure rules were tested in 8,360 games. See [win rates and strategy findings](../../docs/minigame-negotiation-v03-skill-findings.md). The main panel uses 100 paired seeds per matchup for search, greedy with spells, always confront, and a fixed no-spell rhythm; smaller panels cover rank boundaries, kits/profiles, practical/broker encounters and zero Mana.

```sh
node experiments/minigames/benchmark-v03-skills.mjs --mode presets --episodes 100 --out /private/tmp/v03-skills-presets-new
node experiments/minigames/validate-v03-run.mjs /private/tmp/v03-skills-presets-new
node experiments/minigames/analyze-v03-skills.mjs /private/tmp/v03-skills-presets-new --out /private/tmp/v03-skills-analysis-new
```

Modes: `presets`, `boundaries`, `variety`, `ranks`, `no-mana`. The runner imports its frozen source copy, writes incremental records and final replay-compatible matches, and refuses existing output directories. The analysis requires replay audits and reports Wilson intervals, paired policy outcomes, resource costs, response patterns and spell use. Full-kit presets change Mana and spell ranks alongside skills; they are not skill-only ablations. No live rules were retuned for this study.

## Combat spell redesign v2 (v04)

```sh
node experiments/minigames/iterations/v04/build-browser.mjs /private/tmp/combat-v04-new
node --test experiments/minigames/iterations/v04/engine.test.mjs experiments/minigames/iterations/v04/ai.test.mjs experiments/minigames/iterations/v04/adapter.test.mjs experiments/minigames/harness.test.mjs
node experiments/minigames/run-v04.mjs --out /private/tmp/combat-v04-smoke-new
node experiments/minigames/validate-v04-run.mjs /private/tmp/combat-v04-smoke-new
```

Serve the **built temporary directory** with its `server.mjs`; current preview remains `http://127.0.0.1:61040/`. Browser tests: `node experiments/minigames/iterations/v04/browser-smoke.mjs --url <localhost-url> --out <new-json-path>` with the existing Playwright dependency.

The 35-entry roster includes 34 castable spells plus story-only Toll. Combat has no turn cap. The shared harness now accepts an explicit `decisionLimit` and `censorAtLimit`; default callers still fail on an unended bounded adapter. V04 smoke runs censor unfinished fights rather than assigning a draw, victory, or settlement. Both committed and actually executed commands are retained because Compel can replace one with public history. The validator checks source hashes, legality, resource ledgers and exact command replay from frozen sources.

Current default search remains three resolved exchanges / 5,000 nodes, with separate depth/fallibility controls. The smoke panel uses two / 1,500 to keep it short. Neither its small outcome panel nor the earlier v02 balance/latency results establish balance or speed for the new roster. Undefined pool skills, scaling and Compel edge cases are explicit provisional defaults in the rulebook; source/acquisition/negotiation descriptions are metadata for their own iterations.

Combat v04 search now supports 100 ms / 500 ms browser compute profiles and a deterministic analyst profile, independently of behavior degradation. See `iterations/v04/README.md` for reproducible benchmark, convergence and separately invoked 108-fight panel commands. `bench-v04-search.mjs` freezes each run's inputs; `reference/v04-search-046/` preserves the original combat engine and AI for differential validation.
