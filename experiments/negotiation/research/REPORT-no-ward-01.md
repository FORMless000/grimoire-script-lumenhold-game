# No-Ward confirmation · research version 6

Candidate 6 was selected using training only, before these independent seeds were evaluated. The aggregate-fitness leader was candidate 5, but its level-80 training win rate missed the declared lower band. Candidate 6 met all three per-level training bands. Ward has no useful effect, including when imported older tuning tries to restore it. It remains castable, paying Mana and Suspicion.

The held-out study contains 1440 games on 24 independent seed clusters (base 529371), across three resource objectives and fixed encounter/profile fixtures. Every action tape replayed exactly. These are full wins; partial agreements count as failures.

| Player level = DC | Full wins, ordinary kits | 95% seed-cluster interval |
| --- | --- | --- |
| 20 | 71.4% | 61.1%–81.4% |
| 50 | 67.5% | 53.3%–80.8% |
| 80 | 63.3% | 50.3%–76.7% |

| Objective | Full wins | Mean net Mana | Gold | Health | Renown | Mood |
| --- | --- | --- | --- | --- | --- | --- |
| frugal | 66.1% | 2.95 | 0.60 | 0.44 | 0.94 | 7.27 |
| prudent | 67.8% | 3.93 | 0.71 | 0.46 | 1.00 | 7.09 |
| allout | 68.3% | 4.23 | 0.71 | 0.48 | 1.00 | 7.02 |

Gold is never rebated. Other costs above are after their configured 50% rebates. Resource gains cannot earn negative spending utility. Differences in wins are noisy paired-seed estimates; a Frugal win advantage is not evidence that it is globally stronger than All-out.

frugal minus All-out, paired by encounter/level/seed: win difference -2.2 percentage points (95% seed-cluster interval -5.0 to 0.3); Mana difference -1.28 (interval -1.59 to -1.00). Negative costs mean savings.

prudent minus All-out, paired by encounter/level/seed: win difference -0.6 percentage points (95% seed-cluster interval -1.7 to 0.6); Mana difference -0.30 (interval -0.40 to -0.21). Negative costs mean savings.

Responses: Confront 7874, Deflect 1494, Withdraw 0. Deflect share 15.9%. Ordinary-kit effective spell count 4.87; top spell 42.7%; top pair 61.7%. Effective count is exp(Shannon entropy), a concentration statistic, not proof of strategic depth.

| Spell in ordinary-kit games | Casts | Share |
| --- | --- | --- |
| glamour | 781 | 42.7% |
| seal | 348 | 19.0% |
| mend | 295 | 16.1% |
| shadowstep | 252 | 13.8% |
| rime | 66 | 3.6% |
| tailwind | 31 | 1.7% |
| reflect | 26 | 1.4% |
| starlight | 21 | 1.1% |
| haste | 6 | 0.3% |
| brace | 3 | 0.2% |
| moonwell | 2 | 0.1% |

worn: 143/216 wins (66.2%), 3 spells used, effective count 2.65, top spell 47.0%, top pair 88.0%. All-spell/resource-access explicitly grant the full roster; these are stress tests, not ordinary campaign kits.

all-spells: 72/72 wins (100.0%), 12 spells used, effective count 5.92, top spell 25.8%, top pair 49.5%. All-spell/resource-access explicitly grant the full roster; these are stress tests, not ordinary campaign kits.

resource-access: 70/72 wins (97.2%), 18 spells used, effective count 6.84, top spell 28.0%, top pair 51.9%. All-spell/resource-access explicitly grant the full roster; these are stress tests, not ordinary campaign kits.

## Difficulty gaps

Prudent policy, General audience, Balanced kit; gap changes encounter DC and its Agreement target. At boundaries, DC is clamped to 1–100. Each cell uses 24 seeds and has substantial uncertainty.

| Player level | DC −20 | −10 | Equal | +10 | +20 |
| --- | --- | --- | --- | --- | --- |
| 20 | 91.7% | 87.5% | 70.8% | 41.7% | 12.5% |
| 50 | 95.8% | 87.5% | 66.7% | 33.3% | 12.5% |
| 80 | 95.8% | 87.5% | 66.7% | 29.2% | 8.3% |

| Same-level General audience | Always Confront | One-response search | Two-response screening search |
| --- | --- | --- | --- |
| 20 | 50.0% | 79.2% | 70.8% |
| 50 | 50.0% | 66.7% | 66.7% |
| 80 | 37.5% | 62.5% | 66.7% |

## Search evidence and limits

The simulator uses vector-valued sampled expectimax, not alpha–beta or reinforcement learning. It branches check outcomes exactly, samples unknown future arguments from the public pool, and tracks temporary spell durations, costs and settlement. Fixed-work screening uses two responses, 16,000 nodes, three argument strata and a continuation beam of eight. All legal root actions are scored. Three objectives compare win estimates and normalized post-rebate losses, with a 6/2/0-percentage-point local win allowance. The browser worker has a 50 ms cooperative budget. Displayed E is heuristic utility, not a calibrated win percentage.

On 30 frozen states, one-response versus stronger search changed 13.3% of decisions; two-response changed 16.7%. Mean utility regret under the stronger evaluator was 0.0032 / 0.0035. Strong completed depths: {"2":3,"3":27}. In the wider/horizon check (12 ordinary-kit states), deeper disagreement 0.0%, mean regret 0.0000; wider disagreement 0.0%, mean regret 0.0000. Completed depths: deeper {"3":9,"4":3}, wider {"2":4,"3":8}. Incomplete depth attempts do not count as convergence.

Exact reduced endgames, including free-action spell choices, agree with an independently exhaustive JavaScript solver. The original v3 still passes 1,605 transitions, 102 spell/rank cases, 12 search goldens and 28 tests. This validates those mechanics and small searches; it does not certify optimal whole-game play.

Common strategies are to confront favorable signals, preserve on-record/personal/public acceptance benefits, use cheap supported checks before spending Suspicion on magic, restore Resolve before fatigue or a large Mood bill, and pay/discount explicit concessions only when their certainty is worth the resources. Deflect becomes less attractive as Patience runs low or its accumulated Suspicion risk rises. Spell recovery cannot farm Mana above entry.

Reproduce from the manifests and frozen sources in the result directories. Bootstrap seed 871203, 2,000 seed-cluster replicates. The public states and exact scores for examples where the same argument/chance produces different actions are retained in analysis.json. All work remains inside the negotiation experiment; no main-game commits were made.
