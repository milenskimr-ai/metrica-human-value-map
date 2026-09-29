# METRICA HUMAN VALUE MAP

**HUMANS, WHERE IT MATTERS.** AI for routine. People for relationships.

A bilingual (BG / EN), 60–90 second diagnostic for businesses. It shows three things: where automation saves resources, where human attention creates customer value, and how mature their customer experience (CX) is. Built for Metrica's e-commerce conference booth and designed to stay on as a permanent lead-generation tool (target domain: `cx.metrica.bg`).

Stack: Next.js (App Router) · TypeScript · Tailwind CSS · Supabase (Phase 2) · Vercel.

## Status

| Phase | Scope | Status |
|---|---|---|
| 1 | Frontend MVP: language, welcome, 7 questions, scoring, Human Value Map, journey, lead form, conference mode | ✅ done |
| 2 | Supabase storage (API route + service-role key on the server only) | ⏳ |
| 3 | Protected admin dashboard (stats, lead table, CSV export) | ⏳ |
| 4 | Vercel production deployment + custom domain | ⏳ |

In Phase 1, completed tests and leads are saved **in the browser's localStorage** (`mhvm:dev-records`) so the whole flow can be tested. Nothing is sent to a server yet.

## Run locally

```bash
npm install
cp .env.example .env.local   # optional in Phase 1
npm run dev                  # http://localhost:3000
```

Other scripts: `npm run build` · `npm run typecheck` · `npm run check:locales`

## Where to change things (no React knowledge needed)

| What | File |
|---|---|
| Any visible text (questions, answers, result texts, buttons) | `locales/bg.json`, `locales/en.json` |
| Question / answer IDs, single vs multi choice, max selections | `config/questions.ts` |
| **Scoring weights and LOW/MEDIUM/HIGH thresholds** | `config/scoring.ts` |
| Customer journey stage rules (AUTOMATE / AI + HUMAN / HUMAN) | `config/journey.ts` |
| "Biggest opportunity" rules | `config/opportunity.ts` |
| Contact URL, privacy policy URL, consent version | `config/app.ts` |

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
lib/persistence.ts   save completed test / lead (Phase 1: localStorage → Phase 2: Supabase)
```
