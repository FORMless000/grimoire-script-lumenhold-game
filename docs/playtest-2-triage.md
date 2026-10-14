# Playtest #2 — triage (run rmv7ku7wy-2r4g, zh-CN, 4 years)

Sources: **W#** = the written feedback after the run, numbered in its order. **Notes** = the 104 in-game notes on 96 events (`node tools/grim.js feedback`), tagged with the year and month they were written. **(D#)** = a design debate resolved by the user, filed in its category (the old D numbers are kept at the end of D for reference); **(log)** = found while cross-checking the run log. Items are kept in play order within each category (earlier = spotted first). A `?` marks an item that asks a question to answer when the category is handled. `→` points to a related item in another category.

Categories: **B** bugfix · **L** balance fix · **M** mechanic tweak · **C** content tweak · **N** minor addition opportunity · **X** major content addition opportunity · **D** design choice debate.

**Order of work**, one category per session: **B → C → M → L → N → X**, then a final pass (L28, C4). Mechanics come before balance so numbers are tuned once. An item marked **do with Y#** is done in that item's session instead of its own; a **stub** is the minimum an M item ships with so it works before its content (N or X) exists. Items moved between categories keep a one-line placeholder at their old number.

## B — Bugfix

- B1. Switching language auto-resolves the card currently on screen (the post-choice card). (W2) **Fixed:** a language switch on the result card re-renders it in place (the result is rebuilt from the log); no re-resolve.
- B2. Place view: a selection can't be cancelled. (W6) **Rolled into M1:** every map pick clears when tapped again; the one slot that can't be cleared is a festival-locked one (Lantern Night, B3). **Done (M-C):** the map now takes one pick per visit, a tap goes there at once, and "Stay in" skips it; nothing is locked.
- B3. Sometimes forced to visit the lake: investigate. (W8) **Rolled into M1** (Lantern Night takes visit 2 at the lakeshore every Emberwane, unexplained). **Done (M-C):** festivals no longer take a visit (see M1).
- B4. Learning a spell must be visible, and backed by an event so it feels significant. (W14) The spells do show in the listing (the run learned 9); mana works. → N3 **Fixed:** a learned spell shows as a highlighted banner on the result card (the event is N3).
- B5. Vacation days miss the free evening action. (W16) **Fixed:** break days have an evening visit (`day_break`).
- B6. Vacation work doesn't pause the club/regular-job counters and indicators on place selection. (W18) **Fixed:** break visits no longer count toward a track's term quota, and the map hides term badges on breaks.
- B7. Failed the illusion course with no visible reason: explain why. ? (W23) → N4 **Fixed:** the grade note shows the score against the bar it needed (the appeal event is N4).
- B8. Status UI seems to cap at 60: is that the cap? ? (W38) **Fixed:** display only; status bars now draw against the real maximum (100), not 60.
- B9. Health and romance previews share the same icon. (W51) **Fixed:** spark has its own icon (rose).
- B10. Nessa's SVG art: hair and background are the same colour. (W57) **Fixed:** Nessa's hair colour changed.
- B11. `illu_spot_the_coin` (Y1 Mistveil): variant text not rendered. **Fixed in 5f961b5.**
- B12. `duel_hall_gallery` (Y1 Frostcall): variant text not rendered. **Fixed in 5f961b5.**
- B13. `core_flying_lesson` (Y1 Harvestmoon): a course event shown in the evening; belongs in the morning course pool. → M8 **Rolled into M43.** **Done (M-C):** `slot: morning`.
- B14. `soc_make_peace` (Y1 Highsun): analyse the trace — how did we become rivals with a positive opinion? ? **Fixed:** intended (rivals pull by hostility, and a rivalry can thaw: `soc_make_peace` needs a rival at rel ≥ 3); the bond note now says "rival" instead of reading as friendship.
- B15. `life_quiet_afternoon` (Y1 Goldenhaze): appeared at night. **Rolled into M43.** **Done (M-C):** `slot: afternoon`.
- B16. `starfall` (Y1 Starfall): appeared in the morning instead of at night. → X6 **Rolled into M43.** **Done (M-C):** `slot: night`.
- B17. `life_frog_escape` (Y1 Starfall): appeared at night during vacation; should be a course event. → C **Rolled into M43.** **Done (M-C):** it is an alchemy course card (`track: alchemy`), drawn in that course's morning or at its place.
- B18. `club_fair_v3` (Y2 Emberwane): the club fair repeated. Yearly by design; the fair now knows your state (M35).
- B19. `slice_late_lamps` (Y2 Emberwane): does it only appear after learning about the cat? ? → B35 (cocoa cost) **Fixed:** the text introduces Footnote ("the library cat"); the cocoa cost went with B35.
- B20. `soc_rumour` (Y2 Thawmoon): stopping the rumour didn't affect the relationship. **Rolled into M37** (the friend was at rel 100, the cap).
- B21. `soc_rival_bet` (Y2 Blossomtide): label says 10 gold, paid 8. **Fixed** with B22 and B25: every crown amount named in prose now matches its tier, and lint warns on a mismatch (`crownCheck`).
- B22. `soc_gift_given` (Y2 Blossomtide): label says 10 gold, cost 8. **Fixed** (see B21).
- B23. `soc_become_close` (Y2 Highsun): "talk till sunrise" appeared at noon; should be night. **Rolled into M43.** **Done (M-C):** `time: night`.
- B24. `illu_bread_smell` (Y3 Mistveil): which skill is checked? It isn't shown in the status UI. ? **Fixed:** a challenge shows the skills it uses ("Enchant · Charm 62%"), on the button and the result.
- B25. `lyra_family_gala` (Y3 Mistveil): label says 20 gold, cost 15. **Fixed** (see B21).
- B26. `fox_bond` (Y3 Thawmoon): prose says attending a course, but it was vacation. **Fixed:** a break variant ("follows you through the half-empty corridors").
- B27. `track_warning` (Y3 Goldenhaze): appeared before there was any chance to attend; also reads as a reward (it rewards progress). Check the mechanics. Decided: thesis selection moves to the start of year 4 (`thesis_setup` is Y3 Highsun now, the term's last month, so its first term end warned at once); update design §4.1 and §7.6 to match. M34 stays separate. **Fixed:** `thesis_setup` is now year 4 Harvestmoon, before enrolment (design §4.1, §7.6); "promise to do better" now costs mood (no reward), "let it slide" costs performance.
- B28. `summer_letter` (Y3 Starfall): letters from home while at home; separate the event pools when away from campus. → M **Fixed:** `summer_letter` needs you away from home (the pool split is M31/M38).
- B29. `soc_friend_sick` (Y4 Mistveil): no cost or reward at all. **Rolled into M37** (the friend was at rel 100, the cap).
- B30. `thesis_carrel_neighbour` (Y4 Goldenhaze): appeared after the thesis defence. **Fixed:** the defence leaves the thesis track (its events stop); the leave note reads "thesis complete".
- B31. No ending with Nessa as lover: why? ? (W64) **Fixed:** seven named partner endings (`ending_beloved_<npc>`, Nessa included) replace the generic line when the partner is a character.
- Also seen in the log (not from the notes): month 2 had 26 card records and month 4 had 20, but only 10 and 14 unique cards; the rest are re-shown cards (feedback, language switch → B1). Values are stored as fractions (mana 76.35, charm +2.55). **Fixed:** the duplicates are the server's append-only log of re-shown cards (not new draws); fractions now show to one decimal when they would round to 0.
- B32. Month 1's charges run before the origin is chosen: the scholar paid full tuition (30, not 15), started at 0 gold, went hungry in month 2 and took Grisk's loan in month 4. **Do with M32** (a fix now would be thrown away). (log) **Fixed with M32.**
- B33. A break month's visit is picked before the break plan is chosen: "work" months visited the workshop and the Lumen Ledger, not the job (Y1 Deepwinter, Y1 Goldenhaze); an internship month visited the infirmary (Y2 Goldenhaze); "go home" visited the thesis lab (Y3 Goldenhaze). Likely the root of B5, B6 and B28. **Do with M1** (the per-slot picker then comes after the morning's break-plan card). (log) **Done (M-C):** each visit is picked when its slot comes, after the morning's break-plan cards.
- B34. `hs_beneath`: losing the seal check still sets `hollow_sealed`, so the finale can't fail. **Do with X11** (a failed seal needs a designed outcome). (log)
- B35. Event-level costs that make little sense (moved from L7, L9, L12, L14). Most were added in place to satisfy the routine-budget lint, so the fix must keep that lint passing. Route each cost by the rule of W39: forced costs hit mood by default; health only for clearly unhealthy or dangerous events (and harder); gold only for clear spending; where nothing fits, add a failure outcome that costs something reasonable; adjust the prose to match. Also sweep for the same pattern beyond these notes. Making such checks more random (W40) is M14. **Fixed:** migration 0019 reroutes all 124 costs from 0013/0015/0016 (40 mood, 15 health, 9 new failure outcomes, 34 free safe choices with trimmed gains, 26 kept where they fit) plus the extras: short wages always pay, a recovered purse costs a bun's worth and a lost chase hurts mood, the summoning charm costs mana, the late-lamps cocoa and fox bandage costs are gone, the dummies cost effort, the date at Mabel's is split. `life_fortune_teller` now reads three/eight crowns against tiny/small (fixed with B21).
  - gold costs that shouldn't be: `soc_stargazing` (Y1 Starfall, Y2 Frostcall), `soc_gift_given` "thank her later" (Y2 Harvestmoon), `bram_crying` (Y2 Harvestmoon), `slice_late_lamps` cocoa (Y2 Emberwane), `mira_owl_gift` (Y2 Mistveil), `nessa_burnout` (Y2 Frostcall), `lyra_burnout` (Y2 Deepwinter), `soc_rival_decency` (Y2 Greenrise, cost something else), `fox_injured` (Y3 Mistveil), `duel_hall_dummies` (Y3 Frostcall, ?), `soc_lost_notes` (Y3 Deepwinter), `soc_partner_anniversary` (Y3 Stormbloom, receiving a gift), `ledger_office_unprintable` (Y3 Stormbloom, ?), `soc_drift` (Y3 Greenrise), `soc_partner_date` (Y4 Emberwane, the bill is on them);
  - health costs that shouldn't be: `soc_jealous_friend` (Y2 Mistveil; Y3 Highsun, cost mood instead), `soc_study_session` (Y3 Harvestmoon), `soc_teach_spell` (Y3 Frostcall), `isolde_chess` (Y3 Stormbloom);
  - `life_fortune_teller` (Y3 Deepwinter): the costs don't make sense.
  - `break_work_short_wages` (Y1 Starfall): should always pay, just more or less; never deduct. (was L9)
  - `inc_stolen_purse` (Y2 Greenrise): should also hurt mood; why does success cost gold? ? (was L12)
  - `life_lost_wand` (Y3 Harvestmoon): the summoning charm should cost mana (a failed cast costs health now). (was L14)
- B36. Remove the card count cap (`max_cards_per_day`; unique counts reached 15–16 against 14 anyway). It hinders future development. The engine falls back to 14 when the field is absent (`src/director.js`), so: no cap when absent, drop it from `rules.grim`, and keep the field parseable (schema v1 only grows). Check the legacy `max_cards_per_month` too. **Fixed:** no daily card cap (the field stays parseable; absent means none).

## C — Content tweak

- C1. `intro_arrival` (Y1 Harvestmoon): three years → four. **Fixed:** "Four years. Forty-eight moons."; also `ending_graduate` and `graduation_eve` ("four years").
- C2. Scholarship origin: "as long as your standing stays above 30" no longer makes sense (no standing). (W9) **Do with M32.** **Fixed with M32** (the scholar's text no longer mentions standing).
- C3. Cards that show "…" after a choice get text based on the choice. (W5) **Fixed:** every live option that resolved without a line now has one (year openings, "no courses", "not this year", "just looking", Tobias's repayment, the loan repayment).
- C4. More prose variants for high-frequency events, from live and simulated play. (W35) **Do in the final pass** (after X): M41's night card and M38's letter card add new high-frequency cards.
- C5. `lyra_study_rivalry` (Y1 Frostcall): "next time" reads oddly when months play like days; redesign. **Fixed:** the rankings resolve the same day (an open paper this afternoon), with no "next time".
- C6. `spring_tournament` (Y1 Greenrise): Duelling Circle members get a variant instead of an optional sign-up. **Fixed:** members get `spring_tournament_circle` (already entered: fight for a showing, or go for the title, with Circle performance at stake); the open card is for everyone else. The check moves to the combat stub with M39/X5.
- C7. `duel_first_practice` (Y1 Highsun): not the first practice; reword. **Fixed:** "Footwork"; "Lyra runs practice like a general."
- C8. `life_frog_escape` (Y1 Starfall): make it a course event. (with B17) (Its time-of-day part is M43.) **Fixed:** a course event of Alchemy & Healing (`track: alchemy`).
- C9. `bram_duel` (Y2 Emberwane): stop mentioning "morning". **Fixed:** "The dueling green, right now."
- C10. `soc_loan_repaid` (Y2 Thawmoon, Y3 Blossomtide): more variants; a flavour-only choice. **Fixed:** three text variants and a flavour-only choice (count it, or don't).
- C11. `life_shady_offer` (Y2 Stormbloom): what is this about? ? Adjust alignment if it leads somewhere bad, or keep it unspoiled, but make sure consequences follow. **Rolled into X13** (a midnight envelope delivery to the boathouse: X13's Grisk jobs).
- C12. `bell_silence` (Y2 Blossomtide): very mysterious; what was missed? ? (Nothing: it's a timed beat that fires regardless.) **Do with X11** (the rewrite replaces it).
- C13. `seventh_tower_stair_count` (Y2 Highsun): confusing. **Fixed:** the opening says what the stair does and why you'd count it.
- C14. `year_three` (Y3 Harvestmoon): no longer the last year. **Fixed:** "Third Year"; the headmistress now speaks of the year ahead.
- C15. `soc_become_friends` (Y3 Harvestmoon): wording reads romantic but it's friendship. (lateness → L13) **Fixed:** reads as friendship (saved seats, shared notes).
- C16. `life_morning_run` (Y3 Harvestmoon): trivial choice? **Fixed:** a trade: sleeping in is the better mood, running costs a little mood for vigor and health.
- C17. `hs_choosing_sides` (Y3 Deepwinter): too abrupt, little lead-in. **Do with X11.**
- C18. `align_warm_regard` (Y3 Greenrise): confusing. **Fixed:** the praise names what it's for (kind things done unseen); the other option is modesty ("anyone would have").
- C19. `life_snoring_roommate` (Y3 Goldenhaze): the roommate was never introduced. **Fixed:** someone in your dormitory, unnamed.
- C20. `year_four` (Y4 Harvestmoon): move the last-year text here; each year's opening foreshadows new options, duties and expectations. Here: move the text. The foreshadowing of new options, including year 4's hint at the thesis load and at quitting a job or club for more time (L25), is N15, once the M features exist. **Text moved** (the last-year speech is now in `year_four`); the foreshadowing stays with N15.
- C21. `hs_grey_stranger` (Y4 Harvestmoon): mysterious. **Do with X11.**
- C22. `hs_last_winter` (Y4 Mistveil): what is this, and why a special node? ? Confusing as is. **Do with X11.**
- C23. `ilse_village` (Y4 Mistveil): met too late; push earlier unless the plot intends it. ? **Rolled into X11** (her gate needs 2 Hollow Star clues, which this run had only from Y3 Mistveil; a random draw then took 11 months; the design has Ilse arrive in year 2).
- C24. `soc_spark` (Y4 Frostcall): a spark while already dating doesn't fit. **Fixed:** `soc_spark` needs no current partner (`bonds(partner) == 0`).
- C25. `nessa_typo` (Y1 Mistveil): states a time of day; tag it so. (was M26) **Rolled into M43.** **Done (M-C):** `time: morning`.
- C26. `nessa_burnout` (Y2 Frostcall): evening-only. (was M27) **Rolled into M43.** **Done (M-C):** `time: evening night`.
- C27. `curse_cure_2` (Y2 Starfall): trigger from the clue (actually going to the forest), not automatically. (was M28) **Fixed:** Maud sends you to the Whisperwood (`moonpetal_sought`); the moonpetal card waits there, by night, until you go (a failure means another visit, not a timer).
- C28. `y3_interview` (Y4 Emberwane): don't state skills as hard requirements. → X10 (was M30) **Fixed:** challenge labels no longer carry a skill suffix (47 labels: "(Lore)", "(Charm)"…), since the button names the skills (B24). The career fair's own skill gates go with X10.

## M — Mechanic tweak

Order within M: M42 → M41 · M43 → M8 · M10 → M6 · M39 → M5, M11 · M1 → M9.

- M1. Show the place picker before each afternoon and evening, not all in the morning. (W1) Includes B33. Includes B3: festivals no longer force a visit; the map highlights the festival at its place and slot instead (Lantern Night at the lakeshore, and other festivals where it applies). **Done (M-C):** the day runs slot by slot; the map opens for each visit when its slot comes. Festivals are marked at their place and slot (a banner above the map), and picking the place draws them; the visit is not forced.
- M2. Most places open in both afternoon and evening; edit their events to match. (W3) **Done (M-C):** 16 places gained a second visit slot (migration 0022); the bakery keeps baker's hours and internship hosts their own. Place events whose text names a time are tagged `time:`.
- M3. Don't pre-plan the whole day/month of events (W4); drop the per-day event progress indicator (W4). **Done (M-C):** the director fills each slot when the player reaches it; the day pips are gone.
- M4. Courses show their potential outcomes up front (W11); exams become events, not background checks, so they feel significant (W12). **Done (M-B):** exams are cards (`@game exam: course_exam`, one per enrolled course in a term's last month: answer steadily, or go for top marks), showing the pass and A/B chances; the enrolment menu shows each course's skill, exam tier, spells and pass chance. The grade spread is L1.
- M5. Combat entrances (currently checks) spend mana. (W15) **Done (M-B):** entering combat costs mana (`@balance combat_cost: small`), shown in the preview and on the button.
- M6. Vacation work: choose from candidate jobs instead of plain "work" (W17); `break_plan` (Y1 Goldenhaze): job selection right after "work full-time". Decided (D2): choosing to work on campus pushes an automatic job-choice event; board is still paid; no double wage; the full-time jobs are higher-paying and drawn from a separate pool. Decided (D10): the vacation gigs are X15. **Stub:** two baseline gigs with a few events each (X15 fills them). Needs M10 first. **Done (M-D):** "Work on campus" is open to anyone and pushes `holiday_gigs`: the grounds (Old Maud) or the Refectory kitchens, three cards each, paid through their cards; board is still paid and there is no double wage. X15 adds the gigs proper.
- M7. Time of day shown by subtle background colour, not only words. (W19) **Done (M-C):** each slot tints the background (`body[data-slot]`).
- M8. `core_flying_lesson` (Y1 Harvestmoon): afternoon/evening pools hold only events set at that place, or place-independent ones. → M43 **Done (M-C):** course events drawn in visits only at their own place; see M43.
- M9. Picker flow after M1: no confirmation for the first place, no "…" card. (W7) **Done (M-C):** a tap on the map goes there; the pick's outcome (attendance, pay) is a toast, not a card.
- M10. Job pay through events: most job events say the player is paid and actually pay; the job's bonus is paid per shift in events, not when the time is assigned. (W31) Decided (D10): all job and gig pay comes through events instead of today's flat rate, keeping roughly the expected economy with some variation. **Done (M-D):** `wage` (one shift at your rank; `wage short` / `wage overtime` from `@balance wage:`) in every option of the 31 job cards (migration 0023); a job visit draws a shift card first, and only a visit with none left pays the flat rate. Expected income held (economy.js before and after).
- M11. UI distinguishes minigame events from skill checks, even before minigames exist. (W33) **Done (M-B):** every option button now shows its roll; combat is marked with a sword, apart from skill checks (this also completes B24: the button names the skills).
- M12. Promotions reset performance. (W34) **Done (M-D):** a promotion starts the new rank at performance 50.
- M13. Relationship milestones (becoming friends, etc.) are pushed as extra events that don't compete with other cards; they trigger semi-reliably at the threshold, probability rising to 100% past a second threshold. (W37) **Done (M-E):** `ramp: <expr> low..high` pushes a milestone outside the pools, each month for the character furthest along: 40% at the low mark, certain at the high (migration 0025: becoming friends and close, making peace, the confessions, Bram).
- M14. A randomness/variance parameter per check: trivial, low-stakes checks (banter, course interactions) swing wildly unless the prose says skill makes them trivial; "hardcore" checks are more deterministic but harder. (W41) **Done (M-B):** `wild` / `steady` after a challenge's tier (slopes in `@balance swing:`). The event retunes are L17, L18.
- M15. Renown checks in events (popularity as an advantage). (W45) **Done (M-B):** `using renown` (read on the skill scale: 50 = the expected skill now); used by busking, Nessa's headmistress interview and Isolde's warning.
- M16. Internships don't draw regular campus events (W46); each internship needs a new application or an explicit return offer for high performance — a one-off gig, not long-term (W47); `intern_conclave_minutes` (Y2 Starfall): more internship events at once, so it isn't trivial yet slow to progress. Works with today's internship events; X12 deepens it. **Done (M-D):** an internship lasts one summer: `plan_internship` (tagged `away`) draws no campus pools (social and world cards come from the internship) and no callers; at its end a strong summer (performance ≥ 80) brings `intern_asked_back`, otherwise the post ends. One internship at a time; internship visits count in full.
- M17. Pushed relationship events count toward warmth only when the outcome moves a positive relationship up or a negative one down (if both options go the same way, count the larger). (W52) **Done (M-E):** a card warms someone only when the outcome moves the relationship further its own way (a friend's up, a rival's down); when every option does, only the larger move counts.
- M18. Visiting a place where a character is counts as actively seeking them, and adds warmth. (W53) **Done (M-E):** visiting a place where someone is warms them by 12 (was 6), as seeking them.
- M19. When a character is at home, or the player is on an internship, their interactions become passive letters. (W55) Needs M42 (break schedules); X7 decides who goes away. **Done (M-E):** anyone who reaches you while one of you is away (off campus, or `schedule_break: away`) writes instead: their card comes from the letter pool.
- M20. Lumen/Hollow display starts from the bottom and fills with two colours/icons, not from the middle. (W58) **Done (M-C):** the meter fills from the bottom, gold for Lumen and violet for Hollow, each with its own icon.
- M21. 48 months instead of 47. (W60) **Stub:** month 48 holds the existing graduation cards; X10 fills it. **Done (M-A):** 48 months; year 4's last break is the wrap-up (no plan, free board, no duties); month 48 holds only the graduation cards (X10 fills it).
- M22. Grisk's debt: what happens if unpaid? ? Make it harsher and show it as events. (W28) **Done (M-D):** the first missed payment brings `grisk_reminder` (pay what you have, or ignore it and a month is added), the second the collectors, who now credit less and cost renown. (Interest on every miss was tried and dropped: it trapped broke players in a debt that never ended.)
- M23. `job_board_visit` (Y1 Harvestmoon): choosing no job shouldn't raise mood; list each job's expected average pay. **Done (M-D):** "Just looking" gives no mood; each job option shows its pay per shift, read from its cards, and the shifts a term asks for.
- M24. `intern_offer` (Y2 Blossomtide): hide options the player can't take (applying for several: M36). → X12 **Option visibility (with M25, M36):** hide options gated by things the player can't see (relationship or state gates); show options locked by a stated prerequisite (courses) as locked, with the reason. **Done (M-D):** a menu option whose `when` fails is hidden, unless it has `locked:` (a stated prerequisite), which shows it disabled with the reason (migration 0024 for skill, crown and year gates).
- M25. `midwinter_ball` (Y1 Frostcall): don't show locked options; hint the condition subtly (relationship?). Follows M24's option-visibility rule. **Done (M-D):** the unmet partners are hidden; the card says you can only ask someone you know well.
- M26. Moved to C25.
- M27. Moved to C26.
- M28. Moved to C27.
- M29. `soc_partner_neglect` (Y3 Thawmoon): reads as a warning about not spending time together, which only place selection allows; consider freezing relationships during vacations. Decided: decay is halved off campus, and letters keep contact (M38). **Done (M-E):** friendship and spark fade at half the pace off campus; letters keep contact.
- M30. Moved to C28.
- M31. `summer_letter` (Y3 Starfall): separate event pools when off campus. (with B28) **Done (M-E):** off campus the day draws the plan's own pools (home, the internship), not campus ones; letters are gated by where you are.
- M32. The origin is chosen on its own screen after the title screen, before the game starts. Origin effects apply before month 1's charges (fixes B32). The screen shows each origin's money situation and warns that some origins will have to work a lot (L24). `choose_origin` stays as the Sorting Mirror scene, reflecting the chosen origin with no choice. (D1) C2 (the origin texts) and B32 are done here; L24 later retunes the numbers and the screen's copy. **Done (M-A):** the origin screen (`@game origins:`, each origin's `money:` line, a warning for `poor` ones); origins apply before month 1's charges; `sorting_mirror` reflects the choice.
- M33. At the end of each term, a forced event per job: keep it for next term, or resign and look for another later. (D2) **Done (M-D):** `job_term_review` at every term end but the last: stay on, or resign.
- M34. Joining a job or club mid-term prorates what's due: at most one visit per remaining month of the term (joining in a term's 3rd month: 2 shifts, not 3). (D2) **Done (M-D):** joining in term asks at most one visit per month left, this one included.
- M35. The club fair knows your state. Members choose to continue, resign, or switch to another club, and switching shows what it costs (rank, performance). Non-members join or decline as now. Declining gives no mood (as in M23). (D3, with B18) **Done (M-D):** one ungated option reads "Stay with your club" for members and "Not this year" for others (no mood); members can resign; each other club shows what a switch leaves (rank and performance). `member(club)` and similar kind forms were added for this.
- M36. Internships: apply to several at once; each extra application costs gold and mood, with flavour text about the effort. Hard skill requirements become skill checks. Course requirements stay, and options are shown as locked, with the reason, when unmet (M24's rule). (D9, → M24) **Done (M-D):** apply to any number of hosts (`pick: 6`); every letter after the first costs gold and mood. Hosts need their discipline at II (shown locked, with the reason). In Blossomtide each letter opens on its own: the GPA bar, then an interview (`challenge research` on the host's skill; a word from Thorne eases the Conclave's). A rejection lets you open the next; an acceptance withdraws the rest. `leave` now withdraws an application (the old "fold the letters away" never did).
- M37. Relationships as one dual-purpose bar per character, like alignment plus accumulation: how close you are (accumulated) and how friendly ↔ romantic it is, both derived from the existing `rel` and `spark` (no content rewrites). **Done (M-E):** one bar per character (length: rel; colour: friendly ↔ romantic by spark, with a spark marker). Friendship gains on someone with spark carry spark along (`@balance spark_follow: per 25 cap 2 partner 3`); crossing spark 30 pushes `spark_cooldown` once (`cool npc` clears it); a gain at the cap shows, marked "max" (B20, B29).
  - Higher spark makes friendship gains also add spark, in proportion (up to about 2–3×, set against the relationship economy); a partnership gives a higher ratio.
  - When spark crosses a threshold, a pushed event lets the player cool it down (spark cleared).
  - Friendship gains are lower overall (L27).
  - Includes B20 and B29: a gain at the cap still shows its friendship delta, marked as at the maximum.
  - (D6, → L23, B9)
- M38. Off campus (home, internships, travel): **Done (M-E):** home and internships are `away` plans: a `trigger: letter` card each night (three stub letters; N14 fills them), halved drift, no campus pools.
  - relationship decay is halved;
  - every night brings a forced letter card: write to someone, and receive letters. **Stub:** a few generic letters (N14 fills them);
  - no midnight turns (M41).
  - (D8, → M19, M29)
- M39. The combat stub: until the minigame exists (X5), combat and conflict scenes use a combat challenge entry instead of skill checks. Its odds mix arcana, vigor, guile, current health, mood and mana, and total spell levels. It's used widely: duels, fights, the tournament, the midnight duelling gig (X13), the finale. → M5, M11 (D11) **Done (M-B):** `challenge combat` (arcana, vigor, guile, condition, spell levels; weights in `@balance combat:`); migration 0020 moves 23 fights to it (tournament chain, duels and spars, Bram, brawls, the stag, Ilse's rescue). The finale stays a sealing spell check (X11).
- M40. The Midnight Cartographers become a hidden flavour group with no club-system obligations: no due visits, no performance or ranks. Belonging doesn't take the player's one club slot, so joining no longer drops a real club. Their nights are not exempt from the flat 33% suspicion roll. Keep the `cartographers` id: the invitation (`clubs.grim`), the gargoyle passage's discovery, Corvin's facts and the pool events key off it. (D11) **Done (M-F):** a new track kind, `society`: no dues, performance or ranks (lint errors on `perform`/`rank_xp`/`promote`), and no club slot; the Cartographers (same id) are one, their cards lose their performance and rank lines (migration 0026) and rank gates.
- M41. The midnight turn: mechanics (from X13; content stays in X13). (D11) **Done (M-F):** the lead-in (`night_lead_in`, year 1 Stormbloom), the night card (`night_out`, first in the midnight slot, after every night card: Sleep, or Go out for mood and health −small, which runs `visit midnight`), six places open at midnight (migration 0027), each with one stub card; the midnight map lists only places with a card naming the slot. Going out in term: 33% `spotted`; risky outcomes ~50%. `night_suspicion` the next morning: `watched`, or, if watched already, a three-month lockout with detention, gold and mood. Breaks have a midnight slot now (on campus). X13 fills the pools.
  - **Access:** unlocked by a forced lead-in in year 1 Stormbloom, whatever the answer; on campus only (on-campus breaks have it; home, internships and travel don't); not during a lockout.
  - **Entry:** a night card each on-campus month. "Sleep" costs nothing. "Go out" costs mood and health (−small each, no "tired" state) and opens the midnight pick through a new effect, `visit midnight` (language addition).
  - **Night map:** six existing places get `open: midnight`: Gilded Newt, boathouse, refectory kitchens, restricted section, observatory, gargoyle passage.
  - **Suspicion (two hidden markers, one morning event):**
    - going out in **term** gives a one-month marker; next morning, a 33% roll pushes the suspicion event. This flat rate doesn't apply on breaks;
    - a risky outcome may get the player spotted: about 50% (varies by event), with flavour of someone from the school noticing. Being spotted gives a hidden marker that **guarantees** the suspicion event next morning, on breaks too;
    - only one suspicion event per morning, so an illegal night is ~66% (1 − 0.67 × 0.5) and a harmless term night 33%;
    - **the suspicion event** (morning, forced) is the only source of lockouts. If not yet `watched` (the existing "Under Bram's Eye"), you gain it. If already watched: a 3-month lockout + detention state, plus gold and mood losses (no other punishment), and `watched` is cleared;
    - day events that give `watched` (8 today, and Grisk's failed delivery) never cause a lockout.
  - **Stub:** the lead-in, the night card with a few variants, and one event per night place, so the turn is playable; X13 fills it.
  - Needs M42 (occasional night schedules) and M39 (duelling).
- M42. Schedule language: a chance per schedule entry (`observatory@midnight:30`), so characters are there some nights, not every night (Corvin and Kael already have midnight schedules); and separate break schedules, so characters can be away over breaks. Prerequisite for M19, M41 and X7. (from X7, X13) **Done (M-E):** `place@slot:30` (that share of days, by a hash of the seed and month, so the map and the visit agree) and `schedule_break:` (or `away`); Corvin's and Kael's midnights are now 40% and 30%.
- M43. Social and world pools are drawn through the whole day, not only at noon (social) and night (world): same budget, spread more evenly over the slots. Some events get time reinforcement: a time tag that favours or requires their slot. Includes B13, B15, B16, B17, B23, C25 and C26; → M8. **Done (M-C):** `@game spread: social world` deals those cards across the day's slots (same budget); `time:` favours an event's slots (×3, ×0.3 elsewhere), `slot:` requires one. 79 events tagged (migrations 0021, 0022).

## L — Balance fix

- L1. Exam results show constant As or Fs; grades should reflect more than skill and progress checks. (W13) → M4
- L2. Health and mood changes need more intensity. (W20)
- L3. Money should be spent when the player chooses to, or passively. (W25) → L7
- L4. Skill-check scaling should be minuscule; difficulty should come from event variants (when that's not possible, leave it). (W29) → M14
- L5. Late-game checks feel either trivial or impossible: investigate from the logs. (W30)
- L6. Course levels should feel significant: each higher level brings harder checks and challenges. (W42)
- L7. Moved to B35 (the per-event sweep). Its "such checks should be more random" part (W40) is M14.
- L8. `tournament_semifinal` (Y1 Greenrise): cheating gives worse results than fighting fair; is it a minigame? If not, redesign the checks. ? → M39, X5
- L9. Moved to B35.
- L10. `bram_cheating` (Y2 Frostcall): reporting him should gain Lumen.
- L11. `soc_argument` (Y2 Greenrise): no reward for holding your ground.
- L12. Moved to B35.
- L13. `soc_become_friends` (Y3 Harvestmoon): came far too late. → M13 (the wording is C15)
- L14. Moved to B35.
- L15. `thorne_office_hours` (Y3 Mistveil): more mood cost.
- L16. `seraphine_tarot` (Y3 Stormbloom): rewards should be more romantic.
- L17. `isolde_chess` (Y3 Stormbloom): the check should be hard and turbulent. → M14
- L18. `inc_broken_wand` (Y3 Starfall): 30 gold vs a trivial check; make the check more turbulent. → M14
- L19. `spring_tournament` (Y3 Greenrise): feels impossible from year 2 on. → M39, X5
- L20. `hs_kael_truth` (Y4 Emberwane): alignment change? ?
- L21. `life_timeloop_2` (Y4 Frostcall): exploiting the loop should cost more. → X
- L22. Renown is hard to raise. (W43) → X3
- L23. `soc_breakup` (Y4 Blossomtide): romance faded too fast while dating, with few chances for romantic time beyond visiting her place. (Log: the "fight for it" check was won, spark +20.) → M37, M38
- L24. Origins sponsor tuition, and tuition is lowered so the origin doesn't swing the game too much. In this run's numbers, over four years: noble ≈ 340 income, merchant ≈ 230, scholar ≈ 215 plus half tuition, hedge 15, street 10, against ≈ 560 of costs. Poor origins are warned on the origin screen (M32). (D4/D7)
- L25. Thesis obligation 3 → 2 sessions a term, so year 4 isn't a full squeeze (in this run, job 3 + club 2 + thesis 3 filled all 8 term visits). The year-4 opening hints at quitting a job or club for more time (C20). (D4/D7)
- L26. Research internships pay properly (this run: 24 crowns across two internships). → M10, M16, X12 (D4/D7)
- L27. Friendship gains are lower overall: Nessa hit 100 by Y2 Greenrise, and every later gain was wasted. → M37 (D6)
- L28. **Final pass, after X:** re-check the economy and balance once X13 (illegal gigs), X14 (financial aid, debts, favours) and X15 (vacation gigs) add their income, and refresh the golden baseline.

## N — Minor addition opportunity

- N1. Lead-in cards for the club fair, the job board and elective selection (`club_fair_v3`, Y1 Emberwane); every first meeting with a character gets a dedicated lead-in card instead of happening right after joining a course/club/job (`club_fair_v3`; `nessa_intro`, Y1 Emberwane).
- N2. Events that show the effect of statuses like Detention and Hungry. (W10)
- N3. An event for each spell learnt (where and how it is taught), so learning is seen and felt. (W22, with B4)
- N4. An event to appeal a failing grade. (W24)
- N5. Hints at proactive ways to earn money outside jobs. (W26) Decided (D2, D4/D7): low gold brings hints, never obligations. Here: the job-board hint. The hints to financial aid, debts and favours are written with X14, so they never point to nothing.
- N6. Descriptive, varied text for end-of-month stat changes. (W36)
- N7. Jealousy: is it implemented? ? Events when the player has romance values with more than one character. (W49)
- N8. Pets: events instead of passive bonuses. (W50)
- N9. `life_invent_spell` (Y2 Mistveil): reward an actual spell.
- N10. `village_square_errand` (Y2 Frostcall): any follow-ups? ? Possible opportunity.
- N11. Clue journal: an interface that stores clues (`hs_frost_ring`, Y2 Blossomtide); `curse_cure_1` (Y2 Goldenhaze) should give a displayable clue; `hs_seventh_tower` (Y3 Greenrise): what were the consequences? ? Add a clue. (Log: the win granted nothing; **do with X11**.) Decided (D5): the plot is represented much more in the UI, and clues are explicit. → X11
- N12. Spellcasting opportunities instead of plain checks: `duelling_ward_line` (Y3 Greenrise, a ward), `illu_good_news` (Y3 Blossomtide), `life_prank_war` (Y3 Blossomtide; a future mischief spell, or reuse illusion spells).
- N13. Job board events with some story relevance, so a visit isn't only functional. (D2)
- N14. Letter events for the nightly off-campus letter card (M38): mostly generic, plus some specific ones for each romanceable character. (D8)
- N15. Each year's opening foreshadows that year's new options, duties and expectations (from C20): the midnight turn (M41), internship applications (M36), vacation work (M6), and year 4's thesis load with the hint to quit a job or club (L25). X features are added to the openings as they land.

## X — Major content addition opportunity

- X1. Social spells (soothe, charm, mind-reading, deceiving…), learnable and used in events. (W21)
- X2. Higher-tier jobs and clubs draw higher-tier event pools (more difficulty, risk, reward) instead of stat changes. (W32)
- X3. Renown events: an extra pusher, high risk to balance the extra reward. (W44) (renown is hard to raise: L22)
- X4. Lovers: more generic and character-specific dating events. (W48)
- X5. Combat minigame wiring: `tournament_semifinal` (Y1 Greenrise) ?; `life_rival_academy` (Y2 Frostcall) — does it lead to a minigame? ?; `spring_tournament` (Y3 Greenrise) — consecutive fights with recovery as resources spent between fights; `ilse_grey_returns` (Y4 Greenrise); `y3_last_duel` (Y4 Blossomtide) — tell me if it's already a minigame placeholder ?; `hs_beneath` (Y4 Blossomtide) — more turns and eventually one or more minigames. The stub entry they all use until then: M39.
- X6. Festivity overhaul: festivals as chains of many events — `starfall` (Y1 Starfall, too insignificant); `midwinter_ball` (Y2 Frostcall, extend the ball as a chain). Festivals replacing a visit already work in the engine (`replaces:`); only one event uses it so far.
- X7. NPC schedules: differ by afternoon/evening and by term/vacation, shaped by character (clubs, work, idling; noble vs poorer students; home vs staying over vacation). (W54) Uses M42. Do before X13; whoever goes away over breaks, Bram stays on campus (X13).
- X8. `life_timeloop_2` (Y4 Frostcall): more renditions, e.g. repeating loops until resolved through very hard, progressively easier checks.
- X9. `life_pen_pal` (Y4 Harvestmoon): extend the Thornwood rivalry, maybe a dedicated annual event.
- X10. A 48th month for the endings: a series of events (job interview, thesis defence, the main plot's final confrontation, goodbyes to friends, plans with the lover) that acknowledges what the player experienced, before the final summary. (W61) Related: `y3_interview` (Y4 Emberwane) as a prolonged event with tiered outcomes; `thesis_defence` (Y4 Highsun) as a process, not one check. Fills M21's stub.
- X11. Main plot: propose changes that make it intuitive and engaging. (W63) Decided (D5):
  - rewrite the plot so it's clearer and more significant;
  - forced lead-in events tell a clueless player what the conflict is (the mysterious beats already fire on their own);
  - clues require actively going after them (this run got 9 of 10 without seeking; two key clues came from one card, `maud_old_student`);
  - the finale has real stakes: preparation (this run 12, the best tier needs 6) must matter, and failure must be possible (B34; → X5 `hs_beneath`);
  - includes B34, C12, C17, C21, C22, C23 (Ilse arrives in year 2, with a proper lead-in) and N11's `hs_seventh_tower`; the night clue routes (the restricted section at midnight, X13) are written here, each with a day alternative;
  - the UI shows it (N11).
  - Related: C12, C17, C21, C22.
- X12. Distinct internships: a shared backbone of generic internship events, plus impactful events specific to each internship as its flavour. (from M24; with M16) Deepens M16; uses M36.
- X13. The midnight turn: content (mechanics: M41, M42; D11). Do after X7 and X11.
  - **Lead-in** (year 1 Stormbloom): an unsigned note from the Midnight Cartographers (Corvin's hand, revealed later).
  - **The night card's variant pool:** it comes up about 40 times a run, so it needs a large pool (season, exam months and festivals, low mood or health, watched, a partner, low gold, the year, the last outing).
  - **Tone:** most places are sealed; the open ones feel shady and dangerous; midnight events are riskier and more punishing in general. Harmless nights exist too (stargazing, swims, a partner, eerie danger).
  - **Place pools:**
    - Gilded Newt (upstairs): selling company, gambling;
    - boathouse: duelling (a ring under the boathouse), Grisk pick-ups, the lake;
    - refectory kitchens: stealing food (also clears `hungry`);
    - restricted section: break-ins (its clue routes are X11's);
    - observatory: harmless (stargazing, sneaking out with a partner); Kael some nights;
    - gargoyle passage: the Cartographers; Corvin some nights.
  - **Illegal business** (illicit money as a third way to pay; it moves alignment toward Hollow; risky outcomes use M41's spotted marker):
    - **Selling company** (repeatable gig, charm): hired as a companion at wealthy guests' card parties and revels. Suggestive wording sets the atmosphere, but nothing explicit and never prostitution (content boundary). A client who oversteps means leaving, at a mood cost. A partner who finds out may set off jealousy (N7);
    - **Duelling** (repeatable gig): fights for purses in the ring under the boathouse, through the combat minigame entry (M39), not skill checks. Losing costs health; you can bet on yourself; Lyra disapproves if she learns of it;
    - **Gambling:** clearly higher stakes and more illegal than the Newt's day events. The player can lose more than money: a familiar, a favour owed to Grisk, health, or something of their own;
    - **Stealing:** food from the kitchens, the stores;
    - **Grisk's jobs:** pick up at the boathouse at midnight; the delivery comes next month by day (midnight is the month's last slot) as a guile check that is the payday. A failed delivery loses the goods, angers Grisk (→ M22) and gives `watched`. `grisk_smuggling` becomes this pair; `grisk_favour` stays a day event; `life_shady_offer` (C11) becomes a lead into this business, with alignment and follow-up consequences;
    - not included: selling exam answers, forged excuse notes.
  - **Night people:** the Cartographers (a hidden flavour group, M40), Grisk as the fixer, a few night-only scenes for the man in grey (with X11). Bram stays on campus during breaks (X7).
- X14. Income outside jobs: financial aid, and off-campus options such as taking on debts or doing favours, hinted at low money or for sponsor-less origins; includes N5's hints to them. → M22 (D4/D7)
- X15. Vacation gigs for working on campus (M6):
  - **Baseline:** about 2 gigs, open to anyone, paying much better than a rank-3 term job.
  - **Extensions:** a holiday version of a term job, for players at rank 3 (above rank 2) in it. Its pay and performance are its own, independent of the term job's level, and it pays a little better overall than the baseline gigs.
  - **Notices:** lead-in notice events as the vacation starts.
  - **Pay:** through events (M10).
  - Fills M6's stub.
  - (D10)
- X16. `starfall`: variants for players at home or on an internship (the festival is on the observatory roof). → X6

## D — Design choice debate

Open: none.

Resolved (old numbers, for reference): D1 → M32, B32 · D2 → N5, N13, M33, M34, M6, X13 · D10 → X15, M6, M10 · D11 → X13, M39, M40, M41, M42 · D3 → M35 · D4/D7 → L24, L25, L26, X14, N5, C20 · D5 → X11, N11 · D6 → M37, L27 · D8 → M38, N14 · D9 → M36
