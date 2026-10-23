// Register before the Wasm module's asynchronous initialization completes, so
// the first analysis request cannot fall into a top-level-await message gap.
const ready=import('./ai.mjs');
self.onmessage=async e=>{try{const {searchAction}=await ready;const options={depth:e.data.depth,budgetMs:50,...(e.data.state.config.research?{beam:8,samples:3}:{})};self.postMessage({token:e.data.token,decision:searchAction(e.data.state,options)});}catch(error){self.postMessage({token:e.data.token,error:error.message});}};
