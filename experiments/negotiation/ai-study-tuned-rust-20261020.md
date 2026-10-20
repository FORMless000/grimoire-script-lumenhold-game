# Negotiation tuned Rust/Wasm study · 20 October 2026

The current AI is **budgeted sampled expectimax, not a proven optimal solver**. This report measures the requested 8-Patience / 6-Suspicion tuning with one-point cards and single-signal checks. Sources are frozen before measurement; the later spell-description and worker-initialization UI fixes do not affect these simulation rules.

## Algorithm

The player maximizes expected utility over Confront, Deflect, withdrawal and every legal spell at the root; later search nodes use a filtered set of useful spells. There is no opponent minimization node: the opponent presents stochastic arguments rather than strategically choosing a response. Consequently this is expectimax, not the combat prototype’s alpha–beta minimax. At each chance node, success/rejection or deflection Suspicion is weighted by its actual probability. Unknown future arguments use three deterministic stratified samples of the public weighted pool; sibling spell alternatives share those samples. Foresight uses the actual revealed next argument. The policy never receives hidden card RNG, check RNG or the unrevealed pending argument.

Iterative deepening attempts one, two and three response turns, retaining the last completed depth. A spell does not consume a response depth, allowing cast-then-respond plans. The cooperative 50 ms budget reserves 3 ms, with 250,000 budget checks and a per-decision transposition cache. If no depth completes, every root action has a fallback score, including the best immediate response after a free cast. The worker only suggests: it never takes a turn.

Terminal utility is 1 for full agreement, 0.1 for partial agreement and 0 for failure, minus small Mana/crown/Health expenses (0.00004/0.00004/0.00008 per unit). The leaf estimates a race between required successful leads and remaining rejection capacity, using one Agreement per accepted card and average Patience/Suspicion costs, current Resolve and current check chance. It blends current-card and pool averages 55:45. **Mood and Alignment loss are not priced in this utility.** Partial agreements and reduced resource spending can therefore trade against the full-win rate.

Optimality is limited by three-card sampling, a three-turn horizon, the heuristic leaf, candidate pruning and time limits. Every legal spell is evaluated at the root, including harmful and irrelevant ones; useful-spell filters still restrict continuations. Scores are expected utility estimates, not calibrated win percentages. A nonterminal race estimate is floored above zero before expense deductions to reduce the previous gratuitous-surrender flaw, but this remains a short-horizon heuristic.

## Study configuration

1536 games: 1440 gap-comparison games and 96 spell-access diagnostics. Each cell has 32 paired seeds. Base seed 20261020; episode seeds use the saved manifest’s unsigned integer formula. The same episode seeds are reused across policies, levels and gaps. Sources, hashes, Node version, configurations, per-move decisions, eligibility counts, action tapes and settlements are frozen in the results directory. All 1536 tapes replayed exactly. Timed AI choices can vary between machines or reruns even when a saved command tape remains exact.

Main matrix: Balanced kit, levels 20/50/80, Mood 70, full Mana, neutral Alignment, and level-matched Renown/relationship/preparation/performance. Opponent level means **check DC**, not a symmetric NPC skill kit. Gap = opponent DC − player level. Pool is the full 45-card calibration pool, with no crown/Health requests, flag gates or underground permission. These are not all-encounter win rates.

Patience is always 8 and Suspicion limit is always 6. Agreement = clamp(round(4+(DC−20)×6/80),4,10). Equal DC 20/50/80 requires 4/6/9 Agreement; DC 100 requires 10. Gap comparisons change both check DC and its Agreement target. Each card checks exactly its named skill/status/resource; Charm is dominant through draw weight, not a hidden contribution to other checks. Scene identity uses source/key tags and weights rather than scene DC offsets.

## Full-agreement win rate versus DC gap

| Player level | DC gap -15 | DC gap -10 | DC gap 0 | DC gap +10 | DC gap +20 |
| --- | --- | --- | --- | --- | --- |
| 20 | 29/32 (90.6%) | 25/32 (78.1%) | 16/32 (50.0%) | 8/32 (25.0%) | 0/32 (0.0%) |
| 50 | 30/32 (93.8%) | 23/32 (71.9%) | 12/32 (37.5%) | 5/32 (15.6%) | 0/32 (0.0%) |
| 80 | 27/32 (84.4%) | 21/32 (65.6%) | 7/32 (21.9%) | 0/32 (0.0%) | 0/32 (0.0%) |

Partial agreements are excluded from wins. Per-cell uncertainty is substantial: with 32 seeds a rate near 50% has a 95% Wilson interval of approximately 34–66%. The CSV gives each cell’s exact interval. Do not treat a one- or two-game difference as reliable. The same seeds are repeated across cells, so pooled totals are descriptive rather than independent trials.

## Policy comparisons

| Player/DC | Always Confront | Shallow (1 response) | Search (up to 3) | Search partials |
| --- | --- | --- | --- | --- |
| 20/20 | 16/32 (50.0%) | 17/32 (53.1%) | 16/32 (50.0%) | 3/32 |
| 50/50 | 10/32 (31.3%) | 11/32 (34.4%) | 12/32 (37.5%) | 1/32 |
| 80/80 | 1/32 (3.1%) | 5/32 (15.6%) | 7/32 (21.9%) | 4/32 |

Across the complete gap grid:

| Policy | Full wins | Partials | Mean meeting turns |
| --- | --- | --- | --- |
| face | 168/480 (35.0%) | 0/480 | 6.2 |
| shallow | 192/480 (40.0%) | 27/480 | 7.7 |
| search | 203/480 (42.3%) | 33/480 | 7.8 |

Paired full-win changes for Search versus Always Confront (same level, gap and episode):

| DC gap | Search-only win | Confront-only win | Both win | Neither full win |
| --- | --- | --- | --- | --- |
| -15 | 12 | 4 | 74 | 6 |
| -10 | 15 | 7 | 54 | 20 |
| 0 | 14 | 6 | 21 | 55 |
| 10 | 11 | 0 | 2 | 83 |
| 20 | 0 | 0 | 0 | 96 |

## Action variety

Non-spell response shares exclude casts, which use an additional slot in the same turn. Meeting turns include a final spell-only exit when applicable.

| DC gap | Confront | Deflect | Withdraw | Casts / meeting | Meetings with any cast |
| --- | --- | --- | --- | --- | --- |
| -15 | 83.0% | 17.0% | 0.0% | 0.38 | 34.4% |
| -10 | 82.5% | 17.5% | 0.0% | 0.42 | 35.4% |
| 0 | 80.2% | 19.8% | 0.0% | 0.45 | 37.5% |
| 10 | 78.1% | 21.9% | 0.0% | 0.35 | 25.0% |
| 20 | 66.8% | 33.2% | 0.0% | 0.29 | 26.0% |

Most frequently deflected lead types (at least 20 observations; all gaps combined):

| Card ID | Confront | Deflect | Deflection share |
| --- | --- | --- | --- |
| bold_pitch | 19 | 196 | 91.2% |
| job_work | 11 | 50 | 82.0% |
| job_intern_conclave | 8 | 22 | 73.3% |
| job_apothecary_clerk | 27 | 51 | 65.4% |
| job_intern_alchemists | 14 | 23 | 62.2% |
| club_cartographers | 8 | 12 | 60.0% |
| club_duelling | 29 | 33 | 53.2% |
| job_intern_thornwick | 45 | 51 | 53.1% |

## Spell usage

Casts per 100 meetings can exceed 100 when a spell is repeated. Meeting-use rates count at least one cast. Affordable slot turns count pre-response states where the spell was legal and its slot unspent; continuation-filter slots count states matching the useful-spell filter; every legal spell is still evaluated at the root.

Ordinary Balanced kit, all gaps combined:

| Spell | Casts | Casts / 100 meetings | Meetings using it | Continuation-filter slots | Cast / affordable slot turns |
| --- | --- | --- | --- | --- | --- |
| glamour | 75 | 15.6 | 15.6% | 1795 | 2.0% |
| haste | 55 | 11.5 | 11.3% | 2672 | 1.5% |
| foresight | 47 | 9.8 | 9.6% | 3421 | 1.3% |
| shadowstep | 4 | 0.8 | 0.8% | 1038 | 0.1% |
| flame | 0 | 0.0 | 0.0% | 0 | 0.0% |
| mend | 0 | 0.0 | 0.0% | 0 | 0.0% |
| ward | 0 | 0.0 | 0.0% | 0 | 0.0% |

Equal-level Balanced games only:

| Spell | Casts | Casts / 100 meetings | Meetings using it | Continuation-filter slots | Cast / affordable slot turns |
| --- | --- | --- | --- | --- | --- |
| glamour | 17 | 17.7 | 17.7% | 460 | 2.1% |
| haste | 16 | 16.7 | 16.7% | 585 | 2.0% |
| foresight | 10 | 10.4 | 10.4% | 734 | 1.2% |
| flame | 0 | 0.0 | 0.0% | 0 | 0.0% |
| mend | 0 | 0.0 | 0.0% | 0 | 0.0% |
| shadowstep | 0 | 0.0 | 0.0% | 258 | 0.0% |
| ward | 0 | 0.0 | 0.0% | 0 | 0.0% |

The ordinary kit knows Flame, Mend, Ward, Foresight, Haste, Shadowstep and Glamour. It does not know Candour, Quickquill, Index, Rapport, Reflect or Starlight. All root spells receive evaluations. In continuations Flame/Mend/Ward are omitted; Haste is considered when Resolve ≥4 and Patience ≤6. Foresight is filtered when already active; Glamour is limited to Charm/Guile checks below 94%; Shadowstep is considered only after half the Agreement target. Those restrictions affect these frequencies.

## Additional spell-access diagnostics

These use only player level 50 against DC 50. “All spells” changes access, including forbidden spells, while retaining Balanced skills; underground permission remains off. Showman and Hollow adept change both skills and spell access, so they cannot isolate a spell’s causal value. All have the same 32 paired seeds.

| Kit | Full wins | Partials | Mean casts / meeting |
| --- | --- | --- | --- |
| all-spells | 29/32 (90.6%) | 1/32 | 6.19 |
| Showman | 16/32 (50.0%) | 1/32 | 0.94 |
| Hollow adept | 10/32 (31.3%) | 3/32 | 0.78 |

### all-spells

| Spell | Casts | Casts / 100 meetings | Meetings using it | Continuation-filter slots | Cast / affordable slot turns |
| --- | --- | --- | --- | --- | --- |
| candour | 96 | 300.0 | 100.0% | 202 | 47.5% |
| quickquill | 82 | 256.3 | 100.0% | 203 | 40.4% |
| starlight | 8 | 25.0 | 25.0% | 187 | 4.2% |
| glamour | 6 | 18.8 | 18.8% | 111 | 3.0% |
| reflect | 4 | 12.5 | 12.5% | 200 | 2.0% |
| haste | 1 | 3.1 | 3.1% | 93 | 0.5% |
| sleight | 1 | 3.1 | 3.1% | 0 | 0.5% |
| flame | 0 | 0.0 | 0.0% | 0 | 0.0% |
| foresight | 0 | 0.0 | 0.0% | 201 | 0.0% |
| mend | 0 | 0.0 | 0.0% | 0 | 0.0% |
| shadowstep | 0 | 0.0 | 0.0% | 72 | 0.0% |
| ward | 0 | 0.0 | 0.0% | 0 | 0.0% |
| animate | 0 | 0.0 | 0.0% | 0 | 0.0% |
| seal | 0 | 0.0 | 0.0% | 0 | 0.0% |
| wildfire | 0 | 0.0 | 0.0% | 0 | 0.0% |
| heartwood | 0 | 0.0 | 0.0% | 0 | 0.0% |
| omen | 0 | 0.0 | 0.0% | 0 | 0.0% |
| contraption | 0 | 0.0 | 0.0% | 0 | 0.0% |
| hoarfrost | 0 | 0.0 | 0.0% | 0 | 0.0% |
| brace | 0 | 0.0 | 0.0% | 0 | 0.0% |
| bramble | 0 | 0.0 | 0.0% | 0 | 0.0% |
| index | 0 | 0.0 | 0.0% | 0 | 0.0% |
| rapport | 0 | 0.0 | 0.0% | 203 | 0.0% |
| purify | 0 | 0.0 | 0.0% | 0 | 0.0% |
| tailwind | 0 | 0.0 | 0.0% | 0 | 0.0% |
| rime | 0 | 0.0 | 0.0% | 0 | 0.0% |
| moonwell | 0 | 0.0 | 0.0% | 0 | 0.0% |
| lodestar | 0 | 0.0 | 0.0% | 0 | 0.0% |
| torment | 0 | 0.0 | 0.0% | 0 | 0.0% |
| extraction | 0 | 0.0 | 0.0% | 0 | 0.0% |
| siphon | 0 | 0.0 | 0.0% | 0 | 0.0% |
| compel | 0 | 0.0 | 0.0% | 0 | 0.0% |
| eclipse | 0 | 0.0 | 0.0% | 0 | 0.0% |
| heartprice | 0 | 0.0 | 0.0% | 0 | 0.0% |

### Showman

| Spell | Casts | Casts / 100 meetings | Meetings using it | Continuation-filter slots | Cast / affordable slot turns |
| --- | --- | --- | --- | --- | --- |
| reflect | 10 | 31.3 | 31.3% | 279 | 3.6% |
| glamour | 8 | 25.0 | 25.0% | 139 | 2.8% |
| haste | 7 | 21.9 | 18.8% | 206 | 2.5% |
| rapport | 3 | 9.4 | 9.4% | 281 | 1.1% |
| foresight | 2 | 6.3 | 6.3% | 263 | 0.7% |
| ward | 0 | 0.0 | 0.0% | 0 | 0.0% |
| flame | 0 | 0.0 | 0.0% | 0 | 0.0% |
| mend | 0 | 0.0 | 0.0% | 0 | 0.0% |
| shadowstep | 0 | 0.0 | 0.0% | 112 | 0.0% |
| tailwind | 0 | 0.0 | 0.0% | 0 | 0.0% |
| brace | 0 | 0.0 | 0.0% | 0 | 0.0% |

### Hollow adept

| Spell | Casts | Casts / 100 meetings | Meetings using it | Continuation-filter slots | Cast / affordable slot turns |
| --- | --- | --- | --- | --- | --- |
| index | 23 | 71.9 | 53.1% | 252 | 8.9% |
| haste | 1 | 3.1 | 3.1% | 196 | 0.4% |
| glamour | 1 | 3.1 | 3.1% | 146 | 0.4% |
| ward | 0 | 0.0 | 0.0% | 0 | 0.0% |
| flame | 0 | 0.0 | 0.0% | 0 | 0.0% |
| foresight | 0 | 0.0 | 0.0% | 237 | 0.0% |
| shadowstep | 0 | 0.0 | 0.0% | 80 | 0.0% |
| mend | 0 | 0.0 | 0.0% | 0 | 0.0% |
| seal | 0 | 0.0 | 0.0% | 0 | 0.0% |
| rime | 0 | 0.0 | 0.0% | 0 | 0.0% |
| siphon | 0 | 0.0 | 0.0% | 0 | 0.0% |

Index requires Lore more than two points above the current signal; Rapport requires positive Resolve; Quickquill is considered for ordinary checks or after Candour; Reflect requires check chance >20%; Starlight is considered below entry Patience+2; Compel requires underground permission; Sleight requires an unaffordable crown request. No crown requests occur here, and forbidden coercion is not permitted. Most other spells have no negotiation benefit or end the meeting and are pruned only in continuations. This diagnostic therefore tests the implemented useful subset, not every conceivable spell adaptation. Quickquill’s Candour pairing loses Alignment, but Alignment is unpriced by the evaluator; its apparent value is specific to that objective.

## Evaluation limits

The score prioritizes full wins (1) over partial agreements (0.1), then subtracts small Mana/Gold/Health costs. Mood and Alignment are unpriced. The leaf is heuristic and its resource costs are based on the current state; future rebates are not modeled until terminal settlement. Partial banking can therefore beat a risky full-win attempt, and the score must not be labelled a win probability. All root actions have values at the same last-completed depth. Candidate pruning applies only below the root.

## Search work and latency

3931 search decisions in the main grid. Mean 33.0 ms, median 47.0 ms, p95 47.0 ms, maximum 86.9 ms; 20 decisions exceeded 50 ms. The deadline is cooperative, so allocation/garbage collection can overrun it. The UI uses a worker.

| Last completed response depth | Decisions | Share |
| --- | --- | --- |
| 1 | 3 | 0.1% |
| 2 | 2296 | 58.4% |
| 3 | 1632 | 41.5% |

## Interpretation

Same-level full wins range from 21.9% to 50.0% across tested player levels. +10 DC full wins range from 0.0% to 25.0% across tested player levels. +20 DC full wins range from 0.0% to 0.0% across tested player levels. Search has 203/480 full wins, versus shallow 192/480 and always-confront 168/480. These descriptive differences are not a proven policy advantage, given paired repeated seeds, small cells, partial utility and the heuristic evaluation objective.

Ordinary-kit spell variety: 4 spells used, with Glamour accounting for 41.4% of casts. With unrestricted spell access, Candour/Quickquill/Rapport account for 89.9% of casts; that diagnostic wins 29/32 (90.6%) at level 50/DC 50. This describes concentration within the implemented kits, not each spell’s independent causal contribution.

This is evidence about the implemented search policy, not optimal play. Mood/Alignment pricing, partial-agreement value and continuation filters remain design decisions. The tight six-point Suspicion budget makes suspicion-clearing spell access particularly important; compare ordinary and expanded-access diagnostics before interpreting spell variety.


## Reproduce and inspect

```sh
node experiments/negotiation/study.mjs --episodes 32 --seed 20261020 --out /private/tmp/negotiation-ai-study-new
node experiments/negotiation/analyze-study.mjs /private/tmp/negotiation-ai-study-new /private/tmp/negotiation-ai-study-new.md
```

The runner refuses existing output directories; the analyzer refuses an existing report. Saved traces reproduce actual outcomes; repeat timed searches need not select identical moves. Only the standalone simulator was changed; no main-game commits were made.

## Port verification and fixed-work speed

Short goldens passed 1,605 transition cases, 102 spell/rank cases and 12 root-action search comparisons against the independent JavaScript oracle. The simulator unit suite passed 28 tests, Rust passed two, and scene coverage passed 141 configurations with replay and rebate checks.

Nine warmed, matched depth-two searches had identical selected actions and values: JavaScript 984.47 ms total, Wasm 81.52 ms including its JSON boundary, or 12.08× faster on this machine. This is fixed work, not a claim about cold startup or serialized one-step transitions. A timed analysis may still spend its full 50 ms budget exploring more nodes. Raw timings and search options are in `performance.json`.

## Balance reading

The ordinary search policy confronts 2,945 times and deflects 805 times (78.5% / 21.5%), never using ordinary withdrawal in the measured main grid. It casts in 152/480 meetings (31.7%): Glamour 75, Haste 55, Foresight 47, Shadowstep 4. Three support spells now see substantial use, but dangerous leads remain frequently skipped: The Whole Case is deflected 91.2% of the time. Equal one-point payouts removed its former high-reward reason to take that risk.

With the requested fixed limits, higher same-level targets make late play much harsher: full wins fall from 50.0% at 20 to 21.9% at 80. The all-spells diagnostic reaches 90.6% at 50, with Candour and Quickquill supplying 178/198 casts (89.9%). It still has a dominant two-spell engine, and Alignment’s cost is unpriced. These results do not support a claim that variety or cross-kit balance is solved. No further balance changes were made after this measurement.

## Repository verification boundary

`node tools/grim.js check` completed successfully (0 lint errors, seven existing content warnings, 200 campaign simulations). The broader `npm run verify` reached the repository tests but failed on sandbox-denied local server bindings (`listen EPERM` in portrait/server tests); it is not reported as passing. No campaign code was changed to address these unrelated checks. The standalone tests, goldens, full study replays, scene coverage and browser checks above passed independently.
