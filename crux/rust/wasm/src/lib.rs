//! crux-wasm: the browser build of crux-core, behind a small C ABI (no wasm-bindgen), as the duels' combat-wasm.
//! Strings go in as (ptr, len) UTF-8 written into `alloc`ed memory; string results are left in an output buffer read
//! through `out_ptr`/`out_len`. One game at a time (`new_game`, `play`, `view`), and one search of it (`analyze_*`).
//! core.js is the only caller.
use crux_core::data::data;
use crux_core::engine::Analysis;
use crux_core::rules::{Game, Move};
use crux_core::view;
use std::cell::RefCell;

thread_local! {
    static GAME: RefCell<Option<Game>> = const { RefCell::new(None) };
    static SEARCH: RefCell<Option<Analysis<'static>>> = const { RefCell::new(None) };
    static OUT: RefCell<String> = const { RefCell::new(String::new()) };
}

fn input<'a>(p: *const u8, n: usize) -> &'a str { unsafe { std::str::from_utf8_unchecked(std::slice::from_raw_parts(p, n)) } }
fn out(s: impl Into<String>) { OUT.with(|o| *o.borrow_mut() = s.into()); }
/// 0 = ok; 1 = error, with the message in the output buffer.
fn status(r: Result<(), String>) -> i32 { match r { Ok(()) => 0, Err(e) => { out(e); 1 } } }

#[no_mangle] pub extern "C" fn alloc(n: usize) -> *mut u8 { let mut v = Vec::<u8>::with_capacity(n.max(1)); let p = v.as_mut_ptr(); std::mem::forget(v); p }
#[no_mangle] pub extern "C" fn dealloc(p: *mut u8, n: usize) { unsafe { drop(Vec::from_raw_parts(p, 0, n.max(1))) } }
#[no_mangle] pub extern "C" fn out_ptr() -> *const u8 { OUT.with(|o| o.borrow().as_ptr()) }
#[no_mangle] pub extern "C" fn out_len() -> usize { OUT.with(|o| o.borrow().len()) }

/// Panics trap; their message stays readable through the output buffer.
#[no_mangle] pub extern "C" fn init() { std::panic::set_hook(Box::new(|info| out(info.to_string()))); }
/// The tune, the spell kinds, the loadouts, the eval's features.
#[no_mangle] pub extern "C" fn statics() { out(view::statics().to_string()); }

/// Start a game from its setup (JSON: seed, level, enc, loadout, gap, skip, mana, crowns, health, renown).
#[no_mangle] pub extern "C" fn new_game(p: *const u8, n: usize) -> i32 {
    let r = serde_json::from_str(input(p, n)).map_err(|e| e.to_string()).and_then(|v| Game::new(&view::setup_from(&v)));
    status(r.map(|g| { GAME.with(|x| *x.borrow_mut() = Some(g)); SEARCH.with(|s| *s.borrow_mut() = None); }))
}
/// The game as the page reads it (view::view), with its whole log.
#[no_mangle] pub extern "C" fn view() {
    let s = GAME.with(|x| {
        let x = x.borrow();
        let g = x.as_ref().expect("no game");
        let mut v = view::view(g);
        v["log"] = view::log_lines(g, 0);
        v.to_string()
    });
    out(s);
}
/// Play a move by its key ('press', 'confront:<uid>', 'deflect:<uid>', 'cast:<spell>', 'bury', 'fact:<id>:<uid>', 'leave').
#[no_mangle] pub extern "C" fn play(p: *const u8, n: usize) -> i32 {
    let key = input(p, n).to_string();
    status(GAME.with(|x| {
        let mut x = x.borrow_mut();
        let g = x.as_mut().ok_or("no game")?;
        g.play(Move::parse(&key).ok_or_else(|| format!("Unknown move: {key}"))?)
    }))
}

/// Start searching the current game.
#[no_mangle] pub extern "C" fn analyze_start() {
    let a = GAME.with(|x| Analysis::new(x.borrow().as_ref().expect("no game"), &data().weights));
    SEARCH.with(|s| *s.borrow_mut() = Some(a));
}
/// Search one depth more: 1 if there is more to search.
#[no_mangle] pub extern "C" fn analyze_step() -> i32 { SEARCH.with(|s| s.borrow_mut().as_mut().map_or(0, |a| a.step() as i32)) }
/// What the search has found so far (view::report).
#[no_mangle] pub extern "C" fn analyze_report() {
    let s = SEARCH.with(|s| s.borrow().as_ref().map_or("null".to_string(), |a| view::report(&a.report()).to_string()));
    out(s);
}

/// The same deterministic crude player the native simulator uses. Return its command tape for saves/replay.
#[no_mangle] pub extern "C" fn auto_play(p: *const u8, n: usize) -> i32 {
    let bot = crux_core::bot::Bot::parse(input(p, n)).unwrap_or(crux_core::bot::Bot::Smart);
    status(GAME.with(|x| {
        let mut x = x.borrow_mut(); let g = x.as_mut().ok_or("no game")?;
        let mut moves = vec![];
        for _ in 0..200 {
            if g.over.is_some() { out(serde_json::to_string(&moves).unwrap()); return Ok(()); }
            crux_core::bot::step_with(g, bot, &mut |g, m| { moves.push(m.key()); g.play(m).expect("bot move"); });
        }
        Err("Crux bot did not finish".into())
    }))
}
