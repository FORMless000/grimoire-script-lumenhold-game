// MCTS with implicit minimax backups (Lanctot et al. 2014) and PUCT priors from the core's move ordering (move_value).
// Values are side 0's win chance in [0, 1]; a heuristic score maps through sigmoid(eval / k).
// Expanding a leader's node also expands each of its mid-exchange children, so every node's minimax value is at least the
// follower's best reply evaluated after the exchange resolves (the follower sees the leader's move).
// Rollouts: `rollout` exchanges with an ε-greedy move_value policy, or (hybrid) a one-exchange minimax policy (Baier & Winands).
use crate::eval::{self, Ev};
use combat_core::ai::{move_value, position_key};
use combat_core::data::Act;
use combat_core::rules::{actor_to_move, apply_known, legal_actions};
use combat_core::state::*;
use std::time::Instant;

#[derive(Clone)]
pub struct Opts { pub deadline: Option<Instant>, pub node_budget: u64, pub c: f64, pub alpha: f64, pub k: f64, pub rollout: i32, pub eps: f64, pub temp: f64, pub hybrid: bool, pub ev: Ev, pub tilt: Vec<(String, f64)>, pub tilt_side: usize }

struct Node { s: State, act: Act, prior: f64, first: u32, count: u32, expanded: bool, n: f64, w: f64, mm: f64 }

pub struct Result { pub id: Act, pub value: f64, pub depth: i32, pub nodes: u64, pub iterations: u64 }

struct Rng(u64);
impl Rng { fn next(&mut self) -> f64 { self.0 ^= self.0 << 13; self.0 ^= self.0 >> 7; self.0 ^= self.0 << 17; (self.0 >> 11) as f64 / (1u64 << 53) as f64 } }

struct Tree<'a> { enc: &'a Encounter, o: &'a Opts, nodes: Vec<Node>, applies: u64 }

impl Tree<'_> {
    fn value(&self, s: &State) -> f64 {
        if let Some(r) = s.result { return match r.winner { Some(0) => 1.0, Some(1) => 0.0, _ => 0.5 }; }
        1.0 / (1.0 + (-eval::evaluate(self.enc, s, &self.o.ev) / self.o.k).exp())
    }
    fn expand(&mut self, i: usize) {
        let s = self.nodes[i].s;
        let side = actor_to_move(&s).unwrap();
        let legal = legal_actions(self.enc, &s);
        // Persona priors: the deciding side's tilt joins its move ordering values.
        let vals: Vec<f64> = legal.iter().map(|&a| (move_value(self.enc, &s, side, a) + self.tilt(&s, side, a)) / self.o.temp).collect();
        let top = vals.iter().cloned().fold(f64::NEG_INFINITY, f64::max);
        let z: f64 = vals.iter().map(|v| (v - top).exp()).sum();
        let first = self.nodes.len() as u32;
        for (j, &a) in legal.iter().enumerate() {
            let mut c = s;
            apply_known(self.enc, &mut c, a, None);
            self.applies += 1;
            self.nodes.push(Node { s: c, act: a, prior: (vals[j] - top).exp() / z, first: 0, count: 0, expanded: false, n: 0.0, w: 0.0, mm: f64::NAN });
        }
        self.nodes[i].first = first;
        self.nodes[i].count = legal.len() as u32;
        self.nodes[i].expanded = true;
        for j in first as usize..first as usize + legal.len() {
            let c = &self.nodes[j].s;
            if c.result.is_none() && (c.pending[0].is_some() || c.pending[1].is_some()) { self.expand(j); }
            else { self.nodes[j].mm = self.value(&self.nodes[j].s.clone()); }
        }
        self.backup_mm(i);
    }
    fn tilt(&self, s: &State, side: usize, a: Act) -> f64 { if side == self.o.tilt_side && !self.o.tilt.is_empty() { crate::human::tilt_bonus(&self.o.tilt, s, side, a) } else { 0.0 } }
    fn backup_mm(&mut self, i: usize) {
        let n = &self.nodes[i];
        let max = actor_to_move(&n.s) == Some(0);
        let (f, c) = (n.first as usize, n.count as usize);
        let mut v = if max { f64::NEG_INFINITY } else { f64::INFINITY };
        for j in f..f + c { let m = self.nodes[j].mm; v = if max { v.max(m) } else { v.min(m) }; }
        self.nodes[i].mm = v;
    }
    fn select(&self, i: usize) -> usize {
        let n = &self.nodes[i];
        let max = actor_to_move(&n.s) == Some(0);
        let sq = (n.n + 1.0).sqrt();
        let (mut best, mut bv) = (n.first as usize, f64::NEG_INFINITY);
        for j in n.first as usize..(n.first + n.count) as usize {
            let c = &self.nodes[j];
            let q = if c.n > 0.0 { (1.0 - self.o.alpha) * c.w / c.n + self.o.alpha * c.mm } else { c.mm };
            let u = (if max { q } else { 1.0 - q }) + self.o.c * c.prior * sq / (1.0 + c.n);
            if u > bv { bv = u; best = j; }
        }
        best
    }
    fn policy(&mut self, s: &State, rng: &mut Rng) -> Act {
        let side = actor_to_move(s).unwrap();
        let legal = legal_actions(self.enc, s);
        if legal.len() == 1 { return legal.as_slice()[0]; }
        if rng.next() < self.o.eps { return legal.as_slice()[(rng.next() * legal.len() as f64) as usize % legal.len()]; }
        let sign = if side == 0 { 1.0 } else { -1.0 };
        if !self.o.hybrid {
            let u = |a: Act| move_value(self.enc, s, side, a) + self.tilt(s, side, a);
            return *legal.iter().max_by(|&&a, &&b| u(a).partial_cmp(&u(b)).unwrap()).unwrap();
        }
        // One exchange of minimax with the heuristic: the follower answers each leader move with its best reply.
        let reply = |t: &mut Tree, c: &State| -> f64 {
            let them = actor_to_move(c).unwrap();
            let ts = if them == 0 { 1.0 } else { -1.0 };
            let mut best = f64::NEG_INFINITY;
            for &b in legal_actions(t.enc, c).iter() { let mut d = *c; apply_known(t.enc, &mut d, b, None); t.applies += 1; best = best.max(ts * t.value(&d)); }
            ts * best
        };
        let mut best = (legal.as_slice()[0], f64::NEG_INFINITY);
        for &a in legal.iter() {
            let mut c = *s;
            let r = apply_known(self.enc, &mut c, a, None);
            self.applies += 1;
            let v = if r.resolved || c.result.is_some() { self.value(&c) } else { reply(self, &c) };
            if sign * v > best.1 { best = (a, sign * v); }
        }
        best.0
    }
    fn rollout(&mut self, mut s: State, rng: &mut Rng) -> f64 {
        let mut left = self.o.rollout;
        while s.result.is_none() && left > 0 {
            let a = self.policy(&s, rng);
            let r = apply_known(self.enc, &mut s, a, None);
            self.applies += 1;
            if r.resolved { left -= 1; }
        }
        // Mid-exchange: finish it with the policy so the heuristic sees a resolved state.
        while s.result.is_none() && (s.pending[0].is_some() || s.pending[1].is_some()) { let a = self.policy(&s, rng); apply_known(self.enc, &mut s, a, None); self.applies += 1; }
        self.value(&s)
    }
}

pub fn search(enc: &Encounter, root: &State, o: &Opts) -> Result {
    let mut t = Tree { enc, o, nodes: Vec::with_capacity(256), applies: 0 };
    t.nodes.push(Node { s: *root, act: 0, prior: 1.0, first: 0, count: 0, expanded: false, n: 0.0, w: 0.0, mm: 0.5 });
    t.expand(0);
    let mut rng = Rng(position_key(root).0 | 1);
    let (mut iterations, mut depth) = (0u64, 0);
    loop {
        if t.applies >= o.node_budget { break; }
        if let Some(dl) = o.deadline { if Instant::now() >= dl { break; } }
        iterations += 1;
        // Every iteration costs at least one node, so a tree whose lines all end in finished fights still stops on a node budget.
        t.applies += 1;
        let mut path = vec![0usize];
        let mut i = 0;
        while t.nodes[i].expanded && t.nodes[i].count > 0 { i = t.select(i); path.push(i); }
        let z = if t.nodes[i].s.result.is_some() { t.value(&t.nodes[i].s.clone()) } else {
            t.expand(i);
            let s = t.nodes[i].s;
            t.rollout(s, &mut rng)
        };
        depth = depth.max(path.len() as i32);
        for &j in path.iter().rev() {
            t.nodes[j].n += 1.0; t.nodes[j].w += z;
            if t.nodes[j].expanded && t.nodes[j].count > 0 { t.backup_mm(j); }
        }
    }
    let r = &t.nodes[0];
    let max = actor_to_move(root) == Some(0);
    let mut best = r.first as usize;
    for j in r.first as usize..(r.first + r.count) as usize {
        let (c, b) = (&t.nodes[j], &t.nodes[best]);
        let better = c.n > b.n || (c.n == b.n && if max { c.mm > b.mm } else { c.mm < b.mm });
        if better { best = j; }
    }
    let b = &t.nodes[best];
    let q = if b.n > 0.0 { (1.0 - o.alpha) * b.w / b.n + o.alpha * b.mm } else { b.mm };
    Result { id: b.act, value: o.k * (q.clamp(1e-6, 1.0 - 1e-6) / (1.0 - q.clamp(1e-6, 1.0 - 1e-6))).ln(), depth: depth / 2, nodes: t.applies, iterations }
}
