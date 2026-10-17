// Bench positions: the 48 public fixtures plus mid-fight positions from seeded fallible-AI play.
import {searchFixtures} from './search-fixtures.mjs';
// E: setup (createState, LOADOUTS) plus the core API (web/core.mjs).
export async function positions(E,{mid=true}={}){
 const out=searchFixtures(E).map(f=>({id:f.id,state:f.state}));
 if(!mid)return out;
 const G=Object.keys(E.LOADOUTS);
 for(const level of [50,80])for(let i=0;i<G.length;i++){
  const s=E.createState({playerLoadout:G[i],opponentLoadout:G[(i+4)%G.length],playerLevel:level,opponentLevel:level,firstLeader:i%2,ai:[{profile:'fallible',seed:i*2+level},{profile:'fallible',seed:i*2+1+level}]});
  const want=new Set([6,12]);
  while(!s.result&&s.round<=14){
   if(want.has(s.round)&&s.pending[0]===null&&s.pending[1]===null){{const c=E.cloneState(s);delete c.searching;c.history=Array.from({length:s.round-1},(_,k)=>({round:k+1}));c.searchStats=[];out.push({id:`mid-${level}-${G[i]}-r${s.round}`,state:c});}want.delete(s.round);}
   const d=E.chooseAIAction(s,{maxDepth:1,nodeBudget:20000});E.applyChoice(s,d.id);
  }
 }
 return out;
}
