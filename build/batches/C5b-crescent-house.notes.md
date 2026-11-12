# C5b the house on the Crescent: author's notes

Batch: `content/events/maps/capital_heists.grim`, from the section "The house on the Crescent" to the end (16 cards), plus edits to the shared city-heist cards above it (`job_way_out`, `job_slip`, `job_caught`) so they serve both heists. Worldbook: the place `capital_crescent_house` (`content/world/places.grim`, uptown on the Crescent's curve, 520,58) and the soft lore `crescent_house` (`lore/soft/places.grim`). Test: `test/capital-heists.test.js` (four Crescent tests added).

## Context

- The second city heist, on C5a's shape (`job_where == 2`): the tallest house on the Crescent during one of its weekly balls (a garden ball in summer), open evening and night. Band 1 the ballroom (depth 1–2, apprentice: the footman, a quadrille with a dowager, the supper table, the conservatory's iron stair), band 2 upstairs (3–4, journeyman: the back stairs with a tray, the lapdog, the dressing room, the writing desk, the balcony ledge), depth 5 the safe in the study. `crescent_dead_end` (weight 1) is always drawable.
- **Found** at the members' club (`club_gala_card`: an invitation down the side of an armchair, kept or returned) or by the Undercroft's fence once you've met him (`undercroft_crescent_tip`, `seen(undercroft_fence) > 0`). **Cover:** 1, +1 with the kept invitation (`crescent_invited`), +1 with the servants' hour (`crescent_servants_hour`: the fence's tip or the link-boy at the gardens' railings).
- **Ties to C5a:** the writing desk's letters are the bonded warehouses' foreman writing to the shipowner about the side door (`crescent_letters`; with `bonded_ledger` the text says you know the hand). Reading them makes the safe easier (+1). The soft lore records where the shipowner's fortune came from.
- **The shared cards** now branch on `job_where`: the way out's haul and closing line, giving the loot away (pawnshop coins through letterboxes), the slip's corners (no crates), getting caught (the footmen send for the watch; you run into the Royal Gardens' dark), and the slip's "go on" queues the right heist. `job_crescent_deepest` is kept like `job_bonded_deepest`.
- Lessons from C4 and C5a applied: first/again pairs by `seen()`, never two-part cycles; no line assumes the last choice (keyed on flags where it matters: the writing desk, the safe, the link-boy); the item and spell ways round the safe are not free (Foresight is `challenge spell adept- likely`).

## Retrieval

`related --draft` per card, candidates read: `club_gala_card` vs `season_invitation` (the patrons' Season card addressed to you; this one is someone else's, found in an armchair). `crescent_enter` / `crescent1_quadrille` vs `midwinter_ball`, `season_ball`, `date_dance_lesson` (balls you're invited to and dances with someone you know; here a dowager drafts a stranger for the quadrille as cover). `crescent_safe_card` vs `tw_masters_study` (a locked study you pick at Thornwick; here a dial safe you listen to). `crescent2_balcony` vs `observatory_roof_ledge` (sitting on a ledge; here a crossing three storeys up). No premise repeats.

## Costs

Stealing is paid at the way out, as in C5a. Passes trade a check, mood (the silver up your sleeve, the necklace under the portrait's eyes), or the right spell (Glamour on the footman, Sleight's biscuit for the lapdog, Shadowstep along the balcony, Foresight at the safe). The club card's invitation is a small theft with its own Hollow; returning it costs mood and still tells you about the safe.
