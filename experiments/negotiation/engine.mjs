// Setup and content stay readable JS; runtime rules are owned by Rust/Wasm.
export * from './reference-engine.mjs';
import {core} from './core.mjs';
export const chance=(s,card)=>core('chance',card?{...s,card:card.id}:s);
export const legalActions=s=>core('legal',s);
export const project=(s,id,event=false)=>core('project',s,{id,event});
export function applyAction(s,id){Object.assign(s,core('apply',s,{id}));return s;}
