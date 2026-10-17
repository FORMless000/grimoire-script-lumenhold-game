// V4: the chosen scaling plus kit fixes.
//   Scaling (probe s10flat): Arcana, Vigor and Alchemy scale amounts by 1% a point, the others by 0.4%; combat HP is not
//   scaled by skill (it stands for the player's Health). Level gaps +5/+10/+20 ≈ 74/78/100%.
//   Kits: the slots Index and Quickquill freed go to combat spells in each class's theme: Scholar gets Starlight (Starcalling)
//   and Seal as extras, Illusionist gets Reflect. Compel costs 20 (the spell list's price).
import v3 from './v3-compel.mjs';
export default R=>{
 v3(R);
 Object.assign(R.COMBAT_TUNING.skill,{mainPerPoint:.01,minorPerPoint:.004});
 R.COMBAT_TUNING.hp.perPoint=0;
 R.LOADOUTS.Scholar.extras={starlight:3,seal:1};
 R.LOADOUTS.Illusionist.extras={reflect:3,rapport:2};
 R.SPELLS.compel.cost=[20];
};
