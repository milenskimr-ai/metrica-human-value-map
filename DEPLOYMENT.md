# Deployment — METRICA HUMAN VALUE MAP (plain PHP, FTP upload)

Target: **cx.metrica.bg** on the existing ISPConfig server — **Nginx + PHP-FPM + MariaDB 10.6**.
Deployment is FTP upload only. Nothing runs Node.js, Composer or a background process on the server.

```
Browser ──▶ Nginx ──▶ static files in /web     (index.html, admin/index.html, _next/static/…)
                  └─▶ PHP-FPM ──▶ /web/api/*.php ──PDO──▶ MariaDB (table diagnostic_sessions)
```

- **The visitor journey and the admin dashboard** are plain HTML/CSS/JS, built once by GitHub Actions.
- **Everything the server does** is in `/web/api/*.php`, plain PHP 7.4+ with no dependencies:
  - saving a completed test and saving a lead;
  - scoring and validation;
  - admin login;
  - the health check.

## 1. One-time setup

1. **Create the table.** phpMyAdmin → select the app's database → **Import** → `mysql/schema.sql`. This creates the table `diagnostic_sessions` only; the database and its user already exist. The script is safe to re-run.
2. **Download the package.** GitHub → **Actions** → latest successful **CI** run on `main` → *Artifacts* → `metrica-hvm-web-main-<commit>`. It contains `metrica-hvm-web.zip` and `mysql/schema.sql`.
3. **Unzip `metrica-hvm-web.zip` on your computer.** FTP cannot unpack archives on the server.
4. **Edit `api/config.php`** in the unzipped folder:
   - **line 17** `'db_password' => '',` — paste the database user's password between the quotes;
   - **line 21** `'admin_password' => '',` — a long random password for `/admin/` (16+ characters);
   - check that lines 15–16 (`db_name`, `db_user`) match ISPConfig → Databases. ISPConfig may add a prefix, e.g. `c1metrica_hvm`.

   A password containing `'` or `\` needs a backslash in front of that character: `'it\'s'`.
5. **Upload the contents of the unzipped folder into `/web`** by FTP, in binary mode. Keep the folder structure (`/web/index.html`, `/web/api/…`, `/web/_next/…`). There are no hidden files.
6. **Check:** open `https://cx.metrica.bg/api/health.php`. It should show `{"ok":true,"database":"ok","admin":"ok",…}`. Then open the site, and sign in at `https://cx.metrica.bg/admin/`.

## 2. Nginx

**No rewrite rules and no extra directives are needed.** ISPConfig's standard vhost is enough:

- static files are served from `/web`;
- `index index.html … index.php` serves `/` and `/admin/` (`/admin` redirects to `/admin/` automatically);
- the standard `location ~ \.php$` → PHP-FPM block runs `/web/api/*.php`.

The app uses real file URLs (`/api/lead.php`), not clean URLs through a front controller.

**Recommended:** paste these into ISPConfig → Websites → cx.metrica.bg → Options → **nginx Directives**:

```nginx
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()" always;
```

The pages already carry a Content-Security-Policy (`<meta>` tag), and the PHP endpoints send their own headers. A static site cannot send these headers itself, so Nginx has to.

Once HTTPS works (ISPConfig: SSL + Let's Encrypt, "Rewrite HTTP to HTTPS"), you can also add HSTS:

```nginx
add_header Strict-Transport-Security "max-age=63072000" always;
```

## 3. Updating

- **New version:** download the newer package and edit `api/config.php` again (or keep your old one). Upload everything into `/web`, overwriting the files. No restart is needed.
- **Old files:** each build's JS/CSS files in `_next/static/` have new names, so old ones can be deleted at any time. Leaving them does no harm.
- **Changing texts, questions or scoring:** edit `locales/*.json` or `config/*.ts` in the repository. GitHub Actions rebuilds both the pages and the PHP scoring rules (`api/_lib/rules.json`) from the same files, so they never disagree. Bump `SCORING_VERSION` in `config/scoring.ts` when weights change.

## 4. Operations

| Task | How |
|---|---|
| Health / uptime monitoring | `https://cx.metrica.bg/api/health.php` — HTTP 200 when the database and admin password are OK, 503 otherwise. It also shows the deployed `revision`. |
| Change the admin password | edit `admin_password` in `/web/api/config.php` via FTP (signs everyone out) |
| PHP errors | the site's PHP error log in ISPConfig (`log/` folder of the site, via FTP) |
| Backup | include the database in the existing backups (phpMyAdmin → Export works too) |
| Delete a person's data (GDPR) | phpMyAdmin → SQL: `DELETE FROM diagnostic_sessions WHERE email = '…';` |

## 5. Conference checklist

**The day before**
- [ ] `/api/health.php` shows `"ok":true`.
- [ ] Do one full test in BG and one in EN, including the lead form. Both appear in `/admin/`.
- [ ] Delete those test rows in phpMyAdmin so they don't count in the statistics.

**Tablet setup at the booth**
- [ ] Open `https://cx.metrica.bg/?conference=1` once in the tablet's browser. The "Conference mode" badge appears in the header.
- [ ] Check the auto-reset: leave the tablet untouched mid-test. After 90 s the warning appears; after 10 s more it returns to language selection.
- [ ] Lock the tablet to the browser (iPad: *Guided Access*; Android: *App pinning*). Turn off auto-lock and keep the charger connected.
- [ ] Have a backup connection ready (phone hotspot).

**After the conference**
- [ ] On the tablet, open `https://cx.metrica.bg/?conference=0`.
- [ ] Export the leads (CSV) from `/admin/`.
- [ ] Change `admin_password` in `api/config.php`.

## 6. Security controls

- **Database credentials:** they exist only in `/web/api/config.php`. PHP executes that file, so requesting it returns an empty page. The PHP files in `api/_lib/` also output nothing on their own. `api/_lib/rules.json` (the scoring weights) is readable, which is harmless: the same weights are already in the browser code.
- **SQL:** all statements use PDO prepared statements.
- **Input checks:**
  - the server validates every answer ID and field, and recalculates the scores itself;
  - a hidden honeypot field catches bots;
  - requests over 10 KB are refused;
  - POSTs from other websites are refused (`Origin` check).
- **Consent:** stored with the server time, a version number and the exact wording shown.
- **Admin:**
  - one shared password, compared in constant time, with a delay after a wrong attempt;
  - a signed httpOnly, Secure, SameSite=Lax cookie that expires after 12 hours;
  - changing the password invalidates all sessions.
- **Search engines:** `robots.txt` excludes `/admin/` and `/api/`.
