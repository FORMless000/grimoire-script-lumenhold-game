// A copy of the core's alpha-beta (combat_core::ai::search) with lab options: fitted eval weights, a deeper extension budget,
// and a wider threat test. With the defaults it searches exactly as the core does (checked by `combat-lab check`).
use crate::eval::{self, Ev};
use combat_core::ai::{move_value, next_score, no_op_action, position_key, tactical_threat};
use combat_core::data::{data, Act};
use combat_core::rules::{actor_to_move, apply_known, legal_actions, Moves};
use combat_core::state::*;
use std::time::Instant;

#[derive(Clone)]
pub struct Opts {
    pub max_depth: i32,
    pub node_budget: u64,
    pub deadline: Option<Instant>,
    pub prune: bool,
    pub lmr: usize,
    pub tactical: bool,
    pub pvs: bool,
    pub aspiration: bool,
    /// Extension exchanges a line may add past the horizon (the core: 1).
    pub ext_root: i32,
    /// Extend also on Omens and constructs due next exchange and on a side near knockout.
    pub threat_plus: bool,
    pub ev: Ev,
    /// Learned online: the reply that last caused a cutoff against each telegraphed move (counter-move table).
    pub counter: bool,
    /// Learned online: history of replies per telegraphed move (continuation history).
    pub cont: bool,
    /// Learned offline: a score per (telegraphed move, reply) from deep searches' best replies, n × n by action code.
    pub reply: Option<Vec<f64>>,
    /// Late-move pruning: at the last exchange, skip moves from this index on (0: off).
    pub lmp: usize,
    /// LMR reduces very late moves (index ≥ lmr + 3, depth ≥ 3) by two exchanges instead of one.
    pub lmr2: bool,
}
impl Default for Opts {
    fn default() -> Self { Opts { max_depth: 3, node_budget: 5000, deadline: None, prune: false, lmr: 0, tactical: false, pvs: true, aspiration: true, ext_root: 1, threat_plus: false, ev: Ev::Hand,
        counter: false, cont: false, reply: None, lmp: 0, lmr2: false } }
}

#[derive(Clone, Copy, PartialEq)]
enum Flag { Exact, Lower, Upper }
#[derive(Clone, Copy)]
struct Score { horizon: i32, value: f64, flag: Flag }
const SCORE_SLOTS: usize = 8;
#[derive(Clone)]
struct Entry { key: (u64, u64), depth: i32, generation: u32, best: Option<Act>, scores: [Option<Score>; SCORE_SLOTS], next: usize }

pub struct Context { table: Vec<Option<Entry>>, limit: usize, generation: u32, hist: [Vec<f64>; 2], killers: Vec<[Option<Act>; 2]>, n: usize, counter: Vec<Option<Act>>, cont: Vec<f64> }
impl Context {
    pub fn new(limit: usize) -> Context {
        let n = data().acts.names.len();
        Context { table: vec![None; limit.max(1)], limit: limit.max(1), generation: 0, hist: [vec![0.0; n], vec![0.0; n]], killers: Vec::new(), n, counter: vec![None; 2 * n], cont: vec![0.0; 2 * n * n] }
    }
    fn probe(&self, key: (u64, u64)) -> Option<&Entry> { match &self.table[(key.0 % self.limit as u64) as usize] { Some(e) if e.key == key => Some(e), _ => None } }
    fn store(&mut self, key: (u64, u64), horizon: i32, depth: i32, best: Option<Act>, value: f64, flag: Flag) {
        let i = (key.0 % self.limit as u64) as usize;
        let generation = self.generation;
        let replace = match &self.table[i] {
            Some(e) if e.key == key => false,
            Some(e) => { if e.generation == generation && e.depth > depth { return; } true }
            None => true,
        };
        if replace { self.table[i] = Some(Entry { key, depth, generation, best, scores: [None; SCORE_SLOTS], next: 0 }); }
        let e = self.table[i].as_mut().unwrap();
        e.depth = e.depth.max(depth);
        e.generation = generation;
        e.best = best;
        let score = Score { horizon, value, flag };
        if let Some(slot) = e.scores.iter_mut().find(|x| x.map_or(false, |x| x.horizon == horizon)) { *slot = Some(score); }
        else { let n = e.next; e.scores[n] = Some(score); e.next = (n + 1) % SCORE_SLOTS; }
    }
    fn killer(&self, ply: usize) -> [Option<Act>; 2] { self.killers.get(ply).copied().unwrap_or([None, None]) }
}

#[derive(Default, Clone)]
pub struct Result { pub id: Act, pub value: f64, pub completed_depth: i32, pub nodes: u64, pub ranked: Vec<(Act, f64)> }

struct Abort;
type Sr<T> = std::result::Result<T, Abort>;

#[derive(Clone, Copy, Default)]
struct Row { id: Act, index: usize, score: f64, tie: f64, preferred: f64, killer: f64, counter: f64, history: f64, learned: f64 }
#[inline]
fn before(a: &Row, b: &Row) -> bool {
    for d in [b.preferred - a.preferred, b.killer - a.killer, b.counter - a.counter, b.learned - a.learned, b.history - a.history, b.score - a.score, a.tie - b.tie, a.index as f64 - b.index as f64] {
        if d != 0.0 && !d.is_nan() { return d < 0.0; }
    }
    false
}
#[inline]
fn move_tie(enc: &Encounter, s: &State, id: Act) -> f64 {
    let (p, h) = data().acts.tie[id as usize];
    let side = actor_to_move(s).unwrap();
    let n0 = (enc.sides[side].level * 97 + s.round) as u32;
    ((n0.wrapping_mul(p) as u64 + h as u64) % 4294967296 % 997) as f64
}
pub fn threat_plus(s: &State) -> bool {
    s.actors.iter().any(|a| a.channel.is_some() || a.omens.iter().any(|o| o.due <= s.round + 1) || a.constructs.iter().any(|c| c.expires <= s.round + 1) || a.hp < a.max_hp * 0.2)
}

struct Searcher<'a> { enc: &'a Encounter, ctx: &'a mut Context, o: &'a Opts, tactical: i32, nodes: u64, ticks: u32, rows: Vec<Vec<Row>> }

impl Searcher<'_> {
    #[inline]
    fn check(&mut self) -> Sr<()> {
        if self.nodes >= self.o.node_budget { return Err(Abort); }
        if let Some(dl) = self.o.deadline { self.ticks += 1; if self.ticks & 31 == 0 && Instant::now() >= dl { return Err(Abort); } }
        Ok(())
    }
    fn ordered(&mut self, s: &State, actions: &[Act], preferred: Option<Act>, ply: usize) -> Moves {
        let side = actor_to_move(s).unwrap();
        let killers = self.ctx.killer(ply);
        let (n, pend) = (self.ctx.n, s.pending[1 - side].map(|p| p as usize));
        let counter = match pend { Some(p) if self.o.counter => self.ctx.counter[side * n + p], _ => None };
        while self.rows.len() <= ply { self.rows.push(Vec::with_capacity(48)); }
        let mut pool = std::mem::take(&mut self.rows[ply]);
        pool.clear();
        for (i, &id) in actions.iter().enumerate() {
            let r = Row { id, index: i, score: move_value(self.enc, s, side, id), tie: move_tie(self.enc, s, id),
                preferred: if Some(id) == preferred { 1.0 } else { 0.0 },
                killer: if killers[0] == Some(id) { 2.0 } else if killers[1] == Some(id) { 1.0 } else { 0.0 },
                counter: if counter == Some(id) { 1.0 } else { 0.0 },
                history: self.ctx.hist[side][id as usize] + match pend { Some(p) if self.o.cont => self.ctx.cont[(side * n + p) * n + id as usize], _ => 0.0 },
                learned: match (pend, &self.o.reply) { (Some(p), Some(t)) => t[p * n + id as usize], _ => 0.0 } };
            pool.push(r);
            let mut j = i;
            while j > 0 && before(&r, &pool[j - 1]) { pool[j] = pool[j - 1]; j -= 1; }
            pool[j] = r;
        }
        let mut out = Moves::default();
        for r in &pool { out.push(r.id); }
        self.rows[ply] = pool;
        out
    }
    fn child_score(&mut self, s: &State, id: Act, depth: i32, ext: i32, alpha: f64, beta: f64, ply: usize, in_ext: bool) -> Sr<f64> {
        self.check()?;
        let mut c = *s;
        let r = apply_known(self.enc, &mut c, id, None);
        self.visit(&c, depth - r.resolved as i32, ext, alpha, beta, ply + 1, in_ext)
    }
    fn visit(&mut self, s: &State, mut depth: i32, mut ext: i32, mut alpha: f64, mut beta: f64, ply: usize, mut in_ext: bool) -> Sr<f64> {
        self.check()?;
        self.nodes += 1;
        if s.result.is_some() { return Ok(eval::evaluate(self.enc, s, &self.o.ev)); }
        if depth <= 0 {
            let threat = if self.o.threat_plus { threat_plus(s) } else { tactical_threat(s) };
            if self.o.tactical && ext > 0 && threat { depth = 1; ext -= 1; in_ext = true; }
            else { return Ok(eval::evaluate(self.enc, s, &self.o.ev)); }
        }
        let horizon = depth * 8 + ext * 2 + self.tactical;
        let (orig_alpha, orig_beta) = (alpha, beta);
        let key = position_key(s);
        let mut preferred = None;
        if let Some(e) = self.ctx.probe(key) {
            preferred = e.best;
            if let Some(c) = e.scores.iter().flatten().find(|x| x.horizon == horizon) {
                match c.flag { Flag::Exact => return Ok(c.value), Flag::Lower => alpha = alpha.max(c.value), Flag::Upper => beta = beta.min(c.value) }
                if alpha >= beta { return Ok(c.value); }
            }
        }
        let who = actor_to_move(s).unwrap();
        let max = who == 0;
        let mut v = if max { f64::NEG_INFINITY } else { f64::INFINITY };
        let mut best: Option<Act> = None;
        let legal = legal_actions(self.enc, s);
        let mut list = legal;
        if self.o.prune {
            let mut kept = Moves::default();
            for &a in legal.iter() { if !no_op_action(self.enc, s, who, a) { kept.push(a); } }
            if !kept.is_empty() { list = kept; }
        }
        let actions = self.ordered(s, list.as_slice(), preferred, ply);
        for (i, &id) in actions.iter().enumerate() {
            let mut score;
            let bound_finite = if max { alpha.is_finite() } else { beta.is_finite() };
            if self.o.lmp != 0 && i >= self.o.lmp && depth == 1 && !in_ext && bound_finite && best.is_some() { continue; }
            if self.o.lmr != 0 && i >= self.o.lmr && depth >= 2 && !in_ext && bound_finite {
                let (lo, hi) = if max { (alpha, next_score(alpha, true)) } else { (next_score(beta, false), beta) };
                let red = if self.o.lmr2 && i >= self.o.lmr + 3 && depth >= 3 { 2 } else { 1 };
                score = self.child_score(s, id, depth - red, ext, lo, hi, ply, in_ext)?;
                if if max { score <= alpha } else { score >= beta } {
                    if best.is_none() || if max { score > v } else { score < v } { v = score; best = Some(id); }
                    continue;
                }
            }
            if self.o.pvs && i > 0 && bound_finite {
                let (lo, hi) = if max { (alpha, next_score(alpha, true)) } else { (next_score(beta, false), beta) };
                score = self.child_score(s, id, depth, ext, lo, hi, ply, in_ext)?;
                if score > alpha && score < beta { score = self.child_score(s, id, depth, ext, alpha, beta, ply, in_ext)?; }
            } else { score = self.child_score(s, id, depth, ext, alpha, beta, ply, in_ext)?; }
            if best.is_none() || if max { score > v } else { score < v } { v = score; best = Some(id); }
            if max { alpha = alpha.max(v); } else { beta = beta.min(v); }
            if alpha >= beta {
                let h = &mut self.ctx.hist[who][id as usize];
                *h = 1_000_000f64.min(*h + (depth * depth) as f64);
                while self.ctx.killers.len() <= ply { self.ctx.killers.push([None, None]); }
                let k = &mut self.ctx.killers[ply];
                if k[0] != Some(id) { if k[0].is_some() { k[1] = k[0]; } k[0] = Some(id); }
                if let Some(p) = s.pending[1 - who] {
                    let n = self.ctx.n;
                    if self.o.counter { self.ctx.counter[who * n + p as usize] = Some(id); }
                    if self.o.cont { let c = &mut self.ctx.cont[(who * n + p as usize) * n + id as usize]; *c = 1_000_000f64.min(*c + (depth * depth) as f64); }
                }
                break;
            }
        }
        let flag = if v <= orig_alpha { Flag::Upper } else if v >= orig_beta { Flag::Lower } else { Flag::Exact };
        self.ctx.store(key, horizon, depth, best, v, flag);
        Ok(v)
    }
}

pub fn search(enc: &Encounter, root: &State, o: &Opts, ctx: &mut Context, rank: bool) -> Result {
    ctx.generation += 1;
    let mut sr = Searcher { enc, ctx, o, tactical: o.tactical as i32, nodes: 0, ticks: 0, rows: Vec::new() };
    let side = actor_to_move(root).unwrap();
    let root_key = position_key(root);
    let root_pref = sr.ctx.probe(root_key).and_then(|e| e.best);
    let legal = legal_actions(enc, root);
    let moves = sr.ordered(root, legal.as_slice(), root_pref, 0);
    let mut best = moves.as_slice()[0];
    let mut value = eval::evaluate(enc, root, &o.ev);
    let mut completed = 0;
    let mut ranked = Vec::new();
    for depth in 1..=o.max_depth {
        let (mut low, mut high, mut width) = (f64::NEG_INFINITY, f64::INFINITY, 8.0);
        if o.aspiration && !rank && completed != 0 { low = value - width; high = value + width; }
        let outcome: Sr<(Act, f64, Vec<(Act, f64)>)> = (|| loop {
            let mut chosen = best;
            let mut v = if side == 0 { f64::NEG_INFINITY } else { f64::INFINITY };
            let (mut alpha, mut beta) = (low, high);
            let mut scores = Vec::with_capacity(moves.len());
            let order = std::iter::once(best).chain(moves.iter().copied().filter(|&m| m != best));
            for id in order {
                let n = sr.child_score(root, id, depth, o.ext_root, if rank { f64::NEG_INFINITY } else { alpha }, if rank { f64::INFINITY } else { beta }, 0, false)?;
                scores.push((id, n));
                if if side == 0 { n > v } else { n < v } { v = n; chosen = id; }
                if side == 0 { alpha = alpha.max(v); } else { beta = beta.min(v); }
                if !rank && alpha >= beta { break; }
            }
            if v > low && v < high { return Ok((chosen, v, scores)); }
            width *= 4.0;
            if width >= 32768.0 { low = f64::NEG_INFINITY; high = f64::INFINITY; } else { low = value - width; high = value + width; }
        })();
        match outcome {
            Ok((c, v, scores)) => { best = c; value = v; ranked = scores; completed = depth; sr.ctx.store(root_key, depth * 8 + o.ext_root * 2 + sr.tactical, depth, Some(best), value, Flag::Exact); }
            Err(Abort) => break,
        }
    }
    Result { id: best, value, completed_depth: completed, nodes: sr.nodes, ranked }
}
