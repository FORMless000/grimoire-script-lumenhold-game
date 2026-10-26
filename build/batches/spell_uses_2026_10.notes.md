# spell_uses_2026_10 — notes

Everyday uses of the basic curriculum spells (`content/events/spell_uses.grim`): three repeatable routine cards for each of
Flame, Foresight, Mend, Glamour, Haste, Shadowstep and Ward, at places across the campus and the village.

## Wiring

- `@pool spell_use` holds what every card shares (class routine, repeat 5, tag magic); each spell's pool `<spell>_uses`
  comes from it and adds `weight: 10 + spell_known(<spell>) * 15` (`@cond spell_known` in `content/core/conds.grim`).
- Each spell's visit appointment `<spell>_in_use` (`when: spell_known(<spell>)`, `chance: unlikely`) opens a visit on
  one of its cards. Engine change (`src/director.js`): a visit appointment deals only cards for the place being visited
  and rolls its chance only when it has one, so each scene stays at its own place. No existing appointment is affected
  (every built-in one has `use:`); covered by a new test in `test/framework.test.js`.
- Every card resolves without the spell; `up[spell]` is hidden until the spell is known and its mana is paid by the engine.

## Retrieval

Before drafting, the index was current (2026-10-25T23:09 sync). `retrieve search "<premise>"` was run on every premise
before drafting; the replaced premises below were searched too (Ledger: a dodging quote, the lamp out mid-layout, a moth
in the press, proofs to the cellar; stables: the tack room locked, owls in the rafters, the griffon chick; the
observatory shutter rope; the library: one copy of the set text, the rolling ladder, eating in the library; the
courtyard's loose pages; the duel hall's flying wand; the village's last cart; a greenhouse sprinkler; stirring a
remedy before it sets). Then `retrieve related --draft <one-card file>` on all 21 cards, and again on every replaced
or reworded card; the top 3–5 hits were read with `show` and the scratch reader.

| Card | Found | Rework |
|---|---|---|
| (old) ledger_office_tomorrows_page | `ledger_office_drying_line` is the same scene: tomorrow's page drying on the line, read it early or wait; the same "you find out at breakfast" and "it's about you, and short" beats. | Replaced by `observatory_shutter_rope` (Shadowstep: the dome's crank rope stuck up in the dark of the ribs). Its "name the stars from memory" line echoed `astro_star_names`, reworded. |
| (old) gargoyle_passage_drip, headmistress_tower_summons | Distinct premises, but simulated players visit those places about 0.1 times a game, so the cards were never seen. | Replaced by `library_crumbs` (Foresight: eating in the library during the head librarian's rounds) and `courtyard_loose_pages` (Haste: an essay blown towards the fountain). Footnote-sits-on-your-work (`life_library_cat`) and "rewrite from memory" (`soc_lost_notes`) echoes reworded. |
| great_hall_cracked_sky | `great_hall_tomorrow_sky` (the ceiling shows tomorrow, floating candles); `alch_cracked_tray` ("cracks close like seams being sewn"). | Different premise (a leak in the sky); the candle beats and the seam simile were cut. |
| mabels_cold_range | `mabel_cup` ("your cup on the hook", a milestone's punchline). | The cup-hooks line was replaced. |
| refectory_supper_hatch | `hungry_leftovers` ("the burnt bit is the best", "fills the bowl to the brim"). | Both lines replaced. |
| boathouse_good_boat | `boathouse_green_boat` ("floats with an air of surprise"). | The green boat is kept as a callback; the copied phrase is gone. |
| infirmary_slip_out | `amaranth_orders` ("You sleep fourteen hours"). | Reworded. |
| grimsbys_book_behind_counter | `grimsby_parcel` ("pay when convenient", "smells of rain"). | Both reworded. |
| the rest | Nearest hits (`world_bridge_in_a_gale`, `workshop_volunteer`, `courier_fisherman_waves`, `tavern_regulars_round`, `alch_first_mend`, `slice_ward_lesson`, `secret_garden_humming_pear` …) are different premises. | None. |

## Measured (80 games per style; `chance: unlikely` against the same seeds with the boost off)

Cards per 12 months once the spell is known, boost off → on: balanced flame 0.21 → 0.54, foresight 0.55 → 1.22, mend
0.39 → 0.82, glamour 0.41 → 0.90, haste 0.35 → 0.87, shadowstep 0.22 → 0.76, ward 0.69 → 1.25; social similar (about
×2.2). About 60% of a known spell's cards come through its appointment. `slim` (15%) measured about ×1.7. Simulated
players take the spell option whenever they have the mana (balanced) or about a third of the time (social).

Windfalls per year (balanced, 80 games, median / mean): no spell-use cards 1.00 / 1.05; cards with no boost 1.00 / 0.99;
with the boost 1.00 / 1.01. The `balance --quick` alarm "0.8 windfalls a year" is the 30-game quick median at the
threshold, not a shift.

## Engine fix found while gating

`balance --quick` reported a preview miss on `duel_fixture`: the stub put the loss at 0%, so the preview never explored
it, but the played fight can still be lost. A played fight's preview now keeps every outcome the card has
(`src/engine.js`, the challenge case; test in `test/world2b.test.js`). It changes only previews: a played fight is never
rolled outside the preview oracle.
