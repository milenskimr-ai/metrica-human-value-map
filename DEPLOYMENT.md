# Deployment — METRICA HUMAN VALUE MAP

Target: **Vercel** (region `fra1`, Frankfurt) + **Supabase** (EU region) on **cx.metrica.bg**.

---

## 1. Supabase (one time)

1. Create a project at supabase.com. Choose an **EU region** (e.g. *Central EU – Frankfurt*) so data stays in the EU and close to the Vercel region.
2. **SQL Editor** → paste and run `supabase/migrations/0001_diagnostic_sessions.sql`.
3. **Project Settings → API** → note the **Project URL** and the **`service_role` key**.
   - The `service_role` key is a secret with full database access. Put it only into Vercel's environment variables. Never commit it, email it or paste it into chat.
   - The `anon` key is not needed. The browser never talks to Supabase directly.

## 2. Vercel project

1. vercel.com → **Add New… → Project** → import `milenskimr-ai/metrica-human-value-map`.
   Vercel detects Next.js automatically; no build settings need changing.
2. **Settings → Git → Production Branch**: set the branch that should go live (recommended: `main`). Every other branch gets its own *preview* URL.
3. **Settings → Environment Variables**:

| Variable | Production | Preview | Notes |
|---|---|---|---|
| `SUPABASE_URL` | ✅ | ✅ | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ✅ | **Secret.** Consider a separate Supabase project for Preview so test data stays out of real statistics. |
| `ADMIN_PASSWORD` | ✅ | ✅ | Long random value, 16+ characters. |
| `NEXT_PUBLIC_SITE_URL` | `https://cx.metrica.bg` | (leave empty) | Used for link previews and robots.txt. |
| `NEXT_PUBLIC_CONFERENCE_MODE` | `false` | `false` | Leave `false`. Turn conference mode on per tablet instead (see §4). |

   `NEXT_PUBLIC_*` values are baked in at build time, so redeploy after changing them.
4. **Deploy.** Then open `https://<project>.vercel.app/api/health`. It should return `{"ok":true,"database":"ok","admin":"ok"}`.

## 3. Custom domain cx.metrica.bg

**No DNS changes are made by this project.** When you're ready:

1. Vercel → **Settings → Domains** → add `cx.metrica.bg`.
2. Vercel shows the DNS record it needs, normally a **CNAME** for `cx` pointing to a `…vercel-dns…` target. Give **exactly the value Vercel shows** to whoever manages the `metrica.bg` DNS.
3. After DNS propagates, Vercel issues the HTTPS certificate automatically. Check `https://cx.metrica.bg/api/health`.
4. Only `cx.metrica.bg` is affected. `metrica.bg` and its other subdomains stay untouched.

## 4. Conference checklist

**The day before**
- [ ] `https://cx.metrica.bg/api/health` returns `"ok": true`.
- [ ] Do one full test in BG and one in EN, including the lead form. Both appear in `/admin`.
- [ ] Delete those test rows in Supabase (**Table Editor → diagnostic_sessions**) so they don't count in the statistics.
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
- [ ] Change `ADMIN_PASSWORD` in Vercel and redeploy. This signs out every device that was logged in during the event.

## 5. What is already configured

- **Security headers** (`next.config.ts`):
  - a Content-Security-Policy that allows only our own origin
  - no embedding in other sites
  - HSTS, nosniff, a strict referrer policy and a restrictive permissions policy
  - `no-store` caching for `/admin` and `/api`
- **robots.txt:** `/admin` and `/api` are excluded from search engines. The admin pages are also marked `noindex`.
- **Region:** `vercel.json` pins server code to Frankfurt (`fra1`).
- **CI:** GitHub Actions runs the locale check, the type check and the build on every push.
- **Health check:** `/api/health` returns only yes/no flags, never data or secrets.

## 6. Updating later

- **Texts / questions / scoring:** edit the files listed in README → *Where to change things*. Push to a branch, check its preview URL, then merge into the production branch.
- **Scoring changes:** bump `SCORING_VERSION` in `config/scoring.ts` so old and new results can be told apart in the data.
- **Consent wording changes:** bump `consentVersion` in `config/app.ts`.
