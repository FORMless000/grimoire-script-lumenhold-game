'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const E = require('./experiments.js');
const C = require('./catalog.js');
const U = require('./util.js');

const DECISIONS = ['accept', 'revise', 'reject', 'uncertain'];
const DIMENSIONS = ['voice', 'choices', 'novelty', 'continuity'];
function state(dir) {
  const m = E.load(dir);
  const cards = Object.entries(m.mapping).map(([label, id]) => {
    const run = E.trial(m, id), file = path.join(dir, 'artifacts', id, 'frozen.json'), judgment = m.judgments[label] || {};
    const artifact = fs.existsSync(file) ? U.readJSON(file) : null;
    const out = { label, task: run.task, prompt: run.prompt, category: run.category, sources: artifact?.sources.map((s) => ({ path: s.path, text: s.text })) || [], frozen: !!artifact, failure: run.failure || null, judgment };
    // Never send opinions or validators before this presentation's independent initial assessment.
    if (judgment.initial) { out.findings = E.groups(m, id); out.validation = run.validation || null; }
    if (m.locked) out.identity = { workflow: run.backend, profile: run.profile, model: run.model, repeat: run.repeat };
    return out;
  });
  const pairs = [];
  const primary = new Map();
  for (const [label, id] of Object.entries(m.mapping)) if (!primary.has(id)) primary.set(id, label);
  for (let i = 0; i < m.trials.length; i++) for (let j = i + 1; j < m.trials.length; j++) {
    const a = m.trials[i], b = m.trials[j];
    if (a.task !== b.task || a.repeat !== b.repeat || a.backend === b.backend && a.profile === b.profile) continue;
    const labels = [primary.get(a.id), primary.get(b.id)];
    if (parseInt(U.hash([m.seed, ...labels]).slice(0, 2), 16) % 2) labels.reverse();
    const key = U.hash(labels).slice(0, 16);
    pairs.push({ key, labels, verdict: m.pairs[key] || null, panel: labels.every((l) => m.judgments[l]?.initial) ? (m.panelResults || []).filter((r) => r.pair === key).map((r) => ({ judge: U.hash([r.model, r.workflowHash]).slice(0, 12), preference: r.preference })) : [] });
  }
  return { locked: m.locked, cards, pairs, adoption: m.adoption, report: m.locked ? E.report(dir) : null };
}
function judge(dir, label, action, data) {
  const m = E.load(dir), id = m.mapping[label];
  if (!id) throw new Error('Unknown blind label');
  if (m.locked) throw new Error('Judgments are locked; retain this experiment and start a new review version.');
  const r = E.trial(m, id); if (r.state !== 'frozen') throw new Error('Artifact is not frozen');
  const j = m.judgments[label] || { history: [] };
  if (action === 'initial') {
    if (j.initial) throw new Error('Initial assessment is immutable; record later changes as adjudication notes.');
    if (!DECISIONS.includes(data.decision) || DIMENSIONS.some((k) => !Number.isInteger(data.ratings?.[k]) || data.ratings[k] < 1 || data.ratings[k] > 5)) throw new Error('Decision and four integer ratings from 1 to 5 are required');
    j.initial = { decision: data.decision, ratings: data.ratings, notes: String(data.notes || ''), at: new Date().toISOString() };
  } else if (action === 'adjudicate') {
    if (!j.initial) throw new Error('Assess the content independently first');
    const group = E.groups(m, id).find((g) => g.key === data.group);
    if (!group || !['valid', 'invalid', 'duplicate', 'preference', 'unresolved'].includes(data.status) || !data.reason) throw new Error('A finding group, adjudication status and reason are required');
    if (data.status === 'duplicate' && (!data.duplicateOf || data.duplicateOf === data.group || !E.groups(m, id).some((g) => g.key === data.duplicateOf))) throw new Error('Duplicate adjudication must point to another existing group');
    j.adjudications = j.adjudications || {};
    const value = { status: data.status, reason: String(data.reason), severity: data.severity === 'serious' ? 'serious' : 'minor', duplicateOf: data.duplicateOf || null, at: new Date().toISOString() };
    j.adjudications[data.group] = value;
  } else if (action === 'final') {
    if (!j.initial || !DECISIONS.includes(data.decision)) throw new Error('Initial assessment and a final decision are required');
    j.final = { decision: data.decision, notes: String(data.notes || ''), at: new Date().toISOString() };
  } else throw new Error('Unknown judgment action');
  j.history.push({ action, data, at: new Date().toISOString() }); m.judgments[label] = j; E.save(dir, m);
  return { saved: true };
}
function pair(dir, key, data) {
  const view = state(dir), p = view.pairs.find((p) => p.key === key), m = E.load(dir);
  if (m.locked || !p || !p.labels.every((l) => m.judgments[l]?.initial)) throw new Error('Assess both cards before paired comparison');
  if (![...p.labels, 'tie', 'both-unacceptable', 'uncertain'].includes(data.preference)) throw new Error('Invalid paired preference');
  m.pairs[key] = { preference: data.preference, labels: p.labels, notes: String(data.notes || ''), at: new Date().toISOString() }; E.save(dir, m);
  return { saved: true };
}
function humanFinding(dir, label, finding) {
  const m = E.load(dir), id = m.mapping[label], r = E.trial(m, id);
  if (!m.judgments[label]?.initial || m.locked) throw new Error('Record your independent initial assessment before adding a finding');
  const rubricHash = m.rubricHash;
  E.importCritic(dir, id, { model: 'human', family: 'human', harness: 'local-review', rubricHash, artifactHash: r.artifactHash, findings: [finding] });
  const group = E.groups(E.load(dir), id).find((g) => g.event === finding.event && g.branch === finding.branch && g.findings.some((f) => f.problem === finding.problem));
  return judge(dir, label, 'adjudicate', { group: group.key, status: 'valid', severity: finding.severity, reason: finding.problem });
}
function lock(dir) {
  const m = E.load(dir);
  if (Object.keys(m.mapping).some((label) => !m.judgments[label]?.initial)) throw new Error('Every trial presentation, including concealed repeats, requires your initial review');
  for (const [label, id] of Object.entries(m.mapping)) if (E.groups(m, id).some((g) => !m.judgments[label]?.adjudications?.[g.key])) throw new Error('Every critic finding must be adjudicated before identity reveal');
  if (state(dir).pairs.some((p) => !p.verdict)) throw new Error('Complete the matched paired comparisons before identity reveal');
  m.locked = true; E.save(dir, m); return { locked: true };
}
function adopt(dir, data) {
  const m = E.load(dir);
  if (!m.locked || m.phase !== 'confirmation') throw new Error('Adoption requires locked confirmation results');
  if (!data.reason || !m.trials.some((r) => r.backend === data.workflow)) throw new Error('Choose a tested workflow and record your reason');
  for (const [label, id] of Object.entries(m.mapping)) if (E.trial(m, id).backend === data.workflow) {
    if (E.trial(m, id).audit?.status !== 'verified') throw new Error('Selected workflow has unverified/violated confirmation trials');
    const validation = E.trial(m, id).validation;
    if (!validation || validation.exitCode !== 0 || validation.structuralIssues?.length) throw new Error('Selected workflow has unresolved validation failures');
    for (const g of E.groups(m, id)) { const a = m.judgments[label]?.adjudications?.[g.key]; if (!a || a.status === 'unresolved' || a.status === 'valid' && a.severity === 'serious') throw new Error('Resolve serious findings before adoption'); }
  }
  m.adoption = { workflow: data.workflow, reason: data.reason, by: 'human', at: new Date().toISOString() }; E.save(dir, m); return m.adoption;
}
function serve(dir, port = 0) {
  const page = fs.readFileSync(path.join(__dirname, 'review.html'));
  const server = http.createServer(async (req, res) => {
    const origin = req.headers.origin, host = req.headers.host;
    if (!/^127\.0\.0\.1:\d+$/.test(host || '') || origin && origin !== 'http://' + host) { res.writeHead(403); res.end('Loopback origin required'); return; }
    const reply = (data, code = 200) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(data)); };
    try {
      const url = new URL(req.url, 'http://' + host);
      if (req.method === 'GET' && url.pathname === '/') { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'" }); res.end(page); return; }
      if (req.method === 'GET' && url.pathname === '/client.js') { res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(fs.readFileSync(path.join(__dirname, 'review-client.js'))); return; }
      if (req.method === 'GET' && url.pathname === '/state') return reply(state(dir));
      if (req.method === 'GET' && url.pathname === '/source') {
        const m = E.load(dir), label = url.searchParams.get('label'), sourceRoot = label && m.mapping[label] ? path.join(dir, 'trials', m.mapping[label]) : path.join(dir, 'snapshot');
        let cat;
        try { cat = C.catalog(sourceRoot); } catch { cat = C.catalog(path.join(dir, 'snapshot')); }
        const r = C.resolve(cat, url.searchParams.get('key'));
        return reply({ key: r.key, sourceHash: r.sourceHash, file: r.file, line: r.line, metadata: r.metadata, text: r.text, snapshot: m.corpusHash });
      }
      if (req.method === 'GET' && url.pathname === '/export.json') { const m = E.load(dir); return reply(m.locked ? { state: state(dir), report: E.report(dir) } : state(dir)); }
      if (req.method === 'GET' && url.pathname === '/export.md') {
        const s = state(dir), json = (value) => '\n\n```json\n' + JSON.stringify(value, null, 2) + '\n```';
        res.writeHead(200, { 'Content-Type': 'text/markdown; charset=utf-8' });
        res.end('# Authoring review\n\n' + s.cards.map((c) => '## ' + c.label + '\n\n' + c.prompt + '\n\n' + c.sources.map((r) => '### ' + r.path + '\n\n```grim\n' + r.text + '\n```').join('\n\n') + json({ judgment: c.judgment, validation: c.validation, findings: c.findings, identity: c.identity })).join('\n\n') + '\n\n## Paired comparisons' + json(s.pairs) + (s.locked ? '\n\n## Report' + json(s.report) : ''));
        return;
      }
      if (req.method !== 'POST' || origin !== 'http://' + host) return reply({ error: 'Same-origin POST required' }, 403);
      let body = ''; for await (const chunk of req) { body += chunk; if (body.length > 1024 * 1024) throw new Error('Request too large'); }
      const data = JSON.parse(body);
      if (url.pathname === '/judge') return reply(judge(dir, data.label, data.action, data));
      if (url.pathname === '/finding') return reply(humanFinding(dir, data.label, data.finding));
      if (url.pathname === '/pair') return reply(pair(dir, data.key, data));
      if (url.pathname === '/lock') return reply(lock(dir));
      if (url.pathname === '/adopt') return reply(adopt(dir, data));
      reply({ error: 'Not found' }, 404);
    } catch (error) { reply({ error: error.message }, 400); }
  });
  server.listen(port, '127.0.0.1'); return server;
}
module.exports = { state, judge, pair, humanFinding, lock, adopt, serve };
