# The Hollow Star, v2: outline (for approval before drafting)

Feedback round 2026-10-25 (`docs/feedback-2026-10-25-plan.md` §4). This is the act-by-act outline: each storyline, each card in one line (new, rewritten in place, or retired), what it pays and where it is dealt. No card is drafted until this is approved.

Canon read for it: `grim brief --arc hollowstar` (cast Kael, Ilse, Isolde, Maud, Seraphine), the soft lore in `content/world/lore/soft/hollowstar.grim`, the arcs `kael_thaw` and `ilse_dumont`, the clues in `content/world/clues.grim`. Canon facts stay; scenes, pacing and wiring change.

## What changes, in one paragraph

Today the plot is 40 cards, most on a fixed calendar: 12 beat cards at set months, auto cards pinned to months, and quiet one-off checks. The finale is one fight with the man in grey, one check and a door. In v2 every act opens with a loud scene that finds you where you are. Each act's investigation is a quest you chase in any order, at places and with people. Confrontations are scenes played in one sitting, with fights in the minigame and allies throwing in their spells. Pushing the investigation opens the next act early. Left alone, the world opens it by its deadline anyway. The Night comes when you choose to go down, or when time runs out. It is a run of nine scenes that pays off every clue and closes the arc.

## Wiring (docs/grimoire-script.md §9)

| Piece | How |
|---|---|
| Deadlines | `@arc hollowstar` keeps `clock: 0..12` and `beats: 1@y1m3 2@y1m9 4@y2m2 5@y2m9 7@y3m2 8@y3m7 10@y4m3 12@y4m9`. The beats become deadlines: the engine already takes the higher of schedule and clock, so a card that `advance`s opens what comes next early. |
| Act openers | One card per act at clock 1, 4, 7, 10 (`beat:`), dealt by the `beats` appointment (`limit: plot`). Each has a `place:` or a cast, so it lands where you are (at the lake, in the corridor, with Kael), not on a set morning. |
| Investigations | `@thread … from: quest` per act: parts in any order, each at a place or with a person, unlocked by leads (`clue(lead_…)`). The final `advance`s the clock to the next opener. No part waits on the calendar. |
| Confrontations | `@thread … from: scene`: several cards in one sitting, fights in the minigame, `with <ally>` assists. |
| Personal strands | `@thread … from: story` (Kael's secret, Ilse, your shadow): steps wait on what the start began, not on months. |
| Reads | Progress reads `clock(hollowstar)` and `clues(hollowstar)`; acts read the clock, not `act()` (which goes by year). Moral weight on `alignment`. Every card `arc: hollowstar` (via its thread), so `close hollowstar` ends them all. |
| Ids | Every existing id is kept. Rewritten cards keep theirs; retired ones keep their block with `when: false`. Every flag keeps its meaning (`kael_ally`, `sided_*`, `hollow_tempted`, `ilse_saved/taken`, `winter_*`, `star_key`, …), so a save mid-plot carries on. |

Files: a new folder `content/events/hollowstar/`, one file per act (`omens.grim`, `investigation.grim`, `escalation.grim`, `convergence.grim`, `night.grim`). `chain_hollowstar.grim`, `chain_hollowstar_acts.grim` and `chain_ilse.grim` keep only the retired blocks.

## Antagonists, and how they escalate

- **The man in grey** hunts you. He comes back once an act, each time stronger. His fights use `drift mid` from an `expert` floor, so he keeps up with you. Act I: a glimpse. Act II: a face-to-face test. Act III: he strikes in daylight. The Night: the tunnel. If you lose to him, something real goes: a clue taken from your notes, an ally hurt, or the clock pushed on.
- **The Hollow cult** (Northern families). Act III: they act openly, putting a tower out and half-freezing the lake. The Night: their circle on the ice.
- **New canon (soft lore, for approval): the cult's circle is led by the Dumonts' mother**, come south for the night the seal is weakest. Canon already says she sent Kael, raised Ilse to open the door, and never told either child she was proud. She stays off the page until Act III (one letter, then her voice on the ice). The Night's cult scene is then a family confrontation, shouted across the ice. Her name and description go in as soft `@lore dumont_mother`. Without her, the cult leader is a nameless Northern elder; the scene is weaker but works the same.
- **Your shadow.** `second_shadow` today is a quiet clue. In v2 the Star notices you, and your shadow starts acting a moment late (Act III story). On the Night it rises as the Star's champion.
- **Conflicts on the page:** Kael and Ilse shout across the ice. Isolde and the Dumonts face off with wands drawn. Maud refuses Isolde to her face. The man in grey strikes in daylight. Per the style guide (step 7): out loud, in the moment, with a choice under pressure.

## Act I, Omens (opener at clock 1; deadline y1m3; next act by y2m2)

| Card | Status | Dealt | What happens / pays |
|---|---|---|---|
| `hs_lake_breathes` | rewritten | opener, at the lakeshore or boathouse | The lake draws one breath: every lantern on the shore gutters and the water drops a foot, then comes back. Leads: `lead_lake_breathed`, `lead_founders_archive`, `lead_maud_friend`. |
| `hs_omens` | new thread (quest) | — | `need=2`, final when 2 of 3 parts are done, or 5 months on. |
| `hs_boathouse_bell` | part, rewritten | boathouse, `clue(lead_lake_breathed)` | Diving at night for the note under the water; a feat. Pays `lake_bell`. |
| `hs_founders_records` / `hs_restricted_founders` | part (two routes), rewritten | library / restricted section | The razored page, by research or by breaking in. Pays `founders_ledger`, `knows_founders_seal`, `lead_seventh_tower`. |
| `hs_dreams_begin` | part, rewritten | night (dorm) | The black-star dream; you wake with frost on the pillow and someone else's handwriting on your hand. Pays `lead_black_star_dream`. |
| `hs_grey_stranger` | final, rewritten (loud) | at the lake, at dusk | The man in grey on the shore, the first face-to-face. He knows your name, which you never told him. The fountains freeze as he talks. Choices: answer, lie, or walk away; each tilts `alignment` and sets `grey_watching`. `advance` to clock 4. Pays `lead_man_in_grey`. |
| `kael_arrives` | kept | auto, turn 3 | Unchanged: Kael's arrival is canon. |

Everyday second sources stay as they are: `tide_drowned_bell`, `maud_old_student` / `maud_tea_tells`, `umbral_last_lecture`.

## Act II, Investigation (opener at clock 4; deadline y2m2; next act by y3m2)

| Card | Status | Dealt | What happens / pays |
|---|---|---|---|
| `hs_ilse_arrives` | rewritten (opener) | the village or the courtyard, with Kael | Ilse walks through the gate in a private snowstorm, and Kael goes white. They clash in the open, in Northern, in front of half the academy, and the frost cracks the fountain. Lead: `lead_white_furs`. |
| `hs_kael_secret` | new thread (story) | — | Begun by the opener. |
| `hs_kael_truth` | step, rewritten | with Kael, once rel ≥ 15 | You corner him on the observatory roof. It comes out shouted: his family, the door, why he ran. Pays `kael_family`. Choices: stand with him (`kael_ally`), or report him to the headmistress (`reported_kael`). |
| `hs_ilse` | new thread (story; takes in `chain_ilse.grim`) | — | Begun by meeting Ilse. |
| `ilse_village`, `ilse_frost_lessons`, `ilse_kael_reunion`, `ilse_northern_letter`, `ilse_farewell` | steps, kept, louder where they're thin | as now (social) | Her storyline. |
| `ilse_grey_returns` | step, rewritten (scene) | village at dusk | The man in grey comes to take her home, in daylight, in the square. Ilse with Kael against him. A fight at `expert` drift mid (feedback: was level 23). Outcomes `ilse_saved` / `ilse_taken`. Pays `ilse_truth`. |
| `hs_ilse_door` | step, rewritten | with Ilse | What she was taught to do. A second source of `ilse_truth`. |
| `hs_grey_hunt` | new thread (scene) | — | The man in grey's Act II test. |
| `hs_grey_offer` + `hs_grey_return` | rewritten, louder (feedback: "more significant") | anywhere, once you hold 2 clues | He makes an offer in person, then comes back for the answer. Take it (`hollow_tempted`: a real gift now, plus a debt that shows on the Night), or refuse to his face (a fight at drift mid). |
| `hs_silver_rings` | rewritten | headmistress's tower | Isolde's Wardens recruit; a ring for the trustworthy. |
| `forbidden_section_2/3` | kept | the forbidden thread | `codex_names` (already guarded with `not closed()`). |
| climax | `hs_frost_ring`, rewritten | the lake, winter | The first frost-ring on the lake. Things of frost and whispers come ashore for one night, and you fight one (a new `frost_wraith` foe) with whoever is beside you. `advance` to clock 7. |

## Act III, Escalation (opener at clock 7; deadline y3m2; next act by y4m3)

| Card | Status | Dealt | What happens / pays |
|---|---|---|---|
| `hs_dark_tower` | rewritten (opener) | courtyard, at night | The cult strikes: a tower's lights go out at once, the lake half-freezes, and a black-star seal is burned into the Great Hall door. The academy panics. |
| `hs_sides` | new thread (scene) | — | Factions take sides. |
| `hs_choosing_sides` | rewritten | the Great Hall | Isolde and the Dumonts' envoy (or the man in grey) face off with wands drawn in front of the school. You stand with the Wardens, with the Dumonts, or alone (`sided_*`). A negotiation or a fight. |
| `hs_locks` | new thread (quest) | — | `need=2`. |
| `hs_maud_locks` | part, rewritten | Maud's cottage | Maud has seen ice before. The seven locks, and Edmund's story told straight. Pays `seven_locks`. |
| `maud_old_wand` | part, rewritten | with Maud | Edmund's silver wand, given to someone who means to close the door. Sets `edmund_wand` (new flag). |
| `hs_seventh_tower` | part, rewritten | the seventh tower, by night | The climb, the wards that shriek, and the key. Every candle in the academy goes out when you lift it. Pays `star_key`. `hs_key_breakfast` (Isolde knows by breakfast) stays its follow-up. |
| `hs_shadow` | new thread (story) | — | Begun by `hs_two_shadows`. |
| `hs_two_shadows` | start, rewritten | anywhere, at dusk | Your shadow moves a moment late. |
| `hs_seraphine_shadow` | step, rewritten | with Seraphine | She paints it before she sees it: one star too many, and your outline under it. Pays `second_shadow`. `astro_eclipse` stays a second source. |
| climax | `hs_grey_daylight`, new | the courtyard, by day | The man in grey strikes in daylight. He comes for the key (if you hold it) or for Kael. A fight with an ally's assist, at drift mid. If you lose, he takes one thing: the key (`star_key` lost; the Night's seal is then harder) or a clue. `advance` to clock 10. |
| `dumont_mother`'s letter | new, story | a letter | One black-star letter from the Dumonts' mother, to Kael or Ilse (or to you, if you sided with the Dumonts). It foreshadows the Night. |

## Act IV, Convergence (opener at clock 10; deadline y4m3; the Night by y4m9)

| Card | Status | Dealt | What happens / pays |
|---|---|---|---|
| `hs_last_winter` | rewritten (opener) | the lake | The cold comes early. Each ally says out loud whether they'll stand with you (`winter_kael`, `winter_ilse`, `winter_maud`, `winter_isolde`). |
| `hs_ready` | new thread (story) | — | — |
| `hs_isolde_summons` | step, rewritten (no longer pinned to months 3–7) | headmistress's tower | Isolde lays out the Night and asks for the key (`gave_star_key` / `kept_star_key`). A second source of `star_key` for a Warden who never climbed. |
| `hs_go_down_early` | new | the lake, at night, from the opener on | If you hold `star_key` and 2 of the 3 key clues: "Go down tonight, before they're ready." `advance` to 12. The Night starts at once, and the cult's circle is only half-formed (easier odds on its scene). |
| `hs_the_night` | rewritten | auto when the clock reaches 12 (the deadline y4m9, or early) | The opener of the Night (below). |

An untouched plot still opens each act by its deadline. A player who never qualified for the Night gets `hs_the_night_above`: the lake freezes without them, the arc closes, and the ending is bystander.

## The Night (`hs_night`, a scene thread; one sitting; every card `arc: hollowstar`)

| # | Card | Status | What happens | Clue paid off |
|---|---|---|---|---|
| 1 | `hs_the_night` | rewritten | The lake freezes in one breath, the bell tolls, the academy wakes. Go down, or hold the line above (`hollow_held_line`). Both `close hollowstar`. | `lake_bell`: you know the note, and better odds on the ice. |
| 2 | `hs_night_company` | new | One card naming who comes down with you: Kael (`kael_ally` / `winter_kael`), else Ilse if saved, else Maud with Edmund's wand, else Isolde's Wardens, else no one. It sets the ally for the rest of the night. | — |
| 3 | `hs_night_cult` | new | The cult's circle on the ice, led by the Dumonts' mother. A fight (`master-`, a new `hollow_matriarch` foe, your ally's assist), or speak the names from the Codex and break the circle without one. | `codex_names`; `kael_family` (the mother and her son, shouting across the ice). |
| 4 | `hs_tunnel` | rewritten, harder | The man in grey in the boathouse tunnel. Kael (or Ilse) faces him for their family, out loud. Fight with the Hoarfrost assist (already wired), talk, or slip past. | `ilse_truth`, `kael_family` (the talk option); `lake_bell` (slip past). |
| 5 | `hs_night_ilse` | new | If Ilse was taken, she stands with the man in grey and the siblings clash: reach her (negotiate) or fight her. If saved, she breaks his hold beside you. `ilse_taken` / `dumont_reunited` resolve on screen. | `ilse_truth` |
| 6 | `hs_night_shadow` | new | Your shadow rises as the Star's champion: a fight against your own kit mirrored (a new `your_shadow` foe). | `second_shadow` gives forewarned odds. |
| 7 | `hs_threshold` | rewritten | The founders' wall and its seven locks. Each clue opens a lock or lowers the cost. | `seven_locks`, `founders_ledger`, `knows_founders_seal`, `edmund_wand` |
| 8 | `hs_beneath` | rewritten | The Star speaks, in your own voice. Seal it: a last fight against what comes through the gap (`frost_wraith`, grown), then the seal check, at better odds with the key. Bargain, open, or flee, each made loud. | `star_key` turns in the round door; without it, a harder seal. |
| 9 | aftermaths | `hs_aftermath`, `hs_aftermath_lost` rewritten; new `hs_aftermath_bargain`, `_freed`, `_fled`, `_held` | One card per outcome, saying what you won and what it cost. Health costs move here, so no collapse interrupts the Night. | — |

**Every clue resolves either way.** A clue you never found still gets its beat on the Night, revealed there at worse odds and a higher cost, so the finale explains the whole mystery.

**The bargain pays at once** (feedback): no reward sits at a cap. It teaches a Hollow spell (starcalling's dark twin, from canon if the spellbook has one, else a soft-lore addition), gives Mana and crowns now, and a lasting condition with an edge and a price. `star_mark` is given only if not already held; if held, it deepens into a named second effect. All of it is announced in `hs_aftermath_bargain`.

## New foes (combat/setup/foes.mjs; EVENTS witnesses: false underground)

| Foe | Loadout | Used in |
|---|---|---|
| `frost_wraith` | special (creature, frost: rime, hoarfrost-like) | Act II climax; the Night's door |
| `hollow_matriarch` (the Dumonts' mother) | named (rime, compel, eclipse) | the Night's cult circle |
| `your_shadow` | a mirror of the player's own kit | the Night's shadow |
| `man_in_grey` | existing, at drift mid from an expert floor | Act I–III scenes, the tunnel |
| cult adepts | `Hollow adept` | Act III scenes |

## Soft lore to add (via skills/distill-lore)

`dumont_mother` (if approved), `frost_wraith` (the things of frost and whispers, named), `hollow_circle` (the cult on the ice). Update the timeline entry `the_night` (y4, by Blossomtide, or earlier by choice). The endings' "the spring the lake froze" wording stays true, since the early descent opens only from the Act IV opener and the lake freezes the night you go down. Endings that say "spring" become "the night the lake froze".

## Counts and checks

- About 22 cards rewritten in place, 14 new cards, and the rest retired (`when: false`). Every key clue keeps ≥ 2 sources.
- `tools/hs-funnel.js` gets the new threads: each act's reach, the early descent, each outcome, per play style.
- `grim analyze` confirms plot cards spread across the months rather than bunching at deadlines; the plot cap (one plot card a month, two in a beat month) applies to every thread card.
- `grim odds` on every fight, checked against `docs/authoring/checks.md`.
- A test drives an untouched plot to bystander, and a pushed plot through an early descent to each outcome.

## Decisions (2026-10-26)

1. **The Dumonts' mother leads the cult's circle on the Night.** It makes the main conflict a family's: Kael and Ilse against the mother who sent them, with you between. She needs no backstory beyond the canon (she sent Kael, raised Ilse to open the door, never said she was proud). One soft `@lore dumont_mother` entry; she is "Madame Dumont" on the page.
2. **The early descent stays, as a trade:** go down before the deadline, in spring (Stormbloom or Greenrise, so every "the spring the lake froze" stays true) and the cult's circle is half-formed (easier), but only the allies who have already promised (`winter_*`) come with you; at the deadline everyone who would stand with you is there, and so is the whole circle.
3. **Losing the star key is possible, and so is winning it back without a fight:**
   - through Isolde's summons, if the Wardens trust you;
   - by stealing it back from the man in grey's room at the Newt (a deceive check);
   - through Ilse or Kael, who know where the cult keeps what it takes (a negotiation, or an ally's favour);
   - or with Maud's help: Edmund's wand can find what the founders made.
   Without the key, the seal is harder but still possible.
4. **The whole plot is playable without winning a single fight** (user, 2026-10-26). Every fight in the plot sits beside at least one route that isn't a fight: talk, sneak, a spell, a clue, or an ally. Losing a fight costs something real but never closes the story off. Every key clue keeps a source that isn't a fight, and the Night reaches every outcome by non-combat routes. `tools/hs-funnel.js` checks this with a style that declines or loses every fight (`--no-fights`).

