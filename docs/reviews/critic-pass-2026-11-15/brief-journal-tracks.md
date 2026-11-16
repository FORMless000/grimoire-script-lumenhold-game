# Brief

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **personal**.

## Place: The Familiar Stables (`stables`)

grounds · public · open morning, afternoon, evening

Hippogriffs, a sulky griffon chick, owls in the rafters and Professor Brask, who talks to all of them more kindly than to students.

**Usually here:** Tobias Fennick (evening); Professor Hedda Brask (morning, afternoon, evening)

## Track: Duelling Circle (`duelling`)

club · arcana/vigor · ranks: Member, Officer, Captain · 1 required visits per term

Practice bouts, the Spring Tournament and a great deal of shouting about footwork.

**Lead:** Lyra Vaneshade

## Already written here (36)

- `brk_stables_round` The Feeding Round (routine)
- `duel_dummy_hexes` The Dummy Hits Back (routine, rank 2)
- `duel_captains_notes` The Captain's Notes (routine, rank 2)
- `duel_bram_barrage` Inside the Chalk Circle (routine, rank 2)
- `duel_footwork_lyra` Footwork Until Dark (routine, rank 2)
- `duel_brace_final` Hold Firm (milestone, rank 2)
- `duel_practice_bout` Practice Bout (routine)
- `duel_bram_hazing` Initiation, Prefect-Style (routine)
- `duel_lyra_training` Training Partners (routine)
- `stables_hippogriff_grooming` Feathers the Wrong Way (routine)
- `stables_tack_room` The Tack Room (routine)
- `brask_half_sentences` Pliers. Not Those. (routine)
- `stables_hippogriff` Bow to the Hippogriff (routine)
- `stables_dragon_egg` An Egg in the Hay (routine)
- `stables_night_shift` The Sick Pegasus (routine)
- `nudge_brace` Your Name on the Board (routine)
- `know_brask_asking` Out of Your Depth (routine)
- `duelling_ward_line` The Ward Line (routine, rank 1)
- `duelling_dummy_mending` Mending the Dummies (routine, rank 1)
- `duelling_refereeing_lyra` Refereeing Lyra (routine, rank 2)
- `duelling_running_practice` Running Practice (milestone, rank 2)
- `stables_owl_loft` The Owl Loft (routine)
- `stables_brask_rounds` Brask's Rounds (routine)
- `stables_griffon_sulk` The Sulking Griffon (routine)
- `lesson_foresight` Behind the Hippogriff (routine)
- `lesson_rime` The Rotten Ladder (routine)
- `duelling_captain_challenge` The Captain's Challenge (routine, rank 3)
- `duelling_captain_injury` The Captain's Call (routine, rank 3)
- `duel_first_practice` Footwork (routine, rank 1)
- `duel_footwork_feud` The Footwork Feud (routine)
- `duel_fixture` Fixture Against Thornwick (milestone, rank 2)
- `duel_captain_call` The Captain's Question (milestone, rank 2)
- `brask_deep_hours` Midnight Hours (routine)
- `item_quill_brask` Brask Knows That Owl (routine)
- `item_tine_brask` Brask Bows to It (routine)
- `item_thorn_brask` Brask Smells It (routine)

## Lore

- **masked circle** (`masked_circle`, soft): Three hedge-dabblers in plain white masks who practise Compel in a chalk circle in the heartwood. Their chalk marks are copied, badly, from somewhere; they don't know what the marks are for. Absalom Vrell taught them, after a fashion.
- **wall stair** (`tower_wall_stair`, soft): Inside the seventh tower's wall, behind a rack of empty bottles in the cellar, a servants' stair one shoulder wide climbs to the landing of candles, with a spyhole onto the main stair. Above the landing are the old classrooms, shut with the tower a century ago and left as their teachers left them: an examiner's cupboard of old papers, floorboards that creak each a different note, a brass orrery still turning, a professor's portrait that asks what you think you're doing. The class register ends on its last day: "Tower closed. Lessons moved." Two turns below the top, where desks choke the stair, the duelling master's study stays locked, and nobody has had its key since.

## Style examples

```grim
# content/events/club_spell_chains.grim:95
@event duel_bram_barrage
title: Inside the Chalk Circle
thread: brace_quest
class: routine
tone: tense
art: bolt
tags: club duel
scene: A student standing in a chalk circle on a scorched floor while a broad prefect hurls a stream of stinging hexes from the edge.
text: Word reaches Bram that you mean to empty the captain's charm. He turns up with his sleeves rolled. "Regulation hazing," he announces, "section four. You stand in the circle. I throw. You don't step out. Ready?"
> left: Hold the circle against him
  challenge duel vs bram.vigor:
    win:
      flag brace_circle
      vigor +small
      say: You don't step out. By the twentieth hex Bram is red in the face and you are still in the circle, scorched and planted. "Adequate," he says, gruffly, and doesn't put you on report.
    lose:
      say: The ninth hex knocks you clean out of the circle. Bram notes it in his book. "Section four, failed," he says. "Again next week."
  next
> right: Take it all on your shield arm
  flag brace_circle
  health -medium
  say: You don't try to be clever. You just stand there and take it, every hex, on your arm, until Bram runs out. Your arm is purple for a week. Bram looks almost impressed.
  next
> up[item:duelling_coat]: Shrug it off in the coat
  flag brace_circle
  health -small
  perform duelling +tiny
  say: You button the quilted coat to the chin and plant your feet. The hexes thud into the padding like snowballs into a wall. Bram runs out first. "That's cheating," he says. "Section four doesn't mention coats," you say.
  next
```

```grim
# content/events/club_spell_chains.grim:145
@event duel_brace_final
title: Hold Firm
thread: brace_quest
tone: tense
art: spell_brace
tags: club duel magic
scene: A student standing firm in a chalk circle in a crowded duel hall as an eyepatched dummy fires hex after hex, the club watching from the benches.
text: The club gathers on the benches. You step into the chalk circle, and the eyepatched dummy turns its head toward you with an audible creak. The captain's charm begins to fire. {flag(brace_notes) and flag(brace_circle) and flag(brace_footwork): You know how to stand, and why.|You have done some of the work. Not all of it.}
> left: Hold firm
  challenge feat adept- +1 if flag(brace_notes) +1 if flag(brace_circle) +1 if flag(brace_footwork):
    win:
      learn_spell brace
      perform duelling +small
      say: The hexes break on you one after another, and each lands softer than the last. When the charm finally sputters out, the club is on its feet. Lyra doesn't clap. She nods, once, which is louder.
    lose:
      health -small
      say: The fourteenth hex lifts you out of the circle and into the benches. The dummy turns its head back with a creak. It will be there at practice, waiting.
> right: Borrow the captain's old gauntlets
  gold -small
  challenge feat adept- likely +1 if flag(brace_notes) +1 if flag(brace_circle) +1 if flag(brace_footwork):
    win:
      learn_spell brace
      perform duelling +small
      say: The club quartermaster rents you the captain's own gauntlets for the night. They take the first blow for you, and the rest you take yourself. When the charm sputters out, the benches roar.
    lose:
      health -small
      say: Even in the gauntlets, the fourteenth hex lifts you out of the circle. The rental is not refunded. The dummy creaks its head back and waits.

# ---------------- The Lumen Ledger → Quickquill (guile) ----------------
```

```grim
# content/events/slice_2b.grim:227
@event duel_fixture
title: Fixture Against Thornwick
track: duelling
rank: 2
class: milestone
tone: tense
art: trophy
tags: club duel festival
scene: A duelling green with rival banners, students from both academies packed onto benches.
text: Thornwick Academy's duelling team has crossed the hills for a fixture. The Circle needs one more duellist in the line-up, and the captain is looking at you.
> left: Duel for the Circle
  challenge combat adept-:
    win:
      renown +medium
      perform track +medium
      say: You win your bout, and the Circle wins the fixture by a whisker. Someone carries you a few steps before remembering they don't like you.
    partial:
      renown +small
      perform track +small
      say: A draw. The Circle loses by one bout, but nobody blames you, and {around(lyra): Lyra|the captain} says "acceptable" twice.
    lose:
      health -small
      mood -small
      say: The Thornwick duellist is very good and very polite about it, and every bruise you collect is a polite one. You hate both.
> right: Offer to be the reserve
  perform track +tiny
  mood +tiny
  say: You hold coats and bring water. It turns out reserves see everything, including how Thornwick cheats.
> up[wildfire]: Let the fire run
  renown +medium
  perform track +small
  health -tiny
  say: You hold the fire until it bites, and then let it go. It runs across the hall and through the Thornwick duellist's wards like paper. The Circle goes mad. Your sleeve is on fire, which you notice afterwards.
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
