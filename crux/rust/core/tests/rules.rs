//! What the goldens don't pin down move by move: invariants over every encounter, the decks' shuffle, soft-locks, and the
//! engine's promises (legal moves, every roll weighed, nothing hidden used). Ported from the JavaScript test.js.
use crux_core::bot::{self, Bot};
use crux_core::data::{data, Fail, Gate, Gift, Hex, Sig, Spell};
use crux_core::engine::{self, Analysis};
use crux_core::rules::{is_check, loadouts, tune, Card, Dice, Game, Move, Outcome, Setup};
use std::collections::HashMap;

const ENC: &str = "slice_market_haggle/left";
fn setup(seed: u32, enc: &str) -> Setup { Setup { seed, level: 50, enc: enc.into(), ..Setup::default() } }
/// Every spell at the rank level 50 allows, and nothing neglected unless a test says so.
fn game(seed: u32) -> Game {
    let mut g = Game::new(&Setup { gap: Some(0), access_all: true, ..setup(seed, ENC) }).unwrap();
    for c in g.table.iter_mut().chain(g.deck.iter_mut()) { c.wait = 99; }
    g
}
fn plain(uid: i32) -> Card {
    let mut c = Card::from_proto(data().common[0], uid);
    c.signal = Some(Sig::Charm); c.dc = 0; c.sway = 1; c.fail = Fail::Sus; c.fx = None; c.wait = 99; c.slot = Some(0);
    c
}
/// Put a card on the table, in place of the first.
fn put(g: &mut Game, c: Card) -> i32 { let u = c.uid; g.table[0] = c; u }
fn hex(h: Hex, uid: i32) -> Card { let mut c = Card::from_proto(data().hex_card(h), uid); c.slot = Some(0); c }
/// The next rolls, decided: 1 lands, 0 misses.
fn rig(g: &mut Game, rolls: &[u32]) { g.dice = Some(Box::new(Dice { script: rolls.to_vec(), i: 0, need: None })); }
fn near(a: f64, b: f64) -> bool { (a - b).abs() < 1e-9 }

#[test]
fn every_encounter_deals_from_its_own_pool_with_its_demands() {
    let d = data();
    assert!(d.encounters.len() >= 60);
    for e in &d.encounters {
        let circ = &d.circs[e.circ];
        let allowed: Vec<u16> = circ.cards.iter().chain(&circ.demands).chain(&d.common).copied().chain(d.hexes.iter().map(|h| h.1)).collect();
        let g = Game::new(&setup(9, e.key)).unwrap();
        assert_eq!(g.table.len(), g.table_size, "{}: a full table", e.key);
        assert!(g.deck.len() + g.table.len() >= 10, "{}", e.key);
        assert!(g.table.iter().chain(&g.deck).all(|c| allowed.contains(&c.proto)), "{}: its own pool", e.key);
        let demands: Vec<&Card> = g.table.iter().chain(&g.deck).filter(|c| c.gate.is_some()).collect();
        assert!((1..=2).contains(&demands.len()) && g.table.iter().any(|c| c.gate.is_some()), "{}: a demand in the opening table", e.key);
        for c in demands { assert!(if c.gate == Some(Gate::Spell) { c.spell.is_some() } else { c.need > 0.0 }, "{}: {} has its amount", e.key, c.id()); }
    }
}

#[test]
fn decks_are_shuffled() {
    let (mut at, mut n): (HashMap<&str, usize>, HashMap<&str, usize>) = (HashMap::new(), HashMap::new());
    for s in 1..=3000 {
        let g = Game::new(&setup(s, ENC)).unwrap();
        for (i, c) in g.table.iter().chain(&g.deck).enumerate() {
            if c.gate.is_some() || c.hex.is_some() { continue; }
            *at.entry(c.id()).or_default() += i;
            *n.entry(c.id()).or_default() += 1;
        }
    }
    let mean: Vec<f64> = at.iter().filter(|(k, _)| n[*k] > 500).map(|(k, v)| *v as f64 / n[k] as f64).collect();
    let (lo, hi) = mean.iter().fold((f64::MAX, f64::MIN), |(a, b), &x| (a.min(x), b.max(x)));
    assert!(hi - lo < 0.5, "mean places {mean:?}");
}

#[test]
fn never_soft_locked() {
    let d = data();
    let lo = loadouts();
    for seed in 1..150u32 {
        for b in [Bot::Smart, Bot::NoSpell, Bot::Naive] {
            let e = &d.encounters[seed as usize % d.encounters.len()];
            let mut g = Game::new(&Setup { level: [20, 50, 80][seed as usize % 3], loadout: lo[seed as usize % lo.len()].into(), ..setup(seed, e.key) }).unwrap();
            bot::play(&mut g, b);
            assert!(g.over.is_some(), "{seed} {b:?}");
        }
    }
}

#[test]
fn chances_are_5_percent_steps_within_5_to_95() {
    let mut g = game(3);
    for dc in (-40..=60).step_by(3) {
        let mut c = plain(-1); c.dc = dc;
        let p = g.chance(&c);
        assert!((0.05..=0.95).contains(&p) && near(p * 20.0, (p * 20.0).round()), "dc {dc}: {p}");
    }
    for a in 0..15 { g.agreement = a; let p = g.crux_chance(); assert!(near(p * 20.0, (p * 20.0).round()), "crux {p}"); }
    assert_eq!(tune::PER_POINT * 2.0, tune::PER_DC);
}

#[test]
fn demands_are_met_for_certain_or_not_at_all() {
    let d = data();
    let mut g = game(3);
    let coin = d.circs.iter().flat_map(|c| &c.demands).find(|&&p| d.proto(p).gate == Some(Gate::Crowns)).copied().unwrap();
    let mut c = Card::from_proto(coin, 900); c.need = 8.0; c.slot = Some(0);
    let u = put(&mut g, c);
    g.crowns = 10.0;
    assert_eq!(g.chance(g.card(u).unwrap()), 1.0);
    assert!(g.asks(g.card(u).unwrap()).label.contains("Pay 8 crowns"));
    assert!(g.confront(u).unwrap() && g.crowns == 2.0 && g.agreement == 2);
    let mut h = game(3);
    let shown = d.circs.iter().flat_map(|c| &c.demands).find(|&&p| d.proto(p).gate == Some(Gate::Spell)).copied().unwrap();
    let mut c = Card::from_proto(shown, 901); c.spell = Some(Spell::Seal); c.slot = Some(0);
    let u = put(&mut h, c);
    h.known.retain(|&x| x != Spell::Seal);
    assert_eq!(h.chance(h.card(u).unwrap()), 0.0);
    h.confront(u).unwrap();
    assert_eq!(h.suspicion, 1);
}

#[test]
fn each_push_costs_one_more_and_may_overdraw() {
    let mut g = game(3);
    g.patience = 2;
    for c in g.table.iter_mut() { c.fx = None; }
    rig(&mut g, &[0]);
    g.press().unwrap();
    assert_eq!((g.patience, g.press_cost()), (1, 2));
    rig(&mut g, &[1]);
    assert!(g.press().unwrap());
    assert_eq!(g.patience, -1);
    assert_eq!(g.over.as_ref().unwrap().outcome, Outcome::Win);
}

#[test]
fn their_spells_are_rare_never_deflected_and_land_if_left() {
    let d = data();
    let grey: Vec<_> = d.encounters.iter().filter(|e| e.grey).collect();
    assert!(grey.len() >= 2);
    for e in &grey { assert!(Game::new(&setup(1, e.key)).unwrap().deck.iter().chain(&Game::new(&setup(1, e.key)).unwrap().table).any(|c| c.hex == Some(Hex::Compel)), "{}: the man in grey Compels", e.key); }
    let (mut with, mut n) = (0, 0);
    for e in &d.encounters {
        for s in 1..=10 {
            n += 1;
            let g = Game::new(&setup(s, e.key)).unwrap();
            let has = g.deck.iter().chain(&g.table).any(|c| c.hex.is_some());
            with += has as i32;
            if e.formal && !e.grey { assert!(!has, "{}: no spells in a formal room", e.key); }
        }
    }
    assert!((with as f64 / n as f64) < 0.25, "sparse: {}", with as f64 / n as f64);
    // Not deflected; a failed resist leaves it there.
    let mut g = game(3);
    let u = put(&mut g, hex(Hex::Compel, 950));
    assert!(g.can_deflect(u).contains("can’t be waved away"));
    assert!(g.deflect(u).is_err());
    rig(&mut g, &[0]);
    g.confront(u).unwrap();
    g.dice = None;
    assert!(g.card(u).is_some() && g.over.is_none());
    // Left too long, Compel loses the meeting.
    let c = g.table.iter_mut().find(|x| x.uid == u).unwrap();
    c.wait = c.age + 1;
    let other = g.table.iter().find(|x| x.uid != u && x.hex.is_none()).unwrap().uid;
    g.deflect(other).unwrap();
    assert_eq!(g.over.as_ref().unwrap().outcome, Outcome::Lost);
    // Ward counters; Reflect counters for Patience.
    assert_eq!(game(3).can_cast(Spell::Ward), "None of their spells to counter");
    let mut g = game(3);
    let u = put(&mut g, hex(Hex::Bewitch, 951));
    let (top, size, left) = (g.deck[0].uid, g.table.len(), g.deck.len());
    g.cast(Spell::Ward).unwrap();
    assert!(g.card(u).is_none());
    // Its place is dealt again at once, from the top of their deck, and the action isn't spent.
    let n = g.table.iter().find(|x| x.uid == top).expect("the next argument is dealt");
    assert_eq!(n.slot, Some(0));
    assert_eq!((g.table.len(), g.deck.len(), g.patience), (size, left - 1, g.patience_max));
    let mut g = game(3);
    let u = put(&mut g, hex(Hex::Hush, 952));
    g.cast(Spell::Reflect).unwrap();
    assert!(g.card(u).is_none() && g.patience == g.patience_max + 1);
    // A Hush that lands: no more spells.
    let mut g = game(3);
    let mut c = hex(Hex::Hush, 953); c.wait = 1;
    let u = put(&mut g, c);
    let other = g.table.iter().find(|x| x.uid != u).unwrap().uid;
    g.deflect(other).unwrap();
    assert_eq!(g.can_cast(Spell::Rapport), "Your magic is smothered");
}

#[test]
fn the_lodestar_goes_to_the_bottom_and_fills_patience() {
    let mut g = game(3);
    g.cast(Spell::Lodestar).unwrap();
    let mut lode = g.deck.last().unwrap().clone();
    assert_eq!(lode.gift, Some(Gift::Lodestar));
    lode.slot = Some(0);
    g.deck.clear(); g.under = 0; g.table = vec![lode.clone()];
    g.patience = 2; g.cast = None;
    assert_eq!(g.chance(&lode), 1.0);
    g.confront(lode.uid).unwrap();
    assert_eq!(g.patience, g.patience_max);
    assert!(g.crux_chance() < 1.0, "Patience only: the crux is not made certain");
}

#[test]
fn a_cards_difficulty_shrinks_below_level_50() {
    let at = |lvl: i32| { let mut g = game(3); g.enc_level = lvl as f64; g.signals = [lvl; 9]; let mut c = plain(-1); c.dc = 20; g.chance(&c) };
    assert!(at(20) > at(50));
    assert!(near(at(50), at(80)));
}

#[test]
fn the_engine_searches_every_legal_move_and_leaves_the_game_alone() {
    let g = game(3);
    let before = format!("{:?}", g);
    let w = &data().weights;
    let mut a = Analysis::new(&g, w);
    a.run(1);
    let r = a.report();
    assert_eq!(format!("{:?}", g), before);
    assert_eq!(r.depth, 1);
    let ms = engine::moves(&engine::mask(&g));
    assert!(ms.contains(&Move::Press) && ms.iter().filter(|m| matches!(m, Move::Confront(_))).count() == g.table.len());
    assert!(ms.iter().all(|m| match m { Move::Cast(s) => g.can_cast(*s).is_empty(), _ => true }));
    let mut keys: Vec<String> = r.scores.iter().map(|s| s.0.key()).collect();
    let mut want: Vec<String> = ms.iter().map(|m| m.key()).collect();
    keys.sort(); want.sort();
    assert_eq!(keys, want);
    assert!(r.lines.windows(2).all(|w| w[1].value <= w[0].value) && r.lines.iter().all(|l| (0.0..=1.0).contains(&l.value)));
    assert_eq!(Some(r.value), r.scores.iter().find(|s| Some(s.0) == r.best).map(|s| s.1));
    assert_eq!(r.lines[0].line.as_ref().unwrap()[0].label, r.lines[0].label);
    assert!(r.scores.iter().find(|s| s.0 == Move::Cast(Spell::Flame)).map_or(true, |s| s.1 == 0.0), "attacking them never wins");
}

#[test]
fn the_engine_weighs_every_roll_and_never_a_draw() {
    let g = game(4);
    let m = engine::mask(&g);
    let c = m.table.iter().find(|c| is_check(c)).unwrap();
    let outs = engine::outcomes(&m, Move::Confront(c.uid), engine::WIDTH);
    assert!(near(outs.iter().map(|o| o.p).sum(), 1.0));
    assert!(near(outs.iter().filter(|o| o.note == "✓").map(|o| o.p).sum(), m.chance(c)));
    assert_eq!(outs.len(), 2, "lands or holds; what is dealt next is a blank either way");
    assert!(outs.iter().all(|o| o.g.table.iter().any(|x| x.unknown) && o.spent));
    assert!(engine::outcomes(&m, Move::Press, engine::WIDTH).iter().all(|o| o.spent));
}

#[test]
fn the_engine_sees_only_what_you_see() {
    let d = data();
    let w = &d.weights;
    let mut g = game(6);
    g.agreement = 2;
    // Another game the same in everything you can see: their unseen cards different and reordered.
    let mut h = game(6);
    h.agreement = 2;
    let pool: Vec<u16> = d.circs.iter().flat_map(|c| c.cards.iter().copied()).filter(|&p| !g.deck.iter().any(|y| y.proto == p)).take(h.deck.len()).collect();
    h.deck = h.deck.iter().zip(&pool).map(|(x, &p)| { let mut c = Card::from_proto(p, x.uid); c.wait = 99; c }).rev().collect();
    let m = engine::mask(&g);
    assert!(m.deck.iter().all(|x| x.unknown), "every unseen card is a blank");
    assert_eq!(m.crux_chance(), g.crux_chance());
    let (mut a, mut b) = (Analysis::new(&g, w), Analysis::new(&h, w));
    a.run(2); b.run(2);
    let s = |r: &engine::Report| r.scores.iter().map(|x| (x.0.key(), x.1)).collect::<Vec<_>>();
    assert_eq!(s(&a.report()), s(&b.report()));
    // A card you sent to the bottom, or saw by a Tell, you know.
    g.deck[0].buried = true;
    g.seen = 0;
    assert!(!engine::mask(&g).deck[0].unknown);
}

#[test]
fn the_engine_solves_the_last_push_exactly() {
    let mut g = Game::new(&Setup { gap: Some(0), access_all: true, ..setup(3, "isolde_warning/right") }).unwrap();
    assert!(!g.enc().partial);
    g.patience = 1;
    g.known.clear();
    let mut a = Analysis::new(&g, &data().weights);
    a.run(3);
    let r = a.report();
    assert!(r.exact, "nothing left past the horizon");
    assert!(near(r.scores.iter().find(|s| s.0 == Move::Press).unwrap().1, g.crux_chance()));
    assert!(r.value >= g.crux_chance());
}

#[test]
fn rapport_trades_patience_for_suspicion() {
    let mut g = game(3);
    assert_eq!(g.can_cast(Spell::Rapport), "No Suspicion to clear");
    g.suspicion = 3;
    let (p, mana) = (g.patience, g.mana);
    g.cast(Spell::Rapport).unwrap();
    assert_eq!((g.patience, g.suspicion), (p - tune::RAPPORT_PATIENCE, 3 - tune::RAPPORT));
    assert!(g.mana < mana);
    // Again, while there is Suspicion and Patience to give; never their last.
    let u = g.table[0].uid;
    g.deflect(u).unwrap();
    g.suspicion = 1;
    g.cast(Spell::Rapport).unwrap();
    assert_eq!(g.suspicion, 0);
    let u = g.table[0].uid;
    g.deflect(u).unwrap();
    g.suspicion = 2;
    g.patience = tune::RAPPORT_PATIENCE;
    assert_eq!(g.can_cast(Spell::Rapport), "Their Patience is too short");
}

#[test]
fn kits_grow_level_by_level() {
    // A kit at every level, never losing a spell or a rank as the level rises; 20, 50 and 80 as the presets were.
    for k in loadouts() {
        let at = |level: i32| Game::new(&Setup { level, loadout: k.into(), ..setup(1, ENC) }).unwrap();
        let mut prev = at(1);
        for level in 2..=100 {
            let g = at(level);
            for &(id, r) in &prev.ranks { assert!(g.ranks.iter().any(|x| x.0 == id && x.1 >= r), "{k} loses {} at {level}", id.name()); }
            prev = g;
        }
    }
}
