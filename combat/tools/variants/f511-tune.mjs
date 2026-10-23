// F5.11 tuning: trial values from the TUNE environment variable (JSON), on top of the roster:
//   {"Bristleback":{"hp":1.3,"mana":1,"kit":{…},"persona":{…},"start":{"hp":.6}},"spells":{"maul":{"amounts":{"hit":30},"cost":[4]}},
//    "constructs":{"brood":{"power":8}}}
// A name with '#' is a trial copy: "Bristleback#2" clones Bristleback (and its persona), "maul#2" clones Maul, so one run
// can compare several versions side by side.
import {PERSONAS} from '../../setup/foes.mjs';
export default R=>{
 const t=JSON.parse(process.env.TUNE||'{}'),base=id=>id.split('#')[0];
 for(const [id,x]of Object.entries(t.spells??{})){const s=R.SPELLS[id]??={...R.SPELLS[base(id)]};Object.assign(s,{...x,amounts:{...s.amounts,...x.amounts}});}
 for(const id of Object.keys(R.SPELLS))if(R.SPELLS[id].construct&&!R.CONSTRUCTS[id])R.CONSTRUCTS[id]={...R.CONSTRUCTS[base(id)]};
 for(const [id,x]of Object.entries(t.constructs??{}))Object.assign(R.CONSTRUCTS[id]??={...R.CONSTRUCTS[base(id)]},x);
 for(const [foe,x]of Object.entries(t)){if(foe==='spells'||foe==='constructs')continue;const {persona,...rest}=x;
  const def=R.SPECIAL_LOADOUTS[foe]??={...R.SPECIAL_LOADOUTS[base(foe)]};Object.assign(def,rest);
  PERSONAS[foe]=persona??PERSONAS[foe]??{...PERSONAS[base(foe)]};}
};
