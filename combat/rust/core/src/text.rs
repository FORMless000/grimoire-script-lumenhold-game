//! Action names and rule descriptions shown in the game. The numbers come from the same rule
//! functions and constants that resolve the fight, so text and rules cannot drift apart.
//! A description is built as a template (describe_t: a key from TEXT and its values, which may be nested templates, a
//! `{"label": id}` or a list of them) and rendered: in English here (describe), or by the main game in its language
//! (web/core.mjs renders describe_data with TEXT and the locale's translations of it).
//! F5.11-plan.1: the basics are Impulse (id strike), Parry (guard) and Refocus (reclaim); a physical hit is Impact damage.
use crate::data::{data, Act, ConstructAction};
use crate::rules::*;
use crate::state::*;
use serde_json::{json, Map, Value};

/// JS `String(n)` for the numbers these texts print.
pub fn js_num(x: f64) -> String {
    if x == x.trunc() && x.abs() < 1e21 { format!("{}", x as i64) } else { format!("{x}") }
}
fn fmt2(n: f64) -> String { js_num(js_round(n * 100.0) / 100.0) }

pub fn label(a: Option<Act>) -> String {
    let d = data();
    let Some(a) = a else { return "undefined".into() };
    let k = &d.acts;
    if k.is_bundle[a as usize] { return k.parts[a as usize].iter().map(|&p| label(Some(p))).collect::<Vec<_>>().join(" + "); }
    if d.is_spell(a) { return d.spells[a as usize].name.clone(); }
    let basic = [(k.strike, "Impulse"), (k.guard, "Parry"), (k.reclaim, "Refocus"), (k.hold, "Hold"), (k.release, "Release"), (k.frozen, "Frozen"), (k.cancel, "Cancelled"), (k.break_free, "Breaking Free")];
    basic.iter().find(|(b, _)| *b == a).map(|(_, n)| n.to_string()).unwrap_or_else(|| d.name(a).to_string())
}

/// Every description template, in English: {name} is a value of the template (a number, or a nested template).
pub const TEXT: &[(&str, &str)] = &[
    ("d.strike", "Deal {dmg} Impact damage before defenses; {guard}."),
    ("d.strike.guard", "Parry stops all of it, Ward half"),
    ("d.strike.guardLeak", "Parry stops all of it (half, from a Parry straight after a Parry), Ward half"),
    ("d.guard", "Turn aside all Impact damage and half of spell damage this exchange."),
    ("d.guard.tired", "Still parrying, and tiring: stop {pct}% of Impact damage and half of spell damage this exchange."),
    ("d.guard.fresh", "Turn aside all Impact damage and half of spell damage this exchange. Parrying again {when} stops only {pct}% of Impact damage."),
    ("d.guard.straightAfter", "straight after"),
    ("d.guard.within", "within {n} exchanges"),
    ("d.reclaim", "Recover up to {n} flux after attacks, capped at capacity; recovering Mana breaks Shadowstep before this exchange's attacks."),
    ("d.breakFree", "Bound: struggle free. Your only action this exchange; no Bind can take hold of you while you break free."),
    ("d.channelAction", "{action} {spell}. {text}"),
    ("d.frozen", "Cannot act this exchange, and ordinary damage can't touch you (poison and Torment still can); then thaw."),
    ("d.dealSpell", "Deal {dmg} spell damage."),
    ("d.starlight.release", "Deal {dmg} spell damage{pierce}."),
    ("d.starlight.releasePierce", "; Ward doesn't stop it"),
    ("d.starlight.hold", "Charge the release to {dmg} spell damage{pierce}. Further Holds add no damage."),
    ("d.starlight.holdPierce", " that Ward doesn't stop"),
    ("d.wildfire.release", "Deal {dmg} spell damage as one hit ({bank} of it banked); Ward stops only half of it."),
    ("d.wildfire.hold", "Deal {dmg} spell damage to them and {self} to yourself, and bank {more} more: Release would then deal {release}."),
    ("d.siphon.release", "Heal {n} HP from damage dealt."),
    ("d.siphon.hold", "Deal {dmg} spell damage; bank actual damage for healing."),
    ("d.moonwell.release", "Gain up to {n} ready Mana, capped at capacity."),
    ("d.moonwell.hold", "Bank {n} more Mana; Release makes it ready."),
    ("d.construct", "{effect} at the end of this exchange and of each exchange after, {life} in all. Each opposing hit on you loses {reduce}; it breaks once you have taken {threshold} damage. A new summon replaces it.{burst}"),
    ("d.construct.heal", "Heal {n} HP"),
    ("d.construct.strike", "Deal {n} Impact damage before defenses"),
    ("d.construct.spell", "Deal {n} spell damage before defenses"),
    ("d.construct.burst", " When it ends (broken, run out or replaced): {n} spell damage to both sides before defenses."),
    ("d.forbidden", "{text} Forbidden: alignment −2 each cast; witnessed casts are reported."),
    ("d.spellHit", "Deal {dmg} spell damage before defenses. Parry halves it; Ward stops it."),
    ("d.physicalHit", "Deal {dmg} Impact damage before defenses. Parry stops it; Ward halves it."),
    ("d.foresight", "Your opponent commits first for the next {n}: you see their move before you choose."),
    ("d.mend", "At the end of the exchange, heal {n} HP, unless you take any damage this exchange.{exposes}"),
    ("d.mend.exposes", " Breaks your own Shadowstep."),
    ("d.reward.tranches", " The first cast that pays gives {full}, the second {half}, later casts nothing."),
    ("d.glamour", "With observers: earn {n} Renown at settlement.{tranches}"),
    ("d.rapport", "With observers: pay {crowns} Crowns to earn {n} Renown at settlement (no Crowns when it would earn nothing).{tranches}"),
    ("d.sleight", "Steal up to {n} Crowns; alignment −tiny. Reflect turns it on you.{tranches}"),
    ("d.reward.none", "nothing more this fight"),
    ("d.haste", "For the next {n}, each spell you cast that deals no damage of its own and isn't a channel also throws an Impulse ({dmg} Impact damage): an attack, so it breaks your Shadowstep. Basic actions don't."),
    ("d.shadowstep", "Evade attacks and every opposing spell effect for {n} including this one; breaks before the hits land on any exchange you attack or recover Mana."),
    ("d.ward", "This exchange: stop every opposing spell (its damage, and Bind, poison, Torment, Omen, Compel, Extraction, Seal and the like) and half of each Impact hit. A charged Starlight gets through, and half of Wildfire's Release."),
    ("d.starlight", "Start channel. Release for {dmg} spell damage, or {charged} after a Hold{pierce}. Holds cost {cost} Mana."),
    ("d.starlight.pierce", ", which Ward doesn't stop"),
    ("d.seal", "Erase all their flux (loose Mana not yet recovered). Ward or stepping aside stops it; Reflect turns it on you."),
    ("d.wildfire", "Start channel: deal {hit} spell damage now, burn yourself for {self} and bank {hit} for the Release. Each Hold does the same, its heat on you growing by {self} a Hold. Release: {hit} plus the bank as one spell hit, of which Ward stops only half. Holds cost {cost} Mana."),
    ("d.bind", "Bind them for {n} from the next exchange: Breaking Free is their only action. Ward, stepping aside or Breaking Free keeps it off; Reflect turns it on you. Parry and Brace don't stop it."),
    ("d.bramble", "Deal {dmg} spell damage before defenses (Parry halves it) and Bind them for {n} from the next exchange: Breaking Free is their only action. Ward or stepping aside keeps both off; Reflect turns both on you."),
    ("d.poison", "Poison them: {dmg} damage at the end of this exchange and of the next, each before Mend, past every defense but a mature Lodestar. Nothing cures it; a new bite starts it over. Ward or stepping aside keeps it off; Reflect turns it on you."),
    ("d.poison.n", "Poison them: {dmg} damage at the end of each of {n} from this one, past every defense but a mature Lodestar. Nothing cures it. Ward or stepping aside keeps it off; Reflect turns it on you."),
    ("d.drain", "Scatter up to {n} of their ready Mana. Ward or stepping aside stops it; Reflect turns it on you."),
    ("d.drain.keep", "Take up to {n} of their ready Mana as your own flux. Ward or stepping aside stops it; Reflect turns it on you."),
    ("d.roar", "Deal {dmg} spell damage before defenses and scatter up to {n} of their ready Mana. Ward or stepping aside stops both; Reflect turns both on you."),
    ("d.hits", "Deal {dmg} spell damage as {n} hits of {each}; only the first meets Parry and Brace."),
    ("d.hits.physical", "Deal {dmg} Impact damage as {n} hits of {each}; only the first meets Parry and Brace."),
    ("d.twoHits", "Deal {dmg} spell damage now and {next} more at the end of the next exchange; each hit meets the defenses of its own exchange."),
    ("d.delayed", "In the open: {n} {kind} lands {when}, before defenses. {stops}"),
    ("d.delayed.both", "In the open: {n} spell damage and {m} Impact damage land together {when}, before defenses. {stops}"),
    ("d.kind.spell", "spell damage"),
    ("d.kind.impact", "Impact damage"),
    ("d.delayed.next", "next exchange"),
    ("d.delayed.later", "in {n} exchanges"),
    ("d.stops.spell", "Ward stops it, Parry halves it, Brace softens it and stepping aside dodges it."),
    ("d.stops.impact", "Parry stops it, Ward halves it, Brace softens it and stepping aside dodges it."),
    ("d.stops.impactNoGuard", "Ward halves it, Brace softens it and stepping aside dodges it; Parry doesn't touch it."),
    ("d.stops.impactNoBrace", "Parry stops it, Ward halves it and stepping aside dodges it; Brace doesn't touch it."),
    ("d.stops.bothNoGuard", "Ward stops the spell damage and halves the Impact, Brace softens both, stepping aside dodges both and Reflect returns the spell damage; Parry touches neither."),
    ("d.stops.generic", "The defenses of that exchange meet it."),
    ("d.omen", "Foretell two misfortunes: if it takes hold, {n} spell damage lands in two exchanges and {n} more in three. Ward or stepping aside keeps it off; Reflect turns it on you. Each hit meets the defenses of its exchange, but Brace doesn't soften it; Omens due the same exchange land as one hit."),
    ("d.hoarfrost", "Deal {dmg} cold spell damage before defenses; opposing Flame or Wildfire damage this exchange cancels with it."),
    ("d.noEffect", "No combat effect."),
    ("d.brace", "For {n} including this one, take {pct} off all opposing damage, except Omen's. Hostile spell effects still land."),
    ("d.purify", "Pay {hp} HP; gain up to {n} ready Mana, capped at capacity."),
    ("d.tailwind", "Deal {dmg} Impact damage before defenses (Parry stops it, Ward halves it). Each Tailwind straight after a Tailwind deals {step} more; any other move starts it over."),
    ("d.rime", "Once a fight: arm a rescue. The first time you would fall, you freeze instead with {n} HP, through the next exchange: ordinary damage can't touch you then, but poison and Torment still can."),
    ("d.reflect", "This exchange, return incoming hostile spells and spell damage to their source, including scheduled spell damage. Does not reflect Impact damage, poison ticks or Torment tolls. Nothing bounces twice."),
    ("d.moonwell", "Start channel: bank {n} Mana now and {more} per free Hold; Release makes it ready."),
    ("d.lodestar", "Kindle a star that rises for {n} exchanges. When it matures it negates all damage to you that exchange (your own included) and wards you, then heals {heal} HP. One rising at a time."),
    ("d.toll", "Cards/story only; not a combat cast."),
    ("d.torment", "For three exchanges including this one, each of their moves costs them {n}× the ready Mana they pay for it, in HP, past every defense but a mature Lodestar. Ward or stepping aside keeps it off; Reflect turns it on you."),
    ("d.extraction", "Move up to {n} of their ready Mana into your flux; your Mana plus flux can't pass capacity. Ward or stepping aside stops it; Reflect turns it on you."),
    ("d.siphon", "Start and each Hold deal {n} spell damage before defenses. Release heals actual damage dealt; Holds cost {cost} Mana."),
    ("d.compel", "Seize their move of this exchange: it plays as usual, then they must repeat it for the next {n}, shown in advance; a turn they can't repeat it is lost. Ward or stepping aside keeps it off; Reflect turns it on you. Not in the first exchange."),
    ("d.eclipse", "For {n} including this one, damage you actually take also gives you that much ready Mana, capped at capacity."),
    ("d.heartprice", "Turn all your ready Mana into HP now (up to your max). Then, for the rest of the fight, nothing heals you but Rime's rescue, and your spells cost HP at 1 HP per 2 Mana (healing spells still cost Mana). Once a fight."),
    ("w.one", "one"),
    ("w.exchange", "exchange"),
    ("w.exchange1", "1 exchange"),
    ("w.exchanges", "{n} exchanges"),
];

/// "exchange" / "{n} exchanges" (for "the next …") and "1 exchange" / "{n} exchanges" (for "for … including this one").
fn next_span(n: i32) -> Value { if n == 1 { t("w.exchange").done() } else { t("w.exchanges").v("n", js_num(n as f64)).done() } }
fn span(n: i32) -> Value { if n == 1 { t("w.exchange1").done() } else { t("w.exchanges").v("n", js_num(n as f64)).done() } }

/// What meets a scheduled blow (F5.11): from its category and pierce amounts.
fn stops(sp: usize, impact: bool, both: bool) -> Value {
    let (g, b) = (data().amt(sp, "guardPierce") >= 1.0, data().amt(sp, "bracePierce") >= 1.0);
    t(match (both, impact, g, b) {
        (true, _, true, false) => "d.stops.bothNoGuard",
        (false, false, false, false) => "d.stops.spell",
        (false, true, false, false) => "d.stops.impact",
        (false, true, true, false) => "d.stops.impactNoGuard",
        (false, true, false, true) => "d.stops.impactNoBrace",
        _ => "d.stops.generic",
    }).done()
}

/// A template under construction: its key and values.
struct T(Map<String, Value>);
fn t(key: &str) -> T { let mut m = Map::new(); m.insert("k".into(), json!(key)); T(m) }
impl T {
    fn v(mut self, name: &str, x: impl Into<Value>) -> T { self.0.insert(name.into(), x.into()); self }
    fn done(self) -> Value { Value::Object(self.0) }
}
impl From<T> for Value { fn from(x: T) -> Value { x.done() } }
fn lab(a: Option<Act>) -> Value { match a { Some(a) => json!({ "label": data().name(a) }), None => json!("undefined") } }
const NONE: &str = "";

/// A template in English (the main game renders the same structure with its own table: web/core.mjs).
pub fn render(v: &Value) -> String {
    match v {
        Value::String(s) => s.clone(),
        Value::Array(xs) => xs.iter().map(render).collect::<Vec<_>>().join(", "),
        Value::Object(m) if m.contains_key("label") => label(m["label"].as_str().and_then(|n| data().act(n))),
        Value::Object(m) => {
            let key = m["k"].as_str().unwrap_or("");
            let tpl = TEXT.iter().find(|(k, _)| *k == key).map_or("", |(_, s)| s);
            let mut out = String::new();
            let mut rest = tpl;
            while let Some(i) = rest.find('{') {
                out.push_str(&rest[..i]);
                let j = rest[i..].find('}').map_or(rest.len(), |j| i + j);
                out.push_str(&m.get(&rest[i + 1..j]).map_or(String::new(), render));
                rest = &rest[(j + 1).min(rest.len())..];
            }
            out.push_str(rest);
            out
        }
        _ => String::new(),
    }
}

/// describe(s, side, id): what the action does for this side now, in English.
pub fn describe(enc: &Encounter, s: &State, side: usize, a: Act) -> String { render(&describe_t(enc, s, side, a)) }

/// The description as a template (TEXT keys and their values).
pub fn describe_t(enc: &Encounter, s: &State, side: usize, a: Act) -> Value {
    let dt = data();
    let (k, ids) = (&dt.acts, &dt.ids);
    let x = &s.actors[side];
    let dmg = |sp: usize, base: f64| js_num(damage_power(enc, side, sp, base));
    let v = |sp: usize, base: f64, physical: bool| fmt2(amount(enc, side, Some(sp), base, physical));
    let ap = |a: Act| js_num(attack_power(enc, s, side, a));
    let channel_text = |sp: Option<usize>, release: bool| -> Value {
        let c = x.channel;
        let holds = c.map_or(0, |c| c.holds);
        match sp {
            Some(sp) if sp == ids.starlight => if release { t("d.starlight.release").v("dmg", dmg(sp, starlight_base(holds != 0))).v("pierce", if holds != 0 && data().amt(sp, "chargedWardPierce") >= 1.0 { t("d.starlight.releasePierce").done() } else { json!(NONE) }).done() }
                else { t("d.starlight.hold").v("dmg", dmg(sp, starlight_base(true))).v("pierce", if data().amt(sp, "chargedWardPierce") >= 1.0 { t("d.starlight.holdPierce").done() } else { json!(NONE) }).done() },
            // Wildfire (F5.11-plan.1): the live bank, the next burn and what the Release would deal.
            Some(sp) if sp == ids.wildfire => { let (h, bank) = (data().amt(sp, "hit"), c.map_or(0.0, |c| c.bank)); let more = data().spells[sp].amounts.get("bank").copied().unwrap_or(h);
                if release { t("d.wildfire.release").v("dmg", dmg(sp, h + bank)).v("bank", dmg(sp, bank)).done() }
                else { t("d.wildfire.hold").v("dmg", dmg(sp, h)).v("self", js_num(wildfire_self(holds + 1))).v("more", dmg(sp, more)).v("release", dmg(sp, h + bank + more)).done() } },
            Some(sp) if sp == ids.siphon => if release { t("d.siphon.release").v("n", fmt2(c.map_or(0.0, |c| c.total))).done() }
                else { t("d.siphon.hold").v("dmg", dmg(sp, data().amt(sp, "hit"))).done() },
            Some(sp) if sp == ids.moonwell => if release { t("d.moonwell.release").v("n", fmt2(c.map_or(0.0, |c| c.bank))).done() }
                else { t("d.moonwell.hold").v("n", v(sp, data().amt(sp, "bank"), false)).done() },
            _ => json!(NONE),
        }
    };
    if a == k.strike {
        let guard = if dt.skill.guard_repeat_leak > 0.0 { t("d.strike.guardLeak") } else { t("d.strike.guard") };
        return t("d.strike").v("dmg", ap(a)).v("guard", guard).done();
    }
    if a == k.guard {
        let leak = dt.skill.guard_repeat_leak;
        if leak <= 0.0 { return t("d.guard").done(); }
        let block = guard_block(s, side);
        return if block < 1.0 { t("d.guard.tired").v("pct", js_num((block * 100.0).round())).done() }
            else { t("d.guard.fresh").v("when", if dt.skill.guard_lookback <= 1 { t("d.guard.straightAfter") } else { t("d.guard.within").v("n", js_num(dt.skill.guard_lookback as f64)) }).v("pct", js_num(((1.0 - leak) * 100.0).round())).done() };
    }
    if a == k.reclaim { return t("d.reclaim").v("n", fmt2(x.flux)).done(); }
    if a == k.break_free { return t("d.breakFree").done(); }
    if a == k.hold || a == k.release {
        let sp = x.channel.map(|c| c.spell);
        return t("d.channelAction").v("action", lab(Some(a))).v("spell", lab(sp.map(|sp| sp as Act))).v("text", channel_text(sp, a == k.release)).done();
    }
    if a == k.frozen { return t("d.frozen").done(); }
    if !dt.is_spell(a) { return json!(NONE); }
    let sp = a as usize;
    let spell = &dt.spells[sp];
    if let Some(kind) = spell.construct {
        let c = &dt.constructs[kind];
        let effect = if c.action == ConstructAction::Heal { t("d.construct.heal").v("n", v(sp, c.power, true)) }
            else { t(if c.action == ConstructAction::Strike { "d.construct.strike" } else { "d.construct.spell" }).v("n", dmg(sp, c.power)) };
        let burst = c.burst.map_or(json!(NONE), |b| t("d.construct.burst").v("n", dmg(sp, b)).done());
        return t("d.construct").v("effect", effect).v("life", span(c.max_exchanges)).v("reduce", v(sp, c.reduction, true)).v("threshold", v(sp, c.threshold, true)).v("burst", burst).done();
    }
    let r = (rank(enc, side, sp) - 1) as usize;
    let dur = |xs: &Option<Vec<f64>>| xs.as_ref().map_or(1, |v| v[r.min(v.len() - 1)] as i32);
    let hold_cost = || js_num(spell.hold_cost.unwrap_or(0.0) * enc.mana_cost_scale);
    let pct = |f: f64| format!("{}%", js_num(js_round(f * 100.0)));
    // A reward spell's next payout and its tranches (F5.11-plan.1).
    let tranches = |sp: usize| { let full = reward_full(enc, side, sp); t("d.reward.tranches").v("full", js_num(full)).v("half", js_num(ceil_up(full / 2.0))).done() };
    let next = |sp: usize| { let n = reward_next(enc, s, side, sp); if n > EPS { json!(js_num(n)) } else { t("d.reward.none").done() } };
    let rule = spell.rule;
    let text: Value = match sp {
        _ if rule == ids.flame => t("d.spellHit").v("dmg", ap(a)).done(),
        _ if sp == ids.foresight => t("d.foresight").v("n", next_span(dur(&spell.duration))).done(),
        _ if sp == ids.mend => t("d.mend").v("n", v(sp, spell.healing.as_ref().unwrap()[r], true)).v("exposes", if spell.exposes { t("d.mend.exposes").done() } else { json!(NONE) }).done(),
        _ if sp == ids.glamour => t("d.glamour").v("n", next(sp)).v("tranches", tranches(sp)).done(),
        _ if sp == ids.rapport => t("d.rapport").v("n", next(sp)).v("crowns", js_num(data().spells[sp].amounts.get("crowns").copied().unwrap_or(10.0))).v("tranches", tranches(sp)).done(),
        _ if sp == ids.sleight => t("d.sleight").v("n", next(sp)).v("tranches", tranches(sp)).done(),
        _ if sp == ids.haste => t("d.haste").v("n", next_span(dur(&spell.duration))).v("dmg", ap(k.strike)).done(),
        _ if rule == ids.shadowstep => t("d.shadowstep").v("n", span(dur(&spell.duration))).done(),
        _ if rule == ids.ward => t("d.ward").done(),
        _ if sp == ids.starlight => t("d.starlight").v("dmg", dmg(sp, starlight_base(false))).v("charged", dmg(sp, starlight_base(true))).v("pierce", if data().amt(sp, "chargedWardPierce") >= 1.0 { t("d.starlight.pierce").done() } else { json!(NONE) }).v("cost", hold_cost()).done(),
        _ if sp == ids.seal => t("d.seal").done(),
        _ if sp == ids.wildfire => t("d.wildfire").v("hit", dmg(sp, data().amt(sp, "hit"))).v("self", js_num(wildfire_self(0))).v("cost", hold_cost()).done(),
        _ if sp == ids.omen => t("d.omen").v("n", dmg(sp, data().amt(sp, "hit"))).done(),
        // A delayed blow (F5.11): when it lands, how hard, and what meets it.
        _ if spell.delay.is_some() => { let n = spell.delay.unwrap();
            let when = if n == 1 { t("d.delayed.next").done() } else { t("d.delayed.later").v("n", js_num(n as f64)).done() };
            let (h, i) = (data().amt(sp, "hit"), data().amt(sp, "impact"));
            if h > 0.0 && i > 0.0 { t("d.delayed.both").v("n", dmg(sp, h)).v("m", dmg(sp, i)).v("when", when).v("stops", stops(sp, false, true)).done() }
            else { t("d.delayed").v("n", dmg(sp, h.max(i))).v("kind", t(if spell.physical || i > 0.0 { "d.kind.impact" } else { "d.kind.spell" }).done()).v("when", when).v("stops", stops(sp, spell.physical || i > 0.0, false)).done() } },
        _ if sp == ids.hoarfrost => t("d.hoarfrost").v("dmg", ap(a)).done(),
        _ if sp == ids.candour || sp == ids.quickquill || sp == ids.index => t("d.noEffect").done(),
        _ if rule == ids.brace => t("d.brace").v("n", span(brace_exchanges())).v("pct", pct(brace_share())).done(),
        _ if sp == ids.purify => t("d.purify").v("hp", fmt2(hp_cost(enc, s, side, a))).v("n", v(sp, PURIFY_MANA, false)).done(),
        _ if sp == ids.tailwind => t("d.tailwind").v("dmg", ap(a)).v("step", js_num(damage_power(enc, side, sp, tailwind_step()))).done(),
        _ if sp == ids.rime => t("d.rime").v("n", js_num(data().amt(ids.rime, "thaw"))).done(),
        _ if sp == ids.reflect => t("d.reflect").done(),
        _ if sp == ids.moonwell => t("d.moonwell").v("n", v(sp, data().amt(sp, "bank"), false)).v("more", v(sp, data().amt(sp, "bank"), false)).done(),
        _ if sp == ids.lodestar => t("d.lodestar").v("n", js_num(data().spells[sp].amounts.get("delay").copied().unwrap_or(7.0))).v("heal", v(sp, data().amt(sp, "heal"), true)).done(),
        _ if sp == ids.toll => t("d.toll").done(),
        _ if sp == ids.torment => t("d.torment").v("n", js_num(data().spells[sp].amounts.get("toll").copied().unwrap_or(2.0))).done(),
        _ if sp == ids.extraction => t("d.extraction").v("n", v(sp, EXTRACTION_MANA, false)).done(),
        _ if sp == ids.siphon => t("d.siphon").v("n", dmg(sp, data().amt(sp, "hit"))).v("cost", hold_cost()).done(),
        _ if sp == ids.compel => t("d.compel").v("n", next_span(dur(&spell.duration))).done(),
        _ if sp == ids.eclipse => t("d.eclipse").v("n", span(dur(&spell.duration))).done(),
        _ if sp == ids.heartprice => t("d.heartprice").done(),
        // Creature mechanics and Bramble by property (world expansion 1; F5.11-plan.1).
        _ if spell.bind.is_some() && spell.damage.is_some() => t("d.bramble").v("dmg", ap(a)).v("n", span(spell.bind.unwrap())).done(),
        _ if spell.bind.is_some() => t("d.bind").v("n", span(spell.bind.unwrap())).done(),
        _ if spell.poison.is_some() => { let (per, n) = spell.poison.unwrap(); if n == 2 { t("d.poison").v("dmg", dmg(sp, per)).done() } else { t("d.poison.n").v("dmg", dmg(sp, per)).v("n", span(n)).done() } },
        _ if spell.drain.is_some() && spell.damage.is_some() => t("d.roar").v("dmg", ap(a)).v("n", v(sp, spell.drain.unwrap(), false)).done(),
        _ if spell.drain.is_some() => t(if spell.drain_keep { "d.drain.keep" } else { "d.drain" }).v("n", v(sp, spell.drain.unwrap(), false)).done(),
        _ if spell.damage.is_some() && spell.hits > 1 => { let p = attack_power(enc, s, side, a); let each = js_round(p / spell.hits as f64).max(1.0);
            t(if spell.physical { "d.hits.physical" } else { "d.hits" }).v("dmg", js_num(each * spell.hits as f64)).v("n", js_num(spell.hits as f64)).v("each", js_num(each)).done() },
        _ if spell.damage.is_some() && data().amt(sp, "next") > 0.0 => t("d.twoHits").v("dmg", ap(a)).v("next", dmg(sp, data().amt(sp, "next"))).done(),
        // A plain damage spell (creature attacks and any later data-only spell): Impact ones land as an Impulse does.
        _ if spell.damage.is_some() => t(if spell.physical { "d.physicalHit" } else { "d.spellHit" }).v("dmg", ap(a)).done(),
        _ => json!(NONE),
    };
    if spell.forbidden { t("d.forbidden").v("text", text).done() } else { text }
}

/// TEXT as JSON (the main game's English source for translations).
pub fn text_table() -> Value { Value::Object(TEXT.iter().map(|(k, s)| (k.to_string(), json!(s))).collect()) }
