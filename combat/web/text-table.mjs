// Every string of the fight a main game can translate, by key, with its English: the core's description templates
// (d.*, w.*), action names (label.*), why an action can't be taken (unavailable.*), the button summaries (brief.*), the
// fight's lines (setup/flavor.mjs: flavor.*, attack.*, line.*, grammar.*…) and the generic foes' names (foe.*). The main
// game's `grim i18n` writes them to locales/<lang>/combat.lang; its UI hands the translations to useText().
import {textTable,BASIC_LABELS,UNAVAILABLE} from './core.mjs';
import {BRIEF_LABELS} from './brief.mjs';
import {flavorTable} from '../setup/flavor.mjs';
import {FOES} from '../setup/foes.mjs';
import {SPELLS} from '../setup/roster.mjs';
export function combatTextTable(){
 const t={...textTable(),'w.listSep':', '};
 for(const [k,v]of Object.entries(BASIC_LABELS))t['label.'+k]=v;
 for(const [k,v]of Object.entries(SPELLS))t['label.'+k]=v.name;
 for(const [k,v]of Object.entries(UNAVAILABLE))t['unavailable.'+k]=v;
 for(const [k,v]of Object.entries(BRIEF_LABELS))t['brief.'+k]=v;
 Object.assign(t,flavorTable());
 for(const [k,v]of Object.entries(FOES))if(v.name)t['foe.'+k]=v.name;
 return t;
}
