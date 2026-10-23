# Independent frozen-artifact critique

Use a fresh coding-agent session. Read the supplied task and every card in full,
including choices, conditional outcomes, and linked variation positions. Read
the current authoring checklist, style, costs, checks and classes in the supplied
source snapshot. Consult original worldbook blocks as needed. Do not read author
reasoning, workflow identity, other judgments or human verdicts. Do not edit or
repair the cards. Do not infer that a fact was revealed or an outcome occurred
unless its actual conditions support the claim.

Use the same rubric for every artifact: canon/plot safety, continuity/gating,
voice/tone, choice/check quality, novelty, and repeatability. Separate correctness
from taste. Report defects only with a concrete correction. An unsupported claim
must be marked insufficient-evidence, not a factual rejection.

Return JSON with `model`, `family`, `harness`, `rubricHash`, `artifactHash`, and
`findings`. Every finding contains `event` (generated event ID), `branch` (e.g.
option:left/if, or text), `problem`, `rule` (a rubric/spec reference), `severity`
(serious, minor, insufficient-evidence), `fix`, and `evidence` (a list of original
source `key` and `sourceHash` pairs). Optional `issueKey` identifies the underlying
defect for grouping. Empty evidence is allowed only for insufficient-evidence.
Do not claim that agreement among models establishes truth.
