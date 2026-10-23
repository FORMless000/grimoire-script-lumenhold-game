// Evaluation, move ordering, alpha-beta search (PVS, aspiration, iterative deepening, tactical extension,
// optional LMR and no-op pruning), the transposition table, and the AI policy (profiles, seeded mistakes).
use crate::data::{data, Act, ConstructAction, R_CROWNS, R_MANA};
use crate::rules::{self, actor_to_move, amount, apply_known, attack_power, cost, damage_power, has, hasted_impulse, legal_actions, reward_next, wildfire_self, Moves, EPS};
use crate::state::*;
use serde_json::{json, Map, Value};

/// alpha-beta-2 → persona-3 (F5.10): the persona opponents (persona.rs) and the Engine's MLP eval (neural.rs, `eval: "mlp"`).
pub const POLICY_VERSION: &str = "persona-3";
/// Expected opposing damage per exchange, in HP: what a construct copies onto its threshold and what Brace can stop.
const EXPECTED_HIT: f64 = 12.0;
/// F5.11-plan.1: an exchange Bound (Breaking Free, nothing else) costs about this share of an expected hit.
const BOUND_COST: f64 = 0.6;
/// Exchanges a side's effect still covers from now (a future-start one counts from its start).
fn left(s: &State, e: &Effect) -> f64 { 0.max(e.until.unwrap_or(s.round) - s.round.max(e.from) + 1) as f64 }

fn construct_hp(s: &State, c: &ConstructI) -> f64 {
    let spec = &data().constructs[c.kind];
    let life = 0.max(c.expires - s.round + 1) as f64;
    let ticks = life.min(0f64.max(((c.threshold - c.taken) / EXPECTED_HIT).ceil()));
    let per_tick = (if spec.action == ConstructAction::Heal { c.power } else { c.power * 0.75 }) + c.reduction;
    ticks * per_tick
}

fn influence(enc: &Encounter, s: &State, side: usize, hp: f64) -> f64 {
    let ids = &data().ids;
    let a = &s.actors[side];
    let mut value = 0.0;
    if has(s, side, Eff::Shadowstep) { value += 12.0; }
    if has(s, side, Eff::Haste) { value += 10.0; }
    if let Some(b) = a.effects[Eff::Brace as usize] { value += b.value * EXPECTED_HIT * hp * left(s, &b); }
    if has(s, side, Eff::Heartprice) { value += 3.0; }
    if a.rime_ready && !a.rime_used { value += 8.0; }
    for c in a.constructs.iter() { value += construct_hp(s, c) * hp; }
    for o in a.omens.iter() { value += o.power * 0.5 / 1f64.max((o.due - s.round + 1) as f64); }
    if let Some(c) = a.channel {
        let banked = if c.spell == ids.moonwell { c.bank.min(enc.sides[side].capacity - a.res[R_MANA]) } else { c.bank.min(a.max_hp) };
        value += banked * 0.12 + c.total * 0.6 + if c.spell == ids.starlight && c.holds != 0 { 10.0 } else { 0.0 };
    }
    // World expansion 1: poison still to come counts against its holder. F5.11-plan.1: each exchange Bound is a lost action; a
    // Lodestar still rising is worth its healing and a safe exchange, past the search's horizon.
    if let Some(p) = a.effects[Eff::Poison as usize] { value -= p.value * left(s, &p) * hp; }
    if let Some(b) = a.effects[Eff::Bound as usize] { value -= BOUND_COST * EXPECTED_HIT * hp * left(s, &b); }
    if let Some(l) = a.effects[Eff::Lodestar as usize] { if l.from >= s.round { value += (l.value.min(a.max_hp - a.hp) * 0.8 + EXPECTED_HIT * 0.5) * hp * 0.7; } }
    if let Some(t) = a.effects[Eff::Tailwind as usize] { value += t.value * 3.0; }
    value
}

pub fn evaluate(enc: &Encounter, s: &State) -> f64 {
    // A knockout's score has a tiebreak inside it (F5.9d): the winner's lost share of HP, up to 100 points. A side destined to be
    // knocked out goes down dealing the most damage it can; a winner prefers the knockout that costs it least. Renown is worth
    // nothing here.
    if let Some(r) = s.result {
        let worn = |w: usize| if r.reason == Reason::Knockout { 100.0 * (1.0 - s.actors[w].hp / s.actors[w].max_hp).clamp(0.0, 1.0) } else { 0.0 };
        return match r.winner { Some(0) => 10000.0 - worn(0), Some(1) => -10000.0 + worn(1), _ => 0.0 };
    }
    let (a, b) = (&s.actors[0], &s.actors[1]);
    let lead = a.hp / a.max_hp - b.hp / b.max_hp;
    // Points per HP at this encounter's HP scale, so Mana (1.1 HP) and flux (0.75 HP) keep their HP price under any max HP.
    let hp = 500.0 / (a.max_hp + b.max_hp) + 0.5;
    lead * 250.0 + (a.hp - b.hp) * 0.5 + (a.res[R_MANA] - b.res[R_MANA]) * enc.mana_weight * hp + (a.flux - b.flux) * enc.flux_weight * hp
        + influence(enc, s, 0, hp) - influence(enc, s, 1, hp)
}

fn incoming_has(incoming: Option<Act>, f: impl Fn(Act) -> bool) -> bool { incoming.map_or(false, |i| data().acts.parts[i as usize].iter().any(|&p| f(p))) }

pub fn move_value(enc: &Encounter, s: &State, side: usize, id: Act) -> f64 {
    // Countertempo (F5.11-plan.1): an eligible spell cast under Haste also throws an Impulse.
    let impulse = if hasted_impulse(s, side, id) { attack_power(enc, s, side, data().acts.strike) } else { 0.0 };
    base_value(enc, s, side, id) + impulse
}

fn base_value(enc: &Encounter, s: &State, side: usize, id: Act) -> f64 {
    let d = data();
    let k = &d.acts;
    let ids = &d.ids;
    let a = &s.actors[side];
    let other = &s.actors[1 - side];
    let incoming = s.pending[1 - side];
    if id == k.strike { return attack_power(enc, s, side, id); }
    if id == k.guard { return if incoming_has(incoming, |p| p == k.strike) { 25.0 } else if incoming.is_some() { 5.0 } else { 1.0 }; }
    if id == k.reclaim { return a.flux * 0.28 - 3.0; }
    if id == k.frozen || id == k.break_free { return 0.0; }
    if id == k.cancel { return -20.0; }   // standing idle (F5.11): last in every ordering
    if id == k.hold {
        let c = a.channel.unwrap();
        let w = ids.wildfire;
        return if c.spell == ids.moonwell { 6.0 } else if c.spell == ids.starlight { if c.holds != 0 { 0.0 } else { 15.0 } }
            else if c.spell == w { damage_power(enc, side, w, d.amt(w, "hit")) + damage_power(enc, side, w, d.amt(w, "bank").max(d.amt(w, "hit"))) * 0.5 - wildfire_self(c.holds + 1) } else if c.spell == ids.siphon { damage_power(enc, side, ids.siphon, 4.0) } else { 0.0 };
    }
    if id == k.release {
        let c = a.channel.unwrap();
        return if c.spell == ids.moonwell { c.bank.min(enc.sides[side].capacity - a.res[R_MANA]) * 0.3 }
            else if c.spell == ids.starlight { damage_power(enc, side, ids.starlight, if c.holds != 0 { 18.0 } else { 9.0 }) }
            else if c.spell == ids.wildfire { damage_power(enc, side, ids.wildfire, d.amt(ids.wildfire, "hit") + c.bank) * 0.75 }
            else if c.spell == ids.siphon { c.total.min(a.max_hp - a.hp) * 0.85 } else { 0.0 };
    }
    let sp = id as usize;
    let spell = &d.spells[sp];
    let attack = attack_power(enc, s, side, id);
    if attack != 0.0 {
        // A direct hit, with what comes with it: Bramble's Bind, Roar's scatter, Acorns' second hit.
        let mut v = attack;
        if spell.bind.is_some() && !has(s, 1 - side, Eff::Bound) { v += 8.0; }
        if let Some(dr) = spell.drain { v += amount(enc, side, Some(sp), dr, false).min(other.res[R_MANA]) * 0.4; }
        if d.amt(sp, "next") > 0.0 { v += damage_power(enc, side, sp, d.amt(sp, "next")) * 0.7; }
        return v - cost(enc, s, side, id) * 0.12;
    }
    if sp == ids.mend {
        return if incoming_has(incoming, |p| p == k.strike || ((p as usize) < k.n_spells && d.spells[p as usize].damage.is_some())) { -3.0 }
            else { (a.max_hp - a.hp).min(amount(enc, side, Some(sp), spell.healing.as_ref().unwrap()[(enc.sides[side].rank[sp] - 1) as usize], true)) * 0.9 - cost(enc, s, side, id) * 0.12 };
    }
    if sp == ids.purify {
        return amount(enc, side, Some(sp), 24.0, false).min(enc.sides[side].capacity - a.res[R_MANA]) * 0.3 - amount(enc, side, Some(sp), 4.0, true) * 0.65;
    }
    // Creature mechanics by property (world expansion 1): poison by its damage over time, a bind, a drain by the Mana it takes.
    if spell.poison.is_some() || spell.bind.is_some() || spell.drain.is_some() {
        let mut v = 0.0;
        if let Some((per, n)) = spell.poison { v += damage_power(enc, side, sp, per) * n as f64 * 0.8; }
        if let Some(b) = spell.bind { if !has(s, 1 - side, Eff::Bound) { v += 8.0 * b as f64; } }
        if let Some(dr) = spell.drain { v += amount(enc, side, Some(sp), dr, false).min(other.res[R_MANA]) * 0.4; }
        return v - cost(enc, s, side, id) * 0.12;
    }
    let inc = incoming.is_some();
    // A delayed blow (F5.11) is worth its hit to come, discounted as Omen's is.
    if spell.delay.is_some() { return damage_power(enc, side, sp, d.amt(sp, "hit") + d.amt(sp, "impact")) * 0.4 - cost(enc, s, side, id) * 0.12; }
    let rule = spell.rule;
    let base = if rule == ids.ward { if inc { 25.0 } else { 3.0 } } else if rule == ids.brace { if inc { 22.0 } else { 7.0 } } else if rule == ids.shadowstep { if inc { 23.0 } else { 8.0 } }
        else if sp == ids.foresight { 7.0 } else if sp == ids.haste { 10.0 } else if sp == ids.animate { 12.0 } else if sp == ids.heartwood { 12.0 } else if spell.construct.is_some() && sp != ids.contraption { 11.0 }
        else if sp == ids.contraption { 17.0 } else if sp == ids.omen { damage_power(enc, side, sp, d.amt(sp, "hit")) * 2.0 * 0.4 } else if sp == ids.starlight { 15.0 } else if sp == ids.wildfire { 14.0 }
        else if sp == ids.siphon { 13.0 } else if sp == ids.moonwell { 2.0 } else if sp == ids.lodestar { if a.hp < a.max_hp * 0.8 { 9.0 } else { 5.0 } } else if sp == ids.rime { if a.hp < a.max_hp * 0.5 { 10.0 } else { 3.0 } }
        else if sp == ids.reflect { if inc { 21.0 } else { 1.0 } } else if sp == ids.seal { other.flux * 0.3 }
        else if sp == ids.extraction { 0f64.max(other.res[R_MANA].min(enc.sides[side].capacity - a.res[R_MANA] - a.flux)) * 0.4 }
        else if sp == ids.torment { 13.0 } else if sp == ids.compel { 10.0 } else if sp == ids.eclipse { if inc { 7.0 } else { 0.0 } }
        else if sp == ids.heartprice { (a.max_hp - a.hp).min(a.res[R_MANA]) * 0.3 - 3.0 }
        else if sp == ids.glamour || sp == ids.rapport { if enc.observers && reward_next(enc, s, side, sp) > EPS { 2.0 } else { -2.0 } }
        else if sp == ids.sleight { if other.res[R_CROWNS] > 0.0 && reward_next(enc, s, side, sp) > EPS { 1.0 } else { -2.0 } } else { -3.0 };
    base - cost(enc, s, side, id) * 0.12
}

#[inline]
fn move_tie(enc: &Encounter, s: &State, id: Act) -> f64 {
    let (p, h) = data().acts.tie[id as usize];
    let side = actor_to_move(s).unwrap();
    let n0 = (enc.sides[side].level * 97 + s.round) as u32;
    ((n0.wrapping_mul(p) as u64 + h as u64) % 4294967296 % 997) as f64
}

/// Spells that change nothing this exchange; each is weakly dominated by Guard. Pruned at internal nodes only.
pub fn no_op_action(enc: &Encounter, s: &State, side: usize, id: Act) -> bool {
    let d = data();
    let (k, ids) = (&d.acts, &d.ids);
    let a = &s.actors[side];
    let other = &s.actors[1 - side];
    let cap = enc.sides[side].capacity;
    if id == k.reclaim { return a.flux.min(cap - a.res[R_MANA]) <= 1e-9; }
    let sp = id as usize;
    if sp >= k.n_spells { return false; }
    // Countertempo's Impulse makes any eligible cast count, whatever its own effect (F5.11-plan.1).
    if hasted_impulse(s, side, id) { return false; }
    if sp == ids.candour || sp == ids.quickquill || sp == ids.index || sp == ids.toll { return true; }
    if sp == ids.mend { return a.hp >= a.max_hp; }
    if sp == ids.seal { return other.flux <= 1e-9; }
    if sp == ids.extraction { return other.res[R_MANA] <= 0.0 || a.res[R_MANA] + a.flux >= cap; }
    if sp == ids.glamour { return !enc.observers || reward_next(enc, s, side, sp) <= EPS; }
    if sp == ids.rapport { return !enc.observers || a.res[R_CROWNS] < 10.0 || reward_next(enc, s, side, sp) <= EPS; }
    if sp == ids.sleight { return other.res[R_CROWNS] <= 0.0 || reward_next(enc, s, side, sp) <= EPS; }
    if sp == ids.rime { return a.rime_used || a.rime_ready; }
    if sp == ids.heartprice { return has(s, side, Eff::Heartprice); }
    if sp == ids.purify { return a.res[R_MANA] >= cap; }
    false
}

pub fn tactical_threat(s: &State) -> bool {
    s.actors.iter().any(|a| a.channel.is_some() || a.omens.iter().any(|o| o.due == s.round) || a.constructs.iter().any(|c| c.expires == s.round) || a.effects[Eff::Lodestar as usize].map_or(false, |e| e.from == s.round))
}

/// The adjacent representable score, so PVS null windows are valid for a floating-point evaluator.
pub fn next_score(x: f64, up: bool) -> f64 {
    if x.is_nan() || x == if up { f64::INFINITY } else { f64::NEG_INFINITY } { return x; }
    if x == 0.0 { return if up { f64::from_bits(1) } else { -f64::from_bits(1) }; }
    let b = x.to_bits();
    f64::from_bits(if (x > 0.0) == up { b + 1 } else { b - 1 })
}

// ---- transposition table ----

const SCORE_SLOTS: usize = 8;
#[derive(Clone, Copy, PartialEq)]
pub enum Flag { Exact, Lower, Upper }
#[derive(Clone, Copy)]
struct Score { horizon: i32, value: f64, flag: Flag }
#[derive(Clone)]
pub struct Entry { key: (u64, u64), depth: i32, generation: u32, pub best: Option<Act>, scores: [Option<Score>; SCORE_SLOTS], next: usize }

pub struct Context {
    table: Vec<Option<Entry>>,
    pub limit: usize,
    pub size: usize,
    generation: u32,
    hist: [Vec<f64>; 2],
    killers: Vec<[Option<Act>; 2]>,
}
impl Context {
    pub fn new(limit: usize) -> Context {
        let n = data().acts.names.len();
        Context { table: vec![None; limit.max(1)], limit: limit.max(1), size: 0, generation: 0, hist: [vec![0.0; n], vec![0.0; n]], killers: Vec::new() }
    }
    pub fn probe(&self, key: (u64, u64)) -> Option<&Entry> {
        match &self.table[(key.0 % self.limit as u64) as usize] { Some(e) if e.key == key => Some(e), _ => None }
    }
    fn store(&mut self, key: (u64, u64), horizon: i32, depth: i32, best: Option<Act>, value: f64, flag: Flag) {
        let i = (key.0 % self.limit as u64) as usize;
        let generation = self.generation;
        let replace = match &self.table[i] {
            Some(e) if e.key == key => false,
            Some(e) => { if e.generation == generation && e.depth > depth { return; } true }
            None => { self.size += 1; true }
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

/// 128-bit position key over everything that can change what happens next (not settlement-only accounting).
pub fn position_key(s: &State) -> (u64, u64) {
    struct H(u64, u64);
    impl H {
        #[inline] fn w(&mut self, x: u64) {
            self.0 = (self.0 ^ x).wrapping_mul(0x9E37_79B9_7F4A_7C15).rotate_left(29);
            self.1 = (self.1 ^ x.rotate_left(17)).wrapping_mul(0xC2B2_AE3D_27D4_EB4F).rotate_left(31);
        }
        #[inline] fn f(&mut self, x: f64) { self.w(x.to_bits()) }
        #[inline] fn o(&mut self, x: Option<Act>) { self.w(x.map_or(0xFFFF, |a| a as u64)) }
    }
    let mut h = H(0x243F_6A88_85A3_08D3, 0x1319_8A2E_0370_7344);
    h.w(s.round as u64); h.w(s.normal_leader as u64); h.w(s.leader as u64);
    h.w(s.early_commit[0] as u64); h.w(s.early_commit[1] as u64);
    h.o(s.pending[0]); h.o(s.pending[1]); h.w(s.quiet as u64);
    for a in &s.actors {
        for x in a.res { h.f(x); }
        h.f(a.hp); h.f(a.flux);
        for (i, e) in a.effects.iter().enumerate() {
            if let Some(e) = e { h.w(i as u64 + 1000); h.f(e.value); h.w(e.from as u64); h.w(e.until.map_or(u64::MAX, |u| u as u64)); h.w(e.source.map_or(9, |x| x as u64)); }
        }
        match a.channel { Some(c) => { h.w(c.spell as u64 + 2000); h.w(c.holds as u64); h.f(c.bank); h.f(c.total); } None => h.w(1999) }
        h.w(a.constructs.len() as u64);
        for c in a.constructs.iter() { h.w(c.spell as u64); h.f(c.power); h.f(c.reduction); h.f(c.threshold); h.f(c.taken); h.w(c.expires as u64); }
        h.w(a.omens.len() as u64);
        for o in a.omens.iter() { h.w(o.due as u64); h.f(o.power); h.w(o.spell as u64 | (o.impact as u64) << 16 | (o.bounced as u64) << 17); }
        h.o(a.last_action);
        h.w(a.rime_ready as u64 | (a.rime_used as u64) << 1 | (a.glamour_done as u64) << 2);
        h.w(a.freeze_until as u64);
        h.w(a.guard_round as u64);
        h.f(a.pending_renown);
        h.o(a.captured);
        h.w(a.tranches[0] as u64 | (a.tranches[1] as u64) << 8 | (a.tranches[2] as u64) << 16);
    }
    (h.0, h.1)
}

// ---- search ----

#[derive(Clone)]
pub struct SearchOptions {
    pub max_depth: i32,
    pub node_budget: u64,
    pub rank_actions: bool,
    pub prune: bool,
    pub lmr: usize,
    pub tactical: bool,
    pub pvs: bool,
    pub aspiration: bool,
    /// Absolute deadline on the clock, in ms.
    pub deadline: Option<f64>,
    pub table: bool,
    /// The Engine eval (neural.rs) instead of evaluate().
    pub mlp: bool,
}
impl Default for SearchOptions {
    fn default() -> Self { SearchOptions { max_depth: 3, node_budget: 5000, rank_actions: false, prune: false, lmr: 0, tactical: false, pvs: true, aspiration: true, deadline: None, table: true, mlp: false } }
}

#[derive(Clone, Debug, Default)]
pub struct SearchResult {
    pub id: Act,
    pub value: f64,
    pub completed_depth: i32,
    pub nodes: u64,
    pub cutoffs: u64,
    pub cache_hits: u64,
    pub elapsed_ms: f64,
    pub stopping_reason: &'static str,
    pub extension_nodes: u64,
    pub extensions: u64,
    pub pvs_researches: u64,
    pub aspiration_researches: u64,
    pub lmr_probes: u64,
    pub lmr_cuts: u64,
    pub ranked: Vec<(Act, f64)>,
}

struct Abort;
type Sr<T> = Result<T, Abort>;

struct Searcher<'a> {
    enc: &'a Encounter,
    ctx: &'a mut Context,
    o: &'a SearchOptions,
    now: &'a dyn Fn() -> f64,
    tactical: i32,
    r: SearchResult,
    ticks: u32,
    rows: Vec<Vec<Row>>,
}

#[derive(Clone, Copy, Default)]
struct Row { id: Act, index: usize, score: f64, tie: f64, preferred: f64, killer: f64, history: f64 }
#[inline]
fn before(a: &Row, b: &Row) -> bool {
    for d in [b.preferred - a.preferred, b.killer - a.killer, b.history - a.history, b.score - a.score, a.tie - b.tie, a.index as f64 - b.index as f64] {
        if d != 0.0 && !d.is_nan() { return d < 0.0; }
    }
    false
}

impl Searcher<'_> {
    #[inline]
    fn eval(&self, s: &State) -> f64 { if self.o.mlp { crate::neural::evaluate(self.enc, s) } else { evaluate(self.enc, s) } }
    #[inline]
    fn check(&mut self) -> Sr<()> {
        if self.r.nodes >= self.o.node_budget { self.r.stopping_reason = "nodes"; return Err(Abort); }
        if let Some(dl) = self.o.deadline {
            self.ticks += 1;
            if self.ticks & 31 == 0 && (self.now)() >= dl { self.r.stopping_reason = "deadline"; return Err(Abort); }
        }
        Ok(())
    }
    /// ordered(): preferred (cache best), killers, history, move value, tie hash, index.
    fn ordered(&mut self, s: &State, actions: &[Act], preferred: Option<Act>, ply: usize) -> Moves {
        let side = actor_to_move(s).unwrap();
        let killers = self.ctx.killer(ply);
        while self.rows.len() <= ply { self.rows.push(Vec::with_capacity(48)); }
        let mut pool = std::mem::take(&mut self.rows[ply]);
        pool.clear();
        for (i, &id) in actions.iter().enumerate() {
            let r = Row {
                id, index: i, score: move_value(self.enc, s, side, id), tie: move_tie(self.enc, s, id),
                preferred: if Some(id) == preferred { 1.0 } else { 0.0 },
                killer: if killers[0] == Some(id) { 2.0 } else if killers[1] == Some(id) { 1.0 } else { 0.0 },
                history: self.ctx.hist[side][id as usize],
            };
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
        self.r.nodes += 1;
        if in_ext { self.r.extension_nodes += 1; }
        if s.result.is_some() { return Ok(self.eval(s)); }
        if depth <= 0 {
            if self.o.tactical && ext != 0 && tactical_threat(s) { depth = 1; ext = 0; in_ext = true; self.r.extensions += 1; }
            else { return Ok(self.eval(s)); }
        }
        let horizon = depth * 4 + ext * 2 + self.tactical;
        let (orig_alpha, orig_beta) = (alpha, beta);
        let key = if self.o.table { Some(position_key(s)) } else { None };
        let mut preferred = None;
        if let Some(key) = key {
            if let Some(e) = self.ctx.probe(key) {
                preferred = e.best;
                if let Some(c) = e.scores.iter().flatten().find(|x| x.horizon == horizon) {
                    self.r.cache_hits += 1;
                    match c.flag { Flag::Exact => return Ok(c.value), Flag::Lower => alpha = alpha.max(c.value), Flag::Upper => beta = beta.min(c.value) }
                    if alpha >= beta { return Ok(c.value); }
                }
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
            // Late-move reduction: a late move first gets a one-exchange-shallower null-window probe.
            if self.o.lmr != 0 && i >= self.o.lmr && depth >= 2 && !in_ext && bound_finite {
                self.r.lmr_probes += 1;
                let (lo, hi) = if max { (alpha, next_score(alpha, true)) } else { (next_score(beta, false), beta) };
                score = self.child_score(s, id, depth - 1, ext, lo, hi, ply, in_ext)?;
                if if max { score <= alpha } else { score >= beta } {
                    self.r.lmr_cuts += 1;
                    if best.is_none() || if max { score > v } else { score < v } { v = score; best = Some(id); }
                    continue;
                }
            }
            if self.o.pvs && i > 0 && bound_finite {
                let (lo, hi) = if max { (alpha, next_score(alpha, true)) } else { (next_score(beta, false), beta) };
                score = self.child_score(s, id, depth, ext, lo, hi, ply, in_ext)?;
                if score > alpha && score < beta { self.r.pvs_researches += 1; score = self.child_score(s, id, depth, ext, alpha, beta, ply, in_ext)?; }
            } else { score = self.child_score(s, id, depth, ext, alpha, beta, ply, in_ext)?; }
            if best.is_none() || if max { score > v } else { score < v } { v = score; best = Some(id); }
            if max { alpha = alpha.max(v); } else { beta = beta.min(v); }
            if alpha >= beta {
                self.r.cutoffs += 1;
                let h = &mut self.ctx.hist[who][id as usize];
                *h = 1_000_000f64.min(*h + (depth * depth) as f64);
                while self.ctx.killers.len() <= ply { self.ctx.killers.push([None, None]); }
                let k = &mut self.ctx.killers[ply];
                if k[0] != Some(id) { if k[0].is_some() { k[1] = k[0]; } k[0] = Some(id); }
                break;
            }
        }
        if let Some(key) = key {
            let flag = if v <= orig_alpha { Flag::Upper } else if v >= orig_beta { Flag::Lower } else { Flag::Exact };
            self.ctx.store(key, horizon, depth, best, v, flag);
        }
        Ok(v)
    }
}

/// searchAction(): iterative deepening over the root moves.
pub fn search(enc: &Encounter, root: &State, o: &SearchOptions, ctx: &mut Context, now: &dyn Fn() -> f64) -> Result<SearchResult, String> {
    if o.max_depth < 1 || o.node_budget < 1 { return Err("Invalid search budget".into()); }
    let start = now();
    ctx.generation += 1;
    let mut sr = Searcher { enc, ctx, o, now, tactical: o.tactical as i32, r: SearchResult { stopping_reason: "depth", ..Default::default() }, ticks: 0, rows: Vec::new() };
    let side = actor_to_move(root).ok_or("No legal decision")?;
    let root_key = position_key(root);
    let root_pref = if o.table { sr.ctx.probe(root_key).and_then(|e| e.best) } else { None };
    let legal = legal_actions(enc, root);
    if legal.is_empty() { return Err("No legal decision".into()); }
    let moves = sr.ordered(root, legal.as_slice(), root_pref, 0);
    let mut best = moves.as_slice()[0];
    let mut value = sr.eval(root);
    let mut completed = 0;
    let mut ranked = Vec::new();
    for depth in 1..=o.max_depth {
        let (mut low, mut high, mut width) = (f64::NEG_INFINITY, f64::INFINITY, 8.0);
        if o.aspiration && !o.rank_actions && completed != 0 { low = value - width; high = value + width; }
        let outcome: Sr<(Act, f64, Vec<(Act, f64)>)> = (|| loop {
            // iteration(): best move first, then the rest in root order.
            let mut chosen = best;
            let mut v = if side == 0 { f64::NEG_INFINITY } else { f64::INFINITY };
            let (mut alpha, mut beta) = (low, high);
            let mut scores = Vec::with_capacity(moves.len());
            let order = std::iter::once(best).chain(moves.iter().copied().filter(|&m| m != best));
            for id in order {
                let n = sr.child_score(root, id, depth, 1, if o.rank_actions { f64::NEG_INFINITY } else { alpha }, if o.rank_actions { f64::INFINITY } else { beta }, 0, false)?;
                scores.push((id, n));
                if if side == 0 { n > v } else { n < v } { v = n; chosen = id; }
                if side == 0 { alpha = alpha.max(v); } else { beta = beta.min(v); }
                if !o.rank_actions && alpha >= beta { break; }
            }
            if v > low && v < high { return Ok((chosen, v, scores)); }
            sr.r.aspiration_researches += 1;
            width *= 4.0;
            if width >= 32768.0 { low = f64::NEG_INFINITY; high = f64::INFINITY; } else { low = value - width; high = value + width; }
        })();
        match outcome {
            Ok((c, v, scores)) => {
                best = c; value = v; ranked = scores; completed = depth;
                if o.table { sr.ctx.store(root_key, depth * 4 + 2 + sr.tactical, depth, Some(best), value, Flag::Exact); }
            }
            Err(Abort) => break,
        }
    }
    let mut r = sr.r;
    r.id = best; r.value = value; r.completed_depth = completed; r.ranked = if o.rank_actions { ranked } else { Vec::new() };
    r.elapsed_ms = now() - start;
    Ok(r)
}

// ---- the AI policy (chooseAIAction) ----

fn profile(name: &str) -> Option<Value> {
    Some(match name {
        "full" => json!({"maxDepth": 3, "mistakeChance": 0}),
        "shallow" => json!({"maxDepth": 1, "mistakeChance": 0}),
        "fallible" => json!({"maxDepth": 3, "mistakeChance": 0.30}),
        "shallow_fallible" => json!({"maxDepth": 1, "mistakeChance": 0.30}),
        _ => return None,
    })
}
pub fn compute_profile(name: &str) -> Option<Value> {
    Some(match name {
        "live_fast" => json!({"budgetMs": 100, "maxDepth": 8, "nodeBudget": 1000000, "tableLimit": 4096, "horizonMode": "tactical"}),
        "live_deep" => json!({"budgetMs": 500, "maxDepth": 8, "nodeBudget": 5000000, "tableLimit": 16384, "horizonMode": "tactical"}),
        "analyst" => json!({"maxDepth": 6, "nodeBudget": 200000, "tableLimit": 65536, "horizonMode": "tactical"}),
        _ => return None,
    })
}

/// Stateless policy draws: previewing or searching never advances a random stream.
pub fn policy_draw(seed: u32, s: &State, slot: u32) -> f64 {
    let side = actor_to_move(s).unwrap() as u32;
    let phase = 0u32;
    let mut n = seed ^ (s.round as u32).wrapping_mul(0x9e3779b9) ^ (side + 1).wrapping_mul(0x85ebca6b) ^ (phase + 1).wrapping_mul(0xc2b2ae35) ^ (slot + 1).wrapping_mul(0x27d4eb2f);
    n = (n ^ (n >> 16)).wrapping_mul(0x7feb352d);
    n = (n ^ (n >> 15)).wrapping_mul(0x846ca68b);
    (n ^ (n >> 16)) as f64 / 4294967296.0
}

pub fn plausible_mistake(enc: &Encounter, s: &State, id: Act) -> bool {
    let d = data();
    let (k, ids) = (&d.acts, &d.ids);
    let side = actor_to_move(s).unwrap();
    let a = &s.actors[side];
    let other = &s.actors[1 - side];
    let sp = id as usize;
    let cap = enc.sides[side].capacity;
    if sp == ids.candour || sp == ids.quickquill || sp == ids.index || sp == ids.toll { return false; }
    if id == k.reclaim && a.flux <= 1e-9 { return false; }
    if sp == ids.mend && a.hp >= a.max_hp { return false; }
    if sp == ids.seal && other.flux <= 1e-9 { return false; }
    if sp == ids.extraction && (other.res[R_MANA] <= 0.0 || a.res[R_MANA] + a.flux >= cap) { return false; }
    if (sp == ids.glamour || sp == ids.rapport || sp == ids.sleight) && !hasted_impulse(s, side, id) && (reward_next(enc, s, side, sp) <= EPS || (sp != ids.sleight && !enc.observers)) { return false; }
    if sp == ids.rapport && a.res[R_CROWNS] < 10.0 && !hasted_impulse(s, side, id) { return false; }
    if sp == ids.sleight && other.res[R_CROWNS] <= 0.0 && !hasted_impulse(s, side, id) { return false; }
    if sp == ids.rime && (a.rime_used || a.rime_ready) { return false; }
    if sp == ids.heartprice && has(s, side, Eff::Heartprice) { return false; }
    if sp == ids.purify && (a.res[R_MANA] >= cap || a.hp <= amount(enc, side, Some(sp), 4.0, true)) { return false; }
    if id == k.release { if let Some(c) = a.channel { if c.spell == ids.moonwell && c.bank == 0.0 { return false; } } }
    if s.pending[1 - side].is_some() {
        let mut child = *s;
        apply_known(enc, &mut child, id, None);
        if child.result.map_or(false, |r| r.winner == Some(1 - side as u8)) { return false; }
    }
    true
}

fn merge(into: &mut Map<String, Value>, from: &Value) { if let Some(o) = from.as_object() { for (k, v) in o { into.insert(k.clone(), v.clone()); } } }
fn get_f(o: &Map<String, Value>, k: &str) -> Option<f64> { o.get(k).and_then(|v| v.as_f64()) }

pub fn search_options(o: &Map<String, Value>) -> Result<SearchOptions, String> {
    let max_depth = get_f(o, "maxDepth").unwrap_or(3.0);
    let node_budget = get_f(o, "nodeBudget").unwrap_or(5000.0);
    let horizon = o.get("horizonMode").and_then(|v| v.as_str()).unwrap_or("fixed");
    if max_depth.fract() != 0.0 || max_depth < 1.0 || node_budget.fract() != 0.0 || node_budget < 1.0 || !(horizon == "fixed" || horizon == "tactical") { return Err("Invalid search budget".into()); }
    if let Some(b) = o.get("budgetMs") { if !b.as_f64().map_or(false, |x| x.is_finite() && x >= 0.0) { return Err("Invalid search budget".into()); } }
    Ok(SearchOptions {
        max_depth: max_depth as i32, node_budget: node_budget as u64,
        rank_actions: o.get("rankActions").and_then(|v| v.as_bool()).unwrap_or(false),
        prune: o.get("prune").and_then(|v| v.as_bool()).unwrap_or(false),
        lmr: get_f(o, "lmr").unwrap_or(0.0) as usize,
        tactical: horizon == "tactical",
        pvs: o.get("pvs").and_then(|v| v.as_bool()).unwrap_or(true),
        aspiration: o.get("aspiration").and_then(|v| v.as_bool()).unwrap_or(true),
        deadline: get_f(o, "deadline"),
        table: o.get("table").and_then(|v| v.as_bool()).unwrap_or(true),
        mlp: match o.get("eval").and_then(|v| v.as_str()) { None | Some("hand") => false, Some("mlp") => true, Some(_) => return Err("Unknown eval".into()) },
    })
}

pub fn result_json(r: &SearchResult, ctx: &Context) -> Map<String, Value> {
    let d = data();
    let mut m = Map::new();
    m.insert("id".into(), json!(d.name(r.id)));
    m.insert("value".into(), json!(r.value));
    for (k, v) in [("completedDepth", r.completed_depth as u64), ("nodes", r.nodes), ("cutoffs", r.cutoffs), ("cacheHits", r.cache_hits), ("extensionNodes", r.extension_nodes), ("extensions", r.extensions),
        ("pvsResearches", r.pvs_researches), ("aspirationResearches", r.aspiration_researches), ("lmrProbes", r.lmr_probes), ("lmrCuts", r.lmr_cuts), ("tableEntries", ctx.size as u64), ("tableLimit", ctx.limit as u64)] {
        m.insert(k.into(), json!(v));
    }
    m.insert("elapsedMs".into(), json!(r.elapsed_ms));
    m.insert("stoppingReason".into(), json!(r.stopping_reason));
    m.insert("policyVersion".into(), json!(POLICY_VERSION));
    if !r.ranked.is_empty() { m.insert("rankedActions".into(), Value::Array(r.ranked.iter().map(|(id, v)| json!({"id": d.name(*id), "value": v})).collect())); }
    m
}

/// searchAction with JS-style options (maxDepth, nodeBudget, budgetMs, rankActions, prune, lmr, horizonMode, pvs, aspiration, table).
pub fn search_json(enc: &Encounter, s: &State, options: &Value, ctx: &mut Context, now: &dyn Fn() -> f64) -> Result<Value, String> {
    let mut o = Map::new();
    merge(&mut o, &json!({"maxDepth": 3, "nodeBudget": 5000, "horizonMode": "fixed"}));
    merge(&mut o, options);
    if let Some(b) = get_f(&o, "budgetMs") { let dl = get_f(&o, "deadline").unwrap_or(f64::INFINITY).min(now() + b); o.insert("deadline".into(), json!(dl)); }
    let so = search_options(&o)?;
    let r = search(enc, s, &so, ctx, now)?;
    let mut m = result_json(&r, ctx);
    m.insert("horizonMode".into(), json!(if so.tactical { "tactical" } else { "fixed" }));
    Ok(Value::Object(m))
}

/// chooseAIAction: profiles and compute profiles, the search, and the seeded plausible mistake.
pub fn choose(enc: &Encounter, s: &State, overrides: &Value, ctx: &mut Context, now: &dyn Fn() -> f64) -> Result<Value, String> {
    let d = data();
    let start = now();
    let side = actor_to_move(s).ok_or("Fight ended")?;
    let cfg = &enc.config;
    let settings = cfg.get("ai").and_then(|a| a.get(side)).cloned().unwrap_or(json!({}));
    let ov = |k: &str| overrides.get(k).filter(|v| !v.is_null());
    let profile_name = ov("profile").or_else(|| settings.get("profile")).and_then(|v| v.as_str()).map(String::from);
    if let Some(p) = &profile_name { if profile(p).is_none() { return Err("Unknown AI profile".into()); } }
    let cp = ov("computeProfile").or_else(|| settings.get("computeProfile")).or_else(|| cfg.get("search").and_then(|x| x.get("computeProfile"))).or_else(|| cfg.get("computeProfile"))
        .and_then(|v| v.as_str()).map(String::from);
    if let Some(c) = &cp { if compute_profile(c).is_none() { return Err("Unknown compute profile".into()); } }
    let mut behavior = profile_name.as_deref().and_then(profile).unwrap_or(json!({}));
    if cp.is_some() && matches!(profile_name.as_deref(), Some("full") | Some("fallible")) { behavior.as_object_mut().unwrap().remove("maxDepth"); }
    let mut o = Map::new();
    merge(&mut o, &json!({"maxDepth": 3, "nodeBudget": 5000, "horizonMode": "fixed", "mistakeChance": 0, "maxRegret": 35}));
    if let Some(c) = &cp { merge(&mut o, &compute_profile(c).unwrap()); }
    if let Some(x) = cfg.get("search") { merge(&mut o, x); }
    merge(&mut o, &behavior);
    merge(&mut o, &settings);
    merge(&mut o, overrides);
    if let Some(b) = get_f(&o, "budgetMs") { let dl = get_f(&o, "deadline").unwrap_or(f64::INFINITY).min(start + b); o.insert("deadline".into(), json!(dl)); }
    let mistake_chance = get_f(&o, "mistakeChance").unwrap_or(0.0);
    let max_regret = get_f(&o, "maxRegret").unwrap_or(35.0);
    let seed = get_f(&o, "seed").unwrap_or(enc.sides[side].level as f64);
    if !(0.0..=1.0).contains(&mistake_chance) || !max_regret.is_finite() || max_regret < 0.0 || seed.fract() != 0.0 || seed < 0.0 || seed > 4294967295.0 { return Err("Invalid AI degradation settings".into()); }
    let seed = seed as u32;
    let options = search_options(&o)?;
    // The persona opponents (Easy, Medium; persona.rs): their own choice, never the alpha-beta below.
    if o.get("algorithm").and_then(|v| v.as_str()) == Some("persona") {
        let mut m = crate::persona::choose(enc, s, &o);
        m["seed"] = json!(seed); m["mistakeChance"] = json!(mistake_chance); m["elapsedMs"] = json!(now() - start);
        return Ok(m);
    }
    let node_budget = options.node_budget;
    let legal_count = legal_actions(enc, s).len();
    // Reserve half the compute budget on seeded mistake attempts, so a deep main search can't disable fallibility.
    let roll = if mistake_chance > 0.0 { Some(policy_draw(seed, s, 0)) } else { None };
    let wants_ranking = roll.map_or(false, |r| r < mistake_chance) && legal_count > 1;
    let mut main = options.clone();
    if cp.is_some() && wants_ranking {
        main.node_budget = 1.max(node_budget / 2);
        if let Some(dl) = options.deadline { main.deadline = Some(start + (dl - start) / 2.0); }
    }
    let best = search(enc, s, &main, ctx, now)?;
    let mut m = result_json(&best, ctx);
    m.insert("horizonMode".into(), json!(if options.tactical { "tactical" } else { "fixed" }));
    m.insert("bestId".into(), json!(d.name(best.id)));
    for (k, v) in [("degraded", json!(false)), ("mistakeAttempted", json!(false)), ("regret", json!(0)), ("eligible", json!(0)), ("rankingDepth", json!(0)), ("rankingNodes", json!(0)),
        ("totalNodes", json!(best.nodes)), ("seed", json!(seed)), ("mistakeChance", json!(mistake_chance)), ("maxDepth", json!(options.max_depth)),
        ("computeProfile", json!(cp.clone().unwrap_or_else(|| "legacy".into()))), ("budgetMs", o.get("budgetMs").cloned().unwrap_or(Value::Null)), ("nodeBudget", json!(node_budget))] { m.insert(k.into(), v); }
    let elapsed = |m: &mut Map<String, Value>| { m.insert("elapsedMs".into(), json!(now() - start)); };
    elapsed(&mut m);
    // Personality and difficulty (F5.9): `tilt` adds to chosen actions' values (× tiltScale), and `slack` lets the AI pick at
    // random among moves within that many points of the best tilted one; either way never a move worse than maxRegret.
    let tilt_scale = get_f(&o, "tiltScale").unwrap_or(1.0);
    let tilt: Vec<(String, f64)> = o.get("tilt").and_then(|t| t.as_object()).map(|t| t.iter().filter_map(|(k, v)| v.as_f64().map(|x| (k.clone(), x * tilt_scale))).filter(|(_, x)| *x != 0.0).collect()).unwrap_or_default();
    let slack = get_f(&o, "slack").unwrap_or(0.0);
    // The urge to deal damage (F5.9d, rules::URGE_STEP): a side that has dealt none for a while leans toward damaging spells, as a
    // tilt that grows (× tiltScale, so Engine never feels it).
    let urge = s.actors[side].urge * tilt_scale;
    if (!tilt.is_empty() || slack > 0.0 || urge > 0.0) && legal_count > 1 && best.completed_depth > 0 {
        let mut ro = options.clone();
        ro.max_depth = best.completed_depth; ro.rank_actions = true;
        let ranked = search(enc, s, &ro, ctx, now)?;
        m.insert("totalNodes".into(), json!(best.nodes + ranked.nodes));
        if ranked.completed_depth == best.completed_depth && !ranked.ranked.is_empty() {
            let sign = if side == 0 { 1.0 } else { -1.0 };
            let best_u = ranked.ranked.iter().map(|&(_, v)| sign * v).fold(f64::NEG_INFINITY, f64::max);
            let k = &d.acts;
            // A channel's Hold and Release also take `<spell>_hold` / `<spell>_release` (e.g. wildfire_hold), so a persona can
            // favour holding one channel rather than every Hold.
            let channel = s.actors[side].channel.map(|c| d.spells[c.spell].id.as_str());
            // A damaging spell: one with damage, or a bundle with one in it (Strike is not a spell).
            let damaging = |id: Act| k.parts[id as usize].iter().any(|&p| (p as usize) < k.n_spells && d.spells[p as usize].damage.is_some());
            let bonus = |id: Act| -> f64 {
                let name = d.name(id);
                let mut own = tilt.iter().find(|(t, _)| t == name).map_or(0.0, |x| x.1);
                if let Some(ch) = channel { if name == "hold" || name == "release" { let key = format!("{ch}_{name}"); own += tilt.iter().find(|(t, _)| *t == key).map_or(0.0, |x| x.1); } }
                let parts = if k.is_bundle[id as usize] { k.parts[id as usize].iter().map(|&p| { let n = d.name(p); tilt.iter().find(|(t, _)| t == n).map_or(0.0, |x| x.1) }).fold(f64::NEG_INFINITY, f64::max) } else { f64::NEG_INFINITY };
                own.max(if parts.is_finite() { parts } else { own }) + if urge > 0.0 && damaging(id) { urge } else { 0.0 }
            };
            // Candidates: the best move, and plausible weaker ones within maxRegret.
            let cands: Vec<(Act, f64, f64)> = ranked.ranked.iter().filter_map(|&(id, v)| {
                let regret = best_u - sign * v;
                if regret <= 1e-6 || (regret <= max_regret && plausible_mistake(enc, s, id)) { Some((id, regret, sign * v + bonus(id))) } else { None }
            }).collect();
            let top = cands.iter().map(|c| c.2).fold(f64::NEG_INFINITY, f64::max);
            let pool: Vec<&(Act, f64, f64)> = cands.iter().filter(|c| c.2 >= top - slack - 1e-9).collect();
            let pick = if pool.len() > 1 { pool[(policy_draw(seed, s, 2) * pool.len() as f64).floor() as usize] } else { pool[0] };
            m.insert("persona".into(), json!(true));
            m.insert("pool".into(), json!(pool.len()));
            if pick.0 != best.id {
                m.insert("id".into(), json!(d.name(pick.0)));
                m.insert("value".into(), json!(sign * (best_u - pick.1)));
                m.insert("degraded".into(), json!(true));
                m.insert("regret".into(), json!(pick.1));
            }
        }
        elapsed(&mut m);
        return Ok(Value::Object(m));
    }
    if mistake_chance == 0.0 || legal_count < 2 { return Ok(Value::Object(m)); }
    let roll = roll.unwrap();
    m.insert("mistakeRoll".into(), json!(roll));
    if roll >= mistake_chance { return Ok(Value::Object(m)); }
    m.insert("mistakeAttempted".into(), json!(true));
    if best.completed_depth == 0 { m.insert("degradationSkipped".into(), json!("no completed search")); return Ok(Value::Object(m)); }
    if now() >= options.deadline.unwrap_or(f64::INFINITY) { m.insert("degradationSkipped".into(), json!("ranking deadline")); elapsed(&mut m); return Ok(Value::Object(m)); }
    let ranking_budget = if cp.is_some() { node_budget.saturating_sub(best.nodes) } else { node_budget };
    if ranking_budget < 1 { m.insert("degradationSkipped".into(), json!("ranking nodes")); return Ok(Value::Object(m)); }
    let mut ro = options.clone();
    ro.node_budget = ranking_budget; ro.max_depth = best.completed_depth; ro.rank_actions = true;
    let ranked = search(enc, s, &ro, ctx, now)?;
    m.insert("rankingStoppingReason".into(), json!(ranked.stopping_reason));
    m.insert("rankingDepth".into(), json!(ranked.completed_depth));
    m.insert("rankingNodes".into(), json!(ranked.nodes));
    m.insert("totalNodes".into(), json!(best.nodes + ranked.nodes));
    m.insert("extensionNodes".into(), json!(best.extension_nodes + ranked.extension_nodes));
    m.insert("extensions".into(), json!(best.extensions + ranked.extensions));
    elapsed(&mut m);
    if ranked.completed_depth != best.completed_depth { m.insert("degradationSkipped".into(), json!(format!("ranking {}", ranked.stopping_reason))); return Ok(Value::Object(m)); }
    let sign = if side == 0 { 1.0 } else { -1.0 };
    let best_utility = sign * ranked.value;
    if (best_utility - sign * best.value).abs() > 1e-6 { m.insert("degradationSkipped".into(), json!("ranking disagreement")); return Ok(Value::Object(m)); }
    let mut alternatives = Vec::new();
    for &(id, value) in &ranked.ranked {
        if now() >= options.deadline.unwrap_or(f64::INFINITY) { m.insert("degradationSkipped".into(), json!("ranking deadline")); elapsed(&mut m); return Ok(Value::Object(m)); }
        let regret = best_utility - sign * value;
        if id != best.id && regret > 1e-6 && regret <= max_regret && plausible_mistake(enc, s, id) { alternatives.push((id, value, regret)); }
    }
    m.insert("eligible".into(), json!(alternatives.len()));
    if alternatives.is_empty() { m.insert("degradationSkipped".into(), json!("no plausible weaker move")); elapsed(&mut m); return Ok(Value::Object(m)); }
    let (id, value, regret) = alternatives[(policy_draw(seed, s, 1) * alternatives.len() as f64).floor() as usize];
    m.insert("id".into(), json!(d.name(id)));
    m.insert("value".into(), json!(value));
    m.insert("degraded".into(), json!(true));
    m.insert("regret".into(), json!(regret));
    elapsed(&mut m);
    Ok(Value::Object(m))
}

// Silence unused-import warnings for helpers only some builds use.
#[allow(dead_code)]
fn _uses() { let _ = (rules::EPS, EPS); }
