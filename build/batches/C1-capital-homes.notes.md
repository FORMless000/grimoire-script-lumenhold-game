# C1 capital homes (origins): author's notes

Batch: `content/events/maps/capital_homes.grim` (10 cards), soft lore `crew_loft` (Nan Brack, Jory) in `content/world/lore/soft/places.grim`. Each origin home in the capital (F2 marks it "⌂ Home" for its origin) gets one recurring card, cycled in three showings, and two or three once-a-game scenes:

- **The family townhouse** (`origin_noble`): `townhouse_dinner` (recurring, evening: being weighed at the family table), `townhouse_calling_cards` (uptown's calls), `townhouse_suitable_tea` (year 2+: a suitable match arranged), `townhouse_family_silver` (night: the house pawns its silver between rents).
- **The counting house** (`origin_merchant`): `counting_house_end_desk` (recurring: the old clerk's tests, or dealing at the wharf door), `counting_house_damp_grain` (year 2+: signing for a spoiled cargo, alignment trade), `counting_house_violets` (your old room full of unsold perfume).
- **The crew's loft** (`origin_street`): `crew_loft_long_game` (recurring: the card game that never stops, coin or trick), `crew_loft_one_job` (evening: Nan wants one lock opened; refuse, or a roll), `crew_loft_empty_hammock` (Jory in gaol).

Origin canon: the noble letters' allowance, cousins and "anyone suitable" (`noble_letter`); the merchant's ledgers and trade; the street crew. Money flows match the origins' letters: the noble's allowance shrinks or grows by how you behave at home.

## Retrieval

`retrieve search` per premise (9 queries, before drafting). `retrieve related --draft` per card: the nearest are the F2 placeholders these cards replace in spirit (`capital_*_quiet_hour`, which stay as the quiet hour), `noble_letter` (the allowance; the townhouse cards act it out), `home_family_supper` (the cottage's supper: comic, not weighed), `pawnbroker_window` / `shop_pawn` (the player pawning, not the family), `season_invitation` (patrons' suppers, not the family's own callers), `life_card_game` / `gilded_newt_card_game` (campus games), `life_shady_offer` (Grisk's envelope, not a lock), `mabel_empty_hook` (a regular missing). None shares a premise.

## Notes

- `crew_loft_empty_hammock`: lint wanted a way out without gold; the left option carries the loft's own bread and costs mood.
- `crew_loft_one_job`: `flag: crew_job_done` on the job (read by C5's heists later).
- zh-CN complete; glossary adds Nan Brack, Jory.

## Round 2 (after the critic's rejection)

- The two placeholders that staged the same scenes are rewritten as different quiet scenes and stay as each home's fallback: `capital_counting_house_quiet_hour` is now the tide under the floor and the night porter's round; `capital_crew_loft_quiet_hour` is the chandler's shop downstairs. Neither has a clerk, a card game or the "wizard" greeting.
- `crew_loft_long_game`: "Put a coin in" is `challenge deceive apprentice+ wild` (as `gilded_newt_card_game`).
- `crew_loft_one_job`: the lock is `challenge feat using guile journeyman`; `alignment -small` and `flag crew_job_done` stay outside the check.
- `counting_house_end_desk`: the third showing is no longer a payoff (a ledger and a peppermint waiting), so the cycle can come round again; `time: morning noon afternoon`.
- `counting_house_damp_grain`: your mother runs the firm, as in `trading_report` and `choose_origin`.
- Nan Brack is now Nan Merrow (too close to Brask), everywhere: lore, cards, zh (南·梅罗), glossary. She is introduced at first mention on the job and hammock cards; "Took a fall" is "Got caught".
