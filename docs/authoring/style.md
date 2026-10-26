# Style

## Tone

Warm, witty and slightly melancholy, like a cosy fantasy novel. Humour comes from specifics (a mandrake in a knitted hat, a quill that invents the news), never from winking at the reader. Sad moments are allowed and should be earned. No gore, nothing explicit, no real-world brands, no modern slang. Every character is an adult; romance is only between adults (lint enforces ages).

## Voice

- **Second person, present tense** for `text` ("You find Lyra on a window seat…"); `say:` lines continue it.
- **Characters sound like their `voice:`** in `content/world/cast.grim`. Lyra never says "please" first; Kael uses few words; Maud calls you "dearie"; Mir says "probably". Read the voice line before writing dialogue, and keep characters' facts consistent with their `@fact`s.
- **Events by class** (`classes.md`):
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
| `scene:` | one sentence describing the scene (shown under the card) |
| zh-CN label | 14 characters or fewer |

## Choices

- No option is obviously best (`costs.md`): options trade by giving different things, or by a cost or risk the `say:` shows. A free option is honest when it gives up what the other offers; never add a cost the scene doesn't show. A choice between two good things or two bad things beats an obvious one.
- Every option has an effect and almost always a `say:`. Outcomes are specific ("Footnote sits on your essay"), never "You gain 5 mood."
- Skill checks state their odds on the button automatically; write success and failure as two real outcomes, not "it works / it doesn't".

## Conflict and climax

For plots, arcs and any storyline where characters clash. Louder doesn't mean longer: the length limits hold, and the volume comes from what happens on the card.

- **On the page, in the moment.** A confrontation happens in front of the player, out loud: an accusation, a raised wand, a door slammed, a name shouted across the ice. Not reported afterwards ("you hear they argued"), not a hint, not a meaningful look. Give each side a line of dialogue that only they would say.
- **The opposition acts.** Antagonists come to the player, in places the player knows, and each return is bolder than the last (a stranger at the gate, then a strike in the courtyard at noon). Allies have their own stakes and quarrel with each other, not only with the villain.
- **Choices under pressure.** Each card in a confrontation ends on one decision that can't wait, and its options are different ways through (a fight, words, guile, help called in), not yes and no. Every fight sits beside a way that isn't a fight, so a player who avoids or loses fights still reaches the end.
- **Losing costs something real, and never closes the story.** A lost confrontation takes a clue, an item, an ally's trust or time on the clock, and leaves a way to win it back.
- **A climax is a run of scenes.** Several cards in one sitting (a `scene` thread), the stakes rising card by card. One card says once who is with the player; the later cards name them through the actor, never by re-deciding it.
- **Every planted thing pays off.** Each clue, item or promise planted earlier has its beat in the climax: found, it makes that beat easier or opens a better way; missed, the beat still happens at a higher cost. Nothing planted is left unexplained, and nothing new is planted after the end.
- **The ending lands at once.** What a climax gives or takes is visible on its own card or the aftermath right after (not a stat already at its cap), and the aftermath says what changed.

## Don't

- Don't invent proper nouns without a soft `@lore` entry; don't contradict hard canon.
- Don't grant key clues or move the Hollow Star clock outside hard-canon story events.
- Don't use real-world month names: the world's calendar is Harvestmoon … Starfall.
- Don't reference mechanics in prose ("+5 mood"); the chips show the numbers.
- Don't rename or reuse existing ids.
