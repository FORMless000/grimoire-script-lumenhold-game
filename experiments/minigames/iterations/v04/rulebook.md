# Combat: spell redesign v2 (prototype 0.4.6)

This implements the supplied spell redesign in the standalone **combat** testplay. The separate negotiation prototype and campaign content have not been migrated. Learning XP, source, single card verb and negotiation descriptions are retained as roster metadata; no courses, faculty head starts, club/job chains or story scenes are fabricated here. Toll is explicitly story-only; the other 34 entries can be cast, including spells with no combat effect.

## Prototype defaults where the plan leaves a gap

- Final HP units use `S = 0.75 + skill / 200`; skill 50 is ×1. Animate averages Alchemy and Arcana. Damage, voluntary HP costs and thresholds round up; Mana gains round down; flat reductions round to nearest integer. Healing is `floor(0.8 × ceil(damage-equivalent budget × S))`, below equal-price damage. Costs, durations, counts and economic ratios do not scale. `combatScale` and the adjustable damage multiplier both default to **1**; do not reapply the old ×3 / ×0.5 conversions. Damage remaining after defenses rounds up again, zero staying zero. Reflection reuses incoming power without scaling it twice. Descriptions show final outgoing damage before defenses.
- Default maximum HP is `entry Health + 10 + 2 × encounter level`. At equal skills 20/50/80 and Health 70, this gives **120/180/240 HP**. HP grows faster than damage to lengthen high-level fights. Encounter level represents the expected relevant skill, avoiding an extra HP penalty for characters with unrelated low skills. Health can be zero while the skill reserve still permits play. The explicit direct-Health option remains for diagnostic comparisons. Health loss/restoration and settlement retain the existing ledger conventions; campaign persistence is not implemented here.
- Reference economy: one action ≈ 9 HP; 6 permanently burned Mana ≈ 9 HP at skill 50. Two-thirds flux means 18 upfront Mana burns 6 after recovery; Reclaim still costs its own action. Assuming three casts per Reclaim, a 12-Mana one-action spell has an 18-HP budget. This is a tuning calibration, not a guaranteed conversion in every tactical position. Configuration lives in `economy.mjs`; prior proposals/results are preserved.
- Provisional pool skills: Rime, Extraction and Eclipse use Arcana; Reflect and Lodestar use Lore; Moonwell and Siphon use Alchemy; Torment and Compel use Guile; Heartprice uses Vigor. These assignments are marked `provisionalSkill` in the roster. They are implementation defaults, not agreed canon.
- Alignment tier amounts are taken from `content/core/balance.grim`: tiny 3, small 6. Course learning XP metadata is medium/large/huge = 6/10/16 per level; other spells use large 10 per assigned skill. No learning XP is applied to the preset combat skills.

## Exchanges, ending and basic actions

One actor commits publicly, then the other responds; both actions resolve. Normal commitment order alternates in the background. Foresight can force the actual first committer. Ordinary hits land together; a mutual knockout goes to that exchange's telegraphed actor. Both actions and costs still happen.

There is **no exchange limit**. A fight ends by knockout, concession, or a structural stalemate where neither actor has a way to damage the other. Choosing Guard repeatedly is not itself a stalemate. Temporary evasion/freezing/shields are not treated as permanent invulnerability. Simulation runs may be censored at a work budget; censoring is never a draw, victory or settlement.

Strike deals 9 physical damage at skill 50 using Vigor. Guard stops **two thirds of physical damage and one third of spell damage** this exchange. Reclaim collects all your flux after primary attacks. Basics cost nothing. Each Mana payment generates **two-thirds** of that payment as flux. HP payments generate no flux. Concede is a separate terminal control.

## Casts

All amounts below are final at skill 50, before defenses; course values are ranks I/II/III.

| Spell | Mana | Combat |
|---|---:|---|
| Flame | 12/12/12 | 16/18/20 spell damage |
| Foresight | 8/10/12 | Opponent commits first for 3/4/5 following exchanges; next direct damaging action by next exchange uses +10 relevant skill, capped at 100 |
| Mend | 12/12/12 | Heal 12/14/16, up to entry HP/Health |
| Glamour | 8/8/8 | With observers, 2/3/4 total Renown per fight; cannot stack |
| Haste | 12/10/8 | Next exchange: 3 basic actions as one public bundle; no HP price |
| Shadowstep | 18/18/16 | Evade for 1/2/2 exchanges including cast; existing damage/Mana break rules |
| Ward | 9 | Block next damaging action this exchange; Starlight pierces one third |
| Animate | 16 | Physical tick 6, reduction 1, damage threshold 40, lifetime 4 exchanges |
| Starlight | 12; Hold 2 | Release 26 immediately or 38 after ≥1 Hold; one third pierces Ward |
| Seal | 12 | Erase up to 12 flux, including this exchange's newly paid flux |
| Wildfire | 8; Hold 2 | Hold: 12 to opponent, 2 to self; Release 26 |
| Heartwood | 16 | Heal tick 4, reduction 2, threshold 40, lifetime 4 |
| Omen | 14 | Public 30 spell damage two exchanges later |
| Sleight | 6 | Steal up to 5 Crowns; alignment −tiny |
| Contraption | 12 | Spell tick 8, no reduction, threshold 32, lifetime 3; ending burst 4 to both |
| Hoarfrost | 10 | Cold 16; mutual cancellation with Flame or Wildfire, including canceled Hold self-damage |
| Candour | 6 | No combat effect |
| Brace | 12 | Ward now; reduction 2/1/1 over next three exchanges |
| Quickquill | 6 | No combat effect |
| Bramble | 8 | Spell tick 5, no reduction, threshold 32, lifetime 4; may coexist with Heartwood |
| Index | 6 | No combat effect |
| Rapport | 6 | With observers, 2 Crowns per Renown; up to 10 Crowns total per fight |
| Distil (`purify`) | 0 + 9 HP | Gain 12 ready Mana |
| Tailwind | 8 | Next three exchanges: consecutive Strikes gain +3/+6/+9; any other action ends it |
| Rime | 6 | Once per fight: first knockout freezes on 1 HP through following exchange |
| Reflect | 24 | Block next damaging spell action this exchange, return half incoming power rounded up; one bounce |
| Moonwell | 0; free Holds | Hold banks 6 Mana; Release makes it ready |
| Lodestar | 6; free Holds | Release grants 24 absorb plus 9 per Hold; remaining pool persists across hits |
| Toll | — | Story-only, not castable |
| Torment | 14 | Each opposing action costs 8 HP for three exchanges including cast; once per bundle |
| Extraction | 8 | Transfer up to 7 opposing ready Mana, limited by receiver capacity |
| Siphon | 8; Hold 4 | Start damage 18; Hold damage 9; Release heals 60% of actual total damage, rounded down |
| Compel | 20 | Replace current and next actions with last legal public action |
| Eclipse | 8 | Next exchange's external actual HP damage yields 75% Mana, rounded down per hit; total cap 24 |
| Heartprice | 0 | Spells cost 0.8 HP per nominal Mana, rounded up per payment; no payment flux |

## Channel and bundle rules

A channel's start is its own public action. Subsequent exchanges allow only Hold or Release; there is no duration limit. Hold costs are paid each time. Release is free. Frozen actors skip their action and keep their channel. Damage alone does not interrupt a channel: the supplied rules specify no damage-interrupt threshold.

Haste bundles are atomic public commands, not extra turns. The UI lists the small set of unique basic combinations; repeated Guard or Reclaim adds nothing, while repeated Strikes each hit. Ward covers every Strike belonging to its chosen incoming action bundle. Guard/reduction applies to each hit. A Tailwind bundle containing Guard/Reclaim ends Tailwind; a pure Strike bundle advances the +3/+6/+9 sequence within the bundle.

## Constructs and damage ordering

Constructs cannot be selected or targeted and have no HP. They act once at exchange end, including their casting exchange. Each hit on the caster loses the construct's flat reduction. Actual HP damage accumulates toward its threshold; healing does not reset it. At the threshold it ends before a later end-of-exchange action. A lifetime counts the casting exchange; its final tick happens before expiry and any ending burst. Heartwood and Bramble can coexist in either casting order; otherwise summoning replaces existing constructs. Replacing Contraption also triggers its ending burst.

HP **costs** (Distil, Heartprice and Torment) bypass Guard, Ward, evasion and flat hit reductions and do not accumulate construct damage. Wildfire's self-damage is a hit, so Brace/construct reduction can absorb it.

Both spell costs are paid and preparations apply. Reclaim with recoverable flux and room in the Mana pool breaks Shadowstep before primary damage, exposing the caster to this exchange's attacks. Empty, capacity-capped or Sealed Reclaim does not break it. The Mana payout still occurs after primary damage, if combat continues, then due Omens and surviving construct actions resolve. Each damage phase is simultaneous; Shadowstep breaks after its outgoing damage phase, so later phases can hit the exposed caster. Reflection is one bounce only, applies to damaging spells (including construct/Omen spell hits), and does not return HP costs. Lodestar's remaining absorb is consumed across positive hits after other reductions. Reflection covers only the first damaging spell-action group in the exchange, including autonomous spell hits if those arrive first.

Unspecified Compel edge cases use explicit prototype conventions: no previous legal action means cancellation; an unaffordable or channel-incompatible replay cancels rather than creating negative resources. Two opposing Compels cancel each other, both paying their casting/alignment costs. It never chooses from an opponent's menu. Replayed forbidden spells count as casts for costs/reporting. Current/next refers to actual exchanges, not search nodes.

## Economy, observers and records

Standard/depleted fixtures bring 30/6 Crowns per side; setup can override each. Crowns theft transfers existing money. Crowns and alignment are never rebated. Mana is capped at kit capacity; healing is capped at entry HP/Health. Renown is capped at 100. Genuine gains can exceed entry resources; a rebate itself never does.

At settlement remaining flux is collected once, earned Renown is paid, then context rebates apply only to net losses. Receipts record spending, restoration, gain, refund and final balances separately. The endurance HP reserve is the default, as defined above.

Every forbidden cast charges alignment −small. A channel Hold/Release continues its existing cast and does not pay alignment again. With observers, every forbidden cast produces a recorded post-fight `forbidden_cast_report` follow-up. This prototype exports the follow-up payload and displays the report; an academy story event is not invented or run. Spells never award plot clues or advance arc clocks.

## Interface and random encounters

Basics and all learned spells share one icon grid, including explicit zero-Mana badges. Spell and action icons use the supplied 64×64 SVG artwork from `docs/spell-icons/` and `docs/action-icons/`, tinted through `currentColor`. Each channel's Hold uses its spell motif inside a dashed ring; Release uses the same motif with outward rays. Haste bundles compose the basic icons, while Cast and Concede use their supplied control icons. Select any action or spell for scaled details, then click its selected icon again to execute it, with no timing limit. Clicking a different icon changes the selection. Commit/Cast also executes the selection. Channels and Haste replace the grid with their legal commands. The opponent's most recent resolved action stays visible separately from its current telegraph. Log shows both actors' committed/executed actions, initiative and actual damage/resource events; Debug retains search information. The complete all-spell grid is checked at 320×568 without gameplay scrolling; the history view scrolls internally.

## Loadout generation

`docs/spells-v2-loadouts.md` supplies nine generic loadouts and 22 named-character loadouts. “Loadout” is used in controls, `LOADOUTS` / `NAMED_LOADOUTS`, `generateLoadout`, `playerLoadout` / `opponentLoadout`, generated-kit identifiers and exported records. Old result snapshots keep their original schema.

Generic skills use `levelRng(L + 1000 × salt)`, six independent offsets and uniform jitter ±(2 + L/20), rounded/clamped to 1–100. Mana capacity remains floor(40 + Arcana/2).

**Spell gains have no rolls.** Preferences rank choices by descending weight, with table order breaking ties; hidden extras win ties against club/job extras once eligible. Ward unlocks at 1. Flame unlocks at max(1, ceil(25 × (1 − flameBase))), always by 25. Generic course slots unlock at 1/15/40/65; the starter comes from Foresight/Mend/Glamour, later slots use remaining preferences. Course ranks rise at 44/68. Zero-weight spells never fill a slot.

Normal extra slots unlock at 45/70; hidden extras become eligible at 70, and a slot with no eligible choice waits. Underground forbidden slots unlock at 35/80. Named iconic spells unlock at 1, place spells at 25, and specified grants retain their explicit gates. Flame and guaranteed course spells reserve named curriculum slots. Study year promotes remaining course gates earlier (Haste/Shadowstep never below 12); from year 3 the peer's preferred extra unlocks at 1, including hidden extras. The exported `unlockLevels` map shows every ordinary gain. Higher level/year retains known spells; this is checked for every preset at every level.

The bench exposes named peers' study year (1–4) and Ilse's `ilse_taken` fixture flag. Same loadout mirrors those settings. Generic kits never contain peer capstones, forbidden spells without the underground flag, or story-only Toll. All-spells stress access overrides normal learning restrictions explicitly.

**Named skills:** `cast-stats.mjs` is an explicit snapshot of `content/world/cast.grim`, with a SHA-256 hash checked in tests. Refresh via `node experiments/minigames/iterations/v04/sync-loadout-stats.mjs`. Faculty and villagers use their unchanged canon skills and fixed level (floor of the mean of the two strongest skills); Setup disables their level input. The standalone bench has no campaign turn: growing characters keep canon stat ratios and set the documented encounter stat to L (Arcana for Lyra/Kael/Ilse; Vigor for Tobias/Bram; Lore for Seraphine; Guile for Corvin; Alchemy for Mir; Charm for Nessa/Tamsin). Encounter adapters can pass `playerSkills` / `opponentSkills` to use exact current `Engine.statOf` values instead.

**Provisional details:** the man in grey has no NPC stat block, so his fixture uses all six skills at L and exports `provisionalSkills: true`. Faculty “Rest” lists have no numeric weights: listed choices use equal weight 1; unspecified choices have zero weight. These are fixture assumptions, not new canon. Mir's proposed two-construct synergy is not part of this loadout migration; combat retains the agreed construct rules above.

Opponent **Random loadout** chooses uniformly among the nine generic loadouts. `encounterSeed` selects the loadout independently of its deterministic level/preset kit and AI randomness. Browser Begin generates a fresh seed when blank; explicit seeds and Replay reproduce it. Exports record the selected loadout, actual level, study year, flags, skills and generation seed. All-spells stress access deliberately grants the full roster regardless of restrictions on normal generated kits.

## AI and testing

The AI evaluates in HP units, with discounted ready-Mana/flux inventory and bounded construct lifetime value. Browser computation is selectable: Fast (100 ms, default) or Deep (500 ms), each up to eight nominal exchanges; shallow/fallible behavior is independent. A tactical horizon may search one additional full exchange for a channel, an Omen due, or construct expiry, and cannot extend repeatedly. Deadlines include bounded-mistake ranking; seeded attempts reserve half the budget for ranking and retain the main action if ranking cannot finish. Timed choices can vary across devices. Programmatic legacy calls retain three exchanges / 5,000 main nodes with a fixed horizon; the deterministic analyst profile requests six exchanges / 200,000 total nodes with tactical horizons. Channels and bundles remain ordinary commands. Collision-verified caches and reusable buffers include mutable counters, public history, constructs and delayed hits; caches live outside serialized game state. All-spell setups may complete fewer iterations. Debug/exports record actual depth, work, budget and stopping reason. The worker keeps computation off the UI thread. See README for benchmarks and separately invoked balance panels.

Build with `node experiments/minigames/iterations/v04/build-browser.mjs <temporary-directory>`, then serve that generated directory. The separate v03 negotiation prototype and earlier source/result snapshots remain available for their own iterations.
