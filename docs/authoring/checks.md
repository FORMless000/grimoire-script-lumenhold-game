# Checks: how hard, how likely, how lucky

> How a `challenge` or `chance` is pitched (design §8.6). Rung values and odds are in `presets.md`, generated from `balance.grim`: write words, never numbers.
> The old tier words (`trivial` … `heroic`) and `chance N` are legacy: they still play, with the old formula, until the existing checks are rewritten. Write every new or revised check with the words below.

## The four dials

A check's odds come from the story, not the calendar. Each fact about the scene goes into exactly one dial.

| Dial | Asks | Words |
|---|---|---|
| **Difficulty** | Who or what are you actually up against, the opponent or the obstacle, and what rank would find it a fair contest? | a rung, `novice-` … `archmage+`; `standard` for a class exercise; or `vs <who>.<stat>` |
| **Odds by nature** | How often does this kind of attempt come off, however good you are? | `certain` · `sure` · `likely` · `even` (the default) · `unlikely` · `slim` · `long_shot` · `freak` |
| **Luck** (swing) | Would someone better at this clearly do better? | `steady` (practice decides) · `normal` (the default) · `wild` (partly luck) · `luck` (mostly luck) |
| **Drift** | Should it keep up as the player grows? | `high` · `mid` · `low` · `none`. Usually leave the default (below). |

The line reads `challenge <kind> [using <skill>] <difficulty> [<odds>] [<luck>] [drift <word>] [+1 if <cond>]…:`. `challenge negotiate master- unlikely wild:` means a master resists, it rarely works, and it's half luck.

Circumstance steps, `+1 if <cond>` or `-1 if <cond>` at the end of the line, move the odds by nature. They are for facts of the world, such as preparation, reputation, affection or weather, never for skill.

**The master test.** "Only a master manages it" is difficulty. "Even a master usually fails" is odds by nature.

## Difficulty: what you're actually up against

| You're up against | Rungs |
|---|---|
| **Mundane**: chores, crowds, weather, small favours, an ordinary stranger | novice, apprentice |
| **Peers and coursework**: classmates, rivals, club and job work at your level | apprentice+ … adept- |
| **Skilled**: upper-year champions, tradesfolk at their trade, wards, creatures | adept, expert |
| **Masters**: faculty, master crafters, the institution | master, grandmaster |
| **Legendary**: the mystery's powers, ancient things | grandmaster+, archmage |

- **Who's on the card isn't the obstacle.** Helping a professor cure a blight is a contest with the blight.
- **A class exercise is pitched at the class**, at the course's standard for the card's level: write `standard`, or `standard+1` / `standard-2` for an easier or harder task (the standards are in `grim brief --track <course>`). Use the professor's rank only when you're up against the professor.
- **The engine adds rungs** when a lower-level card shows in a higher level. Write the card for its own level. Cards with no level are fixed obstacles.
- **Adjust for the scene, up to 3 rungs.** Prepared, helped or a small ask is easier. Rushed, alone or a big ask is harder.
- **Against a named character, use `vs <who>.<stat>`.** Their worldbook stat is the bar; `+N` / `-N` after it moves the bar by rungs (`vs <who>.guile +2`).

**Kind and skill.** The kind is the shape of the action: talk round, mislead, work out, brew, a physical feat, cast, fight. `exam` is only for course tests. The skill is what you use against the obstacle (see the skill `desc:` lines in `rules.grim`).
- Write `using` only when the skill differs from the kind's default.
- Test a resource only when it is the advantage, such as `using renown` when popularity is what helps.
- A `vs` check reads the stat that matches the skill being tested.

**Which kind.** `docs/grimoire-script.md` lists every kind and its default skill.

| The action | Kind |
|---|---|
| A real negotiation: someone across a table with reasons of their own, and something at stake | `negotiate`, bound to the negotiation minigame. Each needs an entry in `src/negotiation.js` `PARLEYS`; the button promises a negotiation. |
| A quick ask, small talk, a favour | `appeal` |
| A show, a song, a story told to a room | `perform` |
| Calming a creature (add `using vigor` when it's physical) | `soothe` |
| Misleading someone | `deceive` |
| A fight | `combat` or `duel`, always played in the combat minigame. The foe, its kit and the setting come from `EVENTS` in `combat/setup/foes.mjs`. |

A minigame kind sits on an option, at most one on any path through a card. A trivial ask written as `negotiate` is a defect.

## Odds by nature and luck

- **Most attempts are `even`.** Change it only when the nature of the attempt makes success usual or rare, whoever tries.
- **A wager:** the stakes set the odds by nature. Pick one word below fair, so the bigger the win, the slimmer the chance.
- **Pure luck, where skill can't help, is `chance <word>:`.** If a skill or a relationship should plausibly matter, it isn't a bare `chance`.
- **Don't use `steady` on low-rung repeat cards.** It makes them near-certain late in the run.

## Drift: more significant, less drift

| Card | Drift |
|---|---|
| routine, incident, windfall, or any card that repeats | `high` (the default): it keeps up with the player |
| a repeat card whose prose makes it a test the player measures themselves by, such as sparring the club's senior or a monthly showcase | `mid` (or `low`): a mini-milestone the player should visibly outgrow |
| milestone, crisis | `low` (the default) |
| story: plot-relevant | `none` (the default): the challenge is what the story says it is |

Write `drift <word>` when a card is more significant than its class suggests (lower it) or plainer (raise it).

## Examples

One word per dial explains the choice.

| The scene | Difficulty | Odds by nature | Luck | Drift |
|---|---|---|---|---|
| Sneak a cooling pastry off a shop's windowsill | `apprentice`: shopkeeper | `even`: ordinary | `normal`: skill | `high`: routine |
| Summon your lost wand before class starts | `novice+`: clutter | `likely`: nearby | `normal`: skill | `high`: routine |
| Help an old groundskeeper move the beehives | `apprentice`: bees | `even`: ordinary | `wild`: swarm | `high`: routine |
| Help a friend animate a field scarecrow | `novice+`: charm | `certain`: simple, failing only by a freak | `normal`: skill | `high`: routine |
| Dare the icy lake with the other students (repeats) | `apprentice`: cold | `likely`: brief | `normal`: stamina | `high`: repeat |
| Judge a first-level brew by its colour instead of counting | `standard`: exercise | `even`: ordinary | `wild`: knack | `high`: repeat |
| Hang a whole false room in the advanced illusion class | `standard+1`: ambitious | `even`: ordinary | `steady`: craft | `high`: repeat |
| Fly a clean, steady line at the flying team's tryouts | `apprentice+`: course | `sure`: careful | `steady`: practice | `low`: tryout |
| As club captain, meet a visiting champion's challenge (recurs) | `expert`: champion | `even`: fair | `normal`: skill | `mid`: mini-milestone |
| The final-lap dive against a rival school's captain | `expert`: captain | `slim`: suicidal | `wild`: speed | `low`: championship |
| Hold a flame of dragonfire a professor offers the class | `master-`: flame | `even`: fair | `wild`: temper | `high`: routine |
| Play the high-stakes card game upstairs at the tavern | `adept-`: gamblers | `unlikely`: house | `luck`: cards | `high`: repeat |
| Enter the school-wide essay prize | `journeyman+`: rivals | `slim`: one-prize | `normal`: skill | `high`: routine |
| Get a friend an interview the headmistress hasn't given in twenty years | `master`: headmistress | `long_shot`: precedent, `+1 if rel(<who>) >= 30` | `normal`: skill | `high`: routine |
| Answer an untrue rumour in public | `journeyman`: gossip | `unlikely`: denial | `wild`: crowd | `high`: incident |
| Command the lake when the professor said to ask (an early story lesson) | `apprentice+`: lake | `unlikely`: rudeness | `normal`: skill | `none`: story |
| Try to catch a falling star from the rooftop on the night of the meteor shower | `apprentice`: reach | `freak`: legend | `luck`: falling | `none`: story |
| Persuade your partner to defy their family | `vs <who>.charm`: partner | `likely`: wanted, `+1 if spark(<who>) >= 50` | `normal`: skill | `high`: routine |
| Defend your thesis before examiners who want you to pass | `expert+`: examiners | `even`: fair | `normal`: skill | `low`: milestone |
| Plead before the disciplinary board, where losing ends the run | `expert+`: board | `even`: fair, with `partial:` | `normal`: skill | `low`: crisis |
| Seal the main mystery's power in the finale | `grandmaster+`: entity | `unlikely`: sealing, `+1` per preparation band | `normal`: skill | `none`: plot |
| Will your chosen partner accept an invitation to the ball? | (no check) | `chance likely`: invitation, `+1 if spark(<who>) >= 30` | — | — |

## Checks before you finish a check

1. Is the difficulty what you're actually up against, and not the cast or the calendar?
2. Is any reason counted twice? A strong foe is not `slim`, and a coin toss is not a high rung.
3. Is a gamble on `normal` or `steady`? Then skill pays like a salary: use `luck`.
4. Grandmaster+ and up: is it on a story or milestone card, with `partial:` and a route without the check?
5. Does losing end the run? Then add `partial:`, or use `likely` or better.
6. Run `grim odds <id>`. Do a passive and a focused player's odds over the run fit the scene?
