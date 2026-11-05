// Shared by campaign setup and the standalone encounter exporter. These offsets retain Crux's tested odds-word mapping.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CruxSetup = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const ODDS_SHIFT = { certain: -25, sure: -18, likely: -10, even: 0, unlikely: 10, slim: 18, long_shot: 25, freak: 32 };
  return { ODDS_SHIFT, difficultyOf: (req) => Math.max(0, Math.min(100, req.dc + (ODDS_SHIFT[String(req.odds).replace(/ /g, '_')] || 0))) };
});
