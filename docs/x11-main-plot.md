# X11: the Hollow Star, made clear and active

Step 5.1 of `docs/playtest-2-plan.md` (playtest 2, X11 with B34, C12, C17, C21, C22, C23 and N11; decided in D5). The user asked for the whole of X in one pass, so this proposal is built straight after it is written. Canon is the worldbook (`content/world/arcs.grim`, `lore/soft/hollowstar.grim`, the Dumonts' facts); nothing here changes what the Star, the seal or the families are.

## What was wrong (measured with `tools/hs-funnel.js` before the change)

- **Clues came to you.** Random play ended with 6 clues (p50) without seeking any: dreams, an eclipse, a course card and Maud's tea all handed them out, and `maud_old_student` alone granted three, two of them key clues.
- **Act I had no framing beat.** Kael arrives in month 3, and then nothing tells a player what the story is about until year 2. The man in grey (C21) and the bell's silence (C12) arrived as riddles with no frame.
- **Ilse came late** (C23): her first card needed two clues, which a run had only from year 3.
- **Sides came out of nowhere** (C17), and the last winter's menu didn't say what it was for (C22).
- **The finale couldn't fail** (B34): losing the seal check still sealed the door; preparation (12 in the playtest run, the best tier needs 6) only chose between "trivial" and "medium".
- **The seventh tower's key** had no visible consequence (N11), and the UI showed no clue at all.

## The shape

**Rumours, leads, clues.** Three layers, all shown in the Journal:
- *Rumours* are what everybody sees: the act's beats fire for every player, and the Journal names the act.
- *Leads* are pointers a beat leaves behind ("Old Maud lost a friend the last time the lake froze"). A lead names a person or a place.
- *Clues* are found only by following a lead: by going to that place, or seeking that person, and choosing to dig. Everyday cards no longer grant clues; they may still be eerie.

**New format (frozen-format additions):** `@clue <id>` with `arc:`, `name:`, `text:` and `kind: clue | lead` (a lead may say `followed: <expr>`, which strikes it through); `@arc act_names:` (translated act names). `find` takes either kind; `clues(arc)` counts only clues listed in the arc, never leads. Lint: every arc clue and every `find` target needs a `@clue`.

**Act I · Omens (year 1).** Two new beats every player sees:
- *The lake breathes* (beat 1, Mistveil): at the Harvest Feast's end the lake freezes for one breath and thaws; the headmistress tells the hall it was nothing; the bell tolls once. Leads: the lake, the bell.
- *A man in grey* (beat 2, Stormbloom): the existing `hs_grey_stranger`, moved here and given its stakes in plain words ("You will open it, or your sister will"). Leads: Kael, the man in grey.
- The dreams (`hs_dreams_begin`) become a lead to Seraphine, not a clue.

**Act II · Investigation (year 2).** Clues live at places, behind leads:
- the library's archive (`hs_founders_records`, by day) and the restricted section (a new midnight route, the night alternative): the founders built a seal;
- the boathouse (a new card): the tunnel and the bell, `lake_bell`;
- Maud's cottage (`maud_old_student`, now one clue, the founders' seal, and a lead to the seventh tower);
- Seraphine, the observatory and the eclipse: `second_shadow`.
- *Ilse arrives* (new beat, Thawmoon of year 2): a girl in white furs has taken a room in the village; `ilse_village` moves to the bakery and needs only that.

**Act III · Escalation (year 3).** The dark tower and Maud's locks stay; *Two shadows* (new) comes before the invitations, so the choice of sides has a lead-in (C17); `hs_seventh_tower` needs its lead, not three clues, and lifting the key now visibly costs something: every candle goes out, the headmistress knows by breakfast, and the Journal records it (N11).

**Act IV · Convergence (year 4).** The last winter says what it is for: whoever you spend it with stands with you beneath the lake (C22, a named preparation). The headmistress's summons tells you where the key is kept (a second source for `star_key`).

**The Night, as a sequence (B34).** Going beneath the lake is three cards:
1. *The tunnel*: the man in grey bars the way (with Ilse, if he took her). Fight, talk or slip past; allies make each easier (Kael, Ilse saved, the Cartographers' tunnel).
2. *The threshold*: the founders' words, a research challenge eased by the founders' seal and the seven locks.
3. *The door*: the existing menu. The seal's tier now spans heroic → easy by preparation plus how the first two went, and **losing the seal fails**: the door stays ajar, the headmistress closes it in your place and pays for it, and the yearbook says so (a new mystery line, *The Night Was Lost*).

**Plot safety** is unchanged: only these hard-canon story cards grant clues or move the clock.

## Measures of success
- Random play's clues drop (target p50 ≤ 3) while the plot style still reaches the finale with key clues.
- Every key clue still has two or more reachable sources (`grim reach`, the invariant).
- The finale fails sometimes for an unprepared player and rarely for a prepared one.
