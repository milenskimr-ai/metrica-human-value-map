# METRICA HUMAN VALUE MAP

**HUMANS, WHERE IT MATTERS.** AI for routine. People for relationships.

A bilingual (BG / EN), 60–90 second diagnostic for businesses. It shows three things: where automation saves resources, where human attention creates customer value, and how mature their customer experience (CX) is. Built for Metrica's e-commerce conference booth and designed to stay on as a permanent lead-generation tool (target domain: `cx.metrica.bg`).

Stack: Next.js (App Router) · TypeScript · Tailwind CSS · MySQL · self-hosted on Node.js behind Nginx.

## Status

| Phase | Scope | Status |
|---|---|---|
| 1 | Frontend MVP: language, welcome, 7 questions, scoring, Human Value Map, journey, lead form, conference mode | ✅ done |
| 2 | Database storage (API routes; credentials on the server only) | ✅ done — MySQL since the self-hosting migration |
| 3 | Protected admin dashboard (stats, lead table, CSV export) | ✅ done |
| 4 | Production readiness + custom domain prep | ✅ done — self-hosting on the Metrica server, see [DEPLOYMENT.md](DEPLOYMENT.md) |


## Run locally

```bash
npm install
cp .env.example .env.local   # then fill in the MYSQL_* values and ADMIN_PASSWORD
npm run dev                  # http://localhost:3000
```

Without the `MYSQL_*` values, the app still runs in development: submissions are logged to the terminal instead of being stored.

For a local database, run the three scripts in `mysql/` against a local MySQL 8 (see [DEPLOYMENT.md](DEPLOYMENT.md), §2).

**Deploying on the Metrica server (Nginx + Node.js + MySQL), connecting cx.metrica.bg, and the conference checklist: see [DEPLOYMENT.md](DEPLOYMENT.md).**

## Scripts and tests

| Command | What it does |
|---|---|
| `npm run dev` / `npm run build` | development server / production build |
| `npm run typecheck` | TypeScript check |
| `npm run check:locales` | both locale files have the same keys |
| `npm run test:unit` | scoring engine, validation, CSV export, admin password check — no database needed |
| `npm run test:integration` | real API routes against a real MySQL, connected as the restricted app user. Needs `MYSQL_*` set; skipped otherwise. |
| `npm test` | all of the above tests |

GitHub Actions runs all checks and tests on every push, against **MySQL 8.0 and 8.4**, then builds the release package (see [DEPLOYMENT.md](DEPLOYMENT.md)).

### How data flows

```
browser ──POST /api/submissions/complete──▶ Next.js API route ──restricted MySQL user──▶ MySQL
        ──POST /api/submissions/lead─────▶
```

- **One row per completed test** in `diagnostic_sessions`. It is stored as soon as the result is shown, without contact data (for aggregate statistics). If the visitor then submits the lead form, the same row gets the contact fields.
- The browser sends **only answer IDs**. The server validates them and **recomputes the scores itself**, so scores cannot be faked. The row also stores `scoring_version` (`config/scoring.ts`), so results from different weight versions can be told apart.
- **Consent:** the server stores `consent_given`, `consent_at` (server time), `consent_version` and the exact `consent_text` shown in the visitor's language. A database constraint rejects contact data without consent.
- **Security:** the browser never talks to the database. MySQL credentials exist only in the server's environment and are used only in server code (`lib/server/`, guarded by `server-only`). The app's MySQL user can only `SELECT`, `INSERT` and `UPDATE` its one table: no deletes, no schema changes, no other databases. All SQL uses parameters.
- **Spam:** hidden honeypot field, request size limit, strict input validation, plus Nginx rate limits on submissions and admin login.
- If saving the completed test fails, the visitor still sees their result. If saving the lead fails, the form shows an error and the visitor can retry.

## Admin dashboard

Open **`/admin`** (e.g. `https://cx.metrica.bg/admin`) and sign in with `ADMIN_PASSWORD`.

- **Statistics:** completed tests, leads, lead conversion rate, and the average Automation / Human Value / CX Maturity scores. Filter them by period (today, 7 days, 30 days, all time), language and source (conference mode vs online).
- **Lead table:** date, language, name, company, email, phone, website, the three results, biggest opportunity and biggest challenge. Switch between *Leads* and *All tests*. Search by name, company, email, website or phone, and filter by opportunity or challenge.
- **Details:** click a row to see all answers, the result, and the consent record (time, version, exact wording).
- **Export CSV:** exports the rows currently shown, with all answers as stable IDs. The file opens correctly in Excel with Bulgarian text.

Security:
- One shared password, a signed httpOnly cookie valid for 12 hours, and a delay after a wrong password.
- The admin pages are not indexed by search engines, and all data is loaded on the server; the browser never gets database access.
- Signing out clears the cookie in that browser. To sign out everyone, change `ADMIN_PASSWORD`.
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
app/                 Next.js entry (layout, page, global styles)
components/screens/  one component per step of the flow
components/result/   Human Value Map building blocks + lead form
components/ui/       header, buttons, answer cards, progress bar
config/              questions, scoring, journey, opportunity, app settings
locales/             bg.json, en.json
lib/engine/          pure scoring / journey / opportunity / explanation logic
lib/state.tsx        flow state (sessionStorage), language, reset
lib/persistence.ts   browser → API calls
lib/server/          server-only: MySQL pool + queries, validation, row building, admin auth
app/api/submissions/ API routes (complete, lead)
app/admin/           admin login + dashboard (server-protected)
components/admin/    dashboard UI, lead details panel
lib/admin/           CSV export, formatting
mysql/               SQL: database + restricted user, schema, grants
deploy/              systemd unit, Nginx config, env template, install script
tests/               unit + MySQL integration tests (Vitest)
```
