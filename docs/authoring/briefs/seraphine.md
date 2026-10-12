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
- [personal] Her mother is the Oracle of Vell, who wants her home to tell kings what they want to hear. (`seraphine.oracle`, known when `rel(seraphine) >= 25`)
- [personal] Seers can't see themselves, unless someone is standing next to them. (`seraphine.self`, known when `seen(seraphine_painting) > 0`)

## Place: The Observatory (`observatory`)

castle · public · open evening, night, midnight

A brass dome at the top of the east tower. The great telescope points wherever it likes; usually that is the right place.

**Usually here:** Seraphine Hale (evening, night); Kael Dumont (night, midnight)

## Lore

- **observatory** (`observatory`, soft): A brass dome atop the east tower. The great telescope points wherever it likes. On cold nights Kael sits on the roof outside it, and frost spreads around him.
- **star key** (`star_key`, soft): The key to the founders' seal is shaped like a star and black as a hole in the world. It was kept in a star-shaped hollow at the top of the seventh tower, behind wards that shriek.
- **seventh tower** (`seventh_tower`, soft): One of the seven towers has been locked for a century. At its top is a single room of dust and moonlight. When the star key is lifted, every candle in the academy goes out at once.
- **Harvest Feast** (`festivals`, soft): The Harvest Feast opens the year; on Lantern Night lanterns carry wishes over the lake; the Midwinter Ball fills the Great Hall; the Spring Tournament crowns a duelling champion; and at Starfall the whole academy sleeps on the lawns to watch the meteors.
- **frozen lake** (`lake_freezes`, soft): When the seal is at its weakest, on the night of the Blossom moon, the lake freezes in a single breath in the middle of spring. Cracks glow beneath the ice and things made of frost and whispers come ashore.
- **young headmistress** (`isolde_youth`, soft): Before she was headmistress, Isolde Marrow was the student with the detention record of the decade, who set the observatory on fire twice.

## Style examples

```grim
# content/events/expansion_people.grim:138
@event seraphine_lost_day
title: Seraphine Is Tomorrow
trigger: social
actor: seraphine
when: rel(seraphine) >= 10
weight: 10
art: hourglass
tags: mystery social
scene: A girl sitting at the wrong desk in an empty classroom, a teacup in her hands, the calendar on the wall showing the next day's date.
text: Seraphine is sitting in an empty classroom, waiting for a lesson that's happening tomorrow. "I've slipped," she says calmly. "I'm a day ahead. It happens. I need someone to remind me what today is."
> left: Talk her back into today
  rel seraphine +8
  lore +1
  say: You tell her what you had for breakfast, what the weather's like, what Thorne said this morning. Slowly her eyes stop looking through you. "Oh," she says. "Hello. Today."
> right: Ask her what tomorrow holds
  chance 50:
    grades +4
    say: "There's a surprise quiz in Lore," she says. "Question three is a trick." It is. You get it right.
  else:
    mood -3
    say: "It rains," she says. "You get wet. You'll be fine." You are not fine. You get very wet.
```

```grim
# content/events/people_students.grim:424
@event seraphine_future
title: I Saw You Old
trigger: social
actor: seraphine
when: rel(seraphine) >= 25
weight: 10
art: hourglass
tags: social mystery
scene: Two students sitting on the rim of a dry fountain, one looking up at the stars, the other looking at the first with a soft smile.
text: "I saw you old," Seraphine says suddenly. "Last night. You were happy. Really happy. There was someone with you." She pauses. "Do you want to know who?"
> left: Yes, tell me
  chance 50:
    love seraphine +6
    say: She looks at you for a long time. "I'll tell you when you're old," she says, and goes pink.
  else:
    mood +3
    say: "Someone kind," she says. "That's all I could see. Their hands were kind."
> right: No, let it be a surprise
  rel seraphine +6
  mood +3
  say: She smiles like you've given her a present. "That's the right answer. Nobody ever gives the right answer."
```

```grim
# content/events/expansion_people.grim:160
@event seraphine_painting
title: A Painting of Somewhere Else
trigger: social
actor: seraphine
when: rel(seraphine) >= 20
weight: 10
art: eye
tags: social mystery
scene: A small canvas on an easel showing a stranger's cottage by the sea, a girl with paint on her fingers watching someone look at it.
text: Seraphine has painted a small cottage by the sea, with a crooked chimney and a blue door. "It's yours," she says. "In twelve years. I thought you should see it now. In case you want a different door."
> left: Keep the painting
  mood +6
  rel seraphine +6
  say: You hang it over your bed. Some nights you swear the smoke from the chimney moves. You decide, privately, that you like the blue door.
> right: Ask her to paint her own future
  rel seraphine +8
  love seraphine +3
  say: She looks at the blank canvas for a long time. "I never can," she says. "Seers can't see themselves." Then, quietly: "Unless someone's standing next to us."
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
