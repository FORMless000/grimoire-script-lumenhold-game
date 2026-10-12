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
- [personal] Three years of notebooks are the most precious things they own. (`mira.notebooks`, known when `rel(mira) >= 20`)
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

## Place: Mira's Workshop (`workshop`)

castle · public · open afternoon, evening, night

A former classroom full of springs, gears, half-finished machines and the smell of solder. Fire buckets by the door, on the faculty's orders.

Teaser while undiscovered: Something clanks and hums behind the west-wing tapestry.

**Usually here:** Mira Ten (afternoon, evening, night)

## Lore

- **Hollis** (`hollis_family`, soft): Bram's father was a prefect and head boy at Lumenhold, and has never stopped telling his son he will not amount to anything.
- **Ten family** (`ten_clockworks`, soft): Mira's family runs a clockworks and expects them home. After a persuasive letter, Mira's mother agreed: "Fine. Win a prize."

## Style examples

```grim
# content/events/expansion_people.grim:493
@event bram_cheating
title: Bram Cheats
trigger: social
actor: bram
when: met(bram) and (month == 4 or month == 10)
weight: 10
art: scroll
tags: rival study
scene: A prefect in an exam hall slipping a tiny scroll out of his sleeve, a student two desks away watching.
text: In the exam hall, two desks away, you see Bram Hollis — prefect, enforcer of rules — slip a tiny scroll out of his sleeve. He sees you seeing him. His face goes white.
> left: Report him
  rel bram -20
  rel isolde +4
  renown +2
  say: Bram loses his sash for the rest of the year. Some students cheer. You don't feel like cheering. Neither, later, does he.
> right: Say nothing — and let him know you saw
  rel bram +6
  guile +2
  say: After the exam you just look at him. He nods, once. You never mention it. But his demerits stop, for you and for everyone you know.
```

```grim
# content/events/people_students.grim:727
@event mira_workshop_closed
title: The Workshop Is Shut
trigger: social
actor: mira
when: rel(mira) >= 20 and year >= 2
weight: 10
art: lock
tags: social
scene: A workshop door chained shut with a faculty notice nailed to it, a forlorn student sitting on a toolbox outside.
text: After the third fire this term, the faculty has padlocked Mira's workshop. Mira is sitting on a toolbox outside it, looking like someone took their heart and filed it under "hazards".
> left: Plead their case to Professor Thorne
  check charm 18:
    rel mira +12
    rel thorne +2
    say: Thorne agrees to reopen it — with fire buckets and a weekly inspection. Mira cries on you. Oil and all.
  else:
    rel mira +5
    rel thorne -2
    say: Thorne refuses. But Mira heard you try. "Nobody's ever argued for me before," they say.
> right: Help them build a secret workshop
  check guile 14:
    rel mira +12
    guile +1
    say: An abandoned classroom behind a tapestry. You bring candles; Mira brings everything else. It's perfect. It's almost entirely fireproof.
  else:
    rel mira +6
    gain detention
    say: Bram finds the secret workshop on day two. Worth it, says Mira, scrubbing cauldrons beside you.
```

```grim
# content/events/expansion_people.grim:294
@event mira_lab_fire
title: Fire in the Workshop
trigger: social
actor: mira
when: rel(mira) >= 20
weight: 10
art: flame
tags: danger
scene: A workshop full of smoke and orange light, notebooks scattered across a burning bench, a figure in goggles coughing in the doorway.
text: The workshop is on fire. Properly this time. Mira is in the doorway, coughing — and trying to go back in. "My notebooks! Three years of notes!"
> left: Grab the notebooks
  check vigor 16:
    rel mira +14
    health -4
    say: You come out singed, smoking, with an armful of notebooks. Mira stares at you, then at the notebooks, then bursts into tears and hugs you, both of you coughing.
  else:
    health -10
    rel mira +8
    say: You get halfway before the smoke drives you back. You save one notebook. Mira says it's the most important one. You both know it isn't. They mean it anyway.
> right: Drag Mira away
  rel mira +6
  health -2
  say: You haul Mira back from the door. The notebooks burn. Mira is silent for a week. Then they start a new notebook. The first page just says: "Thank you."
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
