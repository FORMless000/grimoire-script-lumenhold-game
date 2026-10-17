#!/bin/zsh
# Shorthand for tools/suite.mjs (see there): tools/suite-f5.sh [name=RS] ['<extra config JSON>'], with DEPTH, BUDGET, TRACE=1, VARIANT, ALL=1 from the environment.
cd ${0:a:h}/..
extra=(); [[ -n $BUDGET ]] && extra+=(--budget $BUDGET); [[ -n $VARIANT ]] && extra+=(--variant $VARIANT); [[ -n $TRACE ]] && extra+=(--trace); [[ -n $ALL ]] && extra+=(--all)
node tools/suite.mjs ${1:-RS} --depth ${DEPTH:-4} --config "${2:-{\}}" $extra
