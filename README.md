# Ironwood Command Center

**Know what matters. Know what applies. Know what to do next.**

A client-facing compliance intelligence and advisory platform for Ironwood Business Consulting. It turns Ironwood from a firm clients call when something breaks into a compliance operating system they rely on continuously.

The platform answers one question for every client: *What does my company need to pay attention to right now?* — by filtering regulatory developments, deadlines, expirations and gaps through each client's actual business profile, and by making Ironwood's ongoing work visible.

---

## What's in the box

| Area | What it does |
|---|---|
| **Client Home** | Leads with decisions: action required, upcoming deadlines, new Signals, what Ironwood is handling, readiness snapshot, recent activity. |
| **Ironwood Signal** | Regulatory intelligence. Every development is evaluated against the client's profile and labeled **Applies to you / Watch / No action required / Ironwood handling**, with a "Why am I seeing this?" explanation. |
| **Applicability engine** | Declarative rule sets (`IF state includes TX AND employees ≥ 15 AND HR service active`) over a registry of ~35 profile fields. Rules are data, not code. Re-evaluated on publish and whenever a profile changes. |
| **Program Readiness** | Per-domain completion indicator (HR / DOT / Safety / Contractor) derived from configured requirements, overdue actions, near-term deadlines and lapsed documents. Every point is itemized. Explicitly *not* a legal risk score. |
| **Gaps & Opportunities** | Missing programs, incomplete documentation, overdue training, unaddressed Signals, approaching deadlines — with consultative "Ironwood support is available" routing for non-active service areas. |
| **Action Center** | Actions with client + Ironwood owners, priority, due dates, six statuses, notes, resources, recurrence and originating Signal. |
| **Ironwood Handling** | Dedicated visual treatment for consultant work in progress, with progress and status labels. |
| **Deadlines & Expirations** | 7 / 30 / 90-day timeline across regulatory dates, medical cards, CDLs, insurance, portals, training, audits and reviews. |
| **Library** | Client-specific documents with category, version, owner, review/expiration dates. Metadata + links now; storage path reserved for Supabase Storage. |
| **Ask Ironwood** | Plain-language questions get a structured preliminary triage (potential issues, profile context, recommended next step) and enter the consultant queue. Never legal advice. |
| **Consultant Queue** | Ironwood inbox with urgency, assignment, status, **internal notes (private)** and **client-facing responses (visible)**. |
| **Executive View** | Presentation-ready, printable summary: readiness, high-priority items, deadlines, regulatory changes, Ironwood activity, major gaps, six-month trend. |
| **Ironwood Console** | Portfolio dashboard, client management (create/edit/assign/profile/services), Signal management with live applicability preview, work logging, all-actions view, readiness rules, branding settings. |
| **Notifications** | In-app center for both audiences; `emailed_at` column and dispatcher hook reserved for email. |

## Tech stack

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript** (strict)
- **Tailwind CSS 4** with a custom token system (navy / warm white / ember accent)
- **Zustand** persisted store for demo mode
- **Supabase** (`@supabase/ssr`) — PostgreSQL + Auth + RLS, with a complete schema in `supabase/schema.sql`
- **Recharts** for the readiness trend
- Deployable to **Vercel** with zero configuration

`npm audit` → 0 vulnerabilities at time of writing.

## Quick start (demo mode — no credentials needed)

```bash
npm install
npm run dev
# open http://localhost:3000
```

With no environment variables set, the app runs in **demo mode**: all data lives in the browser's localStorage, seeded with three realistic client organizations. Use the user menu (top right) to switch between Ironwood and client users.

| Demo user | Role | Sees |
|---|---|---|
| Kyle Heslin | Ironwood Admin | Console + any client portal |
| Emily Hartigan · Roxanne Delgado · Lindsey Moreau | Ironwood Consultant | Console + any client portal |
| Dana Whitfield / Tom Reyes | Client Admin / Viewer | Lone Star Fabrication & Supply (TX · 75 employees · HR + Safety) |
| Carla Jensen / Mike Oduya | Client Admin / Viewer | Cimarron Freight Lines (OK · 45 CDL drivers · HR + DOT) |
| Priya Natarajan / Greg Hollis | Client Admin / Viewer | Meridian Industrial Contractors (TX/MO/NV · all four services) |

**Reset demo data** any time from Console → Settings.

### Production build

```bash
npm run build && npm start
```

## The 20-step success scenario

This is the flow the MVP was built around, and it is verified end-to-end by an automated browser test (see `QA.md`):

1. Open the console as Ironwood → 2. open a client → 3. see Texas / 75 employees → 4. create a Signal → 5. configure applicability with the rule builder (live preview shows which clients match and why) → 6. publish → 7. switch to the client → 8. see the Signal under *Applies to you* → 9. read *Why am I seeing this?* → 10. create an action from the Signal → 11. assign it → 12. complete it → 13. watch readiness recalculate → 14. submit an Ask Ironwood question and see the triage → 15. switch to the consultant → 16. find it in the queue → 17. add an internal note and send a response → 18. return to the client → 19. see the response, activity and notification → 20. open the Executive View.

## Project structure

```
src/
  app/
    app/            Client portal (home, signal, actions, deadlines, readiness, gaps,
                    library, ask, activity, executive, services, profile, notifications)
    admin/          Ironwood console (dashboard, clients, signals, queue, actions,
                    work, requirements, settings)
  components/
    ui/             Design-system primitives (pills, cards, drawer, tabs, forms, toast, ring)
    shell/          App shell, navigation, demo user switcher, notification bell
    client/         Portal components (rows, action detail, triage, thread, profile editor)
    admin/          Console components (client table, rule builder, signal editor, work form)
  lib/
    types.ts        The data model (mirrored by supabase/schema.sql)
    engine/
      fields.ts     Field registry — every profile attribute the rule engine can see
      rules.ts      Rule evaluation + human-readable reasons
      readiness.ts  Program readiness calculator (itemized)
      gaps.ts       Gap analysis
      triage.ts     Ask Ironwood preliminary triage
    hooks.ts        useSession / useOrgData (derived data for one org)
    admin-data.ts   Portfolio rollups for the console
    supabase/       Browser + server clients (null when not configured)
  data/
    requirements.ts Configurable readiness requirements
    seed.ts         Demo dataset (dates relative to today)
  store/useStore.ts Demo-mode data layer (Zustand + localStorage)
supabase/schema.sql Full PostgreSQL schema with row-level security
scripts/seed.ts     Seeds a Supabase project with the demo dataset
DEPLOYMENT.md       Options A / B / C
QA.md               QA log for this build
```

## Architecture notes

**Demo mode vs. production.** Components never touch storage directly; they call store actions (`publishSignal`, `submitQuestion`, `updateAction`, …) and read through `useSession()` / `useOrgData()`. Replacing the Zustand store with a Supabase-backed implementation of the same action signatures is contained to `src/store` and `src/lib/hooks.ts`. The schema in `supabase/schema.sql` is a 1:1 mirror of `src/lib/types.ts`.

**Authentication.** Demo mode uses a role switcher (`UserMenu` in `AppShell.tsx`). `useSession()` is the single seam: with Supabase Auth, derive the same `{ user, role, orgId }` shape from the session + `profiles` row and the rest of the app is unchanged. Route guards live in `src/app/app/layout.tsx` and `src/app/admin/layout.tsx`; add `proxy.ts` (Next 16's middleware) for server-side redirects once auth is live.

**Security posture.** Organization-level isolation and role checks are enforced in the database via RLS policies (see schema), not only in the UI. Only the anon key is exposed to the browser; the service-role key is server-only (seed script, future jobs). Security headers are set in `next.config.ts`. See `DEPLOYMENT.md` → Option C before storing real client data.

**Applicability rules.** `FIELD_REGISTRY` in `fields.ts` is the only place that knows how to read a profile attribute. Adding a field there makes it available in the rule builder, the evaluator and the "why" explanation at once. Rules are stored as JSON (`{ match: "ALL" | "ANY", conditions: [{ field, operator, value }] }`) on Signals and Requirements.

**Readiness formula.** `100 − unmet requirements (5 × weight, cap 60) − overdue actions (5 each, cap 20) − open critical/high actions (4/2 each) − applicable Signals without an action (3 each, cap 9) − deadlines inside 30 days (1 each, cap 5) − documents past review (3 each, cap 9)`, clamped 0–100. Constants in `readiness.ts`; the client sees every line.

**White-label.** `Branding` (portal name, logo text/URL, primary color, support contact) is stored once for the platform and optionally per organization (`organizations.branding`). The shell reads it from the store; a partner portal is a branding row + a host-based lookup.

**Future-ready seams** (not built, but the shape is in place): external regulatory feeds → `signals` with `status = DRAFT`; AI summarization / consultant assistant → replace `triageQuestion()` behind the same `Triage` interface; document analysis → `documents.storage_path`; email notifications → `notifications.emailed_at` + a dispatcher; integrations (M365, SharePoint, BambooHR, CRM) → profile and document sync jobs using the service-role key.

## Demo data disclaimer

All regulatory content ships flagged **DEMO DATA — VERIFY BEFORE CLIENT USE** (`signals.is_demo`). Summaries reference real agencies and rules in general terms for realism; nothing here is a legal determination and every item should be verified by an Ironwood consultant before it is shown to a client.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run check` | Typecheck + build |
| `npm run seed:supabase` | Seed a Supabase project (needs service-role key) |
