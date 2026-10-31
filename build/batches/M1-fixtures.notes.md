# M1: the minor cast's middle rungs (threads 2)

File: `content/events/fixtures_2.grim`, with 13 cards for Mabel, Grimsby, Marisol, Vey, Brask, Amaranth and Pell.

## Why

Each fixture's ladder ran from an introduction (rel 2 to 5) straight to a milestone at rel 15 to 20, with few cards between. Fixtures are `seeks: rarely` (track 2 pulls only from warmth 35), so their milestones were rarely reached. `mabel_cup`, `grimsby_mind_the_shop`, `marisol_storm` and `marisol_trust` were never seen in the balance runs.

These cards are the middle rungs:
- `trigger: social` cards from rel 4 to 9 (they come to you);
- place cards with the character as actor, gated on `met()` and a low rel.

Each card's warm option gives `rel +small` (or `+medium` on a won check), against a small cost the scene shows.

## Canon

Each card is built on the character's `voice:` and `@fact`s, read with `grim brief` and the facts files:
- Mabel: the cups of her regulars, "petal", "staff, near enough".
- Grimsby: lighthouses, and his poor memory for today.
- Marisol: the lake on exam days, asking and never demanding, the whoop.
- Vey: grading on fooling her, and smell.
- Brask: half sentences, the bite and the moral, the one laugh a term, and "remembers that you asked".
- Amaranth: short sentences, and "Keep doing that."
- Pell: counting aloud, never apologising, and correcting a label.

I invented no new proper nouns: Mabel's regular is an unnamed old man.

## Retrieval

`search` before drafting. Planned premises that are already taken, and dropped:
- the nose test (`grimsbys_by_the_nose`);
- the kept-aside book (`grimsbys_book_behind_counter`);
- the dry patch in the rain (`marisol_intro`);
- the open tonic cupboard (`infirmary_tonic_cupboard`);
- the remedy book (`know_amaranth_book`);
- the wrong label (`apoth_wrong_label`);
- the daughters' secret tonic (`pell_apothecary_tonic`);
- the mirror lagging (`jit_mirror`);
- the owl's feather (`item_quill_brask`);
- Mabel's range (`mabels_cold_range`);
- the tin for a first-year (`know_mabel_tins`).

`related --draft`, per card:
- `brask_half_sentences` was set on a feeding round. Three feeding rounds exist (`stables_brask_rounds`, `beast_feeding_round`, `brk_stables_round`), so it now takes a splinter out of a hippogriff's wing.
- `mabel_wrong_pot` vs `mabels_your_usual`: the inverse beat (she misreads you, because you've changed). Kept.
- `marisol_exam_calm` vs `evo_steady_cup` and `tide_lake_lesson`: different scenes. Here you hold a lantern while she calms the lake before exams.
- `grimsby_lighthouse_walk` follows `heard_mabel_grimsby`, the card where Mabel tells you where he goes, and is gated on knowing it. This is the walk out there.
- `vey_lunch_dare` vs `vey_pop_quiz` and `know_vey_smell`: different. Here you try to fool her, and her nose is part of the joke.

## Repeats

Cards that repeat open with a first-meeting line, and their "again" lines key on `seen(<own id>) > 1`.

## Round 1 critic fixes

- **`repeat: 1` is a one-month cooldown, not "once".** The one-time scenes now gate on `seen(<id>) == 0` and drop `repeat:`: `mabel_wrong_pot`, `mabel_empty_hook`, `grimsby_lighthouse_walk` and `brask_laugh` (her once-a-term laugh, once a game). The same fix went into M3's `courier_loft_described_parcel`.
- **Repeat lines:** `amaranth_tea_break` and `marisol_exam_calm` have `seen() > 1` lines.
- **Again-lines that assumed an outcome:** Grimsby's "Chapter two" and "We finished the last one", and Pell's "You told him right last time", are now neutral. "Which is what he said last week" is gone.
- **Canon:** Pell is 77, so "at seventy-seven". "Market Street" and the oculist are gone.
- **Honest trades:**
  - `mabel_empty_hook`'s right option credits the lecture (`study +tiny`).
  - `grimsby_read_aloud`'s right option is "Say you've your own reading" (`study +tiny`, `rel -tiny`).
  - `marisol_lost_satchel`'s right option is "Leave it to her and get to class" (`study +tiny`, `rel -tiny`).
- **`mabel_closing_up`:** text variant 2 no longer says the last barge has gone.
- **Costs shown in every variant:** the study cost of Pell's errand, Amaranth's tea, Vey's rehearsal, Grimsby's reading and Brask's whole sentence; the mood cost of Vey's lost dare.
- **`vey_lunch_dare`:**
  - The check is `deceive vs vey.guile -3`.
  - It is gated on `around(vey)`.
  - Its first again-line no longer claims a score.
- **Gates and promises:**
  - `marisol_lost_satchel` no longer says "three weeks before exams".
  - `mabel_wrong_pot` needs year 2 or later.
  - `amaranth_tea_break` promises no tonic.
- **Labels:** all are 36 characters or fewer.
