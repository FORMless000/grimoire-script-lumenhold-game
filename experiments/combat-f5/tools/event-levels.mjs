// Every played combat card's foe level over the months it can appear, from the card's own challenge (challengeDC → foeLevel),
// next to the player's skills in those months (the main game's measured progression, below).
//   node tools/event-levels.mjs [--at 6,24,42]   (--at: each card's foe level in those months; · when it can't appear)
// Months come from the card's `when:` (month, year, turn comparisons joined by `and`); a card queued by another (the
// tournament rounds, the ring bouts) or with no such condition counts as any month. Characters' stats grow as the main game's
// npc_growth does (peers and Thornwick students: every skill × k(turn), the best one reaching 0.9 × the last E).
import {readFileSync,readdirSync,statSync} from 'node:fs';
import {join} from 'node:path';import {pathToFileURL} from 'node:url';
import {EVENTS,FOES,challengeDC,foeLevel,defaultDrift} from '../setup/foes.mjs';
import {CAST_STATS} from '../setup/cast-stats.mjs';
const root=new URL('../../../content',import.meta.url).pathname;
const balance=readFileSync(join(root,'core/balance.grim'),'utf8');
const field=k=>balance.match(new RegExp('^'+k+':((?:.*\\n)(?:  .*\\n)*)','m'))[1].replace(/\s+/g,' ').trim().split(' ');
const tiers=Object.fromEntries(field('dc_tiers').reduce((a,x,i,arr)=>i%2?a:[...a,[x,Number(arr[i+1])]],[]));
const curve=field('curve').map(Number),E=t=>curve[Math.min(curve.length,t)-1];
// The player's skills in the main game (2026-10-17: 40 games per style on the current build; "best" and "2nd" are each run's
// highest skills that month, averaged). Balanced style unless named.
export const PLAYER={month:[3,6,12,18,24,30,36,42,47],E:[14,19,26,33,40,46,53,57,61],average:[19,21,28,34,41,47,54,59,63],best:[33,35,42,48,56,63,71,75,80],second:[25,27,33,41,48,55,63,69,73],weakest:[9,11,17,22,27,33,37,41,44],focusedBest:[32,34,47,56,74,80,86,91,96]};
export const playerAt=(row,t)=>{const m=PLAYER.month;if(t<=m[0])return PLAYER[row][0];for(let i=1;i<m.length;i++)if(t<=m[i])return Math.round(PLAYER[row][i-1]+(PLAYER[row][i]-PLAYER[row][i-1])*(t-m[i-1])/(m[i]-m[i-1]));return PLAYER[row].at(-1);};
// npc_growth (src/engine.js peerGrowth): every skill × 1 + (K − 1) × progress, K = 0.9 × last E / best skill.
const statAt=(npc,stat,t)=>{const c=CAST_STATS[npc];if(!c)return null;const top=Math.max(...Object.values(c.skills)),K=.9*curve.at(-1)/top,k=c.grows&&K>1?1+(K-1)*Math.min(1,Math.max(0,(E(t)-curve[0])/(curve.at(-1)-curve[0]))):1;return c.skills[stat]*k;};
const peers=Object.entries(CAST_STATS).filter(([,c])=>c.grows).map(([id])=>id);
// Cards: class, when, and each combat challenge line.
const walk=d=>readdirSync(d).flatMap(f=>{const p=join(d,f);return statSync(p).isDirectory()?walk(p):p.endsWith('.grim')?[p]:[];});
const cards={};
for(const file of walk(root)){let ev=null,opt=null;
 for(const line of readFileSync(file,'utf8').split('\n')){
  const e=line.match(/^@event\s+(\S+)/);if(e){ev=cards[e[1]]={id:e[1],cls:'routine',when:'',challenges:[]};opt=null;continue;}if(/^@/.test(line)){ev=null;continue;}if(!ev)continue;
  const c=line.match(/^class:\s*(\S+)/);if(c)ev.cls=c[1];const w=line.match(/^when:\s*(.*)$/);if(w)ev.when=w[1];
  const o=line.match(/^>\s*([\w-]+)\s*:/);if(o)opt=o[1];
  const ch=line.match(/^\s*challenge\s+(combat|duel)\s+(.*?):?\s*$/);if(ch)ev.challenges.push({option:opt,text:ch[2]});
 }}
// Months a card can appear in, from its when: (and-joined month/year/turn comparisons).
const QUEUED={tournament_semifinal:'month == 8',tournament_final:'month == 8'};   // queued the same month by spring_tournament(_circle)
function months(card){
 const when=QUEUED[card.id]??card.when;if(/\bor\b/.test(when))return null;
 const conds=[...when.matchAll(/\b(month|year|turn)\s*(==|>=|<=|>|<|!=)\s*(\d+)/g)];if(!conds.length)return null;
 const ok=t=>conds.every(([,k,op,n])=>{const v=k==='turn'?t:k==='month'?((t-1)%12)+1:Math.ceil(t/12);n=+n;return op==='=='?v===n:op==='>='?v>=n:op==='<='?v<=n:op==='>'?v>n:op==='<'?v<n:v!==n;});
 return Array.from({length:curve.length},(_,i)=>i+1).filter(ok);
}
const parse=text=>{const w=text.split(/\s+/),r={drift:null,nature:'even',rungs:0};
 for(let i=0;i<w.length;i++){const x=w[i];
  if(x==='using'){i++;continue;}if(x==='drift'){r.drift=w[++i];continue;}if(x==='vs'){const [who,stat]=w[++i].split('.');r.vs={who,stat};continue;}
  if(/^[+-]\d+$/.test(x)){r.rungs=+x;continue;}if(tiers[x]!==undefined){r.rung=x;continue;}
  if(['certain','sure','likely','even','unlikely','slim','long_shot','freak'].includes(x))r.nature=x;}
 return r;};
const range=a=>{const v=a.filter(x=>x!=null);if(!v.length)return '—';const lo=Math.min(...v),hi=Math.max(...v);return lo===hi?String(lo):lo+'–'+hi;};
export function eventLevels(){
const rows=[];
for(const [key,dec]of Object.entries(EVENTS)){if(!dec.play)continue;const [id,option]=key.split('/'),card=cards[id];
 for(const ch of card.challenges.filter(c=>c.option===option)){
  const p=parse(ch.text),drift=p.drift??defaultDrift(card.cls),ts=months(card)??Array.from({length:curve.length},(_,i)=>i+1);
  const at=t=>{const vsPeers=p.vs?.who==='here'?peers:p.vs?[p.vs.who]:null;
   const bases=vsPeers?vsPeers.map(n=>statAt(n,p.vs.stat,t)).filter(x=>x!=null):[tiers[p.rung]];
   return bases.map(base=>foeLevel({dc:challengeDC({base,rungs:p.rungs,drift,expected:E(t)}),nature:p.nature}));};
  const byMonth=Object.fromEntries(ts.map(t=>[t,at(t)])),levels=ts.flatMap(at),foes=[dec.play].flat().map(f=>FOES[f]?.name??FOES[f]?.loadout??f).join(' / ');
  rows.push({key,challenge:ch.text,cls:card.cls,drift,months:months(card)?(ts.length>12?ts[0]+'–'+ts.at(-1):ts.join(',')):'any',byMonth,E:range(ts.map(E)),level:range(levels),avg:range(ts.map(t=>playerAt('average',t))),best:range(ts.map(t=>playerAt('best',t))),foes});
 }}
return rows;}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const rows=eventLevels();
const ai=process.argv.indexOf('--at');
if(ai>0){const ms=process.argv[ai+1].split(',').map(Number);
 console.log(`| Card / option | Challenge | ${ms.map(m=>'month '+m+' (E '+E(m)+', avg '+playerAt('average',m)+', best '+playerAt('best',m)+')').join(' | ')} |\n|---|---|${ms.map(()=>'---:').join('|')}|`);
 for(const r of rows)console.log(`| ${r.key} | ${r.challenge} | ${ms.map(m=>{const v=r.byMonth[m];return v?(Math.min(...v)===Math.max(...v)?v[0]:Math.min(...v)+'–'+Math.max(...v)):'·';}).join(' | ')} |`);process.exit(0);}
console.log('| Card / option | Challenge | Drift | Months | E(turn) | **Foe level** | Player average / best | Foe |\n|---|---|---|---|---|---:|---|---|');
for(const r of rows)console.log(`| ${r.key} | ${r.challenge} | ${r.drift} | ${r.months} | ${r.E} | **${r.level}** | ${r.avg} / ${r.best} | ${r.foes} |`);
}
