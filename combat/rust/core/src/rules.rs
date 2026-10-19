// The combat rules (F5). Same order of operations as the former engine.mjs so results are bit-identical.
use crate::data::{data, Act, ConstructAction, R_ALIGNMENT, R_CROWNS, R_HEALTH, R_MANA, R_RENOWN, RESOURCES};
use crate::state::*;
use serde_json::{json, Map, Value};

pub const EPS: f64 = 1e-9;
/// Brace blocks 100%, then 50%, 25% and 25% of opposing damage.
pub const BRACE_BLOCK: [f64; 4] = [1.0, 0.5, 0.25, 0.25];
/// The special spells' amounts live in the roster (`amounts`, setup/roster.mjs): Wildfire's hold, self, release and perHold
/// (Hold deals `hold` and costs the caster `self` unscaled; the Release deals `release` + `perHold` a Hold), Siphon's hit,
/// Moonwell's and Lodestar's bank, Omen's hit.
#[inline] fn amt(sp: usize, key: &str) -> f64 { data().amt(sp, key) }
pub const STRIKE_DAMAGE: f64 = 9.0;
pub const DECISION_QUIET_EXCHANGES: i32 = 10;
/// A fight that is never quiet (both sides hurt and heal) is called on points after this many exchanges.
pub const DECISION_MAX_EXCHANGES: i32 = 60;
pub const STARLIGHT_RELEASE: f64 = 30.0;
pub const STARLIGHT_CHARGED: f64 = 48.0;
pub const PURIFY_MANA: f64 = 24.0;
pub const TORMENT_TOLL: f64 = 8.0;
pub const EXTRACTION_MANA: f64 = 9.0;
pub const TAILWIND_STEP: f64 = 3.0;
/// Tailwind's bonus per consecutive Strike: the roster's damage for Tailwind when given, else TAILWIND_STEP.
/// Starlight's Release base damage: straight away, or after at least one Hold (the roster's `release`, else the constants).
pub fn starlight_base(charged: bool) -> f64 { let d = data(); let r = d.spells[d.ids.starlight].release.as_ref(); if charged { r.and_then(|v| v.get(1).copied()).unwrap_or(STARLIGHT_CHARGED) } else { r.and_then(|v| v.first().copied()).unwrap_or(STARLIGHT_RELEASE) } }
pub fn tailwind_step() -> f64 { let d = data(); d.spells[d.ids.tailwind].damage.as_ref().map_or(TAILWIND_STEP, |v| v[0]) }

/// JS Math.round: halves round toward +infinity.
#[inline]
pub fn js_round(x: f64) -> f64 { let f = x.floor(); if x - f >= 0.5 { f + 1.0 } else { f } }

#[derive(Clone, Copy, Default)]
/// `ward_pierce`: the share of a spell hit that gets through Ward (0: Ward stops it all); `pierce_brace`: Brace doesn't reduce it.
pub struct Hit { pub source: u8, pub target: u8, pub id: Act, pub power: f64, pub spell: bool, pub fixed: bool, pub pierce_guard: bool, pub reflected: bool, pub hot: bool, pub ward_pierce: f64, pub pierce_brace: bool }
pub type Hits = Small<Hit, 40>;

/// Scratch for one resolve (the former module-level hurtNow/mendNow and s.bursts).
/// tried / dealt: whether each side aimed damage at the other this exchange, and whether any landed (the urge, F5.9d).
struct Ctx<'p> { hurt_now: [bool; 2], mend_now: [f64; 2], bursts: Hits, public: Option<&'p mut Public>, tried: [bool; 2], dealt: [bool; 2] }
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
/// The most Renown a side can win in one fight from Glamour and Rapport together (F5.9d): 2.5 × what one Glamour of theirs earns
/// (Glamour I's when they don't know it). Their casts stack up to it.
pub const RENOWN_CAP_GLAMOURS: f64 = 2.5;
pub fn renown_cap(enc: &Encounter, side: usize) -> f64 {
    let d = data(); let g = d.ids.glamour;
    let lv = rank(enc, side, g).max(1) as usize;
    RENOWN_CAP_GLAMOURS * d.spells[g].renown.as_ref().map_or(0.0, |v| v[(lv - 1).min(v.len() - 1)])
}
/// Renown still to be won this fight from Glamour and Rapport.
pub fn renown_room(enc: &Encounter, s: &State, side: usize) -> f64 { 0f64.max(renown_cap(enc, side) - s.actors[side].pending_renown) }
/// The urge to deal damage (F5.9d): + URGE_STEP each exchange a side deals no damage, up to URGE_MAX; 0 when it deals some; halved
/// when its damage is all blocked. In the AI policy's points (as a persona's tilt), × the preset's tiltScale.
pub const URGE_STEP: f64 = 3.0;
pub const URGE_MAX: f64 = 18.0;
/// amount(): base × skill factor (× combat scale when physical). `spell` = None means Strike.
#[inline]
pub fn amount(enc: &Encounter, side: usize, spell: Option<usize>, base: f64, physical: bool) -> f64 {
    let n = data().acts.n_spells;
    base * enc.sides[side].factor[spell.unwrap_or(n)] * (if physical { enc.combat_scale } else { 1.0 })
}
#[inline]
pub fn damage_power(enc: &Encounter, side: usize, spell: usize, base: f64) -> f64 { js_round(amount(enc, side, Some(spell), base, true) * enc.damage_multiplier) }

pub fn attack_power(enc: &Encounter, _s: &State, side: usize, a: Act) -> f64 {
    let d = data();
    let (spell, base) = if a == d.acts.strike { (None, Some(d.skill.strike_damage)) } else {
        match spell_of(a) { Some(sp) => (Some(sp), d.spells[sp].damage.as_ref().and_then(|v| v.get((rank(enc, side, sp) - 1) as usize).copied())), None => (None, None) }
    };
    match base {
        None => 0.0,
        Some(b) => js_round(amount(enc, side, spell, b, true) * enc.damage_multiplier),
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

/// available(): None when the action can be taken, else the reason shown to the player.
pub fn unavailable(enc: &Encounter, s: &State, side: usize, a: Act) -> Option<&'static str> {
    let d = data();
    let k = &d.acts;
    let x = &s.actors[side];
    if x.freeze_until >= s.round { return if a == k.frozen { None } else { Some("Frozen this exchange") }; }
    if a == k.frozen || a == k.cancel { return Some("Not an available action"); }
    let hold_or_release = a == k.hold || a == k.release;
    if x.channel.is_some() && !hold_or_release { return Some("Hold or Release while channeling"); }
    if x.channel.is_none() && hold_or_release { return Some("Not channeling"); }
    if x.channel.is_none() && has(s, side, Eff::Haste) {
        let count = x.effects[Eff::Haste as usize].unwrap().value as usize;
        if !k.bundles_by_count[count].contains(&a) { return Some("Haste requires one basic-action bundle"); }
    } else if k.is_bundle[a as usize] { return Some("No Haste bundle available"); }
    if let Some(sp) = spell_of(a) {
        if !enc.sides[side].learned[sp] { return Some("Not learned"); }
        if !d.spells[sp].castable { return Some("Cards/story only"); }
    }
    if !blood(s, side, a) && x.res[R_MANA] + EPS < cost(enc, s, side, a) { return Some("Not enough ready Mana"); }
    if x.hp + EPS < hp_cost(enc, s, side, a) { return Some("Not enough HP"); }
    None
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
    // Compelled (F5.9b): the only move is the replayed one (a cancelled turn when it can't be repeated), known to both sides.
    else if has(s, side, Eff::Compelled) { out.push(replay(enc, s, side)); }
    else if x.channel.is_some() { consider(k.hold); consider(k.release); }
    else if has(s, side, Eff::Haste) { for &b in &k.bundles_by_count[x.effects[Eff::Haste as usize].unwrap().value as usize] { consider(b); } }
    else { consider(k.strike); consider(k.guard); consider(k.reclaim); for &(sp, _) in &enc.sides[side].kit { consider(sp as Act); } }
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
fn heal(enc: &Encounter, s: &mut State, side: usize, n: f64) -> f64 {
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
fn pay(enc: &Encounter, s: &mut State, ctx: &mut Ctx, side: usize, a: Act) {
    let d = data();
    let c = cost(enc, s, side, a);
    let h = hp_cost(enc, s, side, a);
    if blood(s, side, a) { reduce_hp(enc, s, ctx, side, h, false); } else {
        let paid = debit(&mut s.actors[side], R_MANA, c);
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
}
fn summon(enc: &Encounter, s: &mut State, ctx: &mut Ctx, side: usize, sp: usize) {
    let d = data();
    let ids = &d.ids;
    let x = &s.actors[side];
    let coexist = (sp == ids.bramble && x.constructs.iter().any(|c| c.spell == ids.heartwood)) || (sp == ids.heartwood && x.constructs.iter().any(|c| c.spell == ids.bramble));
    let before = x.constructs;
    let mut keep: Small<ConstructI, 3> = Small::default();
    if coexist { for c in before.iter() { if c.spell != sp { keep.push(*c); } } }
    for (i, c) in before.iter().enumerate() {
        let kept = coexist && c.spell != sp;
        let _ = i;
        if !kept { end_construct(enc, s, ctx, side, *c); }
    }
    let kind = d.spells[sp].construct.unwrap();
    let spec = &d.constructs[kind];
    let power = if spec.action == ConstructAction::Heal { amount(enc, side, Some(sp), spec.power, true) } else { damage_power(enc, side, sp, spec.power) };
    let c = ConstructI { spell: sp, kind, power, reduction: amount(enc, side, Some(sp), spec.reduction, true), threshold: amount(enc, side, Some(sp), spec.threshold, true), taken: 0.0, expires: s.round + spec.max_exchanges - 1 };
    keep.push(c);
    s.actors[side].constructs = keep;
}
/// Ward committed this exchange or an active Shadowstep stops every opposing spell effect.
fn shielded(s: &State, side: usize) -> bool {
    let ward = data().ids.ward as Act;
    s.actors[side].freeze_until < s.round && (s.last_pair.map_or(false, |p| p[side] == ward) || has(s, side, Eff::Shadowstep))
}
#[inline]
fn hit(source: usize, id: Act, power: f64) -> Hit { Hit { source: source as u8, target: 1 - source as u8, id, power, spell: true, ..Default::default() } }

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
            if s.actors[t].freeze_until >= s.round { if opposing { ctx.event(|| Event::Hit { id: hid, raw, amount: 0.0, target: htgt, source: hsrc, by: DEF_FROZEN, reflected: hrefl }); } continue; }
            if !h.fixed && has(s, t, Eff::Shadowstep) { if opposing { ctx.event(|| Event::Hit { id: hid, raw, amount: 0.0, target: htgt, source: hsrc, by: DEF_SHADOWSTEP, reflected: hrefl }); } continue; }
            if h.spell && h.source != h.target && has(s, t, Eff::Reflect) && !h.reflected {
                ctx.event(|| Event::Hit { id: hid, raw, amount: 0.0, target: htgt, source: hsrc, by: DEF_REFLECT, reflected: false });
                queue.push(Hit { source: h.target, target: h.source, reflected: true, ..*h });
                continue;
            }
            if !h.fixed {
                // Guard's value is the share of a Strike it stops: 1, or less when it repeats the last exchange's Guard (fatigue).
                if has(s, t, Eff::Guard) && !h.pierce_guard {
                    let g = s.actors[t].effects[Eff::Guard as usize].unwrap().value;
                    n *= if h.spell { 1.0 / 2.0 } else { 1.0 - g };
                    by |= DEF_GUARD | if !h.spell && g < 1.0 - EPS { DEF_GUARD_TIRED } else { 0 };
                }
                if n > EPS && opposing && has(s, t, Eff::Ward) && h.ward_pierce < 1.0 - EPS { n = if h.spell { n * h.ward_pierce } else { n / 2.0 }; by |= DEF_WARD; }
                if n > EPS && opposing && !h.pierce_brace && has(s, t, Eff::Brace) {
                    let from = s.actors[t].effects[Eff::Brace as usize].unwrap().from;
                    n *= 1.0 - BRACE_BLOCK[3.min((s.round - from) as usize)];
                    by |= DEF_BRACE;
                }
                let reduction = s.actors[t].constructs.iter().fold(0.0, |sum, c| sum + c.reduction);
                if n > EPS && reduction > EPS { by |= DEF_CONSTRUCT; }
                n = 0f64.max(n - reduction);
            }
            // Lodestar shields while it is held (F5.9c): opposing hits draw on the bank before the Release turns it on.
            if n > EPS && !h.fixed && opposing {
                if let Some(mut c) = s.actors[t].channel { if c.spell == d.ids.lodestar && c.bank > EPS {
                    let used = n.min(c.bank); n -= used; c.bank -= used; by |= DEF_LODESTAR; s.actors[t].channel = Some(c);
                } }
            }
            if n > EPS && !h.fixed {
                if let Some(mut l) = s.actors[t].effects[Eff::Lodestar as usize] {
                    let used = n.min(l.value);
                    n -= used;
                    l.value -= used;
                    by |= DEF_LODESTAR;
                    s.actors[t].effects[Eff::Lodestar as usize] = if l.value <= EPS { None } else { Some(l) };
                }
            }
            let actual = reduce_hp(enc, s, ctx, t, 0f64.max((n - EPS).ceil()), true);
            if opposing { ctx.event(|| Event::Hit { id: hid, raw, amount: actual, target: htgt, source: hsrc, by, reflected: hrefl }); }
            if actual > EPS {
                if h.source != h.target { expose[h.source as usize] = true; ctx.dealt[h.source as usize] = true; }
                let src = h.source as usize;
                if h.id as usize == d.ids.siphon {
                    if let Some(c) = s.actors[src].channel.as_mut() { if c.spell == d.ids.siphon { c.total += actual; } }
                }
                if has(s, t, Eff::Eclipse) { gain(enc, s, t, R_MANA, 2.0 * actual); }
                let (id, target, source, reflected) = (h.id, h.target, h.source, h.reflected);
                ctx.event(|| Event::Dealt { id, amount: actual, target, source, reflected });
            }
        }
        for side in 0..2 { if expose[side] { delete(s, side, Eff::Shadowstep); } }
    }
}

/// The share of a Strike this side's Guard stops: all of it, or 1 − the tuning's repeatLeak when it also guarded within the
/// last `lookback` exchanges (Guard fatigue).
pub fn guard_block(s: &State, side: usize) -> f64 {
    let d = data();
    let g = s.actors[side].guard_round;
    if g > 0 && s.round - g <= d.skill.guard_lookback { 1.0 - d.skill.guard_repeat_leak } else { 1.0 }
}

fn prepared(enc: &Encounter, s: &mut State, ctx: &mut Ctx, side: usize, a: Act, attacks: &mut Hits) {
    let d = data();
    let ids = &d.ids;
    let k = &d.acts;
    let guard = guard_block(s, side);
    if k.is_bundle[a as usize] { if k.parts[a as usize].contains(&k.guard) { put(s, side, Eff::Guard, guard, s.round, Some(s.round)); s.actors[side].guard_round = s.round; } return; }
    if let Some(sp) = spell_of(a) {
        let spell = &d.spells[sp];
        if spell.construct.is_some() { summon(enc, s, ctx, side, sp); return; }
        if spell.channel {
            let bank = if sp == ids.moonwell { amount(enc, side, Some(sp), amt(sp, "bank"), false) } else if sp == ids.lodestar { amount(enc, side, Some(sp), amt(sp, "bank"), true) } else { 0.0 };
            s.actors[side].channel = Some(Channel { spell: sp, holds: 0, bank, total: 0.0 });
            if sp == ids.siphon { attacks.push(hit(side, a, damage_power(enc, side, sp, amt(sp, "hit")))); }
            if sp == ids.wildfire && amt(sp, "ignite") > 0.0 { attacks.push(Hit { hot: true, ..hit(side, a, damage_power(enc, side, sp, amt(sp, "ignite"))) }); }
            return;
        }
    }
    let r = |sp: usize| (rank(enc, side, sp) - 1) as usize;
    let round = s.round;
    if a == k.guard { put(s, side, Eff::Guard, guard, round, Some(round)); s.actors[side].guard_round = round; return; }
    if a == k.hold {
        let mut c = s.actors[side].channel.unwrap();
        c.holds += 1;
        if c.spell == ids.moonwell { c.bank += amount(enc, side, Some(c.spell), amt(c.spell, "bank"), false); }
        if c.spell == ids.lodestar { c.bank += amount(enc, side, Some(c.spell), amt(c.spell, "bank"), true); }
        s.actors[side].channel = Some(c);
        if c.spell == ids.wildfire {
            attacks.push(Hit { hot: true, ..hit(side, c.spell as Act, damage_power(enc, side, c.spell, amt(c.spell, "hold"))) });
            attacks.push(Hit { target: side as u8, fixed: true, hot: true, ..hit(side, c.spell as Act, amt(c.spell, "self")) });
        }
        if c.spell == ids.siphon { attacks.push(hit(side, c.spell as Act, damage_power(enc, side, c.spell, amt(c.spell, "hit")))); }
        return;
    }
    if a == k.release {
        let c = s.actors[side].channel.take().unwrap();
        if c.spell == ids.starlight { attacks.push(Hit { ward_pierce: if c.holds != 0 { amt(c.spell, "chargedWardPierce") } else { 0.0 }, ..hit(side, c.spell as Act, damage_power(enc, side, c.spell, starlight_base(c.holds != 0))) }); }
        // Wildfire's Release: the base, then the embers the Holds added, which get through Guard and Ward (F5.9c).
        if c.spell == ids.wildfire {
            attacks.push(Hit { hot: true, ..hit(side, c.spell as Act, damage_power(enc, side, c.spell, amt(c.spell, "release"))) });
            if c.holds > 0 { attacks.push(Hit { hot: true, pierce_guard: true, ward_pierce: 1.0, ..hit(side, c.spell as Act, damage_power(enc, side, c.spell, amt(c.spell, "perHold") * c.holds as f64)) }); }
        }
        if c.spell == ids.siphon { heal(enc, s, side, c.total); }
        if c.spell == ids.moonwell { gain(enc, s, side, R_MANA, c.bank); }
        if c.spell == ids.lodestar { put(s, side, Eff::Lodestar, c.bank, round, None); }
        return;
    }
    let Some(sp) = spell_of(a) else { return; };
    let spell = &d.spells[sp];
    if sp == ids.mend { ctx.mend_now[side] = amount(enc, side, Some(sp), spell.healing.as_ref().unwrap()[r(sp)], true); }
    else if sp == ids.ward { put(s, side, Eff::Ward, 1.0, round, Some(round)); }
    else if sp == ids.brace { put(s, side, Eff::Brace, 1.0, round, Some(round + 3)); }
    else if sp == ids.haste { put(s, side, Eff::Haste, spell.actions.as_ref().unwrap()[r(sp)], round + 1, Some(round + spell.duration.as_ref().unwrap()[r(sp)] as i32)); }
    else if sp == ids.shadowstep { put(s, side, Eff::Shadowstep, 1.0, round, Some(round + spell.duration.as_ref().unwrap()[r(sp)] as i32 - 1)); }
    else if sp == ids.glamour {
        // Casts stack (F5.9d), with Rapport's, up to renown_cap.
        if enc.observers { let n = spell.renown.as_ref().unwrap()[r(sp)].min(renown_room(enc, s, side)); s.actors[side].pending_renown += n; s.actors[side].glamour_done = true; }
    }
    else if sp == ids.seal { let blocked = shielded(s, 1 - side); let n = if blocked { 0.0 } else { s.actors[1 - side].flux }; if !blocked { s.actors[1 - side].flux = 0.0; } ctx.event(|| Event::Moved { side: side as u8, id: sp as Act, amount: n, blocked }); }
    else if sp == ids.omen { let power = damage_power(enc, side, sp, amt(sp, "hit")); s.actors[side].omens.push(Omen { due: round + 2, power }); }
    else if sp == ids.purify { let n = amount(enc, side, Some(sp), PURIFY_MANA, false); let got = gain(enc, s, side, R_MANA, n); ctx.event(|| Event::Moved { side: side as u8, id: sp as Act, amount: got, blocked: false }); }
    else if sp == ids.tailwind { put(s, side, Eff::Tailwind, 0.0, round + 1, Some(round + 3)); }
    else if sp == ids.rime { if !s.actors[side].rime_used { s.actors[side].rime_ready = true; } }
    else if sp == ids.reflect { let n = d.spells[sp].duration.as_ref().map_or(1, |v| v[r(sp).min(v.len() - 1)] as i32); put(s, side, Eff::Reflect, 1.0, round, Some(round + n - 1)); }
    else if sp == ids.torment {
        if !shielded(s, 1 - side) {
            let v = damage_power(enc, side, sp, TORMENT_TOLL);
            put(s, 1 - side, Eff::Torment, v, round, Some(round + 2));
            s.actors[1 - side].effects[Eff::Torment as usize].as_mut().unwrap().source = Some(side as u8);
        }
    }
    else if sp == ids.eclipse { put(s, side, Eff::Eclipse, 1.0, round, Some(round + 1)); }
    else if sp == ids.heartprice { put(s, side, Eff::Heartprice, 1.0, round, None); }
    // sleight, rapport and extraction resolve as simultaneous transfers before preparations.
}

fn replay(enc: &Encounter, s: &State, side: usize) -> Act {
    let k = &data().acts;
    match s.actors[side].last_action { Some(a) if unavailable(enc, s, side, a).is_none() => a, _ => k.cancel }
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
    if let Some(c) = x.channel {
        let base = if c.spell == ids.starlight { Some(48.0) } else if c.spell == ids.wildfire { Some(36.0) } else { None };
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
        if sp == ids.torment { return true; }
        if sp == ids.compel {
            if let Some(last) = target.last_action {
                if unavailable(enc, s, 1 - side, last).is_none() && hp_cost(enc, s, 1 - side, last) > 0.0 { return true; }
            }
        }
        if let Some(kind) = d.spells[sp].construct {
            let spec = &d.constructs[kind];
            if spec.action != ConstructAction::Heal && damage_power(enc, side, sp, spec.power) > flat + EPS { return true; }
        }
        let power = if sp == ids.starlight { damage_power(enc, side, sp, 36.0) } else if sp == ids.wildfire { damage_power(enc, side, sp, 24.0) } else if sp == ids.siphon { damage_power(enc, side, sp, 12.0) } else if sp == ids.omen { damage_power(enc, side, sp, 36.0) } else { attack_power(enc, s, side, a) };
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

fn parts_contain(a: Act, b: Act) -> bool { data().acts.parts[a as usize].contains(&b) }

fn resolve(enc: &Encounter, s: &mut State, public: Option<&mut Public>) {
    let d = data();
    let k = &d.acts;
    let ids = &d.ids;
    let mut ctx = Ctx { hurt_now: [false; 2], mend_now: [0.0; 2], bursts: Hits::default(), public, tried: [false; 2], dealt: [false; 2] };
    if let Some(p) = ctx.public.as_mut() { p.events.clear(); }
    let hp_before = [s.actors[0].hp, s.actors[1].hp];
    let spent_before = [s.actors[0].spent[R_MANA], s.actors[1].spent[R_MANA]];
    s.last_pair = Some([s.pending[0].unwrap(), s.pending[1].unwrap()]);
    macro_rules! pair { () => { s.last_pair.as_mut().unwrap() } }
    // Compel replays deterministic public history, never chooses an opponent menu.
    for side in 0..2 {
        if has(s, side, Eff::Compelled) && s.actors[side].freeze_until < s.round { let r = replay(enc, s, side); pair!()[side] = r; }
    }
    let compel = ids.compel as Act;
    let compels = [pair!()[0] == compel, pair!()[1] == compel];
    if compels[0] && compels[1] {
        for side in 0..2 { pay(enc, s, &mut ctx, side, compel); }
        pair!()[0] = k.cancel; pair!()[1] = k.cancel;
        ctx.event(|| Event::CompelsCancel);
    } else {
        for side in 0..2 {
            if !compels[side] { continue; }
            pay(enc, s, &mut ctx, side, compel);
            let target = 1 - side;
            if pair!()[target] == ids.ward as Act || has(s, target, Eff::Shadowstep) { continue; }
            // Locked for `duration` exchanges after this one (roster: Compel's duration).
            let lock = d.spells[ids.compel].duration.as_ref().map_or(2, |v| v[0] as i32);
            put(s, target, Eff::Compelled, 1.0, s.round + 1, Some(s.round + lock));
            // immediate (the default): it also rewrites this exchange's action, even one already committed in the open.
            if d.spells[ids.compel].immediate && s.actors[target].freeze_until < s.round { let r = replay(enc, s, target); pair!()[target] = r; }
        }
    }
    let mut attacks = Hits::default();
    let special = |a: Act| a == k.cancel || a == k.frozen || a == compel;
    for side in 0..2 {
        let id = pair!()[side];
        if !special(id) {
            // A replay can become unaffordable after another preparation; cancel safely.
            if unavailable(enc, s, side, id).is_some() { pair!()[side] = k.cancel; continue; }
            pay(enc, s, &mut ctx, side, id);
        }
        if has(s, side, Eff::Tailwind) && !k.parts[id as usize].iter().all(|&p| p == k.strike) { delete(s, side, Eff::Tailwind); }
    }
    // Own voluntary spending happens before theft.
    if enc.observers {
        for side in 0..2 {
            if pair!()[side] == ids.rapport as Act {
                let room = renown_room(enc, s, side);
                let x = &mut s.actors[side];
                let n = (10f64.min(x.res[R_CROWNS]).min(room * 2.0) / 2.0).floor() * 2.0;
                debit(x, R_CROWNS, n);
                x.pending_renown += n / 2.0;
            }
        }
    }
    let thefts: [f64; 2] = [0, 1].map(|side| if pair!()[side] == ids.sleight as Act { 8f64.min(s.actors[1 - side].res[R_CROWNS]).min(99999.0 - s.actors[side].res[R_CROWNS]) } else { 0.0 });
    for side in 0..2 { debit(&mut s.actors[1 - side], R_CROWNS, thefts[side]); }
    for side in 0..2 { gain(enc, s, side, R_CROWNS, thefts[side]); }
    // Extraction lands in the caster's flux; Mana plus flux can't exceed capacity. Ward and Shadowstep stop it.
    let transfers: [f64; 2] = [0, 1].map(|side| {
        if pair!()[side] == ids.extraction as Act && !shielded(s, 1 - side) {
            0f64.max(amount(enc, side, Some(ids.extraction), EXTRACTION_MANA, false).min(s.actors[1 - side].res[R_MANA]).min(enc.sides[side].capacity - s.actors[side].res[R_MANA] - s.actors[side].flux))
        } else { 0.0 }
    });
    for side in 0..2 { debit(&mut s.actors[1 - side], R_MANA, transfers[side]); }
    for side in 0..2 { if pair!()[side] == ids.extraction as Act { let (n, blocked) = (transfers[side], shielded(s, 1 - side)); ctx.event(|| Event::Moved { side: side as u8, id: ids.extraction as Act, amount: n, blocked }); } }
    for side in 0..2 { s.actors[side].flux += transfers[side]; }
    for side in 0..2 { let id = pair!()[side]; if !special(id) { prepared(enc, s, &mut ctx, side, id, &mut attacks); } }
    for side in 0..2 {
        let id = pair!()[side];
        for &part in &k.parts[id as usize] {
            if part == k.strike {
                let mut bonus = 0.0;
                if has(s, side, Eff::Tailwind) {
                    let e = s.actors[side].effects[Eff::Tailwind as usize].as_mut().unwrap();
                    e.value = 3f64.min(e.value + 1.0);
                    let v = e.value;
                    bonus = (amount(enc, side, Some(ids.tailwind), tailwind_step() * v, true) - EPS).ceil();
                }
                let power = attack_power(enc, s, side, k.strike);
                attacks.push(Hit { spell: false, ..hit(side, k.strike, power) });
                if bonus != 0.0 { attacks.push(Hit { spell: false, pierce_guard: true, ..hit(side, k.strike, bonus) }); }
            } else if let Some(sp) = spell_of(part) {
                if d.spells[sp].damage.is_some() { let p = attack_power(enc, s, side, part); attacks.push(Hit { hot: sp == ids.flame, spell: !d.spells[sp].physical, ..hit(side, part, p) }); }
            }
        }
        if has(s, side, Eff::Torment) && id != k.cancel && id != k.frozen && !shielded(s, side) {
            let v = s.actors[side].effects[Eff::Torment as usize].unwrap().value;
            if v > 0.0 { ctx.hurt_now[side] = true; }
            reduce_hp(enc, s, &mut ctx, side, v, false);
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
    // Attacking breaks your own Shadowstep before this exchange's hits land; with breakOnCast, so does casting any other spell but Ward.
    for side in 0..2 { if let Some(sp) = spell_of(pair!()[side]) { if d.spells[sp].exposes || (d.skill.shadowstep_break_on_cast && sp != ids.shadowstep && sp != ids.ward) { delete(s, side, Eff::Shadowstep); } } }
    for side in 0..2 { if attacks.iter().any(|h| h.source as usize == side && h.target as usize != side && h.power > 0.0) { delete(s, side, Eff::Shadowstep); } }
    // Reclaim exposes the caster for this whole damage phase, but pays out later.
    for side in 0..2 {
        if parts_contain(pair!()[side], k.reclaim) {
            let x = &s.actors[side];
            if x.flux.min(enc.sides[side].capacity - x.res[R_MANA]) > EPS { delete(s, side, Eff::Shadowstep); }
        }
    }
    hits(enc, s, &mut ctx, &attacks);
    if terminal(enc, s, &mut ctx) { return; }
    for side in 0..2 {
        if parts_contain(pair!()[side], k.reclaim) {
            let flux = s.actors[side].flux;
            let n = gain(enc, s, side, R_MANA, flux);
            s.actors[side].flux = 0.0;
            ctx.event(|| Event::Reclaimed { side: side as u8, amount: n });
        }
    }
    let mut endings = Hits::default();
    for side in 0..2 {
        let round = s.round;
        for o in s.actors[side].omens.iter() { if o.due == round { endings.push(Hit { ward_pierce: amt(ids.omen, "wardPierce"), pierce_guard: amt(ids.omen, "guardPierce") >= 1.0, pierce_brace: amt(ids.omen, "bracePierce") >= 1.0, ..hit(side, ids.omen as Act, o.power) }); } }
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
    for side in 0..2 { if ctx.mend_now[side] > 0.0 && !ctx.hurt_now[side] { let m = ctx.mend_now[side]; heal(enc, s, side, m); } }
    for side in 0..2 {
        let id = pair!()[side];
        s.actors[side].last_action = Some(id);
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
    s.quiet = if quiet { s.quiet + 1 } else { 0 };
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
