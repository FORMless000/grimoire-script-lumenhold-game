#!/usr/bin/env bash
# Copy the live server's data (saves, run logs, feedback, players) down for local analysis:
#   deploy/pull-data.sh [<ssh-destination>]
#   deploy/pull-data.sh --from <folder>
#   <ssh-destination>  what you type after `ssh` (e.g. ec2-user@1.2.3.4); default: the host of the `live` git remote
#   --from <folder>    copy from a data folder on this machine instead (a backup you downloaded; also how it's tested)
# Each pull lands in its own dated folder, data-live/<date-time>/, and data-live/latest points at the newest one.
# It only reads the server; nothing there changes, and your own data/ is never touched. data-live/ is gitignored,
# and it holds every player's saves and codes, so keep it private.
# Then:
#   node tools/grim.js feedback data-live/latest/runs        the playtesters' feedback and runs
#   DATA_DIR=data-live/latest PORT=4174 npm start            play the live saves on a local copy of the server
set -euo pipefail
cd "$(dirname "$0")/.."
BASE=/srv/lumenhold
DEST="${1:-}" FROM=""
if [ "$DEST" = "--from" ]; then FROM="${2:?usage: deploy/pull-data.sh --from <folder>}"; [ -d "$FROM" ] || { echo "No folder $FROM" >&2; exit 1; }
elif [ -z "$DEST" ]; then
  URL="$(git remote get-url live 2>/dev/null || true)"
  [ -n "$URL" ] || { echo "usage: deploy/pull-data.sh <ssh-destination>   (no \`live\` remote yet: run deploy/setup.sh first)" >&2; exit 1; }
  DEST="${URL%%:*}"
fi

STAMP="$(date +%Y-%m-%d-%H%M%S)"
OUT="data-live/$STAMP"
mkdir -p "$OUT"
if [ -n "$FROM" ]; then
  echo "Copying $FROM → $OUT …"
  tar -C "$FROM" -cf - . | tar -xf - -C "$OUT"
else
  echo "Pulling $DEST:$BASE/data → $OUT …"
  # tar over ssh: needs nothing on the server beyond what deploys already use. The server keeps running.
  if ! ssh "$DEST" "test -d '$BASE/data' && tar -C '$BASE/data' -czf - ." | tar -xzf - -C "$OUT"; then
    rm -r "$OUT"; echo "Pull failed: is $BASE/data on $DEST (deploy/setup.sh run)?" >&2; exit 1
  fi
fi
ln -sfn "$STAMP" data-live/latest

players=$(find "$OUT/players" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l | tr -d ' ')
saves=$(find "$OUT/players" -path '*/saves/*.json' 2>/dev/null | wc -l | tr -d ' ')
runs=$(find "$OUT/runs" -name '*.ndjson' 2>/dev/null | wc -l | tr -d ' ')
echo "Done: $players player(s), $saves save file(s), $runs run log(s) in $OUT (also data-live/latest)."
echo "  Feedback:   node tools/grim.js feedback data-live/latest/runs"
echo "  Play them:  DATA_DIR=data-live/latest PORT=4174 npm start   (open a player's sync link to load their saves)"
