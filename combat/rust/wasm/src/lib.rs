//! combat-wasm: the browser build of combat-core, behind a small C ABI (no wasm-bindgen).
//! Strings go in as (ptr, len) UTF-8 written into `alloc`ed memory; string results are left in an
//! output buffer read through `out_ptr`/`out_len`. One fight is loaded at a time (`load`, from the
//! JS state object); search contexts persist by handle. web/core.mjs is the only caller.
use combat_core::{ai, data::data, rules, state::{Eff, EFFECT_NAMES}, text, Fight};
use serde_json::{json, Value};
use std::cell::RefCell;

#[link(wasm_import_module = "env")]
extern "C" { fn now() -> f64; }
fn clock() -> f64 { unsafe { now() } }

thread_local! {
    static CUR: RefCell<Option<Fight>> = const { RefCell::new(None) };
    static OUT: RefCell<String> = const { RefCell::new(String::new()) };
    static CTX: RefCell<Vec<Option<ai::Context>>> = const { RefCell::new(Vec::new()) };
}

fn input<'a>(p: *const u8, n: usize) -> &'a str { unsafe { std::str::from_utf8_unchecked(std::slice::from_raw_parts(p, n)) } }
fn out(s: impl Into<String>) { OUT.with(|o| *o.borrow_mut() = s.into()); }
fn with<R>(f: impl FnOnce(&mut Fight) -> R) -> R { CUR.with(|c| f(c.borrow_mut().as_mut().expect("no fight loaded"))) }
fn act(p: *const u8, n: usize) -> u8 { data().act(input(p, n)).unwrap_or_else(|| panic!("Unknown action: {}", input(p, n))) }
/// 0 = ok; 1 = error, with the message in the output buffer.
fn status(r: Result<String, String>) -> i32 { match r { Ok(s) => { out(s); 0 } Err(e) => { out(e); 1 } } }

#[no_mangle] pub extern "C" fn alloc(n: usize) -> *mut u8 { let mut v = Vec::<u8>::with_capacity(n.max(1)); let p = v.as_mut_ptr(); std::mem::forget(v); p }
#[no_mangle] pub extern "C" fn dealloc(p: *mut u8, n: usize) { unsafe { drop(Vec::from_raw_parts(p, 0, n.max(1))) } }
#[no_mangle] pub extern "C" fn out_ptr() -> *const u8 { OUT.with(|o| o.borrow().as_ptr()) }
#[no_mangle] pub extern "C" fn out_len() -> usize { OUT.with(|o| o.borrow().len()) }

/// Panics trap; their message stays readable through the output buffer.
#[no_mangle] pub extern "C" fn init() { std::panic::set_hook(Box::new(|info| out(info.to_string()))); }
#[no_mangle] pub extern "C" fn rules_version() { out(combat_core::RULES_VERSION); }

/// Load a JS state object (JSON) as the current fight.
#[no_mangle] pub extern "C" fn load(p: *const u8, n: usize) {
    let v: Value = serde_json::from_str(input(p, n)).expect("state JSON");
    CUR.with(|c| *c.borrow_mut() = Some(Fight::from_json(&v)));
}
/// The current fight as a JS state object (JSON).
#[no_mangle] pub extern "C" fn dump() { let s = with(|f| f.to_json().to_string()); out(s); }
#[no_mangle] pub extern "C" fn actor() -> i32 { with(|f| rules::actor_to_move(&f.s).map_or(-1, |x| x as i32)) }
/// legalActions(s, side); side < 0 = the side to move.
#[no_mangle] pub extern "C" fn legal(side: i32) {
    let names = with(|f| {
        let moves = if side < 0 { rules::legal_actions(&f.enc, &f.s) } else { rules::legal_for(&f.enc, &f.s, side as usize) };
        moves.iter().map(|&a| data().name(a).to_string()).collect::<Vec<_>>()
    });
    out(serde_json::to_string(&names).unwrap());
}
#[no_mangle] pub extern "C" fn apply(p: *const u8, n: usize) -> i32 { let id = input(p, n).to_string(); status(with(|f| f.apply(&id).map(|r| r.to_string()))) }
#[no_mangle] pub extern "C" fn concede(side: i32) { with(|f| f.concede(side as usize)); }
/// available(): "" when the action can be taken, else the reason.
#[no_mangle] pub extern "C" fn unavailable(side: i32, p: *const u8, n: usize) { let a = act(p, n); let r = with(|f| rules::unavailable(&f.enc, &f.s, side as usize, a)); out(r.unwrap_or("")); }
#[no_mangle] pub extern "C" fn cost(side: i32, p: *const u8, n: usize) -> f64 { let a = act(p, n); with(|f| rules::cost(&f.enc, &f.s, side as usize, a)) }
#[no_mangle] pub extern "C" fn hp_cost(side: i32, p: *const u8, n: usize) -> f64 { let a = act(p, n); with(|f| rules::hp_cost(&f.enc, &f.s, side as usize, a)) }
#[no_mangle] pub extern "C" fn has(side: i32, p: *const u8, n: usize) -> i32 {
    let Some(k) = EFFECT_NAMES.iter().position(|e| *e == input(p, n)) else { return 0 };
    use Eff::*;
    let e = [Guard, Ward, Brace, ForeAim, Haste, Shadowstep, Tailwind, Reflect, Torment, Eclipse, Heartprice, Compelled, Lodestar][k];
    with(|f| rules::has(&f.s, side as usize, e) as i32)
}
#[no_mangle] pub extern "C" fn describe(side: i32, p: *const u8, n: usize) { let a = act(p, n); let t = with(|f| text::describe(&f.enc, &f.s, side as usize, a)); out(t); }
#[no_mangle] pub extern "C" fn label(p: *const u8, n: usize) { let a = data().act(input(p, n)); out(match a { Some(a) => text::label(Some(a)), None => input(p, n).to_string() }); }

/// A search context (transposition table, history, killers) that lives across calls.
#[no_mangle] pub extern "C" fn context_new(limit: u32) -> u32 {
    CTX.with(|c| {
        let mut c = c.borrow_mut();
        let ctx = Some(ai::Context::new(limit.max(1) as usize));
        match c.iter().position(|x| x.is_none()) { Some(i) => { c[i] = ctx; i as u32 + 1 } None => { c.push(ctx); c.len() as u32 } }
    })
}
#[no_mangle] pub extern "C" fn context_free(h: u32) { CTX.with(|c| if let Some(x) = c.borrow_mut().get_mut(h as usize - 1) { *x = None; }); }
/// Run f with context h, or with a fresh one of `limit` entries when h == 0.
fn in_context<R>(h: u32, limit: usize, f: impl FnOnce(&mut ai::Context) -> R) -> R {
    if h == 0 { return f(&mut ai::Context::new(limit)); }
    CTX.with(|c| f(c.borrow_mut()[h as usize - 1].as_mut().expect("freed search context")))
}
fn options(p: *const u8, n: usize) -> Value { if n == 0 { json!({}) } else { serde_json::from_str(input(p, n)).expect("options JSON") } }
fn table_limit(o: &Value) -> usize { o.get("tableLimit").and_then(|x| x.as_u64()).unwrap_or(4096) as usize }
/// searchAction(state, options, context) on the current fight.
#[no_mangle] pub extern "C" fn search(h: u32, p: *const u8, n: usize) -> i32 {
    let o = options(p, n);
    status(with(|f| in_context(h, table_limit(&o), |ctx| ai::search_json(&f.enc, &f.s, &o, ctx, &clock).map(|r| r.to_string()))))
}
/// chooseAIAction(state, options, context) on the current fight.
#[no_mangle] pub extern "C" fn choose(h: u32, p: *const u8, n: usize) -> i32 {
    let o = options(p, n);
    status(with(|f| in_context(h, table_limit(&o), |ctx| ai::choose(&f.enc, &f.s, &o, ctx, &clock).map(|r| r.to_string()))))
}
/// The best move context h stored for the current position ("" if none): the analysis view's lines.
#[no_mangle] pub extern "C" fn best(h: u32) {
    let id = with(|f| in_context(h, 1, |ctx| ctx.probe(ai::position_key(&f.s)).and_then(|e| e.best).map(|a| data().name(a).to_string())));
    out(id.unwrap_or_default());
}
