# T5 + T6: the seventh tower heist, and the spell moves (threads 1)

These go to the critic as one batch because they depend on each other: Extraction leaves the Outcast only because the
tower teaches it.

**Files:**
- `content/events/heists/tower.grim`: the tower heist.
  - Pool `tower_heist_entry` holds the entry and a teaser for players without the map.
  - `@thread heist_tower` holds 11 steps: a dead end, 3 per band, and the study at depth 7.
- `content/events/heists/shared.grim`: `heist_slip`'s "go on" now branches by place (`heist_where`). The tower variants of the way out and the caught card were already written in T4.
- `content/world/places.grim`: `seventh_tower` opens at midnight. Its discovery through the map came in T3.
- **T6, the spell moves:**
  - `content/events/whisperwood/hush.grim` (`ww_outcast_table`): the Outcast now teaches Heartprice only, then lore as before.
  - `content/events/whisperwood/delve.grim` (`ww3_other_sky`): it no longer teaches Reflect. It is a plain band-3 step (win: lore +small or arcana +small, haul +1), and its `spell_level(reflect)` gate is gone.
  - `content/events/chain_hollowstar.grim`:
    - `hs_grey_return` left ("Take the letter to the jetty", the Hollow errand) and `hs_grey_invitation` left ("Go to the boathouse") now teach **Eclipse** if not known, each with a new say line added after the existing ones. These are hard-canon story cards, and the finale's Star bargain (`hs_beneath`) still teaches it too.
    - `hs_seventh_tower`, a text-only fix: the wards are woven round the hollow and shriek when it's touched, not "the moment you touch the door". The day card `seventh_tower_dust_room` already enters the top room and sees the hollow, so the old line contradicted it. Plot logic is untouched; the lose line "A ward shrieks" still fits.
- zh-CN for all of it. Spell names follow the glossary: 反照, 折磨, 汲取, 蚀, 心价.

## The rule (the user's)

- Steal mini-delves in the restricted areas or the seventh tower. They are like the forest delves, but mainly guile checks, with no combat or negotiation, and midnight only.
- The cartographers unlock them, and their map opens the seventh tower even without the main plot.
- **Spells:** the restricted area teaches Torment and Reflect (T4), the tower teaches Extraction, the Outcast teaches Heartprice, and "the main plot now teaches Eclipse".
- "Check the plot relevance of the seventh tower before finalizing the events there."

## Plot relevance of the seventh tower (checked)

- **The plot's beat:** Act III's `hs_seventh_tower` (evening; needs `clue(lead_seventh_tower)`). The top room holds the star key, in a star-shaped hollow behind wards (soft lore `star_key`, `seventh_tower`). Lifting it puts out every candle.
- **Canon:** `timeline seventh_tower_locked` says the tower was locked a century ago, and "nobody living remembers why". So nothing here gives a reason. The register says only "Tower closed. Lessons moved", and the study "was locked the same day as the tower… the key went wherever the reasons went".
- **How far the day cards go:** they climb to the landing of candles (halfway), the desks two turns below the top, and the top room itself (`seventh_tower_dust_room`).
- **So the heist:**
  - climbs only the wall stair, the old classrooms and the upper classrooms;
  - ends at the duelling master's study beside the desks that choke the stair, and "You won't be going higher";
  - never reaches the top room or the hollow, never names the key, and grants no clue;
  - after the key has gone (`star_key`, `gave_star_key`, `key_taken`), says only that the tower above is quiet, instead of humming.
- The heist's tags are `heist`, never `hollowstar`.

## Shape

The tower uses the shape in the heists/shared.grim header.
- **Cover:** +1 with `prefect_rota`, +1 if you know the tower by day (`visits_to(seventh_tower) >= 3`).
- **Start:** the chimney (T3's `carto_tower_chimney`) starts you at depth 3.
- **The dead end** `tw_dead_end` (weight 1) guarantees a way out, as in the stacks.

| Band | Card | Check (right) | Gain |
|---|---|---|---|
| entry | `heist_tower_enter` (needs `heist_tower_known`) | none | sets the counters |
| entry | `heist_tower_unmapped` (no map, tower known through the plot) | none | listen: lore +tiny, mood −tiny |
| any | `tw_dead_end` | research apprentice (optional) | loot +1, then the way out |
| 1 | `tw1_one_shoulder` | feat using guile apprentice | none |
| 1 | `tw1_someone_else` | deceive apprentice | loot +1 |
| 1 | `tw1_spyhole` | research using guile apprentice | none |
| 2 | `tw2_exam_cupboard` | feat using guile journeyman | loot +2 |
| 2 | `tw2_telling_floor` | feat using guile journeyman | none |
| 2 | `tw2_class_register` | deceive journeyman | loot +1 |
| 3 | `tw3_no_wind` ⚠ | feat using guile adept− | loot +1 |
| 3 | `tw3_orrery` | feat using guile adept− | loot +2 |
| 3 | `tw3_portrait_eyes` | deceive adept− | none |
| 7 | `tw_masters_study` | feat using guile adept−, +1 if you know the tower | loot +2, **Extraction** (alignment −small) if not known; `heist_tower_study` resolves the thread |

## Retrieval

**`search` before drafting:**
- a narrow wall stair;
- someone else's candle;
- a spyhole;
- old exam papers;
- creaking floors;
- a blackboard;
- a duelling master's notes;
- the wind stopping;
- an orrery;
- the desks on the stair;
- a talking portrait;
- a class register.

**Dropped:**

| Idea | Too close to |
|---|---|
| searching the desks on the stair | `seventh_tower_outside_ledge`'s "Look inside the desks" |
| a century-old lesson on a blackboard | `lecture_tower_old_board` |

**Kept against near hits:**
- the floor: `duel_hall_reading_the_floor` reads bout marks;
- the notes: `umbral_forbidden_notes` is Odile's notebook;
- the portrait: talking portraits are canon (`life_portrait_gossip`). This one is a guard, and a professor rather than a headmaster, so it adds no new canon.

## Checks

- `grim lint`: 0 errors. The `heist_tower_tried` warning is gone.
- **Driven runs** (10 seeds): every run ends at the way out or the dead end. The study teaches Extraction; a slip there falls to the dead end. Pay is +8 to +60 gold.
- `lesson_extraction` is reachable again (it was not while the Outcast lost Extraction and the tower wasn't in).
- zh-CN: 100%.

## Round 2 (after round 1: reject, 8 issues; all fixed)

- **Plot safety, `tw_masters_study`:** the study "was locked with the rest of the tower, and nobody has had its key since". No shared date and no "reasons". The Extraction notebook is one "the master confiscated from a student duellist long ago, its ink faded brown". Nothing dates it to the closing.
- **The study's lock:** the `visits_to` step is gone, so knowing the tower by day gives cover only.
- **`tw1_someone_else`:**
  - The lose line works for a slip and a capture ("you bolt before the prefect behind it can find your name").
  - The climbers are plainly students out of bounds (a house scarf; Cartographer chalk on a sleeve).
  - The brass key is now a silver thimble.
- **`tw2_class_register`:** `feat using guile journeyman`.
- **`hs_seventh_tower`:** "tonight you mean to see what it keeps".
- **`heist_tower_unmapped`:** the first listening variant now unsettles you (the settling stops on one floor, as if something is listening back).
- **`tw_dead_end`:**
  - The 1820 love letter is now a note: "Sorry about the frog".
  - Following the T4 critic's notes, it has a depth-7 branch at the study door in its text and all its says, and its right option is "Search where you stand".
- **Header comment:** "It ends at the study beside the desks two turns below the top, and never goes past them…"
- **Also from the T4 critic's round 2, applied here too:**
  - every tower step has a familiarity branch (`heist_tower_highest`, or `seen(...) > 1`);
  - the orrery remembers whether you took the pearl (`heist_pearl_taken`).
- zh-CN redone; 100%, 0 stale.

## After round 2 (accepted, 2 polish items; both applied)

- The familiarity branches of the six band steps, here and in the stacks, gate on `seen(<own id>) > 1`, not on the deepest band reached. The cupboard's "a bundle or two lighter" needs `heist_papers_taken`, set by its win.
- The study's else say calls it "the confiscated notebook".
