'use strict';
let data, current, lastSource;
const decisions = ['accept', 'revise', 'reject', 'uncertain'];
const dimensions = ['voice', 'choices', 'novelty', 'continuity'];
function el(tag, text, parent) {
  const node = document.createElement(tag);
  if (text != null) node.textContent = text;
  if (parent) parent.append(node);
  return node;
}
function error(e) { document.querySelector('#error').textContent = e.message; }
async function api(url, body) {
  const response = await fetch(url, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {});
  const value = await response.json();
  if (!response.ok) throw new Error(value.error);
  return value;
}
function button(parent, text, action, disabled = false) {
  const node = el('button', text, parent); node.disabled = disabled;
  node.onclick = () => Promise.resolve().then(action).catch(error);
  return node;
}
function select(parent, values, value) {
  const node = el('select', null, parent);
  for (const v of values) { const option = el('option', v, node); option.value = v; }
  if (value) node.value = value;
  return node;
}
function input(parent, title, area = false, value = '') {
  const label = el('label', title, parent), node = el(area ? 'textarea' : 'input', null, label);
  node.value = value; return node;
}
async function refresh() {
  data = await api('/state');
  document.querySelector('#progress').textContent = data.cards.filter((c) => c.judgment.initial).length + ' / ' + data.cards.length + ' assessed' + (data.locked ? ' · locked' : '');
  const nav = document.querySelector('#nav'); nav.replaceChildren();
  for (const card of data.cards) button(nav, card.label + (card.judgment.initial ? ' ✓' : ''), () => show(card.label));
  document.querySelector('#lock').disabled = data.locked;
  if (current) show(current); else if (data.cards.length) show(data.cards[0].label);
}
function source(parent, label) {
  const key = input(parent, 'Look up source by kind:id'), out = el('div', null, parent);
  button(parent, 'Read source', async () => {
    const result = await api('/source?label=' + encodeURIComponent(label) + '&key=' + encodeURIComponent(key.value));
    lastSource = result; out.replaceChildren();
    el('p', result.key + ' · ' + result.file + ':' + result.line + ' · ' + result.sourceHash, out);
    el('pre', result.text, out);
  });
}
function assessment(parent, card, initial) {
  const box = el('fieldset', null, parent); el('legend', initial ? 'Independent initial assessment' : 'Final assessment after evidence review', box);
  const saved = initial ? null : card.judgment.final || card.judgment.initial;
  const decision = select(box, decisions, saved?.decision), ratings = {};
  if (initial) {
    const row = el('div', null, box); row.className = 'ratings';
    for (const key of dimensions) ratings[key] = select(el('label', key + ' (1–5)', row), ['1', '2', '3', '4', '5'], '3');
  }
  const notes = input(box, initial ? 'Your findings and rationale, before seeing critics' : 'Notes after evidence review', true, saved?.notes || '');
  button(box, initial ? 'Save initial assessment' : 'Save final assessment', async () => {
    await api('/judge', { label: card.label, action: initial ? 'initial' : 'final', decision: decision.value, notes: notes.value,
      ratings: initial ? Object.fromEntries(dimensions.map((k) => [k, Number(ratings[k].value)])) : undefined });
    await refresh();
  }, data.locked);
}
function finding(parent, card) {
  const box = el('fieldset', null, parent); el('legend', 'Record your own source-linked finding', box);
  const ids = card.sources.flatMap((s) => [...s.text.matchAll(/^@(?:event|lore)\s+(\S+)/gm)].map((m) => m[1]));
  const event = select(el('label', 'Affected card or entry', box), ids);
  const branch = input(box, 'Branch (for example: left / if flag(...))'), rule = input(box, 'Relevant rule');
  const severity = select(el('label', 'Severity', box), ['minor', 'serious', 'insufficient-evidence']);
  const problem = input(box, 'Claimed defect', true), fix = input(box, 'Concrete correction', true);
  const evidence = input(box, 'Evidence JSON: [{"key":"kind:id","sourceHash":"…"}]', true, '[]');
  button(box, 'Use last source lookup', () => {
    if (!lastSource) throw new Error('Read a source first');
    evidence.value = JSON.stringify([{ key: lastSource.key, sourceHash: lastSource.sourceHash }], null, 2);
  });
  button(box, 'Save finding', async () => {
    await api('/finding', { label: card.label, finding: { event: event.value, branch: branch.value, rule: rule.value, severity: severity.value, problem: problem.value, fix: fix.value, evidence: JSON.parse(evidence.value) } });
    await refresh();
  }, data.locked);
}
function show(label) {
  current = label; lastSource = null;
  const card = data.cards.find((c) => c.label === label), view = document.querySelector('#view');
  view.replaceChildren(); document.querySelector('#error').textContent = '';
  el('h2', card.label, view); el('p', card.prompt, view);
  if (card.identity) el('p', JSON.stringify(card.identity), view);
  if (card.failure) el('p', 'No output: ' + card.failure, view);
  for (const s of card.sources) { el('p', s.path, view); el('pre', s.text, view); }
  if (!card.frozen) { el('p', 'Awaiting a frozen artifact.', view); return; }
  source(view, label);
  if (!card.judgment.initial) { assessment(view, card, true); return; }
  el('h3', 'Initial assessment (preserved)', view); el('pre', JSON.stringify(card.judgment.initial, null, 2), view);
  el('h3', 'Validation', view); el('pre', JSON.stringify(card.validation, null, 2), view);
  el('h3', 'Findings and adjudication', view);
  for (const group of card.findings || []) {
    const box = el('fieldset', null, view); el('legend', group.event + ' / ' + group.branch, box);
    el('p', 'Group key: ' + group.key, box);
    for (const item of group.findings) {
      el('pre', JSON.stringify(item, null, 2), box);
      for (const evidence of item.evidence) button(box, 'Read ' + evidence.key, async () => {
        const result = await api('/source?label=' + encodeURIComponent(label) + '&key=' + encodeURIComponent(evidence.key));
        el('pre', result.key + ' · ' + result.sourceHash + '\n' + result.text, box);
      });
    }
    const saved = card.judgment.adjudications?.[group.key];
    if (saved) el('pre', JSON.stringify(saved, null, 2), box);
    const status = select(box, ['valid', 'invalid', 'duplicate', 'preference', 'unresolved'], saved?.status);
    const severity = select(box, ['minor', 'serious'], saved?.severity);
    const reason = input(box, 'Evidence and reason', true, saved?.reason || '');
    const duplicate = input(box, 'If duplicate: target group key', false, saved?.duplicateOf || '');
    button(box, 'Save adjudication', async () => {
      await api('/judge', { label, action: 'adjudicate', group: group.key, status: status.value, severity: severity.value, reason: reason.value, duplicateOf: duplicate.value });
      await refresh();
    }, data.locked);
  }
  if (!data.locked) finding(view, card);
  assessment(view, card, false);
  if (data.locked) {
    el('h3', 'Locked report', view); el('pre', JSON.stringify(data.report, null, 2), view);
    if (data.report.phase === 'confirmation') {
      const workflow = input(view, 'Workflow to adopt'), reason = input(view, 'Adoption rationale', true);
      button(view, 'Record adoption', async () => { await api('/adopt', { workflow: workflow.value, reason: reason.value }); await refresh(); });
    }
  }
}
function pairs() {
  current = null; const view = document.querySelector('#view'); view.replaceChildren();
  el('h2', 'Paired comparisons', view);
  for (const pair of data.pairs) {
    const box = el('fieldset', null, view); el('legend', pair.labels.join(' vs '), box);
    if (!pair.labels.every((label) => data.cards.find((c) => c.label === label).judgment.initial)) { el('p', 'Assess both cards individually before this comparison.', box); continue; }
    const row = el('div', null, box); row.className = 'pair';
    for (const label of pair.labels) {
      const card = data.cards.find((c) => c.label === label), col = el('div', null, row);
      el('h3', label, col); el('p', card.prompt, col); for (const s of card.sources) el('pre', s.text, col);
    }
    if (pair.panel.length) { el('h3', 'Independent panel votes', box); el('pre', JSON.stringify(pair.panel, null, 2), box); }
    const choice = select(box, [...pair.labels, 'tie', 'both-unacceptable', 'uncertain'], pair.verdict?.preference);
    const notes = input(box, 'Comparison notes', true, pair.verdict?.notes || '');
    button(box, 'Save preference', async () => { await api('/pair', { key: pair.key, preference: choice.value, notes: notes.value }); data = await api('/state'); pairs(); }, data.locked);
  }
}
document.querySelector('#pairs').onclick = pairs;
document.querySelector('#lock').onclick = () => {
  if (confirm('Lock assessments and reveal workflow identities? Initial assessments remain preserved.')) api('/lock', {}).then(refresh).catch(error);
};
refresh().catch(error);
