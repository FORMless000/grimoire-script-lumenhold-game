# Phase 4 — every card rechecked on the new retrieval backend (2026-10-28)

The batches P4-02..14 were drafted and checked against an index synced at P4-01, so their `related --draft` runs never
saw each other. On the new backend (index ready, synced with every phase 4 card), each of the 210 cards was split into
its own file and checked again: `retrieve related --draft <file> --limit 7`, the card itself dropped, the top six read
(premises with `show` where close).

Most hits are by design: a scandal's own spotlight (it queues the callback), the cards of one thread or chain, a
"use what you know" card and the card that teaches the fact (`know_mabel_fourth_cake` ↔ `mabels_fourth_cake`,
`know_pell_counting` ↔ the drop-counting cards), a fallen star's card and the spotlight it mirrors
(`fallen_unrecognised` ↔ `spot_village_recognised`). Five overlaps across batches were real and are reworked:

| Card | Overlap | Rework |
|---|---|---|
| scandal_credit_taken (P4-09) | Title "Whose Idea Was It?" against P4-01's `between_whose_idea` ("Whose Idea Was It"). The premises differ (accused vs witness). | Retitled "An Idea Over Supper". |
| spot_newt_drink (P4-07) | Title "The {player}", the same as P4-08's `spot_flourish_named`; with `spot_named_child` it made three "named after you" cards. | Now "Whatever You're Having": half the Newt orders whatever you order, and the landlady wants you to order her unsold fizz. Same trades. |
| between_love_note (P4-02) | Its right option, "Tell {a} to say it in person", repeated P4-01's `between_peace_offering` ("Make {a} do it in person"). | Now "Help {a} write it better": four drafts and the poetry crossed out, or a bad sonnet and cold feet. Costs study -tiny. |
| fame_lend_your_name (P4-10) | "Lend your name" is `spot_endorsement`'s label, and the infirmary fund is `spot_charity_auction`'s cause. | The stall pays for the friend's own books; the option is "Let {f} use your name"; the charity's alignment step is dropped. |
| season_first_supper (P4-10) | Its choice (be the talk of the table / just be yourself) repeated `renown_patron_dinner`'s (be dazzling / be honest), the card that leads to the Season. | Now "Argue with the magistrate" / "Ask about her orchards"; the flags, the check and the journal lines are unchanged. |

Kept after reading: the three seat cards (`spot_saved_seats` fans against friends, `between_two_seats` two friends at
odds, `between_closed_table` a clique shutting out a first-year), `thorne_between_hard` ↔ `spot_higher_bar` (a friend's
essay against yours), `between_messenger` (relaying insults) against the two carried notes, `fame_rivals_for_you` ↔
`jealousy_two_invitations` (status, not romance; noted in P4-10).

The reworked premises were searched before rewriting ("whatever you order the whole bar orders next", "helping a friend
rewrite a love note", "arguing with a magistrate at supper", "a friend's stall sign with your name") and the five cards
re-run through `related --draft`. The old neighbours are gone; the nearest are the Newt's routine cards, the letters,
and the other suppers. `kael_letter_home` ("Help him find the words") is a letter to his mother, which is a different
premise. zh-CN: 21 lines re-translated, 0 stale.
