# Arguments 9 · design review and proposal

Status: proposal, not implemented. Reviews Arguments 8 (gentler-gap-8, the current default) from its 6,912 replayed simulation tapes (`results/gentler-gap8-main-01/`) and two hand-played meetings (2026-10-27). There are no human playtest logs for this minigame: the testplay server records nothing and the main game's feedback has no negotiation notes.

Goals set by the user: more fun; acquiring and using spells as the main source of advantage; less mentally taxing.

## What the evidence says

**1. Most spells pay off the tax that casting creates.** Nearly every cast adds 1 Suspicion, and the limit is 6. Finite-Mana policies add about 4 Suspicion per game by casting alone, and 93% of their losses are "Suspicion reached its limit". So most casts go to clearing Suspicion:

| Level | Clear Suspicion (Candour, Omen, Extraction…) | Restore Resolve | Improve the argument (Glamour, Quickquill, Sleight, Animate…) |
| --- | --- | --- | --- |
| 20 | 39% | 24% | 32% |
| 50 | 68% | 14% | 17% |
| 80 | 64% | 13% | 18% |

Candour and Omen together are 52% of all casts. In play, the engine told me to cast Candour, a spell that *lowers* Guile, on a Guile check, purely to clear Suspicion. The best spell play is housekeeping, not cleverness.

**2. Spells add little.** All-out (spells allowed) against Dumb (no spells, same planner): 83 vs 69% at level 20, **70 vs 66% at level 50**, 74 vs 50% at level 80. At mid-game, 24 spells and about 6 casts per meeting buy 4 points of win rate. Learning a new spell rarely changes how a meeting goes.

**3. Too many numbers in each decision.** One turn shows: the check %, three rejection costs, up to three acceptance effects (with the 1-Resolve effort mixed in), the Deflect price and its rising risk, five meters (Agreement, Patience, Suspicion, Resolve, Mana), fatigue applied without being shown, a Mood bill, and 12–34 spell tiles, each with an E score. A meeting is about 9 rounds and 15 decisions. My level-50 meeting took 11 turns and 18 decisions.

**4. Swingy, with death spirals.** Most confronted checks fall between 50 and 80%. Rejection costs vary per card, up to +4 Suspicion and −2 Patience. In my level-50 meeting I missed at 86.6%, 67.8% and 88.4%, and was at Suspicion 5/6 with zero Agreement by turn 3. From then on, every spell except Candour would have ended the meeting outright. One bad roll decides the game, and good spell play can't recover it.

**5. The late roster is wide but flat.** Four spells were never cast (Foresight, Ward, Hoarfrost, Siphon), and many are near-duplicates: Index/Quickquill, Tailwind/Hoarfrost, Mend/Heartprice/Extraction. Foresight shows the next card, but with one response per turn you can't act on it.

**6. UI hazards found in play**
- Flame is the first tile in the tray. One misclick on Cast loses the meeting; I selected it by accident once.
- Spells that would end the meeting on the spot (Suspicion 5/6) aren't disabled or marked.
- Sleight cost 3 Alignment, and its description doesn't say so.
- Resolve shows fractions (12.1 / 31).
- E scores are noisy. Candour scored close to Confront at 0 Suspicion, where it does nothing useful, and I wasted 6 Mana and 4 Resolve following it.
- The same card's acceptance line changes between draws ("−1 Resolve" vs "+3 Resolve") because effort and the framing's effects are merged into one line.

**What works:** a check's skill matched to the spell that boosts it (Quickquill on an internship question, Glamour on charm) felt good in both meetings. That was the only part I enjoyed. The level-20 meeting (12 spells, target 5) was tight and readable in 7 turns. The scene flavour text is good.

## Proposal

The idea: **a meeting is a short hand of arguments; your prepared spells are the tricks you brought to it.** Keep the Rust core, the scene library and the source-backed adapters, and change the rules layer.

### A. Fewer, chunkier numbers

- **Four meters:** Agreement, Patience, Suspicion, Mana. Drop Resolve, the response effort and fatigue. The Mood bill after the meeting becomes `rejections × a tier amount`, so it's still felt but needs no tracking during the meeting.
- **Five odds steps in place of a %:** Sure, Likely, Even, Hard, Long shot (≈ 95/80/55/35/15, to tune). The skill gap and the card's difficulty pick the step; the exact % is shown on long-press. A step is something you can plan with: "Glamour makes this Likely."
- **Rejection costs are always the same:** −1 Patience and +1 Suspicion. A **Pointed** argument (one badge) costs +2 Suspicion. No more per-card cost lists.
- **Deflect:** −1 Patience, no roll, no Resolve. Its risk comes from the clock, not a hidden ramp.
- **Three framings in place of six,** each one icon with one effect:
  - *Public:* accepted → +1 Patience.
  - *On the record:* accepted → −1 Suspicion.
  - *Personal:* accepted → your next check is one step easier.
- **Shorter meetings:** target 3/4/5 at DC 20/50/80, Patience 7, Suspicion limit 4. That's about 6 turns and 8 decisions. All of these are starting values to be swept with `research/run.mjs`.

### B. Spells as tricks, not tax

- **Casting is quiet unless the argument fails.** A spell adds Suspicion only when that turn's argument is rejected ("they noticed": +1 on top of the rejection). Forbidden spells always add +2 and cost Alignment, shown on the tile. This removes the cast-then-clean-up loop, and a spell that helps you win costs nothing extra.
- **Every spell does one thing, said in one line**, in six families. Rank III upgrades the one thing; it doesn't add a second effect.

| Family | What it does | Spells (Arguments 8 name → new role) |
| --- | --- | --- |
| Sway | A named kind of check is 1 step easier (2 on a matching *opening*, see C) | Glamour (Charm), Sleight (Guile; crowns halved), Quickquill (Lore, preparation), Animate (job, project: show, don't tell), Contraption (alchemy), Haste (Vigor), Wildfire (any *Public* argument) |
| Read | Information you can act on | Foresight: see the next two arguments and **swap** the current one for one of them. Index: reveal the opponent's opening for this meeting. Lodestar: repeat your last accepted argument's skill on this one |
| Guard | Soften one rejection | Seal (no Suspicion), Omen (reroll a rejection once), Bramble (a *Pointed* argument costs normal), Eclipse (no Patience lost) |
| Steady | Slow the clock | Tailwind (Deflect is free this turn), Starlight (+2 Patience, costs Renown), Hoarfrost (Patience can't drop this turn) |
| Mend | Undo damage | Mend (−1 Suspicion), Candour (−2 Suspicion; your next Guile check is 1 step harder), Heartwood (each acceptance in the next two turns also gives +1 Patience) |
| Trump | Win this argument outright at a heavy, visible price | Compel (Mana + Renown, +2 Suspicion, Alignment), Torment (Health, +3 Suspicion, Alignment) |

  Cut or fold in: Ward and Flame stay as the joke (greyed, at the end of the tray, with a confirm on Flame). Rapport, Brace and Heartprice only fed Resolve, which no longer exists: drop them from negotiation or re-skin them as Mend variants. Distil, Moonwell and Siphon (Mana refills) become meeting-only Mana top-ups at a Health or Patience price, or leave the list.

- **Prepare 3 spells before the meeting (4 at rank II, 5 at rank III)** from the spells you know. The briefing shows the opponent's profile and room (the main game's `PARLEYS` profile and context already exist), so choosing is informed and quick. Only prepared spells show in the tray: 3–5 tiles, not 34. **Every spell you learn in the campaign adds an option to this choice**, which is where acquisition starts to pay.

### C. Openings make the right spell shine

- Each opponent profile and room has **two openings**, shown in the briefing and as a glint on matching cards. For example: a scholar is open to Quickquill and Index; a broker to Sleight; a workshop to Animate and Contraption; a public crowd to Wildfire and Glamour; an official to Seal and Candour.
- A Sway spell cast on an argument that matches an opening moves it **two steps**, usually Hard → Likely. That's the "I brought exactly the right trick" moment.
- Story flags and course or club knowledge can add openings (Grimsby is open to someone who knows what the almanac is for). This is the hook for the main game's cards: a `knows_*` flag or a matching course becomes a visible advantage at the table, not a hidden check bonus.

### D. Reading the screen

- Each turn shows one card, one odds word, at most one framing icon and one Pointed badge, two response buttons, and 3–5 spell tiles. Each tile shows the odds it would give ("→ Likely"), not E.
- The engine stays as an optional hint: one glow on its pick, off by default in play builds.
- Disable any spell that would end the meeting on the spot, and say why on the tile.

## How to judge it (targets for the sim and the next testplay)

- The spell advantage is real at every level: All-out beats Dumb by **≥ 20 points** at levels 20, 50 and 80. Today the gap is 14, 4 and 24.
- Casts are mostly tricks: **≥ 60%** Sway, Read or Trump. Today it's 17–32%.
- No single spell is more than 25% of casts. Six or more spells have meaningful use across the scene library.
- Preparing the spells that match the openings beats a random loadout by **≥ 10 points**. This is the measure of "acquisition matters".
- About 6 turns and 8 or fewer decisions per meeting; no more than 8 numbers on screen.
- A no-spell player still wins about 40–50% at equal level, so magic is an advantage and not a requirement. That fits the main game's "the plot is optional" spirit.
- Human testplay is the judge. The sims only catch gross errors.

## Suggested order

1. Fix the UI hazards in item 6. They're cheap and independent of everything else.
2. Rules core: Resolve removed, odds steps, fixed rejection costs, three framings, quiet casting. Run the Arguments 8 study grid on it to set target, Patience and the Suspicion limit.
3. Spell families, preparing spells, and openings, with a loadout-versus-openings study added to `research/run.mjs`.
4. A phone testplay build, then human playtests (two or three people, a few meetings each, with a short feedback form built into the end-of-meeting screen, since none exists today).
