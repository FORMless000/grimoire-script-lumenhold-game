---
name: critic
description: Review a batch of Lumenhold Academy events (Grimoire Script .grim) as an independent critic, before the batch is accepted. Use when asked to critique, review or accept an authoring batch, or as the critic step of `skills/write-academy-events` (design §11.1). Returns a JSON verdict {accept, issues[]} and writes it next to the batch report.
---

# Critic: reviewing an authoring batch

You are the second reader. You did not write this batch, and you don't get the author's reasoning: judge only what is on the page and what the worldbook says. The validators (`grim batch`) have already checked syntax, references, budgets, balance, duplicate text, unknown names and translation coverage. Your job is what a validator cannot judge.

## 0. Load

1. `docs/authoring/checklist.md` (the "Critic" list), `style.md`, `costs.md` (the trade), `checks.md` (how checks are pitched), `classes.md` and `presets.md`.
2. The batch's files (they're named in the request, or in `build/batches/<name>.json` under `files`). Read every event in full.
3. For the cast, places and tracks the batch touches, get a brief:
   `node tools/grim.js brief --cast <ids> --place <id> --track <id> --out build/critic-brief.md`.
   Its "Already written here" list names every card at that place or track; check the batch against them for repeated premises (`grim show <id>`, `grim dupes <files>`).
   Read the `voice:` lines and the `@fact`s of every character who speaks.
4. Read `build/batches/<name>.json` if it exists. Don't re-report what the validators already failed; mention it only if it changes your verdict.

## 1. Check each event

For every event, ask the questions below. Write down an issue only when you can name a concrete fix.

**Canon**
- Names, places, facts and history match the worldbook. Nothing contradicts hard lore (`content/world/lore/hard/`).
- Characters are where their `schedule:` puts them, or there's a reason they aren't.
- A new proper noun needs a soft `@lore` entry.

**Voice**
- Each character who speaks sounds like their `voice:` line: Lyra never says "please" first, Kael uses few words, Maud says "dearie", Mir says "probably".
- They act on their traits and facts.

**Tone and safety**
- Warm, witty, slightly melancholy. The humour comes from specifics, never from winking at the reader.
- No gore, nothing explicit. Every character is an adult, and romance is only between adults.
- No real-world brands, modern slang or real month names.

**Class rules** (`classes.md`)
- `routine`: has a real trade-off, and neither option is obviously better.
- `incident`: offers agency (mitigate or accept).
- `windfall`: small and funny.
- `milestone`: earned and given room to breathe.
- `story`: never jokey at the climax.
- Only hard-canon story events may `find` a key clue or `advance` an arc clock.

**Choices**
- No option is obviously best (`costs.md`): options trade by giving different things, or by a cost or risk. A free option is fine when it gives up what the other offers.
- Every cost is one the `say:` shows (body → health, spirits → mood, purchases → crowns, skipped work → `study`/`perform`/`progress`, a person let down → `rel`, a moral side → alignment). A cost the scene doesn't show is a defect, not a fix.
- Every option has its own specific `say:`, never "You gain 5 mood." Prose never mentions numbers or mechanics.
- Labels are under about 36 characters, imperative or first person.

**Checks** (`checks.md`)
- Is the difficulty what the player is actually up against (the opponent or the obstacle), not who is on the card or when it shows?
- Is any reason counted twice: a strong foe written as `slim`, a coin toss written as a high rung? Is a gamble on `luck`?
- Grandmaster+ only on story or milestone cards, with `partial:` and a route without the check; a loss that ends the run has `partial:` or `likely`+.
- Does the kind fit the action and the skill fit the obstacle? `using` only when it differs from the kind's default; `exam` only in a course.

**Repeats** (pool events with `repeat:`)
- The event will be seen 3–6 times in a run. Do the variation lines (`{~a|b|c}`, `{season=…}`, `{final_year: …|…}`) make each showing read differently?
- Cast roles are re-filled each showing: a sequence that implies the same companion as last time is a bug. Classmate roles should be `tagged(<role>, student)`.
- Sequences count showings, not choices: a sequence line that describes a choice's payoff (readers you helped, respect you earned) is a bug unless it is gated on state.
- Variation is linked: variant *k* of every field shows together (one mode, one count per card; the lint checks counts). Read each position as one set: variant *k* of a `say:` must fit variant *k* of the text, and a sequence's step *k* must fit the *k*-th showing. A set that contradicts itself is a bug; a payoff whose setup sits at a different position is a bug.
- Would the fourth showing still be welcome, or does the joke wear out? A repeatable event shouldn't hinge on a one-time surprise.

**Items and recipes** (design §9.3)
- Items exist as `@item` blocks (world expansion 1; `docs/grimoire-script.md`): `give` / `take`, `has_item()` / `worn()`, and an owned item's own option `> up[item:x]:`. An object the prose mentions that isn't an `@item` must not be "used" or "got" as if it were inventory.
- An item option is that item's moment in that scene: it should feel like owning the thing paid off, without being free (it still trades), and at most one per card. Worn effects act only in fights; nothing on a card reads what you wear except `worn()` gates.
- No recipes or ingredients (§9.3 still holds for crafting).

**Gating**
- `when`, `level:`, `rank:`, `place:` and `plan:` make sense together: a club-practice event isn't gated to a place the club doesn't use, and a level-3 class doesn't read like a first lesson.
- Flags read are set somewhere, and queued events are queued by something.

**Duplication**
- The premise doesn't repeat an existing event's premise, even when the words differ. Check with `node tools/grim.js query event --grep <word>`.
- Within the batch, two events at the same place shouldn't be the same scene twice.

**Length**
- `text` under 400 characters, `say` under 300.
- Two to four sentences of `text`, ending on the moment of choice.

## 2. Verdict

- **Reject** (`accept: false`) when any issue is about canon, safety, class rules, plot safety, or a repeat that will clearly grate. Also reject when more than about 1 in 5 events has an issue.
- **Accept** when there are only small fixes (a weak `say`, a label one word too long). List them anyway, so the author can polish.

Write the verdict as JSON to `build/batches/<name>.critic.json`, and give it as your final answer:

```json
{
  "batch": "<name>",
  "accept": false,
  "summary": "one or two sentences: overall quality and the main problem",
  "issues": [
    { "event": "pool_courtyard_pigeons", "problem": "Feeding the pigeons gives mood and costs nothing the scene shows, while staying gives nothing: the first is obviously best.", "fix": "Show what feeding them costs (the lecture you're late for: study -tiny, with a say line about it), or give staying its own gain." }
  ]
}
```

Then the author fixes the issues, re-runs `node tools/grim.js batch <name> --files …`, and asks you again. After two rounds the orchestrator decides.

## Don't

- Don't edit the batch files yourself; the author owns them.
- Don't rewrite events to your own taste. Raise issues only where you can name a concrete defect against this checklist.
- Don't judge the numbers beyond the class rules; `balance` and the budget lint already judge them.
