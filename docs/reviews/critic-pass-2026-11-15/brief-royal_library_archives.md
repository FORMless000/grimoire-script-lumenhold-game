# Brief

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **personal**.

## Place: The Royal Library (`royal_library_archives`)

capital · internship · open morning, noon, afternoon

Miles of stacks beneath the capital, where the oldest records of the realm are kept in temperature-controlled silence. Upstairs, a reading room anyone may use, if they whisper.

## Already written here (1)

- `capital_library_quiet_hour` The Reading Room (routine)

## Lore

- **Royal Library** (`capital_institutions`, soft): Beyond the academy lie the Royal Library's archives, the Guild of Alchemists' works, the Crown's Office of Unseen Affairs, which has no sign and no address, and the Travelling Circus of Wonders, which recruits graduates who want to wander.
- **Spire Library** (`spire_library`, soft): The academy's research library at the top of the tallest tower, where theses of distinction are shelved in a section students whisper about.
- **Footnote** (`footnote`, soft): The library cat, who sleeps on the reference desk and decides which books are worth reading.

## Style examples

```grim
# content/events/maps/placeholders.grim:12
@event capital_library_quiet_hour
title: The Reading Room
pool: maps_placeholder
place: royal_library_archives
art: book
scene: A vast reading room under a glass dome, green lamps on long tables, a few readers bent over their books in the hush.
text: Upstairs from the archives, the Royal Library keeps a reading room for anyone who can whisper. The lamps are green, the chairs are hard and a librarian watches the door like a cat at a mousehole.
> left: Read a while
  lore +tiny
  mood -tiny
  say: {~An hour with a book you couldn't get at Lumenhold. Your neck aches; your head is full.|You read until the librarian's look becomes a cough. It was worth it.}
> right: Just look at the dome
  mood +tiny
  say: {~You stand under the dome until your neck aches, then go out into the noise again.|Light falls through the glass in long dusty bars. You leave without reading a word.}
```

```grim
# content/events/calendar_2b.grim:526
@event intern_assessment
title: The Supervisor's Report
trigger: queued
priority: 90
class: milestone
tone: tense
art: paper
tags: study job
scene: A supervisor's desk on the last day of a placement, a written report face down under a pen.
# A strong placement (80+) is remembered in the final year: the host writes with a post (careers.grim, 2026-10-25).
on_show:
  if performance(internship) >= 80:
    if member(intern_royal_library):
      flag return_royal_library
    elif member(intern_conclave):
      flag return_conclave
    elif member(intern_alchemists):
      flag return_guild
    elif member(intern_expedition):
      flag return_observatory
    elif member(intern_field_station):
      flag return_field_station
    elif member(intern_thornwick):
      flag return_thornwick
    else:
      flag return_unseen
text: Your last day at {member(intern_royal_library): the Royal Library Archives|{member(intern_conclave): the Conclave Laboratory|{member(intern_alchemists): the Guild of Alchemists' Works|{member(intern_expedition): the Observatory Expedition|{member(intern_field_station): the Beastcraft Field Station|{member(intern_thornwick): the Thornwick Exchange|the office with no name}}}}}}. Your supervisor turns the report over. {performance(internship) >= 80: "Exceptional," it says at the top, underlined, and the rest is better.|{performance(internship) >= 60: "Reliable and capable." A few notes in the margin, all of them fair.|{performance(internship) >= 40: "Adequate." The word sits on the page by itself.|"Did not meet expectations." Your supervisor doesn't quite look at you.}}}
> left: Ask for a letter of reference
  if performance(internship) >= 60:
    renown +small
    say: The letter comes a week later, sealed, and the registrar files a copy with a look you haven't had from her before.
  else:
    mood -small
    say: The letter comes a month later: two lines, your name spelled wrong in one of them. You put it at the bottom of a drawer.
  if performance(internship) >= 80:
    queue intern_asked_back
  else:
    leave internship
> right: Ask what you could have done better
  mood -tiny
  if member(intern_royal_library) or member(intern_expedition):
    lore +small
  elif member(intern_conclave):
    arcana +small
  elif member(intern_alchemists):
    alchemy +small
  elif member(intern_field_station):
    lore +small
  elif member(intern_thornwick):
    charm +small
  else:
    guile +small
  say: Your supervisor talks for twenty minutes without notes. Some of it stings. You write all of it down on the coach home, and read it twice.
  if performance(internship) >= 80:
    queue intern_asked_back
  else:
    leave internship

# An internship lasts one summer (M16). The host asks you back only after a strong one.
```

```grim
# content/events/calendar_2b.grim:585
@event intern_asked_back
title: Asked Back
trigger: queued
when: year <= 3
class: milestone
tone: warm
art: letter
tags: study job
scene: A letter on good paper with a familiar seal, the words "next summer" underlined once, neatly.
text: A letter from {member(intern_royal_library): the Royal Library Archives|{member(intern_conclave): the Conclave Laboratory|{member(intern_alchemists): the Guild of Alchemists' Works|{member(intern_expedition): the Observatory Expedition|{member(intern_field_station): the Beastcraft Field Station|{member(intern_thornwick): the Thornwick Exchange|the office with no name}}}}}}. They were pleased with your summer, and the post is yours again next summer if you want it.
> left: Write back yes
  renown +tiny
  say: {~You write back the same evening. Next summer is spoken for, and you find you're glad.|"Yes," you write, and then three more lines to make it sound less eager.}
> right: Thank them, and decline
  leave internship
  mood +tiny
  say: {~You thank them warmly and say no. Next summer is yours to spend, or to apply for something new.|A polite no. You keep the letter anyway; it's good to be asked.}

# ---------------- Thesis (design §7.6) ----------------
```

## Rules

Validators check the first group automatically; the critic (a separate pass, without the author's reasoning) checks the rest, raising an issue only where it can name a concrete fix. A batch is accepted when everything passes.

**Automatic** (`grim batch`)
- `grim fmt --check`, `grim lint` with 0 errors (references, vocabularies, ages, canon lint), `grim balance --quick` with 0 invariant failures.
- New events appear in simulation (not in "never seen") unless the report says they're deliberately rare.
- `i18n zh-CN` complete for the batch, tokens intact.

**Critic**
- **Canon:** names, places, facts and history match the worldbook; nothing contradicts hard lore (`content/world/lore/hard/`); characters are where their `schedule:` puts them, or there's a reason they aren't; a new proper noun comes with a soft `@lore` entry.
- **Voice:** each speaker sounds like their `voice:` line (`style.md`) and acts on their traits and facts.
- **Tone and safety** (`style.md`): warm, witty, slightly melancholy; humour from specifics, never winking at the reader; no gore, nothing explicit; every character an adult, romance only between adults; no real-world brands, modern slang or real month names.
- **Class rules** (`classes.md`): `routine` has a real trade-off, neither option obviously better; `incident` offers agency (mitigate or accept); `windfall` is small and funny; `milestone` is earned and given room to breathe; `story` is never jokey at the climax.
- **Plot safety:** only hard-canon story events `find` a key clue or `advance` an arc clock.
- **Choices** (`costs.md`): no option is obviously best; every cost is one the `say:` shows (body → health, spirits → mood, purchases → crowns, skipped work → `study`/`perform`/`progress`, a person let down → `rel`, a moral side → alignment); every option has its own specific `say:`, never "You gain 5 mood"; prose never mentions numbers or mechanics; labels under about 36 characters, imperative or first person.
- **Alignment** (`costs.md`): a choice with moral weight moves `alignment`; ordinary choices don't; no counter is used as plot progress (plot gates read `clock(arc)` and `clues(arc)`).
- **Conflict and climax** (plot and arc cards, and any card where characters clash; `style.md`): the confrontation happens on the page, out loud, each side saying something only they would say (a clash reported afterwards or left to a hint is a fix to raise); the opposition acts, each return bolder than the last; every fight sits beside a way that isn't a fight; a loss costs something real and leaves a way back. In a climax: one card names the companions once, each planted clue or item pays off (and the beat still happens when it was missed), and the reward shows at once.
- **Checks** (`checks.md`): the difficulty is what you're actually up against (the opponent or the obstacle), not who is on the card or when it shows; no reason counted twice (a strong foe written as `slim`, a coin toss as a high rung); a gamble is on `luck`; grandmaster+ only on story or milestone cards, with `partial:` and a route without the check; a loss that ends the run has `partial:` or `likely`+; the kind fits the action and the skill the obstacle; `using` only when it differs from the kind's default; `exam` only in a course; pure luck is `chance <word>`, and a roll a skill or relationship should move isn't a bare `chance`.
- **Spell options** (`up[spell]`): the option does what the spell's `desc` says (`content/world/spells.grim`) and is a clean way through the scene; the text and the other options never assume the player knows the spell, so without it the card reads as an ordinary problem. Mana (and a forbidden spell's alignment) is taken automatically; prose never names it.
- **Repeats** (pool events with `repeat:`; `pools.md`), seen several times in a run:
  - An "again" line keys on `seen(<own id>) > 1`, not on a counter other cards move; no variant assumes how an earlier showing ended, and every variant of a `say:` shows its option's cost.
  - The variation lines (`{a|b|c}`, `{&…}`, `{~…}`, `{season=…}`, `{final_year: …|…}`) make each showing read differently, and the fourth showing is still welcome: the joke doesn't wear out, nothing hinges on a one-time surprise.
  - Cast roles are re-filled each showing: a sequence that implies the same companion as last time is a bug. Classmate roles are `tagged(<role>, student)`.
  - Sequences count showings, not choices: a sequence line describing a choice's payoff (readers you helped, respect you earned) is a bug unless gated on state.
  - Variation is linked (one mode, one count per card; the lint checks counts): variant *k* of a `say:` fits variant *k* of the text, and a sequence's step *k* fits the *k*-th showing. A set that contradicts itself, or a payoff whose setup sits at a different position, is a bug.
- **Items** (design §9.3): an object the prose mentions that isn't an `@item` is never "used" or "got" as inventory. An item option is that item's moment in the scene: owning the thing pays off without being free (it still trades), at most one per card. Worn effects act only in fights; nothing on a card reads what you wear except `worn()` gates. No recipes or ingredients.
- **Continuity:**
  - What the text promises happens: money, an item, a payback or a later scene that a `say:` mentions is in the effects (`gold`, `give`, `queue … in N`).
  - A `say:` that reads a counter or flag comes before the statement that changes it, because its text is filled in at that point.
  - Time, weather and place agree with when the card can show: `slot:` or `{slot == …}`, `{season == …}`, `{off_campus: …}` for a break spent away (a night scene without `slot:`, snow outside winter, the castle on a break spent at home).
  - A callback to an earlier scene gates on `seen(<that card>) > 0`. A `learn` that another card can teach first gates on `not knows(<fact>)`. A thing found once doesn't go on glinting after it's found.
  - Numbers of years and ages agree with `content/world/timeline.grim` and the facts (how long the Ledger has run, how old a tree's ring is).
- **Gating:** `when`, `level:`, `rank:`, `place:` and `plan:` make sense together (a club-practice event isn't gated to a place the club doesn't use; a level-3 class doesn't read like a first lesson); `when` conditions are reachable; queued events are queued by something; flags read are set somewhere (`grim reach` proves it; lint fails on an unreachable event).
- **Wiring** (`pools.md`, "Where a card lives"): read a card with what its group gives it (`grim show <id>` prints the compiled card and where each property came from). A card joins its group and writes only what differs: the place's, track's or plan's `pool:`; a `@thread` for a storyline, from a template (`story`, `quest`, `scene`) when its shape is one of theirs; an `@appointment` for something on a schedule; a `@cond` for a recurring condition. A card that copies its group's lines, a storyline wired card by card where a template fits, or a schedule faked with a tricky `when` is a fix to raise.
- **Leads:** a hint the player has to follow up later (a card at a place, slot or track waiting on this card's flag) leaves a side-thread lead in the Clues panel; `grim leads` shows none missing.
- **Duplication:** no event repeats an existing one's premise, even in different words, and two events at the same place in a batch aren't the same scene twice. Checked with `retrieve related` on each new card (or a justified skip), its top hits differing in premise, options and punchline; `dupes`, `brief` and grep (`grim query event --grep <word>`) alone are not enough.
- **Length** (`style.md`): `text` under 400 characters, two to four sentences ending on the moment of choice; `say` under 300; labels under 36.


> How a choice trades (design §8.4; playtest 2, A3). Sizes: `presets.md`.

## The rule

- **No option is obviously best.** Options trade: they give different things, or one costs or risks something the other doesn't. A choice between two good things or two bad things beats an obvious one. On a `routine` card the lint fails one option at least as good as another on every value and better on one, with no risk on either side.
- **A free option is honest** when it gives up what the other offers (an evening of study instead of one with friends). Don't add a cost to make it "trade": the other option is its cost.
- **A cost is something the scene shows.** If the `say:` doesn't show the player paying it (tired legs, a spent crown, a friend's cool look, a missed lecture), it isn't a cost: drop it, pick the one the scene shows, or write the line that shows it. On a card with variants, every variant of the `say:` shows it. A cost the scene doesn't show is a defect, not a fix.
- **Each option stays within ±1.5 medium-equivalents** (the weights in `balance.grim`). Typical routine shape: a small gain against a tiny or small cost the scene shows, or two different gains.
- The lint reads alignment as a direction, not a gain: two options that move it differently are never one "better". A gamble (`chance`, a check, a penalty queued at odds) or an option that leads somewhere (a state, a flag, a queued card) is never "obviously best" either.

## What each value stands for

| Value | It is | Costs it when the scene shows | Gains it when |
|---|---|---|---|
| `health` | the body | exertion, cold, wet, injury, a fall, lost sleep, illness, a burn, a bite | rest, food, warmth, a healer, sleep |
| `mood` | spirits | embarrassment, guilt, worry, boredom, disappointment, homesickness, a row, bad news | fun, beauty, praise, kindness, a win, a good meal with friends |
| `mana` | the magic you can spend | casting or channelling, a ward that drinks from you, a spell gone wrong | rest after magic, a ley line, a potion; it refills monthly |
| `renown` | being talked about | public embarrassment, backing down where people watch, a scandal, being forgotten | a public feat, a byline, a performance, a famous friend; it fades monthly |
| `alignment` | Lumen ↔ Hollow | Hollow (`-`): cruelty, theft, cheating, lying for gain, exploiting someone, reaching for the Star | Lumen (`+`): honesty, protection, generosity at a real cost |
| `gold` (crowns) | your purse | what you buy, pay, lose or are fined (the prose names it) | wages, tips, winnings, a gift, a find |
| `arcana` `lore` `alchemy` `charm` `vigor` `guile` | skills (XP) | never a cost (rust is the engine's; the lint rejects a card that lowers one) | practice that matches the scene: spellcraft, study, brewing, persuasion, exertion and duelling, sneaking and noticing |

**Track and relationship costs** (often the honest ones):

| Statement | Use it when |
|---|---|
| `study <course> -tiny` / `study -tiny` | you skip a lecture, a revision night, a class's homework: that course's exam readiness drops (no course: every enrolled course) |
| `study <course> +tiny` / `study +tiny` | extra work beyond class: a card's study gain is `+tiny`. Preparation comes mostly from routine sources (each class month +3, +5 with a check won in class, the library's revision card +3), so exams stay predictable. A larger gain needs a matching price (a night, money, a favour); study costs elsewhere balance the gains. Never `grades` |
| `perform <track> -tiny` | you slack, leave early or annoy the boss at a club or job (`perform track` in the track's own cards) |
| `progress thesis -tiny` | the thesis waits while you do something else |
| `rel <npc> -tiny` / `spark <npc> -tiny` | you snub, disappoint, refuse or embarrass someone; a romantic moment goes flat (romance is `spark`, never `love`) |

## Alignment (conscience)

- A choice with moral weight moves `alignment`: cruel, greedy, dishonest, exploiting someone, or reaching for the Star's power → `-tiny`…`-medium` (Hollow); honest, protective or selfless at a real cost → `+tiny`…`+medium` (Lumen). Usually `tiny`/`small`.
- A tempting option (keep the purse, read the letter, cheat the game, take the shortcut someone pays for) puts `alignment -tiny`/`-small` on the tempting side; `alignment +tiny` on the honest side only when it costs something real. Ordinary prudence (going to bed, saying no to a party) has no moral weight.
- Events for players deep in either side gate on `alignment >= 30` / `<= -30` (±60 for rare ones).
- A spell with `alignment:` (Sleight, and every forbidden spell) takes it on each cast, automatically. Its `up[spell]` option adds none of its own unless the act is worse than the cast.
- Never use alignment, or any counter, as plot progress: plot gates read `clock(<arc>)` (the schedule) and `clues(<arc>)` (engagement).

## Before you finish an option

1. What does the player give up? If it's the other option, the option can be free.
2. Does the `say:` show the cost? If not, change the cost or the line.
3. Is there a moral side? Then alignment moves.
4. Does it skip study, work, practice or a person? Use `study`, `perform`, `progress` or `rel`, not a vague `mood -tiny`.
