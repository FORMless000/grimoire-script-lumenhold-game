// The Engine's evaluation (F5.10): a small MLP over the hand eval's terms, distilled from deep searches (combat/lab: fit.py,
// weights in neural_weights.rs from tools/export-mlp.mjs). Antisymmetric by construction: v = scale · (g(x, s) − g(−x, s)) / 2,
// x the side-difference terms over their spread, s the side-symmetric inputs standardised, so swapping the fighters negates
// the score exactly. Finished fights keep ai::evaluate's scores.
use crate::ai;
use crate::data::{data, Act, ConstructAction, R_MANA};
use crate::neural_weights as nw;
use crate::rules::{attack_power, cost, has};
use crate::state::*;

pub const NF: usize = 24;
pub const NS: usize = 4;
const EXPECTED_HIT: f64 = 12.0;
fn left(s: &State, e: &Effect) -> f64 { 0.max(e.until.unwrap_or(s.round) - s.round.max(e.from) + 1) as f64 }

fn construct_hp(s: &State, c: &ConstructI) -> f64 {
    let spec = &data().constructs[c.kind];
    let life = 0.max(c.expires - s.round + 1) as f64;
    let ticks = life.min(0f64.max(((c.threshold - c.taken) / EXPECTED_HIT).ceil()));
    let per_tick = (if spec.action == ConstructAction::Heal { c.power } else { c.power * 0.75 }) + c.reduction;
    ticks * per_tick
}

/// ai::evaluate's influence terms one by one: Shadowstep, Haste, Brace, Heartprice, Rime, constructs, Omens, channel.
fn influence(enc: &Encounter, s: &State, side: usize, hp: f64) -> [f64; 8] {
    let ids = &data().ids;
    let a = &s.actors[side];
    let mut t = [0.0; 8];
    if has(s, side, Eff::Shadowstep) { t[0] = 12.0; }
    if has(s, side, Eff::Haste) { t[1] = 10.0; }
    // F5.11-plan.1: Brace takes its share off for its exchanges (was 100/50/25/25%; the trained weight reads the same term).
    if let Some(b) = a.effects[Eff::Brace as usize] { t[2] = b.value * EXPECTED_HIT * hp * left(s, &b); }
    if has(s, side, Eff::Heartprice) { t[3] = 3.0; }
    if a.rime_ready && !a.rime_used { t[4] = 8.0; }
    for c in a.constructs.iter() { t[5] += construct_hp(s, c) * hp; }
    for o in a.omens.iter() { t[6] += o.power * 0.5 / 1f64.max((o.due - s.round + 1) as f64); }
    if let Some(c) = a.channel {
        let banked = if c.spell == ids.moonwell { c.bank.min(enc.sides[side].capacity - a.res[R_MANA]) } else { c.bank.min(a.max_hp) };
        t[7] = banked * 0.12 + c.total * 0.6 + if c.spell == ids.starlight && c.holds != 0 { 10.0 } else { 0.0 };
    }
    t
}

/// The most one action can deal right now: Strike or an affordable damaging kit spell (before defences).
fn damage_now(enc: &Encounter, s: &State, side: usize) -> f64 {
    let mana = s.actors[side].res[R_MANA];
    let mut best = attack_power(enc, s, side, data().acts.strike);
    for &(sp, _) in &enc.sides[side].kit { let a = sp as Act; if cost(enc, s, side, a) <= mana + 1e-9 { best = best.max(attack_power(enc, s, side, a)); } }
    best
}

/// The side-difference terms (side 0 minus side 1): the hand eval's twelve, then ones it leaves out.
pub fn features(enc: &Encounter, s: &State) -> [f64; NF] {
    let (a, b) = (&s.actors[0], &s.actors[1]);
    let lead = a.hp / a.max_hp - b.hp / b.max_hp;
    let hp = 500.0 / (a.max_hp + b.max_hp) + 0.5;
    let mut f = [0.0; NF];
    f[0] = lead * 250.0;
    f[1] = (a.hp - b.hp) * 0.5;
    f[2] = (a.res[R_MANA] - b.res[R_MANA]) * enc.mana_weight * hp;
    f[3] = (a.flux - b.flux) * enc.flux_weight * hp;
    let (i0, i1) = (influence(enc, s, 0, hp), influence(enc, s, 1, hp));
    for k in 0..8 { f[4 + k] = i0[k] - i1[k]; }
    f[12] = if s.leader == 0 { 10.0 } else { -10.0 };
    f[13] = lead * lead.abs() * 250.0;
    f[14] = 10.0 * ((s.early_commit[1] > 0) as i32 - (s.early_commit[0] > 0) as i32) as f64;
    // A forced move (F5.11-plan.1: Bound's Breaking Free beside Compel's captured move) under the trained Compel term.
    let forced = |side: usize| (has(s, side, Eff::Compelled) || s.actors[side].effects[Eff::Bound as usize].map_or(false, |e| left(s, &e) > 0.0)) as i32;
    f[15] = 10.0 * (forced(1) - forced(0)) as f64;
    // The damage still to come past defences (F5.11-plan.1): Torment's toll at a typical 4 Mana a move, poison's ticks.
    let torment = |side: usize| { let a = &s.actors[side];
        a.effects[Eff::Torment as usize].filter(|_| has(s, side, Eff::Torment)).map_or(0.0, |e| e.value * 4.0) + a.effects[Eff::Poison as usize].map_or(0.0, |e| e.value * left(s, &e)) };
    f[16] = torment(1) - torment(0);
    f[17] = 10.0 * (has(s, 0, Eff::Reflect) as i32 - has(s, 1, Eff::Reflect) as i32) as f64;
    let lode = |side: usize| s.actors[side].effects[Eff::Lodestar as usize].map_or(0.0, |e| e.value);
    f[18] = (lode(0) - lode(1)) * hp;
    f[19] = 10.0 * (has(s, 0, Eff::Tailwind) as i32 - has(s, 1, Eff::Tailwind) as i32) as f64;
    // The knockout race, the decision clock, the Mana share, and damage on hand.
    let dmg = [damage_now(enc, s, 0), damage_now(enc, s, 1)];
    let ttk = |side: usize| s.actors[1 - side].hp / dmg[side].max(1.0);
    f[20] = 5.0 * (ttk(1) - ttk(0)).clamp(-20.0, 20.0);
    f[21] = lead * 250.0 * ((s.quiet - 4).max(0) as f64 / 6.0 + (s.round - 45).max(0) as f64 / 15.0);
    f[22] = 50.0 * (a.res[R_MANA] / enc.sides[0].capacity.max(1.0) - b.res[R_MANA] / enc.sides[1].capacity.max(1.0));
    f[23] = 0.5 * hp * (dmg[0] - dmg[1]);
    f
}

/// Inputs that don't change when the fighters swap: mean HP share, the exchange, the quiet count, mean Mana share.
pub fn symmetric(enc: &Encounter, s: &State) -> [f64; NS] {
    let (a, b) = (&s.actors[0], &s.actors[1]);
    [(a.hp / a.max_hp + b.hp / b.max_hp) / 2.0, s.round as f64 / 60.0, s.quiet as f64 / 10.0,
        (a.res[R_MANA] / enc.sides[0].capacity.max(1.0) + b.res[R_MANA] / enc.sides[1].capacity.max(1.0)) / 2.0]
}

fn g(x: &[f64; NF], sym: &[f64; NS], sign: f64) -> f64 {
    let m = NF + NS;
    let mut out = 0.0;
    for j in 0..nw::H {
        let row = &nw::W1[j * m..(j + 1) * m];
        let mut z = nw::B1[j];
        for i in 0..NF { z += row[i] * sign * x[i]; }
        for i in 0..NS { z += row[NF + i] * sym[i]; }
        if z > 0.0 { out += nw::W2[j] * z; }
    }
    out
}

/// Side 0's score, in the hand eval's points.
pub fn evaluate(enc: &Encounter, s: &State) -> f64 {
    if s.result.is_some() { return ai::evaluate(enc, s); }
    let f = features(enc, s);
    let sm = symmetric(enc, s);
    let mut x = [0.0; NF];
    for i in 0..NF { x[i] = f[i] / nw::XS[i]; }
    let mut sy = [0.0; NS];
    for i in 0..NS { sy[i] = (sm[i] - nw::SM[i]) / nw::SS[i]; }
    nw::SCALE * (g(&x, &sy, 1.0) - g(&x, &sy, -1.0)) / 2.0
}
