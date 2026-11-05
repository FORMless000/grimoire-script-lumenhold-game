//! Crux: the rules. The page, the bots and the engine all play through these functions.
//!
//! One crux to move, and two or three small arguments on the table at a time, dealt from a deck built for the encounter
//! (`deck_for`). Each action spends one Patience, so Patience is how many actions you have left:
//!   Confront a small argument: a check at the chance shown. Win or fail, it leaves the table and the next is dealt.
//!     A win raises the hidden Agreement by the card's own amount, so the crux rises by exactly what the card shows; a
//!     failure costs what the card says (`fail_amounts`): Suspicion, their goodwill, Patience, the others hardening...
//!   Deflect it: it leaves the table. That costs the Patience and nothing else.
//!   Press the crux: a check at its shown chance, which Agreement raises. It wins the meeting; a miss costs only the
//!     Patience, so you choose when to stop building and go all-in with what Patience is left.
//! Patience gone, the meeting ends (a partial deal where the card allows one and the crux was close).
//!
//! Spell costs and Mana are the combat minigame's own (spells.js, generated from combat/setup/roster.mjs); what a spell
//! does here is defined below (`cast`, and `spell_short` / `spell_text` for its tile).
use crate::data::{data, Fail, Fx, Gate, Gift, Hex, Sig, Spell};
use crate::js::{iround, round, Rng};
use std::collections::HashMap;
use serde::Deserialize;

pub mod tune {
    pub const PATIENCE: i32 = 6;            // what you can spend (tutorial +1)
    pub const PRESS_START: i32 = 1;         // the first press costs this, each later one 1 more; a press may overdraw
    pub const SUSPICION_LIMIT: i32 = 4;     // they walk out
    pub const CAST_SUS: i32 = 1;            // every spell they see you cast (unless it says); a Watchful argument adds 1
    pub const TABLE: usize = 3;             // small arguments on the table at a time
    pub const DECK: usize = 12;
    // A check: base, plus PER_POINT a point of your skill over their level, less PER_DC a point of the card's own dc.
    // Every chance is shown and rolled in steps of STEP, from CHANCE_MIN to CHANCE_MAX.
    pub const BASE: f64 = 0.58;
    pub const PER_POINT: f64 = 0.0075;
    pub const PER_DC: f64 = 0.015;
    pub const CHANCE_MIN: f64 = 0.05;
    pub const CHANCE_MAX: f64 = 0.95;
    pub const STEP: f64 = 0.05;
    // A card's dc is written for a level-50 meeting; below that it shrinks with the encounter's level (to MIN of itself).
    pub const DC_PIVOT: f64 = 50.0;
    pub const DC_MIN: f64 = 0.4;
    pub const GRUDGE: i32 = 10;             // dc points, about −15%
    pub const FACT: f64 = 0.20;
    pub const AHEAD: [i32; 3] = [0, 1, 2];  // Foresight and Glamour: how many arguments still to come they reach, by rank
    pub const QUILL: i32 = 3;               // Quickquill: a win's Agreement, times this
    pub const RAPPORT: i32 = 2;             // Rapport: Suspicion cleared, for RAPPORT_PATIENCE of their Patience
    pub const RAPPORT_PATIENCE: i32 = 1;
    pub const STARLIGHT: i32 = 1;           // the push's price, less this, and Patience, plus this
    pub const BRACE: i32 = 2;               // actions under Brace
    pub const OMEN_DEPTH: usize = 2;        // the Omen is dealt after this many of their arguments
    pub const STEAL: [i32; 3] = [5, 10, 20];
    pub const LODESTAR_PATIENCE_ONLY: bool = true; // the Lodestar fills Patience ('full', the crux certain too, was too strong)
    pub const LINGER: i32 = 4;              // how long an argument waits, when the card doesn't say
    pub const HARDEN: f64 = 0.15;           // a Hardening failure: the other arguments on the table, each
    pub const DRAIN: i32 = 6;
    pub const COST: [i32; 3] = [3, 5, 10];
    pub const WOUND: [i32; 3] = [3, 5, 8];
    pub const CRUX_BASE: f64 = 0.0;
    pub const CRUX_PER_POINT: f64 = 0.004;
    pub const CRUX_PER_AGREEMENT: f64 = 0.10;
    pub const TIER_AT: [i32; 2] = [30, 55];
    pub const CROWNS: [i32; 3] = [8, 15, 30];
    pub const HEALTH: [i32; 3] = [5, 10, 16];
    pub const RENOWN_PER_LEVEL: f64 = 0.5;
    pub const PURSE: [(i32, i32); 3] = [(20, 30), (50, 60), (80, 120)];
    pub const HEALTH_START: i32 = 70;
    pub const RENOWN_PER_YOUR_LEVEL: f64 = 0.6;
    pub const PARTIAL_AT: f64 = 0.45;
    pub const BANDS: [(f64, &str); 5] = [(0.25, "Unmoved"), (0.45, "Listening"), (0.60, "Wavering"), (0.75, "Leaning your way"), (1.01, "Nearly persuaded")];
}
use tune::*;

/// An argument on the table or in their deck.
#[derive(Clone, Debug)]
pub struct Card {
    pub proto: u16, pub uid: i32, pub slot: Option<i32>,
    pub signal: Option<Sig>, pub dc: i32, pub sway: i32, pub fail: Fail, pub fx: Option<Fx>, pub wait: i32,
    pub age: i32, pub boost: f64,
    pub gate: Option<Gate>, pub need: f64, pub spell: Option<Spell>,
    pub hex: Option<Hex>, pub gift: Option<Gift>,
    /// Foresight's mark: Some(true) it will land, Some(false) it won't.
    pub fate: Option<bool>,
    pub adv: bool,
    /// Index: answered with Lore.
    pub index: bool,
    pub grudged: bool, pub buried: bool,
    /// A card the engine hasn't seen (engine::mask).
    pub unknown: bool,
}
impl Card {
    pub fn from_proto(proto: u16, uid: i32) -> Card {
        let p = data().proto(proto);
        Card {
            proto, uid, slot: None, signal: p.signal, dc: p.dc, sway: p.sway, fail: p.fail, fx: p.fx, wait: p.wait, age: 0, boost: 0.0,
            gate: p.gate, need: 0.0, spell: None, hex: p.hex, gift: p.gift, fate: None, adv: false, index: false, grudged: false,
            buried: false, unknown: false,
        }
    }
    pub fn id(&self) -> &'static str { data().proto(self.proto).id }
    pub fn title(&self) -> &'static str { data().proto(self.proto).title }
    pub fn text(&self) -> &'static str { data().proto(self.proto).text }
}

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Outcome { Win, Partial, Lost }
impl Outcome {
    pub fn name(self) -> &'static str { match self { Outcome::Win => "win", Outcome::Partial => "partial", Outcome::Lost => "lost" } }
    pub fn score(self) -> f64 { match self { Outcome::Win => 1.0, Outcome::Partial => 0.5, Outcome::Lost => 0.0 } }
}
#[derive(Clone, Debug)]
/// How a meeting ended: the outcome, the rules' words for it, and `why` (a code the page voices in the meeting's own
/// words: persuaded, patience, suspicion, walked, slip, flame, compel, doom).
pub struct Over { pub outcome: Outcome, pub reason: String, pub why: &'static str }

#[derive(Clone, Debug)]
pub struct Fact { pub id: usize, pub text: String, pub used: bool }

/// What a scripted roll was asked for (engine::outcomes).
#[derive(Clone, Debug)]
pub enum Need { Roll(f64), Pick(usize) }
/// The dice, scripted: the engine replays a move with each outcome of each roll. Past the script, a roll records what it
/// needed (the first one only) and comes out as a miss or the first place; that replay is then thrown away.
#[derive(Clone, Debug, Default)]
pub struct Dice { pub script: Vec<u32>, pub i: usize, pub need: Option<Need> }

#[derive(Clone, Debug)]
pub struct Game {
    pub seed: u32, pub rng: Option<Rng>, pub dice: Option<Box<Dice>>,
    pub enc: usize, pub level: i32, pub enc_level: f64, pub gap: f64, pub loadout: usize,
    pub campaign: Option<Campaign>, pub encounter: crate::data::Enc,
    pub signals: [i32; 9], pub ranks: Vec<(Spell, i32)>, pub circ: usize, pub crux_signal: Sig,
    pub patience: i32, pub patience_max: i32, pub suspicion: i32, pub agreement: i32, pub alignment: f64,
    pub cap: f64, pub mana: f64, pub known: Vec<Spell>, pub crowns: f64, pub health: f64, pub renown: f64,
    pub spent_crowns: f64, pub spent_health: f64,
    pub table_size: usize, pub deck: Vec<Card>, pub table: Vec<Card>, pub facts: Vec<Fact>,
    pub actions: i32, pub wins: i32, pub fails: i32, pub deflected: i32, pub presses: i32, pub casts: Vec<Spell>,
    pub cast: Option<Spell>,
    /// Per action: a fact's bonus on an argument (uid, bonus).
    pub temp: Vec<(i32, f64)>,
    pub quill: bool, pub brace: i32, pub foresee: i32, pub charmed: i32, pub doom: bool, pub hushed: bool, pub guided: bool,
    pub free_push: bool, pub stole: bool, pub warmed: bool, pub starlit: bool,
    pub seen: usize, pub under: usize, pub can_bury: bool, pub tell_bury: bool,
    pub over: Option<Over>,
    /// The log: each line's words, its class (good, bad, spell, ''), and for the lines the page may voice in the
    /// meeting's own words, what happened (`Say`).
    pub log: Vec<(String, &'static str, Option<Say>)>,
    /// No log (the engine's copies): its lines are not even written.
    pub quiet: bool,
    pub next_uid: i32,
}

macro_rules! log {
    ($g:expr, $cls:expr, $($t:tt)*) => { if !$g.quiet { let s = format!($($t)*); $g.log.push((s, $cls, None)); } };
}
/// A log line the page may voice: what happened (a code) and its particulars, beside the plain words.
macro_rules! say {
    ($g:expr, $cls:expr, $code:expr, [$($a:expr),*], $($t:tt)*) => {
        if !$g.quiet { let s = format!($($t)*); $g.log.push((s, $cls, Some(($code, vec![$($a.to_string()),*])))); }
    };
}
/// What a voiced log line says happened: a code (won, held, deflect, neglect, give, hold) and its particulars.
pub type Say = (&'static str, Vec<String>);

#[derive(Clone, Copy, PartialEq, Eq, Hash, Debug)]
pub enum Move { Press, Confront(i32), Deflect(i32), Cast(Spell), Bury, Fact(usize, i32), Leave }
impl Move {
    pub fn key(&self) -> String {
        match self {
            Move::Press => "press".into(), Move::Confront(u) => format!("confront:{u}"), Move::Deflect(u) => format!("deflect:{u}"),
            Move::Cast(s) => format!("cast:{}", s.name()), Move::Bury => "bury".into(), Move::Fact(f, u) => format!("fact:{f}:{u}"),
            Move::Leave => "leave".into(),
        }
    }
    pub fn parse(key: &str) -> Option<Move> {
        let mut it = key.split(':');
        let kind = it.next()?;
        let a = it.next();
        let b = it.next();
        Some(match kind {
            "press" => Move::Press, "bury" => Move::Bury, "leave" => Move::Leave,
            "confront" => Move::Confront(a?.parse().ok()?), "deflect" => Move::Deflect(a?.parse().ok()?),
            "cast" => Move::Cast(Spell::parse(a?)?), "fact" => Move::Fact(a?.parse().ok()?, b?.parse().ok()?),
            _ => return None,
        })
    }
}

/// How a game starts. `access_all` gives every spell at the rank your level allows (as the duels' bench does), for
/// tests; `skip` leaves some of the kit's spells unprepared.
#[derive(Clone, Debug)]
pub struct Setup {
    pub seed: u32, pub level: i32, pub enc: String, pub loadout: String, pub access_all: bool, pub skip: Vec<Spell>,
    pub mana: Option<f64>, pub gap: Option<i32>, pub crowns: Option<f64>, pub health: Option<f64>, pub renown: Option<f64>,
    pub campaign: Option<Campaign>,
}
/// Explicit campaign inputs. Absent signals are unavailable, never replaced by a level proxy.
#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Campaign {
    pub signals: HashMap<String, Option<f64>>, pub spells: HashMap<String, i32>,
    pub max_mana: f64, pub difficulty: f64, pub resource_scale: f64,
    pub partial: bool, pub using: Option<String>, pub facts: Vec<String>,
}
impl Default for Setup {
    fn default() -> Self {
        Setup { seed: 1, level: 50, enc: String::new(), loadout: "Scholar".into(), access_all: false, skip: vec![], mana: None, gap: None, crowns: None, health: None, renown: None, campaign: None }
    }
}

pub fn clamp(x: f64, lo: f64, hi: f64) -> f64 { lo.max(hi.min(x)) }
/// A chance as the table shows and rolls it: to the nearest step (5%), within CHANCE_MIN..CHANCE_MAX.
pub fn odds(p: f64) -> f64 { let n = round(1.0 / STEP); clamp(round(p * n) / n, CHANCE_MIN, CHANCE_MAX) }
pub fn pct(p: f64) -> String { format!("{}%", iround(p * 100.0)) }
fn rank_of(level: i32) -> i32 { if level < 35 { 0 } else if level < 65 { 1 } else { 2 } }
pub fn loadouts() -> Vec<&'static str> { data().kits.iter().map(|k| k.name).collect() }

// ---------- spells: what each does at the table, in words

pub fn spell_kind(id: Spell) -> &'static str {
    use Spell::*;
    match id {
        Foresight => "fate", Glamour | Index | Quickquill => "check", Starlight => "crux", Omen | Lodestar => "deck",
        Brace | Ward | Reflect | Candour | Rapport => "calm", Haste | Seal => "tempo", Sleight | Shadowstep => "leave", Compel | Flame => "forbidden",
    }
}
/// The Suspicion a spell's cast shows, before Watchful arguments: None = CAST_SUS.
fn own_sus(id: Spell) -> i32 {
    use Spell::*;
    match id { Foresight | Haste => 2, Candour | Rapport | Shadowstep | Compel | Flame => 0, _ => CAST_SUS }
}
/// Whether the cast is your action (it spends the Patience and the clocks tick).
pub fn is_action(id: Spell) -> bool { matches!(id, Spell::Haste | Spell::Seal) }
pub const KINDS: [(&str, &str); 8] = [("fate", "Fate"), ("check", "Checks"), ("crux", "The crux"), ("deck", "Their deck"), ("calm", "Protection"), ("tempo", "The whole table"), ("leave", "Other"), ("forbidden", "Ends badly")];
fn ahead_text(r: usize) -> String {
    let a = AHEAD[r];
    if a != 0 { format!(" and the next {} dealt", if a == 1 { "one".to_string() } else { a.to_string() }) } else { String::new() }
}
pub fn spell_short(id: Spell, r: usize) -> String {
    use Spell::*;
    let plus = if AHEAD[r] != 0 { format!(" +{}", AHEAD[r]) } else { String::new() };
    match id {
        Foresight => format!("Fate ✓✗{plus}"), Glamour => format!("2 rolls: Charm, Guile{plus}"), Index => "All to Lore".into(),
        Quickquill => format!("×{QUILL} or ✗"), Rapport => format!("Sus −{RAPPORT}, −{RAPPORT_PATIENCE} Pat"), Starlight => format!("Price −{STARLIGHT}, +{STARLIGHT}"),
        Omen => "An omen".into(), Lodestar => (if LODESTAR_PATIENCE_ONLY { "Patience, at the bottom" } else { "The crux, at the bottom" }).into(),
        Brace => format!("{BRACE} turns safe"), Ward => "Counter".into(), Reflect => "Counter, +Patience".into(), Candour => "−2".into(),
        Haste => "Confront all".into(), Seal => "Clear the table".into(), Sleight => "Crowns".into(), Shadowstep => "Slip out".into(),
        Compel => "Win all, then out".into(), Flame => "Lose".into(),
    }
}
pub fn spell_text(id: Spell, r: usize) -> String {
    use Spell::*;
    match id {
        Foresight => format!("Roll the dice now for every argument on the table{}: each shows ✓ or ✗, what Confronting it will do.", ahead_text(r)),
        Glamour => format!("Advantage on every Charm and Guile argument on the table{}: each check rolls twice and keeps the better.", ahead_text(r).replacen("dealt", "of them dealt", 1)),
        Index => "Every argument on the table is answered with Lore, and those that already tested Lore roll with advantage.".into(),
        Quickquill => format!("The next check you Confront counts {} if it wins (not a demand). Win or fail, that spends it.", if QUILL == 3 { "triple".to_string() } else { format!("×{QUILL}") }),
        Rapport => format!("Win back their trust with their time: {RAPPORT_PATIENCE} of their Patience for {RAPPORT} Suspicion cleared. They don’t mind this one; it shows no Suspicion."),
        Starlight => format!("The next push costs {STARLIGHT} Patience less, and you have {STARLIGHT} Patience more. Once a meeting."),
        Omen => format!("An Omen goes into their deck, {} deep: a free, easy argument worth 3 Agreement when it comes up.", OMEN_DEPTH + 1),
        Lodestar => format!("A Lodestar goes to the bottom of their deck. Reach it and answer it, and {}.", if LODESTAR_PATIENCE_ONLY { "your Patience is full again" } else { "your Patience is full again and the crux is certain" }),
        Brace => format!("For {BRACE} turns, an argument you neglect leaves without landing (not their spells)."),
        Ward => "Counter their spells: every spell of theirs on the table is gone, and a new argument is dealt in its place.".into(),
        Reflect => "Turn their spells back on them: every spell of theirs on the table is gone, a new argument is dealt in its place, and +1 Patience for each.".into(),
        Candour => "Speak plainly: −2 Suspicion. The one spell they’re glad to see.".into(),
        Haste => "Confront every argument on the table, one after another. It is your action.".into(),
        Seal => "Every argument on the table is gone, unanswered and harmless, and new ones are dealt. It is your action.".into(),
        Sleight => format!("Lift {} crowns from them (by their tier). A small dishonesty (−1 Alignment).", STEAL.map(|x| x.to_string()).join("/")),
        Shadowstep => "Leave now. The meeting is lost, but nothing more.".into(),
        Compel => "Forbidden. Every argument on the table is won. After your next action they see what you did and the meeting is lost, unless that action wins it. −3 Alignment.".into(),
        Flame => "Attack them. The meeting is lost.".into(),
    }
}
const REACTION: [&str; 7] = ["They let it pass.", "A grudging nod.", "They give you that one.", "That lands.", "That lands hard.", "They’re shaken.", "They’re shaken."];

// ---------- the deck (cards.js deckFor)

const DEMANDS_PER_DECK: usize = 2;
const HEX_CHANCE: f64 = 0.5;

fn shuffle<T>(xs: &mut [T], rng: &mut Rng) {
    for i in (1..xs.len()).rev() { let j = rng.below(i + 1); xs.swap(i, j); }
}
/// Which of their spells a meeting brings, if any: the man in grey always Compels; otherwise only informal meetings of a
/// circumstance with hexes, half of them.
pub fn hex_of(enc: usize, rng: &mut dyn FnMut() -> f64) -> Option<Hex> {
    let d = data();
    let e = &d.encounters[enc];
    if e.grey { return Some(Hex::Compel); }
    let circ = &d.circs[e.circ];
    if circ.hexes.is_empty() || e.formal { return None; }
    if rng() >= HEX_CHANCE { return None; }
    Some(circ.hexes[(rng() * circ.hexes.len() as f64).floor() as usize])
}
/// An encounter's deck: `size` cards without repeats from its circumstance's pool (weight 4) and the common cards
/// (weight 1), the skill the game's card names (`using`) weighing more, and three signature cards from the encounter's
/// key weighing triple. Up to two of the circumstance's demands go in too, the first always in the opening table (the
/// first `early` cards); their spell, if any, anywhere after that. The order is a uniform shuffle.
pub fn deck_for(enc: usize, rng: &mut Rng, size: usize, early: usize) -> Vec<u16> {
    let d = data();
    let e = &d.encounters[enc];
    deck_for_context(e, rng, size, early, &[])
}
fn deck_for_context(e: &crate::data::Enc, rng: &mut Rng, size: usize, early: usize, unavailable: &[Sig]) -> Vec<u16> {
    let d = data();
    let circ = &d.circs[e.circ];
    let mut pool: Vec<(u16, f64)> = circ.cards.iter().map(|&c| (c, 4.0)).chain(d.common.iter().map(|&c| (c, 1.0))).collect();
    let h = crate::js::hash(e.hash);
    for i in 0..3 { pool[((h >> (i * 5)) as usize) % circ.cards.len()].1 *= 3.0; }
    if let Some(u) = e.using { for x in pool.iter_mut() { if d.proto(x.0).signal == Some(u) { x.1 *= 1.5; } } }
    let mut open = circ.demands.clone();
    let mut demands = vec![];
    while demands.len() < DEMANDS_PER_DECK && !open.is_empty() { let i = rng.below(open.len()); demands.push(open.remove(i)); }
    pool.retain(|(p, _)| !d.proto(*p).signal.is_some_and(|s| unavailable.contains(&s)));
    let hex = if e.grey { Some(Hex::Compel) } else if !e.formal && !circ.hexes.is_empty() && rng.next() < HEX_CHANCE { Some(circ.hexes[rng.below(circ.hexes.len())]) } else { None };
    let mut deck = vec![];
    while deck.len() < size - demands.len() - hex.is_some() as usize && !pool.is_empty() {
        let total = pool.iter().fold(0.0, |s, x| s + x.1);
        let mut r = rng.next() * total;
        let mut i = 0;
        loop { r -= pool[i].1; if !(r > 0.0) || i + 1 == pool.len() { break; } i += 1; }
        deck.push(pool.remove(i).0);
    }
    shuffle(&mut deck, rng);
    for (n, x) in demands.into_iter().enumerate() {
        let at = rng.below(if n == 0 { early } else { deck.len() + 1 });
        deck.insert(at, x);
    }
    if let Some(hx) = hex { let at = early + rng.below(deck.len() - early + 1); deck.insert(at, d.hex_card(hx)); }
    deck
}

// ---------- a game

/// The crowns you bring: PURSE's points, in a straight line between them and flat beyond.
fn purse(level: i32) -> i32 {
    let (first, last) = (PURSE[0], PURSE[PURSE.len() - 1]);
    if level <= first.0 { return first.1; }
    if level >= last.0 { return last.1; }
    let i = PURSE.iter().position(|p| p.0 >= level).unwrap();
    let ((l0, c0), (l1, c1)) = (PURSE[i - 1], PURSE[i]);
    iround(c0 as f64 + (c1 - c0) as f64 * (level - l0) as f64 / (l1 - l0) as f64) as i32
}

impl Game {
    pub fn new(s: &Setup) -> Result<Game, String> {
        let d = data();
        let enc = d.encounters.iter().position(|e| e.key == s.enc).ok_or_else(|| format!("No such encounter: {}", s.enc))?;
        let mut rng = Rng::new(s.seed as f64);
        let mut encounter = d.encounters[enc].clone();
        if let Some(c) = &s.campaign {
            if !c.resource_scale.is_finite() || c.resource_scale <= 0.0 || c.resource_scale > 1.0 { return Err("Resource scale must be in (0, 1]".into()); }
            if !c.difficulty.is_finite() || !c.max_mana.is_finite() || c.max_mana < 0.0 { return Err("Invalid campaign difficulty or Mana capacity".into()); }
            for (id, rank) in &c.spells {
                let id = Spell::parse(id).ok_or("Unsupported campaign spell")?;
                if *rank < 1 || *rank as usize > d.spell(id).cost.len() { return Err("Invalid campaign spell rank".into()); }
            }
            if c.signals.values().flatten().any(|v| !v.is_finite()) { return Err("Invalid campaign signal".into()); }
            encounter.partial = c.partial; encounter.using = c.using.as_deref().and_then(Sig::parse);
        }
        let e = &encounter;
        let level = s.level;
        let enc_level = s.campaign.as_ref().map_or(s.gap.map_or(e.level, |g| level + g) as f64, |c| c.difficulty);
        let loadout = d.kit(&s.loadout).unwrap_or(0);
        let kit = &d.kits[loadout].levels[(level.clamp(1, 100) - 1) as usize];
        let mut signals = [0; 9];
        for &k in Sig::ALL { signals[k.idx()] = *kit.skills.get(&k).unwrap_or(&level); }
        let ranks: Vec<(Spell, i32)> = if let Some(c) = &s.campaign {
            Spell::ALL.iter().filter_map(|&id| c.spells.get(id.name()).map(|&r| (id, r))).collect()
        } else if s.access_all {
            Spell::ALL.iter().filter(|id| d.spells.contains_key(id)).map(|&id| (id, (rank_of(level) + 1).min(d.spell(id).cost.len() as i32))).collect()
        } else { kit.spells.clone() };
        let known = Spell::ALL.iter().copied().filter(|id| ranks.iter().any(|r| r.0 == *id && r.1 != 0) && !s.skip.contains(id)).collect();
        let cap = s.campaign.as_ref().map_or(kit.capacity as f64, |c| c.max_mana);
        let circ = e.circ;
        let unavailable: Vec<Sig> = if let Some(c) = &s.campaign { Sig::ALL.iter().copied().filter(|s| !c.signals.get(s.name()).is_some_and(|v| v.is_some())).collect() } else { vec![] };
        let deck: Vec<Card> = deck_for_context(e, &mut rng, DECK, TABLE, &unavailable).into_iter().enumerate().map(|(i, p)| Card::from_proto(p, i as i32)).collect();
        let patience = PATIENCE + e.tutorial as i32;
        let mut g = Game {
            seed: s.seed, rng: Some(rng), dice: None, enc, level, enc_level, gap: enc_level - level as f64, loadout, campaign: s.campaign.clone(), encounter: encounter.clone(), signals, ranks, circ,
            crux_signal: { let signal = e.using.unwrap_or(d.circs[circ].crux.signal); if unavailable.contains(&signal) { d.circs[circ].lean } else { signal } },
            patience, patience_max: patience, suspicion: 0, agreement: 0, alignment: 0.0,
            cap, mana: s.mana.map_or(cap, |m| m.min(cap)), known,
            crowns: s.crowns.unwrap_or_else(|| purse(level) as f64),
            health: s.health.unwrap_or(HEALTH_START as f64), renown: s.renown.unwrap_or_else(|| iround(level as f64 * RENOWN_PER_YOUR_LEVEL) as f64),
            spent_crowns: 0.0, spent_health: 0.0, table_size: TABLE, next_uid: deck.len() as i32, deck, table: vec![],
            facts: e.steps.iter().enumerate().map(|(i, t)| Fact { id: i, text: t.to_string(), used: false }).collect(),
            actions: 0, wins: 0, fails: 0, deflected: 0, presses: 0, casts: vec![], cast: None, temp: vec![],
            quill: false, brace: 0, foresee: 0, charmed: 0, doom: false, hushed: false, guided: false, free_push: false,
            stole: false, warmed: false, starlit: false, seen: 0, under: 0, can_bury: false, tell_bury: false, over: None,
            log: vec![], quiet: false,
        };
        if let Some(c) = &s.campaign { g.facts = c.facts.iter().enumerate().map(|(id, text)| Fact { id, text: text.clone(), used: false }).collect(); }
        for i in 0..g.deck.len() { if g.deck[i].gate.is_some() { g.gate_for(i); } }
        g.refill();
        Ok(g)
    }

    pub fn enc(&self) -> &crate::data::Enc { &self.encounter }
    pub fn rank(&self, id: Spell) -> i32 { self.ranks.iter().find(|r| r.0 == id).map_or(0, |r| r.1) }
    pub fn tier(&self) -> usize { TIER_AT.iter().filter(|&&l| self.enc_level >= l as f64).count() }
    pub fn signal(&self, s: Sig) -> f64 { self.campaign.as_ref().map_or(self.signals[s.idx()] as f64, |c| c.signals.get(s.name()).copied().flatten().unwrap_or(0.0)) }
    pub fn resource(&self, n: i32) -> f64 { self.campaign.as_ref().map_or(n as f64, |c| (n as f64 * c.resource_scale).ceil()) }
    fn rand(&mut self) -> f64 { self.rng.as_mut().expect("a game without its random numbers").next() }

    // The dice. The engine sets `dice` to decide each roll itself, so it can weigh every outcome: roll(p) is a check
    // that lands with chance p; pick(n) one of n equally likely places. Without it, the game's own random numbers.
    pub fn roll(&mut self, p: f64) -> bool {
        if let Some(d) = self.dice.as_mut() {
            if d.i < d.script.len() { d.i += 1; return d.script[d.i - 1] == 1; }
            if d.need.is_none() { d.need = Some(Need::Roll(p)); }
            return false;
        }
        self.rand() < p
    }
    pub fn pick(&mut self, n: usize) -> usize {
        if let Some(d) = self.dice.as_mut() {
            if d.i < d.script.len() { d.i += 1; return d.script[d.i - 1] as usize; }
            if d.need.is_none() { d.need = Some(Need::Pick(n)); }
            return 0;
        }
        (self.rand() * n as f64).floor() as usize
    }

    fn see(&mut self, n: usize) { self.seen = self.seen.max(self.deck.len().min(n)); }

    /// A new argument takes the first empty place, so the others stay where they are.
    fn refill(&mut self) {
        while self.table.len() < self.table_size && !self.deck.is_empty() {
            let mut slot = 0;
            while self.table.iter().any(|c| c.slot == Some(slot)) { slot += 1; }
            let mut c = self.deck.remove(0);
            c.slot = Some(slot);
            self.table.push(c);
            let i = self.table.len() - 1;
            self.dealt(i);
            if self.seen > 0 { self.seen -= 1; }
            self.under = self.under.min(self.deck.len());
        }
    }

    pub fn card(&self, uid: i32) -> Option<&Card> { self.table.iter().find(|c| c.uid == uid) }
    fn at(&self, uid: i32) -> Option<usize> { self.table.iter().position(|c| c.uid == uid) }

    fn foresee_card(&mut self, i: usize) {
        let p = self.raw_chance(&self.table[i]);
        let f = self.roll(p);
        self.table[i].fate = Some(f);
    }
    /// An argument as it is dealt: Foresight and Glamour cast with rank reach this many more.
    fn dealt(&mut self, i: usize) {
        if self.foresee > 0 && foreseeable(&self.table[i]) {
            self.foresee -= 1;
            self.foresee_card(i);
            let c = &self.table[i];
            log!(self, "spell", "Foresight: {} {}.", c.title(), if c.fate == Some(true) { "✓" } else { "✗" });
        }
        if self.charmed > 0 && charmable(&self.table[i]) { self.charmed -= 1; self.table[i].adv = true; }
    }

    /// What a demand asks, set when the deck is dealt.
    fn gate_for(&mut self, i: usize) {
        let tier = self.tier();
        let scale = self.campaign.as_ref().map_or(1.0, |c| c.resource_scale);
        let c = &mut self.deck[i];
        match c.gate {
            Some(Gate::Crowns) => c.need = (CROWNS[tier] as f64 * scale).ceil(),
            Some(Gate::Health) => c.need = (HEALTH[tier] as f64 * scale).ceil(),
            Some(Gate::Renown) => c.need = iround(self.enc_level * RENOWN_PER_LEVEL) as f64,
            Some(Gate::Spell) => {
                // They want to see magic, and ask for a visible spell you know if you know one.
                let shown = &data().shown_spells;
                let yours: Vec<Spell> = shown.iter().copied().filter(|id| self.known.contains(id)).collect();
                let from = if yours.is_empty() { shown.clone() } else { yours };
                let k = (self.rand() * from.len() as f64).floor() as usize;
                self.deck[i].spell = Some(from[k]);
            }
            _ => {}
        }
    }
    /// Whether you can meet a demand now.
    pub fn meets(&self, c: &Card) -> bool {
        match c.gate {
            Some(Gate::Crowns) => self.crowns >= c.need,
            Some(Gate::Health) => self.health > c.need,
            Some(Gate::Renown) => self.renown >= c.need,
            Some(Gate::Spell) => { let s = c.spell.unwrap(); self.known.contains(&s) && !self.hushed && self.mana >= self.spell_cost(s) }
            _ => false,
        }
    }
    /// What a card tests or asks, in a few words: (kind, sign, label, short, have, spell).
    pub fn asks(&self, c: &Card) -> Asks {
        let n = c.need;
        match c.gate {
            Some(Gate::Crowns) => Asks { kind: "crowns", sign: "crowns", label: format!("Pay {n} crowns"), short: n.to_string(), have: format!("you have {}", self.crowns), spell: None },
            Some(Gate::Health) => Asks { kind: "health", sign: "health", label: format!("Give {n} Health"), short: n.to_string(), have: format!("you have {}", self.health), spell: None },
            Some(Gate::Renown) => Asks { kind: "renown", sign: "renown", label: format!("Renown {n}"), short: n.to_string(), have: format!("you have {}", self.renown), spell: None },
            Some(Gate::Spell) => {
                let s = c.spell.unwrap();
                let cost = self.spell_cost(s);
                Asks {
                    kind: "spell", sign: "", label: format!("Cast {} · {} Mana", data().spell(s).name, cost), short: cost.to_string(),
                    have: if self.known.contains(&s) { format!("you have {} Mana", self.mana) } else { "not prepared".into() }, spell: Some(s),
                }
            }
            _ => {
                let s = signal_of(c);
                Asks {
                    kind: "check", sign: s.map_or("", |s| s.name()), label: s.map_or("", |s| data().signal_name(s)).into(), short: String::new(),
                    have: format!("you have {}", s.map_or("undefined".to_string(), |s| self.signal(s).to_string())), spell: None,
                }
            }
        }
    }

    // ---------- chances

    fn dc_of(&self, c: &Card) -> f64 { c.dc as f64 * clamp(self.enc_level as f64 / DC_PIVOT, DC_MIN, 1.0) }
    /// The chance of winning a small argument if you Confront it now: certain or impossible for a demand; Foresight's
    /// fate is certain either way; otherwise the check (with advantage, the better of two rolls).
    pub fn chance(&self, c: &Card) -> f64 {
        if c.gate.is_some() { return if self.meets(c) { 1.0 } else { 0.0 }; }
        if c.gift == Some(Gift::Lodestar) { return 1.0; }
        if let Some(f) = c.fate { return if f { 1.0 } else { 0.0 }; }
        self.raw_chance(c)
    }
    pub fn bonus(&self, uid: i32) -> f64 { self.temp.iter().find(|t| t.0 == uid).map_or(0.0, |t| t.1) }
    pub fn raw_chance(&self, c: &Card) -> f64 {
        let s = signal_of(c).map_or(f64::NAN, |s| self.signal(s) as f64);
        let p = odds(BASE + PER_POINT * (s - self.enc_level as f64) - PER_DC * self.dc_of(c) + c.boost + self.bonus(c.uid));
        if c.adv { odds(1.0 - (1.0 - p) * (1.0 - p)) } else { p }
    }
    /// The crux's chance: shown to the player. Agreement, which raises it, is not.
    pub fn crux_chance(&self) -> f64 {
        self.crux_at(self.agreement)
    }
    /// The crux's chance with this much Agreement.
    pub fn crux_at(&self, agreement: i32) -> f64 {
        if self.guided { return 1.0; }
        odds(CRUX_BASE + CRUX_PER_POINT * (self.signal(self.crux_signal) - self.enc_level) + CRUX_PER_AGREEMENT * agreement as f64)
    }
    pub fn press_cost(&self) -> i32 { if self.free_push { 0 } else { 0.max(PRESS_START + self.presses) } }
    /// Why you can't push now, if you can't: a Sore point on the table.
    pub fn can_press(&self) -> String {
        if self.over.is_some() { return "The meeting is over".into(); }
        match self.table.iter().find(|x| x.fx == Some(Fx::Sore)) { Some(s) => format!("{} stands: answer it first", s.title()), None => String::new() }
    }
    /// What winning an argument does to the crux's shown chance.
    pub fn gain(&self, c: &Card) -> f64 { self.crux_at(self.agreement + self.gain_of(c)) - self.crux_chance() }
    /// A win's Agreement: the card's own, doubled when High stakes, tripled under Quickquill (a check only).
    pub fn gain_of(&self, c: &Card) -> i32 { c.sway * if is_volatile(c) { 2 } else { 1 } * if self.quill && is_check(c) { QUILL } else { 1 } }

    /// What failing an argument costs: (kind, amount).
    pub fn fail_amounts(&self, c: &Card) -> Vec<(FailKind, f64)> {
        let twice = if is_volatile(c) { 2 } else { 1 };
        let t = self.tier();
        use FailKind::*;
        let parts: &[(FailKind, i32)] = match c.fail {
            Fail::None => &[], Fail::Sus => &[(Sus, 1)], Fail::Sus2 => &[(Sus, 2)], Fail::Cool => &[(Agree, 1)], Fail::Cool2 => &[(Agree, 2)],
            Fail::Tire => &[(Patience, 1)], Fail::Harden => &[(Harden, 1)], Fail::Grudge => &[(Grudge, 1)],
            Fail::Drain => &[(Mana, -1)], Fail::Cost => &[(Crowns, -1)], Fail::Wound => &[(Health, -1)],
        };
        parts.iter().map(|&(k, n)| {
            let n = match k { Mana => DRAIN, Crowns => COST[t], Health => WOUND[t], _ => n };
            (k, if matches!(k, Crowns | Health) { self.resource(n * twice) } else { (n * if matches!(k, Harden | Grudge) { 1 } else { twice }) as f64 })
        }).collect()
    }
    /// A failure part's words: (short, long).
    pub fn fail_label(&self, kind: FailKind, n: f64) -> (String, String) {
        use FailKind::*;
        match kind {
            Sus => (format!("+{n} Sus"), format!("+{n} Suspicion")),
            Agree => {
                let now = self.crux_chance();
                let p = self.crux_at(0.max(self.agreement - n as i32));
                (format!("crux −{}", pct(now - p)), format!("the crux −{} (they cool)", pct(now - p)))
            }
            Patience => (format!("−{n} Patience"), format!("−{n} more Patience (they tire of it)")),
            Harden => ("others −15%".into(), format!("the other arguments on the table −{} (they rally)", pct(HARDEN))),
            Grudge => ("comes back".into(), "it comes back later, harder".into()),
            Mana => (format!("−{n} Mana"), format!("−{n} Mana (a magical rebuke)")),
            Crowns => (format!("−{n} crowns"), format!("−{n} crowns")),
            Health => (format!("−{n} Health"), format!("−{n} Health")),
        }
    }
    fn apply_fail(&mut self, c: &Card) {
        let parts = self.fail_amounts(c);
        let labels: Vec<String> = if self.quiet { vec![] } else { parts.iter().map(|&(k, n)| self.fail_label(k, n).1).collect() };
        let long = |i: usize| labels.get(i).cloned().unwrap_or_default();
        for (i, &(kind, n)) in parts.iter().enumerate() {
            match kind {
                FailKind::Sus => self.add_suspicion(n as i32, "a failed Confront"),
                FailKind::Agree => { self.agreement = 0.max(self.agreement - n as i32); log!(self, "bad", "They cool: {}.", long(i)); }
                FailKind::Patience => { self.patience -= n as i32; log!(self, "bad", "{}.", long(i)); }
                FailKind::Harden => {
                    for o in self.table.iter_mut() { o.boost -= HARDEN; }
                    if !self.table.is_empty() { log!(self, "bad", "They rally: the others on the table −{}.", pct(HARDEN)); }
                }
                FailKind::Grudge => {
                    let mut x = fresh(c);
                    x.dc = c.dc + GRUDGE; x.fx = None; x.fail = Fail::Sus; x.grudged = true;
                    self.insert(x);
                    log!(self, "bad", "It will be back, harder.");
                }
                FailKind::Mana => { self.mana = 0.0f64.max(self.mana - n); log!(self, "bad", "{}.", long(i)); }
                FailKind::Crowns => { let n = self.crowns.min(n); self.crowns -= n; self.spent_crowns += n; log!(self, "bad", "−{n} crowns."); }
                FailKind::Health => { let n = 0.0f64.max(self.health - 1.0).min(n); self.health -= n; self.spent_health += n; log!(self, "bad", "−{n} Health."); }
            }
        }
    }
    fn add_suspicion(&mut self, n: i32, why: &str) {
        if n <= 0 { return; }
        self.suspicion += n as i32;
        log!(self, "bad", "+{n} Suspicion ({why}).");
    }

    pub fn can_act(&self, uid: Option<i32>) -> String {
        if self.over.is_some() { return "The meeting is over".into(); }
        if let Some(u) = uid { if self.card(u).is_none() { return "Not on the table".into(); } }
        String::new()
    }

    fn win(&mut self, c: &Card, sway: i32) {
        let before = self.crux_chance();
        self.agreement += sway;
        self.wins += 1;
        self.remove(c.uid);
        if c.hex.is_some() { log!(self, "good", "You throw off {}. The crux: {} → {}.", c.title(), pct(before), pct(self.crux_chance())); return; }
        if c.gift == Some(Gift::Lodestar) {
            self.patience = self.patience.max(self.patience_max);
            if !LODESTAR_PATIENCE_ONLY { self.guided = true; }
            log!(self, "spell", "The Lodestar: your Patience is full again{}.", if self.guided { ", and the crux is certain" } else { "" });
            return;
        }
        let tier = (sway.max(0) as usize).min(REACTION.len() - 1);
        say!(self, "good", "won", [c.title(), tier, pct(before), pct(self.crux_chance())], "Won {}. {} The crux: {} → {}.", c.title(), REACTION[tier], pct(before), pct(self.crux_chance()));
        if c.fx == Some(Fx::Tell) && !self.deck.is_empty() { self.see(3); self.tell_bury = true; log!(self, "good", "Tell: you see their next three arguments."); }
        if c.fx == Some(Fx::Clears) && self.suspicion > 0 { self.suspicion = 0; log!(self, "good", "Clears the air: their Suspicion falls away."); }
        if c.fx == Some(Fx::Opening) { self.free_push = true; log!(self, "good", "An opening: your next push costs no Patience."); }
        if c.fx == Some(Fx::Linked) {
            let mut others: Vec<(f64, Card)> = self.table.iter().filter(|x| is_check(x)).map(|x| (self.chance(x), x.clone())).collect();
            others.sort_by(|a, b| a.0.partial_cmp(&b.0).unwrap());
            if let Some((_, o)) = others.into_iter().next() {
                log!(self, "good", "Linked: {} falls with it.", o.title());
                self.win(&o, o.sway);
            }
        }
    }

    fn remove(&mut self, uid: i32) { self.table.retain(|x| x.uid != uid); }

    /// Answer one argument: a check at its chance (no roll when it is certain: a demand, Foresight's fate, the Lodestar).
    /// One of their spells you fail to throw off stays where it is. Quickquill is spent on it, win or fail.
    fn resolve(&mut self, c: &Card) -> bool {
        let p = self.chance(c);
        let gain = self.gain_of(c);
        let won = if c.gate.is_some() || c.fate.is_some() || c.gift == Some(Gift::Lodestar) { p == 1.0 } else { self.roll(p) };
        if self.quill && is_check(c) { self.quill = false; if !won { log!(self, "spell", "Quickquill: spent."); } }
        if won && c.gate.is_some() { self.pay(c); }
        if won { self.win(c, gain); }
        else if c.hex.is_some() { log!(self, "bad", "{} holds you ({}).", c.title(), pct(p)); }
        else {
            self.fails += 1;
            self.remove(c.uid);
            if !self.quiet {
                let line = if c.gate.is_some() {
                    let a = self.asks(c);
                    format!("{}: you can’t meet it ({}, {}).", c.title(), a.label, a.have)
                } else {
                    format!("{} holds ({}).", c.title(), if c.fate.is_some() { "as foreseen".to_string() } else { pct(p) })
                };
                let say = if c.gate.is_some() { None } else { Some(("held", vec![c.title().to_string(), if c.fate.is_some() { String::new() } else { pct(p) }])) };
                self.log.push((line, "bad", say));
            }
            self.apply_fail(c);
        }
        won
    }

    pub fn confront(&mut self, uid: i32) -> Result<bool, String> {
        let why = self.can_act(Some(uid));
        if !why.is_empty() { return Err(why); }
        let c = self.card(uid).unwrap().clone();
        let won = self.resolve(&c);
        self.end_action(patience_cost(&c));
        Ok(won)
    }

    /// Meet a demand: pay what it asks.
    fn pay(&mut self, c: &Card) {
        match c.gate {
            Some(Gate::Crowns) => { self.crowns -= c.need; self.spent_crowns += c.need; log!(self, "spell", "−{} crowns.", c.need); }
            Some(Gate::Health) => { self.health -= c.need; self.spent_health += c.need; log!(self, "bad", "−{} Health.", c.need); }
            Some(Gate::Spell) => {
                let s = c.spell.unwrap();
                let m = self.spell_cost(s);
                self.mana -= m;
                log!(self, "spell", "You cast {} for them (−{m} Mana).", data().spell(s).name);
            }
            _ => {}
        }
    }

    /// One of their spells can't be waved away: resist it or counter it.
    pub fn can_deflect(&self, uid: i32) -> String {
        let why = self.can_act(Some(uid));
        if !why.is_empty() { return why; }
        if self.card(uid).unwrap().hex.is_some() { "A spell can’t be waved away: resist it or counter it".into() } else { String::new() }
    }
    pub fn deflect(&mut self, uid: i32) -> Result<(), String> {
        let why = self.can_deflect(uid);
        if !why.is_empty() { return Err(why); }
        let c = self.card(uid).unwrap().clone();
        self.deflected += 1;
        self.remove(uid);
        say!(self, "", "deflect", [c.title()], "Deflected {}.", c.title());
        self.end_action(1);
        Ok(())
    }

    fn insert(&mut self, c: Card) {
        let at = self.pick(self.deck.len() + 1);
        if at as i64 > self.deck.len() as i64 - self.under as i64 { self.under += 1; }
        let mut x = fresh(&c);
        x.uid = self.next_uid;
        self.next_uid += 1;
        self.deck.insert(at.min(self.deck.len()), x);
        if at < self.seen { self.seen += 1; }
    }

    /// Press the crux: the only way to win, and not while a Sore point stands. Each press costs 1 Patience more than
    /// the last, and may overdraw it: a press that lands wins even past zero. A miss costs the Patience and nothing else.
    pub fn press(&mut self) -> Result<bool, String> {
        let why = self.can_press();
        if !why.is_empty() { return Err(why); }
        let p = self.crux_chance();
        let cost = self.press_cost();
        if self.free_push { self.free_push = false; log!(self, "good", "An opening: the push costs no Patience."); }
        self.patience -= cost;
        self.actions += 1;
        self.presses += 1;
        let won = p == 1.0 || self.roll(p);
        if won {
            self.over = Some(Over { outcome: Outcome::Win, reason: (if self.guided { "The Lodestar was right. They’re persuaded." } else { "They’re persuaded." }).into(), why: "persuaded" });
            say!(self, "good", "give", [pct(p)], "The crux gives way ({}).", pct(p));
            return Ok(true);
        }
        say!(self, "bad", "hold", [pct(p)], "The crux holds ({}).", pct(p));
        self.actions -= 1;
        self.end_action(0);
        Ok(false)
    }

    fn settle_end(&mut self, reason: &str) {
        let partial = self.enc().partial && self.crux_chance() >= PARTIAL_AT;
        self.over = Some(if partial { Over { outcome: Outcome::Partial, reason: format!("{reason} They meet you partway."), why: "patience" } } else { Over { outcome: Outcome::Lost, reason: reason.into(), why: "patience" } });
    }
    fn too_much(&mut self) -> bool {
        if self.suspicion >= SUSPICION_LIMIT && self.over.is_none() { self.lose("suspicion", "Too much Suspicion. They end the meeting."); }
        self.over.is_some()
    }
    fn lose(&mut self, why: &'static str, reason: &str) { self.over = Some(Over { outcome: Outcome::Lost, reason: reason.into(), why }); }

    fn hex_lands(&mut self, h: Hex) {
        match h {
            Hex::Compel => self.lose("compel", "You agree to everything, in a voice not your own."),
            Hex::Bewitch => self.agreement = 0.max(self.agreement - 3),
            Hex::Hush => self.hushed = true,
            Hex::Lightfingers => {
                let n = self.crowns.min(self.resource(2 * COST[self.tier()]));
                self.crowns -= n; self.spent_crowns += n; self.mana = 0.0f64.max(self.mana - DRAIN as f64);
            }
        }
    }

    fn end_action(&mut self, cost: i32) {
        self.actions += 1;
        self.patience -= cost;
        self.cast = None;
        self.temp.clear();
        // A Tell won this action lets you send the first of their next arguments to the bottom, before your next action.
        let tell = self.tell_bury;
        self.tell_bury = false;
        self.can_bury = false;
        // Compel: the action after it, they see what you did.
        if self.doom { self.suspicion = SUSPICION_LIMIT; self.lose("doom", "They see what you did to them. The meeting is over."); return; }
        if self.too_much() { return; }
        // Neglect: an argument left unanswered for its wait lands on its own, at its failure's cost (under Brace, it
        // leaves harmlessly); one of their spells lands as `hex_lands` says.
        let uids: Vec<i32> = self.table.iter().map(|c| c.uid).collect();
        for uid in uids {
            let Some(i) = self.at(uid) else { continue };
            self.table[i].age += 1;
            if self.table[i].age < wait_of(&self.table[i]) { continue; }
            let c = self.table.remove(i);
            if let Some(h) = c.hex {
                log!(self, "bad", "{} lands. {}", c.title(), data().hex_lands(h));
                self.hex_lands(h);
                if self.over.is_some() { return; }
            } else if c.gift.is_some() { log!(self, "bad", "{} passes, unanswered.", c.title()); }
            else if self.brace > 0 { log!(self, "spell", "Brace: you let {} go, and it costs nothing.", c.title()); }
            else { say!(self, "bad", "neglect", [c.title()], "You neglected {}, and it lands.", c.title()); self.apply_fail(&c); }
        }
        if self.brace > 0 { self.brace -= 1; }
        if self.too_much() { return; }
        self.refill();
        self.can_bury = tell && !self.deck.is_empty();
        if self.patience <= 0 && self.over.is_none() { self.settle_end("Their patience runs out."); }
    }

    // ---------- spells

    /// 0-based, as the spells' cost lists.
    pub fn rank_in(&self, id: Spell) -> usize { 0.max((if self.rank(id) != 0 { self.rank(id) } else { 1 }) - 1) as usize }
    pub fn spell_cost(&self, id: Spell) -> f64 { let c = &data().spell(id).cost; c[self.rank_in(id).min(c.len() - 1)] as f64 }
    /// The Suspicion a cast adds: its own, and 1 more for each Watchful argument standing.
    pub fn cast_sus(&self, id: Spell) -> i32 {
        let own = own_sus(id);
        if own != 0 { own + self.table.iter().filter(|x| x.fx == Some(Fx::Watchful)).count() as i32 } else { 0 }
    }
    fn hex_count(&self) -> usize { self.table.iter().filter(|c| c.hex.is_some()).count() }
    fn in_deck(&self, g: Gift) -> bool { self.deck.iter().any(|c| c.gift == Some(g)) || self.table.iter().any(|c| c.gift == Some(g)) }

    pub fn can_cast(&self, id: Spell) -> String {
        if self.over.is_some() { return "The meeting is over".into(); }
        if !self.known.contains(&id) { return "Not prepared".into(); }
        if self.hushed { return "Your magic is smothered".into(); }
        if self.cast.is_some() { return "One spell an action".into(); }
        if self.mana < self.spell_cost(id) { return "Not enough Mana".into(); }
        let sus = self.cast_sus(id);
        let r = self.rank_in(id);
        if sus != 0 && self.suspicion + sus >= SUSPICION_LIMIT { return format!("They’d see it and walk out (+{sus} Suspicion)"); }
        let why = |b: bool, s: &str| if b { s.to_string() } else { String::new() };
        use Spell::*;
        match id {
            Foresight => why(!self.table.iter().any(foreseeable) && AHEAD[r] == 0, "Nothing left to foresee"),
            Glamour => why(!self.table.iter().any(charmable) && AHEAD[r] == 0, "No Charm or Guile argument on the table"),
            Index => why(!self.table.iter().any(|c| is_check(c) && if c.signal != Some(Sig::Lore) { !c.index } else { !c.adv }), "Nothing to turn to Lore"),
            Quickquill => why(self.quill, "Already in play"),
            Omen => if self.in_deck(Gift::Omen) { "An Omen is already coming".into() } else { why(self.deck.is_empty(), "Their deck is empty") },
            Lodestar => why(self.in_deck(Gift::Lodestar), "The Lodestar is already in their deck"),
            Brace => why(self.brace != 0, "Already braced"),
            Ward | Reflect => why(self.hex_count() == 0, "None of their spells to counter"),
            Candour => why(self.suspicion == 0, "No Suspicion to clear"),
            Haste | Seal | Compel => why(self.table.is_empty(), "Nothing on the table"),
            Sleight => why(self.stole, "Once a meeting"),
            Rapport => if self.suspicion == 0 { "No Suspicion to clear".into() } else { why(self.patience <= RAPPORT_PATIENCE, "Their Patience is too short") },
            Starlight => why(self.starlit, "Once a meeting"),
            Shadowstep | Flame => String::new(),
        }
    }

    /// What casting would change, in words and numbers, for the tray's preview.
    pub fn spell_preview(&mut self, id: Spell) -> String {
        let r = self.rank_in(id);
        let n = |k: usize, w: &str| format!("{k} {w}{}", if k == 1 { "" } else { "s" });
        let more = if AHEAD[r] != 0 { format!(" and the next {}", AHEAD[r]) } else { String::new() };
        use Spell::*;
        match id {
            Foresight => format!("{}{more}: ✓ or ✗, rolled now", n(self.table.iter().filter(|c| foreseeable(c)).count(), "argument")),
            Glamour => format!("{}{more}: two rolls each", n(self.table.iter().filter(|c| charmable(c)).count(), "Charm or Guile argument")),
            Index => {
                let cs: Vec<usize> = (0..self.table.len()).filter(|&i| is_check(&self.table[i])).collect();
                if cs.is_empty() { return String::new(); }
                let was: Vec<(bool, bool)> = cs.iter().map(|&i| (self.table[i].index, self.table[i].adv)).collect();
                let before: Vec<String> = cs.iter().map(|&i| pct(self.chance(&self.table[i]))).collect();
                for &i in &cs { to_lore(&mut self.table[i]); }
                let after: Vec<String> = cs.iter().map(|&i| pct(self.chance(&self.table[i]))).collect();
                for (k, &i) in cs.iter().enumerate() { self.table[i].index = was[k].0; self.table[i].adv = was[k].1; }
                cs.iter().enumerate().map(|(k, &i)| format!("{} {} → {}", self.table[i].title(), before[k], after[k])).collect::<Vec<_>>().join(", ")
            }
            Quickquill => format!("Your next Confront counts ×{QUILL} if it wins"),
            Rapport => format!("Patience {} → {}; Suspicion {} → {}", self.patience, self.patience - RAPPORT_PATIENCE, self.suspicion, 0.max(self.suspicion - RAPPORT)),
            Starlight => format!("The next push {} → {} Patience; Patience {} → {}", self.press_cost(), 0.max(self.press_cost() - STARLIGHT), self.patience, self.patience + STARLIGHT),
            Omen => format!("An Omen, {} deep in their deck", OMEN_DEPTH.min(self.deck.len()) + 1),
            Lodestar => format!("The Lodestar, under their {}", n(self.deck.len(), "argument")),
            Brace => format!("{BRACE} turns: what you neglect leaves harmlessly"),
            Ward => format!("{} of theirs countered, dealt again", n(self.hex_count(), "spell")),
            Reflect => format!("{} of theirs countered, dealt again, +{} Patience", n(self.hex_count(), "spell"), self.hex_count()),
            Candour => format!("Suspicion {} → {}", self.suspicion, 0.max(self.suspicion - 2)),
            Haste => format!("Confront all {}, for 1 Patience", self.table.len()),
            Seal => format!("All {} gone, for 1 Patience", self.table.len()),
            Sleight => format!("+{} crowns", self.resource(STEAL[self.tier()])),
            Compel => format!("All {} won; lost after your next action unless it wins", self.table.len()),
            Shadowstep => "Counts as a loss".into(),
            Flame => String::new(),
        }
    }

    /// Alignment is a campaign resource too; the preview uses the same scaled value as the cast.
    pub fn spell_text(&self, id: Spell, rank: usize) -> String {
        match id {
            Spell::Sleight => format!("Lift {} crowns, once. A small dishonesty (−{} Alignment).", self.resource(STEAL[self.tier()]), self.resource(1)),
            Spell::Compel => format!("Every argument on the table is won. After your next action, lost unless it won (−{} Alignment).", self.resource(3)),
            _ => spell_text(id, rank),
        }
    }

    pub fn cast(&mut self, id: Spell) -> Result<(), String> {
        let why = self.can_cast(id);
        if !why.is_empty() { return Err(why); }
        let cost = self.spell_cost(id);
        let sus = self.cast_sus(id);
        let r = self.rank_in(id);
        let name = data().spell(id).name;
        self.mana -= cost;
        self.cast = Some(id);
        self.casts.push(id);
        if !self.quiet {
            let preview = self.spell_preview(id);
            self.log.push((format!("{name}{} (−{cost} Mana).", if preview.is_empty() { String::new() } else { format!(": {preview}") }), "spell", None));
        }
        if sus != 0 { self.add_suspicion(sus, &format!("they saw you cast {name}")); }
        if self.too_much() { return Ok(()); }
        use Spell::*;
        match id {
            Foresight => {
                for i in 0..self.table.len() { if foreseeable(&self.table[i]) { self.foresee_card(i); } }
                self.foresee = AHEAD[r];
                if !self.quiet {
                    let s = self.table.iter().filter(|x| x.fate.is_some()).map(|x| format!("{} {}", x.title(), if x.fate == Some(true) { "✓" } else { "✗" })).collect::<Vec<_>>().join(", ");
                    log!(self, "spell", "Foresight: {}.", if s.is_empty() { "nothing on the table".to_string() } else { s });
                }
            }
            Glamour => { for c in self.table.iter_mut() { if charmable(c) { c.adv = true; } } self.charmed = AHEAD[r]; }
            Index => { for c in self.table.iter_mut() { if is_check(c) { to_lore(c); } } }
            Quickquill => self.quill = true,
            Rapport => { self.patience -= RAPPORT_PATIENCE; self.suspicion = 0.max(self.suspicion - RAPPORT); }
            Starlight => { self.presses -= STARLIGHT; self.patience += STARLIGHT; self.starlit = true; }
            Omen => {
                let at = OMEN_DEPTH.min(self.deck.len());
                if at < self.seen { self.seen += 1; }
                let c = Card::from_proto(data().omen, self.next_uid);
                self.next_uid += 1;
                self.deck.insert(at, c);
            }
            Lodestar => {
                let c = Card::from_proto(data().lodestar, self.next_uid);
                self.next_uid += 1;
                self.deck.push(c);
                self.under = self.deck.len().min(self.under + 1);
            }
            Brace => self.brace = BRACE,
            Ward | Reflect => {
                let hs: Vec<Card> = self.table.iter().filter(|c| c.hex.is_some()).cloned().collect();
                for c in &hs { self.remove(c.uid); }
                if id == Reflect { self.patience += hs.len() as i32; }
                log!(self, "spell", "{}: countered{}.", hs.iter().map(|c| c.title()).collect::<Vec<_>>().join(", "), if id == Reflect { format!(", +{} Patience", hs.len()) } else { String::new() });
                // Each countered spell's place is dealt again at once, from the top of their deck.
                self.refill();
            }
            Candour => self.suspicion = 0.max(self.suspicion - 2),
            Haste => {
                let uids: Vec<i32> = self.table.iter().map(|c| c.uid).collect();
                for uid in uids {
                    if self.over.is_some() { continue; }
                    let Some(c) = self.card(uid).cloned() else { continue };
                    if c.unknown { continue; }
                    self.resolve(&c);
                }
            }
            Seal => self.table.clear(),
            Sleight => { self.crowns += self.resource(STEAL[self.tier()]); self.stole = true; self.alignment -= self.resource(1); }
            Compel => {
                let cs: Vec<Card> = self.table.clone();
                for c in &cs { let gain = self.gain_of(c); self.win(c, gain); }
                self.doom = true;
                self.alignment -= self.resource(3);
            }
            Shadowstep => self.lose("slip", "You slip away."),
            Flame => self.lose("flame", "You attacked them. Nobody is negotiating now."),
        }
        if self.too_much() { return Ok(()); }
        if is_action(id) { self.end_action(1); }
        Ok(())
    }

    /// A Tell's follow-up: send the next argument to the bottom of their deck.
    pub fn bury(&mut self) -> Result<(), String> {
        if !self.can_bury || self.deck.is_empty() { return Err("Nothing to bury".into()); }
        let mut c = self.deck.remove(0);
        c.buried = true;
        self.deck.push(c);
        self.under = self.deck.len().min(self.under + 1);
        self.can_bury = false;
        self.seen = self.seen.saturating_sub(1);
        log!(self, "spell", "You steer the talk away from it, for now.");
        Ok(())
    }

    /// A fact on your side (the card's own circumstance): once each, +20% on one argument.
    pub fn use_fact(&mut self, id: usize, uid: i32) -> Result<(), String> {
        if self.facts.get(id).map_or(true, |f| f.used) { return Err("No such fact".into()); }
        if self.card(uid).is_none() { return Err("Choose an argument first".into()); }
        self.facts[id].used = true;
        match self.temp.iter_mut().find(|t| t.0 == uid) { Some(t) => t.1 += FACT, None => self.temp.push((uid, 0.0 + FACT)) }
        log!(self, "spell", "★ You bring up what you know ({}).", self.facts[id].text);
        Ok(())
    }

    /// What is in play right now, for the table's "in play" strip: (kind, text), the kind colouring it.
    pub fn active(&self) -> Vec<(&'static str, String)> {
        let mut out = vec![];
        if self.doom { out.push(("forbidden", "Compelled: this action is your last".to_string())); }
        if self.guided { out.push(("deck", "The crux: certain".into())); }
        if self.hushed { out.push(("bad", "Your magic is smothered".into())); }
        if self.free_push { out.push(("good", "Next push: free".into())); }
        if self.quill { out.push(("check", format!("Next Confront: ×{QUILL}"))); }
        if self.brace != 0 { out.push(("calm", format!("Braced: {} turn{}", self.brace, if self.brace == 1 { "" } else { "s" }))); }
        if self.foresee != 0 { out.push(("fate", format!("Foresight: the next {}", self.foresee))); }
        if self.charmed != 0 { out.push(("check", format!("Glamour: the next {}", self.charmed))); }
        out
    }

    pub fn leave(&mut self) { if self.over.is_none() { self.lose("walked", "You walked away."); } }

    /// Play a move.
    pub fn play(&mut self, m: Move) -> Result<(), String> {
        match m {
            Move::Press => self.press().map(|_| ()),
            Move::Confront(u) => self.confront(u).map(|_| ()),
            Move::Deflect(u) => self.deflect(u),
            Move::Cast(s) => self.cast(s),
            Move::Bury => self.bury(),
            Move::Fact(f, u) => self.use_fact(f, u),
            Move::Leave => { self.leave(); Ok(()) }
        }
    }
}

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum FailKind { Sus, Agree, Patience, Harden, Grudge, Mana, Crowns, Health }
impl FailKind {
    pub fn name(self) -> &'static str {
        use FailKind::*;
        match self { Sus => "sus", Agree => "agree", Patience => "patience", Harden => "harden", Grudge => "grudge", Mana => "mana", Crowns => "crowns", Health => "health" }
    }
}
pub struct Asks { pub kind: &'static str, pub sign: &'static str, pub label: String, pub short: String, pub have: String, pub spell: Option<Spell> }

/// A spell cast on the table stays on each argument while it is there: Foresight's fate, advantage (Glamour, Index),
/// Index's Lore. An argument that goes back to the deck loses them.
pub fn fresh(c: &Card) -> Card { Card { fate: None, adv: false, index: false, age: 0, boost: 0.0, ..c.clone() } }
pub fn signal_of(c: &Card) -> Option<Sig> { if c.index { Some(Sig::Lore) } else { c.signal } }
pub fn is_volatile(c: &Card) -> bool { c.fx == Some(Fx::Volatile) }
/// A check: not a demand, nor one of their spells, nor a card a spell of yours put in their deck, nor a blank.
pub fn is_check(c: &Card) -> bool { c.gate.is_none() && c.hex.is_none() && c.gift.is_none() && !c.unknown }
/// What Foresight and Glamour mark: Foresight every check not yet certain, Glamour every Charm or Guile check.
pub fn foreseeable(c: &Card) -> bool { is_check(c) && c.fate.is_none() }
pub fn charmable(c: &Card) -> bool { is_check(c) && !c.adv && matches!(c.signal, Some(Sig::Charm) | Some(Sig::Guile)) }
fn to_lore(c: &mut Card) { if c.signal == Some(Sig::Lore) { c.adv = true; } else { c.index = true; } }
/// Answering costs 1 Patience; the Omen and the Lodestar, nothing.
pub fn patience_cost(c: &Card) -> i32 { if c.gift.is_some() { 0 } else { 1 } }
pub fn wait_of(c: &Card) -> i32 { if c.wait != 0 { c.wait } else { LINGER } }
pub fn left_of(c: &Card) -> i32 { wait_of(c) - c.age }
pub fn band(p: f64) -> &'static str { BANDS.iter().find(|b| p < b.0).unwrap().1 }
