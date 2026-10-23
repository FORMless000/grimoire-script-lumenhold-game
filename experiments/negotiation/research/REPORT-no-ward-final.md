# Testplay wrap-up · Arguments 6 · 2026-10-21

This iteration is frozen for human testplay at the user’s request. Automatic tuning has stopped. All changes remain in the standalone experiment. The current rules are now the default local preview; add `legacy=1` for the preserved Arguments 3 comparison.

Current testplay: [Early / 20](http://127.0.0.1:55918/?quickstart=20), [Mid / 50](http://127.0.0.1:55918/?quickstart=50), [Late / 80](http://127.0.0.1:55918/?quickstart=80). The local server must be running on this computer. The existing remote Sites project could not be accessed by the currently connected account (project-not-found; site list empty). Per the user’s choice, this wrap-up uses local hosting; the older remote publication was not updated to this final build.

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

Reproduce from the manifests and frozen sources in the result directories. Bootstrap seed 871203, 2,000 seed-cluster replicates. Public decision summaries and exact scores for examples where the same argument and rounded acceptance chance produce different actions are retained in analysis.json. All work remains inside the negotiation experiment; no main-game commits were made.

## Why the choices are more varied

The six presentations change the value of acceptance and the consequences of rejection. On-record acceptance clears Suspicion, personal acceptance restores Resolve, and public acceptance restores Patience while rejection risks Renown. This adds a resource-state decision to the named-signal check. Every accepted argument still gives only one Agreement.

The same named argument at the same exact acceptance chance, level and objective can produce either response:

| Argument / chance | State choosing Confront | State choosing Deflect |
| --- | --- | --- |
| objection~personal / 52.8% | Patience 4, Suspicion 2, Resolve 21.1, Agreement 2 | Patience 7, Suspicion 1, Resolve 17, Agreement 2 |
| job_intern_conclave~personal / 45.0% | Patience 4, Suspicion 2, Resolve 22, Agreement 3 | Patience 6, Suspicion 0, Resolve 15, Agreement 4 |
| reassurance~record / 61.9% | Patience 4, Suspicion 1, Resolve 20.1, Agreement 2 | Patience 8, Suspicion 0, Resolve 20, Agreement 3 |

These examples demonstrate state dependence, not causal attribution to one resource: other public variables can differ too. They do not prove that the chosen response is globally optimal. The full frozen tapes allow reconstruction.

## Stronger-policy follow-up

A small paired stronger-policy study completed three-response searches for all 334 decisions. In the 24 ordinary-kit games it won 16/24, versus 14/24 for the matched screening policy. It used 5 spell types, including Foresight. This is only two seeds per fixture and is descriptive follow-up, not a reliable superiority estimate.

The expanded full-roster stronger-policy diagnostic won 24/24, used 17 spell types (effective count 7.95), and cast Candour 33.3% of the time. The two most frequent spells accounted for 51.7% of casts. All 371 decisions completed depth three. This supports varied spell use under stronger play, but also confirms the full-roster kit is too forgiving at equal DC.

Wide-roster states that could not finish unpruned depth three were separately tested with continuation beams of eight and sixteen. Both completed depth three and agreed on the selected action in all three targeted states: Animate under Frugal, Extraction under All-out, and Torment in the pressured concession state. Wider seven-stratum and attempted depth-four searches did not finish their requested horizons. This is limited stability evidence, not full convergence.

## Current engine and performance

The browser worker uses the same eight-action continuation beam as the practical simulator; all legal actions on the current turn still receive scores. A search-only Foresight optimization removes peeks that the horizon leaf never reads and merges their equivalent cache keys. Eight frozen before/after comparisons retained every root score to 1e-10 and the selected action; exact endgame and Foresight tests verify that useful future reveals remain visible beyond that horizon.

On this Apple Silicon host, 45 warmed Node/Wasm calls with the gameplay settings averaged 50.1 ms including the JSON boundary; p95 52.5 ms, maximum 53.7 ms. Completed depths: {"1":6,"2":39}. The cooperative 50 ms budget therefore has a small boundary overhead; it is not a strict whole-call deadline or a benchmark of a physical phone. The worker keeps those calls off the UI thread.

## Testplay verdict and remaining limits

There is enough ordinary-kit decision variety to justify human testplay: four support spells receive substantial use, Deflect is used about one response in six, resource objectives alter spending, and identical check odds can produce different responses in different states. The full-roster diagnostic has broad spell variety as well. I am stopping this iteration here as requested; I am not claiming the wider automatic-balancing goal or global optimal play is solved.

- Equal-DC all-spell kits remain overpowered: both the practical and stronger policy won every tested full-roster game. Keep “learn all spells” off for the intended baseline testplay. Forbidden and recovery combinations are the main next balance concern.
- Glamour remains the most common ordinary-kit cast (42.7%). Foresight, Brace and several specialist effects are infrequent; having a declared use does not mean equal practical value. No effect was restored to Ward.
- Shallow search occasionally beats deeper sampled search on paired games. Heuristic leaves, sampled draws and continuation pruning explain why more depth is not an optimality guarantee. The local objective slack also does not bound total full-game win loss.
- Fixed fixtures and 24 independent seed clusters leave wide confidence intervals. The numbers are simulator outcomes, not a human difficulty calibration or campaign-economy validation. All spell adaptations/prices remain experimental rather than canon changes.

Final checks: 17 research tests, 28 legacy tests, 1,605 transition goldens, 102 spell/rank goldens and 12 legacy search goldens pass. Gameplay and settlement were checked at 320×568, including the longest ordinary prose and a complex spell selection; the page fits without vertical page scrolling. The spell tray scrolls internally. Rules remain accessible from gameplay.

The native source, WebAssembly, training proposals, seed manifests, raw tapes, replay assertions, search audits and earlier reports are preserved under `results/`. `research/STATUS.md` records the wrapped state. Main-game files were not edited, staged or committed by this work. The hosted preview has its own private source repository; its publication commit is unrelated to the main game.
