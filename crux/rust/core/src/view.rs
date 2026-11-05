//! What the page reads from a game, in one object: the state, and for each card and spell what the rules say of it.
//! Also the setup and the engine's report as JSON, and the static tables the page needs (tune, kinds, loadouts).
use crate::data::{data, Spell};
use crate::engine::{feature_names, Report};
use crate::rules::{self, band, is_action, left_of, patience_cost, spell_kind, spell_short, spell_text, tune, Card, Game, Move, Setup};
use serde_json::{json, Map, Value};

fn opt<T: Into<Value>>(x: Option<T>) -> Value { x.map_or(Value::Null, Into::into) }

pub fn card(c: &Card) -> Map<String, Value> {
    let mut m = Map::new();
    let mut put = |k: &str, v: Value| { if !(v.is_null() || v == Value::Bool(false)) { m.insert(k.into(), v); } };
    put("id", c.id().into());
    put("uid", c.uid.into());
    put("slot", opt(c.slot));
    put("title", c.title().into());
    put("text", c.text().into());
    put("signal", opt(c.signal.map(|s| s.name())));
    put("dc", c.dc.into());
    put("sway", c.sway.into());
    put("fail", c.fail.name().into());
    put("fx", opt(c.fx.map(|s| s.name())));
    put("wait", c.wait.into());
    put("age", c.age.into());
    put("boost", c.boost.into());
    put("gate", opt(c.gate.map(|s| s.name())));
    if c.gate.is_some() { put("need", c.need.into()); }
    put("spell", opt(c.spell.map(|s| s.name())));
    put("hex", opt(c.hex.map(|s| s.name())));
    put("gift", opt(c.gift.map(|s| s.name())));
    put("fate", opt(c.fate.map(|f| if f { "win" } else { "lose" })));
    put("adv", c.adv.into());
    put("index", if c.index { "lore".into() } else { Value::Null });
    put("grudged", c.grudged.into());
    put("buried", c.buried.into());
    put("unknown", c.unknown.into());
    m
}

pub fn view(g: &Game) -> Value {
    let d = data();
    let mut h = g.clone();
    h.quiet = true;
    let table: Vec<Value> = g.table.iter().map(|c| {
        let mut m = card(c);
        let asks = g.asks(c);
        let mut a = json!({ "kind": asks.kind, "label": asks.label, "short": asks.short, "have": asks.have });
        if !asks.sign.is_empty() { a["sign"] = asks.sign.into(); }
        if let Some(s) = asks.spell { a["spell"] = s.name().into(); }
        m.insert("chance".into(), g.chance(c).into());
        m.insert("gain".into(), g.gain(c).into());
        m.insert("failParts".into(), g.fail_amounts(c).into_iter().map(|(k, n)| {
            let (short, long) = g.fail_label(k, n);
            json!({ "kind": k.name(), "n": n, "short": short, "long": long })
        }).collect::<Vec<_>>().into());
        m.insert("asks".into(), a);
        m.insert("left".into(), left_of(c).into());
        m.insert("cost".into(), patience_cost(c).into());
        m.insert("deflect".into(), g.can_deflect(c.uid).into());
        Value::Object(m)
    }).collect();
    let mut flags = Map::new();
    for (k, v) in [("quill", json!(g.quill)), ("brace", json!(g.brace)), ("foresee", json!(g.foresee)), ("charmed", json!(g.charmed)), ("doom", json!(g.doom)),
        ("hushed", json!(g.hushed)), ("guided", json!(g.guided)), ("freePush", json!(g.free_push)), ("stole", json!(g.stole)), ("warmed", json!(g.warmed)), ("starlit", json!(g.starlit))] {
        if v != json!(false) && v != json!(0) { flags.insert(k.into(), v); }
    }
    let spells: Vec<Value> = g.ranks.iter().map(|&(id, _)| {
        let r = g.rank_in(id);
        json!({
            "id": id.name(), "rank": r, "cost": g.spell_cost(id), "sus": g.cast_sus(id), "why": g.can_cast(id),
            "preview": if g.over.is_some() { String::new() } else { h.spell_preview(id) }, "short": spell_short(id, r), "text": if g.campaign.is_some() { g.spell_text(id, r) } else { spell_text(id, r) },
            "kind": spell_kind(id), "action": is_action(id), "name": d.spell(id).name,
        })
    }).collect();
    let crux = &d.circs[g.circ].crux;
    let p = g.crux_chance();
    json!({
        "seed": g.seed, "level": g.level, "encLevel": g.enc_level, "gap": g.gap, "loadout": d.kits[g.loadout].name, "enc": g.enc().key,
        "circ": d.circs[g.circ].name,
        "crux": { "signal": g.crux_signal.name(), "title": crux.title, "text": crux.text },
        "patience": g.patience, "patienceMax": g.patience_max, "suspicion": g.suspicion, "agreement": g.agreement, "alignment": g.alignment,
        "mana": g.mana, "cap": g.cap, "crowns": g.crowns, "health": g.health, "renown": g.renown,
        "spent": { "crowns": g.spent_crowns, "health": g.spent_health },
        "known": g.known.iter().map(|s| s.name()).collect::<Vec<_>>(),
        "ranks": Value::Object(g.ranks.iter().map(|(s, r)| (s.name().to_string(), json!(r))).collect()),
        "signals": Value::Object(crate::data::Sig::ALL.iter().map(|s| (s.name().to_string(),
            g.campaign.as_ref().map_or_else(|| json!(g.signal(*s)), |c| json!(c.signals.get(s.name()).copied().flatten())))).collect()),
        "tableSize": g.table_size, "presses": g.presses, "actions": g.actions, "wins": g.wins, "fails": g.fails, "deflected": g.deflected,
        "seen": g.seen, "under": g.under, "canBury": g.can_bury, "tellBury": g.tell_bury,
        "flags": flags,
        "cast": opt(g.cast.map(|s| s.name())), "casts": g.casts.iter().map(|s| s.name()).collect::<Vec<_>>(),
        "facts": g.facts.iter().map(|f| json!({ "id": f.id, "text": f.text, "used": f.used })).collect::<Vec<_>>(),
        "temp": Value::Object(g.temp.iter().map(|(u, b)| (u.to_string(), json!({ "bonus": b }))).collect()),
        "over": g.over.as_ref().map_or(Value::Null, |o| json!({ "outcome": o.outcome.name(), "reason": o.reason, "why": o.why })),
        "table": table,
        "deck": g.deck.iter().map(|c| Value::Object(card(c))).collect::<Vec<_>>(),
        "cruxChance": p, "pressChance": p, "pressCost": g.press_cost(), "canPress": g.can_press(), "band": band(p),
        "active": g.active().into_iter().map(|(k, t)| json!([k, t])).collect::<Vec<_>>(),
        "spells": spells,
    })
}

pub fn log_lines(g: &Game, from: usize) -> Value {
    Value::Array(g.log[from.min(g.log.len())..].iter().map(|(t, c, say)| {
        let mut o = json!({ "text": t, "cls": c });
        if let Some((k, a)) = say { o["say"] = json!({ "k": k, "a": a }); }
        o
    }).collect())
}

/// The tune (rules::tune), named as the JavaScript rules' TUNE was, for the page and the goldens.
pub fn tune() -> Value {
    use tune::*;
    json!({
        "patience": PATIENCE, "pressStart": PRESS_START, "suspicionLimit": SUSPICION_LIMIT, "castSus": CAST_SUS, "table": TABLE, "deck": DECK,
        "base": BASE, "perPoint": PER_POINT, "perDc": PER_DC, "chanceMin": CHANCE_MIN, "chanceMax": CHANCE_MAX, "step": STEP,
        "dcScale": { "pivot": DC_PIVOT, "min": DC_MIN }, "grudge": GRUDGE, "fact": FACT, "ahead": AHEAD, "quill": QUILL, "rapport": RAPPORT, "rapportPatience": RAPPORT_PATIENCE,
        "starlight": STARLIGHT, "brace": BRACE, "omenDepth": OMEN_DEPTH, "steal": STEAL, "lodestar": if LODESTAR_PATIENCE_ONLY { "patience" } else { "full" },
        "linger": LINGER, "harden": HARDEN, "drain": DRAIN, "cost": COST, "wound": WOUND,
        "crux": { "base": CRUX_BASE, "perPoint": CRUX_PER_POINT, "perAgreement": CRUX_PER_AGREEMENT },
        "tierAt": TIER_AT, "crowns": CROWNS, "health": HEALTH, "renownPerLevel": RENOWN_PER_LEVEL,
        "purse": Value::Object(PURSE.iter().map(|(l, c)| (l.to_string(), json!(c))).collect()), "healthStart": HEALTH_START,
        "renownPerYourLevel": RENOWN_PER_YOUR_LEVEL, "partialAt": PARTIAL_AT, "bands": BANDS.iter().map(|(p, n)| json!([p, n])).collect::<Vec<_>>(),
    })
}

/// The static tables the page needs: the tune, the spell kinds' names, the loadouts, the features' names.
pub fn statics() -> Value {
    json!({
        "tune": tune(), "kinds": Value::Object(rules::KINDS.iter().map(|(k, v)| (k.to_string(), json!(v))).collect()),
        "loadouts": rules::loadouts(), "features": feature_names(),
        "spells": Spell::ALL.iter().map(|&s| json!({ "id": s.name(), "kind": spell_kind(s), "action": is_action(s) })).collect::<Vec<_>>(),
    })
}

pub fn setup_from(v: &Value) -> Setup {
    let i = |k: &str| v.get(k).and_then(|x| x.as_i64()).map(|x| x as i32);
    let mut s = Setup { seed: v["seed"].as_u64().unwrap_or(1) as u32, level: i("level").unwrap_or(50), enc: v["enc"].as_str().unwrap_or("").into(), ..Setup::default() };
    if let Some(l) = v["loadout"].as_str() { s.loadout = l.into(); }
    s.access_all = v["access"].as_str() == Some("all");
    s.skip = v["skip"].as_array().map(|a| a.iter().filter_map(|x| x.as_str().and_then(Spell::parse)).collect()).unwrap_or_default();
    s.mana = v["mana"].as_f64(); s.gap = i("gap"); s.crowns = v["crowns"].as_f64(); s.health = v["health"].as_f64(); s.renown = v["renown"].as_f64();
    s.campaign = v.get("campaign").filter(|v| !v.is_null()).map(|v| serde_json::from_value(v.clone()).expect("invalid campaign setup"));
    s
}

pub fn report(r: &Report) -> Value {
    json!({
        "depth": r.depth, "exact": r.exact, "done": r.done, "nodes": r.nodes, "value": if r.value.is_nan() { Value::Null } else { json!(r.value) },
        "best": r.best.map(|m| m.key()),
        "scores": Value::Object(r.scores.iter().map(|(m, v)| (m.key(), json!(v))).collect()),
        "lines": r.lines.iter().map(|l| {
            let mut o = json!({ "key": l.key.key(), "label": l.label, "value": l.value });
            if let Some(line) = &l.line {
                o["line"] = line.iter().map(|s| {
                    let mut x = json!({ "label": s.label, "note": s.note });
                    if let Some(e) = s.end { x["end"] = e.name().into(); }
                    x
                }).collect::<Vec<_>>().into();
            }
            o
        }).collect::<Vec<_>>(),
    })
}

pub fn parse_move(s: &str) -> Option<Move> { Move::parse(s) }
