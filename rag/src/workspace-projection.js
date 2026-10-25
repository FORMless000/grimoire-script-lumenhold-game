'use strict';
const fs = require('fs');
const path = require('path');
const U = require('./util.js');

const NAMES = ['baseline', 'lightrag'];
const BATCH = `\n## This authoring batch\n\nWrite the requested cards anywhere under content/, including existing files. Work in one uninterrupted authoring session and use deterministic validation to repair your content. Preserve existing IDs. Do not translate, refresh golden snapshots, invoke model critics, change tools or instructions, or adopt/deploy the batch. Report changed files and block IDs plus validation results. The operator detects changes from files independently.\n`;
const RETRIEVAL = `\n## Source discovery\n\nUse \`node tools/grim.js retrieve search "your authoring question"\` agentically before drafting. Inspect original evidence with read or brief and relevant static dependencies with neighbors; resolve required omissions before relying on a brief. See rag/USAGE.md for the interface. If retrieval is unavailable, report the failure rather than substituting another system.\n`;
const USAGE = `# Source evidence\n\nRun from this project's root with Node 24 (or prefix commands with npm run grim --). The starting source corpus is frozen; drafts do not enter this index. Search descriptions aid discovery; only original sources provide evidence.\n\n\`node tools/grim.js retrieve status\` checks the starting corpus and index manifest.\n\n\`node tools/grim.js retrieve search "a favour with an opportunity cost" --limit 10\` returns ranked source IDs, match explanations and source hashes. Filters: --kind, --place, --cast.\n\n\`node tools/grim.js retrieve read event:ID npc:ID\` returns complete original blocks. --budget defaults to 24000 characters, measured at whole-block boundaries. Required omissions produce an incomplete result.\n\n\`node tools/grim.js retrieve neighbors event:ID --limit 20\` returns bounded, typed static references. They do not establish runtime reachability.\n\n\`node tools/grim.js retrieve brief "your premise" --cast ID --place ID --budget 24000\` combines original evidence, relevant dependencies and examples. --required accepts comma-separated source IDs; inspect omitted records.\n\n\`node tools/grim.js retrieve related --draft content/events/example.grim\` finds existing premises relevant to a draft, for inspection rather than a duplicate verdict.\n\nAll commands support --json. The corpus, index configuration and retrieval implementation are fixed. Receipts in rag/receipts/ record successes and failures automatically.\n`;
function commonText(file, text) {
  if (file === 'AGENTS.md') return text.split('\n').filter(l => !/Experimental retrieval|Source retrieval and controlled|Current status, known gaps/.test(l)).join('\n')
    .replace(/\*\*Retrieval maintenance\*\*[\s\S]*?(?=\*\*Localization\*\*)/, '')
    .replace('; batches are reviewed with `skills/critic/SKILL.md`', '') + BATCH;
  if (file === 'PROGRESS.md') return text.split('## Everyday RAG')[0];
  if (file === 'README.md') return text.replace(/Retrieval setup and tooling live[\s\S]*?comparisons follow[^\n]*\n/, '');
  if (file === 'docs/design-v0.3.md') return text.replace(/Experimental authoring retrieval and controlled evaluation are documented in\n[^\n]*\n[^\n]*\n/, '');
  if (file === 'skills/write-academy-events/SKILL.md') {
    text = text.replace('then format, build, lint, simulate and translate.', 'then format, build, lint and simulate.');
    text = text.replace(/In a prepared authoring trial,[\s\S]*?## 0\./, 'Follow the batch scope in AGENTS.md.\n\n## 0.');
    text = text.replace(/^3\. \*\*Retrieve context before writing\.[^\n]*\n/m, '3. Read the worldbook entries and existing scenes relevant to the cast, place, track and premise, using the source inspection tools below.\n');
    text = text.replace('For ordinary writing, supplement retrieval to avoid duplicates and reuse what exists:', 'Avoid duplicates and reuse what exists:');
    text = text.replace(/^## 2\. Search, write[\s\S]*?(?=### Write the blocks)/m, '## 2. Write, then check for duplicates\n\nCheck every new card, and every edit that changes a card\'s premise, options or outcomes, for duplicate premises.\n\n1. **Check the premise before drafting.** Look for existing cards with it (`brief`, `query event --grep <word>`) and read anything close with `node tools/grim.js show <id>`. If the premise is taken, pick another, or a clearly different angle.\n2. **Write the blocks** (below).\n3. **Check each draft for duplicates** with `node tools/grim.js dupes <files>` and the cards already written at its place or track. Rework the card if its premise, options or punchline repeat an existing card.\n\n');
    text = text.replace(/Content changes alter gameplay,[\s\S]*?Browser check:/, 'Browser check:');
    return text.split('## 4. Translate')[0] + '## 4. Report\n\nReport changed files and block IDs; new flags, states, facts and proposed lore; chain links; and deterministic validation results. Leave translation, outside criticism and adoption to the operator.\n';
  }
  if (file === 'docs/authoring/README.md') return text
    .replace(/Load context through[\s\S]*?Prepared experiments instead follow their assigned packet\./, 'Read the relevant worldbook and existing cards before drafting. Follow the batch scope in AGENTS.md.')
    .replace(/node tools\/grim.js i18n zh-CN[^\n]*\n/, '')
    .replace(/Then check the batch[^\n]*/, 'Then check your content against checklist.md and report deterministic validation results.')
    .replace(/^Follow the \[retrieval command guide\][^\n]*\n/m, 'Inspect existing scenes and relevant worldbook entries with these tools:\n')
    .replace(/Write next to what exists,[\s\S]*?```bash/, 'Inspect existing scenes and relevant worldbook entries with these tools:\n\n```bash')
    .replace(/## Controlled retrieval experiments[\s\S]*?## Balance/, '## Balance')
    .replace(/^\| `briefs\/\*\.md`[^\n]*\n/m, '');
  if (file === 'skills/distill-lore/SKILL.md') return text.replace(/^node tools\/grim.js i18n[^\n]*\n/m, '');
  if (file === 'docs/authoring/checklist.md') return text.replace(/^Validators check[^\n]*\n/, 'Apply these content checks during self-validation.\n').replace(/^- `i18n[^\n]*\n/m, '').replace(' (the defects the critic found most often in world expansion 1)', '').replace('Duplicates checked with `retrieve related`; `dupes`, `brief` and grep alone are not enough.', 'Check with `grim dupes` and `grim query event --grep <word>`.');
  return text;
}
function grimTool(text, name) {
  text = text.replace(/^ \*   node tools\/grim.js retrieve[\s\S]*?(?= \*   node tools\/grim.js brief)/m, name === 'baseline' ? '' : ' *   node tools/grim.js retrieve status|search|read|neighbors|brief|related [QUERY/ID] [--json]\n *                                       original source evidence (rag/USAGE.md)\n');
  return text.replace("  case 'retrieve': case 'author-eval': require('../rag/src/cli.js').main(ROOT, cmd, rest); break;", name === 'baseline' ? '' : "  case 'retrieve': require('../rag/src/workspace-runtime.js').main(ROOT, rest); break;");
}
function selectedFiles(root) {
  const dirs = ['src', 'tools', 'test', 'content', 'locales', 'art', 'combat', 'server', 'scripts', 'skills', 'docs'];
  const roots = ['AGENTS.md', 'CLAUDE.md', 'LICENSE', 'PROGRESS.md', 'README.md', 'index.html', 'package.json', 'package-lock.json', '.node-version', '.nvmrc', '.gitattributes', '.gitignore', 'build/content.bundle.js', 'build/combat.bundle.js'];
  const omit = /(^|\/)(node_modules|target|out|out-old|\.git|\.DS_Store|_in|lab)(\/|$)|(^|\/)(?:[^/]*(?:findings|review|draft|triage)[^/]*)\.md$/i;
  const docs = /^(docs\/(?:design-v0\.3\.md|grimoire-script\.md|hosting\.md|playtest-2(?:-flows)?\.md|authoring\/))/;
  function walk(rel) {
    if (omit.test(rel)) return [];
    const abs = path.join(root, rel); if (!fs.existsSync(abs)) return [];
    const st = fs.lstatSync(abs); if (st.isSymbolicLink()) throw new Error('Unexpected project symlink: ' + rel);
    if (st.isDirectory()) return fs.readdirSync(abs).sort().flatMap(f => walk(rel + '/' + f));
    if (rel.startsWith('docs/') && !docs.test(rel)) return [];
    if (/^docs\/authoring\/(briefs\/|retrieval\.md$|a-rag\.md$)/.test(rel)) return [];
    if (/^skills\/(authoring-|critic\/)/.test(rel) || /^test\/(authoring|rag-workspaces|rag-batch-review|rag-lifecycle)\.test\.js$/.test(rel)) return [];
    if (/\.(?:log|jsonl)$/.test(rel) || /(^|\/)(?:\.env[^/]*|[^/]*\.critic\.json)$/.test(rel)) return [];
    return [rel];
  }
  return [...roots.flatMap(walk), ...dirs.flatMap(walk)].sort();
}
function copyFile(from, to) { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(from, to, fs.constants.COPYFILE_FICLONE); }
function project(snapshot, dest, name) {
  for (const file of selectedFiles(snapshot)) {
    const from = path.join(snapshot, file), to = path.join(dest, file);
    copyFile(from, to);
    if (/\.(md|json)$/.test(file)) {
      const text = fs.readFileSync(to, 'utf8');
      if (file === 'package.json') {
        const pkg = JSON.parse(text); delete pkg.scripts['setup:authoring']; delete pkg.scripts['setup:python']; delete pkg.scripts['rag:smoke'];
        fs.writeFileSync(to, JSON.stringify(pkg, null, 2) + '\n');
      } else fs.writeFileSync(to, commonText(file, text));
    }
  }
  fs.writeFileSync(path.join(dest, 'tools/grim.js'), grimTool(fs.readFileSync(path.join(dest, 'tools/grim.js'), 'utf8'), name));
  fs.writeFileSync(path.join(dest, 'CLAUDE.md'), '@AGENTS.md\n');
  if (name !== 'baseline') {
    fs.appendFileSync(path.join(dest, 'AGENTS.md'), RETRIEVAL);
    const rag = path.join(dest, 'rag'); fs.mkdirSync(rag, {recursive: true});
    fs.writeFileSync(path.join(rag, 'USAGE.md'), USAGE);
    fs.writeFileSync(path.join(rag, '.gitignore'), '/cache/\n/envs/\n/receipts/\n/.env.local\n');
    const adapter = require('./adapters.js').get(name);
    for (const f of new Set(['catalog.js', 'util.js', 'retrieve.js', 'models.json', 'workspace-runtime.js', 'presentation.js', ...adapter.files])) copyFile(path.join(snapshot, 'rag/src', f), path.join(rag, 'src', f));
    copyFile(path.join(snapshot,'rag/authoring.json'),path.join(rag,'authoring.json'));
    fs.writeFileSync(path.join(rag, 'src/adapters.js'), "'use strict';\nmodule.exports = { get(name) { if (name !== " + JSON.stringify(name) + ") throw new Error('Retrieval implementation is fixed'); return require('./adapters/" + name + ".js'); } };\n");
  }
}
module.exports = { NAMES, BATCH, RETRIEVAL, USAGE, commonText, selectedFiles, copyFile, project };
