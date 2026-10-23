---
name: authoring-evaluation
description: Prepare and audit controlled Lumenhold authoring experiments, import independent critic findings, and support the sole human reviewer's blinded comparisons and ablations. Does not launch author or evaluator models.
---

Read [the experiment protocol](../../experiments/authoring/README.md). Prepare
separate fresh-session workspaces with the same source snapshot and generation
task. Only the assigned workflow instructions and intended mechanisms differ.
The human starts each coding-agent run. Preserve first drafts, at most two
validator-guided repairs, and the frozen artifact before outside critique.

Import complete native traces plus tool receipts. A workflow's name is not proof
that it ran correctly. Resolve unknown accesses explicitly; classify missing
evidence as unverifiable. Never remove unsuccessful attempts from comparisons.

When acting as critic, use only the frozen task/artifact, common rubric and source
snapshot. Read every branch. Cite source IDs and hashes, distinguish defects from
preferences, and give concrete corrections. Do not see author reasoning, other
critics' votes, workflow identities, or human judgments before returning your own.

The human reviews every trial before seeing critic opinions, adjudicates findings,
and alone records adoption. A panel consists of independent model families using
the same rubric; consensus cannot replace human adjudication. For a critic-workflow
comparison, reuse the exact same frozen cards. For component ablations, rebuild
affected caches and verify actual stage omission; do not interpret a framework
package comparison as a single-component effect.
