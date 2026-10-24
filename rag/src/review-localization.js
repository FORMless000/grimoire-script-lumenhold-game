'use strict';
// Use the game's exact traversal: say keys count through all nested branches.
const I18n=require('../../src/i18n.js');
const G=require('../../src/grimoire.js');
const U=require('./util.js');
const cache=new Map();
function locale(data) {
  const sources=data.locales||[],key=data.localeHash||U.hash(sources);
  if(!cache.has(key)) {
    const loc=I18n.loadLocale('zh-CN',sources),paths=new Map();
    for(const [file,parsed] of Object.entries(loc.files))for(const fields of Object.values(parsed.blocks))for(const value of Object.values(fields))paths.set(value,file);
    cache.set(key,{loc,paths});
  }
  return cache.get(key);
}
function localize(def,data,language) {
  if(!def)return {def:null,translation:null};
  if(language!=='zh-CN')return {def,translation:null};
  const copy=JSON.parse(JSON.stringify(def)),{loc,paths}=locale(data),fields=[];
  const content=def.block==='game'?{game:copy}:{[G.COLLECTION[def.block]]:{[def.id]:copy}};
  I18n.visit(content,(block,key,text,set)=>{
    const entry=loc.blocks[block]?.[key];
    const status=!entry?.text?'missing':entry.hash&&entry.hash!==I18n.hash(text)?'stale':entry.hash?'translated':'unfingerprinted';
    if(status==='translated'||status==='unfingerprinted')set(entry.text);
    fields.push({key,status,text:status==='translated'||status==='unfingerprinted'?entry.text:text,english:text,englishHash:I18n.hash(text),translationHash:entry?.hash||null,file:entry?paths.get(entry):null,line:entry?.line||null});
  });
  return {def:copy,translation:{language:'zh-CN',localeHash:data.localeHash||U.hash(data.locales||[]),total:fields.length,
    translated:fields.filter(f=>['translated','unfingerprinted'].includes(f.status)).length,
    missing:fields.filter(f=>f.status==='missing').length,stale:fields.filter(f=>f.status==='stale').length,
    unfingerprinted:fields.filter(f=>f.status==='unfingerprinted').length,fields,parseErrors:loc.errors,
    policy:'Missing or stale fields visibly retain their original English. Unfingerprinted translations are used and flagged. No new translation is generated.'}};
}
module.exports={localize};
