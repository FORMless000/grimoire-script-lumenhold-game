#!/usr/bin/env bash
# One-time push-to-deploy setup, run on your machine:   deploy/setup.sh <ssh-destination> [--no-auto]
#   <ssh-destination>  what you type after `ssh`, e.g. ec2-user@1.2.3.4 or a Host alias from ~/.ssh/config
#   --no-auto          don't deploy on every commit; deploy with `git push live main` instead
# It sets up the server (deploy/setup-server.sh), adds the git remote `live`, installs a post-commit hook
# that pushes main to it in the background (log: .git/deploy.log), and makes the first deploy.
# Auto-deploy off/on later:  git config lumenhold.autodeploy false|true
set -euo pipefail
cd "$(dirname "$0")/.."
DEST="${1:?usage: deploy/setup.sh <ssh-destination> [--no-auto]}"
BASE=/srv/lumenhold

ssh "$DEST" 'rm -rf /tmp/lumenhold-setup && mkdir -p /tmp/lumenhold-setup'
scp -q deploy/setup-server.sh deploy/post-receive deploy/lumenhold.service "$DEST:/tmp/lumenhold-setup/"
ssh -t "$DEST" 'bash /tmp/lumenhold-setup/setup-server.sh'

if git remote get-url live >/dev/null 2>&1; then git remote set-url live "$DEST:$BASE/repo.git"; else git remote add live "$DEST:$BASE/repo.git"; fi

GITDIR="$(git rev-parse --git-common-dir)"
if [ "${2:-}" = "--no-auto" ]; then
  git config lumenhold.autodeploy false
else
  git config lumenhold.autodeploy true
  cp deploy/post-commit "$GITDIR/hooks/post-commit"; chmod +x "$GITDIR/hooks/post-commit"
fi
echo "First deploy (pushes the whole history once; later pushes are small)…"
git push live main
