#!/bin/sh
# Select this project's runtime without changing the user's global shell configuration.
set -eu
is_node24() { [ -x "$1" ] && [ "$("$1" -p 'process.versions.node.split(".")[0]')" = 24 ]; }
if [ -n "${NODE24_BIN:-}" ]; then
  is_node24 "$NODE24_BIN" || { echo 'NODE24_BIN must name a Node 24 executable' >&2; exit 1; }
  selected_node="$NODE24_BIN"
elif command -v node >/dev/null && is_node24 "$(command -v node)"; then
  selected_node="$(command -v node)"
else
  selected_node=''
  for candidate in /opt/homebrew/opt/node@24/bin/node /usr/local/opt/node@24/bin/node; do
    if is_node24 "$candidate"; then selected_node="$candidate"; break; fi
  done
  [ -n "$selected_node" ] || { echo 'Node 24 required. Install Node 24 (macOS: brew install node@24), then retry. No second runtime manager is needed.' >&2; exit 1; }
fi
PATH="$(dirname "$selected_node"):$PATH"
export PATH
exec "$@"
