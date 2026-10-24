'use strict';
const A=require('./adapters.js');
module.exports={run:require('./process.js').run,index:(backend,...args)=>A.get(backend).index(...args),search:(backend,...args)=>A.get(backend).search(...args)};
