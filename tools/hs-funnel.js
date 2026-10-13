// Scratch: Hollow Star funnel per play style (node tools/hs-funnel.js N styles). Not part of verify.
const path=require('path'),R=path.join(__dirname,'..');
const Engine=require(R+'/src/engine.js'),Policies=require(R+'/tools/policies.js'),{project}=require(R+'/tools/project.js');
const {content}=project(R).compileAll(); console.warn=()=>{};
const N=+process.argv[2]||60, styles=(process.argv[3]||'random,balanced,social,cautious,aggressive').split(',');
function play(seed, style){const eng=new Engine(content);let r=eng.newGame({seed,name:'H'});const picks={};
 for(let i=0;i<8000&&r.kind!=='ending';i++){ if(r.kind==='month'){r=eng.advance();continue;}
  if(r.kind==='map'){eng.pickPlaces((style.pickPlaces||Policies.pickPlaces)(eng,r.view));r=eng.advance();continue;}
  const v=r.view; let k; if(v.pick>1){const o=v.options.filter(x=>!x.disabled&&x.key!=='none');k=Policies.pickMany(eng,v,o);} else k=style.pick(eng,v);
  if(/^hs_/.test(v.id)) picks[v.id]=k; eng.choose(k); r=eng.advance(); }
 return {eng,r,picks};}
for(const sn of styles){const st=Policies.get(sn);const T={h3:0,tempted:0,night:{},beneath:{},end:{},hollowMax:[],summons:{},prep:[]};
 for(let g=0;g<N;g++){const {eng,r,picks}=play(1000+g,st);const s=eng.s;
  const hv=s.vals.hollow||0; T.hollowMax.push(hv); if(hv>=3)T.h3++; if(s.flags.hollow_tempted)T.tempted++;
  if(picks.hs_the_night)T.night[picks.hs_the_night]=(T.night[picks.hs_the_night]||0)+1;
  if(picks.hs_beneath){T.beneath[picks.hs_beneath]=(T.beneath[picks.hs_beneath]||0)+1; T.prep.push(s.vals.hs_prep);}
  if(picks.hs_isolde_summons)T.summons[picks.hs_isolde_summons]=(T.summons[picks.hs_isolde_summons]||0)+1;
  const e=(r.view&&r.view.id)||r.id||'?'; T.end[e]=(T.end[e]||0)+1;}
 const hist={};T.hollowMax.forEach(h=>hist[h]=(hist[h]||0)+1);
 console.log(sn.padEnd(10),'hollow dist',JSON.stringify(hist),'tempted',T.tempted,'summons',JSON.stringify(T.summons),'night',JSON.stringify(T.night),'beneath',JSON.stringify(T.beneath),'prep',T.prep.join(','));
 console.log('   endings',Object.entries(T.end).sort((a,b)=>b[1]-a[1]).map(([k,v])=>k.replace('ending_','')+':'+v).join(' '));}
