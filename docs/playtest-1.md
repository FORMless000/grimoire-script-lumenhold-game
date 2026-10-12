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

1. **Pacing.** Cards per day and run length. The design aims for about 11 cards on a term day; the simulator currently measures **about 7 on a term day and 4 on a break day, about 275 decisions over 47 months**, because the visit pools are still thin (only the slice places have their own events). Too long? Too sparse? Where did you start skimming?
2. **The map.** Is choosing two places a day fun or a chore? Are places discovered at a good pace? Do the markers (open, closed, club/job due, hinted, festival, who's there) read clearly?
3. **Obligations.** Do club practices, job shifts and the thesis feel like pressure in a good way, or like homework? Did skipping feel like a real choice with consequences?
4. **Courses and exams.** Is enrolment (two courses a term) clear? Do exam results and GPA feel earned?
5. **Numbers.** Are the previews on the buttons readable? Do the top bars (Health, Mood, Mana, Renown, Alignment) make sense? Does mana matter?
6. **Breaks.** Castle, home, full-time work: do the break days feel different from term days?
7. **Anything that broke**: soft-locks, a card that didn't make sense where it appeared, a place with nothing to do.

## Known issues (don't spend notes on these)

The simulator already flags these; they are scheduled for phase 3, when the old content is migrated and the endings are rewritten for four years.

- **Endings are skewed.** The v0.2 ending conditions don't fit a four-year run: under `balanced` play, `ending_hollow_keeper` takes about 77% of runs, and `ending_archmage` dominates social play. Judge the journey, not which ending you get.
- **Romance mostly doesn't happen.** Confession events are still gated on `love >= 35`, which is hard to reach now that spark fades each month. Most confessions and partner events go unseen.
- **Old clubs and jobs are quiet.** Choir, Skyrace, Stargazers, the Stables and tutoring were cut from the track list (decision D4), so their events never appear. The Midnight Cartographers’ invitation (`carto_invite`) never fires yet, so that club is unreachable.
- **Skill growth is slow** under the XP model: the "a focused player reaches ~95 by month 24" target isn't reachable with the current content.
- **The Hollow Star finale** still fires in year 3, month 9 (its v0.2 gate).
- **Map labels overlap** around the castle, where nine places sit close together; hover or focus brings a marker's label to the front, and the list view shows every place.
- **On phones** the map opens in its list view (the campus is too dense for 44 px markers); the map view is one tap away.

## What happens next

The notes become changes to the loop (recipes, quotas, obligation numbers, map UI). When they're addressed, `@game schema: 1` freezes the format and phase 3 begins.
