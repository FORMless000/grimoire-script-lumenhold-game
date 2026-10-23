//! The JS number semantics the core keeps (JS Math.round, String(n)). Native and WebAssembly agree: tools/parity.mjs.
use combat_core::{rules::js_round, text::js_num};

#[test]
fn js_number_semantics() {
    assert_eq!(js_round(2.5), 3.0);
    assert_eq!(js_round(-2.5), -2.0);
    assert_eq!(js_round(0.49999999999999994), 0.0);
    assert_eq!(js_num(12.0), "12");
    assert_eq!(js_num(12.35), "12.35");
}
