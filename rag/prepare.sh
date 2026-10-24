#!/bin/sh
# Check authoring readiness; explicit --build/--sync/--resume enables indexing.
set -eu
prepare_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
project_dir=$(dirname -- "$prepare_dir")
cd "$project_dir"
exec sh "$project_dir/tools/with-node24.sh" node "$prepare_dir/prepare.js" "$@"
