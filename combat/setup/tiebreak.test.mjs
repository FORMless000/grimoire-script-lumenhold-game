// A mutual knockout (feedback 2026-10-29): both fall in one exchange, the side that committed first wins, and the loser's
// blows that exchange never land: the winner keeps the HP (and the Health behind it) they had, less its own prices. The fight
// text says so. Skills 50 everywhere, so Impulse deals 9.
import test from 'node:test';import assert from 'node:assert/strict';
import {createState} from './setup.mjs';
import {resolvedLines,finishLines,fighterNames} from './flavor.mjs';
import * as core from '../web/core.mjs';

const skills={arcana:50,lore:50,alchemy:50,charm:50,vigor:50,guile:50};
const KIT={ward:1,flame:1};
const ORDERS=[[0,0],[0,1],[1,0],[1,1]];
// A duel where both sides stand at `hp`, `leader` committing first in the first exchange.
function duel({leader=0,hp=5}={}){
 const s=createState({playerKit:{skills,spells:KIT},opponentKit:{skills,spells:KIT},firstLeader:leader});
 const t=structuredClone(s);for(const a of t.actors)a.hp=hp;return t;
}
// One exchange, both sides' moves by side; returns the core's result of the second commitment.
function exchange(s,moves){let r;for(let i=0;i<2&&!s.result;i++){const side=core.actorToMove(s);r=core.applyChoice(s,moves[side]);}return r;}

test('a mutual knockout goes to the side that committed first, which keeps its HP',()=>{
 for(const [me,leader]of ORDERS){
  const s=duel({leader}),health=s.actors.map((a)=>a.resources.health);
  exchange(s,me===0?['strike','strike']:['strike','strike']);
  assert.equal(s.result?.reason,'knockout');
  assert.ok(s.result.tiebreak,'told as a tiebreak');
  assert.equal(s.result.winner,leader,'the side that committed first wins');
  assert.equal(s.actors[leader].hp,5,"the loser's Impulse never lands");
  assert.equal(s.actors[1-leader].hp,0);
  assert.equal(s.actors[leader].resources.health,health[leader],'nor does it cost the winner Health');
 }
});

test('a knockout of one side alone is no tiebreak, and the winner keeps the damage it took',()=>{
 const s=duel({leader:1});s.actors[0].hp=20;
 exchange(s,['strike','strike']);
 assert.equal(s.result?.winner,0);assert.ok(!s.result.tiebreak);assert.equal(s.actors[0].hp,11);
});

test('the fight text tells the loser\'s blow as never landing, and how the winner won',()=>{
 for(const leader of [0,1]){
  const s=duel({leader}),before=structuredClone(s),names=fighterNames({opponentName:'the duellist',opponentLoadout:'Duellist'});
  const r=exchange(s,['strike','strike']);
  const lines=resolvedLines(before,s,{pair:s.lastPair,round:before.round,channels:[null,null],eventData:r.eventData??[]},names);
  assert.match(lines[1-leader],/never lands/,"the loser's line");
  assert.doesNotMatch(lines[1-leader],/takes? \d+ damage/);
  const fin=finishLines(before,s,s.lastPair,before.round,names).join(' ');
  assert.match(fin,/committed first/);
 }
});
