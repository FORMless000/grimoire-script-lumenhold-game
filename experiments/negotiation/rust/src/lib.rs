//! Standalone negotiation rules and sampled expectimax. JSON is only used at
//! the boundary; search copies compact positions and shares the immutable deck.
mod variety;
use serde_json::{json, Value};
use std::{cell::RefCell, collections::HashMap};
const RESOURCE: [&str; 6] = ["mood", "mana", "health", "gold", "renown", "alignment"];
const FACE: usize = 0;
const DEFLECT: usize = 1;
const WITHDRAW: usize = 2;
#[derive(Clone, Copy, Default)]
struct Effects {
    foresight: i32,
    candour: i32,
    glamour: f64,
    haste: i32,
    index: bool,
    rapport: bool,
    quickquill: bool,
    reflect: bool,
}
#[derive(Clone, Copy)]
struct Position {
    card: Option<usize>,
    pending: Option<usize>,
    agreement: f64,
    patience: f64,
    resolve: f64,
    suspicion: f64,
    bypasses: i32,
    round: i32,
    cast: bool,
    effects: Effects,
    resources: [f64; 6],
    spent: [f64; 6],
    gained: [f64; 6],
    opponent_gold: f64,
    result: u8,
    reason: &'static str,
    card_rng: u32,
    check_rng: u32,
    mood_hit: f64,
    resolve_loss: f64,
    before: [f64; 6],
    rebates: [f64; 6],
}
struct Card {
    id: String,
    kind: String,
    key: String,
    source: String,
    signal: f64,
    weight: f64,
    dc: f64,
    resolve: f64,
    suspicion: f64,
    patience: f64,
    amount: f64,
    gate: bool,
}
struct Spell {
    id: String,
    name: String,
    cost: f64,
    rank: usize,
    duration: i32,
    alignment: f64,
    forbidden: bool,
    hostile: bool,
}
struct Context {
    raw: Value,
    cards: Vec<Card>,
    spells: Vec<Spell>,
    target: f64,
    patience: f64,
    suspicion: f64,
    dc: f64,
    resolve_max: f64,
    lore: f64,
    entry: [f64; 6],
    rebates: [f64; 6],
    underground: bool,
    pool: String,
}
fn num(v: &Value, k: &str) -> f64 {
    v[k].as_f64().unwrap_or(0.)
}
fn word<'a>(v: &'a Value, k: &str) -> &'a str {
    v[k].as_str().unwrap_or("")
}
fn array(v: &Value) -> [f64; 6] {
    std::array::from_fn(|i| num(v, RESOURCE[i]))
}
fn object(v: [f64; 6]) -> Value {
    let mut m = serde_json::Map::new();
    for i in 0..6 {
        m.insert(RESOURCE[i].into(), json!(v[i]));
    }
    Value::Object(m)
}
fn effects(v: &Value) -> Effects {
    Effects {
        foresight: num(v, "foresight") as i32,
        candour: v["candourAt"].as_i64().unwrap_or(-100) as i32,
        glamour: num(v, "glamour"),
        haste: num(v, "haste") as i32,
        index: v["index"].as_bool().unwrap_or(false),
        rapport: v["rapport"].as_bool().unwrap_or(false),
        quickquill: v["quickquill"].as_bool().unwrap_or(false),
        reflect: v["reflect"].as_bool().unwrap_or(false),
    }
}
fn effect_json(e: Effects) -> Value {
    let mut m = serde_json::Map::new();
    if e.foresight > 0 {
        m.insert("foresight".into(), json!(e.foresight));
    }
    if e.candour > -100 {
        m.insert("candourAt".into(), json!(e.candour));
    }
    if e.glamour > 0. {
        m.insert("glamour".into(), json!(e.glamour));
    }
    if e.haste > 0 {
        m.insert("haste".into(), json!(e.haste));
    }
    for (k, b) in [
        ("index", e.index),
        ("rapport", e.rapport),
        ("quickquill", e.quickquill),
        ("reflect", e.reflect),
    ] {
        if b {
            m.insert(k.into(), json!(true));
        }
    }
    Value::Object(m)
}
impl Context {
    fn parse(raw: Value, schema: &Value) -> (Self, Position) {
        let p = &raw["player"];
        let config = &raw["config"];
        let learned = &p["spells"];
        let cards = raw["pool"]
            .as_array()
            .unwrap()
            .iter()
            .map(|c| {
                let source = word(c, "source");
                let key = word(c, "key");
                let kind = word(c, "type");
                let signal = match source {
                    "skills" => num(&p["skills"], key),
                    "alignment" => 0.,
                    "renown" => 0.,
                    "preparation" | "club" | "job" | "project" => num(&p[source], key),
                    _ => num(p, "relationship"),
                };
                Card {
                    id: word(c, "id").into(),
                    kind: kind.into(),
                    source: source.into(),
                    key: key.into(),
                    signal,
                    weight: num(c, "weight"),
                    dc: num(c, "dc"),
                    resolve: num(c, "resolveHit"),
                    suspicion: num(c, "suspicionHit"),
                    patience: num(c, "patienceHit"),
                    amount: num(c, "amount"),
                    gate: if kind == "flag" {
                        p["flags"]
                            .as_array()
                            .unwrap()
                            .iter()
                            .any(|f| f.as_str() == Some(key))
                    } else {
                        learned[key].as_u64().unwrap_or(0) > 0
                    },
                }
            })
            .collect::<Vec<_>>();
        let spells = learned
            .as_object()
            .unwrap()
            .iter()
            .filter_map(|(id, r)| {
                let s = &schema[id];
                if s["castable"].as_bool() == Some(false) {
                    return None;
                }
                let rank = r.as_u64().unwrap() as usize;
                Some(Spell {
                    id: id.clone(),
                    name: word(s, "name").into(),
                    cost: s["cost"][rank - 1].as_f64().unwrap() * num(config, "manaScale"),
                    rank,
                    duration: s["duration"][rank - 1].as_i64().unwrap_or(0) as i32,
                    alignment: if s["alignment"].is_null() {
                        0.
                    } else if word(s, "alignment") == "tiny" {
                        3.
                    } else {
                        2.
                    },
                    forbidden: word(s, "group") == "forbidden",
                    hostile: [
                        "flame",
                        "wildfire",
                        "hoarfrost",
                        "animate",
                        "heartwood",
                        "contraption",
                        "bramble",
                    ]
                    .contains(&id.as_str()),
                })
            })
            .collect::<Vec<_>>();
        let find = |v: &Value| cards.iter().position(|c| Some(c.id.as_str()) == v.as_str());
        let pos = Position {
            card: find(&raw["card"]),
            pending: find(&raw["pending"]),
            agreement: num(&raw, "agreement"),
            patience: num(&raw, "patience"),
            resolve: num(&raw, "resolve"),
            suspicion: num(&raw, "suspicion"),
            bypasses: num(&raw, "bypasses") as i32,
            round: num(&raw, "round") as i32,
            cast: raw["castUsed"].as_bool().unwrap(),
            effects: effects(&raw["effects"]),
            resources: array(&raw["resources"]),
            spent: array(&raw["spent"]),
            gained: array(&raw["gained"]),
            opponent_gold: num(&raw, "opponentGold"),
            result: match word(&raw["result"], "outcome") {
                "win" => 1,
                "partial" => 2,
                "lose" => 3,
                _ => 0,
            },
            reason: "",
            card_rng: num(&raw, "cardRng") as i64 as u32,
            check_rng: num(&raw, "checkRng") as i64 as u32,
            mood_hit: 0.,
            resolve_loss: 0.,
            before: [0.; 6],
            rebates: [0.; 6],
        };
        (
            Self {
                target: num(config, "target"),
                patience: num(config, "patience"),
                suspicion: num(config, "suspicionLimit"),
                dc: num(config, "difficulty"),
                resolve_max: num(&raw, "resolveMax"),
                lore: num(&p["skills"], "lore"),
                entry: array(&raw["entry"]),
                rebates: array(&config["rebates"]),
                underground: config["underground"].as_bool().unwrap_or(false),
                pool: word(config, "pool").into(),
                raw,
                cards,
                spells,
            },
            pos,
        )
    }
    fn name(&self, a: usize) -> &str {
        match a {
            FACE => "face",
            DEFLECT => "deflect",
            WITHDRAW => "withdraw",
            _ => &self.spells[a - 3].id,
        }
    }
    fn action(&self, id: &str) -> Option<usize> {
        match id {
            "face" => Some(FACE),
            "deflect" => Some(DEFLECT),
            "withdraw" => Some(WITHDRAW),
            _ => self.spells.iter().position(|s| s.id == id).map(|i| i + 3),
        }
    }
    fn distribution(&self, current: Option<usize>) -> Vec<(usize, f64)> {
        let total: f64 = self
            .cards
            .iter()
            .enumerate()
            .filter(|(i, _)| Some(*i) != current)
            .map(|(_, c)| c.weight)
            .sum();
        self.cards
            .iter()
            .enumerate()
            .filter(|(i, _)| Some(*i) != current)
            .map(|(i, c)| (i, c.weight / total))
            .collect()
    }
    fn signal(&self, s: &Position, c: &Card) -> f64 {
        if s.effects.index && c.kind == "check" {
            self.lore
        } else {
            match c.source.as_str() {
                "renown" => s.resources[4],
                "alignment" => {
                    50. + if c.key == "lumen" {
                        s.resources[5] / 2.
                    } else {
                        -s.resources[5] / 2.
                    }
                }
                _ => c.signal,
            }
            .clamp(0., 100.)
        }
    }
    fn chance(&self, s: &Position) -> f64 {
        let c = &self.cards[s.card.expect("current argument")];
        match c.kind.as_str() {
            "flag" | "spell" => {
                if c.gate {
                    1.
                } else {
                    0.
                }
            }
            "gold" => {
                if s.resources[3] >= c.amount {
                    1.
                } else {
                    0.
                }
            }
            "health" => {
                if s.resources[2] >= c.amount {
                    1.
                } else {
                    0.
                }
            }
            _ => {
                let fatigue = if s.resolve / self.resolve_max < 0.5 {
                    0.22 * (1. - s.resolve / self.resolve_max * 2.)
                } else {
                    0.
                };
                let eligible = if s.effects.index {
                    false
                } else {
                    c.source == "skills" && (c.key == "charm" || c.key == "guile")
                };
                (0.5 + 0.015 * (self.signal(s, c) - self.dc - c.dc)
                    + if eligible { s.effects.glamour } else { 0. }
                    + if s.effects.reflect { 0.12 } else { 0. }
                    - fatigue)
                    .clamp(0.05, 0.95)
            }
        }
    }
    fn legal(&self, s: &Position) -> Vec<usize> {
        if s.result != 0 {
            return vec![];
        }
        let mut a = vec![FACE];
        if s.resolve > 0. && s.resolve >= deflect_cost(s) {
            a.push(DEFLECT);
        }
        if !s.cast {
            for (i, sp) in self.spells.iter().enumerate() {
                if s.resources[1] >= sp.cost {
                    a.push(i + 3);
                }
            }
        }
        a.push(WITHDRAW);
        a
    }
    fn candidates(&self, s: &Position) -> Vec<usize> {
        self.legal(s)
            .into_iter()
            .filter(|&a| {
                if a < 3 {
                    return true;
                }
                let c = &self.cards[s.card.unwrap()];
                let sp = &self.spells[a - 3];
                match sp.id.as_str() {
                    "candour" => {
                        s.suspicion > 0. || self.spells.iter().any(|sp| sp.id == "quickquill")
                    }
                    "glamour" => {
                        c.kind == "check"
                            && c.source == "skills"
                            && ["charm", "guile"].contains(&c.key.as_str())
                            && self.chance(s) < 0.94
                    }
                    "foresight" => s.effects.foresight == 0 && s.patience > 1.,
                    "index" => c.kind == "check" && self.lore > self.signal(s, c) + 2.,
                    "rapport" => s.resolve > 0.,
                    "quickquill" => c.kind == "check" || s.effects.candour == s.round - 1,
                    "reflect" => c.kind == "check" && self.chance(s) > 0.2,
                    "haste" => s.resolve >= 4. && s.patience <= 6.,
                    "starlight" => s.patience < self.patience + 2.,
                    "shadowstep" => s.agreement >= self.target / 2.,
                    "compel" => self.underground,
                    "sleight" => {
                        self.cards
                            .iter()
                            .any(|c| c.kind == "gold" && c.amount > s.resources[3])
                            && s.opponent_gold > 0.
                    }
                    _ => false,
                }
            })
            .collect()
    }
    fn bank(&self, s: &Position) -> u8 {
        if s.agreement >= self.target {
            1
        } else if s.agreement >= self.target / 2. {
            2
        } else {
            3
        }
    }
    fn finish(&self, s: &mut Position, outcome: u8, reason: &'static str) {
        if s.result != 0 {
            return;
        }
        s.result = outcome;
        s.reason = reason;
        s.resolve_loss = self.resolve_max - s.resolve;
        s.mood_hit = (self.entry[0] * 0.4 * s.resolve_loss / self.resolve_max)
            .ceil()
            .min(self.entry[0]);
        debit(s, 0, s.mood_hit);
        s.before = s.resources;
        for i in 0..6 {
            s.rebates[i] = ((self.entry[i] - s.resources[i]).max(0.) * self.rebates[i]).floor();
            s.resources[i] += s.rebates[i];
        }
    }
    fn close(&self, s: &mut Position) {
        if s.suspicion >= self.suspicion {
            self.finish(s, 3, "Suspicion reached its limit");
        } else if s.agreement >= self.target {
            self.finish(s, 1, "Agreement reached");
        } else if s.patience <= 0. {
            self.finish(s, self.bank(s), "Patience ran out");
        } else if s.round > 40 {
            self.finish(s, self.bank(s), "The meeting has run its course");
        }
    }
    fn step(&self, state: &Position, a: usize, event: bool, log: bool) -> (Position, Vec<String>) {
        let mut s = *state;
        let mut events = Vec::new();
        if a == WITHDRAW {
            self.finish(&mut s, 3, "You withdrew");
            return (s, events);
        }
        if a >= 3 {
            let sp = &self.spells[a - 3];
            let id = sp.id.as_str();
            debit(&mut s, 1, sp.cost);
            s.cast = true;
            if id == "candour" {
                s.suspicion = (s.suspicion - 3.).max(0.);
                s.effects.candour = s.round;
            } else {
                s.suspicion += if id == "glamour" { 2. } else { 1. };
            }
            if sp.alignment > 0. {
                s.resources[5] = (s.resources[5] - sp.alignment).max(-100.);
                s.spent[5] += sp.alignment;
            }
            if log {
                events.push(format!("{}: −{} Mana.", sp.name, sp.cost));
            }
            if sp.hostile || sp.forbidden && !self.underground {
                self.finish(&mut s, 3, "Hostile magic ended the negotiation");
                return (s, events);
            }
            match id {
                "foresight" => s.effects.foresight = sp.duration,
                "glamour" => s.effects.glamour = [0.14, 0.18, 0.22][sp.rank - 1],
                "haste" => s.effects.haste = if sp.rank == 3 { 2 } else { 1 },
                "index" => s.effects.index = true,
                "rapport" => s.effects.rapport = true,
                "quickquill" => {
                    s.effects.quickquill = true;
                    if s.effects.candour == s.round - 1 {
                        s.agreement += 1.;
                        s.resources[5] = (s.resources[5] - 6.).max(-100.);
                        s.spent[5] += 6.;
                        if log {
                            events
                                .push("The prior candid answer is on record: +1 Agreement.".into());
                        }
                    }
                }
                "reflect" => s.effects.reflect = true,
                "starlight" => s.patience = (s.patience + 2.).min(self.patience + 4.),
                "sleight" => {
                    let n = s.opponent_gold.min(5.);
                    s.opponent_gold -= n;
                    s.resources[3] += n;
                    s.gained[3] += n;
                }
                "compel" => {
                    if self.underground {
                        s.agreement += 1.;
                    }
                }
                "shadowstep" => {
                    self.close(&mut s);
                    if s.result == 0 {
                        let outcome = self.bank(&s);
                        self.finish(&mut s, outcome, "You left through a shadow");
                    }
                    return (s, events);
                }
                _ => {}
            }
            self.close(&mut s);
            return (s, events);
        }
        let c = &self.cards[s.card.unwrap()];
        if a == FACE {
            if event {
                if c.kind == "gold" {
                    debit(&mut s, 3, c.amount);
                }
                if c.kind == "health" {
                    debit(&mut s, 2, c.amount);
                }
                s.agreement += 1.;
                if log {
                    events.push("Accepted: +1 Agreement.".into());
                }
            } else {
                let hit = if s.effects.quickquill { 0. } else { c.resolve };
                let suspicion = c.suspicion + if s.effects.reflect { 1. } else { 0. };
                s.resolve = (s.resolve - hit).max(0.);
                s.suspicion += suspicion;
                s.patience -= c.patience;
                if log {
                    events.push(format!(
                        "Rejected: −{} Resolve, +{} Suspicion.",
                        hit, suspicion
                    ));
                }
            }
        } else {
            let cost = deflect_cost(&s);
            s.resolve -= cost;
            if event {
                s.suspicion += 1.;
            }
            s.patience -= (2 - s.effects.haste).max(1) as f64;
            s.bypasses += 1;
            if log {
                events.push(format!(
                    "Deflected: −{} Resolve{}.",
                    cost,
                    if event { ", +1 Suspicion" } else { "" }
                ));
            }
        }
        s.round += 1;
        s.cast = false;
        s.effects = Effects {
            foresight: if s.effects.foresight > 1 {
                s.effects.foresight - 1
            } else {
                0
            },
            candour: if s.effects.candour >= s.round - 1 {
                s.effects.candour
            } else {
                -100
            },
            ..Default::default()
        };
        self.close(&mut s);
        if s.result == 0 {
            s.card = None;
        }
        (s, events)
    }
    fn evaluate(&self, s: &Position) -> f64 {
        let expense = (self.entry[1] - s.resources[1]) * 0.00004
            + (self.entry[3] - s.resources[3]) * 0.00004
            + (self.entry[2] - s.resources[2]) * 0.00008;
        if s.result != 0 {
            return (if s.result == 1 {
                1.
            } else if s.result == 2 {
                0.1
            } else {
                0.
            }) - expense;
        }
        let (mut p, mut suspicion, mut patience) = (0., 0., 0.);
        for (i, w) in self.distribution(s.card) {
            let mut t = *s;
            t.card = Some(i);
            let cp = self.chance(&t);
            let c = &self.cards[i];
            p += w * cp;
            suspicion += w * (1. - cp) * c.suspicion;
            patience += w * (1. - cp) * c.patience;
        }
        let avg_s = suspicion / (1. - p).max(0.001);
        let avg_p = patience / (1. - p).max(0.001);
        let prob = if s.card.is_some() {
            0.55 * self.chance(s) + 0.45 * p
        } else {
            p
        };
        let failures = (s.patience / avg_p.max(1.))
            .ceil()
            .min(((self.suspicion - s.suspicion) / avg_s.max(1.)).ceil())
            .max(0.) as i32;
        (0.94 * race(prob, (self.target - s.agreement).ceil() as i32, failures)
            + 0.012 * s.resolve / self.resolve_max
            - 0.014 * s.suspicion / self.suspicion)
            .max(0.000001)
            - expense
    }
    fn immediate(&self, s: &Position, a: usize) -> f64 {
        let p = if a == FACE {
            self.chance(s)
        } else if a == DEFLECT {
            deflect_risk(s)
        } else {
            1.
        };
        p * self.evaluate(&self.step(s, a, true, false).0)
            + (1. - p) * self.evaluate(&self.step(s, a, false, false).0)
    }
    fn serialize(&self, s: &Position, events: Vec<String>) -> Value {
        let mut raw = self.raw.clone();
        raw["resources"] = object(s.resources);
        raw["spent"] = object(s.spent);
        raw["gained"] = object(s.gained);
        raw["effects"] = effect_json(s.effects);
        raw["card"] = s.card.map_or(Value::Null, |i| json!(self.cards[i].id));
        if self.raw.get("pending").is_some() {
            raw["pending"] = s.pending.map_or(Value::Null, |i| json!(self.cards[i].id));
        }
        for (k, n) in [
            ("agreement", s.agreement),
            ("patience", s.patience),
            ("resolve", s.resolve),
            ("suspicion", s.suspicion),
            ("bypasses", s.bypasses as f64),
            ("round", s.round as f64),
            ("opponentGold", s.opponent_gold),
        ] {
            raw[k] = json!(n);
        }
        raw["castUsed"] = json!(s.cast);
        raw["events"] = json!(events);
        raw["history"] = json!([]);
        if self.raw.get("cardRng").is_some() {
            if s.card_rng != num(&self.raw, "cardRng") as i64 as u32 {
                raw["cardRng"] = json!(s.card_rng as i32);
            }
        }
        if self.raw.get("checkRng").is_some() {
            if s.check_rng != num(&self.raw, "checkRng") as i64 as u32 {
                raw["checkRng"] = json!(s.check_rng as i32);
            }
        }
        if s.result != 0 && s.reason != "" {
            raw["result"] = json!({"outcome":if s.result==1{"win"}else if s.result==2{"partial"}else{"lose"},"reason":s.reason});
            let mut ledger = serde_json::Map::new();
            for i in 0..6 {
                ledger.insert(RESOURCE[i].into(),json!({"entry":self.entry[i],"spent":s.spent[i],"gained":s.gained[i],"before":s.before[i],"rebate":s.rebates[i],"final":s.resources[i],"netLoss":self.entry[i]-s.resources[i]}));
            }
            raw["settlement"] =
                json!({"resolveLoss":s.resolve_loss,"moodHit":s.mood_hit,"resources":ledger});
        }
        raw
    }
}
fn debit(s: &mut Position, i: usize, n: f64) {
    let paid = s.resources[i].max(0.).min(n.max(0.));
    s.resources[i] -= paid;
    s.spent[i] += paid;
}
fn deflect_cost(s: &Position) -> f64 {
    if s.effects.rapport {
        0.
    } else {
        4.
    }
}
fn deflect_risk(s: &Position) -> f64 {
    if s.effects.rapport {
        0.
    } else {
        (0.12 + 0.18 * s.bypasses as f64).min(0.9)
    }
}
fn roll(state: &mut u32) -> f64 {
    *state = state.wrapping_add(0x6D2B79F5);
    let a = *state;
    let mut t = (a ^ (a >> 15)).wrapping_mul(1 | a);
    t = t.wrapping_add((t ^ (t >> 7)).wrapping_mul(61 | t)) ^ t;
    ((t ^ (t >> 14)) as f64) / 4294967296.
}
fn race(p: f64, w: i32, f: i32) -> f64 {
    if w <= 0 {
        return 1.;
    }
    if f <= 0 {
        return 0.;
    }
    let (mut v, mut coefficient) = (0., 1.);
    for k in 0..f {
        if k > 0 {
            coefficient *= (w + k - 1) as f64 / k as f64;
        }
        v += coefficient * p.powi(w) * (1. - p).powi(k);
    }
    v.clamp(0., 1.)
}
fn hash(s: &str) -> u32 {
    s.chars()
        .fold(2166136261, |h, c| (h ^ c as u32).wrapping_mul(16777619))
}
fn sampled(d: &[(usize, f64)], n: usize, seed: u32) -> Vec<(usize, f64)> {
    let mut out: Vec<(usize, f64)> = vec![];
    let shift = (seed % 997) as f64 / 997.;
    for i in 0..n {
        let mut u = ((i as f64 + 0.5) / n as f64 + shift) % 1.;
        let mut id = d.last().unwrap().0;
        for &(j, p) in d {
            u -= p;
            if u <= 0. {
                id = j;
                break;
            }
        }
        if let Some(e) = out.iter_mut().find(|e| e.0 == id) {
            e.1 += 1. / n as f64;
        } else {
            out.push((id, 1. / n as f64));
        }
    }
    out
}
struct Search<'a> {
    c: &'a Context,
    nodes: usize,
    hits: usize,
    limit: usize,
    deadline: f64,
    samples: usize,
    table: HashMap<Vec<u64>, f64>,
    clock: &'a dyn Fn() -> f64,
}
impl Search<'_> {
    fn check(&mut self) -> Result<(), ()> {
        if self.nodes >= self.limit || (self.clock)() >= self.deadline {
            return Err(());
        }
        self.nodes += 1;
        Ok(())
    }
    fn order(&mut self, s: &Position) -> Result<Vec<(usize, f64)>, ()> {
        let mut out = Vec::new();
        for a in self.c.candidates(s) {
            self.check()?;
            out.push((a, self.c.immediate(s, a)));
        }
        out.sort_by(|a, b| {
            b.1.total_cmp(&a.1)
                .then_with(|| self.c.name(a.0).cmp(self.c.name(b.0)))
        });
        Ok(out)
    }
    fn key(&self, s: &Position, d: i32) -> Vec<u64> {
        let e = s.effects;
        let mut k = vec![
            d as u64,
            s.card.map_or(u64::MAX, |x| x as u64),
            s.pending.map_or(u64::MAX, |x| x as u64),
            s.bypasses as u64,
            s.round as u64,
            s.cast as u64,
            e.foresight as u64,
            e.candour as u64,
            e.haste as u64,
            e.index as u64,
            e.rapport as u64,
            e.quickquill as u64,
            e.reflect as u64,
        ];
        for v in [
            s.agreement,
            s.patience,
            s.resolve,
            s.suspicion,
            e.glamour,
            s.opponent_gold,
        ]
        .iter()
        .chain(s.resources.iter())
        {
            k.push(v.to_bits());
        }
        k
    }
    fn value(&mut self, s: &Position, d: i32) -> Result<f64, ()> {
        self.check()?;
        if s.result != 0 || d == 0 {
            return Ok(self.c.evaluate(s));
        }
        let k = self.key(s, d);
        if let Some(&v) = self.table.get(&k) {
            self.hits += 1;
            return Ok(v);
        }
        let mut best = f64::NEG_INFINITY;
        for (a, _) in self.order(s)? {
            best = best.max(self.action(s, a, d)?);
        }
        self.table.insert(k, best);
        Ok(best)
    }
    fn action(&mut self, s: &Position, a: usize, d: i32) -> Result<f64, ()> {
        self.check()?;
        let p = if a == FACE {
            self.c.chance(s)
        } else if a == DEFLECT {
            deflect_risk(s)
        } else {
            1.
        };
        let seed = hash(&format!(
            "[{},{},{},{}]",
            s.round,
            json!(self.c.cards[s.card.unwrap()].id),
            json!(self.c.pool),
            self.c.dc as i32
        ));
        let mut v = 0.;
        for (event, w) in [(true, p), (false, 1. - p)] {
            if w <= 0. {
                continue;
            }
            self.check()?;
            let (t, _) = self.c.step(s, a, event, false);
            if t.result != 0 {
                v += w * self.value(&t, d - if a >= 3 { 0 } else { 1 })?;
                continue;
            }
            if a >= 3 {
                if self.c.name(a) == "foresight" && s.pending.is_none() {
                    for (i, p) in sampled(&self.c.distribution(s.card), self.samples, seed) {
                        let mut b = t;
                        b.pending = Some(i);
                        v += w * p * self.value(&b, d)?;
                    }
                } else {
                    v += w * self.value(&t, d)?;
                }
                continue;
            }
            if d == 1 {
                let mut b = t;
                b.pending = None;
                v += w * self.value(&b, 0)?;
                continue;
            }
            let next = if let Some(i) = s.pending {
                vec![(i, 1.)]
            } else {
                sampled(&self.c.distribution(s.card), self.samples, seed)
            };
            for (i, p) in next {
                let mut b = t;
                b.card = Some(i);
                if b.effects.foresight > 0 {
                    for (j, q) in sampled(
                        &self.c.distribution(b.card),
                        self.samples,
                        seed.wrapping_add(7),
                    ) {
                        let mut peek = b;
                        peek.pending = Some(j);
                        v += w * p * q * self.value(&peek, d - 1)?;
                    }
                } else {
                    b.pending = None;
                    v += w * p * self.value(&b, d - 1)?;
                }
            }
        }
        Ok(v)
    }
}
fn search(c: &Context, input: &Position, o: &Value, clock: &dyn Fn() -> f64) -> Value {
    let mut s = *input;
    s.card_rng = 0;
    s.check_rng = 0;
    if s.effects.foresight <= 0 {
        s.pending = None;
    }
    let started = clock();
    let budget = o["budgetMs"].as_f64().unwrap_or(50.).min(50.);
    let max_depth = o["depth"].as_i64().unwrap_or(3) as i32;
    let mut engine = Search {
        c,
        nodes: 0,
        hits: 0,
        limit: o["nodeBudget"].as_u64().unwrap_or(250000) as usize,
        deadline: if o["fixedNodes"].as_bool() == Some(true) {
            f64::INFINITY
        } else {
            started + (budget - 3.).max(0.5)
        },
        samples: o["samples"].as_u64().unwrap_or(3).max(1) as usize,
        table: HashMap::new(),
        clock,
    };
    // Every legal root action receives a score, even spells pruned in deeper search.
    // Fallback scores include the best immediate response after a free cast.
    let mut scores: Vec<(usize, f64)> = c
        .legal(&s)
        .into_iter()
        .map(|a| {
            let (t, _) = c.step(&s, a, true, false);
            let v = if a >= 3 && t.result == 0 {
                c.legal(&t)
                    .iter()
                    .map(|&b| c.immediate(&t, b))
                    .fold(f64::NEG_INFINITY, f64::max)
            } else {
                c.immediate(&s, a)
            };
            (a, v)
        })
        .collect();
    scores.sort_by(|a, b| {
        b.1.total_cmp(&a.1)
            .then_with(|| c.name(a.0).cmp(c.name(b.0)))
    });
    let mut best = scores[0];
    let mut depth_done = 0;
    for d in 1..=max_depth {
        let result = (|| {
            let mut iteration = Vec::new();
            let mut ordered = scores.clone();
            ordered.sort_by_key(|a| if a.0 == best.0 { 0 } else { 1 });
            for (a, _) in ordered {
                iteration.push((a, engine.action(&s, a, d)?));
            }
            Ok::<_, ()>(iteration)
        })();
        match result {
            Ok(mut values) => {
                values.sort_by(|a, b| {
                    b.1.total_cmp(&a.1)
                        .then_with(|| c.name(a.0).cmp(c.name(b.0)))
                });
                best = values[0];
                scores = values;
                depth_done = d;
            }
            Err(_) => break,
        }
    }
    json!({"id":c.name(best.0),"value":best.1,"algorithm":"Rust/Wasm sampled expectimax","nodes":engine.nodes,"cacheHits":engine.hits,"depth":depth_done,"elapsedMs":clock()-started,"budgetMs":budget,"scores":scores.iter().map(|&(a,v)|json!({"id":c.name(a),"value":v,"depth":depth_done})).collect::<Vec<_>>()})
}
thread_local! {static SCHEMA:RefCell<Value>=const{RefCell::new(Value::Null)};static OUT:RefCell<String>=const{RefCell::new(String::new())};}
#[cfg(target_arch = "wasm32")]
#[link(wasm_import_module = "env")]
extern "C" {
    fn now() -> f64;
}
fn clock() -> f64 {
    #[cfg(target_arch = "wasm32")]
    {
        unsafe { now() }
    }
    #[cfg(not(target_arch = "wasm32"))]
    {
        use std::sync::OnceLock;
        use std::time::Instant;
        static START: OnceLock<Instant> = OnceLock::new();
        START.get_or_init(Instant::now).elapsed().as_secs_f64() * 1000.
    }
}
pub fn execute(v: Value, schema: &Value) -> Value {
    if v["state"]["config"]["research"].as_bool() == Some(true) {
        return variety::execute(v, schema);
    }
    let (c, mut s) = Context::parse(v["state"].clone(), schema);
    let op = word(&v, "op");
    match op {
        "chance" => json!(c.chance(&s)),
        "legal" => json!(c.legal(&s).iter().map(|&a| c.name(a)).collect::<Vec<_>>()),
        "candidates" => json!(c
            .candidates(&s)
            .iter()
            .map(|&a| c.name(a))
            .collect::<Vec<_>>()),
        "evaluate" => json!(c.evaluate(&s)),
        "search" => search(&c, &s, &v["options"], &clock),
        "project" | "apply" => {
            let Some(a) = c.action(word(&v, "id")) else {
                return json!({"error":"Unknown action"});
            };
            if !c.legal(&s).contains(&a) {
                return json!({"error":format!("Illegal action: {}",c.name(a))});
            }
            let p = if a == FACE {
                Some(c.chance(&s))
            } else if a == DEFLECT {
                Some(deflect_risk(&s))
            } else {
                None
            };
            let mut u = None;
            let event = if op == "apply" {
                if let Some(p) = p {
                    if p > 0. && p < 1. {
                        u = Some(roll(&mut s.check_rng));
                    }
                    p == 1. || u.is_some_and(|u| u < p)
                } else {
                    false
                }
            } else {
                v["event"].as_bool().unwrap_or(false)
            };
            let (mut t, events) = c.step(&s, a, event, true);
            if op == "apply" && t.result == 0 && a < 3 {
                t.card = s.pending;
                let mut u = roll(&mut t.card_rng);
                let dist = c.distribution(t.card);
                t.pending = dist.last().map(|x| x.0);
                for (i, p) in dist {
                    u -= p;
                    if u <= 0. {
                        t.pending = Some(i);
                        break;
                    }
                }
            }
            let mut out = c.serialize(&t, events.clone());
            if op == "apply" {
                let mut history = c.raw["history"].as_array().unwrap().clone();
                history.push(json!({"round":s.round,"card":c.cards[s.card.unwrap()].id,"action":c.name(a),"p":p,"roll":u,"event":event,"agreement":t.agreement,"patience":t.patience,"resolve":t.resolve,"suspicion":t.suspicion,"events":events}));
                out["history"] = json!(history);
            }
            out
        }
        _ => json!({"error":"Unknown operation"}),
    }
}
#[no_mangle]
pub extern "C" fn alloc(n: usize) -> *mut u8 {
    let mut v = Vec::<u8>::with_capacity(n.max(1));
    let p = v.as_mut_ptr();
    std::mem::forget(v);
    p
}
#[no_mangle]
pub unsafe extern "C" fn dealloc(p: *mut u8, n: usize) {
    drop(Vec::from_raw_parts(p, 0, n.max(1)));
}
#[no_mangle]
pub extern "C" fn out_ptr() -> *const u8 {
    OUT.with(|o| o.borrow().as_ptr())
}
#[no_mangle]
pub extern "C" fn out_len() -> usize {
    OUT.with(|o| o.borrow().len())
}
#[no_mangle]
pub unsafe extern "C" fn configure(p: *const u8, n: usize) {
    let v = serde_json::from_slice(std::slice::from_raw_parts(p, n)).unwrap();
    SCHEMA.with(|s| *s.borrow_mut() = v);
}
#[no_mangle]
pub unsafe extern "C" fn invoke(p: *const u8, n: usize) {
    let v = serde_json::from_slice(std::slice::from_raw_parts(p, n)).unwrap();
    let result = SCHEMA.with(|s| execute(v, &s.borrow()));
    OUT.with(|o| *o.borrow_mut() = result.to_string());
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn rng_fixture() {
        let mut seed = 20;
        assert_eq!(roll(&mut seed), 0.7526106622535735);
    }
    #[test]
    fn race_fixture() {
        assert_eq!(race(0.5, 3, 3), 0.5);
        assert_eq!(race(0.2, 0, 3), 1.);
        assert_eq!(race(0.8, 3, 0), 0.);
    }
}
