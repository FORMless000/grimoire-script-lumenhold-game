'use strict';
const fs = require('fs');
const path = require('path');
const U = require('./util.js');
const E = require('./experiments.js');
const Review = require('./review.js');

function prepare(dir, members, workflows = []) {
  const m = E.load(dir);
  if (m.locked || m.panelPackets) throw new Error('Panel preparation requires an unlocked study without existing panel packets');
  if (!Array.isArray(members) || members.length !== 3 || new Set(members.map((j) => j.family)).size !== 3 || members.some((j) => !j.model || !j.family || !j.harness || !j.harnessVersion)) throw new Error('Register three distinct model families with model, family, harness and harnessVersion');
  if (workflows.length && workflows.length !== 2) throw new Error('A critic-workflow comparison requires exactly two workflow instruction files');
  const variants = workflows.length ? workflows.map((file) => ({ hash: U.hash(fs.readFileSync(file, 'utf8')), text: fs.readFileSync(file, 'utf8') })) : [{ hash: U.hash('common-rubric-only'), text: '' }];
  const rubric = m.rubric, rubricHash = m.rubricHash;
  const packets = [];
  for (const pair of Review.state(dir).pairs) {
    const runs = pair.labels.map((label) => E.trial(m, m.mapping[label]));
    if (runs.some((r) => r.state !== 'frozen')) throw new Error('Freeze every compared artifact before preparing a panel');
    const artifacts = runs.map((r) => U.readJSON(path.join(dir, 'artifacts', r.id, 'frozen.json')));
    for (const member of members) for (const variant of variants) for (const order of [[0, 1], [1, 0]]) {
      const id = U.hash([pair.key, member, variant.hash, order]).slice(0, 24), labels = order.map((i) => pair.labels[i]);
      const artifactHashes = order.map((i) => runs[i].artifactHash);
      const prompt = rubric + '\n\nCritic workflow instructions:\n' + variant.text + '\n\nTask:\n' + runs[0].prompt + '\n\nOriginal source snapshot:\n' + path.join(dir, 'snapshot') + '\n\n' + order.map((i, n) => 'Candidate ' + ['A', 'B'][n] + ':\n' + artifacts[i].sources.map((s) => s.text).join('\n\n')).join('\n\n') +
        '\n\nReturn a panel result with packet, model, family, harness, harnessVersion, rubricHash, artifactHashes (A then B), preference (A, B, tie, both-unacceptable, uncertain), and findings. Each finding also names candidate A or B. Do not read any other review or discuss with another judge.';
      const packet = { id, pair: pair.key, labels, member, workflowHash: variant.hash, artifactHashes, rubricHash, promptHash: U.hash(prompt), prompt };
      U.writeJSON(path.join(dir, 'judge-packets', id + '.json'), packet, true);
      packets.push({ ...packet, prompt: undefined });
    }
  }
  m.panelPackets = packets; m.panelResults = []; E.save(dir, m);
  return { packets: packets.length, directory: path.join(dir, 'judge-packets'), members, criticWorkflowComparison: workflows.length === 2, note: 'Start each packet in a separate fresh judge session. No models have been launched.' };
}
function importResult(dir, result) {
  const m = E.load(dir), packet = m.panelPackets?.find((p) => p.id === result.packet);
  if (m.locked || !packet) throw new Error('Unknown panel packet or locked study');
  if (m.panelResults.some((r) => r.packet === result.packet)) throw new Error('Panel result already imported');
  const invocation = result.invocation;
  if (!invocation || invocation.by !== 'human' || invocation.freshSession !== true || !invocation.session || invocation.promptHash !== packet.promptHash) throw new Error('Panel result requires a human-checked fresh invocation bound to the packet prompt');
  if (m.panelResults.some((r) => r.invocation.session === invocation.session)) throw new Error('Judge session reused across packets');
  for (const k of ['model', 'family', 'harness', 'harnessVersion']) if (result[k] !== packet.member[k]) throw new Error('Panel judge identity differs: ' + k);
  if (result.rubricHash !== packet.rubricHash || U.hash(result.artifactHashes) !== U.hash(packet.artifactHashes) || !['A', 'B', 'tie', 'both-unacceptable', 'uncertain'].includes(result.preference) || !Array.isArray(result.findings)) throw new Error('Panel result does not match frozen inputs');
  if (result.findings.some((f) => !['A', 'B'].includes(f.candidate))) throw new Error('Panel finding needs candidate A or B');
  // Validate both candidates before publishing either critique.
  for (const [i, candidate] of ['A', 'B'].entries()) {
    const id = m.mapping[packet.labels[i]], root = path.join(dir, 'trials', id), C = require('./catalog.js'), G = require('../../src/grimoire.js');
    const artifact = U.readJSON(path.join(dir, 'artifacts', id, 'frozen.json'));
    const generated = new Set(artifact.sources.flatMap((s) => G.parseFile(s.text, s.path)).map((d) => d.id));
    for (const f of result.findings.filter((f) => f.candidate === candidate)) E.validateFinding(f, C.catalog(root), generated);
  }
  for (const [i, candidate] of ['A', 'B'].entries()) {
    E.importCritic(dir, m.mapping[packet.labels[i]], { model: result.model, family: result.family, harness: result.harness, rubricHash: result.rubricHash, artifactHash: packet.artifactHashes[i],
      packet: packet.id, workflowHash: packet.workflowHash, findings: result.findings.filter((f) => f.candidate === candidate) });
  }
  const latest = E.load(dir);
  const saved = { ...result, preference: ['A', 'B'].includes(result.preference) ? packet.labels[result.preference === 'A' ? 0 : 1] : result.preference, workflowHash: packet.workflowHash, pair: packet.pair };
  U.writeJSON(path.join(dir, 'panel-results', packet.id + '.json'), saved, true);
  latest.panelResults.push(saved); E.save(dir, latest);
  return { imported: packet.id, findings: result.findings.length };
}
module.exports = { prepare, importResult };
