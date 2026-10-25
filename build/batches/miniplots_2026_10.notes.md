# miniplots_2026_10 — notes

## Retrieval, done after the fact (2026-10-25)

The first version of this batch was written with no retrieval. `retrieve` said the index was unbuilt; the cause was
this session's own edit to `rag/src/catalog.js`, which is hashed into the index identity and orphaned the built index.
The batch fell back to `brief` and grep. At the user's request the index was rebuilt
(`retrieve index --rebuild --mode sync`: 2,133 blocks, 16:48–20:00 UTC) and retrieval was run on this batch's 15 cards
only. The rule now in `skills/write-academy-events/SKILL.md` §2 is that an unbuilt index blocks authoring.

### Queries

`retrieve search "<premise>" --limit 10`, one premise per card and one per thread:

| Card / thread | Premise searched |
|---|---|
| thread missed_round | the infirmary healer falls ill and the student covers her rounds |
| infirmary_missed_round | the healer misses her evening round and a fever charm burns down unattended |
| infirmary_sister_fevered | finding the healer sick in her office, report her or secretly do the rounds she dictates |
| infirmary_covering_rounds | a student runs the infirmary ward alone, mixing remedies for every bed |
| (old) lakeshore_fever_runaway | a feverish patient slips out to the lake at dusk searching for a lost ring |
| (old) infirmary_tonic_key | the healer offers the student a key to the medicine cupboard as a sign of trust |
| thread red_ink | an anonymous marker covers your essays in harsh red-ink corrections |
| lecture_tower_red_ink | a returned essay has a second set of anonymous savage corrections in red ink |
| lecture_tower_red_ink_reply | an anonymous marker asks why you want to be good at this; answer or stake out who collects it |
| (old) lecture_tower_red_ink_tremble | trembling handwriting and a reading list from an old professor whose hands shake |
| (old) lecture_tower_red_ink_office | asking an old professor who rarely writes them for a recommendation letter |
| thread late_bloomer | a grown young woman in your home town comes into magic late and you teach her |
| home_market_late_bloomer | the sweet shop daughter's late magic flares the candles blue |
| home_fields_bloomer_lessons | teaching a hometown friend a candle-control drill on a field wall |
| home_cottage_bloomer_father | a worried shopkeeper father asks what his daughter's late magic is for |
| home_market_bloomer_charm | a charm seller sells a bead that smothers magic; help her buy it or talk her out of it |
| home_market_bloomer_ice | panic magic freezes a horse trough around a carter's arm in the market square |
| home_cottage_bloomer_letter | writing to the academy to recommend a late bloomer, or giving her your old textbook |

Then `retrieve related --draft <one-card file>` for all 15 cards. Rank 1 is the card itself; ranks 2–8 were read with
`show` and the scratch reader.

Before drafting the replacements, their premises were searched: a patient lying about her fever to protect friends; a
healer back at work too soon, ordered to bed with her own words; a shy first-year who writes brilliant criticism; a
nervous student frozen at a seminar lectern; a first-year caught marking older students' essays; a sweet-shop girl's
magic boiling the sugar with no fire; practising fire over water; a fake glass bead that works because she believes
in it; giving away your practice candle. `related --draft` was then run again on all 12 changed cards.

### What retrieval found, and the rework

| Card | Found | Rework |
|---|---|---|
| infirmary_tonic_key | `amaranth_trust` ("The Cupboard Key") is the same scene: the key offered, and the refusal answered "Good answer. Wrong, but good." The same line, copied unknowingly. Hard fact `amaranth.key` says only a handful are trusted with it. | Card replaced by `infirmary_own_prescription`: she is back at work too soon and you order her to bed in her own word (a callback to `amaranth_orders` and `sick_in_the_infirmary`, reversed). No key; the flag `amaranth_key` is dropped. |
| infirmary_missed_round, _covering_rounds | `infirmary_night_watch` (turning the fever charm by the hour, "Keep doing that"), `favour_amaranth_shift` ("Keep doing that"), `amaranth_rounds` ("Again"), and "Adequate" from `lecture_tower_stair_question`. | The opening action is no longer turning the charm. The repeated lines are rewritten. "Acceptable" (from `plans_thesis.grim`) was replaced too, found by grep. |
| lakeshore_fever_runaway | `seraphine_lake_vision` has the same shape: a person walks into the lake at night; you wade in after her or fetch help. | Replaced by `infirmary_bed_six`: bed six lies about how she caught Lake Fever, to cover three friends hiding it. It builds on hard fact `amaranth.truth`, and on Amaranth's warning in the previous card that bed six will lie. "Says nothing, loudly" was cut (`sick_in_the_infirmary` has it). |
| lecture_tower_red_ink_office | `thorne_recommendation` is the same finale: Thorne writes the Conclave a letter "I don't write many", and it sets the same flag, `thorne_letter`. Hard fact `thorne.letters`. | Red Ink no longer involves Thorne. Harsh marking is already his trait in four cards (`favour_thorne_marking`, `thesis_margin_notes`, `thorne_disappointed`, `lecture_tower_stair_question`). The marker is now an unnamed first-year who can't speak in class. The finale is her seminar (`lecture_tower_red_ink_seminar`). |
| lecture_tower_red_ink_tremble | `sum_reading_list` and `letter_reading_list` (Thorne's reading list), `thorne_shaking_hands` (the reveal). | Replaced by `lecture_tower_red_ink_front_row`: you find her, red ink on her fingers. `lore:pim` (a nervous first-year) was checked and rejected: Pim is chatty ("forty-one questions"). |
| lecture_tower_red_ink, _reply | `lumen_ledger_red_ink` (Nessa's red quill), `world_margin_argument`: different premises. The "scorched cuff" and "Hm." lines pointed at Thorne. | The lines now point at the first-year. The card waits for `year >= 2` so she is younger than you. |
| home_market_late_bloomer | `hs_grey_offer` uses candles changing colour as a Hollow Star omen ("the candles return to yellow"). Blue-flaring candles could read as a main-mystery sign. | Her magic now boils the sugar pan on a cold stove. The lead `lead_late_bloomer` was renamed to "The cold stove". |
| home_fields_bloomer_lessons | `home_old_friend` sets "your oldest friend sitting on the wall at the edge of the fields". The label "the candle drill" is `illu_candle_drill`'s title. | Moved past the last row, onto stony ground "where nothing can catch". New label. |
| home_market_bloomer_charm | `home_market_charm_seller` establishes that his charms are fakes (bent nails), which contradicted a bead that works. | The bead is plain glass that works because she believes in it. The options are "Let her believe in it" and "Tell her it's only glass". The finale's damped branch now knows it's glass. |
| home_cottage_bloomer_letter | `letter_lyra_book` and `world_margin_argument` already have "your notes are wrong" in the margins. `seventh_tower_candle_landing` has candle stubs scratched with initials. | Right option now: leave her your practice candle, no initials; the reply is a drawing of it still lit. |
| infirmary_sister_fevered, home_cottage_bloomer_father, home_market_bloomer_ice | Neighbours (`heal_fever_ward`, `alch_lake_fever`, `pell_*`, `renown_ice_rescue`, `court_fountain_freeze`) are different premises. | None. |

Ids replaced (never pushed, so no saves or other content reference them): `lakeshore_fever_runaway` →
`infirmary_bed_six`, `infirmary_tonic_key` → `infirmary_own_prescription`, `lecture_tower_red_ink_tremble` →
`lecture_tower_red_ink_front_row`, `lecture_tower_red_ink_office` → `lecture_tower_red_ink_seminar`. The thread
`amaranth_rounds` is now `missed_round`, because it clashed with the existing event `amaranth_rounds`. Flags dropped:
`amaranth_key`, `ring_found`, `runaway_back`, `red_ink_seen_hand`, and this batch's use of `thorne_letter`.

## Measured (40 games per style, after rework)

The Missed Round finishes in every game that starts it, except one balanced game (plot 11/11, homebody 9/9, balanced
10/11). Red Ink: plot 10/12. The balanced and homebody players still bin the first essay. The Late Bloomer: homebody
32/40, unchanged.
