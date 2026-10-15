# Baseline pools (phase 3, step 1b)

Every draw source must have something to draw, so that no visit, class morning, practice, shift or break morning comes up empty. Pool events are **repeatable routine events**. Each one turns up 3–6 times in a run, so it has to read freshly every time. `node tools/grim.js report --gaps` shows what each source holds; the floors are in `tools/report.js` (`FLOOR`).

This page is the spec for pool writers. It adds to `skills/write-academy-events/SKILL.md`, `style.md` and `classes.md`; read those first.

## Shape of a pool event

```grim
@event courtyard_fountain_wish
title: The Wishing Fountain
place: courtyard
class: routine
tone: light
repeat: 5
weight: 10
art: wave
tags: life
scene: A stone fountain in a flagstone courtyard, coins glinting under a skin of {season == "winter": ice|water}.
text: {The courtyard fountain is taking wishes again.|The fountain again. Someone has left a button in it.|You know this fountain's moods by now.} {season == "winter": A thin ice has formed over the coins.|{~A first-year is fishing for a coin with a quill.|Two prefects argue over whether it counts as littering.|The water hums faintly, which it shouldn't.}}
> left: Toss a crown and wish
  gold -tiny
  mood +small
  say: {~It sinks with a satisfying plink.|It lands on someone else's wish.|The fountain burps it back up. You decide that counts.}
> right: Walk past, wish unspent
  mood -tiny
  arcana +tiny
  say: {~You spend the minute reading the old runes on the rim instead.|A second-year tells you the runes say "No refunds". They probably do.}
```

- **Required:** `title`, `text`, `art` (see `src/art.js`), `tags`, `scene`, `class: routine`, `tone:` (light, warm, tense, grim, eerie) and `repeat:` (4–6, the cooldown in months). Then one draw field:
  - `place:` for a map visit;
  - `track:` with `level:` for course mornings;
  - `track:` with `rank:` for club practice and job shifts;
  - `plan:` for break mornings.
- **Effects:** only tiers and presets (`mood -small`, `grind lore`, `rest`, `work`, `social friend`). For courses use `study <track> ±tier`; for clubs and jobs use `perform <track> ±tier` and `rank_xp <track> ±tier`; for the thesis use `progress thesis ±tier`. Use `challenge` (never `check`) and `spark` (never `love`). Never use raw numbers or `grades`.
- **Budget:** `routine` means no option is obviously best (`costs.md`), and each stays within ±1.5 medium-equivalents (lint checks both). Options trade by giving different things, or by a cost or risk the `say:` shows; a free option is honest when it gives up what the other offers. Typical shape: a small gain against a tiny or small cost the scene shows, or two different gains.
- **Cast:** optional. If an event needs a character, use `cast:` roles:
  - `here: present(place)`: someone whose schedule puts them here now;
  - `friend: any where tagged(friend, peer) and rel(friend) >= 10` (cast by premise: `peer` to spend time with, `(tagged(x, student) or tagged(x, prefect))` for a classmate, `tagged(x, teacher)` for a professor; never just `not tagged(x, faculty)`, which also admits shopkeepers);
  - a fixed npc.

  An event whose cast can't be filled is skipped. So **at least two of each source's events have no cast**, or the pool comes up empty. Never use `actor: any`.

## Making repeats read differently (required)

Each event will be seen several times. Use at least three variation points across `text` and `say:` lines. Every option the player will pick repeatedly needs varied `say:` lines too; that includes spell (`up[…]`) options, which a player who knows the spell picks every time. A `say:` must never claim rarity ("which never happens") or a one-time milestone unless it sits in a sequence:
- `{first time|second time|third and after}` (no prefix) is a **sequence**: it follows how often the event has been seen, and the last alternative sticks. Use it for familiarity and a detail that *develops* (the chipped jar you always get, the cook who now saves your seat). Avoid stock ladders like "X again." / "X, as usual.": they read the same across every event.
- `{&a|b|c}` **cycles** a, b, c, a, b … with each showing. Use it only for lines that are fine to come back around.
- `{~a|b|c}` picks one at random per showing. Use it for incidental detail: who's there, what's on the board, the weather.
- `{season == "winter": …|…}` picks by season (autumn, winter, spring, summer; nest them for more than two).
- `{final_year: …|…}` gives a last-year line ("the last time you'll…").
- `{year == 1: …|…}`, `{gpa >= 3: …|…}`, and conditions on the player's state make a line respond to where they are.

**Cast roles are re-filled on every showing.** A sequence must never imply the same companion as last time ("a scarf to go with last time's hat", "you each suspect the other"): anchor the progression on the place or the player, and let `{friend}` be new each time. Restrict classmate roles with `tagged(friend, student)` (a character's `role:` counts as a tag), so outsiders and staff aren't cast as fellow students.

**Sequences count showings, not choices.** A sequence advances every time the card is shown, whatever the player picked. So it must never describe the payoff of a choice ("a reader you helped last time", "Lyra respects your calls now"): a player who always took the other option, or lost the challenge, never earned it. Gate such lines on state instead (`performance(track) >= 60`, `rel(lyra) >= 20`).

**Random picks are independent.** A `{~…}` in the text and a `{~…}` in a `say:` are chosen separately, so a say must not refer to a detail only one text alternative mentions (the bees, the red scarf). Write says that fit every alternative.

Don't build a repeatable on a one-time surprise (a secret door, a confession). Those are milestones, not pool events. The premise should be a *situation that recurs*: the queue at the refectory, the draft in the observatory, the lecturer's habit.

## Character pools (people come by two tracks)

An event with a fixed `actor: <npc>` and no `place:`, `track:`, `plan:` or `slot:` is that character's own card. The director draws it from the shared pools *and* from the character's own track: when you visit where their schedule puts them, at lunch, and when they come to find you (their monthly roll grows with **warmth**: contact the player chose to warm to). See `docs/grimoire-script.md` §5 and design §5.5.

- **Give every character a ladder from `rel 0`**: at least two repeatable personal events (`repeat: 4–6`) open at `rel(npc) > -10` or lower, then milestones at 10, 20, 40… A character whose events all start at `rel >= 10` stalls after the intro, because there is nothing for them to bring.
- **One option should warm to them** (`rel` or `spark` up, at a cost) and one should not; the player's pick decides whether they come back more often.
- A rival's ladder can start negative (`rel(lyra) > -24`): contact with a rival counts as engagement whichever way it goes.
- **Fixtures** (`seeks: rarely`: professors, staff, shopkeepers) need less: an introduction at their `place:` (or none, if a course or job `lead:` introduces them), two or three repeatable cards from `rel 0`, and one milestone at about `rel 25–30` (a spell they teach, a key, a cup on the hook). No romance.

## What a source's pool should cover

- **Places (3 each):**
  - one quiet or solitary scene (study, rest, a small discovery);
  - one social or ambient scene (other students, staff, a `present(place)` cast);
  - one with a small risk or temptation (a challenge, a chance, a rule to bend).
  - At romantic spots (lakeshore, boathouse, orchard) one event may cast `date: any where romanceable(date) and rel(date) >= 20` and offer `spark date +small` against a cost.
- **Course levels (level I: 3, levels II and III: 2 each):**
  - Mornings in class, at the right level: first principles at I, real technique at II, dangerous or original work at III.
  - Options trade effort for `study <track> +small` or skill XP (`<skill> +small`) against mood, health or mana.
  - Use the course's `level_names` and `teaches` from `content/world/tracks.grim`.
  - The professor, if named, comes from the brief.
- **Clubs and jobs (3 repeatable each, plus 1 milestone):**
  - Practice and shifts, with good and bad outcomes moving `perform <track> ±tier`. Jobs may pay a little (`gold +tiny`) on top of the per-visit pay. Use `rank: 1` for events any member can get, `rank: 2` or `3` for officer- or senior-level situations.
  - Plus one `class: milestone` event at `rank: 2`, no `repeat`: the moment the role changes (first time running practice, first keys to the stockroom).
- **Break plans (4 each):** `plan: castle | home | work | internship`. Use mornings of the break: the castle half-empty, home and family (the player's home is in the brief: `home_cottage`, `home_fields`, `home_market`), a seasonal job, a host's lab.
- **Thesis (3):** `track: thesis`, effects `progress thesis ±tier`. Use the thesis lab, the advisor and late nights.
- **Internships (2 each):** `track: intern_<host>`. Use the host's place from `tracks.grim`, the work, a colleague, a mistake.
- **Hidden-course hints (1 each for artifice, starcalling, hollow_studies):**
  - A `place:` event at that course's place, gated with `when: not enrolled(<track>) and not passed(<track>, 1)`.
  - It points the player at the prerequisite (read `prereq:` in `tracks.grim`).
  - It is still repeatable, but rare (`weight: 6`, `repeat: 8`).

## Ids, files, canon

- **One file per group:** `content/events/pools/<group>.grim`. Run `node tools/grim.js i18n zh-CN` to create `locales/zh-CN/events/pools/<group>.lang`. Don't edit any other file, except your own soft-lore file if you truly need one (below).
- **Ids:** `<place>_<slug>` for places (`courtyard_fountain_wish`), `<course prefix>_<slug>` for courses (`evo_`, `astro_`, `alch_`, `illu_`, `beast_`, `umbral_`), `<track>_<slug>` for clubs and jobs, `break_<plan>_<slug>` for plans, `thesis_<slug>`, `intern_<host>_<slug>`. Check that an id is free first: `node tools/grim.js ids event | grep <slug>`.
- **No new proper nouns** unless you must. Use unnamed people ("the cook", "a second-year from Rootward") and named figures that already exist in the worldbook (`node tools/grim.js query lore …`, `content/world/lore/`). A new name needs a soft `@lore` entry in your own file, `content/world/lore/soft/pools_<group>.grim`. Never edit `vocabulary.grim`, `GLOSSARY.md` or shared files; list new zh terms in your report instead.
- **Canon:** get a brief for every place or track you write for (`node tools/grim.js brief --place <id>` or `--track <id>`), and use what it says: who is there and when, the place's description, the track's description.

## Done means

```bash
node tools/grim.js fmt content/events/pools/<group>.grim
node tools/grim.js batch <group> --files content/events/pools/<group>.grim   # all validators pass (zh included)
node tools/grim.js report --gaps                                              # your sources are no longer short
```
