# Brief

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **personal**.

## Cast

### Lyra Vaneshade (`lyra`)

she/her · age 19 · student year 1 · Emberhall · romanceable

*Heir of House Vaneshade, pyromancy prodigy*

Brilliant, impatient and used to winning. She treats everyone as either a rival or furniture — and is quietly lonely about it.

**Voice:** Clipped and formal; sarcastic when hurt. Never says "please" first, never admits to being tired, apologises by doing something useful.

**Traits:** proud, ambitious, lonely, stubborn · **Interests:** duelling, fire, books

**Stats:** arcana 34, lore 22, alchemy 8, charm 20, vigor 28, guile 12, wealth 5

**Schedule:** The Duelling Hall (afternoon, evening); The Refectory (noon); The Library (night, 60% of days)

**On breaks:** The Duelling Hall (afternoon, evening); The Library (night, 40% of days); Vaneshade House (noon, afternoon, evening); The Royal Gardens (noon, 40% of days); The Theatre (evening, 30% of days)

**Relations:** Kael Dumont -10, Bram Hollis +5, Nessa Quill -5

**Facts:**
- [surface] The pyromancy prodigy of House Vaneshade. Everyone knows the name, and she makes sure of it. (`lyra.prodigy`)
- [personal] She can incinerate a target at forty paces. She cannot make toast. (`lyra.toast`, known when `seen(lyra_toast) > 0`)
- [personal] Her mother has never once told her "well done". (`lyra.mother`, known when `rel(lyra) >= 18`)
- [personal] She came second in the Winter Trials once. Her mother wrote to ask who beat her. (`lyra.second_place`, known when `seen(lyra_letter) > 0`)
- [personal] You are the only person here who makes her better. She hates it. She doesn't want it to stop. (`lyra.rival`, known when `bond(lyra) == "rival"`)
- [personal] Vaneshades sleep exactly eight hours; she can't sleep. Her grandmother's spell, Wildfire, was only for people she trusted, and Lyra has never had anyone to teach it to. (`lyra.wildfire`, known when `seen(lyra_become_close) > 0`)
- [personal] Her family has opened its duels with the same ribbon-of-flame flourish for two hundred years. Teaching it outside the family is not done. (`lyra.flourish`, known when `seen(lyra_teach_spell) > 0`)
- [personal] At Vaneshade House she sleeps on a camp bed in the scorched practice room. Her real bedroom, downstairs, is kept for visitors to see. (`lyra.camp_bed`, known when `seen(vaneshade_practice_room) > 0`)
- [personal] Mrs Callow, the cook at Vaneshade House, has made her toast every morning she has ever spent at home, and is the only person in the house who calls her Lyra. Lyra has written to her every week since she went away to school. (`lyra.cook`, known when `seen(vaneshade_kitchen_toast) > 0`)
- [personal] Her grandmother is the only Vaneshade in the gallery who is smiling. She lit candles by telling them bad jokes: fire, she said, likes to be surprised. (`lyra.grandmother`, known when `seen(vaneshade_portrait_gallery) > 0`)

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

## Place: The Village Square (`village`)

village · public · open morning, noon, afternoon, evening

A barge ride across the lake: crooked roofs, a market square, a bakery that has fed students for two hundred years and shopkeepers who have seen every kind of student.

**Usually here:** Ilse Dumont (afternoon, evening); Mabel Thistlewood (evening); Mr Alder Grimsby (evening); Old Pell (evening); Grisk (afternoon)

## Track: Duelling Circle (`duelling`)

club · arcana/vigor · ranks: Member, Officer, Captain · 1 required visits per term

Practice bouts, the Spring Tournament and a great deal of shouting about footwork.

**Lead:** Lyra Vaneshade

## Already written here (139)

- `lyra_who_beat_her` Who Beat Her (routine)
- `lyra_well_done` Well Done (routine)
- `lyra_study_hall_truce` The Study Hall Truce (routine)
- `lyra_become_close` Let It Run (milestone)
- `nessa_interview_prep` Twenty Years (routine)
- `nessa_fact_check` Fact-Check (routine)
- `nessa_quill_loose` The Quill Gets Loose (routine)
- `lyra_rankings_war` The Rankings War (routine)
- `lyra_sabotage_returned` Pink Bubbles, Returned (routine)
- `lyra_glove_thrown` The Glove Thrown (routine)
- `lyra_allies_thornwick` Allies, for an Afternoon (routine)
- `lyra_mother_watches` Her Mother Watches You Win (routine)
- `lyra_rival_letter` A Rival's Letter (routine)
- `lyra_last_match` The Last Rankings (routine)
- `ilse_village` The Girl at the Bakery (story)
- `lyra_on_thornwick` Lyra on Thornwick (routine)
- `pyro_lyra_spar` A Challenge in Class (routine)
- `duel_dummy_hexes` The Dummy Hits Back (routine, rank 2)
- `duel_captains_notes` The Captain's Notes (routine, rank 2)
- `duel_bram_barrage` Inside the Chalk Circle (routine, rank 2)
- `duel_footwork_lyra` Footwork Until Dark (routine, rank 2)
- `duel_brace_final` Hold Firm (milestone, rank 2)
- `duel_practice_bout` Practice Bout (routine)
- `duel_bram_hazing` Initiation, Prefect-Style (routine)
- `duel_lyra_training` Training Partners (routine)
- `ledger_pie_scoop` The Case of the Missing Pies (routine)
- `ledger_bram_story` The Prefect's Bribes (routine)
- `ledger_deadline` Deadline Night (routine)
- `amaranth_quit` Sister Amaranth's Remedy (incident)
- `lyra_toast` Lyra Cannot Cook (routine)
- `lyra_mother_visit` Lady Vaneshade (routine)
- `lyra_rival_respect` Respect, Grudgingly (milestone)
- `nessa_headmistress_interview` The Impossible Interview (routine)
- `nessa_typo` A Catastrophic Typo (routine)
- `nessa_burnout` The Editor Sleeps (routine)
- `y3_last_duel` One Last Duel (routine)
- `amaranth_tea_break` Five Minutes Sitting Down (routine)
- `amaranth_intro` No Excuses (routine)
- `amaranth_rounds` Evening Rounds (routine)
- `amaranth_orders` Doctor's Orders (routine)
- … and 99 more (`grim query event 'place == "village"'`)

## Lore

- **Vaneshade** (`vaneshade`, soft): House Vaneshade is old pyromancer nobility. Its letters carry a black seal; its winter gala is an inspection disguised as a party; its duellists carry pale family wands and open every duel with the same flame flourish they have used for two hundred years. Vaneshades sleep exactly eight hours. Lady Vaneshade's highest praise is "Adequate"; she has a velvet chair reserved at her daughter's bouts, and it stays empty. Vaneshade House stands on the Crescent in the capital: black stone, a scorched practice room on the second floor, a long gallery of portraits in which every Vaneshade but one is unsmiling (the exception is Lyra's grandmother, who made Wildfire), and a kitchen run for thirty years by Mrs Callow, the cook.
- **Quill** (`quill_press`, soft): Nessa grew up above her mother's print shop off the market green in the countryside, the Almanac Printer's, which prints the valley's almanac, its notices and its funeral cards. Mrs Quill works the hand press, ink to the elbows. Nessa set type before she could write, and her first story was a lost-dog notice for a dog called Biscuit, who came home. The attic holds a century of almanacs; every seventh year's is a page short, always the harvest page, and Mrs Quill says the old press always did that.
- **village** (`the_village`, soft): The village lies across the lake, reached by barge. On its square stand the bakery's trestle, the tailor's rail of robes and the pawnbroker's creaking sign; on market days Mir keeps a stall there. Round the square are the Gilded Newt, Mabel's tea shop, Grimsby's Books and Pell & Daughters, and their shopkeepers have seen every kind of student.

## Style examples

```grim
# content/events/pools/clubs_jobs.grim:60
@event duelling_refereeing_lyra
title: Refereeing Lyra
track: duelling
rank: 2
class: routine
tone: tense
repeat: 5
weight: 10
actor: lyra
when: around(lyra)
art: duel
tags: club duel
scene: A student with a whistle watching a noble duellist in a chalk circle, her opponent's shield just failing.
text: {Officers referee, so tonight you hold the whistle while Lyra duels a second-year.|You know the circle's chalk by heart now, and Lyra's footwork better.|{rel(lyra) >= 12: Lyra no longer asks who is refereeing. She looks for you.|The whistle has a dent in it from some earlier, unrecorded argument.}} {Her last spell landed a breath after the bell.|She stepped out of the circle by a boot's width, and knows it.|Her last hex went in after her opponent had called the yield.} {final_year: One of the last bouts you will call for her.|}
> left: Call it against her
  rel lyra -small
  alignment +tiny
  perform duelling +small
  rank_xp duelling +small
  say: {"Noted," Lyra says, in a voice that could chill wine. Next day her feet are perfect.|Lyra stares at you, then shakes her opponent's hand. Later a cup of tea appears on your bench.|The hall goes silent. Lyra bows to the second-year, very correctly, and to you, slightly less.}
  if knows(lyra.rival):
    rel lyra +tiny
    say: She would never have forgiven you for letting it stand, and you both know why: you're the one person here who makes her better.
> right: Let it stand
  rel lyra +tiny
  alignment -tiny
  perform duelling -tiny
  mood -tiny
  say: {Lyra wins. The second-year looks at you, and you find something interesting about your whistle.|Nobody objects. Lyra does not thank you; if anything, she looks a little disappointed in you.|The bout goes in the book as hers. It sits there all week like a stone in your shoe.}
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
