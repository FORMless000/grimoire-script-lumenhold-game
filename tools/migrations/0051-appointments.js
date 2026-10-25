// `@game exam / appeal / spark_cooldown / off_shift` -> the deals of their appointments in content/core/appointments.grim
// (which already names the same cards; the @game keys stay valid shorthands).
const KEYS = ['exam', 'appeal', 'spark_cooldown', 'off_shift'];

module.exports = {
  id: '0051-appointments',
  description: '@game exam/appeal/spark_cooldown/off_shift -> their @appointment',
  run(ctx) {
    const file = 'content/core/rules.grim', lines = ctx.lines(file), moved = [];
    let inGame = false;
    lines.forEach((l, i) => {
      if (/^@/.test(l)) inGame = l.trim() === '@game';
      const m = inGame && l.match(/^([a-z_]+):\s*(\S+)\s*$/);
      if (!m || !KEYS.includes(m[1])) return;
      const a = ctx.content.appointments[m[1]];
      if (!a || a.builtin || !(a.deals.card || []).includes(m[2])) throw new Error('@appointment ' + m[1] + ' does not deal ' + m[2] + ' yet');
      ctx.remove({ file, line: i + 1 });
      // and the comment that explains it (the appointment's desc says the same)
      for (let k = i; k >= 1 && /^#/.test(lines[k - 1]); k--) ctx.remove({ file, line: k });
      moved.push(m[1]);
    });
    ctx.report('moved ' + moved.join(', '));
  },
};
