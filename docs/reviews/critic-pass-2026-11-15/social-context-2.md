# Critic context packet: between-known and between-stories

Scope: read-only context for `content/events/between_known_2.grim` (P4-04) and `content/events/between_stories.grim` (P4-05). This packet records source facts and wiring only; it makes no compliance or quality judgments. Line references are to the current working tree.

## Event IDs and gates

### `between_known_2.grim`

All events inherit from `@pool between` or `@pool between_once` in [`content/events/between.grim`](../../../content/events/between.grim:11): both are `trigger: social`, `class: routine`, `tags: social between`, `weight: 1`; `between` additionally has `repeat: 8`, while `between_once` has no repeat declaration. The latter's comment explains the event-level `seen(id) == 0` pattern and per-character once behavior. These pools provide no cast/character eligibility themselves.

Each card has a named NPC role (`seraphine`, `tobias`, `maud`, `thorne`, or `isolde`) constrained by `met(npc) and around(npc)`, and `per:` that same role; the second role `o` is `any where classmate_here(o)` with the stated relationship threshold. Per-event gates:

| Event | Source lines | Additional cast / `when` gate | Explicit time/slot |
|---|---:|---|---|
| `seraphine_between_warning` | 9–17 | `rel(o) >= 4`; unseen | — |
| `seraphine_between_sentences` | 31–38 | `rel(o) >= 6 and not at_odds(seraphine,o)` | — |
| `tobias_between_sayings` | 54–62 | `rel(o) >= 0 and not get_along(tobias,o)`; unseen | — |
| `tobias_between_supper` | 82–90 | Tobias `rel(tobias) >= 6`; `rel(o) >= 4 and not at_odds(tobias,o)` | `time: evening` (line 90) |
| `tobias_between_sulking` | 105–113 | `rel(o) >= 4 and not at_odds(tobias,o)`; `term and not wrapup`; unseen | — |
| `maud_between_soup` | 130–138 | `rel(o) >= 4`; unseen | — |
| `maud_between_beans` | 152–160 | `rel(o) >= 4`; unseen | — |
| `maud_between_advice` | 181–189 | `rel(o) >= 6`; unseen | — |
| `thorne_between_hard` | 205–213 | `rel(o) >= 6`; `term and not wrapup`; unseen | — |
| `thorne_between_flattery` | 233–241 | `rel(o) >= 4`; `term and not wrapup`; unseen | — |
| `isolde_between_remembers` | 256–264 | `rel(o) >= 4`; unseen | — |
| `isolde_between_complaint` | 277–285 | `rel(o) >= 8`; `term and not wrapup`; unseen | — |

`time: evening` is a scoring preference: design/language docs say a matching time multiplies weight (3x) and a mismatch reduces it (0.3x). A `slot:` property is a slot restriction. Neither of these two files sets `slot:`. References: [`docs/grimoire-script.md`](../../grimoire-script.md:560), specifically the day slot/time scoring paragraph; the `time:` property is at `between_known_2.grim:90`.

### `between_stories.grim`

The three thread definitions use `from: story`; the story template defines `with: begun=flag(...)`, and its inherited step pool has `when: $begun` ([`content/core/templates.grim`](../../../content/core/templates.grim:10)). Each thread has `class: story`, `repeat: 1`, and its start event is declared in `members: start ...`.

| Thread / member | Source lines | Gate / cast / progression |
|---|---:|---|
| `bram_corvin_feud` / `feud_ledger_war` | 10–29, 31–51 | Start: `met(bram) and met(corvin) and around(bram) and around(corvin) and term and turn >= 4 and not flag(feud_begun)`; `trigger: social`, `actor: corvin`. Start option 1 sets `feud_begun` and queues `feud_ledger_gone in 1`; option 2 walks away and does not begin the thread. Thread resolution is `feud_truce or feud_cold`. |
| same / `feud_ledger_gone` | 53–74 | Queued step; reads `knows(corvin.last_warning)` in conditional prose; either choice queues `feud_vault within 1..2`. |
| same / `feud_vault` | 76–104 | Queued step; `defer: not (around(bram) and around(corvin))`; all three outcomes set a branch flag and queue `feud_end in 1`. |
| same / `feud_end` | 106–131 | Queued step; reads pair `npc_rel(bram, corvin) > -20`; writes `feud_truce` or `feud_cold`; these resolve the thread. |
| `tobias_mir` / `tm_watering_engine` | 135–154, 156–176 | Start: `trigger: social`, `actor: tobias`; `met(tobias)`, `met(mir)`, both `around`, both `fancy_free`, `turn >= 5`, `not flag(tm_begun)`. Choice 1 begins thread and queues `tm_invitation within 1..2`; choice 2 leaves. Resolution is `tm_together or tm_friends`. |
| same / `tm_invitation` | 178–204 | Queued step; both must still be `fancy_free`; `defer: season == "winter"`; choices queue `tm_misread within 1..2`. |
| same / `tm_misread` | 206–231 | Queued step; choices queue `tm_end within 1..2`; the challenge has win/lose outcomes. |
| same / `tm_end` | 233–261 | Queued step; `defer: season == "winter" or not (around(tobias) and around(mir))`; tests pair `npc_rel(tobias, mir) >= 30`, writes `tm_together` or `tm_friends`, resolving thread. |
| `study_circle` / `circle_founded` | 265–307, 285–307 | Start at `place: library`, `time: evening`; cast `o: any where classmate_here(o) and rel(o) >= 10`; `term and not wrapup and turn >= 3 and not flag(circle_begun)`. Choice 1 begins thread and queues `circle_newcomer within 1..2`; choice 2 does not begin it. |
| same / `circle_newcomer` | 309–331 | Queued step; cast `n: any where classmate_here(n) and rel(n) <= 5`; `when: term`; choices set `circle_open`/`circle_closed`, both queue `circle_exam_night within 1..2`. |
| same / `circle_exam_night` | 333–365 | Queued step; cast `w: any where classmate_here(w) and rel(w) >= 4`; `when: term`; `defer: not (month == 4 or month == 10)`; every outcome queues `circle_last within 2..4`; challenge lose sets `circle_split`, other paths set `circle_held`. |
| same / `circle_last` | 367–383 | Queued step; either choice sets `circle_done`, resolving thread. |

All `time: evening` declarations above (the circle start at line 288 and Tobias supper at the other file's line 90) are time preferences, not slot gates. No event in these two files declares `slot:`. `defer:` means a pushed card remains held while its condition holds (language guide §9; the exact conditions are listed above).

## Worldbook facts and voice context

Critic workflow says to read voices and facts for every speaking character. The cast voices are at [`content/world/cast.grim`](../../../content/world/cast.grim): Seraphine line 72; Tobias 51; Corvin 94; Mir 118; Bram 184; Thorne 206; Maud 228; Isolde 250. Condensed direct voice descriptors: Seraphine speaks in half-sentences and may be exact about the future; Tobias is warm/slow/earnest, uses farm sayings, over-apologizes; Corvin teases and deflects with jokes, calling the player “saint”; Mir is fast, technical, enthusiastic, and says “probably”; Bram is officious and rule-quoting, gruff when honest; Thorne is terse/precise and allergic to flattery; Maud is folksy/sharp, uses “dearie,” with advice understood later; Isolde is pleasant/unhurried, placing words deliberately.

Surface-tier facts (original `text:` and source refs; none declares an `unlock:`):

| NPC / fact | Original worldbook text |
|---|---|
| Seraphine / `seraphine.seer` ([facts file](../../../content/world/facts/seraphine.grim:3)) | “A seer who speaks in half-sentences and is unsettlingly often right.” |
| Tobias / `tobias.scholarship` ([facts file](../../../content/world/facts/tobias.grim:3)) | “A farmer's son on a turnip scholarship, built like a barn door and gentle as a lamb.” |
| Tobias / `tobias.plants` ([facts file](../../../content/world/facts/tobias.grim:7)) | “He talks to plants. Worryingly, they seem to answer.” |
| Corvin / `corvin.locks` ([facts file](../../../content/world/facts/corvin.grim:3)) | “Knows every locked door in the academy and owes money to at least three people.” |
| Mir / `mir.artificer` ([facts file](../../../content/world/facts/mir.grim:4)) | “An artificer who smells of solder and ozone and has started at least one small fire.” |
| Bram / `bram.prefect` ([facts file](../../../content/world/facts/bram.grim:3)) | “A prefect of your own year, with a red sash, a ledger of demerits and a fondness for your name.” |
| Thorne / `thorne.storm` ([facts file](../../../content/world/facts/thorne.grim:3)) | “Rumoured to have once out-duelled a storm.” |
| Maud / `maud.groundskeeper` ([facts file](../../../content/world/facts/maud.grim:3)) | “Groundskeeper and hedge-witch, keeper of bees, chickens and a goat called Bartholomew.” |
| Isolde / `isolde.names` ([facts file](../../../content/world/facts/isolde.grim:3)) | “She remembers every student's name, and every student's mistakes.” |

The only explicitly named `knows(...)` fact reference in this batch is `corvin.last_warning`, in `feud_ledger_gone` text at `between_stories.grim:60`. Original fact ([`content/world/facts/corvin.grim`](../../../content/world/facts/corvin.grim:7)): tier `personal`; hint “One more detention would cost him more than an evening.”; unlock `seen(corvin_rooftop) > 0`; text “He is on his last warning. One more detention and they send him home, and home is not a good place.” The event conditionally renders that sentence when the player knows this fact; otherwise it renders “If Bram finds it there, Corvin is finished.”

## Flags, queues, counters and reads

`npc_rel` is the stored relationship between two NPCs (not an event flag). The files introduce no custom numeric counters. Event `seen(...)` conditions are once-only gates listed above; thread flags are the journal/progression markers below.

| Flag / queue target | Set by | Read / next step |
|---|---|---|
| `feud_begun` | `feud_ledger_war` option 1 (`between_stories.grim:43`) | Thread `with: begun=flag(feud_begun)` at line 12; start gate also tests `not flag(feud_begun)` at line 36. Starts `feud_ledger_gone` at line 47. |
| `feud_ledger_back` / `feud_ledger_gone` | `feud_ledger_gone` options at lines 62 / 69 | Journal entries lines 20–21; both choices continue to `feud_vault` (66, 73). |
| `feud_locked_in` | `feud_vault` both challenge outcomes (88, 94) | Journal at 22. Both paths queue `feud_end` (91, 97). |
| `feud_by_the_rules` | `feud_vault` option 2 (100) | Journal at 23; queues `feud_end` (103). |
| `feud_truce` / `feud_cold` | Conditional branches in `feud_end` (118/122, 127/130) | Thread resolved condition at 27; journal at 24–25. |
| `tm_begun` | `tm_watering_engine` option 1 (168) | Thread `begun` binding at 137; start gate `not flag(tm_begun)` at 161; queues `tm_invitation` at 172. |
| `tm_planned` / `tm_just_ask` | `tm_invitation` choice branches (189/196) | Journal at 145–146; both invitation paths queue `tm_misread` (193, 200, 203). |
| `tm_told` / `tm_ask_yourself` | `tm_misread` options (215/221) | Journal at 147–148; both ask-yourself outcomes and the tell outcome queue `tm_end` (218, 226, 230). |
| `tm_together` / `tm_friends` | `tm_end` outcome tests and both choices (247/250, 257/260) | Thread resolution at 152; journal at 149–150. |
| `circle_begun` | `circle_founded` option 1 (299) | Thread `begun` binding at 267; start gate `not flag(circle_begun)` at 292; queues `circle_newcomer` at 302. |
| `circle_open` / `circle_closed` | `circle_newcomer` choice (321/327) | Journal at 275–276; both queue `circle_exam_night` (324, 330). |
| `circle_held` / `circle_split` | `circle_exam_night` challenge win/lose (348/354); option 2 sets `circle_held` (360) | Journal at 277–278; each outcome queues `circle_last` (351, 357, 364). |
| `circle_done` | Both `circle_last` outcomes (377, 382) | Thread resolution at 281; journal at 279. |

Other state reads/writes: `feud_end` branches on `npc_rel(bram, corvin) > -20` (113, 117, 126); `tm_end` branches on `npc_rel(tobias, mir) >= 30` (241, 246, 256). The feud start updates `npc_rel(bram,corvin) -small` (44); ledger choice branches adjust it ±small/tiny (65,72); vault options adjust it +medium/-tiny (89,102). Tobias/Mir start and advice branches update pair `npc_rel` (169, 191, 199, 217, 224). These branch thresholds are the explicit pair-state reads in the story chain.

## Cast binding and special exclusions

The two actor-bound story starts are `feud_ledger_war` (`actor: corvin`) and `tm_watering_engine` (`actor: tobias`). The other story cards have no `actor:`. Their queues do not use `with npc`; engine queue handling therefore assigns a null actor for those queued targets (see [`src/engine.js`](../../../src/engine.js:1631) and [`docs/grimoire-script.md`](../../grimoire-script.md:329)). Story progression is through the begun flag and queued steps, not a cast carried forward by those queues. The fixed actor makes a social card belong to that NPC's personal/social draw as described in language guide lines 556–562.

No `specializes:` or `except this` cast clause appears in either batch file. In `between_known_2`, `per:` binds the named NPC to the event's actor/cooldown identity; `o` remains a cast role constrained by `classmate_here` and relationship filters. In `circle_newcomer` and `circle_exam_night`, the queued card fills its own cast role (`n` or `w`) from current eligibility; no named NPC is carried. This matches current role filling and per-character bookkeeping described in [`docs/grimoire-script.md`](../../grimoire-script.md:591).

Specific pair filters are exactly: Seraphine sentence card excludes `at_odds(seraphine,o)`; Tobias sayings selects `not get_along(tobias,o)`; Tobias supper and ferns require `not at_odds(tobias,o)`; other P4-04 `o` roles have only their listed `classmate_here`/relationship threshold. P4-05's named-pair start gates require met/around; Tobias/Mir additionally must both be `fancy_free`. No separate exclusion clause is supplied for circle roles beyond their relationship thresholds.
