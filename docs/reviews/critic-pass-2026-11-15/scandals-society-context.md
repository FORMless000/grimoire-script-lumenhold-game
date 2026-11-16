# Remaining `scandals.grim` and `society.grim` context

Read-only source map for IDs still marked pending in the frozen progress queue. It contains wiring and continuity references only, not judgments. Prior local notes read: [`P4-09.notes.md`](../../../build/batches/P4-09.notes.md), [`P4-10.notes.md`](../../../build/batches/P4-10.notes.md), and [`P4-recheck.notes.md`](../../../build/batches/P4-recheck.notes.md). Those document retrieval/rework provenance; their earlier review statuses are not adopted here. No retrieval was run.

## Current frozen queue scope

The progress ledger has 14 pending scandal IDs at [`progress.json`](progress.json:4060): `scandal_ledger_lie`, `scandal_candle_smoke`, `scandal_memoir_book`, `scandal_flourish_hurt`, `scandal_wrong_notes`, `scandal_thornwick_cheat`, `scandal_society_dare`, `scandal_leaked_letter`, `scandal_cheating_rumour`, `scandal_ex_tells_all`, `scandal_curfew_column`, `scandal_snubbed`, `scandal_thornwick_defection`, `scandal_forged_love_letter`. It has 11 pending society IDs at lines 4158–4228: `season_invitation`, `season_lady_vaneshade`, `season_rival`, `season_ball`, `season_friends`, `season_price`, `season_end`, `fame_rivals_for_you`, `fame_wedge`, `fame_best_friend_claims`, `fame_after_you`.

P4-09 notes refer to 15 scandal cards; `scandal_credit_taken` remains in the current source at `scandals.grim:405` but is absent from this pending-ID list. P4-10 notes refer to 14 society cards; `season_first_supper` and `fame_lend_your_name` remain adjacent source cards but are absent from this pending-ID list. The recheck note records their prior cross-batch reworks; this packet doesn't assign them a current status.

## Scandal pool and callback flow

[`content/events/scandals.grim`](../../../content/events/scandals.grim) defines:

- `@pool scandal` lines 9–15: `trigger: queued`, `class: incident`, `tone: tense`, `repeat: 1`, tags `renown scandal`; `repeat: 1` means a one-month cooldown, not once-only (engine eligibility in `src/engine.js:1926–1935`). Used by the seven callback IDs below. Each callback event has its own `when: renown_known()` at lines 41, 69, 95, 121, 147, 173, 199.
- `@pool scandal_any` lines 17–20 inherits from `scandal` and adds `when: renown_famous()`. Its appointment `scandal` (22–27) is monthly, requires Famous + term + not wrapup, and has `chance: slim`; `scandal_legend` (29–34) is a second monthly slim roll for Legends. These appoint the `scandal_any` pool. Thus `scandal_any` carries queued/incident/repeat/tone properties and adds the Famous gate; event-local gates, where written, further constrain it.
- No fact IDs or `knows()` checks occur in `scandals.grim`. Event-specific cast gates are `scandal_ex_tells_all`: `x: any where met(x) and around(x) and bond(x) == "ex"`, `per: x` (273–301); `scandal_forged_love_letter`: `y: any where classmate_here(y) and rel(y) >= 0`, `per: y` (376–403); and the adjacent, not-in-queue `scandal_credit_taken`: `f: any where classmate_here(f) and rel(f) >= 15`, `per: f` (405–433). Other queued scandal cards have no `cast:`/`per:` declarations.

Seven queued callback paths connect to earlier spotlight choices (producers and exact queue source lines):

| Pending callback | Queue producer / source location | Queue expression |
|---|---|---|
| `scandal_ledger_lie` | `spot_ledger_profile`, [`spotlight.grim:118`](../../../content/events/spotlight.grim:118) | `within 3..6` |
| `scandal_candle_smoke` | candle choice in `spotlight_famous.grim:24` | `within 3..6 chance unlikely` |
| `scandal_memoir_book` | memoir choice in `spotlight_famous.grim:46` | `within 2..5 chance even` |
| `scandal_society_dare` | club choice in `spotlight_famous.grim:89` | `within 2..5 chance unlikely` |
| `scandal_thornwick_cheat` | winning boundary-stones outcome in `spotlight_famous.grim:108` | `within 1..3 chance unlikely` |
| `scandal_flourish_hurt` | flourish choice in `spotlight_legend.grim:81` | `within 2..4 chance unlikely` |
| `scandal_wrong_notes` | paid-notes choice in `spotlight.grim:411` | `within 2..4 chance even` |

Each producer is its own event ID used by the `since`/queue-log/history infrastructure; the queue target strings above are also IDs. The P4-09 notes describe these as callbacks. The other seven pending IDs use `pool: scandal_any` directly: leaked letter (`scandals.grim:223`), GPA-rumour with `gpa >= 3.0` (`247–271`), ex tells all (`273–301`), curfew column (`303–324`), snubbed (`326–349`), Thornwick defection (`351–374`), forged love letter (`376–403`). Their actual shared pool/appointment gate is stated above.

Most scandal menus use `own`, `deny`, `spin` keys (P4-09 notes; inspect each current event at its source ID). In source, `deny` may be a named challenge or a direct action, depending on event; no common option gate is inherited from a pool.

## The Season thread and its state path

[`content/events/society.grim`](../../../content/events/society.grim) defines `@thread the_season` lines 10–33, `from: story`, `with: begun=flag(season_begun)`, `class: story`, `repeat: 1`, tags `story renown society`, start member `season_invitation`, resolved by `season_in or season_out`. Here `repeat: 1` is a one-month cooldown, not once-only (engine `src/engine.js:1926–1935`). Story-template inheritance is documented at [`content/core/templates.grim:10`](../../../content/core/templates.grim:10): steps inherit the `begun` condition. The current thread flags have these set/read locations:

| State flag | Source set/read locations |
|---|---|
| `season_begun` | Set on invitation accept (`society.grim:45`); thread-begun binding line 12 and start gate `not flag(season_begun)` line 39. |
| `season_charmed` / `season_plain` | First-supper branches at 66/71/76; journal lines 20–21. `season_first_supper` is the queued predecessor between the invitation and Vaneshade step. |
| `season_sponsored` / `season_unsponsored` | Vaneshade choice at 91/98; journal 22–23; the Season end prose reads `season_sponsored` at 206. |
| `season_ball_star` / `season_ball_shared` | Rival outcomes at 116/121/126; journal 24–25; `season_ball` prose reads `season_ball_star` at 140. |
| `season_price_paid` / `season_price_refused` | Patron favor choices at 185/192; journal 26–27; end text reads `season_price_refused` at 206. |
| `season_in` / `season_out` | `season_end` options at 208/214; thread resolution at 31 and journal at 28–29. |

Pending steps retain the queued progression and `defer: off_campus` at each step. Exact member/queue path: accept in `season_invitation` queues `season_first_supper in 1` (48); first supper's choices queue `season_lady_vaneshade in 1` (68/73/78); Lady Vaneshade queues `season_rival in 1` (95/101); rival queues `season_ball in 1` (118/123/129); ball queues `season_friends in 1` (145/150); `season_friends` queues `season_price in 1` (167/172); patron-favor options queue `season_end now` (189/195). `season_end` then sets a resolved flag. `season_invitation` itself is `trigger: auto`, with `term and not wrapup and month <= 3`, Famous or Known plus `seen(renown_patron_dinner)>0`, not already begun, and unseen (35–40). Its refusal option does not set the begun flag or queue a step (50–52).

The concrete written cast/timing gates within pending Season cards: `season_friends` has `f: any where classmate_here(f) and rel(f) >= 25` (159–160); the other pending Season steps have no `cast:` or explicit actor. Lady Vaneshade's prose uses `{met(lyra): , Lyra's mother,|}` at line 89. Lyra's cast entry is [`content/world/cast.grim:9`](../../../content/world/cast.grim:9); the event condition doesn't require meeting Lyra. The textual allusion in the invitation gate points to [`renown_patron_dinner`](../../../content/events/pools/renown.grim:181), a separate event that can satisfy the Known route.

## Fame-among-friends pools and cast roles

`fame_between` at `society.grim:221–225` inherits from pool `spotlight`, adds `when: renown_known()` and `weight: 8`. The inherited spotlight pool supplies `trigger: queued`, `class: routine`, `repeat: 1`, tags `renown spotlight` ([`spotlight.grim:10–15`](../../../content/events/spotlight.grim:10)); `repeat: 1` means a one-month cooldown (engine `src/engine.js:1926–1935`). Its appointment is the monthly Known-and-up spotlight roll ([`spotlight.grim:42–46`](../../../content/events/spotlight.grim:42)).

| Pending card | Cast filter / `per` source lines | Pair-state reads/writes |
|---|---|---|
| `fame_rivals_for_you` | `a` classmate rel≥15; `b` classmate rel≥15 and `at_odds(a,b)`; `per: a` (231–234); per-role bookkeeping is per selected `a`, with a two-month global event rest ([`docs/grimoire-script.md:601`](../../grimoire-script.md:601)). | Choice 1 writes pair `npc_rel -tiny` (241); both direct rel changes at 239–240. |
| `fame_wedge` | `a` classmate rel≥25; `b` classmate rel≥15 and `get_along(a,b)`; `per: a` (255–258); per-role bookkeeping is per selected `a`, with a two-month global event rest ([`docs/grimoire-script.md:601`](../../grimoire-script.md:601)). | Both choices write pair `npc_rel -tiny` or `+tiny` (265,269). |
| `fame_best_friend_claims` | `a` and `b` classmates rel≥10, `at_odds(a,b)`; `per: a` (301–304); per-role bookkeeping is per selected `a`, with a two-month global event rest ([`docs/grimoire-script.md:601`](../../grimoire-script.md:601)). | Challenge win writes pair `npc_rel +small` (311); lose changes each rel -tiny; right changes each rel -tiny (316–323). |
| `fame_after_you` | `pool: fallen`; `a`/`b` classmates rel≥10, pair `npc_rel(a,b)>=20`; `per:a` (328–333); per-role bookkeeping is per selected `a`, with a two-month global event rest ([`docs/grimoire-script.md:601`](../../grimoire-script.md:601)). | Choice 2 changes pair +tiny (344); right/left relationship writes otherwise as shown at 337–344. Pool `fallen` has its own `fallen_star()` gate (`spotlight.grim:34–40`). |

None of the pending society `fame_*` cast roles fixes a named NPC or uses `knows()`/a fact ID. Other story prose names Nessa in the scandal and Lyra/Vaneshade in the Season; dynamic classmates are drawn by current relationship/availability conditions, so their specific NPC voice/facts depend on which role is filled. The new requested brief for the knowledge-cast NPCs is at [`brief-knowledge-cast.md`](brief-knowledge-cast.md).

## Cast and canon references

- There are no `@fact`/`knows()` identifiers in either source file. Named callback relationships refer to Nessa and Sister Amaranth in text, while the cast-parameter cards use dynamic roles. Voice reference lines for mentioned cast members are `nessa` [`cast.grim:161`](../../../content/world/cast.grim:161), `amaranth` [`:318`](../../../content/world/cast.grim:318), and `lyra` [`:28`](../../../content/world/cast.grim:28). Relevant worldbook reference fact text, where context helps identify those mentions: `lyra.mother` unlock `rel(lyra) >= 18`, “Her mother has never once told her ‘well done’” ([`facts/lyra.grim:14`](../../../content/world/facts/lyra.grim:14)); no event in this scope checks that fact.
- The two dynamic ex/cast roles and three fame/society cast roles are as listed above. Their current relationship/availability predicates, not a particular `@fact`, select the actual NPC. General cast schedule/role semantics are in [`docs/grimoire-script.md:516`](../../grimoire-script.md:516) and [`:591`](../../grimoire-script.md:591).
- The brief command was run for the new knowledge cast exactly as requested; it is a separate output and not copied into this packet.
