//! Action names and rule descriptions shown in the game. The numbers come from the same rule
//! functions and constants that resolve the fight, so text and rules cannot drift apart.
//! A description is built as a template (describe_t: a key from TEXT and its values, which may be nested templates, a
//! `{"label": id}` or a list of them) and rendered: in English here (describe), or by the main game in its language
//! (web/core.mjs renders describe_data with TEXT and the locale's translations of it).
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
    let basic = [(k.strike, "Strike"), (k.guard, "Guard"), (k.reclaim, "Reclaim"), (k.hold, "Hold"), (k.release, "Release"), (k.frozen, "Frozen"), (k.cancel, "Cancelled")];
    basic.iter().find(|(b, _)| *b == a).map(|(_, n)| n.to_string()).unwrap_or_else(|| d.name(a).to_string())
}

/// Every description template, in English: {name} is a value of the template (a number, or a nested template).
pub const TEXT: &[(&str, &str)] = &[
    ("d.bundle", "One public bundle: {parts}. Each Strike deals {dmg} physical damage before defenses{tailwind}. Repeated Guard/Reclaim add nothing."),
    ("d.bundle.tailwind", ", plus the active Tailwind sequence"),
    ("d.strike", "Deal {dmg} physical damage before defenses{extra}; {guard}."),
    ("d.strike.tailwind", " plus {n} Tailwind damage that gets through Guard"),
    ("d.strike.guard", "Guard stops all of it, Ward half"),
    ("d.strike.guardLeak", "Guard stops all of it (less from a Guard that has just guarded), Ward half"),
    ("d.guard", "Stop all Strike damage and half of spell damage this exchange."),
    ("d.guard.tired", "Still guarding, and tiring: stop {pct}% of Strike damage and half of spell damage this exchange."),
    ("d.guard.fresh", "Stop all Strike damage and half of spell damage this exchange. Guarding again {when} stops only {pct}% of a Strike."),
    ("d.guard.straightAfter", "straight after"),
    ("d.guard.within", "within {n} exchanges"),
    ("d.reclaim", "Recover up to {n} flux after attacks, capped at capacity; recovering Mana breaks Shadowstep before this exchange's attacks."),
    ("d.channelAction", "{action} {spell}. {text}"),
    ("d.frozen", "Cannot act or be hurt this exchange; then thaw."),
    ("d.dealSpell", "Deal {dmg} spell damage."),
    ("d.starlight.release", "Deal {dmg} spell damage{pierce}."),
    ("d.starlight.releasePierce", "; Ward doesn't stop it"),
    ("d.starlight.hold", "Charge the release to {dmg} spell damage{pierce}. Further Holds add no damage."),
    ("d.starlight.holdPierce", " that Ward doesn't stop"),
    ("d.wildfire.releaseHeld", "Deal {dmg} spell damage, plus {extra} from the Holds that gets through Guard and Ward."),
    ("d.wildfire.hold", "Deal {dmg} spell damage to them and {self} to yourself; the Release gains {per} that gets through Guard and Ward."),
    ("d.siphon.release", "Heal {n} HP from damage dealt."),
    ("d.siphon.hold", "Deal {dmg} spell damage; bank actual damage for healing."),
    ("d.moonwell.release", "Gain up to {n} ready Mana, capped at capacity."),
    ("d.moonwell.hold", "Bank {n} more Mana; Release makes it ready."),
    ("d.lodestar.release", "Turn on a {n}-point absorb pool, used up across hits."),
    ("d.lodestar.hold", "Bank {n} more absorb; the bank soaks up hits while you hold."),
    ("d.construct", "{effect} each exchange end; reduce each hit by {reduce}; ends after {threshold} HP damage taken.{burst}"),
    ("d.construct.heal", "Heal {n} HP"),
    ("d.construct.strike", "Deal {n} physical damage before defenses"),
    ("d.construct.spell", "Deal {n} spell damage before defenses"),
    ("d.construct.burst", " On ending: {n} spell damage to both sides before defenses."),
    ("d.forbidden", "{text} Forbidden: alignment −2 each cast; witnessed casts are reported."),
    ("d.spellHit", "Deal {dmg} spell damage before defenses. Guard halves it; Ward stops it."),
    ("d.physicalHit", "Deal {dmg} physical damage before defenses. Guard stops it; Ward halves it."),
    ("d.foresight", "Opponent commits first for {n} subsequent exchanges."),
    ("d.mend", "At the end of the exchange, heal {n} HP, unless you take any damage this exchange.{exposes}"),
    ("d.mend.exposes", " Breaks your own Shadowstep."),
    ("d.glamour", "With observers: earn {n} Renown at settlement. Casts stack, with Rapport's, up to {cap} Renown a fight."),
    ("d.haste", "For the next {n} exchanges, commit {actions} basic actions as one bundle each exchange."),
    ("d.shadowstep", "Evade attacks and every opposing spell effect for {n} exchanges including this one; breaks before the hits land on any exchange you attack or recover Mana."),
    ("d.ward", "This exchange: block every opposing spell (damage, Torment, Extraction, Seal, Compel) and half of each Strike."),
    ("d.starlight", "Start channel. Release for {dmg} spell damage, or {charged} after a Hold{pierce}. Holds cost {cost} Mana."),
    ("d.starlight.pierce", ", which Ward doesn't stop"),
    ("d.seal", "Erase all opposing flux. Ward and Shadowstep stop it."),
    ("d.wildfire", "Start channel{ignite}. Each Hold: {hold} spell damage to them, {self} to you, and +{per} on the Release that gets through Guard and Ward. Release: {release} spell damage plus what the Holds added. Before defenses."),
    ("d.wildfire.ignite", ", dealing {n} spell damage now"),
    ("d.omen", "Public hit of {n} spell damage before defenses two exchanges later{pierce}."),
    ("d.omen.evadeOnly", "; only evading stops it"),
    ("d.omen.guardWard", "; Guard and Ward don't stop it"),
    ("d.omen.ward", "; Ward doesn't stop it"),
    ("d.omen.guard", "; Guard doesn't stop it"),
    ("d.sleight", "Steal up to {n} Crowns; alignment −tiny."),
    ("d.hoarfrost", "Deal {dmg} cold spell damage before defenses; opposing Flame or Wildfire damage cancels with it."),
    ("d.noEffect", "No combat effect."),
    ("d.brace", "Block all opposing damage this exchange, then {a}, {b} and {c} of it over the next three exchanges. Spell effects still land."),
    ("d.rapport", "With observers, spend up to 10 Crowns automatically; earn 1 Renown per 2 spent at settlement, up to {cap} Renown a fight with Glamour's."),
    ("d.purify", "Pay {hp} HP; gain up to {n} ready Mana, capped at capacity."),
    ("d.tailwind", "Next three exchanges: consecutive Strikes add {n} damage that gets through Guard. Any other action ends the bonus."),
    ("d.rime", "Arm once-per-fight rescue: first knockout freezes you through the following exchange, then you thaw with {n} HP."),
    ("d.reflect", "Return incoming damaging spells this exchange in full; reflected hits cannot bounce again."),
    ("d.reflect.more", "Return incoming damaging spells in full this exchange and the next {n}; reflected hits cannot bounce again."),
    ("d.moonwell", "Start channel: bank {n} Mana now and {more} per free Hold; Release makes it ready."),
    ("d.lodestar", "Start channel: bank {n} absorb now and {more} per free Hold. The bank soaks up hits while you hold; Release turns what's left into a pool used up across hits."),
    ("d.toll", "Cards/story only; not a combat cast."),
    ("d.torment", "For three exchanges including this one, each opposing action pays {n} HP, bypassing hit reductions. Ward and Shadowstep stop it."),
    ("d.extraction", "Move up to {n} of their ready Mana into your flux; your Mana plus flux can't pass capacity. Ward and Shadowstep stop it."),
    ("d.siphon", "Start and each Hold deal {n} spell damage before defenses. Release heals actual damage dealt; Holds cost {cost} Mana."),
    ("d.compel.immediate", "Their action this exchange becomes their last move, and so does their next {n}: forced and shown in advance. If they can't repeat it, their turn is lost."),
    ("d.compel", "For the next {n}, their action is replaced with their last legal public action. No history: cancel."),
    ("d.eclipse", "This exchange and the next, damage you actually take also gives you twice that in ready Mana, capped at capacity."),
    ("d.heartprice", "For the rest of the fight, spell Mana costs are paid as HP at 1 HP per 2 Mana (healing still costs Mana); no flux from HP payments."),
    ("w.one", "one"),
    ("w.exchange", "exchange"),
    ("w.exchanges", "{n} exchanges"),
];

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
    let tailwind = has(s, side, Eff::Tailwind);
    let channel_text = |sp: Option<usize>, release: bool| -> Value {
        let c = x.channel;
        let holds = c.map_or(0, |c| c.holds);
        match sp {
            Some(sp) if sp == ids.starlight => if release { t("d.starlight.release").v("dmg", dmg(sp, starlight_base(holds != 0))).v("pierce", if holds != 0 && data().amt(sp, "chargedWardPierce") >= 1.0 { t("d.starlight.releasePierce").done() } else { json!(NONE) }).done() }
                else { t("d.starlight.hold").v("dmg", dmg(sp, starlight_base(true))).v("pierce", if data().amt(sp, "chargedWardPierce") >= 1.0 { t("d.starlight.holdPierce").done() } else { json!(NONE) }).done() },
            Some(sp) if sp == ids.wildfire => { let w = |key: &str| data().amt(sp, key);
                if release { if holds > 0 { t("d.wildfire.releaseHeld").v("dmg", dmg(sp, w("release"))).v("extra", dmg(sp, w("perHold") * holds as f64)).done() } else { t("d.dealSpell").v("dmg", dmg(sp, w("release"))).done() } }
                else { t("d.wildfire.hold").v("dmg", dmg(sp, w("hold"))).v("self", js_num(w("self"))).v("per", dmg(sp, w("perHold"))).done() } },
            Some(sp) if sp == ids.siphon => if release { t("d.siphon.release").v("n", fmt2(c.map_or(0.0, |c| c.total))).done() }
                else { t("d.siphon.hold").v("dmg", dmg(sp, data().amt(sp, "hit"))).done() },
            Some(sp) if sp == ids.moonwell => if release { t("d.moonwell.release").v("n", fmt2(c.map_or(0.0, |c| c.bank))).done() }
                else { t("d.moonwell.hold").v("n", v(sp, data().amt(sp, "bank"), false)).done() },
            Some(sp) if sp == ids.lodestar => if release { t("d.lodestar.release").v("n", fmt2(c.map_or(0.0, |c| c.bank))).done() }
                else { t("d.lodestar.hold").v("n", v(sp, data().amt(sp, "bank"), true)).done() },
            _ => json!(NONE),
        }
    };
    if k.is_bundle[a as usize] {
        let parts: Vec<Value> = k.parts[a as usize].iter().map(|&p| lab(Some(p))).collect();
        return t("d.bundle").v("parts", parts).v("dmg", ap(k.strike)).v("tailwind", if tailwind { t("d.bundle.tailwind").done() } else { json!(NONE) }).done();
    }
    if a == k.strike {
        let extra = if tailwind {
            let n = tailwind_step() * 3f64.min(x.effects[Eff::Tailwind as usize].unwrap().value + 1.0);
            t("d.strike.tailwind").v("n", js_num((amount(enc, side, Some(ids.tailwind), n, true) - EPS).ceil())).done()
        } else { json!(NONE) };
        let guard = if dt.skill.guard_repeat_leak > 0.0 { t("d.strike.guardLeak") } else { t("d.strike.guard") };
        return t("d.strike").v("dmg", ap(a)).v("extra", extra).v("guard", guard).done();
    }
    if a == k.guard {
        let leak = dt.skill.guard_repeat_leak;
        if leak <= 0.0 { return t("d.guard").done(); }
        let block = guard_block(s, side);
        return if block < 1.0 { t("d.guard.tired").v("pct", js_num((block * 100.0).round())).done() }
            else { t("d.guard.fresh").v("when", if dt.skill.guard_lookback <= 1 { t("d.guard.straightAfter") } else { t("d.guard.within").v("n", js_num(dt.skill.guard_lookback as f64)) }).v("pct", js_num(((1.0 - leak) * 100.0).round())).done() };
    }
    if a == k.reclaim { return t("d.reclaim").v("n", fmt2(x.flux)).done(); }
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
        return t("d.construct").v("effect", effect).v("reduce", v(sp, c.reduction, true)).v("threshold", v(sp, c.threshold, true)).v("burst", burst).done();
    }
    let r = (rank(enc, side, sp) - 1) as usize;
    let at = |xs: &Option<Vec<f64>>| js_num(xs.as_ref().unwrap()[r]);
    let hold_cost = || js_num(spell.hold_cost.unwrap_or(0.0) * enc.mana_cost_scale);
    let pct = |f: f64| format!("{}%", js_num(f * 100.0));
    let text: Value = match sp {
        _ if sp == ids.flame => t("d.spellHit").v("dmg", ap(a)).done(),
        _ if sp == ids.foresight => t("d.foresight").v("n", at(&spell.duration)).done(),
        _ if sp == ids.mend => t("d.mend").v("n", v(sp, spell.healing.as_ref().unwrap()[r], true)).v("exposes", if spell.exposes { t("d.mend.exposes").done() } else { json!(NONE) }).done(),
        _ if sp == ids.glamour => t("d.glamour").v("n", at(&spell.renown)).v("cap", js_num(renown_cap(enc, side))).done(),
        _ if sp == ids.haste => t("d.haste").v("n", at(&spell.duration)).v("actions", at(&spell.actions)).done(),
        _ if sp == ids.shadowstep => t("d.shadowstep").v("n", at(&spell.duration)).done(),
        _ if sp == ids.ward => t("d.ward").done(),
        _ if sp == ids.starlight => t("d.starlight").v("dmg", dmg(sp, starlight_base(false))).v("charged", dmg(sp, starlight_base(true))).v("pierce", if data().amt(sp, "chargedWardPierce") >= 1.0 { t("d.starlight.pierce").done() } else { json!(NONE) }).v("cost", hold_cost()).done(),
        _ if sp == ids.seal => t("d.seal").done(),
        _ if sp == ids.wildfire => { let w = |key: &str| data().amt(sp, key);
            t("d.wildfire").v("ignite", if w("ignite") > 0.0 { t("d.wildfire.ignite").v("n", dmg(sp, w("ignite"))).done() } else { json!(NONE) }).v("hold", dmg(sp, w("hold"))).v("self", js_num(w("self"))).v("per", dmg(sp, w("perHold"))).v("release", dmg(sp, w("release"))).done() },
        _ if sp == ids.omen => t("d.omen").v("n", dmg(sp, data().amt(sp, "hit"))).v("pierce", match (data().amt(sp, "wardPierce") >= 1.0, data().amt(sp, "guardPierce") >= 1.0) { (true, true) if data().amt(sp, "bracePierce") >= 1.0 => t("d.omen.evadeOnly").done(), (true, true) => t("d.omen.guardWard").done(), (true, false) => t("d.omen.ward").done(), (false, true) => t("d.omen.guard").done(), _ => json!(NONE) }).done(),
        _ if sp == ids.sleight => t("d.sleight").v("n", "8").done(),
        _ if sp == ids.hoarfrost => t("d.hoarfrost").v("dmg", ap(a)).done(),
        _ if sp == ids.candour || sp == ids.quickquill || sp == ids.index => t("d.noEffect").done(),
        _ if sp == ids.brace => t("d.brace").v("a", pct(BRACE_BLOCK[1])).v("b", pct(BRACE_BLOCK[2])).v("c", pct(BRACE_BLOCK[3])).done(),
        _ if sp == ids.rapport => t("d.rapport").v("cap", js_num(renown_cap(enc, side))).done(),
        _ if sp == ids.purify => t("d.purify").v("hp", fmt2(hp_cost(enc, s, side, a))).v("n", v(sp, PURIFY_MANA, false)).done(),
        _ if sp == ids.tailwind => t("d.tailwind").v("n", (1..=3).map(|i| js_num((amount(enc, side, Some(sp), tailwind_step() * i as f64, true) - EPS).ceil())).collect::<Vec<_>>().join("/")).done(),
        _ if sp == ids.rime => t("d.rime").v("n", js_num(data().amt(ids.rime, "thaw"))).done(),
        _ if sp == ids.reflect => { let n = dt.spells[sp].duration.as_ref().map_or(1.0, |v| v[0]); if n > 1.0 { t("d.reflect.more").v("n", if n == 2.0 { t("w.one").done() } else { json!(js_num(n - 1.0)) }).done() } else { t("d.reflect").done() } },
        _ if sp == ids.moonwell => t("d.moonwell").v("n", v(sp, data().amt(sp, "bank"), false)).v("more", v(sp, data().amt(sp, "bank"), false)).done(),
        _ if sp == ids.lodestar => t("d.lodestar").v("n", v(sp, data().amt(sp, "bank"), true)).v("more", v(sp, data().amt(sp, "bank"), true)).done(),
        _ if sp == ids.toll => t("d.toll").done(),
        _ if sp == ids.torment => t("d.torment").v("n", dmg(sp, TORMENT_TOLL)).done(),
        _ if sp == ids.extraction => t("d.extraction").v("n", v(sp, EXTRACTION_MANA, false)).done(),
        _ if sp == ids.siphon => t("d.siphon").v("n", dmg(sp, data().amt(sp, "hit"))).v("cost", hold_cost()).done(),
        _ if sp == ids.compel => { let n = spell.duration.as_ref().map_or(2.0, |v| v[0]);
            if spell.immediate { t("d.compel.immediate").v("n", if n == 1.0 { t("w.one") } else { t("w.exchanges").v("n", js_num(n)) }).done() }
            else { t("d.compel").v("n", if n == 1.0 { t("w.exchange") } else { t("w.exchanges").v("n", js_num(n)) }).done() } },
        _ if sp == ids.eclipse => t("d.eclipse").done(),
        _ if sp == ids.heartprice => t("d.heartprice").done(),
        // A plain damage spell (creature attacks and any later data-only spell): physical ones land like a Strike.
        _ if spell.damage.is_some() => t(if spell.physical { "d.physicalHit" } else { "d.spellHit" }).v("dmg", ap(a)).done(),
        _ => json!(NONE),
    };
    if spell.forbidden { t("d.forbidden").v("text", text).done() } else { text }
}

/// TEXT as JSON (the main game's English source for translations).
pub fn text_table() -> Value { Value::Object(TEXT.iter().map(|(k, s)| (k.to_string(), json!(s))).collect()) }
