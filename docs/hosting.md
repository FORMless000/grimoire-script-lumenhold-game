# Hosting Lumenhold online

The game runs on a small Linux server (we use an EC2 instance) behind the reverse proxy you already have. Every commit on `main` deploys itself. Nothing extra is installed: the server needs **Node.js 20+, git, systemd and sudo**, and runs no `npm install`, because the server has no runtime dependencies.

```
your machine ── git commit ──▶ post-commit hook ── git push live main ──▶ EC2: /srv/lumenhold/repo.git
                                                                            │ post-receive hook
                                                                            ▼
                         releases/<sha>  (unpacked, self-tested)  ◀── current (symlink) ◀── systemd: lumenhold
                         data/           (saves, run logs: survives deploys)                  127.0.0.1:4173
                                                                                                 ▲
                                                                       your reverse proxy (TLS) ─┘
```

## First-time setup

1. **SSH access.** Check that `ssh <dest>` works from this machine, where `<dest>` is something like `ec2-user@1.2.3.4`. A `Host` alias in `~/.ssh/config` with your key is easiest.
2. **Node.js 20+ on the server.** Check with `ssh <dest> node -v`. If it's missing, install it from nodejs.org or with nvm; the setup finds an nvm install.
3. **Run the setup from the project folder:**
   ```
   deploy/setup.sh <dest>            # auto-deploy on every commit
   deploy/setup.sh <dest> --no-auto  # or: deploy only when you run `git push live main`
   ```
   The script does four things:
   - creates `/srv/lumenhold/`;
   - generates the admin token and the invite code (kept in `/srv/lumenhold/env`) and prints the admin and invite links;
   - installs the systemd service;
   - adds the git remote `live` and pushes `main` once. The first push sends the whole history; later pushes are small.
4. **Point your reverse proxy at `127.0.0.1:4173`.** With nginx, inside your existing `server { … }` block that has TLS:
   ```nginx
   location / {
       proxy_pass http://127.0.0.1:4173;
       proxy_set_header Host $host;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       client_max_body_size 5m;
   }
   ```
   Then run `sudo nginx -t && sudo systemctl reload nginx`. With Caddy it's one line: `your.domain { reverse_proxy 127.0.0.1:4173 }`. Node compresses responses itself, so the proxy needs no gzip settings.
5. **Check it.**
   - Open `https://your.domain/api/health`: it should show `"server":"lumenhold"`.
   - Open the admin link the setup printed.
   - Send playtesters the invite link.

## Day to day

| You want to | Do |
|---|---|
| Deploy | Commit on `main`. The push runs in the background and is logged in `.git/deploy.log`. A manual deploy is `git push live main`, which shows the server's output. |
| Know whether a deploy worked | `tail .git/deploy.log`: look for `lumenhold: live: <sha>`, or `DEPLOY REFUSED` with the reason. The old version keeps running after a refusal. |
| Stop or start auto-deploy | `git config lumenhold.autodeploy false` / `true` |
| Roll back | `ssh <dest>`, then `ls -t /srv/lumenhold/releases`, then `ln -sfn /srv/lumenhold/releases/<older> /srv/lumenhold/current && sudo systemctl restart lumenhold` |
| See server logs | `ssh <dest> journalctl -u lumenhold -n 100` |
| Read feedback and run logs | `/admin` has these tabs: Feedback by event, Notes (every comment, newest first), Runs (with client errors), Players. **Export runs** downloads every run; `node tools/grim.js feedback <file>` reads that file locally. |
| Copy the server's data home (saves, logs, feedback) for analysis | `deploy/pull-data.sh` (the `live` remote's server; or `deploy/pull-data.sh <dest>`). Each pull goes into its own dated folder, `data-live/<date-time>/`, and `data-live/latest` points at the newest. It only reads the server. Then `node tools/grim.js feedback data-live/latest/runs`, or play the live saves locally with `DATA_DIR=data-live/latest PORT=4174 npm start`. `data-live/` is gitignored and holds every player's saves and codes, so keep it private. |
| Change the invite code or admin token | Edit `/srv/lumenhold/env` on the server, then run `sudo systemctl restart lumenhold`. Players who already have a code keep it. |
| Open sign-up to anyone | Delete the `INVITE_CODE=` line from `env` and restart. Each address can then make 5 new players an hour. |
| Block a player | `/admin` → Players → revoke. Their code stops working on every device; their runs stay. |
| Back up | Everything is in `/srv/lumenhold/data` (plus `env`). Take an EBS snapshot of the volume, or run `tar czf lumenhold-data-$(date +%F).tgz -C /srv/lumenhold data`. |
| Update the service settings | Change `deploy/lumenhold.service` or `deploy/setup-server.sh`, commit, then re-run `deploy/setup.sh <dest>` (it's safe to re-run). `deploy/post-receive` updates itself on each deploy. |

Only **committed** files deploy. Work in progress in your folder stays local until it's committed.

## Players and saves

- **Getting a code.** On a player's first visit (through the invite link), the server gives that browser a **player code**. The code holds the player's saves (autosave and three slots), their "seen" counters and their run logs.
- **Moving between devices.** In the game, open **Saved games → Play on another device**. Copy the link, or type the code on the other device, and that device then shares the same saves.
  - When a game moves to another device, it continues there as a new run in the logs (marked "continued from…").
  - If you play on two devices at the same moment, the newest autosave wins.
- **Lost codes.** The code is the only key: a lost code means lost online saves. The run logs stay on the server either way.
- **Offline play.** Without the server, or without a code, the game still plays and saves in the browser. Finished runs and their feedback wait in the browser and upload the next time the server is reachable.

## Settings (environment variables)

The systemd unit sets the non-secret settings; `/srv/lumenhold/env` holds the secrets.

| Variable | Meaning |
|---|---|
| `ADMIN_TOKEN` | Opens `/admin` and the reports. Required whenever the server is reachable from elsewhere. |
| `INVITE_CODE` | When set, a new player code needs `?invite=<code>`. When unset, anyone can get one, limited to 5 per address per hour. |
| `PUBLIC=1` | Requires `ADMIN_TOKEN` even though Node listens on 127.0.0.1 behind the proxy. |
| `TRUST_PROXY=1` | Takes client addresses (used for rate limits) from the proxy's `X-Forwarded-For`. |
| `NODE_ENV=production` | Serves the committed `build/content.bundle.js` instead of compiling content live. |
| `HOST`, `PORT`, `DATA_DIR` | Where it listens and where the data lives. |

To run a production-like server locally: `NODE_ENV=production PUBLIC=1 ADMIN_TOKEN=a INVITE_CODE=b npm start`, then open `http://127.0.0.1:4173/?invite=b`.
