// Register before the Wasm module's asynchronous initialization completes, so
// the first analysis request cannot fall into a top-level-await message gap.
const ready=import('./ai.mjs');
self.onmessage=async e=>{try{const {searchAction}=await ready;self.postMessage({token:e.data.token,decision:searchAction(e.data.state,{depth:e.data.depth,budgetMs:50})});}catch(error){self.postMessage({token:e.data.token,error:error.message});}};
