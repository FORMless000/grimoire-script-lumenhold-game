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

**Schedule:** The Observatory (night); The Observatory (midnight, 30% of days); The Library (afternoon); The Boathouse (evening)

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

## Already written here (32)

- `kael_arrives` The Boy From the North (story)
- `hs_kael_truth` What Kael Is Running From (story)
- `pyro_lyra_spar` A Challenge in Class (routine)
- `astro_kael_roof` Three in the Morning (story)
- `duel_lyra_training` Training Partners (routine)
- `lyra_toast` Lyra Cannot Cook (routine)
- `lyra_mother_visit` Lady Vaneshade (routine)
- `lyra_rival_respect` Respect, Grudgingly (milestone)
- `kael_northern_lights` The Lights of the North (routine)
- `kael_fever` Kael Burns (routine)
- `kael_letter_home` A Letter He Won't Send (routine)
- `y3_last_duel` One Last Duel (routine)
- `kael_snowball` Snow in Thawmoon (routine)
- `kael_cold_hands` Cold Hands (routine)
- `kael_confession` Thaw (milestone)
- `lyra_intro` The Last Copy (routine)
- `lyra_letter` A Letter With a Black Seal (routine)
- `lyra_study_rivalry` Top of the Class (routine)
- `lyra_family_gala` The Vaneshade Winter Gala (routine)
- `lyra_confession` Lyra Doesn't Lose (milestone)
- `lyra_family_ultimatum` The Ultimatum (routine)
- `lyra_rival_sabotage` Sabotage in Class (routine)
- `lyra_burnout` Lyra Falls (routine)
- `duelling_refereeing_lyra` Refereeing Lyra (routine, rank 2)
- `letter_lyra_drills` A List of Drills (routine)
- `letter_lyra_book` Foundations of Flame (routine)
- `letter_kael_three_lines` Three Lines (routine)
- `letter_kael_star_chart` The Sky on Your Birthday (routine)
- `slice_candle_flame` Borrowed Fire (milestone)
- `slice_quarrel` A Quarrel in the Snow (routine)
- `slice_burned_letter` Ashes in the Grate (routine)
- `slice_frost_duel` Frost Against Fire (milestone)

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
# content/events/calendar.grim:244
@event kael_arrives
title: The Boy From the North
class: story
tone: eerie
trigger: auto
when: turn == 3
priority: 30
actor: kael
art: snow
tags: mystery hollowstar
chain: hollowstar
scene: A pale young man in a fur-lined coat standing at the door of the dining hall, frost spreading from his boots across the floor.
text: Mid-term, the dining hall doors open and frost crawls across the floor. A boy in a fur coat walks in, takes the empty seat beside you, and says nothing at all. The headmistress introduces him as Kael Dumont, a transfer. She does not say from where.
> left: Leave him be
  meet kael
  rel kael +tiny
  say: You eat in silence. When you leave, your cup of tea has frozen solid.
> right: Offer him the bread
  meet kael
  rel kael +medium
  say: He looks at the bread as if no one has offered him anything in a long time. "...Thank you." His voice sounds like wind over snow.
  flag kael_kindness
```

```grim
# content/events/chain_hollowstar.grim:91
@event hs_kael_truth
title: What Kael Is Running From
class: story
tone: eerie
when: clues(hollowstar) >= 1 and rel(kael) >= 15 and not flag(kael_told)
actor: kael
weight: 16
art: snow
tags: mystery hollowstar social
chain: hollowstar
scene: Two students sitting on the edge of the frozen boathouse jetty at night, one with frost in his hair, both looking down at the black water.
text: Kael sits with you on the boathouse jetty. "My family serve something under this lake," he says at last. "They sent me here to open its door. I came to stop them. Some nights I'm not sure which I'll actually do."
> left: "Then we stop them together."
  flag kael_told kael_ally
  rel kael +large
  spark kael +tiny
  alignment +small
  find kael_family
  if bond(kael) == "none":
    bond kael friend
  say: He looks at you for a long moment, and the frost on the jetty melts a little. "Together," he repeats, as if trying out a word from another language.
> right: Tell the headmistress
  flag kael_told reported_kael
  rel kael -huge
  rel isolde +medium
  alignment +tiny
  find kael_family
  say: The headmistress thanks you gravely. The next day Kael is moved to a room in the headmistress's tower. He doesn't look at you anymore.
```

```grim
# content/events/people_students.grim:58
@event lyra_study_rivalry
time: morning noon
title: Top of the Class
class: routine
tone: tense
trigger: social
actor: lyra
when: rel(lyra) > -24
weight: 10
repeat: 4
art: scroll
tags: social study rival
scene: Two students at opposite ends of a long library table, surrounded by towers of books, glaring over the tops of them.
text: The professors post this week's rankings, with an open paper this afternoon for anyone who wants to improve their place. Lyra is first. You're close enough to see the back of her head. She notices you noticing.
> left: Suggest studying together
  mood -tiny
  lore +small
  rel lyra +small
  say: "Together?" She considers this like a foreign custom. Then she pulls out a chair. She's an excellent, merciless study partner.
> right: Beat her outright
  challenge research easy:
    win:
      study +medium
      rel lyra +small
      renown +small
      say: The afternoon paper puts you first. Lyra stares at the list for a long time. Then she finds you and says, "Good." She means it.
    lose:
      study +tiny
      rel lyra -tiny
      say: You cram through lunch and come third. Lyra is still first. She doesn't gloat. That's worse.
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
