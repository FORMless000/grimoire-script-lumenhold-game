# Repair pass, between cards (2026-11-16)

Findings from docs/reviews/critic-pass-2026-11-15: between-generic (4), between-known-a (5), between-known-b (8),
between-hearts (9), between-stories (7). All 33 fixed; none dismissed.

## Re-premised (duplicates)

Each checked with `retrieve related --draft` against its nearest neighbours.

- `tobias_between_sayings` repeated `tobias_bullied` (a classmate mocking Tobias's farm accent). Now `{o}` has sold
  Tobias's mother's sayings to the Ledger as a column under `{o}`'s own name. The choice is to tell `{o}` whose they
  are, or to get Tobias to write one himself (an appeal).
- `between_overheard` repeated `soc_rumour`. You still overhear `{a}` on `{b}`, but the choice now comes afterwards:
  tell `{b}` what was said, or take it up with `{a}` alone (an appeal). The speaker must be `at_odds` with `{b}`, so a
  kind character no longer leads the cruelty without an established feud.
- `between_setup_supper` repeated `date_meet_friends`. The supper is now going well for `{a}`, but `{b}` thinks it's
  a revision session, because that's what you told `{b}`. You either tell `{b}` (an appeal, Lumen) or let `{a}` carry
  it off (Hollow, with the odds).
- `circle_founded` repeated `soc_study_session`. You and `{o}` already share a Thursday lamp, and `{o}` has written a
  card for the board. The choice is to pin it up (the circle) or keep it just the two of you.
- `circle_newcomer` repeated `between_closed_table`, and also lost the story if no `{n}` qualified or the step came
  due on a break. Now the librarian says the circle is too big. It either moves to the cold north room together, or
  splits into two tables. It has no cast, has `defer: break`, and always queues the next step. The flags and ids are
  kept; the Journal lines are rewritten.

## Story wiring

- `tm_invitation` is still dropped once the player courts Tobias or Mir. The thread gains a `let_go:` status and a
  Journal line for that case, so it no longer hangs as ongoing with no next step.
- `feud_vault`: a failed lock attempt sets a new flag, `feud_lock_tried`, with its own Journal line. The "locked them
  in for an hour" entry no longer follows a failure.
- `tm_end`, `tm_invitation`, `feud_vault` and `circle_last` defer on `break`; `tm_watering_engine` needs `term`. The
  leave-the-picnic option's essay always counts.

## Card by card

- `between_boot_hex`: the scene covers all three hexes.
- `between_cover_roll`: the failed answer gives detention.
- `between_falling_out`: the reconciliation is honest (no false notes), so the appeal fits.
- `between_inside_joke`: `{a}`'s letdown and the barked shin are shown.
- `corvin_between_debt`: Corvin never repays, and the outcome says so.
- `kael_between_kindness`: an awkward hour, wet knees, nothing left to say.
- `bram_between_coaching`: gated to evening or night.
- `nessa_between_match`: nominating moves alignment.
- `mir_between_blunt`: needs `term`; each variant shows the revision given up.
- `seraphine_*`: the player's own unease or embarrassment, and `{o}`'s reaction.
- `tobias_between_sulking`: you kneel in the wet as the ferns' witness.
- `maud_between_soup`: needs `term`; the essay is forgotten.
- `maud_between_beans`: re-staking costs health (a sore back), not study.
- `thorne_between_hard` and `isolde_between_complaint`: the player's own essay and reading are named.
- `between_match_made` (telling) and `between_rumour_from_you` (letting it run) move alignment.
- `between_matchmaker`: "another house" in place of "the year below"; needs `term`; the revision is shown.
- `between_partner_meets_ex`: doesn't claim they've never met.
- `between_secret_about`: your own work slips.

## Lint sweep in these files

Study-on-break warnings are cleared by gating on `term`: `between_love_note`, `between_couple_bubble`,
`tobias_between_supper`, `mir_between_owl` and `between_peace_offering`, plus the story steps above.
