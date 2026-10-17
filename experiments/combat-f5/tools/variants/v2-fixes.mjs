// V2 = V1 plus the earlier balance concerns: no dead combat slots, Mana engines reined in, tempo spells worth an exchange.
import v1 from './v1-scaling.mjs';
export default R=>{
 v1(R);
 for(const id of ['index','quickquill'])R.COMBAT_EXCLUDED.add(id);   // no combat effect: never take a kit slot
 const S=R.SPELLS;
 S.purify.hpCost=14;            // Distil: 14 HP for 24 Mana (was 12)
 S.extraction.cost=[10];        // Extraction: 10 Mana (was 8)
 S.haste.duration=[3,3,4];      // Haste: one more exchange of bundles
 S.tailwind.cost=[5];           // Tailwind: 5 Mana (was 8)
 S.reflect.cost=[10];           // Reflect: 10 Mana (was 16)
 S.starlight.cost=[9];          // Starlight: 9 Mana (was 12)
 S.lodestar.cost=[4];           // Lodestar: 4 Mana (was 6)
};
