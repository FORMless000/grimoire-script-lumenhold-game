// P1 = F5.6 plus: every skill scales its spells by 1% a point (was 0.4% outside Arcana/Vigor/Alchemy); combat HP grows
// 1% a point of the skills, Vigor counted twice (so a low-Vigor class isn't squishy); a bigger Mana pool from all skills,
// Arcana counted twice, at 0.35 a point. Aim: late fights a little longer, progression from every skill.
export default R=>{
 const T=R.COMBAT_TUNING;
 T.skill.minorPerPoint=.01;
 T.hp={skills:['vigor','vigor','arcana','lore','alchemy','charm','guile'],perPoint:.01};
 T.capacity={base:43,slope:.35,weights:{arcana:2,lore:1,alchemy:1,charm:1,vigor:1,guile:1}};
};
