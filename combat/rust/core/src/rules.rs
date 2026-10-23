// The combat rules (F5; F5.11-plan.1, 2026-10-21: the duel terms and spell redesign of
// docs/minigame-combat-f5.11-plan.1-2026-10-21.md). Internal ids stay: `strike` plays Impulse, `guard` Parry, `reclaim` Refocus,
// a `physical` hit is Impact damage.
//
// An exchange resolves in this order:
//   1. both sides pay for their moves (a move no longer affordable is lost);
//   2. both sides' own preparations: defences (Parry, Ward, Brace, Shadowstep, Reflect, a mature Lodestar's Ward), channels,
//      constructs, scheduled blows, Mend, rewards and the rest, so a defence raised this exchange meets the other side's
//      hostile spells whichever side committed first;
//   3. both sides' attacks (Impulse, damaging spells, Countertempo's Impulse, worn kit), then the Shadowstep breaks;
//   4. hostile applications (Bind, Venom, Torment, Compel, Omen, Seal, Extraction, Filch, Roar's scatter, Sleight), each
//      blocked, landed or Reflected onto its caster;
//   5. Torment's tolls, Hoarfrost's cancellation, the hits; Refocus; scheduled hits and construct ticks; construct endings;
//      poison ticks; Mend; a mature Lodestar's healing; the clocks.
// Damage priority (plan §9): a mature Lodestar negates any damage; then poison ticks and Torment tolls land past every other
// defence; then the ordinary ones (frozen, Shadowstep, Reflect, Parry, Ward, Brace, construct and worn reductions).
use crate::data::{data, Act, ConstructAction, R_ALIGNMENT, R_CROWNS, R_HEALTH, R_MANA, R_RENOWN, RESOURCES};
use crate::state::*;
use serde_json::{json, Map, Value};

pub const EPS: f64 = 1e-9;
/// Brace's share taken off opposing damage, and its exchanges including the cast (the roster's `block` and `duration` win).
pub const BRACE_SHARE: f64 = 0.8;
pub const BRACE_EXCHANGES: i32 = 2;
/// The special spells' amounts live in the roster (`amounts`, setup/roster.mjs): Wildfire's hit, bank and self (the cast and
/// each Hold deal `hit`, bank `hit` more for the Release and burn the caster `self`, 2× `self`, 3× …, unscaled); Siphon's hit;
/// Moonwell's bank; Omen's hit (each of two); Lodestar's heal and delay; Torment's toll (× Mana paid); Eclipse's share;
/// Sleight's take; Rapport's crowns; Tailwind's step; a delayed blow's hit and impact; Acorns' next.
#[inline] fn amt(sp: usize, key: &str) -> f64 { data().amt(sp, key) }
#[inline] fn amt_or(sp: usize, key: &str, def: f64) -> f64 { data().spells[sp].amounts.get(key).copied().unwrap_or(def) }
pub const STRIKE_DAMAGE: f64 = 9.0;
pub const DECISION_QUIET_EXCHANGES: i32 = 10;
/// A fight that is never quiet (both sides hurt and heal) is called on points after this many exchanges.
pub const DECISION_MAX_EXCHANGES: i32 = 60;
pub const STARLIGHT_RELEASE: f64 = 30.0;
pub const STARLIGHT_CHARGED: f64 = 48.0;
pub const PURIFY_MANA: f64 = 24.0;
pub const EXTRACTION_MANA: f64 = 9.0;
/// Starlight's Release base damage: straight away, or after at least one Hold (the roster's `release`, else the constants).
pub fn starlight_base(charged: bool) -> f64 { let d = data(); let r = d.spells[d.ids.starlight].release.as_ref(); if charged { r.and_then(|v| v.get(1).copied()).unwrap_or(STARLIGHT_CHARGED) } else { r.and_then(|v| v.first().copied()).unwrap_or(STARLIGHT_RELEASE) } }
/// Brace's share and exchanges, from the roster's Brace (its copies, Burrow and Hide, play the same curve).
pub fn brace_share() -> f64 { amt_or(data().ids.brace, "block", BRACE_SHARE) }
pub fn brace_exchanges() -> i32 { data().spells[data().ids.brace].duration.as_ref().map_or(BRACE_EXCHANGES, |v| v[0] as i32) }
/// Tailwind's added base per consecutive cast before this one.
pub fn tailwind_step() -> f64 { amt_or(data().ids.tailwind, "step", 10.0) }
/// Wildfire's self-burn on the beat after `holds` Holds (the cast is beat 0): `self` × (holds + 1).
pub fn wildfire_self(holds: i32) -> f64 { let d = data(); amt_or(d.ids.wildfire, "self", 2.0) * (holds + 1) as f64 }

/// JS Math.round: halves round toward +infinity.
#[inline]
pub fn js_round(x: f64) -> f64 { let f = x.floor(); if x - f >= 0.5 { f + 1.0 } else { f } }
/// Upward rounding with a hair of tolerance (4 × 1.0000000001 is still 4).
#[inline]
pub fn ceil_up(x: f64) -> f64 { (x - 1e-7).ceil() }

#[derive(Clone, Copy, Default)]
/// `ward_pierce`: the share of a spell hit that gets through Ward (0: Ward stops it all); `pierce_brace`: Brace doesn't reduce it;
/// `fixed`: a hit on its own caster (Wildfire's heat, a burst); `inevitable`: a poison tick or Torment toll, past every defence
/// but a mature Lodestar (F5.11-plan.1).
pub struct Hit { pub source: u8, pub target: u8, pub id: Act, pub power: f64, pub spell: bool, pub fixed: bool, pub pierce_guard: bool, pub reflected: bool, pub hot: bool, pub ward_pierce: f64, pub pierce_brace: bool, pub inevitable: bool }
pub type Hits = Small<Hit, 40>;

/// Scratch for one resolve (the former module-level hurtNow/mendNow and s.bursts).
/// tried / dealt: whether each side aimed damage at the other this exchange, and whether any landed (the urge, F5.9d).
/// paid: the ready Mana each side paid for its move this exchange (Torment's toll).
struct Ctx<'p> { hurt_now: [bool; 2], mend_now: [f64; 2], bursts: Hits, public: Option<&'p mut Public>, tried: [bool; 2], dealt: [bool; 2], paid: [f64; 2] }
impl Ctx<'_> {
    fn event(&mut self, e: impl FnOnce() -> Event) { if let Some(p) = self.public.as_mut() { p.events.push(e()); } }
}

#[inline]
pub fn has(s: &State, side: usize, e: Eff) -> bool {
    match &s.actors[side].effects[e as usize] { Some(x) => x.from <= s.round && x.until.map_or(true, |u| u >= s.round), None => false }
}
#[inline]
fn put(s: &mut State, side: usize, e: Eff, value: f64, from: i32, until: Option<i32>) {
    s.actors[side].effects[e as usize] = Some(Effect { value, from, until, born: s.round, source: None });
}
#[inline]
fn delete(s: &mut State, side: usize, e: Eff) { s.actors[side].effects[e as usize] = None; }

/// Spell index of an action, if it is a spell.
#[inline]
fn spell_of(a: Act) -> Option<usize> { let d = data(); if (a as usize) < d.acts.n_spells { Some(a as usize) } else { None } }
/// Rank index into per-rank arrays (kit rank, or 1 when not learned).
#[inline]
pub fn rank(enc: &Encounter, side: usize, spell: usize) -> i32 { enc.sides[side].rank[spell] }

/// The reward tranches (F5.11-plan.1): Glamour, Rapport and Sleight each pay A = ceil(base × skill factor) on their first
/// positive payout, ceil(A/2) on the second, nothing after. Their slot in Actor::tranches.
pub fn tranche_slot(sp: usize) -> Option<usize> { let ids = &data().ids; if sp == ids.glamour { Some(0) } else if sp == ids.rapport { Some(1) } else if sp == ids.sleight { Some(2) } else { None } }
/// A reward spell's full allowance A for this side.
pub fn reward_full(enc: &Encounter, side: usize, sp: usize) -> f64 {
    let d = data();
    let base = if sp == d.ids.sleight { amt_or(sp, "take", 15.0) } else { let r = (rank(enc, side, sp).max(1) - 1) as usize; d.spells[sp].renown.as_ref().map_or(0.0, |v| v[r.min(v.len() - 1)]) };
    ceil_up(amount(enc, side, Some(sp), base, false))
}
/// The allowance of this side's next cast of a reward spell: A, ceil(A/2), then 0.
pub fn reward_next(enc: &Encounter, s: &State, side: usize, sp: usize) -> f64 {
    let Some(slot) = tranche_slot(sp) else { return 0.0 };
    let a = reward_full(enc, side, sp);
    match s.actors[side].tranches[slot] { 0 => a, 1 => ceil_up(a / 2.0), _ => 0.0 }
}
/// The urge to deal damage (F5.9d): + URGE_STEP each exchange a side deals no damage, up to URGE_MAX; 0 when it deals some; halved
/// when its damage is all blocked. In the AI policy's points (as a persona's tilt), × the preset's tiltScale.
pub const URGE_STEP: f64 = 3.0;
pub const URGE_MAX: f64 = 18.0;
/// amount(): base × skill factor (× combat scale when physical). `spell` = None means Impulse (Strike).
#[inline]
pub fn amount(enc: &Encounter, side: usize, spell: Option<usize>, base: f64, physical: bool) -> f64 {
    let n = data().acts.n_spells;
    base * enc.sides[side].factor[spell.unwrap_or(n)] * (if physical { enc.combat_scale } else { 1.0 })
}
#[inline]
pub fn damage_power(enc: &Encounter, side: usize, spell: usize, base: f64) -> f64 { js_round(amount(enc, side, Some(spell), base, true) * enc.damage_multiplier) }

/// The base damage of a damaging action now: Impulse's, or a spell's at its rank (Tailwind with its chain so far).
pub fn attack_power(enc: &Encounter, s: &State, side: usize, a: Act) -> f64 {
    let d = data();
    let (spell, base) = if a == d.acts.strike { (None, Some(d.skill.strike_damage)) } else {
        match spell_of(a) { Some(sp) => (Some(sp), d.spells[sp].damage.as_ref().and_then(|v| v.get((rank(enc, side, sp) - 1) as usize).copied())), None => (None, None) }
    };
    let chain = if spell == Some(d.ids.tailwind) { s.actors[side].effects[Eff::Tailwind as usize].map_or(0.0, |e| e.value) * tailwind_step() } else { 0.0 };
    match base {
        None => 0.0,
        Some(b) => js_round(amount(enc, side, spell, b + chain, true) * enc.damage_multiplier),
    }
}

pub fn actor_to_move(s: &State) -> Option<usize> {
    if s.result.is_some() { return None; }
    let l = s.leader as usize;
    Some(if s.pending[l].is_none() { l } else { 1 - l })
}

pub fn cost(enc: &Encounter, s: &State, side: usize, a: Act) -> f64 {
    let d = data();
    if a == d.acts.hold {
        return s.actors[side].channel.and_then(|c| d.spells[c.spell].hold_cost).unwrap_or(0.0) * enc.mana_cost_scale;
    }
    match spell_of(a) { Some(sp) => enc.sides[side].cost[sp], None => 0.0 }
}
#[inline]
fn healing(a: Act) -> bool { let ids = &data().ids; a as usize == ids.mend || a as usize == ids.heartwood }
#[inline]
pub fn blood(s: &State, side: usize, a: Act) -> bool { has(s, side, Eff::Heartprice) && !healing(a) }
pub fn hp_cost(enc: &Encounter, s: &State, side: usize, a: Act) -> f64 {
    let own = match spell_of(a).and_then(|sp| data().spells[sp].hp_cost.map(|h| (sp, h))) { Some((sp, h)) if h != 0.0 => amount(enc, side, Some(sp), h, true), _ => 0.0 };
    (if blood(s, side, a) { cost(enc, s, side, a) / 2.0 } else { 0.0 }) + own
}

/// Countertempo (Haste, F5.11-plan.1): a spell with no damage of its own (direct, scheduled, inevitable or by a summon) and no
/// channel; cast while Haste is active, it adds one automatic Impulse. Basics never do.
pub fn countertempo(sp: usize) -> bool {
    let d = data();
    let x = &d.spells[sp];
    let ids = &d.ids;
    x.castable && !x.channel && x.damage.is_none() && x.delay.is_none() && x.poison.is_none() && sp != ids.omen && sp != ids.torment
        && !x.amounts.contains_key("next") && x.construct.map_or(true, |k| d.constructs[k].action == ConstructAction::Heal)
}
/// Whether this action, cast now, adds Countertempo's Impulse.
pub fn hasted_impulse(s: &State, side: usize, a: Act) -> bool { has(s, side, Eff::Haste) && spell_of(a).map_or(false, countertempo) }

/// A Lodestar cast but not yet matured (one at a time, plan §9).
pub fn lodestar_pending(s: &State, side: usize) -> bool { s.actors[side].effects[Eff::Lodestar as usize].map_or(false, |e| e.from > s.round) }

/// The menu without Compel's constraint: frozen, bound, channel, Mana and HP, the spells' own limits.
fn base_unavailable(enc: &Encounter, s: &State, side: usize, a: Act) -> Option<&'static str> {
    let d = data();
    let k = &d.acts;
    let x = &s.actors[side];
    if x.freeze_until >= s.round { return if a == k.frozen { None } else { Some("Frozen this exchange") }; }
    if has(s, side, Eff::Bound) { return if a == k.break_free { None } else { Some("Bound: Breaking Free is the only action") }; }
    // Idle (F5.11): a kit that may stand still commits `cancel` from its normal menu; nobody else can.
    let idle = a == k.cancel && enc.sides[side].idle && x.channel.is_none();
    if a == k.frozen || a == k.break_free || (a == k.cancel && !idle) || k.is_bundle[a as usize] { return Some("Not an available action"); }
    if idle { return None; }
    let hold_or_release = a == k.hold || a == k.release;
    if x.channel.is_some() && !hold_or_release { return Some("Hold or Release while channeling"); }
    if x.channel.is_none() && hold_or_release { return Some("Not channeling"); }
    if let Some(sp) = spell_of(a) {
        let ids = &d.ids;
        if !enc.sides[side].learned[sp] { return Some("Not learned"); }
        if !d.spells[sp].castable { return Some("Cards/story only"); }
        // Compel (F5.11): never in the fight's first exchange.
        if sp == ids.compel && s.round <= 1 { return Some("Not in the first exchange"); }
        // A delayed blow (F5.11) waits for the last one to land: one blow on its way at a time.
        if d.spells[sp].delay.is_some() && x.omens.iter().any(|o| d.spells[o.spell].delay.is_some()) { return Some("A blow is already on its way"); }
        if sp == ids.rime && (x.rime_ready || x.rime_used) { return Some("Once a fight"); }
        if sp == ids.heartprice && has(s, side, Eff::Heartprice) { return Some("Already paid"); }
        if sp == ids.lodestar && x.effects[Eff::Lodestar as usize].is_some() { return Some("A Lodestar is already rising"); }
    }
    if !blood(s, side, a) && x.res[R_MANA] + EPS < cost(enc, s, side, a) { return Some("Not enough ready Mana"); }
    if x.hp + EPS < hp_cost(enc, s, side, a) { return Some("Not enough HP"); }
    None
}
/// Compel's forced move (F5.11-plan.1): the captured one while it is legal, else a lost turn (`cancel`).
pub fn replay(enc: &Encounter, s: &State, side: usize) -> Act {
    let k = &data().acts;
    match s.actors[side].captured { Some(a) if a != k.cancel && a != k.frozen && base_unavailable(enc, s, side, a).is_none() => a, _ => k.cancel }
}
/// available(): None when the action can be taken, else the reason shown to the player.
/// Control order (plan §7): frozen, then bound (Breaking Free), then compelled (the captured move), then a channel.
pub fn unavailable(enc: &Encounter, s: &State, side: usize, a: Act) -> Option<&'static str> {
    let x = &s.actors[side];
    if x.freeze_until < s.round && !has(s, side, Eff::Bound) && has(s, side, Eff::Compelled) {
        return if a == replay(enc, s, side) { None } else { Some("Compelled: only the captured move") };
    }
    base_unavailable(enc, s, side, a)
}

pub type Moves = Small<Act, 48>;
pub fn legal_actions(enc: &Encounter, s: &State) -> Moves {
    match actor_to_move(s) { Some(side) => legal_for(enc, s, side), None => Moves::default() }
}
/// legalActions(s, side): the menu of either side, also out of turn.
#[inline]
pub fn legal_for(enc: &Encounter, s: &State, side: usize) -> Moves {
    let mut out = Moves::default();
    let k = &data().acts;
    let x = &s.actors[side];
    let mut consider = |a: Act| if unavailable(enc, s, side, a).is_none() { out.push(a); };
    if x.freeze_until >= s.round { consider(k.frozen); }
    else if has(s, side, Eff::Bound) { consider(k.break_free); }
    // Compelled: the only move is the captured one (a lost turn when it can't be played), known to both sides.
    else if has(s, side, Eff::Compelled) { out.push(replay(enc, s, side)); }
    else if x.channel.is_some() { consider(k.hold); consider(k.release); }
    else { consider(k.strike); consider(k.guard); consider(k.reclaim); for &(sp, _) in &enc.sides[side].kit { consider(sp as Act); } if enc.sides[side].idle { consider(k.cancel); } }
    out
}

fn debit(x: &mut Actor, key: usize, n: f64) -> f64 {
    let actual = n.max(0.0).min(x.res[key] - if key == R_ALIGNMENT { -100.0 } else { 0.0 });
    x.res[key] -= actual; x.spent[key] += actual; actual
}
fn gain(enc: &Encounter, s: &mut State, side: usize, key: usize, n: f64) -> f64 {
    let limit = match key { R_MANA => enc.sides[side].capacity, R_CROWNS => 99999.0, R_HEALTH => enc.sides[side].entry[R_HEALTH], _ => 100.0 };
    let x = &mut s.actors[side];
    let actual = 0f64.max(n.min(limit - x.res[key]));
    x.res[key] += actual; x.restored[key] += actual;
    // F5.9b: Mana plus flux never exceeds capacity, so gaining Mana spills flux that no longer fits (no banking past the pool).
    if key == R_MANA { x.flux = 0f64.max(x.flux.min(limit - x.res[key])); }
    if key == R_MANA && actual > EPS { delete(s, side, Eff::Shadowstep); }
    actual
}
/// Healing: none for a creature, none under Heartprice (F5.11-plan.1; Rime's rescue is not healing).
fn heal(enc: &Encounter, s: &mut State, side: usize, n: f64) -> f64 {
    if enc.sides[side].no_heal || has(s, side, Eff::Heartprice) { return 0.0; }
    let x = &mut s.actors[side];
    let actual = 0f64.max(n.min(x.max_hp - x.hp));
    x.hp += actual;
    gain(enc, s, side, R_HEALTH, n);
    actual
}
fn end_construct(enc: &Encounter, _s: &mut State, ctx: &mut Ctx, side: usize, c: ConstructI) {
    let d = data();
    if let Some(burst) = d.constructs[c.kind].burst {
        let power = damage_power(enc, side, c.spell, burst);
        for target in 0..2u8 {
            ctx.bursts.push(Hit { source: side as u8, target, power, spell: true, id: d.ids.contraption as Act, ..Default::default() });
        }
    }
    ctx.event(|| Event::ConstructEnded { spell: c.spell });
}
fn reduce_hp(enc: &Encounter, s: &mut State, ctx: &mut Ctx, side: usize, n: f64, damage: bool) -> f64 {
    let x = &mut s.actors[side];
    let actual = 0f64.max(x.hp.min(n));
    x.hp -= actual;
    debit(x, R_HEALTH, actual);
    if damage && actual > 0.0 {
        ctx.hurt_now[side] = true;
        for c in x.constructs.as_mut_slice() { c.taken += actual; }
        let mut ending: Small<ConstructI, 3> = Small::default();
        for c in x.constructs.iter() { if c.taken + EPS >= c.threshold { ending.push(*c); } }
        if !ending.is_empty() {
            x.constructs.retain(|c| !(c.taken + EPS >= c.threshold));
            for c in ending.iter() { end_construct(enc, s, ctx, side, *c); }
        }
    }
    let x = &mut s.actors[side];
    if x.hp <= EPS && x.rime_ready && !x.rime_used {
        x.rime_ready = false; x.rime_used = true; x.hp = data().amt(data().ids.rime, "thaw"); x.freeze_until = s.round + 1;
        if enc.health_direct { gain(enc, s, side, R_HEALTH, 1.0); }
        ctx.event(|| Event::Froze { side: side as u8 });
    }
    actual
}
/// Pay for a move; returns the ready Mana paid (HP payments under Heartprice pay none).
fn pay(enc: &Encounter, s: &mut State, ctx: &mut Ctx, side: usize, a: Act) -> f64 {
    let d = data();
    let c = cost(enc, s, side, a);
    let h = hp_cost(enc, s, side, a);
    let mut paid = 0.0;
    if blood(s, side, a) { reduce_hp(enc, s, ctx, side, h, false); } else {
        paid = debit(&mut s.actors[side], R_MANA, c);
        let room = 0f64.max(enc.sides[side].capacity - s.actors[side].res[R_MANA] - s.actors[side].flux);
        s.actors[side].flux += (paid * d.flux_ratio).min(room);
        if h != 0.0 { reduce_hp(enc, s, ctx, side, h, false); }
    }
    if let Some(sp) = spell_of(a) {
        if let Some(tier) = d.spells[sp].alignment_cost { debit(&mut s.actors[side], R_ALIGNMENT, tier); }
        if d.spells[sp].forbidden && enc.witnesses {
            let round = s.round;
            if let Some(p) = ctx.public.as_mut() { p.reports.push((side as u8, sp, round)); }
            ctx.event(|| Event::Witnessed { spell: sp });
        }
    }
    paid
}
fn summon(enc: &Encounter, s: &mut State, ctx: &mut Ctx, side: usize, sp: usize) {
    let d = data();
    // A new summon replaces the old one (Bramble's construct and its Heartwood pairing are retired, F5.11-plan.1).
    let before = s.actors[side].constructs;
    for c in before.iter() { end_construct(enc, s, ctx, side, *c); }
    let kind = d.spells[sp].construct.unwrap();
    let spec = &d.constructs[kind];
    let power = if spec.action == ConstructAction::Heal { amount(enc, side, Some(sp), spec.power, true) } else { damage_power(enc, side, sp, spec.power) };
    let c = ConstructI { spell: sp, kind, power, reduction: amount(enc, side, Some(sp), spec.reduction, true), threshold: amount(enc, side, Some(sp), spec.threshold, true), taken: 0.0, expires: s.round + spec.max_exchanges - 1 };
    let mut keep: Small<ConstructI, 3> = Small::default();
    keep.push(c);
    s.actors[side].constructs = keep;
}
/// Shielded from a hostile spell's application: Ward this exchange (a mature Lodestar's included) or Shadowstep.
fn shielded(s: &State, side: usize) -> bool { has(s, side, Eff::Ward) || has(s, side, Eff::Shadowstep) }
#[inline]
fn hit(source: usize, id: Act, power: f64) -> Hit { Hit { source: source as u8, target: 1 - source as u8, id, power, spell: true, ..Default::default() } }
/// Schedule a hit `n` exchanges from now on the caster's list; same-date contributions of one spell (Omen's) merge.
fn schedule(s: &mut State, side: usize, sp: usize, due: i32, power: f64, impact: bool, bounced: bool) {
    let list = &mut s.actors[side].omens;
    if let Some(o) = list.as_mut_slice().iter_mut().find(|o| o.spell == sp && o.due == due && o.impact == impact && o.bounced == bounced) { o.power += power; return; }
    list.push(Omen { due, power, spell: sp, impact, bounced });
}

fn hits(enc: &Encounter, s: &mut State, ctx: &mut Ctx, initial: &Hits) {
    if initial.is_empty() && ctx.bursts.is_empty() { return; }
    let d = data();
    let mut queue = *initial;
    let mut waves = 0;
    while !queue.is_empty() || !ctx.bursts.is_empty() {
        waves += 1;
        if waves > 12 { panic!("Unexpected damage chain"); }
        let mut batch = queue;
        for b in ctx.bursts.iter() { batch.push(*b); }
        ctx.bursts.clear();
        queue.clear();
        let mut expose = [false; 2];
        for h in batch.iter() {
            let t = h.target as usize;
            let mut n = h.power;
            let opposing = h.source != h.target;
            let mut by: u16 = 0;
            let (hid, raw, hsrc, htgt, hrefl) = (h.id, h.power, h.source, h.target, h.reflected);
            if n <= EPS { continue; }
            if opposing { ctx.tried[h.source as usize] = true; }
            // 1. A mature Lodestar negates any damage, its holder's own included (plan §9).
            if has(s, t, Eff::Lodestar) { ctx.event(|| Event::Hit { id: hid, raw, amount: 0.0, target: htgt, source: hsrc, by: DEF_LODESTAR, reflected: hrefl }); continue; }
            if !h.inevitable {
                if s.actors[t].freeze_until >= s.round { if opposing { ctx.event(|| Event::Hit { id: hid, raw, amount: 0.0, target: htgt, source: hsrc, by: DEF_FROZEN, reflected: hrefl }); } continue; }
                if !h.fixed && has(s, t, Eff::Shadowstep) { if opposing { ctx.event(|| Event::Hit { id: hid, raw, amount: 0.0, target: htgt, source: hsrc, by: DEF_SHADOWSTEP, reflected: hrefl }); } continue; }
                if h.spell && opposing && has(s, t, Eff::Reflect) && !h.reflected {
                    ctx.event(|| Event::Hit { id: hid, raw, amount: 0.0, target: htgt, source: hsrc, by: DEF_REFLECT, reflected: false });
                    queue.push(Hit { source: h.target, target: h.source, reflected: true, ..*h });
                    continue;
                }
                if !h.fixed {
                    // Parry's value is the share of an Impact hit it stops: 1, or less when it repeats the last exchange's Parry.
                    if has(s, t, Eff::Guard) && !h.pierce_guard {
                        let g = s.actors[t].effects[Eff::Guard as usize].unwrap().value;
                        n *= if h.spell { 1.0 / 2.0 } else { 1.0 - g };
                        by |= DEF_GUARD | if !h.spell && g < 1.0 - EPS { DEF_GUARD_TIRED } else { 0 };
                    }
                    if n > EPS && opposing && has(s, t, Eff::Ward) && h.ward_pierce < 1.0 - EPS { n = if h.spell { n * h.ward_pierce } else { n / 2.0 }; by |= DEF_WARD; }
                    if n > EPS && opposing && !h.pierce_brace && has(s, t, Eff::Brace) {
                        n *= 1.0 - s.actors[t].effects[Eff::Brace as usize].unwrap().value;
                        by |= DEF_BRACE;
                    }
                    let reduction = s.actors[t].constructs.iter().fold(0.0, |sum, c| sum + c.reduction);
                    if n > EPS && reduction > EPS { by |= DEF_CONSTRUCT; }
                    n = 0f64.max(n - reduction);
                }
                // The target's kit takes a flat amount off each opposing hit (world expansion 1: a ward-stitched cloak, a stag's tine).
                if n > EPS && opposing {
                    let side_t = &enc.sides[t];
                    let off = side_t.taken_all + side_t.taken.get(h.id as usize).copied().unwrap_or(0.0);
                    if off > EPS { n = 0f64.max(n - off); }
                }
            }
            let actual = reduce_hp(enc, s, ctx, t, 0f64.max((n - EPS).ceil()), true);
            if opposing { ctx.event(|| Event::Hit { id: hid, raw, amount: actual, target: htgt, source: hsrc, by, reflected: hrefl }); }
            if actual > EPS {
                if opposing { if !h.inevitable { expose[h.source as usize] = true; } ctx.dealt[h.source as usize] = true; }
                let src = h.source as usize;
                if h.id as usize == d.ids.siphon {
                    if let Some(c) = s.actors[src].channel.as_mut() { if c.spell == d.ids.siphon { c.total += actual; } }
                }
                // Eclipse (F5.11-plan.1): its share of the damage actually taken becomes ready Mana.
                if has(s, t, Eff::Eclipse) { let share = s.actors[t].effects[Eff::Eclipse as usize].unwrap().value; gain(enc, s, t, R_MANA, share * actual); }
                let (id, target, source, reflected) = (h.id, h.target, h.source, h.reflected);
                ctx.event(|| Event::Dealt { id, amount: actual, target, source, reflected });
            }
        }
        for side in 0..2 { if expose[side] { delete(s, side, Eff::Shadowstep); } }
    }
}

/// The share of an Impact hit this side's Parry stops: all of it, or 1 − the tuning's repeatLeak when it also parried within the
/// last `lookback` exchanges (Parry fatigue).
pub fn guard_block(s: &State, side: usize) -> f64 {
    let d = data();
    let g = s.actors[side].guard_round;
    if g > 0 && s.round - g <= d.skill.guard_lookback { 1.0 - d.skill.guard_repeat_leak } else { 1.0 }
}

/// A side's own preparations (step 2): everything but its attacks and its hostile applications.
fn prepared(enc: &Encounter, s: &mut State, ctx: &mut Ctx, side: usize, a: Act, attacks: &mut Hits) {
    let d = data();
    let ids = &d.ids;
    let k = &d.acts;
    let round = s.round;
    if a == k.guard { let g = guard_block(s, side); put(s, side, Eff::Guard, g, round, Some(round)); s.actors[side].guard_round = round; return; }
    if let Some(sp) = spell_of(a) {
        let spell = &d.spells[sp];
        if spell.construct.is_some() { summon(enc, s, ctx, side, sp); return; }
        if spell.channel {
            let bank = if sp == ids.moonwell { amount(enc, side, Some(sp), amt(sp, "bank"), false) } else { 0.0 };
            s.actors[side].channel = Some(Channel { spell: sp, holds: 0, bank, total: 0.0 });
            if sp == ids.siphon { attacks.push(hit(side, a, damage_power(enc, side, sp, amt(sp, "hit")))); }
            if sp == ids.wildfire { wildfire_beat(enc, s, side, attacks); }
            return;
        }
    }
    let r = |sp: usize| (rank(enc, side, sp) - 1) as usize;
    if a == k.hold {
        let mut c = s.actors[side].channel.unwrap();
        c.holds += 1;
        if c.spell == ids.moonwell { c.bank += amount(enc, side, Some(c.spell), amt(c.spell, "bank"), false); }
        s.actors[side].channel = Some(c);
        if c.spell == ids.wildfire { wildfire_beat(enc, s, side, attacks); }
        if c.spell == ids.siphon { attacks.push(hit(side, c.spell as Act, damage_power(enc, side, c.spell, amt(c.spell, "hit")))); }
        return;
    }
    if a == k.release {
        let c = s.actors[side].channel.take().unwrap();
        if c.spell == ids.starlight { attacks.push(Hit { ward_pierce: if c.holds != 0 { amt(c.spell, "chargedWardPierce") } else { 0.0 }, ..hit(side, c.spell as Act, damage_power(enc, side, c.spell, starlight_base(c.holds != 0))) }); }
        // Wildfire's Release (F5.11-plan.1): one spell hit of `hit` plus the bank; half of it gets through Ward.
        if c.spell == ids.wildfire { attacks.push(Hit { hot: true, ward_pierce: 0.5, ..hit(side, c.spell as Act, damage_power(enc, side, c.spell, amt(c.spell, "hit") + c.bank)) }); }
        if c.spell == ids.siphon { heal(enc, s, side, c.total); }
        if c.spell == ids.moonwell { gain(enc, s, side, R_MANA, c.bank); }
        return;
    }
    let Some(sp) = spell_of(a) else { return; };
    let spell = &d.spells[sp];
    let rule = spell.rule;
    let dur = |sp: usize| spell_duration(enc, side, sp);
    if sp == ids.mend { ctx.mend_now[side] = amount(enc, side, Some(sp), spell.healing.as_ref().unwrap()[r(sp)], true); }
    else if rule == ids.ward { put(s, side, Eff::Ward, 1.0, round, Some(round)); }
    else if rule == ids.brace { put(s, side, Eff::Brace, brace_share(), round, Some(round + brace_exchanges() - 1)); }
    // Countertempo (F5.11-plan.1): the next 2/3/4 exchanges; a recast refreshes it.
    else if sp == ids.haste { put(s, side, Eff::Haste, 1.0, round + 1, Some(round + dur(sp))); }
    else if rule == ids.shadowstep { put(s, side, Eff::Shadowstep, 1.0, round, Some(round + dur(sp) - 1)); }
    else if sp == ids.glamour {
        // A tranche only with an audience (no audience consumes none).
        if enc.observers { let n = reward_next(enc, s, side, sp); if n > EPS { s.actors[side].pending_renown += n; s.actors[side].tranches[0] += 1; s.actors[side].glamour_done = true; } }
    }
    else if sp == ids.rapport {
        // The full Crown payment for a positive payout, never Crowns for nothing.
        let n = reward_next(enc, s, side, sp);
        let price = amt_or(sp, "crowns", 10.0);
        if enc.observers && n > EPS && s.actors[side].res[R_CROWNS] + EPS >= price { debit(&mut s.actors[side], R_CROWNS, price); s.actors[side].pending_renown += n; s.actors[side].tranches[1] += 1; }
    }
    // Distill (F5.11-plan.1): HP for Mana, no longer a cure.
    else if sp == ids.purify { let n = amount(enc, side, Some(sp), PURIFY_MANA, false); let got = gain(enc, s, side, R_MANA, n); ctx.event(|| Event::Moved { side: side as u8, id: sp as Act, amount: got, blocked: false }); }
    else if sp == ids.rime { if !s.actors[side].rime_used { s.actors[side].rime_ready = true; } }
    else if sp == ids.reflect { put(s, side, Eff::Reflect, 1.0, round, Some(round + dur(sp) - 1)); }
    else if sp == ids.eclipse { put(s, side, Eff::Eclipse, amt_or(sp, "share", 1.0), round, Some(round + dur(sp) - 1)); }
    // Heartprice (F5.11-plan.1): all ready Mana becomes HP once, then healing stops and spells cost HP.
    else if sp == ids.heartprice {
        let x = &mut s.actors[side];
        let mana = x.res[R_MANA];
        x.res[R_MANA] = 0.0; x.spent[R_MANA] += mana;
        let n = if enc.sides[side].no_heal { 0.0 } else { mana.min(0f64.max(x.max_hp - x.hp)) };
        x.hp += n;
        if n > 0.0 { gain(enc, s, side, R_HEALTH, n); }
        put(s, side, Eff::Heartprice, 1.0, round, None);
    }
    // Lodestar (F5.11-plan.1): matures `delay` exchanges from now: that exchange it negates all damage, wards, then heals.
    else if sp == ids.lodestar { let at = round + amt_or(sp, "delay", 7.0) as i32; put(s, side, Eff::Lodestar, amount(enc, side, Some(sp), amt(sp, "heal"), true), at, Some(at)); }
    // A delayed blow (F5.11): it lands `delay` exchanges from now, in the open; The Long Wait's Impact half beside its spell hit.
    else if let Some(n) = spell.delay {
        let due = round + n;
        let impact = spell.physical;
        if amt(sp, "hit") > 0.0 { let p = damage_power(enc, side, sp, amt(sp, "hit")); schedule(s, side, sp, due, p, impact, false); }
        if amt(sp, "impact") > 0.0 { let p = damage_power(enc, side, sp, amt(sp, "impact")); schedule(s, side, sp, due, p, true, false); }
    }
    // Acorns (F5.11-plan.1): a second hit next exchange, met by that exchange's defences.
    if amt(sp, "next") > 0.0 { let p = damage_power(enc, side, sp, amt(sp, "next")); schedule(s, side, sp, round + 1, p, spell.physical, false); }
}
/// A spell's exchanges at this side's rank (its rule's spell's when it has none of its own).
fn spell_duration(enc: &Encounter, side: usize, sp: usize) -> i32 {
    let d = data();
    let r = (rank(enc, side, sp).max(1) - 1) as usize;
    let of = |x: usize| d.spells[x].duration.as_ref().map(|v| v[r.min(v.len() - 1)] as i32);
    of(sp).or_else(|| of(d.spells[sp].rule)).unwrap_or(1)
}
/// One Wildfire beat (the cast, or a Hold): `hit` at them, `self` × beats at the caster, `hit` more in the bank.
fn wildfire_beat(enc: &Encounter, s: &mut State, side: usize, attacks: &mut Hits) {
    let sp = data().ids.wildfire;
    let mut c = s.actors[side].channel.unwrap();
    let h = amt(sp, "hit");
    attacks.push(Hit { hot: true, ..hit(side, sp as Act, damage_power(enc, side, sp, h)) });
    attacks.push(Hit { target: side as u8, fixed: true, hot: true, ..hit(side, sp as Act, wildfire_self(c.holds)) });
    c.bank += amt_or(sp, "bank", h);
    s.actors[side].channel = Some(c);
}

/// Where a hostile application lands (plan §8): None when blocked, else the side it lands on and whether Reflect returned it.
/// Ward (a mature Lodestar's too) and Shadowstep block it; Breaking Free blocks a Bind; Reflect returns it onto its caster, whose
/// own Ward or Shadowstep can still block it there (it doesn't bounce again).
fn landing(s: &State, caster: usize, binding: bool) -> (Option<usize>, u8) {
    let d = data();
    let target = 1 - caster;
    let free = |side: usize| binding && s.last_pair.map_or(false, |p| p[side] == d.acts.break_free);
    if shielded(s, target) || free(target) { return (None, 1); }
    if has(s, target, Eff::Reflect) { return if shielded(s, caster) || free(caster) { (None, 3) } else { (Some(caster), 2) }; }
    (Some(target), 0)
}

/// Step 4: one side's hostile application, if its move has one.
fn apply_hostile(enc: &Encounter, s: &mut State, ctx: &mut Ctx, side: usize, a: Act, mana_before: [f64; 2]) {
    let d = data();
    let ids = &d.ids;
    let Some(sp) = spell_of(a) else { return; };
    let spell = &d.spells[sp];
    let round = s.round;
    let hostile = spell.bind.is_some() || spell.poison.is_some() || spell.drain.is_some() || sp == ids.torment || sp == ids.compel || sp == ids.omen || sp == ids.seal || sp == ids.extraction || sp == ids.sleight;
    if !hostile { return; }
    // Sleight is not stopped by Ward or Shadowstep (as before), only returned by Reflect (plan §8).
    let (on, outcome) = if sp == ids.sleight { if has(s, 1 - side, Eff::Reflect) { (Some(side), 2) } else { (Some(1 - side), 0) } } else { landing(s, side, spell.bind.is_some()) };
    ctx.event(|| Event::Applied { side: side as u8, id: a, outcome });
    let blocked = on.is_none();
    // The side that gains from it: its caster, or the reflector when it came back.
    let on_target = on.unwrap_or(1 - side);
    let taker = 1 - on_target;
    if let Some(b) = spell.bind { if let Some(t) = on { put(s, t, Eff::Bound, 1.0, round + 1, Some(round + b)); } }
    if let Some((per, n)) = spell.poison {
        if let Some(t) = on { put(s, t, Eff::Poison, damage_power(enc, side, sp, per), round, Some(round + n - 1)); s.actors[t].effects[Eff::Poison as usize].as_mut().unwrap().source = Some((1 - t) as u8); }
    }
    if sp == ids.torment {
        if let Some(t) = on { put(s, t, Eff::Torment, amt_or(sp, "toll", 2.0), round, Some(round + spell_duration(enc, side, sp) - 1)); s.actors[t].effects[Eff::Torment as usize].as_mut().unwrap().source = Some((1 - t) as u8); }
    }
    if sp == ids.compel {
        if let Some(t) = on {
            let captured = s.last_pair.unwrap()[t];
            put(s, t, Eff::Compelled, 1.0, round + 1, Some(round + spell_duration(enc, side, sp)));
            s.actors[t].captured = Some(captured);
        }
    }
    if sp == ids.omen {
        if let Some(t) = on {
            let p = damage_power(enc, side, sp, amt(sp, "hit"));
            for due in [round + 2, round + 3] { schedule(s, 1 - t, sp, due, p, false, outcome == 2); }
        }
    }
    if sp == ids.seal {
        let n = if blocked { 0.0 } else { s.actors[on_target].flux };
        if !blocked { s.actors[on_target].flux = 0.0; }
        ctx.event(|| Event::Moved { side: side as u8, id: sp as Act, amount: n, blocked });
    }
    // Extraction: ready Mana into the taker's flux (Mana plus flux can't exceed capacity).
    if sp == ids.extraction {
        let n = if blocked { 0.0 } else { 0f64.max(amount(enc, side, Some(sp), EXTRACTION_MANA, false).min(s.actors[on_target].res[R_MANA]).min(mana_before[on_target]).min(enc.sides[taker].capacity - s.actors[taker].res[R_MANA] - s.actors[taker].flux)) };
        debit(&mut s.actors[on_target], R_MANA, n);
        s.actors[taker].flux += n;
        ctx.event(|| Event::Moved { side: side as u8, id: sp as Act, amount: n, blocked });
    }
    // Drain (Filch, Roar): ready Mana taken; Filch keeps it as the taker's flux, Roar scatters it.
    if let Some(base) = spell.drain {
        let n = if blocked { 0.0 } else { 0f64.max(amount(enc, side, Some(sp), base, false).min(s.actors[on_target].res[R_MANA])) };
        debit(&mut s.actors[on_target], R_MANA, n);
        if spell.drain_keep { let room = 0f64.max(enc.sides[taker].capacity - s.actors[taker].res[R_MANA] - s.actors[taker].flux); s.actors[taker].flux += n.min(room); }
        ctx.event(|| Event::Moved { side: side as u8, id: sp as Act, amount: n, blocked });
    }
    // Sleight: Crowns, up to this cast's tranche; a theft that takes nothing (or comes back) consumes none.
    if sp == ids.sleight {
        let allowance = reward_next(enc, s, side, sp);
        let n = allowance.min(s.actors[on_target].res[R_CROWNS]).min(99999.0 - s.actors[taker].res[R_CROWNS]).max(0.0);
        debit(&mut s.actors[on_target], R_CROWNS, n);
        gain(enc, s, taker, R_CROWNS, n);
        if outcome == 0 && n > EPS { s.actors[side].tranches[2] += 1; }
        ctx.event(|| Event::Moved { side: side as u8, id: sp as Act, amount: n, blocked: outcome != 0 });
    }
}

fn terminal(enc: &Encounter, s: &mut State, ctx: &mut Ctx) -> bool {
    let alive = [s.actors[0].hp > EPS, s.actors[1].hp > EPS];
    if alive[0] && alive[1] { return false; }
    let winner = if alive[0] { 0 } else if alive[1] { 1 } else { s.leader };
    finish(enc, s, ctx.public.as_deref_mut(), if winner == 0 { Outcome::Win } else { Outcome::Lose }, Reason::Knockout, Some(winner as usize), !alive[0] && !alive[1]);
    true
}

pub fn can_damage(enc: &Encounter, s: &State, side: usize) -> bool {
    let d = data();
    let ids = &d.ids;
    let x = &s.actors[side];
    let target = &s.actors[1 - side];
    let flat = target.constructs.iter().fold(0.0, |n, c| n + c.reduction);
    if attack_power(enc, s, side, d.acts.strike) > flat + EPS { return true; }
    if x.constructs.iter().any(|c| d.constructs[c.kind].action != ConstructAction::Heal && c.power > flat + EPS) || x.omens.iter().any(|o| o.power > flat + EPS) { return true; }
    if has(s, 1 - side, Eff::Poison) || (has(s, 1 - side, Eff::Torment) && target.res[R_MANA] > EPS) { return true; }
    if let Some(c) = x.channel {
        let base = if c.spell == ids.starlight { Some(starlight_base(true)) } else if c.spell == ids.wildfire { Some(amt(c.spell, "hit") + c.bank) } else if c.spell == ids.siphon { Some(amt(c.spell, "hit")) } else { None };
        if let Some(b) = base { if damage_power(enc, side, c.spell, b) > flat + EPS { return true; } }
    }
    let mana = x.res[R_MANA] + x.flux + match x.channel { Some(c) if c.spell == ids.moonwell => c.bank, _ => 0.0 };
    let me = &enc.sides[side];
    let can_fund = me.learned[ids.moonwell] || (me.learned[ids.purify] && x.hp > hp_cost(enc, s, side, ids.purify as Act));
    let blood = has(s, side, Eff::Heartprice) || me.learned[ids.heartprice];
    for &(sp, _) in &me.kit {
        let a = sp as Act;
        let c = cost(enc, s, side, a);
        if !can_fund && c > mana + EPS && !(blood && x.hp + EPS >= c / 2.0) { continue; }
        if sp == ids.torment || sp == ids.compel { return true; }
        if let Some(kind) = d.spells[sp].construct {
            let spec = &d.constructs[kind];
            if spec.action != ConstructAction::Heal && damage_power(enc, side, sp, spec.power) > flat + EPS { return true; }
        }
        let power = if sp == ids.starlight { damage_power(enc, side, sp, starlight_base(true)) } else if sp == ids.wildfire { damage_power(enc, side, sp, 2.0 * amt(sp, "hit")) } else if sp == ids.siphon { damage_power(enc, side, sp, amt(sp, "hit")) }
            else if sp == ids.omen { damage_power(enc, side, sp, amt(sp, "hit")) } else if d.spells[sp].delay.is_some() { damage_power(enc, side, sp, amt(sp, "hit").max(amt(sp, "impact"))) }
            else if d.spells[sp].poison.is_some() { damage_power(enc, side, sp, d.spells[sp].poison.unwrap().0) } else { attack_power(enc, s, side, a) };
        if power > flat + EPS { return true; }
    }
    false
}

/// finish(): the result always; settlement and follow-ups only for a public (non-search) state.
pub fn finish(enc: &Encounter, s: &mut State, public: Option<&mut Public>, outcome: Outcome, reason: Reason, winner: Option<usize>, tiebreak: bool) {
    if s.result.is_some() { return; }
    s.result = Some(FightResult { outcome, reason, round: s.round, winner: winner.map(|w| w as u8), tiebreak });
    let Some(p) = public else { return; };
    let d = data();
    // The settlement is the fight's summary, worked out on a copy: the fight itself keeps its last numbers (no Mana handed back
    // into its bars, its flux and pending Renown as they were), and the main game reads the ledger (setup/campaign.mjs settle).
    let s = &mut s.clone();
    let mut settlement = Vec::new();
    for side in 0..2 {
        let flux = s.actors[side].flux;
        let collected = gain(enc, s, side, R_MANA, flux);
        s.actors[side].flux = 0.0;
        let pr = s.actors[side].pending_renown;
        let award = gain(enc, s, side, R_RENOWN, pr);
        s.actors[side].pending_renown = 0.0;
        let mut m = Map::new();
        for (k, name) in RESOURCES.iter().enumerate() {
            let x = &mut s.actors[side];
            let entry = enc.sides[side].entry[k];
            let before = x.res[k];
            let loss = 0f64.max(entry - before);
            let refund = if k == R_ALIGNMENT || k == R_CROWNS { 0.0 } else { (loss * enc.rebates[k] + EPS).floor() };
            let fin = before + refund;
            x.res[k] = fin;
            let mut row = Map::new();
            for (key, v) in [("entry", entry), ("spent", x.spent[k]), ("restored", x.restored[k]), ("before", before), ("refund", refund), ("final", fin), ("netLoss", entry - fin)] { row.insert(key.into(), json!(v)); }
            if k == R_MANA { row.insert("fluxCollected".into(), json!(collected)); row.insert("fluxDiscarded".into(), json!(flux - collected)); }
            if k == R_RENOWN { row.insert("earnedAtSettlement".into(), json!(award)); }
            m.insert(name.to_string(), Value::Object(row));
        }
        settlement.push(Value::Object(m));
    }
    p.settlement = Some(Value::Array(settlement));
    p.follow_ups = Some(if p.reports.is_empty() { json!([]) } else {
        json!([{ "type": "forbidden_cast_report", "casts": p.reports.iter().map(|(side, sp, round)| json!({"side": side, "spell": d.spells[*sp].id, "round": round})).collect::<Vec<_>>() }])
    });
}

fn resolve(enc: &Encounter, s: &mut State, public: Option<&mut Public>) {
    let d = data();
    let k = &d.acts;
    let ids = &d.ids;
    let mut ctx = Ctx { hurt_now: [false; 2], mend_now: [0.0; 2], bursts: Hits::default(), public, tried: [false; 2], dealt: [false; 2], paid: [0.0; 2] };
    if let Some(p) = ctx.public.as_mut() { p.events.clear(); }
    let hp_before = [s.actors[0].hp, s.actors[1].hp];
    let spent_before = [s.actors[0].spent[R_MANA], s.actors[1].spent[R_MANA]];
    s.last_pair = Some([s.pending[0].unwrap(), s.pending[1].unwrap()]);
    macro_rules! pair { () => { s.last_pair.as_mut().unwrap() } }
    // A compelled side plays its captured move (its only legal one); recomputed so a stale commitment can't slip through.
    for side in 0..2 { if s.actors[side].freeze_until < s.round && !has(s, side, Eff::Bound) && has(s, side, Eff::Compelled) { let r = replay(enc, s, side); pair!()[side] = r; } }
    // Countertempo is read before this exchange's casts (Haste's own first cast doesn't trigger it; a recast while active does).
    let committed = s.last_pair.unwrap();
    let hasted = [0, 1].map(|side| hasted_impulse(s, side, committed[side]));
    let special = |a: Act| a == k.cancel || a == k.frozen || a == k.break_free;
    // 1. Payment. A move no longer affordable (a forced replay) is a lost turn.
    for side in 0..2 {
        let id = pair!()[side];
        if special(id) { continue; }
        if unavailable(enc, s, side, id).is_some() { pair!()[side] = k.cancel; continue; }
        ctx.paid[side] = pay(enc, s, &mut ctx, side, id);
    }
    let paid_for = s.last_pair.unwrap();
    let hasted = [0, 1].map(|side| hasted[side] && paid_for[side] != k.cancel);
    // 2. Own preparations, both sides, before any hostile application. A mature Lodestar wards its holder this exchange.
    for side in 0..2 { if has(s, side, Eff::Lodestar) { let r = s.round; put(s, side, Eff::Ward, 1.0, r, Some(r)); } }
    let mut attacks = Hits::default();
    for side in 0..2 { let id = pair!()[side]; if !special(id) { prepared(enc, s, &mut ctx, side, id, &mut attacks); } }
    // 3. Attacks.
    for side in 0..2 {
        let id = pair!()[side];
        if id == k.strike || hasted[side] {
            let power = attack_power(enc, s, side, k.strike);
            attacks.push(Hit { spell: false, ..hit(side, k.strike, power) });
        }
        if let Some(sp) = spell_of(id) {
            let spell = &d.spells[sp];
            if spell.damage.is_some() && !spell.channel {
                let p = attack_power(enc, s, side, id);
                let n = spell.hits;
                if n > 1 {
                    // A swarm (world expansion 1): many small hits; only the first meets Parry and Brace.
                    let each = js_round(p / n as f64).max(1.0);
                    for i in 0..n { attacks.push(Hit { spell: !spell.physical, pierce_guard: i > 0, pierce_brace: i > 0, ..hit(side, id, each) }); }
                } else { attacks.push(Hit { hot: spell.rule == ids.flame, spell: !spell.physical, ..hit(side, id, p) }); }
            }
        }
        // The worn kit (world expansion 1): each cast of some spells also deals spell damage (blockable, wardable); a foe who
        // parries, wards or braces against this side takes Impact damage.
        if let Some(sp) = spell_of(id) { let oc = enc.sides[side].on_cast[sp]; if oc > EPS { attacks.push(hit(side, id, oc)); } }
        let od = enc.sides[side].on_defend;
        if od > EPS {
            let opp = pair!()[1 - side];
            if !special(opp) && (opp == k.guard || d.rule(opp) == ids.ward as Act || d.rule(opp) == ids.brace as Act) { attacks.push(Hit { spell: false, fixed: true, ..hit(side, k.strike, od) }); }
        }
    }
    // Attacking breaks your own Shadowstep before this exchange's hits land (an automatic Impulse too); with breakOnCast, so does
    // casting any other spell but Ward. Refocus that recovers Mana exposes the caster for this whole damage phase.
    for side in 0..2 { if let Some(sp) = spell_of(pair!()[side]) { if d.spells[sp].exposes || (d.skill.shadowstep_break_on_cast && d.spells[sp].rule != ids.shadowstep && d.spells[sp].rule != ids.ward) { delete(s, side, Eff::Shadowstep); } } }
    for side in 0..2 { if attacks.iter().any(|h| h.source as usize == side && h.target as usize != side && h.power > 0.0) { delete(s, side, Eff::Shadowstep); } }
    for side in 0..2 {
        if pair!()[side] == k.reclaim {
            let x = &s.actors[side];
            if x.flux.min(enc.sides[side].capacity - x.res[R_MANA]) > EPS { delete(s, side, Eff::Shadowstep); }
        }
    }
    // 4. Hostile applications: both Compels cancel out (as before); the rest land, are blocked or come back.
    let mana_before = [s.actors[0].res[R_MANA], s.actors[1].res[R_MANA]];
    let compel = ids.compel as Act;
    let both_compel = pair!()[0] == compel && pair!()[1] == compel;
    if both_compel { ctx.event(|| Event::CompelsCancel); }
    for side in 0..2 { let id = pair!()[side]; if !(both_compel && id == compel) { apply_hostile(enc, s, &mut ctx, side, id, mana_before); } }
    // 5. Torment's tolls: 2 × the ready Mana its holder paid for this exchange's move, inevitable.
    for side in 0..2 {
        if !has(s, side, Eff::Torment) { continue; }
        let e = s.actors[side].effects[Eff::Torment as usize].unwrap();
        let v = e.value * ctx.paid[side];
        if v > EPS {
            let src = e.source.unwrap_or(1 - side as u8);
            attacks.push(Hit { source: src, target: side as u8, id: ids.torment as Act, power: v, spell: true, inevitable: true, ..Default::default() });
            ctx.event(|| Event::TormentCharged { value: v, side: side as u8 });
        }
    }
    for i in 0..attacks.len() {
        if attacks.as_slice()[i].id as usize != ids.hoarfrost { continue; }
        let cold_target = attacks.as_slice()[i].target;
        let any_hot = attacks.iter().any(|h| h.source == cold_target && h.hot);
        if any_hot {
            attacks.as_mut_slice()[i].power = 0.0;
            for h in attacks.as_mut_slice() { if h.source == cold_target && h.hot { h.power = 0.0; } }
            ctx.event(|| Event::HoarfrostCancel);
        }
    }
    hits(enc, s, &mut ctx, &attacks);
    if terminal(enc, s, &mut ctx) { return; }
    for side in 0..2 {
        if pair!()[side] == k.reclaim {
            let flux = s.actors[side].flux;
            let n = gain(enc, s, side, R_MANA, flux);
            s.actors[side].flux = 0.0;
            ctx.event(|| Event::Reclaimed { side: side as u8, amount: n });
        }
    }
    let mut endings = Hits::default();
    for side in 0..2 {
        let round = s.round;
        for o in s.actors[side].omens.iter() {
            if o.due != round { continue; }
            let sp = o.spell;
            endings.push(Hit { spell: !o.impact, reflected: o.bounced, ward_pierce: amt(sp, "wardPierce"), pierce_guard: amt(sp, "guardPierce") >= 1.0, pierce_brace: amt(sp, "bracePierce") >= 1.0, ..hit(side, sp as Act, o.power) });
        }
        s.actors[side].omens.retain(|o| o.due > round);
        let cs = s.actors[side].constructs;
        for c in cs.iter() {
            let spec = &d.constructs[c.kind];
            if spec.action == ConstructAction::Heal { heal(enc, s, side, c.power); }
            else { endings.push(Hit { spell: spec.action != ConstructAction::Strike, ..hit(side, c.spell as Act, c.power) }); }
        }
    }
    hits(enc, s, &mut ctx, &endings);
    // A construct gets its final public tick before lifetime expiry and its burst.
    for side in 0..2 {
        let round = s.round;
        let mut expired: Small<ConstructI, 3> = Small::default();
        for c in s.actors[side].constructs.iter() { if c.expires <= round { expired.push(*c); } }
        s.actors[side].constructs.retain(|c| !(c.expires <= round));
        for c in expired.iter() { end_construct(enc, s, &mut ctx, side, *c); }
    }
    hits(enc, s, &mut ctx, &Hits::default());
    if terminal(enc, s, &mut ctx) { return; }
    // Poison (Venom): a tick this exchange and the next, inevitable, as the poisoner's hit; before Mend.
    let mut venom = Hits::default();
    let venom_id = d.spells.iter().position(|x| x.poison.is_some()).map_or(k.strike, |i| i as Act);
    for side in 0..2 {
        if !has(s, side, Eff::Poison) { continue; }
        let e = s.actors[side].effects[Eff::Poison as usize].unwrap();
        let src = e.source.unwrap_or(1 - side as u8);
        venom.push(Hit { source: src, target: side as u8, id: venom_id, power: e.value, spell: true, inevitable: true, ..Default::default() });
    }
    hits(enc, s, &mut ctx, &venom);
    if terminal(enc, s, &mut ctx) { return; }
    for side in 0..2 { if ctx.mend_now[side] > 0.0 && !ctx.hurt_now[side] { let m = ctx.mend_now[side]; heal(enc, s, side, m); } }
    // A mature Lodestar heals after this exchange's damage (Heartprice and a creature's nature still forbid it).
    for side in 0..2 { if has(s, side, Eff::Lodestar) { let v = s.actors[side].effects[Eff::Lodestar as usize].unwrap().value; heal(enc, s, side, v); } }
    for side in 0..2 {
        let id = pair!()[side];
        s.actors[side].last_action = Some(id);
        // Tailwind's chain: one more after a Tailwind actually cast, gone after any other move.
        if id == ids.tailwind as Act { let n = s.actors[side].effects[Eff::Tailwind as usize].map_or(0.0, |e| e.value) + 1.0; let r = s.round; put(s, side, Eff::Tailwind, n, r, None); }
        else { delete(s, side, Eff::Tailwind); }
        if s.actors[side].effects[Eff::Compelled as usize].map_or(true, |e| e.until.map_or(false, |u| u <= s.round)) { s.actors[side].captured = None; }
        let round = s.round;
        for e in s.actors[side].effects.iter_mut() { if let Some(x) = e { if x.until.map_or(false, |u| u <= round) { *e = None; } } }
    }
    s.early_commit = s.early_commit.map(|n| 0.max(n - 1));
    for side in 0..2 {
        if pair!()[side] == ids.foresight as Act {
            s.early_commit[1 - side] = d.spells[ids.foresight].duration.as_ref().unwrap()[(rank(enc, side, ids.foresight) - 1) as usize] as i32;
        }
    }
    for side in 0..2 {
        let x = &mut s.actors[side];
        x.urge = if ctx.dealt[side] { 0.0 } else if ctx.tried[side] { x.urge / 2.0 } else { URGE_MAX.min(x.urge + URGE_STEP) };
    }
    let quiet = (0..2).all(|i| (s.actors[i].hp - hp_before[i]).abs() < 1e-9 && (s.actors[i].spent[R_MANA] - spent_before[i]).abs() < 1e-9);
    // A pending Lodestar that would still heal holds the quiet count: no decision on points before it matures (plan §9).
    let waiting = (0..2).any(|i| lodestar_pending(s, i) && s.actors[i].hp < s.actors[i].max_hp - EPS && !enc.sides[i].no_heal && !has(s, i, Eff::Heartprice));
    s.quiet = if !quiet { 0 } else if waiting { s.quiet } else { s.quiet + 1 };
    if s.quiet >= d.skill.decision_quiet || s.round >= d.skill.decision_max {
        let f = [s.actors[0].hp / s.actors[0].max_hp, s.actors[1].hp / s.actors[1].max_hp];
        if (f[0] - f[1]).abs() < 1e-9 { finish(enc, s, ctx.public.as_deref_mut(), Outcome::Draw, Reason::Stalemate, None, false); }
        else { let w = if f[0] > f[1] { 0 } else { 1 }; finish(enc, s, ctx.public.as_deref_mut(), if w == 0 { Outcome::Win } else { Outcome::Lose }, Reason::Decision, Some(w), false); }
        return;
    }
    s.round += 1;
    s.normal_leader = 1 - s.normal_leader;
    s.leader = if (s.early_commit[0] > 0) == (s.early_commit[1] > 0) { s.normal_leader } else if s.early_commit[0] > 0 { 0 } else { 1 };
    s.pending = [None, None];
    if !can_damage(enc, s, 0) && !can_damage(enc, s, 1) { finish(enc, s, ctx.public.as_deref_mut(), Outcome::Draw, Reason::Stalemate, None, false); }
}

pub struct Applied { pub resolved: bool, pub round: i32, pub leader: u8, pub committed: [Option<Act>; 2] }

/// Commit an action already known to be legal (search, or after validation). Resolves when both have committed.
pub fn apply_known(enc: &Encounter, s: &mut State, a: Act, public: Option<&mut Public>) -> Applied {
    let side = actor_to_move(s).expect("fight ended");
    s.pending[side] = Some(a);
    let (round, leader, committed) = (s.round, s.leader, s.pending);
    if s.pending[0].is_some() && s.pending[1].is_some() {
        resolve(enc, s, public);
        return Applied { resolved: true, round, leader, committed };
    }
    Applied { resolved: false, round, leader, committed }
}

/// Public applyChoice: validates, then commits.
pub fn apply_choice(enc: &Encounter, s: &mut State, a: Act, public: &mut Public) -> Result<Applied, String> {
    if actor_to_move(s).is_none() { return Err("Fight ended".into()); }
    if !legal_actions(enc, s).as_slice().contains(&a) { return Err(format!("Illegal or unaffordable action: {}", data().name(a))); }
    Ok(apply_known(enc, s, a, Some(public)))
}

pub fn concede(enc: &Encounter, s: &mut State, side: usize, public: &mut Public) {
    finish(enc, s, Some(public), if side == 0 { Outcome::Lose } else { Outcome::Win }, Reason::Conceded, Some(1 - side), false);
}
