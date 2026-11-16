# Brief

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **personal**.

## Cast

### Old Maud (`maud`)

she/her · age 81 · staff · Faculty

*Groundskeeper and hedge-witch*

Keeps bees, chickens and a rather large secret garden. Gives advice you only understand two weeks later.

**Voice:** Folksy and sharp; calls everyone "dearie". Gives advice you only understand two weeks later; tells sad stories over tea as if they were recipes.

**Traits:** kind, eccentric, patient, warm · **Interests:** plants, bees, soup, animals, history

**Stats:** arcana 46, lore 58, alchemy 72, charm 30, vigor 20, guile 34, wealth 2

**Schedule:** Old Maud's Cottage (morning, noon, evening); The Greenhouses (afternoon)

**On breaks:** Old Maud's Cottage (morning, evening); The Greenhouses (afternoon)

**Relations:** Professor Aldric Thorne +20, Headmistress Isolde Marrow +25, Tobias Fennick +20

**Facts:**
- [surface] Groundskeeper and hedge-witch, keeper of bees, chickens and a goat called Bartholomew. (`maud.groundskeeper`)
- [personal] She was a student here sixty years ago, the spring the lake froze. (`maud.student`, known when `seen(maud_old_student) > 0`)
- [personal] Her soup cures colds, broken hearts and most curses. You're not allowed to write it down. (`maud.soup`, known when `seen(maud_recipe) > 0`)
- [personal] Behind the potting shed there is a door to a garden that only exists for people she shows it to. (`maud.garden`, known when `seen(garden_maud_secret) > 0`)
- [personal] She is eighty-one, and says she's allowed the occasional chill. (`maud.age`, known when `seen(maud_ill) > 0`)
- [personal] In her first winter as groundskeeper she raised a hatchling spider called Tuppence in the potting shed. Tuppence is the Spinner of the Hush now. (`maud.tuppence`, known when `seen(maud_tuppence) > 0 or seen(ww_cocooned) > 0`)
- [personal] The little bees carved on the Whisperwood's birches are hers, from when she used to go down to the Hush to visit Tuppence. Her knees won't take it now. (`maud.blazes`, known when `seen(ww_mastery_map) > 0`)

### Professor Aldric Thorne (`thorne`)

he/him · age 68 · professor · Faculty

*Master of Arcana*

Severe, exacting, allergic to flattery. Rumoured to have once out-dueled a storm.

**Voice:** Terse, precise, allergic to flattery. "Hm." is a full sentence. Praise arrives disguised as criticism, and very rarely.

**Traits:** severe, exacting, dry, warm · **Interests:** duelling, roses, teaching, chess

**Stats:** arcana 88, lore 74, alchemy 30, charm 22, vigor 40, guile 36, wealth 4

**Schedule:** The Lecture Tower (morning, afternoon); The Great Hall (noon); The Library (evening, 50% of days)

**On breaks:** The Library (afternoon, evening)

**Relations:** Headmistress Isolde Marrow +30, Old Maud +20

**Facts:**
- [surface] Rumoured to have once out-duelled a storm. (`thorne.storm`)
- [personal] He lost to the storm, badly. Losing well, he says, is the only thing worth teaching. (`thorne.lost`, known when `seen(thorne_storm_story) > 0`)
- [personal] A flamboyant old wizard in purple has wanted a rematch with him for forty years. (`thorne.rival`, known when `seen(thorne_old_rival) > 0`)
- [personal] He writes very few letters of recommendation, and the Conclave reads every one. (`thorne.letters`, known when `rel(thorne) >= 18`)
- [personal] "You're better than this" is, from him, not a compliment. He says so himself: it's an accusation. (`thorne.accusation`, known when `seen(thorne_disappointed) > 0`)

### Headmistress Isolde Marrow (`isolde`)

she/her · age 57 · headmistress · Faculty

*Headmistress of Lumenhold*

Tall, pale and impossibly calm. She remembers every student's name — and every student's mistakes.

**Voice:** Pleasant, unhurried, every word placed like a chess piece. Never raises her voice; never needs to. A short, delighted laugh when surprised.

**Traits:** calm, watchful, formidable, perceptive · **Interests:** chess, history, justice

**Stats:** arcana 84, lore 90, alchemy 50, charm 60, vigor 30, guile 70, wealth 4

**Schedule:** The Headmistress's Tower (morning, afternoon, evening); The Great Hall (noon)

**On breaks:** The Headmistress's Tower (afternoon, evening)

**Relations:** Professor Aldric Thorne +30, Old Maud +25

**Facts:**
- [surface] She remembers every student's name, and every student's mistakes. (`isolde.names`)
- [personal] She plays tower chess by her window and laughs, short and delighted, when she loses. (`isolde.chess`, known when `seen(isolde_chess) > 0`)
- [personal] She asks students what they think is just, and sometimes she listens. (`isolde.mercy`, known when `seen(isolde_judgement) > 0`)
- [personal] She knows the name Absalom Vrell: expelled long before her time, and still in the ledger, crossed out. (`isolde.vrell`, known when `seen(item_grimoire_isolde) > 0`)
- [personal] She asks how your term is going, and then how it is really going, and waits for the second answer. (`isolde.really`, known when `seen(headmistress_tower_tea) > 0`)

## Already written here (46)

- `align_maud_way_back` Weeding, Dearie (routine)
- `hs_maud_locks` Maud Has Seen Ice Before (story)
- `hs_wardens_notice` The Headmistress Takes Note (story)
- `hs_key_breakfast` Something of Mine (story)
- `hs_isolde_summons` The Headmistress Knows (story)
- `hs_aftermath_lost` The Headmistress Closed It (story)
- `forbidden_section_3` Caught (story)
- `garden_maud_secret` The Secret Garden (routine)
- `thorne_old_rival` An Old Rival (routine)
- `thorne_roses` The Professor's Roses (routine)
- `thorne_shaking_hands` Thorne's Hands (routine)
- `maud_goat` Bartholomew in the Library (routine)
- `maud_recipe` Maud's Soup (routine)
- `maud_old_wand` A Wand From Sixty Years Ago (story)
- `isolde_chess` A Game of Tower Chess (routine)
- `isolde_portrait` The Young Headmistress (routine)
- `isolde_judgement` A Question of Mercy (routine)
- `y3_maud_seeds` Seeds for Later (windfall)
- `y3_speech` The Graduation Speech (story)
- `wa_tower_light` A Light in the Tower (story)
- `wa_lake_word` Walk Elsewhere (story)
- `wa_isolde_list` The List (story)
- `wa_thorne_note` By Hand, Not by Owl (story)
- `wa_maud_lantern` For Walking Near Water (story)
- `hs_aftermath_fled` The Door Left Ajar (story)
- `know_isolde_chess` Called to the Tower (routine)
- `heard_maud_thorne` Maud on Thorne (routine)
- `hint_silver_honey` Bread and Silver (routine)
- `thorne_intro` The First Question (routine)
- `thorne_office_hours` Office Hours (routine)
- `thorne_storm_story` The Storm Duel (routine)
- `thorne_recommendation` A Letter of Recommendation (routine)
- `thorne_disappointed` A Word in Private (routine)
- `maud_chickens` The Great Chicken Escape (routine)
- `maud_honey` Honey for a Cold (routine)
- `maud_old_student` Maud Was a Student Once (story)
- `maud_bees` The Silver Bees (routine)
- `maud_tea_tells` Over Many Cups of Tea (story)
- `maud_ill` Maud Is Unwell (routine)
- `isolde_intro` She Knows Your Name (windfall)
- … and 6 more (`grim query event 'actor == "maud"'`)

## Lore

- **Professor Marisol** (`professors`, soft): Professor Marisol teaches Tidecalling and keeps the lake calm on exam days. Professor Vey teaches Illusion and grades on whether you fooled her. Professor Brask teaches Beastcraft and is kinder to animals than to students.
- **Wardens** (`wardens`, soft): The headmistress keeps a quiet circle sworn to the founders' seal. When the seal grows thin she recruits students she trusts and gives them silver ward-rings.
- **the old hall** (`old_hall`, soft): The valley's shut manor behind its wall at the moor's edge. The family who built it kept the valley's books, the ones that matter, until they sold up and left in a bad year nobody will date; an old caretaker stayed. This year a land agent from the capital bought it and works at the old family's desk.

## Style examples

```grim
# content/events/expansion_faculty.grim:8
@event thorne_old_rival
title: An Old Rival
class: routine
tone: tense
trigger: social
actor: thorne
when: rel(thorne) >= 9 and year >= 2
weight: 12
art: duel
tags: rival study
scene: Two elderly mages facing each other across a dueling ring at dusk, one stern and grey, one flamboyant in purple, a nervous student holding a towel at the side.
text: A flamboyant old wizard in purple has arrived to settle "a forty-year-old matter" with Professor Thorne. A formal duel needs a second. Thorne looks around the courtyard and, to everyone's astonishment, points at you.
> left: Stand as his second
  mood -tiny
  rel thorne +medium
  renown +small
  arcana +tiny
  say: The duel lasts four seconds, the longest of your life. Thorne wins. Then both old men sit on the grass and laugh until they wheeze. You've never seen him laugh. Neither has anyone else.
> right: Politely decline
  rel thorne -tiny
  say: "Hm," says Thorne, and asks the caretaker instead. He wins anyway. He does not mention it again, which is somehow worse.
```

```grim
# content/events/expansion_faculty.grim:30
@event thorne_roses
time: morning
title: The Professor's Roses
class: routine
tone: light
trigger: social
actor: thorne
when: rel(thorne) >= 6 and month >= 7 and month <= 10 and met(maud)
weight: 10
art: flower
tags: nature
scene: A severe old professor kneeling in a hidden rose garden at dawn, sleeves rolled up, murmuring encouragement to a single struggling rosebush.
text: At dawn, behind the observatory, you find Professor Thorne on his knees in a tiny walled rose garden, murmuring encouragement to a sickly bush. He sees you. Neither of you breathes.
> left: Back away and never speak of it
  rel thorne +medium
  say: You leave. The next day in class he calls on you for the hardest question — and then, very quietly, gives you full marks for a so-so answer.
> right: Offer to help with the sick bush
  challenge brew apprentice+:
    win:
      rel thorne +large
      alchemy +small
      say: You know the blight; Maud taught you. Within a month the bush is covered in red roses. Thorne leaves one, without comment, on your desk.
    lose:
      rel thorne +small
      say: Your remedy does nothing. But Thorne lets you kneel beside him for an hour, saying nothing, which you suspect is a great honour.
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
