'use strict';
const path=require('path'),U=require('./util.js');
function selection(){const selected=U.readJSON(path.join(__dirname,'../authoring.json'));if(selected.backend!=='lightrag'||selected.profile!=='full')throw new Error('Everyday retrieval requires LightRAG/full');return selected;}
module.exports={selection,status:(engine,mode)=>({mode,...engine.status()})};
