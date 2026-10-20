# Combat economy 0.4.6: balance and pacing

This is the implemented standalone combat iteration, not the campaign or separate negotiation game. The live prototype is rebuilt at http://127.0.0.1:61040/. Prices and effect parameters are in `experiments/minigames/iterations/v04/economy.mjs`; the complete current rules are in that iteration's `rulebook.md`.

## Calibration and implemented changes

At skill 50, one actor action is budgeted at 9 HP. Six permanently burned Mana are budgeted at 9 HP; spending 18 ready Mana generates 12 recoverable flux and therefore burns six if fully recovered. Reclaim consumes another action. With three casts per Reclaim, the reference spell budget is `9 + 3 + 0.5 × upfront Mana`: 18 HP for a 12-Mana cast. This is a design calibration; defenses, terminal recovery, capacity loss, Seal and timing change its realized value.

- Strike: 9 at reference skill. Guard now stops two thirds of physical damage and one third of spell damage. This is an intentional rules adjustment: free perfect physical defense contributed to the old exhaustion loops. A guarded reference Strike still deals 3.
- Flame: 12 Mana at every rank, for 16/18/20 reference damage. Mend: the same price, healing 80% of the corresponding rounded damage budget, rounded down: 12/14/16 at reference skill. Higher ranks improve output without simultaneously cutting price.
- Haste: three basics next exchange, no HP price, 12/10/8 Mana. Shadowstep: 18/18/16 Mana for 1/2/2 exchanges, retaining the same-exchange exposure on meaningful Reclaim. Ward costs 9. Foresight keeps 3/4/5 forced early commitments; its +10 relevant-skill preparation is bounded to the next direct damaging action by next exchange and cannot permanently boost a construct.
- Constructs retain their damage thresholds and untargetable fixed actions, but now expire after 3–4 exchanges including the cast. This limits indefinite autonomous healing/damage. Contraption bursts on replacement, threshold destruction or lifetime expiry.
- Final construct tuning uses Animate 6 damage/1 reduction/40 threshold/4 exchanges; Heartwood 4 healing/2 reduction/40 threshold/4 exchanges; Bramble 5 damage/0 reduction/32 threshold/4 exchanges; Contraption 8 damage/0 reduction/32 threshold/3 exchanges, then its existing 4-to-both burst. Channel spells are priced for their setup/release turns. Lodestar's released absorb persists across hits. Distil trades 9 reference HP for 12 ready Mana. Heartprice charges ceil(0.8 × nominal Mana) HP per payment, so equal-skill Mend cannot heal through a free incoming Strike.
- Reflect covers the next damaging spell action, returns half incoming power and cannot bounce twice. Seal erases a bounded amount of flux. Extraction transfers at most seven reference Mana. Eclipse pays 75% of actual external damage, bounded per exchange. Glamour and Rapport have per-fight award/spend caps. Renown/Crowns and illegal casting remain distinct consequences, not invented universal HP prices.

Every spell remains castable whenever learned and affordable, including spells without a combat use. No extra basic actions, casting menus, gameplay randomness or combat time limit were introduced.

## Higher levels last longer

Amounts use `S = 0.75 + skill / 200`. Damage rounds up; Mana gains round down. Counts and Mana prices do not scale. Default HP is **entry Health + 10 + 2 × encounter level**. Encounter level represents expected relevant skill; using it avoids additionally penalizing specialist characters for unrelated low skills. The direct-Health setup remains an explicit diagnostic option. At equal skills/level:

| Level | Standard entry HP | Strike | Flame at normal rank | Mend at normal rank | Flame/Mend MP |
|---|---:|---:|---:|---:|---:|
| 20 | 120 | 8 | 14 | 11 | 12 |
| 50 | 180 | 9 | 18 | 14 | 12 |
| 80 | 240 | 11 | 23 | 18 | 12 |

The HP reserve grows faster than damage. Low current Health reduces the final bar but does not remove the skill reserve. Existing resource-ledger conventions and context rebates remain; with the larger reserve, Health can reach zero before combat HP does. Persistent campaign injury tuning is a separate integration question.

## Reproducible simulation protocol

Main panel: seed 20261016, four Node workers, full alpha-beta depth 3 / 5,000 main nodes. Nine generic loadouts meet two seeded different opponents per level at 20/50/80 (108 fights). Twenty-two character fixtures meet generic opponents at matched encounter levels (176 fights). Each generic also fights its own level-60 versus level-40 version (36 fights). Both seats and both first-commitment orders are included: these are four paired observations, not independent samples. Standard resources, year 1, ordinary Ilse, no observers, learned kit, damage multiplier 1. The simulation work cap is 240 decisions / 120 exchanges; unfinished cases are censored, never fabricated draws.

Additional panels use fixed rank-II Flame + Ward at each skill level, equal-vector mirrored generic kits, isolated skill gaps with encounter level/rank held constant, and seeded fallible AI. Fallibility attempts a bounded suboptimal choice on 30% of decisions, but exact-ranking budgets, useful-action filters and regret bounds can prevent an actual mistake. This probability is not an observed 30% error rate.

Frozen sources, cases, source hashes, action traces and resource ledgers are retained in result directories. The analyzer legally replays every action and reconciles settlement ledgers. Decision latency is measured separately after workers finish, with warmed sequential calls; worker-contended simulation timings are not used as user-facing latency claims.

The historical 0.4.4 panel had 124/320 unfinished fights at an 80-exchange cap. Its direct HP, prices, AI evaluation and rules differ, so the new run is not a single-variable causal comparison. A completed diagnostic arm using mean-six-skill HP exposed a specialist-character penalty; that arm and interrupted preliminary runs are preserved with status notes. The final panel uses encounter-level HP.


## Results

**680 evaluation fights, 38,152 decisions, all completed by knockout.** These span the broad first economy pass and targeted final tuning; they are not 680 independent samples of one immutable ruleset.

| Arm | Version | Fights | Unfinished |
|---|---|---:|---:|
| General/character/60-vs-40 main panel | 0.4.5, encounter-level HP | 320 | 0 |
| General/60-vs-40 fallible control | 0.4.5 | 144 | 0 |
| Fixed-core pacing, equal-skill mirrors, isolated gaps | 0.4.5 | 78 | 0 |
| Matched construct follow-up | **0.4.6 final** | 42 | 0 |
| Same focused configurations with fallible AI | **0.4.6 final** | 42 | 0 |
| Equal-skill mirrored general loadouts | **0.4.6 final** | 54 | 0 |

The final tuning retains all core prices, skill scaling and HP from 0.4.5. It raises construct output/damage thresholds, values their actual bounded remaining lifetimes in AI evaluation, and adds the missing Tailwind residual value. Fallible-action filtering also respects the new per-fight reward caps and recognizes an immediate Lodestar release as useful. These changes were tested together, so their individual effects cannot be separated from this panel.

### Fight length

| Level | General cross-kit median, first pass (36 each) | Fallible cross-kit median, first pass (36 each) | Final equal-skill mirror median (18 each) |
|---|---:|---:|---:|
| 20 | 20 | 25 | **21** |
| 50 | 29 | 31 | **30** |
| 80 | 32 | 38 | **34** |

The broad full-AI main panel also finished every fight within 46 exchanges, so its zero unfinished count would remain zero at the historical 80-exchange cap. Some first-pass fallible fights ran longer (maximum 94).

The final mirror means are 21.3 / 29.8 / 34.2 exchanges. These are one actor action each per exchange, not individual decision counts. Not every particular matchup is guaranteed to grow monotonically.

In the fixed rank-II Flame + Ward control, both initial orders gave **24 / 30 / 32 exchanges** with the reserve at skills 20/50/80. With HP fixed at 70 instead, they gave **16 / 19 / 10**. This supports the intended reserve effect independently of learning more spells or increasing course rank. Only two paired configurations exist per cell; AI policy and rounding can produce non-monotonic details.

### Action preferences and remaining balance problems

The 320-case first pass reduced plain Strike + Guard from the historical panel's 54.5% of decisions to **35.1%**; in the final quarter of fights they still account for **63.0%**, compared with 72.9% historically. This is descriptive across different rules/HP/work caps, not a controlled effect estimate. Flame and Strike remain the core attack choices; Reclaim and Ward are common, while Haste, Mend, Shadowstep, Foresight, Brace and Siphon are selected situationally.

The first pass over-nerfed constructs. In 42 exactly matched follow-up configurations, their cast counts changed:

| Spell | First-pass counts | Final-tuning counts |
|---|---:|---:|
| Animate | 0 | **6** |
| Heartwood | 0 | **12** |
| Bramble | 0 | **13** |
| Contraption | 0 | **36** |

All 42 final full-AI fights finished within 46 exchanges. This restores actual use without recreating the old immortal-construct pattern in the observed panel. It does not establish equal spell strength. Tailwind remains unselected by full AI in that focused panel despite receiving a residual value; it is chosen in degraded play. Starlight and Wildfire also remain uncommon. Their availability, setup risk and short search horizon need targeted human tests or a later policy/depth ablation before another blind numerical buff.

The broad first-pass general-loadout totals (24 actor appearances each, only two opponents per level) were: Duellist 16–8, Scholar 4–20, Healer 2–22, Illusionist 6–18, Brawler 12–12, Prefect 12–12, Showman 18–6, Underground tough 16–8, Hollow adept 22–2. Forbidden spell alignment/observer consequences were not included in the combat utility, and observers were disabled. Those combat-only results do not price away forbidden spells' external costs.

Named characters won **24/176** in the broad pass. Their canon skill ratios often leave Strike skill, Flame skill or Mana capacity below broadly trained generic opponents at the same nominal relevant-skill level. Removing the accidental HP penalty improved this from 4/176 in the diagnostic mean-skill arm, but did not solve encounter-strength calibration. In the final matched follow-up, Mir, Tobias and Bram each remained 0–8 under full AI, despite renewed construct use. With the same final configurations and fallible AI, those three characters collectively won 7/24. This shows policy matters; it does not turn the result into a general character win-rate estimate. Canon skill vectors were preserved.

### Skill differences and fallibility

Level 60 beat level 40 in **36/36** same-loadout configurations under full AI and **36/36** under the first-pass fallible policy. That includes differences in HP, skills, capacity and normal spell ranks/unlocks.

The separate fixed-core test held both encounter levels/HP and spell ranks constant. The higher skill vector won all four paired configurations for each **5-, 10- and 20-point** skill gap. The 5-point pair uses skills 53 and 48; the others use 55/45 and 60/40. These are deterministic mirror outcomes, not smooth probabilistic win curves. Even a small advantage can consistently decide a mirror. Difficulty should therefore use both encounter level and the existing AI-depth/mistake profiles, rather than interpreting a five-point difference as a small random win-rate change.

In the 144-fight fallible control, 2,627 of 8,592 decisions attempted a mistake; **1,689 (19.7%)** actually selected a bounded inferior alternative. Ranking-budget and useful-alternative checks prevented the rest. The final 42-fight fallible follow-up selected **576/3,036 (19.0%)** inferior alternatives after 901 attempts. All fights completed. These use recorded seeds and the existing max-regret bound; randomness is in the policy, not the spell resolution.

### Decision times

Final 0.4.6, Apple M3, Node 20.20.1, depth 3 / 5,000 nodes, full AI, sequential after all simulation workers finished, warmed three repeats per fixed state. Learned-kit states are sampled from the focused level-50/80 panel; all-spell states include levels 20/50/80. These are structured samples, not the distribution of every possible turn; browser rendering/worker transfer and mobile hardware are not included.

| Decision setup | Samples | Median | p95 | Maximum |
|---|---:|---:|---:|---:|
| Learned kits | 72 | **61.2 ms** | 68.7 ms | 80.2 ms |
| All spells on both sides | 36 | **130.3 ms** | 192.4 ms | 204.5 ms |

Kit samples finished depth 2 or 3; the all-spell stress samples finished depth 1 or 2 within the same node budget. They remain legal bounded searches, but the full roster trades search depth for breadth. Fallible decisions can pay for a separate exact ranking pass and are not covered by this full-AI timing table.

## Validation and reproduction

- **63 combat tests pass**, including all casts, damage/flux/ledger rules, Shadowstep exposure, no premature draw, alpha-beta versus exhaustive minimax, 300 equal-skill/rank healing/Heartprice checks, construct expiry/bursts, first-action reflection, per-fight caps, deterministic loadouts and bounded degradation.
- Final browser smoke: **78 cases, 205 layout checks, zero page errors**, including 320×568, all spells/channels/bundles, repeated-click/touch execution and real worker profiles.
- All four main/focused simulation panels were replayed from hash-checked frozen sources; the two endurance/mirror panels replayed their decisions in their worker runs. All 680 outcomes are knockouts; no draw or settlement was fabricated at a work cap. Two main cases reproduced the same actions/outcomes/ledgers with one worker instead of four.
- `node tools/grim.js check` passed. Full campaign `npm run verify` passed in an isolated copy: 122 tests, zero balance invariant failures (five advisory alarms), 120 unchanged golden games and browser checks. Campaign content/logic was not intentionally edited by this experiment; standard checks regenerate build reports. The full campaign suite is independent of these prototype modules; final prototype behavior is covered by the focused tests and browser smoke.

Result directories, under `experiments/minigames/results/`:

- `v04-20261016-economy-level-reserve`: broad main panel, audits and detailed action/loadout summaries.
- `v04-20261016-economy-level-fallible`: broad degraded control.
- `v04-20261016-economy-endurance`: fixed-core, first-pass mirror and controlled-gap tests.
- `v04-20261016-economy-construct-followup`: final full-AI follow-up, matched comparison, sequential latency and validation evidence.
- `v04-20261016-economy-final-fallible`: final matched degraded follow-up.
- `v04-20261016-economy-final-mirrors`: final equal-skill pacing panel.

Use fresh output directories. The frozen `sources/run-v04-random.mjs` reproduces a panel with its recorded `--case-file`; frozen `sources/analyze-v04-random.mjs` audits/summarizes it. `benchmark-v04-endurance.mjs --sources <run> --out <new-dir>` generates controlled pacing tests; `--mirrors-only` isolates the equal-skill normal-kit panel. `benchmark-v04-latency.mjs <run>` writes a separate short sequential benchmark, and must run after simulation workers finish. The final runner/source snapshots and validation manifest preserve exact inputs and hashes. Existing raw results are never overwritten.
