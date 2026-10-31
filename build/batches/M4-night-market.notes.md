# M4: the Night Market (threads 2)

Files:
- `content/events/night_market.grim`: 9 cards;
- `content/world/places.grim` (`@place night_market`);
- `content/world/lore/soft/places.grim` (`@lore night_market`);
- `content/events/expansion_summer.grim` (`sum_night_market` sets `night_market_known`);
- `tools/reach.js` and `tools/grim.js` (a slot opened by `visit <slot>` counts as a visit slot, so a midnight-only place is reachable).

## Decisions

The user's decision: the market opens every term month at midnight ("at new moon"). Canon: the soft lore says it comes on the moonless night of every term month, in a field past the village's last stile.

## Retrieval

`search`, before drafting:
- "a night market that appears in a field outside the village after midnight": `sum_night_market` (the summer glimpse, kept, now also reveals the market), `shop_square`, `verdant_head_gardener_show`.
- "a stall selling other people's dreams in bottles": `sum_night_market`, `pell_apothecary_humming_drawer`, `home_market_charm_seller`. No dream seller exists.
- "a wand tuner who takes a memory as payment": `item_hazel_tuned`, `maud_old_wand`. Neither trades in memories.
- "a hooded fortune teller at a midnight stall": `life_fortune_teller` exists in the village, so I dropped the planned wrong-fortune stall.
- "buying a stolen thing you recognise at a market": `home_market_charm_seller`, `inc_stolen_purse`. A different premise.
- "a Thornwick student out of bounds at night": `xchg_ink_cuffs` (the library, the exchange year), a different scene.
- "a lantern-maker's stall of coloured flames": `lantern_making` (Lantern Night), a different premise.
- "a rival moneylender to Grisk offering a loan": Grisk's own cards. I dropped this idea to keep his debt system single.

`related --draft`, per card:
- The stalls' first draft had a bottled thundercloud ware, which repeated `sum_night_market`. It was replaced by a candle that burns backwards.
- `nm_honesty_stall` vs `job_board_market_stall`: different; that one minds a stall for pay.
- `nm_moon_scales` vs `alchemy_lab_good_scales`: different; that one is a queue for honest scales.
- `nm_rumour_newt` vs `tavern_star_coin`: different. That card's coin is the plot's hollow star; this one's is a square market coin with a moon, and it says nothing about the plot.
- `nm_stolen_compass` vs `flight_field_long_grass` (lost things): different.
- `nm_thornwick_shopper` vs `xchg_ink_cuffs` and `life_rival_academy`: different.

## Reach

Measured with simulated players: the rumours (village and the Newt) reveal the market on either option, since hearing it is knowing it.

- **The bots** didn't take the rumour while knowing it was a choice, so the market went unknown.
- **The stalls** needed `slot: midnight` to fit a midnight visit.
- **Explorer**, one game: it picked the market 5 times, and the stalls and pool cards played.

## Round 1 critic fixes

- **nm_stolen_compass:**
  - The bluff names the castle porter's list, not the Wardens (plot safety).
  - It is now in sequence mode, with three different stolen things: a first-year's compass, a second-year's music box, a fourth-year's signet ring.
  - Each `say:` that gives renown says the owner tells others, so the renown fits.
  - The label is now "Bluff him out of it".
- **nm_thornwick_shopper:** the porter who sleeps through the ten o'clock bell replaces the Third Gargoyle line, which was a Cartographers' secret.
- **Repeat lines:** the stalls, the tuner, the honesty stall and the moon-scales had "back", "again" or "last month" variants in random mode. They are rewritten to read as a first meeting.
- **nm_moon_scales:**
  - The check is `appeal using guile journeyman`.
  - The win variants agree: he makes his scales true, with `guile +small` and `alignment +tiny`, and no hush money.
  - The refund punchline is gone.
- **nm_rumour:**
  - No "dusk"; the village is open by day.
  - The boy asks for a coin and runs off, so no coin changes hands.
- **night_market_stalls:**
  - The second dream variant now shows its cost ("wake unrested").
  - The ink line doesn't name Grisk.
  - The lantern's hint says it covers whoever noticed you slip out.
- **nm_rumour_newt:** the left label is "Buy a round for the rest of it".
- **sum_night_market:** its text now says that in term the market comes back every moonless night.

## Round 2 (accepted), polish applied

- **nm_stolen_compass:**
  - Back in random mode, with the `say:` lines made generic ("it", "its owner"), so no step sticks on repeats.
  - "Since your first week" replaces "three years".
  - The label is "Buy it back for its owner".
- **The tuner:** the "hating that she's right" line is gone.
- **The honesty stall:** variant 3 takes an apple, as the label says.
- **nm_rumour:** the scene no longer says what time of day it is, and there is no "until the light's gone".
- **The dream ware:** its lines show low mood, not tiredness.
- **nm_rumour_newt:** "The regulars drink to you…"
