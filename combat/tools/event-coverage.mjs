// Checks that every `challenge combat` / `challenge duel` in the main game's content has a decision in EVENTS
// (setup/foes.mjs), that every decision still matches a card, and that every foe's loadout exists.
//   node tools/event-coverage.mjs [--list]   (--list prints each card's decision)
import {readFileSync,readdirSync,statSync} from 'node:fs';
import {join} from 'node:path';
import {EVENTS,FOES,POOLS,foeLoadouts,knownLoadout,fightSetting} from '../setup/foes.mjs';
import {CONTEXTS} from '../setup/roster.mjs';
const root=new URL('../../content',import.meta.url).pathname;
const walk=d=>readdirSync(d).flatMap(f=>{const p=join(d,f);return statSync(p).isDirectory()?walk(p):p.endsWith('.grim')?[p]:[];});
const found=[];
for(const file of walk(root)){
 let event=null,option=null;
 readFileSync(file,'utf8').split('\n').forEach((line,i)=>{
  const e=line.match(/^@event\s+(\S+)/);if(e){event=e[1];option=null;}else if(/^@/.test(line))event=null;
  const o=line.match(/^>\s*([\w-]+)(?:\[[^\]]*\])?\s*:/);if(o)option=o[1];   // `> up[flame]:` / `> up[item:x]:` is the `up` option
  const c=line.match(/^\s*challenge\s+(combat|duel)\b(.*)$/);
  if(c&&event)found.push({key:event+'/'+option,kind:c[1],rest:c[2].trim().replace(/:$/,''),where:file.slice(root.length-7)+':'+(i+1)});
 });
}
const problems=[];
for(const f of found)if(!EVENTS[f.key])problems.push(`no decision for ${f.key} (${f.where})`);
for(const k of Object.keys(EVENTS))if(!found.some(f=>f.key===k))problems.push(`decision ${k} matches no card`);
for(const [k,v]of Object.entries(EVENTS))for(const foe of [v.play??[]].flat())if(!FOES[foe])problems.push(`${k}: unknown foe ${foe}`);
for(const [k,f]of Object.entries(FOES))if(f.pool&&!POOLS[f.pool])problems.push(`foe ${k}: unknown pool ${f.pool}`);
// Every played challenge resolves a context (the rebates) and states its audience, for every foe it can draw.
for(const f of found){const e=EVENTS[f.key];if(!e?.play)continue;const i=found.filter(g=>g.key===f.key).indexOf(f);
 for(const foe of [e.play].flat()){const st=fightSetting(f.key,i,foe);
  if(!CONTEXTS[st.context])problems.push(`${f.key} #${i+1} (${foe}): no context`);
  if(typeof st.observers!=='boolean'||typeof st.witnesses!=='boolean')problems.push(`${f.key} #${i+1}: observers and witnesses must both be stated`);
  else if(st.observers&&!st.witnesses)problems.push(`${f.key} #${i+1}: an audience is always a witness`);}}
for(const l of new Set(foeLoadouts()))if(!knownLoadout(l))problems.push(`unknown loadout ${l}`);
if(process.argv.includes('--list'))for(const f of found){const d=EVENTS[f.key]??{};{const i=found.filter(g=>g.key===f.key).indexOf(f),st=d.play?fightSetting(f.key,i):null;console.log(`${f.key.padEnd(34)} ${f.kind.padEnd(6)} ${f.rest.padEnd(36)} ${d.convert?'convert → '+d.convert:'play '+[d.play].flat().join(' / ')+` · ${st.context} · ${st.observers?'audience':st.witnesses?'witnessed':'unseen'}`}`);}}
const played=found.filter(f=>EVENTS[f.key]?.play).length;
console.log(`${found.length} combat challenges on ${new Set(found.map(f=>f.key.split('/')[0])).size} cards: ${played} played, ${found.length-played} converted.`);
if(problems.length){console.log(problems.join('\n'));process.exit(1);}
