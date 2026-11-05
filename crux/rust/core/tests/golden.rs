//! The golden games (golden/golden.json.gz, recorded from the JavaScript rules, bots and engine before the port): the
//! Rust core must play them the same way. Every game is replayed move by move, its players' moves made again (the bots,
//! and the random and targeted players' own choices from the engine's list of moves), and after each move everything
//! the page reads is compared; on positions from those games, the engine's search at depths 1–3 and its eval.
use crux_core::bot::{self, Bot};
use crux_core::data::data;
use crux_core::engine::{self, Analysis};
use crux_core::js::Rng;
use crux_core::rules::{Game, Move};
use crux_core::view;
use serde_json::Value;
use std::io::Read;

fn golden() -> Value {
    let f = std::fs::File::open(concat!(env!("CARGO_MANIFEST_DIR"), "/../../golden/golden.json.gz")).expect("golden/golden.json.gz");
    let mut s = String::new();
    flate2::read::GzDecoder::new(f).read_to_string(&mut s).unwrap();
    serde_json::from_str(&s).unwrap()
}

/// What the JavaScript leaves out (undefined, null, false) and what the port may write as 0, false or "".
fn nullish(v: &Value) -> bool {
    match v { Value::Null => true, Value::Bool(b) => !b, Value::Number(n) => n.as_f64() == Some(0.0), Value::String(s) => s.is_empty(), _ => false }
}
/// Rapport was changed after the goldens were recorded (+2 Agreement became Patience for Suspicion). Its own entry in
/// the spells is compared only for what didn't change, the tune's new key is left out, and a game or position whose kit
/// holds Rapport and that plays differently because of it (Rapport cast on either side, or the engine weighing it) is
/// counted apart rather than failed.
fn holds_rapport(g: &Game) -> bool { g.known.contains(&crux_core::data::Spell::Rapport) }
const TUNE_ADDED: [&str; 1] = ["rapportPatience"];
const RAPPORT_CHANGED: [&str; 5] = ["preview", "short", "text", "why", "sus"];
/// (And Ward's and Reflect's words, which now say their place is dealt again.)
fn strip_rapport(v: &mut Value) {
    if let Some(sp) = v.get_mut("spells").and_then(|x| x.as_array_mut()) {
        for x in sp.iter_mut() {
            if x["id"] == "rapport" { for k in RAPPORT_CHANGED { x.as_object_mut().unwrap().remove(k); } }
            if x["id"] == "ward" || x["id"] == "reflect" { for k in ["preview", "text"] { x.as_object_mut().unwrap().remove(k); } }
        }
    }
}
/// Ward and Reflect were changed after the goldens too: a countered spell's place is dealt again at once (it waited for
/// the end of the action). A game plays the same until the first counter, so one that first differs at or after it is
/// counted apart; so is an engine position that differs where one of their spells is in play and the kit can counter it.
fn counters(g: &Game) -> bool {
    use crux_core::data::Spell::{Reflect, Ward};
    (g.known.contains(&Ward) || g.known.contains(&Reflect)) && g.table.iter().chain(g.deck.iter()).any(|c| c.hex.is_some())
}
fn is_counter(m: &str) -> bool { m == "cast:ward" || m == "cast:reflect" }
/// Fields the port adds for the page, which the goldens don't have.
const EXTRA: [&str; 5] = ["kind", "action", "name", "say", "why"];

fn same(js: &Value, rs: &Value, path: &str, errs: &mut Vec<String>) {
    if errs.len() > 20 { return; }
    match (js, rs) {
        (Value::Object(a), Value::Object(b)) => {
            for (k, v) in a { same(v, b.get(k).unwrap_or(&Value::Null), &format!("{path}.{k}"), errs); }
            for (k, v) in b { if !a.contains_key(k) && !nullish(v) && !EXTRA.contains(&k.as_str()) { errs.push(format!("{path}.{k}: only in Rust: {v}")); } }
        }
        (Value::Array(a), Value::Array(b)) => {
            if a.len() != b.len() { errs.push(format!("{path}: length {} ≠ {}: {js} vs {rs}", a.len(), b.len())); return; }
            for (i, (x, y)) in a.iter().zip(b).enumerate() { same(x, y, &format!("{path}[{i}]"), errs); }
        }
        // Numbers within 1e-9: the goldens' exp and tanh are V8's on arm64, fdlibm built with fused multiply-adds, which
        // differ from x86's in the last bit now and then; the core's are fdlibm's own (js.rs), the same everywhere.
        (Value::Number(a), Value::Number(b)) => {
            let (a, b) = (a.as_f64().unwrap(), b.as_f64().unwrap());
            if (a - b).abs() > 1e-9 { errs.push(format!("{path}: {a} ≠ {b}")); }
        }
        _ => if !(js == rs || (nullish(js) && nullish(rs))) { errs.push(format!("{path}: {js} ≠ {rs}")); },
    }
}

/// A game as the goldens recorded it: its moves, and after each the view and the log lines it added.
struct Replay<'a> { steps: &'a [Value], k: usize, errs: Vec<String>, name: String, err_at: Option<usize> }
impl Replay<'_> {
    fn check(&mut self, g: &Game, from: usize) {
        let s = &self.steps[self.k];
        let mut e = vec![];
        let (mut want, mut got) = (s["view"].clone(), view::view(g));
        strip_rapport(&mut want);
        strip_rapport(&mut got);
        same(&want, &got, "view", &mut e);
        same(&s["log"], &view::log_lines(g, from), "log", &mut e);
        if !e.is_empty() { self.err_at.get_or_insert(self.k); self.errs.push(format!("{} step {} ({}): {}", self.name, self.k, s["move"], e.join("\n    "))); }
    }
    /// Play the next move, as the player chose it, and compare.
    fn play(&mut self, g: &mut Game, m: Move) {
        if !self.errs.is_empty() { return; }
        self.k += 1;
        if self.k >= self.steps.len() { self.errs.push(format!("{}: an extra move {}", self.name, m.key())); return; }
        let want = self.steps[self.k]["move"].as_str().unwrap();
        if m.key() != want { self.errs.push(format!("{} step {}: played {} where the JavaScript played {want}", self.name, self.k, m.key())); return; }
        let from = g.log.len();
        if let Err(e) = g.play(m) { self.errs.push(format!("{} step {}: {} failed: {e}", self.name, self.k, m.key())); return; }
        self.check(g, from);
    }
}

fn keys(g: &Game) -> Vec<String> { engine::moves(g).into_iter().map(|m| m.key()).collect() }

#[test]
fn golden_games_and_engine() {
    let gold = golden();
    let mut failures = vec![];
    // The tune: what the goldens were played under.
    let mut e = vec![];
    let mut tune = view::tune();
    for k in TUNE_ADDED { tune.as_object_mut().unwrap().remove(k); }
    same(&gold["tune"], &tune, "tune", &mut e);
    if !e.is_empty() { failures.push(format!("tune: {}", e.join("; "))); }

    let games = gold["games"].as_array().unwrap();
    let (mut random_k, mut targeted_k) = (0u32, 0u32);
    let (mut steps_checked, mut skipped, mut by_counters) = (0, 0, 0);
    for (gi, game) in games.iter().enumerate() {
        let setup = view::setup_from(&game["setup"]);
        let player = game["player"].as_str().unwrap();
        let steps = game["steps"].as_array().unwrap();
        let mut g = Game::new(&setup).unwrap();
        let mut r = Replay { steps, k: 0, errs: vec![], name: format!("game {gi} ({player}, {})", setup.enc), err_at: None };
        r.check(&g, 0);
        let mut guard = 0;
        match player {
            "smart" | "nospell" | "naive" => {
                let b = Bot::parse(player).unwrap();
                while g.over.is_none() && guard < 80 && r.errs.is_empty() {
                    guard += 1;
                    bot::step_with(&mut g, b, &mut |g, m| { if r.errs.is_empty() { r.play(g, m); } else { let _ = g.play(m); } });
                }
            }
            "random" => {
                let k = random_k; random_k += 1;
                let mut rand = Rng::new(31337.0 + k as f64);
                while g.over.is_none() && guard < 80 && r.errs.is_empty() {
                    guard += 1;
                    let mut ms = keys(&g);
                    if rand.next() > 0.03 { ms.retain(|x| x != "cast:flame" && x != "cast:shadowstep"); }
                    if rand.next() < 0.08 {
                        if let Some(f) = g.facts.iter().find(|x| !x.used) { if !g.table.is_empty() { ms.push(format!("fact:{}:{}", f.id, g.table[0].uid)); } }
                    }
                    if rand.next() < 0.005 { ms.push("leave".into()); }
                    let m = ms[rand.below(ms.len())].clone();
                    r.play(&mut g, Move::parse(&m).unwrap());
                }
            }
            _ => {
                let k = targeted_k; targeted_k += 1;
                let mut rand = Rng::new(4242.0 + k as f64);
                let prefixes: &[&str] = if k < 12 { &["cast:lodestar", "confront:", "cast:seal", "cast:candour", "cast:haste", "deflect:"] } else { &["cast:reflect", "cast:ward", "cast:candour"] };
                while g.over.is_none() && guard < 80 && r.errs.is_empty() {
                    guard += 1;
                    let ms = keys(&g);
                    let first = prefixes.iter().find_map(|p| ms.iter().find(|m| m.starts_with(p) && (*p != "confront:" || g.table.iter().any(|c| c.gift.is_some() && **m == format!("confront:{}", c.uid)))).cloned());
                    if k == 23 && g.actions == 2 { r.play(&mut g, Move::Leave); continue; }
                    let m = match first.filter(|_| rand.next() < 0.9) {
                        Some(m) => m,
                        None => {
                            let rest: Vec<&String> = ms.iter().filter(|x| *x != "cast:flame" && *x != "cast:shadowstep").collect();
                            let i = (rand.next() * (ms.len() as f64 - 2.0)).floor();
                            (if i >= 0.0 { rest.get(i as usize).map(|s| s.to_string()) } else { None }).unwrap_or_else(|| "press".into())
                        }
                    };
                    r.play(&mut g, Move::parse(&m).unwrap());
                }
            }
        }
        if r.errs.is_empty() && r.k + 1 != steps.len() { r.errs.push(format!("{}: {} moves where the JavaScript made {}", r.name, r.k, steps.len() - 1)); }
        steps_checked += r.k + 1;
        // (A random or targeted player picks from the legal moves, which Rapport now joins at other times.)
        let picks = !matches!(player, "smart" | "nospell" | "naive");
        let by_rapport = holds_rapport(&g) && (picks || steps.iter().any(|x| x["move"] == "cast:rapport") || r.errs.iter().any(|x| x.contains("rapport")));
        let countered = steps.iter().position(|x| x["move"].as_str().is_some_and(is_counter));
        let by_counter = matches!((countered, r.err_at.or(Some(r.k).filter(|_| !r.errs.is_empty()))), (Some(c), Some(e)) if e >= c);
        if !r.errs.is_empty() && by_counter { by_counters += 1; } else if !r.errs.is_empty() && by_rapport { skipped += 1; } else { failures.extend(r.errs); }
    }

    // The engine on positions from the games.
    let w = &data().weights;
    let positions = gold["positions"].as_array().unwrap();
    let (mut engine_fail, mut skipped_pos, mut pos_counters) = (0, 0, 0);
    for pos in positions {
        let gi = pos["game"].as_u64().unwrap() as usize;
        let si = pos["step"].as_u64().unwrap() as usize;
        let game = &games[gi];
        let mut g = Game::new(&view::setup_from(&game["setup"])).unwrap();
        let rapport = holds_rapport(&g);
        let moves = &game["steps"].as_array().unwrap()[1..=si];
        let replayed = moves.iter().all(|s| g.play(Move::parse(s["move"].as_str().unwrap()).unwrap()).is_ok());
        let name = format!("engine at game {gi} step {si}");
        let countered = moves.iter().any(|s| s["move"].as_str().is_some_and(is_counter));
        if !replayed && countered { pos_counters += 1; continue; }
        if !replayed { assert!(rapport, "{name}: the recorded moves no longer play"); skipped_pos += 1; continue; }
        let mut e = vec![];
        let masked = engine::mask(&g);
        same(&pos["features"], &serde_json::to_value(engine::features(&masked)).unwrap(), "features", &mut e);
        same(&pos["eval"], &engine::evaluate(&masked, w).into(), "eval", &mut e);
        for (depth, want) in pos["depths"].as_object().unwrap() {
            let mut a = Analysis::new(&g, w);
            a.run(depth.parse().unwrap());
            let mut got = view::report(&a.report());
            got.as_object_mut().unwrap().remove("done");
            same(want, &got, &format!("depth {depth}"), &mut e);
        }
        if !e.is_empty() && countered { pos_counters += 1; continue; }
        if !e.is_empty() && rapport { skipped_pos += 1; continue; }
        if !e.is_empty() && counters(&g) { pos_counters += 1; continue; }
        if !e.is_empty() { engine_fail += 1; if engine_fail <= 8 { failures.push(format!("{name}: {}", e.join("\n    "))); } }
    }
    println!("{} games ({skipped} changed by Rapport, {by_counters} by the counters), {steps_checked} steps, {} engine positions ({skipped_pos} changed by Rapport, {pos_counters} by the counters)", games.len(), positions.len());
    if engine_fail > 8 { failures.push(format!("... {engine_fail} engine positions differ in all")); }
    let n = failures.len();
    for f in failures.iter().take(12) { eprintln!("{f}\n"); }
    assert!(n == 0, "{n} differences from the goldens");
}
