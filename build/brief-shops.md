# Brief: shops: buying kit, tailor, pawnbroker, wands

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **personal**.

## Cast

### Mir Ten (`mir`)

they/them · age 19 · student year 1 · Brasswick · romanceable

*Artificer of questionable inventions*

Smells permanently of solder and ozone. Has built a clockwork owl, a self-stirring cauldron and at least one small fire.

**Voice:** Fast, enthusiastic, full of technical tangents and exclamation marks. Talks to machines more gently than to people. Says "probably" a lot.

**Traits:** chaotic, curious, stubborn, funny · **Interests:** machines, clocks, flying

**Stats:** arcana 24, lore 20, alchemy 30, charm 14, vigor 10, guile 12, wealth 3

**Schedule:** Mir's Workshop (afternoon, evening, night); The Great Hall (noon, 50% of days); The Lecture Tower (morning)

**On breaks:** Mir's Workshop (afternoon, evening, night)

**Relations:** Tobias Fennick +10

**Facts:**
- [surface] An artificer who smells of solder and ozone and has started at least one small fire. (`mir.artificer`)
- [personal] Built a clockwork owl that remembers deadlines, birthdays and, slightly, grudges. (`mir.owl`, known when `seen(mir_owl_gift) > 0`)
- [personal] Three years of notebooks are the most precious things they own. (`mir.notebooks`, known when `rel(mir) >= 12`)
- [personal] Their family runs a clockworks and thinks invention is a hobby. It is not a hobby. (`mir.family`, known when `seen(mir_family_business) > 0`)
- [personal] After the third fire in a term, the faculty padlocked their workshop. (`mir.workshop`, known when `seen(mir_workshop_closed) > 0`)

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

## Place: The Village Square (`village`)

village · public · open morning, noon, afternoon, evening

A barge ride across the lake: crooked roofs, a market square, a bakery that has fed students for two hundred years and shopkeepers who have seen every kind of student.

**Usually here:** Ilse Dumont (afternoon, evening); Mabel Thistlewood (evening); Mr Alder Grimsby (evening); Old Pell (evening); Grisk (afternoon)

## Already written here (36)

- `ilse_village` The Girl at the Bakery (story)
- `art_mir_collab` A Joint Project (routine)
- `mir_ornithopter` The Test Flight (routine)
- `mir_lab_fire` Fire in the Workshop (routine)
- `mir_name_day` Mir's Name Day (routine)
- `mabel_intro` The Way You Open a Door (routine)
- `mabel_parcel` A Tin From Mabel (routine)
- `mabel_cup` Your Cup on the Hook (milestone)
- `grimsby_intro` Not That One (routine)
- `grimsby_parcel` The Wrong Book, Posted (routine)
- `grimsby_mind_the_shop` Mind the Shop (milestone)
- `pell_intro` A Thousand Drawers (routine)
- `pell_count_drops` Count Them Aloud (routine)
- `pell_daughters` Pell & Daughters (milestone)
- `pell_first_shift` Count Aloud (routine)
- `mir_intro` An Explosion in the West Wing (routine)
- `mir_owl_gift` A Present With Gears (routine)
- `mir_fair` The Artificers' Fair (routine)
- `mir_workshop_closed` The Workshop Is Shut (routine)
- `mir_dance_machine` The Dancing Machine (routine)
- `mir_confession` Blueprint (milestone)
- `mir_family_business` The Family Clockworks (routine)
- `mir_date_invention` They Built You Something (routine)
- `letter_mir_blueprint` A Letter That Folds Itself (routine)
- `letter_mir_ticking` Something That Ticks (routine)
- `pawnbroker_window` The Pawnbroker's Window (routine)
- `bakery_bun_set_aside` The Bun Set Aside (milestone)
- `lesson_contraption` The Breakfast Engine (routine)
- `apothecary_assistant_rival_shop` A Shop Across the Square (routine, rank 3)
- `village_barge_crossing` The Barge Across (routine)
- `village_square_errand` One Thing in the Square (routine)
- `village_last_barge` The Last Barge (routine)
- `bakery_bun_queue` The Bun Queue (routine)
- `bakery_oldest_baker` The Oldest Baker (routine)
- `bakery_cooling_rack` The Cooling Rack (routine)
- `mir_teaches_contraption` It Probably Works (milestone)

## Lore

- **Pell & Daughters** (`pell_and_daughters`, soft): The village apothecary, with a thousand labelled drawers. Old Pell taught three generations to count drops.
- **village** (`the_village`, soft): The village lies across the lake, reached by barge. Its shopkeepers have seen every kind of student: the Gilded Newt, Mabel's tea shop, Grimsby's Books, Pell & Daughters and the bakery.
- **Ten family** (`ten_clockworks`, soft): Mir's family runs a clockworks and expects them home. After a persuasive letter, Mir's mother agreed: "Fine. Win a prize."

## Style examples

```grim
# content/events/fixtures.grim:529
@event pell_count_drops
title: Count Them Aloud
class: routine
tone: light
trigger: social
actor: pell
when: rel(pell) >= 0 and member(apothecary_clerk)
weight: 10
repeat: 5
art: bottle
tags: job study
scene: An old apothecary at a wooden counter holding a glass dropper over a vial, a student beside him counting on their fingers, a wall of tiny labelled drawers behind them.
text: {Old Pell sets a dropper in your hand. "Forty. Aloud." He watches your lips, not the vial.|"Forty," says Pell, and stands behind you. You can hear him counting along under his breath.|Pell has started leaving you the hard tinctures. That is how he says he trusts you.} {A daughter rolls her eyes at the counter.|The drawers rattle when a cart goes by.|Something in drawer three hundred is humming.}
> left: Count, aloud, every drop
  alchemy +small
  mood -tiny
  rel pell +small
  say: {Forty, exactly. Pell says nothing for a full minute, then "Again." You are fairly sure that was praise.|You lose count at thirty-one and start over without being told. Pell grunts approvingly.|Forty, of a tincture that fights back. Pell holds the vial to the light and puts it in drawer three hundred. The humming stops.}
> right: Eyeball it; it's close enough
  challenge brew apprentice wild:
    win:
      alchemy +tiny
      say: {It's right. Pell checks it three times and is visibly annoyed that it's right.|Close enough is, today, exactly right. "Luck," says Pell. "Don't."|The hard tincture forgives you, today. Pell sniffs it and puts it away without comment, which is worse than comment.}
    lose:
      rel pell -small
      perform apothecary_clerk -small
      say: {Forty-three. Pell pours it out without a word and hands you the dropper again. The silence lasts all shift.|Too many. A daughter fixes it before he sees. He sees.|Too many, of the hard one. Drawer three hundred hums louder, and Pell keeps the dropper for the rest of the week.}
```

```grim
# content/events/fixtures.grim:505
@event pell_intro
title: A Thousand Drawers
class: routine
tone: light
place: pell_apothecary
actor: pell
when: not met(pell)
weight: 30
art: bottle
tags: job money
scene: An old apothecary on a library ladder in front of a wall of tiny labelled drawers, peering down over his spectacles at a student at the counter.
text: You ask for something for a headache. An old man on a ladder stops, counts the drawers under his breath and comes down with exactly one twist of paper. "Willow and feverfew," says Old Pell. "Three pinches. Not four. Four is for people who don't listen."
> left: Ask why not four
  meet pell
  alchemy +small
  rel pell +small
  mood -tiny
  say: He tells you, at length, with diagrams drawn in the counter dust. He's so pleased someone asked that he forgets to charge you. You leave with the cure, a headache from the lecture and the dosage for nine other things.
> right: Pay and go
  meet pell
  gold -tiny
  health +tiny
  say: He nods at the door as you leave, as if adding you to a ledger of people who will be back. The headache is gone before the quay, and you are back within a month.
```

```grim
# content/events/fixtures.grim:557
@event pell_daughters
title: Pell & Daughters
class: milestone
tone: warm
trigger: social
actor: pell
when: rel(pell) >= 20
weight: 18
art: scales
tags: job home
scene: An old apothecary and his two grown daughters arguing across a counter over a new painted shop sign, a student standing awkwardly between them.
text: Pell's daughters want a new sign, brighter labels and a counter that faces the door. Pell wants it to be fifty years ago. All three of them turn to you, the only person in the shop who isn't family. "Well?" says Pell.
> left: Side with the daughters
  rel pell -small
  mood +small
  say: Pell stamps into the back room. A week later the new sign goes up. Underneath it, in small old letters, it still says PELL. He shows you, gruffly, as though you'd asked.
> right: "The drawers have never been wrong."
  rel pell +medium
  if member(apothecary_clerk):
    gold +small
    say: Pell glows. The daughters glare. Pell gives you a bonus and the daughters give you all the worst stocktakes. Everyone feels this is fair.
  else:
    health +small
    say: Pell glows. The daughters glare. Pell presses a bottle of his best tonic on you, and the daughters give you a look that lasts a month.

# ---------------- Grisk (the moneylender) ----------------
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
- **Leads:** a hint the player has to follow up later (a card at a place, slot or track waiting on this card's flag) leaves a side-thread lead in the Clues panel; `grim leads` shows none missing.
- **Checks** (`checks.md`): the difficulty is what you're actually up against, not who is on the card; odds by nature, luck and drift each carry their own reason, none counted twice; a gamble is on `luck`; grandmaster+ is only on story or milestone cards, with `partial:` and a route without the check; a loss that ends the run has `partial:` or `likely`+; pure luck is `chance <word>`, and a roll a skill or relationship should move isn't a bare `chance`.
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
| `study <course> +tiny` / `study +tiny` | (a gain, 2026-10-19) extra work beyond class: a card's study gain is `+tiny`; preparation comes mostly from routine sources (each class month +3, +5 with a check won in class, the library's revision card +3), so exams stay predictable. A larger gain needs a matching price (a night, money, a favour), and study costs elsewhere balance the gains |
| `perform <track> -tiny` | you slack, leave early or annoy the boss at a club or job (`perform track` in the track's own cards) |
| `progress thesis -tiny` | the thesis waits while you do something else |
| `rel <npc> -tiny` / `spark <npc> -tiny` | you snub, disappoint, refuse or embarrass someone; a romantic moment goes flat |

**Alignment is a cost too.** A tempting option (keep the purse, read the letter, cheat the game, take the shortcut someone pays for) should put alignment at stake: `alignment -tiny`/`-small` on the tempting side, and `alignment +tiny` only when the honest side costs something real. Ordinary prudence (going to bed, saying no to a party) has no moral weight.

## Checks before you finish an option

1. What does the player give up? If it's the other option, the option can be free.
2. Does the `say:` show the cost? If not, change the cost or the line.
3. Is there a moral side? Then alignment moves.
4. Does it skip study, work, practice or a person? Use `study`, `perform`, `progress` or `rel` instead of a vague `mood -tiny`.
