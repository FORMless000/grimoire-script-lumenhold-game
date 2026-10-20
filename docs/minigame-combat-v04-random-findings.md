# Combat v04: random loadout simulation and timing findings

2026-10-16; rules **combat-spells-v2-0.4.4**, sampling seed **20261016**. This study changes no combat rules, kits, AI policy, or browser UI.

## Main result

Of **320 fights**, **196 ended by knockout** and **124 (38.8%) remained unfinished after 80 exchanges**. There were no structural draws and no initiative knockout tiebreaks. Completed fights lasted a median **33 exchanges**, with a 95th percentile of **58**. These lengths exclude unfinished fights.

Stalled play is the main balance concern. **114 of the 124 unfinished fights had no damage hit in their last ten exchanges**. In 116, the last actions repeated a period of one or two exchanges across at least three cycles. This is observed AI behavior, not proof of an unavoidable draw under optimal play.

## Experiment

- **Four Node worker threads**, 300.9 seconds for the main panel, **33,308 AI decisions**.
- Full deterministic alpha-beta: requested depth **3 resolved exchanges**, cumulative **5,000-node budget per decision**, no degradation. No gameplay rolls. Matchup sampling alone is random.
- Nine generic loadouts form a seeded random ring at levels **20, 50, 80**. Each meets two other generic loadouts per level: 27 matchups, 108 fights.
- All **22 named characters** face a random generic. Eleven variable-level fixtures run at all three levels; eleven fixed characters use their actual fixed level, with the generic opponent matched to it: 44 matchups, 176 fights.
- Nine same-loadout **level 60 versus 40** controls: 36 fights. This changes skills, spell ranks, acquisition and Mana capacity together; it is **not** a pure stat-only effect.
- Every matchup is tested in both engine seats and both initial commitment orders. **320 fights represent 80 paired matchups, not 320 independent random samples.** No confidence intervals or population-wide rankings are inferred.
- Defaults: year 1, ordinary Ilse, standard resources, **70 entry Health as HP**, kit spells, no observers, damage multiplier **0.5**, combat scale 3, Mana cost scale 1. Negotiation, depleted-resource play and the skill-offset HP model are not tested here.
- Named peers retain their worldbook skill ratios. Fixed characters' level is the mean of their top two skills, so level matching does not match every relevant stat. Grey uses the documented provisional neutral fixture.

| Panel | Fights | Knockouts | Unfinished |
|---|---:|---:|---:|
| Generic vs generic, equal level | 108 | 50 | 58 (53.7%) |
| Character vs generic, matched level | 176 | 112 | 64 (36.4%) |
| Same loadout, level 60 vs 40 | 36 | 34 | 2 (5.6%) |

Characters won **40**, lost **72**, with **64 unfinished**. Their win fraction is 22.7% of all assigned fights, or 35.7% of decisive fights; the latter excludes over a third of the panel and should not be read as an overall win probability. The level-60 actor won **34/36**, lost none, and stalled twice, both with Duellist. Level advantage is very strong in this sampled fixture.

## Generic results

Each cell is **wins / losses / unfinished**, from eight actor appearances against two opponents. Different opponents are sampled at each level; the rows are not controlled level-growth comparisons.

| Loadout | Level 20 | Level 50 | Level 80 |
|---|---:|---:|---:|
| Duellist | 2/0/6 | 2/2/4 | 0/4/4 |
| Scholar | 0/0/8 | 2/0/6 | 0/8/0 |
| Healer | 0/0/8 | 4/0/4 | 4/0/4 |
| Illusionist | 0/0/8 | 0/2/6 | 8/0/0 |
| Brawler | 0/0/8 | 4/0/4 | 0/4/4 |
| Prefect | 4/4/0 | 2/0/6 | 0/8/0 |
| Showman | 0/0/8 | 0/8/0 | 4/0/4 |
| Underground tough | 4/0/4 | 2/0/6 | 4/0/4 |
| Hollow adept | 0/6/2 | 0/4/4 | 4/0/4 |

Healer and Underground tough had no completed losses in this sample, but 16/24 and 14/24 appearances respectively were unfinished. Illusionist won all eight level-80 appearances, while Scholar and Prefect lost all eight at that level. Those are signals for targeted matchup tests, not established tier placements.

## Character results

Each matchup contributes four paired configurations. Fixed characters have just one sampled generic opponent; variable characters have one at each tested level.

| Character | Matchups | Wins | Losses | Unfinished |
|---|---:|---:|---:|---:|
| Lyra | 3 | 0 | 4 | 8 |
| Tobias | 3 | 8 | 0 | 4 |
| Seraphine | 3 | 0 | 10 | 2 |
| Corvin | 3 | 0 | 8 | 4 |
| Mir | 3 | 12 | 0 | 0 |
| Kael | 3 | 0 | 2 | 10 |
| Nessa | 3 | 0 | 8 | 4 |
| Bram | 3 | 4 | 4 | 4 |
| Ilse | 3 | 2 | 4 | 6 |
| Tamsin | 3 | 0 | 4 | 8 |
| The man in grey (provisional) | 3 | 4 | 4 | 4 |
| Grisk | 1 | 0 | 4 | 0 |
| Thorne | 1 | 2 | 0 | 2 |
| Isolde | 1 | 0 | 4 | 0 |
| Vey | 1 | 0 | 4 | 0 |
| Brask | 1 | 2 | 0 | 2 |
| Marisol | 1 | 4 | 0 | 0 |
| Amaranth | 1 | 2 | 0 | 2 |
| Maud | 1 | 0 | 4 | 0 |
| Pell | 1 | 0 | 0 | 4 |
| Mabel | 1 | 0 | 4 | 0 |
| Grimsby | 1 | 0 | 4 | 0 |

**Mir is the clearest strong signal:** 12/12 wins across three matchups, against Brawler at 20/50 and Hollow adept at 80. Traces include Contraption deployment/replacement, healing and Distil. **Tobias won all eight level-50/80 fights** after Bramble becomes available; all four level-20 fights stalled. Autonomous spell damage appears valuable because it can accompany a defensive or resource action. These observations do not isolate individual spell effects.

Seraphine lost ten and stalled twice; Lyra won none, lost four and stalled eight. Their unique spells are not delivering reliable wins under this bounded policy. Nessa/Corvin and other social loadouts are not necessarily intended to be equally strong duellists. With observers absent, Glamour/Rapport have no combat payoff by design; their non-use is not a defect revealed by this test.

## Strategy narrowing and economy

**Strike + Guard account for 54.4% of all decisions and 72.9% of choices in the final quarter of each fight.** Long censored fights contribute more decisions, so these are action shares, not the fraction of encounters with each strategy.

The pattern changes with level: at level 20, generic actors use Strike/Guard for 78.9% of decisions. At level 80, **Shadowstep + Reclaim account for 48.8%**. Evasion/resource cycling replaces much of the earlier physical attack/defense loop.

| Spell | Selected | Legal decision opportunities | Selected when legal |
|---|---:|---:|---:|
| shadowstep | 2977 | 9920 | 30.0% |
| foresight | 670 | 15484 | 4.3% |
| haste | 4 | 10264 | 0.0% |
| wildfire | 2 | 332 | 0.6% |
| tailwind | 2 | 2632 | 0.1% |
| starlight | 4 | 958 | 0.4% |
| moonwell | 0 | 96 | 0.0% |
| lodestar | 0 | 642 | 0.0% |
| reflect | 0 | 2278 | 0.0% |

These opportunities include many situations where casting would be tactically inappropriate. Low selection is a test target, not proof that a spell is intrinsically weak. In particular, Haste's HP cost was not halved with damage, and its bundled Strikes still meet one free Guard or Ward. Shadowstep offers several protected exchanges at high rank. Channels also commit more actions than an immediate alternative.

**Damage reduction changed the relative sustain economy.** At skill 50, rank-2 Mend heals 21 HP for 9 Mana, while rank-2 Flame deals 14 before defenses for the same 9 Mana. Ward costs 7 and can block the whole Flame. The global damage multiplier reduced attacks but left healing, shields and voluntary HP costs intact.

A controlled level-50 Mir probe confirms **Distil → Mend** against two Guards changes **HP 30→39, ready Mana 20→35, flux 0→6**, without settlement. Both HP and Mana rebuild during a lull, at the price of two exposed actions. This can support construct pressure, rather than forcing the caster to eventually run out. It is not free under active incoming damage or near entry/capacity limits.

Some stalled actors still retain substantial flux. For example, case 0 leaves a one-HP Showman with 5.33 ready Mana and 20 flux, while the Healer has 8 ready Mana and no flux. Reclaim exposes the Showman to a lethal Strike; Guard preserves life without making progress. The conservative loop is not simply everyone reaching zero total Mana. A narrow diagnostic found 36 unfinished states with only basics currently legal on both sides, but **none satisfied its stricter proof condition of no stored flux and no other future damage source**. We have not proved all unfinished positions are mechanically unwinnable.

## Longer continuations and degraded AI

Eight censored positions were selected as the first case in each panel/level-band stratum: case IDs 0, 44, 72, 108, 112, 176, 244, 284. Each was resumed from the identical state for up to **120 additional exchanges**, for a maximum of 200 exchanges overall. These are illustrative continuations of existing fights, not new independent encounters.

| Continuation | Finished out of 8 | Still unfinished | Actually degraded decisions |
|---|---:|---:|---:|
| unchanged | 0 | 8 | 0 |
| deeper | 2 | 6 | 0 |
| fallible | 3 | 5 | 109 |

Unchanged search remains depth 3 / 5,000 nodes. Deeper search uses **depth 4 / 20,000 nodes** on both actors. Fallible search retains depth 3 / 5,000 and the existing **30% mistake-attempt profile**, bounded regret 35 and legal/plausible alternatives, with recorded per-side seeds. It actually selects 109 degraded actions over 1,440 continuation decisions; 30% is an attempt rate, not a guaranteed wrong-move rate.

All eight unchanged continuations still failed to finish. Deeper search resolved Healer–Scholar and Kael–Brawler; fallibility resolved those two plus Underground tough–Healer. **More search and bounded mistakes help some positions, but do not remove the stall problem.** These runs do not establish optimal-play equilibria or the overall effect of degradation on win rate.

## Decision timing

Apple M3, macOS arm64, Node 20.20.1. Sequential wall-clock time around chooseAIAction after warmup, with no simulation worker contention. The campaign verifier/browser and ordinary desktop background work were not shut down. This is not a controlled idle-machine microbenchmark. Timings exclude replay, disk IO, worker startup, message passing and rendering. No phone/browser performance extrapolation is claimed.

Learned-kit timings use **112 recorded states from 28 sampled fights**, covering opening and middle decisions; all-spell stress uses **12 states** at levels 20/50/80, each with all **37 commands** legal (three basics plus 34 casts). Every state is measured three times. Repeats measure timing variability, not extra game samples. This state sample is deliberately structured, not a uniform sample of every turn in the long fights.

All values below are **milliseconds**. An exchange is two AI decisions; a human usually waits for **one NPC decision**.

| Measurement | Timing samples | Median | 95th percentile | Maximum |
|---|---:|---:|---:|---:|
| Learned kit: one decision | 336 | 48.1 | 65.1 | 74.3 |
| Learned kit: commit first | 168 | 53.1 | 66.7 | 74.3 |
| Learned kit: respond | 168 | 23.0 | 61.7 | 71.3 |
| All 34 casts available: one decision | 36 | 165.0 | 201.5 | 243.7 |
| Learned kit: two AI decisions | 168 | 78.0 | 126.7 | 145.4 |
| All spells: two AI decisions | 18 | 315.2 | 416.1 | 416.1 |

Actual panel decisions completed depth 3 in **74.4%** of cases, otherwise depth 2; none fell back at depth zero. In the all-spell timing sample, every search exhausted 5,000 nodes: 25% completed only depth 1, 75% depth 2, none depth 3. The current cap keeps desktop latency modest by limiting search strength; it does not deliver a true three-exchange search across the whole roster.

## Recommended next experiments

1. **Test Guard/progress before nerfing winning constructs.** A small A/B variant where Guard lets a little Strike damage through could test whether fights can conclude without additional spells or new actions. Keep this a separate experiment; it changes the agreed Guard rule and is not implemented here.
2. **Retune sustain relative to the new damage baseline.** Compare Mend/Distil and construct healing with current damage and Mana prices. Do not infer that simply raising all damage or cutting every heal is the right answer from this one panel.
3. **Separate AI weaknesses from spell weaknesses.** Repeat selected Haste/channel/Reflect matchups at stronger search, and test repeat-aware choice among equal-valued root actions. The current mistake filter excludes equal-valued alternatives, so random degradation is not general diversification.
4. **Then expand targeted matchups.** Mir and Tobias need more opponents; Scholar/Prefect at 80 and Seraphine need the same reference opponents before assigning numerical buffs. Social kits may intentionally trade combat power for other uses.

## Reproducibility and validation

Raw evidence: experiments/minigames/results/v04-20261016-random-balance/. It contains the exact cases, frozen hashed engine/AI/runner sources, individual worker case files, combined matches, summary, sequential timings, continuation actions/settings, and economy probe.

- All **33,308 main decisions replayed legally** from frozen sources; **2,352 settled resource ledger rows** reconcile. Unfinished fights have no fabricated outcome or settlement.
- All **4,888 continuation decisions** replayed legally; replayed metrics match the generated continuations.
- A four-case dry run produced identical actions, outcomes and ledgers with one and two workers. Syntax checks passed; **54 combat tests passed**.
- Project grim check passed in an isolated copy. Full npm run verify also passed: **122 campaign tests**, zero balance invariant failures (five existing advisories), **120 unchanged golden games**, English browser playthrough (28 months, 358/358 stored cards, no unresolved entries), and eight event previews. Shared campaign/build files were not changed for this study.

Reproduce from the project root with a fresh directory:

```sh
node experiments/minigames/run-v04-random.mjs --workers 4 --seed 20261016 --out /private/tmp/combat-v04-random-new
node experiments/minigames/analyze-v04-random.mjs /private/tmp/combat-v04-random-new
node experiments/minigames/diagnose-v04-stalls.mjs /private/tmp/combat-v04-random-new
node experiments/minigames/continue-v04-stalls.mjs /private/tmp/combat-v04-random-new
```

For exact old rules after future edits, use the matching scripts in the result directory's sources/ and diagnostic-sources/. Rerunning timings should not reproduce identical milliseconds. The primary outcome panel uses one matchup seed, a sparse opponent sample, one full-search policy, one resource context and one HP model. Its strongest conclusion is observed strategy narrowing and incomplete fights, not a definitive spell tier list.
