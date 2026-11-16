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
- [personal] A man from the capital has offered to buy the Fennick farm, this year only. His mother didn't so much as answer him. (`tobias.offer`, known when `seen(fennick_good_boots) > 0`)

### Seraphine Hale (`seraphine`)

she/her · age 19 · student year 1 · Stillwater · romanceable

*Seer who never quite looks at the present*

Speaks in half-sentences, as if finishing the other half in a different week. Often right. Unsettlingly often.

**Voice:** Half-sentences, finished in another week. Calm, vague, then suddenly exact about something that hasn't happened yet.

**Traits:** dreamy, distant, perceptive, kind · **Interests:** prophecy, painting, tarot, stars

**Stats:** arcana 20, lore 32, alchemy 10, charm 16, vigor 8, guile 14, wealth 3

**Schedule:** The Observatory (evening, night); The Lakeshore (afternoon); The Library (morning, 50% of days)

**On breaks:** The Observatory (evening, night); The Lakeshore (afternoon); The Oracle's Rooms (noon, afternoon); The Cathedral of the Lamp (evening, 40% of days)

**Relations:** Kael Dumont +10, Lyra Vaneshade +5

**Facts:**
- [surface] A seer who speaks in half-sentences and is unsettlingly often right. (`seraphine.seer`)
- [personal] Sometimes she slips a day ahead and needs someone to tell her what today is. (`seraphine.slips`, known when `seen(seraphine_lost_day) > 0`)
- [personal] Her mother is the Oracle of Vell, who wants her home to tell kings what they want to hear. (`seraphine.oracle`, known when `rel(seraphine) >= 15`)
- [personal] Seers can't see themselves, unless someone is standing next to them. (`seraphine.self`, known when `seen(seraphine_painting) > 0`)
- [personal] What she sees ahead comes out in her paintings, sometimes months early. She hides the ones she didn't mean to paint under her bed. (`seraphine.paintings`, known when `seen(seraphine_dont_look) > 0 or seen(brk_starfall_observatory) > 0`)
- [personal] In the capital she sits in her mother's window and paints the people queuing on the stairs as they will be in a year. She never shows them. (`seraphine.petitioners`, known when `seen(oracle_window_seat) > 0`)

### Corvin Ashby (`corvin`)

he/him · age 19 · student year 1 · Duskgate · romanceable

*Charming liability*

Knows every locked door in the academy and has opinions about all of them. Owes money to at least three people.

**Voice:** Quick, teasing, deflecting with jokes; calls you "saint" when you're being good. When he means something, the jokes stop and so does he.

**Traits:** charming, reckless, loyal, secretive · **Interests:** maps, locks, cards, money

**Stats:** arcana 16, lore 12, alchemy 14, charm 30, vigor 18, guile 38, wealth 1

**Schedule:** The Courtyard (noon, afternoon); The Third Gargoyle (night); The Third Gargoyle (midnight, 40% of days); The Gilded Newt (evening)

**On breaks:** The Gilded Newt (afternoon, evening); The Third Gargoyle (night); The Third Gargoyle (midnight, 50% of days); Ashby Lane (evening, night); The Fish Market (noon, 40% of days); The Docks (afternoon, 40% of days)

**Relations:** Bram Hollis -30, Nessa Quill +10

**Facts:**
- [surface] Knows every locked door in the academy and owes money to at least three people. (`corvin.locks`)
- [personal] He is on his last warning. One more detention and they send him home, and home is not a good place. (`corvin.last_warning`, known when `seen(corvin_rooftop) > 0`)
- [personal] His grandfather's lucky deck sat in the confiscation vault for decades. It really is lucky. (`corvin.grandfather`, known when `seen(corvin_confiscation_vault) > 0`)
- [personal] He once owed thirty crowns to trolls and offered to pay you back with a goat. (`corvin.trolls`, known when `seen(corvin_debt) > 0`)
- [personal] His grandfather could find a lost thing in any house, and taught him to shuffle on rainy Sundays. He's the one person Corvin talks about without a joke. (`corvin.sundays`, known when `seen(corvin_lucky_deck) > 0`)
- [personal] Everyone on Ashby Lane knows him, lends him nothing, and would hide him from the watch without being asked. (`corvin.lane`, known when `seen(ashby_the_chair) > 0`)

### Mir Ten (`mir`)

they/them · age 19 · student year 1 · Brasswick · romanceable

*Artificer of questionable inventions*

Smells permanently of solder and ozone. Has built a clockwork owl, a self-stirring cauldron and at least one small fire.

**Voice:** Fast, enthusiastic, full of technical tangents and exclamation marks. Talks to machines more gently than to people. Says "probably" a lot.

**Traits:** chaotic, curious, stubborn, funny · **Interests:** machines, clocks, flying

**Stats:** arcana 24, lore 20, alchemy 30, charm 14, vigor 10, guile 12, wealth 3

**Schedule:** Mir's Workshop (afternoon, evening, night); The Refectory (noon, 50% of days); The Lecture Tower (morning)

**On breaks:** Mir's Workshop (afternoon, evening, night); The Ten Clockworks (noon, afternoon, evening); The Grand Bazaar (noon, 30% of days)

**Relations:** Tobias Fennick +10

**Facts:**
- [surface] An artificer who smells of solder and ozone and has started at least one small fire. (`mir.artificer`)
- [personal] Built a clockwork owl that remembers deadlines, birthdays and, slightly, grudges. (`mir.owl`, known when `seen(mir_owl_gift) > 0`)
- [personal] Three years of notebooks are the most precious things they own. (`mir.notebooks`, known when `rel(mir) >= 12`)
- [personal] Their family runs a clockworks and thinks invention is a hobby. It is not a hobby. (`mir.family`, known when `seen(mir_family_business) > 0`)
- [personal] After the third fire in a term, the faculty padlocked their workshop. (`mir.workshop`, known when `seen(mir_workshop_closed) > 0`)
- [personal] Locked out of a workshop, they will solder on the corridor floor for a week rather than stop. It's character-building, they say. (`mir.corridor`, known when `seen(mir_padlock) > 0`)
- [personal] At the family bench Mir works "properly": slow, silent and perfect, the way they never do at the castle. Their real workshop at home is a cupboard under the attic stairs. (`mir.properly`, known when `seen(clockworks_long_bench) > 0`)
- [personal] Their older sister Greta will inherit the clockworks and is very good at it. She has never once been allowed to set anything on fire. (`mir.sister`, known when `seen(clockworks_greta) > 0`)

### Kael Dumont (`kael`)

he/him · age 20 · student year 1 · Stillwater · romanceable

*Transfer student from the frozen North*

Arrived mid-term with no luggage and frost in his eyelashes. Doesn't talk about where he came from. Watches the sky at night.

**Voice:** Few words, quiet, as if each one costs something. Northern formality; literal-minded about feelings, startled by kindness.

**Traits:** guarded, cold, lonely, protective · **Interests:** stars, snow, books

**Stats:** arcana 36, lore 26, alchemy 8, charm 10, vigor 22, guile 18, wealth 2

**Schedule:** The Observatory (night); The Observatory (midnight, 30% of days); The Library (afternoon, 60% of days); The Boathouse (evening)

**On breaks:** The Lakeshore (afternoon); The Boathouse (evening); The Observatory (night); The Observatory (midnight, 40% of days)

**Relations:** Ilse Dumont +30, Lyra Vaneshade -10, Seraphine Hale +5

**Facts:**
- [surface] A transfer from the frozen North who arrived mid-term with frost in his eyelashes. (`kael.north`)
- [personal] His hands are always cold. Nobody has ever been warm enough before. (`kael.cold_hands`, known when `seen(kael_cold_hands) > 0`)
- [personal] He watches a patch of sky with no stars in it: a star that eats light. (`kael.sky`, known when `seen(astro_kael_roof) > 0`)
- [personal] His mother never once said she was proud of him. (`kael.mother`, known when `seen(kael_northern_lights) > 0`)
- [personal] In the North nobody says goodbye; it's unlucky. You say "until the thaw" and touch foreheads, so the cold knows you're coming back. (`kael.thaw`, known when `seen(kael_until_the_thaw) > 0`)

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

### Bram Hollis (`bram`)

he/him · age 19 · prefect year 1 · Emberhall

*Prefect, enforcer, menace*

A prefect of your own year, with a ledger of demerits and a fondness for writing your name in it.

**Voice:** Loud, officious, rule-quoting; demerits as punctuation. Under it, his father's voice. When he's honest, he's gruff and brief.

**Traits:** bullying, insecure, proud, loyal · **Interests:** rules, duelling

**Stats:** arcana 26, lore 18, alchemy 10, charm 14, vigor 32, guile 20, wealth 4

**Schedule:** The Courtyard (morning, noon); The Duelling Hall (evening); The Library (afternoon, 50% of days)

**On breaks:** The Courtyard (afternoon); The Duelling Hall (evening); Hollis House (noon, afternoon, evening); The Royal Gardens (noon, 40% of days)

**Relations:** Tobias Fennick -15, Corvin Ashby -30, Nessa Quill -20, Lyra Vaneshade +5

**Facts:**
- [surface] A prefect of your own year, with a red sash, a ledger of demerits and a fondness for your name. (`bram.prefect`)
- [personal] He once invented a "hall tax" for the east staircase. (`bram.hall_tax`, known when `seen(bram_hall_tax) > 0`)
- [personal] Under the sash, he will step between you and trouble. Then he tells you not to make it weird. (`bram.ally`, known when `seen(bram_turns) > 0`)
- [personal] His father's portrait hangs in the corridor of head boys. Every visit, his father stops in front of it, and then looks at Bram. (`bram.portrait`, known when `seen(bram_portrait) > 0`)
- [personal] When he loses, he practises alone on the duelling green every evening for a month, and then asks for a rematch. (`bram.rematch`, known when `seen(bram_rematch) > 0`)
- [personal] At home he says "sir" to his father and almost nothing else. Whenever Bram is home, his father inspects his boots, the way Bram inspects first-years. (`bram.sir`, known when `seen(hollis_inspection) > 0`)
- [personal] At home he plays the piano at noon, very precisely, because he was told to at six and never stopped. He would rather you hadn't heard. (`bram.piano`, known when `seen(hollis_noon_piano) > 0`)

## Already written here (300)

- `feud_ledger_war` Say Please (story)
- `tm_watering_engine` The Watering Engine (story)
- `lyra_who_beat_her` Who Beat Her (routine)
- `lyra_well_done` Well Done (routine)
- `lyra_study_hall_truce` The Study Hall Truce (routine)
- `lyra_become_close` Let It Run (milestone)
- `tobias_moonflower_vigil` Every Eleven Years (routine)
- `tobias_moonflower_bloom` Tonight (routine)
- `tobias_plants_vote` The Greenhouse Votes (routine)
- `tobias_scholarship_review` The Turnip Board (routine)
- `seraphine_oracle_letter` A Letter From Vell (routine)
- `seraphine_what_you_want_to_hear` What You Want to Hear (routine)
- `seraphine_too_loud` Too Loud (routine)
- `corvin_lock_lesson` Every Door (routine)
- `corvin_takes_the_blame` One More Detention (routine)
- `corvin_cartographer_hint` The Club That Doesn't Exist (routine)
- `mir_small_fire` A Small Fire (routine)
- `mir_padlock` The Padlock (routine)
- `mir_family_clocks` Not a Hobby (routine)
- `kael_northern_supper` A Northern Supper (routine)
- `kael_gloves` Gloves (routine)
- `kael_frost_fern` The Frost-Fern Trick (routine)
- `nessa_interview_prep` Twenty Years (routine)
- `nessa_fact_check` Fact-Check (routine)
- `nessa_quill_loose` The Quill Gets Loose (routine)
- `bram_portrait` Head Boy, Forty Years Ago (routine)
- `bram_owns_up` Bram Owns Up (routine)
- `bram_become_close` Not Weird (milestone)
- `lyra_rankings_war` The Rankings War (routine)
- `lyra_sabotage_returned` Pink Bubbles, Returned (routine)
- `lyra_glove_thrown` The Glove Thrown (routine)
- `lyra_allies_thornwick` Allies, for an Afternoon (routine)
- `lyra_mother_watches` Her Mother Watches You Win (routine)
- `lyra_rival_letter` A Rival's Letter (routine)
- `lyra_last_match` The Last Rankings (routine)
- `bram_marked` Top of the Ledger (milestone)
- `bram_demerit_ledger` The Demerit Ledger (routine)
- `bram_inspection` Inspection (routine)
- `bram_rumour` The Rumour He Started (routine)
- `bram_hall_tax_escalated` The Hall Tax, Escalated (routine)
- … and 260 more (`grim query event 'actor == "lyra"'`)

## Lore

- **Dumont** (`dumont_family`, soft): The Dumonts are the foremost of the Hollow families. They sent Kael to open the door; when he refused, they raised his younger sister Ilse to do it instead. Their mother has never told either child she was proud.
- **Vaneshade** (`vaneshade`, soft): House Vaneshade is old pyromancer nobility. Its letters carry a black seal; its winter gala is an inspection disguised as a party; its duellists carry pale family wands and open every duel with the same flame flourish they have used for two hundred years. Vaneshades sleep exactly eight hours. Lady Vaneshade's highest praise is "Adequate"; she has a velvet chair reserved at her daughter's bouts, and it stays empty. Vaneshade House stands on the Crescent in the capital: black stone, a scorched practice room on the second floor, a long gallery of portraits in which every Vaneshade but one is unsmiling (the exception is Lyra's grandmother, who made Wildfire), and a kitchen run for thirty years by Mrs Callow, the cook.
- **Hollis** (`hollis_family`, soft): Bram's father was a prefect and head boy at Lumenhold; his portrait hangs in the corridor of head boys, and he stops in front of it on every visit. He has never stopped telling his son he will not amount to anything. Hollis House is a narrow, very correct house on the capital's uptown side, with a polished plate on the door, a piano that is played at noon, and, when she visits, Bram's older sister Hester, who is twenty-three, sharp-tongued, went to Thornwick against her father's wishes and is the only member of the family who isn't afraid of him.

## Style examples

```grim
# content/events/people_others.grim:80
@event bram_intro
title: Running in the Halls
class: routine
tone: tense
actor: bram
when: (not met(bram) or seen(intro_tour) > 0) and turn >= 2
weight: 30
art: scroll
tags: rival
scene: A burly prefect with a red sash blocking a corridor, a demerit ledger open in one hand and a quill poised.
text: "Running in the halls." {met(bram): Bram Hollis, the prefect from the tour,|A burly prefect with a red sash} steps into your path, ledger already open. "Name?" {met(bram): He knows it. |}You weren't running. You were walking briskly.
> left: Accept the demerit
  meet bram
  mood -tiny
  say: He writes your name very slowly, enjoying it. Bram Hollis. You will learn to recognise his footsteps.
> right: Argue
  meet bram
  rel bram -medium
  renown +small
  say: "Walking briskly," you insist. Two demerits: one for running, one for "lip". Some students nearby clap quietly.
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
