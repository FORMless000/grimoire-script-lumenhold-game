# T1: detention as a day (threads 1)

**Files:**
- `content/events/detention.grim`: 8 new cards and `@pool detention`.
- `content/states/states.grim`: `@state detention` now has `day:`, loses its monthly mood tick, and is cleared on a break.
- `content/events/pools/statuses.grim`: `detention_cauldrons` and `detention_lines` join the pool.
- `content/events/night.grim`: the second catch in `night_suspicion` gives one month of detention, not three. The 3-month lockout stays.
- zh-CN for all of it.

## The rule (the user's, 2026-10-28)

- **Detention replaces a month's outings.** While you have it, a term month's afternoon and evening visits become punishment cards drawn from this pool, with no map. They replace the old end-of-month mood debuff. This uses the engine addition in 6cd4273: a state's `day:` applies in term, and a recipe slot can name a pool.
- **Duration counts days served.** A detention gained today takes the next term month, and `gain detention` serves one month.
- **A break clears it.**

Measured over 10 games per style:

| Style | Detention months a game | Punishment cards a game |
|---|---|---|
| cautious | 1.1 | 2.2 |
| random | 1.6 | 3.2 |
| social | 1.8 | 3.6 |
| balanced | 2.0 | 4.0 |
| nightlife | 4.4 | 8.8 |

Every served month dealt both cards. In `sim 300`, every pool card shows in at least 3% of games.

## Cards

- **The pool:** `class: routine`, `repeat: 3`, `weight: 10`, `when: has(detention)`.
- **Time of day:** each card can come in the afternoon or the evening. Text that depends on the hour uses `{slot == "evening": …|…}`.
- **What each card is:** the punishment is the visits lost, and each card is still a real trade.
- **Two flags for the heists (T4/T5):** `vault_catalogued` (you know the confiscation vault's layout) and `prefect_rota` (you know the prefects' rounds). No card reads them yet.

| Card | Left | Right |
|---|---|---|
| `det_vault_catalogue` | catalogue: lore, a little mood, `vault_catalogued` | read the confiscation slips: mood, a little Hollow (reading private notes) |
| `det_prefects_room` | copy the ledger and the rota: guile, a little mood, `prefect_rota` | leave a friend's name out: a little Hollow and a deceive check (rel on a win, mood on a loss) |
| `det_apology` | a sincere letter: a little Lumen, charm, mood | a magnificent insincere one: a little Hollow and a deceive check (wild) |
| `det_candle_wax` | scrape the tables: vigor and health | coax the floating candles down: a spell check (arcana) |
| `det_great_lens` | polish the telescope: lore and health | look through it: mood and a little study |
| `det_flight_divots` | fill the divots: vigor and health | borrow a broom: a deceive check (wild; a loss costs renown) |
| `det_inkwells` | fill the inkwells: a little study and mood | doctor the lecturer's well: a deceive check (a prank: no alignment) |
| `det_gargoyle_scrub` | scrub: vigor and health | linger at the third gargoyle: guile and health. Cartographers check their chalk mark; anyone else feels the draught but finds no door, so the hidden place is not revealed |

## Retrieval

**Searches before drafting:**
- detention or punishment;
- the confiscation vault;
- trophies;
- the owlery;
- lines;
- pot scrubbing;
- reshelving with Footnote;
- the prefect's round;
- an apology letter;
- weeding with Maud;
- copying the demerit ledger;
- ward chalk;
- bandages;
- portraits;
- candle wax;
- tack;
- boat tar;
- peeling potatoes;
- seed sorting;
- stair wards;
- a silencing charm;
- the telescope lens;
- workshop springs;
- flight-field divots;
- folding the Ledger;
- inkwells;
- gargoyle scrubbing;
- odd socks;
- lab drains.

**Dropped as too close:**

| Idea | Too close to |
|---|---|
| trophies | `brk_duel_trophies` |
| owlery | `stables_owl_loft` / `beast_mucking_out` |
| reshelving | `lib_shelving_rush` |
| prefect's round | `break_castle_night_rounds` |
| weeding | `align_maud_way_back` |
| bandages | `alch_bandage_round` |
| portraits | `life_portrait_gossip` |
| tack | `stables_tack_room` |
| boat tar | `boathouse_green_boat` |
| seed sorting | `greenhouses_seed_tin` |
| stair wards | `umbral_stair_wards` |
| silence | `umbral_quiet_minutes` |
| springs | `workshop_after_the_bang` |
| folding | `ledger_office_deadline_night` |
| socks | the Prudence thread, `ghost_socks` |
| drains | `detention_cauldrons` |

**`related --draft` on each new card, and what it changed:**
- `det_inkwells`: the top hit was `lecture_tower_old_board` (reading the board), so the card stopped reading boards and now plans an essay while filling.
- `det_prefects_room` against `bram_between_writes_up`: kept. Omitting a name from a fair copy is a different act from taking a friend's demerit.
- `det_vault_catalogue` against `feud_vault` and `corvin_confiscation_vault`: kept. Canon names cataloguing contraband as detention; `feud_vault` watches Bram and Corvin clear the vault, and Corvin's card is a break-in.
- The rest have distinct top hits.

## Checks

- `grim lint`: 0 errors, and no new warnings.
- `sim 300`: 0 crashes.
- zh-CN: 61/61.
- The engine change has unit tests: `test/threads1.test.js`.
