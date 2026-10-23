// One fight against a special foe, exchange by exchange (F5.11 tuning): both moves, HP and Mana after, and the hits.
//   node tools/creature-trace.mjs <class> <foe> <class level> <foe level> [player preset] [foe preset] [seed] [leader] [--variant f]
import {play,applyVariant,formatTrace} from './arms.mjs';
const args=process.argv.slice(2),vi=args.indexOf('--variant');if(vi>=0){await applyVariant(args[vi+1]);args.splice(vi,2);}
const [p,o,lp,lo,pp='engine',fp='medium',seed='1',leader='1']=args;
const {createState}=await import('../setup/setup.mjs');
const LIVE={maxDepth:5,nodeBudget:3e6,mistakeChance:0};
const s=createState({playerLoadout:p,opponentLoadout:o,playerLevel:+lp,opponentLevel:+lo,firstLeader:+leader,context:'real_conflict',ai:[pp,fp].map((preset,side)=>({...LIVE,preset,seed:+seed*7919+side}))});
const {lastEvents,...state}=s;
const [r]=play([{meta:{},state,search:{},maxRounds:80,tableLimit:16384,trace:true}]);
const t=await formatTrace(r.trace);
console.log(`${p} L${lp} (${s.actors[0].maxHP} HP, ${s.actors[0].kit.capacity} Mana: ${Object.entries(s.actors[0].kit.spells).map(([k,v])=>k+(v>1?v:'')).join(' ')}) vs ${o} L${lo} (${s.actors[1].maxHP} HP, ${s.actors[1].kit.capacity} Mana)`);
for(const h of t.history){const hits=(h.eventData??[]).filter(e=>e.type==='hit').map(e=>`${e.source?'F':'P'}:${e.id} ${Math.round(e.raw)}→${Math.round(e.amount)}${e.by?.length?'('+e.by.join('+')+')':''}`).join(' ');
 console.log(`${String(h.round).padStart(2)} ${String(h.pair?.[0]??h.actions?.[0]).padEnd(18)} ${String(h.pair?.[1]??h.actions?.[1]).padEnd(14)} HP ${h.hp?.map(Math.round).join('/')} Mana ${h.mana?.map(Math.round).join('/')} ${hits}`);}
console.log(r.result);
