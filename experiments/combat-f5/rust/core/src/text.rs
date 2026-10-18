//! Action names and rule descriptions shown in the game. The numbers come from the same rule
//! functions and constants that resolve the fight, so text and rules cannot drift apart.
use crate::data::{data, Act, ConstructAction};
use crate::rules::*;
use crate::state::*;

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

/// describe(s, side, id): what the action does for this side now.
pub fn describe(enc: &Encounter, s: &State, side: usize, a: Act) -> String {
    let dt = data();
    let (k, ids) = (&dt.acts, &dt.ids);
    let x = &s.actors[side];
    let dmg = |sp: usize, base: f64| js_num(damage_power(enc, side, sp, base));
    let v = |sp: usize, base: f64, physical: bool| fmt2(amount(enc, side, Some(sp), base, physical));
    let ap = |a: Act| js_num(attack_power(enc, s, side, a));
    let tailwind = has(s, side, Eff::Tailwind);
    let channel_text = |sp: Option<usize>, release: bool| -> String {
        let c = x.channel;
        let holds = c.map_or(0, |c| c.holds);
        match sp {
            Some(sp) if sp == ids.starlight => if release { format!("Deal {} spell damage{}.", dmg(sp, starlight_base(holds != 0)), if holds != 0 && data().amt(sp, "chargedWardPierce") >= 1.0 { "; Ward doesn't stop it" } else { "" }) }
                else { format!("Charge the release to {} spell damage{}. Further Holds add no damage.", dmg(sp, starlight_base(true)), if data().amt(sp, "chargedWardPierce") >= 1.0 { " that Ward doesn't stop" } else { "" }) },
            Some(sp) if sp == ids.wildfire => { let w = |key: &str| data().amt(sp, key);
                if release { if holds > 0 { format!("Deal {} spell damage, plus {} from the Holds that gets through Guard and Ward.", dmg(sp, w("release")), dmg(sp, w("perHold") * holds as f64)) } else { format!("Deal {} spell damage.", dmg(sp, w("release"))) } }
                else { format!("Deal {} spell damage to them and {} to yourself; the Release gains {} that gets through Guard and Ward.", dmg(sp, w("hold")), js_num(w("self")), dmg(sp, w("perHold"))) } },
            Some(sp) if sp == ids.siphon => if release { format!("Heal {} HP from damage dealt.", fmt2(c.map_or(0.0, |c| c.total))) }
                else { format!("Deal {} spell damage; bank actual damage for healing.", dmg(sp, data().amt(sp, "hit"))) },
            Some(sp) if sp == ids.moonwell => if release { format!("Gain up to {} ready Mana, capped at capacity.", fmt2(c.map_or(0.0, |c| c.bank))) }
                else { format!("Bank {} more Mana; Release makes it ready.", v(sp, data().amt(sp, "bank"), false)) },
            Some(sp) if sp == ids.lodestar => if release { format!("Turn on a {}-point absorb pool, used up across hits.", fmt2(c.map_or(0.0, |c| c.bank))) }
                else { format!("Bank {} more absorb; the bank soaks up hits while you hold.", v(sp, data().amt(sp, "bank"), true)) },
            _ => String::new(),
        }
    };
    if k.is_bundle[a as usize] {
        let parts = k.parts[a as usize].iter().map(|&p| label(Some(p))).collect::<Vec<_>>().join(", ");
        return format!("One public bundle: {parts}. Each Strike deals {} physical damage before defenses{}. Repeated Guard/Reclaim add nothing.",
            ap(k.strike), if tailwind { ", plus the active Tailwind sequence" } else { "" });
    }
    if a == k.strike {
        let extra = if tailwind {
            let n = tailwind_step() * 3f64.min(x.effects[Eff::Tailwind as usize].unwrap().value + 1.0);
            format!(" plus {} Tailwind damage that gets through Guard", js_num((amount(enc, side, Some(ids.tailwind), n, true) - EPS).ceil()))
        } else { String::new() };
        let guard = if dt.skill.guard_repeat_leak > 0.0 { "Guard stops all of it (less from a Guard that has just guarded), Ward half" } else { "Guard stops all of it, Ward half" };
        return format!("Deal {} physical damage before defenses{extra}; {guard}.", ap(a));
    }
    if a == k.guard {
        let leak = dt.skill.guard_repeat_leak;
        if leak <= 0.0 { return "Stop all Strike damage and half of spell damage this exchange.".into(); }
        let block = guard_block(s, side);
        return if block < 1.0 { format!("Still guarding, and tiring: stop {}% of Strike damage and half of spell damage this exchange.", js_num((block * 100.0).round())) }
            else { format!("Stop all Strike damage and half of spell damage this exchange. Guarding again {} stops only {}% of a Strike.", if dt.skill.guard_lookback <= 1 { "straight after".to_string() } else { format!("within {} exchanges", dt.skill.guard_lookback) }, js_num(((1.0 - leak) * 100.0).round())) };
    }
    if a == k.reclaim { return format!("Recover up to {} flux after attacks, capped at capacity; recovering Mana breaks Shadowstep before this exchange's attacks.", fmt2(x.flux)); }
    if a == k.hold || a == k.release {
        let sp = x.channel.map(|c| c.spell);
        return format!("{} {}. {}", label(Some(a)), label(sp.map(|sp| sp as Act)), channel_text(sp, a == k.release));
    }
    if a == k.frozen { return "Cannot act or be hurt this exchange; then thaw.".into(); }
    if !dt.is_spell(a) { return String::new(); }
    let sp = a as usize;
    let spell = &dt.spells[sp];
    if let Some(kind) = spell.construct {
        let c = &dt.constructs[kind];
        let effect = if c.action == ConstructAction::Heal { format!("Heal {} HP", v(sp, c.power, true)) }
            else { format!("Deal {}{} damage before defenses", dmg(sp, c.power), if c.action == ConstructAction::Strike { " physical" } else { " spell" }) };
        let burst = c.burst.map_or(String::new(), |b| format!(" On ending: {} spell damage to both sides before defenses.", dmg(sp, b)));
        return format!("{effect} each exchange end; reduce each hit by {}; ends after {} HP damage taken.{burst}", v(sp, c.reduction, true), v(sp, c.threshold, true));
    }
    let r = (rank(enc, side, sp) - 1) as usize;
    let at = |xs: &Option<Vec<f64>>| js_num(xs.as_ref().unwrap()[r]);
    let hold_cost = || js_num(spell.hold_cost.unwrap_or(0.0) * enc.mana_cost_scale);
    let pct = |f: f64| format!("{}%", js_num(f * 100.0));
    let text = match sp {
        _ if sp == ids.flame => format!("Deal {} spell damage before defenses. Guard halves it; Ward stops it.", ap(a)),
        _ if sp == ids.foresight => format!("Opponent commits first for {} subsequent exchanges.", at(&spell.duration)),
        _ if sp == ids.mend => format!("At the end of the exchange, heal {} HP, unless you take any damage this exchange.{}", v(sp, spell.healing.as_ref().unwrap()[r], true), if spell.exposes { " Breaks your own Shadowstep." } else { "" }),
        _ if sp == ids.glamour => format!("With observers: earn {} Renown at settlement, once per fight.", at(&spell.renown)),
        _ if sp == ids.haste => format!("For the next {} exchanges, commit {} basic actions as one bundle each exchange.", at(&spell.duration), at(&spell.actions)),
        _ if sp == ids.shadowstep => format!("Evade attacks and every opposing spell effect for {} exchanges including this one; breaks before the hits land on any exchange you attack or recover Mana.", at(&spell.duration)),
        _ if sp == ids.ward => "This exchange: block every opposing spell (damage, Torment, Extraction, Seal, Compel) and half of each Strike.".into(),
        _ if sp == ids.starlight => format!("Start channel. Release for {} spell damage, or {} after a Hold{}. Holds cost {} Mana.", dmg(sp, starlight_base(false)), dmg(sp, starlight_base(true)), if data().amt(sp, "chargedWardPierce") >= 1.0 { ", which Ward doesn't stop" } else { "" }, hold_cost()),
        _ if sp == ids.seal => "Erase all opposing flux. Ward and Shadowstep stop it.".into(),
        _ if sp == ids.wildfire => { let w = |key: &str| data().amt(sp, key); format!("Start channel{}. Each Hold: {} spell damage to them, {} to you, and +{} on the Release that gets through Guard and Ward. Release: {} spell damage plus what the Holds added. Before defenses.",
            if w("ignite") > 0.0 { format!(", dealing {} spell damage now", dmg(sp, w("ignite"))) } else { String::new() }, dmg(sp, w("hold")), js_num(w("self")), dmg(sp, w("perHold")), dmg(sp, w("release"))) },
        _ if sp == ids.omen => format!("Public hit of {} spell damage before defenses two exchanges later{}.", dmg(sp, data().amt(sp, "hit")), match (data().amt(sp, "wardPierce") >= 1.0, data().amt(sp, "guardPierce") >= 1.0) { (true, true) if data().amt(sp, "bracePierce") >= 1.0 => "; only evading stops it", (true, true) => "; Guard and Ward don't stop it", (true, false) => "; Ward doesn't stop it", (false, true) => "; Guard doesn't stop it", _ => "" }),
        _ if sp == ids.sleight => "Steal up to 8 Crowns; alignment −tiny.".into(),
        _ if sp == ids.hoarfrost => format!("Deal {} cold spell damage before defenses; opposing Flame or Wildfire damage cancels with it.", ap(a)),
        _ if sp == ids.candour || sp == ids.quickquill || sp == ids.index => "No combat effect.".into(),
        _ if sp == ids.brace => format!("Block all opposing damage this exchange, then {}, {} and {} of it over the next three exchanges. Spell effects still land.", pct(BRACE_BLOCK[1]), pct(BRACE_BLOCK[2]), pct(BRACE_BLOCK[3])),
        _ if sp == ids.rapport => "With observers, spend up to 10 Crowns automatically; earn 1 Renown per 2 spent at settlement.".into(),
        _ if sp == ids.purify => format!("Pay {} HP; gain up to {} ready Mana, capped at capacity.", fmt2(hp_cost(enc, s, side, a)), v(sp, PURIFY_MANA, false)),
        _ if sp == ids.tailwind => format!("Next three exchanges: consecutive Strikes add {} damage that gets through Guard. Any other action ends the bonus.",
            (1..=3).map(|i| js_num((amount(enc, side, Some(sp), tailwind_step() * i as f64, true) - EPS).ceil())).collect::<Vec<_>>().join("/")),
        _ if sp == ids.rime => format!("Arm once-per-fight rescue: first knockout freezes you through the following exchange, then you thaw with {} HP.", js_num(data().amt(ids.rime, "thaw"))),
        _ if sp == ids.reflect => { let n = dt.spells[sp].duration.as_ref().map_or(1.0, |v| v[0]); if n > 1.0 { format!("Return incoming damaging spells in full this exchange and the next {}; reflected hits cannot bounce again.", if n == 2.0 { "one".to_string() } else { js_num(n - 1.0) }) } else { "Return incoming damaging spells this exchange in full; reflected hits cannot bounce again.".into() } },
        _ if sp == ids.moonwell => format!("Start channel: bank {} Mana now and {} per free Hold; Release makes it ready.", v(sp, data().amt(sp, "bank"), false), v(sp, data().amt(sp, "bank"), false)),
        _ if sp == ids.lodestar => format!("Start channel: bank {} absorb now and {} per free Hold. The bank soaks up hits while you hold; Release turns what's left into a pool used up across hits.", v(sp, data().amt(sp, "bank"), true), v(sp, data().amt(sp, "bank"), true)),
        _ if sp == ids.toll => "Cards/story only; not a combat cast.".into(),
        _ if sp == ids.torment => format!("For three exchanges including this one, each opposing action pays {} HP, bypassing hit reductions. Ward and Shadowstep stop it.", dmg(sp, TORMENT_TOLL)),
        _ if sp == ids.extraction => format!("Move up to {} of their ready Mana into your flux; your Mana plus flux can't pass capacity. Ward and Shadowstep stop it.", v(sp, EXTRACTION_MANA, false)),
        _ if sp == ids.siphon => format!("Start and each Hold deal {} spell damage before defenses. Release heals actual damage dealt; Holds cost {} Mana.", dmg(sp, data().amt(sp, "hit")), hold_cost()),
        _ if sp == ids.compel => { let n = spell.duration.as_ref().map_or(2.0, |v| v[0]); if spell.immediate { format!("Their action this exchange becomes their last move, and so does their next {}: forced and shown in advance. If they can't repeat it, their turn is lost.", if n == 1.0 { "one".to_string() } else { format!("{} exchanges", js_num(n)) }) } else { format!("For the next {}, their action is replaced with their last legal public action. No history: cancel.", if n == 1.0 { "exchange".to_string() } else { format!("{} exchanges", js_num(n)) }) } }
        _ if sp == ids.eclipse => "This exchange and the next, damage you actually take also gives you twice that in ready Mana, capped at capacity.".into(),
        _ if sp == ids.heartprice => "For the rest of the fight, spell Mana costs are paid as HP at 1 HP per 2 Mana (healing still costs Mana); no flux from HP payments.".into(),
        // A plain damage spell (creature attacks and any later data-only spell): physical ones land like a Strike.
        _ if spell.damage.is_some() => if spell.physical { format!("Deal {} physical damage before defenses. Guard stops it; Ward halves it.", ap(a)) } else { format!("Deal {} spell damage before defenses. Guard halves it; Ward stops it.", ap(a)) },
        _ => String::new(),
    };
    text + if spell.forbidden { " Forbidden: alignment −small each cast; witnessed casts are reported." } else { "" }
}
