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
            Some(sp) if sp == ids.starlight => if release { format!("Deal {} spell damage.", dmg(sp, starlight_base(holds != 0))) }
                else { format!("Charge the release to {} spell damage. Further Holds add no damage.", dmg(sp, STARLIGHT_CHARGED)) },
            Some(sp) if sp == ids.wildfire => if release { format!("Deal {} spell damage.", dmg(sp, WILDFIRE_RELEASE + WILDFIRE_PER_HOLD * holds as f64)) }
                else { format!("Deal {} spell damage to them and {} to yourself; the Release grows by {}.", dmg(sp, WILDFIRE_HOLD), js_num(WILDFIRE_SELF), dmg(sp, WILDFIRE_PER_HOLD)) },
            Some(sp) if sp == ids.siphon => if release { format!("Heal {} HP from damage dealt.", fmt2(c.map_or(0.0, |c| c.total))) }
                else { format!("Deal {} spell damage; bank actual damage for healing.", dmg(sp, SIPHON_HIT)) },
            Some(sp) if sp == ids.moonwell => if release { format!("Gain up to {} ready Mana, capped at capacity.", fmt2(c.map_or(0.0, |c| c.bank))) }
                else { format!("Bank {} more Mana; Release makes it ready.", v(sp, MOONWELL_BANK, false)) },
            Some(sp) if sp == ids.lodestar => if release { format!("Turn on a {}-point absorb pool, used up across hits.", fmt2(c.map_or(0.0, |c| c.bank))) }
                else { format!("Bank {} more absorb.", v(sp, LODESTAR_BANK, true)) },
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
        _ if sp == ids.starlight => format!("Start channel. Release for {} spell damage, or {} after a Hold. Holds cost {} Mana.", dmg(sp, starlight_base(false)), dmg(sp, starlight_base(true)), hold_cost()),
        _ if sp == ids.seal => "Erase all opposing flux. Ward and Shadowstep stop it.".into(),
        _ if sp == ids.wildfire => format!("Start channel. Each Hold: {} spell damage to them, {} to you, and +{} on the Release. Release: {} spell damage plus what the Holds added. Before defenses.",
            dmg(sp, WILDFIRE_HOLD), js_num(WILDFIRE_SELF), dmg(sp, WILDFIRE_PER_HOLD), dmg(sp, WILDFIRE_RELEASE)),
        _ if sp == ids.omen => format!("Public hit of {} spell damage before defenses two exchanges later.", dmg(sp, OMEN_HIT)),
        _ if sp == ids.sleight => "Steal up to 8 Crowns; alignment −tiny.".into(),
        _ if sp == ids.hoarfrost => format!("Deal {} cold spell damage before defenses; opposing Flame or Wildfire damage cancels with it.", ap(a)),
        _ if sp == ids.candour || sp == ids.quickquill || sp == ids.index => "No combat effect.".into(),
        _ if sp == ids.brace => format!("Block all opposing damage this exchange, then {}, {} and {} of it over the next three exchanges. Spell effects still land.", pct(BRACE_BLOCK[1]), pct(BRACE_BLOCK[2]), pct(BRACE_BLOCK[3])),
        _ if sp == ids.rapport => "With observers, spend up to 10 Crowns automatically; earn 1 Renown per 2 spent at settlement.".into(),
        _ if sp == ids.purify => format!("Pay {} HP; gain up to {} ready Mana, capped at capacity.", fmt2(hp_cost(enc, s, side, a)), v(sp, PURIFY_MANA, false)),
        _ if sp == ids.tailwind => format!("Next three exchanges: consecutive Strikes add {} damage that gets through Guard. Any other action ends the bonus.",
            (1..=3).map(|i| js_num((amount(enc, side, Some(sp), tailwind_step() * i as f64, true) - EPS).ceil())).collect::<Vec<_>>().join("/")),
        _ if sp == ids.rime => format!("Arm once-per-fight rescue: first knockout freezes you through the following exchange, then you thaw with {} HP.", js_num(RIME_THAW_HP)),
        _ if sp == ids.reflect => { let n = dt.spells[sp].duration.as_ref().map_or(1.0, |v| v[0]); if n > 1.0 { format!("Return incoming damaging spells in full this exchange and the next {}; reflected hits cannot bounce again.", if n == 2.0 { "one".to_string() } else { js_num(n - 1.0) }) } else { "Return incoming damaging spells this exchange in full; reflected hits cannot bounce again.".into() } },
        _ if sp == ids.moonwell => format!("Start channel: bank {} Mana now and {} per free Hold; Release makes it ready.", v(sp, MOONWELL_BANK, false), v(sp, MOONWELL_BANK, false)),
        _ if sp == ids.lodestar => format!("Start channel: bank {} absorb now and {} per free Hold; Release turns on a pool used up across hits.", v(sp, LODESTAR_BANK, true), v(sp, LODESTAR_BANK, true)),
        _ if sp == ids.toll => "Cards/story only; not a combat cast.".into(),
        _ if sp == ids.torment => format!("For three exchanges including this one, each opposing action pays {} HP, bypassing hit reductions. Ward and Shadowstep stop it.", dmg(sp, TORMENT_TOLL)),
        _ if sp == ids.extraction => format!("Move up to {} of their ready Mana into your flux; your Mana plus flux can't pass capacity. Ward and Shadowstep stop it.", v(sp, EXTRACTION_MANA, false)),
        _ if sp == ids.siphon => format!("Start and each Hold deal {} spell damage before defenses. Release heals actual damage dealt; Holds cost {} Mana.", dmg(sp, SIPHON_HIT), hold_cost()),
        _ if sp == ids.compel => { let n = spell.duration.as_ref().map_or(2.0, |v| v[0]); if spell.immediate { format!("Replace their action with their last legal public action, now and for the next {} exchange{}. No history: cancel.", js_num(n), if n == 1.0 { "" } else { "s" }) } else { format!("For the next {}, their action is replaced with their last legal public action. No history: cancel.", if n == 1.0 { "exchange".to_string() } else { format!("{} exchanges", js_num(n)) }) } }
        _ if sp == ids.eclipse => "This exchange and the next, damage you actually take also gives you twice that in ready Mana, capped at capacity.".into(),
        _ if sp == ids.heartprice => "For the rest of the fight, spell Mana costs are paid as HP at 1 HP per 2 Mana (healing still costs Mana); no flux from HP payments.".into(),
        _ => String::new(),
    };
    text + if spell.forbidden { " Forbidden: alignment −small each cast; witnessed casts are reported." } else { "" }
}
