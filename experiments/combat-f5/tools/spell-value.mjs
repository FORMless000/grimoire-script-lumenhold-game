// What a spell is worth to the one who holds it: the holder (engine AI, no persona) plays every class at the same level,
// with the spell and with it taken out of the kit; the win-rate gap is its value, and casts (and Holds) per fight say
// whether the engine wants it. Spells a holder doesn't learn by then are put in its kit for the test.
//   node tools/spell-value.mjs [--spells wildfire,omen] [--levels 40,55] [--depth 4] [--variant tools/variants/x.mjs] [--ai engine]
import {armCases,play,applyVariant} from './arms.mjs';
import {LOADOUTS} from '../setup/roster.mjs';
const args=process.argv.slice(2),opt=(k,d)=>{const i=args.indexOf('--'+k);return i<0?d:args[i+1];};
// Each spell's holder: the character it belongs to, or a loadout whose play it fits.
export const HOLDERS={wildfire:'Lyra',heartwood:'Tobias',omen:'Seraphine',contraption:'Mir',hoarfrost:'Kael',rime:'Ilse',
 starlight:'Seraphine',moonwell:'Healer',lodestar:'Bram',siphon:'Hollow adept',compel:'The man in grey'};
const variant=opt('variant');if(variant)await applyVariant(variant);
const spells=opt('spells',Object.keys(HOLDERS).join(',')).split(','),levels=opt('levels','40,55').split(',').map(Number),depth=Number(opt('depth',4)),ai=opt('ai','engine');
const cases=[];
for(const sp of spells)for(const without of [false,true]){
 const holder=HOLDERS[sp];
 for(const c of armCases({named:[holder],foes:Object.keys(LOADOUTS),levels,ai:[{preset:ai},{preset:ai}],search:{maxDepth:depth,nodeBudget:3e6,prune:true},config:{playerYear:2},maxRounds:120})){
  const kit=c.state.actors[0].kit.spells;if(without)delete kit[sp];else kit[sp]??=1;
  c.meta={...c.meta,sp,without};cases.push(c);}
}
const rs=play(cases),cell={};
rs.forEach((r,i)=>{const {sp,without}=cases[i].meta,c=(cell[sp]??={})[without]??={n:0,w:0,casts:0,holds:0,rounds:0};
 c.n++;c.w+=!r.result||r.result.winner===undefined?.5:r.result.winner===0?1:0;c.casts+=r.acts[0][sp]??0;c.holds+=r.acts[0].hold??0;c.rounds+=r.rounds;});
const pct=x=>Math.round(100*x);
console.log(`Engine-played holder vs every class at levels ${levels.join('/')} (depth ${depth}, ${ai} both sides)${variant?' · '+variant:''}\n`);
console.log('| Spell | Holder | Wins with | Wins without | Value | Casts / fight | Holds / fight | Exchanges |\n|---|---|---:|---:|---:|---:|---:|---:|');
for(const sp of spells){const a=cell[sp][false],b=cell[sp][true];
 console.log(`| ${sp} | ${HOLDERS[sp]} | ${pct(a.w/a.n)}% | ${pct(b.w/b.n)}% | ${pct((a.w-b.w)/a.n)>=0?'+':''}${pct((a.w-b.w)/a.n)} | ${(a.casts/a.n).toFixed(2)} | ${(a.holds/a.n).toFixed(2)} | ${(a.rounds/a.n).toFixed(1)} |`);}
