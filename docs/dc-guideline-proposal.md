# Check difficulty: writing guideline (draft 4, for discussion, 2026-10-15)

This is a draft for discussion and is not implemented. It follows the survey in `docs/skill-checks-2026-10-15.md`. Every number here is a `@balance` value, so a word can be remapped without editing cards. The redesign of the existing checks comes after we agree on this.

## 0. Four dials, four jobs

| dial | its job | written as |
|---|---|---|
| **Base difficulty** (tier) | Who or what resists you. Keeps the check true to the theme and the prose. | a rung on the rank ladder (§2), or `vs who.stat` |
| **Base chance** (likelihood) | How likely this is by nature, when your skill matches the obstacle. Also keeps the check true to the theme and the prose. | `certain` … `freak` (§3) |
| **Swing** | How much of it is luck rather than skill. | `steady` · `normal` · `wild` · `luck` (§4); pure luck is `chance` |
| **Drift** | Keeps difficulty balanced over the run, and repeat cards on par. | `none` · `low` · `mid` · `high` (§5) |

**One reason, one dial.** Each fact about the scene goes into exactly one dial. A strong opponent is the tier. A long shot is the base chance. A coin-toss situation is the swing. A card that comes back is drift. Writing the same reason into two dials counts it twice (§6).

```
DC   = value(tier) + k(drift) × (P(turn) − value(tier))          P = the passive player's skill (balanced style)
odds = 2 + 96 × Φ( z(base chance) + (skill − DC) / σ(swing) )    milestones and exams: 0 + 100 × Φ(…)
```

## 1. Intent

Use these sentences to settle anything the rules miss.

- **A check's difficulty belongs to the story.** It reflects what you're up against and what kind of thing you're attempting, not the month the card happens to appear.
- **Growth must be felt.** The same obstacle gets easier as you improve. Masters and legends become reachable through focus.
- **Time adjusts only a little.** Drift keeps repeat cards from going stale. It never makes a hard thing impossible.
- **Luck is honest.** If a thing is unlikely by nature, its base chance says so. If it's mostly luck, its swing says so. Neither is faked through the tier.
- **No roll is hopeless or certain.** Skill and circumstance always move the odds a little.

## 2. Base difficulty: the obstacle

Ask: **"What resists this action, and what rank of practitioner would find it a fair contest?"** That rank is the tier.

The obstacle is what pushes back against this action, not who appears on the card.
- Helping a professor save a blighted rosebush: the obstacle is the blight.
- Asking the headmistress a hard question: the obstacle is her judgement.
- Going down a haunted boathouse's steps: the obstacle is the dark and the wet stone.

**The ladder.** 24 rungs, 4 apart (`@balance dc_tiers`).

| rank | − | (plain) | + |
|---|---|---|---|
| novice | 0 | 4 | 8 |
| apprentice | 12 | 16 | 20 |
| journeyman | 24 | 28 | 32 |
| adept | 36 | 40 | 44 |
| expert | 48 | 52 | 56 |
| master | 60 | 64 | 68 |
| grandmaster | 72 | 76 | 80 |
| archmage | 84 | 88 | 92 |

**Bands.** Start at the band's middle.

| obstacle | band |
|---|---|
| **Mundane**: chores, crowds, weather, small favours, an ordinary stranger | novice+ … apprentice+ |
| **Peers and coursework**: classmates, rivals, practicals, club and job tasks at your level | apprentice+ … adept− |
| **Skilled**: upper-year champions, staff and townsfolk in their trade, academy wards and creatures | adept … expert+ |
| **Masters**: faculty, master crafters, the institution's will | master … grandmaster |
| **Legendary**: the main mystery's powers, ancient wards, entities. Story and milestone cards only, with `partial:` and a route that avoids the check. | grandmaster+ … archmage+ |

**Circumstance moves it up to ±3 rungs.**
- Easier (−1 to −3): you're prepared or helped, the obstacle is distracted, or the ask is small (impress rather than defeat).
- Harder (+1 to +3): you're rushed, ambushed or on its ground, or the ask is large (defeat it, deceive a master).
- Beyond ±3, it's a different band.

**Named characters and courses.**
- Up against a named character: write `vs who.stat`, and their worldbook stats set the bar (read them with `grim brief <npc>`). The old words then mean rungs from that stat: `easy` −2, `hard` +2.
- Course cards rise 3 rungs per course level above I (`@balance course_step`). Write the level I version.

## 3. Base chance: how likely it is by nature

Ask: **"If someone exactly as good as this obstacle tried, how often would it come off?"** Most things are `even`. Change it only when the nature of the attempt makes success unusual or usual, whoever tries.

| base chance | at matched skill | the nature of the attempt |
|---|---|---|
| `certain` | 97% | It works unless something freakish happens. |
| `sure` | 90% | It almost always works; the check is for the rare slip. |
| `likely` | 70% | It tends to work: an apology between friends, getting away with a small rule-bend nobody is checking, a dip in cold water. |
| `even` | 50% | A fair contest, an ordinary attempt. **The default.** |
| `unlikely` | 30% | It tends not to work: talking a prefect out of a detention, a first-try experimental brew, a bet against the house. |
| `slim` | 15% | Rarely works: finding one dropped ring on the lawn, a stranger trusting you with a secret, a big win at a game of chance. |
| `long_shot` | 5% | Hardly ever works: changing the headmistress's mind on policy, winning the whole pot. |
| `freak` | 1% | Almost never works; for the absurd, as a joke or a legend. |

**Bets and prizes.** When the card pays out like a wager, the stakes set the base chance. The fair chance is loss ÷ (win + loss); pick one word below it, so the house keeps an edge (lint: expected value ≤ 0 for a passive player). In gold tiers:

| win | lose small | lose medium |
|---|---|---|
| small | 50% | 65% |
| medium | 35% | 50% |
| large | 21% | 33% |
| huge | 12% | 20% |

**Circumstance steps.** Conditions in the state or the scene move the base chance about one word per step. The syntax is to be agreed; something like `+1 if renown >= 60`, `-1 if season == "winter"`, `+1 if spark(npc) >= 30`. A step is right when it's a fact of the world (the weather, your reputation, how much they like you), not your skill. Skill is already in the roll.

**`chance <word>:`** is a roll with no skill at all (§4). It replaces `chance N:`, with the same words and steps.

## 4. Swing: how much is luck

Ask: **"If two people of different skill tried, how much would it matter?"**

| swing | σ | what decides it | a 40-point skill edge, from `even` |
|---|---|---|---|
| `steady` | 12 | practice: brewing to a recipe, drills, careful craft | 50 → 98% |
| `normal` | 20 | skill and luck: most contests | 50 → 96% |
| `wild` | 32 | luck nudged by skill: a crowd's mood, banter, chaotic scenes | 50 → 88% |
| `luck` | 80 | luck, which skill tilts slightly: dice, cards, finding things, weather | 50 → 68% |
| `chance <word>` | — | luck only | no skill |

How swing and base chance combine (rows are base chance, columns are your skill minus the DC):

| | −40 | −20 | 0 | +20 | +40 |
|---|---|---|---|---|---|
| `luck`, `slim` | 8 | 12 | 16 | 23 | 30 |
| `wild`, `slim` | 3 | 7 | 16 | 35 | 58 |
| `normal`, `even` | 4 | 17 | 50 | 83 | 96 |

With `luck`, a big skill edge still moves things (the dropped ring is 37% for a passive fourth-year), but luck decides most of it. If skill truly can't help, it's `chance`.

## 5. Drift: keeping difficulty on par

Drift pulls a check toward the passive player. A check below their skill is raised; one above it is lowered.
- Over time the DC moves by k × the passive player's growth: `@balance drift: none 0 low .15 mid .3 high .5`.
- `high` is "half of passive gains".
- The tier is the DC at the moment a passive player's skill equals it, so drift needs no anchor month and no new save state.

Passive player's odds (`even`, `normal`), by tier and drift:

| tier | drift | m3 | m12 | m24 | m48 |
|---|---|---|---|---|---|
| apprentice− (12) | none / high | 48 / 49 | 73 / 62 | 91 / 76 | 98 / 89 |
| journeyman (28) | none / high | 21 / 34 | 44 / 47 | 73 / 62 | 95 / 80 |
| adept+ (44) | none / high | 7 / 22 | 18 / 32 | 44 / 47 | 83 / 68 |
| master (64) | none / high | 2 / 11 | 4 / 18 | 14 / 29 | 50 / 50 |
| grandmaster+ (80) | none / high | 2 / 6 | 2 / 10 | 4 / 18 | 22 / 35 |

A high-drift hard check is never worse than a no-drift one.

**Defaults.**

| card | default drift | why |
|---|---|---|
| Repeatable routine and incident cards | `high` | Keeps the card on par: their variants describe a bigger version of the task as you grow. |
| Peers on a `vs` check | `high` | Classmates grow too. |
| Everything else | `none` | A one-off is met once. A fixed obstacle stays what it is. |

## 6. Worked examples: one reason per dial

| card and option | difficulty | base chance | swing | drift | passive, m6 / m24 / m48 | focused (+25), m24 / m48 |
|---|---|---|---|---|---|---|
| Escaped portrait: persuade her back | apprentice+ (her stubbornness, mundane magic) | even | wild (her whims) | none | 44 / 73 / 90 | 91 / 97 |
| Cold swim: brave the ice | apprentice (cold water) | likely (most people survive a dip) | normal | high (repeats) | 68 / 86 / 94 | 97 / 98 |
| Semifinal: fight the unbeaten fourth-year | adept+ (a skilled champion) | even | normal | none | 9 / 44 / 83 | 85 / 97 |
| Rankings: beat Lyra outright | `vs lyra.lore` | even | normal | high (peers grow) | 43 / 68 / 84 | 94 / 97 |
| High table: stake your purse (wins large, loses medium) | `vs grisk.guile` (the bank) | unlikely (the stakes, one below fair) | luck | none | 10 / 16 / 24 | 25 / 34 |
| Copying homework: don't get caught | master− (the professor's eye) | likely (they rarely compare papers) | wild (whether they look) | none | 20 / 47 / 73 | 75 / 91 |
| Thorne's roses: cure the blight | adept (a blight he can't cure himself) | even | steady (horticulture is practice) | none | 4 / 53 / 96 | 97 / 98 |
| Convince the headmistress to cancel exams | master+ (her judgement) | long_shot (policy doesn't bend) | normal | none | 2 / 2 / 5 | 6 / 28 |
| Find a dropped ring on the lawn | novice+ (just looking) | slim (it's a big lawn) | luck | none | 18 / 28 / 37 | 38 / 49 |
| Corvin accepts the ball invitation | (not a skill check) | `chance likely`, +1 if `spark(corvin) >= 30` | (luck only) | — | 70% (85% with the step) | |

**Mistakes to avoid** (the critic checks these):
- A strong obstacle written as `slim`. That's the tier's job.
- A coin-toss scene written as `hard`. That's swing and base chance.
- A gamble on `normal`, so skill turns it into a cash machine.
- High drift on a one-off.
- A bare `chance` where a skill or relationship plainly matters.

## 7. The evidence this draws on

1. **First sightings are mostly luck.** Across 40 simulated runs, 195 of the 337 check cards have a first sighting that spreads over more than 20 months. Timing can't carry difficulty, so the obstacle does.
2. **Today's DCs follow timing, not the obstacle.**
   - The DC each card implies today, measured at its median first sighting, lands at 23–40 for every subject.
   - This was classified by heuristic: checks with faculty present imply 25 and plot-tagged checks 40.
   - The bands spread obstacles from 8 to 92.
3. **Character stats already form the ladder.** Students' best skills sit in the peer band, specialists in their trade are skilled to masters, and faculty in their specialty are masters to legendary. Read them with `grim brief`; they aren't copied here.
4. **`chance N:` (112 blocks) and `queue … chance N` (17) are raw, unmodified numbers.**
   - Some are pure luck. Others ignore skill or a relationship that should matter: being caught copying ignores guile, the gala ignores charm, and Corvin's answer ignores spark.
   - No check today has a base chance. A guile-focused player wins the high table's large purse 95% of the time, about +28 crowns a visit.

## 8. Making it easy for an LLM to write accurately (proposed)

1. **A fixed procedure.** Five questions in order:
   1. What resists you? (difficulty)
   2. How likely is it by nature? (base chance)
   3. How much is luck? (swing)
   4. Does it come back and keep up? (drift)
   5. Is there a middle outcome? (partial)

   Each answer is a word, so the line is assembled from them.
2. **One reason, one dial**, stated as a rule, with the mistakes list (§6) in the critic's checklist.
3. **Declared intent the lint can check.** An optional `for <obstacle>` on the challenge (`@vocab obstacles` carries the bands). Lint checks:
   - the tier is within its band ±3;
   - `legendary` only appears on story and milestone cards with `partial:`;
   - `drift high` only appears on repeats;
   - bets have expected value ≤ 0;
   - `luck` and `wild` aren't paired with an obstacle tier far from par (a sign that the reason went into the wrong dial).
4. **A preview tool.** `grim odds <event>` prints each roll's odds for passive and focused players at m3/m12/m24/m48. The writer compares them with the intent before handing the card in.
5. **Words for writers, numbers in a generated appendix.** Generate the number tables from `balance.grim` (as `presets.md` is), so prose never carries stale numbers.
6. **Contrasting worked examples.** The §6 table as real cards before and after, in `docs/authoring/examples/`, tested.
7. **The why first.** §0–§1 open the guideline, so a model can settle cases the rules don't cover.

## 9. Open questions

1. **Ladder names.** Ranks read in order, and an "adept" obstacle sits at adept rungs. But a passive graduate ends near master−, which flatters them next to faculty. Rescale the rungs (`@balance`) or keep it?
2. **Base chance.** Are eight words right, with `even` as the default? Should `likely` and `unlikely` sit at 70 and 30, or nearer the middle (65 and 35)?
3. **Swing.** Is `luck` (σ 80) the right strength? Should `chance` stay a separate statement, or become "swing none"?
4. **Circumstance-step syntax.** On the roll line (`chance unlikely +1 if …:`), or a sub-line (`odds: +1 if …`)?
5. **Default drift.** `high` for repeatable routine and incident cards and peers on `vs`, `none` elsewhere?
6. **`for <obstacle>`.** A required annotation, or a convention?
7. **Old words.** `trivial`…`heroic` stay as rungs from the stat on `vs` checks, and as legacy meaning until the redesign moves every check over.
