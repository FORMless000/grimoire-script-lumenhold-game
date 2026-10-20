// The core's evaluation split into terms, so weights can be fitted. With weights 1 on the first 12 terms and 0 on the
// rest, the sum is ai::evaluate (up to float summation order); no weights at all calls ai::evaluate itself.
use combat_core::ai;
use combat_core::data::{data, ConstructAction, R_MANA};
use combat_core::rules::{attack_power, cost, has};
use combat_core::state::*;

pub const NF: usize = 24;
/// Side-symmetric inputs (unchanged when the fighters swap), for the MLP only.
pub const NS: usize = 4;
pub type W = [f64; NF];
#[allow(dead_code)]
pub const NAMES: [&str; NF] = ["lead", "hp", "mana", "flux", "shadowstep", "haste", "brace", "heartprice", "rime", "constructs", "omens", "channel",
    "leader", "lead_sq", "foresight", "compelled", "torment", "reflect", "lodestar", "tailwind", "race", "clock", "mana_share", "damage"];

/// A one-hidden-layer MLP made antisymmetric: v = scale · (g(x, s) − g(−x, s)) / 2, x the side-difference terms over their
/// spread, s the symmetric inputs standardised. Swapping the fighters negates every x and keeps s, so v flips sign exactly.
#[derive(Clone)]
pub struct Mlp { pub h: usize, pub xs: [f64; NF], pub sm: [f64; NS], pub ss: [f64; NS], pub w1: Vec<f64>, pub b1: Vec<f64>, pub w2: Vec<f64>, pub scale: f64 }
#[derive(Clone)]
pub enum Ev { Hand, Lin(W), Mlp(Box<Mlp>) }
impl Mlp {
    fn g(&self, x: &[f64; NF], sym: &[f64; NS], sign: f64) -> f64 {
        let m = NF + NS;
        let mut out = 0.0;
        for j in 0..self.h {
            let row = &self.w1[j * m..(j + 1) * m];
            let mut z = self.b1[j];
            for i in 0..NF { z += row[i] * sign * x[i]; }
            for i in 0..NS { z += row[NF + i] * sym[i]; }
            if z > 0.0 { out += self.w2[j] * z; }
        }
        out
    }
    pub fn eval(&self, f: &W, sym: &[f64; NS]) -> f64 {
        let mut x = [0.0; NF];
        for i in 0..NF { x[i] = f[i] / self.xs[i]; }
        let mut s = [0.0; NS];
        for i in 0..NS { s[i] = (sym[i] - self.sm[i]) / self.ss[i]; }
        self.scale * (self.g(&x, &s, 1.0) - self.g(&x, &s, -1.0)) / 2.0
    }
}
pub fn base_weights() -> W { let mut w = [0.0; NF]; for x in w.iter_mut().take(12) { *x = 1.0; } w }

const EXPECTED_HIT: f64 = 12.0;
const BRACE_SHARE: [f64; 4] = [1.0, 0.5, 0.25, 0.25];

fn construct_hp(s: &State, c: &ConstructI) -> f64 {
    let spec = &data().constructs[c.kind];
    let life = 0.max(c.expires - s.round + 1) as f64;
    let ticks = life.min(0f64.max(((c.threshold - c.taken) / EXPECTED_HIT).ceil()));
    let per_tick = (if spec.action == ConstructAction::Heal { c.power } else { c.power * 0.75 }) + c.reduction;
    ticks * per_tick
}

/// The core's influence() per term: shadowstep, haste, brace, heartprice, rime, constructs, omens, channel.
fn influence(enc: &Encounter, s: &State, side: usize, hp: f64) -> [f64; 8] {
    let ids = &data().ids;
    let a = &s.actors[side];
    let mut t = [0.0; 8];
    if has(s, side, Eff::Shadowstep) { t[0] = 12.0; }
    if has(s, side, Eff::Haste) { t[1] = 10.0; }
    if let Some(b) = a.effects[Eff::Brace as usize] {
        let mut age = 0.max(s.round - b.from);
        while age < 4 { t[2] += BRACE_SHARE[age as usize] * EXPECTED_HIT * hp; age += 1; }
    }
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

pub fn features(enc: &Encounter, s: &State) -> W {
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
    // Extra terms the hand eval leaves out (weight 0 to start).
    f[12] = if s.leader == 0 { 10.0 } else { -10.0 };
    f[13] = lead * lead.abs() * 250.0;
    f[14] = 10.0 * ((s.early_commit[1] > 0) as i32 - (s.early_commit[0] > 0) as i32) as f64;
    f[15] = 10.0 * (has(s, 1, Eff::Compelled) as i32 - has(s, 0, Eff::Compelled) as i32) as f64;
    let torment = |side: usize| if has(s, side, Eff::Torment) { s.actors[side].effects[Eff::Torment as usize].unwrap().value } else { 0.0 };
    f[16] = torment(1) - torment(0);
    f[17] = 10.0 * (has(s, 0, Eff::Reflect) as i32 - has(s, 1, Eff::Reflect) as i32) as f64;
    let lode = |side: usize| s.actors[side].effects[Eff::Lodestar as usize].map_or(0.0, |e| e.value);
    f[18] = (lode(0) - lode(1)) * hp;
    f[19] = 10.0 * (has(s, 0, Eff::Tailwind) as i32 - has(s, 1, Eff::Tailwind) as i32) as f64;
    // The race: exchanges each side needs to knock the other out at its best affordable damage per exchange.
    let dmg = [damage_now(enc, s, 0), damage_now(enc, s, 1)];
    let ttk = |side: usize| s.actors[1 - side].hp / dmg[side].max(1.0);
    f[20] = 5.0 * (ttk(1) - ttk(0)).clamp(-20.0, 20.0);
    // The decision clock: near a call on points (10 quiet exchanges, or the exchange cap) the lead is the result.
    f[21] = lead * 250.0 * ((s.quiet - 4).max(0) as f64 / 6.0 + (s.round - 45).max(0) as f64 / 15.0);
    f[22] = 50.0 * (a.res[R_MANA] / enc.sides[0].capacity.max(1.0) - b.res[R_MANA] / enc.sides[1].capacity.max(1.0));
    f[23] = 0.5 * hp * (dmg[0] - dmg[1]);
    f
}

/// The most one action can deal right now: Strike or an affordable damaging kit spell (before defences).
fn damage_now(enc: &Encounter, s: &State, side: usize) -> f64 {
    let d = data();
    let mana = s.actors[side].res[R_MANA];
    let mut best = attack_power(enc, s, side, d.acts.strike);
    for &(sp, _) in &enc.sides[side].kit { let a = sp as combat_core::data::Act; if cost(enc, s, side, a) <= mana + 1e-9 { best = best.max(attack_power(enc, s, side, a)); } }
    best
}

pub fn symmetric(enc: &Encounter, s: &State) -> [f64; NS] {
    let (a, b) = (&s.actors[0], &s.actors[1]);
    [(a.hp / a.max_hp + b.hp / b.max_hp) / 2.0, s.round as f64 / 60.0, s.quiet as f64 / 10.0,
        (a.res[R_MANA] / enc.sides[0].capacity.max(1.0) + b.res[R_MANA] / enc.sides[1].capacity.max(1.0)) / 2.0]
}

#[inline]
pub fn evaluate(enc: &Encounter, s: &State, ev: &Ev) -> f64 {
    if s.result.is_some() { return ai::evaluate(enc, s); }
    match ev {
        Ev::Hand => ai::evaluate(enc, s),
        Ev::Lin(w) => { let f = features(enc, s); (0..NF).map(|i| f[i] * w[i]).sum() }
        Ev::Mlp(m) => m.eval(&features(enc, s), &symmetric(enc, s)),
    }
}
