# Brief: a late-night study session that turns into an argument about the lake

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **personal**.

## Cast

### Lyra Vaneshade (`lyra`)

she/her · age 19 · student year 1 · Emberhall · romanceable

*Heir of House Vaneshade, pyromancy prodigy*

Brilliant, impatient and used to winning. She treats everyone as either a rival or furniture — and is quietly lonely about it.

**Voice:** Clipped and formal; sarcastic when hurt. Never says "please" first, never admits to being tired, apologises by doing something useful.

**Traits:** proud, ambitious, lonely, stubborn · **Interests:** duelling, fire, books

**Stats:** arcana 34, lore 22, alchemy 8, charm 20, vigor 28, guile 12, wealth 5

**Schedule:** The Duelling Hall (afternoon, evening); The Refectory (noon); The Library (night)

**Relations:** Kael Dumont -10, Bram Hollis +5, Nessa Quill -5

**Facts:**
- [surface] The pyromancy prodigy of House Vaneshade. Everyone knows the name, and she makes sure of it. (`lyra.prodigy`)
- [personal] She can incinerate a target at forty paces. She cannot make toast. (`lyra.toast`, known when `seen(lyra_toast) > 0`)
- [personal] Her mother has never once told her "well done". (`lyra.mother`, known when `rel(lyra) >= 18`)
- [personal] She came second in the Winter Trials once. Her mother wrote to ask who beat her. (`lyra.second_place`, known when `seen(lyra_letter) > 0`)
- [personal] You are the only person here who makes her better. She hates it. She doesn't want it to stop. (`lyra.rival`, known when `bond(lyra) == "rival"`)

### Kael Dumont (`kael`)

he/him · age 20 · student year 1 · Stillwater · romanceable

*Transfer student from the frozen North*

Arrived mid-term with no luggage and frost in his eyelashes. Doesn't talk about where he came from. Watches the sky at night.

**Voice:** Few words, quiet, as if each one costs something. Northern formality; literal-minded about feelings, startled by kindness.

**Traits:** guarded, cold, lonely, protective · **Interests:** stars, snow, books

**Stats:** arcana 36, lore 26, alchemy 8, charm 10, vigor 22, guile 18, wealth 2

**Schedule:** The Observatory (night, midnight); The Library (afternoon); The Boathouse (evening)

**Relations:** Ilse Dumont +30, Lyra Vaneshade -10, Seraphine Hale +5

**Facts:**
- [surface] A transfer from the frozen North who arrived mid-term with frost in his eyelashes. (`kael.north`)
- [personal] His hands are always cold. Nobody has ever been warm enough before. (`kael.cold_hands`, known when `seen(kael_cold_hands) > 0`)
- [personal] He watches a patch of sky with no stars in it: a star that eats light. (`kael.sky`, known when `seen(astro_kael_roof) > 0`)
- [personal] His mother never once said she was proud of him. (`kael.mother`, known when `seen(kael_northern_lights) > 0`)

## Arc: The Hollow Star (`hollowstar`, hard canon)

Something that eats light sleeps beneath the Mirror Lake, behind a door the founders sealed with seven locks. Someone wants it open.

**Acts:** omens (year 1) → investigation (year 2) → escalation (year 3) → convergence (year 4)

**Clues:** founders_ledger, lake_bell, second_shadow, seven_locks, star_key, kael_family, ilse_truth, knows_founders_seal, heard_of_starcalling, codex_names · **key:** seven_locks, star_key, ilse_truth

Batch content may read the act for flavour and point toward clue sources. Only hard-canon events grant key clues or move the clock.

## Lore

- **founders** (`founders_seal`, soft): The founders built Lumenhold as a seal over the Hollow Star: seven towers, one lock in each, and a key shaped like a star that holds no light. The seal weakens over generations and must be renewed.
- **Dumont** (`dumont_family`, soft): The Dumonts are the foremost of the Hollow families. They sent Kael to open the door; when he refused, they raised his younger sister Ilse to do it instead. Their mother has never told either child she was proud.
- **Hollow Star** (`hollow_star`, soft): A star that is not a light but an absence: it eats light. It sleeps beneath the Mirror Lake, behind a round door. It is not asleep so much as waiting, and it learns the names of those who look for it.
- **drowned bell** (`drowned_bell`, soft): A bell lies under the Mirror Lake. It tolls when the Star stirs, and once on the night the lake freezes. Edmund's silver wand hums the same note.
- **Vaneshade** (`vaneshade`, soft): House Vaneshade is old pyromancer nobility. Its letters carry a black seal; its winter gala is an inspection disguised as a party. Lady Vaneshade's highest praise is "Adequate."
- **star key** (`star_key`, soft): The key to the founders' seal is shaped like a star and black as a hole in the world. It was kept in a star-shaped hollow at the top of the seventh tower, behind wards that shriek.
- **Starcalling** (`starcalling`, soft): An old discipline of calling down the light of a named star. Light that the Hollow Star cannot swallow is one of the few weapons the founders left.
- **Mirror Lake** (`mirror_lake`, soft): The lake is so still it shows the towers upside down. Students swim in it in summer and catch Lake Fever when they shouldn't. Some nights it calls to seers.
- **Codex of Hollow Names** (`codex_hollow_names`, soft): A book in the Restricted Section that finds its readers. Its first page is a list of names; the last is still being written. Reading it turns the fingertips grey.
- **Founders' Ledger** (`founders_ledger`, soft): The Founders' Ledger in the archive vault is three hundred years old. The entry for the founding year was cut out with a razor, but the impression of the pen remains on the page beneath. A client of Grisk's once paid to have another page removed.
- **Lumen** (`lumen_and_hollow`, soft): Lumenhold talks about people the way it talks about candles: some give light (Lumen), some swallow it (the Hollow). It is not a house or a club, only what people notice. Those who lean toward the Hollow find the Star noticing them back; the way out of it is slow, and usually starts with someone handing you something to do.
- **frozen lake** (`lake_freezes`, soft): When the seal is at its weakest, on the night of the Blossom moon, the lake freezes in a single breath in the middle of spring. Cracks glow beneath the ice and things made of frost and whispers come ashore.

## Style examples

```grim
# content/events/people_students.grim:57
@event lyra_study_rivalry
title: Top of the Class
class: routine
tone: tense
trigger: social
actor: lyra
when: rel(lyra) > -24
weight: 10
art: scroll
tags: social study rival
scene: Two students at opposite ends of a long library table, surrounded by towers of books, glaring over the tops of them.
text: The professors have posted rankings. Lyra is first. You're close enough to see the back of her head. She notices you noticing.
> left: Suggest studying together
  lore +small
  rel lyra +small
  say: "Together?" She considers this like a foreign custom. Then she pulls out a chair. She's an excellent, merciless study partner.
> right: Beat her outright
  challenge research easy:
    win:
      study +medium
      rel lyra +small
      renown +small
      say: Next rankings: you're first. Lyra stares at the list for a long time. Then she finds you and says, "Good." She means it.
    lose:
      study +tiny
      rel lyra -tiny
      say: You study until your eyes bleed and come third. Lyra is still first. She doesn't gloat. That's worse.
```

```grim
# content/events/expansion_people.grim:9
@event lyra_toast
title: Lyra Cannot Cook
class: windfall
tone: light
trigger: social
actor: lyra
when: rel(lyra) >= 9
weight: 10
art: flame
tags: social
scene: A dormitory kitchenette full of smoke, a crimson-haired girl holding a blackened slice of toast at arm's length, a fire-charm still sparking in her other hand.
text: Smoke pours from the kitchenette. Lyra Vaneshade, pyromancy prodigy, is holding a piece of bread that is now mostly charcoal. "I can incinerate a target at forty paces," she says. "I cannot make toast. Don't. Say. Anything."
> left: Say absolutely nothing
  rel lyra +small
  say: You open a window, take the bread, and make two perfect slices with a toasting fork. She eats hers in dignified silence. Then she asks for another.
> right: Teach her — gently
  rel lyra +medium
  spark lyra +tiny
  charm +tiny
  say: "Less fire," you say. "No, less. Less than that." It takes eleven slices. On the twelfth, she makes perfect golden toast and looks prouder than after any duel.
```

```grim
# content/events/people_students.grim:37
@event lyra_letter
title: A Letter With a Black Seal
class: windfall
tone: light
trigger: social
actor: lyra
when: rel(lyra) >= 6
weight: 12
art: letter
tags: social
scene: A girl sitting on a window seat in an empty corridor, crushing a letter with a black wax seal in her fist, face turned away.
text: You find Lyra on a window seat with a crumpled letter. Black seal. Her family's. She's not crying; Vaneshades don't. But she's not quite not crying either.
> left: Pretend you didn't see
  say: You walk past. Later, she's flawless again, as if nothing happened. Maybe nothing did.
> right: Sit down beside her
  rel lyra +large
  spark lyra +tiny
  flag lyra_vulnerable
  say: "Second place," she says eventually. "I came second in the Winter Trials. My mother wants to know who beat me." She almost laughs. "It's always someone."
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
