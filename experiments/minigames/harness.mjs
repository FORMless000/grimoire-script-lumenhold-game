import {choose} from './policies.mjs';
// Shared benchmark randomness is independent of any iteration's engine.
export function seededRng(seed){
  let state=seed|0;
  return ()=>{let a=(state=(state+0x6D2B79F5)|0);let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296;};
}
export function episodeSeed(base,index){return (base+Math.imul(index+1,0x9E3779B9))>>>0;}
export function runMatch(adapter,{config,episodeSeed:seed,skillShift=0,skillShiftSide=0,checkShift=0,leftPolicy,rightPolicy,information='native',keepTrace=false,decisionLimit=200,censorAtLimit=false}){
  const game=adapter.create(config,{episodeSeed:seed,skillShift,skillShiftSide,checkShift});
  let steps=0;
  if(adapter.decisions){
    if(!Number.isInteger(decisionLimit)||decisionLimit<1)throw Error('Invalid simulation decision limit');
    while(!adapter.ended(game)){
      const side=adapter.actorToMove(game),decision=adapter.choose(game,side,[leftPolicy,rightPolicy][side]);
      adapter.advance(game,decision);
      if(++steps>=decisionLimit&&!adapter.ended(game)){
        if(!censorAtLimit)throw Error('Decision adapter failed to terminate');
        // A simulation budget is not a gameplay timeout or a draw. No settlement
        // is fabricated for an unfinished fight with unlimited exchanges.
        return {...adapter.metrics(game),censored:true,decisionLimit,...(keepTrace?{trace:adapter.trace(game)}:{})};
      }
    }
    return {...adapter.metrics(game),...(censorAtLimit?{censored:false,decisionLimit}:{}),...(keepTrace?{trace:adapter.trace(game)}:{})};
  }
  while(!adapter.ended(game)){
    // Opponent commits first, as in v01. Right policy cannot inspect left's choice.
    const right=choose(rightPolicy,adapter.observe(game,1,{information:'blind'}));
    adapter.commitOpponent(game,right);
    const left=choose(leftPolicy,adapter.observe(game,0,{information}));
    adapter.advance(game,left);
    if(++steps>100)throw Error('Adapter failed to terminate.');
  }
  return {...adapter.metrics(game),...(keepTrace?{trace:adapter.trace(game)}:{})};
}
