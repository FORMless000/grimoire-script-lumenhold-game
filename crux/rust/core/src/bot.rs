//! Crude players for Crux, shared by the balance sim and the engine. They read only what you see (the crux's chance is
//! shown; Agreement is not).
//!   smart:   confronts its best argument, deflects poor ones and ones about to land (resisting their spells, which
//!            can't be deflected), casts by rule of thumb, and pushes for the crux once its chance is worth the push's
//!            rising price, or Patience is short (answering a Sore point first, which bars it).
//!   nospell: the same, never casting.
//!   naive:   confronts whatever is first on the table and pushes only with its last push's worth of Patience.
use crate::data::{Fx, Hex, Sig, Spell};
use crate::rules::{is_check, left_of, tune, Card, FailKind, Game, Move};

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Bot { Smart, NoSpell, Naive }
impl Bot {
    pub fn parse(s: &str) -> Option<Bot> { match s { "smart" => Some(Bot::Smart), "nospell" => Some(Bot::NoSpell), "naive" => Some(Bot::Naive), _ => None } }
}

/// What a failure's costs are worth, in crux chance, roughly.
fn cost(k: FailKind) -> f64 {
    use FailKind::*;
    match k { Sus => 0.12, Agree => 0.065, Patience => 0.07, Harden => 0.06, Grudge => 0.04, Mana => 0.004, Crowns => 0.002, Health => 0.004 }
}
/// One of their spells costs what it does when it lands.
fn hex_cost(h: Hex) -> f64 { match h { Hex::Compel => 1.0, Hex::Bewitch => 0.2, Hex::Hush => 0.08, Hex::Lightfingers => 0.05 } }
pub fn landing(g: &Game, c: &Card) -> f64 {
    match c.hex { Some(h) => hex_cost(h), None => g.fail_amounts(c).iter().fold(0.0, |s, &(k, n)| s + cost(k) * n) }
}
/// An argument's expected worth if confronted.
pub fn worth(g: &Game, c: &Card) -> f64 {
    if c.gift.is_some() { return 1.0; }   // free, and as good as it gets
    let p = g.chance(c);
    p * g.gain(c) - (1.0 - p) * if c.hex.is_some() { 0.07 } else { landing(g, c) }
}
/// A push is worth it when the crux is good for its price, or when there is no Patience left to build with.
pub fn all_in(g: &Game) -> bool { g.crux_chance() >= 0.2 + 0.12 * g.press_cost() as f64 || g.patience <= g.press_cost() }
/// Every cast is seen: the bot keeps a spare point of Suspicion, unless it is going all-in.
fn spare(g: &Game, id: Spell) -> bool { g.suspicion + g.cast_sus(id) <= tune::SUSPICION_LIMIT - 2 }
fn by_worth(g: &Game, cs: &[Card]) -> Vec<Card> {
    let mut v: Vec<(f64, Card)> = cs.iter().map(|c| (worth(g, c), c.clone())).collect();
    v.sort_by(|a, b| b.0.partial_cmp(&a.0).unwrap());
    v.into_iter().map(|x| x.1).collect()
}

struct Player<'a> { act: &'a mut dyn FnMut(&mut Game, Move) }
impl Player<'_> {
    fn try_cast(&mut self, g: &mut Game, id: Spell) -> bool {
        if g.can_cast(id).is_empty() { (self.act)(g, Move::Cast(id)); true } else { false }
    }

    fn smart_spells(&mut self, g: &mut Game) -> bool {
        use Spell::*;
        // Their spells first: counter them while they can still land.
        if g.table.iter().any(|c| c.hex.is_some()) && (self.try_cast(g, Reflect) || self.try_cast(g, Ward)) { return true; }
        if g.table.is_empty() || all_in(g) {
            if !g.can_press().is_empty() { return false; }
            return g.press_cost() >= 2 && self.try_cast(g, Starlight);
        }
        // The Omen goes into their deck early, while there is time to reach it.
        if g.deck.len() > 2 && spare(g, Omen) && self.try_cast(g, Omen) { return true; }
        let cs: Vec<Card> = g.table.iter().filter(|c| is_check(c)).cloned().collect();
        // A table of good arguments: answer them all at once. A table of bad ones: clear it.
        if g.table.len() >= 2 && g.table.iter().all(|c| c.gate.is_none() && worth(g, c) > 0.02) && spare(g, Haste) && self.try_cast(g, Haste) { return true; }
        if g.table.len() >= 2 && g.table.iter().all(|c| c.gift.is_none() && worth(g, c) < -0.03) && spare(g, Seal) && self.try_cast(g, Seal) { return true; }
        let doubtful = cs.iter().filter(|x| x.fate.is_none() && g.chance(x) >= 0.3 && g.chance(x) < 0.75).count();
        if doubtful >= 2 && spare(g, Foresight) && self.try_cast(g, Foresight) { return true; }
        if cs.iter().filter(|x| !x.adv && x.fate.is_none() && matches!(x.signal, Some(Sig::Charm) | Some(Sig::Guile)) && g.chance(x) < 0.85).count() >= 2
            && spare(g, Glamour) && self.try_cast(g, Glamour) { return true; }
        if g.can_cast(Index).is_empty() && spare(g, Index) {
            let sum = |g: &Game| g.table.iter().filter(|c| is_check(c)).fold(0.0, |s, c| s + worth(g, c));
            let before = sum(g);
            let mut h = g.clone();
            h.quiet = true;
            for c in h.table.iter_mut() { if is_check(c) { if c.signal == Some(Sig::Lore) { c.adv = true; } else { c.index = true; } } }
            let after = sum(&h);
            if after - before > 0.08 { return self.try_cast(g, Index); }
        }
        if let Some(best) = by_worth(g, &cs).first() {
            if g.chance(best) >= 0.6 && best.sway >= 2 && spare(g, Quickquill) && self.try_cast(g, Quickquill) { return true; }
        }
        if g.table.iter().filter(|c| c.hex.is_none() && c.gift.is_none() && left_of(c) <= 2 && landing(g, c) >= 0.1).count() >= 2 && spare(g, Brace) && self.try_cast(g, Brace) { return true; }
        // Rapport: Patience for Suspicion, once they're near walking out and there's Patience to spare for a push.
        if g.suspicion >= 2 && g.patience > g.press_cost() + crate::rules::tune::RAPPORT_PATIENCE && spare(g, Rapport) && self.try_cast(g, Rapport) { return true; }
        g.suspicion >= 2 && self.try_cast(g, Candour)
    }

    fn step(&mut self, g: &mut Game, bot: Bot) {
        if bot == Bot::Smart { self.smart_spells(g); }
        if g.over.is_some() { return; }
        if g.can_bury && g.deck.first().is_some_and(|c| is_check(c) && c.dc > 4) { (self.act)(g, Move::Bury); }
        // A Sore point stands between you and the crux: answer it before pushing.
        let sore = g.table.iter().find(|x| x.fx == Some(Fx::Sore)).cloned();
        if bot == Bot::Naive {
            let m = if sore.is_none() && (g.patience <= g.press_cost() || g.table.is_empty()) { Move::Press } else { Move::Confront(sore.as_ref().unwrap_or(&g.table[0]).uid) };
            (self.act)(g, m);
            return;
        }
        // What costs nothing to answer, answer first: the Omen, the Lodestar.
        if let Some(gift) = g.table.iter().find(|c| c.gift.is_some()) { let u = gift.uid; (self.act)(g, Move::Confront(u)); return; }
        if g.table.is_empty() || all_in(g) {
            let m = match sore { Some(s) => if worth(g, &s) > 0.0 { Move::Confront(s.uid) } else { Move::Deflect(s.uid) }, None => Move::Press };
            (self.act)(g, m);
            return;
        }
        // An argument about to land: answer it if it's worth it, deflect it if its cost is worse than a Patience. One of
        // their spells can't be deflected: resist it.
        let mut due: Vec<(f64, Card)> = g.table.iter().filter(|c| left_of(c) <= if c.hex == Some(Hex::Compel) { 2 } else { 1 }).map(|c| (landing(g, c), c.clone())).collect();
        due.sort_by(|a, b| b.0.partial_cmp(&a.0).unwrap());
        if let Some((l, d)) = due.first() {
            if *l >= 0.07 {
                let m = if d.hex.is_some() || worth(g, d) > 0.0 { Move::Confront(d.uid) } else { Move::Deflect(d.uid) };
                (self.act)(g, m);
                return;
            }
        }
        // Otherwise weigh each argument as you would: its chance of the shown gain against its chance of the shown cost.
        let order = by_worth(g, &g.table);
        let best = &order[0];
        let out: Vec<&Card> = order.iter().filter(|c| g.can_deflect(c.uid).is_empty()).collect();
        let m = if worth(g, best) > 0.015 || out.is_empty() { Move::Confront(best.uid) } else { Move::Deflect(out[out.len() - 1].uid) };
        (self.act)(g, m);
    }
}

/// One action (and the spell before it, for the smart bot), each move made through `act`.
pub fn step_with(g: &mut Game, bot: Bot, act: &mut dyn FnMut(&mut Game, Move)) { Player { act }.step(g, bot); }
pub fn step(g: &mut Game, bot: Bot) { step_with(g, bot, &mut |g, m| g.play(m).expect("the bot's move")); }
pub fn play(g: &mut Game, bot: Bot) {
    let mut guard = 0;
    while g.over.is_none() && guard < 200 { guard += 1; step(g, bot); }
}
