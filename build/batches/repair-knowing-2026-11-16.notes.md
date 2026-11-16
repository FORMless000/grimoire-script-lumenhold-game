# Repair pass, the knowing set: knowing, knowing_2, full_picture, journal_cards (2026-11-16)

Findings from docs/reviews/critic-pass-2026-11-15: knowing-a #1-11 (#12 went with the fame commit), knowing-b #1-7,
full-picture #1-6 and journal-cards #0-3 and #5-9. All 33 fixed; none dismissed. This commit also folds in the
fame critic's seven minor issues (repair-fame-2026-11-16.critic.json, verdict accept).

## Re-premised knowing payoffs

Each of these pays off a fact the player learns on the very card it repeated, so the payoff option (`when:
knows(<fact>)`) stays and the problem around it changes. Each was checked with `retrieve related --draft`.

- `know_nessa_off_record`: you want to warn Nessa about a second-year feeding her a lie, without ending up as the
  source. Before, it was a friend's trouble, which repeated `nessa_between_story`.
- `know_nessa_planted`: you help Nessa's newest reporter, close to tears over the proofs, and tell them to find her
  planted error first. Before, you checked the proofs yourself, which repeated `nessa_fact_check`.
- `know_grimsby_nose` ("Grimsby's Cold"): his cold has taken his nose, a customer needs a book by its smell, and you
  lend him yours. Before, you found your own book by smell, which repeated `grimsbys_by_the_nose`. The closing-time
  wording is gone too.
- `know_marisol_spirits` ("Skimming"): the water spirits swat your stones at a lakeshore skimming contest, and you ask
  them nicely not to cheat. Before, it was a storm race, which repeated `tide_water_spirit_race`. My first redraft,
  her book stolen in the shallows, repeated `marisol_lost_satchel`, so it went. The nearest card now is
  `lake_skimming`, a quiet skimming card with a friend; the obstacle and the payoff differ.

## Continuity and gating

- `know_kael_thaw`: the recollection keys on `knows(kael.thaw)`.
- `know_ilse_stitch`: winter, term, and both Ilse and Kael around.
- `know_isolde_chess`: no unpaid "pay for the glass". The failure sends you to sweep up instead of fining you, which
  also clears the lint wager warning.
- `know_amaranth_truth`: the stairs lie moves alignment.
- `heard_grimsby_mabel`: the book is a gift.
- `full_picture`: the six gates now include every later fact the validation listed: Lyra 3, Corvin 3, Tobias 4,
  Seraphine 2, Mir 3, Bram 3.
  - Seraphine's calendar counts her own slips.
  - Bram's line reads `chosen(sell_a_secret, left)`.
  - Bram's demerit is written in the air.
  - Maud's soup is cooked together, not taught again.
  - Thorne's roses aren't at dawn.
  - Three picture cards need `term`.
- Year recaps no longer use study, which counts for nothing on the summer turn. Planning gives `lore +tiny` and
  rereading gives mood. They make no claims about when a partner arrived or who saved you a seat, and the spare
  journal comes out of your trunk.
- Nudges:
  - Quickquill and two-taps advice points to the first step you haven't done.
  - "Half a year" is now "a good while".
  - Footnote's wait is months, not eleven and a half years, and the text knows if you already paid the herring.
  - Lyra keeps your name on the board.
  - The red-ink nudge re-queues the stalled step, picked by its flags; a second copy due the same month collapses to
    one card.
- knowing_2: Grisk's shop pays out when you sell your spare ink. Each study cost names the work given up. The fourth
  cake makes you eat half.

## Fame critic follow-ups

- spot_ball_opening is told as the start of the night ("It began at the door…"), with one reaction for every partner,
  and Corvin's first-Ball line no longer has him arrive late.
- coppice_rides variant 1 gets blisters.
- The zh-CN label for fame_rivals_for_you is 留下不去，不选边.
- spot_three_invitations casts `{f}` instead of "your oldest friend".
- spot_memoir now says "signing away the final say".
- The lint's defer test ignores `break and …`.
