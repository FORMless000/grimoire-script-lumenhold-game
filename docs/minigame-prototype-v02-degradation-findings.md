# Prototype 0.2.1: Ward and AI degradation

Implemented and measured on 2026-10-14. This changes the standalone prototype, leaving the campaign engine/content unchanged. The existing local preview needs a reload to use the new code. Under **Adjust the experiment**, select Full, Shallow, Fallible or Shallow + fallible AI, and its seed. Debug/export records expose accepted errors, original best actions, regret and search depth.

## Changes

At the default Mana multiplier 2 and combat multiplier 3:

| Ward rank | Mana before → after | Protection before → after |
|---|---:|---:|
| I | 28 → 20 | 24 → 30 |
| II | 20 → 16 | 27 → 36 |
| III | 18 → 12 | 30 → 42 |

Ward retains its one-attack consumption/expiry and negotiation fixture effect. The roster, basic actions, deterministic spell outcomes, 80% flux recovery, HP model, encounter duration and rebates are otherwise unchanged.

AI degradation has independent per-actor controls:

- **Depth:** Full searches up to three resolved exchanges; Shallow searches one. Both retain the 5,000-node ceiling.
- **Fallibility:** the default 30% chance attempts to select a strictly weaker move, within 35 utility points of the best completed-search value. An extra search obtains exact full-window root scores at the same completed depth; incomplete ranking declines the error. Explicit filters exclude visible immediate defeats, hostile formal casts, paid exits, empty Reclaim and several context-inapplicable casts. Locked forecasts cannot be rerolled.

The bound concerns this evaluator and horizon; it cannot guarantee harmlessness several turns later. Search still assumes ideal adversarial replies, rather than modelling a distribution of future opponent mistakes. AI-choice randomness is seeded separately from kit generation, and previews do not consume random draws.

## Experiment

**6,960 matches** across 672 controlled scenarios. Combat covers all ordered kit pairs at levels 20/50/80 and both commitment orders, plus mirrored ±5 skill adjustments at level 50. Negotiation covers Envoy/Illusionist persuaders, all six audience kits, both fixtures, three approaches and all three levels/orders.

Full/full and Full/shallow are deterministic controls. Full/fallible and Fallible/fallible use four policy seed streams, paired across conditions and commitment orders. The combined-degradation panel is smaller: mirrored combat, plus matched-kit midgame negotiation. Skill adjustments preserve level seeds, ranks, mana capacity and initial resources. All encounters use the existing standard resources and direct Health-as-HP model.

Sources, hashes, exact seeds/cases, raw actions, skipped/accepted errors, per-seed rates and ledgers are saved in [the run directory](../experiments/minigames/results/v02-20261014-ward-degradation/). Read the [complete tables](../experiments/minigames/results/v02-20261014-ward-degradation/INTERPRETATION.md) for partial outcomes and seed ranges. These are finite scenario/AI-seed fractions, not independent human trials or universal win probabilities.

## Does the AI get weaker?

Full-strength focal AI's **full-win fraction** against each opponent, with zero imposed skill adjustment:

| Combat preset | Full opponent | Depth-1 opponent | Fallible opponent |
|---|---:|---:|---:|
| 20 | 13.9% | 13.9% | 16.7% |
| 50 | 15.3% | 16.7% | 20.1% |
| 80 | 30.6% | 30.6% | 30.2% |

Each deterministic cell has 72 cases; each fallible cell has 288. Partial and loss fractions are separate in the detailed report. Fallibility gives modest advantages at 20/50, but is not a reliably easier opponent at 80 in this panel. Its level-80 per-seed full-win range is 29.2–30.6%; the pooled difference is small.

Depth matters more near some thresholds. At level 50 with +5 focal skills in mirrored kits, full/full yields 33.3% full wins, versus 58.3% against depth 1 and 47.9% against fallible AI. With −5 skills, none of these focal full-AI conditions produces a full win. Thus equal-skill aggregate similarity does not establish that search depth is irrelevant everywhere.

Negotiation full-success fractions:

| Preset | Full audience | Depth-1 audience | Fallible audience |
|---|---:|---:|---:|
| 20 | 38.9% | 38.9% | 42.0% |
| 50 | 38.9% | 41.7% | 41.7% |
| 80 | 39.6% | 43.8% | 42.4% |

Those deterministic cells have 144 cases; fallible cells have 576. The combined shallow/fallible audience reaches 62.5% focal success in its smaller midgame matched-kit panel; it must not be compared directly with the all-audience 38.9% baseline. Its matched full/full controls have 40/32/24 full/partial/loss counts out of 96, i.e. 41.7% full success.

A 30% attempt setting produces accepted weaker moves on **13.2–15.3%** of fallible opponent combat decisions and **7.1–8.4%** of negotiation decisions. Most declines have no plausible bounded weaker move; some cannot finish exact ranking within budget. Accepted regrets remain below 35. More fallible actors are not guaranteed to change terminal labels monotonically, because the cutoff evaluator is approximate and encounters can end partially.

## Does stronger Ward fix the dominant kits?

Only modestly. In the full/full zero-adjustment combat controls, total Ward casts rise from **152 to 174**. Midgame Warden goes from two losses out of twelve to twelve partial outcomes, while Restorer loses one full win and gains one loss. Evoker's aggregate full-win fractions remain **16.7% / 58.3% / 83.3%** at levels 20/50/80. Evoker also has access to Ward, so this is not solely a buff to its opponents.

Level-80 timeouts rise from **52.8% to 58.3%** under full/full play. Against a fallible opponent they reach **64.2%**, and with both sides fallible **69.4%**. Full/full controls have no both-lose endings, but **84 randomized combat cases** do: 32 full/fallible, 48 fallible/fallible and four combined-degradation cases. These are retained failure labels, not partial successes. Ward is used more, but has not removed Evoker's late-game advantage or the tendency toward defensive timeouts. Negotiation's full/full outcomes are unchanged by the Ward adjustment.

## Action preferences and strategy compression

The main routines persist: Evoker repeatedly uses Flame; physical kits repeatedly Strike; Restorer/Envoy mix Strike with Restoration; Warden uses Strike/Ward. Full/full combat still never casts **Tide, Foresight or Haste** in the zero-adjustment panel. At level 80, the opponent uses only **1.01 distinct spells per encounter on average**.

Noise changes what happens. Against a fallible opponent, the full focal AI's Strike-only trajectories fall from **62.5% to 37.2%** at level 20, **44.4% to 27.8%** at 50, and **13.9% to 8.3%** at 80. It responds with more defence/healing, paying slightly more Mana while preserving more Health. The fallible level-80 opponent uses 1.57 distinct spells per encounter on average, including five Tide, one Foresight and one Haste cast across 288 games.

That is greater action variety, not proof of additional viable strategic plans. The full focal AI itself uses Tide only once and no combat Foresight/Haste against those fallible opponents. Much of the revived spell use is deliberately suboptimal selection, while timeouts increase. Noise makes play less predictable and creates some openings; it does not supply a new tactical objective or repair weak spell roles.

**Assessment:** the prototype remains compressed into a few effective routines. Depth-1 AI staying close to depth 3 in most equal-skill cases reinforces that diagnosis, while the skill-gap exceptions show that there is still some tactical value to looking ahead. The Ward buff improves a defensive tool without solving roster dominance. AI degradation is a usable difficulty/variation control, with gentle and non-monotonic effects at this safety bound; it is not a substitute for addressing the underlying strategic bottlenecks.

## Validation and limits

- All **41** v01/v02/shared-harness/degradation tests pass, including exact root-score checks against exhaustive minimax for both decision owners, reproducible policy seeds, zero-error equivalence, bounded errors, forecast locks and new Ward prices/protection.
- All **6,960 matches / 98,129 decisions** reconstruct legally from frozen sources. All **6,190 accepted errors** pass recorded regret/depth/safety conditions. All **69,600 resource ledger rows** obey accounting and entry caps.
- **24 selected matches** replay with identical actions, outcomes, ledgers and search statistics, excluding wall-clock duration.
- Browser checks pass for eight mode/profile playthroughs and three Ward-rank previews, including worker options, exported seeds/depths, no page errors and compact 375×667 / 320×568 layouts. Physical-device performance is unverified.
- `node tools/grim.js check` and the complete `npm run verify` pass in an isolated project copy. Verification includes 100 campaign tests, 120 golden games and browser checks. Its campaign balance step reports four advisories and zero invariant failures; these are separate from the prototype results. Initial sandbox restrictions on Chromium/localhost were resolved through permitted local reruns.

Full/fallible 95th-percentile decision times are roughly 16–43 ms in combat and 28–31 ms in negotiation on this desktop. One negotiation planning decision reaches 296 ms. A worker keeps rendering separate; no mobile timing guarantee or solved-game claim is made. Four policy streams and three level seeds are limited coverage, and the optional HP-offset/depleted-resource/all-spells stress cases are outside this benchmark.

Ten of the 98,129 decisions, all late-game negotiation forecast planning, exhaust the main budget before completing depth 1 and use the recorded legal heuristic fallback. None accepts a random degradation on that incomplete result. This rare planning limitation remains visible rather than being counted as a completed alpha-beta search.

Reproduction commands and API controls are in [the simulation README](../experiments/minigames/README.md). Existing earlier raw results remain unchanged.
