# Author response — critic pass of October 28, 2026

Response to [the critic's verdict](../../docs/reviews/critic-current-2026-10-28/verdict.json): 84 finding records (1 P1, 75 P2, 8 P3). **Every finding is fixed in content; none declined.** The verdict files are left as the critic wrote them. Numbers are the index in `verdict.json` → `issues`.

## How it was checked

- The two duplicate premises (#11, #34) were reworked with retrieval `search` before drafting and `related --draft` after:
  - **"The Desks on the Stair"** (`seventh_tower_outside_ledge`): its nearest hits are now the moving-staircase cards (`life_staircase`, `world_stairs_ate_a_shoe`, `seventh_tower_stair_count`), whose premises differ. `observatory_roof_ledge` no longer appears.
  - **`item_thorn_wants`**: the victim is now a sleeping classmate. `lesson_siphon`, about a fern, ranks fifth.
- `grim lint` reports 0 errors and the 7 existing warnings.
- zh-CN: 103 lines retranslated; 0 stale.
- `npm run verify` passes. The golden baseline was refreshed: the check conversions, `defer`s and `when`s change the RNG path of every golden game, and the ending mix moves within noise.
- `test/feedback1016.test.js` 3.2 now asserts the new ring rule: a last-standing night is never soft-locked, and leaving costs a forfeit.
- `grim equiv` was reviewed: 112 blocks differ from HEAD, all of them the edits below. The two pool joins (#15, #83) compile to the same meaning.

## Fixes

| # | Card(s) | Fix |
|---|---|---|
| 0 | career_return_conclave, _guild, _unseen | Return letters cite the summer and supervisor's report / steadiness / few questions, never an outcome the flags don't record |
| 1 | career_return_field_station | Paw print belongs to "whoever was sitting on the desk" |
| 2 | career_return_field_station, career_job_courier | "Ask about the winters" and "Ask about the winter routes" grant Lore, not Vigor |
| 3 | last_dumonts | `and not flag(ilse_went_north)` |
| 4 (P1) | last_remembered | "Strike them all" became "Strike the rest": it keeps the one line you picked, or prints name and year alone, so the two picks no longer contradict |
| 5 | library_whispering_dome | The proposal outcome hears the rehearsal's own yes ("a wedding that hasn't happened yet") |
| 6 | library_after_closing | Only the upper galleries close; the reading room keeps its lamps |
| 7 | great_hall_stagehands | Setups neutral (no earned sign); the third outcome is given the tricky part "because nobody else will" |
| 8 | headmistress_tower_waiting_bench | `alignment +tiny` removed |
| 9 | headmistress_tower_waiting_bench | Final-year line no longer remembers sitting there |
| 10 | seventh_tower_wind_song | Every outcome shows the tune drawing the player's magic |
| 11 | seventh_tower_outside_ledge | Reworked as "The Desks on the Stair": shift the stacked desks (Vigor check) or look inside them (Lore, a little Mood); no ledge |
| 12 | astro_dream_diary | Inventing a dream gets `alignment -tiny` |
| 13 | evo_fog_to_the_line | "a good share of your mana" |
| 14 | art_fair_entry | The wren hops "all by itself"; no claim it now sings on key |
| 15 | evo_fog_to_the_line, astro_dream_diary, alch_antidote | Joined their course's `*_class` pool (equiv-checked) |
| 16 | bram_rematch | Gated on the new `flag beat_bram_duel`, set only by a won `bram_duel` |
| 17 | tobias_scholarship_review | Moonflowers branch states his disposition (eleven years' waiting, he would stand in a storm for them), not the scene |
| 18 | corvin_takes_the_blame | Both outcomes cite Vey's mood, so the roll reads as hers |
| 19 | brk_starfall_observatory | `slot: night` |
| 20 | brk_mir_project | The teacup is Mir's plan for the next break, not a promise kept |
| 21 | intro_practice_circle | `learn thorne.lost` removed from win and partial |
| 22 | shop_square | "today" for "this morning" |
| 23 | item_honey_bees | "Let them come along"; the say is `{term: lecture|library}` |
| 24 | corvin_lucky_deck | Gated on the new `flag corvin_deck_back`, set only by the three vault outcomes that recover the deck |
| 25 | corvin_brother_again | `{chosen(corvin_brother, left): "Twice now…"|"Nobody's ever…"}` |
| 26 | corvin_brother_again | "what he asks, which is a great deal" for "everything in your purse" |
| 27 | corvin_brother_again | `alignment -tiny` removed from paying |
| 28 | seraphine_already_happened, tobias_gerald_approves, lyra_after_hours | Unique "first time" claims reworded to habits ("always glad to be wrong", "hardly ever", "almost never") |
| 29 | tobias_umbrella | Both outcomes show getting soaked |
| 30 | mir_blueprints | Both outcomes return to the essay or revision it interrupted |
| 31 | lyra_partner_watch | "By two" |
| 32 | corvin_lock_left_open | "a lock", not "your first lock" |
| 33 | kael_gift_given, mir_gift_given, lyra_lends, tobias_dance_specialized, nessa_argument, 7 `*_ex` | Once per game: `when: seen(<id>) == 0`. A specialization's own `repeat:` is ignored (the generic's bookkeeping applies), so the dead `repeat:` lines are gone |
| 34 | item_thorn_wants | Reworked: the wand urges siphoning the classmate who laughed at you, asleep two doors down; right is "Just a little of theirs" |
| 35 | duel_hall_reading_the_floor | Cost moved from Mood to Health |
| 36 | secret_garden_two_cups | The biscuit is "for whoever comes", not a reward |
| 37 | secret_garden_snail_post | Note "sealed with a blob of resin", no invitation |
| 38 | infirmary_missed_round | The search goes through the cold back corridor in shirtsleeves |
| 39 | lecture_tower_red_ink_reply | `red_ink_glimpse` on a win only; a loss sets `red_ink_waited` (front-row and reply gates updated) |
| 40 | lecture_tower_red_ink_reply | Stakeout is `deceive apprentice likely` |
| 41 | lecture_tower_red_ink_seminar | A loss sets `red_ink_silent`; new journal line "On Thursday she sat down without reading…"; the spoke line requires `not flag(red_ink_silent)` |
| 42 | infirmary_covering_rounds, red_ink threads | Threads `missed_round` and `red_ink` get `defer: not term` (queued beats wait for term) |
| 43 | home_cottage_bloomer_letter | The candle is the one you "still revise by"; you'll read by the window a while |
| 44 | home_market_bloomer_ice | Kettles carried at a run and hands scalded in the steam |
| 45 | job_board_lost_property | Reading the pockets gets `alignment -tiny` |
| 46 | intern_assessment | The Field Station question grants Lore, not Vigor |
| 47 | verdant_plant_seed | Maud's bed is at the back of the same greenhouse ("Plant it in Maud's corner"), so later greenhouse cards stay true |
| 48 | courier_race_gulls | `{flag(tailwind_fisherman): fisherman|the jar's label}` explains the race |
| 49 | courier_wind_jar | The outcome flies a test loop of the yard |
| 50 | company_birthday, company_poets | No "another year" claims |
| 51 | company_poets | `{chosen(company_poets, left): verdict|poured the wine}` |
| 52 | newt_high_table_last | Loss text loses the stake and "a fat slice" of the winnings, matching the fixed cost |
| 53, 62 | ring_bout_2–4, ring_cameo_* | New `@preset ring_forfeit` (ends last standing, gold −medium, renown −small, mood −small). On a last-standing night the bouts' right option is "Forfeit, and walk out" and the cameos' step-outs count as forfeits; the opener says so up front. No menu is fight-only |
| 54 | lesson_rapport | "Let it happen" grants no Charm |
| 55 | illu_first_glamour | At Illusion II the false-memory practical gets `alignment -tiny` |
| 56 | beast_first_haste | "Study how it moves first" |
| 57 | lyra_teaches_wildfire | `{I've never shown anyone."|You've seen it once already. The offer's still open."}` |
| 58 | illu_first_glamour | Illusion I starts with self-glamour, then the persuasion exercise |
| 59 | company_card_widow | Hint states the real risk: a dull game means a small tip and an early night |
| 60 | company_card_widow | `alignment` removed from "Let her win" |
| 61 | courtyard_lost_cat | "A few faces in the crowd know you from last time" |
| 63 | scandal_credit_taken | The deny route gets `alignment -tiny` before its check |
| 64 | between_love_note | "You give up the evening you'd meant for your essay" |
| 65 | plans_thesis (8 cards) | Bare chance → skill checks: family_debate, briefing (research apprentice); conclave_minutes (research journeyman); alchemists (brew apprentice); chart_dispute (appeal journeyman); field_count (research apprentice); patient (soothe apprentice); unseen_coffee (deceive apprentice) |
| 66 | intern_royal_library_slips | "today the third landing is as deep as you go" |
| 67 | intern_royal_library_mending | "The binder hands you one of the older pages today" |
| 68 | intern_expedition_thin_air | Setups neutral (the goats ignore everyone from the station) |
| 69 | intern_field_station_count | "the best counter is whoever minds the damp least" |
| 70 | intern_conclave_test_chamber | Each failure shows bodily harm (stinging hands, dizziness, a burned forearm) |
| 71 | boathouse_good_boat, notebook, grimsbys | Glamour options get `alignment -tiny` |
| 72 | lecture_tower_far_bell | Run loses `mood -small` on a failed roll; walking gets `mood +tiny`, "unhurried… breathing easy" |
| 73 | lecture_tower_far_bell, volunteer | `when: term` |
| 74 | mabels_cold_range | "from the coal yard", not frozen |
| 75 | boathouse_damp_stove | Scarf cost moved from Mood to Health |
| 76 | lakeshore_swan | Stepping in bodily gets `alignment +tiny` |
| 77 | home_market_schoolmistress | "The offer stands. They still don't believe me." |
| 78 | mabels_fourth_cake | Served "in case today is the day you're brave" |
| 79 | mabels_regulars_table | `challenge research journeyman wild` with win/lose |
| 80 | world_laundry_day | The pink month was a corridor-wide event |
| 81 | world_the_mirror_asks | Each answer stands alone |
| 82 | world_stairs_ate_a_shoe | Third outcome reads between lectures |
| 83 | world_the_mirror_asks, world_study_group | Joined `world_more_routine` (equiv-checked) |
