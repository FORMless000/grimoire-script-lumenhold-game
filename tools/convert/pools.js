/*
 * Converter: knobs repeated across cards -> @pool (migration 0046).
 *
 * Detection is structural (compiled content plus where each property is written), never the prose:
 *   - owner: a card's place, track or plan (one pool across files, placed beside most of its cards), or, for cards with
 *     none, its trigger and fixed actor (one pool per file: a file's world, social, forced or letter cards);
 *   - cluster: cards of one owner that write the same trigger, class, repeat, weight and priority (absence counts);
 *   - lifted: the owner and every one of those written the same by all members, plus slot and time when all write the
 *     same, plus a first tag all share; a cluster of fewer than 3 cards, or one that would lift fewer than 2
 *     properties, is left alone;
 *   - pool templates: when 3 or more track pools of one track kind lift the same properties besides their owner, those
 *     move into a parent pool (`course_routine`) in content/core/templates.grim and each child keeps `from:` and its
 *     owner.
 * Left alone: cards in a storyline (chain/thread/arc), specializations, queued cards (follow-ups, not a deck) and
 * cards already in a pool.
 */
'use strict';
const L = require('./lib.js');

const SIGNATURE = ['trigger', 'class', 'repeat', 'weight', 'priority'];
const EXTRA = ['slot', 'time'];

function plan(content, linesOf) {
  const taken = new Set(Object.keys(content.pools || {}));
  const cards = [];
  for (const e of Object.values(content.events)) {
    if (e.specializes || e.chain || e.thread || e.arc || e.pool || e.trigger === 'queued') continue;
    const src = L.blockSource(linesOf(e.file), e.line);
    const owner = e.place ? ['place', e.place] : e.track ? ['track', e.track] : e.plan ? ['plan', e.plan] : null;
    const written = (k) => (src.props[k] && !src.props[k].multi ? src.props[k].text : null);
    if (owner && (!src.props[owner[0]] || src.props[owner[0]].multi)) continue;
    const key = owner ? owner.join(':') : 'file:' + e.file + ':' + e.trigger + (e.actor && e.actor !== 'npc' && src.props.actor ? ':' + e.actor : '');
    cards.push({ e, src, owner, key, sig: SIGNATURE.map((k) => written(k)), written });
  }
  const clusters = new Map();
  for (const c of cards) { const k = c.key + '|' + JSON.stringify(c.sig); if (!clusters.has(k)) clusters.set(k, []); clusters.get(k).push(c); }
  const pools = [], skipped = [];
  for (const [k, members] of clusters) {
    if (members.length < 3) continue;
    const first = members[0], lift = [];
    if (first.owner) lift.push([first.owner[0], first.written(first.owner[0])]);
    else if (first.written('actor')) lift.push(['actor', first.written('actor')]);
    for (const p of SIGNATURE.concat(EXTRA)) {
      const v = first.written(p);
      if (v != null && members.every((m) => m.written(p) === v)) lift.push([p, v]);
    }
    const tag0 = (m) => (m.src.props.tags && !m.src.props.tags.multi ? m.src.props.tags.text.split(/[\s,]+/).filter(Boolean)[0] : null);
    const tag = tag0(first) && members.every((m) => tag0(m) === tag0(first)) ? tag0(first) : null;
    if (lift.length + (tag ? 1 : 0) < 2) { skipped.push({ cluster: k, members: members.length, why: 'fewer than 2 shared properties' }); continue; }
    // Where it lives: the file holding most of its cards, before the first of them there.
    const byFile = {};
    for (const m of members) byFile[m.e.file] = (byFile[m.e.file] || 0) + 1;
    const file = Object.keys(byFile).sort((a, b) => byFile[b] - byFile[a] || a.localeCompare(b))[0];
    const at = Math.min(...members.filter((m) => m.e.file === file).map((m) => m.e.line));
    const cls = lift.find(([p]) => p === 'class');
    const stem = L.stem(first.e.file), trig = first.e.trigger;
    const ownerName = first.owner ? first.owner[1] : stem + (first.written('actor') ? '_' + first.written('actor') : '') + (trig !== 'random' && !stem.includes(trig) ? '_' + trig : '');
    // A track's pool is named for what it is to the player (its class, club or job tag), the rest for their class.
    const kindWord = first.owner && first.owner[0] === 'track' && tag ? tag : cls ? cls[1] : 'cards';
    pools.push({ id: null, base: ownerName + '_' + kindWord, owner: first.owner, lift, tag, file, at, members: members.map((m) => ({ id: m.e.id, file: m.e.file, line: m.e.line, src: m.src })) });
  }
  // Ids: <owner>_<class>; when an owner has several, the biggest keeps that and the others add what sets them apart.
  name(pools, (p) => p.base, (p) => p.members.length, taken);
  pools.sort((a, b) => a.file.localeCompare(b.file) || a.at - b.at);
  // Pool templates for track pools of one kind that lift the same properties besides their owner.
  const parents = [];
  const groups = new Map();
  for (const p of pools) {
    if (!p.owner || p.owner[0] !== 'track') continue;
    const kind = (content.tracks[p.owner[1]] || {}).kind;
    if (!kind) continue;
    const rest = p.lift.filter(([k]) => k !== 'track');
    if (!rest.length) continue;
    const k = kind + '|' + JSON.stringify(rest) + '|' + (p.tag || '');
    if (!groups.has(k)) groups.set(k, { kind, rest, tag: p.tag, children: [] });
    groups.get(k).children.push(p);
  }
  for (const g of groups.values()) {
    if (g.children.length < 3) continue;
    const cls = g.rest.find(([k]) => k === 'class');
    parents.push({ base: g.kind + '_' + (cls ? cls[1] : 'cards'), kind: g.kind, lift: g.rest, tag: g.tag, group: g, size: g.children.reduce((n, c) => n + c.members.length, 0) });
  }
  name(parents, (p) => p.base, (p) => p.size, taken);
  for (const p of parents) {
    p.children = p.group.children.map((c) => c.id);
    for (const c of p.group.children) { c.from = p.id; c.ownLift = c.lift.filter(([k]) => k === 'track'); }
    delete p.group;
  }
  return { pools, parents, skipped };
}

// Gives each item an id from its base name: the biggest of a name keeps it; the others add the first lifted property
// whose value differs from the biggest's (`work_routine_repeat4`), else a number.
function name(items, base, size, taken) {
  const by = new Map();
  for (const it of items) { const b = base(it); if (!by.has(b)) by.set(b, []); by.get(b).push(it); }
  for (const [b, list] of by) {
    list.sort((x, y) => size(y) - size(x));
    const head = new Map(list[0].lift);
    list.forEach((it, i) => {
      if (i === 0) { it.id = L.uniqueId(taken, b); return; }
      const d = it.lift.find(([k, v]) => head.get(k) !== v);
      it.id = d ? L.uniqueId(taken, b, d[0] + String(d[1]).replace(/[^a-z0-9]+/gi, '')) : L.uniqueId(taken, b);
    });
  }
}

const blockText = (id, from, lift, tag, desc) => ['@pool ' + id].concat(desc ? ['desc: ' + desc] : [], from ? ['from: ' + from] : [], lift.map(([k, v]) => k + ': ' + v), tag ? ['tags: ' + tag] : []).join('\n');

// Applies a plan through a migration context (tools/migrate.js).
function apply(ctx, P) {
  const insertAt = new Map();   // file -> [[line, text]]
  const put = (file, line, text) => { if (!insertAt.has(file)) insertAt.set(file, []); insertAt.get(file).push([line, text]); };
  for (const p of P.pools) {
    const lines = ctx.lines(p.file);
    const lift = p.from ? p.ownLift : p.lift;
    put(p.file, L.insertionPoint(lines, p.at), '\n' + blockText(p.id, p.from, lift, p.from ? null : p.tag) + '\n');
    for (const m of p.members) {
      const lifted = p.lift.map(([k]) => m.src.props[k]).filter(Boolean).sort((a, b) => a.line - b.line);
      lifted.forEach((x, i) => { if (i === 0) ctx.edit({ file: m.file, line: x.line }, 'pool: ' + p.id); else ctx.remove({ file: m.file, line: x.line }); });
      if (p.tag) {
        const t = m.src.props.tags, rest = t.text.split(/[\s,]+/).filter(Boolean).slice(1);
        if (rest.length) ctx.edit({ file: m.file, line: t.line }, 'tags: ' + rest.join(' '));
        else ctx.remove({ file: m.file, line: t.line });
      }
    }
  }
  for (const [file, list] of insertAt) for (const [line, text] of list) ctx.insertAfter({ file, line }, text);
  if (P.parents.length) {
    const file = 'content/core/templates.grim';
    const body = P.parents.map((p) => blockText(p.id, null, p.lift, p.tag, 'What every ' + p.kind + ' pool shares (' + p.children.length + ' pools).')).join('\n\n');
    ctx.insertAfter({ file, line: ctx.lines(file).length }, '\n# ---------------- pool templates: what every pool of one kind shares ----------------\n\n' + body);
  }
}

module.exports = { plan, apply };
