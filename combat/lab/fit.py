"""Fit evals and a reply table from combat-lab samples (combat/tools/lab.mjs sample). Lab only, not part of the game.
   python3 combat/lab/fit.py --samples combat/out/lab/r0.jsonl[,more] --out combat/out/lab/fit-r0.json [--device mps]
Linear: Texel (logistic on outcomes, IRLS) and Distill (ridge on deep search values), both pulled toward the hand weights.
MLP: one hidden layer, antisymmetric (v(x, s) = scale · (g(x, s) − g(−x, s)) / 2, so swapping the fighters negates the score),
trained on deep values (MLPd) or on outcomes (MLPt). Reply table: how often each reply was the deep best answer to a move.
Held-out metrics are on every fifth game."""
import argparse, json, math, time
import numpy as np
import torch

ap = argparse.ArgumentParser()
ap.add_argument('--samples', required=True)
ap.add_argument('--out', required=True)
ap.add_argument('--device', default='mps' if torch.backends.mps.is_available() else 'cpu')
ap.add_argument('--ridge', type=float, default=1e-2)
ap.add_argument('--epochs', type=int, default=400)
a = ap.parse_args()

F, S, DEEP, Y, TEST, REPLIES = [], [], [], [], [], []
gi = 0
for path in a.samples.split(','):
    for line in open(path):
        g = json.loads(line)
        for p in g['positions']:
            F.append(p['f']); S.append(p['sym']); DEEP.append(p['deep'] if p['deep'] is not None else np.nan); Y.append(g['outcome']); TEST.append(gi % 5 == 0)
            if p.get('reply'): REPLIES.append(p['reply'])
        gi += 1
F, S, DEEP, Y, TEST = np.array(F), np.array(S), np.array(DEEP), np.array(Y), np.array(TEST)
NF = F.shape[1]
base = np.array([1.0] * 12 + [0.0] * (NF - 12))
tr, te = ~TEST, TEST
ok = ~np.isnan(DEEP) & (np.abs(DEEP) < 5000)
sig = lambda x: 1 / (1 + np.exp(-x))
def logloss(v, k, m): p = np.clip(sig(v[m] / k), 1e-9, 1 - 1e-9); return float(-np.mean(Y[m] * np.log(p) + (1 - Y[m]) * np.log(1 - p)))
def rms(v, m): m = m & ok; return float(np.sqrt(np.mean((v[m] - DEEP[m]) ** 2)))
hand = F @ base
k = min(range(10, 400, 2), key=lambda x: logloss(hand, x, tr))
print(f'{len(F)} positions from {gi} games ({te.sum()} held out); k = {k}')

# Linear Texel by IRLS, ridge toward the hand weights.
diag = (F[tr] ** 2).mean(0) / k ** 2 / 4 + 1e-6
w = base.copy()
for _ in range(25):
    z = F[tr] @ w / k; p = sig(z); q = p * (1 - p)
    H = (F[tr] * q[:, None]).T @ F[tr] / k ** 2 / tr.sum() + np.diag(a.ridge * diag)
    g = F[tr].T @ (p - Y[tr]) / k / tr.sum() + a.ridge * diag * (w - base)
    w = w - np.linalg.solve(H, g)
texel = w
# Linear Distill: ridge regression on deep values.
m = tr & ok
A = F[m].T @ F[m]; lam = a.ridge * np.diag(A) + 1e-6
distill = np.linalg.solve(A + np.diag(lam), F[m].T @ DEEP[m] + lam * base)

# MLPs on the GPU (MPS).
dev = torch.device(a.device)
xs = np.sqrt((F[tr] ** 2).mean(0)); xs[xs < 1e-9] = 1.0
sm, ss = S[tr].mean(0), S[tr].std(0); ss[ss < 1e-9] = 1.0
X = torch.tensor(F / xs, dtype=torch.float32, device=dev); Sx = torch.tensor((S - sm) / ss, dtype=torch.float32, device=dev)
scale = float(np.std(DEEP[m]))
class Net(torch.nn.Module):
    def __init__(s, h): super().__init__(); s.l1 = torch.nn.Linear(NF + S.shape[1], h); s.l2 = torch.nn.Linear(h, 1, bias=False)
    def g(s, x, sym): return s.l2(torch.relu(s.l1(torch.cat([x, sym], 1)))).squeeze(1)
    def forward(s, x, sym): return (s.g(x, sym) - s.g(-x, sym)) / 2  # in units of `scale`
def train(h, target):
    torch.manual_seed(1)
    net = Net(h).to(dev); opt = torch.optim.Adam(net.parameters(), lr=3e-3, weight_decay=1e-5)
    idx = np.where(tr & ok)[0] if target == 'deep' else np.where(tr)[0]
    tidx = np.where(te & ok)[0] if target == 'deep' else np.where(te)[0]
    yd = torch.tensor(np.nan_to_num(DEEP) / scale, dtype=torch.float32, device=dev); yo = torch.tensor(Y, dtype=torch.float32, device=dev)
    def loss(ii):
        v = net(X[ii], Sx[ii])
        return torch.nn.functional.huber_loss(v, yd[ii], delta=1.0) if target == 'deep' else torch.nn.functional.binary_cross_entropy_with_logits(v * scale / k, yo[ii])
    best, best_state, ti = math.inf, None, torch.tensor(tidx, device=dev)
    for ep in range(a.epochs):
        perm = torch.tensor(np.random.default_rng(ep).permutation(idx), device=dev)
        for b in range(0, len(perm), 512):
            opt.zero_grad(); l = loss(perm[b:b + 512]); l.backward(); opt.step()
        if ep % 10 == 9:
            with torch.no_grad(): vl = float(loss(ti))
            if vl < best: best, best_state = vl, {k_: v_.detach().clone() for k_, v_ in net.state_dict().items()}
    net.load_state_dict(best_state)
    with torch.no_grad(): v = (net(X, Sx) * scale).cpu().numpy()
    W1 = net.l1.weight.detach().cpu().numpy(); b1 = net.l1.bias.detach().cpu().numpy(); w2 = net.l2.weight.detach().cpu().numpy()[0]
    return v, {'h': h, 'xs': xs.tolist(), 'sm': sm.tolist(), 'ss': ss.tolist(), 'w1': W1.reshape(-1).tolist(), 'b1': b1.tolist(), 'w2': w2.tolist(), 'scale': scale}

out = {'k': k, 'texel': texel.tolist(), 'distill': distill.tolist()}
rows = [('hand', hand), ('Texel', F @ texel), ('Distill', F @ distill)]
for h in (16, 32):
    for target, name in (('deep', 'MLPd'), ('outcome', 'MLPt')):
        t0 = time.time(); v, net = train(h, target); out[f'{name}{h}'] = net
        rows.append((f'{name}{h}', v)); print(f'  trained {name}{h} on {a.device} in {time.time() - t0:.0f} s')
print('| eval | held-out outcome log-loss | held-out RMS vs deep value |\n|---|---:|---:|')
for name, v in rows: print(f'| {name} | {logloss(v, k, te):.4f} | {rms(v, te):.1f} |')

# Reply table: share of times each reply was the deep best answer to a telegraphed move.
counts = {}
for p, r in REPLIES: counts.setdefault(p, {}).setdefault(r, 0); counts[p][r] += 1
out['reply'] = {p: {r: c / sum(row.values()) for r, c in row.items()} for p, row in counts.items()}
print(f'reply table: {len(REPLIES)} pairs over {len(counts)} telegraphed moves')
json.dump(out, open(a.out, 'w'))
