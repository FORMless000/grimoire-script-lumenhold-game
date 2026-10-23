// Render the standalone research rulebook from the same active parameters as UI.
import fs from 'node:fs';
import {createResearchState,PARAMETERS,OBJECTIVES,FRAMES} from './model.mjs';
import proposal from './live-config.mjs';
import {describeSpell,spellPrice} from './presentation.mjs';
import {SPELLS} from '../reference-engine.mjs';
import {canon,researchPreset} from './progression.mjs';
const tune={...PARAMETERS,...proposal.tune};
const sample=createResearchState({level:50,allSpells:true,tune,effectOverrides:proposal.effectOverrides});
const target=dc=>Math.max(3,Math.round(tune.targetBase+tune.targetSlope*(dc-20)));
const rows=Object.keys(sample.config.spellEffects).map(id=>`| ${SPELLS[id].name} | ${canon.spells[id].cost.join(' / ')} | ${spellPrice(sample,id).split(' · ').slice(1).join(' · ')||'—'} | ${describeSpell(sample,id)} |`).join('\n');
const frames=FRAMES.map(f=>`| ${f.name} | ${f.dc>=0?'+':''}${f.dc} | ${f.successResolve?'Restore '+f.successResolve+' Resolve':f.successSuspicion?'Remove '+f.successSuspicion+' Suspicion':f.successPatience?'Restore '+f.successPatience+' Patience':'—'} | ${[f.resolveHit?'Extra '+f.resolveHit+' Resolve loss':null,f.suspicionHit?'Suspicion '+(f.suspicionHit>0?'+':'')+f.suspicionHit:null,f.rejectRenown?'Lose '+f.rejectRenown+' Renown':null,f.patienceHit?'Extra '+f.patienceHit+' Patience lost':null].filter(Boolean).join('; ')||'—'} |`).join('\n');
const text=`# Negotiation research rulebook · version ${tune.version}

Configuration: **${proposal.name}**. This is a standalone experiment; spell effects and unlock timing are experimental. Mana prices, rank thresholds and capacity are copied from combat, with no negotiation discount. The default testplay uses this rulebook. The original Arguments 3 regression fixture is available with **legacy=1** and has its own rulebook one directory above.

## Win the meeting

Reach the Agreement target before Suspicion reaches **6** or Patience runs out. Starting Patience is always **8**. Each accepted argument gives exactly **1 Agreement**. Half the target is a partial agreement when Patience expires; it is not a full win. Maximum Suspicion is always an outright loss, even if the same response earns the final Agreement point.

Agreement target is **max(3, round(${tune.targetBase} + ${tune.targetSlope} × (DC − 20)))**: ${target(20)}/${target(50)}/${target(80)} at difficulty 20/50/80. The setup bench can override it. Difficulty, target and argument-pool weights are separate encounter controls.

Each turn shows the opponent's current request, a single check or explicit requirement, its exact acceptance chance, its acceptance benefits and its rejection costs. Choose **Confront** or **Deflect**. You may first cast **one spell**, with no action cost. Casting can end the meeting immediately if it fills Suspicion. No Mana flux or combat actions apply here. Leaving ends the meeting and settles resource losses.

## One requirement at a time

Ordinary arguments test exactly one skill, Renown, relationship, alignment, course preparation, club/job performance or thesis progress. Charm appears most often; it is never secretly blended into another check. Encounter tags restrict eligible arguments; weights change their frequency. Spell knowledge/flag gates and crown/blood-price requests appear only when explicitly configured for that event.

Ordinary acceptance chance is clamped to 5–95%:

**p = ${tune.checkBase} + ${tune.checkSlope} × (${tune.levelGapScale} × (named signal − encounter DC) − argument DC) + spell bonuses − fatigue**

Each point of skill-versus-opponent difference changes the check by ${100*tune.checkSlope*tune.levelGapScale} percentage points, half the previous 1.3. Argument difficulty keeps its previous sensitivity and spread. Agreement targets keep their existing DC scaling. Base argument DC is multiplied by ${tune.dcSpread} before the presentation modifier is added and rounded. Below half Resolve, fatigue is **${tune.fatigue} × max(0, 1 − 2 × current Resolve / Resolve cap)**. Resolve does not otherwise add to the check. Paying a specified Gold/Health price is certain if affordable; a missing hard requirement is certain to fail unless a spell explicitly waives it. Forced checks still cannot waive unpaid resource prices.

## Presentation changes the stakes

The same argument can be delivered in six ways. The argument retains its single named requirement and one-point Agreement reward. A base argument cannot repeat immediately, even in a different presentation. Future arguments come from the public weighted pool; neither spells nor AI alter that pool.

| Presentation | Additional DC | Acceptance benefit | Additional rejection stakes |
| --- | --- | --- | --- |
${frames}

Base rejection costs differ by argument and are always shown. Deflect normally spends **${tune.skipResolve} Resolve** and **${tune.skipPatience} Patience**; the last-word presentation adds another Patience. It earns no Agreement. Its chance to add 1 Suspicion starts at ${Math.round(tune.skipRiskBase*100)}% and rises ${Math.round(tune.skipRiskStep*100)} percentage points for every earlier Deflect, capped at 90%, before spell modifiers. Positive Resolve and the full Resolve price are required. Every completed response also uses **${tune.resolveEffort} Resolve** as effort, including an accepted response; this effort cannot reduce Resolve below zero.

Public acceptance restores Patience only up to its starting eight. On-record acceptance can clear Suspicion. Personal acceptance can rebuild Resolve. These benefits create reasons to face a risky request rather than choose purely by acceptance chance. Crown payments normally leave a ${tune.goldTrace}-Suspicion trail; Sleight can conceal it, while still adding its own casting Suspicion.

## Resolve and the resource bill

Full Resolve cap is **round(${tune.resolveBase} + ${tune.resolveSlope} × (.65 Guile + .20 Charm + .15 Lore))**. Entry Mood of at least 30 uses that cap. Below 30, multiply by **.4 + .6 × Mood/30** and round, minimum 1. Zero Resolve never removes Confront; it removes the ability to Deflect and makes checks harder through fatigue.

After the meeting, Mood loss is **ceil(entry Mood × ${tune.moodStake} × (starting cap − final Resolve)/starting cap)**, capped at entry Mood. Recovering Resolve before settlement therefore reduces the eventual Mood bill. Low entry Mood produces a proportionally smaller bill as well as a shorter Resolve cap.

Mana pays spells. Health and Renown are used only by specified prices, spells or public rejection stakes. Renown remains a check signal too. A resource price must be affordable before casting or paying. Negative Renown cannot fund a payment. Mana recovery can restore Mana spent in this meeting, never raise it above entry Mana. Resolve/Patience recovery is capped at the corresponding entry cap.

Mood, Mana, Health and Renown have independent post-meeting rebates, default 50%. Refund **floor(max(0, entry − current) × rebate ratio)**. **Gold is never rebated.** Alignment is never rebated. Rebates cannot leave a resource above entry. Net resource loss, rather than gross casting cost, is used by the engine objectives.

## All spells remain available

Every learned, affordable player-castable spell can be cast in any encounter. Toll remains story-only; creature-only attacks are outside the player roster. The early/mid/late presets grant **12 / 24 / 34 spells** at levels 20/50/80. Level 80 knows every player-castable spell, including forbidden magic. These are generous benchmark grants, not campaign acquisition rules. Course ranks advance at the combat thresholds **22 and 36**; the presets therefore use ranks **I / III / III**. Mana prices below use the actual learned rank. Foresight, Haste and Shadowstep also use combat’s ranked durations; Haste reduces Deflect Patience by 1/1/2. Other experimental effect strengths do not receive a generic rank bonus. Channel spells pay combat’s initial cast price; this negotiation has no hold/release actions or Mana flux. Most casts add Suspicion; direct Suspicion-clearing spells use their listed negative value instead. Ward deliberately has no conversation benefit. Flame burns the papers and loses the meeting. Neither is hidden from the spell list or AI evaluation.

| Spell | Mana by rank I / II / III | Other casting costs | Effect at level 50, full-roster override |
| --- | --- | --- | --- |
${rows}

## Simulation-only resource restrictions

These variants use the All-out planner, with the same search depth, public information and check rules. They are diagnostics, available to the simulation through **policyVariant**; the play UI retains its three resource objectives.

- **dumb** casts no spells, including zero-Mana spells. Every affordable explicit Health/Gold request must be paid, even if it is a poor deal. Other Confront/Deflect choices use search.
- **hyper-frugal** cannot pay explicit Health/Gold prices or cast a spell with a Health charge. Its Mana budget is unlimited, but every cast still records the canonical gross price. The diagnostic does not debit its Mana meter, award extra refunds, or make spell prices zero. Renown/Mood losses and all Suspicion/Resolve/Patience costs still apply.
- **ignorant** casts no spells and cannot pay Health/Gold requests. It still searches ordinary Confront/Deflect choices.

If a forbidden payment cannot be deflected at zero Resolve, leaving remains possible. These are restrictions on deliberate Health/Gold spending; ordinary Mood losses and Renown rejection stakes remain in force.

## Engine suggestions

The engine suggests; it never takes your turn. **E** is heuristic expected utility, not a calibrated win percentage. Each legal root action receives a score; the highest permitted utility is highlighted. Changing the resource objective recomputes suggestions without casting a selected spell.

| Objective | Allowed loss of estimated win chance | Resource weights: Gold / Renown / Health / Mana / Mood |
| --- | --- | --- |
${Object.entries(OBJECTIVES).map(([id,o])=>`| ${o.name} | ${o.slack*100} percentage points | ${['gold','renown','health','mana','mood'].map(k=>o.weights[k]).join(' / ')} |`).join('\n')}

Resource losses are normalized: Gold by entry wallet (minimum 10), Mana by capacity, Health/Renown/Mood by 100. Utility is full-win estimate minus weighted net loss, with a small partial-agreement tie value. Frugal/Prudent choose cheaper actions only inside their listed win-chance allowance. All-out maximizes estimated full wins, using lower costs only to break numerical ties.

The Rust core runs sampled expectimax: check probabilities branch exactly, unknown next arguments use deterministic public strata, and Foresight uses only revealed information. Spells do not consume response depth. Iterative deepening retains only complete root iterations. The browser worker has a cooperative 50 ms search budget and keeps eight promising continuation actions, while scoring every legal root action. Finite horizon, sampled future arguments, continuation pruning and the leaf heuristic limit its accuracy. Native studies use fixed node budgets, frozen sources/builds and exact replay checks. Stronger search is a reference policy, not proof of global optimality.
`;
fs.writeFileSync(new URL('./rulebook.md',import.meta.url),text);
console.log('Wrote research/rulebook.md from '+proposal.name);
