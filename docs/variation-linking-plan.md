# Linked text variation: plan (2026-10-15)

> Goal: a card's variant groups pick matching positions, so variant *k* of the setup always meets variant *k* of the outcome. Authors can then write setup ↔ payoff pairs instead of making every outcome fit every setup.

## What the engine does today

`vary()` / `variant()` in `src/engine.js` (§ Text):

| Group | Picks | Linked across a card's fields? |
|---|---|---|
| `{a\|b\|c}` sequence | the showing number, clamped to the last | **yes**: every group reads the same `seen[event]` |
| `{&a\|b}` cycle | the showing number, wrapped | **yes**, the same way |
| `{~a\|b\|c}` random | a hash of seed, turn, event **and the group's own text** | **no**: each group hashes its own text, so each picks on its own |
| `{cond: a\|b}` | the condition | n/a |

So the random groups desync. Variant 2 of the text can meet variant 1 of the outcome. The critic has flagged this repeatedly: `evo_shaping_hour`, `illu_good_news`, `grimsbys_wrong_book`, `tamsin_letter_questions`, and the "every outcome must fit every independently selected setup" rule in its reports. Our fixes worked around it by making every outcome generic.

Two smaller leaks:
- The history and log calls interpolate labels and titles **without the event key** (`engine.js` lines ~148, 1521, 1522, 1547). A varied label or title can be recorded differently from how it was shown.
- No lint rule checks variant counts, in English or in translations.

## Content today

The figures come from a scan of the compiled content: the title, text, scene, option labels and every `say:` in every branch of every event. Hints, `locked:` text and per-actor say overrides weren't scanned; the lint rule will cover them.

- 989 events; 419 have variation.
- Groups: 1,387 random (`{~}`), 345 sequence, 38 cycle.
- 384 events have random groups in two or more fields. Only 88 of them use one count throughout.
- **297 events mix counts**: 292 mix 2 and 3, and five mix 2 with 4 or 5. 743 groups are below their card's largest count. The usual shape is 3-part flavour in the setup and 2-part phrasings in the outcomes.
- Sequence and cycle counts already agree within every card.
- 43 fields hold two random groups each (two flavour details in one sentence).
- Outside events: 11 `say:` lines in states use `{~}`; endings use none.

## Does current writing actually desync? (sampled)

- **A random sample of 20 cards with random variants in two or more fields:** 2 desync clearly and 2 mildly. Most outcomes are written to fit any setup, as the critic asked.
  - `alch_original_remedy`: "your headache lifts" when the setup made the remedy for a cold or nerves.
  - `gig_kitchens_staff_supper`: "the swan story" and "the mystery cake" when the setup named neither.
  - `gig_post_wrong_parcel`: "the ticking was a clock" on showings whose setup has no ticking parcel.
  - `kitchen_night_baker`: "the cooling tray" and "the heel of bread" introduced only by one setup.
- **A keyword scan** (an outcome naming something only one setup variant introduces) flagged 133 cards, mostly false positives.
- **Confirmed by reading:** `illu_find_vey` (the pigeon, the back-row student), `gig_pell_remedy_rush` (the cow), `tavern_regulars_corner` (the eel story), `intern_alchemists_vat_watch` (cinnamon), `evo_rain_barrel` (Marisol), `lyra_date_dawn_duel` (the coffee), `newt_company` (the magistrate). Measured with the engine's own picker over 1,600 seed and turn pairs each: whenever the payoff shows, its setup is missing 65–71% of the time. That's the independent-pick rate for three setups.
- **Estimate:** about one card in five of the 384 multi-field cards has a real desync, roughly 50–80 cards.
- **Two kinds, only one fixed by linking:**
  - *Random against random* (the pigeon, the cow, the headache): linking fixes it once each payoff sits at the same position as its setup. Several are at different positions today (`illu_find_vey`'s back-row payoff is variant 1 of an outcome, its setup is variant 2), so the migration reorders, not only pads.
  - *Random outcome against sequence setup* (`gig_post_wrong_parcel`, the baker's heel of bread): the two channels stay separate by design, so linking can't fix it. The outcome has to stop depending on the step, or move into the sequence channel. The lint can't see this; the critic's rule should name it.

## The rule

**Within one card, every `{~…}` group has the same number of parts, or the field has none. The same holds, separately, for sequence groups and for cycle groups.**
- "Every group" includes nested ones, for example `{season == "winter": {~a|b}|{~c|d}}`, and groups inside any field: title, text, scene, labels, hints, `locked:`, every `say:` in every branch and every `say` override.
- The three channels are separate. A card may have 3 sequence steps ("first time / again / by now") and 2 random variants. Each channel is linked within itself.
- Translations keep the English counts in every line, so a `.lang` card links the same way.

## Engine change (no format change)

- In `variant()`, a `{~}` group picks `parts[r % n]`, where `r` is a hash of **seed, turn and event only**. Every group with the same count then picks the same position. Groups nested inside a chosen part use the same `r`.
- This is what `docs/grimoire-script.md` already promises ("deterministic per seed, turn and event"). The group's own text was an implementation detail, so the syntax and its documented meaning don't change, and the schema stays v1.
- Pass the event key in the history and log calls listed above, so recorded text matches shown text.
- States' `say:` lines have no event key. They hash seed, turn and the state id, and are linked within the state.
- **No opt-out marker for now.** If independent flavour turns out to be needed, a later addition could be `{~~a|b}` (independent random), recorded with `schema --update`. Adding it is cheap, and leaving it out keeps the rule simple.

**What the change does to existing cards:**
- The 88 events whose counts already agree become linked at once. That's safe: every pairing was valid when they were independent, and linking only removes pairings.
- Mixed-count cards still render (`r % n`), loosely coupled, until they're migrated.
- Gameplay is untouched: text is RNG-free, and the golden games record ids, choices and values, not text. `grim diff` should report no change, and that's the check.

## Lint

- **New `variants` rule.** Per event (and per state), each channel's counts must agree. English and every locale line are checked against the English counts.
  - It's a **warning** while the migration runs, listing each card with its counts by field.
  - It becomes an **error** once the count reaches zero.
- `grim show <id>` prints each field's variant counts. This helps while rewriting.
- A test pins the linking: two fields with `{~a|b}` / `{~A|B}` always render `a…A` or `b…B` across many seeds and turns. Unequal counts still render, and the history label equals the shown label.

## Migration (297 events, by file)

Per card, choose its count **N** (usually the setup's), then bring every group to N:
- **Pad** short groups with a new variant. The default, because it adds variety to repeat cards.
- **Trim** a long group only when its extra variant is weak or duplicative.
- **Pair** where it reads better. Linking means outcome *k* can now answer setup *k*: the discovery named in the setup, the gift chosen, the weather. This is where the cards gain the most.
- Keep the critique's fixes: presence gates, time of day, purse handling, adults. Don't re-generalise outcomes that were made generic only for the old desync.

Batches follow the file list (largest first):
1. plans_thesis (26), courses_upper (24), grounds (23), clubs_jobs (22)
2. castle_towers (20), courses_b (20), castle_halls (17), courses_a (17)
3. village_home (17), plans_gigs (16), upper_ranks (14), pools/night (12)
4. dating (11), fixtures (9), plans_more (9), courses_hidden (6), festivals (5)
5. The 13 files with 1–4 each, and the 11 state `say:` lines.

Each batch:
- `grim lint` (the variants warning goes to zero for those files);
- the zh-CN lines for every changed text, written with the same counts;
- `i18n zh-CN` at 0 stale;
- build, fmt, tests and `grim diff` (no gameplay change expected);
- commit explicit paths.

Volume: about 743 groups to pad or trim, plus their translations. That's about the size of the critique pass's text work.

## Docs and the critic

- **`docs/grimoire-script.md` (inline variation):** a card's `{~}` groups are linked by position; the counts must agree per channel.
- **`skills/write-academy-events` and `docs/authoring/style.md`:** write variants as matched sets (setup *k* ↔ outcome *k*); pad rather than leave a field short.
- **`skills/critic/SKILL.md`:** replace "every outcome must fit every independently selected setup" with "variant *k* of every field must fit variant *k* of the others; sequence steps must fit the showing number".
- **Handoff note to the critic:** the cards it flagged for independent-random desync can be rechecked under the linked rule.

## Order

1. Engine: link `{~}` by position, and pass keys in the history and log calls. Add the test. Lint warns. Update the docs.
   - Expect `grim diff` to show no gameplay change. Commit.
2. Migration batches 1–5, a commit each.
3. Lint `variants` becomes an error. Update the critic skill. Write the handoff and a PROGRESS line.

## Open questions for the designer
- **Pad or trim by default?** Padding (recommended) means about 740 new short lines and their translations. Trimming to 2 is quicker but loses flavour on repeat cards.
- **Independent flavour (`{~~…}`):** leave it out (recommended) unless a batch shows a real need.
