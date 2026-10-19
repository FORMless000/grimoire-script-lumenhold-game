#!/bin/zsh
# Full simulated playtest: the balance suite with every fight traced (and an all-spells arm), then one report with class win rates,
# fight stats, level gaps, how good each spell and action is in the class kits, and every spell rated with all spells available.
#   tools/playtest.sh <name> [depth=5] ['<extra config JSON>'] [baseline name]      VARIANT=tools/variants/x.mjs to try a roster edit
#   e.g. tools/playtest.sh F53_D5            → out/F53_D5-report.md
#        VARIANT=tools/variants/skill1pct.mjs tools/playtest.sh SK1_D4 4 '{}' F53_D4
set -e
cd ${0:a:h}/..; name=${1:?name}; depth=${2:-5}; config=${3:-'{}'}; base=$4
vargs=(); [[ -n $VARIANT ]] && vargs=(--variant $VARIANT)
node tools/suite.mjs $name --depth $depth --config "$config" $vargs --trace --all
report=out/${name}-report.md
{ echo "# Playtest $name: depth $depth, $(node -e "import('./web/core.mjs').then(C=>console.log(C.RULES_VERSION))"), $(date '+%Y-%m-%d %H:%M')"; echo
  echo "Config: \`$config\`${VARIANT:+; variant \`$VARIANT\`}. Each side searches $depth exchanges per decision; fallible AI (seeded deliberate mistakes). Replay any fight: \`node tools/replay.mjs out/${name}_cross.jsonl <line>\`."; echo
  node tools/report.mjs ${base:+$base} $name; echo
  node tools/action-report.mjs $name; echo
  echo "## Every spell, with all spells available (levels 30 and 60, search depth ≤ 3)"; echo
  node tools/action-report.mjs $name --all | tail -n +2; } > $report
echo "report → $report"
