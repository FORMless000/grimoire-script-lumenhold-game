# C3 the rest of the capital: author's notes

Batch: `content/events/maps/capital_port.grim` (24 cards), two new pins (`capital_undercroft`, `capital_rookery` in `content/world/places.grim`) with soft lore (`undercroft`, `rookery`), the fish market's counter (`always: shop_fish_market`), and five placeholders retired (docks, fish market, coaching yard, cathedral, Printing Row).

Each place has a pool, one **recurring** card in three cycled showings (none assumes an earlier one) and scenes once each:
- **The Docks** (`capital_docks_life`): `docks_day_labour` (recurring: day work in the hold, or watch the ships), `docks_northern_ship` (frost on a northern ship's rigging; eerie, plot-safe), `docks_undercroft_word` (a docker tells you the way in: `flag undercroft_known`, which discovers the Undercroft), `docks_roof_runner` (a roof-runner shows you the Rookery: `flag rookery_known`; street-raised players know it already).
- **The Fish Market**: a counter `shop_fish_market` (chowder ends hunger, oysters, a fishwife's gossip) and `capital_fish_market_life`: the dawn auction by hand-signals (`slot: morning`), the gull war, the golden fish the fishwives throw back.
- **The Coaching Yard** (`capital_coaching_yard_life`): `coaching_yard_arrivals` (recurring: carry a parcel across the city, or the trunks), the wrong trunk (a porter's label swap), a traveller's tale from the south.
- **The Cathedral of the Lamp** (`capital_cathedral_life`): `cathedral_under_the_lamp` (recurring: sit under the Lamp, or read the memorials), the crypt archive (donate for lore +medium, or copy), the ringing chamber (ring the peal, or climb to the spire), sanctuary at dusk (`slot: evening`).
- **Printing Row** (`capital_printing_row_life`): `printing_row_broadsheets` (recurring: read them all, or sell a story), your name in print (`renown >= 25`: a better story about someone else, or pay to pull it), the printer's devil.
- **The Undercroft** (new, evening and night, found through the docks): `undercroft_dice` (recurring: a stake and a deceive check), fight night (a bet on the pit; no fights are played), the fence who wants enchanted goods appraised.
- **The Rookery** (new, evening and night): `rookery_rooftops` (recurring: run the routes, a feat; or watch the city), the crews' chalk marks (different for a street origin), the watch coming up onto the roofs.

## Retrieval

`retrieve search` per premise before drafting. `retrieve related --draft` per card, then rework: the coaching yard's card sharper repeated `lesson_compel` (a shell game on a barrel, a farmhand's wages), now a porter's trunk-label swap; the choir audition repeated `choir_solo`, now the bell-ringers' chamber; the chalk-marks card's "add your own mark" repeated `gargoyle_passage_old_marks`, now checking the roof a mark promises. Kept apart: `midnight_boathouse_ring` (the academy's ring; the Undercroft is the capital's own hall), `world_lamplighters_round`, `courier_race_gulls`, `job_board_porters_crates`.

## Self-review before the critic (the patterns C2's critic found)

No recurring card's showing assumes an earlier one (the foreman, the croupier and the cathedral variants reworded); slots and `time:` match each place's `open:`; the chowder's hint matches its effects; no "Adequate" (Lady Vaneshade's word). zh uses the existing place names (明灯大教堂, 驿车场); glossary adds the round-2 capital names.

## Round 2 (after the critic's rejection)

- Discovery: both options of `docks_undercroft_word` and of `docks_roof_runner` now set their flag (the docker shouts the way after you; the roof-runner shouts the Rookery's name back from the ridge). The roof-runner is `time: evening`.
- `rookery_watch_chase` (repeated the roof-runner) is now `rookery_watch_guide`: the watch asks you to guide them over the roofs; lead them astray (deceive) or give away the crews' ways (coin, alignment +tiny, mood).
- `undercroft_dice`: the wager rule (`challenge deceive journeyman unlikely luck`), no "man on your left"; the right option is the Undercroft's own, minding the iron door for the house (coin, alignment -tiny).
- `printing_row_devil` (repeated the yard's parcel run and `know_nessa_planted`) is now `printing_row_jammed_press`: work the jammed press by hand, or coax it with a spell.
- `undercroft_pit`: `chance unlikely` (long odds); the stance lesson gives vigor. `printing_row_your_name`: a better story costs alignment -small; or let them print it (renown, mood); no paying for nothing. `coaching_yard_wrong_trunk`: the coin is `gold +tiny`. `cathedral_sanctuary`: the right option pays his debt (gold -medium, alignment +small), no "sensible thing" echo.
- Shown costs and repeats: `docks_day_labour` (a day; the book stays shut), `coaching_yard_arrivals` (health for the trunks; `time: morning noon afternoon evening`; the porters line parses), `rookery_rooftops` (no crew or gaol for everyone; the lessons feel far), `cathedral_under_the_lamp` (no "this time"; the chapter stays unread), `fish_market_auction` (frozen feet are health). `docks_northern_ship`: the ice melts by the break's end; the North's lights instead of old families. `fish_market_golden_fish`: the fishwife puts the fish in your hands. The fence's closer no longer echoes the roof-runner's door.
- zh: the crews in general are 街头帮伙 (glossary); the player's own crew stays 伙伴们.
