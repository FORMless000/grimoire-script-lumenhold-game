# Combat: spell redesign v2 (F5)

## F5 rule changes (spells-v2 F5.9d · 2026-10-19; F5.1 nerfed Brace to 100/50/25/25%; F5.2 makes Shadowstep break before the hits on an exchange you attack; F5.3 removes Foresight's damage bonus and shortens it to 3/4/5 exchanges; F5.4 is the integration pass, F5.5–F5.9c its follow-ups, all below)

These override anything below that disagrees.

**Defence:**
- **Ward** blocks every opposing spell effect this exchange: damage, Torment (and its charge), Extraction, Seal and Compel. It halves each Strike.
- **Shadowstep** evades the same spell effects, plus attacks, while it's active. Attacking or recovering Mana breaks it before that exchange's hits land, so it never evades on the exchange it breaks.
- **Guard** halves spell damage and stops a Strike.
- **Brace** blocks all opposing damage on the exchange it's cast, then 50%, 25% and 25% over the next three. Spell effects still land.

**Mend** heals 25/26/27 at par at the end of the exchange, but only if you took no damage that exchange.

**Wildfire** (F5.9c):
- the cast deals 8 at once;
- each Hold deals 14 to them and a fixed 3 to you, and adds 7 embers to the Release;
- the Release deals 36, plus the embers, which get through Guard and Ward.

**Extraction** moves up to 9 of their ready Mana into your flux, and your Mana plus flux can't pass capacity.

**Stats (F5.9: one linear rule, ×1 at skill 50; numbers in `COMBAT_TUNING`, `setup/roster.mjs`):**
- **Skill factor:** every amount (damage, healing, banks) × **2/3 + skill/150**, averaged over the spell's skills: 0.8 at skill 20, 1 at 50, 1.2 at 80, and double from skill 0 to 100. Every skill scales its own spells alike. Arcana, Vigor and Alchemy matter more only because more spells use them, and because Vigor and Arcana also feed HP and Mana.
- **Strike:** 9 base, scaling with Vigor the same way (about 7 at Vigor 20, 11 at 80).
- **Max HP:** 70 × (0.8 + skill/250) of the skills, with Vigor counted twice: about 62 at level 20, 70 at 50 and 78 at 80. A gentler slope, so low-Vigor classes aren't squishy.
- **Mana capacity:** 43 × (2/3 + skill/150), Arcana counted twice: 34 at level 20, 43 at 50, about 52 at 80.
- **Condition on entering** (campaign fights, F5.9c): you start with HP = max × (0.9 + 0.1 × Health / 70) down to Health 30 (94%), then straight down to 70% at Health 0. You start with exactly the Mana you had, and the rest of capacity is flux: 10 of 43 is 10 ready and 33 flux. Fit means Health 70+ and full Mana. (F5.9b: 90–100% of each.)

**F5.4 spell changes:** Flame 9/9/8 Mana; Mend 9/9/8; Foresight 7/7/6; Haste 5 Mana, 3/3/4 exchanges, three-action bundles at rank 3; Shadowstep 12 Mana at every rank, 1/2/2 exchanges; Starlight 9; Distil costs 14 HP; Tailwind 5 Mana and +4/+8/+12; Reflect 8; Lodestar 4; Extraction 10.

**Compel (F5.4):** 16 Mana. It no longer rewrites the action the target has already committed: for the **next** exchange, their action is replaced with their last legal public action. (It was the pick a third to a half of the time it was legal when every spell was available.)

**F5.5, from reviewing the traces:**
- **Guard fatigue:** a Guard (or a Haste bundle with Guard) raised again straight after a Guard stops only **half** of each Strike. Spell damage is still halved either way. Without it, fighters out of Mana traded Guard and Strike for ten exchanges until the fight ran out on points.
- **Stalemates:** five quiet exchanges in a row (no HP lost, no Mana spent) end the fight on points (was ten).
- **Starlight:** a Release deals 36, or 60 after a Hold (was 30/48). It is telegraphed for two or three exchanges, and the opponent can Guard or Ward the Release.
- **Reflect** lasts this exchange and the next: a stance against spell-heavy opponents.
- **Class offsets** (arcana, lore, alchemy, charm, vigor, guile):

  | Class | Offsets |
  |---|---|
  | Duellist | 6/−1/−8/−1/5/−1 |
  | Scholar | 5/7/0/−2/−6/−4 |
  | Illusionist | 4/−4/−3/4/−2/1 |
  | Showman | 3/−4/−6/10/3/−6 |

  The main combat skills now carry more weight, so each class's main-skill total moved toward zero.
- **Available but off:**
  - `COMBAT_TUNING.shadowstep.breakOnCast`: any spell but Ward breaks your own Shadowstep.
  - A spell's `exposes` (for Mend): casting it breaks your own Shadowstep.

  Both end the Shadowstep-then-Mend loop. **Keep that loop:** it's the game's main comeback. Turning it off, even with Mend raised to 26/31/36, cut HP lead changes at levels 60–80 from 2.7 to 0.9 per fight, shortened fights by about a third, and let the strongest stats run away with fights (Duellist 78%). It's a trade, not a free heal: about 21 Mana for one timed heal, while the opponent takes the free exchanges to Reclaim or charge.

**F5.6, levels 20–30:** the second course spell decided the low levels.
- **Shadowstep** costs 8/10/12 Mana by rank (was 12 at every rank): a fair price for one dodged exchange at rank 1.
- **Haste** lasts 2/3/4 exchanges (was 3/3/4).
- **Illusionist** starts with Mend instead of Foresight (course weights Foresight 1, Mend 2).
- **Generated kits learn Flame by level 10** at the latest (`COMBAT_TUNING.kits.flameBy`, was 25). Below level 15, some classes used to have no damaging spell.

**F5.7, scaling and late fights:**
- Every skill scales its spells at 1% a point.
- HP grows past skill 40, and the Mana pool grows faster (see Stats).
- Late spells are cheaper by rank: Flame and Mend cost 9/8/7, Foresight 7/6/5.
- Brawler's offsets are −4/−8/−6/2/11/5 and Prefect's 5/3/−4/−4/4/−4.
- **F5.8:** Scholar's offsets are 5/7/1/−2/−4/−7, a little less frail.
- Tried and rejected: HP scaling around skill 50 (it shortened low-level fights from 20 to 14 exchanges and steepened level gaps to 87/94% at +5/+10).

**F5.9, scaling, opponents and the AI** (plan for the main game's cards: `EVENTS.md`):
- **One scaling rule:** spells, Strike, HP and Mana capacity are all linear and ×1 at skill 50 (see Stats). It replaces F5.7's HP pivot at 40 and Strike's faster 1.4%. The cost: level-20 fights run a median 14 exchanges (was 20), and Brawler and Sailor dip at levels 20–30.
- **Class offsets are percentages of the level** (twice the old fixed points, which equal them at level 50), and so is the ±9% jitter. A class keeps its shape at every level, and the class spread at levels 20–30 fell from sd 11 to 4 on its own.
- **Sailor:** a new Vigor-led class with Charm second, Tailwind and Brace (barge crews, the ring's sailor).
- **Special foes** (`SPECIAL_LOADOUTS`): a fixed kit and creature-only moves. The **Shadow stag** has **Gore**: 6 Mana, 15 damage, **physical**: it hits like a Strike, so Guard stops it, Ward halves it and Reflect can't turn it. It also has Brace at 15, Shadowstep at 30 and Tailwind at 45. When it loses, it steps aside rather than falls.
- **`ring_bout` context:** 65% Health rebate, 50% Renown.
- **AI personas and difficulty:** a persona adds points to favoured actions.
  - **Hard:** `slack` picks at random among moves within that many points of the best, and `maxRegret` caps how bad a pick may be.
  - **Easy and Medium (F5.10):** a small node-budgeted MCTS uses the persona as its priors. Channel plans hold and release channels on purpose. A sanity veto stops a favourite the board punishes, or one that would knock the caster out.
  - **Engine:** searches with late-move reductions and a distilled MLP eval.

**F5.9d, Renown and the AI's last stand (2026-10-19):**
- **Glamour and Rapport stack.** Renown from them adds up across casts, to at most 2.5 × what one Glamour of the caster's earns (Glamour I's when they don't know it), shared between the two. At the cap they do nothing, so the search prunes them. Renown is still worth nothing in the AI's evaluation.
- **The urge to deal damage.** Each side's urge grows by 3 every exchange it deals no damage (to 18), resets to 0 when it deals some, and halves when its damage is all blocked (Guard, Ward, Shadowstep, Reflect, a freeze). The AI policy adds it to damaging spells as it does a persona's tilt (× tiltScale, never past maxRegret), so Engine never feels it. The search doesn't read it.
- **Going down swinging.** A knockout's score carries a tiebreak worth up to 100 points: the winner's lost share of HP. A side whose every line loses picks the one that hurts the winner most; a winner prefers the knockout that costs it least.

**F5.9b, kits for the main game's range, and the live AI:**
- **Kit gates** (`COMBAT_TUNING.kits`):
  - course spells at 1 / 8 / 16 / 26;
  - extras at 20 / 34 (the class's own) and 46 / 58 (own or hidden), at most two for underground classes;
  - forbidden spells at 28 / 58;
  - a character's place spell at 16;
  - **ranks 2 and 3 at levels 22 and 36** (were 44 and 68).

  Card foes run at about level 12–65, and players reach course level II from year 1 spring and III from year 2 spring, so every kit now fills out by 50–60.
- **Distil costs 20 HP** (was 14).
- **Brawler and Sailor** are 6% more Vigor-heavy, and get Distil at 58. Healer's Distil also moves to 58 (it drops Animate).
- **The live opponent** searches 5 exchanges ahead with no seeded mistakes. Its difficulty is the only knob:
  - **Easy:** slack 40, persona ×2;
  - **Medium:** slack 24, persona ×1.5 (F5.9's Easy);
  - **Hard:** slack 10, persona ×1 (F5.9's Medium);
  - **Engine:** the best move (F5.9's Hard).
- **Personas** are about 1.5× stronger, and strongest for each character's unique spell.
- **The fight text calls the player "you".**
- **Mana plus flux never exceeds Mana capacity.** Gaining Mana (Distil, Moonwell, Siphon, Extraction) spills any flux that no longer fits, and a cast's flux only fills the room left. Nothing can be banked past the pool.
- **Compel** (16 Mana) replaces the target's action this exchange with their last move, even one already committed in the open. They must repeat it again next exchange too. That forced move shows as a telegraph ("compelled") even when you lead, and who commits first doesn't change. If the move can't be repeated, their turn is lost. Ward or Shadowstep shuts it out. (F5.4–F5.9 changed only the next exchange.)
- **The fight log says what each action did, in plain words:**
  - attacks get their own lines when warded, guarded, evaded, braced or reflected;
  - each line ends with the result: "Lyra takes 11 damage", "You regain 5 Mana", "Lyra can't be hit for 2 exchanges".

  The core reports every hit (`hit`: raw power, damage dealt, the defences that touched it) and every Mana move (`moved`: Extraction, Seal, Distil) for this.

**F5.9c, channels and signature spells, and peers at their level:**
- **Peers play at their level.** A growing character's canon skills are scaled to a mean of the level, keeping their shape (`scaleToMean`, `setup/roster.mjs`), so they spend a class's skill points at the same level, and a card foe's challenge level is their strength directly. Points capped at 100 go to the other skills. (F5.9b set their reference skill to the level, which left peers about 15 levels weaker.) Faculty and villagers still play their canon skills.
- **Signature and channel spells were worth almost nothing** to the engine: taking one out of its holder's kit changed its win rate by −7 to +3 points (`tools/spell-value.mjs`). Each now has a reason to cast it, and Holding a channel buys something:
  - **Wildfire:** above.
  - **Starlight:** a Release after a Hold deals 64 (was 60), and Ward doesn't stop it. (At 7 Mana it lifted Scholar, whose extra it is, to 63%; it stays 9.)
  - **Omen:** 8 Mana (was 10), a 44 hit (was 40). The foretold hit gets through Guard, Ward and Brace: only evading stops it. (Telegraphed two exchanges ahead, it used to land 3% of its damage: the opponent timed a Brace or Shadowstep.)
  - **Hoarfrost:** 7 Mana (was 9), 22 damage (was 18).
  - **Heartwood:** heals 5 an exchange (was 3), with 3 damage reduction (was 2).
  - **Contraption:** 10 Mana (was 12); hits for 12 (was 8), takes 24 damage to break (was 16), bursts for 8 (was 6).
  - **Lodestar:** the bank soaks up hits while you hold it, not only after the Release.
  - **Moonwell:** banks 16 Mana a Hold (was 12).
  - **Siphon:** Holds cost 3 Mana (was 6) and hit for 18 (was 14).
  - **Rime:** you thaw with 24 HP (was 12).
- **The special spells' amounts are roster data** (`amounts` in `SPELLS`, `setup/roster.mjs`), not Rust constants, so `tools/arms.mjs` variants can tune them.

**Kits:** Glamour, Rapport, Sleight, Index and Quickquill are out of combat kits (no combat effect). Scholar's extras are Starlight and Seal; Illusionist's are Reflect and Rapport.


This implements the supplied spell redesign in the standalone **combat** testplay. The separate negotiation prototype and campaign content have not been migrated. Learning XP, source, single card verb and negotiation descriptions are retained as roster metadata; no courses, faculty head starts, club/job chains or story scenes are fabricated here. Toll is explicitly story-only; the other 34 entries can be cast, including spells with no combat effect.

## Prototype defaults where the plan leaves a gap

- Skill factor is `0.5 + skill / 100`. Skill 50 gives the listed base amount. Animate averages Alchemy and Arcana. The shared HP scale remains 3. Damage has an additional global `damageMultiplier`, now **0.5** by default and adjustable in Setup. It affects physical/spell hits, channel ticks/releases, delayed hits, construct attacks/bursts, Wildfire self-damage and Torment. Healing, shields, construct thresholds and voluntary HP prices (Haste, Distil, Heartprice) are unchanged. Outgoing damage rounds up after skill/HP/multiplier scaling; damage remaining after defenses rounds up again, with zero remaining zero. Reflected hits reuse the original outgoing amount without applying the multiplier twice. Actual HP loss is capped by remaining HP (which may be fractional from HP prices). Descriptions show these final outgoing amounts **before defenses**, never unscaled bases. The table below records roster inputs; Mana amounts use the skill factor without that HP scale. Mana prices default to the listed costs (setup multiplier ×1). Counts, durations, Renown and Crowns transfers are fixed. Ward has no scaling skill.
- Provisional pool skills: Rime, Extraction and Eclipse use Arcana; Reflect and Lodestar use Lore; Moonwell and Siphon use Alchemy; Torment and Compel use Guile; Heartprice uses Vigor. These assignments are marked `provisionalSkill` in the roster. They are implementation defaults, not agreed canon.
- Alignment tier amounts are taken from `content/core/balance.grim`: tiny 3, small 6. Course learning XP metadata is medium/large/huge = 6/10/16 per level; other spells use large 10 per assigned skill. No learning XP is applied to the preset combat skills.

## Exchanges, ending and basic actions

One actor commits publicly, then the other responds; both actions resolve. Normal commitment order alternates in the background. Foresight can force the actual first committer. Ordinary hits land together; a mutual knockout goes to that exchange's telegraphed actor. Both actions and costs still happen.

There is **no exchange limit**. A fight ends by knockout, concession, or a structural stalemate where neither actor has a way to damage the other. Choosing Guard repeatedly is not itself a stalemate. Temporary evasion/freezing/shields are not treated as permanent invulnerability. Simulation runs may be censored at a work budget; censoring is never a draw, victory or settlement.

Strike deals base 6 physical damage using Vigor. Guard stops **all Strike damage and one third of spell damage** this exchange. Reclaim collects all your flux after primary attacks. Basics cost nothing. Each Mana payment generates **two-thirds** of that payment as flux. HP payments generate no flux. Concede is a separate terminal control.

## Casts

| Spell | Mana | Combat |
|---|---:|---|
| Flame | 10/9/7 | Base 8/9/10 spell damage |
| Foresight | 8/7/6 | Target commits first for the following 3/4/5 exchanges (F5.3: no damage bonus) |
| Mend | 10/9/7 | Heal base 6/7/8 up to entry HP/Health |
| Glamour | 9/7/5 | With observers, earn 3/5/8 Renown at settlement. Casts stack, with Rapport's, up to 2.5 × one Glamour's Renown a fight (F5.9d) |
| Haste | 10/8/8 + base 2 HP | Next exchange requires a single public bundle of 2/2/3 basic actions |
| Shadowstep | 12/10/8 | Evade every hit for 1/2/3 exchanges, including casting exchange; breaks on outgoing damage or actual Mana recovery |
| Ward | 7 | Block the next damaging action this exchange; Starlight pierces one third |
| Animate | 14 | Construct: base 3 Strike, base 1 reduction, base 10 damage threshold |
| Starlight | 16; Hold 2 | Channel: Release base 9 immediately, or base 18 after at least one Hold; one third pierces Ward |
| Seal | 10 | Erase opposing flux, including flux from this exchange's paid spell |
| Wildfire | 10; Hold 2 | Channel: each Hold base 3 to them and base 1 to you; Release base 14 |
| Heartwood | 16 | Construct: base 2 healing, base 2 reduction, base 15 threshold |
| Omen | 16 | Public base 24 spell hit two exchanges later |
| Sleight | 6; alignment −tiny | Transfer up to 5 opposing Crowns to you |
| Contraption | 12 | Construct: base 6 spell hit, no reduction, base 8 threshold; ending bursts base 4 to both sides |
| Hoarfrost | 10 | Base 7 cold; cancels against opposing Flame or Wildfire Hold/Release, including the cancelled Hold's self-damage |
| Candour | 6 | No combat effect |
| Brace | 10 | Ward now, then base 3/2/1 flat reduction per hit over the following three exchanges |
| Quickquill | 6 | No combat effect |
| Bramble | 10 | Construct: base 2 spell hit, base 1 reduction, base 8 threshold; can coexist with Heartwood |
| Index | 6 | No combat effect |
| Rapport | 4 | With observers, automatically spend the largest even amount up to 10 available Crowns; earn half that as Renown at settlement, within the same cap as Glamour's (2.5 × one Glamour of the caster's, Glamour I's if they don't know it; F5.9d) |
| Distil (`purify`) | 0; base 4 HP | Gain skill-scaled 24 ready Mana |
| Tailwind | 8 | Following three exchanges: consecutive Strikes gain base +2/+4/+6; any other action ends it |
| Rime | 12 | Once-per-fight first-knockout rescue: 1 HP, frozen and invulnerable through the next exchange, then thaw |
| Reflect | 16 | Return damaging spells this exchange in full; physical Strikes are not reflected |
| Moonwell | 0; free Holds | Channel: each Hold banks skill-scaled 10 Mana; Release makes it ready |
| Lodestar | 8; Hold 2 | Channel: each Hold banks base 6 absorb; Release protects against the next hit |
| Toll | — | Story-only, not a combat action |
| Torment | 14 | Current and following two exchanges: each opposing action pays base 2 HP |
| Extraction | 6 | Transfer skill-scaled 16 opposing ready Mana, limited by available Mana and your capacity |
| Siphon | 12; Hold 12 | Channel: start and each Hold deal base 4; Release heals the actual total dealt |
| Compel | 20 | Replace current and next actions with the target's last legal public action |
| Eclipse | 6 | Damage actually taken next exchange becomes ready Mana, 1:1, capped at capacity |
| Heartprice | 0 | Permanently replace spell Mana payments with 1 HP per 2 Mana for this fight |

## Channel and bundle rules

A channel's start is its own public action. Subsequent exchanges allow only Hold or Release; there is no duration limit. Hold costs are paid each time. Release is free. Frozen actors skip their action and keep their channel. Damage alone does not interrupt a channel: the supplied rules specify no damage-interrupt threshold.

Haste bundles are atomic public commands, not extra turns. The UI lists the small set of unique basic combinations; repeated Guard or Reclaim adds nothing, while repeated Strikes each hit. Ward covers every Strike belonging to its chosen incoming action bundle. Guard/reduction applies to each hit. A Tailwind bundle containing Guard/Reclaim ends Tailwind; a pure Strike bundle advances the +2/+4/+6 sequence within the bundle.

## Constructs and damage ordering

Constructs cannot be selected or targeted and have no HP. They act once at exchange end, including their casting exchange. Each hit on the caster loses the construct's flat reduction. Actual HP damage accumulates toward its threshold; healing does not reset it. At the threshold it ends before a later end-of-exchange action. Heartwood and Bramble can coexist in either casting order; otherwise summoning replaces existing constructs. Replacing Contraption also triggers its ending burst.

HP **costs** (Haste, Distil, Heartprice and Torment) bypass Guard, Ward, evasion and flat hit reductions and do not accumulate construct damage. Wildfire's self-damage is a hit, so Brace/construct reduction can absorb it.

Both spell costs are paid and preparations apply. Reclaim with recoverable flux and room in the Mana pool breaks Shadowstep before primary damage, exposing the caster to this exchange's attacks. Empty, capacity-capped or Sealed Reclaim does not break it. The Mana payout still occurs after primary damage, if combat continues, then due Omens and surviving construct actions resolve. Each damage phase is simultaneous; Shadowstep breaks after its outgoing damage phase, so later phases can hit the exposed caster. Reflection is one bounce only, applies to damaging spells (including construct/Omen spell hits), and does not return HP costs. Lodestar's stored absorb is consumed by the next positive hit after other reduction.

Unspecified Compel edge cases use explicit prototype conventions: no previous legal action means cancellation; an unaffordable or channel-incompatible replay cancels rather than creating negative resources. Two opposing Compels cancel each other, both paying their casting/alignment costs. It never chooses from an opponent's menu. Replayed forbidden spells count as casts for costs/reporting. Current/next refers to actual exchanges, not search nodes.

## Economy, observers and records

Standard/depleted fixtures bring 30/6 Crowns per side; setup can override each. Crowns theft transfers existing money. Crowns and alignment are never rebated. Mana is capped at kit capacity; healing is capped at entry HP/Health. Renown is capped at 100. Genuine gains can exceed entry resources; a rebate itself never does.

At settlement remaining flux is collected once, earned Renown is paid, then context rebates apply only to net losses. Receipts record spending, restoration, gain, refund and final balances separately. Optional skill-offset HP remains `entry Health + 40 + floor((Arcana + Vigor)/4)`.

Every forbidden cast charges alignment −2 (`ALIGNMENT_COST.forbidden`, a third of −small since 2026-10-19). A channel Hold/Release continues its existing cast and does not pay alignment again. With witnesses (`witnesses`, default `observers`: an audience always is one), every forbidden cast produces a recorded post-fight `forbidden_cast_report` follow-up. Observers alone decide Glamour's and Rapport's Renown. This prototype exports the follow-up payload and displays the report; an academy story event is not invented or run. Spells never award plot clues or advance arc clocks.

## Interface and random encounters

Basics and all learned spells share one icon grid, including explicit zero-Mana badges. Spell and action icons use the supplied 64×64 SVG artwork from `docs/spell-icons/` and `docs/action-icons/`, tinted through `currentColor`. Each channel's Hold uses its spell motif inside a dashed ring; Release uses the same motif with outward rays. Haste bundles compose the basic icons, while Cast and Concede use their supplied control icons. Select any action or spell for scaled details, then click its selected icon again to execute it, with no timing limit. Clicking a different icon changes the selection. Commit/Cast also executes the selection. Channels and Haste replace the grid with their legal commands. The opponent's most recent resolved action stays visible separately from its current telegraph. Log shows both actors' committed/executed actions, initiative and actual damage/resource events; Debug retains search information. The complete all-spell grid is checked at 320×568 without gameplay scrolling; the history view scrolls internally.

## Loadout generation

`docs/spells-v2-loadouts.md` supplies nine generic loadouts and 22 named-character loadouts. “Loadout” is used in controls, `LOADOUTS` / `NAMED_LOADOUTS`, `generateLoadout`, `playerLoadout` / `opponentLoadout`, generated-kit identifiers and exported records. Old result snapshots keep their original schema.

Generic skills use `levelRng(L + 1000 × salt)`, six independent offsets (each a % of L since F5.9) and uniform jitter ±9% of L, rounded/clamped to 1–100. Spell gates are in `COMBAT_TUNING.kits` (F5.9b). Mana capacity remains floor(40 + Arcana/2).

**Spell gains have no rolls.** Preferences rank choices by descending weight, with table order breaking ties; hidden extras win ties against club/job extras once eligible. Ward unlocks at 1. Flame unlocks at max(1, ceil(25 × (1 − flameBase))), always by 25. Generic course slots unlock at 1/15/40/65; the starter comes from Foresight/Mend/Glamour, later slots use remaining preferences. Course ranks rise at 44/68. Zero-weight spells never fill a slot.

Normal extra slots unlock at 45/70; hidden extras become eligible at 70, and a slot with no eligible choice waits. Underground forbidden slots unlock at 35/80. Named iconic spells unlock at 1, place spells at 25, and specified grants retain their explicit gates. Flame and guaranteed course spells reserve named curriculum slots. Study year promotes remaining course gates earlier (Haste/Shadowstep never below 12); from year 3 the peer's preferred extra unlocks at 1, including hidden extras. The exported `unlockLevels` map shows every ordinary gain. Higher level/year retains known spells; this is checked for every preset at every level.

The bench exposes named peers' study year (1–4) and Ilse's `ilse_taken` fixture flag. Same loadout mirrors those settings. Generic kits never contain peer capstones, forbidden spells without the underground flag, or story-only Toll. All-spells stress access overrides normal learning restrictions explicitly.

**Named skills:** `cast-stats.mjs` is an explicit snapshot of `content/world/cast.grim`, with a SHA-256 hash checked in tests. Refresh via `node experiments/minigames/iterations/v04/sync-loadout-stats.mjs`. Faculty and villagers use their unchanged canon skills and fixed level (floor of the mean of the two strongest skills); Setup disables their level input. The standalone bench has no campaign turn: growing characters keep canon stat ratios and set the documented encounter stat to L (Arcana for Lyra/Kael/Ilse; Vigor for Tobias/Bram; Lore for Seraphine; Guile for Corvin; Alchemy for Mir; Charm for Nessa/Tamsin). Encounter adapters can pass `playerSkills` / `opponentSkills` to use exact current `Engine.statOf` values instead.

**Provisional details:** the man in grey has no NPC stat block, so his fixture uses all six skills at L and exports `provisionalSkills: true`. Faculty “Rest” lists have no numeric weights: listed choices use equal weight 1; unspecified choices have zero weight. These are fixture assumptions, not new canon. Mir's proposed two-construct synergy is not part of this loadout migration; combat retains the agreed construct rules above.

Opponent **Random loadout** chooses uniformly among the ten generic loadouts. `encounterSeed` selects the loadout independently of its deterministic level/preset kit and AI randomness. Browser Begin generates a fresh seed when blank; explicit seeds and Replay reproduce it. Exports record the selected loadout, actual level, study year, flags, skills and generation seed. All-spells stress access deliberately grants the full roster regardless of restrictions on normal generated kits.

## AI and testing

The rules and the AI are one Rust core (`rust/core`): natively for simulations, as WebAssembly in this bench. Rule constants are named at the top of `rust/core/src/rules.rs` (Brace shares, Wildfire, Strike, Rime thaw, the 10-exchange decision clock, channel and spell amounts); action descriptions use the same constants.

The AI is alpha–beta over resolved exchanges, with iterative deepening, principal-variation search, aspiration windows, a transposition table, killer and history move ordering, and an optional extension for tactical horizons. Live play is time-based: Fast 100 ms and Deep 500 ms (compute profiles `live_fast` and `live_deep`); the engine view searches for the chosen budget (1.5 s by default). Profiles `full`, `fallible` and the rest set depth and seeded bounded mistakes. Channels and bundles are ordinary commands, and every mutable counter, construct and delayed hit is part of the search state. Search runs in workers, off the UI thread.

Build and test from `combat/`: `node tools/build.mjs`, `cargo test --release` in `rust/`, `node tools/golden.mjs`. See `README.md` there.
