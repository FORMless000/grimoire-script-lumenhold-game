// Campaign host. Crux owns the renderer, gestures, skins and all negotiation rules.
(function (root) {
  'use strict';
  let active = null, generation = 0;
  function close() { generation++; if (active) { active.destroy(); active = null; } }
  async function open({ host, key, request, saved, content, view, t, engineHelp, engineShown, engineBudget, onEngineShown, onSave, onDone }) {
    close(); const opening = generation;
    const C = root.LumenholdCrux, B = root.ParleyBridge;
    await C.core.init();
    if (opening !== generation) return;
    const p = saved ? B.resume(saved) : B.createParley(request);
    const original = C.encounters.find((e) => e.key === request.event + '/' + request.option);
    const encounter = { ...original, title: view.title, intro: view.text, scene: '', label: view.options.find((o) => o.key === key).label,
      who: request.vs && content.npcs[request.vs.npc] ? content.npcs[request.vs.npc].name : original.who };
    const layer = document.createElement('div'); layer.className = 'parley-layer';
    const app = document.createElement('div'); app.className = 'crux-app'; layer.appendChild(app);
    host.classList.add('parleying'); host.appendChild(layer);
    const save = () => onSave({ ...B.snapshot(p), key });
    const done = (result) => {
      if (onDone(result) === false) return false;
      layer.remove(); host.classList.remove('parleying'); return true;
    };
    save();
    const mounted = C.ui.open({ host: app, runtime: C, game: p.game, resumed: !!saved, encounter, entryMana: p.entry.mana,
      tutorial: original.tutorial, engineHelp, engineShown, engineBudget, onEngineShown,
      translations: root.I18n.parleyText(), sources: B.signalSources(request, content, { bond: t('parley.noBond'), record: t('parley.noRecord') }),
      onSave: save, onDone: () => done(B.parleyResult(p)),
      onSkip: () => done({ request: request.id, outcome: 'win', reason: 'lesson_skipped', deltas: {}, rules: C.rules, followUps: [] }) });
    active = { destroy() { mounted.destroy(); layer.remove(); host.classList.remove('parleying'); } };
    return active;
  }
  root.ParleyUI = { open, close };
})(typeof self !== 'undefined' ? self : this);
