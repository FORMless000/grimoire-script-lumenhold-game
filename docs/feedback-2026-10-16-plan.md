# Plan: the 2026-10-16 feedback round (playtest #2, midway)

## Context

The latest playthrough is run `rmvae7z5x-3zqd` ("Wren", street origin, zh-CN). It was forked from `rmva8m3pr-3zqd` at turn 27 and is now at turn 31 of 48. `node tools/grim.js feedback data/runs/rmvae7z5x-3zqd.ndjson` reports **18 notes on 17 cards**, all unrated comments. The autosave (`data/saves/auto.json`) holds the same 18 and nothing more. None of these cards appear in `docs/feedback-2026-10-15-plan.md` or the triage, so all 18 are new. This plan addresses every note, ordered the way the architecture wants changes made (AGENTS.md): engine and UI fixes first, then language additions in the mandated order (`src/grimoire.js` → `src/engine.js`/`director.js` → lint → `format`/`query` → docs → `schema --update`), then the content that depends on them, then self-contained content, then narrative batches, and finally i18n and balance.

Rules for every step: amounts are tiers and presets, never numbers; every choice trades something; no ids are renamed or deleted (a retired card keeps its block with `when: false` and a comment, like `lantern_night`), so the tester's save keeps loading; new `say:` branches go *after* existing ones (the translation-key trap); plot safety holds (only hard-canon story events `find` key clues or `advance` clocks); read canon with `grim brief` before writing.

## Coverage: every note → its item

| # | Card (when) | Note, in short | Item |
|---|---|---|---|
| 1 | `crisis_despair` (Starfall Y2) | What is this about? Gives too much mood | 4.1 |
| 2 | `crisis_despair` (Mistveil Y3) | Say it's low mood; reaching out should cost something | 4.1 |
| 3 | `lesson_glamour` | Too hard, too little reward; make the reward grand | 4.2 |
| 4 | `pyro_lyra_spar` | Lyra's rivalry text is unnecessary | 1.3 |
| 5 | `umbral_forbidden_notes` | The key didn't unlock anything | 5.1 |
| 6 | `duelling_ward_line` | Shouldn't be a combat | 4.3 |
| 7 | `forbidden_section_1` | Note the key as a clue; later, turn queued events into leads that need proactivity; the chain is too insignificant | 5.1 (now) + 6 (later) |
| 8 | `job_off_shift` | Shouldn't appear at midnight | 1.2 |
| 9 | `newt_company` | A chain into a pool; more reward and cost; company and gambling both, in order; no cooldowns | 2.1, 2.2, 3.1 |
| 10 | `renown_chance` | Explain the event, in the lead-in card | 4.5 |
| 11 | `lantern_night_v3` | Evolve the event and the festival | 5.3 |
| 12 | `newt_high_table` | Retire the stub; company first, then gambling; company cools down only if refused; once accepted, a sequential-variation regular version | 3.1 |
| 13 | `umbral_ward_candle` | Spellcasting opportunity | 4.4 |
| 14 | `soc_confess_generic` | Why does it fire right after cooling the spark? | 1.1 |
| 15 | `bell_silence` | Still not enough lead-up | 5.2 |
| 16 | `midnight_boathouse_ring` | Progressive fights, streaks, forced nights of up to 4 random bouts; betting on others becomes its own option | 2.1, 3.2 |
| 17 | `hs_grey_offer` | More significant; raise all skills, not just arcana | 4.6 |
| 18 | `grisk_pickup` | The smuggling card shouldn't replace the fight | 2.1, 3.2 |

## 1. Engine and UI fixes (no language change)

**1.1 A pushed card rechecks its cast before it shows** (note 14). Diagnosis: in turn 17 a ramp push (`src/director.js:352–366`) bound Kael to `soc_confess_generic` while spark was 38. That morning, `spark_cooldown` → "Let it cool" (`cool`, `src/engine.js:1193`) set spark to 0. At night the confession played anyway, because `advance()` (`src/engine.js:~1550`) retests only `when` when `item.cast` is already bound, never the cast roles' `where` (`spark(npc) >= 30`). Fix: in that branch, also test each cast role's `where` against the bound cast (reuse the role test from `candidates()`), and drop the card on a failure. This is the documented behaviour, "a card re-checks its `when` before showing", extended to cast. Unit test: cooling in the morning drops a confession pushed for that night. Gameplay changes.

**1.2 Midnight is never a shift** (note 8). `pickPlace()` (`src/director.js:177`) calls `attend()` on every visit to a job place, midnight included. So a midnight visit to the Newt counted a shift (attendance, pay, rank XP), and once the shifts were done it queued the off-shift hint. Fix: skip `attend()` for an opened slot (midnight), and gate the hint (`director.js:483`) on `!r.opened`. Test: going out to your own job's place at midnight changes no track state and shows no hint. Gameplay changes.

**1.3 A rival bond shows the standard note** (note 4, as you decided). In `src/ui.js:640`, rival uses the plain `note.bond` ("Lyra: rival") instead of `note.bondRival`. Remove `note.bondRival` from `UI_EN` (`src/i18n.js:115`) and from `locales/zh-CN/ui.lang:171`. No gameplay change.

## 2. Language additions (schema v1; add, never change meaning)

Each one goes through `src/grimoire.js` (SCHEMA, regexes) → `src/director.js`/`engine.js` → lint in `tools/grim.js` (references, orphans and the `grim reach` model) → `tools/format.js`, `tools/query.js` → `docs/grimoire-script.md` → `node tools/grim.js schema --update`, with unit tests.

**2.1 `@place always:` takes a list and knows its slot.**
- Today it takes one event, only on non-midnight visits, with one drawn card after it (`director.js:485–489`; lint at `tools/grim.js:528`).
- New: `always: a b c` plays each listed card in order, when its `when` holds. A group `a|b` plays one of them, drawn by weight among the eligible ones.
- An event with `slot:` qualifies only in that slot, including midnight. One without a slot qualifies only on daytime visits, so the Job Board's single entry keeps its meaning.
- One drawn card still follows, as today.
- Lint: every named event belongs to the place.
- Used by the Newt (3.1) and the boathouse (3.2).

**2.2 `queue any tagged <tag> [now | in N | within a..b] [with npc]`.**
- When it falls due, the director draws one `trigger: queued` event with that tag by its usual score (`when`, cast, novelty, weight). If none is eligible, nothing is queued.
- Lint: the tag has at least one queued event, and such events don't count as orphans.
- `grim reach` treats a pool queue as reaching every event in that pool.
- This is how the company night becomes "a chain into a pool" (3.1).

## 3. Night content that needs §2 (`content/events/night.grim`, `pools/night.grim`, `world/places.grim`)

**3.1 The Gilded Newt at midnight** (notes 9 and 12).
- **Retire the stub.** `midnight_newt_cards` gets `when: false` and a comment.
- **The order of the night.** `gilded_newt` gets `always: newt_company newt_company_regular newt_high_table`, so every Newt night is the company offer first, then the high table.
- **The first offer.** `newt_company` is the first offer and plays until accepted.
  - Accepting sets `flag newt_regular`.
  - Refusing cools it for a few months: `when: not flag(newt_regular) and not (chosen(newt_company, right) and since(newt_company) < 3)`.
  - There is no cooldown otherwise, and `repeat:` is dropped.
- **The regular's offer.** A new `newt_company_regular` is the offer once you're a regular, with sequential variation texts (the landlady knows you, then your table, then your regulars).
  - It has the same refusal cooldown.
  - Accepting does `queue any tagged company_night now`.
- **The pool: about 6 queued `company_night` cards**, each a guest with its own trade, paying more than today and costing more:
  - a merchant's birthday;
  - a magistrate's card party;
  - the masked night;
  - a guest who offers patronage;
  - someone from the castle;
  - a guest who wants more.
  - Pay is gold +large. Costs are mood or health, suspicion odds, sometimes renown or alignment.
  - The cards are plot-safe, with nothing explicit.
- **The high table** drops `repeat:` and always follows. Its partner card (`night_partner_asks`) and Grisk's favour (`grisk_names_favour`) stay as they are.

**3.2 The ring under the boathouse** (notes 16 and 18).
- **The boathouse's always slot.** `boathouse` gets `always: midnight_boathouse_ring|ring_on_yourself`. Either ring card can start the chain (your call), and one drawn card still follows. So `grisk_pickup` and `hs_boathouse_bell` come *after* the fight instead of replacing it.
- **Entry cards.**
  - `midnight_boathouse_ring`: "Step into the ring" or "Not tonight".
  - `ring_on_yourself`: "Bet your purse on yourself" (crowns up front, locked by `@game afford` when you can't pay) or "Fight for the purse only". It also gets a "Not tonight" option.
  - "Not tonight" queues a new `ring_side_bets` card now: bet on a fighter (crowns up front, lockable) or go home free. Betting on others is no longer the only way out, so the ring can't force a crown cost.
- **Last-standing nights.** On some nights the house runs last-standing rules. The entry card's `on_show` rolls it (`chance unlikely: flag ring_last_standing`), and the text says so before you choose. Declining stays possible.
- **Bouts.** New queued `ring_bout_2`, `ring_bout_3` and `ring_bout_4` follow a win, each a rung harder (adept- → adept → adept+ → expert-) with a bigger purse and a harsher loss. The opponent is random: one `{~…}` random-mode group per card.
- **Ordinary nights.** After each win you choose "Fight on" (the next bout) or "Take the purse and go".
- **Forced nights.** Each bout is a single-option "Fight" card until you lose or win the fourth, then the flag clears.
- `lyra_ring_word` stays as it is.

## 4. Card fixes (content only; independent of each other)

**4.1 `crisis_despair`** (notes 1 and 2; `content/events/crisis.grim:32`).
- **Say it's low mood.** The text says plainly that your spirits have hit bottom; the card is the hook `mood on_zero` (`rules.grim:74`). Each option gets a `hint:`.
- **Reaching out costs something, never the friendship** (as you decided). The gain drops from +huge plus `rest` (about +43) to mood +large, and comes with a cathartic breakdown.
  - A random branch picks one of 3–4 kinds of breakdown, each a spread of hits to other resources (health, mana, study in your courses, crowns, renown, club or job performance). For example:
    - crying until dawn and sleeping through classes;
    - burning out your mana in an empty field;
    - walking the walls in the rain;
    - smashing things you then have to replace.
  - The friend's tea is the comfort at the end.
- **Depiction.** Catharsis, exhaustion and recklessness, never self-injury on the page (the no-gore principle).
- **The other branches.** Maud's and the porter's branches get the same treatment. The `despairs` logic is unchanged.
- **Watch the floor.** This bears on the open careless-player floor in PROGRESS, so watch random play's early-leave rate in `balance`.

**4.2 `lesson_glamour`** (note 3; `pools/spell_lessons.grim:128`). The check was 7% at turn 7.
- Ease it from `master- slim` to `master- unlikely`, with `+1 if spell_level(glamour) >= 2`.
- Make the win grand:
  - study illusion +huge (top preparation; confirm how `study` behaves when you're not enrolled, and scope it to illusion);
  - renown +medium (the class saw it);
  - rel vey +medium;
  - charm +small.
- The loss keeps mood −tiny and adds a small guile gain, since you learned how she reads hands.

**4.3 `duelling_ward_line`** (note 6). Change `challenge combat apprentice+ steady` to `challenge spell apprentice+` (arcana, no mana cost). `steady` is dropped, per `checks.md`: don't use `steady` on low-rung repeat cards. `up[ward]` stays as it is.

**4.4 `umbral_ward_candle`** (note 13). Add `> up[ward]: A true ward` after the existing options: guile +small, study umbral +small and rel partner +tiny, without a check. The mana cost comes from the spell. It has 3 sequential variants to match the card.

**4.5 `renown_chance`** (note 10). The menu's text is its lead-in card, so rewrite it to say what this is:
- twice a year, three public stages;
- each is a hard challenge that stakes your renown: win and the school knows your name, lose in public and it costs you;
- or you keep your head down.

The 3×3 sequence groups are kept. Reread the three follow-ups (`renown_demonstration`, `renown_debate`, `renown_village_fair`) for the same clarity.

**4.6 `hs_grey_offer`** (note 17; `chain_hollowstar.grim:239`). First read canon (`grim brief` for the hollowstar arc and the man in grey). Then:
- **All skills.** "What would it give me?" raises all six skills (+small each) instead of arcana +medium.
- **More significance:**
  - a timed state, a taste of the Star: an edge on checks for a few months, with nightly cold dreams that drain mood;
  - a queued `hs_grey_return` (`within 2..4`) where he asks a first small service, with a Lumen or Hollow choice on alignment;
  - the "Get out" side gets a matching consequence (he remembers, and the state of resistance shows).
- Hard-canon story chain only, and no secrets revealed beyond canon.

## 5. Narrative batches (writer, then the critic skill; `skills/write-academy-events`, `skills/critic`)

**5.1 The silver key and the Restricted Section** (notes 5 and 7; `classes.grim:709`, `chains_minor.grim`, `places.grim:169`, `world/clues.grim`).
- **The key becomes a lead.** Taking the notebook does `find lead_silver_key` instead of `queue forbidden_section_1 in 1`. The lead is a new `@clue` (thread "The silver key", `kind: lead`, `followed: seen(forbidden_section_1) > 0`), and the outcome text says what the key opens.
- **The door appears on the map.** `restricted_section` gets `discover: flag(forbidden_key) or seen(forbidden_section_1) > 0`.
- **The chain is played by going there.** `forbidden_section_1`, then `_2` and `_3`, become midnight cards of `restricted_section` gated on the key and the previous step (high weight, like `hs_restricted_founders`). They are no longer queued on a timer.
- **More weight for the chain:** 2–3 new cards, such as:
  - the notebook's annotations pointing you to particular shelves;
  - the graduating fourth-year (a new proper noun needs a soft `@lore` entry);
  - Bram's watch on the door.
- `codex_names` keeps its current source; check its canon tier before touching it.

**5.2 The Bell Under the Water** (note 15; arc `the_bell`, `slice_2b.grim:732–830`, `world/arcs.grim:51`). Today four beats fire on a timer. In this run, the dive failed and the bell still went silent with only the rope in hand.
- **Lead-up between beats:**
  - echo cards at the lakeshore, the boathouse and Maud's cottage (the bell heard elsewhere, the lake behaving oddly; plot-safe);
  - Maud's answer (`bell_answer`) becomes a lead;
  - a failed dive leaves a lead to try again (a boathouse card).
- **The ending is played, not timed.** Beat 4 becomes a nudge card that names where to go. The silencing itself is a lakeshore night card that plays when you go there with the rope or the name, with its text and outcome depending on which you hold.
- Clocks and clues stay on story events.

**5.3 Lantern Night as a festival chain** (note 11; `calendar_2b.grim:740`, modelled on Starfall and the Ball in `festivals.grim`).
- **A lantern-making card** at noon in month 2, on the `ball_robes` pattern: buy fine paper, make your own, or glamour one.
- **`lantern_night_v3` with real trades.** Today both options give mood +medium. The new choices:
  - a selfish wish;
  - a wish for someone, with a cast friend or partner;
  - reading other people's wishes, which is tempting and costs alignment;
  - each with different effects, and lines for year 1, later years and the final year.
- **Queued follow-ups:**
  - a lantern washes up carrying someone's wish;
  - a partner or friend asks what you wished for;
  - a first-year's lantern lost in the reeds.
- The id stays.

## 6. Recorded for later (as you asked): queued follow-ups → leads that need you to act

Extend `grim leads` so it also lists the timed follow-ups (`queue X in N` and `within`, about 55 that aren't `now` or `chance`), marking those whose payoff is something the player would go and do. Write the worklist to `build/worklists/`. Add a PROGRESS "Next" entry to convert them in a later batch the way 5.1 converts the forbidden chain. Nothing beyond 5.1 is converted in this round.

## 7. Wrap-up

- Save this plan as `docs/feedback-2026-10-16-plan.md` and add a "Feedback 2026-10-16" entry to `PROGRESS.md`. Record any deviation there, for example if 2.2's pool draw ignores some scoring factor.
- Translate: `node tools/grim.js i18n zh-CN`, then fill the new and STALE lines, bulk work through `locales/zh-CN/_in/`. Keep `{tokens}` and follow `locales/zh-CN/GLOSSARY.md`.
- Rebuild `build/content.bundle.js` after every `.grim` or `.lang` edit.

## Verification

- `node tools/grim.js check` after each step. `npm run verify` at the end (it includes the quick e2e; skip the full `tools/e2e.js`).
- Unit tests for 1.1, 1.2, 2.1 (ordering, `a|b`, slot filter, the Job Board unchanged) and 2.2 (draw, empty pool, reach).
- `grim reach`: 0 unreachable events, including the new pool cards and the place-bound forbidden and bell cards.
- `grim balance`:
  - random play's early-leave rate after 4.1;
  - the money-maxxer and gold alarms after the Newt and ring pay rises;
  - `tools/economy.js --by event` for the Newt, ring and despair flows against `docs/playtest-2-flows.md`.
- `grim diff` should show the intended changes: midnight shifts gone, confession drops, Newt and boathouse ordering, the despair numbers. Refresh `test/golden/baseline.json` in the same commit.
- Play-check in the browser with `index.html?event=<id>&debug` for each changed card, in en and zh-CN. Also play a midnight at the Newt and at the boathouse from a save with `npm start`: company, then the table; the ring first, then the parcel; a forced night.
- Critic pass (`skills/critic`) on the batches in §3 and §5.
