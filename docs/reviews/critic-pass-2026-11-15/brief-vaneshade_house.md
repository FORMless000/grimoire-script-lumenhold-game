# Brief

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **personal**.

## Place: Vaneshade House (`vaneshade_house`)

capital · open noon, afternoon, evening

Black stone on the Crescent, a black seal over the door, and a footman who looks at your boots first. Lyra lives here, in a manner of speaking.

## Already written here (5)

- `vaneshade_practice_room` The Room Upstairs (routine)
- `vaneshade_kitchen_toast` Nineteen Years of Toast (routine)
- `vaneshade_supper_alone` A Table for Twenty (routine)
- `vaneshade_portrait_gallery` The One Who Laughed (routine)
- `vaneshade_house_quiet_hour` The Black Seal (routine)

## Lore

- **Vaneshade** (`vaneshade`, soft): House Vaneshade is old pyromancer nobility. Its letters carry a black seal; its winter gala is an inspection disguised as a party; its duellists carry pale family wands and open every duel with the same flame flourish they have used for two hundred years. Vaneshades sleep exactly eight hours. Lady Vaneshade's highest praise is "Adequate"; she has a velvet chair reserved at her daughter's bouts, and it stays empty. Vaneshade House stands on the Crescent in the capital: black stone, a scorched practice room on the second floor, a long gallery of portraits in which every Vaneshade but one is unsmiling (the exception is Lyra's grandmother, who made Wildfire), and a kitchen run for thirty years by Mrs Callow, the cook.
- **Hollis** (`hollis_family`, soft): Bram's father was a prefect and head boy at Lumenhold; his portrait hangs in the corridor of head boys, and he stops in front of it on every visit. He has never stopped telling his son he will not amount to anything. Hollis House is a narrow, very correct house on the capital's uptown side, with a polished plate on the door, a piano that is played at noon, and, when she visits, Bram's older sister Hester, who is twenty-three, sharp-tongued, went to Thornwick against her father's wishes and is the only member of the family who isn't afraid of him.
- **the house on the Crescent** (`crescent_house`, soft): The tallest house on the Crescent belongs to a shipowner who bought his way up the hill from Port Calder's wharves. Every week he's in town he gives a ball, a garden ball in summer, to prove he belongs there; the old Crescent families come for his supper table and say what they like on the way home. Much of his fortune came up the hill by the bonded warehouses' side door, from the foreman's second set of figures.

## Style examples

```grim
# content/events/maps/capital_peers.grim:52
@event vaneshade_supper_alone
title: A Table for Twenty
pool: vaneshade_house_lyra
when: rel(lyra) >= 15
slot: evening
tone: warm
art: candle
scene: A long candlelit dining table set for twenty in a dark formal room, a single young woman in black sitting at the far end before one plate.
text: Lady Vaneshade is dining out, as she does every night of the season. Supper at Vaneshade House is served anyway: twenty chairs, eleven courses, one plate. Lyra sits at the end of it like a sentry. "You can stay," she says, "if you like. It's very good. It's always very good."
> left: Stay for all eleven courses
  rel lyra +small
  health +tiny
  mood -small
  say: Two footmen bring a chair to set beside hers, which has plainly never been done. Eleven courses, mostly in silence, and a long, stiff evening. By the pudding she's explaining the sauce, and her shoulders are down. At the door she says it was adequate, and then winces.
> right: Take her out for a pie
  gold -small
  mood +small
  rel lyra +small
  say: You buy two hot pies from a stall on the bridges and eat them leaning on the parapet. Lyra has never eaten anything standing in the street. She gets gravy on her glove and stares at it like a new spell. "Don't tell my mother," she says.
```

```grim
# content/events/maps/placeholders.grim:264
@event vaneshade_house_quiet_hour
title: The Black Seal
pool: maps_placeholder
place: vaneshade_house
art: crown
scene: A tall black-stone house on a curving uptown street, a black wax seal carved in stone over its door, a footman on the step.
text: The footman at Vaneshade House looks at your boots, then at your face, then at your boots again. Miss Vaneshade, he says, is at her practice and not receiving.
> left: Leave your name
  renown -tiny
  mood +tiny
  say: {~He takes your name on a silver tray as if it might stain it. Somewhere upstairs, a window opens.|You leave your name. The door shuts with the soft, expensive sound of a door that has shut on better people.}
> right: Walk on along the Crescent
  mood +tiny
  say: {~You walk the curve of the Crescent, all black stone and white steps, and feel underdressed in a pleasant, distant way.|You walk on. Behind you, someone in an upstairs window lets a curtain fall.}
```

```grim
# content/events/maps/capital_peers.grim:72
@event vaneshade_portrait_gallery
title: The One Who Laughed
pool: vaneshade_house_lyra
when: rel(lyra) >= 18
tone: warm
art: crown
scene: A long gallery of stern dark portraits of nobles in black, and one painting of a laughing old woman with a small flame dancing in her palm, a young woman standing before it.
text: The long gallery at Vaneshade House is two hundred years of black coats and unsmiling mouths. Lyra walks it fast, until the last portrait: an old woman in black, laughing, a little flame curled in her palm like a cat. Lyra stops. "My grandmother," she says. "She was never adequate at anything. She was wonderful."
> left: Ask what she was like
  rel lyra +small
  mood +tiny
  say: "She lit candles by telling them jokes," Lyra says. "Bad ones. Fire likes to be surprised, she said." She tells you three. They're terrible. {knows(lyra.wildfire): "Wildfire was hers," she adds. "You know that. You're the only one who does."|She doesn't say what else her grandmother left her, but you can tell there's something.}
> right: Light a candle her way
  arcana +small
  mana -tiny
  rel lyra +tiny
  say: You tell the candle on the side table the worst joke you know and push a little magic after it. Nothing. Lyra snorts, which she never does, and the wick catches. "It was laughing at you," she says. "That counts. She always said that counts."

# ---------------- Mir: the Ten Clockworks ----------------
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
