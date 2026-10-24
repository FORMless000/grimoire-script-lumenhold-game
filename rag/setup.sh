#!/bin/sh
# Prepare LightRAG only, regardless of the caller's working directory.
set -eu
setup_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
project_dir=$(dirname -- "$setup_dir")
cd "$project_dir"
exec sh "$project_dir/tools/with-node24.sh" node "$setup_dir/setup.js" "$@"
