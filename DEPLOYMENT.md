# Deployment Walkthrough

Three paths, in order of effort. Option A gets a live demo URL in about ten minutes. Option B turns it into a real multi-tenant MVP on Supabase. Option C is the list of what must be true before real client compliance data is stored.

> Direct deployment from the build environment was not possible (no Vercel or Supabase credentials). Everything below is the minimum you must do yourself.

---

## Option A — Fastest demo (live URL, seeded demo data)

**What you get:** a public URL running demo mode. Data lives in each visitor's browser (localStorage) — nothing is shared between visitors or stored on a server. Safe to show prospects and internal stakeholders.

**You need:** a GitHub account and a Vercel account (free tier is fine).

1. **Put the project in a Git repository.**
   ```bash
   cd ironwood-command-center
   git init
   git add -A
   git commit -m "Ironwood Command Center MVP"
   # create an empty repo on GitHub, then:
   git remote add origin https://github.com/<you>/ironwood-command-center.git
   git push -u origin main
   ```
2. **Import it into Vercel.** Go to vercel.com → *Add New… → Project* → pick the repo. Vercel detects Next.js automatically. Leave every setting at its default. **Do not add any environment variables.** Click **Deploy**.
3. **Open the URL Vercel gives you** (something like `ironwood-command-center.vercel.app`). You land in the console as the Ironwood Admin; use the user menu (top right) to switch roles.
4. Optional: *Settings → Domains* to attach `commandcenter.ironwoodbc.com` or similar.

Every `git push` to `main` redeploys. Preview deployments are created for other branches automatically.

**Demo-safe:** everything in the app. Nothing in Option A should hold real client information.

---

## Option B — Real MVP (Supabase + authentication + deploy)

**What you get:** a shared database with row-level security, real sign-in, and the seeded demo clients as a starting point. This is the path to onboarding actual clients.

### B1. Create the Supabase project (≈5 min)

1. supabase.com → *New project*. Pick a region close to Texas (us-east-1 or us-west-1), set a strong database password, and wait for provisioning.
2. *SQL Editor → New query* → paste the entire contents of `supabase/schema.sql` → **Run**. This creates all tables, enums, helper functions, RLS policies and the `auth.users → profiles` trigger.
3. *Project Settings → API* and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (**never** expose this to the browser; never prefix with `NEXT_PUBLIC_`)

### B2. Seed the demo dataset (≈2 min)

```bash
cp .env.example .env.local
# fill in the three Supabase values
npm run seed:supabase
```

The script creates the ten demo auth users (default password `IronwoodDemo!2026`, override with `SEED_DEMO_PASSWORD`), the three organizations, Signals, actions, work, deadlines, documents, questions, notifications, activity and readiness history. Re-running duplicates rows — reset the project first if you need a clean slate.

### B3. Configure Supabase Auth (≈3 min)

1. *Authentication → Providers*: keep **Email** enabled. Turn **Confirm email** on for production; for a first test you can leave it off.
2. *Authentication → URL Configuration*: set **Site URL** to your Vercel URL and add `https://<your-domain>/**` to **Redirect URLs**.
3. Recommended for client users: enable **Magic Link** (passwordless) — fewer passwords for busy HR and safety managers. Optional: Microsoft (Azure AD) provider later for M365 shops.

### B4. Wire the data layer to Supabase

The UI is already written against a single seam. The work is in two files:

| File | Change |
|---|---|
| `src/lib/hooks.ts` → `useSession()` | Read the Supabase session + the user's `profiles` row and return the same `{ user, isIronwood, isAdmin, canEdit, activeOrg }` shape. Replace the demo `UserMenu` with sign-in / sign-out. |
| `src/store/useStore.ts` | Implement the same action signatures (`publishSignal`, `submitQuestion`, `updateAction`, …) against Supabase tables (`supabase.from('signals').insert(...)`) and hydrate the store from queries instead of `buildSeed()`. Keep the engines (`src/lib/engine/*`) exactly as they are — they are pure functions over the same types. |

Add `src/proxy.ts` (Next 16's middleware) to refresh the session cookie and redirect unauthenticated users to `/login`. The `@supabase/ssr` helpers for this are already installed; `src/lib/supabase/server.ts` is the server client.

Suggested order: sessions first (sign-in works, role guard works), then reads (hydrate from Supabase), then writes (one store action at a time, starting with `submitQuestion` and `publishSignal`). The e2e scenario in `QA.md` is the acceptance test for each step.

### B5. Deploy

1. In Vercel → *Project → Settings → Environment Variables*, add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`. Add `SUPABASE_SERVICE_ROLE_KEY` **only** if a server-side job needs it, and scope it to the Production environment.
2. Push to `main`. Vercel rebuilds; the Settings page will now show **Supabase connected**.
3. Sign in as `kyle@ironwoodbc.com` (or whichever Ironwood Admin you seeded) and change the demo passwords immediately.

---

## Option C — Production hardening (before real client data)

Complete these before any real client's compliance information is stored. None of them are optional for a product in this category.

### Identity & access
- [ ] Replace demo role switcher with Supabase Auth everywhere (B4); delete the demo users.
- [ ] Enforce **email confirmation** and a password policy; enable **MFA** for all Ironwood roles.
- [ ] Add `proxy.ts` server-side route protection so `/admin` is unreachable without an Ironwood role (today the guard is client-side only).
- [ ] Invitation flow: Ironwood Admin invites client users to an organization (sets `profiles.org_id` and role). Never let users self-select an org.
- [ ] Session timeout and sign-out on all devices.

### Data isolation & RLS
- [ ] Review every policy in `supabase/schema.sql` with real test users: a Client Admin from Org A must get **zero rows** from Org B on every table. Write these as automated tests (`supabase test` or a script using two anon sessions).
- [ ] Tighten `action_resources` and any join-only tables to org scope.
- [ ] Decide whether consultants see *all* clients or only *assigned* ones; if the latter, change `is_ironwood()` policies to check `org_consultants`.
- [ ] Audit log table (who changed what, when) — the `activity` table is client-facing; add an immutable internal audit trail.

### Secrets & infrastructure
- [ ] Service-role key lives only in server environments; rotate it after seeding.
- [ ] Turn on Supabase **daily backups** and **point-in-time recovery** (Pro plan).
- [ ] Set a **Content-Security-Policy** header in `next.config.ts` (the other security headers are already set).
- [ ] Vercel: enable **Deployment Protection** for preview URLs; restrict production to a custom domain.
- [ ] Rate-limit `Ask Ironwood` submissions and auth endpoints.

### Files & documents
- [ ] Enable Supabase Storage with a private bucket; store objects at `documents.storage_path`; serve via **signed URLs** only. Never make the bucket public.
- [ ] Virus scanning on upload (Supabase + ClamAV edge function, or a third-party scanner).
- [ ] Retention policy for client documents on offboarding.

### Content & liability
- [ ] Verify every seeded Signal and turn `is_demo` off only after consultant review; make verification a required step in the Signal editor (a "verified by" field).
- [ ] Legal review of Ask Ironwood copy — the triage is explicitly a preliminary read, not advice. Keep the "Not legal advice" labeling.
- [ ] Terms of use and privacy policy; client agreement language covering the platform.

### Operations
- [ ] Email notifications: a dispatcher (Supabase cron / edge function or a Vercel cron route) that sends unsent `notifications` rows via Resend and stamps `emailed_at`. Per-user digest preferences.
- [ ] Error monitoring (Sentry) and uptime monitoring.
- [ ] Staging project separate from production; seed script only ever points at staging.
- [ ] Define an incident response contact and a data-breach notification procedure.

### Not claimed
This MVP has **not** been assessed against SOC 2, ISO 27001, HIPAA or any other certification. Do not represent it as compliant with any security standard until an assessment has been performed.

---

## Demo-safe vs. production-ready

| Feature | Demo-safe (show it today) | Production-ready (needs Option B/C) |
|---|---|---|
| Client Home, Signal, Readiness, Gaps, Deadlines, Executive View | ✅ | After B4 (data from Supabase) |
| Applicability engine, rule builder, publish → evaluate | ✅ | ✅ engine is final; storage after B4 |
| Ask Ironwood triage + consultant queue | ✅ | After B4 + rate limiting |
| Action Center, Ironwood Handling, Activity, Notifications | ✅ | After B4; email after C-Operations |
| Role switching | ✅ demo only | Replace with Supabase Auth (B3/B4) |
| Document library | ✅ metadata + links | Storage bucket + signed URLs (C-Files) |
| Client management, profile editing | ✅ | After B4 with RLS tests (C-RLS) |
| White-label branding | ✅ settings form | Per-partner host lookup (small) |
| Storing real client compliance data | ❌ | Only after **all** of Option C |
