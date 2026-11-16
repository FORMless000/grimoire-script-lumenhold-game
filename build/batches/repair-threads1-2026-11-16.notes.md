# Repair pass, Threads 1: detention, cartographers, contraband, heists, fixtures_2 (2026-11-16)

Findings from docs/reviews/critic-pass-2026-11-15: detention (6), cartographers (6), contraband (8),
heist-restricted-stacks (6), heist-seventh-tower (5) and fixtures-middle-rungs (6). All 37 fixed; none dismissed. No
`find` or `advance` changed.

## Detention

- `det_vault_catalogue`: each variant shows the mood cost (sandpapered eyes, dull work, a worn-out patience).
- `det_prefects_room`: the option is "Lose one of {other}'s lines", and every outcome drops one line, not a name.
- `det_apology`: the first failure keeps you writing until your hand cramps. "Again" became "Once more", and the
  third honest variant no longer implies earlier apologies.
- `det_great_lens`, `det_flight_divots`, `det_gargoyle_scrub`: every variant that charges health shows numb fingers, a
  sore back or the parapet's cold. The second flight failure has the race team watching.
- The `detention` pool needs `term`. Detention is only served on a term month's visits, and this makes the lint agree
  (it cleared the study-on-break warnings for `det_great_lens` and `det_inkwells`).

## Cartographers

- `carto_map_keeper` needs `not flag(carto_map_done)`, so the finale can't return. The heist routes are separate cards
  and stay open.
- `carto_map_blanks` and `carto_map_keeper`: "this summer" is gone; the map is the last Keeper's handover.
- `carto_tower_chimney`: the failed climb shows panic and scraped elbows.
- `carto_recruit`: the invitee comes "just to look". It's a first visit, not a membership that nothing records.
- `gargoyle_midnight_one_short`: each failure shows lost sleep, barked shins or a cold.
- `gargoyle_midnight_lost_map`: the third variant gives up every route the lost map showed.

## Contraband

- `elixir_trunk` appears whenever a bottle is held. Pouring away was unreachable while that elixir's dose was active;
  each drink option keeps its own gate.
- `elixir_borrowed_bag` needs `not has(owls_ink_bottle)`, so it can't push you past the one-bottle cap.
- `elixir_finals_spare`: the Newt seller is "a former student", not a fifth-year.
- `grisk_elixir_favour`:
  - The third favour is a cover story you keep up ("a friend of mine was with you on Tuesday night"), which fits the
    deceive check.
  - Grisk's dear months are paid on delivery, so the bottle options need some gold when the price applies. This
    cleared the lint wager warning. My first attempt, an empty-purse branch inside `win`, shifted the zh-CN say keys,
    so I reverted it.
- `contraband_caught`: with both bottles held, the opening and both confiscation lines say two bottles.
- `wd_bright_grisk` is re-premised. `grisk_cross` already has him on your bed. Now the bottle turns up in your coat
  pocket "on approval", with a note saying your shaking hands were noticed at supper. You either leave the price under
  the boathouse step or put the bottle back there. Costs and effects are unchanged.
- `wd_ink_blank`: "While the ink was in you", not "Two months ago".
- `amaranth_quit`: the remedy turns your stomach and leaves you shaking till noon (the health cost).

## Heists

- `st_dead_end`, `tw_dead_end`: every failed search that charges health shows the hurt (a cracked head, a twinged
  shoulder, caught fingers, a bruised arm).
- `st2_charging_book`: on a repeat, the book is waiting for a finger. It no longer claims a debt.
- `st3_no_lamp`: the second success pockets a little book, to match the loot.
- `st3_glass_case`: the charm is rewoven ("new thread over the old"), but no tighter, since the check is unchanged.
- `st_vault`:
  - The text names two bottles when both were confiscated.
  - The bottle option reads "Pick the lock for what's yours".
  - The catalogued-shelf line reads `flag(vault_catalogued)`; otherwise you search shelf by shelf.
  - The second bottle win names the extra loot (a silver hip flask).
- `tw2_exam_cupboard`: leaving says the papers stay where they were. It no longer claims empty hands.
- `tw2_class_register`: a new flag, `heist_register_taken`. Once it's set the card is no longer dealt.
- `tw3_orrery`: the card needs `not flag(heist_pearl_taken)`, so the pearl can't be stolen twice. The dead "one planet
  short" branch is gone.
- `tw_masters_study`: learning Extraction also names the inkstand and medals, to match the two loot.

## fixtures_2

- `mabel_empty_hook`: she took the cup down on Monday to wash it and hasn't hung it back. Afterwards she fetches it
  from under the counter.
- `mabel_wrong_pot` is a confident guess, not a habit. "The you I'd got used to" replaces "last year's you".
- `vey_lunch_dare`: the stake is her pudding, paid on the spot. It used to be a favour nobody could ever claim.
- `brask_half_sentences`: the griffin's thorn stays a thorn, and the owl scramble takes skin off a shin.
- `brask_laugh`: her owl story's missing moral is an exercise she leaves you ("You supply it").
- `amaranth_tea_break`: the third variant leaves your notes uncopied.
- Study-on-break: `grimsby_read_aloud`, `brask_half_sentences`, `amaranth_tea_break` and `pell_castle_errand` need
  `term`.

## Lint

The wager rule now accepts a gold `if` anywhere in the option, including inside the check around the loss. Before,
it only looked at the top level.

## Critic round 2 (repair-threads1-2026-11-16.critic.json, 35 of 37 resolved)

- The bottle cap also gates `elixir_first_year` and `grisk_elixir_offer` on `not has(brightwater_bottle)`. The
  finding's "also affects" named both.
- `det_gargoyle_scrub`: the warm-stone variant shows your cold hands.
- `det_prefects_room`: the linked third win drops "one of {other}'s two lines", and failures put "the line" back.
- `vey_lunch_dare`: all three wins hand over the pudding.
- `wd_bright_grisk`: the price line is the note's postscript.
- `carto_recruit`: the doubled "look" is gone.
