# METRICA HUMAN VALUE MAP

**HUMANS, WHERE IT MATTERS.** AI for routine. People for relationships.

A bilingual (BG / EN), 60–90 second diagnostic for businesses. It shows three things: where automation saves resources, where human attention creates customer value, and how mature their customer experience (CX) is. Built for Metrica's e-commerce conference booth and designed to stay on as a permanent lead-generation tool (target domain: `cx.metrica.bg`).

Stack: a static site (Next.js + TypeScript + Tailwind CSS, exported to plain HTML/CSS/JS) plus a plain-PHP backend (PHP 7.4+, PDO) on MariaDB 10.6. It runs on Nginx + PHP-FPM, deployed by FTP. **Node.js is only used to build; nothing on the server needs it.**

## Status

| Phase | Scope | Status |
|---|---|---|
| 1 | Frontend MVP: language, welcome, 7 questions, scoring, Human Value Map, journey, lead form, conference mode | ✅ done |
| 2 | Database storage (server-side validation, consent records) | ✅ done — PHP + MariaDB |
| 3 | Protected admin dashboard (stats, lead table, CSV export) | ✅ done |
| 4 | Production deployment on the ISPConfig server (FTP only) | ✅ ready — see [DEPLOYMENT.md](DEPLOYMENT.md) |

## Build and run locally

```bash
npm install
npm run build:site            # → dist/web/ (exactly what goes into /web) + metrica-hvm-web.zip
```

To try the whole site with its PHP backend locally:

1. Create a MariaDB/MySQL database and user, and import `mysql/schema.sql`.
2. Fill in `dist/web/api/config.php`.
3. Run `php -S 127.0.0.1:8080 -t dist/web` and open http://127.0.0.1:8080.

`npm run dev` (http://localhost:3000) is enough for working on the screens. There is no PHP behind it, so results and leads are not saved.

**Deploying to cx.metrica.bg (FTP upload, Nginx + PHP-FPM, MariaDB) and the conference checklist: see [DEPLOYMENT.md](DEPLOYMENT.md).**

## Scripts and tests

| Command | What it does |
|---|---|
| `npm run build:site` | rules for PHP + static export + package (`scripts/build-php-site.sh`) |
| `npm run typecheck` · `npm run check:locales` | TypeScript check · both locale files have the same keys |
| `npm run test:unit` | scoring engine, journey, texts, CSV export — no server needed |
| `npx vitest run tests/php/parity.test.ts` | the PHP scoring gives exactly the TypeScript result on 1,000+ answer sets (needs `php`) |
| `npm run test:php` | the PHP endpoints over HTTP against a real database. Needs `HVM_BASE_URL` and `HVM_ADMIN_PASSWORD`; skipped otherwise. |

GitHub Actions runs everything on every push, against **MariaDB 10.6** with **PHP 7.4 and 8.3**. It then builds the upload package (`metrica-hvm-web.zip` + `mysql/schema.sql`).

### How data flows

```
browser ──POST /api/complete.php──▶ PHP (validate, recompute scores) ──PDO──▶ MariaDB
        ──POST /api/lead.php─────▶
```

- **One row per completed test** in `diagnostic_sessions`. It is stored as soon as the result is shown, without contact data (for aggregate statistics). If the visitor then submits the lead form, the same row gets the contact fields.
- The browser sends **only answer IDs**. PHP validates them and **recomputes the scores itself**, so scores cannot be faked.
- **One source of truth:** PHP reads its rules from `api/_lib/rules.json`, which the build generates from the same `config/*.ts` and `locales/*.json` the browser uses. A parity test proves both give identical results. Each row stores `scoring_version`.
- **Consent:** PHP stores `consent_given`, `consent_at` (server time), `consent_version` and the exact `consent_text` shown in the visitor's language. A database constraint rejects contact data without consent.
- **Security:**
  - the browser never talks to the database;
  - credentials exist only in `/web/api/config.php`, which outputs nothing when requested;
  - all SQL uses prepared statements;
  - POSTs from other websites are refused.
- **Spam:** hidden honeypot field, 10 KB request limit, strict input validation.
- If saving the completed test fails, the visitor still sees their result. If saving the lead fails, the form shows an error and the visitor can retry.

## Admin dashboard

Open **`/admin/`** (e.g. `https://cx.metrica.bg/admin/`) and sign in with the `admin_password` from `api/config.php`.

- **Statistics:** completed tests, leads, lead conversion rate, and the average Automation / Human Value / CX Maturity scores. Filter them by period (today, 7 days, 30 days, all time), language and source (conference mode vs online).
- **Lead table:** date, language, name, company, email, phone, website, the three results, biggest opportunity and biggest challenge. Switch between *Leads* and *All tests*. Search by name, company, email, website or phone, and filter by opportunity or challenge.
- **Details:** click a row to see all answers, the result, and the consent record (time, version, exact wording).
- **Export CSV:** exports the rows currently shown, with all answers as stable IDs. The file opens correctly in Excel with Bulgarian text.

Security:
- One shared password (`admin_password` in `api/config.php`), a signed httpOnly cookie valid for 12 hours, and a delay after a wrong password.
- `/admin/` is a static page; it loads its data from `api/admin/sessions.php` only after sign-in. Search engines are told not to index it.
- Signing out clears the cookie in that browser. To sign out everyone, change `admin_password`.
- Dates are shown in Bulgarian time (Europe/Sofia).

## Where to change things (no React knowledge needed)

| What | File |
|---|---|
| Any visible text (questions, answers, result texts, buttons) | `locales/bg.json`, `locales/en.json` |
| Question / answer IDs, single vs multi choice, max selections | `config/questions.ts` |
| **Scoring weights and LOW/MEDIUM/HIGH thresholds** | `config/scoring.ts` |
| Customer journey stage rules (AUTOMATE / AI + HUMAN / HUMAN) | `config/journey.ts` |
| "Biggest opportunity" rules | `config/opportunity.ts` |
| Contact URL, privacy policy URL, consent version | `config/app.ts` |
| Scoring version label (bump when weights change) | `config/scoring.ts` → `SCORING_VERSION` |

Rules:
- Both locale files must have the same keys. Run `npm run check:locales` after editing them.
- Answer IDs in the config files are type-checked, so a typo fails `npm run build`.
- When you change the consent wording, bump `consentVersion` in `config/app.ts`.

## How the scoring works (INITIAL PLACEHOLDER)

For each dimension (Automation Opportunity, Human Value Opportunity, CX Maturity):

```
score = clamp(base + sum of points of every selected answer, 0, 100)
LOW < 40 ≤ MEDIUM < 70 ≤ HIGH
```

The explanation under each level is picked from the answers that contributed most. The texts are in `locales/*.json → reasons.<dimension>.<question>.<answer>`. Everything is deterministic: the same answers always give the same result. There is no randomness and no external AI call.

The weights are **placeholders, not a validated methodology**. Replace them in `config/scoring.ts` with the final matrix.

## Conference mode

At the end of the flow, conference mode shows "THANK YOU! / NEXT VISITOR". NEXT VISITOR clears the local answers and contact data, starts a new session and returns to language selection. It never deletes saved records.

**Auto-reset:** if nobody touches the tablet for 90 seconds, a "Still there? / Още ли сте тук?" warning appears. If nobody taps within 10 seconds, the session resets to language selection. Both times are set in `config/app.ts` (`idleTimeoutSeconds`, `idleWarningSeconds`). Auto-reset works only in conference mode, and never on the language screen.

- Turn it on for every device: `NEXT_PUBLIC_CONFERENCE_MODE=true`
- Turn it on for one device (e.g. the booth tablet): open `/?conference=1` once. This is remembered on that device. Turn it off with `/?conference=0`.

## Project structure

```
app/                 pages (exported to static HTML): / and /admin/
components/          screens, result blocks, admin dashboard, UI
config/              questions, scoring, journey, opportunity, app settings (edit these)
locales/             bg.json, en.json (all visible texts)
lib/engine/          scoring / journey / opportunity logic shown in the browser
lib/state.tsx        flow state (sessionStorage), language, reset, idle reset
lib/persistence.ts   browser → /api/complete.php, /api/lead.php
lib/admin/           admin API calls, CSV export, formatting
php/api/             the PHP backend → /web/api/ on the server
  config.php           the only file edited on the server (DB + admin password)
  complete.php, lead.php, health.php, admin/{login,logout,sessions}.php
  _lib/                bootstrap, PDO, validation, scoring, auth, SQL (+ generated rules.json)
mysql/schema.sql     the table, for phpMyAdmin → Import
scripts/             build-php-site.sh, export-php-rules.ts, check-locales.mjs
tests/               unit tests, PHP↔TypeScript parity, PHP HTTP integration tests
```
