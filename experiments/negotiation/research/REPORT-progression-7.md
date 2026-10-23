# Progressive spells and canonical Mana · Arguments 7


The standalone simulator now grants 12 / 24 / 34 castable spells at levels 20 / 50 / 80. Level 80 knows the full player roster, including forbidden spells and the deliberately useless Ward and disastrous Flame. Toll is story-only. These are generous research grants, not assertions about campaign acquisition timing. Course ranks use combat thresholds 22/36 (presets I/III/III). Mana capacities are 34/43/52 for the Balanced presets.

Mana prices, rank scaling and capacity come from the frozen combat snapshot in research/combat-canon.mjs. Negotiation discounts and Mana effect overrides are ignored. Examples: Glamour 9/7/5; Foresight 7/6/5; Mend 9/8/7; Haste 5/5/5; Shadowstep 8/10/12; Candour 6; Compel 18; Ward 7. Foresight/Haste/Shadowstep use their combat duration arrays; rank-III Haste saves two Deflect Patience. Other adapted effects retain their previous strengths. No combat or campaign files were changed.

## Method

6,912 complete games, each independently replayed to an identical full final state. There are 48 paired seed clusters (base 917623), three player levels, four difficulty gaps, two encounter pools, and six policies. Every table counts only full agreement as a win; partial agreements count as failures. Each level/gap/policy cell contains 96 games (48 ordinary, 48 concessions). These cells share seeds, so they are not independent trials. The main study was specified before seeing its results; no effect tuning was performed from these outcomes.

The ordinary case uses the general argument pool. The concessions case uses the broker pool plus explicitly configured 8-Gold and 6-Health requests, weights 5 and 2; entry Gold is 24. Both use Balanced skills, Mood/Health 70 and full canonical Mana capacity. Charm dominates by pool frequency, never as an extra skill in another check. Patience remains 8, Suspicion 6, every acceptance gives one Agreement, and target remains 5/6/7 at DC20/50/80. A higher opponent DC also increases the target at its existing thresholds, so the gap tables measure complete encounter difficulty rather than an isolated roll modifier.

All policies use sampled expectimax in Rust, not an adversarial search: the opponent supplies a weighted random request. Checks branch by exact pass/fail probabilities; unknown requests use three deterministic public strata. Every legal root action is scored; continuations keep up to eight actions. The main study attempts depth 2 with 5000 search nodes per decision, retaining only completed iterations and otherwise using the race heuristic. Spells do not consume response depth. Future hidden draws/RNG are not visible to the planner. Estimated win values are heuristic and are not calibrated forecasts or globally optimal play. The browser still uses its 50 ms cooperative budget and attempts depth 3.

Observed completed main-study search depths: depth 1: 26709; depth 2: 56837. Across 83546 decisions, native search averaged 6.17 ms (maximum 178.38 ms). These fixed-work native timings are not physical-phone latency measurements.

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
| 20 | 79.2% (76/96) | 83.3% (80/96) | 83.3% (80/96) | 68.8% (66/96) | 68.8% (66/96) | 53.1% (51/96) |
| 50 | 75.0% (72/96) | 69.8% (67/96) | 69.8% (67/96) | 65.6% (63/96) | 64.6% (62/96) | 50.0% (48/96) |
| 80 | 71.9% (69/96) | 70.8% (68/96) | 69.8% (67/96) | 50.0% (48/96) | 66.7% (64/96) | 37.5% (36/96) |

Matched-difficulty figures separated by context (48 games per cell):

| Player = DC | Context | frugal | prudent | allout | dumb | hyper-frugal | ignorant |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 20 | ordinary | 72.9% | 77.1% | 77.1% | 58.3% | 70.8% | 58.3% |
| 20 | concessions | 85.4% | 89.6% | 89.6% | 79.2% | 66.7% | 47.9% |
| 50 | ordinary | 62.5% | 52.1% | 54.2% | 56.3% | 70.8% | 56.3% |
| 50 | concessions | 87.5% | 87.5% | 85.4% | 75.0% | 58.3% | 43.8% |
| 80 | ordinary | 58.3% | 56.3% | 56.3% | 39.6% | 70.8% | 39.6% |
| 80 | concessions | 85.4% | 85.4% | 83.3% | 60.4% | 62.5% | 35.4% |

## Skill-gap results

### Player level 20

| Opponent DC | frugal | prudent | allout | dumb | hyper-frugal | ignorant |
| --- | --- | --- | --- | --- | --- | --- |
| 10 | 91.7% | 92.7% | 94.8% | 87.5% | 90.6% | 71.9% |
| 20 | 79.2% | 83.3% | 83.3% | 68.8% | 68.8% | 53.1% |
| 30 | 53.1% | 58.3% | 58.3% | 41.7% | 39.6% | 20.8% |
| 40 | 20.8% | 22.9% | 25.0% | 14.6% | 6.3% | 4.2% |

### Player level 50

| Opponent DC | frugal | prudent | allout | dumb | hyper-frugal | ignorant |
| --- | --- | --- | --- | --- | --- | --- |
| 40 | 89.6% | 88.5% | 87.5% | 80.2% | 84.4% | 63.5% |
| 50 | 75.0% | 69.8% | 69.8% | 65.6% | 64.6% | 50.0% |
| 60 | 40.6% | 40.6% | 41.7% | 31.3% | 35.4% | 13.5% |
| 70 | 10.4% | 19.8% | 14.6% | 14.6% | 10.4% | 5.2% |

### Player level 80

| Opponent DC | frugal | prudent | allout | dumb | hyper-frugal | ignorant |
| --- | --- | --- | --- | --- | --- | --- |
| 70 | 94.8% | 93.8% | 95.8% | 81.3% | 90.6% | 63.5% |
| 80 | 71.9% | 70.8% | 69.8% | 50.0% | 66.7% | 37.5% |
| 90 | 38.5% | 42.7% | 42.7% | 19.8% | 34.4% | 9.4% |
| 100 | 9.4% | 16.7% | 16.7% | 6.3% | 11.5% | 2.1% |

## Pooled policy and resource results

These figures pool all four DC gaps and both encounter contexts. Confidence intervals resample whole seed clusters (2,000 bootstrap draws, seed 470133); they describe uncertainty over these configured fixtures, not a population of all campaign encounters. Repeated level/encounter/policy runs do not increase the independent seed count.

| Policy | Full wins | 95% seed-cluster interval | Casts/game | Deflect share | Distinct / effective spells |
| --- | --- | --- | --- | --- | --- |
| frugal | 56.3% (648/1152) | 50.8%–61.7% | 4.52 | 13.8% | 28 / 9.55 |
| prudent | 58.3% (672/1152) | 52.7%–64.1% | 5.50 | 11.9% | 28 / 9.70 |
| allout | 58.3% (672/1152) | 52.6%–64.1% | 5.71 | 11.6% | 27 / 9.84 |
| dumb | 46.8% (539/1152) | 40.4%–53.1% | 0.00 | 15.7% | 0 / 0.00 |
| hyper-frugal | 50.3% (579/1152) | 44.0%–56.3% | 6.95 | 16.3% | 24 / 9.34 |
| ignorant | 32.9% (379/1152) | 26.6%–39.3% | 0.00 | 19.4% | 0 / 0.00 |

| Policy | Gross Mana/game | Net Mana | Gold | Health | Renown | Mood |
| --- | --- | --- | --- | --- | --- | --- |
| frugal | 28.54 | 12.84 | 1.55 | 1.87 | 1.19 | 8.63 |
| prudent | 36.80 | 17.22 | 2.21 | 2.40 | 1.50 | 8.50 |
| allout | 38.92 | 18.33 | 2.27 | 2.72 | 1.66 | 8.36 |
| dumb | 0.00 | 0.00 | 2.88 | 0.57 | 0.68 | 8.88 |
| hyper-frugal | 55.78 | 0.00 | 0.00 | 0.00 | 1.52 | 10.75 |
| ignorant | 0.00 | 0.00 | 0.00 | 0.00 | 0.66 | 9.47 |

Health/Mana/Renown/Mood figures are average net losses after their 50% rebates; Gold has no rebate. Hyper-frugal’s gross Mana is a virtual canonical bill, not a real campaign cost or resource gain. Zero spell casts are reported as zero effective spells.

### Context sensitivity

| Policy | Ordinary win rate | Concessions win rate |
| --- | --- | --- |
| frugal | 47.7% | 64.8% |
| prudent | 47.4% | 69.3% |
| allout | 47.7% | 68.9% |
| dumb | 37.0% | 56.6% |
| hyper-frugal | 54.9% | 45.7% |
| ignorant | 37.0% | 28.8% |

## Action and spell usage

| Policy | Confront | Deflect | Withdraw |
| --- | --- | --- | --- |
| frugal | 8037 | 1300 | 73 |
| prudent | 8580 | 1160 | 9 |
| allout | 8714 | 1140 | 4 |
| dumb | 7939 | 1473 | 0 |
| hyper-frugal | 8221 | 1598 | 7 |
| ignorant | 7327 | 1775 | 65 |

The following spell tables separate finite-Mana play (Frugal/Prudent/All-out pooled) from unlimited-Mana play. Each cell is casts per 100 games, across all DC gaps and both contexts. Zero use can mean an adaptation is irrelevant, dominated, too expensive, or undervalued by this bounded planner; these simulations alone cannot distinguish those explanations.

| Spell | Finite L20 | Finite L50 | Finite L80 | Unlimited L20 | Unlimited L50 | Unlimited L80 |
| --- | --- | --- | --- | --- | --- | --- |
| flame | 0.0 | 0.0 | 0.0 | 5.5 | 0.0 | 0.0 |
| mend | 74.3 | 30.6 | 0.2 | 0.0 | 0.0 | 0.0 |
| foresight | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| haste | 1.8 | 0.3 | 0.3 | 3.1 | 0.8 | 0.5 |
| shadowstep | 19.7 | 2.7 | 1.4 | 91.7 | 25.3 | 14.6 |
| ward | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| glamour | 33.2 | 10.4 | 4.2 | 138.3 | 11.5 | 2.9 |
| index | 0.2 | 0.1 | 1.4 | 1.0 | 0.0 | 0.0 |
| rapport | 1.7 | 0.1 | 0.0 | 40.9 | 0.0 | 0.0 |
| quickquill | 31.4 | 7.0 | 4.9 | 61.7 | 3.9 | 1.0 |
| sleight | 35.2 | 17.4 | 12.8 | 39.6 | 0.8 | 0.3 |
| candour | 118.2 | 187.5 | 198.7 | 154.9 | 233.3 | 285.7 |
| rime | 0.0 | 1.6 | 0.3 | 0.0 | 3.4 | 0.0 |
| brace | 0.0 | 11.9 | 0.5 | 0.0 | 85.7 | 58.9 |
| tailwind | 0.0 | 1.3 | 0.8 | 0.0 | 1.8 | 0.5 |
| bramble | 0.0 | 2.8 | 2.0 | 0.0 | 6.8 | 3.4 |
| hoarfrost | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| reflect | 0.0 | 9.7 | 3.4 | 0.0 | 27.1 | 17.2 |
| purify | 0.0 | 42.5 | 45.4 | 0.0 | 0.0 | 0.0 |
| starlight | 0.0 | 1.3 | 1.8 | 0.0 | 16.1 | 17.7 |
| animate | 0.0 | 39.1 | 38.0 | 0.0 | 77.9 | 77.3 |
| contraption | 0.0 | 0.0 | 0.4 | 0.0 | 0.3 | 2.6 |
| heartwood | 0.0 | 0.0 | 0.0 | 0.0 | 20.6 | 12.0 |
| omen | 0.0 | 177.7 | 147.1 | 0.0 | 231.0 | 179.4 |
| moonwell | 0.0 | 0.0 | 27.3 | 0.0 | 0.0 | 0.0 |
| lodestar | 0.0 | 0.0 | 60.5 | 0.0 | 0.0 | 55.2 |
| seal | 0.0 | 0.0 | 1.1 | 0.0 | 0.0 | 5.5 |
| wildfire | 0.0 | 0.0 | 4.7 | 0.0 | 0.0 | 4.9 |
| torment | 0.0 | 0.0 | 9.0 | 0.0 | 0.0 | 0.0 |
| extraction | 0.0 | 0.0 | 95.0 | 0.0 | 0.0 | 0.0 |
| siphon | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| compel | 0.0 | 0.0 | 3.3 | 0.0 | 0.0 | 53.9 |
| eclipse | 0.0 | 0.0 | 7.8 | 0.0 | 0.0 | 8.1 |
| heartprice | 0.0 | 0.0 | 40.6 | 0.0 | 0.0 | 0.0 |

## Stronger-search check

384 games re-evaluate the first eight paired seeds at gaps 0 and +20 with depth 3, 30,000 nodes, beam 12 and five request samples. This is a small sensitivity check on the same seeds, not an independent validation set or an exact solver. Its source snapshot precedes the batch-replay optimization; simulation/search rules are identical.

| Policy | Main on paired subset | Stronger on same cases |
| --- | --- | --- |
| allout | 50.0% (48/96) | 49.0% (47/96) |
| dumb | 33.3% (32/96) | 33.3% (32/96) |
| hyper-frugal | 33.3% (32/96) | 40.6% (39/96) |
| ignorant | 22.9% (22/96) | 24.0% (23/96) |

## Interpretation and limits

Finite-Mana policies used 28 spell types. candour and omen account for 52.7% of finite casts; the effective count is 9.82. This is broader spell usage than the old small-kit study, but two spells still dominate. A plausible tactical pattern is to use Candour to make room under the Suspicion limit and Omen to soften rejection, with Health-to-Resolve recovery sustaining that cycle. This is an interpretation of the usage/effects, not a causal ablation. Mend is common early; Extraction and Heartprice largely replace it late.

Foresight, Hoarfrost and Siphon were never used in the main study, and neither was the intentionally irrelevant Ward. Foresight was also unused in the stronger subset. Its absence could reflect this short horizon and limited value of advance planning in these encounters; it does not establish that information has no value under stronger play. A large available roster is therefore not yet an evenly valuable roster.

The unlimited-Mana policy made 21 Flame casts, all at level 20. A separate replay/search audit of every one found zero estimated full-win chance for every legal root action and identical Flame/Withdraw scores and costs. These are alphabetical surrender ties under the virtual Mana accounting, not a winning tactic; exclude Flame from useful-variety claims. See main-02/flame-tie-audit.json. The raw action frequencies are retained unchanged.

Encounter context matters: the payment-friendly case favors policies allowed to pay, while the no-payment variant must spend Patience to bypass those leads. The two contexts also use different ordinary pools, so their difference is not an isolated estimate of bribery’s effect. The 50% ordinary/50% concession weighting is a benchmark convention, not an estimate of campaign frequency. The intended early-level 90% reliability is still missed in the ordinary equal-DC fixture (All-out 37/48 = 77.1%). No further tuning was performed to force that target.

Spell access does not guarantee that this bounded AI uses it well. At equal DC50 in the ordinary pool, All-out wins 26/48 versus Ignorant 27/48; Frugal wins 30/48. The small stronger check raises Hyper-frugal from 32/96 to 39/96, while finite All-out moves from 48/96 to 47/96. These small, correlated differences caution against claiming optimality, monotonic policy superiority or full search convergence.

The warmed Node/Wasm check used the gameplay worker’s 50 ms budget, depth-3 attempt, beam 8 and three request samples: 36 whole calls, mean 52.71 ms, p95 63.02 ms, maximum 109.14 ms. Completed depths: {"1":24,"2":12}. The cooperative search clock excludes some setup/serialization work and can overshoot under host load. This measures this computer, not a physical phone. Browser gameplay was checked at 320×568 with the full roster and a selected spell; only the spell tray scrolls.

Read the tables before concluding that the full roster has solved the difficulty problem. Spell breadth, canonical prices, ranked durations and the forced-payment policies all changed together; this study does not isolate each causal contribution. Availability counts do not establish tactical depth. The action/spell concentration and the stronger-search comparison are more useful diagnostics than raw spell count. Unlimited Mana removes one constraint; the Health/Gold restriction means this policy is not an upper bound on unrestricted play. Renown, Suspicion, Resolve and Patience still constrain it. A finite-Mana win advantage over unlimited Mana on some seeds is possible because the policies forbid different payments and use approximate search.

These results replace the previous small-kit balance assumptions. They do not certify optimal AI, calibrated evaluation values, all encounter adapters, physical-phone performance or campaign acquisition balance. The interrupted main-01 result is explicitly marked incomplete and excluded; pilot results are also excluded.

## Reproduce and inspect

Main raw data: experiments/negotiation/results/canonical-progression-main-02/matches.ndjson. Manifest: experiments/negotiation/results/canonical-progression-main-02/manifest.json. Frozen source/native/Wasm builds: experiments/negotiation/results/canonical-progression-main-02/source/. Stronger study: experiments/negotiation/results/canonical-progression-strong-01/. Existing historical results were preserved.

```sh
node experiments/negotiation/research/run.mjs --episodes 48 --seed 917623 --objectives frugal,prudent,allout,dumb,hyper-frugal,ignorant --gaps -10,0,10,20 --diagnostics none --depth 2 --nodes 5000 --beam 8 --trace false --tune experiments/negotiation/research/live-config.mjs --out /private/tmp/negotiation-progression-new
```
