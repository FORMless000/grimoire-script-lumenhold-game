'use strict';
const path=require('path'),U=require('./util.js');
function selection(){const selected=U.readJSON(path.join(__dirname,'../authoring.json'));if(!['grim','lightrag'].includes(selected.backend)||selected.profile!=='full')throw new Error('Everyday retrieval requires grim/full or lightrag/full');return selected;}
module.exports={selection,status:(engine,mode)=>({mode,...engine.status()})};
