# Human playtest #2 (end of phase 3)

The design's second playtest gate (design §13, phase 3, step 9): a full run in each language. It replaces playtest #1, which was skipped by decision. Its notes decide the last tuning of phase 3 before content production runs on its own.

## How to play it

```bash
npm start            # http://127.0.0.1:4173 — saves, run logs and feedback go to data/
```

Play one full run (four years) in English and one in Chinese, or one run that switches language halfway (the globe icon). Rate cards as you go: 👍 / 👎 on the current or previous card, **F** for a comment. Comments matter most: what you expected, what felt off, what you skipped.

After playing:

```bash
node tools/grim.js feedback          # your notes, by event
open http://127.0.0.1:4173/admin     # runs, per-event feedback, decision times
```

## What to look at

1. **The day.** Two places on the map, then the day's cards. Is the pace right over four years (about 330 cards)? Where did you start skimming?
2. **Courses, clubs, jobs.** Enrolment, exams and the GPA; club practices and job shifts as obligations; probation if your marks fall. Do they feel like pressure in a good way?
3. **Money and numbers.** Board and tuition, a hungry month when the purse is empty, Grisk if it happens twice. The amounts were raised so choices bite: too harsh, too soft, invisible?
4. **People.** Characters turn up where their schedule puts them (the map shows who is there), and the ones you warm to start coming to find you. Do friendships form at a good pace? Does anyone crowd you out, or vanish after you met them?
5. **Alignment.** Choices with moral weight move the Alignment bar toward the Lumen or the Hollow. Did you notice it move? Did the cards that open at ±30 and ±60 (people reacting, temptations, a way back) feel earned?
6. **The Hollow Star.** It is optional. Did you notice it, and could you choose to ignore it? If you followed it, did the finale reflect what you prepared (clues, allies, sides, spells, alignment)?
7. **The yearbook.** The ending is now a headline (career or studies) plus lines for the Hollow Star, your bonds and how you're remembered. Does it read as *your* run?
8. **Chinese.** Wrong terms, stray English, awkward option labels.

## Known gaps (don't report these)

- The finale is one sealing challenge, not the design's sequence of duel, negotiation and research.
- Relationship lines in the yearbook are generic (partner; three friends; Ilse's chain), not one line per bond.
- Renown tiers, spotlights and scandals, fact discovery in the People panel and the arc Journal tab are phase 4.
- Art is placeholder: every card's *Illustration:* note describes the intended scene.
