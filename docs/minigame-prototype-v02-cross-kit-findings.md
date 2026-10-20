# v02 cross-kit and skill simulations

Historical measurements: these runs precede the 0.2.1 Ward rebalance and optional AI degradation. Their frozen sources preserve the original parameters.

This follow-up measures the manually tested prototype without changing its rules or AI. Both actors use alpha-beta search up to three resolved exchanges with a total 5,000-node budget per decision. Gameplay and policies are deterministic. Percentages describe the finite tested scenarios, not stochastic win probabilities or evidence from independent human players.

## Controls and saved runs

Combat covers every ordered pairing of the six archetypes at levels 20, 50 and 80, skill adjustments −10/−5/0/+5/+10, and both initial commitment orders: **1,068 matches**. Twelve requested cases are excluded because shifting the level-20 Evoker by −10 would produce Vigor 0 and Alchemy 0. Values are never clipped.

A skill adjustment changes all six focal skills, preserving the generated kit seed, spells, spell ranks, mana capacity, initial Health/HP and resource budgets. The opponent retains its generated skills. “No skill difference” here means **no imposed adjustment**, not identical archetype stats. Actual encounter-level differences would additionally change seeded kit details, ranks and capacity; those are a different experiment.

For comparisons across skill adjustments, a **1,020-match complete panel** excludes the focal level-20 Evoker at every adjustment, leaving the same matchups at all five gaps. Equal-skill matrices include all six kits. Levels 50 and 80 retain every pairing.

The unchanged default Health-as-HP model, standard resources, mana cost scale 2, eight-exchange limit and context rebates are used. The optional skill-offset HP model is outside this experiment.

| Run | Raw results, manifest and frozen sources | Detailed report |
|---|---|---|
| Combat | [1,068 cases](../experiments/minigames/results/v02-20261014-cross-skill-direct/) | [Matrices, skill tables and actions](../experiments/minigames/results/v02-20261014-cross-skill-direct/CROSS-REPORT.md) |
| Negotiation | [Results](../experiments/minigames/results/v02-20261014-negotiation-skill-direct/) | [Skill and approach tables](../experiments/minigames/results/v02-20261014-negotiation-skill-direct/NEGOTIATION-REPORT.md) |

Results are preserved locally and ignored by Git. These notes and the simulation/analysis scripts remain in the project.

## Combat: effect of skills

Full-win fractions over the complete paired panel:

| Base kit level | −10 skills | −5 | No adjustment | +5 | +10 | Cases per cell |
|---|---:|---:|---:|---:|---:|---:|
| 20 | 0.0% | 0.0% | 13.3% | 70.0% | 83.3% | 60 |
| 50 | 8.3% | 8.3% | 16.7% | 58.3% | 84.7% | 72 |
| 80 | 13.9% | 18.1% | 30.6% | 38.9% | 56.9% | 72 |

The effect is strongest early. With mirrored kits, a +5 adjustment produces a full win in 100% of tested level-20 cases, 50% at level 50 and 16.7% at level 80. Equal-skill mirrors all receive partial outcomes. Full win, partial and loss are reported separately; partial is not converted into half a win.

The full equal-skill cross-kit baseline has 216 cases:

| Level | Full win | Partial | Loss | Mutual knockout | Timeout |
|---|---:|---:|---:|---:|---:|
| 20 | 13.9% | 72.2% | 13.9% | 72.2% | 0.0% |
| 50 | 16.7% | 66.7% | 16.7% | 55.6% | 27.8% |
| 80 | 30.6% | 38.9% | 30.6% | 27.8% | 52.8% |

Timeout is a termination category, not an outcome label: it can be adjudicated as a full win, partial or loss. Across the entire combat sweep there are 208 mutual knockouts and 368 timeouts. The transition toward timeouts suggests that stronger ranked defence/healing and finite match length deserve review; it does not demonstrate deeper play.

## Combat: kit differences and commitment order

At level 20, Seer loses to all five other kits at zero adjustment, in both initial orders. The other kits mostly mutually knock out each other. At level 50, Evoker has seven full wins out of twelve baseline cases; Restorer has five; every other kit has zero. At level 80, Evoker has ten full wins out of twelve; Restorer and Envoy each have six; the other three kits have zero.

Most clearly, **level-80 Evoker beats every other kit at every tested adjustment, including −10**, in both commitment orders. At level 50 it retains this advantage against Seer, Illusionist and Envoy across the same adjustment range. This is evidence of a large kit advantage in these seeds under this AI, not evidence that every Evoker encounter at every level behaves the same way.

Changing the initial committer changes the focal outcome label in only **16 of 534 paired scenarios**: twelve favor committing first, four favor responding first. The other 518 retain the label, although action sequences and resource use can still differ. This prototype therefore does not show a large overall first-responder advantage in the measured panel.

Three of 204 complete skill trajectories have a worse label at some higher skill value. All involve level-80 Restorer: against Illusionist or Warden when committing first, and Envoy when responding first. They move from partial at −10 to loss at −5. Exact trajectories are retained in `cross-summary.json`. Possible causes include bounded search, discrete damage thresholds and timeout adjudication; this panel does not isolate them.

## Combat: spells and economy

Strike accounts for **8,271 of 14,318 commands (57.8%)**. Ward, Restoration and Glamour receive substantial use; Foresight, Haste and Tide receive none. Reclaim is used 316 times. These counts describe what the current search selects, not proof that unused spells have no value under stronger search or different starting conditions.

Over the equal-skill baseline, focal gross Mana expenditure averages **34.02**, but lasting Mana loss averages only **1.69** after residual flux collection and the 80% practice-duel rebate. Lasting Health loss averages **11.91**. Reclaim creates an in-match liquidity choice; the current settlement rules make casting inexpensive in campaign terms. These costs were measured without retuning them.

## Negotiation: kits and skills

The asymmetric negotiation sweep covers **2,160 cases**: Envoy and Illusionist persuaders, all six audience kits, levels 20/50/80, the same five skill adjustments, both initial commitment orders, two fixtures and Reason/Appeal/Bluff. There are no invalid shifts or dialogue clues. Other persuader archetypes are not covered by this panel.

Full-success fractions, 144 scenarios per cell:

| Base kit level | −10 skills | −5 | No adjustment | +5 | +10 |
|---|---:|---:|---:|---:|---:|
| 20 | 13.9% | 27.8% | 38.9% | 41.7% | 66.7% |
| 50 | 12.5% | 27.8% | 38.9% | 50.0% | 65.3% |
| 80 | 20.8% | 26.4% | 39.6% | 52.8% | 61.1% |

At zero adjustment, **Envoy Bluff loses every tested case** at all three levels. Illusionist Bluff has full-success rates of 66.7%, 83.3% and 33.3% respectively. The level-80 decline shows why the actual seeded Guile/Lore matchup matters more than merely calling an encounter “late game.” Deterministic scrutiny compares those skills directly; this is a threshold-sensitive system.

Honest approaches are closer across kits. Reason has full-success rates of 50%, 50% and 41.7% for both. At level 80, Envoy Appeal reaches 70.8%, versus Illusionist's 50%; the same approach at level 50 reaches only 25% for both. Audience preference, fixture and available preparation spells affect the result; a single aggregate negotiation difficulty would hide these differences.

Changing the initial committer changes the outcome in **11 of 1,080 paired scenarios**: six favor committing first, five favor responding first. Foresight is cast **601 times**, with 1,339 forecast-planning search decisions; Haste is cast 726 times. Foresight is therefore exercised naturally in negotiation, despite being absent from the combat sweep.

Mean focal gross Mana expenditure is 12.37; lasting Mana loss is 1.44 under the existing real-conflict rebate. Mean lasting Renown loss is 0.49. Health is unchanged for the persuader in every case, so this sweep does not establish a meaningful Health tradeoff in negotiation. The generic raw `timeout` flag currently identifies the combat eight-exchange ending only; negotiation conclusions use outcome labels and exchange counts, not its zero values. In fact, 1,301 negotiation cases (60.2%) reach eight exchanges; this includes successes achieved on that final exchange.

## Search and validation

| Measurement | Combat | Negotiation |
|---|---:|---:|
| Search decisions | 14,318 | 31,395 |
| Median | 3.4 ms | 3.1 ms |
| 95th percentile | 9.9 ms | 29.2 ms |
| 99th percentile | 13.4 ms | 32.6 ms |
| Maximum | 35.1 ms | 182.8 ms |
| Mean completed depth | 3.00 exchanges | 2.92 exchanges |
| No completed iteration | 0 | 0 |

The negotiation maximum occurs while planning a forecast command, with one completed exchange and the 5,000-node budget exhausted. These desktop measurements are not phone latency guarantees. The AI remains bounded minimax with a heuristic at its horizon, not an optimal-play oracle; its observed preferences and matchup rankings can depend on that horizon.

**34 frozen-v01/shared-harness/v02 tests pass**, including a new check that skill shifts preserve ranks, capacity, entry resources and opponent skills while rejecting clipping. Both runs' frozen source hashes and exact unique case coverage pass audit. All **32,280 resource ledger rows** obey their accounting and entry caps. **48 selected matches** were replayed from the saved sources: commands, outcomes, ledgers, search values, node counts and completed depths matched exactly; wall-clock durations are excluded from reproducibility comparisons.

All 276 cases from the earlier balance run also match their corresponding cases in these larger panels on outcomes, exchange counts, commands and resource ledgers.

`node tools/grim.js check` also passed in a fresh isolated project snapshot, leaving the shared campaign files untouched. This simulation follow-up does not rerun the full production `npm run verify` pipeline; its earlier two unrelated campaign-test failures remain recorded in [the initial findings](minigame-prototype-v02-findings.md).

The reusable runner now has `cross` and `negotiation` suites, plus analysis and frozen-source replay tools. Reproduction commands are in [the simulation README](../experiments/minigames/README.md). Existing raw results are never overwritten. No browser, game-rule, roster or search-parameter changes were made during these sweeps.
