#!/bin/sh
# F5.11 creature tuning: the three measurements of the creature targets for some foes, with trial values (TUNE, JSON; see
# tools/variants/f511-tune.mjs), side by side:
#   T1  engine classes 10 levels below the foe on medium     (target: the classes win > 80%)
#   T2  engine classes at the foe's level, the foe on engine (target: 20–80%)
#   T3  medium classes 10 levels below the foe on medium     (the fall-off from T1 when the player plays worse)
#   TUNE='{"Bristleback":{"hp":1.3}}' tools/creature-tune.sh "Bristleback;Stag beetle" [tag] [extra creature-study options]
cd "$(dirname "$0")/.." || exit 1
foes=$1; tag=${2:-tune}; if [ $# -ge 2 ]; then shift 2; else shift $#; fi; out=out/creature
mkdir -p $out
node tools/creature-study.mjs --foes "$foes" --seeds 2 --variant tools/variants/f511-tune.mjs --json $out/$tag-t1.json "$@" >/dev/null &&
node tools/creature-study.mjs --foes "$foes" --seeds 1 --gap 0 --foe engine --variant tools/variants/f511-tune.mjs --json $out/$tag-t2.json "$@" >/dev/null &&
node tools/creature-study.mjs --foes "$foes" --seeds 2 --player medium --variant tools/variants/f511-tune.mjs --json $out/$tag-t3.json "$@" >/dev/null &&
node -e '
const fs=require("fs"),[t1,t2,t3]=["t1","t2","t3"].map(k=>JSON.parse(fs.readFileSync(process.argv[1]+"-"+k+".json")).cells);
const mix=c=>{const tot=Object.values(c.acts).reduce((a,b)=>a+b,0);return Object.entries(c.acts).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([a,n])=>a+" "+Math.round(100*n/tot)).join(", ");};
const pct=x=>(100*x).toFixed(0).padStart(3)+"%";
for(const [i,c] of t1.entries())console.log(`${c.foe.padEnd(22)} L${String(c.level).padEnd(3)} T1 ${pct(c.wins)} T2 ${pct(t2[i].wins)} T3 ${pct(t3[i].wins)} | margin T2 ${(100*t2[i].margin).toFixed(0).padStart(4)} | ex ${t2[i].rounds.toFixed(0)} | med: ${mix(c)} | eng: ${mix(t2[i])}`);' $out/$tag
