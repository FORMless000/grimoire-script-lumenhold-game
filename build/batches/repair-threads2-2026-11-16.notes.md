# Repair pass, Threads 2: pushers, Night Market, offer hints (2026-11-16)

Findings from docs/reviews/critic-pass-2026-11-15: pushers (4), night-market (1) and offer-hints (1). All 6 are fixed;
none dismissed.

- `grisk_kind_month`: the month's payment is 12 crowns and the refund is `gold +small +tiny` (11), so Grisk no longer
  claims to take nothing. He keeps a coin "for the ink", palmed before he slides the envelope back, and the outcome
  says the envelope is a coin lighter. The loan isn't retuned. The prose names no number.
- `grisk_regards_friend`: the friend role needs `around(friend)`. When a captured or departed friend's queued card
  rechecks its cast, it fails, so you never "tell her that evening".
- `lyra_rival_signed_up`: the check stays the fixed demonstration rung. Winning now means performing well (full marks,
  the same as hers), not beating her. "Again." is dropped from her parting line.
- `ember_old_coin`: selling shows the mood cost (Ember sulks, and you miss the coin).
- `ember_out_till_dawn`: the search names the missed lecture (study) and the bracken scratches (health).
- `nm_thornwick_shopper`: the third trade outcome is "she", to match the third opening.
- `hint_ashwood_bite`: the salve takes the hour kept for revision.

## Lint in these files

- `hint_ashwood_bite` and `nm_moon_scales` need `term` (study on a break).
- `ember_and_footnote`'s "let them settle it" option needs gold. A failure sends the librarian's bill.
- `nm_rumour_newt` stands. Its "night" words are the rumour's moonless nights, not the time the card plays.
