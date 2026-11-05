'use strict';
// Retired (2026-10-26): the RAG authoring experiments (`grim author-eval`) have ended and their tooling is removed.
// This stub keeps the old export names so a stray require fails loudly instead of acting. See PROGRESS.md.
function retired() { throw new Error('retired: the RAG authoring experiments ended; see PROGRESS.md'); }
const FRAMEWORKS = [], RULES = [];
const NAMES = ['prepare', 'load', 'save', 'trial', 'integrity', 'draft', 'freeze', 'fail', 'importTrace', 'importCritic', 'validateFinding', 'groups', 'report', 'filesAt', 'payload'];
module.exports = { FRAMEWORKS, RULES, ...Object.fromEntries(NAMES.map((n) => [n, retired])) };
