# Check Client — production recovery (systemd)

## Quick diagnose on the server

```bash
cd /path/to/CheckSystem_andalus/client   # your real path

# 1) See the real crash reason
sudo journalctl -u checkclient -n 80 --no-pager

# 2) Run the same command manually
ls -la .env.production scripts/run-next.js .next package.json
npx --yes @dotenvx/dotenvx run -f .env.production -- node scripts/run-next.js start -H 0.0.0.0 -p 4070
```

Common failures:
| Symptom | Fix |
|--------|-----|
| `Missing production build (.next)` | `npm ci && npm run build` |
| `Next.js binary not found` | `npm ci` |
| dotenvx / `.env.production` missing | create `.env.production` from `.env.production.example` |
| `EADDRINUSE :4070` | `sudo ss -tlnp \| grep 4070` then kill old process |
| Wrong `WorkingDirectory` in unit | fix path in `/etc/systemd/system/checkclient.service` |

## Fix sequence (typical)

```bash
cd /path/to/CheckSystem_andalus/client
git pull   # or deploy latest that includes scripts/run-next.js

# Ensure env file exists
cp -n .env.production.example .env.production
nano .env.production   # set NEXT_PUBLIC_API_URL

npm ci
npm run build

sudo systemctl daemon-reload
sudo systemctl reset-failed checkclient
sudo systemctl restart checkclient
sudo systemctl status checkclient --no-pager
sudo journalctl -u checkclient -n 50 --no-pager
```

## Install / update unit file

```bash
sudo cp deploy/checkclient.service /etc/systemd/system/checkclient.service
sudo nano /etc/systemd/system/checkclient.service   # fix WorkingDirectory / User
sudo systemctl daemon-reload
sudo systemctl enable --now checkclient
```
