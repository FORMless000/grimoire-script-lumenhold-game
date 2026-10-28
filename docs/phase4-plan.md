# Phase 4 plan and tracker: the Journal, facts, NPCs among themselves, renown

This file is the living tracker for phase 4 (design §0.3) and its record. A fresh session resumes from **Next up**, at the bottom.

## Scope

Approved 2026-10-27. Four systems, with the content to make them matter:

1. **A fuller Journal:** the main plot, the mini-plots and the side threads, told as stories with stages.
2. **Facts shown in the People panel.**
3. **Inter-NPC cards:** mostly generic, or one side specific (one fixed NPC plus a generic other, chosen by conditions).
4. **Renown as a celebrity track:** spotlights at the high tiers that boost renown or crash it, scandals, high society, the fall.

**Deferred:** archetype side characters, dynamic or spawned NPCs, and memory recall (`{friend.recall(...)}`). "Memory" here means card chains, flags and facts only.

## Decisions (2026-10-27)

The user approved the plan with the budgets cut to about ¾ ("then we're good to go"). The plan's open points were left to its recommendations:

- **Clues merge into the Journal tab.**
  - The tabs become `you | kit | people | journal`.
  - The Journal has four sections, in order: Main plot, Stories, Leads, Diary (the old choice log, collapsed).
- **Locked fact slots are shown** as tier placeholders ("· a secret ·"), with the fact's `hint:` when it has one.
- **Renown fades by tier**, toward a Famous that a renown-chasing style reaches and a Legend that stays rare. The numbers are tuned with `grim analyze`.
- **High society is built on existing canon first:** the Vaneshade gala, the patron dinners, Isolde's tea. A new proper noun gets a soft `@lore` entry only if a storyline needs one.
- **Clique casting is an opt-in, weighted preference**, not a hard rule.

## Design and ideas (the approved brainstorm)

Ideas marked "needs checking" are checked against canon, retrieval and the code when they're built. Numbers here are proposals until `balance` and `analyze` confirm them.

### 1. The Journal: stories, not just clues

#### How the tabs change (decided: merge)

Merge the Clues tab into the Journal so stories live in one place, and keep the choice log as a section of it. The tabs become `you | kit | people | journal`, and the Journal has four sections:

1. **The Hollow Star (and the other main arcs).**
   - Show the current act as a rumour, not a spoiler: "Act II · *The Lantern Goes Out*".
   - Under it, one line of "what people are saying" for that act, written as each act's `act_rumours:`.
   - Then the clues found, with ✷ for key clues, and a slot count ("4 of ?" — never the real total).
   - A closed arc gets an epilogue line and a seal mark.
2. **Stories.** One entry per mini-plot or quest thread the player has started.
   - Each entry has a title, an italic one-line premise, and dated stage lines that build up like a diary.
   - It shows a status: *ongoing*, *resolved*, *let go* (gave up) or *missed* (the window closed).
3. **Leads.** The open leads that haven't been followed yet, as today, with a "where to look" hint (the place or slot).
4. **Diary.** Today's choice log, collapsed by default and grouped by month.


#### The language (additive, schema v1)

Today "the thread" a side story belongs to is just a display name on its clues. Make `@thread` the owner, and let it say its own Journal wiring once, in keeping with "wiring is said once":

```grim
@thread missed_round
from: story
name: The Missed Round
desc: A patient in bed six who shouldn't have been missed.
journal:
  flag(rounds_begun): You covered a round nobody else would.
  flag(rounds_reported): You told the matron.
  flag(rounds_secret): You kept it between you and the night.
  flag(bed_six_truth): Bed six was never on the list.
  flag(rounds_finished): It's done. You still check the door.
status:
  resolved: flag(rounds_finished)
  missed: flag(rounds_secret) and month > …
```

- **Live entries.** Each `journal:` line is a condition and a text. A line shows once its condition holds and is stamped with the turn it first held, kept in `s.journal[thread][i] = turn`. No card has to change, and stage order is the order the lines are written.
- **Arcs:** add `act_rumours:` (a list parallel to `act_names`) and an optional `epilogue:`.
- **i18n:** add `thread: ['name','desc','journal']` to `FIELDS`, and `act_rumours` and `epilogue` to `arc`.
- **Engine:**
  - `journalOf()` and `threads()` read `@thread` names, `journal:` and `status:`.
  - Side threads are still collected from `@clue thread:`, so nothing breaks; a `@thread` with a `name:` takes over that display name.
  - A monthly `stampJournal()` runs next to `unlockFacts()`.
- **Tooling and docs:**
  - lint: every `journal:` condition is reachable, and a storyline thread with no `journal:` gets a warning.
  - `grim leads`-style tooling: list the threads that have no journal yet.
  - `docs/grimoire-script.md` §9, and `schema --update`.

#### Content

- **Journal lines for all 29 threads**, about 3–6 lines each, and `act_rumours` and an epilogue for the 5 arcs. This is migration-sized writing: plan about 150 short lines, plus their zh-CN.
- **A "story so far" recap card** (needs checking): at the start of each year, one card that draws on the Journal ("Last year you…"). It's free to write because the lines already exist.
- **Journal-aware nudges:** a lead left open for more than 6 months produces a gentle card ("Nessa asks whether you ever found out about…").

#### Ideas

- **A "New" pip** on the Journal tab whenever an entry, clue or fact lands.
- **The ending screen** gets a "Stories you lived" list, built from resolved threads, beside the yearbook.
- **Tapping a lead highlights its place on the map** (needs checking: `src/map.js` would need the place for each lead, perhaps via an optional `where:` on `@clue`).


### 2. Facts in the People panel

#### Showing them (engine and UI)

- `snapshot()` exposes `facts` for each NPC: a list of `{id, tier, text, turn, new}` for known facts, plus counts of the unknown ones by tier.
- **The panel row** gets a small "3/7" fact counter.
- **The opened row** shows three groups, with the newest fact first:
  - **Known to all** (surface facts)
  - **Between you** (personal facts)
  - **Secrets** (secret facts)
- **Locked slots** show as greyed lines: "· something private ·" or "· a secret ·". If a fact has an optional `hint:`, a locked slot shows that instead ("Ask about her summers.").
- **The new marker.** A gold dot on the NPC and on the tab stays until the player opens that row. It's kept as UI state in `s.factsSeen`.
- **Toasts.** The `learn` toast names the fact's subject and links to the row ("You learned something about Kael → People"). Facts unlocked silently each month also produce a toast now.
- **Showing what isn't shown yet:**
  - `traits` and `interests` become a "Likes:" line.
  - `bond_months` gives "Friends since Y1, autumn".
  - Each NPC's strongest **known** like and dislike among other NPCs ("Gets on with Ilse · Can't stand Bram"). This only appears after a card has shown that relationship (see §3), recorded as `seenRel`.

#### Language (additive)

- An optional `hint:` on `@fact`, added to `FIELDS.fact`.
- Possibly `knows_any(npc, tier)` and `facts_known(npc)` to count what the player knows (needs checking: they may not be needed).

#### Content ideas: make facts *matter*

- **"Use what you know" options.** An option, or a better outcome, appears only when `knows(x.fact)`.
  - Example: you know Kael's sister fell ill the same winter, so you can say the one right thing at the infirmary.
  - About 15–20 cards across the cast, each touching existing cards with `when knows(...)` branches rather than writing new ones.
- **Second-hand facts (overlaps with §3).** NPC A tells you something about NPC B: you `learn` B's fact, and A's own relationship changes depending on whether you keep it to yourself.
- **Trading secrets (overlaps with §4).** Nessa or the Ledger offer renown for a secret-tier fact.
  - Selling it gives a large renown boost, a heavy relationship crash, a step toward Hollow, and possibly a scandal later when the source comes out.
  - Keeping it gives a step toward Lumen and a small bond.
- **Fill the thin fact sets.** Ilse, Isolde, Maud and others have few personal events; each should reach about 5–8 facts with real unlock routes (`skills/distill-lore`).
- **A "complete the picture" moment.** Knowing every fact about a close friend unlocks a quiet milestone card that only that friend gets ("They notice you know them").


### 3. NPCs among themselves (inter-NPC cards)

#### Shapes the cards take

- **Mostly generic.** Both roles are `any`, constrained by `npc_rel`, tags, bonds and `around`.
- **One side specific.** One fixed NPC plus a generic other with conditions:

  ```grim
  cast:
    kael: kael where around(kael) and met(kael)
    other: any where tagged(other, student) and npc_rel(kael, other) >= 20 and other != kael
  ```

  Each specific card should hinge on that NPC's `voice:`, traits or facts, so it couldn't be swapped onto someone else.

#### Wiring (said once)

- A new `content/events/pools/between.grim`, or one file per behaviour, with a `@pool between` for shared gating and cooldowns, `per:` on the specific role, and repeat limits.
- Add these `@cond`s to `conds.grim` (needs checking: does `@cond` already take parameters? The `suitor(x)` cond suggests it does):
  - `friends_pair(a,b)`: npc_rel ≥ 20
  - `at_odds(a,b)`: npc_rel ≤ −10
  - `sweethearts(a,b)`: npc_rel ≥ 60 and a flag set by a matchmaking card
- **Engine (small, optional): clique casting.** When a card fills two `any` roles, the casting affinity leans toward pairs with high `npc_rel` (design §10.3, "casting prefers friends together"). It's weighted, not a hard rule, so variety survives. If preferred, it could be opt-in per role (`prefer: friends`).
- **Shown relations (`seenRel`).** Whenever a card's `say` moves or shows an `npc_rel`, the pair is marked seen, so the People panel can show it (§2).

#### Behaviours and card ideas (generic unless marked ★ for one side specific)

**Friction and feuds**
- *Two classmates you like are mid-argument in the corridor.* Take a side, which raises one relationship and lowers the other and moves their `npc_rel`; or make them laugh (a charm challenge); or walk on.
- *The seating problem.* Your two friends can't stand each other and both want you at their table. Repeatable with variants.
- ★ **Bram** reports someone you're friendly with for a demerit. Plead for them (spend Bram's goodwill), let it happen, or take the blame yourself.
- ★ **Corvin** is running odds on a duel between two students who hate each other. Bet, tip one of them off, or tell a prefect.
- *The feud ends.* Once two people's npc_rel crosses from below −10 to above 0 because of you, a scene of the reconciliation, which they credit to you.
- *Contagious grudge.* Befriending someone's enemy: "I saw you with *them*." Keep both friends (a cost each month), or choose one.

**Friends together (cliques)**
- *A study circle forms.* Two or three NPCs with high mutual npc_rel invite you in; joining trades study for the group's bond.
- *Inside joke.* Two friends share a joke you're not in on. Ask (a small bond) or let it go (privacy).
- ★ **Lyra** and her friend from the noble set close ranks at a gala. Being admitted takes renown or a known fact.
- *The covering-for-each-other card.* One friend asks you to lie for another.

**Matchmaking** (romance only between adult NPCs; nothing explicit)
- *Almost talking.* Two classmates with npc_rel 10–40 keep circling each other. Nudge them (a charm check, with luck on top), engineer a moment (costs a turn and some study), or mind your own business.
- *The note.* One asks you to pass a note to the other: deliver it, rewrite it, or "lose" it, with alignment if you meddle cruelly.
- *Aftermath, good.* If npc_rel reaches 60 or more and the matched flag is set: they're an item, and thank you at the Midwinter Ball (calendar card variant).
- *Aftermath, bad.* If it soured: both are cool toward you for a while.
- ★ **Nessa** wants to run an anonymous "match of the month" in the Ledger and needs your nominations. Overlaps with renown.
- *Matchmaker's reputation.* After about 2 successes, generic students start asking you for help: a repeatable flavour card. It's gated on a flag, not a counter used as plot progress.

**Jealousy** (romance only, as decided on 2026-10-20)
- *Two suitors meet.* Both have spark ≥ 30 with you, and their npc_rel drops. Choose, defuse, or let them sort it out.
- *Your partner and the ex* end up at the same party. Uses `bond == "ex"`.
- ★ The player's partner is fixed (`partner` role, plus a generic "admirer" with spark): the admirer brings you a gift in front of your partner.

**Gossip and what people know**
- *A classmate tells you something about another* (second-hand facts, §2). Pass it on, keep it, or warn the subject.
- *Rumour telephone.* A rumour about two NPCs comes back to you twisted. Correct it, which costs you standing with the gossip, or enjoy it.

**Mentors and protégés** (faculty, using existing `relations:`)
- ★ **Thorne** and a student he's hard on: the student asks you to intercede.
- *Two professors' feud spills into class.* Whose method do you use on the paper?

**How the volume and shapes fit together**
- About 60% generic.
- About 40% one-side specific, spread across the 8–10 NPCs with the strongest `relations:` lines (Lyra, Kael, Bram, Corvin, Nessa, Ilse, Thorne, Isolde…).
- Plus 2–3 small `story`-template threads: "the feud", "the match", "the study circle". Each has `journal:` lines, so it appears in Stories (§1).


### 4. Renown: the celebrity track

#### Making the tiers reachable (decided: tiered fading)

At 20% fading a month, the measured renown flows settle at about 15, so Famous (60) and Legend (85) are unreachable. Two levers, both content-only (`rules.grim` / `balance.grim`); I recommend using both:

- **Fading by tier** in the `fame_fades` hook:
  - 20% below 30.
  - 15% while Known.
  - 10% while Famous or above. Fame sustains itself, but a month of silence still costs real ground.
- **Spotlights pay big.** Spotlight milestones give +huge (20) on a win. A loss crashes renown by −large to −huge, and possibly by half (`renown -= floor(renown*0.5)`) on a scandal.

Add `@cond known / famous / legend` to `conds.grim`. Tune the thresholds with `grim analyze` per play style: a "famous" style that chases renown should reach Famous by about Y2 and Legend only with luck.

#### Wiring

- **An `@appointment spotlight`.** On first crossing each tier, push one tier-entry milestone card ("Your name in the Ledger's headline"). After that, deal from a `@pool spotlight_known/famous/legend` with cooldowns. It's an appointment, not engine code.
- **Scandal branches.** Spotlight cards at 60 or more carry a scandal outcome on `chance` scaled by renown (design: about (renown − 50)%).
  - Needs checking: whether `chance` accepts an expression, or whether we use `challenge … using renown` reversed, or an `@cond scandal_risk` with tiered variants.
- **The fall.** A `@cond fallen_star` (renown was at least Famous, recorded by a flag, and is now below 30) unlocks "yesterday's news" cards: comebacks, freedom, or bitterness.
- **UI.** A tier word beside the renown number ("Known · 34"), a toast when a tier is crossed, and a faint star on the top bar at Legend.
- **Endings and yearbook.** Split `ending_celebrity` into tiers, or add an `ending_legend` with a priority above it. Add a "fallen star" yearbook line.

#### Spotlight and scandal ideas (each a real gamble: a boost or a crash)

**Known (30+): people start to know your face**
- *The Ledger profile.* Nessa interviews you. Be candid (renown goes up, and a fact about you gets printed), polish the story (a guile check: win big, or get caught embellishing), or decline (a small loss of renown and a bond with Nessa).
- *A seat at the high table* (needs checking against canon: a soft `@lore` entry for a senior-students' or patrons' table). Accept and skip your friends' dinner, or decline.
- *First-years copy your robes or your spell flourish.* Lean in, which makes it a fad (renown up) and invites mockery later, or quietly discourage it.
- *Asked to judge the first-years' duelling exhibition.* Judge fairly and lose a fan, or play to the crowd.
- *Recognised in the village.* A free pie and a crowd, or privacy and a quiet afternoon.
- *A fan's gift.* A charm, possibly an `@item`. Wear it in public (renown up) or return it kindly.

**Famous (60+): the academy watches you**
- *An exhibition duel before the whole school* (combat, crowd at stake). A win gives +huge; a loss is very public (−large, and a scandal branch).
- *Open the Midwinter Ball* (a calendar variant). Choose your partner in front of everyone, which moves spark and possibly jealousy (§3).
- *A merchant's endorsement* (Thornwick / the village). Crowns for your name; if the product fails, a scandal months later via `queue … in N`.
- *A ghostwritten memoir offer.* Money and renown now; a later card where you see what they wrote.
- *The impostor.* Someone in the village is "you". Expose them (a public scene), use them, or laugh it off.
- *The fan circle.* A small club forms around you. It's fun until a member does something stupid in your name.
- *A Conclave delegation dinner.* Charm the visitors (a negotiation stub) for patronage. Any slip is remembered.
- *Nessa's exposé warning.* She has something, maybe a secret-tier fact from §2. Trade her a better story, confess first, or gamble that she won't print.
- *The Vaneshade gala invitation* (existing lore, "an inspection disguised as a party"). Lyra's world, open to you now.

**Legend (85+): the academy's own story**
- *Asked to address the parents on founders' day.* A perform challenge before everyone.
- *A tavern song about you* that gets the details hilariously wrong. Correct it, or let the legend grow.
- *A rival academy's poaching offer* (needs checking against canon). Refusing earns loyalty; flirting with it is a scandal risk.
- *A portrait for the Great Hall* (the existing `renown_portrait` gets a Legend sequel). Who stands beside you in it?
- *A spell flourish named after you* (soft lore). Optional.

**Scandals** (the crash branches, each offering deny, confess or spin)
- *The leaked letter.* Something private in print.
- *The cheating rumour* near exams, which reads GPA.
- *The fall at the Ball.* A public, physical, funny humiliation, with no gore.
- *The fan who got hurt* copying your spell. A moral weight: owning it is a step toward Lumen.
- *The ex tells all* (`bond == "ex"`).
- *The patron's purse was dirty.* A callback to the existing "A Patron's Purse" card.
- *Seen out after curfew where you shouldn't be* (a callback to night cards).
- *A lie comes home.* If you embellished in the Ledger profile, now it's checked (a flag from the Known card).

**Choices the scandal cards share**
- Confess: renown falls by a medium amount, alignment moves toward Lumen, and a relationship holds.
- Deny: a guile challenge against renown at stake. A win means the story dies; a loss means a crash and a hit to trust.
- Spin: through Nessa or the Ledger. It costs a favour or crowns and moves the story onto someone else, which is a step toward Hollow and costs an NPC relationship.

**Ways in to high society** (canon needs checking first; soft lore only if nothing exists)
- The Vaneshade gala.
- The patron dinners, which already exist.
- Isolde's tea (exists, at 25+).
- Possibly an invitation-only senior circle: a new soft `@lore` proper noun, about 4–6 cards with its own thread and journal lines.


### 5. Things that join the systems together

- A secret fact sold for renown leads to a scandal later and a broken bond: facts × renown × NPCs.
- Matchmaking success makes you a "known matchmaker" (renown), and the matched couple appears at your spotlight Ball.
- Famous players get more inter-NPC drama: classmates compete for your attention (a two-`any` card, gated on `famous`).
- Every new storyline (the feud, the match, the fan circle, the senior circle, the rise and fall) gets Journal lines, so §1 fills up by itself.



## Card budgets (about ¾ of the first draft)

### How big other parts of the game are (2026-10-27)

- **Whole game:** 1,533 events.
  - `pools/`: 540
  - Whisperwood: 91
  - romance: 65
  - bonds: 50
- **Cards per main NPC:** Lyra 44, Corvin 41, Kael and Tobias 35, Seraphine 31, Nessa and Mir 30, Bram 22, Maud 20, Isolde 16, Thorne 12, Ilse 9.
- **Comparable systems:**
  - `pools/renown.grim` has 8 cards.
  - `social.grim` has 29.
  - The mini-plots are 3 plots of 5 cards.
- **Facts:** 3–4 for each of 8 NPCs (Grisk, Tamsin, Amaranth, Grimsby, Mabel, Marisol, Pell, Vey), 6–9 for the rest.

### Budgets

Targets, not quotas:
- A category may come in up to 20% under when the critic rejects weak premises. Record the shortfall rather than pad.
- No single NPC takes more than about 5 of the inter-NPC and fact cards. The thinner characters (Ilse, Isolde, Thorne) come up toward the middle.
- Coverage rules (journal lines, hints) are not cut: every storyline thread gets a journal, and every personal or secret fact gets a hint.

| Area | Budget | Breakdown |
|---|---|---|
| Journal lines (not cards) | every thread and arc | 29 threads × 4–6 lines; 5 arcs × (act rumours + epilogue); `name`/`desc` on every thread |
| Journal cards | **9** | 3 "story so far" cards at the start of a year; 6 nudges about old leads |
| New `@fact`s | **~34** | the 8 thin NPCs to at least 6 facts each; the main NPCs to at least 7 |
| Fact hints (lines) | every personal and secret fact | |
| "Use what you know" cards | **30** | about 1–2 per NPC: an option or an outcome built on `knows()` |
| `knows()` branches on existing cards | **~30** | edits, not new cards |
| "Complete the picture" milestones | **9** | one per main NPC with a full fact set |
| Second-hand facts | **8** | A tells you about B |
| Inter-NPC, generic | **38** | friction and feuds 9 · cliques and study circles 8 · matchmaking 9 · jealousy (romance) 6 · gossip and rumour 6 |
| Inter-NPC, one side specific | **30** | about 2–3 each across 12 NPCs (+ faculty pairs) |
| Inter-NPC storylines | **14** | 3 threads (the feud, the match, the study circle), with journal lines |
| Renown: tier-entry milestones | **3** | Known, Famous, Legend |
| Renown: Known spotlights | **19** | |
| Renown: Famous spotlights | **19** | each with a scandal branch |
| Renown: Legend spotlights | **11** | |
| Renown: scandals | **15** | deny, confess or spin; about half are callbacks |
| Renown: the fall and the comeback | **6** | |
| Renown: high-society storyline | **8** | a thread with journal lines |
| Cross-system | **9** | a sold secret becomes a scandal; a matchmaker becomes renowned; rivals for a famous player's attention |
| **Total new cards** | **~228** | plus ~34 facts, ~30 branches, the journal lines and hints; all in zh-CN |

### Batches

Each batch goes through the full loop:
1. `retrieve status`
2. `search` before drafting
3. `related --draft` on each card
4. `grim batch`
5. a critic subagent
6. zh-CN
7. `retrieve index` at the end of the session

| # | Batch | Cards |
|---|---|---|
| P4-01 | inter-NPC friction, feuds and cliques (generic) | ~17 |
| P4-02 | matchmaking, jealousy and gossip (generic) | ~21 |
| P4-03 | inter-NPC, one side specific, part 1 | ~15 |
| P4-04 | inter-NPC, one side specific, part 2 | ~15 |
| P4-05 | the three inter-NPC storylines | ~14 |
| P4-06 | renown, Known, plus the tier-entry milestones | ~22 |
| P4-07 | renown, Famous | ~19 |
| P4-08 | renown, Legend, and the fall | ~17 |
| P4-09 | scandals | ~15 |
| P4-10 | the high-society storyline and the cross-system cards | ~17 |
| P4-11 | new facts and hints (distill-lore), plus the complete-the-picture milestones | ~9 + facts |
| P4-12 | "use what you know", part 1, plus second-hand facts | ~23 |
| P4-13 | "use what you know", part 2, plus `knows()` branches | ~15 + branches |
| P4-14 | journal lines, and the recap and nudge cards | ~9 + lines |

## Order of work

0. This tracker, and a pointer to it in `PROGRESS.md`.
1. **Engine and UI** (then `verify:full`):
   - facts in the snapshot, and the People panel fact view with new-markers;
   - the Journal tab restructure;
   - `@thread name/desc/journal/status`;
   - `@arc act_rumours/epilogue`;
   - `@fact hint:`;
   - FIELDS for i18n;
   - `seenRel`;
   - the renown tier label;
   - lint and tools;
   - `docs/grimoire-script.md` and `schema --update`;
   - UI strings in en and zh-CN.
2. **Journal content** for the 29 threads and 5 arcs. These are mechanical additions, so retrieval is skipped with a stated reason.
3. **Renown balance:**
   - tiered fading;
   - the tier `@cond`s;
   - the spotlight appointment;
   - `grim analyze` / `balance` per style (`verify:full`, golden baseline).
4. **Batches P4-01 to P4-14**, in order, with a ledger update after each. After P4-09, re-run `analyze` and `balance` per style.
5. **Records:**
   - `PROGRESS.md`;
   - design §0.3;
   - deviations (such as the Clues tab merging into the Journal).

Each step is committed on its own once `grim check` passes. Push only working states: a push of main goes live.

## Engine and UI checklist

| Item | Status | Commit |
|---|---|---|
| Facts in `snapshot()`; People panel fact groups, locked slots (one line per tier), hints, new-markers | done | |
| `@fact hint:` (+ FIELDS) | done (no hints written yet: P4-11) | |
| `@thread name/premise/journal/status` (+ FIELDS) | done | |
| `@arc act_rumours/epilogue/act_clock` (+ FIELDS) | done; Hollow Star `act_clock: 1 4 7 10` | |
| Journal tab: Main story · Stories · Leads to follow · Diary; Clues tab merged | done | |
| Journal entries stamped with the turn they first held (`s.journal`) | done | |
| `seenRel`: known likes and dislikes in the People panel (`s.relSeen`, set by `npc_rel`) | done | |
| "Friends since" in the People panel | done | |
| Renown `tiers:` label and tier-crossing toast | done (`30 Known, 60 Famous, 85 Legend`) | |
| Monthly fact unlocks announced (a summary note) | done | |
| Clique casting (opt-in, weighted) | deferred until a batch needs it | |
| Lint, format, query; `docs/grimoire-script.md`; `schema --update` | done; lint (step 2): a storyline with no `journal:` is an info, a journal line over ~160 characters or a journal without `name:` a warning, `act_rumours`/`act_clock` one per act | |
| UI strings, en + zh-CN | done | |
| Tests: `test/phase4.test.js` | done | |
| `verify:full` | passed except the browser e2e, skipped by the user's call (2026-10-27); golden games unchanged | |

## Budget ledger

Accepted waits for the critic, which is deferred until every batch is in (the user, 2026-10-28).

| Area | Budget | Written | Accepted | Cut |
|---|---|---|---|---|
| Journal cards | 9 | 9 (P4-14: 3 year recaps, 6 nudges) | — | |
| New facts | 34 | 27 (P4-11) | — | 7 |
| Use what you know | 30 | 30 (P4-12 15, P4-13 15) | — | |
| `knows()` branches | 30 | 28 (P4-13) | — | 2 |
| Complete the picture | 9 | 9 (P4-11) | — | |
| Second-hand facts | 8 | 8 (P4-12) | — | |
| Inter-NPC generic | 38 | 32 (P4-01 15, P4-02 17) | 15 | 6 |
| Inter-NPC one side specific | 30 | 27 (P4-03 15, P4-04 12) | — | 3 |
| Inter-NPC storylines | 14 | 12 (P4-05) | — | 2 |
| Renown tier entries | 3 | 2 (Famous, Legend; Known has none: P4-06) | — | 1 |
| Renown Known | 19 | 17 (P4-06) | — | 2 |
| Renown Famous | 19 | 17 (P4-07) | — | 2 |
| Renown Legend | 11 | 11 (P4-08) | — | |
| Scandals | 15 | 15 (P4-09) | — | |
| Fall and comeback | 6 | 6 (P4-08, with its entry) | — | |
| High society | 8 | 8 (P4-10, `the_season`) | — | |
| Cross-system | 9 | 8 (P4-10 6, P4-12 2) | — | 1 |
| **Cards** | **228** | **211** | **15** | |

## Batch log

| Batch | Files | Cards | Critic (rounds) | zh-CN | Golden diff | Index synced | Commit |
|---|---|---|---|---|---|---|---|
| Step 2 (journal) | 20 `@thread`s (miniplots, chains, club quests, careers, tournament, Whisperwood), 5 `@arc`s | 0 cards; 125 journal lines, 20 names and premises, 15 act rumours, 1 epilogue | retrieval skipped at the time (mechanical additions retelling existing cards); checked afterwards (2026-10-28): each of the 15 act rumours, the epilogue and the 20 premises, searched, retrieves its own arc's or thread's cards first, and none surfaces another story's | done | unchanged | not needed | |
| Step 3 (renown balance) | `content/core/rules.grim` (`fame_fades`), `content/core/conds.grim`, `tools/policies.js` + `tools/analyze.js` (`celebrity` style) | 0 cards | n/a | n/a | refreshed: renown moves, so the sims' choices drift (110/120 games; random's early exits 47% → 43%) | n/a | |
| P4-01 | `content/events/between.grim` (15 cards; `@pool between`, `between_once`), `content/core/conds.grim` (`at_odds`, `get_along`, `classmate_here`), the `npc_rel` lint accepts cast roles | 15 | rejected, then accepted (2) | done | refreshed: every game shifts with 15 new social cards; per style, random's early exits 18 → 21 of 40 (seeds diverge), social and cautious unchanged | yes | |
| Fact hints (part of P4-11) | `content/world/facts/*.grim` | 97 hints, every personal and secret fact; lint warns on a missing one | retrieval skipped at the time; checked afterwards (2026-10-28): searched as "<NPC>: <hint>", 88 of the 89 hints whose fact a card teaches retrieve that card (or the fact) in the top 6; the miss, `tobias.moonflowers`, pointed at the wrong scene and now reads "Look in the greenhouse at night." The other 8 (unlocked by a relationship, a flag or a bond) were read against their condition | done | unchanged | not needed | |
| P4-02 | `content/events/between_hearts.grim` (matchmaking, jealousy, gossip), `@cond fancy_free` | 17 | deferred | done | refreshed once for P4-02..14 (see below) | at the end | |
| P4-03 | `content/events/between_known.grim` (one side specific, part 1) | 15 | deferred | done | 〃 | 〃 | |
| P4-04 | `content/events/between_known_2.grim` (one side specific, part 2) | 12 | deferred | done | 〃 | 〃 | |
| P4-05 | `content/events/between_stories.grim` (3 threads: the feud, the match, the Thursday Circle) | 12 | deferred | done | 〃 | 〃 | |
| P4-06 | `content/events/spotlight.grim` (`@pool spotlight` and its tiers, `@appointment spotlight` / `fallen`, 2 tier entries, 17 Known) | 19 | deferred | done | 〃 | 〃 | |
| P4-07 | `content/events/spotlight_famous.grim` (Famous; scandal branches by renown) | 17 | deferred | done | 〃 | 〃 | |
| P4-08 | `content/events/spotlight_legend.grim` (11 Legend, the fall and 5 after it), `@cond fallen_star` | 17 | deferred | done | 〃 | 〃 | |
| P4-09 | `content/events/scandals.grim` (own / deny / spin menus; 7 callbacks, 8 generic; 2 appointments) | 15 | deferred | done | 〃 | 〃 | |
| P4-10 | `content/events/society.grim` (the thread `the_season`, 8; `fame_between`, 6), soft `@lore the_season` | 14 | deferred | done | 〃 | 〃 | |
| P4-11 | 27 `@fact`s in 15 `content/world/facts/*.grim`; `content/events/full_picture.grim` (9) | 9 + 27 facts | deferred | done | 〃 | 〃 | |
| P4-12 | `content/events/knowing.grim` (15 use what you know, 8 second-hand, a sold secret and its scandal) | 25 | deferred | done | 〃 | 〃 | |
| P4-13 | `content/events/knowing_2.grim` (15); 28 `if knows(…)` branches appended to options in 15 existing files | 15 + 28 branches | deferred | done | 〃 | 〃 | |
| P4-14 | `content/events/journal_cards.grim` (3 year recaps, 6 nudges about side leads) | 9 | deferred | done | 〃 | 〃 | |

Golden diff for P4-02..14 together (120 of 120 games change, refreshed): random's early exits 20 → 13 of 40
(quiet departure 9 → 6, sent home 11 → 7); still searching: social 9 → 14, cautious 18 → 13, random 8 → 9; the
rest of the endings spread out. Measured flows per card are in each batch's notes; the full balance pass waits for
the end (the user, 2026-10-28).

## Deviations and open questions

- **Renown fading by tier** (step 3): a fifth a month below 30, 15% while Known, 12% from Famous (the plan's 10% let a renown-chaser drift to Legend unaided). Measured with `grim analyze` over 12 games: `celebrity` (renown weighs 3) has a median of about 45 at the end of Y2 and 71 at the end of Y3 (p90 83 at the end); `balanced` about 20–30; nobody reaches Legend without spotlights. Tier conditions are `renown_known`, `renown_famous` and `renown_legend` (`known` is a built-in function's name).
- **The spotlight appointment** waits for P4-06: it needs the tier-entry cards to deal.
- **The reranker** (2026-10-28): `voyageai/rerank-3-lite` ran out of its per-minute quota and `qwen/qwen3-reranker-8b` was overloaded, so retrieval stalled. Probed five rerankers on three queries with known answers; `voyageai/rerank-2.5` is now the default, with an announced fallback chain (`rag/src/models.json`, retry and switch in `rag/src/cli.js`). New reranker aliases are registered without rebuilding the index (`rag/src/rebind.js`).

- **`premise:` on `@thread`** (2026-10-27): the plan had a thread's `desc:` as its player-facing premise, but every existing `desc:` is an author's note. `desc:` stays for authors; `premise:` is the line players read.
- **Traits and interests aren't shown** in the People panel: they are `@vocab` ids, not translated text.
- **Leads:** the Journal lists an open lead once, under "Leads to follow", for the arcs and for stories with a journal. A side thread with no journal still shows its own leads, as the Clues panel did.
- **Locked facts** are one line per tier ("· still to learn: 6 ·"); a fact with a `hint:` shows the hint in its place.
- **The Hollow Star's act threads** (`hs_omens` … `hs_night`) get no journal: the arc's own block (act, rumour, clues) is the main story's entry. `company_night` (a pool of night guests) isn't a storyline.
- **No head of house** (P4-03..05): the worldbook has houses, but "Faculty belong to none" (`@lore houses`), so cards that called for one say "the headmistress".
- **The inter-NPC storylines use canon pairs** (P4-05): a queued step carries one cast role (`queue … with`), so a generic pair can't be followed through a thread. The feud and the match use pairs whose feelings the cast already sets; the Thursday Circle casts whoever joins at each step.
- **Lint gap: `queue X in N..M`** parses as an expression with no error (the delay meant is `within N..M`). Found in P4-05; a lint rule is a later tooling fix.
- **Legend for the renown-chaser** (P4-07/08): `celebrity` reaches Legend in 75% of runs with the spotlights, and 65% without them (average final renown 86 on HEAD), against the plan's "Legend only with luck". Left for the balance pass.
- **Rare by design or by casting:** `sell_a_secret` (Known, a known secret and a friend at once) shows in 0–2 of 60 games; Ilse's cards are rare in every style (her own `ilse_frost_lessons` 5–11 of 60), so `know_ilse_frost` is too.
- **The index sync** ended with ENOTEMPTY while removing the old revision (2026-10-28): retrieval queries run during the sync log into the active revision's folder. The new revision was already in place (`retrieve status` ready, no changes); `retrieve prune` removed the old one. Don't query while a sync is finishing; an automatic `--resume` after a transport error in `rag/src/cli.js` waits for the other agent's edits there.

## Next up

Every batch is written (P4-01..14, 211 cards). Next, with the user's go-ahead: the critic over P4-02..14
(`skills/critic/SKILL.md`; one round per batch, fixes in place), then the full balance pass (`grim analyze` and
`balance` per play style, the renown-chaser's Legend rate first), then `verify:full`, and the records
(`PROGRESS.md`, design §0.3).
