# Linked text variation: plan (2026-10-15)

> Goal: a card's text variants never contradict each other. Variant *k* of the setup always meets variant *k* of the outcome, so authors can write setup ↔ payoff pairs instead of making every outcome fit every setup.

## The rule

**A card uses one variation mode, with one part count.** Every variation group in the card is a sequence `{a|b|c}`, or every one is a cycle `{&a|b|c}`, or every one is random `{~a|b|c}`. All of them have the same number of parts. A field may also have no variation at all.

- "Every group" means every field: title, text, scene, labels, hints, `locked:`, every `say:` in every branch, every per-actor `say` override, and groups nested inside other groups.
- **Conditionals `{cond: a|b}` are exempt.** They read game state, and every field that tests the same state agrees, so they can't desync. "First time / again" framing in a random card is written as a conditional on the card's own showing count, `{seen(<id>) <= 1: …|…}`, which works today.
- Each state's `say:` lines form one unit, as a card does.
- Translations keep the English mode and count in every line.

With one mode and one count, every group picks the same index:

| Mode | Index |
|---|---|
| sequence | `min(seen − 1, N − 1)`: already shared, every group reads the card's showing count |
| cycle | `(seen − 1) mod N`: already shared |
| random | `r mod N`, where `r` is one hash of seed, turn and card: **needs the engine change below** |

## What changes in the language (minimal)

No new syntax, no schema change. The format stays frozen at v1.

1. **Engine, one line in `variant()` (`src/engine.js`, § Text).** The random hash drops the group's own text. It becomes seed, turn and card id only, which is what `docs/grimoire-script.md` already promises ("deterministic per seed, turn and event"). Groups nested inside a chosen part use the same hash. States hash with their state id.
2. **Engine, the log calls.** The history and log `interp` calls (`engine.js` ~148, 1521, 1522, 1547) pass the card id, so recorded text matches what was shown.
3. **Lint, a new `variants` rule.** Per card and per state: one mode, one count, across all fields and nesting; each locale line matches the English mode and count. It warns while the migration runs and becomes an error when the count reaches zero.
4. **Docs.** `docs/grimoire-script.md` (inline variation) states the rule. `docs/authoring/style.md` and the writing skill say to write variants as matched sets and to use `seen` conditionals for framing. The critic skill replaces "every outcome must fit every independently selected setup" with "variant *k* of every field must fit variant *k* of the others".

Plus a test: two fields `{~a|b}` and `{~A|B}` render `a…A` or `b…B` over many seeds and turns, and the history label equals the shown label.

**Gameplay is untouched.** Text is RNG-free, and the golden games record ids, choices and values, not text, so `grim diff` should report no change. That's the check for step 1.

## Why this matters: current desyncs

The engine today hashes each random group's own text, so each group picks on its own. Sequence and cycle groups already share the showing count.

A sampled check found real desyncs in about one card in five of the 384 cards with random variants in two or more fields (roughly 50–80 cards). Measured with the engine's own picker over 1,600 seed and turn pairs each, whenever the payoff shows, its setup is missing 65–71% of the time.

- **Random against random**, for example `illu_find_vey` (the pigeon), `gig_pell_remedy_rush` (the cow), `alch_original_remedy` (the headache), `tavern_regulars_corner`, `intern_alchemists_vat_watch`, `evo_rain_barrel`, `lyra_date_dawn_duel`, `newt_company`, `gig_kitchens_staff_supper`. These are fixed by the shared index once each payoff sits at its setup's position. Several sit at different positions today, so the migration reorders, not only pads.
- **Random outcome against sequence setup**, for example `gig_post_wrong_parcel` and `kitchen_night_baker`. One mode per card removes this kind entirely.

## Content today, by mode

419 of 989 cards vary. (The scan covers the title, text, scene, labels and every `say:`. The lint adds hints, `locked:` and overrides.)

| Modes in the card | Cards | Random counts mixed | What to do |
|---|---|---|---|
| sequence + random | 337 | 278 | → full random (below) |
| random only | 64 | 16 | equalize the 16 |
| cycle only | 10 | – | fine |
| sequence only | 2 | – | fine |
| cycle + random | 3 | 2 | choose a mode per card |
| cycle + sequence + random | 2 | 1 | choose a mode per card |
| cycle + sequence | 1 | – | choose a mode per card |

In the 337 mixed cards, the sequence part is almost always one group in the text: 334 cards have it only there, 329 of the 340 groups have 3 steps, and it's "first time / again / by now" framing, for example `align_northern_parcel`: "A hooded courier stops you…" / "The hooded courier is waiting again…". The random groups carry the flavour and the outcomes.

## Migration

### Mixed sequence + random cards → full random (recommended)

1. **Mechanical, by a `tools/migrations/` script (English and zh-CN in the same pass).** The sequence group becomes a showing-count conditional:
   - `{a|b}` → `{seen(<id>) <= 1: a|b}`
   - `{a|b|c}` → `{seen(<id>) <= 1: a|{seen(<id>) == 2: b|c}}`

   This renders exactly as now, and the card is then random-only.
2. **By hand: equalize and pair.** Bring every random group in the card to one count N, usually the setup's (3). Then put each payoff at its setup's position. 278 of these cards have mixed counts.

Why random rather than sequence: when a mixed card is shown in a run, it's shown once 62% of the time (40 games, 5 styles). As full sequence, those cards would show variant 1 every run, and their other variants would rarely be seen. As full random with conditional framing, every showing varies across runs, and the framing still follows the showing count.

Full sequence stays the right mode for cards whose variants are a progression (the two sequence-only cards, chains of returning visits). A batch may move a card there when its variants read as steps.

### Other cards

- **Random-only cards with mixed counts (16):** equalize and pair, as above.
- **Cycle mixes (6):** choose one mode per card, by hand.
- **The 11 state `say:` lines with `{~}`:** equalize per state.

### Equalizing: pad or trim

- **Pad** a short group with a new variant. This is the default: it adds variety to repeat cards.
- **Trim** a long group only where its extra variant is weak or a near-duplicate.
- Keep the critique's fixes (presence gates, time of day, purse handling, adults). Don't re-generalise outcomes that were made generic only because of the old desync: pairing is where the cards gain.

### Batches (by file, largest first)

1. plans_thesis (26), courses_upper (24), grounds (23), clubs_jobs (22)
2. castle_towers (20), courses_b (20), castle_halls (17), courses_a (17)
3. village_home (17), plans_gigs (16), upper_ranks (14), pools/night (12)
4. dating (11), fixtures (9), plans_more (9), courses_hidden (6), festivals (5)
5. The 13 files with 1–4 cards each, the cycle mixes and the state lines.

Each batch:
- the `variants` warning reaches zero for its files;
- zh-CN lines for every changed text, with the same mode and count, and `i18n zh-CN` at 0 stale;
- build, fmt, tests and `grim diff` (no gameplay change expected);
- a commit of explicit paths.

**Volume:**
- 340 sequence groups converted by script.
- About 743 random groups to pad or trim, plus the pairing and reordering, plus their translations. That's about the size of the critique pass's text work.

## Order

1. Engine (shared random index, keys in the log calls), the test, the lint warning, the docs. `grim diff` shows no gameplay change. Commit.
2. The migration script for sequence → conditional framing (both languages). Commit.
3. Batches 1–5 by hand, a commit each.
4. Lint `variants` becomes an error. Update the critic skill, write a handoff note for the critic (its desync flags can be rechecked under the new rule), and add a PROGRESS line.

## Open questions for the designer

- **Default for mixed cards: full random with `seen` conditionals (recommended), or full sequence?** Sequence makes setup ↔ payoff pairs follow the showing count, but freezes once-shown cards on variant 1 every run.
- **Pad or trim by default?** Padding (recommended) means about 740 new short lines and their translations. Trimming to 2 is quicker but loses flavour on repeat cards.
- **A shorthand for the framing conditional**, for example a `shown` symbol for the card's own showing count, would shorten `seen(<id>)`. It's not needed, so it's left out unless the migrated text reads too heavy.
