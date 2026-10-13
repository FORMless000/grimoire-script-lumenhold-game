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

## Lore

- **Hollis** (`hollis_family`, soft): Bram's father was a prefect and head boy at Lumenhold, and has never stopped telling his son he will not amount to anything.
- **Ten family** (`ten_clockworks`, soft): Mira's family runs a clockworks and expects them home. After a persuasive letter, Mira's mother agreed: "Fine. Win a prize."

## Style examples

```grim
# content/events/expansion_people.grim:548
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
  say: Bram loses his sash for the rest of the year. Some students cheer. You don't feel like cheering. Neither, later, does he.
> right: Say nothing — and let him know you saw
  alignment -tiny
  rel bram +medium
  guile +small
  say: After the exam you just look at him. He nods, once. You never mention it. But his demerits stop, for you and for everyone you know.
```

```grim
# content/events/people_students.grim:851
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
  rel mira +small
  mood +small
  say: You watch Mira and the machine waltz, badly, across the room. It's the funniest thing you've ever seen.
> right: Dance with the machine
  charm +small
  health -tiny
  rel mira +medium
  say: It kicks you twice too. But by the end you can waltz, and Mira is clapping with oily hands.
```

```grim
# content/events/expansion_people.grim:300
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
- **Choices:** every option costs or risks something; no obviously better option; every option has a specific `say:`.
- **Tone:** warm, witty, slightly melancholy; humour from specifics; no gore, nothing explicit, adults only.
- **Length:** text under 400 characters, labels under 36, `say` under 300.
- **Gating:** `when` conditions are reachable and sensible; queued events are queued by something; flags read are set somewhere.
- **Plot safety:** only hard-canon story events grant key clues or move arc clocks.
- **Duplication:** no event repeats an existing one's premise (check `grim query event --grep <word>`).
