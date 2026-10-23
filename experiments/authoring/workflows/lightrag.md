# LightRAG workflow

Use the common `node tools/grim.js retrieve search`, `read`, `neighbors`, `brief`,
and `related` operations. The run input selects LightRAG mix retrieval without
answer generation. Use its discoveries to read original parent blocks and exact
declared dependencies. Extracted graph descriptions are search aids, not canon.
Do not call the backend directly, change models, use legacy retrieval helpers, or
silently switch backend. Retain failures and explicit evidence omissions.
