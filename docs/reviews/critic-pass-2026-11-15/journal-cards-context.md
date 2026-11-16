# `journal_cards.grim` source context

Source-only card/gate/effect map for the nine P4-14 IDs. [`P4-14.notes.md`](../../../build/batches/P4-14.notes.md) records its retrieval/history and earlier critic round; that history is provenance only, not adopted judgment. No retrieval was run.

## Shared pools and year recaps

- `year_recap` (source [`journal_cards.grim:5`](../../../content/events/journal_cards.grim:5)): `trigger: auto`, `class: milestone`, `repeat: 1`, `priority: 40`, `tone: warm`, tags `journal abroad`.
- `nudge` (line 15): `class: routine`, `repeat: 1`, `tone: light`, tags `journal`; it declares no trigger, place, actor, or track. Nudge event-specific `track:`/`actor:` properties are listed below.
- None of the nine cards has a `knows()`/`learn` fact prerequisite or a fact-unlock effect. The three recaps read bond/renown/GPA/clue state in conditional prose. The six nudges gate on a clue, spell level, time since a named source event, and participation/availability properties.

| Card / source lines | Eligibility and text state reads | Choice effects |
|---|---|---|
| `recap_year_one` 24–37 | `when: turn == 12`. Reads bonds friend+close at ≥3 / ≥1; `gpa >= 3`; `clues(hollowstar) >= 1` (29). | Read again: mood +small, study -tiny. Write next: study +small, mood -tiny. |
| `recap_year_two` 39–52 | `when: turn == 24`. Reads partner bond >0, else friend+close ≥3; `renown_known()`; `clues(hollowstar) >= 2` (44). | Mark pages: mood +small, study -tiny. Count tasks: study +small, mood -tiny. |
| `recap_year_three` 54–67 | `when: turn == 36`. Reads friend+close+partner bonds ≥3 / ≥1; `renown_famous()` then `renown_known()` fallback (59). | Read first: mood +small, study -tiny. Start fourth: study +small, mood -tiny. |

## Nudge IDs and source-key dependencies

These conditions use stable content IDs in `clue(...)` and `since(event_id)`; membership/track and spell IDs are also literal source references. The spell/lead completion check suppresses the nudge once acted on. Source clue declarations are in [`content/world/clues.grim`](../../../content/world/clues.grim): `lead_brace` line 228, `lead_quickquill` 235, `lead_index` 249, `lead_rapport` 256, `lead_tailwind` 270, `lead_red_ink` 307.

| Event / source | Exact current eligibility | Branch effects |
|---|---|---|
| `nudge_quickquill` 71–87 | `track: lumen_ledger`, `actor: nessa`; `clue(lead_quickquill)`, `spell_level(quickquill)==0`, `since(ledger_spare_quill)>=6`, `member(lumen_ledger)`, `turn<=44` (76). | Working: Nessa rel +tiny, study -tiny. Lost cause: Nessa rel -tiny, mood +tiny. |
| `nudge_footnote` 89–103 | `track: library_assistant`; `clue(lead_index)`, `spell_level(index)==0`, `since(library_footnote_drawer)>=6`, `member(library_assistant)`, `turn<=44` (93). | Look again: study -small, lore +tiny. Still looking: mood +tiny. |
| `nudge_two_taps` 105–119 | `track: tavern`; `clue(lead_rapport)`, `spell_level(rapport)==0`, `since(tavern_two_taps)>=6`, `member(tavern)`, `turn<=44` (109). | Ask where to start: study -tiny, mood +tiny. Just pour: gold +tiny. |
| `nudge_brace` 121–137 | `track: duelling`, `actor: lyra`; met Lyra, `clue(lead_brace)`, `spell_level(brace)==0`, `since(duel_dummy_hexes)>=6`, `member(duelling)`, `turn<=44` (126). | Try: Lyra rel +tiny, health -tiny. Rub out: Lyra rel -tiny, mood +tiny. |
| `nudge_red_ink` 139–152 | No event `track:`/`actor:` declaration; `clue(lead_red_ink)`, `not flag(red_ink_finished)`, `since(lecture_tower_red_ink)>=6`, `term` (142). | Draft: study -small, lore +small. Drawer: mood +tiny. |
| `nudge_wind_jar` 154–168 | `track: broom_courier`; `clue(lead_tailwind)`, `spell_level(tailwind)==0`, `since(courier_wind_jar)>=6`, `member(broom_courier)`, `turn<=44` (158). | Ask who flew: study/lore +tiny. Return jar: mood +tiny. |

The `since(...)` IDs are event IDs, not dates stored in this file: `ledger_spare_quill`, `library_footnote_drawer`, `tavern_two_taps`, `duel_dummy_hexes`, `lecture_tower_red_ink`, `courier_wind_jar`. Their spelling is part of the condition interface; likewise `lead_*`, the spell IDs, track IDs, and `red_ink_finished` must be read as literal cross-source identifiers. There is no fact learning or flag write in these nudge outcomes.

## Routing context

The year recaps are `auto` milestones. Five nudges explicitly bind to a track, and two explicitly bind an actor; `nudge_red_ink` specifies neither. `nudge_quickquill` and `nudge_brace` are actor-bound (`nessa`, `lyra`); the other nudge cards have no `actor:`. There are no `cast:` blocks or `per:` properties in this file. Character schedule checks therefore come from the explicit actor behavior for the two bound events; other eligibility is the written source gate. Language guide routing is in [`docs/grimoire-script.md`](../../grimoire-script.md:560) and actor/track event behavior at lines 556–562.
