# T4: the Restricted Stacks heist and the shared heist cards (threads 1)

**Files:**
- `content/events/heists/shared.grim`: the shape (header) and three shared cards: `heist_way_out`, `heist_slip`, `heist_caught`.
- `content/events/heists/stacks.grim`: the stacks.
  - Pool `restricted_heist_entry` holds the entry and a teaser for players without the map.
  - `@thread heist_stacks` holds 11 steps: a dead end, 3 per band and the vault.
- `content/world/lore/soft/academy.grim`: `@lore deep_stacks` (soft).
- Retired with `when: false`, ids kept: `midnight_restricted_stacks` (night.grim) and `restricted_page_buyer` (pools/night.grim). The page buyer's collector is now the heist's fence.
- `content/events/contraband.grim` (T2): `contraband_caught` now records which bottle was taken (`confiscated_owls_ink`, `confiscated_brightwater`), so the vault gives back the right one.

## The rule (the user's, 2026-10-28/29)

- **Steal mini-delves** in the restricted areas and the seventh tower.
  - Go deeper, or withdraw with the loot; each step has risks.
  - Like the forest delves, but mainly guile checks, with no combat or negotiation. Midnight only.
- **They replace the original midnight cards there.**
- **The cartographers unlock them and their special opportunities.**
- **Spells:** the Restricted Stacks teach Torment and Reflect.

## Shape (the heists/shared.grim header)

- **Counters, reset on entry:**
  - `heist_where`: 1 is the stacks, 2 the tower.
  - `heist_depth`, `heist_loot`, and `heist_cover`: 1, +1 with `prefect_rota` (T1 detention / T3 quiet prefect), +1 with `forbidden_rounds` (Odile's notes, stacks only).
  - `heist_stacks_deepest` persists.
- **Each step:** left slips away with what you carry (`heist_way_out`); right goes on (depth +1, maybe loot, `next`).
- **A lost check:** `heist_slip` while cover lasts (cover, health and loot pay), otherwise `heist_caught`. A ⚠ hazard (`st3_no_lamp`) goes straight to caught.
- **Caught:** the loot is taken, a month of detention (unless you outrun them), and `night_suspicion` in the morning, which escalates through `watched` as every midnight catch does.
- **Fence or keep:** the way out sells to the collector (gold by loot, alignment −tiny) or keeps and reads it (lore by loot, alignment −tiny).
- **The dead end (`st_dead_end`, weight 1):** a step for any depth that always ends the night. It is drawn rarely, and always when nothing else is left at that depth (after a slip at the vault, or when a band's cards are used up), so no night ends without the way out.

## Cards

| Band | Card | Check (right) | Gain |
|---|---|---|---|
| entry | `heist_stacks_enter` (needs `heist_stacks_known`) | none | sets the counters; the book-lift starts you at depth 3 |
| entry | `heist_stacks_unmapped` (no map) | none | listen at the shelf: lore +tiny, mood −tiny. It points to the Cartographers |
| any | `st_dead_end` | research apprentice (optional) | loot +1, then the way out |
| 1 | `st1_taut_chains` | feat using guile apprentice | loot +1 |
| 1 | `st1_library_rounds` | deceive apprentice, +1 with `forbidden_rounds` | none |
| 1 | `st1_catalogue` | research apprentice | loot +1 |
| 2 | `st2_breathing` | feat using guile journeyman | loot +1 |
| 2 | `st2_charging_book` (Torment not known) | research journeyman | **Torment**, health −small, alignment −small |
| 2 | `st2_other_lamp` | deceive journeyman to slip past, or journeyman+ to take a sheaf of their pages | none, or loot +2 and alignment −tiny |
| 3 | `st3_mirror_desk` (Reflect not known) | research adept | **Reflect** |
| 3 | `st3_no_lamp` ⚠ | feat using guile adept− | loot +1 |
| 3 | `st3_glass_case` | spell adept− | loot +2 |
| 7 | `st_vault` (menu) | feat using guile adept−, +2 with `vault_catalogued` | crates: loot +3; your own bottle back (`elixir_confiscated`); Corvin's grandfather's deck (after `corvin_confiscation_vault`, `corvin_deck_back`, rel Corvin +medium) |

**Special opportunities from the Cartographers and elsewhere:**
- the book-lift (start deeper);
- `prefect_rota` (cover);
- `vault_catalogued` (the vault lock);
- the confiscated bottle;
- Corvin's deck.

**Canon used:**
- `deep_stacks` is new soft lore.
- The vault: "three hundred years", its alarm "a very loud goblin" (`corvin_confiscation_vault`), and "cataloguing contraband" as detention.

## Plot safety

- The heist goes down, below the chained shelf. It never goes to "the very back", where the Codex (`forbidden_section_*`) and the founders' drafts (`hs_restricted_founders`) are.
- It grants no clue and reveals nothing of the main mystery.
- The Torment book is a forbidden duelling manual, not the Codex or the chained book.

## Retrieval

`search` before drafting:
- chains;
- a prefect's lamp in the library;
- the catalogue;
- a book that hurts its reader;
- another thief;
- a mirror desk;
- a book that reads you;
- darkness by touch;
- the vault padlock;
- the collector;
- caught red-handed;
- a bell tripwire;
- a glass case;
- ink moths.

**`related --draft` on every card:**
- **`st3_reading_you` dropped:** a book falling open at your feet, writing about you, was too close to the plot's Codex (`forbidden_section_2`). It became `st3_glass_case`.
- **A bell tripwire dropped:** bells are the lake-bell motif.
- **`st2_charging_book`:** its premise differs from `restricted_section_chained_book` (a book opened at a page) and from `lesson_torment` (after learning).
- **`st3_mirror_desk`:** differs from `vey_trust` (Vey's mirror copy).
- **`st_vault`:** against `corvin_confiscation_vault` and `feud_vault`, and it builds on them (Corvin's deck, the alarm goblin).
- **`heist_way_out`:** replaces `restricted_page_buyer`'s collector.
- The rest have distinct top hits (`library_after_closing`, `restricted_section_breathing_shelves`).

## Checks

- `grim lint`: 0 errors. One expected warning: `heist_tower_tried` (T5).
- **Driven runs** (12 seeds, the entry queued, skills 55–60): every run ends at the way out or caught; the vault opens and the bottle and deck options work. Torment and Reflect are taught. A deep heist pays +15 to +60 gold.
- zh-CN: being translated in parallel.

## Round 2 (after round 1: reject, 11 issues; all fixed)

- **`heist_slip`:** `on_show` records `heist_dropped`. The text has a dropped set and an empty-handed set, and the third "go on" say no longer mentions a drop.
- **`heist_caught`:**
  - The loot is zeroed in each option, after its say. The text has an empty-handed branch ("which convinces nobody").
  - Going quietly, or a lost run, escalates directly: `watched`, or with `watched` already, lockout. The say states which (`heist_warned`, recorded on show).
  - Only an escape queues `night_suspicion` (they saw your face).
  - Running is `feat using guile journeyman`, and the win say leaves the sack to the prefect.
- **`heist_way_out`:** the item lists are no longer specific. A Corvin's-deck night with no other loot has its own lines (`heist_deck_tonight`, set by the vault's deck option and reset at the way out and when caught).
- **Book-lift:** it is the bindery's lift, a floor below, and its rope's knots stop you "where the shelves start breathing" (depth 3). T3's `carto_book_lift` say and journal now say the same ("deep into the stacks").
- **The shelf** is pinned away from the founders' shelf at the very back: "the east stacks' last chained shelf, by the book-return hatch". This is in the entry, the teaser, `carto_deep_stacks`, `lead_deep_stacks` and `@lore deep_stacks`.
- **`heist_stacks_unmapped`:** its text and says are sequences (the "again" line is second). The Cartographers line needs `seen(carto_map_blanks) > 0`.
- **`st1_taut_chains`:** the opening branches on depth ("As you step off the last stair" at depth 1, "Round the next bookcase" otherwise), and the left option is "Slip back the way you came".
- **`st3_no_lamp`** is only at depth 6, so it really is the last stretch before the vault.
- **`st_dead_end`:** a depth-7 branch, at the vault door with the goblin still muttering, in its text and left say. The right option is "Search where you stand".
- **Repeats:** every step text has a familiarity branch.
  - The band cards key on `heist_stacks_deepest` (3 for band 1, 5 for band 2, 7 for no-lamp).
  - The spell cards and the glass case key on `seen(...) > 1`.
- **`st_vault`:** the bottle option falls back to Brightwater when neither new flag is set (saves confiscated before T4). Its says no longer assume one bottle.
- zh-CN redone for every changed line; 100%, 0 stale.
