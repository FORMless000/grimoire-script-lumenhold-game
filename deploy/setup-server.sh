#!/usr/bin/env bash
# One-time setup on the server (EC2). deploy/setup.sh copies this and runs it over SSH; it can be re-run safely.
# Creates /srv/lumenhold/{repo.git, releases, current, data, env, node}, installs the git hook, the systemd unit,
# and a sudoers rule that lets the hook restart the service. Needs Node.js 24 and sudo.
set -euo pipefail
BASE="${LUMENHOLD_BASE:-/srv/lumenhold}"
HERE="$(cd "$(dirname "$0")" && pwd)"
ME="$(id -un)"

# Node: from PATH, or from nvm when it's installed that way.
NODE_BIN="$(command -v node || true)"
if [ -z "$NODE_BIN" ] && [ -s "$HOME/.nvm/nvm.sh" ]; then . "$HOME/.nvm/nvm.sh"; NODE_BIN="$(command -v node || true)"; fi
if [ -z "$NODE_BIN" ]; then echo "Node.js 24 is required on the server. Install it (e.g. https://nodejs.org/en/download or nvm), then re-run." >&2; exit 1; fi
if [ "$("$NODE_BIN" -p 'process.versions.node.split(".")[0]')" != 24 ]; then echo "Node.js 24 is required (found $("$NODE_BIN" -v))." >&2; exit 1; fi
command -v git >/dev/null || { echo "git is required on the server (sudo dnf install git / sudo apt install git)." >&2; exit 1; }

sudo mkdir -p "$BASE"; sudo chown "$ME" "$BASE"
mkdir -p "$BASE/releases" "$BASE/data"
ln -sfn "$NODE_BIN" "$BASE/node"
[ -d "$BASE/repo.git" ] || git init -q --bare "$BASE/repo.git"
git -C "$BASE/repo.git" symbolic-ref HEAD refs/heads/main
install -m 755 "$HERE/post-receive" "$BASE/repo.git/hooks/post-receive"

# Secrets, generated once.
if [ ! -f "$BASE/env" ]; then
  umask 077
  { echo "ADMIN_TOKEN=$("$NODE_BIN" -p "require('crypto').randomBytes(16).toString('hex')")"
    echo "# Remove the # below to require ?invite=<code> for new players (then: sudo systemctl restart lumenhold)."
    echo "# INVITE_CODE=$("$NODE_BIN" -p "require('crypto').randomBytes(5).toString('hex')")"; } > "$BASE/env"
fi

sed -e "s#__USER__#$ME#g" -e "s#__BASE__#$BASE#g" "$HERE/lumenhold.service" | sudo tee /etc/systemd/system/lumenhold.service >/dev/null
SYSTEMCTL="$(command -v systemctl)"
echo "$ME ALL=(root) NOPASSWD: $SYSTEMCTL restart lumenhold" | sudo tee /etc/sudoers.d/lumenhold >/dev/null
sudo chmod 440 /etc/sudoers.d/lumenhold
sudo visudo -cf /etc/sudoers.d/lumenhold >/dev/null
sudo systemctl daemon-reload
sudo systemctl enable lumenhold >/dev/null 2>&1

. "$BASE/env"
echo
echo "Server side ready in $BASE. After the first push it listens on 127.0.0.1:4173; point your reverse proxy there (docs/hosting.md)."
if [ -n "${INVITE_CODE:-}" ]; then echo "  Invite link for players:  https://<your-domain>/?invite=$INVITE_CODE"
else echo "  Link for players:         https://<your-domain>/   (anyone gets a player code; an invite can be required in env)"; fi
echo "  Admin:                    https://<your-domain>/admin?token=$ADMIN_TOKEN"
echo "  (The token and the invite setting are in $BASE/env; edit it and run: sudo systemctl restart lumenhold)"
