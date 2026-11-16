# Repair pass, Hollow Star, and the between critic's follow-ups (2026-11-16)

## Hollow Star

Findings from docs/reviews/critic-pass-2026-11-15: hollowstar-agents (3), hollowstar-convergence (1),
hollowstar-escalation (3), hollowstar-night (7) and hollowstar-grey-return (2). All 16 are fixed; none dismissed. No
`find` or `advance` changed, and plot safety is untouched.

- `ga_grey_board`: needs `not has(hungry)`. The refund needs a month whose board was actually paid; the debt reset
  zeroes `board_missed` but leaves Hunger. The scene shows the frosted thumbprint.
- `ga_grey_witness`: the girl's friends saw you take her aside, which shows the renown cost.
- `wa_maud_lantern`: the labels say what each option does ("Carry it, and walk her in" / "Borrow it for the night").
- `hs_go_down_early`: the fallback names no one ("Whoever it is isn't ready yet").
- `hs_key_recover`: the family option needs an ally who is around (`around(ilse)` or `around(kael)`). The speaker is
  Ilse only if she's here.
- `hs_shadow_late`: the say comes before `meet seraphine`, so a first meeting gets its own opening.
- `hs_grey_daylight`: a successful hide keeps the key, or leaves Kael's whereabouts hidden. You never run "with
  Kael".
- `hs_night_company`: going alone with nobody following shuts the hatch without anyone to protest.
- `hs_night_cult`:
  - The early descent has six figures, not twelve.
  - Maud gets her own exchange with Madame Dumont about the door: "I lost one to it… Not this one."
- `hs_night_shadow`: the stairs callback keys on `seen(hs_shadow_late)`. On an unseen route you notice the lag here.
- `hs_beneath` (bargain) announces Eclipse, the coin and the crown at the door.
- The aftermath cards are now told a month on:
  - `hs_aftermath_bargain` says "A month on…".
  - `hs_aftermath_quiet` says "that night".
  - `hs_aftermath_freed` says "On the night of the door…". These stay queued `in 1`, so the arc's tests and timing
    are unchanged.
- `hs_aftermath_freed` charges a single injury (`health -small`), like the sealed routes.
- `hs_aftermath_fled`: the apology earns tea and a chair at her window. The silver ring and the rota implied a Warden
  induction that nothing recorded.
- `hs_grey_return`:
  - The errand is now stopping the entrance hall's great clock for a minute at midnight. The old errand, an unread
    letter left at the boathouse, repeated `life_shady_offer`.
  - The refusal is said to his face.
  - The callback reads `chosen(hs_grey_offer, right)`, not the shared `hollow_tempted` flag.
  - The effects (gold, `star_taste`, Eclipse) are unchanged.

## Between follow-ups (repair-between-2026-11-16.critic.json, verdict reject)

- **Blocking 1, `tobias_mir`:**
  - `tm_invitation` is dropped only on a bond (`courting()`), and a passing crush (spark 30 or more) only defers it.
  - The let-go status and its Journal line read the bond, so they can't flip back or contradict the invitation.
  - The critic's fixtures pass.
- **Blocking 2, feud Journal:** the new `feud_lock_tried` line moved to the end of the list. Journal stamps are keyed
  by index, so live saves keep their lines. The zh-CN keys are restored to their old hashes, and the new line uses
  没收库 and 让.
- **Non-blocking:**
  - `between_partner_meets_ex` sits with them, without introducing them.
  - `between_inside_joke`'s costs are embarrassment and letdown.
  - Kael's walk is awkward, not wet. The zh-CN line is no longer ambiguous.
  - The Tobias sayings cast excludes Nessa and Bram.
  - Bram's coaching is evening only.
  - `mir_between_owl` shows the lost revision.
  - The circle's later cards know when it split into two tables.
