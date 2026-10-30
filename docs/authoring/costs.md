# The trade: what each value means, and what a cost should be

> How a choice trades (design §8.4; playtest 2, A3). The sizes are in `presets.md`; the rule the lint checks is in `classes.md`.

## The rule

- **No option is obviously best.** A routine card's options trade against each other: they give different things, or one costs or risks something the other doesn't. The lint fails a card when one option is at least as good as another on every value and better on one, with no risk on either side.
- **A free option is honest** when choosing it gives up what the other option offers (an evening of study instead of an evening with friends). Don't add a cost to a free option to make it "trade": the other option is its cost.
- **A cost is something the scene shows.** If the `say:` doesn't show the player paying it (tired legs, a spent crown, a friend's cool look, a missed lecture), it isn't a cost: drop it, pick the one the scene does show, or write the line that shows it. On a card with variants, every variant of the `say:` shows it.
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
| `arcana` `lore` `alchemy` `charm` `vigor` `guile` | skills (XP) | never a cost (rust is the engine's; the lint rejects a card that lowers one) | practice that matches the scene: spellcraft, study, brewing, persuasion, exertion and duelling, sneaking and noticing |

**Track and relationship costs** (often the honest ones):

| Statement | Use it when |
|---|---|
| `study <course> -tiny` / `study -tiny` | you skip a lecture, a revision night, a class's homework: that course's exam readiness drops (`study -tiny` without a course: every enrolled course) |
| `study <course> +tiny` / `study +tiny` | (a gain, 2026-10-19) extra work beyond class: a card's study gain is `+tiny`; preparation comes mostly from routine sources (each class month +3, +5 with a check won in class, the library's revision card +3), so exams stay predictable. A larger gain needs a matching price (a night, money, a favour), and study costs elsewhere balance the gains |
| `perform <track> -tiny` | you slack, leave early or annoy the boss at a club or job (`perform track` in the track's own cards) |
| `progress thesis -tiny` | the thesis waits while you do something else |
| `rel <npc> -tiny` / `spark <npc> -tiny` | you snub, disappoint, refuse or embarrass someone; a romantic moment goes flat |

**Alignment is a cost too.** A tempting option (keep the purse, read the letter, cheat the game, take the shortcut someone pays for) should put alignment at stake: `alignment -tiny`/`-small` on the tempting side, and `alignment +tiny` only when the honest side costs something real. Ordinary prudence (going to bed, saying no to a party) has no moral weight.

A spell with `alignment:` (Sleight, and every forbidden spell) takes it on each cast, automatically. Its `up[spell]` option adds none of its own unless the act is worse than the cast.

## Checks before you finish an option

1. What does the player give up? If it's the other option, the option can be free.
2. Does the `say:` show the cost? If not, change the cost or the line.
3. Is there a moral side? Then alignment moves.
4. Does it skip study, work, practice or a person? Use `study`, `perform`, `progress` or `rel` instead of a vague `mood -tiny`.
