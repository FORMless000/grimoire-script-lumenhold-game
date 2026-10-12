# Human playtest #1 (end of phase 2b)

The design's first playtest gate (design §13, phase 2b). It decides whether the world loop works before the event format freezes (schema v1) and the one-pass migration of all content begins (phase 3). **Nothing should be frozen until the notes from this playtest are addressed.**

## How to play it

```bash
npm start            # http://127.0.0.1:4173 — saves, run logs and feedback go to data/
```

Play at least one full run (four years) in English, and a few months in Chinese. Use the feedback bar as you go: 👍 / 👎 on the current or previous card, **F** for a comment. Comments are the most valuable part: say what you expected, what felt off, what you skipped without reading.

After playing:

```bash
node tools/grim.js feedback          # your notes, by event
open http://127.0.0.1:4173/admin     # runs, per-event feedback, decision times
```

## What this playtest is for

Most of the existing 354 events still run in **compatibility mode**: they haven't been rewritten for the new format yet (that is phase 3). Judge the *loop*, not the old cards' wording or numbers. The new-format content is the vertical slice: the Evocation course, the Duelling Circle, the Library Assistant job, five campus places, one internship host, the slice events and a four-event arc.

Please note your impressions on:

1. **Pacing.** Cards per day (about 11 in term, 4–5 in breaks) and run length (about 425 decisions over 47 months). Too long? Too dense? Where did you start skimming?
2. **The map.** Is choosing two places a day fun or a chore? Are places discovered at a good pace? Do the markers (open, closed, club/job due, hinted, festival, who's there) read clearly?
3. **Obligations.** Do club practices, job shifts and the thesis feel like pressure in a good way, or like homework? Did skipping feel like a real choice with consequences?
4. **Courses and exams.** Is enrolment (two courses a term) clear? Do exam results and GPA feel earned?
5. **Numbers.** Are the previews on the buttons readable? Do the top bars (Health, Mood, Mana, Renown, Alignment) make sense? Does mana matter?
6. **Breaks.** Castle, home, full-time work: do the break days feel different from term days?
7. **Anything that broke**: soft-locks, a card that didn't make sense where it appeared, a place with nothing to do.

## What happens next

The notes become changes to the loop (recipes, quotas, obligation numbers, map UI). When they're addressed, `@game schema: 1` freezes the format and phase 3 begins.
