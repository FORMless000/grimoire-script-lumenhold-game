# Migrations

Put a new migration here as `NNNN-name.js` (the format is in the header of `tools/migrate.js`), then run
`node tools/grim.js migrate`. Applied ids are recorded in `content/.migrations.json`. The scripts applied up to
0045 were removed on 2026-10-24 and stay in git history (`git log --diff-filter=D -- tools/migrations`).
Number new ones from 0046.
