# Acceptance checklist

Validators check the first group automatically; the critic (a separate pass, without the author's reasoning) checks the rest. A batch is accepted when everything passes.

**Automatic**
- `grim fmt --check`, `grim lint` with 0 errors (references, vocabularies, ages, canon lint), `grim balance --quick` with 0 invariant failures.
- New events appear in simulation (not in "never seen") unless the report says they're deliberately rare.
- `i18n zh-CN` complete for the batch, tokens intact.

**Critic**
- **Canon:** names, places, facts and history match the worldbook; nothing contradicts hard lore; new names come with a soft `@lore` entry.
- **Voice:** characters sound like their `voice:` and act on their traits and facts.
- **Choices:** no option is obviously best (`costs.md`): options trade by giving different things or by a cost or risk; every cost is one the `say:` shows (body → health, spirits → mood, purchases → crowns, skipped work → `study`/`perform`/`progress`, a person let down → `rel`, a moral side → alignment); every option has a specific `say:`.
- **Spell options** (`up[spell]`): the option does what the spell's `desc` says (`content/world/spells.grim`) and is a clean way through the scene; the text and the other options never assume the player knows the spell, so without it the card reads as an ordinary problem. Mana (and a forbidden spell's alignment) is taken automatically; prose never names it.
- **Repeats:** an "again" line keys on `seen(<own id>) > 1`, not on a counter other cards move; no variant assumes how an earlier showing ended, and every variant of a `say:` shows its option's cost (`pools.md`).
- **Tone:** warm, witty, slightly melancholy; humour from specifics; no gore, nothing explicit, adults only.
- **Length:** text under 400 characters, labels under 36, `say` under 300.
- **Continuity** (the defects the critic found most often in world expansion 1):
  - What the text promises happens: money, an item, a payback or a later scene that a `say:` mentions is in the effects (`gold`, `give`, `queue … in N`).
  - A `say:` that reads a counter or flag comes before the statement that changes it, because its text is filled in at that point.
  - Time, weather and place agree with when the card can show: `slot:` or `{slot == …}`, `{season == …}`, and `{off_campus: …}` for a break spent away.
  - A callback to an earlier scene gates on `seen(<that card>) > 0`. A `learn` that another card can teach first gates on `not knows(<fact>)`. A thing found once doesn't go on glinting after it's found.
  - Numbers of years and ages agree with the timeline and the facts: how long the Ledger has run, how old a tree's ring is.
- **Gating:** `when` conditions are reachable and sensible; queued events are queued by something; flags read are set somewhere (`grim reach` proves it; lint fails on an unreachable event).
- **Wiring:** a card joins its group (`pools.md`, "Where a card lives") and writes only what differs from it: the place's, track's or plan's `pool:`; a `@thread` for a storyline, from a template (`story`, `quest`, `scene`) when its shape is one of theirs; an `@appointment` for something on a schedule; a `@cond` for a condition that recurs.
- **Plot safety:** only hard-canon story events grant key clues or move arc clocks.
- **Leads:** a hint the player has to follow up later (a card at a place, slot or track waiting on this card's flag) leaves a side-thread lead in the Clues panel; `grim leads` shows none missing.
- **Checks** (`checks.md`): the difficulty is what you're actually up against, not who is on the card; odds by nature, luck and drift each carry their own reason, none counted twice; a gamble is on `luck`; grandmaster+ is only on story or milestone cards, with `partial:` and a route without the check; a loss that ends the run has `partial:` or `likely`+; pure luck is `chance <word>`, and a roll a skill or relationship should move isn't a bare `chance`.
- **Alignment:** a choice with moral weight (cruelty, theft, cheating, exploiting someone, reaching for the Star's power; or honesty, protection, generosity at a cost) moves `alignment` (`-tiny`…`-medium` Hollow, `+tiny`…`+medium` Lumen). Ordinary choices don't. Never use alignment, or any counter, as plot progress: plot gates read `clock(arc)` and `clues(arc)`.
- **Duplication:** no event repeats an existing one's premise. Duplicates checked with `retrieve related`; `dupes`, `brief` and grep alone are not enough.
