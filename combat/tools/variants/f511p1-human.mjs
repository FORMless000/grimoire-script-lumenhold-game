// F5.11-plan.1 human balance: trial values from TUNE (JSON) on top of the roster, for tools/human-study.mjs:
//   {"spells":{"tailwind":{"cost":[6],"amounts":{"step":5}}},"loadouts":{"Duellist":{"extras":{"brace":3}}},
//    "tuning":{"strike":{"damage":10}}}
// Spells merge field by field (amounts too); loadouts and tuning merge one level deep.
export default R=>{
 const t=JSON.parse(process.env.TUNE||'{}');
 for(const [id,x]of Object.entries(t.spells??{})){const s=R.SPELLS[id];Object.assign(s,{...x,amounts:{...s.amounts,...x.amounts}});}
 for(const [id,x]of Object.entries(t.loadouts??{}))Object.assign(R.LOADOUTS[id],x);
 for(const [k,x]of Object.entries(t.tuning??{}))R.COMBAT_TUNING[k]=typeof x==='object'?{...R.COMBAT_TUNING[k],...x}:x;
};
