//! Lumenhold combat F5: the only implementation of the combat rules and the AI search.
//! Native builds run simulations; the WebAssembly build runs the browser game. JS keeps setup, data and UI.
pub mod data;
pub mod state;
pub mod rules;
pub mod ai;
pub mod text;

use data::{data, Act};
use serde_json::{json, Value};
use state::*;

pub const RULES_VERSION: &str = "spells-v2 F5.7 · 2026-10-17";

/// A public fight: static encounter, dynamic state, and the public-only log/settlement.
pub struct Fight { pub enc: Encounter, pub s: State, pub public: Public, template: Value }

pub fn event_json(e: &Event) -> Value {
    let d = data();
    match e {
        Event::ConstructEnded { spell } => json!({"type": "constructEnded", "id": d.spells[*spell].id}),
        Event::Froze { side } => json!({"type": "froze", "side": side}),
        Event::Witnessed { spell } => json!({"type": "witnessed", "id": d.spells[*spell].id}),
        Event::CompelsCancel => json!({"type": "compelsCancel"}),
        Event::TormentCharged { value, side } => json!({"type": "tormentCharged", "value": value, "side": side}),
        Event::HoarfrostCancel => json!({"type": "hoarfrostCancel"}),
        Event::Dealt { id, amount, target, source, reflected } => json!({"type": "dealt", "id": d.name(*id), "amount": amount, "target": target, "source": source, "reflected": reflected}),
        Event::Reclaimed { side, amount } => json!({"type": "reclaimed", "side": side, "amount": amount}),
    }
}

impl Fight {
    pub fn from_json(v: &Value) -> Fight {
        Fight { enc: Encounter::from_json(v), s: State::from_json(v), public: public_from_json(v), template: v.clone() }
    }
    pub fn to_json(&self) -> Value { state_json(&self.template, &self.s, &self.public) }
    pub fn act(name: &str) -> Result<Act, String> { data().act(name).ok_or_else(|| format!("Unknown action: {name}")) }
    pub fn legal(&self) -> Vec<String> { rules::legal_actions(&self.enc, &self.s).iter().map(|&a| data().name(a).to_string()).collect() }
    pub fn concede(&mut self, side: usize) { rules::concede(&self.enc, &mut self.s, side, &mut self.public); }
    /// applyChoice: the JS result shape, with structured events.
    pub fn apply(&mut self, name: &str) -> Result<Value, String> {
        let a = Fight::act(name)?;
        let side = rules::actor_to_move(&self.s);
        let r = rules::apply_choice(&self.enc, &mut self.s, a, &mut self.public)?;
        if !r.resolved { return Ok(json!({"resolved": false, "side": side})); }
        let pair = self.s.last_pair.unwrap();
        Ok(json!({
            "resolved": true, "round": r.round, "leader": r.leader,
            "committed": [act_json(r.committed[0]), act_json(r.committed[1])],
            "pair": [act_json(Some(pair[0])), act_json(Some(pair[1]))],
            "events": self.public.events.iter().map(event_json).collect::<Vec<_>>(),
            "result": match &self.s.result { Some(x) => result_json(x, &self.public), None => Value::Null },
        }))
    }
    /// applyChoice plus, when the exchange resolves, the entry the browser's exported log records for it:
    /// the result fields, channels and descriptions before the exchange, action names, and HP, ready Mana and flux after.
    /// Events stay structured (web/core.mjs formatEvent gives their text).
    pub fn apply_logged(&mut self, name: &str) -> Result<(Value, Option<Value>), String> {
        let a = Fight::act(name)?;
        let mover = rules::actor_to_move(&self.s).ok_or("Fight ended")?;
        let channels: [Option<usize>; 2] = [0, 1].map(|i| self.s.actors[i].channel.map(|c| c.spell));
        let commits: [Option<Act>; 2] = [0, 1].map(|i| if i == mover { Some(a) } else { self.s.pending[i] });
        let descs: Vec<String> = (0..2).map(|i| commits[i].map_or(String::new(), |c| text::describe(&self.enc, &self.s, i, c))).collect();
        let r = self.apply(name)?;
        if r["resolved"] != Value::Bool(true) { return Ok((r, None)); }
        let k = &data().acts;
        let pair = self.s.last_pair.unwrap();
        let names: Vec<String> = (0..2).map(|i| {
            let id = pair[i];
            if id == k.hold || id == k.release { format!("{} {}", text::label(Some(id)), text::label(channels[i].map(|sp| sp as Act))) } else { text::label(Some(id)) }
        }).collect();
        let mut entry = r.as_object().unwrap().clone();
        entry.insert("channels".into(), json!(channels.map(|c| c.map(|sp| data().spells[sp].id.clone()))));
        entry.insert("descs".into(), json!(descs));
        entry.insert("actionNames".into(), json!(names));
        entry.insert("hp".into(), json!(self.s.actors.map(|x| x.hp)));
        entry.insert("ready".into(), json!(self.s.actors.map(|x| x.res[data::R_MANA])));
        entry.insert("flux".into(), json!(self.s.actors.map(|x| x.flux)));
        Ok((r, Some(Value::Object(entry))))
    }
}
