// combat-sim: native driver for the combat core.
//   combat-sim step < lines    each line {"state":S,"actions":[...]} → one line per action {"applied":R,"state":S',"legal":[...]}
//   combat-sim search < lines  each line {"state":S,"options":{...}} → searchAction result (fresh context)
//   combat-sim run [threads] < cases   tools/sim.mjs cases, played in parallel; one result line per case, in input order
//                                      (a case with "trace": true adds "trace": the fight in the browser's exported-log shape)
//   combat-sim fight < lines   each line {"state":S,"search":{...},"tableLimit":n} → plays it out with chooseAIAction; {"actions":[...],"decisions":[...],"result":R}
use combat_core::{ai, Fight};
use serde_json::{json, Value};
use std::io::{BufRead, BufWriter, Write};

fn step() {
    let stdin = std::io::stdin();
    let mut out = BufWriter::new(std::io::stdout().lock());
    for line in stdin.lock().lines() {
        let line = line.unwrap();
        if line.trim().is_empty() { continue; }
        let v: Value = serde_json::from_str(&line).expect("json line");
        let mut f = Fight::from_json(&v["state"]);
        for a in v["actions"].as_array().unwrap() {
            let name = a.as_str().unwrap();
            let r = if let Some(side) = name.strip_prefix("concede:") { f.concede(side.parse().unwrap()); Value::Null }
                else { match f.apply(name) { Ok(r) => r, Err(e) => json!({"error": e}) } };
            writeln!(out, "{}", json!({"applied": r, "state": f.to_json(), "legal": f.legal()})).unwrap();
        }
    }
}

fn clock() -> impl Fn() -> f64 { let t0 = std::time::Instant::now(); move || t0.elapsed().as_secs_f64() * 1000.0 }

/// Each input line through f, in parallel; output lines in input order.
fn lines(f: impl Fn(Value) -> Value + Sync + Send) {
    use rayon::prelude::*;
    let input: Vec<Value> = std::io::stdin().lock().lines().map(|l| l.unwrap()).filter(|l| !l.trim().is_empty()).map(|l| serde_json::from_str(&l).expect("json line")).collect();
    let results: Vec<Value> = input.into_par_iter().map(f).collect();
    let mut out = BufWriter::new(std::io::stdout().lock());
    for r in results { writeln!(out, "{r}").unwrap(); }
}

fn search() {
    lines(|v| {
        let now = clock();
        let f = Fight::from_json(&v["state"]);
        let limit = v["options"].get("tableLimit").and_then(|x| x.as_u64()).unwrap_or(4096) as usize;
        let mut ctx = ai::Context::new(limit);
        match ai::search_json(&f.enc, &f.s, &v["options"], &mut ctx, &now) { Ok(r) => r, Err(e) => json!({"error": e}) }
    });
}

fn fight() {
    lines(|v| {
        let now = clock();
        let mut f = Fight::from_json(&v["state"]);
        let limit = v.get("tableLimit").and_then(|x| x.as_u64()).unwrap_or(16384) as usize;
        let mut ctx = [ai::Context::new(limit), ai::Context::new(limit)];
        let max_rounds = v.get("maxRounds").and_then(|x| x.as_i64()).unwrap_or(120) as i32;
        let search = v.get("search").cloned().unwrap_or(json!({}));
        let (mut actions, mut decisions) = (Vec::new(), Vec::new());
        while f.s.result.is_none() && f.s.round <= max_rounds {
            let side = combat_core::rules::actor_to_move(&f.s).unwrap();
            let d = match ai::choose(&f.enc, &f.s, &search, &mut ctx[side], &now) { Ok(d) => d, Err(e) => return json!({"error": e}) };
            let id = d["id"].as_str().unwrap().to_string();
            f.apply(&id).unwrap();
            actions.push(Value::String(id));
            decisions.push(json!({"value": d["value"], "completedDepth": d["completedDepth"], "totalNodes": d["totalNodes"], "degraded": d["degraded"]}));
        }
        json!({"actions": actions, "decisions": decisions, "state": f.to_json()})
    });
}

/// One simulated fight with per-side search contexts; the run2.mjs result line.
fn play(case: &Value) -> Value {
    let now = clock();
    let t0 = std::time::Instant::now();
    let mut f = Fight::from_json(&case["state"]);
    let limit = case.get("tableLimit").and_then(|x| x.as_u64()).unwrap_or(16384) as usize;
    let mut ctx = [ai::Context::new(limit), ai::Context::new(limit)];
    let max_rounds = case.get("maxRounds").and_then(|x| x.as_i64()).unwrap_or(80) as i32;
    let search = case.get("search").cloned().unwrap_or(json!({}));
    let mut acts = [serde_json::Map::new(), serde_json::Map::new()];
    let (mut depth, mut count, mut nodes) = ([0.0f64; 2], [0u32; 2], [0u64; 2]);
    let trace = case.get("trace").and_then(|x| x.as_bool()).unwrap_or(false);
    let (mut history, mut stats) = (Vec::new(), Vec::new());
    while f.s.result.is_none() && f.s.round <= max_rounds {
        let side = combat_core::rules::actor_to_move(&f.s).unwrap();
        let d = match ai::choose(&f.enc, &f.s, &search, &mut ctx[side], &now) { Ok(d) => d, Err(e) => return json!({"error": e, "case": case["meta"]}) };
        depth[side] += d["completedDepth"].as_f64().unwrap(); count[side] += 1;
        nodes[side] += d["totalNodes"].as_u64().unwrap();
        let id = d["id"].as_str().unwrap();
        let a = Fight::act(id).unwrap();
        for &p in &combat_core::data::data().acts.parts[a as usize] {
            let name = combat_core::data::data().name(p).to_string();
            let n = acts[side].get(&name).and_then(|x| x.as_u64()).unwrap_or(0);
            acts[side].insert(name, json!(n + 1));
        }
        if trace {
            let (round, legal) = (f.s.round, f.legal());
            let (_, entry) = f.apply_logged(id).unwrap();
            history.extend(entry);
            let mut stat = serde_json::Map::new();
            stat.insert("round".into(), json!(round));
            stat.insert("side".into(), json!(side));
            stat.insert("legal".into(), json!(legal));
            stat.extend(d.as_object().unwrap().clone());
            stats.push(Value::Object(stat));
        } else { f.apply(id).unwrap(); }
    }
    let st = f.to_json();
    let mut out = case["meta"].as_object().cloned().unwrap_or_default();
    out.insert("result".into(), match &st["result"] { Value::Null => Value::Null, r => { let mut o = json!({"outcome": r["outcome"], "reason": r["reason"]}); if let Some(w) = r.get("winner") { o["winner"] = w.clone(); } o } });
    out.insert("rounds".into(), json!(f.s.round - 1));
    out.insert("hp".into(), json!([f.s.actors[0].hp, f.s.actors[1].hp]));
    out.insert("mana".into(), json!([f.s.actors[0].res[combat_core::data::R_MANA], f.s.actors[1].res[combat_core::data::R_MANA]]));
    out.insert("acts".into(), json!(acts));
    out.insert("depth".into(), json!([depth[0] / 1f64.max(count[0] as f64), depth[1] / 1f64.max(count[1] as f64)]));
    out.insert("nodes".into(), json!(nodes));
    out.insert("cpuMs".into(), json!(t0.elapsed().as_secs_f64() * 1000.0));
    if trace {
        out.insert("trace".into(), json!({"rulesVersion": combat_core::RULES_VERSION, "config": st["config"], "kits": [st["actors"][0]["kit"], st["actors"][1]["kit"]],
            "history": history, "stats": stats, "result": st["result"], "settlement": st["settlement"], "reports": st["reports"]}));
    }
    Value::Object(out)
}

fn run(threads: Option<usize>) {
    use rayon::prelude::*;
    if let Some(n) = threads { rayon::ThreadPoolBuilder::new().num_threads(n).build_global().unwrap(); }
    let cases: Vec<Value> = std::io::stdin().lock().lines().map(|l| l.unwrap()).filter(|l| !l.trim().is_empty()).map(|l| serde_json::from_str(&l).expect("case")).collect();
    let results: Vec<Value> = cases.par_iter().map(play).collect();
    let mut out = BufWriter::new(std::io::stdout().lock());
    for r in results { writeln!(out, "{r}").unwrap(); }
}

fn main() {
    let args: Vec<String> = std::env::args().collect();
    match args.get(1).map(|s| s.as_str()) {
        Some("step") => step(),
        Some("search") => search(),
        Some("fight") => fight(),
        Some("run") => run(args.get(2).and_then(|t| t.parse().ok())),
        _ => { eprintln!("usage: combat-sim step"); std::process::exit(2); }
    }
}
