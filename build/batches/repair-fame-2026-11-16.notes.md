# Repair pass, fame: scandals, spotlight, society (2026-11-16)

Findings from docs/reviews/critic-pass-2026-11-15: scandals (12), spotlight-known (10), spotlight-famous (11),
spotlight-legend-and-fallen (11), season-and-society (10), and knowing-a #12 (scandal_secret_out). All 55 fixed; none
dismissed. Also the 9 issues the countryside critic raised on the previous commit (repair-maps-country).

## Shared changes

- **Spotlight and scandal pools are once per card now.** `@pool spotlight` and `@pool scandal` lost `repeat: 1`: every
  spotlight card is a one-time premise (the memoir, the society, the flourish, a legend's burden), and a scandal
  replaying with the same culprit was the scandals #11 finding. The two cards written to repeat (`spot_owl_mail`,
  `spot_saved_seats`) keep their own `repeat: 3`. Cast scandals (`per:`) are once per person.
- **Scandals wait for term.** `@pool scandal` has `defer: break`: a callback queued by a spotlight choice comes in term,
  like the random ones, so a scandal's study cost always counts.
- **Lies move alignment on the act.** The deny option carries `alignment -small` before its check in
  `scandal_ledger_lie`, `scandal_ex_tells_all`, `scandal_curfew_column`, `scandal_snubbed`, `scandal_secret_out`, and
  `alignment -tiny` in `spot_ledger_profile`. The lose-only alignment lines are removed.
- **The Ball's opening dance follows the Ball.** `spot_ball_opening` left the Famous pool. `midwinter_ball` queues it
  `now with` the partner the player chose (Lyra and Corvin on a win, Tobias, Seraphine, Mir, Kael and Nessa), ahead of
  `ball_last_dance`. Its `when: renown_famous()` re-checks when it's due, so only a Famous player gets it, and a player
  who skips the Ball or goes with friends never sees it. Checked with a harness at renown 70 and 20.
- **Lint:** the study-on-break rule knows a queued card dealt only by term-time appointments (spotlight, scandal) and
  `defer: … or break`. Warnings fall from 156 to 128 from this alone.

## Children (the user's list and the critic's)

- `spot_named_child` (the newborn the player held) is now a fishing boat the blacksmith's daughter named after you, at
  its launching. The id is kept.
- `spot_disguise_day`: a woman with a basket of eggs exposes you, not a small child.
- `spot_village_recognised`, `spot_family_tour` (the father wants the dragon), `spot_guest_flyer` (first-years),
  `fallen_unrecognised` (the crowd by the fountain), `spot_owl_mail` (a farmhand writes).
- Countryside critic: the link-boy is a linkman, the knife-thrower's volunteer and the oatcake seller are young women,
  the broadsheet boy is a newsvendor.

## Card by card (what changed, briefly)

- Scandals: ledger_lie (the profile's win now has the dragon), memoir (the setup signs away final say), flourish_hurt
  (deny is the truthful "didn't invent it", an appeal; the own option shows the afternoons and reading given up),
  wrong_notes (the mistake is an allegation; tutoring shows the week's reading), curfew_column (owning up gives
  detention; the alibi is the kitchens till three, the cook locks them at midnight; no unpaid suppers),
  thornwick_defection (the doubt is other people's).
- Spotlight: village_recognised (the bun is paid for; the afternoon was the library's), signature (it took a term,
  not a week, so signing endorses a false claim; the lesson costs your reading), saved_seats (re-premised: the seats
  beside yours are being sold; sit in them or make them refund, with a cast friend instead of an assumed table),
  shop_window (a few crowns a week, paid on Fridays), name_dropped (no meeting count), three_invitations (the
  stargazers and the Newt in one evening, your share of the bill), owl_mail (variants re-paired, study shown).
- Famous: endorsement (the cut arrives in both branches), impostor (the baker tears up the account; the shops pay a
  reward), lecture_crowds, routine_known (shut out for the day), petition (one trial all-night opening), party_host
  (detention), friend_strain (the reading lets go).
- Legend and fallen: tavern_song (a toast, not a drink), history_essay, villain_play (the cast share their supper),
  guest_lecture (you write up the syllabus on your own time), renown_fallen_entry (no Ledger front page or bread; waits
  for term), fallen_unrecognised (the baker's callback keys on `seen(spot_village_recognised)`), fallen_friends (no
  standing Thursday game; the essay stays unfinished).
- Society: the Season's `season_price` is queued from the ball (in 2), so it no longer depends on `season_friends`
  finding a friend; the rival's journal lines describe the supper, not the ball; the ball's dawn costs tips to the band;
  Lady Vaneshade's purse is "for gloves"; the standing invitation sends a purse "for the coat"; fame_rivals_for_you is
  one invitation and a rival's ultimatum; fame_wedge has no timeline and shows the evenings; fame_best_friend_claims
  moves each relationship the way the outcome shows; fame_after_you claims no past rivalry.
- `renown_famous_entry` waits for term (study on a break).

## Countryside critic (repair-maps-country), small items

gy_scarecrow_names (long wet grass, not dew), coppice_rides (for hours; splinters for the health cost), job_slip (no
repeated "somewhere"), streets_pieman (sweeps it into his apron), lanes_strawberries (the haymakers are in the text).
