# Brief

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **personal**.

## Place: The Almanac Printer's (`almanac_printers`)

countryside · open noon, afternoon

A crooked shop off the market green with a hand press in the window. It prints the valley's almanac, its notices and its funeral cards, and Nessa grew up above it.

## Already written here (5)

- `almanac_type_case` Backwards and Upside Down (routine)
- `almanac_first_notice` Lost: One Brown Dog (routine)
- `almanac_short_page` A Page Short (routine)
- `gy_almanac_page` The Harvest Page (story)
- `almanac_printers_quiet_hour` The Almanac Press (routine)

## Lore

- **Quill** (`quill_press`, soft): Nessa grew up above her mother's print shop off the market green in the countryside, the Almanac Printer's, which prints the valley's almanac, its notices and its funeral cards. Mrs Quill works the hand press, ink to the elbows. Nessa set type before she could write, and her first story was a lost-dog notice for a dog called Biscuit, who came home. The attic holds a century of almanacs; every seventh year's is a page short, always the harvest page, and Mrs Quill says the old press always did that.

## Style examples

```grim
# content/events/maps/placeholders.grim:456
@event almanac_printers_quiet_hour
title: The Almanac Press
pool: maps_placeholder
place: almanac_printers
art: paper
scene: A cramped village print shop with a hand press in the window, stacks of thin almanacs, funeral cards and notices pegged to dry on strings.
text: The printer's off the market green smells of ink and damp paper. This year's almanacs are stacked by the door, thin and cheerful: sowing days, saints' days, a good harvest forecast in very confident type.
> left: Buy an almanac
  gold -tiny
  lore +tiny
  say: {~Tides, sowing days, a remedy for warts. Every year in it is a good one.|You buy one. Flicking through on the step, you find a page number missing, as if a page had been printed and taken out.}
> right: Watch the press
  mood +tiny
  say: {~A woman with ink to the elbow works the press without looking up, and asks if you're the one from the academy.|The press thumps. Notices go up on the strings to dry: a sale of land, a lost dog, a wedding.}

# Retired (K5): the place has its own cards (maps/countryside_wide.grim).
```

```grim
# content/events/maps/good_year.grim:180
@event gy_almanac_page
title: The Harvest Page
thread: good_year
place: almanac_printers
class: story
tone: eerie
when: not flag(gy_almanac)
weight: 16
art: paper
tags: mystery
scene: An ink-stained woman at an old hand press in a cramped print shop, holding up a single printed page with a blank line on it, a drawer of identical pages open beside her, a student reading.
text: Mrs Quill is alone at the press, ink to the elbows. {flag(almanac_pages_counted): She knows you've been in the attic with Nessa; she doesn't say so.|} She sees you looking at the drawer under the press, and after a while she opens it: a stack of loose pages, one for every seventh year, each headed HARVEST SUPPER, each with a line printed for "the Guest of the Year", and a name inked in by hand.
> left: Ask why she prints it
  lore +tiny
  mood -tiny
  gy_clues += 1
  say: "Because they ask," she says, "and then they cut it out, and I put it in the drawer." She closes it. "My mother did, and hers. I tell myself it's only printing." She goes back to the press and doesn't look at you again, and her hands aren't steady.
  flag gy_almanac
> right: Take one of the pages
  alignment -tiny
  gy_clues += 1
  say: You take the oldest page while her back is turned to the press, and she sees, in the type-case's brass, and lets you. Walking out with it inside your coat feels like stealing from somebody who wanted you to.
  flag gy_almanac
```

```grim
# content/events/maps/countryside_peers.grim:98
@event almanac_type_case
title: Backwards and Upside Down
pool: almanac_printers_nessa
when: rel(nessa) > -10
repeat: 3
tone: light
art: paper
scene: A crowded country print shop, a young woman in ink-stained sleeves setting metal type into a stick at a tall wooden case, an older woman working a hand press behind her.
text: {&At her mother's type case Nessa is a different creature, silent and quick, setting metal letters into a stick backwards and upside down, faster than she writes forwards. Mrs Quill works the press behind her, ink to the elbows. "Took her apart at five," Mrs Quill says, "the case. Put it back alphabetical. Took me a month."|Nessa's at the case again, setting the market notices, and she hasn't said a single headline since you came in. It's unnerving. "Here," she says, without looking up, and hands you a stick.|The shop again, and the press thumping. Nessa has set your name in type and left it on the stone where you'll see it, which she pretends was an accident. "Line's yours," she says. "If you can."}
> left: Set a line yourself
  lore +small
  mood -tiny
  say: {&You set one line in the time she sets a page, and spell it wrong backwards. She corrects it without comment, which is worse. By the end your fingertips are black and your pride is small.|You set the price of eggs and the date of the fair, and get the fair wrong. Nessa fixes it with one flick and says nothing, kindly, which is maddening.|You set a whole notice, slowly, under her eye, and get one letter upside down. She turns it without a word. It stings, a little, that she saw it first.}
> right: Pull the press for Mrs Quill
  vigor +small
  health -tiny
  say: {&Mrs Quill lets you pull the press. A heave, a thump, a sheet off the stone, again, and again, a hundred times. Your arms are dead by the end. "Same as she did at ten," says Mrs Quill. "She cried. You're doing better."|You pull the almanac covers, a thump to each. Your shoulder aches. Mrs Quill talks the whole time about Nessa as a child, and Nessa, at the case, sets faster and faster.|You and Mrs Quill pull the funeral cards for a farmer you never met. It's slow, careful, heavy work, and quiet. "He'd have liked it done properly," she says, and you ache, and are glad you did.}
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
