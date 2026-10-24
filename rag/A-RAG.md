# A-RAG assessment for card authoring

Reviewed October 23, 2026. Recommendation: retain the current coding-agent harness
and adapt the retrieval interface if trials justify it. Do not install another
author agent or count the current workflow as a reproduction of A-RAG.

The [paper, §3](https://arxiv.org/html/2602.03442v1#S3) describes three separately
selectable tools: exact keyword search, sentence-level semantic search with
parent-chunk aggregation, and full-chunk reading. It tracks already-read chunks
to reduce repeated context. Its evaluations concern question answering, including
multi-hop tasks; they do not establish better creative authoring in this corpus.

Our `retrieve search`/`read` interface already permits incremental investigation.
It differs materially: LightRAG uses graph/vector mix retrieval and reranking. It does not expose independent sentence-level semantic and exact
keyword tools, nor suppress repeated reads. Static `.grim` dependencies are an
additional authoring feature. These differences matter for causal comparisons.

The [upstream project](https://github.com/Ayanami0730/arag) has its own Python agent
loop and benchmark runner. Its [semantic tool](https://github.com/Ayanami0730/arag/blob/main/src/arag/tools/semantic_search.py)
uses SentenceTransformers and a sentence index. [Index construction](https://github.com/Ayanami0730/arag/blob/main/scripts/build_index.py)
splits prose with punctuation/newline rules, drops very short segments and stores
sentence vectors with parent mappings. Applying that splitter directly to `.grim`
would lose useful short labels/conditions and mishandle dotted IDs. Its
[full installation](https://github.com/Ayanami0730/arag/blob/main/pyproject.toml)
adds SentenceTransformers and data libraries; this is unnecessary for using its
interface idea in our existing harness.

A future adaptation should expose literal keyword search and sentence/branch
semantic matches separately, always map back to full parser-derived parent blocks,
retain guards and option identity, and offer session-scoped read tracking with an
explicit reread override. OpenRouter embeddings would avoid local model/Python
requirements. That would be an A-RAG-inspired treatment, not an exact reproduction.

Evaluate it as a separately declared workflow on frozen tasks and budgets. Preserve historical studies; use a new declared comparison for interface changes. If isolating the interface itself,
hold the corpus, embeddings, author model and budgets fixed; changing sentence
indexing and interface simultaneously tests a package. Include known-source
coverage and source characters alongside human acceptance and serious defects.
An upstream reproduction would need a pinned Git revision, its own Python/model
stack, QA evaluation and separate artifacts. It is not part of default setup.
