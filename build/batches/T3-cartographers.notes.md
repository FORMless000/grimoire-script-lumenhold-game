# T3: the Midnight Cartographers, expanded (threads 1)

**Files:**
- `content/events/cartographers.grim`: the Master Map quest (6 cards), 4 society cards and 2 midnight cards at the third gargoyle.
- `content/world/clues.grim`: `lead_master_map`, `lead_deep_stacks`, `lead_tower_stair`.
- `content/world/lore/soft/academy.grim`: `@lore master_map` (soft; keys Master Map, Keeper of the Map, Cartographer).
- `content/world/places.grim`: `restricted_section` and `seventh_tower` are also discovered by the map's heist flags.
- zh-CN for all of it.

## The rule (the user's, 2026-10-29)

- The cartographers unlock the two midnight heists (T4/T5) and their special opportunities.
- They are expanded in this batch.
- The cartographers' map opens the seventh tower delve even without the main plot.

## Shape

- **`@thread carto_master_map` (quest template, `track: cartographers`).**
  - The start is pushed once you are a member and `turn >= 8`.
  - The parts come in any order; the final needs two of them. That follows the club spell chains, so the parts are drawn at the third gargoyle (a society's place) and `next` deals the next one.

| Card | Role | Left | Right |
|---|---|---|---|
| `carto_map_blanks` | start (auto) | take it on: `carto_map_chain`, lead `lead_master_map`, guile +tiny, deals the stacks part | not this year: rel Corvin −tiny, mood +tiny |
| `carto_deep_stacks` | part | research using guile journeyman → `heist_stacks_known`, lead `lead_deep_stacks`, guile +small / mood −small | copy the old margin: lore +small |
| `carto_tower_stair` | part | feat using guile journeyman → `heist_tower_known`, lead `lead_tower_stair`, guile +small / mood, health | measure from outside: lore +tiny, health −tiny |
| `carto_book_lift` | part (a shortcut inside the stacks heist) | feat apprentice+ → `carto_book_lift`, guile and vigor +tiny / health −small | ask who oils the rope: charm +tiny |
| `carto_tower_chimney` | part (a shortcut inside the tower heist) | feat using guile apprentice+ → `carto_tower_chimney` / health, mood | a lantern on a cord: lore +tiny |
| `carto_map_keeper` | final | the Keeper's test: research using guile adept−, +1 for each part done → Keeper (guile, rel Corvin, mood) / mood −small, comes back | "keep it another year, Corvin": rel Corvin +medium, ends the quest |

**Society cards** (`track: cartographers`):

| Card | Left | Right |
|---|---|---|
| `carto_forged_map` | let it sell: guile, mood, alignment −tiny | buy and burn the stock: gold −small, alignment +tiny |
| `carto_quiet_prefect` | trade a shortcut for her round's times: `prefect_rota` (heist cover, also from T1's `det_prefects_room`), guile, rel Corvin −tiny | play dumb: mood +tiny |
| `carto_member_out` | burn a leaver's maps with her: mood −small, alignment +tiny | keep them for the club: guile +small, alignment −tiny |
| `carto_recruit` | invite a met student: rel +small, a slim midnight risk | "nobody I'd trust": rel Corvin −tiny, guile +tiny |

**Midnight at the third gargoyle** (its midnight pick was one card deep):

| Card | Left | Right |
|---|---|---|
| `gargoyle_midnight_one_short` | go after the missing member: feat using guile journeyman | wait with the others: mood −small |
| `gargoyle_midnight_lost_map` | steal a club map back from the prefects' common room: deceive journeyman, a loss queues `night_suspicion` | redraw the routes: lore +tiny, mood −small |

## Plot safety

- The tower blank is the wall stair, from the cellars to the landing of candles. It is not the top room or the hollow.
- No hollowstar clue and no arc tag.
- The leads are side-thread leads, like `lead_the_hush`.
- `heist_stacks_tried` and `heist_tower_tried` (the leads' `followed:`) are set by T4/T5's entry cards, so lint warns until then.

## Retrieval

`search` before drafting:
- initiation;
- a forged map;
- a prefect who knows;
- chalk codes;
- a member leaving;
- the parapet at midnight;
- a member missing;
- a book-lift;
- a tower chimney;
- the stacks' stair;
- the tower's wall stair;
- recruiting;
- a gargoyle at midnight;
- a lost first-year;
- echoes;
- a gale on the parapet;
- a map in a prefect's hands.

**Dropped:**

| Idea | Too close to |
|---|---|
| initiation | `carto_invite`, `cartographers_silver_pen` |
| chalk codes | `cartographers_survey_run`, `midnight_passage_mapping` |
| the map that redraws itself | `cartographers_inking_night` |
| echoes | `brk_corridors_echo` |
| a gale on the parapet | `world_bridge_in_a_gale`, `observatory_roof_ledge` |
| a lost first-year | `life_lost_firstyear`, `ww1_lost_firstyear` |

**`related --draft` on every card, and what it changed:**
- The midnight kitchen raid was dropped: `corvin_kitchen_raid` and `midnight_kitchen_raid` already exist. It became `gargoyle_midnight_lost_map`.
- The final was "sign your name on the map", which repeated `cartographers_silver_pen` (your name on the master map). It is now the Keeping of the Map, which picks up that card's "Keeper material".
- The rest have distinct top hits:
  - `carto_book_lift` against `life_library_cat` and `library_assistant_stack_keys`;
  - `carto_forged_map` against `spot_notes_for_sale` (your notes sold) and `corvin_note_was_mine`;
  - `carto_quiet_prefect` against `cartographers_lantern_patrol`;
  - `carto_recruit` against `carto_invite` (the other side of it);
  - the tower parts against the tower's day cards, which they connect to (the landing of candles, the desks on the stair).

## Checks

- `grim lint`: 0 errors. The two expected `*_tried` warnings remain.
- `grim leads`: the parts lead to the final under `lead_master_map`.
- Reach over 30 games a style:
  - **social:** members 19, the start 19, `carto_deep_stacks` 17, stacks opened 7, the final 1;
  - **nightlife and balanced:** they join (16 and 13) but never visit the third gargoyle (no society card, old or new, is drawn for them). That is a bot habit; look again in the balance step.
- zh-CN: 100%.

## Round 2 (after round 1: reject, 12 issues; all fixed)

- **Canon:**
  - Corvin is a first-year: "The last Keeper left it to me this summer", and you keep it *with* him. The final's right option is "It's yours, Corvin. Keep it." (no "three years").
- **Blanks:** start card, clue and lore now agree. There are two great blanks, the stacks stair and the tower's wall stair. Once one is charted, a shortcut inside it can be found; "two lines on the map" makes the final.
  - `carto_book_lift` needs `heist_stacks_known`, and `carto_tower_chimney` needs `heist_tower_known`.
  - The members are ordered so that `next` offers the other great blank first.
- **Chimney:** the check is `feat apprentice+` (vigor). It starts in the cellar beside the wall stair and comes out in a classroom a floor above the landing of candles, well below the top room. The journal line matches.
- **Final:** the text depends on whether two lines are drawn (the giveup case reads "The blanks are still mostly blank, but the club has watched you try").
- **`carto_tower_stair`:** "its own stair, locked as it is; that's on every old plan". The check is `research using guile`.
- **Midnight cards:** both join `pool: gargoyle_passage_routine` with `slot: midnight`.
  - Each has three matched random variants: who is missing and why; which map was lost and where.
  - Neither casts nor rewards Corvin, and neither uses `when`, since the place is member-only.
- **Polish:**
  - "Tonight" is gone from `carto_deep_stacks`, and its win line is trimmed.
  - `carto_quiet_prefect` says "on her rounds", and its label is shorter.
  - `carto_forged_map`: "You get a copy".
  - `carto_member_out`'s right option has no alignment; its cost is the slim midnight risk the say now shows.
  - The start text is under 400 and has a second-showing variant.
- zh-CN redone for every changed line.
