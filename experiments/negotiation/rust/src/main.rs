//! Newline JSON research protocol: configure schema once, then execute requests.
use serde_json::Value;
use std::io::{self, BufRead, Write};
fn main() {
    let mut schema = Value::Null;
    let stdin = io::stdin();
    let mut out = io::BufWriter::new(io::stdout().lock());
    for line in stdin.lock().lines() {
        let v: Value = serde_json::from_str(&line.unwrap()).expect("valid JSON line");
        let result = if v["op"] == "configure" {
            schema = v["schema"].clone();
            serde_json::json!({"ready":true})
        } else {
            negotiation_core::execute(v, &schema)
        };
        writeln!(out, "{}", result).unwrap();
        out.flush().unwrap();
    }
}
