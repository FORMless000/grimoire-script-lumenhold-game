//! The few JavaScript number semantics the rules lean on, so the port plays exactly as the original did.

/// Math.round: to the nearest integer, ties up.
pub fn round(x: f64) -> f64 {
    let f = x.floor();
    if x - f >= 0.5 { f + 1.0 } else { f }
}
/// Math.round, as an integer.
pub fn iround(x: f64) -> i64 { round(x) as i64 }

/// ToInt32: what `x | 0` does.
pub fn to_int32(x: f64) -> i32 {
    if !x.is_finite() { return 0; }
    let m = x.trunc() % 4294967296.0;
    let m = if m < 0.0 { m + 4294967296.0 } else { m };
    (m as u64 as u32) as i32
}

/// mulberry32, the games' random numbers.
#[derive(Clone, Debug)]
pub struct Rng(pub u32);
impl Rng {
    pub fn new(seed: f64) -> Self { Rng(to_int32(seed) as u32) }
    pub fn next(&mut self) -> f64 {
        self.0 = self.0.wrapping_add(0x6D2B79F5);
        let a = self.0;
        let mut t = (a ^ (a >> 15)).wrapping_mul(1 | a);
        t = t.wrapping_add((t ^ (t >> 7)).wrapping_mul(61 | t)) ^ t;
        ((t ^ (t >> 14)) as f64) / 4294967296.0
    }
    /// Math.floor(rand() * n)
    pub fn below(&mut self, n: usize) -> usize { (self.next() * n as f64).floor() as usize }
}

/// The string hash cards.js uses (wait times, signature cards).
pub fn hash(s: &str) -> u32 {
    s.encode_utf16().fold(7u32, |h, c| h.wrapping_mul(31).wrapping_add(c as u32))
}

/// A number as JavaScript prints it (integers without a fraction).
pub fn num(x: f64) -> String {
    if x == x.trunc() && x.abs() < 1e21 { format!("{}", x as i64) } else { format!("{}", x) }
}

// ---------- Math.exp and Math.tanh as V8 computes them (fdlibm, via FreeBSD's msun), so the eval's last bits, and the
// search's ties, are the same here, in the browser's wasm and in the goldens. Rust's own exp and tanh come from the
// platform's libm, which differs from one machine to the next.

fn hi(x: f64) -> u32 { (x.to_bits() >> 32) as u32 }
fn lo(x: f64) -> u32 { x.to_bits() as u32 }
fn words(h: u32, l: u32) -> f64 { f64::from_bits(((h as u64) << 32) | l as u64) }
fn with_hi(x: f64, h: u32) -> f64 { words(h, lo(x)) }

pub fn exp(x: f64) -> f64 {
    const HALF: [f64; 2] = [0.5, -0.5];
    const HUGE: f64 = 1.0e+300;
    const O_THRESHOLD: f64 = 7.09782712893383973096e+02;
    const U_THRESHOLD: f64 = -7.45133219101941108420e+02;
    const LN2_HI: [f64; 2] = [6.93147180369123816490e-01, -6.93147180369123816490e-01];
    const LN2_LO: [f64; 2] = [1.90821492927058770002e-10, -1.90821492927058770002e-10];
    const INVLN2: f64 = 1.44269504088896338700e+00;
    const P1: f64 = 1.66666666666666019037e-01;
    const P2: f64 = -2.77777777770155933842e-03;
    const P3: f64 = 6.61375632143793436117e-05;
    const P4: f64 = -1.65339022054652515390e-06;
    const P5: f64 = 4.13813679705723846039e-08;
    const E: f64 = 2.718281828459045;
    const TWOM1000: f64 = 9.33263618503218878990e-302;
    let mut x = x;
    let mut hx = hi(x);
    let xsb = ((hx >> 31) & 1) as usize;
    hx &= 0x7fffffff;
    let (mut hi_, mut lo_, mut k) = (0.0, 0.0, 0i32);
    if hx >= 0x40862E42 {
        if hx >= 0x7ff00000 {
            if ((hx & 0xfffff) | lo(x)) != 0 { return x + x; }
            return if xsb == 0 { x } else { 0.0 };
        }
        if x > O_THRESHOLD { return f64::INFINITY; }
        if x < U_THRESHOLD { return TWOM1000 * TWOM1000; }
    }
    if hx > 0x3fd62e42 {
        if hx < 0x3FF0A2B2 {
            if x == 1.0 { return E; }
            hi_ = x - LN2_HI[xsb];
            lo_ = LN2_LO[xsb];
            k = 1 - xsb as i32 - xsb as i32;
        } else {
            k = (INVLN2 * x + HALF[xsb]) as i32;
            let t = k as f64;
            hi_ = x - t * LN2_HI[0];
            lo_ = t * LN2_LO[0];
        }
        x = hi_ - lo_;
    } else if hx < 0x3e300000 {
        if HUGE + x > 1.0 { return 1.0 + x; }
    } else {
        k = 0;
    }
    let t = x * x;
    let twopk = if k >= -1021 { words((0x3ff00000i32 + (k << 20)) as u32, 0) } else { words((0x3ff00000i32 + ((k + 1000) << 20)) as u32, 0) };
    let c = x - t * (P1 + t * (P2 + t * (P3 + t * (P4 + t * P5))));
    if k == 0 { return 1.0 - ((x * c) / (c - 2.0) - x); }
    let y = 1.0 - ((lo_ - (x * c) / (2.0 - c)) - hi_);
    if k >= -1021 {
        if k == 1024 { return y * 2.0 * f64::from_bits(0x7FE0000000000000); }
        y * twopk
    } else {
        y * twopk * TWOM1000
    }
}

pub fn expm1(x: f64) -> f64 {
    const HUGE: f64 = 1.0e+300;
    const TINY: f64 = 1.0e-300;
    const O_THRESHOLD: f64 = 7.09782712893383973096e+02;
    const LN2_HI: f64 = 6.93147180369123816490e-01;
    const LN2_LO: f64 = 1.90821492927058770002e-10;
    const INVLN2: f64 = 1.44269504088896338700e+00;
    const Q1: f64 = -3.33333333333331316428e-02;
    const Q2: f64 = 1.58730158725481460165e-03;
    const Q3: f64 = -7.93650757867487942473e-05;
    const Q4: f64 = 4.00821782732936239552e-06;
    const Q5: f64 = -2.01099218183624371326e-07;
    let mut x = x;
    let mut hx = hi(x);
    let xsb = hx & 0x80000000;
    hx &= 0x7fffffff;
    if hx >= 0x4043687A {
        if hx >= 0x40862E42 {
            if hx >= 0x7ff00000 {
                if ((hx & 0xfffff) | lo(x)) != 0 { return x + x; }
                return if xsb == 0 { x } else { -1.0 };
            }
            if x > O_THRESHOLD { return f64::INFINITY; }
        }
        if xsb != 0 && x + TINY < 0.0 { return TINY - 1.0; }
    }
    let k: i32;
    let mut c = 0.0;
    if hx > 0x3fd62e42 {
        let (hi_, lo_);
        if hx < 0x3FF0A2B2 {
            if xsb == 0 { hi_ = x - LN2_HI; lo_ = LN2_LO; k = 1; } else { hi_ = x + LN2_HI; lo_ = -LN2_LO; k = -1; }
        } else {
            k = (INVLN2 * x + if xsb == 0 { 0.5 } else { -0.5 }) as i32;
            let t = k as f64;
            hi_ = x - t * LN2_HI;
            lo_ = t * LN2_LO;
        }
        x = hi_ - lo_;
        c = (hi_ - x) - lo_;
    } else if hx < 0x3c900000 {
        let t = HUGE + x;
        return x - (t - (HUGE + x));
    } else {
        k = 0;
    }
    let hfx = 0.5 * x;
    let hxs = x * hfx;
    let r1 = 1.0 + hxs * (Q1 + hxs * (Q2 + hxs * (Q3 + hxs * (Q4 + hxs * Q5))));
    let mut t = 3.0 - r1 * hfx;
    let mut e = hxs * ((r1 - t) / (6.0 - x * t));
    if k == 0 { return x - (x * e - hxs); }
    let twopk = words((0x3ff00000i32 + (k << 20)) as u32, 0);
    e = x * (e - c) - c;
    e -= hxs;
    if k == -1 { return 0.5 * (x - e) - 0.5; }
    if k == 1 {
        return if x < -0.25 { -2.0 * (e - (x + 0.5)) } else { 1.0 + 2.0 * (x - e) };
    }
    if k <= -2 || k > 56 {
        let mut y = 1.0 - (e - x);
        y = if k == 1024 { y * 2.0 * f64::from_bits(0x7FE0000000000000) } else { y * twopk };
        return y - 1.0;
    }
    let y;
    if k < 20 {
        t = with_hi(1.0, (0x3ff00000 - (0x200000 >> k)) as u32);
        let y0 = t - (e - x);
        y = y0 * twopk;
    } else {
        t = with_hi(1.0, ((0x3ff - k) << 20) as u32);
        let mut y0 = x - (e + t);
        y0 += 1.0;
        y = y0 * twopk;
    }
    y
}

pub fn tanh(x: f64) -> f64 {
    const TINY: f64 = 1.0e-300;
    const HUGE: f64 = 1.0e300;
    let jx = hi(x) as i32;
    let ix = jx & 0x7fffffff;
    if ix >= 0x7ff00000 { return if jx >= 0 { 1.0 / x + 1.0 } else { 1.0 / x - 1.0 }; }
    let z;
    if ix < 0x40360000 {
        if ix < 0x3e300000 && HUGE + x > 1.0 { return x; }
        if ix >= 0x3ff00000 {
            let t = expm1(2.0 * x.abs());
            z = 1.0 - 2.0 / (t + 2.0);
        } else {
            let t = expm1(-2.0 * x.abs());
            z = -t / (t + 2.0);
        }
    } else {
        z = 1.0 - TINY;
    }
    if jx >= 0 { z } else { -z }
}
