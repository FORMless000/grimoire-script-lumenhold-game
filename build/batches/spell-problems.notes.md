# Spell problems: the 34 spell lessons reworked (2026-10-29)

**File:** `content/events/pools/spell_lessons.grim`. There is one card per spell, kept under the old `lesson_<spell>` ids so saves and the journal keep working. The retired `lesson_tide`, `lesson_mirror` and `lesson_beast_speech` are untouched, at the end of the file.

The wiring has one new piece, `@cond spell_draw` in `content/core/conds.grim`. Toll has no source and never had a lesson, so it gets no card.

## The rule (the user's)

- "Overhaul them so they show up as casting the spell as the 3rd option, not a casual option."
- "This is intended to showcase that each spell correspond to events that can be solved with those spells."
- "The events should be worded not assuming that you have the spell, and should show up even without the spell learnt, but more rarely."
- **Answers to my questions:**
  - Premise: problems to solve. The old "a teacher shows you how it's taught" beat goes.
  - Frequency: "much rarer" without the spell.

## Shape

- **Each card:**
  - a trouble at a place;
  - `left` and `right`, two ordinary ways through, a trade with no spell;
  - `up[<spell>]`, the spell as the third option. It is shown only once you know the spell, and its Mana (and the alignment of the forbidden spells and Sleight) is taken automatically.
- **Wording:** no text or ordinary say assumes you know the spell. Only the `up` says do.
- **Wiring:** every card joins `pool: spell_use`, the everyday spell uses' shared pool (`class: routine`, `repeat: 5`, tag `magic`).
  - Its weight is `weight: spell_draw(<spell>)`: 3 before you know the spell and 120 after, where a usual card is 10.
  - The old `trigger: auto` and `when: spell_level(x) >= 1 and term` are gone. A card's `when` now holds only a season, where the premise needs one.
- **Variants:** every card is a matched sequence of three, in its text and in every say.
- **Two `up` options carry a check** (`challenge spell journeyman`): wildfire's bonfire, because the spell can get away from you. All the others are sure.

## Cards

| Spell | Card | Place | The trouble |
|---|---|---|---|
| Flame | `lesson_flame` | boathouse (winter) | the padlock frozen shut |
| Foresight | `lesson_foresight` | stables | walking behind a hippogriff who kicks |
| Mend | `lesson_mend` | village | an old man's smashed spectacles |
| Glamour | `lesson_glamour` | job board | a mother interviewing tutors |
| Haste | `lesson_haste` | village | the noon mail coach |
| Ward | `lesson_ward` | greenhouses (summer, autumn) | the spitting-pod bush and a first-year tour |
| Shadowstep | `lesson_shadowstep` | courtyard (night) | locked out by the gate |
| Animate | `lesson_animate` | great hall | three hundred chairs after the feast |
| Starlight | `lesson_starlight` | observatory (night) | the stair lamps out, first-years stuck |
| Seal | `lesson_seal` | courier loft | a KEEP SEALED parcel split and buzzing |
| Brace | `lesson_brace` | flight field | the runaway hay wagon |
| Quickquill | `lesson_quickquill` | lecture tower | a fast-talking guest, notes for a sick friend |
| Bramble | `lesson_bramble` | maud_cottage (the orchard) | deer through a gap in the fence |
| Index | `lesson_index` | library | a fourth-year's lost quotation, due in an hour |
| Rapport | `lesson_rapport` | village (the bakery) | the baker's broken window and the crowd |
| Distill | `lesson_purify` | Pell's | a fever tonic too weak, Pell out |
| Tailwind | `lesson_tailwind` | flight field | a riderless broom bolting for the lake |
| Wildfire | `lesson_wildfire` | courtyard (autumn) | the soaked end-of-harvest bonfire |
| Heartwood | `lesson_heartwood` | courtyard (summer) | first-years fainting at an outdoor assembly |
| Omen | `lesson_omen` | village (summer) | the village team that has given up |
| Sleight | `lesson_sleight` | Grimsby's | a customer pocketing a first edition |
| Contraption | `lesson_contraption` | village (the bakery) | the oven bellows split before the bake |
| Hoarfrost | `lesson_hoarfrost` | refectory (summer) | the end-of-term ices melting |
| Candour | `lesson_candour` | library | two borrowers blaming each other for a torn page |
| Lodestar | `lesson_lodestar` | maud_cottage (the orchard, autumn) | a village child lost among the rows at dusk |
| Moonwell | `lesson_moonwell` | maud_cottage | the charm on Maud's well worn through |
| Reflect | `lesson_reflect` | duel hall | a sore loser's hex at your back |
| Rime | `lesson_rime` | stables | the hayloft ladder breaking under you |
| Siphon | `lesson_siphon` | boathouse (summer) | a wasps' nest over the door |
| Compel | `lesson_compel` | Gilded Newt | a shell-game cheat fleecing a farmhand |
| Torment | `lesson_torment` | duel hall | a practice opponent with an illegal charm |
| Extraction | `lesson_extraction` | lecture tower | out of magic mid-practical beside a brimming classmate |
| Eclipse | `lesson_eclipse` | workshop | a scalded hand and a machine to charge tonight |
| Heartprice | `lesson_heartprice` | gargoyle passage | a roof stone pinning a companion's foot, no Mana left |

**Moral weight:** the forbidden spells' casts take alignment −small, and Sleight's −tiny, through `@spell alignment:`. Glamour's `up` adds alignment −tiny: charming your way past honest candidates. Siphon's `up` gives health +small, and you "wish you didn't".

## Retrieval

**`search`, one query per premise before drafting.** The premises that matched existing cards were changed before writing:
- the kitchen pantry raid (`corvin_kitchen_raid`) became Seal's split parcel;
- the tavern brawl (`tavern_brawl`, `gig_newt_brawl`) became Rapport's bakery crowd;
- the pickpocket (`inc_stolen_purse`) became Tailwind's runaway broom;
- the unstable cauldron (`alch_unstable_cauldron`) became Hoarfrost's ices;
- the greenhouse storm (`tobias_storm_greenhouse`, `verdant_cold_snap`) became Heartprice's pinned foot;
- the front-row misfire (`evo_misfire`) became Ward's spitting pods;
- the lake fog (`life_fog_maze`) became Lodestar's orchard;
- the bramble burn (`verdant_bramble_bolts`) and the fallen tree (`gig_grounds_storm_damage`) moved Wildfire to a bonfire;
- the job board has no clerk (it's a cork board), so Glamour became a tutoring interview.

**`related --draft` on every card:**

| Card | Top hit | Outcome |
|---|---|---|
| `lesson_moonwell` | `infirmary_night_watch` (an hourly fever charm, Amaranth, the chair) | duplicate: reworked to Maud's well |
| `lesson_omen` | `job_board_lost_familiars`, `life_three_headed_puppy`, `maud_cottage_bartholomew` | one lost animal too many: reworked to the losing team |
| `lesson_wildfire` | `boathouse_damp_stove` (wet crews, wet kindling) | moved to the courtyard; still its top hit, through wet fuel only, so kept |
| `lesson_seal` | `courier_whispering_parcel` | kept: a strange parcel to deliver, but a different problem, a broken seal and a buzz |
| `lesson_heartprice` | `life_injury_stairs` | kept: a stuck leg, but someone else's, under a roof fall, with no Mana |
| `lesson_glamour` | `job_board_tutor_hour` | kept: tutoring, but an interview with a demanding parent |
| `lesson_purify` | `pell_draught` | kept: Pell's Distill chain card brews a draught; this one strengthens a weak tonic for a customer |

The rest have distinct top hits.

## Frequency

Measured with `tmp spfreq.js`, 20 games a style: spell-problem cards shown per game, split by whether you knew the spell then.

| Weight (without → with the spell) | random | balanced | social | sleuth | explorer |
|---|---|---|---|---|---|
| 5 → 30 | 2.2 with / 5.2 without | 2.15 / 4.8 | 3.25 / 4.85 | 3.6 / 3.25 | 3.35 / 5.45 |
| 3 → 60 | 2.85 / 2.8 | 3.65 / 3.9 | 3.9 / 3.7 | 4.85 / 2.15 | 4.05 / 3.35 |
| **3 → 120 (chosen)** | 4.3 / 3.15 | 3.85 / 3.2 | 5.1 / 3.5 | 5.5 / 2.6 | 5.2 / 3.15 |

What the chosen weight gives:
- **Per card:** a known spell's card (about 8 spells known) comes up 0.5–0.7 times a game, an unknown spell's (about 26) 0.1–0.13.
- **Per month the spell is known,** the gap is larger still.
- **The cap is visits:** one card per visit, and the 5-month cooldown. Beyond 120, the weight gains little.
- **Compared with before:** the old lessons gave each learned spell exactly one card a run, about 8 a game. Now a known spell's card comes back every few seasons, and the others are rare teasers.

## Checks

- `grim lint`: 0 errors in the English. The budget lint passes for every card. The zh-CN errors are the old translations, which are being redone.
- zh-CN: being translated.

## Round 2 (round 1: both halves rejected; every issue fixed)

**Half A** (`spell-problems-a.critic.json`):
- **Three new premises, each checked with `search` and `related --draft`:**
  - `lesson_ward` repeated `courtyard_hail`. It is now the rattling engine in the workshop: ward the bench and let it blow. Nearest: `workshop_after_the_bang`, the aftermath, and Mir's.
  - `lesson_flame` repeated `boathouse_damp_stove`, and Mabel's is across the lake. It is now the frozen kitchen pump at a winter dawn (refectory). Nearest: `court_fountain_freeze`, a frozen fountain with a Hoarfrost option.
  - `lesson_tailwind` was the same runaway scene as `lesson_brace`. It is now the captain's forgotten wand and the team's carriage on the road (duel hall). Nearest: `life_lost_wand`, your own wand lost.
- **The "groundsman" is gone.** Old Maud is the groundskeeper: Brace's hay wagon, Bramble's fence, which waits "till the hedging's done" rather than till spring, and Siphon's "leave it for Old Maud".
- **`lesson_foresight`:** Brask is she/her. The right option is no longer a bow, which was `stables_hippogriff`'s premise: you tempt her round with an apple.
- **`lesson_index`:** the green cover is in text variant 1.
- **`lesson_purify`:** an old shepherd and his wife replace the mother and child, which echoed `apoth_poor_mother`. "It takes nothing from your magic", with no mechanic named.
- **Smaller fixes:**
  - Mend's left option shows its cost (sore feet);
  - Seal's tips are shown in every variant;
  - Rapport's walk-on option no longer gives lore, and "the street that was turning";
  - Glamour's son is "a sweet lad";
  - Animate's garbled line is fixed.

**Half B** (`spell-problems-b.critic.json`):
- **`lesson_rime`:** Brask is she/her.
- **`lesson_torment`:** the later variants are other opponents ("somebody in the village is selling them"). No variant assumes an earlier outcome, and the `up` option's third say fits a repeat.
- **`lesson_moonwell`:** the `up` option no longer gives Mana. It costs a cold night (health −tiny, shown) and gives alchemy +tiny. The dowser's fee is shown in every variant.
- **`lesson_extraction`:** you're *nearly* dry (the dregs of one casting left), so the 10-Mana cast is possible. The left option is a resit, with no marks.
- **`lesson_reflect`:** the right option's health cost is shown in every variant.
- **Polish:**
  - Heartprice names no mechanic, and its right option loses the unshown lore;
  - Siphon's right option loses its lore;
  - Contraption's split is "along a new seam";
  - Wildfire's variant 3 no longer assumes a past;
  - Compel's cider is shown;
  - the header says "far less often (3 against 120)".

**Checks:**
- `grim lint`: 0 errors.
- zh-CN: 100%, 0 stale. Every changed line was retranslated.

## Round 3 (half A; round 2: half B accepted, half A rejected over one blocker)

- `lesson_tailwind`'s forgotten wand had become `lesson_haste`'s mail coach. Haste wears off quickly, so `lesson_haste` became a split-second problem: catching a toppling crockery stall's jars. It has a sure shoulder under the trestle and a sell-the-seconds option, with no check, no chase and no stand-in. Retrieval: the nearest cards are market-day stalls, with a different premise.
- **`lesson_ward`:** the ward closes round the engine and saves the maker's work. The left option opens the relief valve. The simile is gone.
- **`lesson_purify`:** the shepherd is named in every variant.
- **`lesson_flame`:** a floury pat.
- **`lesson_contraption`:** the machine shakes itself to bits.
- **Final frequency** (20 games): with the spell 3.55–5.1 a game, without 2.5–3.85.
- **Verdicts:** half A accepted (round 3), half B accepted (round 2).
- **Checks:**
  - lint: 0 errors;
  - zh-CN: 100%, 0 stale;
  - `npm run verify`: passes, after the golden baseline refresh.
