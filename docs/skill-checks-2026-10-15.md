# Skill checks: formula and a simulated survey (2026-10-15)

Measured at commit `8ca12cd`. 18 play styles × 5 games (seeds 9101 + 7919·g), all 48 months, about 9,400 chosen challenge rolls and 1,250 course exams. Simulated players are crude: read the numbers as a shape, not a verdict.

## 1. The formula

**Value tested (sv).**
- **The skill.** The challenge kind picks it: negotiate is charm, deceive is guile, research is lore, brew and enchant are alchemy, feat is vigor, spell is arcana, duel is the mean of vigor and arcana, and exam is lore (inside a course card it's that course's skills). `using X` overrides the kind. A resource in `using`, such as renown, reads as E + (value − 50) / 2.
- **Bonuses added on top.**
  - +2 for each known spell whose discipline tests that skill, capped at +6 (`spell_check: per 2 cap 6`).
  - An exam inside an enrolled course adds its study points, capped at +15 (`study: attend 2 cap 15`).
  - The advisor bonus is rel / 5, within ±15, but no track names a `lead` yet, so in practice it is 0.
- **Combat** uses its own value: the weighted mean of arcana 1, vigor 1 and guile 0.5, plus 0.2 × (mean of health, mood and mana − 50), plus min(15, 0.75 × total spell levels). Spell bonuses don't apply.

**DC.**
- DC = E(turn) + tier: trivial −15, easy −7, medium 0, hard +8, heroic +16.
- E(turn) is the `@balance curve`. It runs 8 at month 1, 15 at month 6, 23 at month 12, 38 at month 24, 51 at month 36 and 59 at month 48.
- In a course card the tier steps up one per course level above I. A `hard` variant adds one more. Both are capped at heroic.
- `vs who.stat` adds clamp(stat − E, ±15).

**Odds.**
- Odds = clamp(round(50 + slope × (sv − DC)), 5, 95).
- The slope is 2.5 for a normal swing, 1.2 for wild and 4 for steady.
- A milestone card has no forced fail: its cap is 100.
- With `partial:`, a win is odds at DC + 5, and partial or better is odds at DC − 5.

**Course exams** (`sit_exam`, or at term end).
- Bar = E + tier for the level − min(15, study) − advisor bonus.
- `exam_tiers: easy medium hard` gives level I easy, level II medium and level III hard.
- Grades:
  - A: odds at bar + 5, and only if sv ≥ bar + 15;
  - B: the rest of the odds at bar + 5;
  - C: within 5 below the bar;
  - F: anything worse.
- There is no forced fail: the cap is 100.

**Skill growth.**
- Gains are XP. The XP row is 2 3 6 10 16. The next point costs 1 + 0.04 × level, so a point costs 1 XP at 0, 2 at 25, 3 at 50 and 4 at 75.
- Multipliers stack to at most ×1.6:
  - +0.3 for a course of that skill with level II or higher passed;
  - +0.15 for each club or job you belong to that is aligned with the skill.
- Learning a spell or a spell level gives XP (`spell_bonus: medium large huge`).
- Rust: in term time, −1 a month after 3 idle months, never below 60% of the peak.

## 2. Skill progression

Mean of the six skills, with the top skill in brackets.

| style | m6 | m12 | m24 | m36 | m48 |
|---|---|---|---|---|---|
| E(turn) | 15 | 23 | 38 | 51 | 59 |
| random | 16 (27) | 25 (41) | 38 (56) | 47 (65) | 52 (72) |
| cautious | 17 (26) | 25 (38) | 40 (61) | 55 (78) | 62 (87) |
| balanced | 17 (27) | 26 (39) | 41 (56) | 54 (69) | 63 (79) |
| aggressive | 19 (29) | 29 (39) | 48 (70) | 64 (84) | 73 (91) |
| caster | 17 (27) | 25 (40) | 40 (63) | 53 (72) | 60 (79) |
| plot / lumen / hollow | 16 (25–27) | 25 (37–46) | 40–41 (59–65) | 54–55 (73–77) | 62–64 (82–84) |
| moneymaxx / nojob / truant | 16–17 (24–27) | 24–27 (37–39) | 40–42 (56–59) | 54–56 (72–75) | 60–63 (78–80) |
| social:lyra | 16 (25) | 24 (35) | 39 (58) | 52 (70) | 60 (78) |

Each focused style's own skill, and the mean of its other five skills:

| focused on | m12 | m24 | m36 | m48 |
|---|---|---|---|---|
| arcana | 51 / 20 | 77 / 33 | 85 / 47 | 92 / 56 |
| lore | 41 / 21 | 66 / 35 | 75 / 49 | 84 / 57 |
| alchemy | 53 / 20 | 82 / 34 | 90 / 45 | 94 / 55 |
| charm | 55 / 20 | 84 / 33 | 95 / 48 | 98 / 56 |
| vigor | 37 / 24 | 78 / 35 | 82 / 51 | 86 / 61 |
| guile | 36 / 24 | 73 / 36 | 83 / 47 | 93 / 57 |

- **Balanced ends at a mean of 63.** That is inside the design's 35–65 band, but up from the 59 recorded in PROGRESS.
- **Focused skills at month 24 are 66–84.** PROGRESS records 64–76, and the design alarm fires below 85. Charm and alchemy are nearly there; lore is furthest behind.
- **The other skills follow the focus.** A focused player's other five skills average 55–61 at the end, about the same as a balanced player's. Focus adds a peak but costs almost nothing in breadth.
- **Vigor lags everywhere.** It averages 45 at m48 over all styles, against 60–70 for the others. In balanced play it is the lowest skill (51).
- **E(turn) is behind balanced play.** `grim curve --games 20` (not written) now fits 41 at month 24 and 64 at month 48, against the stored 38 and 59.

## 3. Check outcomes

### By play style

p̄ is the mean win chance shown on the button.

| style | checks / game | sv − DC | p̄ | won | at 95+ | ≤ 30 | p̄ offered | took the check* |
|---|---|---|---|---|---|---|---|---|
| random | 72 | 9.0 | 66 | 64% | 24% | 9% | 66 | 47% |
| cautious | 86 | 10.6 | 69 | 70% | 29% | 8% | 70 | 42% |
| balanced | 99 | 14.2 | 78 | 81% | 36% | 2% | 69 | 56% |
| aggressive | 131 | 19.4 | 82 | 80% | 48% | 1% | 80 | 74% |
| caster | 104 | 14.6 | 78 | 78% | 42% | 3% | 69 | 58% |
| plot / lumen / hollow | 112–115 | 14.5–15.8 | 77–78 | 76–77% | 38–43% | 4–6% | 68–70 | 57–59% |
| moneymaxx / nojob / truant | 102–104 | 14.3–15.5 | 78–80 | 75–80% | 37–41% | 2–4% | 70–71 | 57–61% |
| social:lyra | 103 | 13.6 | 77 | 75% | 32% | 2% | 68 | 55% |
| focused (6 styles) | 102–109 | 14.3–23.5 | 73–80 | 75–81% | 33–50% | 4–6% | 61–69 | 57–60% |

\* How often the player chose the check when the card also offered an option without one.

### By stake: the written tier, and the tier after course-level steps

| tier | n (written) | p̄ (written) | n (effective) | p̄ (effective) | won (effective) | at 95+ | ≤ 30 |
|---|---|---|---|---|---|---|---|
| trivial | 2871 | 83 | 2839 | 83 | 83% | 51% | 1% |
| easy | 4208 | 77 | 3991 | 77 | 76% | 40% | 4% |
| medium | 1647 | 75 | 1635 | 77 | 77% | 36% | 4% |
| hard | 581 | 61 | 677 | 60 | 57% | 16% | 18% |
| heroic | 78 | 58 | 243 | 63 | 72% | 17% | 5% |

Mean shown odds by effective tier and year (n in brackets):

| tier | Y1 | Y2 | Y3 | Y4 |
|---|---|---|---|---|
| trivial | 85 (750) | 82 (771) | 82 (665) | 84 (653) |
| easy | 75 (1129) | 76 (1038) | 78 (931) | 81 (893) |
| medium | 63 (222) | 75 (441) | 79 (384) | 81 (588) |
| hard | 50 (81) | 59 (255) | 62 (197) | 67 (144) |
| heroic | 56 (4) | 72 (106) | 55 (73) | 60 (60) |

By card class:

| class | n | p̄ | won |
|---|---|---|---|
| milestone | 470 | 85 | 86% (90% at least partial) |
| routine | 7210 | 78 | 78% |
| story | 1361 | 73 | 72% |
| crisis | 48 | 72 | 73% |
| incident | 296 | 66 | 63% |

### By category (challenge kind)

All styles together.

| kind | n | sv − DC | p̄ | won | at 95+ | ≤ 30 |
|---|---|---|---|---|---|---|
| research → arcana / charm / alchemy | 316 | 24 | 87–93 | 89–95% | 50–74% | 0–2% |
| spell | 917 | 22.2 | 86 | 87% | 62% | 2% |
| enchant → arcana | 84 | 22.0 | 89 | 89% | 62% | 0% |
| combat | 997 | 17.9 | 84 | 83% | 49% | 1% |
| negotiate | 2028 | 18.1 | 80 | 79% | 43% | 2% |
| exam → arcana (in a course) | 130 | 14.1 | 80 | 88% | 25% | 0% |
| brew | 549 | 17.2 | 79 | 78% | 44% | 4% |
| duel | 57 | 13.6 | 77 | 63% | 26% | 5% |
| deceive | 1628 | 12.9 | 73 | 72% | 33% | 5% |
| research | 939 | 11.0 | 70 | 68% | 30% | 8% |
| feat | 812 | 9.6 | 68 | 66% | 26% | 13% |
| enchant | 64 | 8.3 | 66 | 69% | 30% | 16% |
| exam → vigor (in a course) | 123 | 8.0 | 65 | 63% | 22% | 13% |
| negotiate → renown | 39 | 2.3 | 56 | 54% | 0% | 0% |

Shapes:

| shape | n | p̄ | won |
|---|---|---|---|
| partial | 113 | 71 | 69% (88% at least partial) |
| vs a character's stat | 97 | 86 | 90% |
| course card, level II and up (stepped up) | 542 | 67 | 67% |
| wild swing | 63 | 70 | 70% |
| steady swing | 0 | | |
| hard variant | 0 | | |

### Course exams

| level (tier) | n | sv − bar | study | pass p̄ | A | B | C | F |
|---|---|---|---|---|---|---|---|---|
| I (easy) | 560 | 18.4 | 11.3 | 92 | 65% | 19% | 10% | 7% |
| II (medium) | 414 | 13.9 | 10.9 | 88 | 46% | 28% | 17% | 9% |
| III (hard) | 274 | 17.9 | 10.8 | 93 | 56% | 20% | 18% | 5% |

### Why checks run easy: the margin sv − DC, split up (non-combat checks)

| | year | six-skill mean − E (curve lag) | tested skill − six-skill mean (picking strong cards) | bonuses (spells, study) | tier offset | sv − DC |
|---|---|---|---|---|---|---|
| balanced | Y1 | +1.8 | +1.2 | +1.1 | −8.8 | 12.9 |
| balanced | Y4 | +3.1 | +0.7 | +3.8 | −6.0 | 13.6 |
| all styles | Y1 | +1.5 | +0.9 | +1.0 | −8.5 | 11.9 |
| all styles | Y4 | +4.0 | +3.7 | +3.9 | −6.9 | 18.5 |

Combat's own formula adds +5 in year 1 and +16 by year 4 over the six-skill mean, through spell levels and condition. Its sv − DC reaches 23 by year 4 (random: 18).

## 4. What it says

1. **Checks are easy overall, mostly because of how they're written.**
   - About 75% of rolled checks are written trivial or easy, so the mean tier offset is −6 to −9.
   - The design's "balanced ≈ 50% everywhere" would need a mean offset near 0. The written tier alone accounts for most of the 78–81% that balanced play wins.
   - The curve lag, choosing strong cards and the bonuses together add another +4 (balanced, year 1) to +11 (all styles, year 4).
   - In balanced play 36% of chosen checks show the 95 cap; in focused or aggressive play it's 33–50%.
2. **Stakes don't separate much above hard.**
   - Trivial, easy and medium sit at 83, 77 and 77 on average, and from year 2 medium is as safe as easy.
   - Hard is the only tier that bites: 50% in year 1, 67% in year 4.
   - Heroic is rare (78 written) and shows 55–72%: players take it when they're strong, and the 95 cap squeezes the top.
3. **The odds drift easier each year at a fixed tier.** Medium goes from 63 to 81 and easy from 75 to 81. The drift comes from the curve lag (refit: +3 at m24, +5 at m48), study and spell bonuses that grow with time, and focused players running ahead of E.
4. **Categories.**
   - Spell, enchant → arcana and research → arcana/charm/alchemy are nearly free: 86–93% shown, mostly at the cap.
   - Combat is 84%. Its stub value runs 16+ above the six-skill mean by year 4.
   - Feat (vigor), exam → vigor and plain research (lore) are the hard ones: 65–70%, with 8–13% hopeless. They track the two lowest skills.
   - Renown as a skill is 56%: E + (renown − 50) / 2 sits near E.
5. **Exams are a formality.**
   - Study (about 11 of a cap of 15) lowers the bar by more than one tier step.
   - The pass chance is 88–93% at every level, and level III is no harder than level I, because only the stronger players reach it.
   - The grade spread (A 46–65%, F 5–9%) gives GPA little to separate players.
6. **Unused knobs.** No card uses the `steady` swing or declares a `hard` variant, and only 2 checks are `wild`. So `swing` and the director's year-scaled hard variants do nothing today, and the advisor bonus is always 0 (no track has a `lead`).
7. **Skills.**
   - Growth is near target: balanced ends at 63 (band 35–65), and focus reaches 66–84 by m24 (alarm < 85).
   - The cost is that the focus barely costs breadth.
   - Vigor lags everywhere, which is why feat checks are the hardest category.
   - By m48 several focused skills sit at 92–98, so the top of the scale is reachable.

## 5. Levers, if you want to change it

These are not applied.

- **Refit the curve** (`grim curve --write`): +3 to +5 to every DC late in the run. Cheap, but it only removes part of the drift.
- **Shift the tier offsets up**, for example trivial −10, easy −3, medium +4, hard +12, heroic +20. Or move the content's tier mix toward medium: a migration, or the critics' card fixes.
- **Count bonuses into the curve**, or cap them lower: `spell_check` cap 6, `study` cap 15.
- **Raise the exam tiers** (`exam_tiers: medium hard heroic`, the engine's default), or count study at half.
- **Tone down the combat stub** (`combat: spells`, `condition`), or leave it to the minigame.
- **Use the dormant knobs in content:** `steady` on training checks, `wild` on luck, `variant: hard` on repeatable cards.

Scripts: `sim.js` (logs every roll through the engine's `challengeOdds` and `pick`) and `an.js` (the tables), kept outside the repo in the job's temp folder.

## 6. Re-run after wave 1 (same 18 styles × 5 games)

Wave 1 put the 216 challenges and 64 `chance` blocks of critique reports 01–40 on the check ladder (`docs/authoring/checks.md`), exams on the ladder (`exam_tiers: standard standard standard+2`) and the curve refit (it now ends at 63). The other 177 challenges and 47 rolls are still legacy.

| | before | after wave 1 |
|---|---|---|
| balanced: win% / at the 95+ cap | 81 / 36% | 71 / 18% |
| all styles: win% range | 64–81 | 56–78 |
| feat (vigor) | 66 | 54 |
| spell | 87 | 81 |
| combat | 83 | 78 |
| `wild` / `steady` rolls | 63 / 0 | 1,351 / 185 |
| exams: pass p̄ L1 / L2 / L3 | 92 / 88 / 93 | 82 / 84 / 85 |
| exams: A / F | 55 / 7% | 46 / 8% |

- Exam tiers were chosen from three seeds of 24 games each: `standard` at every level left level III the easiest (only strong players reach it), and `standard+1` everywhere pushed GPA to about 2.7.
- Feat checks are now the hardest kind, because vigor still lags every other skill.
- The bots that take every check end early more often (quick balance: aggressive 27%, social 40%, from 13% and 30%). The careful styles still finish every run.

## 7. Re-run after wave 2 (every check on the ladder)

Wave 2 (critique reports 41–159, commits `2fba618` … `8244797`) put the other 177 challenges, 47 `chance` blocks, 17 queued-card chances and the `risk` preset on the ladder: no legacy tier or raw percentage is left in content. The same 18 styles × 5 games, plus `grim balance` (17 styles × 100 games) and `tools/economy.js` (200 games, seed 777), each against the wave-1 commit `ac628f5`.

| | after wave 1 | after wave 2 |
|---|---|---|
| balanced: win% / at the 95+ cap | 71 / 18% | 65 / 9% |
| all styles: win% range | 56–78 | 48–69 |
| random / cautious: win% | 63 / 56 | 48 / 55 |
| negotiate / deceive / research | 69 / 68 / 66 | 68 / 60 / 59 |
| spell / combat / brew / feat | 81 / 78 / 72 / 54 | 72 / 76 / 61 / 52 |
| milestone / story / incident / crisis | 80 / 70 / 60 / 37 | 77 / 64 / 64 / 57 |
| story checks at ≤30% shown | 6% | 15% |
| `wild` / `steady` rolls | 1,351 / 185 | 1,732 / 264 |
| at the 95+ cap, `normal` rolls | 25% | 12% |
| exams: pass p̄ L1 / L2 / L3 | 82 / 84 / 85 | 81 / 82 / 84 |
| exams: A / F, GPA | 45 / 8%, 3.08 | 40 / 9%, 2.96 |

`grim balance`, 100 games a style:

| style | early, wave 1 | early, wave 2 | what changed |
|---|---|---|---|
| random | 47% | 68% | quiet departure 35% → 54% (economy, 200 games: early 57% → 72%) |
| aggressive | 32% | 38% | archmage 37% → 22%, quiet departure 32% → 35% (economy: early 37% → 45%) |
| cautious, social | 25%, 37% | 24%, 37% | unchanged |
| every other style | 0–5% | 0–6% | unchanged |

- **Checks run about six points harder overall and much less often at the cap.** Balanced bots win 65% of what they take, and only 9% of their rolls sit at the 95% ceiling. That's what the ladder was for: skill still pays (focused charm 68%, random 48%), but a strong player no longer wins everything.
- **The random bot now leaves early three games in four.** Its mood runs −1.0 a month against −0.4. No single card does it. It loses more of the checks it takes (48% against 63%), most failures cost a little mood, and the crisis cards fire more (`crisis_despair` 0.06 → 0.10 a month). The aggressive bot, which also takes every check, shows the same pattern more mildly. The careful and focused styles are unaffected. The random bot is crude, but a careless human playing a first run will look like it. Levers, in order of preference:
  - soften the mood cost of losing on routine cards;
  - make `crisis_despair`'s "Reach out" work without a friend (a first-year counsellor or the night porter on every route);
  - ease routine checks a rung where they guard mood rather than progress.
- **Feat is still the hardest kind** (52%), because vigor lags (41 at month 48 over all styles, against 59–64 for the others). The fix is skill growth, not the checks.
- **Story checks got harder on purpose** (15% shown at ≤30%). The plot cards with no drift (`hs_frost_ring`, `hs_dark_tower`, `rival_contest`, the career interview) are pitched at what the scene is, and a passive player meets them late.
- **Crises are easier** (57% from 37%): `crisis_probation` is `likely`, and Grisk's collectors are easier to outrun.
- **Exams barely moved** (GPA 2.96). The exam tiers didn't change, and only the course cards' practice checks did.
- **New `grim balance` alarms:** random quiet departure 54%, moneymaxx merchant 41% (crowns climb 6.1 a month in year 4, from 5.3), and `ending_ilse_taken` unreached (its chain is unchanged: Ilse is taken only if you lose the fight in the lane, or run for help without knowing Kael, and no bot did in 1,700 games). Gone: aggressive archmage, lumen alchemist.
- **Never seen** (18, from 16): the top-rank holiday gigs (unchanged; they need rank 3 and the gig chosen), `crisis_probation` (the bots now fail fewer terms), `pell_daughters` (Pell's friendship at 20) and `break_work_regular` (a top-rank Newt or Pell gig, like the gig cards). All are gated on rare states, not broken.

Scripts as before (`sim.js`, `an.js`, `exs.js`, and `endings.js` for run length), in the job's temp folder.
