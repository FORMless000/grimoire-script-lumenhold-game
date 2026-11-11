# P1 capital peers: author's notes

Batch: `content/events/maps/capital_peers.grim` (21 cards), plus 13 new facts in `content/world/facts/{lyra,mir,corvin,seraphine,bram}.grim` and extended soft lore in `content/world/lore/soft/people.grim` (Vaneshade House and Mrs Callow, the Oracle's Rooms, the Ten Clockworks and Greta Ten, Ashby Lane and Corvin's mother, Hollis House and Hester Hollis).

Wiring: one pool per home pin (`place:` + `actor:`), dealt only on a visit to that pin on a capital break; the four homes' `open:` slots were narrowed in F2 to the hours the peer's break schedule has them at home, so the peer is in. Corvin's lane is open all day, so his cards carry `slot:` (evening, night), the hours his schedule puts him there. Five cards are `region: capital` with an `actor:` (meeting them out in the city); `seraphine_capital_bells` is a cathedral place card at evening (her schedule has her there 40% of evenings).

## Retrieval

`retrieve search` before drafting, one query per premise (17 queries: Lyra's practice room, the cook, Lady Vaneshade's supper, the portrait gallery, the winter gala, Mir's bench, the drawer, the sister, Corvin's chair, the windowsill, the brother, Seraphine's window seat, an audience with the Oracle, the hidden painting, Bram's supper, the piano, Bram's sister).

Rework it caused:
- **The winter gala** already exists (`lyra_family_gala`): dropped; replaced by `vaneshade_supper_alone` (Lyra dining alone at a table for twenty).
- `lyra_mother_visit` (Lady Vaneshade questions you at the academy): the supper card no longer has her at table.

`retrieve related --draft` on every card (one per file), then rework:
- `oracle_audience` repeated `seraphine_what_you_want_to_hear` (the pleasant or the true prophecy): rewritten so the Oracle asks you to send Seraphine home to the family seat (the other side of `seraphine_mother`).
- `corvin_capital_fish_tab` repeated `corvin_between_debt` (pay Corvin's debt): replaced by `corvin_capital_quay` (a young pickpocket on the quay; Corvin warns her off).
- `seraphine_capital_bells` ("take her somewhere quiet") echoed `seraphine_too_loud` / `seraphine_overwhelmed`: rewritten as Seraphine winning bets on the bells, at the cathedral.
- `ashby_the_chair`'s shuffle lesson overlapped `corvin_cards` and `corvin_lucky_deck`: the option is now about his grandfather finding lost things (canon in `ashby_family`).
- `vaneshade_kitchen_toast`'s "learn to make toast" overlapped `lyra_toast`: the option is now Lyra's letters to the cook.
- `oracle_window_seat`'s "ask what yours looks like" overlapped `letter_seraphine_painting` / `seraphine_date_a_future`: now asks about a stranger in the queue.
- `bram_capital_no_sash` shares the "without his sash" image with `ring_cameo_bram` (a different premise: Bram fighting in secret); the opening line was changed so the two don't echo.

Kept after review: `ashby_brother_at_home` sits beside `corvin_brother` / `corvin_brother_again` (both at the castle gate); this one is at home, in his lane, and its fix is the lane itself (the windows open).

## Round 2 (after the critic's rejection)

- **Repeats:** home pools no longer carry `repeat:` (their cards play once per game). Each home keeps one recurring card, `repeat: 3`, with three showings in sequence (`{a|b|c}`, linked across text and says): `vaneshade_practice_room`, `clockworks_long_bench`, `ashby_the_chair`, `oracle_window_seat`, `hollis_inspection`. The street cards share the pool `capital_peers_out` (`region: capital`, once each).
- **Low-rel Lyra:** `vaneshade_practice_room` opens at `rel(lyra) > -10` (her second showing reads differently below rel 10). The door placeholder stays for the first visit on purpose.
- **`ashby_brother_at_home` dropped** (premise of `corvin_brother`, punchline of `corvin_brother_again`); replaced by `ashby_lost_ring` (a neighbour's lost ring, "like your grandad"; the payoff of the chair card's line that people still ask Corvin to find things). `retrieve related`: top hits are the card/deck cards, no shared premise.
- **`hollis_supper` dropped** (third telling of the father comparing you); replaced by `hollis_inspection` (his father inspects Bram's boots in the hall each morning, as Bram inspects first-years; you're inspected too). `retrieve related`: the father cards are at the castle and about comparison or the portrait; no shared premise. `bram.sir` now unlocks on it.
- **`corvin_capital_quay`** is a fish-market place card at noon (his schedule), "before the year's out", and studying the thief costs `alignment -tiny`. `seraphine_capital_bells` stays a cathedral place card.
- Facts fixed: `lyra.camp_bed` (bedroom downstairs), `lyra.cook` (toast every morning at home; writes weekly since school; no "only one"), `mir.drawer` (no lock), `bram.piano` (at home).
- Smaller: the Crescent walk isn't "cold"; Mir's beetle no longer promises repayment; the long bench costs health (the say shows the body); the drawer's footsteps are gone; the painting card's line no longer retells `seraphine.self`.
- Format addition found on the way: `@pool` may carry `region:` (added to the bundle properties; docs updated).
