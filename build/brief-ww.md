# Brief: the Whisperwood delve: bands, hazards, creatures, the Spinner

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **personal**.

## Cast

### Old Maud (`maud`)

she/her · age 81 · staff · Faculty

*Groundskeeper and hedge-witch*

Keeps bees, chickens and a rather large secret garden. Gives advice you only understand two weeks later.

**Voice:** Folksy and sharp; calls everyone "dearie". Gives advice you only understand two weeks later; tells sad stories over tea as if they were recipes.

**Traits:** kind, eccentric, patient, warm · **Interests:** plants, bees, soup, animals, history

**Stats:** arcana 46, lore 58, alchemy 72, charm 30, vigor 20, guile 34, wealth 2

**Schedule:** Old Maud's Cottage & Orchard (morning, noon, evening); The Greenhouses (afternoon)

**On breaks:** Old Maud's Cottage & Orchard (morning, evening); The Greenhouses (afternoon)

**Relations:** Professor Aldric Thorne +20, Headmistress Isolde Marrow +25, Tobias Fennick +20

**Facts:**
- [surface] Groundskeeper and hedge-witch, keeper of bees, chickens and a goat called Bartholomew. (`maud.groundskeeper`)
- [personal] She was a student here sixty years ago, the spring the lake froze. (`maud.student`, known when `seen(maud_old_student) > 0`)
- [personal] Her soup cures colds, broken hearts and most curses. You're not allowed to write it down. (`maud.soup`, known when `seen(maud_recipe) > 0`)
- [personal] Behind the potting shed there is a door to a garden that only exists for people she shows it to. (`maud.garden`, known when `seen(garden_maud_secret) > 0`)
- [personal] She is eighty-one, and says she's allowed the occasional chill. (`maud.age`, known when `seen(maud_ill) > 0`)

### Professor Hedda Brask (`brask`)

she/her · age 61 · professor · Faculty

*Professor of Beastcraft & Flight*

Teaches Beastcraft & Flight and is kinder to animals than to students, though the gap closes for anyone who mucks out without being asked.

**Voice:** Speaks to creatures in full sentences and to students in half ones. Every story ends with a bite and a moral. Laughs once a term, loudly.

**Traits:** dry, gentle, stubborn, brave · **Interests:** animals, flying, history

**Stats:** arcana 52, lore 48, alchemy 30, charm 16, vigor 70, guile 28, wealth 2

**Schedule:** The Stables & Flight Field (morning, afternoon, evening); The Great Hall (noon)

**On breaks:** The Stables & Flight Field (morning, afternoon, evening)

**Relations:** Sister Amaranth +15, Old Maud +20, Professor Aldric Thorne +5

**Facts:**
- [surface] Teaches Beastcraft & Flight from the stables, and talks to every creature in them more kindly than to students. (`brask.beasts`)
- [personal] Every one of her stories ends with a bite and a moral. She laughs out loud about once a term. (`brask.stories`, known when `seen(brask_shovel) > 0`)
- [personal] The old barn owl in the stable loft has outlived three of her colleagues. She would not say which loss hurt most. (`brask.owl`, known when `seen(brask_night_owl) > 0`)
- [personal] She bows to the things that live in the Whisperwood, and believes it's why they have never bitten her. Much. (`brask.courtesies`, known when `seen(brask_trust) > 0`)

## Place: The Whisperwood (`whisperwood`)

wilds · public · open morning, afternoon, evening, night, midnight

An old forest that talks in its sleep. Moonpetal grows in its clearings; so do things that are better left there.

Teaser while undiscovered: Fog sits on the western woods even at noon.

## Already written here (24)

- `align_maud_way_back` Weeding, Dearie (routine)
- `hs_maud_locks` Maud Has Seen Ice Before (story)
- `curse_cure_2` Moonpetal (story)
- `garden_maud_secret` The Secret Garden (routine)
- `maud_goat` Bartholomew in the Library (routine)
- `maud_recipe` Maud's Soup (routine)
- `maud_old_wand` A Wand From Sixty Years Ago (story)
- `y3_maud_seeds` Seeds for Later (windfall)
- `brask_shovel` Hands Wanted (routine)
- `brask_night_owl` The Sick Owl (routine)
- `brask_trust` Old Courtesies (milestone)
- `maud_chickens` The Great Chicken Escape (routine)
- `maud_honey` Honey for a Cold (routine)
- `maud_old_student` Maud Was a Student Once (story)
- `maud_bees` The Silver Bees (routine)
- `maud_tea_tells` Over Many Cups of Tea (story)
- `maud_ill` Maud Is Unwell (routine)
- `brask_intro` Shovel. There. Go. (routine)
- `whisperwood_sleeptalk` The Forest Talks (routine)
- `whisperwood_foragers` Foraging Season (routine)
- `whisperwood_off_path` The Path That Wasn't (routine)
- `lesson_haste` Race the Hippogriff (routine)
- `hungry_maud_soup` Soup at the Cottage (routine)
- `bell_answer` What Maud Remembers (story)

## Lore

- **Professor Marisol** (`professors`, soft): Professor Marisol teaches Tidecalling and keeps the lake calm on exam days. Professor Vey teaches Illusion and grades on whether you fooled her. Professor Brask teaches Beastcraft and is kinder to animals than to students.
- **Whisperwood** (`whisperwood`, soft): An old forest west of the lake that talks in its sleep. Moonpetal blooms in its clearings only at midnight; a stag made of shadow guards them and steps aside only for the brave.
- **Pell & Daughters** (`pell_and_daughters`, soft): The village apothecary, with a thousand labelled drawers. Old Pell taught three generations to count drops.

## Style examples

```grim
# content/events/fixtures.grim:108
@event brask_shovel
title: Hands Wanted
class: routine
tone: light
trigger: social
actor: brask
when: rel(brask) >= 0
weight: 10
repeat: 5
art: paw
tags: nature social
scene: A weathered professor in a leather apron holding out a shovel to a student at a stable door, a hippogriff watching suspiciously from its stall.
text: {Professor Brask holds out a shovel as you pass the stables. She doesn't say anything. The hippogriff behind her does, loudly.|Brask hands you the shovel before you're through the door.|"Ah," says Brask, and the shovel is already in your hands.} {The griffon chick is in a mood.|The owls have opinions about the new straw.|A hippogriff has eaten a glove. Possibly a professor's.}
> left: Muck out the stalls
  vigor +small
  health -tiny
  rel brask +small
  say: {An hour of straw and silence. At the end Brask says, "The grey one likes you," which is more than she has said to anyone this term.|She tells you a story about a manticore, a bucket and a bishop. It ends with a bite and a moral. You miss the moral.|The hippogriff bows to you on your way out. Brask pretends not to see.}
> right: Decline, politely
  rel brask -tiny
  say: {"Suit yourself," she says, and takes the shovel back. "The straw won't mind."|"The hippogriff doesn't want to either," says Brask. "It helps anyway."|You hand the shovel back. Brask takes it, and the hippogriff looks at your gloves with interest. You leave quickly.}
> up[haste]: Hasten through the stalls
  rel brask +small
  vigor +tiny
  say: {You clear six stalls before the hippogriff has finished glaring at you. Brask watches with her arms folded and something almost like a smile.|You muck out, refill and re-straw in a blur. The griffon chick follows your hands, dizzy. "Show-off," says Brask, approving.|You're done before Brask has found her own shovel. The hippogriff, outpaced, gives back the glove. Brask takes it, damp, and says nothing, which from her is thanks.}
```

```grim
# content/events/fixtures.grim:157
@event brask_trust
time: evening
title: Old Courtesies
class: milestone
tone: warm
trigger: social
actor: brask
when: rel(brask) >= 20
weight: 20
art: feather
tags: nature magic
scene: A professor and a student at the edge of a forest at dusk, both bowing low to a great antlered stag half-hidden in the trees.
text: Brask takes you to the edge of the Whisperwood one afternoon. "Most people talk at animals," she says. "A few talk to them. Fewer listen." She bows, very low, to something in the trees. "Do as I do. Keep still, and keep your eyes down."
> left: Bow, and learn
  vigor +medium
  rel brask +small
  health -tiny
  say: It takes until full dark, bent double until your back aches, and something huge breathes on your neck for most of it. Then the stag bows back, very slightly. Brask laughs once, loudly, the way she does once a term.
> right: Keep your distance
  rel brask -tiny
  vigor +small
  say: You stay by the path and watch. She doesn't press you. On the walk back she talks about hoof care for an hour, which you suspect is a kindness.

# ---------------- Professor Vey (lecture tower; Illusion & Glamour) ----------------
```

```grim
# content/events/fixtures.grim:134
@event brask_night_owl
time: evening
title: The Sick Owl
class: routine
tone: warm
trigger: social
actor: brask
when: rel(brask) >= 10
weight: 12
art: owl
tags: nature
scene: A dim stable loft at night, a student sitting cross-legged beside a straw nest where a sick barn owl sleeps under a blanket, a lantern turned low.
text: Brask stops you in the corridor and falls into step without asking, which is a first. "The old barn owl won't eat," she says. "Somebody should sit with her tonight. Somebody quiet." She is looking at you.
> left: Sit up with the owl
  health -small
  rel brask +medium
  vigor +tiny
  say: You sit in the loft till dawn, dripping water onto the owl's beak. At four she takes a mouse from your fingers. In the morning Brask looks at the empty dish for a long time, then claps you once on the shoulder, hard.
> right: Send her to Sister Amaranth
  rel brask -tiny
  rel amaranth +tiny
  say: Amaranth looks at the owl, looks at you, and says she doesn't do owls. Then she sits with it all night. Brask is not sure how to feel about this, and neither are you.
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
- **Leads:** a hint the player has to follow up later (a card at a place, slot or track waiting on this card's flag) leaves a side-thread lead in the Clues panel; `grim leads` shows none missing.
- **Checks** (`checks.md`): the difficulty is what you're actually up against, not who is on the card; odds by nature, luck and drift each carry their own reason, none counted twice; a gamble is on `luck`; grandmaster+ is only on story or milestone cards, with `partial:` and a route without the check; a loss that ends the run has `partial:` or `likely`+; pure luck is `chance <word>`, and a roll a skill or relationship should move isn't a bare `chance`.
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
| `study <course> +tiny` / `study +tiny` | (a gain, 2026-10-19) extra work beyond class: a card's study gain is `+tiny`; preparation comes mostly from routine sources (each class month +3, +5 with a check won in class, the library's revision card +3), so exams stay predictable. A larger gain needs a matching price (a night, money, a favour), and study costs elsewhere balance the gains |
| `perform <track> -tiny` | you slack, leave early or annoy the boss at a club or job (`perform track` in the track's own cards) |
| `progress thesis -tiny` | the thesis waits while you do something else |
| `rel <npc> -tiny` / `spark <npc> -tiny` | you snub, disappoint, refuse or embarrass someone; a romantic moment goes flat |

**Alignment is a cost too.** A tempting option (keep the purse, read the letter, cheat the game, take the shortcut someone pays for) should put alignment at stake: `alignment -tiny`/`-small` on the tempting side, and `alignment +tiny` only when the honest side costs something real. Ordinary prudence (going to bed, saying no to a party) has no moral weight.

## Checks before you finish an option

1. What does the player give up? If it's the other option, the option can be free.
2. Does the `say:` show the cost? If not, change the cost or the line.
3. Is there a moral side? Then alignment moves.
4. Does it skip study, work, practice or a person? Use `study`, `perform`, `progress` or `rel` instead of a vague `mood -tiny`.
