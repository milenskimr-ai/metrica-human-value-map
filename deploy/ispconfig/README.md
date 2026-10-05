# Deploying on ISPConfig (no SSH, FTP + panel only)

For hosts where the only access is ISPConfig (nginx Directives, Databases/phpMyAdmin, Cron Jobs) and FTP.
The standard server setup with systemd is in `DEPLOYMENT.md`; use this only when that is not possible.

**Requires** an ISPConfig cron job of type **Full Cron** (or a chrooted cron whose jail contains `node`)
and Node.js 20.9+ on the server. Without a cron job (or root help), a Node.js process cannot be kept running.

| File | Goes where |
|---|---|
| `metrica-hvm-ispconfig.zip` (built by `scripts/package-ispconfig.sh`) | unzip locally, upload the contents to `private/hvm/` of the site |
| `hvm-settings.env` (inside the zip; template here) | same folder: fill in `MYSQL_PASSWORD`, `ADMIN_PASSWORD`, check `MYSQL_DATABASE` |
| `nginx-directives.conf` | ISPConfig → Websites → cx.metrica.bg → Options → nginx Directives |
| `../../mysql/001_schema.sql` | phpMyAdmin → the app database → Import |
| `start.js` (inside the zip) | started every minute by the cron job below |

Cron job (ISPConfig → Sites → Cron Jobs; every minute, `* * * * *`):

    cd /var/www/clients/clientX/webY/private/hvm && node start.js >> app.log 2>&1

- `start.js` exits at once if the app is already running, otherwise starts it on `127.0.0.1:PORT`.
- To restart after an update or a settings change, upload an empty `restart.txt` into the app folder.
- Health: `https://cx.metrica.bg/api/health`; log: `private/hvm/app.log` (download via FTP).
