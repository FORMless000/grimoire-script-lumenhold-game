//! The engine's evaluation of a Crux position (a cheat, as in the duels' Engine view): an expectimax search with
//! iterative deepening. Your moves are max nodes; the dice are chance nodes, every outcome weighed exactly: a check lands
//! or holds, a press wins or misses, Foresight fixes ✓ or ✗. It searches only what you can see (`mask`): a card you
//! haven't seen is a blank when it is dealt, never a guess at what it might be, and their Agreement is the least the
//! shown crux allows.
//!
//! Depth counts your actions; a spell, or burying after a Tell, comes free with the action after it (Haste and Seal are
//! actions themselves). At the horizon a position is scored by the eval (a small network, `net`), or by playouts of the
//! smart player. A value is your chance to win from there, played well (a partial deal counts half). Star1 pruning cuts
//! a chance node once its outcomes so far settle it; positions reached twice are looked up, not searched again; below
//! the root only the likeliest spells are searched. When a depth's search never reaches the horizon, the values are
//! exact, as far as the blanks still to come don't matter, and the search stops.
use crate::bot::{self, Bot};
use crate::data::{data, Fx, Gift, Spell, Weights};
use crate::js::{iround, to_int32, Rng};
use crate::rules::{left_of, tune, Card, Dice, Game, Move, Need, Outcome};
use std::collections::HashMap;

pub const WIDTH: usize = 24;   // how many ways a move may branch at the root
pub const INNER: usize = 6;    // below it, where a returning grudge's place is sampled
pub const SPELLS_BELOW: usize = 3; // how many spells are searched below the root
pub const MAX_DEPTH: i32 = 12;

pub fn score(g: &Game) -> f64 { g.over.as_ref().map_or(0.0, |o| o.outcome.score()) }

/// A copy of the game to search, without its log, its dice or its own random numbers.
pub fn copy(g: &Game) -> Game {
    let mut c = g.clone();
    c.rng = None;
    c.dice = None;
    c.log = vec![];
    c.quiet = true;
    c
}
/// The game as you see it, which is all the engine searches. Every card of their deck you haven't seen is a blank: no
/// title, no check, no cost, only that it is there. You have seen the ones a Tell showed you, the ones you sent to the
/// bottom, and the Omen and the Lodestar you put there yourself. Agreement is hidden too: it is the least the crux's
/// shown chance allows.
pub fn mask(g: &Game) -> Game {
    let mut c = copy(g);
    let blank = data().blank;
    for (i, x) in c.deck.iter_mut().enumerate() {
        if !(i < g.seen || x.gift.is_some() || x.buried) { *x = Card::from_proto(blank, x.uid); x.unknown = true; }
    }
    if !c.guided {
        let shown = g.crux_chance();
        let mut a = 0;
        c.agreement = 0;
        while a < 60 && c.crux_chance() < shown { a += 1; c.agreement = a; }
    }
    c
}
/// A copy to play out, with its own random numbers and the arguments you haven't seen shuffled among their places.
pub fn clone_with(g: &Game, rng: Rng) -> Game {
    let mut c = copy(g);
    c.rng = Some(rng);
    let at: Vec<usize> = (0..c.deck.len()).filter(|&i| i >= c.seen && c.deck[i].gift.is_none() && !c.deck[i].buried).collect();
    for k in (1..at.len()).rev() {
        let j = c.rng.as_mut().unwrap().below(k + 1);
        c.deck.swap(at[k], at[j]);
    }
    c
}

/// Every move you could make now.
pub fn moves(g: &Game) -> Vec<Move> {
    if g.over.is_some() { return vec![]; }
    let mut out = vec![];
    if g.can_press().is_empty() { out.push(Move::Press); }
    for c in &g.table {
        if c.unknown { continue; }   // dealt in the search: not yet seen, so nothing to plan on
        out.push(Move::Confront(c.uid));
        if g.can_deflect(c.uid).is_empty() { out.push(Move::Deflect(c.uid)); }
    }
    for &id in &g.known { if g.can_cast(id).is_empty() { out.push(Move::Cast(id)); } }
    if g.can_bury { out.push(Move::Bury); }
    out
}
/// How the tray names a move.
pub fn label(g: &Game, m: Move) -> String {
    match m {
        Move::Press => "Push for crux".into(),
        Move::Confront(u) => g.card(u).map_or(m.key(), |c| format!("{} {}", if c.hex.is_some() { "Resist" } else { "Confront" }, c.title())),
        Move::Deflect(u) => g.card(u).map_or(m.key(), |c| format!("Deflect {}", c.title())),
        Move::Cast(s) => data().spell(s).name.into(),
        Move::Bury => "Send the next to the bottom".into(),
        _ => m.key(),
    }
}

pub struct Outcome1 { pub p: f64, pub g: Game, pub spent: bool, pub note: &'static str }

/// Every way a move can turn out, with its chance: the move is replayed with the dice scripted, branching at each roll
/// or draw it meets. `note` says how its first roll went; `spent` whether it used up an action. A move that would branch
/// more than `cap` ways takes an even sample of its later draws instead, the same sample each time.
pub fn outcomes(g: &Game, m: Move, cap: usize) -> Vec<Outcome1> {
    let mut out = vec![];
    go(g, m, vec![], 1.0, 1, cap, &mut out);
    out.sort_by(|x, y| y.p.partial_cmp(&x.p).unwrap());
    out
}
fn go(g: &Game, m: Move, script: Vec<u32>, p: f64, width: usize, cap: usize, out: &mut Vec<Outcome1>) {
    let mut c = copy(g);
    c.dice = Some(Box::new(Dice { script: script.clone(), i: 0, need: None }));
    let _ = c.play(m);
    if let Some(need) = c.dice.as_ref().unwrap().need.clone() {
        let mut opts: Vec<(u32, f64)> = match need {
            Need::Roll(q) => vec![(1, q), (0, 1.0 - q)],
            Need::Pick(n) => (0..n).map(|k| (k as u32, 1.0 / n as f64)).collect(),
        };
        opts.retain(|o| o.1 > 0.0);
        let room = 1.max(cap / width);
        if matches!(need, Need::Pick(_)) && opts.len() > room {
            let h = script.iter().fold(7.0f64, |h, &v| h * 31.0 + v as f64 + 1.0);
            let mut rng = Rng(to_int32(script.len() as f64 * 977.0 + h) as u32);
            for j in (1..opts.len()).rev() { let k = rng.below(j + 1); opts.swap(j, k); }
            opts.truncate(room);
            for o in opts.iter_mut() { o.1 = 1.0 / room as f64; }
        }
        let n = opts.len();
        for (v, q) in opts {
            let mut s = script.clone();
            s.push(v);
            go(g, m, s, p * q, width * n, cap, out);
        }
        return;
    }
    c.dice = None;
    let rolled = if matches!(m, Move::Confront(_) | Move::Press) && !script.is_empty() { Some(script[0]) } else { None };
    let spent = c.actions > g.actions || c.over.is_some();
    out.push(Outcome1 { p, g: c, spent, note: match rolled { None => "", Some(0) => "✗", Some(_) => "✓" } });
}

/// A position, as far as its future goes: the same key whatever the arguments' ids or places.
pub fn key_of(g: &Game) -> String {
    use std::fmt::Write;
    let sig = |c: &Card| format!("{}{}", c.id(), if c.grudged { "!" } else { "" });
    let marks = |c: &Card| format!("{}{}{}", match c.fate { Some(true) => "w", Some(false) => "l", None => "" }, if c.adv { "a" } else { "" }, if c.index { "lore" } else { "" });
    let mut table: Vec<String> = g.table.iter().map(|c| {
        let t = g.bonus(c.uid);
        format!("{}/{}/{}/{}/{}", sig(c), c.age, iround(c.boost * 100.0), marks(c), if g.temp.iter().any(|x| x.0 == c.uid) { format!("{t}") } else { "0".into() })
    }).collect();
    table.sort();
    let hi = g.deck.len() as i64 - g.under as i64;
    let seen = g.seen.min(g.deck.len());
    let known: Vec<String> = g.deck[..seen].iter().map(sig).collect();
    let mut unknown: Vec<String> = g.deck[seen..(hi.max(seen as i64) as usize)].iter().map(sig).collect();
    unknown.sort();
    let under: Vec<String> = g.deck[(hi.max(seen as i64) as usize)..].iter().map(sig).collect();
    let b = |x: bool| x as i32;
    let mut k = String::with_capacity(160);
    let _ = write!(k, "{}|{}|{}|{}|{}|{}|{}|{}|{}|{}|{}|{}|{}|{}|{}|{}|{}|{}|{}|{}|", g.patience, g.suspicion, g.agreement, g.mana, g.crowns, g.health, g.presses,
        b(g.quill), g.brace, g.foresee, g.charmed, b(g.doom), b(g.hushed), b(g.guided), b(g.stole), b(g.warmed), b(g.starlit), b(g.free_push),
        g.cast.map_or("", |s| s.name()), b(g.can_bury));
    let _ = write!(k, "{}|{}|{}|{}", table.join(","), known.join(","), unknown.join(","), under.join(","));
    k
}

// ---------- the eval: a position's worth at the horizon, as a chance to win
// A small network (one hidden layer) over what you can see, fitted to the smart player's results from positions of real
// meetings (train), as the duels distil theirs.

/// The press-out: your chance if you did nothing but push for the crux from here. Under Compel, one push is all.
pub fn press_out(g: &Game) -> f64 {
    let (mut p, mut n, mut free, mut lose) = (g.patience, g.presses, g.free_push, 1.0);
    let q = g.crux_chance();
    while p > 0 && n < 40 {
        lose *= 1.0 - q;
        let cost = if free { 0 } else { 0.max(1 + n) };
        free = false;
        p -= cost;
        n += 1;
        if g.doom { break; }
    }
    let partial = if g.enc().partial && q >= tune::PARTIAL_AT { 0.5 } else { 0.0 };
    1.0 - lose + lose * partial
}
/// The spells that change a meeting's odds, each a feature: how many casts of it your Mana affords (none, one, two+).
pub const SPELLS: [Spell; 15] = [Spell::Omen, Spell::Brace, Spell::Starlight, Spell::Haste, Spell::Candour, Spell::Ward, Spell::Glamour, Spell::Reflect,
    Spell::Index, Spell::Quickquill, Spell::Seal, Spell::Foresight, Spell::Rapport, Spell::Lodestar, Spell::Compel];
pub const FEATURES: [&str; 30] = ["pressOut", "crux", "patience", "pressCost", "suspicion", "mana", "spells", "worth1", "worth2", "worth3", "chance1", "gain1",
    "due", "sore", "quill", "brace", "ahead", "hex", "hexDue", "gift", "hushed", "doom", "deck", "partial", "blanks", "seen", "watchful",
    "fated", "free", "tableWorth"];
pub fn feature_names() -> Vec<String> { FEATURES.iter().map(|s| s.to_string()).chain(SPELLS.iter().map(|s| format!("can:{}", s.name()))).collect() }

pub fn features(g: &Game) -> Vec<f64> {
    let mut top: Vec<(f64, f64, f64)> = g.table.iter().filter(|c| !c.unknown).map(|c| (bot::worth(g, c), g.chance(c), g.gain(c))).collect();
    top.sort_by(|a, b| b.0.partial_cmp(&a.0).unwrap());
    let at = |i: usize| top.get(i).copied().unwrap_or((0.0, 0.0, 0.0));
    let castable = g.known.iter().filter(|&&id| g.mana >= g.spell_cost(id)).count();
    let count = |f: &dyn Fn(&Card) -> bool| g.table.iter().filter(|c| f(c)).count() as f64;
    let sum = |f: &dyn Fn(&Card) -> bool| g.table.iter().filter(|c| f(c)).fold(0.0, |s, c| s + bot::landing(g, c));
    let mut f = vec![
        press_out(g), g.crux_chance(), g.patience as f64 / 7.0, g.press_cost() as f64 / 4.0, g.suspicion as f64 / tune::SUSPICION_LIMIT as f64,
        if g.cap != 0.0 { g.mana as f64 / g.cap as f64 } else { 0.0 }, castable as f64 / 6.0,
        at(0).0 * 5.0, at(1).0 * 5.0, at(2).0 * 5.0, at(0).1, at(0).2 * 5.0,
        sum(&|c| left_of(c) <= 1) * 5.0,
        count(&|c| c.fx == Some(Fx::Sore)), g.quill as i32 as f64, g.brace as f64 / 2.0, (g.foresee + g.charmed) as f64 / 2.0,
        sum(&|c| c.hex.is_some()) * 2.0,
        sum(&|c| c.hex.is_some() && left_of(c) <= 1) * 2.0,
        count(&|c| c.gift.is_some()) + g.deck.iter().filter(|c| c.gift.is_some()).count() as f64 / 2.0, g.hushed as i32 as f64, g.doom as i32 as f64,
        g.deck.len() as f64 / 12.0,
        if g.enc().partial { 1.0 } else { 0.0 },
        count(&|c| c.unknown) / 3.0, g.seen.min(3) as f64 / 3.0,
        count(&|c| c.fx == Some(Fx::Watchful)), count(&|c| c.fate.is_some()) / 3.0, g.free_push as i32 as f64,
        top.iter().fold(0.0, |s, x| s + x.0.max(0.0)) * 3.0,
    ];
    for id in SPELLS {
        f.push(if g.known.contains(&id) { 2.0f64.min((g.mana as f64 / g.spell_cost(id) as f64).floor()) / 2.0 } else { 0.0 });
    }
    f
}
/// The network: tanh(h·f + b) → sigmoid(v·hidden + c).
pub fn net(w: &Weights, f: &[f64]) -> f64 {
    let mut z = w.c;
    for j in 0..w.h.len() {
        let row = &w.h[j];
        let mut a = w.b[j];
        for i in 0..f.len() { a += row[i] * f[i]; }
        z += w.v[j] * crate::js::tanh(a);
    }
    1.0 / (1.0 + crate::js::exp(-z))
}
pub fn evaluate(g: &Game, w: &Weights) -> f64 { if g.over.is_some() { score(g) } else { net(w, &features(g)) } }

#[derive(Clone, Copy, PartialEq, Eq)]
enum Flag { Exact, Lower, Upper }
#[derive(Clone)]
struct Entry { d: i32, v: f64, best: Option<Move>, flag: Flag }

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum LeafBy { Eval, Playouts }

pub struct LineStep { pub label: String, pub note: &'static str, pub end: Option<Outcome> }
pub struct ScoredLine { pub key: Move, pub label: String, pub value: f64, pub line: Option<Vec<LineStep>> }
pub struct Depth { pub depth: i32, pub exact: bool, pub value: f64, pub best: Move, pub scores: Vec<(Move, f64)>, pub lines: Vec<(Move, String, f64)> }
pub struct Report { pub depth: i32, pub exact: bool, pub done: bool, pub nodes: u64, pub value: f64, pub best: Option<Move>, pub scores: Vec<(Move, f64)>, pub lines: Vec<ScoredLine> }

/// One search: `step` searches one depth more; `report` says what it found, the best lines played out.
pub struct Analysis<'w> {
    pub root: Game,
    order: Vec<(Move, String)>,
    tt: HashMap<String, Entry>,
    pub nodes: u64,
    horizon: bool,
    pub last: Option<Depth>,
    pub done: bool,
    w: &'w Weights,
    leaf_by: LeafBy,
    playouts: usize,
    seed: u32,
    /// Stop when this returns true (checked now and then); the depth under way is then thrown away.
    pub stop: Option<Box<dyn FnMut() -> bool + 'w>>,
    stopped: bool,
}
impl<'w> Analysis<'w> {
    pub fn new(g: &Game, w: &'w Weights) -> Self {
        let root = mask(g);
        let order: Vec<(Move, String)> = moves(&root).into_iter().map(|m| (m, label(&root, m))).collect();
        let done = order.is_empty();
        Analysis { root, order, tt: HashMap::new(), nodes: 0, horizon: false, last: None, done, w, leaf_by: LeafBy::Eval, playouts: 8, seed: 1, stop: None, stopped: false }
    }
    pub fn with_playouts(mut self, playouts: usize, seed: u32) -> Self { self.leaf_by = LeafBy::Playouts; self.playouts = playouts; self.seed = seed; self }

    fn tick(&mut self) {
        self.nodes += 1;
        if self.nodes % 64 == 0 { if let Some(s) = self.stop.as_mut() { if s() { self.stopped = true; } } }
    }

    /// At the horizon: the eval, or how often the smart player wins from here, over the same dice for every position.
    fn leaf(&mut self, s: &Game) -> f64 {
        self.horizon = true;
        let v = match self.leaf_by {
            LeafBy::Eval => evaluate(s, self.w),
            LeafBy::Playouts => {
                let mut sum = 0.0;
                for k in 0..self.playouts {
                    let mut c = clone_with(s, Rng::new(self.seed as f64 * 7919.0 + k as f64));
                    bot::play(&mut c, Bot::Smart);
                    sum += score(&c);
                }
                sum / self.playouts as f64
            }
        };
        self.tick();
        v
    }

    fn max_node(&mut self, s: &Game, d: i32, a: f64, b: f64) -> f64 {
        if s.over.is_some() { return score(s); }
        if d == 0 { return self.leaf(s); }
        self.tick();
        if self.stopped { return 0.0; }
        let k = key_of(s);
        let hit = self.tt.get(&k).cloned();
        if let Some(h) = &hit {
            if h.d >= d && (h.flag == Flag::Exact || (h.flag == Flag::Lower && h.v >= b) || (h.flag == Flag::Upper && h.v <= a)) { return h.v; }
        }
        let mut ms = moves(s);
        if ms.is_empty() { return evaluate(s, self.w); }
        // Below the root, only the likeliest spells are searched: the few the eval rates best once cast (and the move
        // this position's last search found best). Every action is.
        let hit_best = hit.as_ref().and_then(|h| h.best);
        let spells: Vec<Move> = ms.iter().copied().filter(|m| matches!(m, Move::Cast(_))).collect();
        if self.leaf_by == LeafBy::Eval && spells.len() > SPELLS_BELOW {
            let mut rated: Vec<(Move, f64)> = spells.iter().map(|&m| (m, evaluate(&outcomes(s, m, 1)[0].g, self.w))).collect();
            rated.sort_by(|x, y| y.1.partial_cmp(&x.1).unwrap());
            let keep: Vec<Move> = rated.iter().take(SPELLS_BELOW).map(|x| x.0).collect();
            ms.retain(|m| !matches!(m, Move::Cast(_)) || keep.contains(m) || hit_best == Some(*m));
        }
        if let Some(hb) = hit_best { ms.sort_by_key(|m| *m != hb); }
        let mut best = -1.0;
        let mut best_key = None;
        for m in ms {
            let v = self.chance_node(s, m, d, a.max(best), b, INNER);
            if v > best { best = v; best_key = Some(m); }
            if best >= b || self.stopped { break; }
        }
        if !self.stopped {
            self.tt.insert(k, Entry { d, v: best, best: best_key, flag: if best <= a { Flag::Upper } else if best >= b { Flag::Lower } else { Flag::Exact } });
        }
        best
    }

    /// Star1: each outcome is searched only inside the window that could still change the verdict against [a, b].
    fn chance_node(&mut self, s: &Game, m: Move, d: i32, a: f64, b: f64, cap: usize) -> f64 {
        let (mut sum, mut rest) = (0.0, 1.0);
        for o in outcomes(s, m, cap) {
            rest -= o.p;
            let lo = (a - sum - rest) / o.p;
            let hi = (b - sum) / o.p;
            if lo >= 1.0 { return sum + o.p + rest; }
            if hi <= 0.0 { return sum; }
            let v = self.max_node(&o.g, if o.spent { d - 1 } else { d }, lo.max(0.0), hi.min(1.0));
            sum += o.p * v;
            if v <= lo { return sum + rest; }
            if v >= hi { return sum; }
        }
        sum
    }

    /// Search one depth more (iterative deepening: every root move scored in full, the best first at the next depth).
    /// Returns false once there is nothing more to search (or it was stopped).
    pub fn step(&mut self) -> bool {
        if self.done { return false; }
        let depth = self.last.as_ref().map_or(1, |l| l.depth + 1);
        if depth > MAX_DEPTH { self.done = true; return false; }
        self.horizon = false;
        let root = self.root.clone();
        let mut scores = vec![];
        for (m, _) in self.order.clone() {
            let v = self.chance_node(&root, m, depth, 0.0, 1.0, WIDTH);
            if self.stopped { return false; }
            scores.push((m, v));
        }
        let mut lines: Vec<(Move, String, f64)> = self.order.iter().zip(&scores).map(|((m, l), s)| (*m, l.clone(), s.1)).collect();
        lines.sort_by(|x, y| y.2.partial_cmp(&x.2).unwrap());
        self.order = lines.iter().map(|x| (x.0, x.1.clone())).collect();
        let exact = !self.horizon;
        self.last = Some(Depth { depth, exact, value: lines[0].2, best: lines[0].0, scores, lines });
        if exact { self.done = true; }
        !self.done
    }
    /// Search to `max_depth` (or until exact).
    pub fn run(&mut self, max_depth: i32) -> &mut Self {
        while !self.done && self.last.as_ref().map_or(0, |l| l.depth) < max_depth { if !self.step() { break; } }
        self
    }

    /// The line the engine expects: its best move after each move's likelier roll (✓ it lands, ✗ it holds or misses).
    fn line_from(&self, key: Move) -> Vec<LineStep> {
        let mut line = vec![];
        let mut s = self.root.clone();
        let mut key = Some(key);
        for _ in 0..8 {
            let Some(k) = key else { break };
            // A position reached by another order keeps that position's best move, which may name a card not here.
            let ms = moves(&s);
            if !ms.contains(&k) { break; }
            let outs = outcomes(&s, k, WIDTH);
            let mut by: Vec<(&'static str, f64)> = vec![];
            for x in &outs { match by.iter_mut().find(|b| b.0 == x.note) { Some(b) => b.1 += x.p, None => by.push((x.note, x.p)) } }
            by.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());
            let note = by[0].0;
            let o = outs.into_iter().find(|x| x.note == note).unwrap();
            line.push(LineStep { label: label(&s, k), note: o.note, end: None });
            s = o.g;
            if let Some(over) = &s.over {
                let l = match over.outcome { Outcome::Win => "They’re persuaded", Outcome::Partial => "A partial deal", Outcome::Lost => "The meeting ends" };
                line.push(LineStep { label: l.into(), note: "", end: Some(over.outcome) });
                break;
            }
            key = self.tt.get(&key_of(&s)).and_then(|h| h.best);
        }
        line
    }

    pub fn report(&self) -> Report {
        let Some(last) = &self.last else {
            return Report { depth: 0, exact: false, done: self.done, nodes: self.nodes, value: f64::NAN, best: None, scores: vec![], lines: vec![] };
        };
        let lines = last.lines.iter().enumerate().map(|(i, (m, l, v))| ScoredLine { key: *m, label: l.clone(), value: *v, line: if i < 5 { Some(self.line_from(*m)) } else { None } }).collect();
        Report { depth: last.depth, exact: last.exact, done: self.done, nodes: self.nodes, value: last.value, best: Some(last.best), scores: last.scores.clone(), lines }
    }
}

/// The gift cards a spell puts in their deck: whether one is still to come (for the page).
pub fn gift_coming(g: &Game, gift: Gift) -> bool { g.deck.iter().any(|c| c.gift == Some(gift)) }
