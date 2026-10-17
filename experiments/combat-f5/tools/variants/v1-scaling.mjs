// V1: skills drive progression. Main combat skills (Arcana, Vigor, Alchemy) scale every amount by 1% a point, the others by 0.4%;
// combat HP follows Vigor, Mana capacity follows Arcana; spell ranks step more gently to make room.
export default R=>{
 const T=R.COMBAT_TUNING;
 Object.assign(T.skill,{mainPerPoint:.01,minorPerPoint:.004});
 Object.assign(T.hp,{skills:['vigor'],perPoint:.008});
 T.capacity={base:43,slope:.25,weights:{arcana:1}};
 const S=R.SPELLS;
 S.flame.cost=[9,9,8];
 S.mend.cost=[9,9,8];S.mend.healing=[25,26,27];
 S.foresight.cost=[7,7,6];
 S.shadowstep.cost=[12,12,12];S.shadowstep.duration=[1,2,2];
 S.haste.cost=[5,5,5];
};
