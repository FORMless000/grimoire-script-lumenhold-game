# Brief

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **personal**.

## Cast

### Tamsin Reed (`tamsin`)

they/them · age 19 · outsider · none

*Illusionist at Thornwick, your pen pal*

A Thornwick illusionist who answered a letter to "a Lumenhold student chosen at random" and kept writing. Insufferable, by their own account, and the best correspondent you have.

**Voice:** Writes the way they talk: fast, sly, all asides and crossings-out. Signs every letter with a new insult. Means every kind word, and hides them in postscripts.

**Traits:** funny, curious, ambitious, loyal · **Interests:** painting, gossip, theatre, cards

**Stats:** arcana 26, lore 20, alchemy 10, charm 30, vigor 12, guile 28, wealth 2

**On breaks:** away

**Facts:**
- [surface] An illusion student at Thornwick, in your year, who writes to you. (`tamsin.thornwick`)
- [personal] Their grandmother runs a travelling theatre; they learned illusion painting her backdrops. (`tamsin.theatre`, known when `rel(tamsin) >= 8`)
- [personal] Their roommate bet them a pie that you'd never write back. They won the pie. (`tamsin.pie`, known when `seen(tamsin_second_letter) > 0`)
- [personal] They fill their letters with sketches of Thornwick's professors in the margins. Their illusion professor is usually a goat. (`tamsin.sketches`, known when `seen(tamsin_letter_gossip) > 0`)
- [personal] They once failed their illusion examination, the one thing they were good at, in the same term their grandmother's theatre was sold. (`tamsin.failed`, known when `seen(tamsin_letter_trouble) > 0`)

## Already written here (7)

- `tamsin_letter_gossip` News From Thornwick (routine)
- `tamsin_letter_questions` Twenty Questions (routine)
- `tamsin_letter_trouble` A Short Letter (routine)
- `tamsin_letter_asks_secret` A Small Favour (story)
- `tamsin_letter_offers_secret` Their Turn (story)
- `tamsin_confession` What I Was Sent to Do (milestone)
- `tamsin_letter_after` After Graduation (routine)

## Lore

- **Tamsin Reed** (`tamsin_reed`, soft): A Thornwick illusionist in the player's year, a pen pal since their first term. Raised in a travelling theatre; sly in letters, loyal in person. Thornwick set them to spy on Lumenhold through their letters, and they gave it up for the friendship.

## Style examples

```grim
# content/events/chain_thornwick.grim:32
@event tamsin_letter_gossip
title: News From Thornwick
actor: tamsin
trigger: letter
class: routine
tone: light
repeat: 6
weight: 12
art: letter
tags: social letter
scene: A letter with a green seal open on a desk, its margins full of tiny unflattering sketches of Thornwick professors.
text: {Tamsin has written again, six pages of Thornwick gossip with sketches of the professors in the margins.|Another letter from Tamsin, signed "your rival, nemesis and only friend west of the hills".|Tamsin's letter is mostly a drawing of their illusion professor as a goat.} {Their head of house has banned whistling.|Someone at Thornwick set the library on fire, a little.|They want to know if Lumenhold's food is really as bad as everyone says.} Answering properly would take an evening.
> left: Write back at length
  rel tamsin +small
  mood -tiny
  say: {You write till the candle gutters, with sketches of your own professors. Tamsin's reply calls your drawing of Thorne "libellous and correct".|Five pages back, with the castle's gossip and your worst week. They answer the worst week first.|You answer the goat with your own worst professor as a hen, and four pages on the refectory food. Tamsin replies that you've undersold the food.}
> right: A few lines and a sketch
  rel tamsin +tiny
  mood +tiny
  say: {A short note and a drawing of a gargoyle. Tamsin writes back that it's "the most Lumenhold thing ever sent through the post".|Three lines. Tamsin replies with three pages, offended and delighted.|A few lines about the food and a goat of your own in the margin. Tamsin replies with a whole menagerie.}
```

```grim
# content/events/chain_thornwick.grim:53
@event tamsin_letter_questions
title: Twenty Questions
actor: tamsin
trigger: letter
class: routine
tone: light
repeat: 4
weight: 10
art: letter
tags: social letter
scene: A letter numbered down the margin from one to twenty, each line a question, a student chewing a quill over the answers.
text: {Tamsin's letter is a numbered list of twenty questions about life at Lumenhold, from "Is the lake haunted?" to "What do you eat for breakfast?"|Another list of questions. Number seven is "Who is the most annoying person at your school?"|Questions again. "Be honest," says number one. "Number twenty can be a lie."} {Number twelve asks about your exams.|Number fifteen asks about the lake.|Number three asks about the food.} Number nineteen just says "Are you happy?"
> left: Answer every one honestly
  rel tamsin +small
  lore +tiny
  mood -tiny
  say: {Twenty honest answers, even number nineteen. It's harder than it looks. Their reply begins, "Thank you for nineteen."|You answer the lot. Writing it down, you learn a few things about yourself.|You answer all twenty honestly, even number three, which is about the food and unkind. Number twenty you leave as a lie, as permitted.}
> right: Make the answers outrageous
  charm +tiny
  rel tamsin +tiny
  say: {The lake is haunted by a choir of geese. Breakfast is boiled bricks. Tamsin's reply is two pages of laughter and a request for "the true answers, eventually".|You invent a Lumenhold of dragons and duels before dawn. Tamsin believes none of it and asks for more.|Every answer is outrageous except number twenty, which is the true one. Tamsin works out which, and writes back only "I knew it."}
```

```grim
# content/events/chain_thornwick.grim:75
@event tamsin_letter_trouble
title: A Short Letter
actor: tamsin
trigger: letter
class: routine
tone: tense
when: rel(tamsin) >= 4
weight: 12
art: letter
tags: social letter
scene: A single short page with a green seal, the handwriting cramped and unsteady, a blot where a sentence was crossed out hard.
text: Tamsin's letter is one page, which has never happened. They failed their illusion examination, the one thing they were good at, and their grandmother's theatre has been sold. There's a sentence crossed out so hard the nib went through the paper.
> left: Write back that night
  rel tamsin +medium
  mood -small
  health -tiny
  say: You write until two in the morning: the time you failed, what helped, a list of everything they're good at that isn't illusion. Their next letter is six pages again, and the first line is "You idiot, you made me cry in the refectory."
> right: Send them something instead
  gold -small
  rel tamsin +small
  say: You send a parcel: Mabel's best biscuits, a book of plays, a drawing of a gargoyle holding a sign that says "RETAKE". Tamsin writes back that the gargoyle is on their wall now, and that they passed.
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
