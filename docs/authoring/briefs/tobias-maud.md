# Brief: a storm threatens the moonflowers the night before a club inspection

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **personal**.

## Cast

### Tobias Fennick (`tobias`)

he/him · age 19 · student year 1 · Rootward · romanceable

*Farmer's son on a turnip scholarship*

Big hands, bigger heart. Talks to plants and, worryingly, the plants seem to answer.

**Voice:** Warm, slow and earnest, with farm sayings and long stories about goats. Apologises too much; laughs from the belly.

**Traits:** kind, gentle, homesick, loyal · **Interests:** plants, animals, cooking, dancing

**Stats:** arcana 12, lore 14, alchemy 26, charm 18, vigor 30, guile 4, wealth 1

**Schedule:** The Greenhouses (morning, afternoon); The Refectory (noon, evening); The Familiar Stables (evening)

**Relations:** Old Maud +20, Bram Hollis -15, Mir Ten +10

**Facts:**
- [surface] A farmer's son on a turnip scholarship, built like a barn door and gentle as a lamb. (`tobias.scholarship`)
- [surface] He talks to plants. Worryingly, they seem to answer. (`tobias.plants`)
- [personal] His mother runs the farm alone at harvest. It's the first harvest he has ever missed. (`tobias.ma`, known when `seen(tobias_homesick) > 0`)
- [personal] He is raising a mandrake called Gerald, who wears a knitted hat and screams softly. (`tobias.gerald`, known when `seen(tobias_godparent) > 0`)
- [personal] The greenhouse moonflowers bloom once every eleven years. He would stand in a storm for them. (`tobias.moonflowers`, known when `rel(tobias) >= 12`)
- [personal] He practised waltzing with a broom before the Midwinter Ball. The broom complained. (`tobias.dancing`, known when `seen(tobias_dance_lessons) > 0`)

### Old Maud (`maud`)

she/her · age 81 · staff · Faculty

*Groundskeeper and hedge-witch*

Keeps bees, chickens and a rather large secret garden. Gives advice you only understand two weeks later.

**Voice:** Folksy and sharp; calls everyone "dearie". Gives advice you only understand two weeks later; tells sad stories over tea as if they were recipes.

**Traits:** kind, eccentric, patient, warm · **Interests:** plants, bees, soup, animals, history

**Stats:** arcana 46, lore 58, alchemy 72, charm 30, vigor 20, guile 34, wealth 2

**Schedule:** Old Maud's Cottage (morning, evening); The Greenhouses (afternoon); The Orchard (noon)

**Relations:** Professor Aldric Thorne +20, Headmistress Isolde Marrow +25, Tobias Fennick +20

**Facts:**
- [surface] Groundskeeper and hedge-witch, keeper of bees, chickens and a goat called Bartholomew. (`maud.groundskeeper`)
- [personal] She was a student here sixty years ago, the spring the lake froze. (`maud.student`, known when `seen(maud_old_student) > 0`)
- [personal] Her soup cures colds, broken hearts and most curses. You're not allowed to write it down. (`maud.soup`, known when `seen(maud_recipe) > 0`)
- [personal] Behind the potting shed there is a door to a garden that only exists for people she shows it to. (`maud.garden`, known when `seen(garden_maud_secret) > 0`)
- [personal] She is eighty-one, and says she's allowed the occasional chill. (`maud.age`, known when `seen(maud_ill) > 0`)

## Track: Verdant Circle (`verdant`)

club · alchemy · ranks: Member, Gardener, Head Gardener · 2 required visits per term

The greenhouse club: moonflowers, mandrakes and long talks with plants that occasionally answer.

**Lead:** Tobias Fennick

## Already written here (33)

- `align_maud_way_back` Weeding, Dearie (routine)
- `hs_maud_locks` Maud Has Seen Ice Before (story)
- `heal_tobias_sting` Stung (windfall)
- `garden_mandrakes` The Mandrake Choir (routine)
- `garden_moonflower` The Moonflower (routine)
- `garden_maud_secret` The Secret Garden (routine)
- `maud_goat` Bartholomew in the Library (routine)
- `maud_recipe` Maud's Soup (routine)
- `maud_old_wand` A Wand From Sixty Years Ago (story)
- `tobias_scarecrow` The Scarecrow Project (routine)
- `tobias_dance_lessons` Two Left Feet (routine)
- `tobias_storm_greenhouse` Storm Over the Greenhouses (routine)
- `y3_maud_seeds` Seeds for Later (windfall)
- `maud_chickens` The Great Chicken Escape (routine)
- `maud_honey` Honey for a Cold (routine)
- `maud_old_student` Maud Was a Student Once (story)
- `maud_bees` The Silver Bees (routine)
- `maud_ill` Maud Is Unwell (routine)
- `tobias_intro` The Lost Boy (windfall)
- `tobias_homesick` Homesick (routine)
- `tobias_bad_harvest` The Harvest Failed (routine)
- `tobias_repays` Every Crown (story)
- `tobias_godparent` The Mandrake Baby (routine)
- `tobias_bullied` Tobias and the Prefect (routine)
- `tobias_confession` A Confession, With Vegetables (milestone)
- `tobias_picnic` A Picnic in the Orchard (milestone)
- `verdant_watering_rota` The Watering Rota (routine, rank 1)
- `verdant_repotting_day` Repotting Day (routine, rank 1)
- `verdant_tobias_cuttings` The Cuttings Question (routine, rank 2)
- `verdant_greenhouse_keys` The Greenhouse Keys (milestone, rank 2)
- `letter_tobias_goats` Four Pages of Goats (routine)
- `letter_tobias_seeds` Seeds for a Windowsill (routine)
- `hungry_maud_soup` Soup at the Cottage (routine)

## Lore

- **frozen lake** (`lake_freezes`, soft): When the seal is at its weakest, on the night of the Blossom moon, the lake freezes in a single breath in the middle of spring. Cracks glow beneath the ice and things made of frost and whispers come ashore.
- **Fennick** (`fennick_farm`, soft): The Fennick farm grows turnips, tomatoes and stubborn children. Tobias's mother runs it alone at harvest; one year blight nearly ruined them.
- **greenhouses** (`greenhouses`, soft): Glass houses that steam even in winter. The moonflowers there bloom once every eleven years and fill the greenhouse with silver light.
- **Harvest Feast** (`festivals`, soft): The Harvest Feast opens the year; on Lantern Night lanterns carry wishes over the lake; the Midwinter Ball fills the Great Hall; the Spring Tournament crowns a duelling champion; and at Starfall the whole academy sleeps on the lawns to watch the meteors.
- **Club Fair** (`fairs`, soft): In Emberwane the Club Fair fills the courtyard with recruiting tables; the Job Board in the entrance hall posts term-time work. The Artificers' Fair shows off students' machines, and in summer the village holds its Midsummer Fair with an enchanted carousel.
- **Pell & Daughters** (`pell_and_daughters`, soft): The village apothecary, with a thousand labelled drawers. Old Pell taught three generations to count drops.

## Style examples

```grim
# content/events/pools/clubs_jobs.grim:262
@event verdant_tobias_cuttings
title: The Cuttings Question
track: verdant
rank: 2
class: routine
tone: warm
repeat: 5
weight: 10
actor: tobias
art: leaf
tags: club nature
scene: A big gentle student cradling a tray of leggy cuttings, eyeing a full compost heap with dread.
text: {The benches are full and someone must choose which cuttings stay. Tobias can't. "It's like choosing between goats," he says.|Bench day. Tobias hovers over a tray of cuttings, apologising to them in advance and glancing at you.|Tobias hands you the tray before he can change his mind. He is grateful in a way that looks like grief.} {season == "autumn": The frost will take the weakest soon anyway.|}
> left: Choose, and compost the rest
  perform verdant +small
  rank_xp verdant +small
  rel tobias -tiny
  mood -tiny
  say: {~You keep the strongest and compost the rest. Tobias says "fair's fair", then goes very quiet over the heap.|The benches breathe again. Tobias thanks you, then tells you a long story about a goat he couldn't sell. You understand it is about the cuttings.}
> right: Find room for every one
  rel tobias +small
  perform verdant -tiny
  mood +tiny
  say: {~You find room on windowsills, under benches and in a teacup. Nothing grows well, but everything grows. Tobias laughs from the belly.|"Ma always said a crowded field still feeds you," Tobias says, beaming. The benches groan. So does Old Maud, when she sees.}
```

```grim
# content/events/clubs.grim:328
@event garden_moonflower
title: The Moonflower
class: routine
tone: warm
when: met(tobias)
track: verdant
actor: tobias
weight: 12
art: flower
tags: club romance nature
scene: A single silver flower opening in the dark of a glass greenhouse, two faces lit by its glow.
text: "The moonflower's going to bloom tonight," Tobias says, a little breathless. "Once every eleven years. I'm staying up to see it. You... could stay too. If you want."
> left: You need sleep
  rel tobias -tiny
  say: "Course. Yeah." He tells you about it at breakfast, in detail, with gestures.
> right: Stay up with him
  health -tiny
  rel tobias +medium
  spark tobias +small
  mood +small
  say: At 2am the flower opens and fills the greenhouse with silver light. Tobias doesn't look at the flower. He looks at you.
```

```grim
# content/events/pools/clubs_jobs.grim:287
@event verdant_greenhouse_keys
title: The Greenhouse Keys
track: verdant
rank: 2
class: milestone
tone: warm
weight: 20
actor: tobias
art: key
tags: club nature
scene: A heavy ring of old iron keys handed over in a steaming glasshouse at dusk.
text: At dusk Tobias holds out the iron key ring, warm from his pocket. "Ma says you give the keys to whoever shuts the gate without being asked," he says. "You always shut the gate." From now on, opening up and locking up are yours.
> left: Open up at dawn
  rank_xp verdant +medium
  perform verdant +small
  health -tiny
  rel tobias +small
  say: Dawn, the glass silver with dew, every plant turning to the light you let in. You had never noticed they all turn at once. For a moment you are the only person in the world.
> right: Walk the night round with a lamp
  rank_xp verdant +medium
  alchemy +small
  mood +small
  say: You walk the benches with a lamp, checking latches and saying goodnight, because Tobias does and it feels rude not to. Something in the far bed says it back. You decide not to mention it.

# ---------------- Midnight Cartographers (track: cartographers) ----------------
```

## Rules

Validators check the first group automatically; the critic (a separate pass, without the author's reasoning) checks the rest. A batch is accepted when everything passes.

**Automatic**
- `grim fmt --check`, `grim lint` with 0 errors (references, vocabularies, ages, canon lint), `grim balance --quick` with 0 invariant failures.
- New events appear in simulation (not in "never seen") unless the report says they're deliberately rare.
- `i18n zh-CN` complete for the batch, tokens intact.

**Critic**
- **Canon:** names, places, facts and history match the worldbook; nothing contradicts hard lore; new names come with a soft `@lore` entry.
- **Voice:** characters sound like their `voice:` and act on their traits and facts.
- **Choices:** no option is obviously best (`costs.md`): options trade by giving different things or by a cost or risk; every cost is one the `say:` shows (body → health, spirits → mood, purchases → crowns, skipped work → `study`/`perform`/`progress`, a person let down → `rel`, a moral side → alignment); every option has a specific `say:`.
- **Tone:** warm, witty, slightly melancholy; humour from specifics; no gore, nothing explicit, adults only.
- **Length:** text under 400 characters, labels under 36, `say` under 300.
- **Gating:** `when` conditions are reachable and sensible; queued events are queued by something; flags read are set somewhere (`grim reach` proves it; lint fails on an unreachable event).
- **Plot safety:** only hard-canon story events grant key clues or move arc clocks.
- **Alignment:** a choice with moral weight (cruelty, theft, cheating, exploiting someone, reaching for the Star's power; or honesty, protection, generosity at a cost) moves `alignment` (`-tiny`…`-medium` Hollow, `+tiny`…`+medium` Lumen). Ordinary choices don't. Never use alignment, or any counter, as plot progress: plot gates read `clock(arc)` and `clues(arc)`.
- **Duplication:** no event repeats an existing one's premise (check `grim query event --grep <word>`).


> How a choice trades (design §8.4; playtest 2, A3). The sizes are in `presets.md`; the rule the lint checks is in `classes.md`.

## The rule

- **No option is obviously best.** A routine card's options trade against each other: they give different things, or one costs or risks something the other doesn't. The lint fails a card when one option is at least as good as another on every value and better on one, with no risk on either side.
- **A free option is honest** when choosing it gives up what the other option offers (an evening of study instead of an evening with friends). Don't add a cost to a free option to make it "trade": the other option is its cost.
- **A cost is something the scene shows.** If the `say:` doesn't show the player paying it (tired legs, a spent crown, a friend's cool look, a missed lecture), it isn't a cost: drop it, pick the one the scene does show, or write the line that shows it.
- **Keep each option within ±1.5 medium-equivalents** (the weights in `balance.grim`).
- The lint reads alignment as a direction, not a gain: two options that move it differently are never one "better" than the other. A gamble (`chance`, a check, a penalty queued at odds) or an option that leads somewhere (a state, a flag, a queued card) is never "obviously best" either.

## What each value stands for

| Value | It is | Costs it when the scene shows | Gains it when |
|---|---|---|---|
| `health` | the body | exertion, cold, wet, injury, a fall, lost sleep, illness, a burn, a bite | rest, food, warmth, a healer, sleep |
| `mood` | spirits | embarrassment, guilt, worry, boredom, disappointment, homesickness, a row, bad news | fun, beauty, praise, kindness, a win, a good meal with friends |
| `mana` | the magic you can spend | casting or channelling, a ward that drinks from you, a spell gone wrong | rest after magic, a ley line, a potion; it refills monthly |
| `renown` | being talked about | public embarrassment, backing down where people watch, a scandal, being forgotten | a public feat, a byline, a performance, a famous friend; it fades monthly |
| `alignment` | Lumen ↔ Hollow | Hollow (`-`): cruelty, theft, cheating, lying for gain, exploiting someone, reaching for the Star | Lumen (`+`): honesty, protection, generosity at a real cost |
| `gold` (crowns) | your purse | what you buy, pay, lose or are fined (the prose names it) | wages, tips, winnings, a gift, a find |
| `arcana` `lore` `alchemy` `charm` `vigor` `guile` | skills (XP) | never a cost (rust is the engine's) | practice that matches the scene: spellcraft, study, brewing, persuasion, exertion and duelling, sneaking and noticing |

**Track and relationship costs** (often the honest ones):

| Statement | Use it when |
|---|---|
| `study <course> -tiny` / `study -tiny` | you skip a lecture, a revision night, a class's homework: that course's exam readiness drops (`study -tiny` without a course: every enrolled course) |
| `perform <track> -tiny` | you slack, leave early or annoy the boss at a club or job (`perform track` in the track's own cards) |
| `progress thesis -tiny` | the thesis waits while you do something else |
| `rel <npc> -tiny` / `spark <npc> -tiny` | you snub, disappoint, refuse or embarrass someone; a romantic moment goes flat |

**Alignment is a cost too.** A tempting option (keep the purse, read the letter, cheat the game, take the shortcut someone pays for) should put alignment at stake: `alignment -tiny`/`-small` on the tempting side, and `alignment +tiny` only when the honest side costs something real. Ordinary prudence (going to bed, saying no to a party) has no moral weight.

## Checks before you finish an option

1. What does the player give up? If it's the other option, the option can be free.
2. Does the `say:` show the cost? If not, change the cost or the line.
3. Is there a moral side? Then alignment moves.
4. Does it skip study, work, practice or a person? Use `study`, `perform`, `progress` or `rel` instead of a vague `mood -tiny`.
