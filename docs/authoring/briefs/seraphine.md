# Brief: a vision during a night lecture about the seventh tower

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **personal**.

## Cast

### Seraphine Hale (`seraphine`)

she/her · age 19 · student year 1 · Stillwater · romanceable

*Seer who never quite looks at the present*

Speaks in half-sentences, as if finishing the other half in a different week. Often right. Unsettlingly often.

**Voice:** Half-sentences, finished in another week. Calm, vague, then suddenly exact about something that hasn't happened yet.

**Traits:** dreamy, distant, perceptive, kind · **Interests:** prophecy, painting, tarot, stars

**Stats:** arcana 20, lore 32, alchemy 10, charm 16, vigor 8, guile 14, wealth 3

**Schedule:** The Observatory (evening, night); The Lakeshore (afternoon); The Library (morning)

**Relations:** Kael Dumont +10, Lyra Vaneshade +5

**Facts:**
- [surface] A seer who speaks in half-sentences and is unsettlingly often right. (`seraphine.seer`)
- [personal] Sometimes she slips a day ahead and needs someone to tell her what today is. (`seraphine.slips`, known when `seen(seraphine_lost_day) > 0`)
- [personal] Her mother is the Oracle of Vell, who wants her home to tell kings what they want to hear. (`seraphine.oracle`, known when `rel(seraphine) >= 15`)
- [personal] Seers can't see themselves, unless someone is standing next to them. (`seraphine.self`, known when `seen(seraphine_painting) > 0`)

## Arc: The Hollow Star (`hollowstar`, hard canon)

Something that eats light sleeps beneath the Mirror Lake, behind a door the founders sealed with seven locks. Someone wants it open.

**Acts:** omens (year 1) → investigation (year 2) → escalation (year 3) → convergence (year 4)

**Clues:** founders_ledger, lake_bell, second_shadow, seven_locks, star_key, kael_family, ilse_truth, knows_founders_seal, heard_of_starcalling, codex_names · **key:** seven_locks, star_key, ilse_truth

Batch content may read the act for flavour and point toward clue sources. Only hard-canon events grant key clues or move the clock.

## Lore

- **founders** (`founders_seal`, soft): The founders built Lumenhold as a seal over the Hollow Star: seven towers, one lock in each, and a key shaped like a star that holds no light. The seal weakens over generations and must be renewed.
- **Hollow Star** (`hollow_star`, soft): A star that is not a light but an absence: it eats light. It sleeps beneath the Mirror Lake, behind a round door. It is not asleep so much as waiting, and it learns the names of those who look for it.
- **star key** (`star_key`, soft): The key to the founders' seal is shaped like a star and black as a hole in the world. It was kept in a star-shaped hollow at the top of the seventh tower, behind wards that shriek.
- **Dumont** (`dumont_family`, soft): The Dumonts are the foremost of the Hollow families. They sent Kael to open the door; when he refused, they raised his younger sister Ilse to do it instead. Their mother has never told either child she was proud.
- **drowned bell** (`drowned_bell`, soft): A bell lies under the Mirror Lake. It tolls when the Star stirs, and once on the night the lake freezes. Edmund's silver wand hums the same note.
- **Starcalling** (`starcalling`, soft): An old discipline of calling down the light of a named star. Light that the Hollow Star cannot swallow is one of the few weapons the founders left.
- **Mirror Lake** (`mirror_lake`, soft): The lake is so still it shows the towers upside down. Students swim in it in summer and catch Lake Fever when they shouldn't. Some nights it calls to seers.
- **Founders' Ledger** (`founders_ledger`, soft): The Founders' Ledger in the archive vault is three hundred years old. The entry for the founding year was cut out with a razor, but the impression of the pen remains on the page beneath. A client of Grisk's once paid to have another page removed.
- **Codex of Hollow Names** (`codex_hollow_names`, soft): A book in the Restricted Section that finds its readers. Its first page is a list of names; the last is still being written. Reading it turns the fingertips grey.
- **seventh tower** (`seventh_tower`, soft): One of the seven towers has been locked for a century. At its top is a single room of dust and moonlight. When the star key is lifted, every candle in the academy goes out at once.
- **Lumen** (`lumen_and_hollow`, soft): Lumenhold talks about people the way it talks about candles: some give light (Lumen), some swallow it (the Hollow). It is not a house or a club, only what people notice. Those who lean toward the Hollow find the Star noticing them back; the way out of it is slow, and usually starts with someone handing you something to do.
- **frozen lake** (`lake_freezes`, soft): When the seal is at its weakest, on the night of the Blossom moon, the lake freezes in a single breath in the middle of spring. Cracks glow beneath the ice and things made of frost and whispers come ashore.

## Style examples

```grim
# content/events/people_students.grim:455
@event seraphine_lake_vision
title: She Walks Into the Lake
class: story
tone: tense
trigger: social
actor: seraphine
when: rel(seraphine) >= 6 and month >= 3 and month <= 9
weight: 10
art: wave
tags: social danger
scene: A girl in a nightgown wading into a misty lake at night, eyes glowing silver, arms outstretched toward something under the water.
text: From your window you see Seraphine walking into the lake in her nightgown, eyes shining silver, already up to her waist.
> left: Wake a prefect
  rel seraphine +small
  say: The prefect drags her out, coughing. She doesn't remember anything. She looks at you strangely for days.
> right: Run down and pull her out
  challenge feat trivial:
    win:
      rel seraphine +large
      spark seraphine +small
      alignment +small
      say: You reach her just as she goes under. On the shore she wakes and whispers, "It was calling me. It called you too." Then she holds on very tight.
    lose:
      health -large
      gain sick
      rel seraphine +large
      say: You both nearly drown. You both come down with Lake Fever. She brings you soup that tastes faintly of the future.
```

```grim
# content/events/expansion_people.grim:152
@event seraphine_lost_day
title: Seraphine Is Tomorrow
class: routine
tone: eerie
trigger: social
actor: seraphine
when: rel(seraphine) >= 6
weight: 10
art: hourglass
tags: mystery social
scene: A girl sitting at the wrong desk in an empty classroom, a teacup in her hands, the calendar on the wall showing the next day's date.
text: Seraphine is sitting in an empty classroom, waiting for a lesson that's happening tomorrow. "I've slipped," she says calmly. "I'm a day ahead. It happens. I need someone to remind me what today is."
> left: Talk her back into today
  rel seraphine +medium
  lore +tiny
  say: You tell her what you had for breakfast, what the weather's like, what Thorne said this morning. Slowly her eyes stop looking through you. "Oh," she says. "Hello. Today."
> right: Ask her what tomorrow holds
  chance 50:
    study +small
    say: "There's a surprise quiz in Lore," she says. "Question three is a trick." It is. You get it right.
  else:
    mood -tiny
    say: "It rains," she says. "You get wet. You'll be fine." You are not fine. You get very wet.
```

```grim
# content/events/expansion_people.grim:197
@event seraphine_mother
title: The Oracle's Summons
class: routine
tone: light
trigger: social
actor: seraphine
when: rel(seraphine) >= 15 and year >= 2
weight: 12
art: letter
tags: social
scene: A girl holding a letter that glows faintly silver, standing at the top of a tower stair, looking down as if about to fall or fly.
text: Seraphine's mother, the Oracle of Vell, wants her home to take up the family seat. "I'd spend my life telling kings what they want to hear," Seraphine says. "But she's already seen me say yes. She always sees me say yes."
> left: "Then surprise her."
  rel seraphine +large
  mood +small
  say: Seraphine writes back: no. For a whole day she's terrified. Then she's giddy. "I didn't see that coming," she keeps saying. "I didn't see it coming!"
> right: "Maybe she's right."
  rel seraphine -medium
  say: She nods slowly. She doesn't go — not yet. But she stops telling you her visions, and you miss them more than you expected.

# ---------------- Corvin ----------------
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
