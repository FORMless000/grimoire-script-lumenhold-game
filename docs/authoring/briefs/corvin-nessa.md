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

**Schedule:** The Courtyard (noon, afternoon); The Third Gargoyle (night, midnight); The Gilded Newt (evening)

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
- [personal] Nobody has interviewed the headmistress in twenty years. She means to be the first. (`nessa.interview`, known when `rel(nessa) >= 20`)
- [personal] She would chain herself to the printing press before letting anyone shut the Ledger. (`nessa.press`, known when `seen(nessa_paper_threatened) > 0`)

## Place: The Third Gargoyle (`gargoyle_passage`)

castle · club · open night, midnight

Behind the third gargoyle on the north parapet, a passage that isn't on any map. Except theirs.

Teaser while undiscovered: Corvin keeps glancing at a particular gargoyle.

**Usually here:** Corvin Ashby (night, midnight)

## Lore

- **gargoyle** (`gargoyles`, soft): The castle is riddled with passages that appear on no official plan. The way into the Midnight Cartographers' world is behind the third gargoyle on the north parapet.
- **Founders' Ledger** (`founders_ledger`, soft): The Founders' Ledger in the archive vault is three hundred years old. The entry for the founding year was cut out with a razor, but the impression of the pen remains on the page beneath. A client of Grisk's once paid to have another page removed.
- **Ashby** (`ashby_family`, soft): Corvin's grandfather owned a genuinely lucky deck of cards; his brother turns up at the gates wanting money. Home, Corvin says, is not a good place.
- **secret garden** (`secret_garden`, soft): Behind the potting shed, a door in the wall leads to Maud's secret garden: glowing ferns, silver bees and a pear tree that hums. It only exists for people Maud has shown it to.
- **Pell & Daughters** (`pell_and_daughters`, soft): The village apothecary, with a thousand labelled drawers. Old Pell taught three generations to count drops.

## Style examples

```grim
# content/events/people_students.grim:818
@event nessa_intro
title: First Impressions
actor: nessa
when: not met(nessa) and turn >= 2
weight: 14
art: paper
tags: social
scene: A girl with ink-stained fingers and a self-writing quill floating at her shoulder, holding a notebook out expectantly.
text: A girl with a quill floating at her shoulder plants herself in front of you. "Nessa Quill, Lumen Ledger. First impressions of Lumenhold, go. Be interesting, please. The last six were boring."
> left: Give a safe answer
  meet nessa
  rel nessa +1
  say: The quill writes "SAFE" in the margin and underlines it twice. Nessa sighs and moves on.
> right: Say something outrageous
  meet nessa
  check charm 12:
    renown +4
    rel nessa +6
    say: You're quoted on the front page. Half the academy now thinks you're hilarious. The other half thinks you're dangerous. Nessa thinks both.
  else:
    renown +2
    rel nessa +2
    mood -3
    say: You are quoted. Out of context. Extremely out of context.
```

```grim
# content/events/expansion_people.grim:383
@event nessa_burnout
title: The Editor Sleeps
trigger: social
actor: nessa
when: rel(nessa) >= 20 and year >= 2
weight: 10
art: candle
tags: social
scene: A girl asleep at a desk in a newspaper office, her self-writing quill still scratching on its own, the candle burned down to a stub.
text: Nessa hasn't slept properly in a week. She's asleep at her desk now, and her quill — unsupervised — is still writing next week's paper. It has started inventing news.
> left: Put her to bed and run the paper yourself
  rel nessa +10
  grades -3
  say: You edit, typeset and print one issue. It's adequate. When Nessa wakes she reads it, winces at your headlines, and hugs you for a long time.
> right: Wake her and make her rest
  rel nessa +6
  say: She argues for ten minutes, then sleeps for fourteen hours. The quill's invented news about a dragon in the kitchens turns out to be true.

# ---------------- Kael ----------------
```

```grim
# content/events/people_students.grim:487
@event corvin_intro
title: Light Fingers
actor: corvin
when: not met(corvin) and turn >= 2
weight: 14
art: mask
tags: social
scene: A dark-haired student with a crooked grin holding up a purse between two fingers, mid-bow.
text: Someone bumps you in the crowd. A moment later a dark-haired boy is bowing and holding up your purse. "You dropped this," he says. "Into my pocket. Terrible habit of yours. Corvin Ashby."
> left: Snatch it back and report him
  meet corvin
  rel corvin -5
  say: He's gone before the prefect arrives. Your purse is lighter by exactly one crown and heavier by one IOU.
> right: Laugh
  meet corvin
  rel corvin +7
  guile +1
  say: "Oh, I like you," he says, and teaches you the trick on the spot. You practise it on him. He lets you win. Probably.
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
