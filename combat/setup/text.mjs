// The fight's text in another language. English stays in the modules that own it (the core's description templates,
// setup/flavor.mjs, web/brief.mjs, the labels and reasons in web/core.mjs); each string has a key, and the main game hands
// its translations by key (useText). A key without a translation shows the English. web/text-table.mjs lists every key.
let LOCAL=null;
export function useText(map){LOCAL=map&&Object.keys(map).length?map:null;}
export const textInUse=()=>!!LOCAL;
export const tx=(key,en)=>LOCAL&&LOCAL[key]!=null&&LOCAL[key]!==''?LOCAL[key]:en;
