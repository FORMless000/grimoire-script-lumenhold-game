// Uses the same Rust player as Crux's native simulator. No JS rules or dice-roll substitute.
'use strict';
const B = require('../src/parley.js');
function resolver({ style = 'balanced' } = {}) {
  const bot = String(style).split(':')[0] === 'random' ? 'naive' : 'smart';
  return (req) => B.autoplay(req, { bot });
}
module.exports = { resolver };
