// Flat, Copy-able fight state plus the static encounter it plays in.
// JSON conversion keeps the JS state shape so setup, UI and tools see no difference.
use crate::data::{data, Act, RESOURCES, SKILLS};
use serde_json::{json, Map, Value};

pub const N_EFFECTS: usize = 15;
pub const EFFECT_NAMES: [&str; N_EFFECTS] = [
    "guard", "ward", "brace", "foreAim", "haste", "shadowstep", "tailwind", "reflect", "torment", "eclipse", "heartprice", "compelled", "lodestar",
    "bound", "poison",
];
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
/// ForeAim (Foresight's damage bonus) is no longer created since F5.3; kept so older saved states still load.
/// Bound (Root, Web): no Shadowstep or Brace. Poison (Venom): damage each exchange; `source` is the poisoner.
pub enum Eff { Guard = 0, Ward, Brace, ForeAim, Haste, Shadowstep, Tailwind, Reflect, Torment, Eclipse, Heartprice, Compelled, Lodestar, Bound, Poison }

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Effect { pub value: f64, pub from: i32, pub until: Option<i32>, pub born: i32, pub source: Option<u8> }

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Channel { pub spell: usize, pub holds: i32, pub bank: f64, pub total: f64 }

#[derive(Clone, Copy, Debug, PartialEq, Default)]
pub struct ConstructI { pub spell: usize, pub kind: usize, pub power: f64, pub reduction: f64, pub threshold: f64, pub taken: f64, pub expires: i32 }

#[derive(Clone, Copy, Debug, PartialEq, Default)]
pub struct Omen { pub due: i32, pub power: f64 }

/// A small fixed-capacity list (no heap, so State stays Copy).
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Small<T: Copy + Default, const N: usize> { len: u8, items: [T; N] }
impl<T: Copy + Default, const N: usize> Default for Small<T, N> { fn default() -> Self { Small { len: 0, items: [T::default(); N] } } }
impl<T: Copy + Default, const N: usize> Small<T, N> {
    pub fn len(&self) -> usize { self.len as usize }
    pub fn is_empty(&self) -> bool { self.len == 0 }
    pub fn as_slice(&self) -> &[T] { &self.items[..self.len as usize] }
    pub fn as_mut_slice(&mut self) -> &mut [T] { &mut self.items[..self.len as usize] }
    pub fn push(&mut self, x: T) { assert!((self.len as usize) < N, "fixed list overflow"); self.items[self.len as usize] = x; self.len += 1; }
    pub fn clear(&mut self) { self.len = 0; }
    /// Keep the items for which `keep` is true, in order.
    pub fn retain(&mut self, mut keep: impl FnMut(&T) -> bool) {
        let mut j = 0;
        for i in 0..self.len as usize { if keep(&self.items[i]) { self.items[j] = self.items[i]; j += 1; } }
        self.len = j as u8;
    }
    pub fn iter(&self) -> std::slice::Iter<'_, T> { self.as_slice().iter() }
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Actor {
    pub res: [f64; 6], pub spent: [f64; 6], pub restored: [f64; 6],
    pub hp: f64, pub max_hp: f64, pub flux: f64,
    pub effects: [Option<Effect>; N_EFFECTS],
    pub channel: Option<Channel>,
    pub constructs: Small<ConstructI, 3>,
    pub omens: Small<Omen, 6>,
    pub last_action: Option<Act>,
    pub rime_ready: bool, pub rime_used: bool,
    pub freeze_until: i32,
    pub pending_renown: f64,
    pub glamour_done: bool,
    /// The urge to deal damage (F5.9d): grows each exchange this side deals none, resets when it does, halves when its damage is
    /// fully blocked. The AI policy leans toward damaging spells by it (ai::choose); the search never reads it.
    pub urge: f64,
    /// The last exchange this side guarded (0: never), for Guard fatigue.
    pub guard_round: i32,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Outcome { Win, Lose, Draw }
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Reason { Knockout, Decision, Stalemate, Conceded }
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct FightResult { pub outcome: Outcome, pub reason: Reason, pub round: i32, pub winner: Option<u8>, pub tiebreak: bool }

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct State {
    pub round: i32, pub normal_leader: u8, pub leader: u8,
    pub early_commit: [i32; 2],
    pub pending: [Option<Act>; 2],
    pub last_pair: Option<[Act; 2]>,
    pub quiet: i32,
    pub result: Option<FightResult>,
    pub actors: [Actor; 2],
}

/// Per-side static data: kit, entry and the encounter's precomputed scales.
pub struct Side {
    pub level: i32,
    pub skills: [f64; 6],
    pub capacity: f64,
    pub entry: [f64; 6],
    /// Learned spells in kit order, with rank.
    pub kit: Vec<(usize, i32)>,
    pub rank: Vec<i32>,
    pub learned: Vec<bool>,
    /// skillValue and skillFactor by spell index; strike at index n_spells.
    pub skill_value: Vec<f64>,
    pub factor: Vec<f64>,
    /// Mana price at the kit's rank (×manaCostScale, plus the kit's `mods.cost`, never below 0), by spell index.
    pub cost: Vec<f64>,
    /// The worn kit's flat modifiers (world expansion 1; a foe's `mods:` alike): spell damage added to each cast of a spell,
    /// strike damage dealt to a foe who guards, wards or braces, damage taken off each opposing hit by its action (strike at
    /// n_spells) and off every opposing hit.
    pub on_cast: Vec<f64>,
    pub on_defend: f64,
    pub taken: Vec<f64>,
    pub taken_all: f64,
    /// A creature (world expansion 1): heals nothing, whatever it casts.
    pub no_heal: bool,
}

pub struct Encounter {
    pub sides: [Side; 2],
    pub observers: bool,
    /// Someone who would report a forbidden cast (F5.9c): defaults to `observers`; an audience is always a witness.
    pub witnesses: bool,
    pub combat_scale: f64,
    pub damage_multiplier: f64,
    pub mana_cost_scale: f64,
    pub health_direct: bool,
    pub mana_weight: f64,
    pub flux_weight: f64,
    pub rebates: [f64; 6],
    pub config: Value,
}

/// Public-only parts of a fight: never copied by the search.
#[derive(Clone, Default)]
pub struct Public {
    pub reports: Vec<(u8, usize, i32)>,
    pub events: Vec<Event>,
    pub settlement: Option<Value>,
    pub follow_ups: Option<Value>,
}

pub const DEF_SHADOWSTEP: u16 = 1; pub const DEF_REFLECT: u16 = 2; pub const DEF_GUARD: u16 = 4; pub const DEF_GUARD_TIRED: u16 = 8;
pub const DEF_WARD: u16 = 16; pub const DEF_BRACE: u16 = 32; pub const DEF_CONSTRUCT: u16 = 64; pub const DEF_LODESTAR: u16 = 128; pub const DEF_FROZEN: u16 = 256;
pub const DEF_NAMES: [(u16, &str); 9] = [(DEF_SHADOWSTEP, "shadowstep"), (DEF_REFLECT, "reflect"), (DEF_GUARD, "guard"), (DEF_GUARD_TIRED, "tiredGuard"), (DEF_WARD, "ward"), (DEF_BRACE, "brace"), (DEF_CONSTRUCT, "construct"), (DEF_LODESTAR, "lodestar"), (DEF_FROZEN, "frozen")];
#[derive(Clone, Debug)]
pub enum Event {
    ConstructEnded { spell: usize },
    Froze { side: u8 },
    Witnessed { spell: usize },
    CompelsCancel,
    TormentCharged { value: f64, side: u8 },
    HoarfrostCancel,
    Dealt { id: Act, amount: f64, target: u8, source: u8, reflected: bool },
    // Every opposing hit (F5.9b, for the fight text): its power before defences, what it dealt, and the defences that
    // touched it (DEF_* bits). A hit thrown back by Reflect is reported again as its own hit.
    Hit { id: Act, raw: f64, amount: f64, target: u8, source: u8, by: u16, reflected: bool },
    // A spell that moves Mana or flux (F5.9b, for the fight text): Extraction's take, Seal's snuffed flux, Distil's Mana.
    Moved { side: u8, id: Act, amount: f64, blocked: bool },
    Reclaimed { side: u8, amount: f64 },
}

fn num(v: &Value, what: &str) -> f64 { v.as_f64().unwrap_or_else(|| panic!("expected number for {what}, got {v}")) }
fn int(v: &Value, what: &str) -> i32 { num(v, what) as i32 }
fn act_of(v: &Value) -> Option<Act> {
    match v { Value::Null => None, Value::String(s) => Some(data().act(s).unwrap_or_else(|| panic!("unknown action {s}"))), _ => panic!("bad action {v}") }
}
fn res_map(v: &Value) -> [f64; 6] { let mut r = [0.0; 6]; for (i, k) in RESOURCES.iter().enumerate() { r[i] = num(&v[k], k); } r }

impl Encounter {
    pub fn from_json(s: &Value) -> Encounter {
        let d = data();
        let n = d.spells.len();
        let config = s["config"].clone();
        let f = |k: &str, def: f64| config.get(k).and_then(|v| v.as_f64()).unwrap_or(def);
        let mana_cost_scale = f("manaCostScale", 1.0);
        let sides = [0, 1].map(|i| {
            let a = &s["actors"][i];
            let kit = &a["kit"];
            let mut skills = [0.0; 6];
            for (j, k) in SKILLS.iter().enumerate() { skills[j] = num(&kit["skills"][k], k); }
            let mut list = Vec::new();
            let mut rank = vec![1; n];
            let mut learned = vec![false; n];
            for (id, r) in kit["spells"].as_object().expect("kit.spells") {
                let sp = d.spell(id).unwrap_or_else(|| panic!("unknown spell {id}"));
                let r = int(r, "rank");
                list.push((sp, r));
                rank[sp] = r;
                learned[sp] = true;
            }
            let mut skill_value = vec![0.0; n + 1];
            let mut factor = vec![0.0; n + 1];
            for sp in 0..=n {
                let ids: &[usize] = if sp == n { &[4] } else { &d.spells[sp].skills };
                // skillValue: average in the spell's skill order; no skills means the pivot (factor 1).
                // factor: the average of each skill's 1 + perPoint × (skill − pivot); main combat skills scale faster.
                let t = &d.skill;
                skill_value[sp] = if ids.is_empty() { t.pivot } else { ids.iter().fold(0.0, |acc, &k| acc + skills[k]) / ids.len() as f64 };
                factor[sp] = if let (true, Some(pp)) = (sp == n, t.strike_per_point) { 1.0 + pp * (skills[4] - t.pivot) } else if ids.is_empty() { 1.0 } else { ids.iter().fold(0.0, |acc, &k| acc + 1.0 + t.per_point[k] * (skills[k] - t.pivot)) / ids.len() as f64 };
            }
            let mods = &kit["mods"];
            let by_spell = |key: &str, len: usize| -> Vec<f64> {
                let mut v = vec![0.0; len];
                if let Some(o) = mods.get(key).and_then(|x| x.as_object()) {
                    for (id, x) in o { let i = if id == "strike" { n } else { d.spell(id).unwrap_or_else(|| panic!("mods.{key}: unknown spell {id}")) }; if i < len { v[i] += num(x, key); } }
                }
                v
            };
            let delta = by_spell("cost", n);
            let cost = (0..n).map(|sp| (d.spells[sp].cost.get((rank[sp] - 1) as usize).copied().unwrap_or(0.0) * mana_cost_scale + delta[sp]).max(0.0)).collect();
            let on_cast = by_spell("onCast", n);
            let taken = by_spell("taken", n + 1);
            let on_defend = mods.get("onDefend").and_then(|x| x.as_f64()).unwrap_or(0.0);
            let taken_all = mods.get("takenAll").and_then(|x| x.as_f64()).unwrap_or(0.0);
            let no_heal = kit.get("noHeal").and_then(|x| x.as_bool()).unwrap_or(false);
            Side { level: int(&kit["level"], "level"), skills, capacity: num(&kit["capacity"], "capacity"), entry: res_map(&a["entry"]), kit: list, rank, learned, skill_value, factor, cost, on_cast, on_defend, taken, taken_all, no_heal }
        });
        Encounter {
            sides,
            observers: config.get("observers").and_then(|v| v.as_bool()).unwrap_or(false),
            witnesses: config.get("witnesses").and_then(|v| v.as_bool()).unwrap_or(false) || config.get("observers").and_then(|v| v.as_bool()).unwrap_or(false),
            combat_scale: f("combatScale", 1.0),
            damage_multiplier: f("damageMultiplier", 1.0),
            mana_cost_scale,
            health_direct: config.get("healthModel").and_then(|v| v.as_str()) == Some("direct"),
            mana_weight: f("manaWeight", 1.1),
            flux_weight: f("fluxWeight", 0.75),
            rebates: res_map(&s["rebates"]),
            config,
        }
    }
}

fn effect_from(name: &str, v: &Value) -> Effect {
    Effect {
        value: num(&v["value"], name), from: int(&v["from"], name),
        until: if v["until"].is_null() { None } else { Some(int(&v["until"], name)) },
        born: v.get("born").map(|b| int(b, name)).unwrap_or(0),
        source: v.get("source").map(|x| int(x, "source") as u8),
    }
}

impl State {
    pub fn from_json(s: &Value) -> State {
        let d = data();
        let actors = [0, 1].map(|i| {
            let a = &s["actors"][i];
            let mut effects = [None; N_EFFECTS];
            if let Some(obj) = a["effects"].as_object() {
                for (k, v) in obj {
                    let e = EFFECT_NAMES.iter().position(|n| n == k).unwrap_or_else(|| panic!("unknown effect {k}"));
                    effects[e] = Some(effect_from(k, v));
                }
            }
            let channel = if a["channel"].is_null() { None } else {
                let c = &a["channel"];
                Some(Channel { spell: d.spell(c["id"].as_str().unwrap()).unwrap(), holds: int(&c["holds"], "holds"), bank: num(&c["bank"], "bank"), total: num(&c["total"], "total") })
            };
            let mut constructs = Small::default();
            for c in a["constructs"].as_array().unwrap() {
                let spell = d.spell(c["id"].as_str().unwrap()).unwrap();
                constructs.push(ConstructI { spell, kind: d.spells[spell].construct.unwrap(), power: num(&c["power"], "power"), reduction: num(&c["reduction"], "reduction"), threshold: num(&c["threshold"], "threshold"), taken: num(&c["taken"], "taken"), expires: int(&c["expires"], "expires") });
            }
            let mut omens = Small::default();
            for o in a["omens"].as_array().unwrap() { omens.push(Omen { due: int(&o["due"], "due"), power: num(&o["power"], "power") }); }
            Actor {
                res: res_map(&a["resources"]), spent: res_map(&a["spent"]), restored: res_map(&a["restored"]),
                hp: num(&a["hp"], "hp"), max_hp: num(&a["maxHP"], "maxHP"), flux: num(&a["flux"], "flux"),
                effects, channel, constructs, omens,
                last_action: act_of(&a["lastAction"]),
                rime_ready: a["rimeReady"].as_bool().unwrap_or(false), rime_used: a["rimeUsed"].as_bool().unwrap_or(false),
                freeze_until: int(&a["freezeUntil"], "freezeUntil"),
                pending_renown: num(&a["pendingRenown"], "pendingRenown"),
                glamour_done: a.get("glamourDone").and_then(|v| v.as_bool()).unwrap_or(false),
                urge: a.get("urge").and_then(|v| v.as_f64()).unwrap_or(0.0),
                guard_round: a.get("guardRound").and_then(|v| v.as_i64()).unwrap_or(0) as i32,
            }
        });
        let pair = |v: &Value| [act_of(&v[0]), act_of(&v[1])];
        let result = if s["result"].is_null() { None } else {
            let r = &s["result"];
            Some(FightResult {
                outcome: match r["outcome"].as_str().unwrap() { "win" => Outcome::Win, "lose" => Outcome::Lose, _ => Outcome::Draw },
                reason: match r["reason"].as_str().unwrap() { "knockout" => Reason::Knockout, "decision" => Reason::Decision, "conceded" => Reason::Conceded, _ => Reason::Stalemate },
                round: int(&r["round"], "round"), winner: r.get("winner").map(|w| int(w, "winner") as u8), tiebreak: r.get("tiebreak").is_some(),
            })
        };
        let lp = if s["lastPair"].is_null() { None } else { let p = pair(&s["lastPair"]); Some([p[0].unwrap(), p[1].unwrap()]) };
        State {
            round: int(&s["round"], "round"), normal_leader: int(&s["normalLeader"], "normalLeader") as u8, leader: int(&s["leader"], "leader") as u8,
            early_commit: [int(&s["earlyCommit"][0], "ec"), int(&s["earlyCommit"][1], "ec")],
            pending: pair(&s["pending"]), last_pair: lp,
            quiet: s.get("quiet").map(|q| int(q, "quiet")).unwrap_or(0),
            result, actors,
        }
    }
}

pub fn act_json(a: Option<Act>) -> Value { match a { Some(a) => Value::String(data().name(a).to_string()), None => Value::Null } }
fn res_json(r: &[f64; 6]) -> Value { let mut m = Map::new(); for (i, k) in RESOURCES.iter().enumerate() { m.insert(k.to_string(), json!(r[i])); } Value::Object(m) }

pub fn result_json(r: &FightResult, public: &Public) -> Value {
    let mut m = Map::new();
    m.insert("outcome".into(), json!(match r.outcome { Outcome::Win => "win", Outcome::Lose => "lose", Outcome::Draw => "draw" }));
    m.insert("reason".into(), json!(match r.reason { Reason::Knockout => "knockout", Reason::Decision => "decision", Reason::Stalemate => "stalemate", Reason::Conceded => "conceded" }));
    m.insert("round".into(), json!(r.round));
    if let Some(w) = r.winner { m.insert("winner".into(), json!(w)); }
    if r.tiebreak { m.insert("tiebreak".into(), json!("telegraphed initiative")); }
    m.insert("followUps".into(), public.follow_ups.clone().unwrap_or(json!([])));
    Value::Object(m)
}

/// Write the dynamic state into a copy of the original JS state object.
pub fn state_json(template: &Value, s: &State, public: &Public) -> Value {
    let d = data();
    let mut out = template.clone();
    let o = out.as_object_mut().unwrap();
    o.insert("quiet".into(), json!(s.quiet));
    o.insert("round".into(), json!(s.round));
    o.insert("normalLeader".into(), json!(s.normal_leader));
    o.insert("leader".into(), json!(s.leader));
    o.insert("earlyCommit".into(), json!(s.early_commit));
    o.insert("pending".into(), json!([act_json(s.pending[0]), act_json(s.pending[1])]));
    o.insert("lastPair".into(), match s.last_pair { Some(p) => json!([act_json(Some(p[0])), act_json(Some(p[1]))]), None => Value::Null });
    o.insert("reports".into(), Value::Array(public.reports.iter().map(|(side, sp, round)| json!({"side": side, "spell": d.spells[*sp].id, "round": round})).collect()));
    o.insert("bursts".into(), json!([]));
    o.insert("result".into(), match &s.result { Some(r) => result_json(r, public), None => Value::Null });
    o.insert("settlement".into(), public.settlement.clone().unwrap_or(Value::Null));
    let actors = o.get_mut("actors").unwrap().as_array_mut().unwrap();
    for (i, a) in s.actors.iter().enumerate() {
        let t = actors[i].as_object_mut().unwrap();
        t.insert("resources".into(), res_json(&a.res));
        t.insert("spent".into(), res_json(&a.spent));
        t.insert("restored".into(), res_json(&a.restored));
        t.insert("hp".into(), json!(a.hp));
        t.insert("maxHP".into(), json!(a.max_hp));
        t.insert("flux".into(), json!(a.flux));
        let mut eff = Map::new();
        for (k, e) in a.effects.iter().enumerate() {
            if let Some(e) = e {
                let mut m = Map::new();
                m.insert("value".into(), json!(e.value));
                m.insert("from".into(), json!(e.from));
                m.insert("until".into(), match e.until { Some(u) => json!(u), None => Value::Null });
                m.insert("born".into(), json!(e.born));
                if let Some(src) = e.source { m.insert("source".into(), json!(src)); }
                eff.insert(EFFECT_NAMES[k].into(), Value::Object(m));
            }
        }
        t.insert("effects".into(), Value::Object(eff));
        t.insert("channel".into(), match a.channel { Some(c) => json!({"id": d.spells[c.spell].id, "holds": c.holds, "bank": c.bank, "total": c.total}), None => Value::Null });
        t.insert("constructs".into(), Value::Array(a.constructs.iter().map(|c| json!({"id": d.spells[c.spell].id, "power": c.power, "reduction": c.reduction, "threshold": c.threshold, "taken": c.taken, "expires": c.expires})).collect()));
        t.insert("omens".into(), Value::Array(a.omens.iter().map(|m| json!({"due": m.due, "power": m.power})).collect()));
        t.insert("lastAction".into(), act_json(a.last_action));
        t.insert("rimeReady".into(), json!(a.rime_ready));
        t.insert("rimeUsed".into(), json!(a.rime_used));
        t.insert("freezeUntil".into(), json!(a.freeze_until));
        t.insert("pendingRenown".into(), json!(a.pending_renown));
        t.insert("glamourDone".into(), json!(a.glamour_done));
        t.insert("urge".into(), json!(a.urge));
        t.insert("guardRound".into(), json!(a.guard_round));
    }
    out
}

pub fn public_from_json(s: &Value) -> Public {
    let d = data();
    let reports = s["reports"].as_array().map(|r| r.iter().map(|x| (int(&x["side"], "side") as u8, d.spell(x["spell"].as_str().unwrap()).unwrap(), int(&x["round"], "round"))).collect()).unwrap_or_default();
    let follow_ups = if s["result"].is_null() { None } else { s["result"].get("followUps").cloned() };
    Public { reports, events: Vec::new(), settlement: if s["settlement"].is_null() { None } else { Some(s["settlement"].clone()) }, follow_ups }
}
