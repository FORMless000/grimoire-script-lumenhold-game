// Paired before/after check. Config fingerprints prove the gap factor (and
// version label) are the only setup changes; no rerolled seeds or price changes.
import fs from 'node:fs';import path from 'node:path';import readline from 'node:readline';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const [before,after,output]=process.argv.slice(2);if(!output||fs.existsSync(output))throw Error('Usage: gap-compare.mjs <v7 run> <v8 run> <new report.md>');
const sorted=v=>Array.isArray(v)?v.map(sorted):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sorted(v[k])])):v;
function fingerprint(c){const copy=structuredClone(c);copy.tune.version=0;copy.tune.levelGapScale=.5;return crypto.createHash('sha256').update(JSON.stringify(sorted(copy))).digest('hex');}
const key=r=>[r.level,r.gap,r.objective,r.scenario,r.episode].join('/'),old=new Map(),groups=new Map();
for await(const line of readline.createInterface({input:fs.createReadStream(path.join(before,'matches.ndjson')),crlfDelay:Infinity})){const r=JSON.parse(line);old.set(key(r),{win:Number(r.state.result.outcome==='win'),fingerprint:fingerprint(r.state.config)});}
let n=0;for await(const line of readline.createInterface({input:fs.createReadStream(path.join(after,'matches.ndjson')),crlfDelay:Infinity})){
 const r=JSON.parse(line),a=old.get(key(r));assert(a);assert.equal(a.fingerprint,fingerprint(r.state.config));
 const k=[r.level,r.gap,r.objective].join('/'),g=groups.get(k)??{level:r.level,gap:r.gap,policy:r.objective,n:0,before:0,after:0};g.n++;g.before+=a.win;g.after+=Number(r.state.result.outcome==='win');groups.set(k,g);n++;
}
assert.equal(n,old.size);const pct=(w,n)=>(100*w/n).toFixed(1)+'%',policies=['frugal','prudent','allout','dumb','hyper-frugal','ignorant'];
let text='# Half-steep skill gaps · paired comparison\n\n'+n+' matched games. Every encounter/player/resource/spell setup matches after normalizing only the version label and levelGapScale. Identical seeds and fixed search settings were used. Full wins only; partial agreement counts as failure. Each cell has 96 games sharing 48 seed clusters across two contexts.\n\nThe chance formula changes only the named-signal minus encounter-DC term from 1.3 to 0.65 percentage points per point. Card difficulty variation and Agreement targets retain their previous scaling. Winning probabilities need not become exactly half as steep because of clamps, resource choices, repeated checks and target thresholds.\n\n';
for(const policy of policies){text+='## '+policy+'\n\n| Player | Opponent DC | Previous | Half-steep | Change (points) |\n| --- | --- | --- | --- | --- |\n';for(const g of [...groups.values()].filter(g=>g.policy===policy).sort((a,b)=>a.level-b.level||a.gap-b.gap))text+='| '+[g.level,g.level+g.gap,pct(g.before,g.n),pct(g.after,g.n),((g.after-g.before)*100/g.n).toFixed(1)].join(' | ')+' |\n';text+='\n';}
text+='Raw baseline: '+before+'\n\nRaw adjusted study: '+after+'\n';fs.writeFileSync(output,text,{flag:'wx'});fs.writeFileSync(output+'.json',JSON.stringify({games:n,groups:[...groups.values()]},null,2),{flag:'wx'});console.log(output);
