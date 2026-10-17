import v8c from './v8c.mjs';
export default R=>{ v8c(R); Object.assign(R.COMBAT_TUNING.condition,{healthFloor:.85,manaFloor:.85}); };
