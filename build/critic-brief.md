# Brief

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **personal**.

## Cast

### Tobias Fennick (`tobias`)

he/him · age 19 · student year 1 · Rootward · romanceable

*Farmer's son on a turnip scholarship*

Big hands, bigger heart. Talks to plants and, worryingly, the plants seem to answer.

**Voice:** Warm, slow and earnest, with farm sayings and long stories about goats. Apologises too much; laughs from the belly.

**Traits:** kind, gentle, homesick, loyal · **Interests:** plants, animals, cooking, dancing

**Stats:** arcana 12, lore 14, alchemy 26, charm 18, vigor 30, guile 4, wealth 1

**Schedule:** The Greenhouses (morning, afternoon); The Refectory (noon, evening); The Familiar Stables (evening, 60% of days)

**On breaks:** The Greenhouses (afternoon); The Familiar Stables (evening, 60% of days); The Fennick Farm (noon, afternoon, evening); The Market Village (evening, 30% of days)

**Relations:** Old Maud +20, Bram Hollis -15, Mir Ten +10

**Facts:**
- [surface] A farmer's son on a turnip scholarship, built like a barn door and gentle as a lamb. (`tobias.scholarship`)
- [surface] He talks to plants. Worryingly, they seem to answer. (`tobias.plants`)
- [personal] His mother runs the farm alone at harvest. It's the first harvest he has ever missed. (`tobias.ma`, known when `seen(tobias_homesick) > 0`)
- [personal] He is raising a mandrake called Gerald, who wears a knitted hat and screams softly. (`tobias.gerald`, known when `seen(tobias_godparent) > 0`)
- [personal] The greenhouse moonflowers bloom once every eleven years. He would stand in a storm for them. (`tobias.moonflowers`, known when `rel(tobias) >= 12`)
- [personal] He practised waltzing with a broom before the Midwinter Ball. The broom complained. (`tobias.dancing`, known when `seen(tobias_dance_lessons) > 0`)
- [personal] His mother expects him home on the farm after graduation. It was always the plan; he isn't sure any more that it's his. (`tobias.after`, known when `seen(tobias_home_or_here) > 0`)
- [personal] His mother says the weather first and the love last, in person as in her letters. She has never once left the love out. (`tobias.weather_first`, known when `seen(fennick_weather_first) > 0`)
- [personal] Gerald came from a walled bed of mandrakes behind the farmhouse. Every one of them has a hat; his mother knits them all winter. (`tobias.mandrakes`, known when `seen(fennick_mandrake_bed) > 0`)
- [personal] A man from the capital wants to buy the Fennick farm. His mother won't sell. Tobias isn't sure she can afford not to. (`tobias.offer`, known when `seen(fennick_good_boots) > 0`)

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

## Place: The Fennick Farm (`fennick_farm`)

countryside · open noon, afternoon, evening

Up on the upland side, past the tarn, outside the two villages: turnips, tomatoes, a mother who writes the weather first and love last, and Tobias in his oldest boots.

## Already written here (75)

- `tm_watering_engine` The Watering Engine (story)
- `tobias_moonflower_vigil` Every Eleven Years (routine)
- `tobias_moonflower_bloom` Tonight (routine)
- `tobias_plants_vote` The Greenhouse Votes (routine)
- `tobias_scholarship_review` The Turnip Board (routine)
- `nessa_interview_prep` Twenty Years (routine)
- `nessa_fact_check` Fact-Check (routine)
- `nessa_quill_loose` The Quill Gets Loose (routine)
- `heal_tobias_sting` Stung (windfall)
- `ledger_pie_scoop` The Case of the Missing Pies (routine)
- `ledger_bram_story` The Prefect's Bribes (routine)
- `ledger_deadline` Deadline Night (routine)
- `garden_moonflower` The Moonflower (routine)
- `tobias_scarecrow` The Scarecrow Project (routine)
- `tobias_dance_lessons` Two Left Feet (routine)
- `tobias_storm_greenhouse` Storm Over the Greenhouses (routine)
- `nessa_headmistress_interview` The Impossible Interview (routine)
- `nessa_typo` A Catastrophic Typo (routine)
- `nessa_burnout` The Editor Sleeps (routine)
- `nudge_quickquill` How's My Quill? (routine)
- `heard_nessa_isolde` Nessa on the Headmistress (routine)
- `heard_tobias_mir` Tobias on Mir (routine)
- `fennick_weather_first` Weather First (routine)
- `fennick_mandrake_bed` Gerald's Relations (routine)
- `fennick_good_boots` A Man in Good Boots (routine)
- `fennick_top_field` Outside the Luck (routine)
- `almanac_type_case` Backwards and Upside Down (routine)
- `almanac_first_notice` Lost: One Brown Dog (routine)
- `almanac_short_page` A Page Short (routine)
- `tobias_country_barrow` Turnips, Mostly Free (routine)
- `nessa_country_green` Nothing Ever Happens Here (routine)
- `fennick_farm_quiet_hour` Turnips and Tomatoes (routine)
- `tobias_intro` The Lost Boy (windfall)
- `tobias_homesick` Homesick (routine)
- `tobias_bad_harvest` The Harvest Failed (routine)
- `tobias_repays` Every Crown (story)
- `tobias_godparent` The Mandrake Baby (routine)
- `tobias_bullied` Tobias and the Prefect (routine)
- `tobias_confession` A Confession, With Vegetables (milestone)
- `tobias_picnic` A Picnic in the Orchard (milestone)
- … and 35 more (`grim query event 'place == "fennick_farm"'`)

## Lore

- **Fennick** (`fennick_farm`, soft): The Fennick farm grows turnips, tomatoes and stubborn children. Tobias's mother runs it alone at harvest, writes weather first and love last, and expects him home after graduation; one year blight nearly ruined them. Tobias studies on an agricultural scholarship whose board reviews his marks in person. The farm lies on the upland side of the valley, outside both villages, past the tarn; a drystone wall at its top field marks where the villages' land begins. Behind the farmhouse is a walled bed of mandrakes, Gerald's relations, each in a hat Mrs Fennick knits in winter. This year a man from the capital has been buying upland farms.
- **Quill** (`quill_press`, soft): Nessa grew up above her mother's print shop off the market green in the countryside, the Almanac Printer's, which prints the valley's almanac, its notices and its funeral cards. Mrs Quill works the hand press, ink to the elbows. Nessa set type before she could write, and her first story was a lost-dog notice for a dog called Biscuit, who came home. The attic holds a century of almanacs; every seventh year's is a page short, always the harvest page, and Mrs Quill says the old press always did that.

## Style examples

```grim
# content/events/maps/countryside_peers.grim:72
@event fennick_top_field
title: Outside the Luck
pool: fennick_farm_tobias
when: rel(tobias) >= 12
tone: eerie
art: leaf
scene: A high field divided by an old drystone wall, thick golden barley on the far side, thin patchy barley on the near side, a big young man and a student standing at the wall.
text: Tobias walks you up to the top field, where the farm meets the valley's land at an old drystone wall. On the far side the barley stands thick and gold. On the Fennick side it's thin, and patchy, and honest. "Seven good years down there," Tobias says. "Every year. Never up here." He puts his big hand flat on the wall. "Ma says the valley's luck is the valley's business."
> left: Help him clear the stones
  vigor +small
  health -tiny
  say: You pick stones out of the thin side of the wall until your back aches and the sun goes down. It's slow, plain, endless work, and Tobias hums the whole time. "Our luck's this," he says, tipping a basket. "Stones. I don't mind it. It's ours."
> right: Ask what he thinks it is
  lore +tiny
  mood -tiny
  say: He thinks about it a long time, which is how he thinks about everything. "I think they pay for it," he says at last. "I don't know what with. Nobody down there ever says." The wind goes over the barley on the far side, and none of it bends the way the near side does. You walk back uneasy.

# ---------------- Nessa: the Almanac Printer's ----------------
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
