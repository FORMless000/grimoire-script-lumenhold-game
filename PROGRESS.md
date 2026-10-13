# Status & roadmap

**v0.3, phase 3 of 4: at the stop point, human playtest #2** (`docs/playtest-2.md`). The plan is `docs/design-v0.3.md`; how to work on the project is in `AGENTS.md`.

## Where things stand (October 13, 2026)

| | |
|---|---|
| Content | 715 events (7 retired), 60 states, 12 characters, 43 places, 25 tracks, 12 spells, 25 endings (5 game-overs + yearbook lines) |
| Format | schema v1, frozen; 0 lint errors, **0 legacy constructs** left in content |
| Reachability | `grim reach`: every event, option, ending, place and track can be reached; each key clue has ≥ 2 sources |
| Translation | zh-CN 100% (6,345 strings), 0 stale |
| Checks | `npm run verify` passes: build, lint, format, docs, 70+ unit tests, `balance --quick`, golden diff, browser runs from file:// and the server |
| A run | 47 months, about 330 cards; random play graduates 85% of the time, social 95% |

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
- **Docs:** `PROGRESS.md`, `README.md`, the AGENTS.md traps (folded in from the retired HANDOFF.md), `docs/playtest-2.md` (replacing playtest-1), the language reference (yearbook, `clues()`, the alignment recipe), the authoring checklist and skill, regenerated sample briefs and examples.

## Known gaps and deviations from the design

- **The finale** is one sealing challenge whose tier depends on preparation. The design asks for a sequence (duel, negotiate, research).
- **Relationship lines** in the yearbook are generic (a partner; three friends; Ilse's chain), not one line per bond (§10.5).
- **Tuned on purpose** (design numbers are marked tunable):
  - board 8 instead of 10, tuition 30 instead of 40, no course fees;
  - hungry −1 health and −2 mood instead of −4/−4 (random players are broke in about half their months);
  - friendship decay −1 instead of −2;
  - spark decay 10% instead of 15%;
  - confessions at spark 30, not 60.
- **Balance alarms:**
  - the aggressive style collapses (58% Sent Home; it ignores health on purpose);
  - mood saturates near 100 for careful styles;
  - 10 events are rarely or never seen: the Conclave and Unseen Office internships, some confessions, two-timing.
- **63 per-option budget warnings** in lint, left for playtest feedback.
- **Deferred phase 3 steps:**
  - festivals as `replaces:` visits;
  - removing the unused legacy syntax from the parser, and the engine's `legacy:` grants;
  - `memory:` / `lesson:` annotations;
  - the `tune-events` skill.

## Next

1. **Human playtest #2** (`docs/playtest-2.md`): a full run in each language, then `grim feedback`.
2. Address its notes; then the per-option budget warnings and the aggressive and mood alarms.
3. Phase 4, starting with what playtest #2 says matters most.
