// A layer over any opponent: channel plans as macro-moves, and a sanity veto on punished persona moves.
//   plans  Only attacking channels (Wildfire, Starlight, Siphon) or one the persona favours, and not within COOLDOWN exchanges
//          of the last plan's end. When such a channel spell is castable, compare "cast it, Hold k times, Release" (k = 0..3) against the opponent's own
//          choice by short scripted rollouts (the other side answers each exchange with its best one-exchange reply); the
//          persona's tilt for the spell and its Holds counts for the plan. Once started: Hold until k, then Release; Release
//          early if holding is clearly worse over one exchange (abort); plans and the alternative are scored over the same
//          HORIZON exchanges (play goes on greedily after the Release), so delayed effects such as Omen get their credit; Hold up to two more if the release would meet a Ward,
//          Shadowstep or Reflect (it waits the defence out).
//   veto   Immediate-payoff moves only (Strike, damaging spells, attack bundles): a persona-favoured one more than `veto` points worse than the best move over one exchange is replaced by the best
//          move within that margin, persona tilt still counting (e.g. no Flame into an active Reflect).
use crate::human::tilt_bonus;
use combat_core::ai::{evaluate, move_value};
use combat_core::data::{data, Act};
use combat_core::rules::{actor_to_move, apply_known, legal_actions};
use combat_core::state::*;

#[derive(Clone, Copy)]
pub struct Plan { pub holds_left: i32, pub extra: i32 }
pub struct Stats { pub started: u32, pub aborted: u32, pub waited: u32, pub vetoed: u32, pub last_end: i32 }
impl Default for Stats { fn default() -> Self { Stats { started: 0, aborted: 0, waited: 0, vetoed: 0, last_end: -100 } } }

const ABORT: f64 = 25.0;
const WAIT: f64 = 10.0;
const COOLDOWN: i32 = 3;
const HORIZON: i32 = 5;

#[inline]
fn mine(s: &State, me: usize, v: f64) -> f64 { let _ = s; if me == 0 { v } else { -v } }

/// My value of playing `a` now, after the exchange resolves: the other side's committed move if it has one, else its best reply.
pub fn one_exchange(enc: &Encounter, s: &State, me: usize, a: Act) -> f64 {
    let mut c = *s;
    let r = apply_known(enc, &mut c, a, None);
    if r.resolved || c.result.is_some() { return mine(&c, me, evaluate(enc, &c)); }
    legal_actions(enc, &c).iter().map(|&b| { let mut d = c; apply_known(enc, &mut d, b, None); mine(&d, me, evaluate(enc, &d)) }).fold(f64::INFINITY, f64::min)
}

/// A scripted line `exchanges` long: my moves from `script`, the other side's its best reply to my move of that exchange.
/// `script` reads only the position (so the other side's look-ahead can call it freely).
fn rollout(enc: &Encounter, s: &State, me: usize, exchanges: i32, script: &dyn Fn(&State) -> Act) -> f64 {
    let mut c = *s;
    let mut left = exchanges;
    while c.result.is_none() && left > 0 {
        let mover = actor_to_move(&c).unwrap();
        let r = if mover == me { let a = script(&c); apply_known(enc, &mut c, a, None) } else {
            // Its best reply: to my committed move, or (when it leads) to the move my script would make next.
            let legal = legal_actions(enc, &c);
            let mut best = (legal.as_slice()[0], f64::INFINITY);
            for &b in legal.iter() {
                let mut d = c; let rr = apply_known(enc, &mut d, b, None);
                if !rr.resolved && d.result.is_none() { let a = script(&d); apply_known(enc, &mut d, a, None); }
                let v = mine(&d, me, evaluate(enc, &d));
                if v < best.1 { best = (b, v); }
            }
            apply_known(enc, &mut c, best.0, None)
        };
        if r.resolved { left -= 1; }
    }
    mine(&c, me, evaluate(enc, &c))
}

fn greedy(enc: &Encounter, s: &State, me: usize) -> Act {
    *legal_actions(enc, s).iter().max_by(|&&a, &&b| move_value(enc, s, me, a).partial_cmp(&move_value(enc, s, me, b)).unwrap()).unwrap()
}

/// While a plan runs: the next move (Hold, Release, or an abort / wait), or None when there is no plan to follow.
pub fn step(enc: &Encounter, s: &State, me: usize, plan: &mut Option<Plan>, st: &mut Stats) -> Option<Act> {
    let k = &data().acts;
    if s.actors[me].channel.is_none() { if plan.take().is_some() { st.last_end = s.round; } return None; }
    let p = plan.as_mut()?;
    let legal = legal_actions(enc, s);
    // Frozen or Compelled: the move isn't the plan's to make.
    if !legal.as_slice().contains(&k.release) && !legal.as_slice().contains(&k.hold) { return None; }
    let can_hold = legal.as_slice().contains(&k.hold);
    if !can_hold { *plan = None; return Some(k.release); }
    if !legal.as_slice().contains(&k.release) { if let Some(p) = plan.as_mut() { p.holds_left = (p.holds_left - 1).max(0); } return Some(k.hold); }
    let (vh, vr) = (one_exchange(enc, s, me, k.hold), one_exchange(enc, s, me, k.release));
    if p.holds_left > 0 {
        if vr - vh > ABORT { st.aborted += 1; *plan = None; st.last_end = s.round; return Some(k.release); }
        p.holds_left -= 1; return Some(k.hold);
    }
    if vh > vr + WAIT && p.extra < 2 { p.extra += 1; st.waited += 1; return Some(k.hold); }
    *plan = None;
    st.last_end = s.round;
    Some(k.release)
}

/// Before playing `choice`: start a channel plan instead, when one scores better (persona tilt counting for it).
pub fn consider(enc: &Encounter, s: &State, me: usize, tilt: &[(String, f64)], choice: Act, plan: &mut Option<Plan>, st: &mut Stats) -> Act {
    let d = data();
    if s.actors[me].channel.is_some() || s.round - st.last_end < COOLDOWN { return choice; }
    let legal = legal_actions(enc, s);
    let ids = &d.ids;
    let attacking = |sp: usize| sp == ids.wildfire || sp == ids.starlight || sp == ids.siphon;
    let favoured = |sp: usize| { let n = &d.spells[sp].id; tilt.iter().any(|(t, x)| *x > 0.0 && (t == n || *t == format!("{n}_hold") || *t == format!("{n}_release"))) };
    let channels: Vec<Act> = legal.iter().copied().filter(|&a| (a as usize) < d.acts.n_spells && d.spells[a as usize].channel && (attacking(a as usize) || favoured(a as usize))).collect();
    if channels.is_empty() { return choice; }
    let mut best: Option<(Act, i32, f64)> = None;
    for &sp in &channels {
        let name = &d.spells[sp as usize].id;
        let hold_tilt = tilt.iter().find(|(t, _)| *t == format!("{name}_hold")).map_or(0.0, |x| x.1);
        for holds in 0..=3 {
            // The plan from the position alone: cast this exchange, Hold until the channel has `holds`, Release, then play on.
            let v = rollout(enc, s, me, HORIZON, &|c: &State| {
                if let Some(ch) = c.actors[me].channel { return if ch.holds < holds && legal_actions(enc, c).as_slice().contains(&d.acts.hold) { d.acts.hold } else { d.acts.release }; }
                if c.round == s.round { sp } else { greedy(enc, c, me) }
            }) + tilt_bonus(tilt, s, me, sp) + hold_tilt * holds as f64;
            if best.map_or(true, |b| v > b.2) { best = Some((sp, holds, v)); }
        }
    }
    let (sp, holds, v) = best.unwrap();
    if sp == choice { *plan = Some(Plan { holds_left: holds, extra: 0 }); st.started += 1; return choice; }
    let _ = holds;
    let base = rollout(enc, s, me, HORIZON, &|c: &State| if c.round == s.round { choice } else { greedy(enc, c, me) }) + tilt_bonus(tilt, s, me, choice);
    if v > base { *plan = Some(Plan { holds_left: holds, extra: 0 }); st.started += 1; return sp; }
    choice
}

/// An immediate-payoff move: Strike, a damaging (non-channel) spell, or a bundle with either.
fn immediate(enc: &Encounter, s: &State, me: usize, a: Act) -> bool {
    let d = data();
    d.acts.parts[a as usize].iter().any(|&p| p == d.acts.strike || ((p as usize) < d.acts.n_spells && !d.spells[p as usize].channel && combat_core::rules::attack_power(enc, s, me, p) > 0.0))
}

/// Replace a persona-favoured move the board punishes (more than `margin` worse than the best over one exchange).
pub fn veto(enc: &Encounter, s: &State, me: usize, tilt: &[(String, f64)], choice: Act, margin: f64, st: &mut Stats) -> Act {
    if margin <= 0.0 || tilt_bonus(tilt, s, me, choice) <= 0.0 || !immediate(enc, s, me, choice) { return choice; }
    let legal = legal_actions(enc, s);
    if legal.len() < 2 { return choice; }
    let vals: Vec<(Act, f64)> = legal.iter().map(|&a| (a, one_exchange(enc, s, me, a))).collect();
    let top = vals.iter().map(|x| x.1).fold(f64::NEG_INFINITY, f64::max);
    let vc = vals.iter().find(|x| x.0 == choice).map_or(top, |x| x.1);
    if top - vc <= margin { return choice; }
    st.vetoed += 1;
    vals.iter().filter(|x| top - x.1 <= margin).max_by(|x, y| (x.1 + tilt_bonus(tilt, s, me, x.0)).partial_cmp(&(y.1 + tilt_bonus(tilt, s, me, y.0))).unwrap()).unwrap().0
}
