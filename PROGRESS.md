# Status & roadmap

**v0.3, phase 3 of 4: at the stop point, human playtest #2** (`docs/playtest-2.md`). The plan is `docs/design-v0.3.md`; how to work on the project is in `AGENTS.md`.

## Where things stand (October 15, 2026)

| | |
|---|---|
| Content | 989 events (lint's count), 69 states, 21 characters (12 core, 8 fixtures, Tamsin of Thornwick), 43 places, 25 tracks, 35 spells, 35 endings (5 game-overs + yearbook lines) |
| Format | schema v1, frozen; 0 lint errors, **0 legacy constructs** left in content |
| Reachability | `grim reach`: every event, option, ending, place and track can be reached; each key clue has ≥ 2 sources |
| Translation | zh-CN 100% (8,802 strings), 0 stale |
| Checks | `npm run verify` passes: build, lint, format, docs, 100+ unit tests, `balance --quick`, golden diff, browser runs from file:// and the server |
| A run | 48 months (the last two are the wrap-up), about 630–720 cards (15 a term month, 9.4 a break month; about half pushed rather than drawn); in `grim analyze` (100 games a style, 2026-10-17), random play leaves early 30–40% of the time, social 27–30%, aggressive 18–29% and cautious 10–17%; the other 23 styles finish 98–100% |

## Frequency and economy audit

October 15, 2026: [the frequency and economy review](docs/reviews/event-economy-2026-10-15/README.md) measures a preserved 963-event snapshot over 1,050 games and additional validation runs. Unresolved design deviations include midnight character cards appearing after Sleep or before unlock, incompatible schedule and slot requirements on `gargoyle_passage_parapet_cards`, and the probation hook ignoring an exactly zero GPA. The review also records mana and mood saturation, uneven relationship access, slow specialization in five disciplines, and scarce senior-job opportunities. No gameplay retuning was applied; the report includes per-event frequencies, resource flows and reproduction commands.

## The combat minigame

October 19, 2026: every `challenge combat` and `challenge duel` is a fight in the combat minigame (`combat/`, its hand-over `combat/HANDOFF.md`; design §9.2). None is rolled, for players and bots alike. The bots play both sides with the minigame's AI (`tools/combat-sim.js`).
- **The connection.**
  - `build/combat.bundle.js` (committed; works from file://).
  - The engine's fight requests and results (`eng.fights`, `fightAhead`, `choose(key, {fights})`); outcome `health` lines are skipped.
  - Max Mana is the fight's capacity, and a spell costs the same on a card and in a fight. The monthly exam-nerves drain is gone.
  - The fight screen sits in place of the card. The fight text is in English and Chinese.
- **Settings.** The opponent's difficulty (Easy by default) changes only its decisions. Engine analysis is a cheat, off by default.
- **Rules F5.9d.** Glamour and Rapport stack up to a cap. An opponent grows an urge to deal damage when it deals none. A side destined to lose goes down dealing the most damage it can.
- **A play style for fight testing:** `combatmaxx`.
- **Measured** (`grim analyze`, 40 games a style, against the run before fights were played; `build/analysis/combat-f59d.md`).
  - Fights cost Health. Early endings rise for the careless styles: random 33 → 65%, cautious 10 → 25%, social 31 → 40%, aggressive 16 → 23%. The other styles still finish.
  - Health at the end falls for every style that fights (aggressive 63 → 35, sleuth 65 → 42, explorer 71 → 50, balanced 100 → 85).
  - Mana at the end is lower everywhere (about 70 → 46), as the one scale meant.
  - `combatmaxx` never leaves early, fights about 50 times a run and wins about three in four, and ends with about 770 Crowns (fights pay).
  - Not yet retuned: these are the fight balance pass's numbers.

## Phases

- **0 · Platform and safety net: done.** Local server (saves, run logs, feedback, `/admin`), play styles, balance invariants, golden snapshots, `migrate`, `rename`, browser tests.
- **1 · Worldbook and authoring spec: done.** `content/world/` is the only canon (cast, facts, places, tracks, spells, arcs, factions, lore), with canon lint, briefs and the lorebook. **Your step:** promote soft lore to hard canon.
- **2a · Numbers and options: done.** Tiers and presets, the E(turn) curve, exact previews, challenges, spells, text variation.
- **2b · The world loop: done.** Four years of month-days, the map with two visits, the director, tracks (courses with exams and GPA, clubs, jobs, internships, the thesis), arcs with clocks and beats. Playtest #1 was skipped by decision and schema v1 frozen.
- **3 · Migration, balance, content: done up to playtest #2.**
  - *Migration* (`tools/migrations/` 0001–0012): `actor: any` → casting, `love` → spark, `check` → challenges, raw numbers → tiers, class/tone everywhere, v0.2 electives/clubs/jobs → the new tracks and places, rel thresholds rescaled, the `hollow` counter and Standing retired.
  - *New content* (writers plus a critic pass each): baseline pools for every place, course level, club, job, break plan and slot; course levels II–III; incidents and money sinks; the Hollow Star restructured into four acts with redundant clue sources; alignment events.
  - *Systems pulled forward from phase 4:* **yearbook endings** (headline, mystery, relationships and personal lines) and **alignment reactions** (Lumen ↔ Hollow).
  - *Balance:* `tools/economy.js` (sources and sinks per resource and style), the monthly baseline (board, tuition, coursework, rest, loneliness, hungry months, probation), per-style invariants and alarms.
- **4 · Narrative systems: next.** Fact discovery in the People panel, memory recall, NPC-to-NPC behaviour, archetype side characters, renown spotlights and scandals, the arc Journal tab.

## This round (after the pause)

- **Playtest #2, mechanics (step 2, under way):** the origin screen (origins apply before month 1's charges); 48 months, with year 4's last break as the wrap-up and the last month only resolving the run; the combat stub (fights cost mana, read condition and spells), swing on checks, renown checks, and exams as cards; the day played slot by slot (the map opens for each visit as it comes; festivals marked, not forced), most places open for both visits, social and world cards spread through the day, `time:` and `slot:` on 79 events, a time-of-day tint, and an alignment meter that fills from the bottom; jobs paid through their shift cards (`wage`), holiday gigs for working on campus (stub), a term-end keep-or-resign card per job, prorated dues, promotions that reset performance, the club fair's stay/resign/switch, menus that hide gated options unless they state a prerequisite (`locked:`), internships applied for in bulk and won by interview, one summer each and away from campus, and Grisk's debt escalating through a reminder and the collectors; schedules with a chance per entry and break schedules, letters off campus (halved drift, no campus pools), milestones pushed on a ramp, warmth that counts only seeking, and one relationship bar with spark that follows friendship; the midnight turn (a night card each on-campus month, a midnight pick, suspicion and lockouts) and the Cartographers as a society. Step 2 (M) is complete. Step 3 (L, balance) is done (see below and `docs/playtest-2-plan.md`). Interim fixes (step 2b) are done: a job's dues are fixed shifts (later visits and break visits are ordinary ones, with a once-a-run "not your shift" hint), a place is visited at most once a day (midnight exempt), and night suspicion is a card queued at odds (`queue … chance N`), with no hidden `spotted` state. Its review added I5–I10, also done: festival places wait for their festival, suspicion waits until you're back on campus (`defer:`), placeholder cards at four thin places, odds-aware heuristics for queued penalties, and no "take no courses" at enrolment (`offered()`). Step 2c (tooling and audits) is done: A1, A2, A3 and A4 — one bot driver with record and replay (bots on their own RNG), an engine fix (previewing "Go out" opened the midnight pick even after "Sleep", which also skewed every balance run since M-F), `grim graph`, flows per event and per month with a reconciliation check (`docs/playtest-2-flows.md`), an origin × style matrix, seed sweeps and two scenario styles. A3 replaced the routine budget's "must cost or risk something" with "no option obviously best" (alignment counts as a direction; the lint's stand-in game now counts cast relationships and wages), read the 414 single-token costs one by one (migration 0029: 124 dropped, 14 swapped for a cost the scene shows, alignment at stake on 10 more options) and added `docs/authoring/costs.md` to the writing guide. Step 3 (L) is done: jobs pay by hazard (with four hazard incident cards); friendships grow at about half the old speed; odds run 5–95% with no forced fail on milestones and exams, exams are easy/medium/hard by course level, exam preparation comes from choices more than attendance, and course levels make card checks harder; health and mood swing about a quarter wider; learning a spell gives skill XP in its discipline; five event retunes; skill growth and the expected-skill curve refitted; 37 "windfalls" that were everyday trades are routine cards. The bots now value joining clubs and jobs, exam preparation, performance and thesis progress. New `@balance` keys: `odds`, `study`, `spell_check`, `spell_bonus`, `exam_tiers`.
- **Playtest #2, step 5 (X, the major content) is done except X1 and X5**, which wait for the minigames (`docs/playtest-2-plan.md`, step 5):
  - *X7* term and break schedules by character; *X11* the Hollow Star as rumours, leads and clues (`@clue`, the Journal's threads, act names), forced lead-in beats, clue routes you have to go after, and a finale with seal tiers that can fail (`hollow_failed`, its own ending);
  - *X13* the midnight pools (the Newt upstairs, the ring under the boathouse, the kitchens, Grisk's pick-ups and deliveries, harmless nights) and *X14* money outside jobs (aid, favours, errands, the pawnbroker, a hardship grant and a bursar's loan);
  - *X15* holiday notices and a holiday version of each term job at its top rank; *X12* an internship backbone plus cards for each host; *X2* rank-3 pools; `rank()` and `performance()` take a track kind;
  - *X4* generic and per-character dates; *X9* Tamsin Reed (they/them), the Thornwick pen pal, with a four-year rivalry (letters, a secret asked and offered, a confession, the return visit, the contest, the last match, a farewell, an ending); *X8* the time loop as a hub of exploits, dares and clues with a fix that eases each loop and a cap; *X3* a twice-yearly chance to be noticed and renown stakes;
  - *X6/X16* Starfall and the Midwinter Ball as chains, with festival visits (`replaces:`), follow-ups, and Starfall at home or on an internship; *X10* the career fair without skill gates, the interview and the thesis defence as three-stage processes with tiered results, and month 48 as a closing sequence (the last morning, the final lists, what comes next, the lake, friends, partner, rival, the speech, the last Starfall, the eve).
- **Playtest #2, step 5.0 (UI) is done:** Crowns are a plain number in the middle of the top row (`display: number`), and each enrolled course shows its exam preparation, months to the exam and today's pass chance.
- **Playtest #2, step 4 (N, minor additions) is done** (`docs/playtest-2-plan.md`): three frozen-format additions (`intro:` on a track, `@game appeal`, `regrade track C`), month-end lines on every hook and state tick, and about 70 cards: intros for Vey, Brask and Pell's first shift, queued when you enrol or join; lead-ins for enrolment, the club fair and the job board; the appeal after an F; cards for hunger, detention, probation, sickness and injury, and an empty purse; the familiars as cards instead of monthly ticks; a lesson card for each of the 12 spells; three spell options and a spell from `life_invent_spell`; three jealousy cards; two errand follow-ups; three job board stories; 22 letters; and each year's opening foreshadows what's new.
- **Playtest #2, bugfix and content sessions** (`docs/playtest-2-triage.md` B and C, plan in `docs/playtest-2-plan.md`):
  - no daily card cap (`max_cards_per_day` is optional; absent means none); break days have an evening visit, and break visits don't count toward term quotas;
  - the thesis is chosen at the start of year 4 (design §4.1, §7.6), and the defence ends the thesis track;
  - migration 0019 reroutes the 124 costs the budget migrations inserted (0013/0015/0016) by what the scene costs (mood, health, clear spending, or a failure outcome); the routine budget still holds;
  - crown amounts in prose match their gold tier everywhere, and lint warns on a mismatch;
  - named partner endings (`ending_beloved_<npc>`);
  - content tweaks (triage C): four years throughout, the last-year speech moved to year four, a Duelling Circle card for the Spring Tournament, the moonpetal fetched at the Whisperwood, no new sparks while partnered, challenge labels without skill suffixes, and rewrites of confusing cards;
  - UI: the result card survives a language switch, spells learned show as a banner, challenge buttons name their skills, grade notes show score against bar, spark has its own icon, bars draw against the real maximum.
- **Linked text variation** (`docs/variation-linking-plan.md`): within a card, state or hook, every variation group uses one mode and one part count, and all groups pick the same position, so setup *k* meets payoff *k*. The engine shares one random index per card, and the journal shows the text that was shown. Cards that mixed sequence framing with random flavour are full sequence (migration 0032). Short groups are padded in English and zh-CN, and payoffs are paired with their setups. The `variants` lint is an error.
- **Feedback 2026-10-15** (`docs/feedback-2026-10-15-plan.md`):
  - *UI:* menus open with a lead-in card and each pick has a line of its own (`@track picked:`); amounts show as size marks, numbers or icons (a setting); slot background colours; the top row groups the meters and shows next month's charges (`engine.upcoming()`); a Clues tab with side threads (`@clue thread:`, `grim leads`);
  - *world:* the Job Board always offers a gig (`@place always:`, 8 new gigs); Tamsin only writes (`@npc distant:`); Corvin, Nessa and Bram are first-years, and classmates' stats grow with E(turn) (`@balance npc_growth`);
  - *numbers:* no standing mood from love or loneliness; coursework XP every month for each course, equal by level (`coursework`, `@balance coursework`); exam grades on the bell, with "go for top marks" a fair gamble (`@balance exam_bands`, `tools/exam-odds.js`); level II and III exams and course cards are harder (`course_standard`, `course_drift`): balanced players pass about 87 / 75 / 70% by level.
  - Still open: course cards at a fixed rung keep getting easier as the player grows (their odds are flat by level only on average); social play is sent home by a health crisis in about a third of games (it predates this round).
- **Feedback 2026-10-16** (`docs/feedback-2026-10-16-plan.md`; 18 notes from run `rmvae7z5x-3zqd`):
  - *engine:* a pushed card rechecks its cast roles' `where:` as well as its `when` (a confession pushed in the morning drops once the spark is cooled that day); a midnight visit is never a shift (no attendance, pay or off-shift hint); a rival bond shows the plain bond note;
  - *format* (schema v1 additions): `@place always:` takes a list in order, with `a|b` groups (one plays, the others sit the visit out) and slot filtering (an event with `slot:` only in that slot, midnight included; one without only by day); `queue any tagged <tag> …` draws one queued event of a pool when it falls due (lint, `reach` and `graph` know the pool); `grim leads --queued` lists the timed follow-ups (53, 23 marked "act"; worklist in `build/worklists/queued-leads.md`);
  - *the Newt at night:* the company offer first (`newt_company`, then `newt_company_regular` once you're a regular; a refusal rests it 3 months), one of six company nights (`company_night`: gold +large against health, mood, renown, alignment or suspicion), then the high table; `midnight_newt_cards` is retired;
  - *the ring:* a ring card first on every boathouse night, then one drawn card (Grisk's parcel no longer replaces the fight); wins lead to bouts 2–4 (adept → expert-, bigger purses, harder losses); "last standing" nights (rolled on show, said up front) allow no stepping out once you're in; "Not tonight" leads to `ring_side_bets`;
  - *cards:* `crisis_despair` says it's low mood and reaching out brings a breakdown (one of four, at random) before the comfort; `lesson_glamour` easier with a grand win; the ward line is a spell check; the umbral candle has a ward option; the renown notice and its stages say what's at stake; `hs_grey_offer` raises every skill, gives a timed taste of the Star (or, refused, he remembers) and a follow-up service (`hs_grey_return`, Lumen or Hollow);
  - *narrative:* the silver key is a lead and the Restricted Section chain is played by going there after hours (plus Odile Varn's notebook, her last week and Bram's watch on the door); the Bell has echoes at the lakeshore, the boathouse and Maud's cottage, Maud's answer and a second dive are leads, and the bell is silenced at the lakeshore, by name or rope; Lantern Night has a lantern to make, three real wishes and three follow-ups.
- **Bedtime** (2026-10-17): recovery is a night's sleep. Every ordinary month ends with one bedtime card (night_out's "Sleep", else the new `night_sleep`): +8 Health and +4 Mood, +20 and +10 at home on a break (preset `sleep`), whatever the conditions. Going out costs nothing at the door and rests nothing. The month-start `natural_recovery` hook is removed. Tests: `test/bedtime.test.js`.
- **Strategy play styles** (2026-10-17): six simulated players with a goal, each exercising one system the older styles miss (`tools/policies.js`; `grim styles` prints what each plays for): `scholar` (scholarship origin, study first, exam approach by expected grade points), `nightlife` (out every night: the Newt's company and the ring, fighting on above 40 health), `sleuth` (routes each visit to the place with the most eligible story cards; out at night only for one), `romantic` (always "Let it grow", seeks its favourite), `homebody` (always sleeps, home every break, risk −8), `explorer` (least-visited places, a different answer on repeat cards). The full `grim balance` runs them with an alarm each; tests: `test/styles.test.js`.
- **Trajectory analysis** (2026-10-17): `grim analyze` (`tools/analyze.js`) plays any set of styles in worker threads and reports, per style, every resource and skill by month (p10–p90, mean skill against E(turn)), survival and early endings, cards a month by source, run time, milestones, check calibration, flows and origins, as JSON, Markdown and an HTML page with charts. `--baseline` reports only changes that are large and significant (p < 0.001): two seed sets of the same content differ past the plain thresholds 115 times, and twice with the tests. Findings in `docs/sim-analysis-2026-10-17.md`; tests: `test/analyze.test.js`.
- **Spells v2** (2026-10-17; `docs/spells-v2-list.md`, §K says how it landed): 35 spells with the combat minigame's ids (`combat/HANDOFF.md`, step 1), each with a `skill:`, a `verb:`, a card cost, and one level or three; `pool:` hidden or forbidden for the 11 with no source yet, `alignment:` per cast for Sleight and the forbidden. Tide, Mirror and Beast-speech are gone (their lessons retired, migration 0033; saves drop them on load). Sources: the safety talk (Ward, month 1); each course's start card (`@track start:`, one spell a course, a level at the start of each course level; passing is only the fallback); seven close-friend stubs (§F); seven five-card club and job chains from rank 2 (§G); and a lesson card plus two or more spell options on existing cards for each new spell. The head starts on fixture trusts and Lyra's duel give skills instead. Exams are a rung harder (`exam_tiers: standard+2 standard+3 standard+3`), since the course spell's XP now comes before the exam. The engine-side fight wiring (`fightPlayer`, forced outcomes, pacing) and card-side fight data wait for the loadouts. Tests: `test/engine2a.test.js`, `test/world2b.test.js`.
- **Title screen names and pronouns** (2026-10-17): a dice button rolls a name, and she/her, he/him and they/them are chosen there (remembered in settings, kept on the run as `s.pronouns`; nothing reads them yet). The name follows the pronouns: own pool or now and then a they/them one; they/them only those; one roll in five from world pools. 220 names, none a name the content uses (`test/names.test.js`), zh-CN transliterated.
- **Unreachable content:** `grim reach` is a static fixpoint over everything content can produce (flags, states, clues, tracks, places, met characters, queues). It is part of lint and has a test. It found 0 unreachable events once its own model was complete; the rare events are a balance matter.
- **Hollow Star steering:** every run reached the finale because about 50 statements, half of them in everyday events, raised a hidden `hollow` counter. The counter is gone (migration 0011). Plot gates read the arc (`clock()`, the new `clues()`), the Night comes only to those who engaged, and the outcome is now a yearbook line, so it no longer replaces the career headline.
- **Lumen and Hollow:**
  - Alignment was a dead bar. Now about 60 choices move it: Star temptations, cruelty, theft, cheating, exploiting someone, or honesty and protection at a cost.
  - 14 new events open at ±30 and ±60: temptations, Maud's way back, reactions from characters tagged `virtuous` / `ruthless`, the man in grey courting both sides, and the headmistress noticing.
  - The finale reads alignment. A Lumen player seals the door more easily. At ≤ −30 the bargain opens, and at ≤ −60 opening the door frees the Star (the new *freed* outcome) instead of ending the run.
  - Measured: the lumen style ends around +61, the hollow style around −65, random play around +13.
- **Bugs:** a policy reading of size tiers, joining a club without revealing its place, hidden places open only at night, and an autosave race (0e3f00b). Also a bot bug that counted a queued scene once per branch, and plot pacing (an auto event already in the deck was not counted).
- **Design consistency:**
  - Standing retired in favour of GPA.
  - Unpaid board means a hungry month; twice in a row brings Grisk, once a run.
  - Probation below 1.5 from the end of year 1; the board after two terms below 1.0.
  - The thesis distinction and resubmit feed the headline.
  - Ilse's chain now reaches the yearbook.
  - Corvin's runaway is reachable.
- **Readiness audit (design vs. build):**
  - The routine budget is now a lint error (migrations 0013–0015; two cards fixed by hand).
  - Challenges apply the §9.2 modifiers: +3 per known spell of a tested discipline and study points on exams (each capped at 15). An exam inside a course card tests that course's skill.
  - The thesis has a safe/ambitious choice, a crunch card and a Hollow Star thesis line.
  - Exam nerves drain mana in exam months. The Midwinter Ball moved to month 4.
  - Map art exists for every place map, checked by lint.
  - Student intros now carry milestone weight (median first meeting moved from turn 10–29 to turn 8–12).
  - The `social:<npc>` bot seeks out the places where its character is.
- **People come by two tracks** (design §5.5):
  - *You find them:* at places where their schedule puts them, and at lunch.
  - *They find you:* each character's own monthly roll, driven by warmth (recent contact you chose to warm to).
  - Character events no longer depend on winning the shared social draw. A bot courting one character now reaches 50–100 by month 24 (it was 0–40), and every student is met in year 1.
- **Bigger numbers:**
  - every tier row is about 1.5× larger (lore, mana and gold kept as they were: 68 cards name crown amounts that match the gold row);
  - stronger term stress, gloom and loneliness, and faster recovery below 70 health;
  - friendship decay −2 and spark decay 15%, as designed;
  - spells cost 1.75× as much;
  - random windfalls are niche (migration 0017);
  - the skill headlines are rescaled to the refitted curve (balanced players end around 60, not 42).
- **Fixtures:** eight background names promoted to characters (design §5.5): Sister Amaranth; Professors Brask, Vey and Marisol; Mabel, Mr Grimsby, Old Pell and Grisk.
  - **What they have:** facts, schedules and 25 events; lighter ladders, a milestone each (four teach a spell), and no romance.
  - **`seeks: rarely`:** they come to you only once you've been going to them.
  - **Leads:** courses and the apothecary job name their professor or employer as `lead:`. Enrolling or joining queues the track's `intro:` card, where you meet them (N1); grades and performance move their regard, which is the §9.2 advisor modifier.
  - **Results:** a player who seeks one out reaches their milestone in 9–20 of 20 runs; others rarely see them.
- **Casting by premise** (migration 0018): 33 generic social events now cast peers, classmates or teachers instead of "not faculty", so shopkeepers and staff never get student premises. Encounters replace a card of the visit instead of adding one.
- **Novelty within one run only:** earlier runs and other players no longer make cards rarer.
- **Hosting on the local network:** `scripts/host.sh`, `host.ps1`, `host.cmd`.
- **Docs:** `PROGRESS.md`, `README.md`, the AGENTS.md traps (folded in from the retired HANDOFF.md), `docs/playtest-2.md` (replacing playtest-1), the language reference (yearbook, `clues()`, the alignment recipe), the authoring checklist and skill, regenerated sample briefs and examples.

- **The event critique, reports 01–23 (October 15):** all 166 findings on 158 reviewed cards are fixed (`docs/review-fixes-plan.md`; per card in the critique's `handoff/fixes-2026-10-15.md`).
  - Two format additions: `@game afford: gold` locks an option whose up-front crown cost you can't pay, never every option; `@npc gone_when:` keeps an absent character off the map and out of casting.
  - A lint rule: a non-incident card can't make crown loss unavoidable.
  - Migration 0031 scopes `study` in course cards to their own course.
  - Card fixes: alignment on costly kindness and on theft or cheating; absent people's relationship changes, private renown and five- or six-year students removed; term, slot and month gates; continuity flags (Tobias away, Bram's sash, Mir's padlock, Maud's tea, Ilse gone, facts tied to the branch that tells them); wages and prices that match their text; variants for repeats.
  - The critic has a mechanical audit of its 659 unreviewed cards to read next.
  - Second batch (reports 24–40): 80 more findings fixed. `around(n)` and `apart(n)` check presence and per-person contact; repeat cards no longer assume history the player never made; stakes are gated; the thesis defence reads progress.
- **The event critique, reports 41–159 and the rechecks (October 15):** the 9 recheck failures and the 251 findings on 508 cards are acted on, in five commits (`2fba618` … `8244797`; per card in the critique's `handoff/checks-wave2-2026-10-15.md`).
  - One function, `bonds_around(status)`: bonds of a kind among the people present.
  - Card fixes: presence for every in-person cast and cameo; night and dawn scenes either slotted or framed as the morning's plan for tonight; holiday work branches on the gig actually held; stakes paid up front and empty purses handled where a cost is nested; amounts in the text match the tiers moved; alignment on the decision, not the dice, and off ordinary acts; adults throughout; once-only lifecycles (the Thornwick exchange); the bursar's loan repays exactly sixty.

## Known gaps and deviations from the design

- **Balance after L** (full `balance`, 100 games a style): random play ends early in about 31% of its runs, mostly by taking "the next barge" at its second despair crisis (the other styles never choose to leave); cautious 11%, social 4%, aggressive 15%, the rest 0–1%. Several milestones can ramp in the same month. The holiday versions of term jobs (X15) and the rank-3 pools (X2) need a job's top rank, which few simulated players reach, so the bots rarely see them (`test/world2b.test.js` deals each holiday gig directly). Scoring styles that ignore alignment drift Hollow (balanced p50 about −23, plot −60): the tempting options pay, which is the intended trade, but worth a look in playtests.
- **Spells v2 chains:** of the club and job chains the bots take up, about a third finish in a club (meetings twice a term) and 70% in a job; the hidden and forbidden pools have no source; the peer capstones are one-beat stubs (§F has chain ideas).
- **Placeholder cards** (I7): the courier loft, the headmistress's tower, the ledger office and the flight field have too few ordinary cards, so each has a quiet `placeholder` card (lint lists them) until X writes real ones. The internships' pick-6 menu keeps "Not this year" (decided: internships are optional).
- **The finale** is one sealing challenge whose tier depends on preparation. The design asks for a sequence (duel, negotiate, research).
- **Finale allies** count at rel ≥ 18, not the design's friendship ≥ 50. Ilse, Isolde and Maud still have few personal events.
- **Card text and crown amounts:** many cards name a crown amount ("fifteen crowns"). Lint checks them against the gold row (3 8 15 30 60); retuning gold means rewriting them (or a `{=…}` amount token).
- **Relationship lines** in the yearbook: partners have a named line each; friends are still generic (three friends; Ilse's chain), not one line per bond (§10.5).
- **Skill checks (design §8.6, the check ladder):** every challenge and roll in content is on the ladder (rungs, odds by nature, luck, drift, circumstance steps, course standards, `chance <word>`, `queue … chance <word>`). No legacy tier or raw percentage is left, though the parser still reads them. Exams: about 82% pass, GPA about 2.96. Balanced bots win 65% of their checks (81% before the ladder) and 9% sit at the cap (was 36%); all styles span 48–69%.
  - **The cost:** the bots that take every check leave early more often. In `grim balance` random leaves 68% of the time (47% after wave 1) and aggressive 38% (32%), mostly through `crisis_despair`: they lose more of their checks, and many losses cost a little mood. The careful and focused styles are unaffected.
  - Feat stays the hardest kind (52%) because vigor lags.
  - (The combat stub is retired: fights are played in the minigame, 2026-10-19.)
  - Details and levers: `docs/skill-checks-2026-10-15.md`, section 7.
- **Feedback 2026-10-16 deviations:**
  - *The careless-player floor:* reaching out at `crisis_despair` now gives mood +huge and health +small with a breakdown (was mood +huge plus a rest, about +43). At 120 games, random play leaves early in 66% of runs (55% before); social play 19% (25%), since the breakdowns spare health. Putting `rest` back restores random to about 58%, at the cost of the "too much mood" the note asked to remove.
  - *Bots and the spark:* the bots always choose "Let it cool" on `spark_cooldown`, so with the cast recheck their pushed confessions are now dropped (50 dropped against 9 shown over 29 social games). Their romance numbers fall for that reason; players choose.
  - *The taste of the Star* can't give an edge on checks (states don't modify checks), so it gives a point of practice in every skill each month for three months, against cold dreams (mood −4 a month).
  - Bots that ignore alignment drift further Hollow (balanced alignment about −90 in `balance --quick`, was −40): Lantern Night's "read other people's wishes" and the grey man's errand pay, which is the intended trade.
- **Bedtime, measured** (2026-10-17, against the commit before it; 120 games a style, `tools/economy.js`; no retuning, as asked):
  - *early endings:* random 66% → about 35% (quiet departure 56% → 17%, sent home 8% → 18%); aggressive 52% → 22%; cautious 13% → 8%; balanced 0% both; social 19% → 37%, all of it sent home by a health crisis.
  - *health:* social p50 42 → 27 and cautious 46 → 38: these bots go out on about half their nights on campus and so skip half their sleeps, where the old hook gave +10 a month below 70 whatever they did. Balanced p50 75 → 100 and aggressive 58 → 66: they always sleep.
  - *mood:* random p50 0 → 93, aggressive 39 → 85. The aggressive style's mood now lasts about 28 term months (design: breaks by 5), a new alarm; the random and aggressive quiet-departure alarms are gone. A new truant alarm: shadow is 40% of headlines.
  - Sleep is about +230–310 Health a game for every style that sleeps, against about +340 from the old hook for social play.
- **Strategy styles, measured** (2026-10-17; `grim balance --games 12`, and 10 seeds against balanced; no retuning):
  - *the night pays best:* `nightlife` ends with a median of about 1,300 crowns against moneymaxx's 307 and balanced's 190 (alarm). The ring makes about 620 a game (bouts 2–4, the self-bet, the purse) and Grisk's deliveries 130; health ends near 30, and no run ends early.
  - *the scholarship:* a study-first scholar is paid the stipend in about 4.6 of 7 terms (66%) and ends with GPA 2.96 against balanced's 2.82; the scholar headline in 5 of 6 runs.
  - *leads:* `sleuth` follows about 85% of its leads (12 of 14; balanced 4.5 of 10), finds 24 clues to 17, and silences the bell in every run (balanced half).
  - *romance:* `romantic` finds a first partner at a median of month 10 (balanced 17); every style ends with at least one partner, often several (design D2).
  - *bedtime:* `homebody` never ends early and ends at about 96 health; `explorer` visits 33 places to balanced's 24 and sees about 448 different cards to 409.
- **Simulated play, analysed** (2026-10-17; 27 styles × 100 games × 2 seed sets; `docs/sim-analysis-2026-10-17.md`; no retuning):
  - *skill:* every style's mean skill follows E(turn) within ±3 (random included; aggressive alone ends higher, 76): choices move skill between skills, not add to it. Vigor is starved (balanced ends it at 45 against 67–73).
  - *bars:* health and mood sit at the cap for every style that sleeps (health 100 from month 6, mood 97–100 from month 3; 19 of 27 styles start ≥ 61% of term months at health 95+); only health-blind and night-going styles feel them.
  - *early endings:* aggressive breaks in year 1 (month ~8) or never; social is sent home for health-blind choices, not nights out (nightowl goes out 27 nights and leaves 2%).
  - *pace:* half of each month's cards are pushed (term: drawn 6.9 of 15.1; auto 3.6, friend 1.7, queued 1.4); break months draw 4.7 of 9.4 (design: 6–7 cards in all).
  - *money and alignment:* the night out-earns every job (nightlife takes in 2,016 crowns a run, moneymaxx 936); homebody, romantic and scholar hold 20–50 crowns for four years; every style without an alignment weight drifts Hollow, steeply after month 24 (balanced −25 → −84). Merchants end with about 3× the hedge-born's crowns at equal skill.
  - *renown* is flat at 12–17 from month 9 to 42; *GPA* settles at 2.6–2.8 for every style (aggressive 3.2, scholar 2.9); *checks* are won within 1.4 points of the odds shown, in every style.
- **Tamsin's authored letters** (`trigger: social`, `actor: tamsin`) aren't in the away letter pool, so off campus only the generic letters can come from them (event critique, reports 138–139). Reason: routing an actor's social cards into the letter pool is a director change (a pool rule, or a `letter` tag the director reads), which belongs with the next format addition rather than a content pass.
- **Advisor relationship** (a §9.2 challenge modifier) has nothing to read: no track names an advisor character.
- **The thesis (§7.6) is simplified:** `thesis_setup` picks an ambition only; there is no discipline choice (level III passed) and no named advisor (Thorne sets the topics, but his standing doesn't modify the thesis), and a player with no courses still qualifies. Progress does count: at the defence, 70+ adds a point to the score and under 30 takes one away (event critique, report 27). Reason: the discipline and advisor systems need menus, a track lead and modifier wiring that would land with the minigames' rework of checks; the bounded version keeps the thesis playable and its work meaningful until then.
- **Friendship growth** (L-2: the `rel` row is 1 2 4 6 9): courting one character reaches 100 around month 24 for most (Kael, Tobias, Seraphine, Corvin; Nessa ~90); Lyra's median at month 24 is ~63 and Mir's ~43, because their early ladders are thin (content, for X). The minor characters' trust cards open at rel 20 (were 30).
- **Skill growth** (L: `xp_cost 1 0.04` with the spell bonus): a balanced player ends near a mean of 59 (design 35–65); a focused skill reaches 64–76 by month 24 (design ~85). The two targets pull against each other with one cost curve, because a focused player trains the other skills too; a stronger mastery bonus helped the balanced player as much.
- **Spells are scarce in content:** 17 swipe-up options (3 added in N12), and Mirror and Haste still have none, so mana stays high (the caster alarm). Spells need a content batch, not a price change; the minigames may rework them.
- **Tuned on purpose** (design numbers are marked tunable):
  - board 8 instead of 10, tuition 16 instead of 40, paid by noble and merchant families (L24);
  - hungry −3 health and −4 mood instead of −4/−4 (L-4);
  - course fees 8 a term at enrolment, not per course;
  - confessions at spark 30, not 60.
- **Balance alarms after X** (full `balance`, 120 games a style; 0 invariant failures, 13 alarms). New since L: the balanced style sees about 3.5 incidents a year (design 1–3; the X incident cards add about 0.1 a year, the rest moves between runs); the money-maxxer's year-4 climb sits at 5.4–6.1 against 5, from the courier job's top rank and the harvest festival rather than X's cards; the aggressive style's mood lasts 12 term months (9 before 5.6; festivals give a little mood); the aggressive archmage share rose to about 55% as the interview became a real test (fewer teacher and wanderer headlines). The never-seen events are the ones listed below plus the Newt's three holiday-gig cards.
- **Balance alarms after L** (full `balance` after L; 0 invariant failures, 11 alarms):
  - the aggressive style's mood breaks by term month 10 (was 27; design 5): the design's drain assumes "always grinding", but the `grind` preset is used by 3 events, so it needs skill options that cost mood in content;
  - the money-maxxer still gains about 6 crowns a month in year 4 (alarm above 5) and ends a merchant 37% (above 35%): it never takes the optional sinks, by design of the bot;
  - caster mana, focused skills and Lyra (63 at month 24), as above;
  - `ending_beloved` is reached by no style: every romanceable character has a named partner ending that outranks it, so it's a fallback only;
  - 7 events are never seen: `choose_origin` (the origin screen, not drawn), `crisis_probation` (bots keep their GPA; N2's two probation cards, `probation_advisor` and `probation_letter`, are unseen for the same reason), Marisol's storm and trust cards, `mabel_cup` and `grimsby_mind_the_shop` (minor characters with few cards; gates lowered to rel 15), `gargoyle_passage_parapet_cards` (the place is found only by Cartographers).
- **Deferred phase 3 steps:**
  - removing the unused legacy syntax from the parser, and the engine's `legacy:` grants (§13 step 7);
  - `memory:` / `lesson:` annotations;
  - the `tune-events` skill and the `grim report` telemetry signals of §11.2 (routine picks, eligible-but-never-drawn, decision times);
  - the first path-1 batch accepted through the full loop (§13 exit).

## Next

1. **After the check rewrite:** the critic rechecks reports 41–159 (`handoff/checks-wave2-2026-10-15.md`). Then decide the careless-player floor (`docs/skill-checks-2026-10-15.md` §7: soften losing's mood cost on routine cards, or give `crisis_despair` a route without friends).
2. **Queued follow-ups into leads** (feedback 2026-10-16, §6): convert the "act" rows of `grim leads --queued` (`build/worklists/queued-leads.md`) the way the silver key was converted: the setter leaves a lead, and the payoff becomes a card at the place, slot or track where the player goes.
3. **Human playtest #2** (`docs/playtest-2.md`): a full run in each language, then `grim feedback`.
4. Address its notes; then a spell-options batch, skill growth, the finale allies' ladders, and the aggressive and windfall alarms.
5. The fight balance pass (the numbers above: early endings, fight costs against card odds, low-level fight length, the authoring guideline in `combat/EVENTS.md` §8); then social spells (X1) and the final pass (L28 economy re-check, C4, baseline). Combat wiring (X5) is done.
6. Phase 4, starting with what playtest #2 says matters most.
