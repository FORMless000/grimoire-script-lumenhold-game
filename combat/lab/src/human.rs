// Opponents meant to be beaten by reading them: a shallow search whose weakness lives in its beliefs, patience and goals,
// never in random bad moves. Pieces (all optional, combined by settings):
//   belief   at the other side's turns, an expectation over a model of that side (its moves seen this fight, decayed, plus a
//            softmax prior over the core's move ordering) instead of its best reply (expectimax vs minimax)
//   gamma    impatience: a line's value is the discounted average of the evals after each exchange, so early gains count more
//   blind    as follower, the chance of ignoring the telegraphed move and answering the model of it instead
//   rule     how the root's values become a move: best, softmax (temperature in points), or target (the move whose own win
//            chance σ(v/k) is nearest a target), within `regret` points of the best; persona tilt added before choosing
//   policy   no search at all: the core's move ordering values plus tilt
//   abDepth  root values from a real alpha-beta search (pruned, transposition table) this many exchanges deep, instead of the
//            small unpruned search: deep persona play (no belief, discount or blind on this path)
//   esc      escalation against long fights: from exchange `escStart` on, each exchange adds esc × 250 points per share of
//            the other side's HP its line takes, on top of the eval. A growing appetite for damage: it trades HP for hits.
use crate::eval::{self, Ev};
use combat_core::ai::move_value;
use combat_core::data::{data, Act};
use combat_core::rules::{actor_to_move, apply_known, legal_actions, legal_for, Moves};
use combat_core::state::*;

#[derive(Clone, Copy)]
pub enum Rule { Max, Softmax(f64), Target(f64) }

pub struct Opts { pub depth: i32, pub gamma: f64, pub belief: bool, pub prior_weight: f64, pub prior_temp: f64, pub blind: f64, pub rule: Rule,
    pub regret: f64, pub k: f64, pub tilt: Vec<(String, f64)>, pub ev: Ev, pub seed: u64, pub policy: bool, pub esc: f64, pub esc_start: i32, pub ab_depth: i32, pub persona_scale: f64 }

pub struct Pick { pub id: Act, pub nodes: u64, pub blinded: bool }

fn rand(seed: u64, s: &State, side: usize, salt: u64) -> f64 {
    let mut x = seed ^ (s.round as u64).wrapping_mul(0x9E37_79B9_7F4A_7C15) ^ ((side as u64 + 1) << 40) ^ salt.wrapping_mul(0xC2B2_AE3D_27D4_EB4F);
    x ^= x >> 30; x = x.wrapping_mul(0xBF58_476D_1CE4_E5B9); x ^= x >> 27; x = x.wrapping_mul(0x94D0_49BB_1331_11EB); x ^= x >> 31;
    (x >> 11) as f64 / (1u64 << 53) as f64
}

/// Persona points for an action, as the core's choose() reads tilt: own name, `<channel>_hold|release`, best part of a bundle.
pub fn tilt_bonus(tilt: &[(String, f64)], s: &State, side: usize, id: Act) -> f64 {
    let d = data();
    let get = |n: &str| tilt.iter().find(|(t, _)| t == n).map_or(0.0, |x| x.1);
    let name = d.name(id);
    let mut own = get(name);
    if let Some(c) = s.actors[side].channel { if name == "hold" || name == "release" { own += get(&format!("{}_{name}", d.spells[c.spell].id)); } }
    if d.acts.is_bundle[id as usize] { own = own.max(d.acts.parts[id as usize].iter().map(|&p| get(d.name(p))).fold(f64::NEG_INFINITY, f64::max)); }
    own
}

struct Search<'a> { enc: &'a Encounter, o: &'a Opts, me: usize, model: &'a [f64], nodes: u64, beta: f64 }

impl Search<'_> {
    /// The eval, plus the escalation's one-sided appetite for the other side's HP (side 0's points).
    fn leaf(&self, c: &State) -> f64 {
        let e = eval::evaluate(self.enc, c, &self.o.ev);
        if self.beta <= 0.0 || c.result.is_some() { return e; }
        let them = &c.actors[1 - self.me];
        let bonus = self.beta * 250.0 * (1.0 - them.hp / them.max_hp);
        if self.me == 0 { e + bonus } else { e - bonus }
    }
    /// The model of the other side: counts seen this fight plus a prior from the core's move ordering, over its legal moves.
    fn model_of(&self, s: &State, side: usize, legal: &[Act]) -> Vec<f64> {
        let vals: Vec<f64> = legal.iter().map(|&a| move_value(self.enc, s, side, a) / self.o.prior_temp).collect();
        let top = vals.iter().cloned().fold(f64::NEG_INFINITY, f64::max);
        let z: f64 = vals.iter().map(|v| (v - top).exp()).sum();
        let w: Vec<f64> = legal.iter().zip(&vals).map(|(&a, v)| self.model[a as usize] + self.o.prior_weight * (v - top).exp() / z).collect();
        let t: f64 = w.iter().sum();
        w.into_iter().map(|x| x / t).collect()
    }
    fn child(&mut self, s: &State, a: Act, depth: i32, acc: f64, w: f64) -> f64 {
        let mut c = *s;
        let r = apply_known(self.enc, &mut c, a, None);
        self.nodes += 1;
        if r.resolved || c.result.is_some() {
            let e = self.leaf(&c);
            if depth <= 1 || c.result.is_some() { return acc + w * e; }
            self.value(&c, depth - 1, acc + w * (1.0 - self.o.gamma) * e, w * self.o.gamma)
        } else { self.value(&c, depth, acc, w) }
    }
    /// Side 0's value of s with `depth` exchanges left.
    fn value(&mut self, s: &State, depth: i32, acc: f64, w: f64) -> f64 {
        if s.result.is_some() { return acc + w * self.leaf(s); }
        let mover = actor_to_move(s).unwrap();
        let legal = legal_actions(self.enc, s);
        if mover != self.me && self.o.belief {
            let p = self.model_of(s, mover, legal.as_slice());
            return legal.iter().zip(p).map(|(&a, p)| p * self.child(s, a, depth, acc, w)).sum();
        }
        let max = mover == 0;
        let mut v = if max { f64::NEG_INFINITY } else { f64::INFINITY };
        for &a in legal.iter() { let x = self.child(s, a, depth, acc, w); v = if max { v.max(x) } else { v.min(x) }; }
        v
    }
}

/// `model`: the decider's counts of the other side's actions this fight (by action code).
pub fn decide(enc: &Encounter, root: &State, o: &Opts, model: &[f64], ctx: &mut crate::ab::Context) -> Pick {
    let me = actor_to_move(root).unwrap();
    let sign = if me == 0 { 1.0 } else { -1.0 };
    let legal: Moves = legal_actions(enc, root);
    if legal.len() == 1 { return Pick { id: legal.as_slice()[0], nodes: 0, blinded: false }; }
    let mut sr = Search { enc, o, me, model, nodes: 0, beta: o.esc * (root.round - o.esc_start).max(0) as f64 };
    let other = 1 - me;
    let blinded = root.pending[other].is_some() && o.blind > 0.0 && rand(o.seed, root, me, 1) < o.blind;
    // My value of each move (points, my perspective).
    let vals: Vec<f64> = if o.policy { legal.iter().map(|&a| move_value(enc, root, me, a)).collect() }
        else if o.ab_depth > 0 {
            let ao = crate::ab::Opts { max_depth: o.ab_depth, node_budget: 400_000, prune: true, ev: o.ev.clone(), ..Default::default() };
            let r = crate::ab::search(enc, root, &ao, ctx, true);
            sr.nodes = r.nodes;
            legal.iter().map(|&a| sign * r.ranked.iter().find(|x| x.0 == a).map_or(if me == 0 { f64::NEG_INFINITY } else { f64::INFINITY }, |x| x.1)).collect()
        }
        else if blinded {
            // Answer the model of the telegraphed move, not the move itself.
            let mut open = *root; open.pending[other] = None;
            let theirs = legal_for(enc, &open, other);
            let p = sr.model_of(&open, other, theirs.as_slice());
            legal.iter().map(|&a| sign * theirs.iter().zip(&p).map(|(&b, p)| {
                let mut c = open; apply_known(enc, &mut c, b, None); p * sr.child(&c, a, o.depth, 0.0, 1.0) }).sum::<f64>()).collect()
        } else { legal.iter().map(|&a| sign * sr.child(root, a, o.depth, 0.0, 1.0)).collect() };
    let best = vals.iter().cloned().fold(f64::NEG_INFINITY, f64::max);
    let cands: Vec<(Act, f64, f64)> = legal.iter().zip(&vals).filter(|(_, &v)| best - v <= o.regret + 1e-9)
        .map(|(&a, &v)| (a, v, v + tilt_bonus(&o.tilt, root, me, a))).collect();
    let id = match o.rule {
        Rule::Max => cands.iter().max_by(|x, y| x.2.partial_cmp(&y.2).unwrap()).unwrap().0,
        Rule::Softmax(t) => {
            let top = cands.iter().map(|c| c.2).fold(f64::NEG_INFINITY, f64::max);
            let ws: Vec<f64> = cands.iter().map(|c| ((c.2 - top) / t.max(1e-6)).exp()).collect();
            let mut r = rand(o.seed, root, me, 2) * ws.iter().sum::<f64>();
            let mut pick = cands[0].0;
            for (c, w) in cands.iter().zip(&ws) { if r < *w { pick = c.0; break; } r -= w; }
            pick
        }
        Rule::Target(p) => {
            let sig = |v: f64| 1.0 / (1.0 + (-v / o.k).exp());
            // The persona weighs in: each persona point is worth 1/persona_scale of win chance.
            let key = |c: &(Act, f64, f64)| (sig(c.1) - p).abs() - (c.2 - c.1) / o.persona_scale;
            cands.iter().min_by(|x, y| key(x).partial_cmp(&key(y)).unwrap()).unwrap().0
        }
    };
    Pick { id, nodes: sr.nodes, blinded }
}
