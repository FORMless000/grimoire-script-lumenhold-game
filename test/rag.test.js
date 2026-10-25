'use strict';
// The project test entry point for the authoring workspace (rag/): its suites live with their implementation.
// Frozen workspace imports, operator preparation and human-only review; every model response is mocked.
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'rag', 'test');
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.test.js')).sort()) require(path.join(dir, f));
