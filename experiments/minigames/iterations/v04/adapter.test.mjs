import test from 'node:test';import assert from 'node:assert/strict';
import * as adapter from './adapter.mjs';import {runMatch} from '../../harness.mjs';
test('unlimited fights are censored by simulation limits without a fake draw or settlement',()=>{
 const m=runMatch(adapter,{config:{},leftPolicy:'rush',rightPolicy:'rush',decisionLimit:2,censorAtLimit:true,keepTrace:true});
 assert(m.censored);assert.equal(m.result,null);assert.equal(m.ledgers,null);assert.deepEqual(m.outcomes,[null,null]);assert.equal(m.rounds,1);assert.equal(m.trace.result,null);
});
test('new iteration inherits deterministic policy replay and complementary knockout outcomes',()=>{
 const c={config:{playerLevel:20,opponentLevel:20},leftPolicy:'rush',rightPolicy:'rush',decisionLimit:100,censorAtLimit:true};
 const a=runMatch(adapter,c),b=runMatch(adapter,c);assert(!a.censored);assert.deepEqual(a.commands,b.commands);assert.deepEqual(a.ledgers,b.ledgers);assert.deepEqual([...a.outcomes].sort(),['lose','win']);
 for(const ledger of a.ledgers)for(const row of Object.values(ledger)){assert(Number.isFinite(row.final));if(row.refund)assert(row.final<=row.entry);}
});
