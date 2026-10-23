# Progressive spells and canonical Mana · Arguments 8


Version 8 retains the expanded roster, ranks and canonical Mana prices from Arguments 7. Only named-signal versus encounter-DC sensitivity is halved: p = .58 + .013 × (.5 × (named signal − encounter DC) − argument DC) + spell bonuses − fatigue, clamped to 5–95%. Each point of skill-versus-DC difference contributes 0.65 percentage points instead of 1.3. Card DC spread, spell bonuses, fatigue and Agreement target scaling retain their previous values. Equal named signal and opponent DC retain the same chance, though equal-level characters can have signals such as alignment that differ from their level.

The standalone simulator now grants 12 / 24 / 34 castable spells at levels 20 / 50 / 80. Level 80 knows the full player roster, including forbidden spells and the deliberately useless Ward and disastrous Flame. Toll is story-only. These are generous research grants, not assertions about campaign acquisition timing. Course ranks use combat thresholds 22/36 (presets I/III/III). Mana capacities are 34/43/52 for the Balanced presets.

Mana prices, rank scaling and capacity come from the frozen combat snapshot in research/combat-canon.mjs. Negotiation discounts and Mana effect overrides are ignored. Examples: Glamour 9/7/5; Foresight 7/6/5; Mend 9/8/7; Haste 5/5/5; Shadowstep 8/10/12; Candour 6; Compel 18; Ward 7. Foresight/Haste/Shadowstep use their combat duration arrays; rank-III Haste saves two Deflect Patience. Other adapted effects retain their previous strengths. No combat or campaign files were changed.

See [the paired before/after comparison](GAP-COMPARISON-8.md) for every policy and difficulty gap.

Validation passed 23 research tests, 28 preserved v3 tests, and short goldens covering 1,605 transitions, 102 spell/rank cases and 12 search comparisons. Native/Wasm agreement is tested on selected seeded games; all main-study games have exact full-state native tape replay.

## Method

6,912 complete games, each independently replayed to an identical full final state. There are 48 paired seed clusters (base 917623), three player levels, four difficulty gaps, two encounter pools, and six policies. Every table counts only full agreement as a win; partial agreements count as failures. Each level/gap/policy cell contains 96 games (48 ordinary, 48 concessions). These cells share seeds, so they are not independent trials. The main study was specified before seeing its results; no effect tuning was performed from these outcomes.

The ordinary case uses the general argument pool. The concessions case uses the broker pool plus explicitly configured 8-Gold and 6-Health requests, weights 5 and 2; entry Gold is 24. Both use Balanced skills, Mood/Health 70 and full canonical Mana capacity. Charm dominates by pool frequency, never as an extra skill in another check. Patience remains 8, Suspicion 6, every acceptance gives one Agreement, and target remains 5/6/7 at DC20/50/80. A higher opponent DC also increases the target at its existing thresholds, so the gap tables measure complete encounter difficulty rather than an isolated roll modifier.

All policies use sampled expectimax in Rust, not an adversarial search: the opponent supplies a weighted random request. Checks branch by exact pass/fail probabilities; unknown requests use three deterministic public strata. Every legal root action is scored; continuations keep up to eight actions. The main study attempts depth 2 with 5000 search nodes per decision, retaining only completed iterations and otherwise using the race heuristic. Spells do not consume response depth. Future hidden draws/RNG are not visible to the planner. Estimated win values are heuristic and are not calibrated forecasts or globally optimal play. The browser still uses its 50 ms cooperative budget and attempts depth 3.

Observed completed main-study search depths: depth 1: 27732; depth 2: 60417. Across 88149 decisions, native search averaged 8.61 ms (maximum 671.57 ms). These fixed-work native timings are not physical-phone latency measurements.

| Policy | Meaning |
| --- | --- |
| frugal | Finite Mana; existing spending weights, up to 6 points estimated win slack. |
| prudent | Finite Mana; existing light spending weights, up to 2 points slack. |
| allout | Finite Mana; maximize estimated full-win chance. |
| dumb | All-out search for ordinary responses; no spells, including zero-Mana spells; every affordable explicit Health/Gold request must be paid. |
| hyper-frugal | All-out search; unlimited Mana budget, but no Health/Gold payments and no Health-cost spells. All other costs remain. Canonical gross Mana bills are recorded virtually; net Mana loss is zero by diagnostic definition. |
| ignorant | All-out search; no spells and no Health/Gold payments. |

The new variants isolate resource permissions while retaining the same response planner; “dumb” is not random play. “Use every Health/Gold option” means pay every affordable explicit request, even when paying fills Suspicion. If an unavailable payment cannot be deflected, withdrawing remains possible. Renown/Mood losses are still allowed in all variants.

## Equal-level results

| Level / DC | frugal | prudent | allout | dumb | hyper-frugal | ignorant |
| --- | --- | --- | --- | --- | --- | --- |
| 20 | 81.3% (78/96) | 82.3% (79/96) | 83.3% (80/96) | 68.8% (66/96) | 66.7% (64/96) | 51.0% (49/96) |
| 50 | 75.0% (72/96) | 69.8% (67/96) | 69.8% (67/96) | 65.6% (63/96) | 64.6% (62/96) | 50.0% (48/96) |
| 80 | 70.8% (68/96) | 74.0% (71/96) | 74.0% (71/96) | 50.0% (48/96) | 68.8% (66/96) | 38.5% (37/96) |

Matched-difficulty figures separated by context (48 games per cell):

| Player = DC | Context | frugal | prudent | allout | dumb | hyper-frugal | ignorant |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 20 | ordinary | 79.2% | 77.1% | 77.1% | 58.3% | 66.7% | 58.3% |
| 20 | concessions | 83.3% | 87.5% | 89.6% | 79.2% | 66.7% | 43.8% |
| 50 | ordinary | 62.5% | 52.1% | 54.2% | 56.3% | 70.8% | 56.3% |
| 50 | concessions | 87.5% | 87.5% | 85.4% | 75.0% | 58.3% | 43.8% |
| 80 | ordinary | 56.3% | 62.5% | 60.4% | 39.6% | 70.8% | 39.6% |
| 80 | concessions | 85.4% | 85.4% | 87.5% | 60.4% | 66.7% | 37.5% |

## Skill-gap results

### Player level 20

| Opponent DC | frugal | prudent | allout | dumb | hyper-frugal | ignorant |
| --- | --- | --- | --- | --- | --- | --- |
| 10 | 88.5% | 89.6% | 88.5% | 79.2% | 82.3% | 60.4% |
| 20 | 81.3% | 82.3% | 83.3% | 68.8% | 66.7% | 51.0% |
| 30 | 67.7% | 69.8% | 71.9% | 59.4% | 52.1% | 38.5% |
| 40 | 46.9% | 47.9% | 47.9% | 30.2% | 19.8% | 11.5% |

### Player level 50

| Opponent DC | frugal | prudent | allout | dumb | hyper-frugal | ignorant |
| --- | --- | --- | --- | --- | --- | --- |
| 40 | 88.5% | 85.4% | 86.5% | 74.0% | 78.1% | 58.3% |
| 50 | 75.0% | 69.8% | 69.8% | 65.6% | 64.6% | 50.0% |
| 60 | 60.4% | 60.4% | 56.3% | 46.9% | 49.0% | 29.2% |
| 70 | 41.7% | 40.6% | 41.7% | 31.3% | 35.4% | 13.5% |

### Player level 80

| Opponent DC | frugal | prudent | allout | dumb | hyper-frugal | ignorant |
| --- | --- | --- | --- | --- | --- | --- |
| 70 | 87.5% | 87.5% | 88.5% | 70.8% | 85.4% | 55.2% |
| 80 | 70.8% | 74.0% | 74.0% | 50.0% | 68.8% | 38.5% |
| 90 | 57.3% | 52.1% | 57.3% | 35.4% | 50.0% | 20.8% |
| 100 | 37.5% | 40.6% | 42.7% | 21.9% | 37.5% | 11.5% |

## Pooled policy and resource results

These figures pool all four DC gaps and both encounter contexts. Confidence intervals resample whole seed clusters (2,000 bootstrap draws, seed 470133); they describe uncertainty over these configured fixtures, not a population of all campaign encounters. Repeated level/encounter/policy runs do not increase the independent seed count.

| Policy | Full wins | 95% seed-cluster interval | Casts/game | Deflect share | Distinct / effective spells |
| --- | --- | --- | --- | --- | --- |
| frugal | 66.9% (771/1152) | 59.7%–73.8% | 5.18 | 12.2% | 27 / 9.39 |
| prudent | 66.7% (768/1152) | 59.6%–73.5% | 5.86 | 10.9% | 27 / 9.47 |
| allout | 67.4% (776/1152) | 60.2%–74.3% | 5.96 | 10.9% | 26 / 9.78 |
| dumb | 52.8% (608/1152) | 44.4%–60.8% | 0.00 | 15.1% | 0 / 0.00 |
| hyper-frugal | 57.5% (662/1152) | 49.0%–65.5% | 7.29 | 15.9% | 23 / 9.10 |
| ignorant | 36.5% (421/1152) | 28.6%–44.4% | 0.00 | 18.6% | 0 / 0.00 |

| Policy | Gross Mana/game | Net Mana | Gold | Health | Renown | Mood |
| --- | --- | --- | --- | --- | --- | --- |
| frugal | 33.98 | 15.92 | 1.77 | 2.18 | 1.45 | 8.59 |
| prudent | 39.45 | 18.56 | 2.40 | 2.58 | 1.69 | 8.48 |
| allout | 40.28 | 18.75 | 2.47 | 2.87 | 1.86 | 8.35 |
| dumb | 0.00 | 0.00 | 2.87 | 0.57 | 0.71 | 8.78 |
| hyper-frugal | 58.83 | 0.00 | 0.00 | 0.00 | 1.60 | 10.93 |
| ignorant | 0.00 | 0.00 | 0.00 | 0.00 | 0.69 | 9.51 |

Health/Mana/Renown/Mood figures are average net losses after their 50% rebates; Gold has no rebate. Hyper-frugal’s gross Mana is a virtual canonical bill, not a real campaign cost or resource gain. Zero spell casts are reported as zero effective spells.

### Context sensitivity

| Policy | Ordinary win rate | Concessions win rate |
| --- | --- | --- |
| frugal | 56.6% | 77.3% |
| prudent | 53.3% | 80.0% |
| allout | 54.2% | 80.6% |
| dumb | 40.6% | 64.9% |
| hyper-frugal | 60.4% | 54.5% |
| ignorant | 40.6% | 32.5% |

## Action and spell usage

| Policy | Confront | Deflect | Withdraw |
| --- | --- | --- | --- |
| frugal | 8942 | 1245 | 5 |
| prudent | 9098 | 1117 | 4 |
| allout | 9077 | 1114 | 4 |
| dumb | 8237 | 1466 | 0 |
| hyper-frugal | 8654 | 1636 | 4 |
| ignorant | 7728 | 1784 | 56 |

The following spell tables separate finite-Mana play (Frugal/Prudent/All-out pooled) from unlimited-Mana play. Each cell is casts per 100 games, across all DC gaps and both contexts. Zero use can mean an adaptation is irrelevant, dominated, too expensive, or undervalued by this bounded planner; these simulations alone cannot distinguish those explanations.

| Spell | Finite L20 | Finite L50 | Finite L80 | Unlimited L20 | Unlimited L50 | Unlimited L80 |
| --- | --- | --- | --- | --- | --- | --- |
| flame | 0.0 | 0.0 | 0.0 | 5.5 | 0.0 | 0.0 |
| mend | 81.3 | 32.6 | 0.2 | 0.0 | 0.0 | 0.0 |
| foresight | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| haste | 1.6 | 0.6 | 0.7 | 2.3 | 0.5 | 0.5 |
| shadowstep | 15.8 | 2.2 | 1.8 | 88.8 | 28.1 | 18.8 |
| ward | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| glamour | 37.8 | 13.6 | 5.9 | 144.0 | 12.8 | 4.9 |
| index | 0.0 | 0.0 | 1.0 | 0.0 | 0.0 | 0.0 |
| rapport | 1.4 | 0.0 | 0.0 | 29.2 | 0.0 | 0.0 |
| quickquill | 35.9 | 6.8 | 6.4 | 63.3 | 3.4 | 1.0 |
| sleight | 34.7 | 19.4 | 14.9 | 37.5 | 0.8 | 0.5 |
| candour | 134.3 | 209.6 | 220.8 | 160.9 | 250.5 | 318.5 |
| rime | 0.0 | 1.8 | 0.3 | 0.0 | 3.9 | 0.0 |
| brace | 0.0 | 12.9 | 0.3 | 0.0 | 97.9 | 74.2 |
| tailwind | 0.0 | 1.4 | 1.6 | 0.0 | 2.3 | 0.5 |
| bramble | 0.0 | 1.4 | 1.3 | 0.0 | 3.6 | 3.1 |
| hoarfrost | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| reflect | 0.0 | 10.8 | 3.3 | 0.0 | 25.5 | 21.9 |
| purify | 0.0 | 34.1 | 59.9 | 0.0 | 0.0 | 0.0 |
| starlight | 0.0 | 1.1 | 2.9 | 0.0 | 16.1 | 19.0 |
| animate | 0.0 | 44.0 | 42.7 | 0.0 | 82.6 | 79.2 |
| contraption | 0.0 | 0.0 | 0.0 | 0.0 | 0.5 | 1.0 |
| heartwood | 0.0 | 0.0 | 0.0 | 0.0 | 22.4 | 10.9 |
| omen | 0.0 | 175.3 | 149.6 | 0.0 | 231.0 | 180.2 |
| moonwell | 0.0 | 0.0 | 18.8 | 0.0 | 0.0 | 0.0 |
| lodestar | 0.0 | 0.0 | 63.3 | 0.0 | 0.0 | 57.8 |
| seal | 0.0 | 0.0 | 1.6 | 0.0 | 0.0 | 8.1 |
| wildfire | 0.0 | 0.0 | 5.7 | 0.0 | 0.0 | 6.3 |
| torment | 0.0 | 0.0 | 8.9 | 0.0 | 0.0 | 0.0 |
| extraction | 0.0 | 0.0 | 121.1 | 0.0 | 0.0 | 0.0 |
| siphon | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| compel | 0.0 | 0.0 | 4.1 | 0.0 | 0.0 | 58.6 |
| eclipse | 0.0 | 0.0 | 8.1 | 0.0 | 0.0 | 8.9 |
| heartprice | 0.0 | 0.0 | 43.8 | 0.0 | 0.0 | 0.0 |

## Stronger-search check

384 games re-evaluate the first eight paired seeds at gaps 0 and +20 with depth 3, 30,000 nodes, beam 12 and five request samples. This is a small sensitivity check on the same seeds, not an independent validation set or an exact solver.

| Policy | Main on paired subset | Stronger on same cases |
| --- | --- | --- |
| allout | 63.5% (61/96) | 62.5% (60/96) |
| dumb | 43.8% (42/96) | 44.8% (43/96) |
| hyper-frugal | 43.8% (42/96) | 52.1% (50/96) |
| ignorant | 26.0% (25/96) | 28.1% (27/96) |

## Interpretation and limits

Finite-Mana policies used 27 spell types. candour and omen account for 52.3% of finite casts; the effective count is 9.63. This is broader spell usage than the old small-kit study, but two spells still dominate. A plausible tactical pattern is to use Candour to make room under the Suspicion limit and Omen to soften rejection, with Health-to-Resolve recovery sustaining that cycle. This is an interpretation of the usage/effects, not a causal ablation. Mend is common early; Extraction and Heartprice largely replace it late.

Zero-use spells in the main study: foresight, ward, hoarfrost, siphon. Foresight casts: main 0, stronger 0. Zero information-spell use could reflect this short horizon and limited value of advance planning in these encounters; it does not establish that information has no value under stronger play. A large available roster is therefore not yet an evenly valuable roster.

The main study recorded 21 Flame casts. Audit: every cast had zero estimated full-win chance for every legal root action: true; every Flame/Withdraw utility matched: true. Where both hold these are surrender ties, not a winning tactic; exclude them from useful-variety claims. See the run directory’s flame-tie-audit.json. Raw action frequencies are retained unchanged.

Encounter context matters: the payment-friendly case favors policies allowed to pay, while the no-payment variant must spend Patience to bypass those leads. The two contexts also use different ordinary pools, so their difference is not an isolated estimate of bribery’s effect. The 50% ordinary/50% concession weighting is a benchmark convention, not an estimate of campaign frequency. No further effect tuning was performed to force a reliability target.

Spell access does not guarantee that this bounded AI uses it well. Small, correlated policy differences and the stronger-search table caution against claiming optimality, monotonic policy superiority or full search convergence.

The warmed Node/Wasm check used the gameplay worker’s 50 ms budget, depth-3 attempt, beam 8 and three request samples: 36 whole calls, mean 51.83 ms, p95 60.15 ms, maximum 65.28 ms. Completed depths: {"1":27,"2":9}. The cooperative search clock excludes some setup/serialization work and can overshoot under host load. This measures this computer, not a physical phone. Browser gameplay was checked at 320×568 with the full roster and a selected spell; only the spell tray scrolls.

Read the tables before concluding that the full roster has solved the difficulty problem. Spell breadth, canonical prices, ranked durations and the forced-payment policies all changed together; this study does not isolate each causal contribution. Availability counts do not establish tactical depth. The action/spell concentration and the stronger-search comparison are more useful diagnostics than raw spell count. Unlimited Mana removes one constraint; the Health/Gold restriction means this policy is not an upper bound on unrestricted play. Renown, Suspicion, Resolve and Patience still constrain it. A finite-Mana win advantage over unlimited Mana on some seeds is possible because the policies forbid different payments and use approximate search.

These results replace the previous small-kit balance assumptions. They do not certify optimal AI, calibrated evaluation values, all encounter adapters, physical-phone performance or campaign acquisition balance. Historical interrupted/pilot runs are excluded.

## Reproduce and inspect

Main raw data: experiments/negotiation/results/gentler-gap8-main-01/matches.ndjson. Manifest: experiments/negotiation/results/gentler-gap8-main-01/manifest.json. Frozen source/native/Wasm builds: experiments/negotiation/results/gentler-gap8-main-01/source/. Stronger study: experiments/negotiation/results/gentler-gap8-strong-01/. Existing historical results were preserved.

```sh
node experiments/negotiation/research/run.mjs --episodes 48 --seed 917623 --objectives frugal,prudent,allout,dumb,hyper-frugal,ignorant --gaps -10,0,10,20 --diagnostics none --depth 2 --nodes 5000 --beam 8 --trace false --tune experiments/negotiation/research/live-config.mjs --out /private/tmp/negotiation-progression-new
```
