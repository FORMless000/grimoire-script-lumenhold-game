# `between_hearts` transition references

Source-only index of the matchmaking-related flag, queue, and pair-relationship transitions in [`content/events/between_hearts.grim`](../../../content/events/between_hearts.grim). It records source locations without assessing them.

## Matchmaking queues and outcomes

- `between_circling` is lines 10–40. On the appeal win it changes `npc_rel(a,b) +medium`, then queues either `between_match_made in 3 with a` or `between_match_soured in 3 with a` via `chance likely` (lines 21–31). On lose it changes `npc_rel(a,b) -tiny` (33–36). The leave option has no pair-relationship write (37–40).
- `between_love_note` is lines 42–74. Delivering the note successfully (`chance likely`) changes `npc_rel(a,b) +medium` and queues `between_match_made in 3 with a` (54–63). Rewriting successfully also changes the pair by `+medium` and queues the same event (64–71). The rewrite challenge lose path has no pair write (72–74).
- The queued outcomes are `between_match_made` (142–160) and `between_match_soured` (162–179), both `trigger: queued`, `actor: npc`. Their `rel npc` effects use the carried actor, which the two source queues bind with `with a`.

## Persistent matchmaker flag

- `between_match_made` option 1 (`Tell just a few people`, lines 152–156) sets `flag matchmaker` at line 155.
- `between_matchmaker` at lines 181–200 is a `pool: between` card whose `when: flag(matchmaker)` gate is at line 188. It has no flag clear/unset statement in this file. Its choices change the selected classmate's `rel a` (+small at line 193; -tiny at line 199).
- `between_match_made` option 2 and both `between_match_soured` options do not set `matchmaker` (lines 157–179).

## Other pair-state transitions in this source

The remaining `npc_rel(a,b)` writes in this file are: `between_find_out` +small/+tiny on the two success paths (lines 91–103); `between_setup_supper` +small on either positive supper outcome and -tiny on either non-positive outcome (125–140); `between_likes_your_suitor` +small on “Step back for {a}” (219–223); `between_partner_meets_ex` +small on introduction challenge win (240–249); `between_suitors_compare` +small on either choice's win/leave resolution (289–307); `between_rumour_from_you` +tiny on letting the rumour run (372–383); `between_betting_book` has no `npc_rel` write (408–432); `between_couple_bubble` +tiny on “Give them room” (445–454). These are event-local transitions; this note does not trace unrelated future readers.

Relevant queue/actor semantics: `queue … with a` carries the cast role's NPC into a queued target declared `actor: npc`; see [`docs/grimoire-script.md`](../../grimoire-script.md:329) and [`src/engine.js`](../../../src/engine.js:1631).
