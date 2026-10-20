// combat-lab: search experiments over the frozen combat core (driven by combat/tools/lab.mjs).
//   combat-lab run [threads] < cases     each {"state":S,"algos":[A,B],"maxRounds":n,"meta":{…}} → one fight result line per case
//   combat-lab sample [threads] < cases  each {"state":S,"play":A,"eps":x,"every":k,"deep":B,"seed":n} → positions with features,
//                                         the deep search's value and the fight's outcome
//   combat-lab check < lines             each {"state":S,"options":{maxDepth,nodeBudget,prune,lmr,horizonMode}}: lab AB equals ai::search
// An algo: {"algo":"ab"|"mcts", "ms":10, "nodes":n, …}. ab: maxDepth, prune, lmr, horizon ("tactical"), ext, threatPlus, weights.
// mcts: c, alpha, k, rollout, eps, temp, hybrid, weights.
// human (see human.rs): depth, gamma, belief, priorWeight, priorTemp, blind, rule (max|softmax|target), temp, target, regret, k,
//   tilt {action: points}, policy, decay (how fast its model of the other side forgets), seed.
// core: the game's own chooseAIAction with these settings as overrides (presets expanded in JS), e.g. today's Easy.
mod ab;
mod eval;
mod human;
mod mcts;
mod plans;
use combat_core::rules::actor_to_move;
use combat_core::{ai, Fight};
use rayon::prelude::*;
use serde_json::{json, Value};
use std::io::{BufRead, BufWriter, Write};
use std::time::{Duration, Instant};

fn f(v: &Value, k: &str, d: f64) -> f64 { v.get(k).and_then(|x| x.as_f64()).unwrap_or(d) }
fn b(v: &Value, k: &str, d: bool) -> bool { v.get(k).and_then(|x| x.as_bool()).unwrap_or(d) }
fn nums(v: &Value) -> Vec<f64> { v.as_array().map(|a| a.iter().map(|x| x.as_f64().unwrap()).collect()).unwrap_or_default() }
fn arr<const N: usize>(v: &Value) -> [f64; N] { let mut out = [0.0; N]; for (i, x) in nums(v).into_iter().enumerate().take(N) { out[i] = x; } out }
/// The evaluator: "weights" (linear over the terms; missing terms 0), "mlp" ({h, xs, sm, ss, w1, b1, w2, scale}), else the hand eval.
fn evaluator(v: &Value) -> eval::Ev {
    if let Some(m) = v.get("mlp").filter(|m| !m.is_null()) {
        return eval::Ev::Mlp(Box::new(eval::Mlp { h: m["h"].as_u64().unwrap() as usize, xs: arr(&m["xs"]), sm: arr(&m["sm"]), ss: arr(&m["ss"]), w1: nums(&m["w1"]), b1: nums(&m["b1"]), w2: nums(&m["w2"]), scale: m["scale"].as_f64().unwrap() }));
    }
    match v.get("weights").filter(|w| !w.is_null()) { Some(w) => eval::Ev::Lin(arr(w)), None => eval::Ev::Hand }
}
/// A reply table: {"<telegraphed>": {"<reply>": score}} by action name → n × n by code.
fn reply_table(v: &Value) -> Option<Vec<f64>> {
    let t = v.get("reply")?.as_object()?;
    let d = combat_core::data::data();
    let n = d.acts.names.len();
    let mut out = vec![0.0; n * n];
    for (p, row) in t { let Some(p) = d.act(p) else { continue }; for (r, x) in row.as_object()? { if let Some(r) = d.act(r) { out[p as usize * n + r as usize] = x.as_f64()?; } } }
    Some(out)
}
fn deadline(v: &Value) -> Option<Instant> { v.get("ms").and_then(|x| x.as_f64()).map(|ms| Instant::now() + Duration::from_secs_f64(ms / 1000.0)) }
fn ab_opts(v: &Value) -> ab::Opts {
    ab::Opts { max_depth: f(v, "maxDepth", 30.0) as i32, node_budget: f(v, "nodes", 1e12) as u64, deadline: deadline(v), prune: b(v, "prune", false), lmr: f(v, "lmr", 0.0) as usize,
        tactical: v.get("horizon").and_then(|x| x.as_str()) == Some("tactical"), pvs: true, aspiration: true, ext_root: f(v, "ext", 1.0) as i32, threat_plus: b(v, "threatPlus", false), ev: evaluator(v),
        counter: b(v, "counter", false), cont: b(v, "cont", false), reply: reply_table(v), lmp: f(v, "lmp", 0.0) as usize, lmr2: b(v, "lmr2", false) }
}

struct Pick { id: combat_core::data::Act, value: f64, depth: i32, nodes: u64 }
fn tilt_of(v: &Value) -> Vec<(String, f64)> { v.get("tilt").and_then(|t| t.as_object()).map(|t| t.iter().filter_map(|(k, x)| x.as_f64().map(|x| (k.clone(), x))).collect()).unwrap_or_default() }
fn human_opts(v: &Value, round_seed: u64) -> human::Opts {
    let rule = match v.get("rule").and_then(|x| x.as_str()) { Some("softmax") => human::Rule::Softmax(f(v, "temp", 10.0)), Some("target") => human::Rule::Target(f(v, "target", 0.35)), _ => human::Rule::Max };
    let tilt = tilt_of(v);
    human::Opts { depth: f(v, "depth", 1.0) as i32, gamma: f(v, "gamma", 1.0), belief: b(v, "belief", false), prior_weight: f(v, "priorWeight", 2.0), prior_temp: f(v, "priorTemp", 8.0),
        blind: f(v, "blind", 0.0), rule, regret: f(v, "regret", 1e9), k: f(v, "k", 72.0), tilt, ev: evaluator(v), seed: (f(v, "seed", 1.0) as u64) ^ round_seed, policy: b(v, "policy", false), esc: f(v, "esc", 0.0), esc_start: f(v, "escStart", 8.0) as i32, ab_depth: f(v, "abDepth", 0.0) as i32, persona_scale: f(v, "personaScale", 200.0) }
}
fn decide(fight: &Fight, algo: &Value, ctx: &mut ab::Context, core: &mut ai::Context, model: &[f64], salt: u64, blinded: &mut u32) -> Pick {
    match algo.get("algo").and_then(|x| x.as_str()) {
        Some("human") => { let p = human::decide(&fight.enc, &fight.s, &human_opts(algo, salt), model, ctx); if p.blinded { *blinded += 1; } return Pick { id: p.id, value: 0.0, depth: f(algo, "depth", 1.0) as i32, nodes: p.nodes }; }
        Some("core") => {
            let t0 = Instant::now();
            let now = move || t0.elapsed().as_secs_f64() * 1000.0;
            let d = ai::choose(&fight.enc, &fight.s, algo, core, &now).unwrap();
            let id = combat_core::data::data().act(d["id"].as_str().unwrap()).unwrap();
            return Pick { id, value: d["value"].as_f64().unwrap_or(0.0), depth: d["completedDepth"].as_i64().unwrap_or(0) as i32, nodes: d["totalNodes"].as_u64().unwrap_or(0) };
        }
        _ => {}
    }
    if algo.get("algo").and_then(|x| x.as_str()) == Some("mcts") {
        let o = mcts::Opts { deadline: deadline(algo), node_budget: f(algo, "nodes", 1e12) as u64, c: f(algo, "c", 1.5), alpha: f(algo, "alpha", 0.5), k: f(algo, "k", 60.0),
            rollout: f(algo, "rollout", 4.0) as i32, eps: f(algo, "eps", 0.2), temp: f(algo, "temp", 8.0), hybrid: b(algo, "hybrid", false), ev: evaluator(algo), tilt: tilt_of(algo), tilt_side: actor_to_move(&fight.s).unwrap() };
        let r = mcts::search(&fight.enc, &fight.s, &o);
        Pick { id: r.id, value: r.value, depth: r.depth, nodes: r.nodes }
    } else {
        let r = ab::search(&fight.enc, &fight.s, &ab_opts(algo), ctx, false);
        Pick { id: r.id, value: r.value, depth: r.completed_depth, nodes: r.nodes }
    }
}

fn play(case: &Value) -> Value {
    let mut fight = Fight::from_json(&case["state"]);
    let max_rounds = f(case, "maxRounds", 120.0) as i32;
    let mut ctx = [ab::Context::new(16384), ab::Context::new(16384)];
    let mut core = [ai::Context::new(16384), ai::Context::new(16384)];
    let n = combat_core::data::data().acts.names.len();
    // What each side has seen the other do this fight (decayed counts by action code): the `belief` model's data.
    let mut model = [vec![0.0f64; n], vec![0.0f64; n]];
    let (mut ms, mut depth, mut nodes, mut count, mut blinded, mut legal) = ([0.0f64; 2], [0.0f64; 2], [0u64; 2], [0u32; 2], [0u32; 2], [0.0f64; 2]);
    let salt = f(case, "salt", 0.0) as u64;
    let mut acts = [serde_json::Map::new(), serde_json::Map::new()];
    let (mut plan, mut pst): ([Option<plans::Plan>; 2], [plans::Stats; 2]) = ([None, None], Default::default());
    let mut dealt = [serde_json::Map::new(), serde_json::Map::new()];
    // Oracle: a depth-4 alpha-beta rates side 1's every choice; regret overall and where long-term effects are in play.
    let oracle = b(case, "oracle", false);
    // orc[6..9]: scale-free, over all positions: picks of the oracle's best move, regret over the oracle's best − worst spread.
    let (mut orc, mut ctx_o) = ([0.0f64; 8], ab::Context::new(65536));
    while fight.s.result.is_none() && fight.s.round <= max_rounds {
        let side = actor_to_move(&fight.s).unwrap();
        legal[side] += fight.legal().len() as f64;
        let t = Instant::now();
        let ranked = if oracle && side == 1 && fight.legal().len() > 1 { Some(ab::search(&fight.enc, &fight.s, &ab::Opts { max_depth: 4, node_budget: 400_000, prune: true, ..Default::default() }, &mut ctx_o, true).ranked) } else { None };
        let long = long_term(&fight.s);
        // The plan / veto layer (settings "plans": true, "veto": margin in points) over any opponent.
        let algo = &case["algos"][side];
        // Not for "core": the game's own persona opponents carry their own plan / veto layer.
        let lab_layer = algo.get("algo").and_then(|x| x.as_str()) != Some("core");
        let (use_plans, veto) = (lab_layer && b(algo, "plans", false), if lab_layer { f(algo, "veto", 0.0) } else { 0.0 });
        let p = match if use_plans { plans::step(&fight.enc, &fight.s, side, &mut plan[side], &mut pst[side]) } else { None } {
            Some(id) => Pick { id, value: 0.0, depth: 0, nodes: 0 },
            None => {
                let mut p = decide(&fight, algo, &mut ctx[side], &mut core[side], &model[side], salt, &mut blinded[side]);
                let tilt = tilt_of(algo);
                if veto > 0.0 { p.id = plans::veto(&fight.enc, &fight.s, side, &tilt, p.id, veto, &mut pst[side]); }
                if use_plans { p.id = plans::consider(&fight.enc, &fight.s, side, &tilt, p.id, &mut plan[side], &mut pst[side]); }
                p
            }
        };
        if let Some(r) = ranked {
            let best = r.iter().map(|x| -x.1).fold(f64::NEG_INFINITY, f64::max);
            let regret = r.iter().find(|x| x.0 == p.id).map_or(0.0, |x| best + x.1).max(0.0);
            let i = if long { 3 } else { 0 };
            orc[i] += 1.0; orc[i + 1] += regret.min(200.0); if regret > 40.0 { orc[i + 2] += 1.0; }
            let worst = r.iter().map(|x| -x.1).fold(f64::INFINITY, f64::min);
            if regret <= 1e-9 { orc[6] += 1.0; }
            if best - worst > 1e-9 { orc[7] += regret / (best - worst); }
        }
        ms[side] += t.elapsed().as_secs_f64() * 1000.0; depth[side] += p.depth as f64; nodes[side] += p.nodes; count[side] += 1;
        let decay = f(&case["algos"][1 - side], "decay", 0.85);
        for x in model[1 - side].iter_mut() { *x *= decay; }
        model[1 - side][p.id as usize] += 1.0;
        let name = combat_core::data::data().name(p.id).to_string();
        let k = acts[side].get(&name).and_then(|x| x.as_u64()).unwrap_or(0);
        acts[side].insert(name.clone(), json!(k + 1));
        let r = fight.apply(&name).unwrap();
        // Damage by source: what each side's hits dealt and what the other side's defences stopped, by the hit's action.
        if r["resolved"].as_bool() == Some(true) {
            for e in &fight.public.events {
                if let combat_core::state::Event::Hit { id, raw, amount, source, reflected: false, .. } = e {
                    let (n, src) = (combat_core::data::data().name(*id).to_string(), *source as usize);
                    let row = dealt[src].entry(n).or_insert(json!([0.0, 0.0]));
                    let (d0, r0) = (row[0].as_f64().unwrap(), row[1].as_f64().unwrap());
                    *row = json!([d0 + amount, r0 + raw]);
                }
            }
        }
    }
    let st = fight.to_json();
    let mut out = case["meta"].as_object().cloned().unwrap_or_default();
    out.insert("result".into(), match &st["result"] { Value::Null => Value::Null, r => { let mut o = json!({"outcome": r["outcome"], "reason": r["reason"]}); if let Some(w) = r.get("winner") { o["winner"] = w.clone(); } o } });
    out.insert("rounds".into(), json!(fight.s.round - 1));
    out.insert("decisions".into(), json!(count));
    out.insert("legal".into(), json!(legal));
    out.insert("ms".into(), json!(ms));
    out.insert("depth".into(), json!(depth));
    out.insert("nodes".into(), json!(nodes));
    out.insert("hp".into(), json!([fight.s.actors[0].hp / fight.s.actors[0].max_hp, fight.s.actors[1].hp / fight.s.actors[1].max_hp]));
    out.insert("blinded".into(), json!(blinded));
    out.insert("acts".into(), json!(acts));
    out.insert("dealt".into(), json!(dealt));
    out.insert("plans".into(), json!(pst.iter().map(|x| [x.started, x.aborted, x.waited, x.vetoed]).collect::<Vec<_>>()));
    if oracle { out.insert("oracle".into(), json!(orc)); }
    Value::Object(out)
}

/// Long-term effects in play: a channel, an Omen, a construct, Brace, Haste, Torment, Compel or a Foresight commitment.
fn long_term(s: &combat_core::state::State) -> bool {
    use combat_core::state::Eff;
    s.early_commit != [0, 0] || (0..2).any(|i| { let a = &s.actors[i]; a.channel.is_some() || !a.omens.is_empty() || !a.constructs.is_empty()
        || [Eff::Brace, Eff::Haste, Eff::Torment, Eff::Compelled].iter().any(|&e| combat_core::rules::has(s, i, e)) })
}

fn sample(case: &Value) -> Value {
    let mut fight = Fight::from_json(&case["state"]);
    let mut ctx = [ab::Context::new(16384), ab::Context::new(16384)];
    let (eps, every) = (f(case, "eps", 0.1), f(case, "every", 2.0) as i32);
    let mut rng = (f(case, "seed", 1.0) as u64).wrapping_mul(0x9E37_79B9_7F4A_7C15) | 1;
    let mut rand = move || { rng ^= rng << 13; rng ^= rng >> 7; rng ^= rng << 17; (rng >> 11) as f64 / (1u64 << 53) as f64 };
    let mut positions = Vec::new();
    while fight.s.result.is_none() && fight.s.round <= 120 {
        if fight.s.pending == [None, None] && fight.s.round % every == 0 {
            let names = |a| combat_core::data::data().name(a).to_string();
            let deep = case.get("deep").map(|d| ab::search(&fight.enc, &fight.s, &ab_opts(d), &mut ab::Context::new(65536), false));
            // The deep best reply to the deep best first move: what the offline reply table learns from.
            let reply = match (&deep, case.get("deepReply")) {
                (Some(r), Some(dr)) => { let mut c = fight.s; combat_core::rules::apply_known(&fight.enc, &mut c, r.id, None);
                    if c.result.is_none() { Some((names(r.id), names(ab::search(&fight.enc, &c, &ab_opts(dr), &mut ab::Context::new(65536), false).id))) } else { None } }
                _ => None,
            };
            positions.push(json!({"round": fight.s.round, "f": eval::features(&fight.enc, &fight.s).to_vec(), "sym": eval::symmetric(&fight.enc, &fight.s).to_vec(),
                "eval": ai::evaluate(&fight.enc, &fight.s), "deep": deep.as_ref().map(|r| r.value), "reply": reply}));
        }
        let side = actor_to_move(&fight.s).unwrap();
        let legal = fight.legal();
        let id = if rand() < eps { legal[(rand() * legal.len() as f64) as usize % legal.len()].clone() }
            else { combat_core::data::data().name(decide(&fight, &case["play"], &mut ctx[side], &mut ai::Context::new(16), &[0.0; 256], 0, &mut 0).id).to_string() };
        fight.apply(&id).unwrap();
    }
    let outcome = match fight.s.result.and_then(|r| r.winner) { Some(0) => 1.0, Some(1) => 0.0, _ => 0.5 };
    json!({"meta": case["meta"], "outcome": outcome, "positions": positions})
}

fn check(line: &Value) -> Value {
    let fight = Fight::from_json(&line["state"]);
    let o = &line["options"];
    let mut core = serde_json::Map::new();
    for (k, v) in o.as_object().unwrap() { core.insert(k.clone(), v.clone()); }
    let so = ai::search_options(&core).unwrap();
    let mut cctx = ai::Context::new(16384);
    let c = ai::search(&fight.enc, &fight.s, &so, &mut cctx, &|| 0.0).unwrap();
    let lo = ab::Opts { max_depth: so.max_depth, node_budget: so.node_budget, prune: so.prune, lmr: so.lmr, tactical: so.tactical, ..Default::default() };
    let l = ab::search(&fight.enc, &fight.s, &lo, &mut ab::Context::new(16384), false);
    let w = eval::evaluate(&fight.enc, &fight.s, &eval::Ev::Lin(eval::base_weights()));
    json!({"same": c.id == l.id && c.value == l.value && c.completed_depth == l.completed_depth && c.nodes == l.nodes, "core": [c.value, c.nodes], "lab": [l.value, l.nodes],
        "evalGap": (w - ai::evaluate(&fight.enc, &fight.s)).abs()})
}

fn lines(threads: Option<usize>, op: fn(&Value) -> Value) {
    if let Some(n) = threads { rayon::ThreadPoolBuilder::new().num_threads(n).build_global().unwrap(); }
    let cases: Vec<Value> = std::io::stdin().lock().lines().map(|l| l.unwrap()).filter(|l| !l.trim().is_empty()).map(|l| serde_json::from_str(&l).expect("case")).collect();
    let out: Vec<Value> = cases.par_iter().map(op).collect();
    let mut w = BufWriter::new(std::io::stdout().lock());
    for r in out { writeln!(w, "{r}").unwrap(); }
}

fn main() {
    let args: Vec<String> = std::env::args().collect();
    let threads = args.get(2).and_then(|x| x.parse().ok());
    match args.get(1).map(|s| s.as_str()) {
        Some("run") => lines(threads, play),
        Some("sample") => lines(threads, sample),
        Some("check") => lines(threads, check),
        _ => { eprintln!("usage: combat-lab run|sample|check [threads] < lines"); std::process::exit(2); }
    }
}
