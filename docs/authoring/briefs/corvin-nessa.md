# Brief: a secret passage leads to the Ledger's archive and an old scandal

Context pack for writing events. Canon is what is written here and in the worldbook; anything new must be added as soft lore. Facts are included up to tier **personal**.

## Cast

### Corvin Ashby (`corvin`)

he/him · age 20 · student year 2 · Duskgate · romanceable

*Charming liability*

Knows every locked door in the academy and has opinions about all of them. Owes money to at least three people.

**Voice:** Quick, teasing, deflecting with jokes; calls you "saint" when you're being good. When he means something, the jokes stop and so does he.

**Traits:** charming, reckless, loyal, secretive · **Interests:** maps, locks, cards, money

**Stats:** arcana 16, lore 12, alchemy 14, charm 30, vigor 18, guile 38, wealth 1

**Schedule:** The Courtyard (noon, afternoon); The Third Gargoyle (night); The Third Gargoyle (midnight, 40% of days); The Gilded Newt (evening)

**Relations:** Bram Hollis -30, Nessa Quill +10

**Facts:**
- [surface] Knows every locked door in the academy and owes money to at least three people. (`corvin.locks`)
- [personal] He is on his last warning. One more detention and they send him home, and home is not a good place. (`corvin.last_warning`, known when `seen(corvin_rooftop) > 0`)
- [personal] His grandfather's lucky deck sat in the confiscation vault for decades. It really is lucky. (`corvin.grandfather`, known when `seen(corvin_confiscation_vault) > 0`)
- [personal] He once owed thirty crowns to trolls and offered to pay you back with a goat. (`corvin.trolls`, known when `seen(corvin_debt) > 0`)

### Nessa Quill (`nessa`)

she/her · age 20 · student year 2 · Duskgate · romanceable

*Editor of the Lumen Ledger*

Runs the student paper with a quill that writes on its own. Everyone is a story; some are just not finished yet.

**Voice:** Rapid, bossy, headline-shaped. Treats every conversation as an interview; goes very quiet when it's off the record.

**Traits:** nosy, idealistic, overworked, bold · **Interests:** writing, gossip, justice

**Stats:** arcana 14, lore 26, alchemy 8, charm 30, vigor 12, guile 24, wealth 2

**Schedule:** The Lumen Ledger Office (afternoon, evening, night); The Courtyard (noon)

**Relations:** Bram Hollis -20, Corvin Ashby +10, Lyra Vaneshade -5

**Facts:**
- [surface] Editor of the Lumen Ledger, with a quill that writes on its own. (`nessa.editor`)
- [personal] Left unsupervised, her quill starts inventing the news. (`nessa.quill`, known when `seen(nessa_burnout) > 0`)
- [personal] Nobody has interviewed the headmistress in twenty years. She means to be the first. (`nessa.interview`, known when `rel(nessa) >= 12`)
- [personal] She would chain herself to the printing press before letting anyone shut the Ledger. (`nessa.press`, known when `seen(nessa_paper_threatened) > 0`)

## Track: The Lumen Ledger (`lumen_ledger`)

club · charm/lore · ranks: Stringer, Reporter, Editor · 2 required visits per term

The student newspaper. Scoops, deadlines, gossip columns and the occasional duty to the truth.

**Lead:** Nessa Quill

## Already written here (35)

- `alch_corvin_market` A Side Business (routine)
- `ledger_pie_scoop` The Case of the Missing Pies (routine)
- `ledger_bram_story` The Prefect's Bribes (routine)
- `ledger_deadline` Deadline Night (routine)
- `carto_invite` An Invitation at Midnight (routine)
- `corvin_confiscation_vault` The Confiscation Vault (routine)
- `corvin_brother` Corvin's Brother (routine)
- `corvin_cards` How to Cheat at Cards (routine)
- `nessa_headmistress_interview` The Impossible Interview (routine)
- `nessa_typo` A Catastrophic Typo (routine)
- `nessa_burnout` The Editor Sleeps (routine)
- `corvin_intro` Light Fingers (routine)
- `corvin_kitchen_raid` The Kitchen Raid (routine)
- `corvin_debt` Corvin's Little Problem (routine)
- `corvin_repays` Interest (story)
- `corvin_rooftop` Up on the Roof (routine)
- `corvin_framed` Corvin Is Framed (routine)
- `corvin_confession` Corvin, Serious for Once (milestone)
- `corvin_runaway` Let's Leave Tonight (story)
- `nessa_intro` First Impressions (routine)
- `nessa_gossip_column` You're in the Gossip Column (routine)
- `nessa_source` The Source (routine)
- `nessa_hollow_story` Nessa Smells a Story (story)
- `nessa_paper_threatened` Stop the Presses (routine)
- `nessa_confession` Off the Record (milestone)
- `lumen_ledger_letters_box` The Letters Box (routine, rank 1)
- `lumen_ledger_courtyard_quotes` A Word from the Courtyard (routine, rank 1)
- `lumen_ledger_red_ink` Red Ink (routine, rank 2)
- `lumen_ledger_front_page` Front Page (milestone, rank 2)
- `cartographers_inking_night` Inking Night (routine)
- `cartographers_silver_pen` A Pen of Your Own (milestone)
- `letter_corvin_bakery` The Best Bakery in the Kingdom (routine)
- `letter_corvin_no_jokes` A Letter With No Jokes (routine)
- `letter_nessa_deadline` URGENT (routine)
- `letter_nessa_off_record` Off the Record (routine)

## Lore

- **Founders' Ledger** (`founders_ledger`, soft): The Founders' Ledger in the archive vault is three hundred years old. The entry for the founding year was cut out with a razor, but the impression of the pen remains on the page beneath. A client of Grisk's once paid to have another page removed.
- **Lumen Ledger** (`lumen_ledger`, soft): The student newspaper, printed at dawn on a press that groans like a dragon. Its gossip column is feared; its editor, Nessa Quill, has a quill that writes on its own.
- **Lumen** (`lumen_and_hollow`, soft): Lumenhold talks about people the way it talks about candles: some give light (Lumen), some swallow it (the Hollow). It is not a house or a club, only what people notice. Those who lean toward the Hollow find the Star noticing them back; the way out of it is slow, and usually starts with someone handing you something to do.
- **Ashby** (`ashby_family`, soft): Corvin's grandfather owned a genuinely lucky deck of cards; his brother turns up at the gates wanting money. Home, Corvin says, is not a good place.
- **secret garden** (`secret_garden`, soft): Behind the potting shed, a door in the wall leads to Maud's secret garden: glowing ferns, silver bees and a pear tree that hums. It only exists for people Maud has shown it to.
- **Pell & Daughters** (`pell_and_daughters`, soft): The village apothecary, with a thousand labelled drawers. Old Pell taught three generations to count drops.
- **Lumen Essay Prize** (`lumen_essay_prize`, soft): An annual prize of fifty crowns for the best student essay on a set theme, judged by the faculty. Past themes include "Magic and Duty".

## Style examples

```grim
# content/events/pools/clubs_jobs.grim:158
@event lumen_ledger_red_ink
title: Red Ink
track: lumen_ledger
rank: 2
class: routine
tone: tense
repeat: 5
weight: 10
actor: nessa
art: scroll
tags: club
scene: A cramped office papered with old front pages, an editor slashing a manuscript with a red quill.
text: {Nessa edits your story with a red quill and no mercy.|Nessa has your draft, and this time the red quill hesitates once before it moves.|Edit night. You have learned to bring two copies, one for Nessa to kill.} "{~Kill your darlings. Bury them. Page six.|Lead's buried. Dig it up. Headline it.|Good. Too long. Shorter. Shorter than that.}" She has cut your favourite paragraph.
> left: Fight for the paragraph
  challenge negotiate vs nessa.charm medium:
    win:
      perform lumen_ledger +small
      rank_xp lumen_ledger +small
      say: {~Nessa reads it again, out loud, and puts it back. "Fine. Stays. Don't get used to it."|You win the paragraph. Nessa makes you cut a different one, as a tax.}
    lose:
      mood -small
      rel nessa -tiny
      say: {~"No," says Nessa, and that is the whole argument.|She listens to your case with great interest, then cuts the paragraph anyway, plus the one you defended it with.}
> right: Let her cut it
  perform lumen_ledger +small
  mood -small
  say: {~It reads better without it. You will never forgive her.|The story runs, tighter and less yours. Nessa scribbles "good" in the margin, a word Nessa hands out like gold.}
```

```grim
# content/events/clubs.grim:284
@event ledger_deadline
title: Deadline Night
class: routine
tone: light
track: lumen_ledger
actor: nessa
weight: 12
art: candle
tags: club
scene: The newspaper office at 3am, crumpled drafts on the floor, two students slumped over typesetting trays.
text: The press runs at dawn and half the paper is blank. Nessa is chewing her quill. "I need you tonight. All night. I'll owe you."
> left: You have an exam tomorrow
  study +tiny
  rel nessa -tiny
  say: You sleep. The paper comes out with a large drawing of a duck on page four. Nessa doesn't speak to you for a day.
> right: Pull an all-nighter
  health -small
  study -tiny
  rel nessa +medium
  say: You write three articles and a horoscope. At dawn Nessa falls asleep on your shoulder, ink on her nose.

# ---------------- Verdant Circle ----------------
```

```grim
# content/events/clubs.grim:234
@event ledger_pie_scoop
title: The Case of the Missing Pies
class: routine
tone: light
track: lumen_ledger
actor: nessa
weight: 14
art: paper
tags: club social
scene: A cramped newspaper office in a tower attic, a printing press clanking, a girl with an ink-stained grin pointing at a map pinned with string.
text: Nessa slams a file on your desk. "Pies. Forty-two of them, gone from the kitchens in a single night. I want the culprit, I want a photo and I want it by Friday."
> left: Write a light-hearted piece
  charm +tiny
  say: "Pie-rates Strike Again." Nessa groans at the headline and prints it anyway.
> right: Actually investigate
  challenge deceive easy:
    win:
      renown +small
      rel nessa +medium
      say: The culprit: a family of brownies living in the chimney. Your story runs on the front page. Nessa frames it.
    lose:
      mood -tiny
      rel nessa +tiny
      say: You stake out the kitchens for three nights and catch nothing but a cold. Nessa pats your head.
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
