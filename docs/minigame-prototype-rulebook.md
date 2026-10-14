# Combat and negotiation prototype rulebook

**Draft 0.1 · October 14, 2026 · for review before implementation**

This is a standalone specification for two testplay games. It proposes rules, numbers and spell changes; it does not change academy canon, content, saves or the engine. No balance or enjoyment claims have been validated. A tester should be able to choose a matchup, read its complete setup and play without an academy run.

The objective is short tactical encounters in which ordinary actions remain useful and spending Health, Mood, Renown and Mana has an opportunity cost. Context-specific rebates settle the encounter afterward without increasing any resource above its entry value. Start with eight exchanges at most. Measure actual playing time before attempting the design's 30–90 second target.

## 1. Scope and relationship to the project

References are for comparison and eventual integration, not runtime dependencies:

| Project reference | Retained or adapted here |
|---|---|
| [Design §T1](design-v0.3.md#t1-minigames-tentative-phase-5-if-approved) | Short encounters, optional auto-resolution, `win / partial / lose`, deterministic randomness. |
| [Engine](../src/engine.js), `rand()` | The same integer PRNG algorithm, instantiated locally; never consume an academy run's RNG. |
| [Engine](../src/engine.js), `challengeOdds()` | Skill comparison and `clamp(50 + 2.5 × difference, 8, 92)` success odds. The prototype does not call this method. |
| [Core rules](../content/core/rules.grim), `@resource mana` and `@hook mana_regen` | Mana capacity and the monthly recovery reference. No regeneration during encounters. |
| [Balance](../content/core/balance.grim) | Existing resource tiers and difficulty offsets are reference points. Prototype parameters below are separate, explicit constants. |
| [Current spells](../content/world/spells.grim) and [courses](../content/world/tracks.grim) | Proposed twelve-spell roster, retaining the six disciplines. Merged/new spells are not implemented definitions. |

Negotiation deliberately does **not** use discovered facts, dialogue clues, character histories, hidden values inferred from prose, relationship bonuses or a question bank. Its preferences, permissions, stakes and physical fixtures are printed at setup. Deception creates explicit mechanical claims during play; it does not require discovering contradictory dialogue.

Inventory, crafting, academy rewards, alignment changes, persistent NPC memories and campaign scheduling are outside this prototype. No spells are selected by a hand or loadout: the participant's entire learned repertoire is accessible.

## 2. Test setup

Record these fields before playing:

```text
rulesVersion: prototype-0.1
mode: combat | negotiation
playerArchetype: one of the six templates in §4
playerLevel: integer 1..100 (default 50)
opponentArchetype: template; combat default = playerArchetype
opponentLevel: integer 1..100; combat default = playerLevel
fixture: practice_ring | workshop_request | formal_petition
resourceBudget: standard | depleted | explicit amounts (default standard)
context: practice_duel | real_conflict | public_duel | rehearsal
rebates: optional per-resource overrides, each in 0..1
manaCostScale: positive integer (default 3)
spellAccess: kit | all (default kit)
visibility: tells | open (default tells; combat only)
```

**Level is the difficulty setting**, not a separate hidden multiplier. A level-50 opponent is calibrated around relevant skills of 50. Explicitly selecting level 58 produces a new level-58 kit and new seeded behaviour, rather than just adding eight to the same opponent's checks. Small level changes can change details as well as strength.

For combat's default mirror matchup, generate the player's kit once and clone its skills, learned spells, spell ranks, maximum mana and all entry resource balances for the opponent. A different opponent archetype or level opts out of mirroring. Their decisions are still different because the player chooses actions and the opponent uses AI.

Negotiation's default audience uses the player's archetype and level, but roles remain asymmetrical: only the player builds agreement, makes claims and buys concessions. The audience challenges or listens. Its crowns are not a counter-bargaining purse. Both archetypes and levels can be selected independently.

In `spellAccess: all`, both sides receive all twelve spells. Their two signature spells retain their generated ranks; all other spells use the support rank rule. This mode is for availability and spell-interaction tests, not the default progression test.

An integrated encounter could later assign `{mode, opponentArchetype, opponentLevel, fixture}`. Do not interpret opponent level as a month number or apply `E(turn)` again.

## 3. Reproducibility and level generation

### 3.1 Local random generator

Use the algorithm below, copied as a mathematical reference from `Engine.rand()`. All operations inside the generator use JavaScript 32-bit integer semantics. Each independent instance starts with **the integer level itself**. Do not use the clock, an archetype hash or `Math.random()`.

```js
function levelRng(level) {
  let state = level | 0;
  return function next() {
    let a = (state = (state + 0x6D2B79F5) | 0);
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

An archetype supplies fixed offsets and spell identities. The level supplies all random variation. Thus `(rulesVersion, archetype, level)` uniquely identifies a kit. Changing the archetype changes the template, not the seed.

### 3.2 Generate a kit

Let `L` be the selected level and `cap(x, lo, hi)` clamp inclusively. Take exactly seven draws from a fresh `levelRng(L)`, in this order:

1. Arcana/Vigor jitter: `jA = floor(7 × u1) - 3`.
2. Charm/Guile jitter: `jC = floor(7 × u2) - 3`.
3. Lore jitter: `jL = floor(7 × u3) - 3`.
4. Alchemy jitter: `jH = floor(7 × u4) - 3`.
5. Support selection: `supportIndex = floor(2 × u5)` (zero-based, table order).
6. AI cycle offset: `cycleOffset = floor(3 × u6)`.
7. AI temperament: `temperament = floor(3 × u7)` (0 cautious, 1 steady, 2 bold).

Apply the template offsets from §4:

```text
dA = cap(arcanaOffset + jA, -min(L-1, 100-L), min(L-1, 100-L))
arcana = L + dA; vigor = L - dA
dC = cap(charmOffset + jC, -min(L-1, 100-L), min(L-1, 100-L))
charm = L + dC; guile = L - dC
lore = cap(L + loreOffset + jL, 1, 100)
alchemy = cap(L + alchemyOffset + jH, 1, 100)
```

This keeps `(arcana + vigor)/2` and `(charm + guile)/2` exactly equal to `L`. At levels 1 and 100, pair variation disappears because of the bounds; spell identities and AI still distinguish archetypes. Lore and Alchemy remain specialties around the reference level.

Signature rank is `1 + floor((L-1)/35)`: I at 1–35, II at 36–70, III at 71–100. Both signature spells use that rank. Of the two supports, the seeded selected support also uses signature rank; the other uses `max(1, signatureRank-1)`. In all-spells mode, added supports use `max(1, signatureRank-1)`.

Mana capacity is `floor(40 + arcana/2)`. Standard standalone budgets are Health 70, Mood 60, Renown 30, Mana at capacity, and Crowns 30. Depleted budgets are Health 35, Mood 30, Renown 5, Mana `min(30, capacity)`, and Crowns 6. These are test fixtures, not changes to game-start values (the academy currently starts Renown at 5 and Mana at 30). Explicit budgets are permitted within each resource's bounds: 0–100 for Health/Mood/Renown, 0–capacity for Mana, 0–99999 for Crowns. Entry Health and Mood must be positive to start. Record every override and each participant's entry balances.

### 3.3 Encounter random tape

Create a **separate fresh** `levelRng(opponentLevel)`. Precompute eight rows, each with four consecutive draws:

| Slot in each row | Use |
|---|---|
| 1 | Player action check |
| 2 | Opponent attack check, or audience response check |
| 3 | AI choice within an ordered candidate family |
| 4 | Reserved; unused in draft 0.1 |

Unused slots are still reserved. An automatic action, preview, forecast, UI rerender or failed affordability check cannot shift later draws. Each actor performs at most one check per exchange. A check succeeds when `100 × u < successPercent`; equality fails.

AI uses current public state and previous resolved actions. Once its next intention is committed, it cannot react to the player's still-uncommitted selection. Replaying the same setup and choices gives the same result. Different choices can lead to different AI intentions, while the tape stays fixed.

## 4. Six archetypes, usable for either participant

Names here are prototype labels, not new worldbook characters. Offsets are parameters for review.

| Archetype | Arcana offset | Charm offset | Lore offset | Alchemy offset | Signature spells, in order | Supports, in order |
|---|---:|---:|---:|---:|---|---|
| Evoker | +8 | 0 | 0 | -4 | Flame, Tide | Ward, Haste |
| Seer | +2 | -3 | +8 | -4 | Foresight, Starlight | Glamour, Shadowstep |
| Restorer | -3 | +3 | 0 | +8 | Restoration, Shape | Ward, Attune |
| Illusionist | -4 | -6 | -2 | -4 | Glamour, Hush | Foresight, Shadowstep |
| Envoy | 0 | +8 | +3 | 0 | Attune, Glamour | Haste, Restoration |
| Warden | 0 | -2 | +5 | 0 | Ward, Shadowstep | Hush, Shape |

This is a deliberately small kit: four learned spells, with ordinary actions covering missing capabilities. Signature does not mean exclusive; support spells and all-spells mode allow cross-discipline tests.

## 5. Shared resolution and resource rules

### 5.1 Checks

```text
successPercent = cap(50 + 2.5 × (actingSkill - defence) + modifiers, 8, 92)
```

Combat defence is the defender's `(arcana + vigor)/2`. Negotiation argument defence is the audience's `(charm + guile)/2`. Audience response checks specify their own compared skills below. Retain fractional percentages; do not round before comparing a tape draw.

Bonuses and penalties are percentage points unless labelled otherwise. Total situational modifiers are capped to ±20 points. Rank does not raise a spell's check odds automatically; it changes cost and effect. **No passive bonus for merely knowing spells**: the main engine's +3-per-relevant-spell modifier must not be added on top.

### 5.2 Basic actions and optional mana

Every basic action costs **zero mana by default**, though some spend other resources as listed below. A tested basic action may optionally use **Focus: spend `3 × manaCostScale` mana for +10 percentage points on that action's check**. This is an optional expenditure, not a learned spell or a prerequisite. Untested actions cannot buy an irrelevant boost. A player with zero mana still has usable basic actions, including a costless exit.

Normal casting pays its spell cost instead; Focus cannot be purchased on top of a spell in this draft. Casting replaces the basic action for that exchange. No passive mana recovery, channel-to-refill action, free extra turn, or entry refill exists.

Validate learning, action selection and affordability before committing. Invalid inputs spend nothing and do not advance the exchange. A legal but ineffective cast spends mana and time normally. Costs never become negative, and an interrupted legal cast is not refunded.

For economy review, report gross spending, in-game restoration, rebates and final net losses separately for every resource. Report both `grossManaSpent / (10 + arcana/10)` and `netManaLost / (10 + arcana/10)` as **months of natural regeneration equivalent**. These values are diagnostics, not waiting rules. Never use the post-game rebate as spendable mana during play.

### 5.3 Universal spell access

Every learned spell appears in both games, regardless of fixture, role or usefulness. Only learning and insufficient mana prevent casting. Targets or purposes with no defined effect use the fallback: **pay cost, consume action, change nothing**, with an explanation. Spell ranks never remove an application; they change its scale.

Negotiation additionally resolves explicitly hostile or coercive purposes as immediate failure **after payment**. For example, Flame aimed at the audience burns the negotiation; Flame aimed at an approved brazier can demonstrate competence. Never hide the former option or silently redirect it to the latter. Show its consequence before commitment.

Natural-language improvisation is outside the first implementation. Use the named applications below plus `cast anyway / no useful target`. This makes standalone outcomes reproducible without an LLM judging prose.

### 5.4 Duration, stacking and consumption

Let `b = spellRank - 1` (0, 1 or 2). Unless a row says otherwise, a prepared effect lasts through the end of the **next** exchange, is consumed by its first applicable event, and cannot stack with itself; recasting replaces it. An irrelevant event does not consume it. Focus bonuses from preparation do not stack: use the larger applicable bonus.

Resolve damage reductions in this order: spell-specific reduction, Guard/Barricade, Rhythm, Decoy, Evasion, Ward. Clamp final damage at zero. Consume only reductions that encounter positive incoming damage at their stage. Successful hits can therefore do zero final damage. Apply a hit's extra condition only if its final damage is positive.

### 5.5 Health, Mood and Renown

Health is combat's defeat meter, replacing the separate Poise meter in the tentative design. All combat damage, recovery, protection and Haste fatigue values in §7 are **base units multiplied by `combatScale = 3`**, after their listed arithmetic. This keeps a standard 70-Health bout near the original small-meter length. A 6-damage Strike means 18 actual Health; a Ward I absorbs 24 actual Health. No other numbers, skill values or check modifiers receive this multiplier.

Both participants track Mood and Renown too. Mood represents effort and composure; while Mood is below 20, tested actions have -10 percentage points. Mood zero ends participation: combat defeat, or negotiation closure as described in §8. Costs in the action tables are paid on commitment even if the action fails. A cast normally costs Mana only; Haste fatigue and visible Glamour consequences are explicit exceptions.

Renown is an existing reputation reserve, not a new authority stat. It can be spent on a visible commitment: optional **Stake** on a tested basic action costs 4 Renown and adds 2 to successful damage base units (combat) or Agreement credit (negotiation). No added effect on failure and no change to odds. In combat the commitment is a public challenge; in negotiation it is staking your standing behind the claim. It is available only if the setup says `publicStakes: true` (default both fixtures). A private context can turn it off. Declare it together with the basic action; no extra action is granted. Focus and Stake can coexist if affordable. Renown otherwise changes only through listed costs/penalties, never merely because the caster used an umbral spell.

Restoration and ordinary recovery can restore Health only up to that participant's **entry Health**, not 100. Compose/Rally/Attune self-calming similarly cap at entry Mood. Thus these prototypes can recover their own encounter losses but cannot be used to heal pre-existing campaign damage or farm a resource. This is an explicit testing restriction to revisit separately if campaign healing is later desired.

Settle results using raw encounter state **before** any rebate. Returning Health after defeat cannot change defeat into victory. Main-game zero-resource hooks must not run on a speculative preview or provisional encounter debit; eventual integration must apply the settled transaction and then evaluate hooks, rather than silently queueing a collapse that the rebate already reversed.

### 5.6 Context rebates: one settlement, no profit

Choose and print a context before play; each ratio can be overridden independently in [0, 1]. Reject invalid values rather than clamping them silently. These are preliminary context presets:

| Context | Health | Mood | Renown | Mana | Crowns |
|---|---:|---:|---:|---:|---:|
| `real_conflict` (default negotiation) | 0.50 | 0.50 | 0.50 | 0.50 | 0 |
| `practice_duel` (default combat) | 0.80 | 0.80 | 0.80 | 0.80 | 0 |
| `public_duel` | 0.80 | 0.80 | 0.20 | 0.80 | 0 |
| `rehearsal` | 0.80 | 0.80 | 0.80 | 0.80 | 1.00 |

Crowns normally represent a real transfer and remain spent. The rehearsal preset explicitly treats its concession as a mock transaction. `real_conflict` is a resource-context label; the combat fixture is still a standalone sparring model, not a newly implemented lethal combat system.

For each participant and resource, save entry balance `B`, track actual gross debits `D` (including damage and penalties) and actual restoration `G`, and let pre-rebate balance be `C`. Positive recovery is capped at entry, and actual debits cannot exceed available balances. No reward income exists in this prototype.

```text
unrecoveredSpent = min(D, max(0, B - C))
refund = floor(rebateRatio × unrecoveredSpent)
finalBalance = min(B, C + refund)
netLoss = B - finalBalance
```

The rebate applies to **spending still unrecovered**, so an in-game heal is not refunded a second time. In this closed ledger `B - C = D - G`. Calculate each resource independently; unused Mana cannot refund lost Health. Integer flooring deliberately leaves fractional refunds unreturned. Ratio 0 means no rebate; ratio 1 returns all eligible unrecovered spending, never more than the entry balance.

Apply this exactly once after win, partial, loss, concession, withdrawal or timeout. Cancellation before the first commitment spends nothing. Save a settlement identifier/state so reloading, viewing results, or calling `finish` twice cannot grant a second refund. The configured ratios do not depend on victory, chosen archetype or difficulty. Report pre-rebate and final balances together; both determine whether a tactic was economical.

For consecutive bouts, carry the previous **settled** balances into the next entry ledger. Do not reset to standard budgets between them. A later bout cannot refund a preceding bout's losses. Changing rebate settings requires resetting the test, not editing an active ledger.

## 6. Proposed spell parameters

These are **base** costs. Actual cost is `baseCost × manaCostScale`, with a proposed starting scale of **3**. Many reuse a current spell's cost row; the broader Glamour and Restoration use the current 14/10/9 row rather than the cheapest merged component. Shape, Hush and Attune are provisional. Do not write these into the worldbook as part of this task. Test scales 1, 2 and 3 rather than assuming the larger costs are already balanced.

At scale 3, a Flame I costs 30 during the encounter. With no in-game Mana restoration, it leaves 15 net Mana spent under the 50% real-conflict rebate, or 6 under an 80% practice rebate. Entry balances determine affordability; the expected refund never does. Larger gross costs make casts a scarce tactical commitment, while separately tunable rebates determine the lasting day-to-day burden.

| Spell | Discipline | Mana I / II / III | Origin |
|---|---|---|---|
| Flame | Evocation | 10 / 9 / 7 | Existing |
| Tide | Evocation | 14 / 10 / 9 | Existing |
| Foresight | Astromancy | 10 / 9 / 7 | Existing |
| Starlight | Astromancy | 18 / 14 / 10 | Broadened present-time observation |
| Restoration | Alchemy | 14 / 10 / 9 | Proposed Mend + Purify merge |
| Shape | Alchemy | 14 / 10 / 9 | Proposed material shaping |
| Glamour | Illusion | 14 / 10 / 9 | Proposed Glamour + Mirror merge |
| Hush | Illusion | 10 / 9 / 7 | Proposed sound suppression |
| Haste | Beastcraft | 10 / 9 / 7 | Existing; preserve acting earlier, not the design table's conflicting “acts second” |
| Attune | Beastcraft | 10 / 9 / 7 | Proposed broadening of Beast-speech |
| Ward | Umbral | 14 / 10 / 9 | Existing |
| Shadowstep | Umbral | 18 / 14 / 10 | Existing |

Restoration cannot repair trust, restore mana or recreate lost information. Shape cannot create matter, change its substance or reshape living bodies. Glamour changes appearances, not compulsory beliefs. Attune permits communication with animals and immediate feelings/intentions with a willing person; it supplies neither secrets nor a truth test. Foresight forecasts committed next events, not minds or history. Ward prevents physical/magical harm, not criticism.

## 7. Combat: practice ring

### 7.1 Fixture and public state

Two consenting adults spar in a practice ring. The ring provides reshapeable wooden dividers, water-safe flooring and nearby shadows. Consent covers noncoercive Attune used to read the rhythm of the bout. No inventory, environmental damage simulation or lore is needed.

Public state: each side's current and entry Health, Mood, Renown and Mana, full generated skills and spell ranks, active effects and round number. Positions are only `near` or `far`; start near. This is one shared range, not a grid. Either participant moving away makes it far; an Approach or a Shadowstep toward makes it near. Shadowstep away takes precedence over Approach if both happen together.

The AI commits an action before the player chooses. In tells mode, reveal only its family: **physical** (Strike/Feint), **spell** (Flame/Tide/Starlight), **prepare** (other spells, Guard/Observe/Recover), or **approach**. The family is truthful. Open mode reveals the whole command. A Forecast reveals the whole command in the next exchange, including application and target; that command remains locked.

### 7.2 Exchange order

1. Commit the AI action; reveal the permitted tell. Show legal player actions, costs and known effect ranges.
2. Player commits. Deduct both sides' costs. If a participant's Health or Mood reaches zero through its own expenditure, it cannot prepare or attack; resolve defeat after the surviving participant's already committed action. Record starting range and initiative. Checks use Mood after costs; previews include this threshold crossing.
3. Resolve non-attacking preparations and range changes before attacks. Both participants get their preparation, even if an attack later defeats them. Recover/Restoration are also preparations.
4. Resolve attacks by initiative: higher Vigor first. A Haste prepared in the previous exchange outranks ordinary initiative; if both have Haste, compare Vigor. Remaining ties alternate: player first in odd exchanges, opponent first in even exchanges. Consume applicable Haste regardless of which action was chosen.
5. A participant reduced to zero Health cannot subsequently attack. Its previously paid cost is not refunded. Already resolved preparations remain resolved.
6. Check defeat, then expire effects (including Haste fatigue), check defeat again, and advance the exchange if still active. No regeneration. Concede instead exits immediately without the committed opponent action and goes straight to settlement.

Haste cast now affects initiative **next** exchange. Attack reach uses range after preparations. An out-of-range committed attack spends its action and cost but does not check or hit.

### 7.3 Basic combat actions

| Action | Check | Effect (combat base units) | Resource cost / tradeoff |
|---|---|---|---|
| Strike | Vigor vs combat defence | At near range: 6 damage on success, 2 on failure. | 2 Mood; predictable, stopped by Guard and Barricade. |
| Feint | Guile vs combat defence | At near range: 4 damage on success, 0 on failure; ignores Guard, but not other protection. A damaging success gives the opponent -10 points on its next attack check. | 3 Mood; less direct damage, useful against guarding. |
| Approach | None | Make range near. | 1 Mood; gives up an attack, opposing withdrawal can frustrate it. |
| Guard | None | Reduce this exchange's next incoming Strike by 4. | 1 Mood; does not stop Feint or spell attacks, expires this exchange. |
| Observe | None | +10 points on your next Strike or Feint check. | 1 Mood; no present protection or damage, no full intention reveal. |
| Recover | None | Restore 3 Health base units, capped at entry Health. | 4 Mood; opponent can attack, no Mana recovery. |
| Compose | None | Restore 4 actual Mood, capped at entry Mood. | No resource cost; gives up an attack and protection. |
| Rally | None | Restore 8 actual Mood, capped at entry Mood. | 4 Renown, public-stakes contexts only; uses an exchange. |
| Concede | None | End immediately as `lose`, then settle rebates. | No resource cost; preserve remaining resources. |

Strike and Feint accept optional Focus and Stake. Optional **Exert** spends 4 actual Health to add +10 points to a tested basic action. Exert and Focus do not stack; choose at most one. It is bodily exertion, not a spell. All optional costs are paid on commitment and cannot reduce a balance below zero. Costed actions are unavailable when unaffordable, but Compose and Concede remain legal at positive Health/Mood; no spell or narrative clue is required to keep playing.

### 7.4 Combat spell applications

All spell attacks use Arcana vs combat defence and reach both ranges. All other applications are automatic, consume the action and use normal duration unless stated otherwise.

| Spell/application | Effect |
|---|---|
| Flame: attack | 8+b damage on success, 2 on failure. Ignores Guard; destroys an opposing Barricade before damage reductions, even on a failed check. Does not ignore Ward. |
| Tide: surge | 5+b damage on success, 1 on failure. A damaging success makes the target Wet: reduce the next Flame damage hitting that Wet target by 3+b before other protection, regardless of caster. |
| Foresight: forecast | Reveal the opponent's full committed next action; +10 points on your next attack check. Does not force the AI into a different action. |
| Starlight: expose | Remove the opponent's Decoy; then attack for 4+b on success, 1 on failure. Removing the Decoy does not require the check. |
| Restoration: recover | Restore 6+b Health base units, capped at entry Health; alternatively remove your Wet effect. These represent physical recovery/cleanup, not repaired confidence. |
| Shape: barricade | Create a Barricade reducing your next incoming Strike by 8+b. It does not reduce Feint or spell damage; Flame destroys it. |
| Glamour: decoy | Create a Decoy reducing your next incoming attack's damage by 4+b. Starlight removes it. |
| Hush: disrupt | Give the opponent Suppressed: reduce its next offensive spell's incoming damage to its target by 4+b before other protection. It remains legal to cast. No effect on basic attacks or prepared spells. |
| Haste: quicken | Gain next-exchange Haste initiative. At its expiry, take 2 Health fatigue, ignoring protection. If fatigue defeats you after both attacks, resolve defeat then. |
| Attune: rhythm | +10 points on your next Strike or Feint, and reduce your next incoming Strike by 3+b. Rhythm's bonus and protection are consumed separately. Alternatively self-calm to recover 6+b actual Mood, capped at entry Mood. Choose one application. |
| Ward: protect | A Ward absorbs up to 8+b damage from the first attack that reaches it, then disappears; unused capacity is lost. |
| Shadowstep: reposition | Choose near or far and gain Evasion reducing your next incoming attack by 3+b. Does not grant an extra attack. |

Wet, Suppressed and Feint's penalty also expire at the end of the next exchange if unused. A failed attack still applies its listed failure damage, but not a damaging-success condition. Foresight and Attune do not stack with Observe or purchased Focus beyond the larger +10 bonus. Multiple different protection effects can coexist under §5.4, at the cost of the actions required to prepare them.

### 7.5 Combat result

- A participant is defeated at zero Health **or** zero Mood. Opponent alone defeated: `win`; player alone defeated: `lose`; both defeated in the same exchange: `partial`.
- After exchange eight, with both still standing, compare **fraction of entry Health remaining**, not raw Health when budgets differ. Let `lead = playerHealth/playerEntryHealth - opponentHealth/opponentEntryHealth`. Result is `win` at lead at least 0.25; otherwise `partial` at lead greater than -0.25 **and** opponent current Health at most 0.75 of its entry value; otherwise `lose`.

There is no second final check. Timeouts should be logged separately: healing/defence must not become an effortless route to the same reward as a decisive victory. A partial result's academy reward is not specified here.

### 7.6 Combat AI

For each archetype use the repeating three-family cycle below, rotated by its generated `cycleOffset`. Round one uses the rotated first entry. State priorities can override the family.

| Archetype | Cycle | Attack candidates, in preference order | Preparation candidates, in preference order |
|---|---|---|---|
| Evoker | attack, attack, prepare | Flame, Strike, Tide, Feint | Ward, Haste, Observe |
| Seer | prepare, attack, attack | Starlight, Feint, Strike | Foresight, Glamour, Shadowstep away |
| Restorer | prepare, attack, attack | Strike, Feint | Restoration, Shape, Attune, Ward |
| Illusionist | prepare, attack, attack | Feint, Strike | Glamour, Hush, Foresight, Shadowstep away |
| Envoy | prepare, attack, attack | Strike, Feint | Attune, Glamour, Haste, Restoration |
| Warden | prepare, attack, attack | Strike, Feint | Ward, Shape, Hush, Shadowstep toward |

Apply overrides in this order:

1. If Mood is below 20, use Rally when allowed/affordable and missing at least 8 Mood; otherwise Compose. If Health is at most `combatScale × (8 - temperament)`, choose affordable Restoration when missing at least `combatScale × (6+b)` Health; otherwise Recover if affordable, else Compose. Do not run these recovery overrides on exchange eight.
2. If far and the cycle calls for attack, choose affordable Shadowstep toward if known; otherwise Approach.
3. For an attack family, discard unreachable/unaffordable candidates. Prefer Starlight against a Decoy, Flame against a Barricade, or Feint against Guard used in the **previous** exchange. These override preferences may use only resolved public state, not the player's current choice.
4. For a preparation family, discard unaffordable actions, Restoration without sufficient missing Health, effects already active, Shadowstep away when already far, and Hush if the opponent has no learned offensive spells. Choose affordable Guard if there are no candidates; otherwise Compose.
5. Among remaining ordered candidates, let `n = min(candidateCount, 1 + temperament)` and choose index `floor(n × tapeSlot3)`. If no attack candidate remains, choose affordable Observe, otherwise Compose. This AI buys neither Focus, Stake nor Exert in draft 0.1; availability is identical, and that policy asymmetry is explicit for review.

Priority choices in steps 1–3 are deterministic and use no extra draws. The AI never has cheaper spells, hidden resources, extra turns or access to the player's uncommitted choice. These cycles are intentionally simple policies for refinement, not a claim of intelligent optimal play.

## 8. Negotiation: agreement under pressure

### 8.1 State and fixtures

Only the player seeks an agreement. Track:

- Agreement `A`: starts 0, floor 0; full success threshold 18, partial threshold 10.
- Patience `P`: starts 8, floor 0; normally falls by 1 each exchange.
- Suspicion `S`: starts 0; reaching 6 fails the negotiation.
- Player mana and crowns; audience mana; active preparation; a list of outstanding bluff credits.

Also track each participant's Health, Mood and Renown using §5. Player basic actions spend Mood; optional Exert risks Health, optional Stake spends Renown, and discovered deception can damage Renown. The audience pays its own response costs. Neither side can coerce agreement by reducing the other to zero Health; hostile injury ends the negotiation as a player loss.

All six generated skills and all spell ranks are public. The audience's preferred approach is public: Evoker/Restorer/Seer prefer Reason; Envoy/Illusionist prefer Appeal; Warden prefers Offer. A preferred successful Reason/Appeal gains +1 Agreement; the preferred Offer gains +1. No hidden preference can be discovered through dialogue.

| Fixture | Printed setup and permissions | External events |
|---|---|---|
| `workshop_request` (default) | Persuade an adult supervisor to grant one workshop session. A brazier, water vessel, bent brace and torn diagram permit harmless demonstrations. Cosmetic Glamour and willing Attune are allowed. One paid concession is acceptable. | Exchange 3: loose materials scatter, costing 2 Agreement unless protected/secured. Exchange 5: background noise costs 2 Agreement unless quieted. |
| `formal_petition` | Persuade an adult official to grant an appointment. Harmless demonstrations are not relevant; Attune consent is absent. Cosmetic Glamour is permitted but conspicuous. A posted processing concession is acceptable. | No physical hazards or background interruption. |

These are synthetic test situations, not new academy encounters or dialogue clues. All relevant material conditions and the event schedule are visible from the beginning. Display the request, approach preference, consent, demonstration permission, costs and upcoming external events on one setup sheet.

Every learned spell remains castable in either fixture. A fixture can make a cast ineffective or disastrous; it cannot remove it from the menu.

### 8.2 Exchange order

1. Audience commits its response using §8.6. Display its family: listen, question, object, prepare or hurry. Full intention is shown when Forecast applies.
2. Player commits and pays costs. Audience pays any spell and response cost. If the player's Health or Mood becomes zero through expenditure, end as lose and settle; its action does not resolve. An exhausted audience cannot respond. The audience's current preparation, if any, takes effect **after** this exchange's player action, for a later exchange. Checks use current Mood after payment.
3. Resolve the player's action or cast using tape slot 1 if tested. Resolve immediate coercion/damage failure before anything else.
4. Resolve this exchange's external event. Then resolve the committed audience response, using tape slot 2 if tested.
5. Subtract 1 Patience, unless a previously prepared player Haste waives this one base loss. Audience Hurry still applies its extra loss. Consume Haste on the next player action, including another cast; it does not sustain a casting loop indefinitely.
6. If player Health/Mood is zero or Suspicion is at least 6, `lose`, even if Agreement reached 18. Otherwise if Agreement is at least 18, `win`. Otherwise if Patience is zero, audience Mood is zero, or exchange eight ended, `partial` at Agreement at least 10, else `lose`. Resolve the result before rebates.
7. Expire preparations and advance. No mana regeneration.

A successful bluff does not end the exchange before scrutiny can happen. No second check follows an established result. Explicit Close/Withdraw ends immediately after paying its normal action cost (zero mana), before the audience response.

### 8.3 Basic negotiation actions

| Action | Check | Effect | Resource cost / tradeoff |
|---|---|---|---|
| Reason | Lore vs argument defence | Success +4 Agreement, failure +0; preferred approach adds +1 on success. | 2 Mood; depends on knowledge, consumes time. |
| Appeal | Charm vs argument defence | Success +4 Agreement, failure +0; preference adds +1 on success. | 3 Mood; depends on presentation, consumes time. |
| Bluff | Guile vs argument defence | Success +6 Agreement and +1 Suspicion; failure +0 Agreement, +2 Suspicion and lose 3 Renown. Successful credit becomes an outstanding claim. | 4 Mood; higher progress, scrutiny and reputation risk. Forced penalties debit only the available Renown. |
| Offer | None | Once per encounter, spend 8 crowns for +5 Agreement (+1 if preferred). | 1 Mood plus crowns; guaranteed progress, cannot repeat-buy success. If unaffordable/already used, explain and keep other actions available. |
| Prepare | None | +10 points on the next Reason, Appeal or Bluff check. | 1 Mood; spends an exchange without progress, no clue discovery. |
| Reassure | None | Reduce Suspicion by 1, minimum 0. | 2 Mood; cannot prevent a later caught claim from raising suspicion. |
| Retract | None | Remove the oldest outstanding claim, lose its credited Agreement and reduce Suspicion by 1. With no claims, no effect. | 1 Mood; sacrifice risky progress before scrutiny. |
| Compose | None | Restore 4 Mood, capped at entry Mood. | No resource cost; no progress, consumes time/Patience. |
| Close / Withdraw | None | At Agreement at least 18: win; at least 10: partial; otherwise lose. | No resource cost; bank a result and settle rebates. |

Reason, Appeal and Bluff accept optional Focus, Stake or Exert (4 Health for +10 check points, no combat multiplier). Focus and Exert cannot stack; Stake can accompany either. A claim stores the **actual positive Agreement credit** from that successful Bluff, including spell/Stake bonuses. Removing it subtracts that credit from current Agreement, floored at zero; it is not historical accounting of which later objection removed which points. This simplification is explicit for prototype review.

### 8.4 Negotiation spell applications

Automatic unless explicitly stated. Normal preparation duration applies. A harmless demonstration can award `3+b` Agreement **only once per encounter across all spells**, and only in the workshop fixture. Mark `demonstrationUsed`; subsequent demonstrations still cast but add no Agreement. This is a shared budget, not a spell-by-spell farming opportunity.

| Spell/application | Effect and consequence |
|---|---|
| Flame: demonstrate | Approved brazier: harmless demonstration credit. Audience, papers or property: immediate lose. No relevant approved target: ineffective cast. |
| Tide: demonstrate | Approved water vessel: demonstration credit. Flood/drench the audience or damage papers: immediate lose. |
| Foresight: forecast | Show the full committed next audience response; +10 points on your next tested basic action. Gives no claim verification or private knowledge. |
| Starlight: inspect | Remove audience Authority (a Glamour preparation). In the workshop, alternatively illuminate the diagram for demonstration credit; choose one purpose. No automatic exposure of lies. |
| Restoration: repair | Repair the workshop diagram for demonstration credit. Alternatively restore `3 × (6+b)` of the player's Health lost in this encounter, capped at entry Health, in either fixture. No Agreement or Suspicion repair and no combat-only multiplier applied a second time. |
| Shape: secure | Permanently secure workshop materials against the scattering event; alternatively reshape the brace for demonstration credit. Choose one purpose. No living targets. |
| Glamour: present | Add 2+b to the Agreement credit of your next successful Appeal or Bluff; consume on that action even if it fails. Immediately add 1 Suspicion and lose up to 2 available Renown because the cosmetic magic is visible. A fabricated proof or coercive enchantment is immediate lose. Zero Renown does not prevent casting. |
| Hush: quiet | Protect against the workshop's background-noise event. Does not suppress an audience objection. Deliberately silencing the audience is coercion and immediate lose; private quiet in the formal fixture has no numerical effect. |
| Haste: quicken | Waive the next exchange's base 1 Patience loss. Round cap still applies; no extra action. It does not waive Hurry, and recasting cannot stack the waiver. |
| Attune: connect | With printed consent: add 2+b to the next successful Reason or Appeal; consume on that action even if it fails. Without consent, ineffective and +1 Suspicion. Alternatively self-calm to restore 6+b Mood, capped at entry Mood, without needing audience consent. No compulsory agreement or truthful-claim guarantee. |
| Ward: protect materials | Protect workshop materials from the scattering event. Does not protect against an objection or scrutiny. No appropriate threat in the formal fixture: ineffective. |
| Shadowstep: withdraw | Immediately close at current Agreement thresholds, with its mana cost paid; leave through an available nearby shadow. Both fixtures provide a doorway shadow. Stepping toward/behind the audience to intimidate: coercion and immediate lose. |

Glamour and Attune bonuses do not stack on the same argument: use the larger and consume both applicable preparations. Foresight/Prepare/Focus use the larger +10 check bonus. A bonus credits the same Bluff claim if it helped that Bluff. A demonstration consumes an action and incurs the normal audience response and patience loss; it is not free evidence.

This intentionally leaves some spells poor in some negotiations. They are still available. In particular, a physical protection spell cannot become a generic resistance to criticism just to equalize its usefulness.

### 8.5 Audience responses

| Response | Effect and audience cost |
|---|---|
| Listen | No additional loss and no resource cost. The player still pays the base Patience loss. |
| Objection | Spend 2 Mood; check audience Lore vs player Charm. Success removes 2 Agreement, failure removes 0. |
| Scrutinize | Spend 2 Mood; if a claim exists, check audience Lore vs player Guile. Success removes the oldest claim's credit, adds 2 Suspicion and removes up to 4 of the player's available Renown; failure changes nothing. With no claim, no effect. Uses the claim list after the player's action. |
| Hurry | Spend 3 Mood; lose 1 additional player Patience. Audience can use it at most twice per encounter. |
| Foresight: anticipate | Pay scaled Foresight Mana cost. Next player tested basic action faces +4 defence; expire after next exchange. No mind-reading or automatically caught claim. |
| Glamour: authority | Pay scaled Glamour Mana cost. Next player Appeal faces +4 defence; expire after next exchange. Starlight can remove it. |

Anticipation and Authority do not stack: use the larger +4 defence. Both consume when applicable even if the action fails. Other learned audience spells remain technically available, but the first AI does not choose applications with no strategic effect. The interface must not implement that policy as a spell whitelist.

### 8.6 Audience AI

Use these three-response cycles, rotated by the generated `cycleOffset`. No text inference or additional random rolls occur.

| Archetype | Cycle |
|---|---|
| Evoker | Objection, Hurry, Listen |
| Seer | Scrutinize, Foresight: anticipate, Objection |
| Restorer | Objection, Listen, Listen |
| Illusionist | Glamour: authority, Scrutinize, Objection |
| Envoy | Objection, Listen, Hurry |
| Warden | Scrutinize, Objection, Listen |

Before committing a response, apply these state overrides in order:

1. If at least one outstanding claim exists and either `claimCount >= 2` or temperament is 0, use Scrutinize.
2. Otherwise, if Agreement is at least `14 + temperament` and the cycle entry is Listen, use Objection.
3. Otherwise use the cycle entry. If an action is unaffordable or its spell preparation already active, use Listen. If Hurry has already been used twice, use affordable Objection, otherwise Listen. Scrutinize with no claim remains a valid questioning intention; a new claim made this exchange can be scrutinized. The audience does not purchase optional Focus/Stake/Exert in this draft.

All choices depend on state from the previous resolved exchange. The committed response cannot change after seeing the player's action. The audience is allowed to be receptive: its objective is not to “kill” the player's Agreement meter using combat-style attacks. Archetypes represent different resistance styles and vulnerabilities.

## 9. Worked resolution examples

These are explicit arithmetic states, **not claimed outputs of the seeded kit generator**.

### 9.1 Combat: Flame against Guard and Ward

In a later near-range exchange, attacker Arcana is 50, defender combat defence is 50, attacker knows Flame II and has 12 mana. Defender has a Ward I from the previous exchange and commits Guard. No other modifiers apply.

- Flame costs 9 mana; attacker has 3 left.
- Success odds are 50%. With player slot 1 equal to 0.40, it succeeds.
- Flame II deals 9 damage and ignores Guard.
- Ward I absorbs 8 and disappears. Defender loses 1 Health.
- Guard expires this exchange. The attacker did not buy Focus on a spell.

Without Ward, Guard alone would have stopped none of the 9 damage. A Feint would also ignore Guard but would still meet Ward.

### 9.2 Negotiation: a bluff caught before agreement

Player starts an exchange with Agreement 13, Suspicion 3 and Patience 3. The audience has already committed Scrutinize. Player Guile and audience argument defence are both 50; audience Lore is 50 too. No spell preparations apply.

- Player Bluffs. At 50% odds, slot 1 of 0.20 succeeds: Agreement becomes 19, Suspicion becomes 4, claim credit is 6.
- The encounter has not ended yet. Audience slot 2 of 0.30 succeeds at its 50% scrutiny check.
- Remove the claim: Agreement returns to 13. Suspicion becomes 6.
- Base Patience falls to 2. Suspicion takes precedence: result is lose.

The player saw a questioning tell, could forecast an exact response beforehand, or could have chosen a safer action. No dialogue clue was needed to resolve the lie.

### 9.3 Negotiation: bank a partial result

Player has Agreement 11, Suspicion 2, Patience 2, mana 4 and crowns 6. Offer is unaffordable; several spells are unaffordable. Close is still available and produces partial immediately without additional expenditure. Zero mana never prevents Reason, Appeal, Prepare, Reassure, Retract or Close.

## 10. Standalone interface and records

Before an action, show its cost, check odds if any, direct success/failure effects, current public modifiers, known incoming family, and explicit catastrophic consequences. Hidden intentions produce labelled conditional previews, not fabricated exact outcomes. Open mode and Forecast allow more exact previews. Preview must never consume random tape values.

Record a compact setup sheet and one row per exchange:

```text
setup: rulesVersion, selected levels/archetypes, fixture, visibility,
       all budget/access overrides, generated skills/spell ranks,
       generation draws and AI temperament/cycle offset
exchange: committed AI command, shown tell, player command/target,
          costs, compared skills, modifiers, odds, used tape slots,
          resulting effects and state, result if terminal
summary: outcome, decisive/timeout/withdrawal reason, exchanges,
         mana/crowns spent, remaining resources, regeneration equivalent
```

Proposed future module boundary (not an existing API):

```text
createSetup(configuration) -> immutable kits + fixture + random tape
legalActions(state, actor) -> actions, costs, applications, warnings
preview(state, command) -> odds and conditional effect ranges
resolveExchange(state, playerCommand) -> state + exchange record
finish(state) -> {outcome, spent, remaining, notes, log}
```

Combat AI and audience AI must commit before `legalActions`/`preview` runs for the player. A reset rebuilds the same matchup; a level change builds a different deterministic matchup. Do not reset resources midway through a consecutive-bout test.

## 11. First test plan and review questions

### 11.1 Narrow implementation checks, when implementation is authorized

1. Generate each archetype at every integer level 1–100 twice; compare complete kits. Check all skills/ranks/budgets in bounds and both reference skill-pair means equal level.
2. Verify default combat kits are identical, including support ranks and budgets. Negotiation uses distinct role rules even when templates match.
3. Replay identical command sequences; require identical states, logs and outcomes. Preview/open-mode changes must not change tape or committed AI commands.
4. With all-spells access, attempt all twelve spells in each fixture, including ineffective/coercive applications. Require explicit outcomes and correct costs; only learning/mana gates are allowed.
5. Test zero-mana starts, unaffordable Offer, eight-exchange expiry, simultaneous fatigue defeat, suppression without spell disabling, and Suspicion taking precedence over Agreement.
6. Assert previews contain actual outcomes, no resource becomes negative, no heal exceeds Health cap, one shared demonstration credit and one Offer maximum.
7. Test intentional one-level differences, especially 35/36 and 70/71. Record rank discontinuities rather than claiming strictly monotonic difficulty for every neighbouring level.

### 11.2 Small human test matrix

First compare all six mirrored combat archetypes at level 50 with standard mana. Then repeat at levels 20 and 80 to see whether progression changes decisions. For negotiation, try a level-50 Envoy and Illusionist against all six level-50 audiences, in both fixtures. This is a proposed test schedule, not completed testing.

For a local difficulty sweep keep the player fixed and compare opponent levels 45, 49, 50, 51 and 55. Use manual or predeclared policies: direct basic actions, cautious preparation, aggressive spell spending, and economy-first play. Include a few cross-archetype combat matchups after the mirror baseline.

Look for decisions that change with incoming threats and resource budgets; count dominant actions, ineffective casts, unused spells, timeouts, repeat healing loops and mana remaining. Report success together with expenditure. The design's +10–15-point advantage over auto-resolution is a later empirical target, not something this draft establishes. Do not tune to it using unlike resource budgets or by double-counting spell knowledge.

### 11.3 Decisions to refine before building games

- Is eight exchanges the right length, or should partial closure happen earlier?
- Is the one-slot action economy sufficient, especially for costly information spells?
- Does standard 30 mana make three or fewer casts interesting, or simply discourage the expensive spells?
- Are Guard/Feint and Barricade/Flame distinctions clear without a full stance system?
- Does Attune retain a believable boundary, particularly in consensual sparring?
- Should Haste's combat fatigue be a local Health cost or a later campaign resource cost?
- Is negotiation's prepared-bonus model tactically distinct enough from simply buying better odds?
- Is temporary Bluff credit plus later scrutiny useful without dialogue, or too abstract?
- Should physical negotiation fixtures be central, occasional, or removed after testing?
- Are the twelve proposed spells preferable to testing the existing roster first?

All values and these choices remain open. Refine this rulebook before implementing testplay games. Event authoring, canon migration, engine integration and campaign balance are separate subsequent work.
