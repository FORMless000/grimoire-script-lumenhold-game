# Playtest #2 — implementation plan

Works through `docs/playtest-2-triage.md` in its order: **B → C → M → L → N → X**, then the final pass (L28, C4). This file holds one step at a time; later steps are planned when their category comes up.

**Every session:**
- run `node tools/grim.js check` after each change and `npm run verify` before finishing;
- after any `.grim` edit, rebuild the bundle (`node tools/grim.js build`) and fill zh-CN (`node tools/grim.js i18n zh-CN`, STALE lines included). Add new `say:` branches after the existing ones, because translation keys count `say:` lines in order;
- use a migration (`tools/migrations/`, `grim migrate`) for any bulk change;
- when a change is meant to alter play (B5, B27, B35, B36 here), check that `grim diff` shows what was intended, and refresh the golden baseline in the same commit;
- tick items off in the triage as they land (**Fixed in <commit>**).

## Step 1a — B (bugfix session)

Work in packages, roughly cheapest and most isolated first. Root causes found while planning are noted.

### B-1 UI and engine
| Item | Cause found / approach |
|---|---|
| B1 language switch resolves the card | `switchLang` re-renders the post-choice card through the step path (`src/ui.js:140`, `:292`). Re-render only the text. The run log also shows duplicate card records (month 2: 26 records, 10 unique), likely from this and the feedback re-show; check that re-renders don't log again. |
| B36 remove the card cap | `max_cards_per_day` falls back to 14 when absent (`src/director.js:237`). Make absent mean no cap, drop it from `rules.grim`, keep the field parseable (schema v1 only grows; record with `schema --update`). Check the legacy `max_cards_per_month` (`src/engine.js:49`). Changes play: golden diff. |
| B2 place view can't cancel | The map clears a pick when it's tapped again (`src/map.js:31`). Find the view that lacks a back/cancel and add one. |
| B4 learning a spell isn't visible | A `spell` note exists (`src/ui.js:527`). Make it prominent, as a highlighted result line or toast. The event behind it is N3. |
| B5 no evening visit on breaks | The break recipe has one visit (`day_break` in `rules.grim`). Add `evening=visit` and check that break places and plan pools have evening-open places. Changes play: golden diff. |
| B6 vacation and term counters | Visits count toward a track whenever they happen. On breaks, hide the term badges and don't count break visits toward the next term's due (plan_work keeps its shifts until M6/X15). |
| B7 failed a course, no reason | Show the grade's factors in the term-end summary (what the grade was made of). The appeal event is N4. |
| B8 skills seem capped at 60 | Display only: the skill bar is drawn against 60 (`src/ui.js:268`) while values pass 70. Scale it to the real range. |
| B9 health and romance share an icon | Spark chips and previews use `heart` (`src/ui.js:448`, `:552`), which is also health's icon. Add a distinct spark icon in `src/art.js`. |
| B10 Nessa's art | Her portrait's hair and background colours in `src/art.js`. |
| B24 which skill is checked | `challenge enchant using charm`: the chip shows the kind, not the skill. Show the skill too. |
| B27 thesis warning too early | `thesis_setup` (`calendar_2b.grim`) joins the thesis track in Y3 Highsun, the term's last month, with 3 sessions due, so the first term end warns at once. **Decided:** move thesis selection to the start of year 4 (Harvestmoon). Update design §4.1 and §7.6 to match, and check what reads `thesis_*` flags or the track in year 3 (`grim reach`). Make "promise to do better" read as a cost, not a reward. M34 stays in M. |
| (unnumbered) fractional values | Skill gains are fractional (coursework curve). Round at the source or only in display; decide when the code is open, and keep the golden diff in mind. |

### B-2 Event logic
| Item | Cause found / approach |
|---|---|
| B14 rivals with a positive opinion | `pyro_lyra_spar` sets `bond lyra rival` on a won spar while raising rel (`classes.grim:83`; also `calendar.grim:446`). Rivals pull by hostility (design §5.5), so set the rival bond only when rel is low; otherwise only rel rises. Check Lyra's canon first. |
| B19 late lamps and the cat | No gate: `when: turn >= 2`, and the text names Footnote unconditionally. Add a variant for players who haven't met the cat. |
| B26 fox bond in vacation | Prose says "follows you to class". Add a break variant. |
| B28 letters from home at home | `summer_letter` (`when: month == 12`) ignores `summer_away`. Gate it, or give a variant. The general pool split is M31/M38. |
| B30 thesis carrel after the defence | The thesis track's events keep drawing after the defence. End the track (or gate its pool) at the defence. |
| B31 no ending with Nessa | You did get the partner ending (`ending_beloved`), but its text never names the partner. Name them with `{partner}`. |

### B-3 Crown amounts in text (B21, B22, B25)
Texts say 10 or 20 while the tier pays 8 or 15 (gold row 3 8 15 30 60). Fix the three, then sweep the cards that name a crown amount (68 at last count, per PROGRESS) with a check that compares the named amount to the option's gold tier. Make it a lint warning so it stays fixed.

### B-4 Costs that make little sense (B35)
Scope is exact: migrations 0013, 0015 and 0016 gave **124 routine options** a mechanical cost: skill gain → `health -tiny`, rel/spark/mood gain → `gold -tiny`, otherwise `mood -tiny`. Their worklists name each one (file, line and option at the time; map them to event ids through git history).
- Build a reviewed worklist: for each option, the W39 routing: mood by default; health only for unhealthy or dangerous scenes; gold only for clear spending; else a failure outcome with a sensible cost. Then fix the prose to match.
- Apply it as a migration. The routine-budget lint must still pass.
- Add the noted extras in B35 (`life_fortune_teller`, `break_work_short_wages`, `inc_stolen_purse`, `life_lost_wand` → mana).
- Changes play: golden diff and baseline refresh.

### Not in this session
B11 and B12 are fixed. Rolled into M: B3 → M1 (festivals highlighted, not forced); B13, B15, B16, B17, B23 → M43 (social and world pools across the day, with time reinforcement); B20, B29 → M37 (show the delta, marked at the maximum). Done with later items: B18 → M35, B32 → M32, B33 → M1, B34 → X11.

## Step 1b — C (content tweak session)

### C-1 Framing and time
C1 (three → four years), C14 (`year_three` is no longer the last year), C20 (move the last-year text to `year_four`; foreshadowing is N15), C5 ("next time"), C7 (not the first practice), C9 (drop "morning"), C8 (`life_frog_escape` becomes a course event; its time-of-day part is M43).

### C-2 Event rewrites
- C3: cards that show "…" after a choice: query options without `say:` and write specific ones.
- C6: Duelling Circle members get a `spring_tournament` variant. Its check moves to the combat stub with M39/X5.
- C10: more `soc_loan_repaid` variants, plus a flavour-only choice.
- C13: `seventh_tower_stair_count` rewritten for clarity.
- C15: `soc_become_friends` wording reads as friendship (its lateness is M13).
- C16: `life_morning_run` (a windfall with no real choice): give it a trade, or make it a one-option card.
- C18: `align_warm_regard`: name or hint the good deed being praised, and make the options mean something.
- C19: introduce the roommate earlier, or reword.
- C24: `soc_spark` excludes current partners (or gets a partner variant).
- C27 (was M28): `curse_cure_2` triggers at Whisperwood once the clue is held.
- C28 (was M30): `y3_interview` drops hard skill requirements from its prose.

### Not in this session
C11 → X13 (Grisk's night jobs). C23 → X11 (Ilse arrives in year 2). C25, C26 → M43. C2 → M32. C4 → final pass. C12, C17, C21, C22 → X11.

## Step 2 — M (mechanic tweaks)

Six packages, in this order (the checks package comes second, so the combat stub lands early). Each one ends green (`npm run verify`), with its golden diff checked and the baseline refreshed, and can be committed on its own. The triage's dependencies (M42 → M41 · M43 → M8 · M10 → M6 · M39 → M5, M11 · M1 → M9) all point forward in this order.

**Every M package also:**
- adds to the language only by growing schema v1: `src/grimoire.js` → `src/engine.js` → lint → `tools/format.js` / `tools/query.js` → `docs/grimoire-script.md`, then `schema --update`;
- updates the design doc section it changes (listed per package), or records the deviation in PROGRESS;
- keeps the simulated players (`tools/policies.js`, `economy.js`, `hs-funnel.js`) and `tools/e2e.js` able to play the new flow, since balance (step 3) reads them;
- loads saves from before the change (a save mid-day or mid-month must resume).

### M-A Run frame (design §4.1, §3)
| Item | Approach |
|---|---|
| M32 origin screen (with B32, C2) | A screen after the title lists the origins from `choose_origin`'s options, with each one's money situation and a warning for the poor ones. `newGame({origin})` applies the option before month 1's hooks, so tuition and board see it (fixes B32). `choose_origin` stays as the Sorting Mirror scene, with one option that reflects the chosen origin. Rewrite the origin texts (C2: no "standing"). Bots and e2e pick an origin up front. |
| M21 48 months, and the wrap-up | `last_month: 12` (the run ends in year 4 Starfall). **Decided:** year 4's last break (Goldenhaze and Starfall) is a **wrap-up term**, not a vacation: no break-plan choice, the player stays on campus with free board and no obligations (no dues, no tuition, no plan pools). Goldenhaze plays as a free campus month. Starfall (month 48) resolves the endings only: no map, no ordinary pools, no choices beyond how to resolve each ending. **Stub:** month 48 holds the existing graduation cards (`graduation_eve` and the ceremony); X10 fills it with one resolution card per ending. Check what reads `turn == 47`, `maxTurns` or the subtitle ("Forty-seven moons"), and the `final_year` gates that assume the run ends in Goldenhaze. |

### M-B Checks (design §8.6, §9.2)
| Item | Approach |
|---|---|
| M39 combat stub | A new challenge kind, `combat`. Its value mixes arcana, vigor and guile with current health, mood and mana and the total spell levels; the weights go in `@balance`. Move the duels and fights to it: the tournament and its semifinal (with L8, L19, C6's new card), `bram_duel`, the duel-hall spars, the finale's fight. That move is a worklist, applied as a migration. |
| M5 combat spends mana | Entering a `combat` challenge costs mana (a tier in `@balance`). The preview shows it. Low mana lowers the odds rather than blocking. |
| M11 minigame vs check | The challenge button and result mark `combat` (the future minigame) apart from skill checks. |
| M14 variance per check | An optional swing word on a challenge (e.g. `challenge negotiate trivial wild:` / `steady`) changes the odds curve's slope (today 2.5 points per skill point, clamped 8–92). Low-stakes checks swing; hard ones are steadier. The default stays as now; the event retunes (L17, L18) are in step 3. |
| M15 renown checks | Let `using` name renown (the odds already sum `s.vals[k]`), with lint support; add a handful of uses in content where popularity should help. |
| M4 course outcomes up front, exams as events | The course card and the term-end summary show what a grade depends on (study, attendance, skill vs the bar). Exams become a pushed exam card per enrolled course in the term's last month (a challenge on the course's skill), replacing the background check in `endTerm`. The grade spread itself is L1. |

### M-C The day (design §4.2, §5, §6.3)
The biggest change, and what M41 builds on.
| Item | Approach |
|---|---|
| M1 a picker per visit (with B33, B3) | Today `pickPlaces` takes both visits up front and `buildDay` fills the whole day (`src/director.js`). Split it: the day is built slot by slot. Morning and noon cards play first, then the map for the afternoon, its cards, then the map for the evening. The break plan is chosen in the morning, before the first pick (B33). Festivals no longer lock a visit: the map highlights the festival's place in its slot, and picking it draws the festival card (B3: Lantern Night stops forcing the lake). Keep `pickPlaces([a, b])` working for tests and bots (it picks the remaining slots in order). |
| M9 picker flow | No confirmation for a single pick, and no "…" card after it. |
| M3 no pre-planned day | Falls out of M1: later slots are drawn when they come. Drop the day's card-count pips (`src/ui.js` `#pips`). |
| M43 pools across the day (with B13, B15, B16, B17, B23, C25, C26) and M8 | Social and world cards keep their monthly budget but are spread over all the day's slots, not only noon (social) and night (world). `slot:` (in the language, used by no event today) is honoured in every pool as a requirement. A new `time:` field favours slots without requiring them. A tagging pass, from a worklist, covers the ~45 ambient and social events whose text names a time of day, plus place- and course-premise cards drawn in the wrong pool (M8: the flying lesson). The worklist is applied as a migration. |
| M2 places open afternoon and evening | Widen `open:` in `places.grim` where it makes sense. Then check each place's events against the new hours (they read `slot`, or name a time of day) as part of the M43 worklist. |
| M7, M20 display | Time of day as a background tint (M7). The alignment bar fills from the bottom in two colours (M20). Both are UI only. |

### M-D Tracks and money (design §7, §8.2)
| Item | Approach |
|---|---|
| M10 pay through events | Today `attend()` pays a job's flat `pay:` at the pick. Move it into the shift's events: a job event pays (a tier) and says so, and the flat pay goes. Keep the expected monthly income (economy.js before and after), with some spread. |
| M6 vacation work (stub) | Choosing to work on campus pushes a job-choice card from a separate full-time pool (higher pay, no double wage, board still paid). **Stub:** two baseline gigs with a few events each; X15 fills them. |
| M12 promotions reset performance | `promote` sets performance back to a start value. |
| M23 job board | "No job" gives no mood; each job lists its expected monthly pay (computed from its events after M10). |
| M33, M34 terms | A forced keep-or-resign card per job at term end (M33). Joining mid-term prorates what's due: at most one visit per remaining month (M34). |
| M35 club fair | Members choose to continue, resign or switch (switching shows its cost); declining gives no mood. |
| M24 rule, M25, M36, M16 | One option-visibility rule: hide options gated by things the player can't see (relationship, state); show options locked by a stated prerequisite (a course) as locked, with the reason. That needs a small language addition, e.g. a `locked:` reason on an option. Then the ball (M25), internship applications to several hosts at a cost of gold and mood, with skill checks instead of hard skill gates (M36), and internships that draw no campus events and need a fresh application or a return offer (M16). |
| M22 Grisk's debt | Unpaid debt escalates through events (reminders, then a collector), harsher than now. |

### M-E People (design §5.5, §8.2)
| Item | Approach |
|---|---|
| M42 schedules | A chance per entry (`observatory@midnight:30`) and a separate break schedule (`schedule_break:`), parsed in `grimoire.js` and read by `presentAt`. |
| M38 off campus (with M29), M31, M19 | Off campus (home, internship, travel): relationship decay is halved, and a forced letter card comes each night. **Stub:** a few generic letters; N14 fills them. Pools are split by where you are (M31: no letters from home at home). A character who is away over a break, or a player on an internship, meets people only by letter (M19). |
| M13 milestones pushed | Milestones (becoming friends, and so on) are pushed outside the pools: the chance ramps from a first threshold to 100% at a second. That needs a field on the event (e.g. `ramp: rel(npc) 18..30`). Fixes L13's lateness. |
| M17, M18 warmth | Warmth counts only when the outcome moves a positive relationship up or a negative one down (M17). Visiting a place where someone is counts as seeking them (M18: raise `presence`, or engage on a chosen visit). Both are in `FRIENDS` and `noteContact`. |
| M37 the relationship bar (with B20, B29) | One bar per character, derived from `rel` and `spark` (no content rewrite). Friendship gains also add spark in proportion to the spark already there (up to about 2–3×, higher for partners). Crossing a spark threshold pushes a cool-down card. A gain at the cap shows its delta, marked as at the maximum. The lower friendship gains are L27. |

### M-F The night (design §4.2, §6.3)
| Item | Approach |
|---|---|
| M40 Cartographers | A hidden flavour group: a new track kind (or a state with its own pool) with no due visits, performance or ranks, that doesn't take the club slot. Keep the `cartographers` id. |
| M41 the midnight turn | The night card each on-campus month: Sleep, or Go out (mood and health −small), which opens a midnight pick through a new effect, `visit midnight` (reusing M1's picker). Six places get `open: midnight`. Suspicion uses two hidden markers and one forced morning event; the morning event is the only source of lockouts (as decided in M41). **Stub:** the Y1 Stormbloom lead-in, the night card with a few variants, and one event per night place. X13 fills it. Needs M42, M39, M1. |

## Step 3 — L (balance), after M

Retune once, on the finished mechanics. Tools: `tools/economy.js`, `balance` (full, not `--quick`), `hs-funnel.js`, and the playtest log. Every number goes in `@balance` or the rules, never in events.
| Package | Items | Approach |
|---|---|---|
| L-1 Economy | L24, L25, L26, L3 | Origins sponsor tuition and tuition drops (L24), so noble and street runs don't diverge too far; set from economy.js per origin and style, and update the origin screen's copy (M32). Thesis due 3 → 2 (L25). Internships pay properly through their events (L26, after M10). Check that money is spent by choice or passively (L3), and that board and hunger still bite the poor origins. |
| L-2 Relationships | L27, L23 | Lower the friendship gains (the `rel` row, or the M37 ratio) so nobody hits 100 by year 2. Romance holds while dating: spark decay, partner cool-down, and the letters (M38). Check the Lyra and friendship-growth deviations in PROGRESS. |
| L-3 Checks | L1, L4, L5, L6, L17, L18, L8, L19 | Grades spread across A–F (L1, on M4's exam cards). Skill scaling stays small; difficulty comes from variants (L4). Read late-game odds from the logs and the curve (L5: trivial or impossible). Higher course levels shift difficulty up (L6). Turbulent checks for `isolde_chess` and `inc_broken_wand` (L17, L18, with M14). The tournament from year 2 on (L8, L19, with M39). |
| L-4 Intensity | L2 | Larger health and mood swings: the rows in `@balance` and the hunger and rest presets, checked against the budget lint and the style invariants. |
| L-5 Event retunes | L10, L11, L15, L16, L20 | Reporting Bram gains Lumen (L10); holding your ground in `soc_argument` pays (L11); more mood cost in office hours (L15); more romantic tarot (L16); `hs_kael_truth`'s alignment (L20). |
| Alarms | | The balance report's open alarms: the archmage share of headlines, windfalls (5.3 a year against 1–4), the aggressive style, the events no style sees. |

Not in step 3: L13 → M13; L21 → X; L22 → X3; L28 → the final pass.

## Status
Step 1 is done (B and C, not yet committed): the triage marks each item. B35 is migration 0019. Steps 2 (M) and 3 (L) are planned above; step 2 is under way.

## Decisions
- M21 (decided): year 4's last break is a wrap-up term, and month 48 only resolves endings.
- Order (decided): checks before the day, so the combat stub is seen sooner.

To settle when the code is open:
- M43: the `time:` field's name and how strongly it favours a slot;
- M14: the swing words and their slopes;
- M13: the ramp field's syntax;
- M24: how an option names its lock reason.

Each is a small, frozen-format addition, so it goes into `docs/grimoire-script.md` before content uses it.
