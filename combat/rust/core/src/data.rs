// Spell numbers come from js/roster.mjs via tools/export-data.mjs; this file only indexes them.
use serde::Deserialize;
use std::collections::HashMap;
use std::sync::OnceLock;

pub const SKILLS: [&str; 6] = ["arcana", "lore", "alchemy", "charm", "vigor", "guile"];
pub const RESOURCES: [&str; 6] = ["health", "mood", "renown", "mana", "crowns", "alignment"];
pub const R_HEALTH: usize = 0;
pub const R_RENOWN: usize = 2;
pub const R_MANA: usize = 3;
pub const R_CROWNS: usize = 4;
pub const R_ALIGNMENT: usize = 5;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct RawSpell {
    id: String,
    name: String,
    skills: Vec<String>,
    cost: Vec<f64>,
    damage: Option<Vec<f64>>,
    healing: Option<Vec<f64>>,
    duration: Option<Vec<f64>>,
    actions: Option<Vec<f64>>,
    renown: Option<Vec<f64>>,
    hold_cost: Option<f64>,
    hp_cost: Option<f64>,
    channel: Option<bool>,
    construct: Option<bool>,
    castable: Option<bool>,
    group: String,
    alignment: Option<String>,
    release: Option<Vec<f64>>,
    exposes: Option<bool>,
    physical: Option<bool>,
    amounts: Option<HashMap<String, f64>>,
    bind: Option<f64>,
    drain: Option<f64>,
    drain_keep: Option<bool>,
    poison: Option<Vec<f64>>,
    hits: Option<f64>,
    rule: Option<String>,
    delay: Option<f64>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct RawConstruct {
    id: String,
    action: String,
    power: f64,
    reduction: f64,
    threshold: f64,
    burst: Option<f64>,
    max_exchanges: i32,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct RawSkillTuning {
    pivot: f64,
    main: Vec<String>,
    main_per_point: f64,
    minor_per_point: f64,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct RawTuning {
    skill: RawSkillTuning,
    strike: Option<RawStrikeTuning>,
    guard: Option<RawGuardTuning>,
    shadowstep: Option<RawShadowstepTuning>,
    decision: Option<RawDecisionTuning>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct RawDecisionTuning {
    quiet_exchanges: Option<i32>,
    max_exchanges: Option<i32>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct RawGuardTuning {
    repeat_leak: Option<f64>,
    lookback: Option<i32>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct RawShadowstepTuning {
    break_on_cast: Option<bool>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct RawStrikeTuning {
    damage: Option<f64>,
    per_point: Option<f64>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct RawData {
    tuning: RawTuning,
    spells: Vec<RawSpell>,
    constructs: Vec<RawConstruct>,
    contexts: serde_json::Map<String, serde_json::Value>,
    flux_ratio: f64,
    alignment_cost: HashMap<String, f64>,
}

pub struct Spell {
    pub id: String,
    pub name: String,
    pub skills: Vec<usize>,
    pub cost: Vec<f64>,
    pub damage: Option<Vec<f64>>,
    pub healing: Option<Vec<f64>>,
    pub duration: Option<Vec<f64>>,
    pub actions: Option<Vec<f64>>,
    pub renown: Option<Vec<f64>>,
    pub hold_cost: Option<f64>,
    pub hp_cost: Option<f64>,
    pub channel: bool,
    pub construct: Option<usize>,
    pub castable: bool,
    pub forbidden: bool,
    pub alignment_cost: Option<f64>,
    /// Starlight: base damage of a Release straight away and after a Hold.
    pub release: Option<Vec<f64>>,
    /// Casting it breaks your own Shadowstep (Mend: healing needs you still and in the open).
    pub exposes: bool,
    /// Impact damage (F5.11-plan.1; Parry stops it, Ward halves it), not spell damage: creature blows, Tailwind.
    pub physical: bool,
    /// A special spell's named amounts (Wildfire's hold, self, release, perHold; Siphon's hit; Moonwell's and Lodestar's bank; Omen's hit).
    pub amounts: HashMap<String, f64>,
    /// Creature mechanics (world expansion 1), read by property rather than by name:
    /// bind: Breaking Free is the target's only action for this many exchanges from the next (F5.11-plan.1);
    /// drain: ready Mana taken from the target (Filch keeps it as flux: drain_keep; Roar scatters it);
    /// poison: [damage per tick, ticks] from this exchange, inevitable (Venom, F5.11-plan.1);
    /// hits: the damage lands as this many smaller hits, and only the first meets Parry and Brace (Swarm).
    pub bind: Option<i32>,
    pub drain: Option<f64>,
    pub drain_keep: bool,
    pub poison: Option<(f64, i32)>,
    pub hits: i32,
    /// The rule this spell plays (F5.11): itself, or another spell whose rule it copies with its own numbers (a creature's
    /// Skitter plays Shadowstep's, at its own cost and duration). The rules compare `rule`, never the id, where a copy counts.
    pub rule: usize,
    /// A delayed blow (F5.11): the cast lands its `hit` this many exchanges later, like Omen, with its own pierce amounts
    /// (wardPierce, guardPierce, bracePierce; none by default, so Ward stops it).
    pub delay: Option<i32>,
}

#[derive(Clone, Copy, PartialEq)]
pub enum ConstructAction { Strike, Heal, Spell }

pub struct Construct {
    pub action: ConstructAction,
    pub power: f64,
    pub reduction: f64,
    pub threshold: f64,
    pub burst: Option<f64>,
    pub max_exchanges: i32,
}

/// Spells the rules refer to by name.
pub struct Ids {
    pub flame: usize, pub foresight: usize, pub mend: usize, pub glamour: usize, pub haste: usize, pub shadowstep: usize,
    pub ward: usize, pub starlight: usize, pub seal: usize, pub wildfire: usize, pub heartwood: usize, pub omen: usize,
    pub sleight: usize, pub contraption: usize, pub hoarfrost: usize, pub candour: usize, pub brace: usize, pub quickquill: usize,
    pub bramble: usize, pub index: usize, pub rapport: usize, pub purify: usize, pub tailwind: usize, pub rime: usize,
    pub reflect: usize, pub moonwell: usize, pub lodestar: usize, pub toll: usize, pub torment: usize, pub extraction: usize,
    pub siphon: usize, pub compel: usize, pub eclipse: usize, pub heartprice: usize, pub animate: usize,
}

/// How skills scale amounts: factor = 1 + perPoint × (skill − pivot), main combat skills at the steeper rate.
/// Strike: its base damage and its own Vigor rate (None: Vigor's rate, as for any spell).
pub struct SkillTuning { pub pivot: f64, pub per_point: [f64; 6], pub strike_damage: f64, pub strike_per_point: Option<f64>, pub guard_repeat_leak: f64, pub guard_lookback: i32, pub shadowstep_break_on_cast: bool, pub decision_quiet: i32, pub decision_max: i32 }

pub struct Data {
    pub skill: SkillTuning,
    pub spells: Vec<Spell>,
    pub constructs: Vec<Construct>,
    pub construct_spell: Vec<usize>,
    pub contexts: serde_json::Map<String, serde_json::Value>,
    pub flux_ratio: f64,
    pub ids: Ids,
    pub acts: Acts,
    spell_index: HashMap<String, usize>,
}

/// Action codes: spells first, then the basics and specials, then every Haste bundle.
pub type Act = u8;
pub struct Acts {
    pub n_spells: usize,
    /// break_free (F5.11-plan.1): Breaking Free, the only action while Bound.
    pub strike: Act, pub guard: Act, pub reclaim: Act, pub hold: Act, pub release: Act, pub frozen: Act, pub cancel: Act, pub break_free: Act,
    pub names: Vec<String>,
    /// Haste bundles are never legal since F5.11-plan.1 (Countertempo); their codes stay so old states and logs still load.
    /// For bundles: their basic parts in public order; for others: [self].
    pub parts: Vec<Vec<Act>>,
    pub is_bundle: Vec<bool>,
    /// cachedBundles(count) for count 0..=4, in the JS insertion order.
    pub bundles_by_count: Vec<Vec<Act>>,
    /// moveTie constants: (31^len, H(id)) mod 2^32.
    pub tie: Vec<(u32, u32)>,
    index: HashMap<String, Act>,
}

impl Data {
    pub fn spell(&self, id: &str) -> Option<usize> { self.spell_index.get(id).copied() }
    pub fn act(&self, name: &str) -> Option<Act> { self.acts.index.get(name).copied() }
    pub fn name(&self, a: Act) -> &str { &self.acts.names[a as usize] }
    /// A spell's named amount from the roster (`amounts`); 0 when the roster leaves it out.
    pub fn amt(&self, sp: usize, key: &str) -> f64 { self.spells[sp].amounts.get(key).copied().unwrap_or(0.0) }
    pub fn is_spell(&self, a: Act) -> bool { (a as usize) < self.acts.n_spells }
    /// The rule an action plays (F5.11): a copy's base spell, else the action itself.
    pub fn rule(&self, a: Act) -> Act { if self.is_spell(a) { self.spells[a as usize].rule as Act } else { a } }
}

static DATA: OnceLock<Data> = OnceLock::new();
pub fn data() -> &'static Data { DATA.get_or_init(load) }

fn load() -> Data {
    // Natively, COMBAT_DATA can point at another export (tools/arms.mjs variants); the browser build always uses the embedded one.
    #[cfg(not(target_arch = "wasm32"))]
    let text = match std::env::var("COMBAT_DATA") { Ok(p) => std::fs::read_to_string(&p).unwrap_or_else(|e| panic!("COMBAT_DATA {p}: {e}")), Err(_) => include_str!("../data/rules-data.json").to_string() };
    #[cfg(target_arch = "wasm32")]
    let text = include_str!("../data/rules-data.json").to_string();
    let raw: RawData = serde_json::from_str(&text).expect("rules-data.json");
    let skill = |k: &str| SKILLS.iter().position(|s| *s == k).unwrap_or_else(|| panic!("unknown skill {k}"));
    let constructs_by_id: HashMap<String, usize> = raw.constructs.iter().enumerate().map(|(i, c)| (c.id.clone(), i)).collect();
    let mut spells = Vec::new();
    for s in &raw.spells {
        spells.push(Spell {
            id: s.id.clone(), name: s.name.clone(), skills: s.skills.iter().map(|k| skill(k)).collect(), cost: s.cost.clone(),
            damage: s.damage.clone(), healing: s.healing.clone(), duration: s.duration.clone(), actions: s.actions.clone(), renown: s.renown.clone(),
            hold_cost: s.hold_cost, hp_cost: s.hp_cost, channel: s.channel.unwrap_or(false),
            construct: if s.construct.unwrap_or(false) { Some(constructs_by_id[&s.id]) } else { None },
            castable: s.castable.unwrap_or(true), forbidden: s.group == "forbidden",
            alignment_cost: s.alignment.as_ref().map(|t| raw.alignment_cost[t]),
            release: s.release.clone(),
            exposes: s.exposes.unwrap_or(false),
            physical: s.physical.unwrap_or(false),
            amounts: s.amounts.clone().unwrap_or_default(),
            bind: s.bind.map(|b| b as i32),
            drain: s.drain,
            drain_keep: s.drain_keep.unwrap_or(false),
            poison: s.poison.as_ref().map(|p| (p[0], p.get(1).copied().unwrap_or(3.0) as i32)),
            hits: s.hits.map_or(1, |h| (h as i32).max(1)),
            rule: 0,
            delay: s.delay.map(|n| (n as i32).max(1)),
        });
    }
    let spell_index: HashMap<String, usize> = spells.iter().enumerate().map(|(i, s)| (s.id.clone(), i)).collect();
    for (i, s) in raw.spells.iter().enumerate() {
        spells[i].rule = match &s.rule { Some(r) => *spell_index.get(r).unwrap_or_else(|| panic!("spell {}: unknown rule {r}", s.id)), None => i };
    }
    let constructs: Vec<Construct> = raw.constructs.iter().map(|c| Construct {
        action: match c.action.as_str() { "strike" => ConstructAction::Strike, "heal" => ConstructAction::Heal, _ => ConstructAction::Spell },
        power: c.power, reduction: c.reduction, threshold: c.threshold, burst: c.burst, max_exchanges: c.max_exchanges,
    }).collect();
    let construct_spell = raw.constructs.iter().map(|c| spell_index[&c.id]).collect();
    let g = |id: &str| *spell_index.get(id).unwrap_or_else(|| panic!("rules need spell {id}"));
    let ids = Ids {
        flame: g("flame"), foresight: g("foresight"), mend: g("mend"), glamour: g("glamour"), haste: g("haste"), shadowstep: g("shadowstep"),
        ward: g("ward"), starlight: g("starlight"), seal: g("seal"), wildfire: g("wildfire"), heartwood: g("heartwood"), omen: g("omen"),
        sleight: g("sleight"), contraption: g("contraption"), hoarfrost: g("hoarfrost"), candour: g("candour"), brace: g("brace"), quickquill: g("quickquill"),
        bramble: g("bramble"), index: g("index"), rapport: g("rapport"), purify: g("purify"), tailwind: g("tailwind"), rime: g("rime"),
        reflect: g("reflect"), moonwell: g("moonwell"), lodestar: g("lodestar"), toll: g("toll"), torment: g("torment"), extraction: g("extraction"),
        siphon: g("siphon"), compel: g("compel"), eclipse: g("eclipse"), heartprice: g("heartprice"), animate: g("animate"),
    };
    let acts = build_acts(&spells);
    let t = &raw.tuning.skill;
    let per_point = SKILLS.map(|k| if t.main.iter().any(|m| m == k) { t.main_per_point } else { t.minor_per_point });
    let st = raw.tuning.strike.as_ref();
    let (strike_damage, strike_per_point) = (st.and_then(|s| s.damage).unwrap_or(crate::rules::STRIKE_DAMAGE), st.and_then(|s| s.per_point));
    let guard_repeat_leak = raw.tuning.guard.as_ref().and_then(|g| g.repeat_leak).unwrap_or(0.0);
    let guard_lookback = raw.tuning.guard.as_ref().and_then(|g| g.lookback).unwrap_or(1);
    let decision_quiet = raw.tuning.decision.as_ref().and_then(|g| g.quiet_exchanges).unwrap_or(crate::rules::DECISION_QUIET_EXCHANGES);
    let decision_max = raw.tuning.decision.as_ref().and_then(|g| g.max_exchanges).unwrap_or(crate::rules::DECISION_MAX_EXCHANGES);
    let shadowstep_break_on_cast = raw.tuning.shadowstep.as_ref().and_then(|g| g.break_on_cast).unwrap_or(false);
    Data { skill: SkillTuning { pivot: t.pivot, per_point, strike_damage, strike_per_point, guard_repeat_leak, guard_lookback, shadowstep_break_on_cast, decision_quiet, decision_max }, spells, constructs, construct_spell, contexts: raw.contexts, flux_ratio: raw.flux_ratio, ids, acts, spell_index }
}

fn build_acts(spells: &[Spell]) -> Acts {
    let n = spells.len();
    let mut names: Vec<String> = spells.iter().map(|s| s.id.clone()).collect();
    for b in ["strike", "guard", "reclaim", "hold", "release", "frozen", "cancel", "break_free"] { names.push(b.to_string()); }
    let (strike, guard, reclaim) = (n as Act, n as Act + 1, n as Act + 2);
    let basics = [strike, guard, reclaim];
    let basic_names = ["strike", "guard", "reclaim"];
    let mut parts: Vec<Vec<Act>> = (0..names.len()).map(|i| vec![i as Act]).collect();
    let mut is_bundle = vec![false; names.len()];
    let mut index: HashMap<String, Act> = names.iter().enumerate().map(|(i, s)| (s.clone(), i as Act)).collect();
    let mut bundles_by_count = vec![Vec::new()];
    for count in 1..=4usize {
        // add(parts,start) recursion of cachedBundles, with its normalisation and Set insertion order.
        let mut out: Vec<String> = Vec::new();
        fn add(parts: &mut Vec<usize>, start: usize, count: usize, out: &mut Vec<String>, names: &[&str; 3]) {
            if parts.len() == count {
                let mut seen: Vec<usize> = Vec::new();
                let mut normalized: Vec<&str> = Vec::new();
                for (i, &p) in parts.iter().enumerate() {
                    let first = parts.iter().position(|&q| q == p) == Some(i);
                    if p == 0 || first { normalized.push(names[p]); }
                    seen.push(p);
                }
                let name = format!("bundle:{}", normalized.join("+"));
                if !out.contains(&name) { out.push(name); }
                return;
            }
            for i in start..3 { parts.push(i); add(parts, i, count, out, names); parts.pop(); }
        }
        add(&mut Vec::new(), 0, count, &mut out, &basic_names);
        let mut codes = Vec::new();
        for name in out {
            let code = *index.entry(name.clone()).or_insert_with(|| {
                names.push(name.clone());
                let p: Vec<Act> = name[7..].split('+').map(|b| basics[basic_names.iter().position(|x| *x == b).unwrap()]).collect();
                parts.push(p);
                is_bundle.push(true);
                (names.len() - 1) as Act
            });
            codes.push(code);
        }
        bundles_by_count.push(codes);
    }
    assert!(names.len() < 255, "too many actions for u8 codes");
    let tie = names.iter().map(|id| {
        let (mut h, mut p) = (0u32, 1u32);
        for c in id.chars() { h = h.wrapping_mul(31).wrapping_add(c as u32); p = p.wrapping_mul(31); }
        (p, h)
    }).collect();
    Acts { n_spells: n, strike, guard, reclaim, hold: n as Act + 3, release: n as Act + 4, frozen: n as Act + 5, cancel: n as Act + 6, break_free: n as Act + 7, names, parts, is_bundle, bundles_by_count, tie, index }
}
