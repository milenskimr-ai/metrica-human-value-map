# Deployment — METRICA HUMAN VALUE MAP (self-hosted)

Target: the existing Metrica server, with **Nginx → Node.js → MySQL** on **cx.metrica.bg**.
Releases are built by **GitHub Actions**; the server only runs them (no npm, no build tools needed on the server).

```
Internet ──443──▶ Nginx (cx.metrica.bg only)
                    │  proxy to 127.0.0.1:3100 (not reachable from outside)
                    ▼
                  Node.js 22  ── systemd service "metrica-hvm", runs as user "metrica-hvm"
                    │  user hvm_app: SELECT/INSERT/UPDATE on one table
                    ▼
                  MySQL database "metrica_hvm"
```

## 1. What this adds to the server — and nothing else

| Added | Where |
|---|---|
| System user `metrica-hvm` (no login shell) | `/etc/passwd` |
| App releases + its own Node.js | `/opt/metrica-hvm/` |
| Runtime settings (secrets) | `/etc/metrica-hvm/env` |
| systemd service | `/etc/systemd/system/metrica-hvm.service` |
| Nginx site for `cx.metrica.bg` only | one new file in `sites-available` / `conf.d` |
| MySQL database `metrica_hvm` + user `hvm_app` | MySQL |

- **No global changes:** existing Nginx sites, MySQL databases and users, and the system Node.js (if any) are not modified.
- **Resource limits:** the service is capped at 512 MB RAM and one CPU core, and it opens at most 5 MySQL connections.

**Requirements:**
- Linux x64
- MySQL 8.0.19+ (the tests in CI run against 8.0 and 8.4)
- Nginx 1.25.1+ for `http2 on;` (on older versions, see the comment at the top of the Nginx file)
- about 1 GB of disk and 512 MB of free RAM

---

## 2. One-time setup (IT administrator)

All commands run as root. Replace `3100` everywhere if that port is taken; check with `ss -ltn | grep 3100`.

### 2.1 Download the release from GitHub

GitHub → repository → **Actions** → latest successful **CI** run on `main` → *Artifacts* → download `metrica-hvm-main-<commit>`.
Copy the downloaded zip file to the server and unzip it, e.g. in `/root/metrica-hvm-release/`. It contains:

```
metrica-hvm.tar.gz          the app (built, self-contained)
metrica-hvm.tar.gz.sha256   checksum, verified by the install script
deploy/                     systemd unit, Nginx config, env template, install script
mysql/                      SQL scripts
```

### 2.2 System user, directories, Node.js for this app only

```bash
useradd --system --no-create-home --shell /usr/sbin/nologin metrica-hvm
mkdir -p /opt/metrica-hvm/releases /etc/metrica-hvm

# Node.js 22 LTS, official binary, only for this app (does not replace any system Node.js)
cd /tmp
NODE_VERSION=$(curl -s https://nodejs.org/dist/latest-v22.x/SHASUMS256.txt | grep -oP 'node-v\K[0-9.]+(?=-linux-x64.tar.xz)')
curl -fsSLO "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-x64.tar.xz"
curl -fsSL "https://nodejs.org/dist/v$NODE_VERSION/SHASUMS256.txt" | grep "linux-x64.tar.xz" | sha256sum -c -
mkdir -p /opt/metrica-hvm/node && tar -xJf "node-v$NODE_VERSION-linux-x64.tar.xz" -C /opt/metrica-hvm/node --strip-components=1
/opt/metrica-hvm/node/bin/node -v
```

### 2.3 MySQL: database, schema, restricted user

1. In `mysql/000_create_database_and_user.sql`, replace `CHANGE_ME_STRONG_PASSWORD` with a long random password, e.g. from `openssl rand -base64 24`.
2. If MySQL runs on **another machine**, also replace `'localhost'` with the app server's host or IP, in both `000_…` and `002_…`.
3. Run the scripts as a MySQL administrator:

```bash
mysql -u root -p < mysql/000_create_database_and_user.sql
mysql -u root -p metrica_hvm < mysql/001_schema.sql
mysql -u root -p < mysql/002_grant_app_user.sql

mysql -u root -p -e "SHOW GRANTS FOR 'hvm_app'@'localhost'"
# expected: GRANT SELECT, INSERT, UPDATE ON `metrica_hvm`.`diagnostic_sessions`
```

Then delete the edited copy of `000_…` that contains the password.

### 2.4 Runtime settings

```bash
cp deploy/env.example /etc/metrica-hvm/env
nano /etc/metrica-hvm/env     # set MYSQL_PASSWORD and ADMIN_PASSWORD (and PORT if not 3100)
chown root:metrica-hvm /etc/metrica-hvm/env
chmod 640 /etc/metrica-hvm/env
```

- **`ADMIN_PASSWORD`:** a long random value that the Metrica team uses to sign in at `/admin`.
- **`MYSQL_SOCKET`:** set it if MySQL is only reachable through its Unix socket.
- **`MYSQL_SSL=true`:** set it if the MySQL server requires TLS.

### 2.5 systemd service

```bash
cp deploy/metrica-hvm.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable metrica-hvm        # start on boot (first start happens in step 2.7)
```

### 2.6 Nginx + HTTPS for cx.metrica.bg

1. **DNS:** create an `A` record, and an `AAAA` record if the server has IPv6, pointing `cx.metrica.bg` to this server.
2. **Nginx file:** copy `deploy/nginx/cx.metrica.bg.conf` to `/etc/nginx/sites-available/cx.metrica.bg` and link it into `sites-enabled`, or copy it to `/etc/nginx/conf.d/cx.metrica.bg.conf`, whichever this server uses. Then adjust:
   - the certificate paths;
   - `127.0.0.1:3100`, if you chose another port;
   - the ACME challenge `root`, if you use a different webroot;
   - the `listen [::]` lines: remove them if the server has no IPv6.
3. **Certificate:** if the certificate doesn't exist yet, `nginx -t` will fail. Temporarily comment out the second `server { … }` block (port 443), then:
   ```bash
   mkdir -p /var/www/letsencrypt
   nginx -t && systemctl reload nginx
   certbot certonly --webroot -w /var/www/letsencrypt -d cx.metrica.bg
   ```
   If you issue certificates another way (a wildcard for `*.metrica.bg`, a commercial certificate), use that instead.
4. **Enable HTTPS:** uncomment the 443 block, then check and reload:
   ```bash
   nginx -t && systemctl reload nginx     # graceful reload — other sites keep running
   ```

**Do not remove** the `proxy_set_header Host / X-Forwarded-*` lines. Without them, the admin login fails, because Next.js rejects the login form as a cross-site request.

### 2.7 First release

```bash
cd /root/metrica-hvm-release
bash deploy/install-release.sh metrica-hvm.tar.gz
curl -s https://cx.metrica.bg/api/health     # {"ok":true,"database":"ok","admin":"ok"}
```

---

## 3. Deploying a new version

1. Merge the change into `main` on GitHub. The **CI** workflow tests it against MySQL 8.0 and 8.4, then builds the release.
2. Download the artifact from that run (step 2.1) and copy it to the server.
3. Run:

```bash
bash deploy/install-release.sh metrica-hvm.tar.gz
```

The script:
- verifies the checksum;
- unpacks the release to `/opt/metrica-hvm/releases/<date-time>/`;
- switches the `current` link and restarts the service;
- waits for `/api/health`;
- **rolls back automatically** to the previous release if the health check fails;
- keeps the last 5 releases.

**Manual rollback:**
```bash
ls -1t /opt/metrica-hvm/releases/                        # pick a previous one
ln -sfn /opt/metrica-hvm/releases/<previous> /opt/metrica-hvm/current && systemctl restart metrica-hvm
```

**SQL changes:** if a future version changes the table, the release notes include a new `mysql/00X_….sql`. Run it as the MySQL administrator *before* installing that release.

### Build-time settings (GitHub)

GitHub → *Settings → Secrets and variables → Actions → Variables*:

| Variable | Default | Meaning |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://cx.metrica.bg` | public address, used for link previews and robots.txt |
| `NEXT_PUBLIC_CONFERENCE_MODE` | `false` | leave `false`; conference mode is switched on per tablet (§5) |

No secrets are stored in GitHub. Database and admin passwords exist only in `/etc/metrica-hvm/env` on the server.

---

## 4. Operations

| Task | Command |
|---|---|
| Status / restart | `systemctl status metrica-hvm` · `systemctl restart metrica-hvm` |
| App logs | `journalctl -u metrica-hvm -f` |
| Nginx logs | `/var/log/nginx/cx.metrica.bg.access.log`, `…error.log` |
| Health (for uptime monitoring) | `https://cx.metrica.bg/api/health` → HTTP 200 when OK, 503 when MySQL or the admin password is missing |
| Change admin password | edit `ADMIN_PASSWORD` in `/etc/metrica-hvm/env`, then `systemctl restart metrica-hvm` (signs everyone out) |
| Change MySQL password | `ALTER USER 'hvm_app'@'localhost' IDENTIFIED BY '…';`, update the env file, restart |
| Backup | include `metrica_hvm` in the existing MySQL backups, e.g. `mysqldump --single-transaction metrica_hvm > metrica_hvm.sql` |
| Update Node.js (22.x patch) | repeat the Node.js step in §2.2, then `systemctl restart metrica-hvm` |

**Personal data (GDPR):**
- The table holds contact details and consent records (time, version, exact wording).
- Keep backups access-restricted and apply Metrica's retention policy.
- To delete a person's data on request, a MySQL administrator runs: `DELETE FROM metrica_hvm.diagnostic_sessions WHERE email = '…';`. The app user cannot delete, by design.

**Troubleshooting:**

| Symptom | Likely cause |
|---|---|
| 502 Bad Gateway | the service isn't running or uses a different port: check `systemctl status metrica-hvm` and `PORT` |
| `/api/health` → `"database":"error"` | wrong MySQL password or host, or grants missing: see `journalctl -u metrica-hvm` |
| Admin login does nothing or shows an error | the Nginx `Host` / `X-Forwarded-*` headers are missing, or the site was opened over `http://` |
| HTTP 429 | the Nginx rate limit was hit. Raise `rate=` in the Nginx file if a busy conference Wi-Fi shares one IP. |

---

## 5. Conference checklist

**The day before**
- [ ] `https://cx.metrica.bg/api/health` returns `"ok": true`.
- [ ] Do one full test in BG and one in EN, including the lead form. Both appear in `/admin`.
- [ ] Delete those test rows so they don't count in the statistics. The MySQL administrator runs, for example: `DELETE FROM metrica_hvm.diagnostic_sessions WHERE email = 'your-test@metrica.bg';`
- [ ] Confirm `config/app.ts` has the correct `contactUrl` and `privacyPolicyUrl`, and the real logo is in place.

**Tablet setup at the booth**
- [ ] In the tablet's browser, open `https://cx.metrica.bg/?conference=1` once. The badge "Conference mode" appears in the header, and the tablet remembers it.
- [ ] Check the auto-reset: leave the tablet untouched mid-test. After 90 s the warning appears; after 10 s more it returns to language selection.
- [ ] Lock the tablet to the browser: **iPad** → Settings → Accessibility → *Guided Access*; **Android** → *App pinning*.
- [ ] Turn off auto-lock/sleep, keep the charger connected, and set brightness high.
- [ ] Have a backup connection ready (phone hotspot). Visitors still see their result if the network drops, but results and leads are only saved while online.
- [ ] Team members open `/admin` on their own phones or laptops, never on the visitor tablet.

**After the conference**
- [ ] On the tablet, open `https://cx.metrica.bg/?conference=0`.
- [ ] Export the leads (CSV) from `/admin`.
- [ ] Change `ADMIN_PASSWORD` (§4). This signs out every device that was logged in during the event.

---

## 6. Security controls in place

- **HTTPS only:** port 80 redirects to HTTPS. The app sets HSTS, a Content-Security-Policy that allows only its own origin, `X-Frame-Options: DENY`, nosniff, and strict referrer and permissions policies. Nginx does not repeat these headers.
- **The app is not directly reachable:** Node.js listens on `127.0.0.1` only.
- **Least privilege:**
  - the service runs as an unprivileged user with systemd hardening;
  - release files are read-only for that user, except Next.js' cache folder;
  - the MySQL user may only `SELECT, INSERT, UPDATE` the one table.
- **Input:**
  - the server validates every answer ID and field, and recalculates the scores itself;
  - a honeypot field catches bots;
  - requests over 10 KB are refused by the app, and over 64 KB by Nginx;
  - all SQL is parameterised.
- **Rate limits (Nginx):** submissions allow 60 per minute per IP with a burst of 30. Admin login attempts allow 10 per minute per IP, and the app adds a delay after each wrong password.
- **Database rules:** checks on language, scores 0–100 and levels, plus "no contact data without consent".
- **Consent:** stored with the server time, a version number and the exact wording shown.
- **Secrets:** exist only in `/etc/metrica-hvm/env` (mode 640). They are not in GitHub and not in the release package.
- **Search engines:** `/admin` and `/api` are excluded via robots.txt, and the admin pages are marked `noindex`.
