# PRELIMINARY — compact event-language reference

> REVIEW ONLY. Not approved, not active, and must not be used to write or revise game content. This is a candidate reading view for another coding agent to inspect. Every instruction below is proposed reference text, not a change to the current writing workflow.

Prepared 2026-10-15. See [separation proposal](grimoire-reference-separation.preliminary.md) for scope, unresolved discrepancies and adoption criteria.

Complete source: `docs/grimoire-script.md`, 672 lines at review time.
Source SHA-256: `7687b3aeca379c436b440b910625bd64e4e48043a9318df0715e5289633febbe`.

## 0. Proposed loading and retrieval

Read this sheet with the required authoring guidelines. It covers ordinary event language, not writing quality, canon, translation or validation.

Pointers are repository-relative, inclusive, one-based line ranges. Read the named passage before using a feature marked **Retrieve**. From the repository root:

```bash
sed -n '430,460p' docs/grimoire-script.md
```

If the fingerprint changed or the named text is absent, relocate it with `rg -n '^##|^###|^\*\*' docs/grimoire-script.md`. Read its current span. Resolve discrepancies against design and implementation; do not guess omitted syntax or defaults.

## 1. File and event shape

Source: `docs/grimoire-script.md:11-103` — “1. File structure” and “`@event` — a card or menu the player resolves”. The original challenge example in this range uses legacy difficulty words; use the current grammar in §5 below.

Blocks start at column zero with `@event <id>`. IDs are unique per block kind; ordinary event IDs use `lower_snake_case`. Properties are `key: value` at column zero. Options are `> key: Label` at column zero, with effects indented beneath them. Two spaces per nesting level is the convention. Whole-line `#` or `//` comments are allowed; end-of-line comments are not. Indented continuation lines extend a text property. File order is independent except that `content/core/` loads first.

**Schematic parser example, not reusable content:** angle brackets mark prose placeholders; obtain real IDs through the existing retrieval workflow.

```grim
@event proposal_syntax_example
title: <short title>
class: routine
tone: light
text: <situation ending at a choice>
> left: <first action>
  mood +small
  say: <specific outcome>
> right: <second action>
  challenge research apprentice:
    win:
      lore +small
      say: <success outcome>
    lose:
      mood -tiny
      say: <failure outcome>
```

This illustrates layout, not an accepted card. Authoring also requires appropriate `art:`, `tags:`, `scene:`, routing and pool variation under the existing guidelines.

Two options keyed `left` and `right` infer a swipe card. One option infers a story card; no options adds a continue option. Other option shapes infer a menu; `type: menu` requests one explicitly. The block's `class: story` is a budget category, distinct from `type: story` and the number of options.

## 2. Event eligibility, placement and options

Sources: `docs/grimoire-script.md:70-103` — event properties and option rules; `docs/grimoire-script.md:513-540` — “A day”, “People come by two tracks”, “Identifiers”, “Event fields”.

| Field | Meaning |
|---|---|
| `title:`, `text:` | Card title/body; tokens allowed |
| `class:` | `routine milestone incident windfall story crisis`; budgets are in the existing class guidelines |
| `tone:` | `light warm tense grim eerie`; vocabulary is defined in content |
| `art:`, `tags:`, `scene:` | Icon, tags and illustration description; retrieve §8 for art keys |
| `when: <expr>` | Eligibility; rechecked before drawing/showing |
| `weight: <expr>` | Relative eligible draw weight, default 10; not a guarantee |
| `repeat: <months>` | Cooldown; without it, once per run, or once per bound character with `per:` |
| `trigger:` | `random` default; also `social auto queued letter` |
| `place: <id>` | Pool for visits to that place |
| `track: <id>` with `level:` / `rank:` | Course-level or club/job-rank card |
| `plan: <id>` | Break-plan morning pool |
| `slot: <slot>` | Restricts drawn cards to that slot; also places pushed cards |
| `time: <slots>` | Favors those slots rather than forbidding all others |
| `actor: <npc_id>` | Fixed character; use cast roles for generic characters |
| `cast:` and `per: <role>` | Casting and per-character repeat bookkeeping; see §6 |
| `on_show:` | Effects applied when shown, before a choice; use cautiously |

Current days draw slot by slot from courses, social cards, visits, world cards and break plans. Without place/track/plan, ordinary random cards belong to the world pool. Pushed cards normally enter their named slot or the day's first slot. **Retrieve** “A day” for interactions, spread, caps or priority. The old §5 deck is compatibility behavior.

`social` uses a met actor or a cast role with `per:`; `auto` is pushed when its gate holds, so give it a tight gate and suitable repeat behavior; `queued` requires an incoming queue. **Retrieve** letter/off-campus behavior before using `letter`. A fixed-actor card without place/track/plan/slot also enters that character's personal pool; gate and place it deliberately.

Within an option, `when:` false **disables** a swipe choice but normally **hides** a menu option. A menu option with `locked:` stays visible, disabled, with that reason. `hint:` supplies explanatory subtext. A menu needs an option without `when:`; never lock both swipe choices.

With `@game afford: gold`, top-level spending can disable an option independently of its authored gate. Conditional spending and all-options-locked cases have special rules. **Retrieve** `docs/grimoire-script.md:564-564` — “Affordability”. Do not replace an option's price with `on_show` spending.

## 3. Expressions and common functions

Sources: `docs/grimoire-script.md:237-276` — “3. Expressions”; `docs/grimoire-script.md:524-524` — current identifiers; `docs/grimoire-script.md:554-554` and `docs/grimoire-script.md:568-572` — track/place/arc functions.

Operators: `+ - * / %`, `== != < > <= >=`, `and or not` (also `&& || !`), parentheses. Compare with `==`, not `=`. Strings use single or double quotes. `true`/`false` work as booleans and as 1/0 in arithmetic.

Resource/skill IDs read their current values. Identifiers include `turn month year term break season final_year wrapup off_campus term_index gpa slot turns_left max_turns cards_this_month`. Retrieve calendar configuration for exact boundaries. `npc` is the bound actor; cast roles name their bound characters. `runs_completed` is flavor-only. Custom variables default to zero; retrieve assignment behavior.

Function identifier arguments are bare IDs: `has(sick)`, `rel(friend)`, `enrolled(evocation)`. Quoted values are used for comparisons such as `bond(friend) == "friend"` or `season == "winter"`. These examples show expression syntax, not facts about a scene.

| Function group | Meaning |
|---|---|
| `has(id)`, `flag(id)`, `left(state)` | Active state or flag; flag only; months left on a state |
| `met(who)`, `rel(who)`, `spark(who)`, `bond(who)` | Relationship fields |
| `tagged(who, tag)`, `romanceable(who)`, `around(who)` | Casting predicates, romance eligibility, in-person availability |
| `seen(event)`, `since(event)`, `chosen(event, key)` | Show count, months since showing, last option chosen |
| `apart(who)`, `bonds(status)`, `bonds_around(status)` | Contact gap; bonds overall or only with reachable characters |
| `enrolled(t)`, `member(t)`, `applied(t)`, `passed(t, n)` | Course/track status |
| `level(t)`, `rank(t)`, `performance(t)`, `progress(t)`, `due(t)`, `visits(t)` | Track values |
| `discovered(place)`, `visits_to(place)` | Place discovered; lifetime map visits |
| `clock(arc)`, `clues(arc)`, `clue(id)`, `act(arc)` | Arc schedule, engagement, individual clue/lead, current act |

**Retrieve** other functions, sentinel values, generic track-kind arguments or assignments. `grim query` has a different row environment.

## 4. Common effects and branching

Sources: `docs/grimoire-script.md:280-302` — “4. Effects”; `docs/grimoire-script.md:414-416` — “Size tiers” / “Presets”; `docs/grimoire-script.md:554-559` — “Tracks”.

One effect per line; blocks end with `:` and nest by indentation. Event amounts use `tiny small medium large huge`, defined in `content/core/balance.grim` and generated presets. No raw event deltas or skill costs; follow the costs guide.

| Form | Effect |
|---|---|
| `<resource> +small` / `-tiny`; `<skill> +small` | Adjust resources; skills gain XP |
| `grind <skill>`, `rest`, `social <who>`, `work`, `splurge`, `risk <resource>` | Existing presets expand at compile time; read their actual expansions before choosing one |
| `say: <text>` | Outcome text; multiple lines concatenate in source order |
| `flag <id> [<id> ...]`, `unflag <id>` | Set/clear persistent flags |
| `gain <state> [<months>]`, `lose <state>` | Add/remove a defined state; retrieve lifecycle before introducing one |
| `rel <who> +small`, `spark <who> +tiny` | Friendship/romantic interest; each implies meeting |
| `bond <who> <status>`, `meet <who>` | Set bond / meet; bond vocabulary: `none friend close rival nemesis partner ex` |
| `study <course> +small` | Exam preparation; without the course, all enrolled courses |
| `perform <track> +small`, `rank_xp <track> +small` | Club/job performance and rank progress |
| `progress thesis +small` | Thesis progress |
| `wage` | One shift's pay in the job's own events; retrieve shift/pay rules before adding other pay |
| `queue ...` | Follow-up; see §7 |

Branch grammar:

```text
if <expression>:
  <effects>
elif <expression>:
  <effects>
else:
  <effects>

chance <odds_word> [+N if <condition>]...:
  <effects>
else:
  <effects>
```

`elif` and `else` are optional. Chance also accepts negative circumstance steps. Use chance only when skill cannot help; when skill should matter, use a challenge. Avoid `rand()` in option effects: the preview/lint rules require an explicit chance or supported form. **Retrieve** before assignments, track membership changes, special wage words, exams, regrading, spell learning, facts/memories, or `end <ending_id>`.

## 5. Current challenge syntax

Source: `docs/grimoire-script.md:418-460` — “Challenges”, “Exams”, “Combat”, “Spells”, “Previews”. Pitch checks using the existing `docs/authoring/checks.md`; this section supplies syntax, not a replacement difficulty policy.

```text
challenge <kind> [using <skill_or_resource>] <difficulty> [<odds>] [<luck>] [drift <word>] [±N if <condition>]...:
  win:
    <effects>
  partial:
    <effects>
  lose:
    <effects>
```

`win:` and `lose:` are required; `partial:` is optional syntactically. `±N` means an actual signed integer such as `+1` or `-1`, not a literal `±` character. Preserve the displayed order of the optional clauses.

| Part | Current forms |
|---|---|
| Kind | `combat duel negotiate deceive exam research brew enchant feat spell` |
| Difficulty | Ranks `novice apprentice journeyman adept expert master grandmaster archmage`, each optionally suffixed `-` or `+`; `standard` / `standard+1` / `standard-2` for courses; or `vs <who>.<stat> [±N]` |
| Odds by nature | `certain sure likely even unlikely slim long_shot freak`; default `even` |
| Luck | `steady normal wild luck`; default `normal` |
| Drift | `none low mid high`; ordinary class defaults: story none, milestone/crisis low, otherwise high |
| Circumstance steps | `+N if <condition>` or `-N if <condition>`; move odds by nature |

Default skills: negotiate → charm; deceive → guile; research/exam → lore; brew/enchant → alchemy; feat → vigor; spell → arcana; duel combines vigor and arcana. Combat is special: **Retrieve** its definition before using it. Write `using` only when selecting a different appropriate skill/resource. On `vs`, use the matching opposing stat from the worldbook, not an invented stat.

Write course cards for their own `level:`; the engine raises a lower-level card's difficulty when it appears at a higher course level. The course's standard can override the common standard; retrieve the track definition through the normal workflow. Do not add this scaling twice.

Preserve the separate four dials: obstacle → difficulty; usual/rare outcome → odds; skill versus luck → luck; growth across the run → drift. A wager uses `luck`; pure luck uses `chance`. The existing check guidelines require a middle outcome and a route without the check for grandmaster+ challenges, limited to story/milestone cards; a run-ending loss needs `partial:` or sufficiently favorable odds as specified there. **Retrieve** before repeatable story/milestone drift decisions, partial-band assumptions, exact odds, combat costs, or special exam behavior.

## 6. Casting, pronouns and text variation

Sources: `docs/grimoire-script.md:154-173` — casting by premise / relationship fields; `docs/grimoire-script.md:306-317` — text tokens; `docs/grimoire-script.md:458-458` — “Inline text variation”; `docs/grimoire-script.md:542-552` — “Cast roles”.

Schematic role syntax (angle brackets are placeholders, not literal IDs):

```text
cast:
  friend: any where tagged(friend, peer) and rel(friend) >= 10
  stranger: anyone
  here: present(place)
  keeper: <npc_id>
per: friend
```

`any` selects a met character satisfying the premise; `anyone` permits unmet characters. A `present(place)` role draws someone scheduled there. A fixed role binds its named character. If required roles cannot be filled, the event is skipped. Cast by premise: peers for social scenes, students/prefects for classmates, teachers for instruction, and `romanceable(role)` for romance. Roles are refilled on each showing; a repeat must not assume the same companion returns.

Use `{friend}` and `{friend.their}` in text, `rel friend +small` in effects. Plain `{they}` / `{them}` refer to the first cast role. `per: friend` makes once/repeat bookkeeping per person in that role, with a global rest for the event; **Retrieve** exact cooldown interactions before depending on them. Fixed `actor:` and inherited `actor: npc` are distinct from role casting.

Tokens work in titles, body, scene, labels, hints and outcomes: `{player}`, `{month}`, `{year}`; `{npc}` and `{npc.fullname}` / `.title` / `.house`; pronouns `{they} {them} {their} {theirs}` and capitalized forms; `{are}` / `{s}` for agreement; named-character `{<id>}` / `{<id>.their}`; `{=expression}`. `{npc}` prints the short name or first word, not necessarily the full name. Avoid contractions such as `{they}'s` that break for some pronouns.

| Form | Behavior |
|---|---|
| `{~a\|b\|c}` | Random alternative on a showing |
| `{&a\|b\|c}` | Cycles with showings |
| `{a\|b\|c}` | Sequence by showing count; final alternative sticks |
| `{condition: a\|b}` | Conditional text; nesting allowed |

Backslashes escape Markdown table pipes; actual `.grim` uses plain `|`. Sequences count **showings, not choices**. Independent random picks must stay mutually compatible. Gate lasting choice payoffs on state. The required `docs/authoring/pools.md` explains repeat safety.

**Retrieve** before `cast_as(...)`, `say[<npc_id>]:` overrides, precise casting selection behavior, milestone `ramp:`, relationship decay/spark-follow mechanics, letters or away-character scenes.

## 7. Queues, flags and plot boundaries

Sources: `docs/grimoire-script.md:290-300` — queue/effect forms; `docs/grimoire-script.md:375-404` — “6. Patterns”; `docs/grimoire-script.md:83-83` — `defer`; `docs/grimoire-script.md:570-583` — arcs/leads/push windows.

`queue <event_id>` schedules next month; `in N` delays N months; `in 0` is later this month; `now` inserts the very next card. `with <role_or_npc>` carries the character to a target using `actor: npc`. Queueing alone does not invent a cast role in the target. `chance <odds_word>` queues at odds; **Retrieve** the full queue row for resolution timing and duplicate handling before using it.

Use `trigger: queued` on a card reached only this way. Every queued card needs a source, and each tested flag needs a setter. For a branch, `flag <id>` followed later by `when: flag(<id>)` or `if flag(<id>):` is the ordinary pattern. Check existing IDs and the chain graph.

An eventual failed `when` drops a pushed card; `defer: <expr>` postpones it another month while true. **Retrieve** before using deferral or scheduling windows (`within`, `by month`, `unqueue`).

Plot progress reads `clock(arc)` for schedule and `clues(arc)` for engagement. `clue(id)` tests an individual clue or lead; leads do not count toward `clues(arc)`. Only hard-canon story events may grant key clues with `find` or move arc clocks with `advance`. Ordinary cards must not confirm main-mystery secrets. **Retrieve** arc/clue definitions and canon before any such effects. Alignment expresses moral direction, not plot progress.

## 8. Mandatory retrieval map for specialized work

All spans refer to the fingerprinted `docs/grimoire-script.md`. These passages are deliberately outside the compact coverage; read them before using or changing the named feature. Exact headings/labels allow relocation after edits.

| Task / feature | Complete-reference source | Heading or distinctive label |
|---|---|---|
| New state, duration or lifecycle | `docs/grimoire-script.md:105-134` | `@state` — something persistent on the player |
| NPC definitions, schedules, availability | `docs/grimoire-script.md:136-173`; `docs/grimoire-script.md:464-480` | `@npc`; “The worldbook” |
| Resource/skill definitions or hooks | `docs/grimoire-script.md:175-206`; `docs/grimoire-script.md:456-456`; `docs/grimoire-script.md:566-566` | `@resource` and `@skill`; `@hook`; “Resources”; “Hooks” |
| Endings, priority and yearbook slots | `docs/grimoire-script.md:208-225` | `@ending` |
| Game settings or schema compatibility | `docs/grimoire-script.md:227-233`; `docs/grimoire-script.md:484-513` | `@game`; “The world loop” |
| Rare expressions, assignments, sentinel values | `docs/grimoire-script.md:237-288` | “3. Expressions”; start of “4. Effects” |
| Translation, hashes, stale keys, inbox merging | `docs/grimoire-script.md:346-371` | “5b. Translations (`.lang` files)” |
| Exact check odds, defaults, partial or combat | `docs/grimoire-script.md:418-444`; `docs/grimoire-script.md:460-460` | “Challenges” through “Combat”; “Previews” |
| Spell learning or `up[spell]` option | `docs/grimoire-script.md:446-446` | “Spells” |
| Memories, facts, inter-NPC relations | `docs/grimoire-script.md:448-452` | “Option properties”; “Facts and relations”; “Relationships” |
| Other worldbook blocks / controlled vocabularies | `docs/grimoire-script.md:464-480` | “6b. The worldbook”; retrieve generated `docs/authoring/schema.md` too |
| Festivals, shifts, midnight/opened slot, spread | `docs/grimoire-script.md:501-513`; `docs/grimoire-script.md:526-540` | “Festival places wait”; “Fixed shifts”; “Opening a slot”; “A day”; “Event fields” |
| Character pool, milestone ramp, warmth, off-campus letters | `docs/grimoire-script.md:515-524`; `docs/grimoire-script.md:335-342` | “People come by two tracks”; “Triggers in short” (do not adopt the old deck algorithm above it) |
| Cast overrides, `per:` details, `cast_as` | `docs/grimoire-script.md:542-552`; `docs/grimoire-script.md:458-458` | “Cast roles”; “Inline text variation” |
| Generated menus, `offers:` / `pick:` | `docs/grimoire-script.md:537-540`; `docs/grimoire-script.md:554-559` | “Event fields”; “Tracks” |
| Track changes, exams, wages, societies, internships, appeals | `docs/grimoire-script.md:554-562` | “Tracks” through “Appeals” |
| Automatic price locks and up-front affordability | `docs/grimoire-script.md:564-564` | “Affordability” |
| Places, discovering, map selection | `docs/grimoire-script.md:536-536`; `docs/grimoire-script.md:568-568` | “Which map”; “Places” |
| Arc clocks, clues and leads | `docs/grimoire-script.md:570-581` | “Arcs”; “Clues and leads” |
| Scheduling windows and cancellation | `docs/grimoire-script.md:583-583` | “Push windows” |
| Validation or structural tools | `docs/grimoire-script.md:585-662` | “7. Errors the toolchain catches”; “7b. Canonical form and structural search” |
| Art keys, visual tags, bond vocabulary | `docs/grimoire-script.md:666-672` | “8. Reference lists” |

Syntax intentionally excluded from new event examples: legacy `check`, `love`, `actor: any`, raw event amounts, `grades`, old challenge tiers `trivial easy medium hard heroic`, and numeric chances. **Retrieve** compatibility details only to understand/migrate existing material; do not turn them into recommended new forms. Compatibility deck behavior is at `docs/grimoire-script.md:321-342`; legacy challenge arithmetic is at `docs/grimoire-script.md:440-440`.

> END OF PRELIMINARY DRAFT. Review and reconcile it before adoption. It is not approved for writing.
