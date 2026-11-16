# Brief

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **personal**.

## Place: Ashby Lane (`ashby_lane`)

capital · open morning, noon, afternoon, evening, night

A crooked lane in Port Calder where the houses lean together and everyone knows the Ashbys. Corvin doesn't talk about it. Now you know why, or will.

## Already written here (4)

- `ashby_the_chair` The Chair on the Step (routine)
- `ashby_coins_on_the_sill` Coins on the Sill (routine)
- `ashby_lost_ring` Like His Grandad (routine)
- `ashby_lane_quiet_hour` The Crooked Lane (routine)

## Lore

- **Ashby** (`ashby_family`, soft): Corvin's grandfather could find a lost thing in any house, taught Corvin to shuffle on rainy Sundays, and owned a genuinely lucky deck of cards that later sat in the confiscation vault. Corvin's brother turns up at the gates wanting money. Home, Corvin says, is not a good place. It is Ashby Lane in Port Calder, the crooked lane his family has lived in long enough to give it a name: his mother still takes in washing there, his grandfather's chair still stands on the step, and the lane knows Corvin, lends him nothing and would hide him from the watch without being asked.

## Style examples

```grim
# content/events/maps/capital_peers.grim:158
@event ashby_the_chair
title: The Chair on the Step
pool: ashby_lane_corvin
repeat: 3
slot: evening
tone: warm
art: cards
scene: A crooked harbour-town lane at dusk, washing strung between leaning houses, an old wooden chair on a worn doorstep and a young man in it shuffling cards.
text: {Halfway down Ashby Lane there's an old wooden chair on a doorstep, and Corvin is in it, shuffling. "My grandad's," he says. "Nobody's sat in it since. Nobody but me." Three neighbours call his name from three windows. None of them sounds pleased. All of them sound fond.|Corvin's in the chair again, dealing patience to nobody. "You found the lane twice," he says. "That's twice more than most." A basket comes down from a window on a string; he drops a coin in it without looking up.|The chair, the step, the cards. Tonight there's a stool beside the chair, hauled out from somewhere, and Corvin pats it. "Lane says you can sit," he says. "Don't let it go to your head."}
> left: Ask about the old man
  rel corvin +small
  mood -tiny
  say: {"He could find a lost thing in any house," Corvin says. "People still knock and ask me where they've put things. Me. As if it ran in the blood." "Does it?" you ask. "Sometimes," he says, and doesn't joke, and the quiet that follows is a sad one, until the lamps come on.|"He said a lost thing wants to be found," Corvin says. "You just stand where it'd look for you." He's quiet a while. You don't push, and the quiet goes sad and comfortable at once.|He tells you the old man's last find: Corvin, aged ten, on a roof, in the rain, though nobody had told him where to look. "Never said how," Corvin says. "Took it with him." You sit with that, sad and close, until the lamps.}
> right: Meet the neighbours
  charm +small
  mood -tiny
  say: {The neighbours come down to inspect you, and they're thorough about it. Corvin owes one of them a crown and another a cat; it's complicated. They tell you he was a terrible child. When the watch walks past, all three step in front of him without a word, and the watch walks on.|The neighbours have opinions about you now. One wants to know your prospects; one wants to sell you a hen. It's exhausting. As you go, the hen woman tells Corvin you'll do.|A neighbour brings out a plate of something fried and very hard to chew, and asks after your whole family while you chew it. You pass, wearily. "That's you on the lane, then," Corvin says, as if you'd been sworn in.}
```

```grim
# content/events/maps/placeholders.grim:426
@event ashby_lane_quiet_hour
title: The Crooked Lane
pool: maps_placeholder
place: ashby_lane
art: door
scene: A narrow crooked lane in an old harbour town, houses leaning together overhead, washing strung between the windows, a door with a scuffed step.
text: Ashby Lane is so narrow the houses lean on each other for company. Washing hangs across it. A woman on a step looks at your academy coat and says, "One of Corvin's?" as if Corvin collected people.
> left: Say you're a friend of his
  charm +tiny
  mood -tiny
  say: {~"Poor you," she says, and laughs, and then doesn't. "Tell him his grandad's chair's still here."|"A friend," she repeats. "That's new." She goes in before you can ask what she means.}
> right: Just walk through
  mood +tiny
  say: {~You walk the lane end to end. Two children follow you, then lose interest.|You walk on. A window above you shuts as you pass, firmly.}
```

```grim
# content/events/maps/capital_peers.grim:176
@event ashby_coins_on_the_sill
title: Coins on the Sill
pool: ashby_lane_corvin
when: rel(corvin) >= 12
slot: night
tone: warm
art: coin
scene: A dark harbour lane at night, a young man reaching up to leave a small stack of coins on the sill of a lit window, a student watching from the shadows.
text: Late, Corvin walks you to the end of the lane and stops under a lit window. Inside, a woman is folding someone else's washing. He reaches up, sets a little stack of coins on the sill, quiet as a cat, and steps back into the dark. "My mother," he says. "She doesn't ask where it comes from. I don't go in."
> left: Ask why he doesn't go in
  rel corvin +small
  mood -small
  say: For a long while he says nothing. "Because then she'd ask how I am," he says, "and I'd tell her, and she'd cry, and then I'd make a joke." He makes one now, about windowsills. It isn't funny. You walk back in a heavy silence, the best you've had with him.
> right: Add a coin of your own
  gold -small
  alignment +tiny
  rel corvin +tiny
  say: You set a coin of your own beside his. He looks at it, and at you, and for once has nothing at all to say. Upstairs the woman comes to the window, sees the sill, and stands very still. Corvin pulls you round the corner before she can look down.
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
