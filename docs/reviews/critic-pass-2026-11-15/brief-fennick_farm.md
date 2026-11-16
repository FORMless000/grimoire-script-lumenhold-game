# Brief

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **personal**.

## Place: The Fennick Farm (`fennick_farm`)

countryside · open noon, afternoon, evening

Up on the upland side, past the tarn, outside the two villages: turnips, tomatoes, a mother who writes the weather first and love last, and Tobias in his oldest boots.

## Already written here (5)

- `fennick_weather_first` Weather First (routine)
- `fennick_mandrake_bed` Gerald's Relations (routine)
- `fennick_good_boots` A Man in Good Boots (routine)
- `fennick_top_field` Outside the Luck (routine)
- `fennick_farm_quiet_hour` Turnips and Tomatoes (routine)

## Lore

- **Fennick** (`fennick_farm`, soft): The Fennick farm grows turnips, tomatoes and stubborn children. Tobias's mother runs it alone at harvest, writes weather first and love last, and expects him home after graduation; one year blight nearly ruined them. Tobias studies on an agricultural scholarship whose board reviews his marks in person. The farm lies on the upland side of the valley, outside both villages, past the tarn; a drystone wall at its top field marks where the villages' land begins. Behind the farmhouse is a walled bed of mandrakes, Gerald's relations, each in a hat Mrs Fennick knits in winter. This year a man from the capital has been buying upland farms.

## Style examples

```grim
# content/events/maps/countryside_peers.grim:16
@event fennick_weather_first
title: Weather First
pool: fennick_farm_tobias
when: rel(tobias) > -10
repeat: 3
tone: warm
art: leaf
scene: A low stone farmhouse kitchen with a range and a scrubbed table, a small sturdy woman pouring tea, a big gentle young man ducking under the beams, a ladder at the open door.
text: {&Mrs Fennick, small and brown with forearms like a blacksmith's, greets you with the weather. The wind's gone round west, there's rain by the week's end, and the barley's thinking about it. Then she puts the kettle on and looks at you both. "Well," she says. "There's the roof wants doing, or there's the tea."|Mrs Fennick again, and the weather again: {season == "winter": a frost coming, she can smell it, and the hens know|thunder by evening, and the cows know}. She sets out three cups without asking. "Roof's still wanting," she says, "if you've the arms for it. Or sit."|The kettle's on before you're through the gate. "Wind's in the east," Mrs Fennick says, "and you're thinner," which from her is a whole letter. "Roof," she says, "or tea."}
> left: Help Tobias with the roof
  vigor +small
  health -tiny
  say: {&You pass slates up the ladder for an afternoon while Tobias sings to them, which he says helps them sit. Your shoulders burn. Mrs Fennick calls the weather up at you every half hour, and she's right every time.|Up the ladder. Tobias fixes slates and tells you a long story about a goat that ended up on this very roof. Your hands are scraped raw by the end, and the story still isn't over.|You patch the corner where the wind got under the slates, until dusk and until your arms give out. Mrs Fennick stands in the yard with her hands on her hips and says, "That'll keep the weather out," which is the highest thing she says about anything.}
> right: Sit and have the tea
  mood +small
  health +tiny
  say: {&Strong tea, seed cake and Mrs Fennick's opinions of the weather for an hour. At the door, as you go, she takes your hand and says, quite briskly, that she's glad Tobias has you. Tobias goes red to the ears and studies the hens.|Tea, and a slab of bread and dripping, and the story of the winter Tobias tried to keep a lamb in his bed. He hides his face in his hands. His mother laughs from the belly, exactly like him.|Tea, and the last of the seed cake, which she has plainly saved. She asks about the castle and listens to every word, and at the end says, "Rain tomorrow," and pats your hand twice.}
```

```grim
# content/events/maps/countryside_peers.grim:50
@event fennick_good_boots
title: A Man in Good Boots
pool: fennick_farm_tobias
tone: tense
art: scroll
scene: A farm gate on a windy upland, a smartly dressed man from the city with a leather folder, a small woman with her arms folded on the doorstep, a big young man standing very still.
text: There's a man at the farm gate in good city boots, with a leather folder and a smile he's practised. He's from the capital, he says, and buying upland farms: a fair price, this year only. "Bad years come," he tells Mrs Fennick pleasantly, "and good years don't, up here. You'd be wise." She doesn't move from her step. Tobias has gone very quiet.
> left: Tell him to clear off
  rel tobias +small
  mood -tiny
  flag fennick_agent_refused
  say: "She said no," you say, though she hasn't said anything. The man looks at you, and writes something in the folder, and smiles. "I'll remember you," he says, and goes, and you feel his look on your back all down the lane. Mrs Fennick nods once. Tobias lets out a breath.
> right: Ask who he's buying for
  challenge appeal adept- unlikely:
    win:
      lore +small
      flag fennick_agent_card
      say: You get him talking about the company he buys for, and the farms he's bought, all on the upland side, all this year. He gives you his card before he realises he's said too much: an office on the capital's uptown side. Mrs Fennick takes the card off you and puts it on the fire.
    lose:
      mood -tiny
      say: He smiles and says his principals prefer discretion, and asks your name instead, which you don't give. He tips his hat to Mrs Fennick and goes. Neither Fennick will talk about it at supper, and the silence sits heavy on the table.
```

```grim
# content/events/maps/countryside_peers.grim:72
@event fennick_top_field
title: Outside the Luck
pool: fennick_farm_tobias
when: rel(tobias) >= 12
tone: eerie
art: leaf
scene: A high field divided by an old drystone wall, thick golden barley on the far side, thin patchy barley on the near side, a big young man and a student standing at the wall.
text: Tobias walks you up to the top field, where the farm meets the valley's land at an old drystone wall. On the far side the barley stands thick and gold. On the Fennick side it's thin, and patchy, and honest. "Seven good years down there," Tobias says. "Every year. Never up here." He puts his big hand flat on the wall. "Ma says the valley's luck is the valley's business."
> left: Help him clear the stones
  vigor +small
  health -tiny
  say: You pick stones out of the thin side of the wall until your back aches and the sun goes down. It's slow, plain, endless work, and Tobias hums the whole time. "Our luck's this," he says, tipping a basket. "Stones. I don't mind it. It's ours."
> right: Ask what he thinks it is
  lore +tiny
  mood -tiny
  say: He thinks about it a long time, which is how he thinks about everything. "I think they pay for it," he says at last. "I don't know what with. Nobody down there ever says." The wind goes over the barley on the far side, and none of it bends the way the near side does. You walk back uneasy.

# ---------------- Nessa: the Almanac Printer's ----------------
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
