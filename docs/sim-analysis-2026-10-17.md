# Simulated play, analysed (2026-10-17)

All 27 play styles (`grim styles` explains each one), 100 games each, played twice on independent seeds (5101 and
90001: 5,400 games). The content is commit `982633d` (bedtime, origins, the six strategy styles). Every number below
is a median over runs unless it says otherwise, and holds in both seed sets unless it says otherwise. No values were
retuned.

Reproduce:

```
node tools/grim.js analyze --styles all --games 100 --seed 5101  --name all-a
node tools/grim.js analyze --styles all --games 100 --seed 90001 --name all-b --baseline build/analysis/all-a.json
```

`build/analysis/all-a.html` has every curve (any resource or skill, p10–p90 bands, any styles), survival, cards a
month, and the tables. Each sweep takes about 5 minutes on 7 worker threads.

## How much two runs of the same content differ

Two seed sets of 100 games differ by a lot. Before the significance tests, `--baseline` reported **115 "changes"**
between them, with identical content:
- random's early endings were 40% in one set and 30% in the other;
- balanced's final crowns 194 against 165;
- several milestone months moved by 3–6.

With the tests (a change must be past its threshold *and* p < 0.001), the same comparison reports 2 changes, the
expected count of false positives. **Any balance claim from 100 games a style needs a test like this**: a single
`grim balance` run at 12–30 games can't tell a 10-point shift in early endings from noise.

## Findings

### 1. Skill growth is set by the calendar, not by the player

Every style's mean skill follows E(turn) within ±3 points at months 6, 12, 24, 36 and 48, random play included. Only
`aggressive` (skills weighed 2.5) ends higher: 76 against E 62.

| month | 6 | 12 | 24 | 36 | 48 |
|---|---|---|---|---|---|
| E(turn) | 19 | 26 | 40 | 53 | 62 |
| random | 19 | 26 | 40 | 53 | 62 |
| balanced | 19 | 26 | 40 | 55 | 65 |
| scholar | 18 | 26 | 40 | 53 | 63 |
| aggressive | 21 | 31 | 48 | 65 | 76 |

Choosing to focus moves skill between skills without adding to it. A focused skill reaches 73–82 by month 24 and
91–100 at the end (balanced: 38–44 at month 24), while the mean stays on the curve. So what a player gains by
choosing is *specialization*, not growth. The design's ~85 by month 24 for a focused skill is short by 3–12 (the
balance alarm).

Vigor is the starved skill. Balanced play ends it at 45, against 67–73 for the others, and random at 48.

### 2. Health and mood stop mattering for anyone who sleeps

- **Health:** the scoring styles (balanced, scholar, homebody, romantic, the focused and plot styles) reach 100 by
  month 6 and stay there. At least 19 of the 27 styles start 61–76% of term months at 95 or more.
- **Mood:** the same styles sit at 97–100 from month 3 to the end.
- **The exceptions** are the styles that skip sleep or ignore health:
  - random, cautious and social go out on 14–16 nights and choose without regard to health. Their health falls
    steadily, from 70 to about 30–40 by year 4.
  - nightlife falls from 100 at month 6 to about 30–35 from month 36.

The bars matter only for a careless player or a night owl. A player who sleeps and scores options has nothing to
trade health or mood for. The bedtime change (+8 / +4 a month) and the health and mood income from cards together
outrun every cost these players take.

### 3. Who leaves early, and when

| style | early | how, at what month |
|---|---|---|
| random | 30–40% | sent home (health) around month 32–38; quiet departure (mood) around month 15 |
| social | 27–30% | sent home around month 27–31 |
| aggressive | 18–29% | quiet departure around month **8**; nobody leaves after year 1 |
| cautious | 10–17% | sent home around month 28 |
| everyone else | 0–2% | |

- **Aggressive breaks down early or not at all.** Between a fifth and a third of grinders break in year 1, and the
  rest never do: their mood recovers once the first year's pressure passes. The design wants a grinder to break by
  month 5 (mood) or 9 (health).
- **Social isn't sent home for going out.** The night-owl style goes out on 27 nights and leaves 2% of the time.
  Social leaves because its choices ignore health.

### 4. A month holds about twice the cards of the day recipe

A term month is about **15 cards** (break months about 9.4), for about 630–720 cards a run. PROGRESS still says
"about 340 cards". The day recipe (§4.2) draws only about 7 of those 15 in term; the rest are pushed:

| per term month (balanced) | cards |
|---|---|
| drawn (the recipe's slots) | 6.9 |
| auto (exams, funding, schedules, bedtime) | 3.6 |
| friend (characters who come looking for you) | 1.7 |
| queued follow-ups | 1.4 |
| encounters | 0.65 |
| arc beats | 0.5 |
| festivals and milestones | 0.35 |

A break month draws 4.7 of its 9.4 (design: "about 6–7 cards"). Pushed cards are half of all play: the pacing lever is
the push sources, not the recipe. Night-goers see 1–2 more a month (the night pools' follow-ups).

### 5. Money: the night pays; careful play stays poor

| style | crowns at month 12 / 24 / 36 / 47 |
|---|---|
| nightlife | 123 / 358 / 732 / 1177 |
| sleuth | 109 / 240 / 399 / 595 |
| moneymaxx | 95 / 184 / 258 / 410 |
| balanced | 40 / 68 / 134 / 194 |
| homebody, romantic, scholar | 22–27 / 19–26 / 23–39 / 26–53 |

- **The night out-earns every job.** The nightlife regular takes in 2,016 crowns a run, against 936 for the
  money-maxxer. The ring and the Newt start paying from month 9, and the gap widens every year. The sleuth earns from
  its night trips too.
- **Careful play has no money to spare.** The homebody, romantic and scholar styles hold 20–50 crowns for four years.
  Money is tight exactly for the styles that turn down risky income.
- **The difference is in what players earn.** Spending is about the same everywhere: 450–780 crowns out per run.

### 6. Every style drifts Hollow, mostly in years 3–4

- **The drift:** apart from lumen (+100) and the health-blind styles (cautious +38, social +41), alignment falls:
  - balanced: −25 at month 24, −84 at the end;
  - nightlife: −100 by month 30;
  - explorer: −96;
  - scholar: −47.
- **Its cause:** the slope steepens after month 24, so later content offers Hollow options that score better.
  Players who weigh crowns or skills take them. Only an explicit alignment weight (lumen) resists.

### 7. Renown is flat until the last month

Renown sits at 12–17 from month 9 to month 42 for almost every style (fame fades as fast as it comes), then jumps by
10–20 in the final month. Only aggressive (61) and sleuth (41–53) build it during the run. Mana climbs from 30 to
about 70 for every style, following arcana (no style spends it enough to matter; the caster alarm).

### 8. Grades: raw skill beats studying

GPA settles in year 1 at 2.6–2.8 for every style. `aggressive` has the best GPA (3.2): skill weighed 2.5 does more for
exams than the scholar's preparation weighed 4, which ends at 2.9. The scholar is at 3.5 after its first exams and
falls to 3.0 once level II–III courses start. That fall is what makes the stipend (≥ 3.0) a real stake (66% of terms
paid, test/styles).

### 9. Origins

Every style together, both seed sets:

| origin | early | crowns | mean skill | GPA | renown |
|---|---|---|---|---|---|
| merchant | 2% | 430–470 | 63.5 | 2.7–2.8 | 30–31 |
| noble | 3–4% | 290–320 | 62.8–63.0 | 2.7 | 31 |
| scholar | 3% | 200–205 | 63.5–63.7 | 2.8 | 33–34 |
| street | 5–6% | 130–160 | 63.9 | 2.7 | 28–29 |
| hedge | 5% | 130–140 | 62.9–63.5 | 2.8 | 28–29 |

- **Skill is level** across origins by the end: the starting levels are a head start, not an edge.
- **Money isn't level.** The merchant ends with three times the hedge-born's crowns. This is the critique's point 3
  measured: the merchant is better on every number but reliability.

### 10. Previews are honest

In every style, the share of checks won is within 1.4 points of the odds the previews showed. Checks are taken at
about 60% shown odds by random play and about 70% by the scoring styles: they pick the checks they're good at.

## Bot behaviour worth knowing

- **Run time:** under 7 workers, a game takes 520–930 ms (the sleuth is slowest, from searching the map for story;
  social the fastest). One thread gets about 650 ms for balanced, 315 ms for random.
- **The sleuth's first job is at month 1**, every run. Routing to story sends it to the job board, where balanced
  scoring takes the job. It is a bot habit, not a bug.
- **The scripted opening gives every style the same first milestones:** meet, join, clue and lead in months 1–3,
  and a spell in month 4. Milestones say more from month 6 on.
- **100 crowns is mostly an origin milestone:** merchants start with 150.

## What the tool measures

`tools/analyze.js` (`grim analyze`):
- resource and skill curves by month (p10–p90);
- survival and early endings by month;
- cards a month by source;
- run time;
- milestones;
- check calibration;
- crowns, health and mood in and out;
- origin breakdown;
- people and nights out.

Its findings are rules over these numbers. `--baseline` reports only differences that are both large and significant.
`--from` re-renders a saved run.
