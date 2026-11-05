# Brief

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **personal**.

## Cast

### Mabel Thistlewood (`mabel`)

she/her · age 63 · villager · none

*Keeper of the tea shop*

Forty kinds of tea, three kinds of cake, and a talent for reading your mood from the way you open her door.

**Voice:** Warm and brisk; finishes your order for you. Reads moods like weather and says so. Calls students "petal" and means something different every time.

**Traits:** perceptive, warm, nosy, patient · **Interests:** cooking, gossip, music

**Stats:** arcana 14, lore 30, alchemy 36, charm 58, vigor 20, guile 40, wealth 3

**Schedule:** Mabel's Tea Shop (morning, noon, afternoon); The Village Square (evening)

**Relations:** Mr Alder Grimsby +20, Old Pell +15

**Facts:**
- [surface] Keeps the tea shop in the village: forty kinds of tea, three kinds of cake. (`mabel.teashop`)
- [personal] She reads your mood from the way you open her door, and is rarely wrong. (`mabel.door`, known when `seen(mabel_intro) > 0`)
- [personal] She sends tins of tea up to the castle on the barge for students she's worried about, and refuses payment for them. (`mabel.tins`, known when `seen(mabel_parcel) > 0`)
- [personal] The cups on the hooks behind her counter belong to her regulars, living and dead. She remembers every one of them. (`mabel.cups`, known when `seen(mabel_cup) > 0`)
- [surface] Calls everyone "petal", and means it more for some than others. (`mabel.petal`)
- [personal] Beside her three cakes there is sometimes a fourth, experimental and free, and she keeps a card on each: its name, the date, and the survivors. (`mabel.fourth_cake`, known when `seen(mabels_fourth_cake) > 0`)
- [personal] Her range goes out whenever the wind is in the north. Anyone who helps her light it is "staff, near enough", and carries the milk. (`mabel.range`, known when `seen(mabels_cold_range) > 0`)

### Mr Alder Grimsby (`grimsby`)

he/him · age 72 · villager · none

*Bookseller*

Keeps a bookshop so crowded the shelves lean on each other. He will find anything except what you came in for, which is often what you needed.

**Voice:** Vague, courteous, enthusiastic about the wrong thing. Recommends books by their smell. Remembers what you read three years ago and nothing about what you asked for today.

**Traits:** eccentric, kind, distant, curious · **Interests:** books, history, maps

**Stats:** arcana 20, lore 74, alchemy 12, charm 30, vigor 10, guile 22, wealth 2

**Schedule:** Grimsby's Books (noon, afternoon); The Village Square (evening)

**Relations:** Mabel Thistlewood +20

**Facts:**
- [surface] Keeps the village bookshop. He will find anything except what you came in for. (`grimsby.books`)
- [personal] The book he gives you instead is, more often than not, the one you needed. (`grimsby.wrong`, known when `seen(grimsby_intro) > 0`)
- [personal] He posts books to students he thinks need them, on credit, and has never once chased a debt. (`grimsby.parcels`, known when `seen(grimsby_parcel) > 0`)
- [personal] He has a weakness for lighthouses, and when he closes the shop, it is usually to go and look at one. (`grimsby.lighthouses`, known when `seen(grimsby_mind_the_shop) > 0`)
- [personal] He finds a book by its smell. The right book, he says, smells right. (`grimsby.nose`, known when `seen(grimsbys_by_the_nose) > 0`)
- [personal] Above the shop is a floor of remainders nobody mentions, up a ladder whose third and fourth rungs break. (`grimsby.upper_floor`, known when `seen(grimsbys_upper_floor) > 0`)

### Professor Ines Marisol (`marisol`)

she/her · age 39 · professor · Faculty

*Professor of Tidecalling*

Teaches the tidecalling half of Evocation, waist-deep in the lake at dawn. Keeps the lake calm on exam days and reads poetry under a dry patch of air when it rains.

**Voice:** Soft and unhurried until there's weather; then she whoops. Quotes poems about water and forgets the last line. Believes cold water is good for everyone.

**Traits:** dreamy, warm, reckless, curious · **Interests:** tides, music, writing

**Stats:** arcana 70, lore 56, alchemy 18, charm 40, guile 20, vigor 52, wealth 2

**Schedule:** The Lakeshore (morning, evening); The Lecture Tower (afternoon)

**On breaks:** The Lakeshore (morning, evening)

**Relations:** Professor Ottilie Vey +20, Professor Aldric Thorne +15

**Facts:**
- [surface] Teaches the tidecalling half of Evocation, waist-deep in the lake at dawn, and keeps the lake calm on exam days. (`marisol.tides`)
- [personal] She reads poems about water in the rain, under a dry patch of air, and never remembers their last lines. (`marisol.poems`, known when `seen(marisol_intro) > 0`)
- [personal] She goes out into the worst storms of the year on purpose. She says nobody learns tides on a calm day. (`marisol.storms`, known when `seen(marisol_storm) > 0`)
- [personal] She wrote her own tidecalling into the margins of a book of poems when she was a student, and still teaches from it. (`marisol.margins`, known when `seen(marisol_trust) > 0`)
- [personal] She stays in the lake when there is ice at the edges, and whoops like a child whenever a student's water rises. (`marisol.ice`, known when `seen(marisol_cold_water) > 0`)
- [personal] She says the lake's water spirits always cheat, and that asking them nicely not to is the whole point of tidecalling. (`marisol.spirits`, known when `seen(tide_water_spirit_race) > 0`)

### Professor Ottilie Vey (`vey`)

she/her · age 46 · professor · Faculty

*Professor of Illusion & Glamour*

Teaches Illusion & Glamour and grades on whether you fooled her. She is very hard to fool, and very generous to the few who manage it.

**Voice:** Amused, theatrical, a little too observant. Asks questions she already knows the answer to, to see what you'll do. Delighted by anyone who fools her.

**Traits:** charming, perceptive, sly, funny · **Interests:** theatre, painting, cards

**Stats:** arcana 60, lore 50, alchemy 20, charm 78, guile 70, vigor 22, wealth 3

**Schedule:** The Lecture Tower (morning, afternoon); The Great Hall (noon)

**On breaks:** away

**Relations:** Professor Aldric Thorne +5, Professor Ines Marisol +20

**Facts:**
- [surface] Teaches Illusion & Glamour and grades on whether you fooled her. (`vey.illusion`)
- [personal] She tests students in corridors, unannounced, with tea that isn't there. She keeps score. (`vey.tests`, known when `seen(vey_pop_quiz) > 0`)
- [personal] She produces the faculty revue every year, and has never once let Professor Thorne refuse a part. (`vey.revue`, known when `seen(vey_revue) > 0`)
- [personal] She doesn't use the mirror charm in public. Once, her reflection didn't come back for a week. (`vey.mirror`, known when `seen(vey_trust) > 0`)
- [personal] She teaches that sight is easy to fool; smell is where liars are caught. (`vey.smell`, known when `seen(illu_bread_smell) > 0`)
- [personal] She has every student glamour their own face first: a glamour you can't hold on yourself, she says, won't hold on anyone. (`vey.own_face`, known when `seen(illu_one_small_change) > 0`)

### Professor Hedda Brask (`brask`)

she/her · age 61 · professor · Faculty

*Professor of Beastcraft & Flight*

Teaches Beastcraft & Flight and is kinder to animals than to students, though the gap closes for anyone who mucks out without being asked.

**Voice:** Speaks to creatures in full sentences and to students in half ones. Every story ends with a bite and a moral. Laughs once a term, loudly.

**Traits:** dry, gentle, stubborn, brave · **Interests:** animals, flying, history

**Stats:** arcana 52, lore 48, alchemy 30, charm 16, vigor 70, guile 28, wealth 2

**Schedule:** The Familiar Stables (morning, afternoon, evening); The Great Hall (noon)

**On breaks:** The Familiar Stables (morning, afternoon, evening)

**Relations:** Sister Amaranth +15, Old Maud +20, Professor Aldric Thorne +5

**Facts:**
- [surface] Teaches Beastcraft & Flight from the stables, and talks to every creature in them more kindly than to students. (`brask.beasts`)
- [personal] Every one of her stories ends with a bite and a moral. She laughs out loud about once a term. (`brask.stories`, known when `seen(brask_shovel) > 0`)
- [personal] The old barn owl in the stable loft has outlived three of her colleagues. She would not say which loss hurt most. (`brask.owl`, known when `seen(brask_night_owl) > 0`)
- [personal] She bows to the things that live in the Whisperwood, and believes it's why they have never bitten her. Much. (`brask.courtesies`, known when `seen(brask_trust) > 0`)
- [personal] Her barn owl moulted in the Whisperwood one winter, and she looked for the lost flight feather for a month. (`brask.feather`, known when `seen(item_quill_brask) > 0`)
- [personal] She never thinks less of a student for asking for help. She just remembers that they asked. (`brask.asking`, known when `seen(beast_lake_flight) > 0`)

### Sister Amaranth (`amaranth`)

she/her · age 54 · staff · Faculty

*Healer of the infirmary*

Runs the infirmary with warming charms, tonics and no patience for excuses. Teaches the healing half of Alchemy & Healing.

**Voice:** Short sentences, delivered while doing something else. Believes no excuse, forgives most things anyway. Praise comes as an instruction ("Keep doing that.").

**Traits:** severe, honest, patient, warm · **Interests:** plants, soup, history

**Stats:** arcana 40, lore 52, alchemy 80, charm 24, vigor 34, guile 30, wealth 2

**Schedule:** The Alchemy Laboratory (morning); The Infirmary (afternoon, evening, night); The Great Hall (noon)

**On breaks:** The Infirmary (afternoon, evening, night)

**Relations:** Old Maud +25, Professor Aldric Thorne +10, Professor Hedda Brask +15

**Facts:**
- [surface] Runs the infirmary and teaches the healing half of Alchemy & Healing. Believes no excuse. (`amaranth.healer`)
- [personal] She treats the true version of an injury faster than the story you tell her, and she always knows which one you told. (`amaranth.truth`, known when `seen(amaranth_intro) > 0`)
- [personal] She does evening rounds of every bed herself, and has never once missed one. (`amaranth.rounds`, known when `seen(amaranth_rounds) > 0`)
- [personal] Only a handful of students have ever been trusted with the key to her tonic cupboard. (`amaranth.key`, known when `seen(amaranth_trust) > 0`)
- [personal] She counts every remedy twice, because the second count is the true one, and keeps a black jar on the top shelf for a curse not seen since her first year. (`amaranth.count`, known when `seen(brk_amaranth_restock) > 0`)
- [personal] She leaves the tonic cupboard open at teatime on purpose, to see who will help themselves, and writes their names in a book. (`amaranth.cupboard`, known when `seen(infirmary_tonic_cupboard) > 0`)
- [personal] She keeps a book of the remedies her students invented, written out in her own square hand. (`amaranth.book`, known when `seen(alch_original_remedy) > 0`)

### Old Pell (`pell`)

he/him · age 77 · villager · none

*Apothecary of Pell & Daughters*

Taught three generations of the village to count drops. His daughters run the counter now; he runs the drawers, and the drawers are never wrong.

**Voice:** Gruff, precise, counts aloud. Never apologises; corrects a label instead. Trusts people who measure twice, and says so once a decade.

**Traits:** exacting, proud, loyal, stubborn · **Interests:** plants, rules, money

**Stats:** arcana 22, lore 46, alchemy 76, charm 14, vigor 16, guile 30, wealth 3

**Schedule:** Pell & Daughters (morning, afternoon); The Village Square (evening)

**Relations:** Mabel Thistlewood +15, Grisk -20

**Facts:**
- [surface] Runs the drawers at Pell & Daughters. He taught three generations of the village to count drops. (`pell.apothecary`)
- [personal] He makes every new clerk count aloud. He trusts people who measure twice. (`pell.counting`, known when `seen(pell_count_drops) > 0`)
- [personal] His daughters run the counter and want the shop to change; he wants it to be fifty years ago. They're all secretly proud of each other. (`pell.daughters`, known when `seen(pell_daughters) > 0`)
- [personal] His brass measuring spoon hasn't been wrong in forty years. His daughters learned to measure on it, and say it's theirs. (`pell.spoon`, known when `seen(offer_measuring_spoon) > 0`)
- [personal] His oldest drawer holds a yellowed card for a draught "of your own strength", in a hand older than his. He has labelled it "Not yet." (`pell.oldest_drawer`, known when `seen(pell_oldest_drawer) > 0`)
- [personal] Some of his thousand drawers hum. He relabels them himself, in a precise hand: ASK FIRST, NOT TODAY. (`pell.humming`, known when `seen(pell_apothecary_humming_drawer) > 0`)

## Already written here (46)

- `amaranth_quit` Sister Amaranth's Remedy (incident)
- `mabel_closing_up` Turning the Sign (routine)
- `mabel_wrong_pot` The Wrong Pot (routine)
- `mabel_empty_hook` An Empty Hook (routine)
- `grimsby_lighthouse_walk` Gone to Look at One (routine)
- `grimsby_read_aloud` The Small Print (routine)
- `marisol_exam_calm` Holding the Lake Still (routine)
- `marisol_lost_satchel` Ask, Don't Fetch (routine)
- `vey_lunch_dare` Fool Me Once (routine)
- `vey_rehearsal` An Audience of Nobody (routine)
- `brask_half_sentences` Pliers. Not Those. (routine)
- `brask_laugh` A Bite and a Moral (routine)
- `amaranth_tea_break` Five Minutes Sitting Down (routine)
- `pell_castle_errand` Forty Drops, Up the Hill (routine)
- `amaranth_intro` No Excuses (routine)
- `amaranth_rounds` Evening Rounds (routine)
- `amaranth_orders` Doctor's Orders (routine)
- `amaranth_trust` The Cupboard Key (milestone)
- `brask_shovel` Hands Wanted (routine)
- `brask_night_owl` The Sick Owl (routine)
- `brask_trust` Old Courtesies (milestone)
- `vey_pop_quiz` Is It There? (routine)
- `vey_revue` The Faculty Revue (routine)
- `vey_trust` The Mirror Trick (milestone)
- `marisol_intro` A Dry Patch of Air (routine)
- `marisol_cold_water` Cold Water Is Good for You (routine)
- `marisol_storm` Weather (routine)
- `marisol_trust` The Last Line (milestone)
- `mabel_intro` The Way You Open a Door (routine)
- `mabel_parcel` A Tin From Mabel (routine)
- `mabel_cup` Your Cup on the Hook (milestone)
- `grimsby_intro` Not That One (routine)
- `grimsby_parcel` The Wrong Book, Posted (routine)
- `grimsby_mind_the_shop` Mind the Shop (milestone)
- `pell_intro` A Thousand Drawers (routine)
- `pell_count_drops` Count Them Aloud (routine)
- `pell_daughters` Pell & Daughters (milestone)
- `heard_mabel_grimsby` Mabel on Grimsby (routine)
- `heard_marisol_vey` Marisol on Vey (routine)
- `heard_grimsby_mabel` Grimsby on Mabel (routine)
- … and 6 more (`grim query event 'actor == "mabel"'`)

## Lore

- **Pell & Daughters** (`pell_and_daughters`, soft): The village apothecary, with a thousand labelled drawers. Old Pell taught three generations to count drops; his daughters keep the counter now, and he counts aloud behind them. It buys what foragers bring out of the Whisperwood.
- **Professor Marisol** (`professors`, soft): Professor Marisol teaches Tidecalling and keeps the lake calm on exam days. Professor Vey teaches Illusion and grades on whether you fooled her. Professor Brask teaches Beastcraft and is kinder to animals than to students.
- **infirmary** (`infirmary`, soft): Sister Amaranth runs the infirmary with warming charms, tonics and no patience for excuses. Lake Fever comes from swimming where you shouldn't; curse-cold comes from worse.

## Style examples

```grim
# content/events/fixtures_2.grim:174
@event vey_lunch_dare
title: Fool Me Once
class: routine
tone: light
trigger: social
actor: vey
when: rel(vey) >= 5
weight: 10
repeat: 3
art: mask
tags: social study
scene: A long hall at lunch, a professor in a theatrical scarf leaning across a table towards a student, a salt cellar between them.
text: {seen(vey_lunch_dare) > 1: {~Vey again, across your lunch, with the same smile. "We're even," she says, "or I'm ahead. Shall we see?"|"Pudding's in five minutes," says Professor Vey, sitting down. "That's plenty of time to deceive a professor."|Vey drops into the seat opposite with her chin on her hands. "The pudding," she says, "is a custard tart. Probably. Fool me."}|Professor Vey sits down opposite you at lunch, which nobody does. "One trick," she says. "Any trick. Fool me before the pudding and I'll owe you one." She folds her hands and watches you with enormous interest.}
> left: Try to fool her
  challenge deceive journeyman:
    win:
      rel vey +medium
      charm +small
      say: {~You glamour the salt cellar into a pepper pot and leave the pepper pot alone. She picks up the wrong one, tastes it and laughs out loud, and the whole table turns. "Owed," she says. "Owed."|You don't do any magic at all; you only say that you have. She spends the pudding checking everything on the table. "Oh," she says, when she realises. "Oh, that's good."|She smells the trick before she sees it, and you'd planned for that. She claps, once, delighted. "A student who knows about the nose," she says. "Come to my office hours. Bring that."}
    lose:
      rel vey +tiny
      mood -tiny
      say: {~She sniffs, smiles and taps the real salt cellar without looking. "Lavender," she says. "Your glamours always smell of lavender." She seems to like you more for trying.|"Nearly," she says, which is worse than "no". She takes your pudding as forfeit, and eats it slowly.|She sees it at once and tells you why, in detail, over the pudding. It's the most useful lesson you've had all term.}
> right: Plead an empty head and eat your lunch
  mood +tiny
  rel vey -tiny
  say: {~"A sensible answer," says Vey, "and a boring one." She steals a roll off your plate as she goes, or seems to. Later you find it still there.|She sighs theatrically and moves on to the next table, where a second-year is already sweating.|"Another time," she says. "I'll know when you're ready. You'll smell of lavender."}
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
- **Repeats** (pool events with `repeat:`; `pools.md`), seen 3–6 times in a run:
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
