# Style

## Tone

Warm, witty and slightly melancholy, like a cosy fantasy novel. Humour comes from specifics (a mandrake in a knitted hat, a quill that invents the news), never from winking at the reader. Sad moments are allowed and should be earned. No gore, nothing explicit, no real-world brands, no modern slang. Every character is an adult; romance is only between adults (lint enforces ages).

## Voice

- **Second person, present tense** for `text` ("You find Lyra on a window seat…"); `say:` lines continue it.
- **Characters sound like their `voice:`** in `content/world/cast.grim`. Lyra never says "please" first; Kael uses few words; Maud calls you "dearie"; Mira says "probably". Read the voice line before writing dialogue, and keep characters' facts consistent with their `@fact`s.
- **Events by class** (classes arrive in phase 2a; write with them in mind now):
  - *routine*: everyday life; light, quick, a small trade-off.
  - *milestone*: friendships, confessions, promotions; let them breathe.
  - *incident*: something goes wrong; give the player agency (mitigate or accept).
  - *windfall*: good luck; keep it small and funny.
  - *story*: main-plot and arc beats; tense or eerie, never jokey at the climax.

## Lengths

| Field | Limit |
|---|---|
| `title` | 2–6 words, Title Case |
| `text` | under 400 characters (lint warns at 480); two to four sentences, ending on the moment of choice |
| option label | under about 36 characters; imperative or first person ("Open the book", "I'll be there.") |
| `say:` | one or two sentences, under 300 characters |
| `scene:` | one sentence describing an illustration |
| zh-CN label | 14 characters or fewer |

## Choices

- Every option costs or risks something; a choice between two good things or two bad things beats an obvious one.
- Every option has an effect and almost always a `say:`. Outcomes are specific ("Footnote sits on your essay"), never "You gain 5 mood."
- Skill checks state their odds on the button automatically; write success and failure as two real outcomes, not "it works / it doesn't".

## Don't

- Don't invent proper nouns without a soft `@lore` entry; don't contradict hard canon.
- Don't grant key clues or move the Hollow Star clock outside hard-canon story events.
- Don't use real-world month names: the world's calendar is Harvestmoon … Starfall.
- Don't reference mechanics in prose ("+5 mood"); the chips show the numbers.
- Don't rename or reuse existing ids.
