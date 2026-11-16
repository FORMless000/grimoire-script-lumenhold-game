# Brief

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **personal**.

## Cast

### Professor Hedda Brask (`brask`)

she/her · age 61 · professor · Faculty

*Professor of Beastcraft & Flight*

Teaches Beastcraft & Flight and is kinder to animals than to students, though the gap closes for anyone who mucks out without being asked.

**Voice:** Speaks to creatures in full sentences and to students in half ones. Every story ends with a bite and a moral. Laughs once a term, loudly.

**Traits:** dry, gentle, stubborn, brave · **Interests:** animals, flying, history

**Stats:** arcana 52, lore 48, alchemy 30, charm 16, vigor 70, guile 28, wealth 2

**Schedule:** The Familiar Stables (morning, afternoon, evening); The Great Hall (noon)

**On breaks:** The Familiar Stables (morning, afternoon, evening); The Beastcraft Field Station (noon, 40% of days)

**Relations:** Sister Amaranth +15, Old Maud +20, Professor Aldric Thorne +5

**Facts:**
- [surface] Teaches Beastcraft & Flight from the stables, and talks to every creature in them more kindly than to students. (`brask.beasts`)
- [personal] Every one of her stories ends with a bite and a moral. She laughs out loud about once a term. (`brask.stories`, known when `seen(brask_shovel) > 0`)
- [personal] The old barn owl in the stable loft has outlived three of her colleagues. She would not say which loss hurt most. (`brask.owl`, known when `seen(brask_night_owl) > 0`)
- [personal] She bows to the things that live in the Whisperwood, and believes it's why they have never bitten her. Much. (`brask.courtesies`, known when `seen(brask_trust) > 0`)
- [personal] Her barn owl moulted in the Whisperwood one winter, and she looked for the lost flight feather for a month. (`brask.feather`, known when `seen(item_quill_brask) > 0`)
- [personal] She never thinks less of a student for asking for help. She just remembers that they asked. (`brask.asking`, known when `seen(beast_lake_flight) > 0`)

### Nessa Quill (`nessa`)

she/her · age 19 · student year 1 · Duskgate · romanceable

*Editor of the Lumen Ledger*

Runs the student paper with a quill that writes on its own. Everyone is a story; some are just not finished yet.

**Voice:** Rapid, bossy, headline-shaped. Treats every conversation as an interview; goes very quiet when it's off the record.

**Traits:** nosy, idealistic, overworked, bold · **Interests:** writing, gossip, justice

**Stats:** arcana 14, lore 26, alchemy 8, charm 30, vigor 12, guile 24, wealth 2

**Schedule:** The Lumen Ledger Office (afternoon, evening, night); The Courtyard (noon); The Gilded Newt (evening, 25% of days)

**On breaks:** The Lumen Ledger Office (afternoon); The Village Square (evening, 50% of days); The Almanac Printer's (noon, afternoon); The Market Village (evening, 40% of days)

**Relations:** Bram Hollis -20, Corvin Ashby +10, Lyra Vaneshade -5

**Facts:**
- [surface] Editor of the Lumen Ledger, with a quill that writes on its own. (`nessa.editor`)
- [personal] Left unsupervised, her quill starts inventing the news. (`nessa.quill`, known when `seen(nessa_burnout) > 0`)
- [personal] Nobody has interviewed the headmistress in twenty years. She means to be the first. (`nessa.interview`, known when `rel(nessa) >= 12`)
- [personal] She would chain herself to the printing press before letting anyone shut the Ledger. (`nessa.press`, known when `seen(nessa_paper_threatened) > 0`)
- [personal] She plants one error in every proof she asks you to check, to see whether you'll find it. (`nessa.planted`, known when `seen(nessa_fact_check) > 0`)
- [personal] She learned to set type backwards before she could write forwards, above her mother's press in the countryside. At the type case she doesn't say a single headline. (`nessa.type`, known when `seen(almanac_type_case) > 0`)
- [personal] Her first story was a notice for a lost dog called Biscuit, set when she was seven. The dog came home. She has been unbearable ever since, and says it's the job. (`nessa.first_story`, known when `seen(almanac_first_notice) > 0`)
- [personal] She left the valley because nothing in it was ever news. Lately she wonders whether that was the news. (`nessa.why_left`, known when `seen(nessa_country_green) > 0`)

### Professor Aldric Thorne (`thorne`)

he/him · age 68 · professor · Faculty

*Master of Arcana*

Severe, exacting, allergic to flattery. Rumoured to have once out-dueled a storm.

**Voice:** Terse, precise, allergic to flattery. "Hm." is a full sentence. Praise arrives disguised as criticism, and very rarely.

**Traits:** severe, exacting, dry, warm · **Interests:** duelling, roses, teaching, chess

**Stats:** arcana 88, lore 74, alchemy 30, charm 22, vigor 40, guile 36, wealth 4

**Schedule:** The Lecture Tower (morning, afternoon); The Great Hall (noon); The Library (evening, 50% of days)

**On breaks:** The Library (afternoon, evening)

**Relations:** Headmistress Isolde Marrow +30, Old Maud +20

**Facts:**
- [surface] Rumoured to have once out-duelled a storm. (`thorne.storm`)
- [personal] He lost to the storm, badly. Losing well, he says, is the only thing worth teaching. (`thorne.lost`, known when `seen(thorne_storm_story) > 0`)
- [personal] A flamboyant old wizard in purple has wanted a rematch with him for forty years. (`thorne.rival`, known when `seen(thorne_old_rival) > 0`)
- [personal] He writes very few letters of recommendation, and the Conclave reads every one. (`thorne.letters`, known when `rel(thorne) >= 18`)
- [personal] "You're better than this" is, from him, not a compliment. He says so himself: it's an accusation. (`thorne.accusation`, known when `seen(thorne_disappointed) > 0`)

## Place: The Familiar Stables (`stables`)

grounds · public · open morning, afternoon, evening

Hippogriffs, a sulky griffon chick, owls in the rafters and Professor Brask, who talks to all of them more kindly than to students.

**Usually here:** Tobias Fennick (evening); Professor Hedda Brask (morning, afternoon, evening)

## Already written here (67)

- `nessa_interview_prep` Twenty Years (routine)
- `nessa_fact_check` Fact-Check (routine)
- `nessa_quill_loose` The Quill Gets Loose (routine)
- `brk_stables_round` The Feeding Round (routine)
- `ledger_pie_scoop` The Case of the Missing Pies (routine)
- `ledger_bram_story` The Prefect's Bribes (routine)
- `ledger_deadline` Deadline Night (routine)
- `thorne_old_rival` An Old Rival (routine)
- `thorne_roses` The Professor's Roses (routine)
- `thorne_shaking_hands` Thorne's Hands (routine)
- `stables_hippogriff_grooming` Feathers the Wrong Way (routine)
- `stables_tack_room` The Tack Room (routine)
- `nessa_headmistress_interview` The Impossible Interview (routine)
- `nessa_typo` A Catastrophic Typo (routine)
- `nessa_burnout` The Editor Sleeps (routine)
- `brask_half_sentences` Pliers. Not Those. (routine)
- `brask_laugh` A Bite and a Moral (routine)
- `brask_shovel` Hands Wanted (routine)
- `brask_night_owl` The Sick Owl (routine)
- `brask_trust` Old Courtesies (milestone)
- `wa_thorne_note` By Hand, Not by Owl (story)
- `stables_hippogriff` Bow to the Hippogriff (routine)
- `stables_dragon_egg` An Egg in the Hay (routine)
- `stables_night_shift` The Sick Pegasus (routine)
- `nudge_quickquill` How's My Quill? (routine)
- `know_brask_asking` Out of Your Depth (routine)
- `heard_nessa_isolde` Nessa on the Headmistress (routine)
- `almanac_type_case` Backwards and Upside Down (routine)
- `almanac_first_notice` Lost: One Brown Dog (routine)
- `almanac_short_page` A Page Short (routine)
- `nessa_country_green` Nothing Ever Happens Here (routine)
- `thorne_intro` The First Question (routine)
- `thorne_office_hours` Office Hours (routine)
- `thorne_storm_story` The Storm Duel (routine)
- `thorne_recommendation` A Letter of Recommendation (routine)
- `thorne_disappointed` A Word in Private (routine)
- `brask_intro` Shovel. There. Go. (routine)
- `nessa_intro` First Impressions (routine)
- `nessa_gossip_column` You're in the Gossip Column (routine)
- `nessa_source` The Source (routine)
- … and 27 more (`grim query event 'place == "stables"'`)

## Lore

- **Quill** (`quill_press`, soft): Nessa grew up above her mother's print shop off the market green in the countryside, the Almanac Printer's, which prints the valley's almanac, its notices and its funeral cards. Mrs Quill works the hand press, ink to the elbows. Nessa set type before she could write, and her first story was a lost-dog notice for a dog called Biscuit, who came home. The attic holds a century of almanacs; every seventh year's is a page short, always the harvest page, and Mrs Quill says the old press always did that.
- **Professor Marisol** (`professors`, soft): Professor Marisol teaches Tidecalling and keeps the lake calm on exam days. Professor Vey teaches Illusion and grades on whether you fooled her. Professor Brask teaches Beastcraft and is kinder to animals than to students.

## Style examples

```grim
# content/events/fixtures_2.grim:225
@event brask_half_sentences
title: Pliers. Not Those.
place: stables
class: routine
tone: tense
actor: brask
when: met(brask) and rel(brask) >= 3
weight: 8
repeat: 2
art: paw
tags: social work
scene: A stable stall, a professor holding a hippogriff's wing open with both arms, a splinter of fence in the feathers, a student by a tray of tools.
text: {~Professor Brask has a hippogriff's wing pinned open with both arms and a splinter of fence rail in its feathers. "Pliers," she says. "Not those. The. Yes. No. Hold the." The hippogriff has opinions about all of it.|A griffin has a thorn deep in its forepaw and Brask has the paw in her lap. "Salve. Then the. Then hold. Not there." She doesn't look round. The tray holds eleven things.|An owl with a bent flight feather, and Brask's hands full of owl. "The splint. The little. Tape. No, the." The owl looks at you as if it, too, would like a whole sentence.}
> left: Work out what she means
  challenge research apprentice:
    win:
      vigor +small
      rel brask +small
      say: {~You read her the way she reads them: which hand is free, what she's looking at, what comes next. The splinter comes out clean. Brask nods once, which from her is a speech.|Salve, then the bandage, then you hold the paw where she was looking. It's done in a minute. "Huh," says Brask, and later you hear her tell the griffin about you, in a full sentence.|Splint, tape, the little scissors, in that order, before she's finished asking. The owl stops complaining. "Good," says Brask. "Most people hand me the big scissors."}
    lose:
      health -small
      rel brask +tiny
      say: {~You hand her the wrong pliers and the hippogriff takes the opportunity to bite you. Brask gets the splinter out one-handed and says, "Moral there."|You hold the paw where she wasn't looking. The griffin explains your mistake with its other paw. Brask finishes the job and binds your hand too, briskly.|The owl gets loose and spends ten minutes on the beams, and so do you. Brask fixes the feather when it comes down, and two words on you, both short.}
> right: Ask her to say the whole sentence
  rel brask +tiny
  study -tiny
  say: {~"Hm," says Brask, and tells you, slowly, all of it, with the history of every tool and the creature it was last used on. You never forget it. You are late for everything.|She says the whole sentence, and the next three, and the next thirty, and the splinter comes out while she's talking. Your afternoon goes with it. She doesn't think less of you for asking. She does remember that you asked.|"Oh," she says, surprised. "The splint. Obviously." Then she explains why it's obvious for half an hour.}
```

## Rules

Validators check the first group automatically; the critic (a separate pass, without the author's reasoning) checks the rest, raising an issue only where it can name a concrete fix. A batch is accepted when everything passes.

**Automatic** (`grim batch`)
- `grim fmt --check`, `grim lint` with 0 errors (references, vocabularies, ages, canon lint), `grim balance --quick` with 0 invariant failures.
- New events appear in simulation (not in "never seen") unless the report says they're deliberately rare.
- `i18n zh-CN` complete for the batch, tokens intact.

**Critic**
- **Canon:** names, places, facts and history match the worldbook; nothing contradicts hard lore (`content/world/lore/hard/`); characters are where their `schedule:` puts them, or there's a reason they aren't; a new proper noun comes with a soft `@lore` entry.
- **Voice:** each speaker sounds like their `voice:` line (`style.md`) and acts on their traits and facts.
- **Tone and safety** (`style.md`): warm, witty, slightly melancholy; humour from specifics, never winking at the reader; no gore, nothing explicit; every character an adult, romance only between adults; no real-world brands, modern slang or real month names.
- **Class rules** (`classes.md`): `routine` has a real trade-off, neither option obviously better; `incident` offers agency (mitigate or accept); `windfall` is small and funny; `milestone` is earned and given room to breathe; `story` is never jokey at the climax.
- **Plot safety:** only hard-canon story events `find` a key clue or `advance` an arc clock.
- **Choices** (`costs.md`): no option is obviously best; every cost is one the `say:` shows (body → health, spirits → mood, purchases → crowns, skipped work → `study`/`perform`/`progress`, a person let down → `rel`, a moral side → alignment); every option has its own specific `say:`, never "You gain 5 mood"; prose never mentions numbers or mechanics; labels under about 36 characters, imperative or first person.
- **Alignment** (`costs.md`): a choice with moral weight moves `alignment`; ordinary choices don't; no counter is used as plot progress (plot gates read `clock(arc)` and `clues(arc)`).
- **Conflict and climax** (plot and arc cards, and any card where characters clash; `style.md`): the confrontation happens on the page, out loud, each side saying something only they would say (a clash reported afterwards or left to a hint is a fix to raise); the opposition acts, each return bolder than the last; every fight sits beside a way that isn't a fight; a loss costs something real and leaves a way back. In a climax: one card names the companions once, each planted clue or item pays off (and the beat still happens when it was missed), and the reward shows at once.
- **Checks** (`checks.md`): the difficulty is what you're actually up against (the opponent or the obstacle), not who is on the card or when it shows; no reason counted twice (a strong foe written as `slim`, a coin toss as a high rung); a gamble is on `luck`; grandmaster+ only on story or milestone cards, with `partial:` and a route without the check; a loss that ends the run has `partial:` or `likely`+; the kind fits the action and the skill the obstacle; `using` only when it differs from the kind's default; `exam` only in a course; pure luck is `chance <word>`, and a roll a skill or relationship should move isn't a bare `chance`.
- **Spell options** (`up[spell]`): the option does what the spell's `desc` says (`content/world/spells.grim`) and is a clean way through the scene; the text and the other options never assume the player knows the spell, so without it the card reads as an ordinary problem. Mana (and a forbidden spell's alignment) is taken automatically; prose never names it.
- **Repeats** (pool events with `repeat:`; `pools.md`), seen several times in a run:
  - An "again" line keys on `seen(<own id>) > 1`, not on a counter other cards move; no variant assumes how an earlier showing ended, and every variant of a `say:` shows its option's cost.
  - The variation lines (`{a|b|c}`, `{&…}`, `{~…}`, `{season=…}`, `{final_year: …|…}`) make each showing read differently, and the fourth showing is still welcome: the joke doesn't wear out, nothing hinges on a one-time surprise.
  - Cast roles are re-filled each showing: a sequence that implies the same companion as last time is a bug. Classmate roles are `tagged(<role>, student)`.
  - Sequences count showings, not choices: a sequence line describing a choice's payoff (readers you helped, respect you earned) is a bug unless gated on state.
  - Variation is linked (one mode, one count per card; the lint checks counts): variant *k* of a `say:` fits variant *k* of the text, and a sequence's step *k* fits the *k*-th showing. A set that contradicts itself, or a payoff whose setup sits at a different position, is a bug.
- **Items** (design §9.3): an object the prose mentions that isn't an `@item` is never "used" or "got" as inventory. An item option is that item's moment in the scene: owning the thing pays off without being free (it still trades), at most one per card. Worn effects act only in fights; nothing on a card reads what you wear except `worn()` gates. No recipes or ingredients.
- **Continuity:**
  - What the text promises happens: money, an item, a payback or a later scene that a `say:` mentions is in the effects (`gold`, `give`, `queue … in N`).
  - A `say:` that reads a counter or flag comes before the statement that changes it, because its text is filled in at that point.
  - Time, weather and place agree with when the card can show: `slot:` or `{slot == …}`, `{season == …}`, `{off_campus: …}` for a break spent away (a night scene without `slot:`, snow outside winter, the castle on a break spent at home).
  - A callback to an earlier scene gates on `seen(<that card>) > 0`. A `learn` that another card can teach first gates on `not knows(<fact>)`. A thing found once doesn't go on glinting after it's found.
  - Numbers of years and ages agree with `content/world/timeline.grim` and the facts (how long the Ledger has run, how old a tree's ring is).
- **Gating:** `when`, `level:`, `rank:`, `place:` and `plan:` make sense together (a club-practice event isn't gated to a place the club doesn't use; a level-3 class doesn't read like a first lesson); `when` conditions are reachable; queued events are queued by something; flags read are set somewhere (`grim reach` proves it; lint fails on an unreachable event).
- **Wiring** (`pools.md`, "Where a card lives"): read a card with what its group gives it (`grim show <id>` prints the compiled card and where each property came from). A card joins its group and writes only what differs: the place's, track's or plan's `pool:`; a `@thread` for a storyline, from a template (`story`, `quest`, `scene`) when its shape is one of theirs; an `@appointment` for something on a schedule; a `@cond` for a recurring condition. A card that copies its group's lines, a storyline wired card by card where a template fits, or a schedule faked with a tricky `when` is a fix to raise.
- **Leads:** a hint the player has to follow up later (a card at a place, slot or track waiting on this card's flag) leaves a side-thread lead in the Clues panel; `grim leads` shows none missing.
- **Duplication:** no event repeats an existing one's premise, even in different words, and two events at the same place in a batch aren't the same scene twice. Checked with `retrieve related` on each new card (or a justified skip), its top hits differing in premise, options and punchline; `dupes`, `brief` and grep (`grim query event --grep <word>`) alone are not enough.
- **Length** (`style.md`): `text` under 400 characters, two to four sentences ending on the moment of choice; `say` under 300; labels under 36.


> How a choice trades (design §8.4; playtest 2, A3). Sizes: `presets.md`.

## The rule

- **No option is obviously best.** Options trade: they give different things, or one costs or risks something the other doesn't. A choice between two good things or two bad things beats an obvious one. On a `routine` card the lint fails one option at least as good as another on every value and better on one, with no risk on either side.
- **A free option is honest** when it gives up what the other offers (an evening of study instead of one with friends). Don't add a cost to make it "trade": the other option is its cost.
- **A cost is something the scene shows.** If the `say:` doesn't show the player paying it (tired legs, a spent crown, a friend's cool look, a missed lecture), it isn't a cost: drop it, pick the one the scene shows, or write the line that shows it. On a card with variants, every variant of the `say:` shows it. A cost the scene doesn't show is a defect, not a fix.
- **Each option stays within ±1.5 medium-equivalents** (the weights in `balance.grim`). Typical routine shape: a small gain against a tiny or small cost the scene shows, or two different gains.
- The lint reads alignment as a direction, not a gain: two options that move it differently are never one "better". A gamble (`chance`, a check, a penalty queued at odds) or an option that leads somewhere (a state, a flag, a queued card) is never "obviously best" either.

## What each value stands for

| Value | It is | Costs it when the scene shows | Gains it when |
|---|---|---|---|
| `health` | the body | exertion, cold, wet, injury, a fall, lost sleep, illness, a burn, a bite | rest, food, warmth, a healer, sleep |
| `mood` | spirits | embarrassment, guilt, worry, boredom, disappointment, homesickness, a row, bad news | fun, beauty, praise, kindness, a win, a good meal with friends |
| `mana` | the magic you can spend | casting or channelling, a ward that drinks from you, a spell gone wrong | rest after magic, a ley line, a potion; it refills monthly |
| `renown` | being talked about | public embarrassment, backing down where people watch, a scandal, being forgotten | a public feat, a byline, a performance, a famous friend; it fades monthly |
| `alignment` | Lumen ↔ Hollow | Hollow (`-`): cruelty, theft, cheating, lying for gain, exploiting someone, reaching for the Star | Lumen (`+`): honesty, protection, generosity at a real cost |
| `gold` (crowns) | your purse | what you buy, pay, lose or are fined (the prose names it) | wages, tips, winnings, a gift, a find |
| `arcana` `lore` `alchemy` `charm` `vigor` `guile` | skills (XP) | never a cost (rust is the engine's; the lint rejects a card that lowers one) | practice that matches the scene: spellcraft, study, brewing, persuasion, exertion and duelling, sneaking and noticing |

**Track and relationship costs** (often the honest ones):

| Statement | Use it when |
|---|---|
| `study <course> -tiny` / `study -tiny` | you skip a lecture, a revision night, a class's homework: that course's exam readiness drops (no course: every enrolled course) |
| `study <course> +tiny` / `study +tiny` | extra work beyond class: a card's study gain is `+tiny`. Preparation comes mostly from routine sources (each class month +3, +5 with a check won in class, the library's revision card +3), so exams stay predictable. A larger gain needs a matching price (a night, money, a favour); study costs elsewhere balance the gains. Never `grades` |
| `perform <track> -tiny` | you slack, leave early or annoy the boss at a club or job (`perform track` in the track's own cards) |
| `progress thesis -tiny` | the thesis waits while you do something else |
| `rel <npc> -tiny` / `spark <npc> -tiny` | you snub, disappoint, refuse or embarrass someone; a romantic moment goes flat (romance is `spark`, never `love`) |

## Alignment (conscience)

- A choice with moral weight moves `alignment`: cruel, greedy, dishonest, exploiting someone, or reaching for the Star's power → `-tiny`…`-medium` (Hollow); honest, protective or selfless at a real cost → `+tiny`…`+medium` (Lumen). Usually `tiny`/`small`.
- A tempting option (keep the purse, read the letter, cheat the game, take the shortcut someone pays for) puts `alignment -tiny`/`-small` on the tempting side; `alignment +tiny` on the honest side only when it costs something real. Ordinary prudence (going to bed, saying no to a party) has no moral weight.
- Events for players deep in either side gate on `alignment >= 30` / `<= -30` (±60 for rare ones).
- A spell with `alignment:` (Sleight, and every forbidden spell) takes it on each cast, automatically. Its `up[spell]` option adds none of its own unless the act is worse than the cast.
- Never use alignment, or any counter, as plot progress: plot gates read `clock(<arc>)` (the schedule) and `clues(<arc>)` (engagement).

## Before you finish an option

1. What does the player give up? If it's the other option, the option can be free.
2. Does the `say:` show the cost? If not, change the cost or the line.
3. Is there a moral side? Then alignment moves.
4. Does it skip study, work, practice or a person? Use `study`, `perform`, `progress` or `rel`, not a vague `mood -tiny`.
