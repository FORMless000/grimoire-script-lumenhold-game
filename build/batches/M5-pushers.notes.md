# M5: pushers, rivals, Grisk and Ember (threads 2)

File: `content/events/pushers.grim`. It holds three `@appointment`s, each with its own pool of `trigger: queued` cards: 18 cards in all. It needs no engine code.

## Wiring

**`rival_provokes`:** `at: month`, `for: met`.
- It holds while a peer is a rival or nemesis, or has soured to `rel <= -12`, in term. `npc` is the subject.
- `chance: slim`, one roll per person.
- **The generic cards** (cast `per: npc`): `pr_rival_seat`, `pr_rival_book`, `pr_rival_race` and `pr_rival_signed_up`.
- **Lyra's own versions** (`specializes:`): `lyra_rival_seat` and `lyra_rival_signed_up`.
- **Bram's own versions:** `bram_rival_race` and `bram_rival_signed_up`.
- Lyra and Bram are the only written rivals. Each still draws the other two generic cards, in their own name.

**`grisk_dunning`:** `at: month`, `chance: unlikely`.
- `when: term and has(in_debt) and debt_missed == 0 and not flag(grisk_gone)`: only in a month you paid, so it never doubles with `grisk_reminder` or `grisk_collectors`, which a missed payment queues.
- **Five cards:**
  - **`grisk_kind_month`:** this month's payment returned, against a promise. It reuses `owes_grisk` and `grisk_names_favour` from `pools/night.grim`.
  - **`grisk_settle_early`:** close the debt for slightly less than is left.
  - **`grisk_interest_in_kind`:** a classmate's name for a month off the end (`alignment -small`).
  - **`grisk_troll_letter`:** a collector off duty. This card now also unlocks the `grisk.collectors` fact, because it introduces him.
  - **`grisk_regards_friend`:** the threat that reaches a friend.

**`ember_brings`:** `at: month`, `when: has(familiar_fox)`, `chance: slim`.
- **Six cards:** `ember_scorched_boots`, `ember_ring`, `ember_out_till_dawn`, `ember_mouse`, `ember_old_coin` and `ember_cold_snap`.
- The three existing `ember_*` cards stay where they are (`statuses_routine_weight12`, `ember_and_the_sandwich`), so the golden games for them are unchanged.

**Tooling:** `appointmentCards` (`src/grimoire.js`) also returns the `specializes:` versions of the cards an appointment deals. The director already plays them in place of their generic card; without this change, lint and reach called them orphans.

## Measured

15 games per style, `tools/policies.js`; the per-game counts are in the session log.

| Pusher | Measured | Rate |
|---|---|---|
| Rival cards | 1–3.4 a game | about 1.5 a year of rivalry. Aggressive and lumen, which are rivals for 27–31 of 48 months, get 3–3.4 |
| Ember cards | 1–2.9 a game | about 2 a year of owning her. Before this batch, her three cards came 0.1–0.5 times a game |
| Grisk cards | 0.3–0.9 a game | about 1 a year of debt. A debt lasts about 5 months, and only the term months you paid count |

## Retrieval

**`search` before drafting:**
- the dare and the duel challenge: The Glove Thrown, A Formal Challenge, The High Table Dare;
- the prank: Prank War, Dancing Boots;
- Grisk collecting: `grisk_cross`, `know_grisk_collectors`, `grisk_names_favour`;
- Ember finding things: `fox_helps` (sock, glove, pine cone, purse, page), `ember_night_hunt` (a loose stone), `ember_and_the_sandwich`.

All of these premises were avoided.

**`related --draft`, per card:**
- **`pr_rival_notes`** (red corrections in your returned notes) was too close to `lecture_tower_red_ink`, so it became `pr_rival_book`: the rival hoards the library's only copy. It differs from `grimsbys_last_copy`, where a friend's hand is on the same shop copy.
- **`lyra_rival_notes` / `lyra_rival_book`:** "Adequate" in the margins was too close to `letter_lyra_book`, and the book repeated `lyra_intro`'s last copy. Both were dropped, and Lyra's version of the list (`lyra_rival_signed_up`) replaces them. A "list of drills" line echoed `letter_lyra_drills`, so it was rewritten.
- **The race** up the Lecture Tower stair before the bell was too close to `slice_wager`, so it moved to rowing to the far jetty. Bram's version is now laps of the cloister.
- **`pr_rival_signed_up`:** `lecture_tower_volunteer` and `renown_demonstration` are a lecturer's call and the Great Hall. Here the rival writes your name down.
- **`ember_mouse`:** `job_board_lost_familiars` is the lost-things corner of the job board. Here Ember has caught the lost mouse.

## Canon

- **Fact gates respected:**
  - Lyra's sleeplessness (gated on `lyra_become_close`) was cut.
  - Bram's "don't make it weird" (`bram_turns`) was cut.
  - Grisk's corner table (`grisk.newt_table`) was cut from the kind-month text.
  - The trolls are introduced by the card itself, and unlock their fact.
- **No new proper nouns:** the mouse's name was dropped.
- Ember is she.

## Round 1 critic fixes

- **Rivals:**
  - One named condition, `@cond provokes(x)`: peer, `around(x)`, and rival, nemesis or `rel <= -12`. The appointment and all four generic casts use it, so a gone or distant rival (Ilse taken or gone north) is never dealt.
  - `per: npc` moved onto `@pool rival_provokes`.
- **Slots for pushed cards:** `pr_rival_book` noon; `lyra_rival_seat` night; `ember_cold_snap` night; `grisk_kind_month` and `grisk_troll_letter` evening (the Newt); `grisk_settle_early` and `grisk_interest_in_kind` afternoon.
- **`grisk_settle_early`:** only at `debt_paid` 3–4, so the price is always below what's left.
- **`grisk_interest_in_kind`:**
  - A single `debt_paid += 1`, then `if debt_paid >= 6: lose in_debt`.
  - The corner table (`grisk.newt_table`) and the tavern scene are gone.
- **Once each:** the Grisk and Ember pools no longer set `repeat:`. Their cards have no variants.
- **`ember_ring` and `ember_old_coin`:** `not off_campus`.
- **`ember_out_till_dawn`:** the right option is "go back to bed" (`health +tiny`). The study gain is gone.
- **`ember_scorched_boots`** (close to `ember_and_the_sandwich`, with alignment it hadn't earned) is replaced by **`ember_and_footnote`**: Ember meets Footnote, the library cat (soft lore). `related --draft` points to `life_library_cat` and `lib_footnote_strike`, which are Footnote alone.
- **`grisk_troll_letter`:**
  - The quotes are joined into one speech.
  - The study cost shows ("your own reading left in your bag").
  - It plays once, and has no `actor: grisk`.
- **Polish:**
  - `pr_rival_signed_up`'s renown cost shows ("the whole corridor sees you").
  - `bram_rival_signed_up` has `tags: rival`.
