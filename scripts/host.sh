#!/usr/bin/env bash
# Host Lumenhold Academy on all network interfaces (0.0.0.0), for this machine and the local network.
# Linux and macOS.   ./scripts/host.sh [PORT]        (default 4173; or PORT=… / ADMIN_TOKEN=… / DATA_DIR=…)
# The admin token is kept in data/.host-token so the links stay the same between runs.
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v node >/dev/null 2>&1; then echo "Node.js 20 or newer is required: https://nodejs.org/" >&2; exit 1; fi
major="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$major" -lt 20 ]; then echo "Node.js 20 or newer is required (found $(node -v))." >&2; exit 1; fi

export HOST=0.0.0.0
export PORT="${1:-${PORT:-4173}}"
export ADMIN_TOKEN="${ADMIN_TOKEN:-$(node scripts/host-info.js token)}"

echo "Lumenhold Academy, hosted on port $PORT"
node scripts/host-info.js urls "$PORT" "$ADMIN_TOKEN"
case "$(uname -s)" in
  Darwin) echo "  macOS may ask whether to accept incoming connections for node: choose Allow." ;;
  Linux)  echo "  If other machines can't connect, open the port in your firewall (e.g. sudo ufw allow $PORT/tcp)." ;;
esac
echo "  Stop with Ctrl+C."
echo
exec node server/index.js
