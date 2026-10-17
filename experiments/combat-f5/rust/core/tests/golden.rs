//! Regression: fights frozen by tools/golden.mjs (start state, actions, final state) replay to the same final state.
//! The full goldens (every step, UI query, search and AI decision, native and WebAssembly) run with `node tools/golden.mjs`.
use combat_core::{rules::js_round, text::js_num, Fight};
use serde_json::Value;

/// JSON equality with numbers compared as f64 (JS writes 1 where serde writes 1.0).
fn same(a: &Value, b: &Value) -> bool {
    match (a, b) {
        (Value::Number(x), Value::Number(y)) => x.as_f64() == y.as_f64(),
        (Value::Array(x), Value::Array(y)) => x.len() == y.len() && x.iter().zip(y).all(|(p, q)| same(p, q)),
        (Value::Object(x), Value::Object(y)) => x.len() == y.len() && x.iter().all(|(k, v)| y.get(k).is_some_and(|w| same(v, w))),
        _ => a == b,
    }
}

#[test]
fn frozen_fights_replay_exactly() {
    let text = include_str!("fights.jsonl");
    let mut n = 0;
    for (i, line) in text.lines().filter(|l| !l.trim().is_empty()).enumerate() {
        let v: Value = serde_json::from_str(line).unwrap();
        let mut f = Fight::from_json(&v["state"]);
        for a in v["actions"].as_array().unwrap() {
            let a = a.as_str().unwrap();
            match a.strip_prefix("concede:") { Some(side) => f.concede(side.parse().unwrap()), None => { f.apply(a).unwrap(); } }
        }
        assert!(same(&f.to_json(), &v["final"]), "fight {i}: final state differs");
        n += 1;
    }
    assert!(n > 0);
}

#[test]
fn js_number_semantics() {
    assert_eq!(js_round(2.5), 3.0);
    assert_eq!(js_round(-2.5), -2.0);
    assert_eq!(js_round(0.49999999999999994), 0.0);
    assert_eq!(js_num(12.0), "12");
    assert_eq!(js_num(12.35), "12.35");
}
