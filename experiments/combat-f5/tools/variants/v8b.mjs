import v7b from './v7b.mjs';
import {SPELLS} from '../../setup/roster.mjs';
const orig={tw:structuredClone(SPELLS.tailwind.damage),ha:structuredClone(SPELLS.haste.actions)};
export default R=>{ v7b(R); R.COMBAT_TUNING.strike={damage:9,perPoint:.025}; R.SPELLS.tailwind.damage=orig.tw; R.SPELLS.haste.actions=orig.ha; };
