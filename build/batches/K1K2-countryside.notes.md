# K1 + K2: the countryside's homes and public places (new maps)

Tracker: `docs/maps-plan.md`. Files: `content/events/maps/countryside_homes.grim` (K1, the Marsh: 6 cards) and `content/events/maps/countryside_places.grim` (K2: the market village, the mill village, the fields for travellers, the ridge: 12 cards).

## Context

- The countryside is a break map (`home`): two villages on one road through fen, moor and ridge. A scholar or hedge origin goes home here (`at_home()`); anyone else may travel here (lodging at the coaching inn, or a hayloft); field-station and expedition interns work here.
- **The valley's secret** is a side storyline still to be written (batch K4, "The Good Year"): an old fen bargain where, every seventh year, the villages "lend" a stranger to something under the moors, and the harvests stay good. This batch only plants unexplained details: the too-welcoming landlord, the harvest board's columns of seven, the scarecrows in travellers' coats, the counting rhyme ("seven for the one who came"), the mill wheel turning on a dry race, the drowned chapel's carved sheaves, the stones on the ridge that count one more aloud. Nothing here explains them, and nothing touches the Hollow Star.
- **The hedge-witch** in her stilt house is the hedge origin's grandmother (the existing cottage card called the hedge origin's guardian "your grandmother"). To everyone else she's a stranger who gives them rue tied with red thread. `marsh_rue` is set for K4 to read.
- **Work is found, not chosen** (the user's rule): each work place's fixed card (`always:`, tagged `work`: `market_inn_hands`, `mill_miller_sacks`, `fields_harvest_day`) is a day's work you take or pass on each visit; the arrival screen names the places that have it.
- **The home cards** that assume you grew up here (`pools/village_home.grim` fields and market pools, a few in `breaks.grim`, `slice_2b.grim`, `miniplots_2026_10.grim`) are now gated to `at_home()`; travellers get this batch's cards instead. The fields' traveller pool is `when: not at_home()`.

## Retrieval

- `search` before drafting: hedge-witch grandmother (Maud's cards are the nearest; Maud is a different hedge-witch, on campus), will-o'-wisps (`ww3_wisps`: riddling wisps in the Whisperwood; here the lights line a sunken causeway and never speak), drowned chapel (`tide_drowned_bell` is a bell under the lake heard in class), bees (dropped: the silver bees are Maud's), eel-catcher, too-welcoming innkeeper, harvest tally, skipping rhyme, dry mill wheel, gleaning, counting stones, carrying sacks.
- `related --draft` per card: `ridge_night_sky` first repeated `home_fields_night_sky` (the sky down to the ground on every side) and was rewritten as sightlines through the stone gaps. `fields_harvest_day` sits near `home_fields_harvest_help` (neighbours bringing in a crop): this one is paid day labour offered to anyone, the other a neighbourly favour at home. `ridge_count_aloud` is near `seventh_tower_stair_count` (a stair that changes count); here it's the eel-catcher's warning and one more stone when counted aloud.

## Checks

`grim batch` passes build, lint (0 in batch), dupes and canon; zh-CN is filled after the critic.
