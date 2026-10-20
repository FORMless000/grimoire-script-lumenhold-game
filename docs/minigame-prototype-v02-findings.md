# Commitment prototype v02: first measurements

Historical measurements: these runs precede the 0.2.1 Ward rebalance and optional AI degradation. Their frozen sources preserve the original parameters.

Two deterministic scenario sweeps completed on 2026-10-14: **144 policy matches** and **276 balance matches**, with both initial commitment orders. Sources, cases and raw outcomes are preserved in the local ignored result directories below. There is no gameplay randomness, so these percentages describe the tested cases rather than estimated random win probabilities.

A later [combined cross-kit and skill sweep](minigame-prototype-v02-cross-kit-findings.md) adds 1,068 combat and 2,160 negotiation cases across the three presets, with paired skill comparisons and frozen-source replay audits.

| Run | Location |
|---|---|
| Policy comparisons | `experiments/minigames/results/v02-20261014-policy-direct/` |
| Skill, kit and negotiation comparisons | `experiments/minigames/results/v02-20261014-balance-direct/` |
| Additional latency/all-spells planning stress sweep | `/private/tmp/lumenhold-v02-latency-pilot-20261014/` |

Both main runs retain Health-as-HP, standard resources, Mana scale 2, the existing eight-exchange limit and context rebates. The optional skill-offset HP setup has browser/unit coverage, but is not part of these balance claims. Rules and deliberate deterministic translations are in [the v02 rulebook](minigame-prototype-v02.md).

## Balance observations

**Mirror matches remain unresolved by superior strategy.** Alpha–beta versus itself produced 100% partial outcomes across the three presets: 83.3% mutual knockouts, 16.7% timeout partials. The result should not be reported as a 50% win rate or as proof of balance. Identical optimal resource trades often lead to simultaneous defeat. The preserved result mapping calls that partial.

**Search did not outperform the immediate-value greedy policy in the mirrored panel.** Both produced the same 100% partial pattern. Alpha–beta did beat the defensive policy in 91.7% of level-20/50 cases and 83.3% of level-80 cases, but greedy mirroring shows that this roster often still rewards straightforward damage/health trades. Merely adding deeper search has not established greater gameplay depth.

**Skill advantage still determines many outcomes.** At a fixed level-50 kit seed, ranks, capacity and entry balances, shift all six focal skills while retaining the opponent's values:

| Skill advantage | Full win | Partial | Loss |
|---:|---:|---:|---:|
| −10 | 0% | 0% | 100% |
| −5 | 0% | 50% | 50% |
| 0 | 0% | 100% | 0% |
| +5 | 50% | 50% | 0% |
| +10 | 100% | 0% | 0% |

These groups each contain six mirrored archetypes and two initial commitment orders. Deterministic rounded damage and the number of hits to defeat a character create thresholds. The transition now includes more draws than v01's check-roll panel; they are different experiments, not a statistical improvement claim.

**Negotiation is strongly kit-dependent.** In both fixtures, level-50 Illusionist Bluff reached a full result in 83.3% of the tested audience/commitment-order cases; Envoy Bluff reached none. The deterministic Lore-versus-Guile scrutiny threshold explains much of that gap. Reason and Appeal varied with audience preference and fixture. These results argue for reviewing the scrutiny rule before assuming persuasion and deception have comparable value.

**Lasting Mana costs are very low.** In the policy panel the alpha actor's mean net Mana loss was only 0.3–2.1 across groups, even with mean gross expenditure up to 42.7. Reclaim opens tactical liquidity windows, but automatic end-of-game flux collection followed by an 80% duel rebate leaves little campaign cost. Prices/rebate ratios were preserved on purpose; no retuning has been performed.

The two sweeps used Foresight in 22 resolved casts and searched 60 forecast-planning decisions. The policy-only combat mirrors did not cast Foresight. Additional explicit engine/browser fixtures exercise its three-command queue, both-sided planning and affordability independently of whether a baseline policy elects to cast it.

## Search measurements

Search uses a 5,000-node limit over iterative deepening up to three resolved exchanges. Both ordinary commitments and forecast-plan choices use the actual decision owner.

| Measurement | Policy sweep | Balance sweep |
|---|---:|---:|
| Search decisions | 902 | 3,622 |
| Median | 3.9 ms | 3.3 ms |
| 95th percentile | 8.8 ms | 13.3 ms |
| 99th percentile | 10.1 ms | 29.1 ms |
| Maximum | 16.2 ms | 43.1 ms |
| Mean completed depth | 3.00 exchanges | 2.97 exchanges |
| No completed iteration | 0 | 0 |

These are wall-clock observations on the current desktop, not latency guarantees on mobile hardware. Browser searches run in a worker, so they do not block rendering/input. The normal browser playthrough measured a slowest decision of 24.6 ms among the six preset/mode runs.

The separate all-spells stress sweep is more demanding: planning the first of three commands with all twelve spells available took roughly 58–69 ms and hit the node budget before completing one full exchange of search. That decision used the recorded deterministic heuristic fallback. Normal kit planning completed two exchanges in roughly 42–45 ms in that sweep. Improving that extreme planning case is a remaining AI limitation; it is not hidden by the successful normal-panel numbers.

## Verification

Engine checks cover alternating decision ownership, simultaneous lethal hits, the Haste exception, conservation of ready Mana/flux, settlement caps, zero-Mana basics, exact three-exchange forecast duration, immutable/affordable queues, opposing forecasts, fixed casts in both roles, deterministic skill effects and the optional HP offset. Alpha–beta agrees with exhaustive minimax on small ordinary and forecast trees; searching does not mutate the live state. The existing v01 tests still pass through the extended shared harness.

Browser checks completed both games at 20/50/80, tested 114 phone preview/forecast/initial-order/HP-offset/result views at 390×844, 375×667 and 320×568, and observed no page errors. Physical phones are unverified.

The next useful design review is about mutual knockouts, remaining defensive timeouts, scrutiny thresholds, and the lasting Mana economy. These measurements do not justify claiming the new combat is balanced or more enjoyable without human testplay.

The 33 source/frozen-baseline/harness tests and two generated-browser-bundle smoke tests pass. A forced-opponent-Foresight browser fixture verified the player’s three-command planner, immutable actions and compact view; formal hostile casting and carried-balance restart also pass.

`node tools/grim.js check` passed in an isolated project snapshot. `npm run verify` stopped in that snapshot with 98 of 100 campaign tests passing: `friends.test.js` failed on an unavailable left option, and the replay test in `world2b.test.js` failed its complete-game assertion. Those tests import the production campaign engine, not the standalone minigame. The later balance/golden/browser stages of that full verification pipeline were not reached. No production source or golden baseline was changed to address them.
