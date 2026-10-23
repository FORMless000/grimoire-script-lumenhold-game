# QMD workflow

Use the common `node tools/grim.js retrieve search`, `read`, `neighbors`, `brief`,
and `related` operations. The run input selects QMD. Discovery uses its native
hybrid search, expansion, and local reranking; originals and declared dependencies
come from the common source layer. Do not call QMD directly, change its models,
use legacy retrieval helpers, or silently switch backend. A missing index is a
retained failure. Read source blocks rather than treating search descriptions as canon.
