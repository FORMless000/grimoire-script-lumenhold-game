// Text stays in the existing English data. Translation keys follow its object paths; no second English copy.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./cards.js'), require('./voices.js'), require('./messages.js'));
  else root.CruxText = factory(root.CruxCards, root.CruxVoices, root.CruxMessages);
})(typeof self !== 'undefined' ? self : this, function (cards, voices, messages) {
  const table = { ...messages };
  function collect(value, key) {
    if (typeof value === 'string' && value && !value.startsWith('<') && !key.includes('.hexes.') && !['signal', 'lean', 'fail', 'fx', 'gate', 'id', 'hex'].includes(key.split('.').pop())) table[key] = value;
    else if (typeof value === 'function') {
      table[key + '.one'] = value(1).replace('1', '{n}');
      table[key + '.many'] = value(2).replace('2', '{n}');
    } else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) collect(v, key + '.' + k);
  }
  collect(voices, 'voice'); collect(cards.SIGNALS, 'signal'); collect(cards.EFFECTS, 'effect');
  collect(cards.CIRCUMSTANCES, 'circ'); collect(cards.HEXES, 'hex'); collect(cards.COMMON, 'common');
  // Translate complete text nodes and attributes only, never markup or move identifiers. Templates retain named tokens.
  function translator(translations) {
    const exact = new Map(), patterns = [];
    for (const [key, en] of Object.entries(table)) {
      if (!translations[key]) continue;
      exact.set(en, translations[key]); exact.set(en.toUpperCase(), translations[key]); exact.set(en.toLowerCase(), translations[key]);
      if (/\{\w+\}/.test(en)) {
        const names = [];
        const pattern = en.split(/(\{\w+\})/).map((part) => {
          if (/^\{\w+\}$/.test(part)) { names.push(part.slice(1, -1)); return '(.*?)'; }
          return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }).join('');
        patterns.push({ re: new RegExp('^' + pattern + '$'), names, text: translations[key] });
      }
    }
    patterns.sort((a, b) => b.re.source.length - a.re.source.length);
    function translate(text, depth = 0) {
      if (depth > 4) return text;
      const value = text.trim(); if (exact.has(value)) return text.replace(value, exact.get(value));
      for (const p of patterns) { const m = value.match(p.re); if (m) return text.replace(value, p.text.replace(/\{(\w+)\}/g, (t, k) => { const i = p.names.indexOf(k); return i < 0 ? t : translate(m[i + 1], depth + 1); })); }
      // A renderer node may join a translated name to a number, icon or another label.
      // Keep the separators, and translate each constituent through the same source table.
      const parts = text.split(/( · |: |, |^[✕▲·]\s*)/);
      if (parts.length > 1) return parts.map((part, i) => i % 2 ? part : translate(part, depth + 1)).join('');
      return text;
    }
    return translate;
  }
  function localize(host, translations) {
    const tr = translator(translations), walker = document.createTreeWalker(host, 4);
    while (walker.nextNode()) walker.currentNode.nodeValue = tr(walker.currentNode.nodeValue);
    for (const el of host.querySelectorAll('[title], [aria-label]')) for (const key of ['title', 'aria-label']) if (el.hasAttribute(key)) el.setAttribute(key, tr(el.getAttribute(key)));
  }
  return { table, localize, translator };
});
