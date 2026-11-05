//! Campaign wallets and signals are used directly. No preset grants and no post-game refunds.
use crux_core::{Game, Move};
use crux_core::data::{data, Gate, Sig, Spell};
use crux_core::rules::{Setup, FailKind};
use crux_core::view;
use serde_json::json;

fn game(scale: f64) -> Game {
    Game::new(&view::setup_from(&json!({ "seed": 12, "level": 20, "enc": "slice_market_haggle/left",
        "mana": 25.5, "crowns": 30.25, "health": 41.5, "renown": 8.5,
        "campaign": { "maxMana": 32, "difficulty": 24.5, "resourceScale": scale, "partial": true, "using": null,
            "signals": { "arcana": 8.5, "lore": 9.25, "alchemy": 7, "charm": 11.75, "vigor": 6, "guile": 12, "standing": 8.5, "bond": null, "record": null },
            "spells": { "sleight": 1, "flame": 1 }, "facts": ["The evidence you brought"] } }))).unwrap()
}

#[test]
fn raw_signals_and_owned_spells_replace_presets() {
    let g = game(0.5);
    assert_eq!(g.signal(Sig::Charm), 11.75); assert_eq!(g.signal(Sig::Standing), 8.5);
    assert_eq!(g.enc_level, 24.5); assert_eq!(g.cap, 32.0);
    assert_eq!(g.known, [Spell::Sleight, Spell::Flame]); assert_eq!(g.facts.len(), 1);
    assert!(g.table.iter().chain(&g.deck).all(|c| !matches!(c.signal, Some(Sig::Bond) | Some(Sig::Record))));
}

#[test]
fn mana_alignment_and_theft_use_the_same_scale_before_settlement() {
    let mut g = game(0.5); let mana = g.mana; let crowns = g.crowns;
    let cost = g.spell_cost(Spell::Sleight);
    assert_eq!(cost, data().spell(Spell::Sleight).cost[0] as f64);
    g.play(Move::Cast(Spell::Sleight)).unwrap();
    assert_eq!(g.mana, mana - cost); assert_eq!(g.crowns, crowns + 3.0); assert_eq!(g.alignment, -1.0);
    g.play(Move::Leave).unwrap(); assert_eq!(g.mana, mana - cost);
}

#[test]
fn crown_health_and_mana_failures_and_demands_are_scaled_but_renown_requirements_are_not() {
    let mut gates = [false; 3]; let mut failures = [false; 3];
    for enc in &data().encounters {
        let create = |scale| Game::new(&Setup { enc: enc.key.into(), campaign: game(scale).campaign,
            mana: Some(100.0), crowns: Some(100.0), health: Some(100.0), ..Setup::default() }).unwrap();
        let half = create(0.5); let full = create(1.0);
        for c in full.table.iter().chain(&full.deck) {
            let a = full.fail_amounts(c); let b = half.fail_amounts(c);
            for ((kind, amount), (_, scaled)) in a.iter().zip(b) {
                if let Some(i) = match kind { FailKind::Mana => Some(0), FailKind::Crowns => Some(1), FailKind::Health => Some(2), _ => None } { failures[i] = true; }
                assert_eq!(scaled, (amount * if matches!(kind, FailKind::Crowns | FailKind::Health) { 0.5 } else { 1.0 }).ceil());
            }
        }
        for c in full.table.iter().chain(&full.deck).filter(|c| c.gate.is_some()) {
            let h = half.table.iter().chain(&half.deck).find(|h| h.id() == c.id()).unwrap();
            assert_eq!(h.need, (c.need * if matches!(c.gate, Some(Gate::Crowns) | Some(Gate::Health)) { 0.5 } else { 1.0 }).ceil());
            if let Some(i) = match c.gate { Some(Gate::Crowns) => Some(0), Some(Gate::Health) => Some(1), Some(Gate::Renown) => Some(2), _ => None } {
                gates[i] = true;
                let mut paid = half.clone(); paid.table = vec![h.clone()]; paid.deck.clear();
                paid.renown = 100.0;
                let before = (paid.crowns, paid.health, paid.renown);
                paid.play(Move::Confront(h.uid)).unwrap();
                assert_eq!(paid.crowns, before.0 - if i == 0 { h.need } else { 0.0 });
                assert_eq!(paid.health, before.1 - if i == 1 { h.need } else { 0.0 });
                assert_eq!(paid.renown, before.2);
            }
        }
    }
    assert_eq!(gates, [true; 3], "exercise Crowns, Health and Renown demands");
    assert_eq!(failures, [true; 3], "exercise all resource failure kinds");
}

#[test]
fn invalid_scale_is_rejected() {
    for scale in [0.0, -1.0, 1.01] {
        let mut s = view::setup_from(&json!({"enc":"slice_market_haggle/left"}));
        s.campaign = game(0.5).campaign; s.campaign.as_mut().unwrap().resource_scale = scale;
        assert!(Game::new(&s).is_err());
    }
}
