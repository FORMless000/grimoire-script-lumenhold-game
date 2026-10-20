// Persona opponents (F5.10): the Easy and Medium presets. Readable and beatable, not random: a small MCTS whose priors are the
// core's move ordering plus the persona's tilt, so a character plays its favourites and the player can learn them; a channel
// plan layer, so channels are built and released on purpose; and a sanity veto, so a favourite isn't thrown into a defence that
// punishes it or knocks it out (a Contraption burst into a Reflect). Memoryless (the live game keeps no search context between decisions): every choice is made from the position.
// Budgets are node counts (moves simulated), never time, so a slower device plays the same opponent, only slower.
// Measured in combat/lab against simulated players (tools/lab.mjs human): see the F5.10 notes in PROGRESS.md.
use crate::ai::{evaluate, move_value, position_key};
use crate::data::{data, Act};
use crate::neural;
use crate::rules::{actor_to_move, apply_known, attack_power, legal_actions};
use crate::state::*;
use serde_json::{json, Map, Value};

pub struct Opts { pub nodes: u64, pub c: f64, pub alpha: f64, pub k: f64, pub rollout: i32, pub eps: f64, pub temp: f64, pub mlp: bool,
    pub tilt: Vec<(String, f64)>, pub seed: u64, pub plans: bool, pub veto: f64 }

#[inline]
fn eval(enc: &Encounter, s: &State, mlp: bool) -> f64 { if mlp { neural::evaluate(enc, s) } else { evaluate(enc, s) } }

/// Persona points for an action, as choose() reads tilt: its own name, `<channel>_hold|release`, the best part of a bundle.
pub fn tilt_bonus(tilt: &[(String, f64)], s: &State, side: usize, id: Act) -> f64 {
    if tilt.is_empty() { return 0.0; }
    let d = data();
    let get = |n: &str| tilt.iter().find(|(t, _)| t == n).map_or(0.0, |x| x.1);
    let name = d.name(id);
    let mut own = get(name);
    if let Some(c) = s.actors[side].channel { if name == "hold" || name == "release" { own += get(&format!("{}_{name}", d.spells[c.spell].id)); } }
    if d.acts.is_bundle[id as usize] { own = own.max(d.acts.parts[id as usize].iter().map(|&p| get(d.name(p))).fold(f64::NEG_INFINITY, f64::max)); }
    own
}

// ---- MCTS with implicit minimax backups (Lanctot et al. 2014) and persona priors ----

struct Node { s: State, act: Act, prior: f64, first: u32, count: u32, expanded: bool, n: f64, w: f64, mm: f64 }
struct Tree<'a> { enc: &'a Encounter, o: &'a Opts, me: usize, nodes: Vec<Node>, applies: u64, rng: u64 }

impl Tree<'_> {
    fn rand(&mut self) -> f64 { self.rng ^= self.rng << 13; self.rng ^= self.rng >> 7; self.rng ^= self.rng << 17; (self.rng >> 11) as f64 / (1u64 << 53) as f64 }
    /// Side 0's win chance: the result, or sigmoid(eval / k).
    fn value(&self, s: &State) -> f64 {
        if let Some(r) = s.result { return match r.winner { Some(0) => 1.0, Some(1) => 0.0, _ => 0.5 }; }
        1.0 / (1.0 + (-eval(self.enc, s, self.o.mlp) / self.o.k).exp())
    }
    fn tilt(&self, s: &State, side: usize, a: Act) -> f64 { if side == self.me { tilt_bonus(&self.o.tilt, s, side, a) } else { 0.0 } }
    fn expand(&mut self, i: usize) {
        let s = self.nodes[i].s;
        let side = actor_to_move(&s).unwrap();
        let legal = legal_actions(self.enc, &s);
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
        // A leader's move also expands its mid-exchange children, so a node's minimax value includes the follower's best reply.
        for j in first as usize..first as usize + legal.len() {
            let c = self.nodes[j].s;
            if c.result.is_none() && (c.pending[0].is_some() || c.pending[1].is_some()) { self.expand(j); } else { self.nodes[j].mm = self.value(&c); }
        }
        self.backup_mm(i);
    }
    fn backup_mm(&mut self, i: usize) {
        let n = &self.nodes[i];
        let max = actor_to_move(&n.s) == Some(0);
        let (f, c) = (n.first as usize, n.count as usize);
        let mut v = if max { f64::NEG_INFINITY } else { f64::INFINITY };
        for j in f..f + c { let m = self.nodes[j].mm; v = if max { v.max(m) } else { v.min(m) }; }
        self.nodes[i].mm = v;
    }
    fn q(&self, j: usize) -> f64 { let c = &self.nodes[j]; if c.n > 0.0 { (1.0 - self.o.alpha) * c.w / c.n + self.o.alpha * c.mm } else { c.mm } }
    fn select(&self, i: usize) -> usize {
        let n = &self.nodes[i];
        let max = actor_to_move(&n.s) == Some(0);
        let sq = (n.n + 1.0).sqrt();
        let (mut best, mut bv) = (n.first as usize, f64::NEG_INFINITY);
        for j in n.first as usize..(n.first + n.count) as usize {
            let q = self.q(j);
            let u = (if max { q } else { 1.0 - q }) + self.o.c * self.nodes[j].prior * sq / (1.0 + self.nodes[j].n);
            if u > bv { bv = u; best = j; }
        }
        best
    }
    fn policy(&mut self, s: &State) -> Act {
        let side = actor_to_move(s).unwrap();
        let legal = legal_actions(self.enc, s);
        if legal.len() == 1 || self.rand() < self.o.eps { let r = self.rand(); return legal.as_slice()[(r * legal.len() as f64) as usize % legal.len()]; }
        let u = |a: Act| move_value(self.enc, s, side, a) + self.tilt(s, side, a);
        *legal.iter().max_by(|&&a, &&b| u(a).partial_cmp(&u(b)).unwrap()).unwrap()
    }
    fn rollout(&mut self, mut s: State) -> f64 {
        let mut left = self.o.rollout;
        while s.result.is_none() && left > 0 { let a = self.policy(&s); if apply_known(self.enc, &mut s, a, None).resolved { left -= 1; } self.applies += 1; }
        while s.result.is_none() && (s.pending[0].is_some() || s.pending[1].is_some()) { let a = self.policy(&s); apply_known(self.enc, &mut s, a, None); self.applies += 1; }
        self.value(&s)
    }
}

/// (move, side 0's value in points, iterations, tree depth in exchanges, nodes)
pub fn mcts(enc: &Encounter, root: &State, o: &Opts) -> (Act, f64, u64, i32, u64) {
    let me = actor_to_move(root).unwrap();
    let mut t = Tree { enc, o, me, nodes: Vec::with_capacity(256), applies: 0, rng: (position_key(root).0 ^ o.seed.wrapping_mul(0x9E37_79B9_7F4A_7C15)) | 1 };
    t.nodes.push(Node { s: *root, act: 0, prior: 1.0, first: 0, count: 0, expanded: false, n: 0.0, w: 0.0, mm: 0.5 });
    t.expand(0);
    let (mut iterations, mut depth) = (0u64, 0usize);
    while t.applies < o.nodes {
        iterations += 1;
        t.applies += 1; // every iteration costs a node, so lines that all end in finished fights still stop
        let mut path = vec![0usize];
        let mut i = 0;
        while t.nodes[i].expanded && t.nodes[i].count > 0 { i = t.select(i); path.push(i); }
        let z = if t.nodes[i].s.result.is_some() { t.value(&t.nodes[i].s.clone()) } else { t.expand(i); let s = t.nodes[i].s; t.rollout(s) };
        depth = depth.max(path.len());
        for &j in path.iter().rev() { t.nodes[j].n += 1.0; t.nodes[j].w += z; if t.nodes[j].expanded && t.nodes[j].count > 0 { t.backup_mm(j); } }
    }
    let r = &t.nodes[0];
    let max = me == 0;
    let mut best = r.first as usize;
    for j in r.first as usize..(r.first + r.count) as usize {
        let (c, b) = (&t.nodes[j], &t.nodes[best]);
        if c.n > b.n || (c.n == b.n && if max { c.mm > b.mm } else { c.mm < b.mm }) { best = j; }
    }
    let q = t.q(best).clamp(1e-6, 1.0 - 1e-6);
    (t.nodes[best].act, o.k * (q / (1.0 - q)).ln(), iterations, (depth / 2) as i32, t.applies)
}

// ---- the plan layer and the sanity veto ----

const HORIZON: i32 = 5;
const MAX_HOLDS: i32 = 3;
/// Exchanges the lethal veto looks ahead (a Contraption's burst, a Reflected spell, Wildfire's own heat).
const LETHAL: i32 = 3;

#[inline]
fn mine(me: usize, v: f64) -> f64 { if me == 0 { v } else { -v } }

/// My value of `a` now, after the exchange resolves: against the other side's committed move, else its best reply.
fn one_exchange(enc: &Encounter, s: &State, me: usize, a: Act) -> f64 {
    let mut c = *s;
    let r = apply_known(enc, &mut c, a, None);
    if r.resolved || c.result.is_some() { return mine(me, evaluate(enc, &c)); }
    legal_actions(enc, &c).iter().map(|&b| { let mut d = c; apply_known(enc, &mut d, b, None); mine(me, evaluate(enc, &d)) }).fold(f64::INFINITY, f64::min)
}

/// A scripted line HORIZON exchanges long: my moves from `script` (which reads only the position), the other side's its best
/// reply to my move of that exchange.
fn rollout(enc: &Encounter, s: &State, me: usize, script: &dyn Fn(&State) -> Act) -> f64 { mine(me, evaluate(enc, &line(enc, s, me, script, HORIZON))) }
fn line(enc: &Encounter, s: &State, me: usize, script: &dyn Fn(&State) -> Act, exchanges: i32) -> State {
    let mut c = *s;
    let mut left = exchanges;
    while c.result.is_none() && left > 0 {
        let r = if actor_to_move(&c) == Some(me) { let a = script(&c); apply_known(enc, &mut c, a, None) } else {
            let legal = legal_actions(enc, &c);
            let mut best = (legal.as_slice()[0], f64::INFINITY);
            for &b in legal.iter() {
                let mut d = c;
                if !apply_known(enc, &mut d, b, None).resolved && d.result.is_none() { let a = script(&d); apply_known(enc, &mut d, a, None); }
                let v = mine(me, evaluate(enc, &d));
                if v < best.1 { best = (b, v); }
            }
            apply_known(enc, &mut c, best.0, None)
        };
        if r.resolved { left -= 1; }
    }
    c
}

/// A line that knocks me out: playing `a` now, then greedily, against the other side's best replies for LETHAL exchanges.
fn self_knockout(enc: &Encounter, s: &State, me: usize, a: Act) -> bool {
    let end = line(enc, s, me, &|c: &State| if c.round == s.round { a } else { greedy(enc, c, me) }, LETHAL);
    end.result.map_or(false, |r| r.winner == Some(1 - me as u8))
}

fn greedy(enc: &Encounter, s: &State, me: usize) -> Act {
    *legal_actions(enc, s).iter().max_by(|&&a, &&b| move_value(enc, s, me, a).partial_cmp(&move_value(enc, s, me, b)).unwrap()).unwrap()
}

/// Channels worth a plan: the attacking ones, or one the persona favours (so a shield channel isn't recast forever).
fn plannable(tilt: &[(String, f64)], sp: usize) -> bool {
    let d = data();
    let ids = &d.ids;
    let n = &d.spells[sp].id;
    sp == ids.wildfire || sp == ids.starlight || sp == ids.siphon
        || tilt.iter().any(|(t, x)| *x > 0.0 && (t == n || *t == format!("{n}_hold") || *t == format!("{n}_release")))
}
fn hold_tilt(tilt: &[(String, f64)], sp: usize) -> f64 { let n = &data().spells[sp].id; tilt.iter().find(|(t, _)| *t == format!("{n}_hold")).map_or(0.0, |x| x.1) }

/// The plan layer: while channelling a plannable channel, Hold or Release by whichever plan (release now, or hold 1–3 more)
/// scores best; otherwise, start a channel plan instead of `choice` when one scores better over the same horizon.
fn plan(enc: &Encounter, s: &State, me: usize, tilt: &[(String, f64)], choice: Act) -> (Act, &'static str) {
    let d = data();
    let k = &d.acts;
    let legal = legal_actions(enc, s);
    let ok = |a: Act| legal.as_slice().contains(&a);
    let script = |target: i32, cast: Option<Act>| {
        move |c: &State| -> Act {
            if let Some(ch) = c.actors[me].channel { return if ch.holds < target && legal_actions(enc, c).as_slice().contains(&k.hold) { k.hold } else { k.release }; }
            if c.round == s.round { cast.unwrap_or(choice) } else { greedy(enc, c, me) }
        }
    };
    if let Some(ch) = s.actors[me].channel {
        if !plannable(tilt, ch.spell) || !ok(k.hold) || !ok(k.release) { return (choice, ""); }
        let ht = hold_tilt(tilt, ch.spell);
        let best = (0..=MAX_HOLDS).map(|j| (j, rollout(enc, s, me, &script(ch.holds + j, None)) + ht * j as f64)).max_by(|a, b| a.1.partial_cmp(&b.1).unwrap()).unwrap();
        return (if best.0 > 0 { k.hold } else { k.release }, "plan");
    }
    // No new plan straight after a Release (a cheap cooldown the position can tell).
    if s.actors[me].last_action == Some(k.release) { return (choice, ""); }
    let mut best: Option<(Act, f64)> = None;
    for &sp in legal.iter().filter(|&&a| (a as usize) < k.n_spells && d.spells[a as usize].channel && plannable(tilt, a as usize)) {
        let ht = hold_tilt(tilt, sp as usize);
        for holds in 0..=MAX_HOLDS {
            let v = rollout(enc, s, me, &script(holds, Some(sp))) + tilt_bonus(tilt, s, me, sp) + ht * holds as f64;
            if best.map_or(true, |b| v > b.1) { best = Some((sp, v)); }
        }
    }
    let Some((sp, v)) = best else { return (choice, "") };
    if sp == choice { return (choice, "plan"); }
    let base = rollout(enc, s, me, &script(0, None)) + tilt_bonus(tilt, s, me, choice);
    if v > base { (sp, "plan") } else { (choice, "") }
}

/// An immediate-payoff move: Strike, a damaging (non-channel) spell, or a bundle with either.
fn immediate(enc: &Encounter, s: &State, me: usize, a: Act) -> bool {
    let d = data();
    d.acts.parts[a as usize].iter().any(|&p| p == d.acts.strike || ((p as usize) < d.acts.n_spells && !d.spells[p as usize].channel && attack_power(enc, s, me, p) > 0.0))
}

/// The lethal veto: a persona favourite (of any kind) whose line knocks me out gives way to the best move whose line doesn't.
fn lethal_veto(enc: &Encounter, s: &State, me: usize, tilt: &[(String, f64)], choice: Act) -> Option<Act> {
    if tilt_bonus(tilt, s, me, choice) <= 0.0 || !self_knockout(enc, s, me, choice) { return None; }
    legal_actions(enc, s).iter().copied().filter(|&a| a != choice && !self_knockout(enc, s, me, a))
        .map(|a| (a, one_exchange(enc, s, me, a) + tilt_bonus(tilt, s, me, a))).max_by(|x, y| x.1.partial_cmp(&y.1).unwrap()).map(|x| x.0)
}

/// The sanity veto: a persona-favoured immediate-payoff move more than `margin` worse than the best over one exchange gives way
/// to the best move within that margin, persona tilt still counting (no Flame into an active Reflect).
fn veto(enc: &Encounter, s: &State, me: usize, tilt: &[(String, f64)], choice: Act, margin: f64) -> Option<Act> {
    if margin <= 0.0 || tilt_bonus(tilt, s, me, choice) <= 0.0 || !immediate(enc, s, me, choice) { return None; }
    let legal = legal_actions(enc, s);
    if legal.len() < 2 { return None; }
    let vals: Vec<(Act, f64)> = legal.iter().map(|&a| (a, one_exchange(enc, s, me, a))).collect();
    let top = vals.iter().map(|x| x.1).fold(f64::NEG_INFINITY, f64::max);
    let vc = vals.iter().find(|x| x.0 == choice).map_or(top, |x| x.1);
    if top - vc <= margin { return None; }
    vals.iter().filter(|x| top - x.1 <= margin).max_by(|x, y| (x.1 + tilt_bonus(tilt, s, me, x.0)).partial_cmp(&(y.1 + tilt_bonus(tilt, s, me, y.0))).unwrap()).map(|x| x.0)
}

fn get_f(o: &Map<String, Value>, k: &str, d: f64) -> f64 { o.get(k).and_then(|v| v.as_f64()).unwrap_or(d) }

/// chooseAIAction for algorithm "persona": settings mctsNodes, mctsC, mctsAlpha, mctsK, mctsRollout, mctsEps, mctsTemp,
/// plans, veto, eval ("mlp"), tilt × tiltScale (the persona), seed. The answer has chooseAIAction's usual fields.
pub fn choose(enc: &Encounter, s: &State, o: &Map<String, Value>) -> Value {
    let d = data();
    let side = actor_to_move(s).unwrap();
    let scale = get_f(o, "tiltScale", 1.0);
    let tilt: Vec<(String, f64)> = o.get("tilt").and_then(|t| t.as_object()).map(|t| t.iter().filter_map(|(k, v)| v.as_f64().map(|x| (k.clone(), x * scale))).filter(|(_, x)| *x != 0.0).collect()).unwrap_or_default();
    let opts = Opts { nodes: get_f(o, "mctsNodes", 2000.0) as u64, c: get_f(o, "mctsC", 1.5), alpha: get_f(o, "mctsAlpha", 0.5), k: get_f(o, "mctsK", 72.0),
        rollout: get_f(o, "mctsRollout", 4.0) as i32, eps: get_f(o, "mctsEps", 0.2), temp: get_f(o, "mctsTemp", 8.0), mlp: o.get("eval").and_then(|v| v.as_str()) == Some("mlp"),
        tilt, seed: get_f(o, "seed", 0.0) as u64, plans: o.get("plans").and_then(|v| v.as_bool()).unwrap_or(false), veto: get_f(o, "veto", 0.0) };
    let legal = legal_actions(enc, s);
    let (mut id, value, iterations, depth, nodes) = if legal.len() == 1 { (legal.as_slice()[0], evaluate(enc, s), 0, 0, 0) } else { mcts(enc, s, &opts) };
    let best = id;
    let mut layer = "";
    if legal.len() > 1 {
        if opts.plans && s.actors[side].channel.is_some() { let (a, why) = plan(enc, s, side, &opts.tilt, id); id = a; layer = why; }
        else {
            if let Some(a) = veto(enc, s, side, &opts.tilt, id, opts.veto) { id = a; layer = "veto"; }
            if opts.veto > 0.0 { if let Some(a) = lethal_veto(enc, s, side, &opts.tilt, id) { id = a; layer = "veto"; } }
            if opts.plans { let (a, why) = plan(enc, s, side, &opts.tilt, id); if a != id || !why.is_empty() { id = a; if !why.is_empty() { layer = why; } } }
        }
    }
    json!({"id": d.name(id), "bestId": d.name(best), "value": value, "completedDepth": depth, "nodes": nodes, "totalNodes": nodes, "iterations": iterations,
        "algorithm": "persona", "layer": layer, "degraded": false, "mistakeAttempted": false, "regret": 0, "policyVersion": crate::ai::POLICY_VERSION})
}
