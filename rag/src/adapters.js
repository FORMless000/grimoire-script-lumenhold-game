'use strict';
module.exports = {get(name) {if(name!=='lightrag')throw new Error('Only LightRAG is supported');return require('./adapters/lightrag.js');}};
