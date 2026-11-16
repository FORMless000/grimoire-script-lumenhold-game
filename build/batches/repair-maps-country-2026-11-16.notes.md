# Repair pass, countryside and region maps (2026-11-16)

Repairs for the Nov 15 critic findings in content/events/maps/countryside_homes.grim, countryside_peers.grim,
countryside_places.grim, countryside_wide.grim, good_year.grim, moors_delve.grim, tide_caves.grim,
region_streets.grim and region_streets_2.grim; the maps cards the new review lint flagged; and the capital batch
critic's polish (build/batches/repair-maps-capital-2026-11-16.critic.json, accepted with nine small fixes, all made).

## Decisions

- gy_ottilie_gone reads `gy_clues_found()`, a @cond summing the five discovery flags the clue cards already set
  (gy_guest_book, gy_coats, gy_miller, gy_almanac, gy_agent_plan), instead of the hand-kept gy_clues counter. The
  thread's `clues:` lists its leads, which `clues(good_year)` would also count, so the cond is the equivalent that
  reads only the discoveries; the counter is gone.
- Breaking or renewing the Tenant's bargain moves alignment on the act (+small); the Marsh aftermath no longer adds
  its own, and gives warmth (health) instead.
- Children recast as adults or moved to the background: the rock-pool shore-collector, the quarry's old shepherd, the
  mill's wool-winding women, the drover at the harvest board, the bargain's "neighbours", the lost old man, the
  lanky young shoeblack, haymakers, farmhands and dairymaids, apprentices in the water cart's spray, a sailor in the
  busker's audience.

## Dismissed

- streets_procession (region-streets#2): children on shoulders in the procession crowd are background under the new
  rule; they take no part in the scene.

## Retrieval

Skipped for these repairs: they change wording, costs, slots and gates, not premises. The recast scenes (the lost old
man, the wool-winders' rhyme) keep their premise and options; only who is in them changes.
