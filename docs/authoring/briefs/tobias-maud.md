# Brief: a storm threatens the moonflowers the night before a club inspection

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **personal**.

## Cast

### Tobias Fennick (`tobias`)

he/him · age 19 · student year 1 · Rootward · romanceable

*Farmer's son on a turnip scholarship*

Big hands, bigger heart. Talks to plants and, worryingly, the plants seem to answer.

**Voice:** Warm, slow and earnest, with farm sayings and long stories about goats. Apologises too much; laughs from the belly.

**Traits:** kind, gentle, homesick, loyal · **Interests:** plants, animals, cooking, dancing

**Stats:** arcana 12, lore 14, alchemy 26, charm 18, vigor 30, guile 4, wealth 1

**Schedule:** The Greenhouses (morning, afternoon); The Refectory (noon, evening); The Familiar Stables (evening)

**Relations:** Old Maud +20, Bram Hollis -15, Mira Ten +10

**Facts:**
- [surface] A farmer's son on a turnip scholarship, built like a barn door and gentle as a lamb. (`tobias.scholarship`)
- [surface] He talks to plants. Worryingly, they seem to answer. (`tobias.plants`)
- [personal] His mother runs the farm alone at harvest. It's the first harvest he has ever missed. (`tobias.ma`, known when `seen(tobias_homesick) > 0`)
- [personal] He is raising a mandrake called Gerald, who wears a knitted hat and screams softly. (`tobias.gerald`, known when `seen(tobias_godparent) > 0`)
- [personal] The greenhouse moonflowers bloom once every eleven years. He would stand in a storm for them. (`tobias.moonflowers`, known when `rel(tobias) >= 12`)
- [personal] He practised waltzing with a broom before the Midwinter Ball. The broom complained. (`tobias.dancing`, known when `seen(tobias_dance_lessons) > 0`)

### Old Maud (`maud`)

she/her · age 81 · staff · Faculty

*Groundskeeper and hedge-witch*

Keeps bees, chickens and a rather large secret garden. Gives advice you only understand two weeks later.

**Voice:** Folksy and sharp; calls everyone "dearie". Gives advice you only understand two weeks later; tells sad stories over tea as if they were recipes.

**Traits:** kind, eccentric, patient, warm · **Interests:** plants, bees, soup, animals, history

**Stats:** arcana 46, lore 58, alchemy 72, charm 30, vigor 20, guile 34, wealth 2

**Schedule:** Old Maud's Cottage (morning, evening); The Greenhouses (afternoon); The Orchard (noon)

**Relations:** Professor Aldric Thorne +20, Headmistress Isolde Marrow +25, Tobias Fennick +20

**Facts:**
- [surface] Groundskeeper and hedge-witch, keeper of bees, chickens and a goat called Bartholomew. (`maud.groundskeeper`)
- [personal] She was a student here sixty years ago, the spring the lake froze. (`maud.student`, known when `seen(maud_old_student) > 0`)
- [personal] Her soup cures colds, broken hearts and most curses. You're not allowed to write it down. (`maud.soup`, known when `seen(maud_recipe) > 0`)
- [personal] Behind the potting shed there is a door to a garden that only exists for people she shows it to. (`maud.garden`, known when `seen(garden_maud_secret) > 0`)
- [personal] She is eighty-one, and says she's allowed the occasional chill. (`maud.age`, known when `seen(maud_ill) > 0`)

## Track: Verdant Circle (`verdant`)

club · alchemy · ranks: Member, Gardener, Head Gardener · 2 required visits per term

The greenhouse club: moonflowers, mandrakes and long talks with plants that occasionally answer.

**Lead:** Tobias Fennick

## Lore

- **frozen lake** (`lake_freezes`, soft): When the seal is at its weakest, on the night of the Blossom moon, the lake freezes in a single breath in the middle of spring. Cracks glow beneath the ice and things made of frost and whispers come ashore.
- **Fennick** (`fennick_farm`, soft): The Fennick farm grows turnips, tomatoes and stubborn children. Tobias's mother runs it alone at harvest; one year blight nearly ruined them.
- **greenhouses** (`greenhouses`, soft): Glass houses that steam even in winter. The moonflowers there bloom once every eleven years and fill the greenhouse with silver light.
- **Harvest Feast** (`festivals`, soft): The Harvest Feast opens the year; on Lantern Night lanterns carry wishes over the lake; the Midwinter Ball fills the Great Hall; the Spring Tournament crowns a duelling champion; and at Starfall the whole academy sleeps on the lawns to watch the meteors.
- **Club Fair** (`fairs`, soft): In Emberwane the Club Fair fills the courtyard with recruiting tables; the Job Board in the entrance hall posts term-time work. The Artificers' Fair shows off students' machines, and in summer the village holds its Midsummer Fair with an enchanted carousel.
- **Pell & Daughters** (`pell_and_daughters`, soft): The village apothecary, with a thousand labelled drawers. Old Pell taught three generations to count drops.

## Style examples

```grim
# content/events/pools/clubs_jobs.grim:258
@event verdant_tobias_cuttings
title: The Cuttings Question
track: verdant
rank: 2
class: routine
tone: warm
repeat: 5
weight: 10
actor: tobias
art: leaf
tags: club nature
scene: A big gentle student cradling a tray of leggy cuttings, eyeing a full compost heap with dread.
text: {The benches are full and someone must choose which cuttings stay. Tobias can't. "It's like choosing between goats," he says.|Bench day. Tobias hovers over a tray of cuttings, apologising to them in advance and glancing at you.|Tobias hands you the tray before he can change his mind. He is grateful in a way that looks like grief.} {season == "autumn": The frost will take the weakest soon anyway.|}
> left: Choose, and compost the rest
  perform verdant +small
  rank_xp verdant +small
  rel tobias -tiny
  mood -tiny
  say: {~You keep the strongest and compost the rest. Tobias says "fair's fair", then goes very quiet over the heap.|The benches breathe again. Tobias thanks you, then tells you a long story about a goat he couldn't sell. You understand it is about the cuttings.}
> right: Find room for every one
  rel tobias +small
  perform verdant -tiny
  mood +tiny
  say: {~You find room on windowsills, under benches and in a teacup. Nothing grows well, but everything grows. Tobias laughs from the belly.|"Ma always said a crowded field still feeds you," Tobias says, beaming. The benches groan. So does Old Maud, when she sees.}
```

```grim
# content/events/clubs.grim:349
@event garden_maud_secret
title: The Secret Garden
class: windfall
tone: light
when: member(verdant) or (month >= 7 and month <= 9)
actor: maud
weight: 10
art: mushroom
tags: club nature
scene: An old woman in a battered straw hat holding open a hidden door in an ivy-covered wall; beyond, impossible flowers glow.
text: The old groundskeeper beckons you behind the potting shed, to a door in the wall you've walked past a hundred times without seeing. "You've got the hands for it," Old Maud says. "Want to see what grows where nobody's looking?"
> left: Thank her and decline
  meet maud
  rel maud +tiny
  say: "Suit yourself." The door is gone when you look back.
> right: Follow her in
  meet maud
  rel maud +medium
  alchemy +small
  gain blessed
  say: Inside: glowing ferns, silver bees, a pear tree that hums. Maud tucks a sprig of rosemary into your pocket. "For luck. Don't lose it."

# ---------------- Stargazers ----------------
```

```grim
# content/events/expansion_people.grim:128
@event tobias_storm_greenhouse
title: Storm Over the Greenhouses
class: routine
tone: tense
trigger: social
actor: tobias
when: rel(tobias) >= 12 and month >= 6 and month <= 8
weight: 12
art: bolt
tags: nature danger
scene: Rain lashing a glass greenhouse at night, panes cracking, a big boy holding a door shut against the wind while plants rattle inside.
text: A storm hits at midnight. Glass is cracking in the greenhouses. Tobias is out there in his nightshirt, trying to hold a door shut against the wind with his whole body. "The moonflowers!" he shouts. "Eleven years!"
> left: Run out and help
  health -small
  rel tobias +large
  spark tobias +tiny
  say: You hold the panes together with every shielding charm you know until dawn. Every moonflower survives. Tobias hugs you, soaked, laughing, half crying.
> right: Fetch Old Maud
  rel tobias +small
  rel maud +small
  say: Maud arrives in her dressing gown, mutters three words at the sky, and the wind politely goes elsewhere. Tobias stares at her. "Teach me that," he says.

# ---------------- Seraphine ----------------
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
- **Choices:** every option costs or risks something; no obviously better option; every option has a specific `say:`.
- **Tone:** warm, witty, slightly melancholy; humour from specifics; no gore, nothing explicit, adults only.
- **Length:** text under 400 characters, labels under 36, `say` under 300.
- **Gating:** `when` conditions are reachable and sensible; queued events are queued by something; flags read are set somewhere.
- **Plot safety:** only hard-canon story events grant key clues or move arc clocks.
- **Duplication:** no event repeats an existing one's premise (check `grim query event --grep <word>`).
