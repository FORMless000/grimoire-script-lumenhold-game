#![recursion_limit = "512"]
//! Crux, the negotiation minigame: its rules (`rules`), the crude players (`bot`), the engine's search (`engine`) and
//! what the page reads (`view`). The cards, spells and encounters are data (`data`, embedded from data/*.json, which
//! export-data.js writes from the JavaScript data files).
pub mod data;
pub mod js;
pub mod rules;
pub mod bot;
pub mod engine;
pub mod view;

pub use rules::{Game, Move, Setup};
