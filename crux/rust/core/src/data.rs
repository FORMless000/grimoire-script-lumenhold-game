//! The data: cards (cards.js), spells and loadouts (spells.js, from the combat roster) and the bound negotiations
//! (encounters.js), as export-data.js writes them to data/*.json, embedded and read once.
use serde::Deserialize;
use serde_json::{Map, Value};
use std::collections::HashMap;
use std::sync::OnceLock;

macro_rules! names {
    ($name:ident { $($v:ident = $s:literal),* $(,)? }) => {
        #[derive(Clone, Copy, PartialEq, Eq, Hash, Debug, PartialOrd, Ord)]
        pub enum $name { $($v),* }
        impl $name {
            pub const ALL: &'static [$name] = &[$($name::$v),*];
            pub fn name(self) -> &'static str { match self { $($name::$v => $s),* } }
            pub fn parse(s: &str) -> Option<$name> { match s { $($s => Some($name::$v),)* _ => None } }
        }
    };
}

names!(Sig { Charm = "charm", Lore = "lore", Guile = "guile", Arcana = "arcana", Alchemy = "alchemy", Vigor = "vigor", Standing = "standing", Bond = "bond", Record = "record" });
names!(Fail { None = "none", Sus = "sus", Sus2 = "sus2", Cool = "cool", Cool2 = "cool2", Tire = "tire", Harden = "harden", Grudge = "grudge", Drain = "drain", Cost = "cost", Wound = "wound" });
names!(Fx { Tell = "tell", Opening = "opening", Clears = "clears", Linked = "linked", Volatile = "volatile", Sore = "sore", Watchful = "watchful" });
names!(Gate { Crowns = "crowns", Health = "health", Renown = "renown", Spell = "spell", Skill = "skill" });
names!(Hex { Compel = "compel", Bewitch = "bewitch", Hush = "hush", Lightfingers = "lightfingers" });
names!(Gift { Omen = "omen", Lodestar = "lodestar" });
// In the order the JavaScript rules listed them (SPELL_FX), which is the order spells are prepared, listed and searched in.
names!(Spell {
    Foresight = "foresight", Glamour = "glamour", Index = "index", Quickquill = "quickquill", Rapport = "rapport",
    Starlight = "starlight", Omen = "omen", Lodestar = "lodestar", Brace = "brace", Ward = "ward", Reflect = "reflect",
    Candour = "candour", Haste = "haste", Seal = "seal", Sleight = "sleight", Shadowstep = "shadowstep", Compel = "compel",
    Flame = "flame",
});
impl Sig { pub fn idx(self) -> usize { self as usize } }

/// A card as written: what never changes while it is played (its words); the rest is copied into each `Card`.
#[derive(Debug)]
pub struct Proto {
    pub id: &'static str, pub title: &'static str, pub text: &'static str,
    pub signal: Option<Sig>, pub dc: i32, pub sway: i32, pub fail: Fail, pub fx: Option<Fx>, pub wait: i32,
    pub gate: Option<Gate>, pub hex: Option<Hex>, pub gift: Option<Gift>,
}
pub struct CruxDef { pub signal: Sig, pub title: &'static str, pub text: &'static str }
pub struct Circ { pub name: &'static str, pub lean: Sig, pub crux: CruxDef, pub hexes: Vec<Hex>, pub cards: Vec<u16>, pub demands: Vec<u16> }
#[derive(Clone, Debug)]
pub struct Enc {
    pub key: &'static str, pub level: i32, pub using: Option<Sig>, pub partial: bool, pub tutorial: bool,
    pub steps: Vec<&'static str>, pub formal: bool, pub grey: bool, pub hash: &'static str, pub circ: usize,
}
pub struct KitLevel { pub level: i32, pub capacity: i32, pub skills: HashMap<Sig, i32>, pub spells: Vec<(Spell, i32)> }
pub struct Kit { pub name: &'static str, pub levels: Vec<KitLevel> }
pub struct SpellData { pub name: &'static str, pub cost: Vec<i32> }
pub struct Weights { pub h: Vec<Vec<f64>>, pub b: Vec<f64>, pub v: Vec<f64>, pub c: f64 }

pub struct Data {
    pub protos: Vec<Proto>,
    pub common: Vec<u16>,
    pub circs: Vec<Circ>,
    pub hexes: Vec<(Hex, u16, &'static str)>,   // the hex, its card, what it does when it lands
    pub omen: u16, pub lodestar: u16, pub blank: u16,
    pub signal_names: Vec<(Sig, &'static str)>,
    pub main: Vec<Sig>,
    pub shown_spells: Vec<Spell>,
    pub spells: HashMap<Spell, SpellData>,
    pub kits: Vec<Kit>,
    pub encounters: Vec<Enc>,
    pub weights: Weights,
}
impl Data {
    pub fn proto(&self, i: u16) -> &Proto { &self.protos[i as usize] }
    pub fn hex_card(&self, h: Hex) -> u16 { self.hexes.iter().find(|x| x.0 == h).unwrap().1 }
    pub fn hex_lands(&self, h: Hex) -> &'static str { self.hexes.iter().find(|x| x.0 == h).unwrap().2 }
    pub fn signal_name(&self, s: Sig) -> &'static str { self.signal_names.iter().find(|x| x.0 == s).unwrap().1 }
    pub fn spell(&self, s: Spell) -> &SpellData { &self.spells[&s] }
    pub fn encounter(&self, key: &str) -> Option<&Enc> { self.encounters.iter().find(|e| e.key == key) }
    pub fn kit(&self, name: &str) -> Option<usize> { self.kits.iter().position(|k| k.name == name) }
}

fn leak(s: &str) -> &'static str { Box::leak(s.to_string().into_boxed_str()) }
fn st(v: &Value) -> &'static str { leak(v.as_str().unwrap_or("")) }
fn sig(v: &Value) -> Option<Sig> { v.as_str().and_then(Sig::parse) }

fn proto(v: &Value) -> Proto {
    Proto {
        id: st(&v["id"]), title: st(&v["title"]), text: st(&v["text"]), signal: sig(&v["signal"]),
        dc: v["dc"].as_i64().unwrap_or(0) as i32, sway: v["sway"].as_i64().unwrap_or(0) as i32,
        fail: v["fail"].as_str().and_then(Fail::parse).unwrap_or(Fail::Sus),
        fx: v["fx"].as_str().and_then(Fx::parse), wait: v["wait"].as_i64().unwrap_or(0) as i32,
        gate: v["gate"].as_str().and_then(Gate::parse), hex: v["hex"].as_str().and_then(Hex::parse), gift: None,
    }
}

#[derive(Deserialize)]
struct RawWeights { h: Vec<Vec<f64>>, b: Vec<f64>, v: Vec<f64>, c: f64 }

/// The weights the engine's eval starts with; train replaces them (set_weights) and writes data/weights.json.
pub const WEIGHTS: &str = include_str!("../data/weights.json");

pub fn parse_weights(s: &str) -> Weights {
    let w: RawWeights = serde_json::from_str(s).expect("weights.json");
    Weights { h: w.h, b: w.b, v: w.v, c: w.c }
}

fn load() -> Data {
    let cards: Value = serde_json::from_str(include_str!("../data/cards.json")).unwrap();
    let spells: Value = serde_json::from_str(include_str!("../data/spells.json")).unwrap();
    let encs: Value = serde_json::from_str(include_str!("../data/encounters.json")).unwrap();
    let mut protos = Vec::new();
    let mut add = |p: Proto| { protos.push(p); (protos.len() - 1) as u16 };
    let common = cards["common"].as_array().unwrap().iter().map(|c| add(proto(c))).collect();
    let mut circs = Vec::new();
    for (name, c) in cards["circumstances"].as_object().unwrap() {
        circs.push(Circ {
            name: leak(name), lean: sig(&c["lean"]).unwrap(),
            crux: CruxDef { signal: sig(&c["crux"]["signal"]).unwrap(), title: st(&c["crux"]["title"]), text: st(&c["crux"]["text"]) },
            hexes: c["hexes"].as_array().map(|a| a.iter().filter_map(|h| h.as_str().and_then(Hex::parse)).collect()).unwrap_or_default(),
            cards: c["cards"].as_array().unwrap().iter().map(|x| add(proto(x))).collect(),
            demands: c["demands"].as_array().unwrap().iter().map(|x| add(proto(x))).collect(),
        });
    }
    let hexes = cards["hexes"].as_object().unwrap().iter().map(|(k, h)| (Hex::parse(k).unwrap(), add(proto(h)), st(&h["lands"]))).collect();
    let gift = |id: &str, title: &str, text: &str, dc, sway, wait, g| Proto {
        id: leak(id), title: leak(title), text: leak(text), signal: Some(Sig::Lore), dc, sway, fail: Fail::None, fx: None, wait, gate: None, hex: None, gift: g,
    };
    let omen = add(gift("omen", "An Omen", "Everything you say lines up, as if it had been written down beforehand.", -15, 3, 3, Some(Gift::Omen)));
    let lodestar = add(gift("lodestar", "The Lodestar", "At the end of it all, the thing you came to say, and they are ready to hear it.", 0, 0, 2, Some(Gift::Lodestar)));
    let blank = add(Proto { id: "unknown", title: "An argument to come", text: "", signal: None, dc: 0, sway: 0, fail: Fail::None, fx: None, wait: 99, gate: None, hex: None, gift: None });
    let signal_names = cards["signalNames"].as_object().unwrap().iter().map(|(k, v)| (Sig::parse(k).unwrap(), st(v))).collect();
    let main = cards["main"].as_array().unwrap().iter().filter_map(sig).collect();
    let shown_spells = cards["shownSpells"].as_array().unwrap().iter().map(|s| Spell::parse(s.as_str().unwrap()).unwrap()).collect();
    let by_event: &Map<String, Value> = cards["byEvent"].as_object().unwrap();
    let encounters = encs.as_array().unwrap().iter().map(|e| {
        let key = st(&e["key"]);
        let circ = by_event.get(key).and_then(|c| c.as_str()).and_then(|c| circs.iter().position(|x| x.name == c)).unwrap_or(1);
        Enc {
            key, level: e["level"].as_i64().unwrap() as i32, using: sig(&e["using"]), partial: e["partial"].as_bool().unwrap_or(false),
            tutorial: e["tutorial"].as_bool().unwrap_or(false), steps: e["steps"].as_array().map(|a| a.iter().map(st).collect()).unwrap_or_default(),
            formal: e["room"].as_str() == Some("formal"), grey: e["grey"].as_bool().unwrap_or(false), hash: st(&e["hash"]), circ,
        }
    }).collect();
    let spell_map = spells["spells"].as_object().unwrap().iter().filter_map(|(k, s)| Spell::parse(k).map(|id| (id, SpellData {
        name: st(&s["name"]), cost: s["cost"].as_array().unwrap().iter().map(|x| x.as_i64().unwrap() as i32).collect(),
    }))).collect();
    // A kit at every level 1–100 (levels[l − 1]): its skills, capacity and each spell at the rank its steps reach by then.
    let kits = spells["kits"].as_array().unwrap().iter().map(|k| {
        let names: Vec<Option<Sig>> = k["skills"].as_array().unwrap().iter().map(sig).collect();
        let steps: Vec<(Spell, Vec<(i32, i32)>)> = k["spells"].as_array().unwrap().iter().filter_map(|x| Some((Spell::parse(x[0].as_str()?)?,
            x[1].as_array()?.iter().map(|x| (x[0].as_i64().unwrap() as i32, x[1].as_i64().unwrap() as i32)).collect()))).collect();
        Kit {
            name: st(&k["name"]),
            levels: k["levels"].as_array().unwrap().iter().zip(k["capacity"].as_array().unwrap()).enumerate().map(|(i, (sk, cap))| {
                let level = i as i32 + 1;
                KitLevel {
                    level, capacity: cap.as_i64().unwrap() as i32,
                    skills: names.iter().zip(sk.as_array().unwrap()).filter_map(|(n, v)| Some(((*n)?, v.as_i64()? as i32))).collect(),
                    spells: steps.iter().filter_map(|(id, st)| st.iter().filter(|s| s.0 <= level).last().map(|s| (*id, s.1))).collect(),
                }
            }).collect(),
        }
    }).collect();
    Data {
        protos, common, circs, hexes, omen, lodestar, blank, signal_names, main, shown_spells, spells: spell_map, kits, encounters,
        weights: parse_weights(WEIGHTS),
    }
}

static DATA: OnceLock<Data> = OnceLock::new();
pub fn data() -> &'static Data { DATA.get_or_init(load) }
