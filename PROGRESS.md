# Status & roadmap

**v0.3, phase 3 of 4: at the stop point, human playtest #2** (`docs/playtest-2.md`). The plan is `docs/design-v0.3.md`; how to work on the project is in `AGENTS.md`.

## Where things stand (October 14, 2026)

| | |
|---|---|
| Content | 741 events (7 retired), 60 states, 20 characters (12 core, 8 fixtures), 43 places, 25 tracks, 12 spells, 33 endings (5 game-overs + yearbook lines) |
| Format | schema v1, frozen; 0 lint errors, **0 legacy constructs** left in content |
| Reachability | `grim reach`: every event, option, ending, place and track can be reached; each key clue has ≥ 2 sources |
| Translation | zh-CN 100% (6,646 strings), 0 stale |
| Checks | `npm run verify` passes: build, lint, format, docs, 70+ unit tests, `balance --quick`, golden diff, browser runs from file:// and the server |
| A run | 48 months (the last two are the wrap-up), about 340 cards; random play graduates 80% of the time, social and careful styles 97–99% |

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

- **Playtest #2, mechanics (step 2, under way):** the origin screen (origins apply before month 1's charges); 48 months, with year 4's last break as the wrap-up and the last month only resolving the run; the combat stub (fights cost mana, read condition and spells), swing on checks, renown checks, and exams as cards; the day played slot by slot (the map opens for each visit as it comes; festivals marked, not forced), most places open for both visits, social and world cards spread through the day, `time:` and `slot:` on 79 events, a time-of-day tint, and an alignment meter that fills from the bottom; jobs paid through their shift cards (`wage`), holiday gigs for working on campus (stub), a term-end keep-or-resign card per job, prorated dues, promotions that reset performance, the club fair's stay/resign/switch, menus that hide gated options unless they state a prerequisite (`locked:`), internships applied for in bulk and won by interview, one summer each and away from campus, and Grisk's debt escalating through a reminder and the collectors; schedules with a chance per entry and break schedules, letters off campus (halved drift, no campus pools), milestones pushed on a ramp, warmth that counts only seeking, and one relationship bar with spark that follows friendship; the midnight turn (a night card each on-campus month, a midnight pick, suspicion and lockouts) and the Cartographers as a society. Step 2 (M) is complete. Step 3 (L, balance) is paused partway through L-1 (tuition, origins, the thesis's dues and internship stipends; see `docs/playtest-2-plan.md`). Interim fixes (step 2b) are done: a job's dues are fixed shifts (later visits and break visits are ordinary ones, with a once-a-run "not your shift" hint), a place is visited at most once a day (midnight exempt), and night suspicion is a card queued at odds (`queue … chance N`), with no hidden `spotted` state. Its review added I5–I10, also done: festival places wait for their festival, suspicion waits until you're back on campus (`defer:`), placeholder cards at four thin places, odds-aware heuristics for queued penalties, and no "take no courses" at enrolment (`offered()`). Step 2c (tooling and audits): A1, A2 and A4 are done — one bot driver with record and replay (bots on their own RNG), an engine fix (previewing "Go out" opened the midnight pick even after "Sleep", which also skewed every balance run since M-F), `grim graph`, flows per event and per month with a reconciliation check (`docs/playtest-2-flows.md`), an origin × style matrix, seed sweeps and two scenario styles. A3 (token costs) waits on a decision about the relaxed budget rule; then L resumes.
- **Playtest #2, bugfix and content sessions** (`docs/playtest-2-triage.md` B and C, plan in `docs/playtest-2-plan.md`):
  - no daily card cap (`max_cards_per_day` is optional; absent means none); break days have an evening visit, and break visits don't count toward term quotas;
  - the thesis is chosen at the start of year 4 (design §4.1, §7.6), and the defence ends the thesis track;
  - migration 0019 reroutes the 124 costs the budget migrations inserted (0013/0015/0016) by what the scene costs (mood, health, clear spending, or a failure outcome); the routine budget still holds;
  - crown amounts in prose match their gold tier everywhere, and lint warns on a mismatch;
  - named partner endings (`ending_beloved_<npc>`);
  - content tweaks (triage C): four years throughout, the last-year speech moved to year four, a Duelling Circle card for the Spring Tournament, the moonpetal fetched at the Whisperwood, no new sparks while partnered, challenge labels without skill suffixes, and rewrites of confusing cards;
  - UI: the result card survives a language switch, spells learned show as a banner, challenge buttons name their skills, grade notes show score against bar, spark has its own icon, bars draw against the real maximum.
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
  - **Leads:** courses and the apothecary job name their professor or employer as `lead:`. You meet them on enrolment; grades and performance move their regard, which is the §9.2 advisor modifier.
  - **Results:** a player who seeks one out reaches their milestone in 9–20 of 20 runs; others rarely see them.
- **Casting by premise** (migration 0018): 33 generic social events now cast peers, classmates or teachers instead of "not faculty", so shopkeepers and staff never get student premises. Encounters replace a card of the visit instead of adding one.
- **Novelty within one run only:** earlier runs and other players no longer make cards rarer.
- **Hosting on the local network:** `scripts/host.sh`, `host.ps1`, `host.cmd`.
- **Docs:** `PROGRESS.md`, `README.md`, the AGENTS.md traps (folded in from the retired HANDOFF.md), `docs/playtest-2.md` (replacing playtest-1), the language reference (yearbook, `clues()`, the alignment recipe), the authoring checklist and skill, regenerated sample briefs and examples.

## Known gaps and deviations from the design

- **Balance after M (for step L):** random play ends early about a third of the time (a quarter before M-D), mostly through despair when broke; going out at night costs health, and social-style bots that go out often collapse (sent home in ~15% of their games); several milestones can ramp in the same month; the holiday gigs pay a flat tier per card until X15; internship cards are rare (2–3% of games) and few per host until X12.
- **Placeholder cards** (I7): the courier loft, the headmistress's tower, the ledger office and the flight field have too few ordinary cards, so each has a quiet `placeholder` card (lint lists them) until X writes real ones. The internships' pick-6 menu can still combine "Not this year" with applications (A1).
- **The finale** is one sealing challenge whose tier depends on preparation. The design asks for a sequence (duel, negotiate, research).
- **Finale allies** count at rel ≥ 18, not the design's friendship ≥ 50. Ilse, Isolde and Maud still have few personal events.
- **Card text and crown amounts:** many cards name a crown amount ("fifteen crowns"). Lint checks them against the gold row (3 8 15 30 60); retuning gold means rewriting them (or a `{=…}` amount token).
- **Relationship lines** in the yearbook: partners have a named line each; friends are still generic (three friends; Ilse's chain), not one line per bond (§10.5).
- **Advisor relationship** (a §9.2 challenge modifier) has nothing to read: no track names an advisor character.
- **Friendship growth** reaches the design's ~80 by month 24 for most characters when courted; Lyra's median is ~50 (her early ladder is thin).
- **Skill growth** for focused styles is 57–65 at month 24 (design ~85).
- **Spells are scarce in content:** 11 swipe-up options in 716 events, and 5 of the 12 spells have none, so mana stays high (the caster alarm). Spells need a content batch, not a price change.
- **Tuned on purpose** (design numbers are marked tunable):
  - board 8 instead of 10, tuition 30 instead of 40 (with the gold row unchanged, the design's figures send careful players hungry);
  - hungry −2 health and −3 mood instead of −4/−4;
  - no course fees;
  - confessions at spark 30, not 60.
- **Balance alarms** (full `balance`; 0 invariant failures):
  - the aggressive style collapses (36% Sent Home; it ignores health on purpose), but later than the design's 5/9 months;
  - about 5 windfalls a year against 1–4;
  - caster mana, focused skills and Lyra, as above;
  - 4 events are never seen by any style: crisis_probation (bots keep their GPA), gargoyle_passage_parapet_cards, the two Unseen Office internship cards.
- **Deferred phase 3 steps:**
  - festivals as `replaces:` visits;
  - removing the unused legacy syntax from the parser, and the engine's `legacy:` grants (§13 step 7);
  - `memory:` / `lesson:` annotations;
  - the `tune-events` skill and the `grim report` telemetry signals of §11.2 (routine picks, eligible-but-never-drawn, decision times);
  - the first path-1 batch accepted through the full loop (§13 exit).

## Next

1. **Human playtest #2** (`docs/playtest-2.md`): a full run in each language, then `grim feedback`.
2. Address its notes; then a spell-options batch, skill growth, the finale allies' ladders, and the aggressive and windfall alarms.
3. Phase 4, starting with what playtest #2 says matters most.
