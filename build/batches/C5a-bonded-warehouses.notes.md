# C5a the bonded warehouses: author's notes

Batch: `content/events/maps/capital_heists.grim` (19 cards). Worldbook: the place `capital_bonded_warehouses` (`content/world/places.grim`, the city map's two warehouse blocks on the wharf, 765,612) and the soft lore `bonded_warehouses` (`lore/soft/places.grim`). One existing card gated: `crew_loft_empty_hammock` (`capital_homes.grim`) now has `when: not flag(jory_freed)`. Tools: `tools/grim.js` (lint) and `tools/reach.js` now count a plan's own `day:` visit slots (the away plans visit at noon and night; before, a night-only away place read as never visitable). Test: `test/capital-heists.test.js`.

## Context

- The castle heists' pattern (`content/events/heists/shared.grim`, threads 1): card by card, slip away with what you carry any time; guile, deceit and feats, never a fight. Its shared cards are the castle's (prefects, detention, the village collector), so the capital has its own: `job_way_out`, `job_slip`, `job_caught` and counters `job_*`. The Crescent house (C5b) will join them as `job_where == 2`.
- **The watch, not the prefects.** Caught: a night in the cells and the magistrate's fine (gold), doubled for a face the watch knows (`job_watch_record`); running for it loses the loot and still leaves the record. No detention on a break; nothing follows you back to the castle.
- **The way out:** fence it under the middle bridge (the Undercroft's fence in the velvet waistcoat, `undercroft_fence`, or another; crowns and a little Hollow, as the castle heists), or give it away along Port Calder's lanes (renown there, no crowns, no Hollow: the stolen goods go to people with less).
- **Found** at the docks (`docks_bonded_talk`, an old pensioned-off watchman), by a Port Calder childhood, by the crew's old job (`crew_job_done`) or by the tide caves' culvert (`tide_bonded_drain`, C4), which also starts you on the floor (depth 3) and counts as knowing the round. **Cover:** 1, +1 for a Port Calder childhood, +1 for knowing the round (`bonded_round_counted`, from watching the wharf, or the culvert). The dog-man's drink makes the dogs easier.
- **Bands:** the yard (1–2, apprentice; four cards, two checks), the floor (3–4, journeyman; five cards, three checks), depth 5 the crown's strongroom (adept-, or the lockpick roll). `bonded_dead_end` (weight 1) is always drawable, as `st_dead_end` is, so a band never runs dry.
- **The ledger:** the first time the strongroom opens, the foreman's private ledger shows the side-door theft and the night the crew's Jory (soft canon: `crew_loft`, "serving a year … after getting caught at the bonded warehouses") was sent down for a crate already sold. Send it to the magistrate (alignment, Jory freed; for a Port Calder childhood `crew_loft_jory_home` at the loft) or sell it back to the foreman (gold, Hollow). The soft lore records the foreman.

## Retrieval

- `related --draft` per card, candidates read: `bonded2_round` copied the library heist's night lamp (`st1_library_rounds`: stand still and "you could be one" of the books): reworked into hiding in an empty tea chest that the watchman sits on. `job_way_out` / `job_slip` / `job_caught` / `bonded_dead_end` follow the castle's shared cards on purpose, with the city's people. `bonded_ledger` vs `feud_ledger_gone` (Bram's ledger in Corvin's coat): a different book and a different choice. `crew_loft_jory_home` follows `crew_loft_empty_hammock` (its payoff).

## Costs

Stealing is paid at the way out (a little Hollow when fenced), as in the castle heists. Passes trade health (sacking wire, spirit fumes), mood (the tea dust), or a check; the spells and the lockpick roll are the ways round (Shadowstep past the dogs, Seal on the crown's wax, Haste along the gantry). The ledger is the moral choice: its price against Jory.
