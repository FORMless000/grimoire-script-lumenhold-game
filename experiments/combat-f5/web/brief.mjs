// A button-sized summary of an action, read from its full description (describe(), rust/core/src/text.rs), so the numbers
// are the core's own: {kind, value, label, turns}. kind colours it: dmg, heal, mana, guard (defence), buff, debuff, gold.
// Presentation only; the description stays the source of truth and shows in full when the action is selected.
const num=(text,re)=>{const m=text.match(re);return m?Math.round(Number(m[1])):null;};
const WORDS={one:1,two:2,three:3,four:4,five:5};
const turnsOf=t=>{const m=t.match(/(?:for|next) (\d+|one|two|three|four|five) (?:subsequent )?exchanges?/i);return m?WORDS[m[1]]??Number(m[1]):null;};
export function brief(id,text,channel){
 const t=text??'';
 if(id.startsWith('bundle:'))return {kind:'buff',value:'',label:id.slice(7).split('+').length===1?'1 action':id.slice(7).split('+').length+' actions'};
 if(id==='hold'||id==='release'){
  const d=num(t,/Deal (\d+(?:\.\d+)?)/);
  if(channel==='moonwell')return id==='hold'?{kind:'mana',value:'+'+num(t,/Bank (\d+(?:\.\d+)?)/),label:'Bank'}:{kind:'mana',value:'+'+num(t,/up to (\d+(?:\.\d+)?)/),label:'Mana'};
  if(channel==='lodestar')return id==='hold'?{kind:'guard',value:'+'+num(t,/Bank (\d+(?:\.\d+)?)/),label:'Absorb'}:{kind:'guard',value:num(t,/(\d+(?:\.\d+)?)-point/),label:'Shield'};
  if(channel==='siphon'&&id==='release')return {kind:'heal',value:'+'+num(t,/Heal (\d+(?:\.\d+)?)/),label:'Heal'};
  if(channel==='starlight'&&id==='hold')return {kind:'dmg',value:num(t,/to (\d+(?:\.\d+)?)/),label:'Charge'};
  if(id==='release'&&channel==='wildfire'){const e=num(t,/plus (\d+(?:\.\d+)?)/);return {kind:'dmg',value:d+(e??0),label:'Release'};}
  return d!==null?{kind:'dmg',value:d,label:id==='hold'?'Hold':'Release'}:{kind:'buff',value:'',label:id==='hold'?'Hold':'Release'};
 }
 const turns=turnsOf(t);
 switch(id){
  case 'strike':return {kind:'dmg',value:num(t,/Deal (\d+)/),label:'Physical'};
  case 'guard':return {kind:'guard',value:'',label:'Block',turns:1};
  case 'ward':return {kind:'guard',value:'',label:'Ward',turns:1};
  case 'reclaim':return {kind:'mana',value:'+'+num(t,/up to (\d+(?:\.\d+)?)/),label:'Flux'};
  case 'mend':return {kind:'heal',value:'+'+num(t,/heal (\d+(?:\.\d+)?)/i),label:'If unhit'};
  case 'heartwood':return {kind:'heal',value:'+'+num(t,/Heal (\d+(?:\.\d+)?)/),label:'Each turn'};
  case 'animate':case 'bramble':case 'contraption':return {kind:'dmg',value:num(t,/Deal (\d+(?:\.\d+)?)/),label:'Each turn'};
  case 'starlight':{const a=num(t,/Release for (\d+)/),b=num(t,/or (\d+) after/);return {kind:'dmg',value:a+'/'+b,label:'Channel'};}
  case 'wildfire':return {kind:'dmg',value:num(t,/dealing (\d+)/)??'',label:'Channel'};
  case 'omen':return {kind:'dmg',value:num(t,/hit of (\d+)/),label:'In 2 turns'};
  case 'shadowstep':return {kind:'guard',value:'',label:'Evade',turns};
  case 'brace':return {kind:'guard',value:'',label:'Brace',turns:4};
  case 'reflect':return {kind:'guard',value:'',label:'Reflect',turns:/next one/.test(t)?2:1};
  case 'rime':return {kind:'guard',value:num(t,/with (\d+) HP/),label:'Rescue'};
  case 'foresight':return {kind:'buff',value:'',label:'Reveal',turns:num(t,/for (\d+) subsequent/)};
  case 'haste':return {kind:'buff',value:num(t,/commit (\d+)/)+'×',label:'Haste',turns};
  case 'tailwind':return {kind:'buff',value:'+'+(t.match(/add ([\d/]+)/)?.[1]??''),label:'Strikes',turns:3};
  case 'seal':return {kind:'debuff',value:'',label:'Snuff flux'};
  case 'purify':return {kind:'mana',value:'+'+num(t,/gain up to (\d+(?:\.\d+)?)/),label:'Mana'};
  case 'moonwell':return {kind:'mana',value:'+'+num(t,/bank (\d+(?:\.\d+)?)/),label:'Channel'};
  case 'lodestar':return {kind:'guard',value:'+'+num(t,/bank (\d+(?:\.\d+)?)/),label:'Absorb'};
  case 'extraction':return {kind:'mana',value:num(t,/up to (\d+(?:\.\d+)?)/),label:'Steal'};
  case 'torment':return {kind:'debuff',value:num(t,/pays (\d+)/),label:'Per action',turns:3};
  case 'siphon':return {kind:'dmg',value:num(t,/deal (\d+)/),label:'Drain'};
  case 'compel':return {kind:'debuff',value:'',label:'Force',turns:2};
  case 'eclipse':return {kind:'mana',value:'',label:'Hurt → Mana',turns:2};
  case 'heartprice':return {kind:'debuff',value:'',label:'HP for Mana'};
  case 'glamour':return {kind:'gold',value:'+'+num(t,/earn (\d+)/),label:'Renown'};
  case 'rapport':return {kind:'gold',value:'',label:'Crowns → Renown'};
  case 'sleight':return {kind:'gold',value:num(t,/up to (\d+)/),label:'Steal Crowns'};
 }
 const d=num(t,/Deal (\d+)/);
 if(d!==null)return {kind:'dmg',value:d,label:/physical/.test(t)?'Physical':'Spell',turns};
 return {kind:'buff',value:'',label:/No combat effect/.test(t)?'No effect':'',turns};
}
