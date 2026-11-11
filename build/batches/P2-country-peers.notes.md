# P2 countryside peers: author's notes

Batch: `content/events/maps/countryside_peers.grim` (9 cards), 8 new facts (`content/world/facts/tobias.grim`, `nessa.grim`), soft lore: `fennick_farm` extended (the upland, the top field, the mandrake bed, the man from the capital), new `quill_press` (Nessa's mother's print shop, the almanac, Biscuit). `fennick_farm` and `almanac_printers` open only in the slots their schedules put Tobias and Nessa at home.

Hooks for "The Good Year" (K4, `docs/maps-plan.md`): the farm lies outside the villages' good years (`fennick_top_field`); a land agent from the capital is buying upland farms (`fennick_good_boots`, flags `fennick_agent_refused` / `fennick_agent_card`, read by K4 later); the almanac is a page short every seventh year (`almanac_short_page`, flag `almanac_pages_counted`). None explains the custom, the Tenant or the tithe. Not Hollow Star canon.

Structure as P1 round 2: one recurring card per home in three linked showings (`fennick_weather_first`, `almanac_type_case`), the rest once; `country_peers_out` (region countryside) once each.

## Retrieval

`retrieve search` per premise (9 queries). Checked and kept apart: `illu_turnip_market` (Vey's glamour class), `hint_almanac_page` (Grimsby's tide almanac, a different book), `verdant_mandrake_choir` (mandrakes screaming at a seedling), `market_harvest_board` (K2's tally of seven: the attic card nods to it only if seen).

`retrieve related --draft` per card, then rework:
- `fennick_weather_first`: its punchline "Weather first, love last. That's Ma." retold `tobias_letter_aloud`; replaced (the canon stays in the fact).
- `fennick_mandrake_bed`: "the purple one bites you" echoed `tobias_godparent` (Gerald bites you); now hisses.
- `nessa_country_green` sits near `nessa_not_a_story` / `nessa_hollow_story` (different premises: her home, why she left).

## Round 2 (after the critic's rejection)

- `fennick_weather_first` and `almanac_type_case`: cycle (`{&…}`) instead of a sticking sequence; gated `rel(...) > -10`; "Up the ladder again" no longer assumes an earlier choice; the third roof showing patches a corner instead of finishing the roof; the type case's third left line no longer assumes practice and shows the mood cost.
- `fennick_good_boots`: the card is "an office on the capital's uptown side" (not a counting house, the merchant's home); `tobias.offer` says only what the card shows; the redundant `when: met(tobias)` is gone.
- `fennick_mandrake_bed`: the knitting line shows the mood cost (swearing, cross with the hat).
- `nessa_country_green`: `slot: afternoon`; the scene's church tower is a market cross. `tobias_country_barrow`: no "by noon".
- `almanac_short_page`: text trimmed under 400 with the callback.
