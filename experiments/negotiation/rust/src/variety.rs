//! Opt-in research rules. The v3 oracle path stays unchanged for regression.
//! Scalar utility is deliberately separated from full-win estimates and costs.
use super::*;
const MAX_SPELLS: usize = 35;
#[derive(Clone, Copy)]
struct State {
    p: Position,
    active: [u8; MAX_SPELLS],
    insight: f64,
    last_source: u8,
}
#[derive(Default)]
struct Spec {
    mana: f64,
    health: f64,
    renown: f64,
    resolve: f64,
    patience: f64,
    suspicion: f64,
    restore_resolve: f64,
    restore_patience: f64,
    restore_mana: f64,
    duration: u8,
    chance: f64,
    frame_chance: f64,
    only: Vec<String>,
    frames: Vec<String>,
    swap: String,
    resolve_shield: f64,
    suspicion_shield: f64,
    patience_shield: f64,
    deflect_resolve: Option<f64>,
    deflect_patience: f64,
    deflect_risk: Option<f64>,
    success_resolve: f64,
    success_multiplier: f64,
    reject_suspicion: f64,
    reject_renown: f64,
    reject_resolve: f64,
    conceal_gold: bool,
    response_patience: f64,
    gold_discount: f64,
    after_failure: f64,
    repeat_source: f64,
    no_fatigue: bool,
    foresight: bool,
    force: bool,
    waive_gate: bool,
    fail: bool,
}
fn strings(v: &Value, key: &str) -> Vec<String> {
    v[key]
        .as_array()
        .map(|a| {
            a.iter()
                .filter_map(|x| x.as_str().map(str::to_owned))
                .collect()
        })
        .unwrap_or_default()
}
fn flag(v: &Value, key: &str) -> bool {
    v[key].as_bool().unwrap_or(false)
}
fn number(v: &Value, key: &str, default: f64) -> f64 {
    v[key].as_f64().unwrap_or(default)
}
impl Spec {
    fn parse(v: &Value, power: f64) -> Self {
        Self {
            mana: num(v, "mana"),
            health: num(v, "health"),
            renown: num(v, "renown"),
            resolve: num(v, "resolve"),
            patience: num(v, "patience"),
            suspicion: number(v, "suspicion", 1.),
            restore_resolve: num(v, "restoreResolve") * power,
            restore_patience: num(v, "restorePatience"),
            restore_mana: num(v, "restoreMana"),
            duration: number(v, "duration", 1.) as u8,
            chance: num(v, "chance") * power,
            frame_chance: num(v, "frameChance") * power,
            only: strings(v, "only"),
            frames: strings(v, "frames"),
            swap: word(v, "swap").into(),
            resolve_shield: num(v, "resolveShield") * power,
            suspicion_shield: num(v, "suspicionShield"),
            patience_shield: num(v, "patienceShield"),
            deflect_resolve: v["deflectResolve"].as_f64(),
            deflect_patience: num(v, "deflectPatience"),
            deflect_risk: v["deflectRisk"].as_f64(),
            success_resolve: num(v, "successResolve") * power,
            success_multiplier: number(v, "successMultiplier", 1.),
            reject_suspicion: num(v, "rejectSuspicion"),
            reject_renown: num(v, "rejectRenown"),
            reject_resolve: num(v, "rejectResolve"),
            conceal_gold: flag(v, "concealGold"),
            response_patience: num(v, "responsePatience"),
            gold_discount: num(v, "goldDiscount"),
            after_failure: num(v, "afterFailure") * power,
            repeat_source: num(v, "repeatSource") * power,
            no_fatigue: flag(v, "noFatigue"),
            foresight: flag(v, "foresight"),
            force: flag(v, "force"),
            waive_gate: flag(v, "waiveGate"),
            fail: flag(v, "fail"),
        }
    }
}
struct Extra {
    base: String,
    frame: String,
    source: u8,
    success_resolve: f64,
    success_suspicion: f64,
    success_patience: f64,
    reject_renown: f64,
    deflect_patience: f64,
}
#[derive(Clone, Copy, Default)]
struct ValueScore {
    win: f64,
    partial: f64,
    cost: [f64; 6],
}
impl ValueScore {
    fn add(&mut self, v: Self, w: f64) {
        self.win += v.win * w;
        self.partial += v.partial * w;
        for i in 0..6 {
            self.cost[i] += v.cost[i] * w;
        }
    }
}
struct Game {
    c: Context,
    tune: Value,
    spec: Vec<Spec>,
    extra: Vec<Extra>,
    distributions: Vec<Vec<(usize, f64)>>,
    leaf_distributions: Vec<Vec<(usize, f64)>>,
    bonuses: Vec<Vec<f64>>,
    weights: [f64; 6],
    scale: [f64; 6],
    slack: f64,
    capacity: f64,
    skills: HashMap<String, f64>,
    policy_variant: String,
    unlimited_mana: bool,
}
impl Game {
    fn parse(raw: Value, schema: &Value) -> (Self, State) {
        let (c, p) = Context::parse(raw, schema);
        let tune = c.raw["config"]["tune"].clone();
        let power = number(&tune, "spellPower", 1.);
        let spec = c
            .spells
            .iter()
            .map(|s| {
                let effect = &c.raw["config"]["spellEffects"][&s.id];
                if s.id == "ward" {
                    // Enforce the no-benefit rule at the core boundary too,
                    // including imported states from older tuning proposals.
                    Spec::parse(&json!({"mana":num(effect,"mana"),"suspicion":1,"duration":0}), power)
                } else {
                    Spec::parse(effect, power)
                }
            })
            .collect::<Vec<_>>();
        let mut source_tags: Vec<String> = Vec::new();
        let extra = c.raw["pool"]
            .as_array()
            .unwrap()
            .iter()
            .map(|v| {
                let source = word(v, "source");
                let tag = format!("{}:{}", source, word(v, "key"));
                let code = if let Some(i) = source_tags.iter().position(|x| x == &tag) {
                    i + 1
                } else {
                    source_tags.push(tag);
                    source_tags.len()
                };
                Extra {
                    base: word(v, "baseId").into(),
                    frame: word(v, "frame").into(),
                    source: code as u8,
                    success_resolve: num(v, "successResolve"),
                    success_suspicion: num(v, "successSuspicion"),
                    success_patience: num(v, "successPatience"),
                    reject_renown: num(v, "rejectRenown"),
                    deflect_patience: num(v, "deflectPatience"),
                }
            })
            .collect::<Vec<_>>();
        let distributions: Vec<Vec<(usize, f64)>> = extra
            .iter()
            .map(|current| {
                let total: f64 = c
                    .cards
                    .iter()
                    .enumerate()
                    .filter(|(i, _)| extra[*i].base != current.base)
                    .map(|(_, card)| card.weight)
                    .sum();
                c.cards
                    .iter()
                    .enumerate()
                    .filter(|(i, _)| extra[*i].base != current.base)
                    .map(|(i, card)| (i, card.weight / total))
                    .collect()
            })
            .collect();
        // The leaf is already a race heuristic. Deterministic public strata
        // avoid recomputing 270 cards for every move-ordering estimate. Setting
        // leafSamples=0 retains the full distribution for convergence checks.
        let leaf_n = number(&tune, "leafSamples", 18.) as usize;
        let leaf_distributions = distributions
            .iter()
            .enumerate()
            .map(|(i, d)| {
                if leaf_n == 0 {
                    d.clone()
                } else {
                    sampled(d, leaf_n, hash(&extra[i].base))
                }
            })
            .collect();
        let bonuses = spec
            .iter()
            .map(|e| {
                c.cards
                    .iter()
                    .enumerate()
                    .map(|(i, card)| {
                        let tag = format!("{}:{}", card.source, card.key);
                        let applies = e.only.is_empty()
                            || e.only.iter().any(|t| t == &card.source || t == &tag);
                        (if applies { e.chance } else { 0. })
                            + if e.frames.contains(&extra[i].frame) {
                                e.frame_chance
                            } else {
                                0.
                            }
                    })
                    .collect()
            })
            .collect();
        let mut active = [0; MAX_SPELLS];
        for (i, n) in c.raw["researchState"]["active"]
            .as_array()
            .unwrap()
            .iter()
            .enumerate()
            .take(MAX_SPELLS)
        {
            active[i] = n.as_u64().unwrap_or(0) as u8;
        }
        let state = State {
            p,
            active,
            insight: num(&c.raw["researchState"], "insight"),
            last_source: num(&c.raw["researchState"], "lastSourceCode") as u8,
        };
        let objective = word(&c.raw["config"], "objective");
        let o = &c.raw["config"]["objectives"][objective];
        let weights = array(&o["weights"]);
        let scale = [
            100.,
            num(&c.raw["player"], "capacity").max(1.),
            100.,
            c.entry[3].max(10.),
            100.,
            100.,
        ];
        let skills = c.raw["player"]["skills"]
            .as_object()
            .unwrap()
            .iter()
            .map(|(k, v)| (k.clone(), v.as_f64().unwrap()))
            .collect();
        let capacity = num(&c.raw["player"], "capacity");
        let slack = num(o, "slack");
        let policy_variant = word(&c.raw["config"], "policyVariant").to_owned();
        let unlimited_mana = policy_variant == "hyper-frugal";
        (
            Self {
                c,
                tune,
                spec,
                extra,
                distributions,
                leaf_distributions,
                bonuses,
                weights,
                scale,
                slack,
                capacity,
                skills,
                policy_variant,
                unlimited_mana,
            },
            state,
        )
    }
    fn distribution(&self, current: Option<usize>) -> &[(usize, f64)] {
        &self.distributions[current.unwrap_or(0)]
    }
    fn active<'a>(&'a self, s: &State) -> impl Iterator<Item = &'a Spec> {
        let mask = s.active;
        self.spec
            .iter()
            .enumerate()
            .filter(move |(i, _)| mask[*i] > 0)
            .map(|(_, e)| e)
    }
    fn foresight(&self, s: &State) -> bool {
        self.active(s).any(|e| e.foresight)
    }
    fn signal(&self, s: &State, i: usize) -> f64 {
        let mut score = self.c.signal(&s.p, &self.c.cards[i]);
        for e in self.active(s) {
            if let Some(x) = self.skills.get(&e.swap) {
                score = score.max(*x);
            }
        }
        score
    }
    fn chance(&self, s: &State) -> f64 {
        let i = s.p.card.expect("argument");
        let c = &self.c.cards[i];

        match c.kind.as_str() {
            "gold" => {
                if s.p.resources[3] >= self.price(s, i) {
                    1.
                } else {
                    0.
                }
            }
            "health" => {
                if s.p.resources[2] >= c.amount {
                    1.
                } else {
                    0.
                }
            }
            "flag" | "spell" => {
                if c.gate || self.active(s).any(|e| e.waive_gate) {
                    1.
                } else {
                    0.
                }
            }
            _ => {
                if self.active(s).any(|e| e.force) {
                    return 1.;
                }
                let mut bonus = s.insight;
                for (index, e) in self.spec.iter().enumerate() {
                    if s.active[index] > 0 {
                        bonus += self.bonuses[index][i];
                        if s.last_source == self.extra[i].source {
                            bonus += e.repeat_source;
                        }
                    }
                }
                let fatigue = if self.active(s).any(|e| e.no_fatigue) {
                    0.
                } else {
                    number(&self.tune, "fatigue", 0.16)
                        * (1. - 2. * s.p.resolve / self.c.resolve_max).max(0.)
                };
                (number(&self.tune, "checkBase", 0.56)
                    + number(&self.tune, "checkSlope", 0.012)
                        * ((self.signal(s, i) - self.c.dc)
                            * number(&self.tune, "levelGapScale", 1.) - c.dc)
                    + bonus
                    - fatigue)
                    .clamp(0.05, 0.95)
            }
        }
    }
    fn price(&self, s: &State, i: usize) -> f64 {
        let discount = self
            .active(s)
            .map(|e| e.gold_discount)
            .fold(0., f64::max)
            .clamp(0., 1.);
        (self.c.cards[i].amount * (1. - discount)).ceil()
    }
    fn skip_cost(&self, s: &State) -> f64 {
        number(&self.tune, "skipResolve", 4.)
            * self
                .active(s)
                .filter_map(|e| e.deflect_resolve)
                .fold(1., f64::min)
    }
    fn risk(&self, s: &State) -> f64 {
        (number(&self.tune, "skipRiskBase", 0.10)
            + number(&self.tune, "skipRiskStep", 0.12) * s.p.bypasses as f64)
            .min(0.90)
            * self
                .active(s)
                .filter_map(|e| e.deflect_risk)
                .product::<f64>()
    }
    fn legal(&self, s: &State) -> Vec<usize> {
        if s.p.result != 0 {
            return vec![];
        }
        let payment = s.p.card.is_some_and(|i| {
            let card = &self.c.cards[i];
            (card.kind == "gold" && self.price(s, i) > 0.)
                || (card.kind == "health" && card.amount > 0.)
        });
        // Diagnostic policies use the same planner and public information.
        // Only permissions and the deliberately compulsory payment rule differ.
        if self.policy_variant == "dumb" && payment && self.chance(s) == 1. {
            return vec![FACE];
        }
        let no_payments = self.policy_variant == "hyper-frugal" || self.policy_variant == "ignorant";
        let mut out = if no_payments && payment { vec![] } else { vec![FACE] };
        if s.p.resolve > 0. && s.p.resolve >= self.skip_cost(s) {
            out.push(DEFLECT);
        }
        if !s.p.cast && self.policy_variant != "dumb" && self.policy_variant != "ignorant" {
            for (i, e) in self.spec.iter().enumerate() {
                if (self.unlimited_mana || s.p.resources[1] >= e.mana)
                    && s.p.resources[2] >= e.health
                    && (!no_payments || e.health <= 0.)
                    && (e.renown <= 0. || s.p.resources[4] >= e.renown)
                    && s.p.resolve >= e.resolve
                {
                    out.push(i + 3);
                }
            }
        }
        out.push(WITHDRAW);
        out
    }
    fn finish(&self, s: &mut State, result: u8, reason: &'static str) {
        if s.p.result != 0 {
            return;
        }
        s.p.result = result;
        s.p.reason = reason;
        s.p.resolve_loss = self.c.resolve_max - s.p.resolve;
        s.p.mood_hit = (self.c.entry[0] * number(&self.tune, "moodStake", 0.35) * s.p.resolve_loss
            / self.c.resolve_max)
            .ceil()
            .min(self.c.entry[0]);
        let hit = s.p.mood_hit;
        debit(&mut s.p, 0, hit);
        s.p.before = s.p.resources;
        for i in 0..6 {
            s.p.rebates[i] =
                ((self.c.entry[i] - s.p.resources[i]).max(0.) * self.c.rebates[i]).floor();
            s.p.resources[i] += s.p.rebates[i];
        }
    }
    fn close(&self, s: &mut State) {
        if s.p.suspicion >= self.c.suspicion {
            self.finish(s, 3, "Suspicion reached its limit");
        } else if s.p.agreement >= self.c.target {
            self.finish(s, 1, "Agreement reached");
        } else if s.p.patience <= 0. || s.p.round > 40 {
            self.finish(
                s,
                if s.p.agreement >= self.c.target / 2. {
                    2
                } else {
                    3
                },
                "Patience ran out",
            );
        }
    }
    fn step(&self, input: &State, a: usize, event: bool, log: bool) -> (State, Vec<String>) {
        let mut s = *input;
        let mut events = vec![];
        if a == WITHDRAW {
            self.finish(&mut s, 3, "You withdrew");
            return (s, events);
        }
        if a >= 3 {
            let i = a - 3;
            let e = &self.spec[i];
            let sp = &self.c.spells[i];
            if self.unlimited_mana {
                // Record the canonical bill without depleting the diagnostic
                // budget. This is an upper bound, not a zero-price spell rule.
                s.p.spent[1] += e.mana;
            } else {
                debit(&mut s.p, 1, e.mana);
            }
            debit(&mut s.p, 2, e.health);
            debit(&mut s.p, 4, e.renown);
            s.p.resolve = (s.p.resolve - e.resolve).max(0.);
            s.p.patience -= e.patience;
            s.p.suspicion = (s.p.suspicion
                + if e.suspicion > 0. {
                    e.suspicion * number(&self.tune, "spellSuspicion", 1.)
                } else {
                    e.suspicion
                })
            .max(0.);
            s.p.cast = true;
            if sp.alignment > 0. {
                s.p.resources[5] = (s.p.resources[5] - sp.alignment).max(-100.);
                s.p.spent[5] += sp.alignment;
            }
            s.p.resolve = (s.p.resolve + e.restore_resolve).min(self.c.resolve_max);
            s.p.patience = (s.p.patience + e.restore_patience).min(self.c.patience);
            // Recovery repays expenditure inside this encounter. Entering
            // depleted must not become a way to farm Mana by withdrawing.
            let mana = (s.p.resources[1] + e.restore_mana).min(self.c.entry[1].min(self.capacity));
            s.p.gained[1] += mana - s.p.resources[1];
            s.p.resources[1] = mana;
            s.active[i] = e.duration;
            if log {
                events.push(format!(
                    "{}: −{} Mana, −{} Health, −{} Renown; Suspicion {}.",
                    sp.name, e.mana, e.health, e.renown, s.p.suspicion
                ));
            }
            if e.fail {
                self.finish(
                    &mut s,
                    3,
                    "The papers catch fire. ‘I agree: you should leave.’",
                );
                return (s, events);
            }
            self.close(&mut s);
            return (s, events);
        }
        let i = s.p.card.unwrap();
        let c = &self.c.cards[i];
        let x = &self.extra[i];
        let active = self.active(&s).collect::<Vec<_>>();
        let resolve_shield: f64 = active.iter().map(|e| e.resolve_shield).sum();
        let suspicion_shield: f64 = active.iter().map(|e| e.suspicion_shield).sum();
        let patience_shield: f64 = active.iter().map(|e| e.patience_shield).sum();
        let response_patience: f64 = active.iter().map(|e| e.response_patience).sum();
        let mut insight = 0.;
        if a == FACE {
            if event {
                if c.kind == "gold" {
                    let price = self.price(&s, i);
                    debit(&mut s.p, 3, price);
                }
                if c.kind == "health" {
                    debit(&mut s.p, 2, c.amount);
                }
                s.p.agreement += 1.;
                let multiplier = active
                    .iter()
                    .map(|e| e.success_multiplier)
                    .fold(1., f64::max);
                s.p.resolve = (s.p.resolve
                    + x.success_resolve * multiplier
                    + active.iter().map(|e| e.success_resolve).sum::<f64>())
                .min(self.c.resolve_max);
                let trace = if c.kind == "gold" && !active.iter().any(|e| e.conceal_gold) {
                    number(&self.tune, "goldTrace", 0.)
                } else {
                    0.
                };
                s.p.suspicion = (s.p.suspicion + trace - x.success_suspicion * multiplier).max(0.);
                s.p.patience =
                    (s.p.patience + x.success_patience * multiplier).min(self.c.patience);
                if log {
                    events.push("Accepted: +1 Agreement; presentation benefits applied.".into());
                }
            } else {
                let hit = (c.resolve + active.iter().map(|e| e.reject_resolve).sum::<f64>()
                    - resolve_shield)
                    .max(0.);
                let suspicion = (c.suspicion
                    + active.iter().map(|e| e.reject_suspicion).sum::<f64>()
                    - suspicion_shield)
                    .max(0.);
                s.p.resolve = (s.p.resolve - hit).max(0.);
                s.p.suspicion += suspicion;
                s.p.patience -= (c.patience - patience_shield).max(0.);
                debit(
                    &mut s.p,
                    4,
                    x.reject_renown + active.iter().map(|e| e.reject_renown).sum::<f64>(),
                );
                insight = active.iter().map(|e| e.after_failure).fold(0., f64::max);
                if log {
                    events.push(format!(
                        "Rejected: −{} Resolve, +{} Suspicion.",
                        hit, suspicion
                    ));
                }
            }
        } else {
            let cost = self.skip_cost(&s);
            s.p.resolve = (s.p.resolve - cost).max(0.);
            if event {
                s.p.suspicion += 1.;
            }
            s.p.patience -= (number(&self.tune, "skipPatience", 2.)
                + x.deflect_patience
                + active.iter().map(|e| e.deflect_patience).sum::<f64>()
                - patience_shield)
                .max(1.);
            s.p.bypasses += 1;
            if log {
                events.push(format!(
                    "Deflected: −{} Resolve{}.",
                    cost,
                    if event { ", +1 Suspicion" } else { "" }
                ));
            }
        }
        s.p.patience -= response_patience;
        s.p.resolve = (s.p.resolve - number(&self.tune, "resolveEffort", 0.)).max(0.);
        s.insight = insight;
        s.last_source = x.source;
        s.p.round += 1;
        s.p.cast = false;
        for d in &mut s.active {
            *d = d.saturating_sub(1);
        }
        self.close(&mut s);
        if s.p.result == 0 {
            s.p.card = None;
        }
        (s, events)
    }
    fn costs(&self, s: &State) -> [f64; 6] {
        let mut t = *s;
        if t.p.result == 0 {
            self.finish(&mut t, 3, "evaluation only");
        }
        std::array::from_fn(|i| (self.c.entry[i] - t.p.resources[i]).max(0.) / self.scale[i])
    }
    fn evaluate(&self, s: &State) -> ValueScore {
        let cost = self.costs(s);
        if s.p.result != 0 {
            return ValueScore {
                win: if s.p.result == 1 { 1. } else { 0. },
                partial: if s.p.result == 2 { 1. } else { 0. },
                cost,
            };
        }
        let (mut p, mut suspicion, mut patience) = (0., 0., 0.);
        for &(i, w) in &self.leaf_distributions[s.p.card.unwrap_or(0)] {
            let mut t = *s;
            t.p.card = Some(i);
            let cp = self.chance(&t);
            p += w * cp;
            suspicion += w * (1. - cp) * self.c.cards[i].suspicion;
            patience += w * (1. - cp) * self.c.cards[i].patience;
        }
        let prob = if s.p.card.is_some() {
            0.45 * self.chance(s) + 0.55 * p
        } else {
            p
        };
        let failure_budget = (s.p.patience / (patience / (1. - p).max(0.001)).max(0.7))
            .min((self.c.suspicion - s.p.suspicion) / (suspicion / (1. - p).max(0.001)).max(0.7))
            .max(0.);
        let whole = failure_budget.floor() as i32;
        let fraction = failure_budget - whole as f64;
        let estimate = |need: i32| {
            race(prob, need, whole) * (1. - fraction) + race(prob, need, whole + 1) * fraction
        };
        let win = estimate((self.c.target - s.p.agreement).ceil() as i32);
        let half = estimate((self.c.target / 2. - s.p.agreement).ceil() as i32);
        ValueScore {
            win,
            partial: (half - win).max(0.) * 0.5,
            cost,
        }
    }
    fn utility(&self, v: ValueScore) -> f64 {
        v.win
            + if self.slack == 0. {
                0.000001 * v.partial
            } else {
                0.02 * v.partial
            }
            - v.cost
                .iter()
                .zip(self.weights)
                .map(|(c, w)| c * w)
                .sum::<f64>()
    }
    fn choose(&self, scores: &[(usize, ValueScore)]) -> (usize, ValueScore) {
        let max_win = scores.iter().map(|(_, v)| v.win).fold(-1., f64::max);
        let compare = |a: f64, b: f64| {
            if (a - b).abs() < 1e-10 {
                std::cmp::Ordering::Equal
            } else {
                a.total_cmp(&b)
            }
        };
        *scores
            .iter()
            .filter(|(_, v)| v.win >= max_win - self.slack - 1e-12)
            .max_by(|a, b| {
                compare(self.utility(a.1), self.utility(b.1))
                    .then_with(|| compare(a.1.win, b.1.win))
                    .then_with(|| compare(b.1.cost.iter().sum(), a.1.cost.iter().sum()))
                    .then_with(|| self.c.name(b.0).cmp(self.c.name(a.0)))
            })
            .unwrap()
    }
    fn immediate(&self, s: &State, a: usize) -> ValueScore {
        let p = if a == FACE {
            self.chance(s)
        } else if a == DEFLECT {
            self.risk(s)
        } else {
            1.
        };
        let mut v = ValueScore::default();
        v.add(self.evaluate(&self.step(s, a, true, false).0), p);
        v.add(self.evaluate(&self.step(s, a, false, false).0), 1. - p);
        v
    }
    fn serialize(&self, s: &State, events: Vec<String>) -> Value {
        let mut p = s.p;
        p.effects = Effects {
            foresight: self
                .spec
                .iter()
                .enumerate()
                .filter(|(_, e)| e.foresight)
                .map(|(i, _)| s.active[i] as i32)
                .max()
                .unwrap_or(0),
            candour: -100,
            ..Default::default()
        };
        let mut raw = self.c.serialize(&p, events);
        raw["researchState"] =
            json!({"active":s.active.to_vec(),"insight":s.insight,"lastSourceCode":s.last_source});
        raw
    }
    fn score_json(&self, a: usize, v: ValueScore, depth: i32) -> Value {
        json!({"id":self.c.name(a),"value":self.utility(v),"winEstimate":v.win,"partialEstimate":v.partial,"netCostFractions":object(v.cost),"depth":depth})
    }
    fn key(&self, s: &State, d: i32) -> Vec<u64> {
        let mut k = vec![
            d as u64,
            s.p.card.map_or(u64::MAX, |i| i as u64),
            // At a one-response horizon the race leaf ignores the next
            // argument. Different peeks therefore have identical values.
            if d > 1 { s.p.pending.map_or(u64::MAX, |i| i as u64) } else { u64::MAX },
            s.p.round as u64,
            s.p.cast as u64,
            s.p.bypasses as u64,
            s.last_source as u64,
        ];
        for v in [
            s.p.agreement,
            s.p.patience,
            s.p.resolve,
            s.p.suspicion,
            s.insight,
        ]
        .iter()
        .chain(s.p.resources.iter())
        {
            k.push(v.to_bits());
        }
        for chunk in s.active.chunks(8) {
            k.push(
                chunk
                    .iter()
                    .enumerate()
                    .map(|(i, &v)| (v as u64) << (i * 8))
                    .sum(),
            );
        }
        k
    }
}
struct Tree<'a> {
    g: &'a Game,
    nodes: usize,
    limit: usize,
    deadline: f64,
    samples: usize,
    exact: bool,
    beam: usize,
    leaves: usize,
    cache: HashMap<Vec<u64>, ValueScore>,
}
impl Tree<'_> {
    fn check(&mut self) -> Result<(), ()> {
        if self.nodes >= self.limit || clock() >= self.deadline {
            return Err(());
        }
        self.nodes += 1;
        Ok(())
    }
    fn draws(&self, current: Option<usize>, seed: u32) -> Vec<(usize, f64)> {
        let d = self.g.distribution(current);
        if self.exact {
            d.to_vec()
        } else {
            sampled(d, self.samples, seed)
        }
    }
    fn value(&mut self, s: &State, d: i32) -> Result<ValueScore, ()> {
        self.check()?;
        if s.p.result != 0 {
            return Ok(self.g.evaluate(s));
        }
        if d == 0 {
            self.leaves += 1;
            return Ok(self.g.evaluate(s));
        }
        let k = self.g.key(s, d);
        if let Some(v) = self.cache.get(&k) {
            return Ok(*v);
        }
        let mut order = self
            .g
            .legal(s)
            .into_iter()
            .map(|a| (a, self.g.immediate(s, a)))
            .collect::<Vec<_>>();
        order.sort_by(|a, b| {
            self.g
                .utility(b.1)
                .total_cmp(&self.g.utility(a.1))
                .then_with(|| self.g.c.name(a.0).cmp(self.g.c.name(b.0)))
        });
        if self.beam > 0 {
            order.truncate(self.beam.max(2));
        }
        let mut values = vec![];
        for (a, _) in order {
            values.push((a, self.action(s, a, d)?));
        }
        let v = self.g.choose(&values).1;
        self.cache.insert(k, v);
        Ok(v)
    }
    fn action(&mut self, s: &State, a: usize, d: i32) -> Result<ValueScore, ()> {
        self.check()?;
        let p = if a == FACE {
            self.g.chance(s)
        } else if a == DEFLECT {
            self.g.risk(s)
        } else {
            1.
        };
        let mut v = ValueScore::default();
        let seed = hash(&format!(
            "{}:{}:{}",
            s.p.round,
            self.g.c.cards[s.p.card.unwrap()].id,
            self.g.c.pool
        ));
        for (event, w) in [(true, p), (false, 1. - p)] {
            if w == 0. {
                continue;
            }
            let (t, _) = self.g.step(s, a, event, false);
            if t.p.result != 0 {
                v.add(self.g.evaluate(&t), w);
                continue;
            }
            if a >= 3 {
                if self.g.foresight(&t) && s.p.pending.is_none() && d > 1 {
                    for (i, q) in self.draws(s.p.card, seed) {
                        let mut b = t;
                        b.p.pending = Some(i);
                        v.add(self.value(&b, d)?, w * q);
                    }
                } else {
                    v.add(self.value(&t, d)?, w);
                }
                continue;
            }
            if d == 1 {
                let mut b = t;
                b.p.pending = None;
                v.add(self.value(&b, 0)?, w);
                continue;
            }
            let draws = if let Some(i) = s.p.pending {
                vec![(i, 1.)]
            } else {
                self.draws(s.p.card, seed)
            };
            for (i, q) in draws {
                let mut b = t;
                b.p.card = Some(i);
                if self.g.foresight(&b) && d > 2 {
                    for (j, r) in self.draws(b.p.card, seed.wrapping_add(17)) {
                        let mut peek = b;
                        peek.p.pending = Some(j);
                        v.add(self.value(&peek, d - 1)?, w * q * r);
                    }
                } else {
                    b.p.pending = None;
                    v.add(self.value(&b, d - 1)?, w * q);
                }
            }
        }
        Ok(v)
    }
}
fn search(g: &Game, input: &State, o: &Value) -> Value {
    let mut s = *input;
    if !g.foresight(&s) {
        s.p.pending = None;
    }
    let started = clock();
    let budget = number(o, "budgetMs", 50.).clamp(1., 50.);
    let mut tree = Tree {
        g,
        nodes: 0,
        limit: number(o, "nodeBudget", 50000.) as usize,
        deadline: if flag(o, "fixedNodes") {
            f64::INFINITY
        } else {
            started + (budget - 3.).max(0.5)
        },
        samples: number(o, "samples", 3.).max(1.) as usize,
        exact: flag(o, "exact"),
        beam: number(o, "beam", 0.) as usize,
        leaves: 0,
        cache: HashMap::new(),
    };
    let mut values = g
        .legal(&s)
        .iter()
        .map(|&a| {
            let (t, _) = g.step(&s, a, true, false);
            let v = if a >= 3 && t.p.result == 0 {
                g.choose(
                    &g.legal(&t)
                        .iter()
                        .map(|&b| (b, g.immediate(&t, b)))
                        .collect::<Vec<_>>(),
                )
                .1
            } else {
                g.immediate(&s, a)
            };
            (a, v)
        })
        .collect::<Vec<_>>();
    let mut depth = 0;
    let mut best = g.choose(&values);
    let mut leaves = 0;
    for d in 1..=number(o, "depth", 3.) as i32 {
        tree.leaves = 0;
        let iteration = (|| {
            let mut out = vec![];
            for &(a, _) in &values {
                out.push((a, tree.action(&s, a, d)?));
            }
            Ok::<_, ()>(out)
        })();
        match iteration {
            Ok(v) => {
                values = v;
                best = g.choose(&values);
                depth = d;
                leaves = tree.leaves;
            }
            Err(_) => break,
        }
    }
    let mut out = g.score_json(best.0, best.1, depth);
    out["scores"] = json!(values
        .iter()
        .map(|&(a, v)| g.score_json(a, v, depth))
        .collect::<Vec<_>>());
    out["algorithm"] = json!("resource-aware Rust expectimax");
    out["elapsedMs"] = json!(clock() - started);
    out["nodes"] = json!(tree.nodes);
    out["heuristicLeaves"] = json!(leaves);
    out["cacheEntries"] = json!(tree.cache.len());
    out["objective"] = g.c.raw["config"]["objective"].clone();
    out
}
fn apply(
    g: &Game,
    input: &State,
    a: usize,
    event: Option<bool>,
    log: bool,
) -> (State, Value, Vec<String>) {
    let mut s = *input;
    let p = if a == FACE {
        Some(g.chance(&s))
    } else if a == DEFLECT {
        Some(g.risk(&s))
    } else {
        None
    };
    let mut u = None;
    let event = event.unwrap_or_else(|| {
        if let Some(p) = p {
            if p > 0. && p < 1. {
                u = Some(roll(&mut s.p.check_rng));
            }
            p == 1. || u.is_some_and(|u| u < p)
        } else {
            false
        }
    });
    let (mut t, events) = g.step(&s, a, event, log);
    if t.p.result == 0 && a < 3 {
        t.p.card = s.p.pending;
        let mut u = roll(&mut t.p.card_rng);
        let dist = g.distribution(t.p.card);
        t.p.pending = dist.last().map(|x| x.0);
        for &(i, p) in dist {
            u -= p;
            if u <= 0. {
                t.p.pending = Some(i);
                break;
            }
        }
    }
    let history = json!({"round":s.p.round,"card":g.c.cards[s.p.card.unwrap()].id,"action":g.c.name(a),"p":p,"roll":u,"event":event,"agreement":t.p.agreement,"patience":t.p.patience,"resolve":t.p.resolve,"suspicion":t.p.suspicion,"resources":object(t.p.resources),"events":events});
    (t, history, events)
}
pub(super) fn execute(v: Value, schema: &Value) -> Value {
    let (g, s) = Game::parse(v["state"].clone(), schema);
    match word(&v, "op") {
        "chance" => json!(g.chance(&s)),
        "legal" | "candidates" => {
            json!(g.legal(&s).iter().map(|&a| g.c.name(a)).collect::<Vec<_>>())
        }
        "evaluate" => {
            let e = g.evaluate(&s);
            json!({"value":g.utility(e),"winEstimate":e.win,"cost":object(e.cost)})
        }
        "search" => search(&g, &s, &v["options"]),
        "replay" => {
            // Parse the public pool once for an entire verification tape.
            let mut t = s;
            let mut history = vec![];
            let mut last_events = vec![];
            for id in v["tape"].as_array().unwrap() {
                let Some(a) = g.c.action(id.as_str().unwrap_or("")) else {
                    return json!({"error":"Unknown replay action"});
                };
                if !g.legal(&t).contains(&a) {
                    return json!({"error":"Illegal replay action"});
                }
                let (next, h, events) = apply(&g, &t, a, None, true);
                history.push(h);
                t = next;
                last_events = events;
            }
            let mut state = g.serialize(&t, last_events);
            state["history"] = json!(history);
            state
        }
        "project" | "apply" => {
            let Some(a) = g.c.action(word(&v, "id")) else {
                return json!({"error":"Unknown action"});
            };
            if !g.legal(&s).contains(&a) {
                return json!({"error":"Illegal action"});
            }
            let is_apply = word(&v, "op") == "apply";
            let (t, h, events) = if is_apply {
                apply(&g, &s, a, None, true)
            } else {
                let (t, e) = g.step(&s, a, flag(&v, "event"), true);
                (t, Value::Null, e)
            };
            let mut out = g.serialize(&t, events);
            if is_apply {
                let mut history = g.c.raw["history"].as_array().unwrap().clone();
                history.push(h);
                out["history"] = json!(history);
            }
            out
        }
        "simulate" => {
            let mut t = s;
            let mut history = vec![];
            let mut decisions = vec![];
            let mut last_events = vec![];
            let mut depths = std::collections::BTreeMap::<u64, usize>::new();
            let (mut searched, mut nodes, mut elapsed_ms, mut max_ms) = (0, 0, 0.0_f64, 0.0_f64);
            for _ in 0..160 {
                if t.p.result != 0 {
                    break;
                }
                let decision = if word(&v["options"], "policy") == "face" {
                    json!({"id":"face"})
                } else {
                    search(&g, &t, &v["options"])
                };
                let a = g.c.action(word(&decision, "id")).unwrap();
                if let Some(depth) = decision["depth"].as_u64() {
                    *depths.entry(depth).or_default() += 1;
                    searched += 1;
                    nodes += decision["nodes"].as_u64().unwrap_or(0);
                    let ms = num(&decision, "elapsedMs");
                    elapsed_ms += ms;
                    max_ms = max_ms.max(ms);
                }
                let (next, h, events) = apply(&g, &t, a, None, true);
                history.push(h);
                if flag(&v["options"], "trace") {
                    decisions.push(json!({"round":t.p.round,"card":g.c.cards[t.p.card.unwrap()].id,"agreement":t.p.agreement,"resolve":t.p.resolve,"patience":t.p.patience,"suspicion":t.p.suspicion,"castUsed":t.p.cast,"chance":g.chance(&t),"choice":decision}));
                }
                t = next;
                last_events = events;
            }
            let mut state = g.serialize(&t, last_events);
            state["history"] = json!(history);
            json!({"state":state,"decisions":decisions,"terminated":t.p.result!=0,
                "searchStats":{"decisions":searched,"depths":depths,"nodes":nodes,"elapsedMs":elapsed_ms,"maxMs":max_ms}})
        }
        _ => json!({"error":"Unsupported research operation"}),
    }
}
