//! Crux's tools.
//!   crux sim [--games 20]
//!       The crude players over every bound negotiation, for gross balance only.
//!   crux duel [--games 200] [--depth 1] [--level 50] [--even | --gap N]
//!       How well the engine plays: the same meetings (same seeds) played by the engine at a fixed depth and by the smart
//!       bot. --gap N: each encounter N levels above you (--even is --gap 0); neither: each at its own level, as the
//!       campaign meets it. Prints each player's score (a win 1, a partial deal ½) with its standard error.
//!   crux train --bot|--td|--self [--games 6000] [--playouts 32] [--hidden 16] [--cache file.json] [--dry]
//!       Fits the engine's eval (a small network over engine::features) and writes core/data/weights.json (rebuild to
//!       use it). --bot: positions from meetings of the smart player with random moves mixed in, each labelled by how
//!       often the smart player wins from there; --td: the same positions, each labelled by the engine's depth-1 search
//!       with the current eval; --self: the engine's own meetings at depth 1, each position labelled by how it ended.
//!   crux report [--levels 20,50,80 | --gaps 0,10,20] [--ablate 0] [--ablate-depth 3] [--bot-games 8] [--seeds 4] [--depth 4] [--play 1] [--out file.json]
//!       Every encounter at its own level, against each player level and kit: the smart bot's score over --bot-games
//!       meetings, and the engine's forecast (its search's value at the first move, to --depth or until exact) averaged
//!       over --seeds shuffles; the first --play of those are also played out by the engine, to check the forecast.
//!       --gaps: the player that many levels below each encounter instead. --ablate N: each known spell left out, its
//!       worth to the engine (forecast over N shuffles at --ablate-depth) and to the bot.
//! Run from crux/rust: cargo run --release -- <command> ...
use crux_core::bot::{self, Bot};
use crux_core::data::{data, Spell, Weights};
use crux_core::engine::{self, Analysis};
use crux_core::js::{self, Rng};
use crux_core::rules::{loadouts, Game, Move, Setup};
use serde_json::json;
use std::time::Instant;

fn arg(name: &str) -> Option<String> {
    let a: Vec<String> = std::env::args().collect();
    a.iter().position(|x| x == &format!("--{name}")).and_then(|i| a.get(i + 1).cloned())
}
fn num<T: std::str::FromStr>(name: &str, d: T) -> T { arg(name).and_then(|x| x.parse().ok()).unwrap_or(d) }
fn flag(name: &str) -> bool { std::env::args().any(|x| x == format!("--{name}")) }

fn setup(seed: u32, level: i32, enc: usize, gap: Option<i32>, loadout: &str) -> Setup {
    Setup { seed, level, enc: data().encounters[enc].key.into(), gap, loadout: loadout.into(), ..Setup::default() }
}
/// Run f over 0..n on every core, the results in order.
fn par<T: Send>(n: usize, f: impl Fn(usize) -> T + Sync) -> Vec<T> {
    let threads = std::thread::available_parallelism().map_or(4, |x| x.get()).min(n.max(1));
    let next = std::sync::atomic::AtomicUsize::new(0);
    let mut out: Vec<(usize, T)> = std::thread::scope(|s| {
        let hs: Vec<_> = (0..threads).map(|_| s.spawn(|| {
            let mut mine = vec![];
            loop {
                let i = next.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                if i >= n { break; }
                mine.push((i, f(i)));
            }
            mine
        })).collect();
        hs.into_iter().flat_map(|h| h.join().unwrap()).collect()
    });
    out.sort_by_key(|x| x.0);
    out.into_iter().map(|x| x.1).collect()
}
fn pct(x: f64) -> String { format!("{:>4}", format!("{}%", js::iround(x * 100.0))) }

fn sim() {
    let games: usize = num("games", 20);
    let encs = data().encounters.len();
    let lo = loadouts();
    for view in ["even", "campaign"] {
        for level in [20, 50, 80] {
            let mut row = vec![];
            for b in [Bot::Smart, Bot::NoSpell, Bot::Naive] {
                let results = par(encs * games, |k| {
                    let (i, s) = (k / games, k % games);
                    let mut g = Game::new(&setup((1000 * i + s + 1) as u32, level, i, if view == "even" { Some(0) } else { None }, lo[s % lo.len()])).unwrap();
                    bot::play(&mut g, b);
                    g
                });
                let n = results.len() as f64;
                let wins = results.iter().filter(|g| g.over.as_ref().unwrap().outcome == crux_core::rules::Outcome::Win).count() as f64;
                row.push(pct(wins / n));
                if b == Bot::Smart {
                    let mut ends: Vec<(String, usize)> = vec![];
                    let mut casts: Vec<(Spell, usize)> = vec![];
                    for g in &results {
                        let end = g.over.as_ref().unwrap().reason.split('.').next().unwrap().to_string();
                        match ends.iter_mut().find(|e| e.0 == end) { Some(e) => e.1 += 1, None => ends.push((end, 1)) }
                        for &c in &g.casts { match casts.iter_mut().find(|e| e.0 == c) { Some(e) => e.1 += 1, None => casts.push((c, 1)) } }
                    }
                    casts.sort_by(|a, b| b.1.cmp(&a.1));
                    let avg = |f: &dyn Fn(&Game) -> i32| results.iter().map(|g| f(g) as f64).sum::<f64>() / n;
                    row.push(format!("actions {:.1}, presses {:.1}, Mana spent {:.0}; {}", avg(&|g| g.actions), avg(&|g| g.presses), avg(&|g| (g.cap - g.mana).round() as i32),
                        ends.iter().map(|(k, v)| format!("{k} {}", pct(*v as f64 / n))).collect::<Vec<_>>().join(", ")));
                    row.push(casts.iter().map(|(k, v)| format!("{} {:.2}", k.name(), *v as f64 / n)).collect::<Vec<_>>().join(", "));
                }
            }
            println!("{view:<8} L{level}  smart {} | nospell {} | naive {}", row[0], row[3], row[4]);
            println!("              {}", row[1]);
            println!("              {}", row[2]);
        }
    }
}

fn play_engine(g: &mut Game, depth: i32, w: &Weights) -> (f64, usize, f64) {
    let (mut first, mut moves, mut ms) = (f64::NAN, 0, 0.0);
    let mut guard = 0;
    while g.over.is_none() && guard < 80 {
        guard += 1;
        let t0 = Instant::now();
        let mut a = Analysis::new(g, w);
        a.run(depth);
        let r = a.report();
        ms += t0.elapsed().as_secs_f64() * 1000.0;
        moves += 1;
        if guard == 1 { first = r.value; }
        g.play(r.best.expect("a move")).expect("the engine's move");
    }
    (first, moves, ms)
}

fn duel() {
    let games: usize = num("games", 200);
    let depth: i32 = num("depth", 1);
    let level: i32 = num("level", 50);
    let gap = if flag("even") { Some(0) } else { arg("gap").and_then(|x| x.parse().ok()) };
    let lo = loadouts();
    let encs = data().encounters.len();
    let w = &data().weights;
    let new = |n: usize| Game::new(&setup(5000 + n as u32, level, n % encs, gap, lo[n % lo.len()])).unwrap();
    let t0 = Instant::now();
    let rs = par(games, |n| {
        let mut g = new(n);
        let (first, moves, ms) = play_engine(&mut g, depth, w);
        let mut b = new(n);
        bot::play(&mut b, Bot::Smart);
        (engine::score(&g), engine::score(&b), first, moves, ms, g.casts.clone())
    });
    let stats = |xs: Vec<f64>| { let m = xs.iter().sum::<f64>() / xs.len() as f64; let v = xs.iter().map(|x| (x - m).powi(2)).sum::<f64>() / xs.len() as f64; format!("{:.1}% ± {:.1}", m * 100.0, 100.0 * (v / xs.len() as f64).sqrt()) };
    let moves: usize = rs.iter().map(|r| r.3).sum();
    let ms: f64 = rs.iter().map(|r| r.4).sum();
    let mut cast: Vec<(Spell, usize)> = vec![];
    for r in &rs { for &c in &r.5 { match cast.iter_mut().find(|e| e.0 == c) { Some(e) => e.1 += 1, None => cast.push((c, 1)) } } }
    cast.sort_by(|a, b| b.1.cmp(&a.1));
    println!("{games} meetings at level {level}{}", match gap { None => " (campaign)".into(), Some(0) => " (even)".into(), Some(g) => format!(" (they are {g} above)") });
    println!("  engine, depth {depth}: {}  ({:.1} ms a move)", stats(rs.iter().map(|r| r.0).collect()), ms / moves as f64);
    println!("  smart bot:        {}", stats(rs.iter().map(|r| r.1).collect()));
    println!("  engine − smart:   {}", stats(rs.iter().map(|r| r.0 - r.1).collect()));
    println!("  the engine casts {:.1} spells a meeting: {}", rs.iter().map(|r| r.5.len()).sum::<usize>() as f64 / games as f64,
        cast.iter().map(|(k, v)| format!("{} {:.2}", k.name(), *v as f64 / games as f64)).collect::<Vec<_>>().join(", "));
    println!("  the engine's own forecast at the first move: {:.1}%", 100.0 * rs.iter().map(|r| r.2).sum::<f64>() / games as f64);
    println!("  {:.1} s", t0.elapsed().as_secs_f64());
}

// ---------- train

fn random_move(g: &Game, rand: &mut Rng) -> Move {
    let ms: Vec<Move> = engine::moves(g).into_iter().filter(|m| !matches!(m, Move::Cast(Spell::Flame) | Move::Cast(Spell::Shadowstep))).collect();
    ms[rand.below(ms.len())]
}
fn label(g: &Game, seed: usize, playouts: usize) -> f64 {
    let mut sum = 0.0;
    for k in 0..playouts {
        let mut c = engine::clone_with(g, Rng::new((seed * 131 + k) as f64));
        bot::play(&mut c, Bot::Smart);
        sum += engine::score(&c);
    }
    sum / playouts as f64
}
/// Positions at the start of an action, from meetings at every level and loadout, even and as the campaign meets them.
fn positions(games: usize, playouts: usize, td: bool, w: &Weights) -> Vec<(Vec<f64>, f64)> {
    let lo = loadouts();
    let encs = data().encounters.len();
    // Each meeting's positions first (in parallel), then each labelled with the running row number as its seed.
    let meetings = par(games, |n| {
        let mut rand = Rng::new((n + 1) as f64);
        let mut g = Game::new(&setup((n + 1) as u32, [20, 50, 80][n % 3], n % encs, if n % 2 == 1 { Some(0) } else { None }, lo[n % lo.len()])).unwrap();
        let mut seen = vec![];
        let mut guard = 0;
        while g.over.is_none() && guard < 60 {
            guard += 1;
            if g.cast.is_none() { seen.push(g.clone()); }
            if rand.next() < 0.3 { let m = random_move(&g, &mut rand); g.play(m).unwrap(); } else { bot::step(&mut g, Bot::Smart); }
        }
        seen
    });
    let all: Vec<Game> = meetings.into_iter().flatten().collect();
    par(all.len(), |i| {
        let g = &all[i];
        let y = if td { let mut a = Analysis::new(g, w); a.run(1); a.report().value } else { label(g, i + 1, playouts) };
        (engine::features(&engine::mask(g)), y)
    })
}
/// Positions from the engine's own meetings, each labelled by how its meeting ended.
fn self_play(games: usize, w: &Weights) -> Vec<(Vec<f64>, f64)> {
    let lo = loadouts();
    let encs = data().encounters.len();
    par(games, |n| {
        let mut rand = Rng::new((n + 1) as f64);
        let mut g = Game::new(&setup(70000 + n as u32, [20, 50, 80][n % 3], n % encs, if n % 2 == 1 { Some(0) } else { None }, lo[n % lo.len()])).unwrap();
        let mut k = rand.below(3);
        while k > 0 && g.over.is_none() { let m = random_move(&g, &mut rand); g.play(m).unwrap(); k -= 1; }
        let mut seen = vec![];
        let mut guard = 0;
        while g.over.is_none() && guard < 60 {
            guard += 1;
            if g.cast.is_none() { seen.push(engine::features(&engine::mask(&g))); }
            let mut a = Analysis::new(&g, w);
            a.run(1);
            g.play(a.report().best.unwrap()).unwrap();
        }
        let y = engine::score(&g);
        seen.into_iter().map(|f| (f, y)).collect::<Vec<_>>()
    }).into_iter().flatten().collect()
}

/// Cross-entropy against the soft labels, Adam on minibatches.
fn fit(rows: &[&(Vec<f64>, f64)], hidden: usize) -> Weights {
    let (epochs, batch, lr) = (400, 128, 0.01);
    let mut rand = Rng::new(1.0);
    let d = rows[0].0.len();
    let mut h: Vec<Vec<f64>> = (0..hidden).map(|_| (0..d).map(|_| (rand.next() - 0.5) * 0.6).collect()).collect();
    let mut b = vec![0.0; hidden];
    let mut v: Vec<f64> = (0..hidden).map(|_| (rand.next() - 0.5) * 0.6).collect();
    let mut c = 0.0;
    let (mut mh, mut vh) = (vec![vec![0.0; d]; hidden], vec![vec![0.0; d]; hidden]);
    let (mut mb, mut vb, mut mv, mut vv) = (vec![0.0; hidden], vec![0.0; hidden], vec![0.0; hidden], vec![0.0; hidden]);
    let (mut mc, mut vc, mut t) = (0.0, 0.0, 0);
    let mut order: Vec<usize> = (0..rows.len()).collect();
    let adam = |x: &mut f64, g: f64, m: &mut f64, s: &mut f64, t: i32| {
        *m = 0.9 * *m + 0.1 * g;
        *s = 0.999 * *s + 0.001 * g * g;
        *x -= lr * (*m / (1.0 - 0.9f64.powi(t))) / ((*s / (1.0 - 0.999f64.powi(t))).sqrt() + 1e-8);
    };
    for _ in 0..epochs {
        for i in (1..order.len()).rev() { let j = rand.below(i + 1); order.swap(i, j); }
        for idx in order.chunks(batch) {
            let (mut gh, mut gb, mut gv, mut gc) = (vec![vec![0.0; d]; hidden], vec![0.0; hidden], vec![0.0; hidden], 0.0);
            for &k in idx {
                let (f, y) = rows[k];
                let a: Vec<f64> = (0..hidden).map(|j| js::tanh(h[j].iter().zip(f).fold(b[j], |z, (x, fi)| z + x * fi))).collect();
                let p = 1.0 / (1.0 + js::exp(-a.iter().zip(&v).fold(c, |z, (x, vj)| z + x * vj)));
                let e = p - y;
                gc += e;
                for j in 0..hidden {
                    gv[j] += e * a[j];
                    let da = e * v[j] * (1.0 - a[j] * a[j]);
                    gb[j] += da;
                    for i in 0..d { gh[j][i] += da * f[i]; }
                }
            }
            t += 1;
            let n = idx.len() as f64;
            for j in 0..hidden {
                for i in 0..d { adam(&mut h[j][i], gh[j][i] / n, &mut mh[j][i], &mut vh[j][i], t); }
                adam(&mut b[j], gb[j] / n, &mut mb[j], &mut vb[j], t);
                adam(&mut v[j], gv[j] / n, &mut mv[j], &mut vv[j], t);
            }
            adam(&mut c, gc / n, &mut mc, &mut vc, t);
        }
    }
    let r = |x: f64| (x * 1e4).round() / 1e4;
    Weights { h: h.iter().map(|row| row.iter().map(|&x| r(x)).collect()).collect(), b: b.iter().map(|&x| r(x)).collect(), v: v.iter().map(|&x| r(x)).collect(), c: r(c) }
}

fn train() {
    let games: usize = num("games", 6000);
    let playouts: usize = num("playouts", 32);
    let hidden: usize = num("hidden", 16);
    let (td, selfp) = (flag("td"), flag("self"));
    let current = &data().weights;
    let t0 = Instant::now();
    let cache = arg("cache");
    let rows: Vec<(Vec<f64>, f64)> = match cache.as_ref().and_then(|c| std::fs::read_to_string(c).ok()) {
        Some(s) => serde_json::from_str(&s).unwrap(),
        None => {
            let rows = if selfp { self_play(games, current) } else { positions(games, playouts, td, current) };
            if let Some(c) = &cache { std::fs::write(c, serde_json::to_string(&rows).unwrap()).unwrap(); }
            rows
        }
    };
    let test: Vec<&(Vec<f64>, f64)> = rows.iter().enumerate().filter(|(i, _)| i % 5 == 0).map(|x| x.1).collect();
    let trainset: Vec<&(Vec<f64>, f64)> = rows.iter().enumerate().filter(|(i, _)| i % 5 != 0).map(|x| x.1).collect();
    let w = fit(&trainset, hidden);
    let rmse = |pred: &dyn Fn(&[f64]) -> f64| (test.iter().map(|r| (pred(&r.0) - r.1).powi(2)).sum::<f64>() / test.len() as f64).sqrt();
    let logloss = |w: &Weights| -test.iter().map(|r| { let p = engine::net(w, &r.0).clamp(1e-6, 1.0 - 1e-6); r.1 * p.ln() + (1.0 - r.1) * (1.0 - p).ln() }).sum::<f64>() / test.len() as f64;
    let noise = if selfp || td { 0.0 } else { (test.iter().map(|r| r.1 * (1.0 - r.1)).sum::<f64>() / test.len() as f64 / playouts as f64).sqrt() };
    let err = rmse(&|f| engine::net(&w, f));
    let mean = trainset.iter().map(|r| r.1).sum::<f64>() / trainset.len() as f64;
    println!("{} positions, {:.1} s", rows.len(), t0.elapsed().as_secs_f64());
    println!("held-out log loss: the eval {:.4}, the current one {:.4}", logloss(&w), logloss(current));
    println!("held-out RMSE: the eval {err:.4} (≈ {:.4} once the labels' own noise, {noise:.4}, is taken out); press-out alone {:.4}; the mean {:.4}",
        (err * err - noise * noise).max(0.0).sqrt(), rmse(&|f| f[0]), rmse(&|_| mean));
    if !flag("dry") {
        let file = concat!(env!("CARGO_MANIFEST_DIR"), "/../core/data/weights.json");
        std::fs::write(file, format!("{}\n", json!({ "h": w.h, "b": w.b, "v": w.v, "c": w.c }))).unwrap();
        println!("wrote core/data/weights.json: rebuild to use it");
    }
}

fn report() {
    // Cells: each encounter at its own level, against each player level (--levels) or each gap below it (--gaps:
    // the player at the encounter's level minus the gap, at least 1).
    let gaps: Option<Vec<i32>> = arg("gaps").map(|x| x.split(',').filter_map(|x| x.parse().ok()).collect());
    let levels: Vec<i32> = gaps.clone().unwrap_or_else(|| arg("levels").unwrap_or("20,50,80".into()).split(',').filter_map(|x| x.parse().ok()).collect());
    let (bot_games, seeds, depth, play): (usize, usize, i32, usize) = (num("bot-games", 8), num("seeds", 4), num("depth", 4), num("play", 1));
    let (ablate, ablate_depth): (usize, i32) = (num("ablate", 0), num("ablate-depth", 3));
    let lo = loadouts();
    let encs = data().encounters.len();
    let w = &data().weights;
    let cells: Vec<(usize, i32, usize)> = (0..encs).flat_map(|e| levels.iter().flat_map(move |&l| (0..10).map(move |k| (e, l, k)))).filter(|c| c.2 < lo.len()).collect();
    let t0 = Instant::now();
    let rows = par(cells.len(), |n| {
        let (e, x, k) = cells[n];
        let d = &data().encounters[e];
        let level = if gaps.is_some() { (d.level - x).max(1) } else { x };
        let mk = |s: usize, skip: &[Spell]| { let mut st = setup(7000 + s as u32, level, e, None, lo[k]); st.skip = skip.to_vec(); Game::new(&st).unwrap() };
        let bot_run = |skip: &[Spell]| {
            let mut casts: Vec<&str> = vec![];
            let sc = (0..bot_games).map(|s| { let mut g = mk(s, skip); bot::play(&mut g, Bot::Smart); casts.extend(g.casts.iter().map(|c| c.name())); engine::score(&g) }).sum::<f64>() / bot_games as f64;
            (sc, casts)
        };
        let search = |g: &Game, dp: i32| { let mut a = Analysis::new(g, w); a.run(dp); a.report() };
        let (bot, bot_casts) = bot_run(&[]);
        let (mut fc, mut exact, mut played, mut eng_casts, mut ms) = (vec![], 0, vec![], vec![], 0.0);
        for s in 0..seeds {
            let g = mk(s, &[]);
            let t = Instant::now();
            let r = search(&g, depth);
            ms += t.elapsed().as_secs_f64() * 1000.0;
            if r.exact { exact += 1; }
            fc.push(r.value);
            if s < play {
                let mut h = g.clone();
                play_engine(&mut h, depth, w);
                played.push(engine::score(&h));
                eng_casts.extend(h.casts.iter().map(|c| c.name()));
            }
        }
        // Each spell the kit knows, left out: the engine's forecast (shallower, over --ablate shuffles) and the bot's score.
        let mut abl = serde_json::Map::new();
        if ablate > 0 {
            let known = mk(0, &[]).known.clone();
            let base = (0..ablate).map(|s| search(&mk(s, &[]), ablate_depth).value).sum::<f64>() / ablate as f64;
            abl.insert("_base".into(), json!(base));
            for sp in known {
                let f = (0..ablate).map(|s| search(&mk(s, &[sp]), ablate_depth).value).sum::<f64>() / ablate as f64;
                abl.insert(sp.name().into(), json!({ "engine": base - f, "bot": bot - bot_run(&[sp]).0 }));
            }
        }
        json!({ "i": e, "enc": d.key, "encLevel": d.level, "gap": if gaps.is_some() { json!(x) } else { json!(d.level - level) }, "level": level, "kit": lo[k],
            "bot": bot, "botCasts": bot_casts, "forecast": fc.iter().sum::<f64>() / fc.len() as f64,
            "forecasts": fc, "exact": exact, "played": played, "engCasts": eng_casts, "ms": ms / seeds as f64, "ablate": abl })
    });
    let out = arg("out").unwrap_or("report.json".into());
    std::fs::write(&out, serde_json::to_string(&rows).unwrap()).unwrap();
    eprintln!("{} cells in {:.1} s → {out}", cells.len(), t0.elapsed().as_secs_f64());
}

fn main() {
    match std::env::args().nth(1).as_deref() {
        Some("sim") => sim(),
        Some("duel") => duel(),
        Some("train") => train(),
        Some("report") => report(),
        _ => eprintln!("crux sim|duel|train|report … (see cli/src/main.rs)"),
    }
}
