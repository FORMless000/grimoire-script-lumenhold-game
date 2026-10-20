import {searchAction} from './ai.mjs';
self.onmessage=e=>{try{self.postMessage({token:e.data.token,decision:searchAction(e.data.state,{budgetMs:50})});}catch(error){self.postMessage({token:e.data.token,error:error.message});}};
