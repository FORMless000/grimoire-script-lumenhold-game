# Combat economy draft 1

**Proposal for review; not applied to the live testplay.** Calculations measure `combat-spells-v2-0.4.4` and propose a new common budget. The full 35-entry candidate is `experiments/minigames/economy-draft-1.json`; its status explicitly prevents mistaking it for an active rules file. Negotiation's Patience/Suspicion economy is outside this analysis. Proposed Mana prices would need a separate negotiation review before being shared there.

## Reference units

“Base stats” means **every relevant skill is 50**, with course rank shown separately. One turn means **one actor's action**; one exchange contains one action from each actor. No defenses, missing-HP cap, overkill, resource-cap loss, rebates or illegal-cast consequences are included unless stated. Nominal entry is 70 HP / 65 ready Mana.

Use these design anchors:

- **One ordinary action = 9 HP** of unopposed output, anchored to the current free Strike.
- **One permanently spent Mana = 1.5 HP** of incremental power. This is a proposed price, not an empirical fact inferred uniquely from current spells.
- With **two-thirds flux**, spending C ready Mana burns C/3 permanently **if all flux is later collected**. Thus each upfront MP contributes **0.5 HP of paid power**, plus the recovery-time allowance below. Ready Mana and flux are not interchangeable in a dangerous position.
- Reference batching is **three casts, then one Reclaim**. Reclaim therefore adds **3 HP of opportunity cost per cast**, using the unopposed 9-HP reference action.

For an ordinary spell costing C Mana and A actions:

```
reference HP budget = 9 × A + 9 / castsPerReclaim + 1.5 × (C / 3)
                    = 9 × A + 3 + 0.5 × C        [batch of three]
```

For a one-action, 12-Mana spell, this gives **18 HP**. Its corresponding heal should deliver roughly **80%**, or **14 HP after rounding**.

A concrete check: **three 18-damage Flames + Reclaim** deal 54 damage in four actions, spend 36 ready Mana and recover 24, for a net cost of 12 Mana. **Four free Strikes** deal 36 damage. The spells buy **18 extra damage / 12 permanently spent Mana = 1.5 HP per MP**.

Do not confuse that marginal exchange rate with the whole spell's ratio: an 18-damage Flame divided by its 4 net MP is **4.5 damage/net MP**, but part of its output is paid for by the action. A 14-point Mend is **3.5 healing/net MP**. These ratios are not inconsistent.

## What the current prototype actually charges

All values below are engine-derived at skill 50, with the current scale 3 and damage multiplier 0.5. Damage includes ceiling and precedes defenses.

| Current action | Upfront MP | Output | Net MP if flux collected |
|---|---:|---|---:|
| Strike | 0 | 9 physical damage | 0 |
| Guard | 0 | Blocks all 9 Strike damage; blocks 4 of a rank-1 Flame's 12 | 0 |
| Flame I / II / III | 10 / 9 / 7 | 12 / 14 / 15 damage | 3.33 / 3 / 2.33 |
| Mend I / II / III | 10 / 9 / 7 | 18 / 21 / 24 healing | 3.33 / 3 / 2.33 |
| Ward | 7 | Blocks one damaging action, regardless of its size; Starlight pierces one-third | 2.33 |
| Distil | 0 | Costs 12 HP; gains 24 ready MP | Gains 24 |
| Haste II | 8 and 6 HP | A setup action, then two basics | 2.67 |

Current healing is **150–160% of corresponding damage**, rather than slightly below it. Upgrades also increase output while reducing price, compounding power. Under the three-cast recovery model, Flame I currently buys no additional unopposed damage over four Strikes; higher ranks imply different marginal HP/MP prices. The present roster does not have one consistent economy.

Distil → Mend II currently gains **9 HP, 15 ready MP and 6 flux** in two actions against a passive opponent. Haste I/II spend two actions to fit in two Strikes: the same output as two ordinary Strikes, with extra Mana and HP costs. Burst timing can have value, but the throughput trade is poor.

## Revised basic actions and scaling

| Action | Proposed reference effect | Purpose |
|---|---|---|
| Strike | 9 physical damage, no cost | Reference tempo and pressure without Mana |
| Guard | Blocks **two-thirds of physical** and **one-third of spell** damage | Against Strike 9 or Flame II 18, prevents 6 HP; leaves 3 or 12 damage |
| Reclaim | Existing flux recovery; no new optional spending | Pays the time cost of recycling Mana; still exposes Shadowstep before incoming attacks |

**The Guard change is necessary to test this economy.** Keeping a free, perfect Strike block preserves the old depleted-resource stalemate regardless of spell prices. Partial blocking adds progress without adding an action, meter or timer. It does not force two passive actors to attack; this is not a claim that all possible draws vanish.

Proposed common skill factor:

```
s(skill) = 0.75 + skill / 200
```

All roster quantities in this document are **final reference amounts at skill 50**, before defenses. Apply the new factor once. Do not also multiply them by legacy `combatScale = 3` and damage-only `damageMultiplier = 0.5`. A future global HP-scale control should scale damage, healing, shields and HP prices together, rather than silently making sustain stronger.

Damage and voluntary HP prices round up. Mana gains round down. Flat reductions round to the nearest integer after scaling; a zero reduction stays zero. Shield/threshold amounts scale; counts, durations, Mana prices, Crowns/Renown quantities and economic conversion ratios do not. Animate still averages its two skills.

For Mend, use a damage-equivalent budget of **16/18/20**, scaled by **Alchemy**, rounded up, then heal **floor(80% of that budget)**. This avoids rounding twice from an already-rounded reference heal. It uses only Mend's own skill, not the caster's actual Flame/Arcana power. Heartwood likewise heals floor(80% of a scaled-and-rounded 4-HP equivalent tick). Siphon's separate 60% rule uses damage actually dealt.

| Skill | Current factor | New factor | Strike | Flame II | Mend II |
|---|---:|---:|---:|---:|---:|
| 20 | 0.70 | 0.85 | 8 | 16 | 12 |
| 50 | 1.00 | 1.00 | 9 | 18 | 14 |
| 80 | 1.30 | 1.15 | 11 | 21 | 16 |
| 100 | 1.50 | 1.25 | 12 | 23 | 18 |

Ranks remain meaningful without multiplying a steep skill curve by higher damage, cheaper costs, longer durations and a larger Mana bar simultaneously. Mana capacity's existing formula can remain for the first test; changing capacity and every price at once would obscure the cause of results.

## Proposed full roster

Values are at skill 50. Slashes denote course ranks, not cast modes. Every current spell remains present. A no-effect cast remains technically available where currently allowed.

### Courses and Ward

| Spell | Proposed MP | Proposed effect | Economy reasoning |
|---|---:|---|---|
| Flame | **12/12/12** | **16/18/20 damage** | Rank II exactly matches the 18-HP budget. Rank upgrades give modest efficiency rather than compounded cheaper prices. |
| Foresight | **8/10/12** | Keep **3/4/5** subsequent forced early commitments. One next damaging action through the following exchange uses **+10 relevant skill**, capped at 100. | Prices information and favorable commitment order, not three to five stolen actions. Prep is not +10 HP. |
| Mend | **12/12/12** | **12/14/16 HP** at reference stats, using the 80%-budget scaling rule above; entry cap remains. | Same price as Flame; 75–80% of its matched-skill output after rounding. |
| Glamour | **8/8/8** | With observers, **2/3/4 total Renown per fight**; repeated casts do not stack. | External reward, not combat damage. A bounded award avoids an unlimited prestige engine. |
| Haste | **12/10/8**, **no HP cost** | Next exchange: **three basics** at every rank, as one bundle. Existing repeated Guard/Reclaim restrictions remain. | Three Strikes over setup + bundle produce 27 HP. Rank I budget: 18 tempo + 3 recovery + 6 Mana = 27. Removes the two-for-two throughput trap. |
| Shadowstep | **18/18/16** | **1/2/2 exchanges**, including cast; existing damage/Mana breaks remain. | Stronger evasion than a single Ward, but not three protected exchanges for 8 Mana. Rank III improves price rather than extending another protected recovery turn. |
| Ward | **9** | Existing next-damaging-action protection; Starlight still pierces one-third. | Blocking an 18-point Flame slightly exceeds the 16.5-HP reference budget, rewarding a correctly timed counter. Whiffing still wastes the action and Mana. |

### Other sourced spells

| Spell | Proposed MP | Proposed reference effect | Economy reasoning |
|---|---:|---|---|
| Animate | **16** | Physical tick **4**, reduction **1/hit**, ends after **20 actual HP damage taken** or **4 exchanges**. | Full four-tick window plus four single-hit reductions totals 20 HP, equal to its reference budget. |
| Starlight | **12 start, 2/Hold** | Release **26 immediately**, or **38 after at least one Hold**; one-third pierces Ward. Further Holds only change timing. | Two-action budget 27; one-Hold, three-action budget 37. Damage is close to both budgets, with a useful anti-Ward role. |
| Seal | **12** | Erase up to **12 flux**, scaled by Guile. | At reference, 12 recoverable MP is worth at most 18 HP, matching its budget. All-pool erasure has no consistent fixed price across bank sizes. Catching Reclaim is a timing reward. |
| Wildfire | **8 start, 2/Hold** | Each Hold deals **12 to them / 2 to you**; Release deals **26**. | Each extra Hold adds 10 net HP swing for a 9-HP action plus 1 HP of net-Mana cost. Timing can still be faked. |
| Heartwood | **16** | Heal **3/exchange**, reduction **1/hit**, ends after **20 damage** or **4 exchanges**. | Full window: 12 healing + 4 single-hit reductions = 16, versus a 20-HP spell budget. Healing is discounted relative to Animate. |
| Omen | **14** | **30 spell damage**, public, two exchanges later. | A conditional 30-point threat for a 19-HP nominal budget. Public delay and Ward/Shadowstep counterplay must earn the excess; this is a test target, not a proven fair discount. |
| Sleight | **6** | Keep **5 Crowns stolen**, alignment −tiny. | Crowns are a separate payoff; stealing must not be assigned invented combat damage. Target wallet remains the natural bound. |
| Contraption | **12** | Spell tick **6**, no reduction, ends after **14 damage** or **3 exchanges**; **4 to both sides** on ending. | Three ticks give 18 HP, matching budget. Symmetric burst is not counted as four free net damage; defenses can change its realized swing. |
| Hoarfrost | **10** | **16 cold damage**; preserve mutual Flame/Wildfire cancellation. | Slightly less efficient damage than Flame, paying for flexible anti-fire use. Cancellation is denial, not 16 damage plus a full shield. |
| Candour | **6** | No combat effect; retain its separate negotiation purpose. | No invented combat bonus. |
| Brace | **12** | Ward now, then flat reductions **2/1/1** over the next three exchanges. | Around 22 prevented HP against an 18-point hit and three later single hits, versus an 18-HP budget; its deferred, conditional payoff earns a specialist premium. |
| Quickquill | **6** | No combat effect; retain negotiation purpose. | No invented combat bonus. |
| Bramble | **8** | Spell tick **4**, **no reduction**, ends after **12 damage** or **4 exchanges**. Still coexists with Heartwood. | Four ticks total 16, matching budget. Magic's better Guard penetration substitutes for Animate's armor contribution. |
| Index | **6** | No combat effect; retain negotiation purpose. | No invented combat bonus. |
| Rapport | **6** | With observers, keep **2 Crowns → 1 Renown**, up to **10 Crowns total per fight**. | External resource conversion. The encounter-wide spend cap prevents repeating the same audience reward indefinitely. |
| Distil (`purify`) | **0**, **9 HP** | Gain **12 ready MP**. Both HP cost and gain scale with Alchemy, with conservative rounding. | Gains 18 HP-equivalent of Mana for a 9-HP action and 9 HP paid. Fast emergency liquidity, not a source of 24 Mana for a small wound. |
| Tailwind | **8** | Keep the final **+3/+6/+9** consecutive-Strike bonuses over three exchanges; any other action ends it. | These are already the old effect's reference outputs. Total bonus 18 versus a 16-HP setup budget is reasonable; change Guard before buffing this blindly. |

Construct duration counts the casting exchange; normal expiry follows its final tick. They still have no targetable HP, end early on caster damage, act automatically once at exchange end, and allow only the agreed Heartwood/Bramble coexistence. Recast replaces, never stacks; Contraption bursts on expiry, destruction or replacement. This is a **new lifetime cap**, chosen instead of a maintenance payment or a new command. Fixed finite windows make passive output priceable without adding action menus.

### Hidden pool

| Spell | Proposed MP | Proposed reference effect | Economy reasoning |
|---|---:|---|---|
| Rime | **6** | Preserve once-per-fight, 1-HP rescue and one frozen exchange. | Death prevention is an option, not a large heal. Freezing also sacrifices an action and gives the opponent a recovery opportunity. |
| Reflect | **24** | Block the **next damaging spell action** this exchange and return **half** its incoming power, rounded up, once. Physical damage unaffected. Normal defenses apply to the returned hit; do not skill-scale the original power again. | Against Flame II: prevent 18 + return 9 = 27 HP swing for a 24-HP budget. Reflection must pay for prevention **and** return; the current full-return, multi-action counter is difficult to price. |
| Moonwell | **0 start, free Holds** | Each Hold banks **6 MP**; Release makes it ready. | Each Hold banks 9 HP-equivalent, equal to reference tempo. Start and Release cost two more actions, so the channel never beats the free-action budget in this model. |
| Lodestar | **6 start, free Holds** | Release gives **24 + 9 per Hold** absorb, retained as one pool and consumed across hits. | Budget is exactly 24 + 9 per Hold. This deliberately changes the current one-hit shield into a persistent absorb pool; excess banking otherwise has little value against ordinary attacks. |
| Toll | — | Story only; not castable. | No invented combat economy. |

Lodestar's pool is replaced on recast and disappears at settlement; it does not restore campaign Health. Its initial 24 absorb is awarded on Release, not at channel start. Moonwell and Lodestar remain vulnerable while banking. Holds stay unlimited by rule, but Mana/HP constraints still limit paid channels in practice.

### Forbidden pool

Keep alignment −small per cast and observer reporting. Treat a **rough 20–30% conditional power premium** as a design allowance, not as compensation that every player will value equally. Illegality is not a reliable tactical price when nobody observes it.

| Spell | Proposed MP | Proposed reference effect | Economy reasoning |
|---|---:|---|---|
| Torment | **14** | **8 HP per opposing action** for three exchanges; once per bundle, no stacking. | Up to 24 unmitigated HP for a 19-HP ordinary budget; approximately a 26% forbidden premium. Mend, pressure on the caster, or ending the fight are the baseline responses. |
| Extraction | **8** | Transfer up to **7 ready MP**, scaled by Arcana, respecting both pools/capacity. | A transfer counts twice: +7 to you and −7 to them is up to 21 HP-equivalent at reference, versus a 16-HP budget. Limits prevent destroying overflow Mana. |
| Siphon | **8 start, 4/Hold** | Start deals **18**, each Hold **9**; Release heals **60% of actual total damage dealt**. | One Hold: 27 damage + up to 16 healing over three actions, versus a 36-HP ordinary budget. Longer channels approach a roughly 30% premium, but delay their healing and remain exposed. |
| Compel | **20** | Preserve replay of the last legal public action for the current and next exchange. No chosen opponent menu, no hidden queue. | At most two redirected choices, not necessarily two canceled actions. A harmless history and baseline Guard/Strike keep it conditional. The old price need not change just to make every row different. |
| Eclipse | **8** | Next exchange: gain **0.75 MP per actual external HP damage**, capped at **24 MP** scaled by Arcana. | Conversion ratio stays fixed. Ordinary 18-point damage yields 13 ready MP after rounding, about 19.5 HP-equivalent, versus a 16-HP budget. No overkill, HP costs or self-hit conversion. |
| Heartprice | **0** | For the fight, spells cost **0.8 HP per nominal MP**, rounded up per payment; HP payments generate no flux. | A 12-MP Mend costs 10 HP. Across all equal-skill 1–100 fixtures and ranks, its net healing stays below incoming free Strike damage. Retaining the old 0.5 ratio fails this pressure check. |

The 0.8 Heartprice ratio includes a rounding margin: 0.75 still lets max-rank Mend exactly match free Strike pressure at skills 91–94 under the proposed rounding. The rule needs a strict gap, not merely the right-looking skill-50 example. This equal-skill check is not a proof against every cross-skill or multi-spell combination.

## How to price effects without direct damage

The common currency is an accounting tool, not permission to count the same benefit twice.

- **Blocking:** value actual damage avoided. Ward into no attack has zero protection value. A conditional counter can beat the reference price when read correctly; it should not beat every offense unconditionally.
- **Reflection:** count damage prevented plus damage returned. Existing evasion/defense can reduce the returned part, so potential swing is not guaranteed damage.
- **Cancellation:** Hoarfrost gives up its own hit as it erases fire. Do not price it as normal damage plus all the opposing damage canceled.
- **Information:** Foresight changes who chooses first, not how many actions anybody takes. Three forced-first exchanges overlap ordinary alternating commitments; the actual additional response opportunities depend on phase and opposing Foresight. Measure best-response improvement in paired positions rather than awarding 9 HP per revealed exchange automatically.
- **Action compression:** subtract setup. Old two-basic Haste is two basics over two actions, not a free extra turn. Repeated Guard/Reclaim still add no value. The three-basic proposal creates a real surplus before charging its price.
- **Persistent output:** use a bounded window and damage threshold; compare total realized ticks and prevented hits, not a single impressive tick. Four reductions in the construct reference assume one hit per exchange; multi-hit attacks can change that value.
- **Delay:** Omen's two waiting exchanges do not consume two extra caster actions. Its excess raw damage pays for public counterplay, not imaginary lost turns. It can overlap another attack, which is part of its tactical purpose.
- **Resource denial:** count recoverable flux rather than treating all displayed flux as spendable Mana. Losing the last MP needed for Ward can matter much more than losing surplus MP; Seal and Extraction remain state-dependent.
- **Control:** count the difference between the forced action and what the target could otherwise choose. Repeating a sensible Strike is not worth canceling a full turn.
- **Renown, Crowns and alignment:** keep a separate external-resource ledger. There is no demonstrated universal HP exchange rate for social reward or morality. Bound repeatable awards and preserve their noncombat purpose rather than assigning fake duel damage.

## Recovery, channels and the end of a fight

A proposed Distil → Mend II → Reclaim cycle gives **+5 HP and +8 MP in three actions**, or 17 HP-equivalent of recovered resources against a passive foe, below its 27-HP time budget. Against three unmitigated Strikes it instead loses **22 HP**. It is allowed to recover in a lull: Moonwell is explicitly designed to do that too. The objective is to stop recovery from being pressure-neutral, not to ban all resource gains when the opponent refuses to attack.

At reference stats, simple channel checks give:

| Channel sequence | Actions | Output | Ordinary reference budget |
|---|---:|---|---:|
| Starlight → Release | 2 | 26 damage | 27 |
| Starlight → Hold → Release | 3 | 38 damage | 37 |
| Wildfire → Release | 2 | 26 damage | 25 |
| Wildfire → Hold → Release | 3 | 38 damage, 2 self-damage | 35 |
| Siphon → Hold → Release | 3 | 27 damage, up to 16 healing | 36 |
| Moonwell → Hold → Release | 3 | 6 MP, worth 9 HP-equivalent | 27 tempo, no Mana spent |
| Lodestar → Hold → Release | 3 | 33 absorb | 33 |

These are unmitigated accounting outputs, not simulated match results. Caps, incoming pressure, early death and counteractions reduce them. Paid channels cannot Reclaim while channeling; e.g. Siphon can afford at most 14 Holds from a full 65-Mana pool without another funding mechanic. A long channel may require more frequent Reclaims between casts than the three-cast reference allows.

Reclaim sensitivity matters: the 12-Mana spell's nominal budget is **24 HP at one cast/Reclaim**, **19.5 at two**, **18 at three**, and **16.8 at five**. Actual terminal settlement automatically recovers remaining flux, so a final batch may need no Reclaim action at all. Some flux may also be lost to Seal or a full capacity cap. The formula is a middle-fight calibration, not an invariant price in every state.

Context rebates apply **after** this combat ledger. The reference 4 net MP for a 12-MP spell is before rebates. At 80% rebate, net loss 4 becomes 1 persistent MP under the current floor-refund rule. Different Health and Mana rebate ratios change the external resource incentives and should be tested separately; rebates do not give the caster extra ready Mana during combat.

## AI calibration and validation limits

The current leaf evaluator also needs review before using its choices to judge this candidate. At 70 max HP, losing one HP changes its score by about **4.07**, while one ready Mana changes it by **0.12**: an implied marginal inventory valuation of only **0.0295 HP/MP** at the empty-effect reference state. This is not the same thing as a simulated willingness to trade, but it explains why current policy statistics cannot certify the new exchange rate.

Do not blindly multiply the Mana weight by fifty. Unused Mana has little duel value after a forced win, future value is constrained by the actual kit and horizon, and terminal victory must dominate hoarding. Test pairwise resource/tempo choices and usable future options, alongside the existing bounded-search budget, before interpreting a new win-rate table as mechanical balance.

Validation completed for this proposal:

- Every one of the **35 roster entries** has an explicit treatment, including intentionally noncombat and story-only entries.
- Current core amounts and Distil/Mend recovery were measured through the actual engine; no campaign content or live prototype rules changed.
- **300 matched-skill/rank cases** confirm proposed Mend is 75–80% of corresponding damage after rounding.
- **300 equal-skill pressure cases** confirm the proposed Heartprice/Mend combination does not match or beat one incoming free Strike per action, without other effects.
- Channel accounting was enumerated for **0–20 Holds**; this is formula coverage, not proof that every sequence is affordable or survivable. Mana affordability is recorded for Siphon.
- Full-window construct accounting gives Animate 20/20, Heartwood 16/20, Bramble 16/16 and Contraption 18/18 realized-potential/reference-budget HP at skill 50 under the stated single-hit assumption.

Exact data and hash-checked sources are in `experiments/minigames/results/v04-20261016-economy-pricing/`. Reproduce with:

```sh
node experiments/minigames/analyze-v04-economy.mjs /private/tmp/combat-economy-new
```

Use its frozen `sources/analyze-v04-economy.mjs` after later edits. The source JSON is a proposal, not an implemented alternate rules engine. This work establishes consistent first-pass prices and identifies the necessary rule changes; **no candidate win-rate, pacing or strategy-diversity improvement has yet been measured**. A later implementation should replay the same paired loadout panel against the frozen v04 baseline, with explicit counter, sustain, low-health and low-Mana fixtures.
