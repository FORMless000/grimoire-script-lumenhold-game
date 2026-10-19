#!/usr/bin/env bash
# One-time push-to-deploy setup, run on your machine:   deploy/setup.sh <ssh-destination> [--on-commit | --manual]
#   <ssh-destination>  what you type after `ssh`, e.g. lumenhold (a Host alias from ~/.ssh/config) or ubuntu@1.2.3.4
#   (default)          deploy on `git push`: origin gets the server as a second push address, so one push updates
#                      GitHub and the game
#   --on-commit        deploy on every commit on main: a post-commit hook pushes in the background (log: .git/deploy.log)
#   --manual           deploy only with `git push live main` (--no-auto is the old name)
# Check the server first with deploy/doctor.sh <ssh-destination> [--fix]. It sets up the server
# (deploy/setup-server.sh), adds the git remote `live`, sets the deploy mode, and makes the first deploy.
# Safe to re-run, e.g. to change the mode or the server's address.
set -euo pipefail
cd "$(dirname "$0")/.."
DEST="${1:?usage: deploy/setup.sh <ssh-destination> [--on-commit | --manual]}"
MODE="${2:-push}"
case "$MODE" in push|--on-commit|--manual|--no-auto) ;; *) echo "unknown mode $MODE (--on-commit or --manual)" >&2; exit 2 ;; esac
BASE=/srv/lumenhold
LIVE="$DEST:$BASE/repo.git"

ssh "$DEST" 'rm -rf /tmp/lumenhold-setup && mkdir -p /tmp/lumenhold-setup'
scp -q deploy/setup-server.sh deploy/post-receive deploy/lumenhold.service "$DEST:/tmp/lumenhold-setup/"
ssh -t "$DEST" 'bash /tmp/lumenhold-setup/setup-server.sh'

if git remote get-url live >/dev/null 2>&1; then git remote set-url live "$LIVE"; else git remote add live "$LIVE"; fi

# origin's push addresses: drop any old server address, then add this one in push mode (GitHub stays first).
keep="$(git config --get-all remote.origin.pushurl 2>/dev/null | grep -vF ":$BASE/repo.git" || true)"
git config --unset-all remote.origin.pushurl 2>/dev/null || true
if [ "$MODE" = push ]; then
  ORIGIN="$(git remote get-url origin 2>/dev/null)" || { echo "No origin remote (GitHub): add it first, or use --manual." >&2; exit 1; }
  [ -n "$keep" ] || keep="$ORIGIN"
fi
[ "$keep" = "$(git remote get-url origin 2>/dev/null || true)" ] && [ "$MODE" != push ] && keep=""
for u in $keep; do git config --add remote.origin.pushurl "$u"; done
[ "$MODE" = push ] && git config --add remote.origin.pushurl "$LIVE"

GITDIR="$(git rev-parse --git-common-dir)"
if [ "$MODE" = --on-commit ]; then
  git config lumenhold.autodeploy true
  cp deploy/post-commit "$GITDIR/hooks/post-commit"; chmod +x "$GITDIR/hooks/post-commit"
else
  git config lumenhold.autodeploy false
fi

echo "First deploy (pushes the whole history once; later pushes are small)…"
git push live main
case "$MODE" in
  push) echo "Done: git push now updates GitHub and the game (git remote -v lists both push addresses)." ;;
  --on-commit) echo "Done: every commit on main now deploys in the background (log: .git/deploy.log)." ;;
  *) echo "Done: deploy with git push live main." ;;
esac
