#!/usr/bin/env bash
# Check what hosting needs, on this machine and on the server; --fix installs what's missing on the server:
#   deploy/doctor.sh [<ssh-destination>] [--fix]
#   <ssh-destination>  what you type after `ssh` (e.g. lumenhold); default: the host of the `live` git remote
#   --fix              install the missing server packages: git, curl, tar, xz and Node.js (the current LTS,
#                      from nodejs.org with its checksum checked, into /opt/node; Ubuntu's own package is too old)
# It never edits your reverse proxy: it only says whether one forwards to the game. Safe to re-run.
# Lines start with ok, warn (works, but look) or MISSING (blocks hosting); the exit code is 1 while anything is missing.
set -uo pipefail
cd "$(dirname "$0")/.."
BASE=/srv/lumenhold
PORT=4173
DEST="" FIX=0
for a in "$@"; do case "$a" in --fix) FIX=1 ;; -*) echo "unknown option $a" >&2; exit 2 ;; *) DEST="$a" ;; esac; done
if [ -z "$DEST" ]; then
  URL="$(git remote get-url live 2>/dev/null || true)"
  [ -n "$URL" ] || { echo "usage: deploy/doctor.sh <ssh-destination> [--fix]   (no \`live\` remote yet)" >&2; exit 2; }
  DEST="${URL%%:*}"
fi

missing=0
ok()   { echo "ok       $*"; }
warn() { echo "warn     $*"; }
miss() { echo "MISSING  $*"; missing=1; }

echo "== This machine"
command -v git >/dev/null && ok "git $(git --version | awk '{print $3}')" || miss "git"
command -v ssh >/dev/null && ok "ssh" || miss "ssh"
if command -v node >/dev/null; then
  v="$(node -p 'process.versions.node')"
  [ "${v%%.*}" -ge 20 ] && ok "node $v (for the tools; deploys don't need it)" || warn "node $v: the tools need 20+"
else warn "no node: the tools need Node.js 20+ (deploys don't)"; fi
LIVE="$DEST:$BASE/repo.git"
if git config --get-all remote.origin.pushurl 2>/dev/null | grep -qxF "$LIVE"; then ok "git push also deploys (origin pushes to $LIVE)"
elif git remote get-url live >/dev/null 2>&1; then warn "deploys with: git push live main (deploy/setup.sh $DEST makes git push deploy too)"
else warn "deploys not set up: run deploy/setup.sh $DEST once this check passes"; fi

echo "== Connection to $DEST"
if ! ssh -o BatchMode=yes -o ConnectTimeout=10 "$DEST" true 2>/dev/null; then
  miss "can't log in with ssh $DEST (key not on the server, wrong address, or port 22 closed in the security group)"
  exit 1
fi
ok "ssh $DEST"

echo "== The server"
ssh -o BatchMode=yes "$DEST" "bash -s -- $FIX $BASE $PORT" <<'REMOTE' || missing=1
FIX="$1" BASE="$2" PORT="$3"
missing=0
ok()   { echo "ok       $*"; }
warn() { echo "warn     $*"; }
miss() { echo "MISSING  $*"; missing=1; }
. /etc/os-release 2>/dev/null; ok "${PRETTY_NAME:-unknown Linux} ($(uname -m))"
SUDO="" ADMIN=0
if [ "$(id -u)" = 0 ]; then ok "root"; ADMIN=1
elif sudo -n true 2>/dev/null; then ok "sudo without a password"; SUDO="sudo" ADMIN=1
else miss "sudo without a password (EC2's default user has it: log in as ec2-user or ubuntu)"; fi
command -v systemctl >/dev/null && ok "systemd" || miss "systemd"

PM=""; command -v apt-get >/dev/null && PM=apt; command -v dnf >/dev/null && PM=dnf; [ -z "$PM" ] && command -v yum >/dev/null && PM=yum
install_pkgs() {
  case "$PM" in
    apt) $SUDO env DEBIAN_FRONTEND=noninteractive apt-get update -qq >/dev/null && $SUDO env DEBIAN_FRONTEND=noninteractive apt-get install -y -qq "$@" >/dev/null ;;
    dnf|yum) $SUDO "$PM" install -y -q "$@" >/dev/null ;;
    *) return 1 ;;
  esac
}
for c in git curl tar xz sha256sum; do
  pkg="$c"; [ "$c" = xz ] && pkg=$([ "$PM" = apt ] && echo xz-utils || echo xz); [ "$c" = sha256sum ] && pkg=coreutils
  if command -v "$c" >/dev/null; then ok "$c"
  elif [ "$FIX" = 1 ] && [ "$ADMIN" = 1 ] && install_pkgs "$pkg" && command -v "$c" >/dev/null; then ok "$c (installed)"
  else miss "$c$([ "$FIX" = 1 ] || echo ': --fix installs it')"; fi
done

node_ok() { local n; n="$(command -v node || true)"; [ -z "$n" ] && [ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh" && n="$(command -v node || true)"
  [ -n "$n" ] && [ "$("$n" -p 'process.versions.node.split(".")[0]')" -ge 20 ] && echo "$n"; }
install_node() {
  local arch file sum dir tmp
  case "$(uname -m)" in x86_64) arch=x64 ;; aarch64|arm64) arch=arm64 ;; *) echo "no Node.js build for $(uname -m)"; return 1 ;; esac
  local url=https://nodejs.org/dist/latest-v24.x
  tmp="$(mktemp -d)" || return 1
  curl -fsSL "$url/SHASUMS256.txt" -o "$tmp/SHASUMS256.txt" || { rm -r "$tmp"; return 1; }
  file="$(grep -oE "node-v[0-9.]+-linux-$arch\.tar\.xz$" "$tmp/SHASUMS256.txt" | head -1)"
  [ -n "$file" ] || { echo "no $arch build listed at $url"; rm -r "$tmp"; return 1; }
  curl -fsSL "$url/$file" -o "$tmp/$file" || { rm -r "$tmp"; return 1; }
  (cd "$tmp" && grep "  $file\$" SHASUMS256.txt | sha256sum -c --status) || { echo "checksum mismatch for $file"; rm -r "$tmp"; return 1; }
  dir="/opt/${file%.tar.xz}"
  $SUDO mkdir -p /opt && $SUDO tar -xJf "$tmp/$file" -C /opt && $SUDO ln -sfn "$dir" /opt/node || { rm -r "$tmp"; return 1; }
  for b in node npm npx; do $SUDO ln -sfn "/opt/node/bin/$b" "/usr/local/bin/$b"; done
  rm -r "$tmp"
}
if n="$(node_ok)"; then ok "node $("$n" -v) ($n)"
elif [ "$FIX" = 1 ] && [ "$ADMIN" = 1 ] && command -v curl >/dev/null && command -v xz >/dev/null && install_node && n="$(node_ok)"; then ok "node $("$n" -v) (installed into /opt/node)"
else
  have="$(command -v node >/dev/null && node -v)"
  miss "Node.js 20+${have:+ (found $have)}$([ "$FIX" = 1 ] || echo ': --fix installs the current LTS')"
fi

free_mb="$(df -Pm / | awk 'NR==2{print $4}')"
[ "${free_mb:-0}" -ge 1024 ] && ok "disk: ${free_mb} MB free" || warn "disk: ${free_mb} MB free (each release takes ~30 MB; three are kept)"
mem_mb="$(awk '/MemAvailable/{print int($2/1024)}' /proc/meminfo 2>/dev/null)"
[ "${mem_mb:-0}" -ge 150 ] && ok "memory: ${mem_mb} MB available" || warn "memory: ${mem_mb} MB available (the game needs ~100 MB)"

if command -v ss >/dev/null && ss -ltnp 2>/dev/null | grep -q ":$PORT "; then
  systemctl is-active -q lumenhold 2>/dev/null && ok "port $PORT: the game" || miss "port $PORT is taken by something else: $(ss -ltnp | grep ":$PORT " | grep -oE 'users:\(\("[^"]+' | head -1 | cut -d'"' -f2)"
else ok "port $PORT free"; fi

if [ -d "$BASE/repo.git" ] && [ -f /etc/systemd/system/lumenhold.service ]; then
  if [ -L "$BASE/current" ]; then
    systemctl is-active -q lumenhold && ok "the game is installed and running ($(basename "$(readlink "$BASE/current")"))" || warn "installed but not running: journalctl -u lumenhold -n 50"
  else warn "installed, nothing deployed yet: git push live main"; fi
else warn "the game isn't installed yet: run deploy/setup.sh from your machine"; fi

proxy=""
for f in /etc/caddy/Caddyfile /etc/caddy/conf.d/* /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*; do
  [ -f "$f" ] && $SUDO grep -qE "(127\.0\.0\.1|localhost):$PORT" "$f" 2>/dev/null && proxy="$f"
done
if [ -n "$proxy" ]; then ok "reverse proxy forwards to the game ($proxy)"
elif command -v caddy >/dev/null || command -v nginx >/dev/null; then
  warn "$(command -v caddy >/dev/null && echo Caddy || echo nginx) is installed but nothing forwards to 127.0.0.1:$PORT yet (docs/hosting.md, step 4)"
else warn "no reverse proxy (Caddy or nginx) found: players can't reach the game yet (docs/hosting.md, step 4)"; fi
exit "$missing"
REMOTE

echo
if [ "$missing" = 0 ]; then echo "All set."; else echo "Something is MISSING above$([ "$FIX" = 1 ] || echo '; deploy/doctor.sh '"$DEST"' --fix installs the server packages')."; fi
exit "$missing"
