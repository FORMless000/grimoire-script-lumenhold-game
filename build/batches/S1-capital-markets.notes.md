# S1 the bazaar and the arcade: author's notes

Batch: `content/events/maps/capital_markets.grim` (14 cards), 10 new items (`content/world/items.grim`, "The capital"), 13 item options written into existing cards, `always:` counters on `capital_bazaar` / `capital_arcade`, and their placeholders retired (`when: false`).

**Counters** (`type: shop`, tier prices, one way out with no `when`):
- `shop_bazaar`: almonds (mood), rare reagents (alchemy XP), the courier's oilskin, the duellist's silk, a lockpick roll (alignment -tiny), the pocket orrery, the storm-glass; the **curio stall** offers one rare piece per visit, in turn (`visits_to(capital_bazaar) % 3`): ivory dice, a clockwork songbird, a sea-glass charm.
- `shop_arcade` (services): the physician (cures `sick` and `injured`), the baths (ends `exhausted`), the portraitist (renown, once), the fortune-teller (points you to a special offer's lead you don't hold yet, `lead_offer_ashwood` / `_spoon` / `_almanac`, the three that need no relationship; else a kind reading), and three counters queued from it: `arcade_tutor` (a skill of your choice, +medium for a large fee), `arcade_scribe` (a letter to each friend who is **not** in the capital, `not around(x)`, rel +small for a tiny fee; a forged letter of good character ends `watched` for alignment -small), `arcade_wandwright` (the glasscore and tidewood wands, the academy's loaner in part-exchange).

**Scenes:** the bazaar (`capital_bazaar_life`): Grimsby at the book stalls (cameo; a research check on the logbook's faults), an elderly gentleman pickpocket, the brown bird, the hatter's bet (appeal), a coast nobody has sailed. The arcade (`capital_arcade_life`): the fortune-teller's waiting room, two feuding tutors, the admirals' hot room. Once each.

**Items worth buying:** each has a worn effect nothing else gives (`on_cast any spell 1`, `cost tailwind`, `cost haste` with `on_defend`, `taken from forbidden`, frost resistance) and/or options on other cards:
- lockpick roll: `mir_padlock`, `tw2_exam_cupboard`, `corvin_locked_out`
- storm-glass: `tide_storm_drill`, `home_cottage_rain`
- oilskin: `life_cursed_umbrella`, `sum_rain_week`
- pocket orrery: `stars_cocoa_night`, `astro_stubborn_telescope`
- ivory dice: `gilded_newt_card_game`, `life_card_game`
- duellist's silk: `lyra_date_dawn_duel`
- clockwork songbird: `sick_in_the_infirmary`
Each target had no `up` option before.

## Retrieval

`retrieve search` per premise (13 queries: wands, pickpockets, fortune-tellers, physicians, baths, portraits, tutors, scribes, lockpicks, orreries, rain, storm-glass, curios). Kept apart: `life_fortune_teller` (the village tent), `renown_portrait` (the academy's gallery), `inc_fever_bill`, `inc_stolen_purse`, `corvin_intro`.

`retrieve related --draft` per card, then rework: the feuding tutors were over a footnote (`thesis_lab_footnote_war`), now over a pupil who became Lord Chancellor; the spice-seller's bet echoed `slice_market_haggle`, now the hatter's bet (`bazaar_hat_bet`). The gentleman pickpocket sits near `corvin_intro` (a different hook: an old master offers a lesson). Negotiations were turned into research and appeal checks (no new Crux encounters needed).

## Round 2 (after the critic's rejection)

- `tw2_exam_cupboard`: the lockpick option is `challenge feat using guile journeyman likely` with the right option's win and lose (`heist_slip` / `heist_caught`); its say works on a return visit.
- `astro_stubborn_telescope`: the orrery option is `challenge research standard likely` (lose: mood and health); no "for once".
- `lyra_date_dawn_duel`: the silk option is a one-time reveal (`when: not flag(lyra_saw_silk)`, `flag lyra_saw_silk`).
- `arcade_scribe`: the five capital peers' letters are gone (they're at home in the capital). Tobias, Nessa, Kael and Ilse each need `rel >= 5 and apart(x) >= 2` (a letter touches the bond, so it can't be bought again at once); Ilse also `not flag(ilse_taken)`. The scribe's door in `shop_arcade` opens once a month (`seen(arcade_scribe) == 0 or since(arcade_scribe) >= 1`).
- `gilded_newt_card_game`: no widow in the dice line. `arcade_waiting_room`: palm-reading win `alignment -tiny`. `home_cottage_rain`: the storm-glass option is once (`storm_glass_home`) and says "your family". `life_card_game`: the copied `when` is gone.
- Tidewood wand: `cost ward -1, taken -1 from flame` (no Mana, so the hazel stays the Mana wand). Curio prices: dice and songbird medium (`ivory_dice` pawns for small), the sea-glass charm stays large. The bazaar's curio line no longer assumes an earlier visit; items.grim says "per visit". Grimsby's book stall no longer promises a payback.
