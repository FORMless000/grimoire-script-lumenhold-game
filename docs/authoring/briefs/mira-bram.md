# Brief: a machine malfunction during a prefect inspection

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **personal**.

## Cast

### Mira Ten (`mira`)

they/them · age 19 · student year 1 · Brasswick · romanceable

*Artificer of questionable inventions*

Smells permanently of solder and ozone. Has built a clockwork owl, a self-stirring cauldron and at least one small fire.

**Voice:** Fast, enthusiastic, full of technical tangents and exclamation marks. Talks to machines more gently than to people. Says "probably" a lot.

**Traits:** chaotic, curious, stubborn, funny · **Interests:** machines, clocks, flying

**Stats:** arcana 24, lore 20, alchemy 30, charm 14, vigor 10, guile 12, wealth 3

**Schedule:** Mira's Workshop (afternoon, evening, night); The Refectory (noon); The Lecture Tower (morning)

**Relations:** Tobias Fennick +10

**Facts:**
- [surface] An artificer who smells of solder and ozone and has started at least one small fire. (`mira.artificer`)
- [personal] Built a clockwork owl that remembers deadlines, birthdays and, slightly, grudges. (`mira.owl`, known when `seen(mira_owl_gift) > 0`)
- [personal] Three years of notebooks are the most precious things they own. (`mira.notebooks`, known when `rel(mira) >= 12`)
- [personal] Their family runs a clockworks and thinks invention is a hobby. It is not a hobby. (`mira.family`, known when `seen(mira_family_business) > 0`)
- [personal] After the third fire in a term, the faculty padlocked their workshop. (`mira.workshop`, known when `seen(mira_workshop_closed) > 0`)

### Bram Hollis (`bram`)

he/him · age 21 · prefect year 3 · Emberhall

*Prefect, enforcer, menace*

Upper-year prefect with a ledger of demerits and a fondness for writing your name in it.

**Voice:** Loud, officious, rule-quoting; demerits as punctuation. Under it, his father's voice. When he's honest, he's gruff and brief.

**Traits:** bullying, insecure, proud, loyal · **Interests:** rules, duelling

**Stats:** arcana 26, lore 18, alchemy 10, charm 14, vigor 32, guile 20, wealth 4

**Schedule:** The Courtyard (morning, noon); The Duelling Hall (evening); The Library (afternoon)

**Relations:** Tobias Fennick -15, Corvin Ashby -30, Nessa Quill -20, Lyra Vaneshade +5

**Facts:**
- [surface] An upper-year prefect with a red sash, a ledger of demerits and a fondness for your name. (`bram.prefect`)
- [personal] He once invented a "hall tax" for the east staircase. (`bram.hall_tax`, known when `seen(bram_hall_tax) > 0`)
- [personal] Under the sash, he will step between you and trouble. Then he tells you not to make it weird. (`bram.ally`, known when `seen(bram_turns) > 0`)

## Already written here (22)

- `art_mira_collab` A Joint Project (routine)
- `duel_bram_hazing` Initiation, Prefect-Style (routine)
- `mira_ornithopter` The Test Flight (routine)
- `mira_lab_fire` Fire in the Workshop (routine)
- `mira_name_day` Mira's Name Day (routine)
- `bram_father_visit` Bram's Father (routine)
- `bram_cheating` Bram Cheats (routine)
- `bram_intro` Running in the Halls (routine)
- `bram_hall_tax` The Hall Tax (routine)
- `bram_sabotage` Missing Notes (routine)
- `bram_crying` Behind the Stables (routine)
- `bram_turns` An Unexpected Ally (milestone)
- `bram_duel` A Formal Challenge (routine)
- `mira_intro` An Explosion in the West Wing (routine)
- `mira_owl_gift` A Present With Gears (routine)
- `mira_fair` The Artificers' Fair (routine)
- `mira_workshop_closed` The Workshop Is Shut (routine)
- `mira_dance_machine` The Dancing Machine (routine)
- `mira_confession` Blueprint (milestone)
- `mira_family_business` The Family Clockworks (routine)
- `letter_mira_blueprint` A Letter That Folds Itself (routine)
- `letter_mira_ticking` Something That Ticks (routine)

## Lore

- **Hollis** (`hollis_family`, soft): Bram's father was a prefect and head boy at Lumenhold, and has never stopped telling his son he will not amount to anything.
- **Ten family** (`ten_clockworks`, soft): Mira's family runs a clockworks and expects them home. After a persuasive letter, Mira's mother agreed: "Fine. Win a prize."

## Style examples

```grim
# content/events/expansion_people.grim:574
@event bram_cheating
title: Bram Cheats
class: routine
tone: tense
trigger: social
actor: bram
when: met(bram) and (month == 4 or month == 10)
weight: 10
art: scroll
tags: rival study
scene: A prefect in an exam hall slipping a tiny scroll out of his sleeve, a student two desks away watching.
text: In the exam hall, two desks away, you see Bram Hollis — prefect, enforcer of rules — slip a tiny scroll out of his sleeve. He sees you seeing him. His face goes white.
> left: Report him
  rel bram -huge
  rel isolde +small
  renown +small
  alignment +small
  say: Bram loses his sash for the rest of the year. Some students cheer. You don't feel like cheering. Neither, later, does he.
> right: Say nothing — and let him know you saw
  alignment -tiny
  rel bram +medium
  guile +small
  say: After the exam you just look at him. He nods, once. You never mention it. But his demerits stop, for you and for everyone you know.
```

```grim
# content/events/people_students.grim:871
@event mira_dance_machine
title: The Dancing Machine
class: routine
tone: light
trigger: social
actor: mira
when: rel(mira) >= 6
weight: 10
art: music
tags: social
scene: A spindly brass contraption with too many legs attempting a waltz in an empty classroom, a student dancing with it.
text: Mira has built a machine that teaches dancing. It has six legs and opinions. "It needs a test subject," they say. "It's mostly safe. It only kicked me twice."
> left: Make Mira test it
  rel mira -tiny
  mood +small
  say: You watch Mira and the machine waltz, badly, across the room. It kicks them twice; Mira gives you a look. It's the funniest thing you've ever seen.
> right: Dance with the machine
  charm +small
  health -tiny
  rel mira +medium
  say: It kicks you twice too. But by the end you can waltz, and Mira is clapping with oily hands.
```

```grim
# content/events/expansion_people.grim:315
@event mira_ornithopter
title: The Test Flight
class: routine
tone: tense
trigger: social
actor: mira
when: rel(mira) >= 9
weight: 12
art: gear
tags: social danger
scene: A rickety winged contraption balanced on the edge of a tower roof, a goggled artificer strapping into it, a friend holding a rope.
text: Mira has built a flying machine with canvas wings and seven propellers. It is balanced on the edge of the north tower. "Brooms are so last century," they say, strapping in. "I need someone on the rope. Probably. Possibly."
> left: Hold the rope
  challenge feat trivial:
    win:
      rel mira +large
      renown +small
      say: The machine flies — wobbly, loud, glorious — twice around the tower before landing in the lake. Mira surfaces whooping. You're both legends by dinner.
    lose:
      health -medium
      rel mira +medium
      say: The rope wins. You are dragged eight feet along the roof before letting go. The machine lands in a tree. Mira waves from it, delighted.
> right: Insist on a safety net
  rel mira +small
  alchemy +tiny
  say: You spend a day building a net. The machine flies four feet and drops into it. "Data!" says Mira happily. Nobody dies. It's a good day.
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
