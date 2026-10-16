# Plan: the 2026-10-15 feedback round

Thirteen requests from play. For each one: what the code does today (checked against `c655539`), the change, any language change, and whether it changes gameplay. A change to gameplay needs `grim diff` to show the intended difference and a refreshed baseline in the same commit. The other changes must show none.

Language changes are kept to three additions, all allowed under the frozen schema v1 (added, never changed in meaning): `@place always:`, `@npc distant:` and the `coursework` statement. Optional `@clue` fields and two `@balance` keys come on top. Everything else is engine, UI or content.

## A. Visits and the director

### 1. The Job Board always offers the jobs, plus one odd gig
**Today.** A visit draws 1–2 cards by weight from the place's pool. `job_board_visit` (the job menu, weight 30) competes with five gig and story cards (weight 10 each), so it is drawn first only about 37% of the time. Three of those cards are once a run and two repeat every 4 months. After a few visits, the board can yield the menu alone, or nothing new.

**Change.**
- **New optional `@place always: <event>`.** The director pushes this card first on every visit, if its `when` holds, ahead of the drawn cards and counting as one of them. The Job Board gets `always: job_board_visit`, and the menu's `repeat: 1` is dropped so that it can show on every visit.
- **The board's other cards become a gig pool.** Every visit adds one gig after the menu. Twelve new gig types join the existing five, most with `repeat: 3`–`6` so one is always eligible: copying, a message run, minding a stall, sorting the lost-property box, sitting with a sick familiar, a porter's errand, and so on. They are routine class and plot-safe. Each pays through `gold`, with the usual trade (`docs/authoring/costs.md`).
- Gameplay changes (draw order, gold), so the baseline is refreshed.

### 2. The pen pal stays out of everyday friendship and romance
**Today.** Tamsin is `romance: false`, so no romance card casts them. But they are `around()` in term, so any generic `friend` or `per:` card can cast them in person. Their own letters are `trigger: social` cards, drawn on the friend track as if they had walked up to you.

**Change.**
- **New optional `@npc distant: true`.** Such a character:
  - is never on the map and never `around()`;
  - fills no cast role and no `actor: any`, letters included, so the generic letters never pick them;
  - reaches you only through their own `actor:` cards, drawn as letters. The friend track draws them from the letter pool, as it already does for someone who is away.
- Their in-person scenes (`rival_return_visit`, the contest, the last match) are `auto` or `queued` and still play.
- Tamsin's seven `tamsin_letter_*` and `tamsin_confession` become `trigger: letter`.
- Gameplay changes (casting), so the baseline is refreshed.

## B. Cards and menus

### 3. A Clues panel, for every thread
**Today.** `@clue` (with `kind: clue | lead` and `followed:`) is required to name an arc, and only the arcs' clues show, in the Journal tab above the log.

**Change.**
- **A new side tab, Clues.** It shows the threads (each arc's act, its clues and its leads) and moves them out of the Journal, which keeps the log.
- **`@clue arc:` becomes optional, and a new optional `thread:` names a side thread** (for example "The night baker's recipe"). Clues without an arc are grouped by thread. `clues(arc)` and plot safety are unchanged: only hard-canon story events `find` the main plot's clues.
- **Content.** A new `grim leads` audit lists every flag that one card sets and a later card reads, where that later card needs the player to go somewhere or do something (a `place:`, a track, a `chosen()`). A first scan found about 117 cards gated on an earlier flag, `seen` or `chosen`. Each real "hinted now, act later" pair gets a lead (`find lead_x` where it is hinted, `followed:` where it pays off). Everyday leads must not touch the mystery's secrets.
- The engine already supports `find`, so gameplay doesn't change (leads are bookkeeping).

### 4. A lead-in card before every menu, and real outcomes for every choice
**Today.**
- A menu shows its title, text and options at once. There are 28 menus.
- Options without a `say:` produce an empty outcome:
  - 30 hand-written options in four old menus (`choose_elective`, `club_fair`, `job_board`, `y3_career_fair`);
  - every generated option (`offers: courses | clubs | jobs`).
- A multi-select menu (`pick: N`, enrolment) shows its options' labels joined with " · ".

**Change.**
- **The UI only.** A menu plays as two cards:
  1. A lead-in card with the title, art, scene and text, and a single button such as "See your options" (a new `UI_EN` string). It has no options and no outcome.
  2. The menu itself, with a one-line prompt and the options.

  There is no language change, the engine and the bots don't see it, and `grim diff` shows nothing. Menu texts are reread so each one leads into a choice. The lint gains a check that a menu's `text:` isn't empty.
- **Every hand-written menu option gets a `say:`.** The lint warns on a menu option without one (the four old menus first, after checking whether they are still reachable).
- **Generated options get an outcome line.** Each track can carry a new optional line, `@track picked: …`. Without one, a per-kind `UI_EN` sentence is used: "You enrol in {name}." / "You join {name}." / "You sign on at {name}."
- **A multi-select outcome is assembled:** the chosen options' lines in order, then the event's own `say:`. For example: "You enrol in Evocation I and Practical Alchemy I. The bursar takes the fees with a sniff." The journal records the same text.

## C. Exams and difficulty

### 5. "Go for top marks" is always worse than answering carefully
**Today (`examOdds`).** The grade bands are fixed:
- A needs skill at least 15 over the bar, and then gets the whole top band;
- otherwise A is impossible, whatever the roll;
- the risky option only widens the bell (σ 12 → 32).

So the wide bell never raises the chance of an A and only spreads the result. Grade points (A = 4) by how far skill is over the bar:

| skill − bar | careful: P(A) / P(F) / GP | top marks: P(A) / P(F) / GP |
|---:|---|---|
| −10 | 0 / 0.66 / 0.78 | 0 / 0.56 / 1.20 |
| 0 | 0 / 0.34 / 1.66 | 0 / 0.44 / 1.56 |
| +10 | 0 / 0.11 / 2.45 | 0 / 0.32 / 1.92 |
| +15 | 0.80 / 0.05 / 3.50 | 0.62 / 0.27 / 2.71 |

With study lowering the bar by up to 15, most players sit above it, where "top marks" only costs.

**Change.**
- **Grades come from the bell at every level:** P(A) = odds(bar + 15), P(B or better) = odds(bar + 5), P(pass) = odds(bar − 5). There is no hard A gate.
- **"Go for top marks" lowers the A threshold** (`@balance exam: ambitious_a +8`, say) and keeps the wide bell, so it trades a higher chance of an A for a higher chance of an F.
- **Target:** at a typical skill (bar to bar + 15), top marks gives about +15 points of A chance and +10 of F chance, with expected GP within ±0.2 of careful. Below the bar it stays the long shot.
- A small `tools/exam-odds.js` prints this table from `@balance`, so a retune can be checked.
- Gameplay changes (exam results), so the baseline is refreshed.

### 9. Are higher course levels harder?
**Today.**
- Each level's exam bar is two rungs up (apprentice+ → journeyman+ → adept+, and level III two more).
- Exams drift low (0.15) toward the expected skill.
- A course card shown above its own level rises `course_step` (3 rungs) per level, but routine course cards drift high (0.5). That pulls half of the rise back toward E(turn).
- Players reach level II about a year later, with about a year more skill. So, as you say, the felt difficulty can be flat.

**Change.**
- **Measure first.** The exam-odds tool and `balance` will report the pass and A rates by course level, and the median odds of course-card challenges by level, for the balanced and random styles at the turns they reach each level.
- **Then set targets.** For example, a balanced player passes level I about 85% of the time, level II about 75%, level III about 65%, and course-card odds fall by about 5–10 points per level.
- **Likely levers, all in `@balance`:**
  - course cards in a level above their own drift `mid` (or a per-level drift);
  - a wider `course_standard` spread;
  - `exam_tiers` with level II at `standard+1`.
- Gameplay changes, so the baseline is refreshed.

## D. Skills, peers and the monthly baseline

### 7. Peers grow with you, and share your year
**Today.** `statOf` returns an NPC's fixed `stats:` for the whole run (for example Lyra's arcana 34). Late in the run, checks against peers become easy. Corvin and Nessa are year 2 and Bram is year 3. No card has them graduate or leave, and text names their year in only one place.

**Change.**
- **Peers scale with the expected-skill curve.** For characters tagged `peer` (and Tamsin), each stat is multiplied by one factor that grows with E(turn), so each peer keeps their shape:
  - k(turn) = 1 + (K − 1) · (E(turn) − E(1)) / (E(end) − E(1))
  - K = 0.9 · E(end) / (their highest starting stat)

  Their best skill reaches 90% of a balanced player's final expected skill, and every other skill rises in proportion. New key: `@balance npc_growth: tag peer share 0.9`. Faculty and villagers keep their fixed stats.
- **Peers are first-years with the player.** Ages are aligned and `year:` set to 1 for Corvin and Nessa (and Bram, see the decisions below). The one text line and the briefs and lore are checked.
- Gameplay changes (checks against peers), so the baseline is refreshed.

### 11. Coursework comes through course cards, like wages
**Today.** Nine `coursework_<course>` hooks give the course's skill +small XP every term month for every enrolled course, whether or not you go to class. The course cards add their own skill XP on top, unevenly between courses.

**Change.**
- **New statement `coursework` (and `coursework light`, `coursework extra`).** Inside a course's card it grants that course's skill XP at the course level's amount (`@balance coursework: I small II small III medium` × `light 0.5 full 1 extra 2`). Mastery and aligned clubs or jobs multiply it as they do now. Like `wage`, a class visit with no card to draw grants it anyway, so attendance is what trains the skill.
- **Content.**
  - The nine hooks go. Their flavour lines move into the attendance fallback (`@track` text).
  - Course cards' explicit XP for their own skill is replaced by `coursework`, through a migration in `tools/migrations/`.
  - A course card's other XP (incidental, other skills) stays.
- **Courses are equalized by tier.** `economy.js --by course` reports the skill XP per term month for each course. The lint checks that courses of the same level are within ±15% of each other.
- **Gameplay changes**, so the expected-skill curve (E(turn)) is refitted and the baseline refreshed.

### 12. No monthly mood from loneliness or a partner
**Change.**
- Remove the `love_glow` (+4) and `lonely` (−2) hooks.
- Update the design doc's monthly baseline, and the PROGRESS line that lists loneliness.
- The `balance` mood alarms are rechecked, since social play loses +4 a month.
- Gameplay changes, so the baseline is refreshed.

## E. The screen

### 6. Compact previews, with track performance
**Today.**
- The preview (`previewHtml`) drops track keys, so job, club and course performance, exam preparation and thesis progress don't show before a choice, though they do show after it.
- Amounts are signed numbers.

**Change.**
- **Add `perf:`, `study:` and `progress:` to the preview**, with the track's short name.
- **Show sizes as tier marks, not numbers:** one to four pips from the tier the amount falls in, with the tier word as a tooltip. Only Crowns and Mana stay numbers.
- **Drop the "+" and "−".** The colour carries the direction, with an arrow glyph for colour-blind players.
- UI only.

### 8. Crowns, renown and the meters
**Today.** The top row is the Health, Mood and Mana meters, then Crowns as a number, then the Renown and Alignment meters. Nothing shows what next month will take.

**Change.**
- **The engine adds `upcoming()`.** It dry-runs next month's `month_start` hooks (and `term_start` at a term boundary) on a copy of the state, and returns each hook's label and its deltas.
- **Crowns** show the number plus a small line under it, "−24 next month". Hovering lists the items: board 8, tuition 16, course fees 8, a debt payment.
- **Renown becomes a number like Crowns**, with "−N next month" from `fame_fades` (−20% a month) and its tier (Known 30 / Famous 60 / Legend 85) in the tooltip.
- **Layout:** the four meters (Health, Mood, Mana, Alignment) together on one side, and Crowns and Renown together on the other.
- This is a UI and snapshot change. `upcoming()` must be pure (on a copy of the state, with no RNG), so `grim diff` shows nothing.

### 10. No "shifts remaining" toast after a visit
**Change.** The toast after a map pick goes. The float-up deltas stay, and the remaining shifts are already in the You panel's track line. UI only.

### 13. Time of day as a background colour
**Today.** The `body[data-slot]` tint is a 9–12% radial glow at the top of the page, too faint to notice.

**Change.**
- The page background takes the slot's colour: dawn gold, noon pale, afternoon amber, evening rose, night blue, midnight violet. It fades over 1.5 s, at a strength that keeps the cards' text contrast.
- Cards without a slot keep the last slot's colour, and the map takes the slot being picked.
- UI only.

## Order

Each step is one commit and passes `grim check`. The larger steps also pass `npm run verify`.

1. **UI only:** 10, 13, 6, then 4 (the lead-in card, assembled outcomes, the `picked:` field and the says). `grim diff` shows no change.
2. **8:** the top row and `upcoming()`. `grim diff` shows no change.
3. **3:** the Clues tab, the `@clue` fields, the `grim leads` audit, then the leads in content (a batch per file, with zh-CN).
4. **1 and 2:** `always:`, the new gigs, `distant:` and Tamsin's letters. Baseline refreshed.
5. **12, then 11:** the mood hooks, then `coursework`, the migration and the curve refit. Baseline refreshed.
6. **5, 9 and 7:** the exam bands, measuring difficulty by level, then peer growth. Baseline refreshed.

Each language addition updates, in order: `src/grimoire.js`, the engine and director, the lint, `format.js` and `query.js`, `docs/grimoire-script.md`, then `grim schema --update`. New English text gets zh-CN through `grim i18n zh-CN`, following the glossary.

## Decisions for you

1. **Bram is a prefect in year 3.** Make him a first-year like the others (a first-year prefect is odd, so he'd become one in year 2), or keep him the one upper-year, since prefects are? I recommend keeping him as he is, because he is the authority figure. Corvin and Nessa move to year 1.
2. **Compact amounts.** Should the pips also replace the numbers in the outcome chips after a choice, or only in the preview? I recommend both, for consistency, keeping numbers for Crowns and Mana.
3. **Coursework and absence.** Under the wage model, skipping class means no coursework XP that month. That's what the request implies, but it makes skipping class costlier than today. I recommend it.
