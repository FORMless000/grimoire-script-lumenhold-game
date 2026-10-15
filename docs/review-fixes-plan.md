# Plan: acting on the event critique

The external critic (`../lifesim-reviews/event-critique/`, 23 reports) has reviewed 322 of 988 events, oldest first, and recorded 166 issues on 158 events (141 *revise*, 25 *polish*). This plan says which of its findings hold, how widespread each kind of problem is in the whole content (including the ~250 cards added in step X, which it hasn't reached), and how to fix them, mostly by kind rather than card by card.

## 1. Are the findings true?

**Reports 18–23 (the latest; 37 issues on 33 cards): all 37 confirmed** against the current source (`710c35c`), by reading each card and, where the claim was about behaviour, the rule it depends on. Spot checks of older reports also hold: the eleven-year-old tutee (`tutor_prodigy`, against the adults-only rule), the tavern's "double pay" that pays triple (`wage` + `wage overtime`), the essay prize paying thirty against its fifty-crown lore, the winter fund forcing a Hollow step on a broke player (`life_charity`), `life_pen_pal`'s ignore option training charm.

The critic's judgments follow the project's own rules: `docs/authoring/costs.md` puts Lumen on "protection, generosity at a real cost" and Hollow on theft, cheating and lying for gain; the four-year academy, the adults-only rule and the worldbook are canon. Where I'd weigh things differently:
- Some *revise* verdicts are really polish: `bram_intro`'s demerit costing a little preparation, `seraphine_tarot`'s tiny renown, `corvin_intro`'s "three crowns short" at an empty purse, `choose_origin`'s label length on a screen that doesn't clip.
- A few findings are already overtaken by step X: `starfall` no longer teleports players at home or on an internship (X16) and now names both roof and lawns; `midwinter_ball`, `starfall` and the `hs_*` cards changed (X6, X11), which the critic itself lists for rechecking.
- The critic found its issues one card at a time; the same defects recur in unreviewed cards, mine included (`renown_debate` and `timeloop_exploit` have a "fifth-year", and several X cards charge crowns without checking the purse).

## 2. What kinds of problem, and how many

Counts: issues in the reviews / a rough scan of all 988 events (it over-counts, so read it as size, not verdicts).

| Kind | Reviewed | Whole content | Examples |
|---|---:|---:|---|
| **A. Paying with an empty purse.** A fixed crown cost with no `when: gold >= …` or shortage branch; gold clamps at 0, so the scene is free. | 25 | ~140 options | `bram_hall_tax`, `lyra_family_gala`, `tobias_homesick`, `life_fortune_teller`, `sky_crash`, `crisis_collapse` (an unaffordable cure ends the run) |
| **B. Exam preparation in the wrong courses.** Bare `study` means every enrolled course; single-subject scenes (and non-study scenes: a demerit, a recommendation letter, a promise) use it. | 32 | ~88 cards | course cards `pyro_candle`, `alch_love_potion`…; `thorne_recommendation`, `isolde_warning`, `soc_lost_notes` |
| **C. Missing moral weight.** Theft, cheating, lying for gain or costly protection with no `alignment`; or alignment only on the winning branch of the same choice. | 25 | not scannable | `corvin_kitchen_raid`, `tutor_bribe`, `maud_ill`, `seraphine_lake_vision`, `life_charity` (forced Hollow) |
| **D. People who aren't there.** `rel X` for someone absent from the scene (and a `rel` meets them). | 5 | ~31 options | `nessa_source` (meets Thorne), `ghost_reveal`, `stables_dragon_egg` (Maud), many `rel isolde` |
| **E. Renown nobody saw.** Fame for private or anonymous acts. | 6 | not scannable | `nessa_source`, `egg_hatches`, `y3_last_duel`, `art_golem_helper` |
| **F. Calendar and clock.** Text that needs a term, an exam, a festival, a month or an hour the gate doesn't guarantee (break months, the wrap-up, turn 47, `time:` that only favours a slot). | 27 | ~60 cards | `lyra_letter` before the first Winter Trials, `tobias_dance_lessons`, `corvin_rooftop` "2am" at noon, `life_homework_mountain` after graduation |
| **G. Continuity.** A promise, absence, refund, consequence or fact the state never records, or a flag/fact that contradicts the branch taken. | 20 | not scannable | `tobias_bad_harvest`, `corvin_framed`, `maud_old_student`, `ilse_*` after she's taken, `lyra.inheritance`, `seraphine.lake` |
| **H. Canon.** A four-year academy with fifth/sixth-years; an eleven-year-old student. | 6 | 8 cards | `bram_turns`, `umbral_forbidden_notes`, `tutor_prodigy`, `renown_debate` |
| **I. Numbers that disagree with the text.** Wages, prices, prize money. | 9 | — | `tavern_extra_shifts`, `courier_storm`, `life_essay_prize`, `corvin_repays` |
| **J. Repeats that never vary.** Repeatable cards with one fixed text. | 9 | ~40 pool/social cards | `tobias_picnic`, `lyra_study_rivalry`, `soc_birthday`, `life_harvest_festival` |
| **K. Prose that hides a cost** (a health loss nobody suffers) or an obviously best option the lint missed (both options set the same flag; a state gain counts as "leads somewhere"). | 15 | — | `mir_fair`, `mir_family_business`, `thorne_storm_story`, `garden_maud_secret` |

## 3. The plan

### Step 0: three decisions for you
1. **Empty purse (A).** Either (a) a frozen-format addition: an option's top-level crown cost locks it when you can't pay ("Not enough crowns"), with a lint rule that a card never locks both sides; or (b) no engine change: a migration adds `when: gold >= <amount>` to each such option and the lint requires it from then on. (a) fixes all ~140 at once and future cards for free; (b) keeps the engine as it is but must fix cards where both sides cost. **Recommended: (a).** Wagers and costs inside a lost check stay as they are (losing what you have is honest); those few get a shortage line.
2. **Costly kindness (C).** Apply the guide strictly: `alignment +tiny` wherever the player helps at a real cost, and the same moral weight on both outcomes of one choice. This shifts measured alignment a little Lumen-ward. **Recommended: yes.**
3. **Order.** Tooling and migrations first (they fix most of A, B, D, H, J at scale), then the card-by-card kinds. **Recommended**, so the critic's next reports find fewer repeats of fixed problems.

### Step 1: tooling (lint and a migration)
- **Lint, new warnings:** `rel`/`spark` toward someone who is neither actor, cast role, named nor tokenised in the card (D); a top-level gold cost without a gate (A, if 1b); "fifth/sixth/seventh-year" (H); a repeatable (`repeat ≥ 3`) pool or social card with no `{~}` or sequence variation (J); clock words ("midnight", "2am", "at dawn") with only a soft `time:` (F); and in the obviously-best rule, a flag both options set doesn't count as "leads somewhere" (K).
- **`rename.js`** already rewrites `ramp:`/`defer:` (fixed with the Mir rename).
- **Migration (B):** in a course card (`track:` a course) bare `study` becomes `study <that course>`; in non-academic scenes the reviewer listed, the study effect is replaced by what the scene shows (renown for a recommendation, nothing for a demerit) by hand.

### Step 2: card fixes, by kind (about 120 cards from the reviews plus what the new lint finds)
- **C, alignment:** the 25 listed choices; theft/cheating `-tiny`/`-small`, costly protection `+tiny`; move success-only alignment before the check; `life_charity` loses the forced Hollow step.
- **D, E:** drop absent `rel`/renown or write the person or witness into the scene; `nessa_source` gets a real reason for faculty access (job, Thorne, or an overheard conversation).
- **F, calendar:** add `term`, `not wrapup`, exam-month and festival gates; `slot:` for scenes that name the hour; fix `tobias_dance_lessons` ("next month" when the ball is this month), `lyra_letter` (after the first Winter Trials), `ilse_farewell` (spring), `duel_lyra_training`.
- **G, continuity:** record what the text promises: Tobias's two months away (a state that makes him away), Bram's lost sash (a flag his prefect cards read), Mir's padlocked workshop (`closed_when` for a while), refunds and repayments that are promised, Ilse cards gated on `ilse_taken`/`ilse_went_north`, facts unlocked by flags of the branch that tells them (`lyra.inheritance`, `seraphine.lake`), `maud_old_student`'s kind option gives the clue over time (a queued tea scene), the career fair's "not yet" gets a later chance.
- **H, I:** four-year wording everywhere; the tutee is an adult first-year; double pay is double; the essay prize matches its lore; prices match their tiers.
- **J, K:** variants for the repeat offenders; prose for every hidden cost; `mir_family_business` and `thorne_storm_story` get a real trade.

### Step 3: finish
Translations for every changed line (zh-CN), `check`, `balance` (alignment and money will move a little), a new golden baseline, `npm run verify`. A short note in the critique folder listing what was fixed per card, so the critic can recheck instead of re-finding; the critic continues its queue (659 events, including all of step X).

**Size:** step 1 is a handful of lint rules and one migration; step 2 is roughly 120–180 card edits, in batches of 30–40 by kind, each batch translated and checked; no new mechanics except option 1a.

## 4. Outcome (October 15, 2026)

All three decisions were taken as recommended, and the user added one rule: no card may make crown loss unavoidable unless it is an incident.
- **A.** `@game afford: gold`, the lock for unaffordable options (engine, card UI, menus, a test). A new lint rule rejects `on_show` crown costs and cards where every always-available option certainly costs crowns, outside incidents; 18 cards gained a free option, and the enrolment fee became the `course_fees` term hook. Wagers inside a check got gold gates where the text names a stake.
- **B.** Migration `0031-course-study` (course cards); non-study scenes were fixed by hand.
- **C–K.** Every finding was fixed card by card. Continuity needed one more format addition: `@npc gone_when:`, used for Ilse, Grisk and Tobias. One new card, `maud_tea_tells`, carries Maud's kind option to the clue.
- **Handoff.** The per-card list of fixes and a pattern scan of the 659 unreviewed cards (197 candidates) are in `../lifesim-reviews/event-critique/handoff/` and were sent to the critic's session. Reading those texts is the critic's job; nothing in the scan was changed without being read.
