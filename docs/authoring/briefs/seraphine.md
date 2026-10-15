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

## Already written here (13)

- `hs_seraphine_towers` Seven, Then Six (story)
- `div_seraphine_vision` She Grabs Your Hand (story)
- `seraphine_lost_day` Seraphine Is Tomorrow (routine)
- `seraphine_painting` A Painting of Somewhere Else (routine)
- `seraphine_mother` The Oracle's Summons (routine)
- `seraphine_intro` Your Left Shoe (windfall)
- `seraphine_tarot` The Cards (routine)
- `seraphine_lake_vision` She Walks Into the Lake (story)
- `seraphine_future` I Saw You Old (routine)
- `seraphine_overwhelmed` Too Many Tomorrows (routine)
- `seraphine_confession` She Already Knew (milestone)
- `letter_seraphine_card` Half a Sentence (routine)
- `letter_seraphine_painting` A Painting of You (routine)

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
# content/events/chain_hollowstar_acts.grim:44
@event hs_seraphine_towers
title: Seven, Then Six
arc: hollowstar
beat: 4
slot: night
class: story
tone: eerie
actor: seraphine
art: tower
tags: mystery hollowstar
chain: hollowstar
scene: A seer on the observatory balcony at night, counting the academy's towers on her fingers, one finger held back.
text: Seraphine is on the observatory balcony, counting towers on her fingers. "Seven," she says. "Seven. Six, and then… no. Seven, for now." She looks at you as if you had arrived a little early. "What month is it? I lose track around the… you know."
> left: "Which one goes out?"
  lore +small
  mood -small
  say: She points, then frowns at her own hand. "That one. Or the one next to it. Next year, I think." She doesn't remember saying it the next morning, but you do.
> right: "It's {month}. Evening."
  rel seraphine +medium
  mood +tiny
  say: She lets out a long breath and sits down on the cold stone. "Thank you. I was halfway into a winter." You stay until she is sure which one she's in.
```

```grim
# content/events/classes.grim:357
@event div_seraphine_vision
title: She Grabs Your Hand
class: story
tone: eerie
track: astromancy
actor: seraphine
weight: 14
art: eye
tags: class mystery hollowstar
chain: hollowstar
scene: A dreamy-eyed girl gripping a classmate's wrist across a table of crystal balls, her pupils wide and silver.
text: In the middle of crystal-gazing, Seraphine Hale seizes your wrist. Her eyes have gone silver. "The door under the lake," she whispers. "Don't let him open it. Or do. I can't see which."
> left: Pull away
  meet seraphine
  rel seraphine -tiny
  mood -tiny
  say: She blinks and lets go. "Sorry. That happens." She goes back to her crystal as if nothing occurred.
> right: Ask who she means
  meet seraphine
  rel seraphine +medium
  lore +tiny
  flag heard_prophecy
  say: "Someone cold," she says. "Someone kind." Then she shakes her head, smiles vaguely, and asks if you'd like a biscuit.

# ---------------- Artifice ----------------
```

```grim
# content/events/people_students.grim:468
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
