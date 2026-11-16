'use strict';
// Force specific outcomes in legal states to check their prose against their effects.
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
const { content, errors } = require(root + '/tools/project.js').project(root).compileAll();
const Engine = require(root + '/src/engine.js');
assert.equal(errors.length, 0);

function game() {
  const engine = new Engine(content);
  engine.newGame({ seed: 7, name: 'Critic fixture' });
  engine.s.turn = 8;
  engine.s.vals.health = 70;
  return engine;
}

function choose(engine, id, key) {
  const item = { id, actor: null };
  engine.s.cur = item;
  const card = engine.withContext(item, () => engine.view(item));
  const outcome = engine.choose(key);
  assert(outcome.checks.every(check => check.result === 'win'));
  return { text: card.text, say: outcome.say };
}

function forceWin(engine) {
  const pick = engine.pick.bind(engine);
  engine.pick = (kind, ...args) => kind === 'challenge' ? 0 : pick(kind, ...args);
}

const caught = game();
caught.s.vals.heist_where = 1;
caught.s.vals.heist_loot = 2;
forceWin(caught);
const ran = choose(caught, 'heist_caught', 'right');
assert.match(ran.text, /takes them all/);
assert.match(ran.say, /^You run/);
assert.equal(caught.s.vals.heist_loot, 0);

const tower = game();
tower.s.vals.heist_where = 2;
tower.s.vals.heist_depth = 5;
forceWin(tower);
const firstPearl = choose(tower, 'tw3_orrery', 'right');
tower.s.seen.tw3_orrery = 2;
tower.s.last.tw3_orrery = tower.s.turn;
tower.s.turn++;
tower.s.vals.heist_depth = 5;
tower.s.vals.heist_loot = 0;
assert(tower.eligible(content.events.tw3_orrery, new Set()));
const secondPearl = choose(tower, 'tw3_orrery', 'right');
assert.match(secondPearl.text, /one planet short/);
assert.equal(tower.s.vals.heist_loot, 2);

const vault = game();
vault.s.vals.heist_where = 1;
vault.s.vals.heist_depth = 7;
vault.s.flags.elixir_confiscated = true;
vault.s.flags.confiscated_brightwater = true;
vault.s.flags.confiscated_owls_ink = true;
forceWin(vault);
const bottles = choose(vault, 'st_vault', 'bottle');
assert.match(bottles.text, /is the bottle/);
assert(vault.s.states.brightwater_bottle && vault.s.states.owls_ink_bottle);

const board = game();
board.s.vals.gold = 0;
board.s.vals.board_missed = 1;
const rent = content.hooks.rent;
assert(board.test(rent.when));
const rentCtx = board.newCtx(null, 'rent', 'rent');
board.run(rent.do, rentCtx);
assert.equal(board.s.vals.board_missed, 0);
assert(board.s.states.hungry);
assert(board.s.queue.some(item => item.id === 'grisk_board_debt'));
const refund = content.events.ga_grey_board;
assert(board.test(refund.when));
const paid = choose(board, refund.id, 'left');
assert.match(paid.text, /a gentleman in grey/i);
assert.equal(board.s.vals.gold, 11);

console.log(JSON.stringify({ caughtCarryingLoot: ran, firstPearl,
  repeatPearl: { ...secondPearl, lootAfter: tower.s.vals.heist_loot },
  recoveredBothBottles: bottles, boardAfterSecondMiss: { ...paid, rentSay: rentCtx.say,
    goldAfter: board.s.vals.gold, stillHungry: true, griskDebtQueued: true } }, null, 2));
