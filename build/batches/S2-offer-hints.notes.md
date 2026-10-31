# S2: hints toward the special offers (threads 2)

**File:** `content/events/offer_hints.grim`. It holds 7 cards in `@pool offer_hints` (routine, `weight: 14`, once each) and 7 visit appointments.

**Other files:**
- 5 leads in `content/world/clues.grim`;
- one conditional line on each of three counters in `content/events/kit/shops.grim`: the square, Grimsby's and Pell's.

## Wiring

- **The five shop offers' hints:**
  - `hint_ashwood_bite`: Mir, anywhere.
  - `hint_ward_thread`: Amaranth, anywhere.
  - `hint_almanac_page`: a barge hand, at the village.
  - `hint_spoon_brass`: Pell's daughter, at the village.
  - `hint_silver_honey`: Maud, in the greenhouses.

  Each is gated on its offer's own condition, the item not yet owned, and its lead not yet held. Both options `find` the lead; the hint is the point, and the options differ in what they cost.
- **The leads:** `lead_offer_ashwood`, `lead_offer_ward_cloak`, `lead_offer_almanac`, `lead_offer_spoon` and `lead_offer_honey` (`kind: lead`, `followed: has_item(...)`).
- **While you hold a lead,** a visit appointment (`at: visit`, `place:` the offer's place, `chance: likely`) deals its offer card first. The offer's own `when` still decides.
- **The same appointment for the two Whisperwood gifts:** they key on their existing leads, `lead_heartwood` and `lead_spinner_silk`. Their cards (`hint_heartwood_warm`, `hint_silk_light`) are reminders two months after the gift, with no new lead.
- **The counters:** the square mentions the dark thing under Mir's cloth, or the shining thread at the tailor's; Grimsby's mentions the almanac in his pocket; Pell's mentions the spoon by the till. Each line shows while you hold its lead.

## Measured

15 games per style. For each offer: the games where it was seen, out of the games where its condition ever held.

| Style | Before | After |
|---|---|---|
| balanced | ashwood 0/13 · cloak 0/7 · almanac 0/15 · spoon 2/15 · honey 1/15 | ashwood 4/14 · cloak 1/2 · almanac 1/15 · spoon 1/15 · honey 1/14 |
| truant | ashwood 2/14 · almanac 1/15 · spoon 4/15 · honey 3/13 | ashwood 7/14 · almanac 3/15 · spoon 3/15 · honey 5/14 |
| lumen | ashwood 0/13 · almanac 2/15 · spoon 6/15 · honey 2/12 | ashwood 5/15 · almanac 5/15 · spoon 6/15 · honey 7/14 |
| hollow | ashwood 0/15 · almanac 2/15 · spoon 1/15 · honey 1/13 | ashwood 8/15 · cloak 2/5 · spoon 6/15 · honey 3/11 |
| explorer | ashwood 0/14 | ashwood 8/13 |

- The bots visit the square only about 1.6 times a game, and spell problems outweigh the offers there, so a weight tilt didn't move them. The visit appointment did.
- The Whisperwood two are still too rare to measure: the explorer reaches the elder oak about once in 15 games.
- **Below the plan's 10% target:** almanac and spoon for balanced and social, and social generally (it rarely shops).

## Retrieval

**`related --draft`, per card:**
- **`hint_silver_bee`** (a silver bee follows you; walk it back to Maud) repeated `item_honey_bees`, so it became `hint_silver_honey`: Maud shares a slice of silver-honey bread in the greenhouses.
- **The other cards' top matches** are their own offers, and the item stories that follow them (`item_ashwood_lyra`, `item_almanac_lighthouse`, `item_frost_ward_thread`, `pell_count_drops`). All are different scenes.
- **`hint_almanac_page`** doesn't teach Grimsby's lighthouse fact: `heard_mabel_grimsby` does that. The barge hand says only "talk to him about the right thing".
