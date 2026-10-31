# M3: the placeholder places (threads 2)

## Finding

The four places that had quiet-hour placeholders (playtest 2, I7) have since filled up with real cards:

| Place | Cards |
|---|---:|
| courier loft | 6 |
| headmistress's tower | 5 |
| ledger office | 7 |
| flight field | 9 |

Their pools repeat up to 5 times each. The placeholders have weight 2: they are fallbacks for an empty visit, and with these counts that no longer happens. So M3 shrank from the plan's ~18 cards to topping up the two thinnest places and retiring all four placeholders (`when: false`, ids kept).

## Cards

- `courier_loft_broom_pension` (the loft): the couriers pension off a forty-year broom, and someone has to give the speech (perform).
- `courier_loft_described_parcel` (the loft): a parcel addressed "to the student who waves at the barge every morning"; once only.
- `headmistress_tower_dictation` (the tower): her secretary is ill, so you take down her letters to parents, the last one to a failing second-year's parents.

## Retrieval

`search` before drafting. Planned premises that are taken, and dropped:
- a love letter carried across the castle (`between_love_note`);
- a chess game left unfinished (`isolde_chess`, `know_isolde_chess`);
- the portraits gossiping (`life_portrait_gossip`);
- the detention list (`det_prefects_room`, `corvin_takes_the_blame`).

`related --draft`:
- the broom pension vs `courier_loft_broom_rack`, `broom_courier_broom_scramble`, `courier_fix_broom`: different premises (buying, a scramble, a repair);
- the parcel vs `broom_courier_dead_letters` (sorting dead letters): different;
- the dictation vs the writing-home cards: different (her letters, not yours).

## Round 1 critic fixes

- **`courier_loft_described_parcel`** (close to `broom_courier_dead_letters`, with a refusal propped up by alignment) is now **`village_barge_scarf`**, in `village_routine`:
  - A barge hand on the village jetty hands you the parcel, so the address is not a description and the dead-letter shelf isn't involved.
  - The other option gives it to a first-year who waves too (`alignment +tiny`, `renown +tiny`), a real choice with its own ending.
  - Once only, in term.
- **`headmistress_tower_dictation`:**
  - `rel host`.
  - The study cost shows in each left variant.
  - The "first time" claim is gone.
  - The scene has no time of day.
