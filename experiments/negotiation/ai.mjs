import {core} from './core.mjs';
export {race,branches} from './reference-ai.mjs';
export const candidates=s=>core('candidates',s);
export const evaluate=s=>core('evaluate',s);
export function searchAction(s,options={}){
 // Fixed-node searches are reproducible; production analysis uses a 50 ms cap.
 const {now,...settings}=options;
 if(now)settings.fixedNodes=true;
 return core('search',s,{options:settings});
}
