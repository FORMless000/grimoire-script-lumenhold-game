# C4 the tide caves: author's notes

Batch: `content/events/maps/tide_caves.grim` (23 cards). Worldbook: the place `capital_tide_caves` (`content/world/places.grim`, the city map's sea caves under the headland, 904,590) and the soft lore `tide_caves` (`lore/soft/places.grim`). Fights: `combat/setup/foes.mjs` (two foes, their EVENTS entries and the conger's persona), `loadouts.mjs` (the conger, built from creature moves), `flavor.mjs` (its defeat line). Test: `test/tide.test.js`.

## Context

- The capital's delve, on the moors' pattern (`content/events/maps/moors_delve.grim`, K3), which is the Whisperwood's, shorter: three bands (the drowned stair 1–2 apprentice, the smugglers' galleries 3–4 journeyman, the sea's halls 5–6 adept) and depth 7, the sea's door, a sight and a swim rather than a shut door (the capital has no plot behind it).
- **Low water only.** The place is open at noon and in the afternoon: an away day is the morning plan card and four visits from noon (`morning=plan:0-1 noon=visit …`), so "morning and afternoon" would have meant afternoon only.
- **Found at the docks** (`docks_sea_back_door`, in the docks' pool, as the Undercroft and the Rookery are found), or known from a Port Calder childhood (`has(origin_street)`).
- **Grace:** 1, +1 for a Port Calder childhood, +1 in the courier's oilskin (an S1 bazaar item). Reading the tide ladder (`tide_calder_run`) starts later delves at depth 3. The way out sells to the marine-store dealer on the quay (who pays by the pound and asks nothing) or keeps the haul for study (alchemy first here, the moors give lore first).
- **Hooks for C5:** the culvert (`tide_bonded_drain`) climbs to a grating under the bonded warehouses and counts the watchman's round: a way in for the warehouse heist. The lookout and the cask gallery show the smugglers' trade still runs.
- **Band sizes** (the K3 critic's rule): band 1 holds five cards with two checks (four after the ladder is read, one check); band 2 five with two checks (lookout, the turning tide; the ladder-style research card is band 1's); band 3 five with two checks (conger, the sea's hall). Every band outlasts two passes plus a fall on each check card. Nothing in bands 2–3 is gated on a flag.

## Fights (combat/tools/creature-study.mjs, decent classes 10 levels under the foe, foe on medium)

- **The smugglers' lookout** (band 2, journeyman): a forbidden caster, the `Underground tough` class as in the ring; nobody watches under the headland.
- **The conger** (band 3, adept+): a new creature (`Conger`: Maul from its hole, Fade into the water, Burrow), tuned to sit between the black dog and the barrow ram: classes win 0% / 65% / 88% at foe levels 30 / 40 / 50 (the ram: 0% / 5% / 28%). Seal (shut it in its hole) is the way round.

## Retrieval

- `search` before drafting: sea caves at low tide, smugglers' tunnels and contraband, mudlarks, a drowned stair, trapped by the tide. Nearest: `bridges_mudlark` (the mudlarks under the middle bridge: kept out of here; the shore has bait-diggers and a boy with a jam-jar instead), `capital_counting_house_quiet_hour` (the tide under the counting house's floor).
- `related --draft` per card, candidates read: `tide1_tide_ladder` was near `gargoyle_passage_old_marks` ("initials, dates and tiny arrows"): reworked into a ladder of notches with a gallery letter beside each, a tide-table, no arrows. `tide1_gull_cave` vs `fish_market_gull_war` (the gull general on the salmon; here a cave of gulls to run through or Ward under). `tide_sea_door`'s swim vs `lakeshore_cold_swim` (dares in the lake; here a feat out of the cave). `tide_soaked` / `tide_way_out` / `tide_fished_out` follow `moor_stumble` / `moor_way_home` / `moor_lost` on purpose (the pattern), with their own people: the marine-store dealer, a lighterman, Nan Merrow for someone at home in Port Calder.
- **Plot safety:** no `find`/`advance`/`close`. No bells (the drowned bell is the Hollow Star's), no frost, no stars (the shining pool is "sparks"), no sevens (the valley's). The figurehead, the shining pool and the gulls that watch the mouth are eerie and explain nothing.

## Costs

Every pass trades: health for copper, shelves and the phial; alignment for helping yourself from the smugglers' casks (theft from thieves is still theft: the only moral choice); mood for lying in the culvert and for stripping the figurehead. Spells and items are the way round (Ward through the gulls, Glamour past the lookout, Tailwind up the gallery, Seal on the conger, Brace on the ledge, Mend on the figurehead, the lockpick roll on the strongbox).
